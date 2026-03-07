"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const modbus_serial_1 = __importDefault(require("modbus-serial"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const plcRegisters_1 = require("./config/plcRegisters");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PLC_IP = process.env.PLC_IP;
const PLC_PORT = Number(process.env.PLC_PORT);
const BACKEND_URL = process.env.BACKEND_URL;
const client = new modbus_serial_1.default();
/* Helper to check if a D register is a float recipe register (needs +1 offset) */
function isFloatRecipeRegister(regNum) {
    // Machine1 float recipe registers: D2008-2010 (temp/pressure), D2050-2056 (bands), D2020-2038 (high/low)
    // Machine2 float recipe registers: D2108-2110, D2150-2156, D2120-2138
    const machine1FloatRanges = [
        { min: 2008, max: 2010 }, // temperature and pressure
        { min: 2020, max: 2038 }, // high/low pairs
        { min: 2050, max: 2056 }, // temperature and pressure bands
    ];
    const machine2FloatRanges = [
        { min: 2108, max: 2110 },
        { min: 2120, max: 2138 },
        { min: 2150, max: 2156 },
    ];
    const allFloatRanges = [...machine1FloatRanges, ...machine2FloatRanges];
    return allFloatRanges.some((range) => regNum >= range.min && regNum <= range.max);
}
/* Helper to parse register strings and convert to Modbus addresses */
function parseRegister(regStr) {
    const match = regStr.match(/^([A-Z])(\d+)$/);
    if (!match)
        throw new Error(`Invalid register format: ${regStr}`);
    const type = match[1];
    const num = parseInt(match[2], 10);
    if (type === "D") {
        // Add +1 offset for float recipe registers (needed for Modbus addressing)
        return isFloatRecipeRegister(num) ? num + 1 : num;
    }
    else if (type === "X") {
        return num; // X bits (input bits)
    }
    else if (type === "M") {
        return num; // M bits (internal relays/coils) map to raw coil number
    }
    else if (type === "C") {
        return 4544 + num; // C counters offset
    }
    throw new Error(`Unknown register type: ${type}`);
}
/* PLC MONITOR STATE */
let plcConnected = false;
let lastRead = {
    machine1: null,
    machine2: null,
};
let lastWrite = {
    machine1: null,
    machine2: null,
};
let cycleActive = {
    machine1: false,
    machine2: false,
};
let currentCycleNumber = {
    machine1: 0,
    machine2: 0,
};
/* -------------------------------
   CONNECT TO PLC
-------------------------------- */
async function connectPLC() {
    try {
        await client.connectTCP(PLC_IP, { port: PLC_PORT });
        client.setID(1);
        plcConnected = true;
        // PLC connected successfully
        // Quick verification of basic addressing (16-bit value)
        try {
            const d0Addr = parseRegister("D0");
            const d0res = await client.readHoldingRegisters(d0Addr, 1);
        }
        catch (err) {
            // D0 read error - this is a verification step, non-critical
        }
    }
    catch (err) {
        plcConnected = false;
        console.error("PLC connection failed:", err.message || err);
        setTimeout(connectPLC, 2000);
    }
}
/* -------------------------------
   READ FROM PLC
-------------------------------- */
async function pollMachine(machineId) {
    try {
        const registers = (0, plcRegisters_1.getRegisters)(machineId);
        // Helper to read float from two registers
        const readFloat = async (addr) => {
            const numAddr = parseRegister(addr);
            const data = await client.readHoldingRegisters(numAddr, 2);
            const buf = Buffer.alloc(4);
            buf.writeUInt16BE(data.data[1], 0);
            buf.writeUInt16BE(data.data[0], 2);
            return buf.readFloatBE(0);
        };
        // Helper to read integer from register
        const readInt = async (addr) => {
            const numAddr = parseRegister(addr);
            const data = await client.readHoldingRegisters(numAddr, 1);
            return data.data[0];
        };
        // ---- CHECK CYCLE START BIT (M100) ----
        const cycleStartBitAddr = parseRegister(registers.cycleStartBit);
        const cycleStartStatus = await client.readCoils(cycleStartBitAddr, 1);
        const rawVal = cycleStartStatus.data[0];
        const m100Status = Boolean(rawVal);
        // ---- READ CYCLE NUMBER (D468) IF PROVIDED ----
        let plcCycleNumber = 0;
        if (registers.cycleNumber) {
            try {
                plcCycleNumber = await readInt(registers.cycleNumber);
            }
            catch (err) {
                console.warn(`[${machineId}] Failed to read cycleNumber ${registers.cycleNumber}:`, err instanceof Error ? err.message : String(err));
                plcCycleNumber = currentCycleNumber[machineId] || 0;
            }
        }
        // ---- READ ALL VALUES FROM PLC ----
        // only read registers we need for cycle reporting
        // Temperatures and pressures are stored as 32-bit floats across two
        // consecutive D registers; use readFloat to combine them.
        // Curing time / exhaust delay remain integer seconds.
        const setTemperature = await readFloat(registers.setTemperature);
        const setPressure = await readFloat(registers.setPressure);
        const setCuringTime = await readInt(registers.setCuringTime);
        const setExhaustDelay = await readInt(registers.setExhaustDelay);
        const actualTemperature = await readFloat(registers.actualTemperature);
        const actualPressure = await readFloat(registers.actualPressure);
        const actualCuringTime = await readInt(registers.actualCuringTimeSeconds);
        const actualExhaustDelay = await readInt(registers.actualExhaustDelaySeconds);
        // Update cycle state based on M100 and PLC-provided cycle number
        if (m100Status && !cycleActive[machineId]) {
            cycleActive[machineId] = true;
            // Use PLC-provided cycle number if available, else keep previous
            currentCycleNumber[machineId] =
                plcCycleNumber || currentCycleNumber[machineId] || 0;
        }
        else if (!m100Status && cycleActive[machineId]) {
            cycleActive[machineId] = false;
        }
        const reading = {
            machineId,
            temperature: actualTemperature,
            pressure: actualPressure,
            cycleNumber: plcCycleNumber || currentCycleNumber[machineId],
            m100Status,
            setTemperature,
            setPressure,
            setCuringTime,
            setExhaustDelay,
            actualTemperature,
            actualPressure,
            actualCuringTime,
            actualExhaustDelay,
            timestamp: new Date().toISOString(),
        };
        // Always send data to backend (test mode)
        lastRead[machineId] = reading;
        // Send to backend with machine ID as query parameter
        // When cycle is active (M100 high), request the backend to store readings every second
        const storeQuery = cycleActive[machineId] ? "&store=true" : "";
        await axios_1.default.post(`${BACKEND_URL}?machine=${machineId}${storeQuery}`, reading);
    }
    catch (err) {
        plcConnected = false;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[${machineId}] PLC read error:`, errorMessage);
    }
}
async function pollPLC() {
    if (!plcConnected) {
        return;
    }
    await Promise.all([pollMachine("machine1"), pollMachine("machine2")]);
}
/* -------------------------------
   HELPERS
-------------------------------- */
function toFloatRegs(val) {
    const buf = Buffer.alloc(4);
    buf.writeFloatBE(val);
    return [buf.readUInt16BE(0), buf.readUInt16BE(2)];
}
function toIntReg(val) {
    return val & 0xffff;
}
/* -------------------------------
   WRITE TO PLC (SCHEDULED RECIPE REGISTERS)
   these are the D20xx/21xx fields described by the user
   and only need to be written once when a recipe becomes active
-------------------------------- */
app.post("/api/plc/sendRecipe", async (req, res) => {
    const { machineId, ...recipe } = req.body;
    if (!machineId || !["machine1", "machine2"].includes(machineId)) {
        return res.status(400).json({ error: "Invalid or missing machineId" });
    }
    // Check PLC connection first
    if (!plcConnected) {
        return res.status(503).json({ error: "PLC not connected" });
    }
    const registers = (0, plcRegisters_1.getRegisters)(machineId);
    try {
        // always write them in parallel; target registers may be floats or ints
        const ops = [];
        // temperature and bands are floats
        ops.push(client.writeRegisters(parseRegister(registers.recipeTemperature), toFloatRegs(recipe.curingTemp)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeTempPlus), toFloatRegs(recipe.tempBandPlus)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeTempMinus), toFloatRegs(recipe.tempBandMinus)));
        // pressure and bands
        ops.push(client.writeRegisters(parseRegister(registers.recipePressure), toFloatRegs(recipe.pressure)));
        ops.push(client.writeRegisters(parseRegister(registers.recipePressurePlus), toFloatRegs(recipe.pressureBandPlus)));
        ops.push(client.writeRegisters(parseRegister(registers.recipePressureMinus), toFloatRegs(recipe.pressureBandMinus)));
        // integer values
        ops.push(client.writeRegister(parseRegister(registers.recipeCuringTime), toIntReg(recipe.curingTime)));
        ops.push(client.writeRegister(parseRegister(registers.recipeExhaustDelay), toIntReg(recipe.exhaustDelay)));
        ops.push(client.writeRegister(parseRegister(registers.recipePurgingCycles), toIntReg(recipe.purgingCycles)));
        // high/low pairs (all floats)
        ops.push(client.writeRegisters(parseRegister(registers.recipeHigh1), toFloatRegs(recipe.high1)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeLow1), toFloatRegs(recipe.low1)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeHigh2), toFloatRegs(recipe.high2)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeLow2), toFloatRegs(recipe.low2)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeHigh3), toFloatRegs(recipe.high3)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeLow3), toFloatRegs(recipe.low3)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeHigh4), toFloatRegs(recipe.high4)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeLow4), toFloatRegs(recipe.low4)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeHigh5), toFloatRegs(recipe.high5)));
        ops.push(client.writeRegisters(parseRegister(registers.recipeLow5), toFloatRegs(recipe.low5)));
        await Promise.all(ops);
        // record the write as well
        lastWrite[machineId] = {
            machineId: machineId,
            recipe: recipe.name,
            data: recipe,
            timestamp: new Date().toISOString(),
        };
        res.json({ status: "ok" });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[${machineId}] PLC Recipe Write Error:`, errorMsg);
        res.status(500).json({ error: errorMsg });
    }
});
/* -------------------------------
   PLC MONITOR API
-------------------------------- */
app.get("/status", (req, res) => {
    res.json({
        connected: plcConnected,
        machine1: {
            lastRead: lastRead.machine1,
            lastWrite: lastWrite.machine1,
            cycleActive: cycleActive.machine1,
        },
        machine2: {
            lastRead: lastRead.machine2,
            lastWrite: lastWrite.machine2,
            cycleActive: cycleActive.machine2,
        },
    });
});
/* -------------------------------
   START SERVER
-------------------------------- */
app.listen(3001);
(async () => {
    await connectPLC();
    setInterval(pollPLC, 1000);
})();

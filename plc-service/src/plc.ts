import ModbusRTU from "modbus-serial";
import axios from "axios";
import express from "express";
import cors from "cors";
import { getRegisters, MachineId } from "./config/plcRegisters";
import {
  PLC_IP,
  PLC_PORT,
  BACKEND_URL,
  PLC_POLL_INTERVAL,
  PLC_RECONNECT_DELAY,
} from "./config/env";
import { parseRegister, toFloatRegs, toIntReg } from "./utils/registerHelpers";
const app = express();
app.use(cors());
app.use(express.json());

const client = new ModbusRTU();

/* Type Definitions */
interface PLC_Reading {
  machineId: MachineId;
  // for backward compatibility we still send live values (duplicates of actual)
  temperature?: number;
  pressure?: number;
  cycleNumber: number;
  m100Status: boolean;
  setTemperature: number;
  setPressure: number;
  setCuringTime: number;
  setExhaustDelay: number;
  actualTemperature: number;
  actualPressure: number;
  actualCuringTime: number;
  actualExhaustDelay: number;
  timestamp: string;
}

interface RecipeData {
  name: string;
  curingTemp: number;
  tempBandPlus: number;
  tempBandMinus: number;
  pressure: number;
  pressureBandPlus: number;
  pressureBandMinus: number;
  curingTime: number;
  exhaustDelay: number;
  purgingCycles: number;
  high1: number;
  low1: number;
  high2: number;
  low2: number;
  high3: number;
  low3: number;
  high4: number;
  low4: number;
  high5: number;
  low5: number;
}

interface WriteRecord {
  machineId: MachineId;
  recipe: string;
  data: RecipeData;
  timestamp: string;
}

/* PLC MONITOR STATE */
let plcConnected = false;
let lastRead: Record<MachineId, PLC_Reading | null> = {
  machine1: null,
  machine2: null,
};
let lastWrite: Record<MachineId, WriteRecord | null> = {
  machine1: null,
  machine2: null,
};
let cycleActive: Record<MachineId, boolean> = {
  machine1: false,
  machine2: false,
};
let currentCycleNumber: Record<MachineId, number> = {
  machine1: 0,
  machine2: 0,
};

/* -------------------------------
   CONNECT TO PLC
-------------------------------- */
async function connectPLC() {
  try {
    if (client.isOpen) {
      client.close();
    }

    await client.connectTCP(PLC_IP, { port: PLC_PORT });

    client.setID(1);
    client.setTimeout(5000);

    plcConnected = true;

    console.log("PLC connected:", PLC_IP);
  } catch (err) {
    plcConnected = false;
    console.error("PLC connection failed:", (err as Error).message || err);
    setTimeout(connectPLC, PLC_RECONNECT_DELAY);
  }
}

/* -------------------------------
   READ FROM PLC
-------------------------------- */
async function pollMachine(machineId: MachineId) {
  try {
    const registers = getRegisters(machineId);

    // Helper to read float from two registers
    const readFloat = async (addr: string): Promise<number> => {
      const numAddr = parseRegister(addr);
      const data = await client.readHoldingRegisters(numAddr, 2);
      const buf = Buffer.alloc(4);
      buf.writeUInt16BE(data.data[1], 0);
      buf.writeUInt16BE(data.data[0], 2);
      return buf.readFloatBE(0);
    };

    // Helper to read integer from register
    const readInt = async (addr: string): Promise<number> => {
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
      } catch (err) {
        console.warn(
          `[${machineId}] Failed to read cycleNumber ${registers.cycleNumber}:`,
          err instanceof Error ? err.message : String(err),
        );
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
    const actualExhaustDelay = await readInt(
      registers.actualExhaustDelaySeconds,
    );

    // Update cycle state based on M100 and PLC-provided cycle number
    if (m100Status && !cycleActive[machineId]) {
      cycleActive[machineId] = true;
      // Use PLC-provided cycle number if available, else keep previous
      currentCycleNumber[machineId] =
        plcCycleNumber || currentCycleNumber[machineId] || 0;
    } else if (!m100Status && cycleActive[machineId]) {
      cycleActive[machineId] = false;
    }

    const reading: PLC_Reading = {
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
    await axios.post(
      `${BACKEND_URL}/api/recipes/data?machine=${machineId}${storeQuery}`,
      reading,
    );
  } catch (err: unknown) {
    plcConnected = false;

    try {
      client.close();
    } catch {}

    setTimeout(connectPLC, PLC_RECONNECT_DELAY);
    console.error(`[${machineId}] PLC read error:`, err);
    // console.error(`[${machineId}] PLC read error:`, errorMessage);
  }
}

async function pollPLC() {
  if (!plcConnected || !client.isOpen) {
    return;
  }

  await pollMachine("machine1");
  await pollMachine("machine2");
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

  const registers = getRegisters(machineId as MachineId);

  try {
    // always write them in parallel; target registers may be floats or ints
    const ops: Promise<any>[] = [];

    // temperature and bands are floats
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeTemperature),
        toFloatRegs(recipe.curingTemp),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeTempPlus),
        toFloatRegs(recipe.tempBandPlus),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeTempMinus),
        toFloatRegs(recipe.tempBandMinus),
      ),
    );

    // pressure and bands
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipePressure),
        toFloatRegs(recipe.pressure),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipePressurePlus),
        toFloatRegs(recipe.pressureBandPlus),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipePressureMinus),
        toFloatRegs(recipe.pressureBandMinus),
      ),
    );

    // integer values
    ops.push(
      client.writeRegister(
        parseRegister(registers.recipeCuringTime),
        toIntReg(recipe.curingTime),
      ),
    );
    ops.push(
      client.writeRegister(
        parseRegister(registers.recipeExhaustDelay),
        toIntReg(recipe.exhaustDelay),
      ),
    );
    ops.push(
      client.writeRegister(
        parseRegister(registers.recipePurgingCycles),
        toIntReg(recipe.purgingCycles),
      ),
    );

    // high/low pairs (all floats)
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeHigh1),
        toFloatRegs(recipe.high1),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeLow1),
        toFloatRegs(recipe.low1),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeHigh2),
        toFloatRegs(recipe.high2),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeLow2),
        toFloatRegs(recipe.low2),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeHigh3),
        toFloatRegs(recipe.high3),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeLow3),
        toFloatRegs(recipe.low3),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeHigh4),
        toFloatRegs(recipe.high4),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeLow4),
        toFloatRegs(recipe.low4),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeHigh5),
        toFloatRegs(recipe.high5),
      ),
    );
    ops.push(
      client.writeRegisters(
        parseRegister(registers.recipeLow5),
        toFloatRegs(recipe.low5),
      ),
    );

    await Promise.all(ops);

    // record the write as well
    lastWrite[machineId as MachineId] = {
      machineId: machineId as MachineId,
      recipe: recipe.name,
      data: recipe,
      timestamp: new Date().toISOString(),
    };

    res.json({ status: "ok" });
  } catch (err: unknown) {
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
  setInterval(pollPLC, PLC_POLL_INTERVAL);
})();

const ModbusRTU = require("modbus-serial");

const client = new ModbusRTU();

const PLC_IP = "192.168.1.5";
const PLC_PORT = 502;

async function test() {
  try {
    await client.connectTCP(PLC_IP, { port: PLC_PORT });
    client.setID(1);

    console.log("✅ Connected");

      const tests = [
  { name: "D0", addr: 4096 },
  { name: "D54", addr: 4096 + 54 },
  { name: "D468", addr: 4096 + 468 },
];
    

    for (let t of tests) {
      try {
        console.log(`\n🔍 Testing ${t.name}`);

        // FC3 - Holding Registers
        let res = await client.readHoldingRegisters(t.addr, 2);
        console.log("FC3 (Holding):", res.data);

      } catch (err) {
        console.log("❌ FC3 failed:", err.message);
      }

      try {
        // FC4 - Input Registers
        let res = await client.readInputRegisters(t.addr, 2);
        console.log("FC4 (Input):", res.data);

      } catch (err) {
        console.log("❌ FC4 failed:", err.message);
      }

      try {
        // Coils (for M registers test)
        let res = await client.readCoils(t.addr, 1);
        console.log("Coils:", res.data);

      } catch (err) {
        console.log("❌ Coils failed:", err.message);
      }
    }

  } catch (err) {
    console.error("Connection failed:", err);
  }
}

test();
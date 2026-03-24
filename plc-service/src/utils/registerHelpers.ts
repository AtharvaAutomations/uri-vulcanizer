import { PlcRegisters } from "../config/plcRegisters";

/**
 * Determine whether a D-register maps to a floating-point recipe value
 * (these registers occupy two words and require a +1 offset for modbus serial).
 */
export function isFloatRecipeRegister(regNum: number): boolean {
  const machine1Ranges = [
    { min: 2008, max: 2010 },
    { min: 2020, max: 2038 },
    { min: 2050, max: 2056 },
  ];
  const machine2Ranges = [
    { min: 2108, max: 2110 },
    { min: 2120, max: 2138 },
    { min: 2150, max: 2156 },
  ];

  return [...machine1Ranges, ...machine2Ranges].some(
    (r) => regNum >= r.min && regNum <= r.max,
  );
}

/**
 * Convert a textual register identifier ("D123", "M100" etc) into the
 * numeric address used by the modbus-serial client.
 */
export function parseRegister(regStr: string): number {
  const match = regStr.match(/^([A-Z])(\d+)$/);
  if (!match) {
    throw new Error(`Invalid register format: ${regStr}`);
  }

  const [_, type, numStr] = match;
  const num = parseInt(numStr, 10);

  switch (type) {
    case "D": {
      // 🔥 ES2 Modbus offset
      const baseAddr = 4096 + num;

      // For float registers (2 words), sometimes offset shifts
      return isFloatRecipeRegister(num) ? baseAddr + 1 : baseAddr;
    }

    case "M":
    case "X":
      return num; // coils (no offset)

    case "C":
      return 4544 + num; // keep as-is (only if working)

    default:
      throw new Error(`Unknown register type: ${type}`);
  }
}

/**
 * Helpers to convert native JS numbers into one or two 16-bit registers
 * for writing to PLC.
 */
export function toFloatRegs(val: number): [number, number] {
  const buf = Buffer.alloc(4);
  buf.writeFloatBE(val);
  return [buf.readUInt16BE(0), buf.readUInt16BE(2)];
}

export function toIntReg(val: number): number {
  return val & 0xffff;
}

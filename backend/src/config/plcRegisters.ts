// re-export the registers definitions from appConfig so there is a
// single source of truth.
import {
  PlcRegisters,
  MachineId,
  PLC_REGISTERS,
  getPlcRegisters,
} from "./appConfig"; // note: same directory since file moved

export { PlcRegisters, MachineId, PLC_REGISTERS };

// legacy helper for consumers that still call it
export const getRegisters = getPlcRegisters;

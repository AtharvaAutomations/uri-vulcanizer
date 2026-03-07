/**
 * PLC Register Configuration for PLC Service
 *
 * This module exports PLC register mappings for the plc-service
 * Addresses centralized - keep synchronized with backend config/appConfig.ts
 *
 * Register Types:
 * - D registers: 16-bit data (32-bit floats span 2 registers)
 * - M registers: Internal relays/control bits
 */

// Re-exports from local appConfig.ts
// NOTE: Keep in sync with ../../backend/src/config/appConfig.ts

import {
  PlcRegisters,
  MachineId,
  PLC_REGISTERS,
  getPlcRegisters,
} from "./appConfig";

export { PlcRegisters, MachineId, PLC_REGISTERS };
export const getRegisters = getPlcRegisters;

/**
 * Validate if a machine ID is valid
 */
export const isValidMachine = (machineId: string): machineId is MachineId => {
  return machineId === "machine1" || machineId === "machine2";
};

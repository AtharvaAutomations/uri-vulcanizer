/**
 * Shared Application Configuration for PLC Service
 *
 * This mirrors the backend's appConfig.ts to ensure consistency.
 * Both services must be kept in sync.
 *
 * Exports:
 * - MachineId type
 * - PlcRegisters interface
 * - PLC_REGISTERS mappings
 * - Helper functions
 */

export type MachineId = "machine1" | "machine2";

/**
 * PLC Register Mappings
 * Maps register addresses for each machine's connection to the PLC
 * Each register represents a memory location in the PLC
 */
export interface PlcRegisters {
  // Input registers (readings from machine)
  temperature: string;
  pressure: string;
  cycleNumber?: string;

  // Set values (target/desired values)
  setTemperature: string;
  setPressure: string;
  setCuringTime: string;
  setExhaustDelay: string;

  // Actual values (current state in machine)
  actualTemperature: string;
  actualPressure: string;
  actualCuringTimeSeconds: string;
  actualCuringTimeMinutes: string;
  actualExhaustDelaySeconds: string;
  actualExhaustDelayMinutes: string;

  // Control/Status registers
  cycleStartBit: string;

  // Recipe registers (for scheduled data write)
  recipeTemperature: string;
  recipeTempPlus: string;
  recipeTempMinus: string;
  recipePressure: string;
  recipePressurePlus: string;
  recipePressureMinus: string;
  recipeCuringTime: string;
  recipeExhaustDelay: string;
  recipePurgingCycles: string;
  recipeHigh1: string;
  recipeLow1: string;
  recipeHigh2: string;
  recipeLow2: string;
  recipeHigh3: string;
  recipeLow3: string;
  recipeHigh4: string;
  recipeLow4: string;
  recipeHigh5: string;
  recipeLow5: string;
}

export const PLC_REGISTERS: Record<MachineId, PlcRegisters> = {
  machine1: {
    // Input readings
    temperature: "D54",
    pressure: "D3010",
    cycleNumber: "D468",

    // Set values
    setTemperature: "D408",
    setPressure: "D410",
    setCuringTime: "D414",
    setExhaustDelay: "D416",

    // Actual values
    actualTemperature: "D54",
    actualPressure: "D3010",
    actualCuringTimeSeconds: "D250",
    actualCuringTimeMinutes: "D252",
    actualExhaustDelaySeconds: "D254",
    actualExhaustDelayMinutes: "D256",

    // Control
    cycleStartBit: "M100",

    // Recipe registers
    recipeTemperature: "D2008",
    recipeTempPlus: "D2050",
    recipeTempMinus: "D2052",
    recipePressure: "D2010",
    recipePressurePlus: "D2054",
    recipePressureMinus: "D2056",
    recipeCuringTime: "D2014",
    recipeExhaustDelay: "D2016",
    recipePurgingCycles: "D2012",
    recipeHigh1: "D2020",
    recipeLow1: "D2022",
    recipeHigh2: "D2024",
    recipeLow2: "D2026",
    recipeHigh3: "D2028",
    recipeLow3: "D2030",
    recipeHigh4: "D2032",
    recipeLow4: "D2034",
    recipeHigh5: "D2036",
    recipeLow5: "D2038",
  },
  machine2: {
    // Input readings
    temperature: "D610",
    pressure: "D154",
    cycleNumber: "D568",

    // Set values
    setTemperature: "D508",
    setPressure: "D510",
    setCuringTime: "D514",
    setExhaustDelay: "D516",

    // Actual values
    actualTemperature: "D610",
    actualPressure: "D154",
    actualCuringTimeSeconds: "D350",
    actualCuringTimeMinutes: "D352",
    actualExhaustDelaySeconds: "D354",
    actualExhaustDelayMinutes: "D356",

    // Control
    cycleStartBit: "M200",

    // Recipe registers
    recipeTemperature: "D2108",
    recipeTempPlus: "D2150",
    recipeTempMinus: "D2152",
    recipePressure: "D2110",
    recipePressurePlus: "D2154",
    recipePressureMinus: "D2156",
    recipeCuringTime: "D2114",
    recipeExhaustDelay: "D2116",
    recipePurgingCycles: "D2112",
    recipeHigh1: "D2120",
    recipeLow1: "D2122",
    recipeHigh2: "D2124",
    recipeLow2: "D2126",
    recipeHigh3: "D2128",
    recipeLow3: "D2130",
    recipeHigh4: "D2132",
    recipeLow4: "D2134",
    recipeHigh5: "D2136",
    recipeLow5: "D2138",
  },
};

/**
 * Helper function to validate machine IDs
 */
export const isValidMachine = (machineId: string): machineId is MachineId => {
  return machineId === "machine1" || machineId === "machine2";
};

/**
 * Helper function to get PLC registers for a machine
 */
export const getPlcRegisters = (machineId: MachineId): PlcRegisters => {
  return PLC_REGISTERS[machineId];
};

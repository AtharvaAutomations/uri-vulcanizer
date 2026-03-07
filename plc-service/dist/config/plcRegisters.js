"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMachine = exports.getRegisters = exports.PLC_REGISTERS = void 0;
/**
 * PLC Register Addresses for Each Machine
 * Keep synchronized with backend config/appConfig.ts
 */
exports.PLC_REGISTERS = {
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
        actualCuringTimeSeconds: "D260",
        actualCuringTimeMinutes: "D262",
        actualExhaustDelaySeconds: "D264",
        actualExhaustDelayMinutes: "D266",
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
 * Get PLC registers for a specific machine
 */
const getRegisters = (machineId) => {
    return exports.PLC_REGISTERS[machineId];
};
exports.getRegisters = getRegisters;
/**
 * Validate if a machine ID is valid
 */
const isValidMachine = (machineId) => {
    return machineId === "machine1" || machineId === "machine2";
};
exports.isValidMachine = isValidMachine;

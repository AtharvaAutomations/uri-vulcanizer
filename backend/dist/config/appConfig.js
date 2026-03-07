"use strict";
/**
 * Centralized Application Configuration
 *
 * This file serves as the single source of truth for all application settings,
 * eliminating duplication and making configuration changes easier.
 *
 * Exports:
 * - MACHINES: Machine configuration with IDs and names
 * - PLC_REGISTERS: PLC register mappings for each machine
 * - ENVIRONMENT: Service URLs and environment settings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlcRegisters = exports.getMachineName = exports.isValidMachine = exports.ENVIRONMENT = exports.PLC_REGISTERS = exports.MACHINES = void 0;
/**
 * Machine Definitions
 * Add or modify machines here
 */
exports.MACHINES = {
    machine1: {
        id: "machine1",
        name: "Machine 1",
    },
    machine2: {
        id: "machine2",
        name: "Machine 2",
    },
};
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
 * Environment and Service Configuration
 * All service URLs and environment-dependent settings
 */
exports.ENVIRONMENT = {
    // PLC Service
    PLC_SERVICE_URL: process.env.PLC_SERVICE_URL || "http://localhost:3001",
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    // PLC Connection (for plc-service)
    PLC_IP: process.env.PLC_IP,
    PLC_PORT: process.env.PLC_PORT,
    // Scheduler
    SCHEDULER_CHECK_INTERVAL: 5000, // milliseconds
    PLC_POLL_INTERVAL: 1000, // milliseconds
};
/**
 * Helper function to validate machine IDs
 */
const isValidMachine = (machineId) => {
    return machineId === "machine1" || machineId === "machine2";
};
exports.isValidMachine = isValidMachine;
/**
 * Helper function to get machine name
 */
const getMachineName = (machineId) => {
    return exports.MACHINES[machineId].name;
};
exports.getMachineName = getMachineName;
/**
 * Helper function to get PLC registers for a machine
 */
const getPlcRegisters = (machineId) => {
    return exports.PLC_REGISTERS[machineId];
};
exports.getPlcRegisters = getPlcRegisters;

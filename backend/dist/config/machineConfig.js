"use strict";
/**
 * Machine Configuration Module
 *
 * DEPRECATED: This file is being replaced by appConfig.ts
 * Use config/appConfig.ts instead for centralized, unified configuration
 *
 * This file contained duplicate register mappings that are now in appConfig.ts
 *
 * TODO: Update imports throughout backend to use appConfig instead of this file
 *
 * @deprecated See config/appConfig.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMachine = exports.MACHINES = void 0;
/**
 * LEGACY - Use appConfig.ts instead
 */
exports.MACHINES = {
    machine1: {
        id: "machine1",
        name: "Machine 1",
        plcServiceUrl: "http://localhost:3001",
        registers: {
            temperature: 2000,
            pressure: 2010,
            curingTemp: 2008,
            tempBandPlus: 2050,
            tempBandMinus: 2052,
            pressureBandPlus: 2054,
            pressureBandMinus: 2056,
            curingTime: 2014,
            exhaustDelay: 2016,
            purgingCycles: 2012,
            high1: 2020,
            low1: 2022,
            high2: 2024,
            low2: 2026,
            high3: 2028,
            low3: 2030,
            high4: 2032,
            low4: 2034,
            high5: 2036,
            low5: 2038,
        },
    },
    machine2: {
        id: "machine2",
        name: "Machine 2",
        plcServiceUrl: "http://localhost:3002",
        registers: {
            temperature: 3000,
            pressure: 3010,
            curingTemp: 3008,
            tempBandPlus: 3050,
            tempBandMinus: 3052,
            pressureBandPlus: 3054,
            pressureBandMinus: 3056,
            curingTime: 3014,
            exhaustDelay: 3016,
            purgingCycles: 3012,
            high1: 3020,
            low1: 3022,
            high2: 3024,
            low2: 3026,
            high3: 3028,
            low3: 3030,
            high4: 3032,
            low4: 3034,
            high5: 3036,
            low5: 3038,
        },
    },
};
const isValidMachine = (machineId) => {
    return machineId === "machine1" || machineId === "machine2";
};
exports.isValidMachine = isValidMachine;

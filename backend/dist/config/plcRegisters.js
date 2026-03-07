"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegisters = exports.PLC_REGISTERS = void 0;
// re-export the registers definitions from appConfig so there is a
// single source of truth.
const appConfig_1 = require("./appConfig"); // note: same directory since file moved
Object.defineProperty(exports, "PLC_REGISTERS", { enumerable: true, get: function () { return appConfig_1.PLC_REGISTERS; } });
// legacy helper for consumers that still call it
exports.getRegisters = appConfig_1.getPlcRegisters;

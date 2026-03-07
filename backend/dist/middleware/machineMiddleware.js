"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.machineMiddleware = void 0;
const appConfig_1 = require("../config/appConfig");
const machineMiddleware = (req, res, next) => {
    const machineId = req.query.machine || "machine1";
    if (!(0, appConfig_1.isValidMachine)(machineId)) {
        return res.status(400).json({ error: "Invalid machine ID" });
    }
    req.machineId = machineId;
    next();
};
exports.machineMiddleware = machineMiddleware;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plcState_1 = require("../utils/plcState");
const router = (0, express_1.Router)();
router.get("/status", (req, res) => {
    const machineId = req.query.machine || "machine1";
    res.json({
        connected: false, // or real PLC status later
        currentRecipe: (0, plcState_1.getCurrentRecipe)(machineId),
    });
});
exports.default = router;

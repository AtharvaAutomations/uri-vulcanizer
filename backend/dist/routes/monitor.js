"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../db");
const router = express_1.default.Router();
router.get("/monitor", async (req, res) => {
    try {
        // Get PLC status from PLC service (plc-service listens on 3001)
        const plcStatusResponse = await axios_1.default.get("http://localhost:3001/status");
        // Get currently active recipe
        const activeRecipe = await db_1.prisma.recipe.findFirst({
            where: { status: "activated", machineId: req.machineId },
            orderBy: { activatedAt: "desc" },
        });
        res.json({
            connected: plcStatusResponse.data.connected,
            lastRead: plcStatusResponse.data.lastRead,
            lastWrite: plcStatusResponse.data.lastWrite,
            activeRecipe: activeRecipe || null,
        });
    }
    catch (err) {
        res.status(500).json({
            error: "PLC service not reachable",
            connected: false,
            lastRead: null,
            lastWrite: null,
            activeRecipe: null,
        });
    }
});
exports.default = router;

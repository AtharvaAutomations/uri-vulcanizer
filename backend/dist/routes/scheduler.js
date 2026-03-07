"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
/**
 * COMBINED SCHEDULER ENDPOINT
 * Returns:
 *  - running (currently active recipe)
 *  - upcoming (future scheduled recipes)
 *  - completed (expired recipes)
 */
router.get("/", async (req, res) => {
    try {
        const now = new Date();
        // Running recipe
        const running = await db_1.prisma.recipe.findFirst({
            where: { status: "activated", machineId: req.machineId },
            orderBy: { activatedAt: "desc" },
        });
        // Pending (future)
        const upcoming = await db_1.prisma.recipe.findMany({
            where: {
                status: "pending",
                machineId: req.machineId,
                scheduledAt: { gt: now },
            },
            orderBy: { scheduledAt: "asc" },
        });
        // Completed (expired)
        const completed = await db_1.prisma.recipe.findMany({
            where: {
                status: "expired",
                machineId: req.machineId,
                finishedAt: { not: null },
            },
            orderBy: { finishedAt: "desc" },
        });
        res.json({ running, upcoming, completed });
    }
    catch (err) {
        console.error("Scheduler fetch error:", err);
        res.status(500).json({ error: "Scheduler fetch failed" });
    }
});
exports.default = router;

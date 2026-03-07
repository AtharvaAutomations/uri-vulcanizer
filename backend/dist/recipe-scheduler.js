"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeScheduler = exports.RecipeScheduler = void 0;
const db_1 = require("./db"); // Import the SAME shared instance
const plcState_1 = require("./utils/plcState");
const axios_1 = __importDefault(require("axios"));
// URL of the PLC service to hit when recipes activate (configurable via env)
const appConfig_1 = require("./config/appConfig");
const PLC_SERVICE_URL = appConfig_1.ENVIRONMENT.PLC_SERVICE_URL;
class RecipeScheduler {
    constructor() {
        this.interval = null;
        this.io = null;
    }
    setIo(io) {
        this.io = io;
    }
    start(ms = appConfig_1.ENVIRONMENT.SCHEDULER_CHECK_INTERVAL) {
        this.interval = setInterval(async () => {
            await this.check();
        }, ms);
    }
    async check() {
        const now = new Date();
        const due = await db_1.prisma.recipe.findMany({
            where: {
                status: "pending",
                scheduledAt: { lte: now },
            },
        });
        for (const recipe of due) {
            await this.activate(recipe);
        }
    }
    async activate(recipe) {
        // Activating recipe - expire only activated recipes for the same machine
        await db_1.prisma.recipe.updateMany({
            where: { status: "activated", machineId: recipe.machineId },
            data: {
                status: "expired",
                finishedAt: new Date(),
            },
        });
        const updated = await db_1.prisma.recipe.update({
            where: { id: recipe.id },
            data: {
                status: "activated",
                activatedAt: new Date(),
            },
        });
        // Store as current active recipe
        (0, plcState_1.setCurrentRecipe)(updated);
        // Push recipe values to PLC registers when recipe activates
        try {
            await axios_1.default.post(`${PLC_SERVICE_URL}/api/plc/sendRecipe`, {
                machineId: updated.machineId,
                name: updated.name,
                curingTemp: updated.curingTemp,
                tempBandPlus: updated.tempBandPlus,
                tempBandMinus: updated.tempBandMinus,
                pressure: updated.pressure,
                pressureBandPlus: updated.pressureBandPlus,
                pressureBandMinus: updated.pressureBandMinus,
                curingTime: updated.curingTime,
                exhaustDelay: updated.exhaustDelay,
                purgingCycles: updated.purgingCycles,
                high1: updated.high1,
                low1: updated.low1,
                high2: updated.high2,
                low2: updated.low2,
                high3: updated.high3,
                low3: updated.low3,
                high4: updated.high4,
                low4: updated.low4,
                high5: updated.high5,
                low5: updated.low5,
            });
        }
        catch (err) {
            console.error("[Scheduler] Error writing recipe to PLC:", err instanceof Error ? err.message : err);
        }
        await db_1.prisma.changeLog.create({
            data: {
                user: "System",
                action: "recipe-activated",
                details: updated,
            },
        });
        // Emit real-time updates
        if (this.io) {
            this.io.emit("recipe-activated", updated);
            this.io.emit("scheduler-updated", { machineId: updated.machineId, action: "activated", recipe: updated });
        }
    }
}
exports.RecipeScheduler = RecipeScheduler;
exports.recipeScheduler = new RecipeScheduler();

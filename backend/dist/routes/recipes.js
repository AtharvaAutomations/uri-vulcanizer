"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../db");
const recipeHelpers_1 = require("../utils/recipeHelpers");
const cycleNumberFormatter_1 = require("../utils/cycleNumberFormatter");
const appConfig_1 = require("../config/appConfig");
const router = express_1.default.Router();
function sendError(res, err, status = 400) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(status).json({ error: msg });
}
router.post("/", async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.scheduledAt) {
            body.scheduledAt = (0, recipeHelpers_1.normalizeScheduledAt)(body.scheduledAt);
        }
        const recipe = await db_1.prisma.recipe.create({
            data: {
                ...body,
                machineId: req.machineId,
                version: 1,
                parentId: null,
                status: body.scheduledAt ? "pending" : "draft",
            },
        });
        await db_1.prisma.changeLog.create({
            data: {
                machineId: req.machineId,
                user: "admin",
                action: "recipe-created",
                details: recipe,
            },
        });
        req.app.get("io").emit("recipe-created", recipe);
        req.app.get("io").emit("scheduler-updated", { machineId: req.machineId, action: "created", recipe });
        res.json(recipe);
    }
    catch (err) {
        sendError(res, err);
    }
});
router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const old = await db_1.prisma.recipe.findFirst({
            where: { id, machineId: req.machineId },
        });
        if (!old)
            return res.status(404).json({ error: "Recipe not found" });
        const filtered = (0, recipeHelpers_1.stripReadonlyFields)(req.body);
        const updateData = (0, recipeHelpers_1.stripUndefined)(filtered);
        if (updateData.scheduledAt) {
            updateData.scheduledAt = (0, recipeHelpers_1.normalizeScheduledAt)(updateData.scheduledAt);
        }
        if ((0, recipeHelpers_1.shouldCreateNewVersion)(old, updateData)) {
            const newVersion = await db_1.prisma.recipe.create({
                data: (0, recipeHelpers_1.makeVersionData)(old, updateData, req.machineId),
            });
            await db_1.prisma.changeLog.create({
                data: {
                    machineId: req.machineId,
                    user: "admin",
                    action: "recipe-version-created",
                    details: { old, new: newVersion },
                },
            });
            req.app.get("io").emit("recipe-updated", newVersion);
            req.app.get("io").emit("scheduler-updated", { machineId: req.machineId, action: "updated", recipe: newVersion });
            return res.json(newVersion);
        }
        // update in place
        const updated = await db_1.prisma.recipe.update({
            where: { id },
            data: {
                ...updateData,
                status: updateData.scheduledAt ? "pending" : old.status,
            },
        });
        await db_1.prisma.changeLog.create({
            data: {
                machineId: req.machineId,
                user: "admin",
                action: "recipe-updated",
                details: { old, new: updated },
            },
        });
        req.app.get("io").emit("recipe-updated", updated);
        req.app.get("io").emit("scheduler-updated", { machineId: req.machineId, action: "updated", recipe: updated });
        res.json(updated);
    }
    catch (err) {
        console.error("[UPDATE RECIPE ERROR]", err);
        sendError(res, err);
    }
});
router.get("/active", async (req, res) => {
    const active = await db_1.prisma.recipe.findFirst({
        where: { status: "activated", machineId: req.machineId },
        orderBy: { activatedAt: "desc" },
    });
    if (!active)
        return res.json({ active: false });
    res.json({
        active: true,
        recipeId: active.id,
        name: active.name,
        version: active.version,
        parameters: active,
    });
});
router.get("/", async (req, res) => {
    const recipes = await db_1.prisma.recipe.findMany({
        where: { machineId: req.machineId },
        orderBy: { createdAt: "desc" },
    });
    res.json(recipes);
});
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const recipe = await db_1.prisma.recipe.findFirst({
            where: { id, machineId: req.machineId },
        });
        if (!recipe)
            return res.status(404).json({ error: "Recipe not found" });
        await db_1.prisma.recipe.delete({ where: { id } });
        await db_1.prisma.changeLog.create({
            data: {
                machineId: req.machineId,
                user: "admin",
                action: "recipe-deleted",
                details: recipe,
            },
        });
        req.app.get("io").emit("recipe-deleted", { id: recipe.id, machineId: req.machineId });
        req.app.get("io").emit("scheduler-updated", { machineId: req.machineId, action: "deleted", recipeId: recipe.id });
        req.app.get("io").emit("recipe-deleted", { id });
        res.json({ status: "deleted" });
    }
    catch (err) {
        sendError(res, err);
    }
});
router.post("/:id/send-to-plc", async (req, res) => {
    const id = Number(req.params.id);
    const recipe = await db_1.prisma.recipe.findFirst({
        where: { id, machineId: req.machineId },
    });
    if (!recipe)
        return res.status(404).json({ error: "Recipe not found" });
    try {
        const plcServiceUrl = appConfig_1.ENVIRONMENT.PLC_SERVICE_URL;
        const plcResponse = await axios_1.default.post(`${plcServiceUrl}/api/plc/sendRecipe`, { machineId: req.machineId, ...recipe });
        res.json({ status: "sent", plc: plcResponse.data });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[${req.machineId}] Send to PLC error:`, errorMessage);
        res.status(500).json({ error: errorMessage });
    }
});
// data endpoint moved here as well
router.post("/data", async (req, res) => {
    const { timestamp, cycleNumber: cycleNum, setTemperature, setPressure, setCuringTime, setExhaustDelay, actualTemperature, actualPressure, actualCuringTime, actualExhaustDelay, } = req.body;
    try {
        const testMode = process.env.TEST_MODE === "true" || req.query.test === "true";
        const formattedCycleNumber = cycleNum
            ? (0, cycleNumberFormatter_1.formatCycleNumber)(req.machineId, new Date(timestamp), cycleNum)
            : null;
        const explicitStore = req.query.store === "true" || req.body.storeOnCycleStart === true;
        if (explicitStore && !testMode) {
            await db_1.prisma.reading.create({
                data: {
                    machineId: req.machineId,
                    cycleNumber: formattedCycleNumber,
                    setTemperature: setTemperature ?? 0,
                    setPressure: setPressure ?? 0,
                    setCuringTime: setCuringTime ?? 0,
                    setExhaustDelay: setExhaustDelay ?? 0,
                    actualTemperature: actualTemperature ?? 0,
                    actualPressure: actualPressure ?? 0,
                    actualCuringTime: actualCuringTime ?? 0,
                    actualExhaustDelay: actualExhaustDelay ?? 0,
                    timestamp: new Date(timestamp),
                },
            });
        }
        req.app.get("io").emit(`live-data:${req.machineId}`, {
            temperature: actualTemperature,
            pressure: actualPressure,
            timestamp,
            cycleNumber: formattedCycleNumber,
        });
        res.json({ status: testMode ? "test-mode" : "saved" });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error saving data:", errorMessage);
        res.status(500).json({ error: errorMessage });
    }
});
router.get("/history", async (req, res) => {
    const { from, to, cycleNumber } = req.query;
    const data = await db_1.prisma.reading.findMany({
        where: {
            machineId: req.machineId,
            timestamp: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            },
            cycleNumber: cycleNumber ? cycleNumber : undefined,
        },
        orderBy: { timestamp: "asc" },
    });
    res.json(data);
});
exports.default = router;

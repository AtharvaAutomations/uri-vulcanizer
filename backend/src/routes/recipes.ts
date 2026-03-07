import express, { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../db";
import {
  normalizeScheduledAt,
  stripReadonlyFields,
  stripUndefined,
  shouldCreateNewVersion,
  makeVersionData,
} from "../utils/recipeHelpers";
import { formatCycleNumber } from "../utils/cycleNumberFormatter";
import { MachineId, ENVIRONMENT } from "../config/appConfig";

const router = express.Router();

declare global {
  namespace Express {
    interface Request {
      machineId?: MachineId;
    }
  }
}

function sendError(res: Response, err: unknown, status = 400) {
  const msg = err instanceof Error ? err.message : String(err);
  res.status(status).json({ error: msg });
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };
    if (body.scheduledAt) {
      body.scheduledAt = normalizeScheduledAt(body.scheduledAt);
    }

    const recipe = await prisma.recipe.create({
      data: {
        ...body,
        machineId: req.machineId,
        version: 1,
        parentId: null,
        status: body.scheduledAt ? "pending" : "draft",
      },
    });

    await prisma.changeLog.create({
      data: {
        machineId: req.machineId,
        user: "admin",
        action: "recipe-created",
        details: recipe,
      },
    });

    req.app.get("io").emit("recipe-created", recipe);
    req.app
      .get("io")
      .emit("scheduler-updated", {
        machineId: req.machineId,
        action: "created",
        recipe,
      });
    res.json(recipe);
  } catch (err) {
    sendError(res, err);
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const old = await prisma.recipe.findFirst({
      where: { id, machineId: req.machineId },
    });
    if (!old) return res.status(404).json({ error: "Recipe not found" });

    const filtered = stripReadonlyFields(req.body);
    const updateData = stripUndefined(filtered);

    if (updateData.scheduledAt) {
      updateData.scheduledAt = normalizeScheduledAt(updateData.scheduledAt);
    }

    if (shouldCreateNewVersion(old, updateData)) {
      const newVersion = await prisma.recipe.create({
        data: makeVersionData(old, updateData, req.machineId!),
      });

      await prisma.changeLog.create({
        data: {
          machineId: req.machineId,
          user: "admin",
          action: "recipe-version-created",
          details: { old, new: newVersion },
        },
      });

      req.app.get("io").emit("recipe-updated", newVersion);
      req.app
        .get("io")
        .emit("scheduler-updated", {
          machineId: req.machineId,
          action: "updated",
          recipe: newVersion,
        });
      return res.json(newVersion);
    }

    // update in place
    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        ...updateData,
        status: updateData.scheduledAt ? "pending" : old.status,
      },
    });

    await prisma.changeLog.create({
      data: {
        machineId: req.machineId,
        user: "admin",
        action: "recipe-updated",
        details: { old, new: updated },
      },
    });

    req.app.get("io").emit("recipe-updated", updated);
    req.app
      .get("io")
      .emit("scheduler-updated", {
        machineId: req.machineId,
        action: "updated",
        recipe: updated,
      });
    res.json(updated);
  } catch (err) {
    console.error("[UPDATE RECIPE ERROR]", err);
    sendError(res, err);
  }
});

router.get("/active", async (req: Request, res: Response) => {
  const active = await prisma.recipe.findFirst({
    where: { status: "activated", machineId: req.machineId },
    orderBy: { activatedAt: "desc" },
  });

  if (!active) return res.json({ active: false });

  res.json({
    active: true,
    recipeId: active.id,
    name: active.name,
    version: active.version,
    parameters: active,
  });
});

router.get("/", async (req: Request, res: Response) => {
  const recipes = await prisma.recipe.findMany({
    where: { machineId: req.machineId },
    orderBy: { createdAt: "desc" },
  });
  res.json(recipes);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id, machineId: req.machineId },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    await prisma.recipe.delete({ where: { id } });

    await prisma.changeLog.create({
      data: {
        machineId: req.machineId,
        user: "admin",
        action: "recipe-deleted",
        details: recipe,
      },
    });

    req.app
      .get("io")
      .emit("recipe-deleted", { id: recipe.id, machineId: req.machineId });
    req.app
      .get("io")
      .emit("scheduler-updated", {
        machineId: req.machineId,
        action: "deleted",
        recipeId: recipe.id,
      });
    req.app.get("io").emit("recipe-deleted", { id });
    res.json({ status: "deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/:id/send-to-plc", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const recipe = await prisma.recipe.findFirst({
    where: { id, machineId: req.machineId },
  });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  try {
    const plcServiceUrl = ENVIRONMENT.PLC_SERVICE_URL;
    const plcResponse = await axios.post(
      `${plcServiceUrl}/api/plc/sendRecipe`,
      { machineId: req.machineId, ...recipe },
    );
    res.json({ status: "sent", plc: plcResponse.data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[${req.machineId}] Send to PLC error:`, errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// data endpoint moved here as well
router.post("/data", async (req: Request, res: Response) => {
  const {
    timestamp,
    cycleNumber: cycleNum,
    setTemperature,
    setPressure,
    setCuringTime,
    setExhaustDelay,
    actualTemperature,
    actualPressure,
    actualCuringTime,
    actualExhaustDelay,
  } = req.body;

  try {
    const testMode =
      process.env.TEST_MODE === "true" || req.query.test === "true";

    const formattedCycleNumber = cycleNum
      ? formatCycleNumber(
          req.machineId as "machine1" | "machine2",
          new Date(timestamp),
          cycleNum,
        )
      : null;

    const explicitStore =
      req.query.store === "true" || req.body.storeOnCycleStart === true;

    if (explicitStore && !testMode) {
      await prisma.reading.create({
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error saving data:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/history", async (req: Request, res: Response) => {
  const { from, to, cycleNumber } = req.query;

  const data = await prisma.reading.findMany({
    where: {
      machineId: req.machineId,
      timestamp: {
        gte: from ? new Date(from as string) : undefined,
        lte: to ? new Date(to as string) : undefined,
      },
      cycleNumber: cycleNumber ? (cycleNumber as string) : undefined,
    },
    orderBy: { timestamp: "asc" },
  });

  res.json(data);
});

export default router;

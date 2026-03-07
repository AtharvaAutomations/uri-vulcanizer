import express, { Request, Response } from "express";
import { prisma } from "../db";
import { MachineId } from "../config/appConfig";

const router = express.Router();

declare global {
  namespace Express {
    interface Request {
      machineId?: MachineId;
    }
  }
}

/**
 * COMBINED SCHEDULER ENDPOINT
 * Returns:
 *  - running (currently active recipe)
 *  - upcoming (future scheduled recipes)
 *  - completed (expired recipes)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Running recipe
    const running = await prisma.recipe.findFirst({
      where: { status: "activated", machineId: req.machineId },
      orderBy: { activatedAt: "desc" },
    });

    // Pending (future)
    const upcoming = await prisma.recipe.findMany({
      where: {
        status: "pending",
        machineId: req.machineId,
        scheduledAt: { gt: now },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Completed (expired)
    const completed = await prisma.recipe.findMany({
      where: {
        status: "expired",
        machineId: req.machineId,
        finishedAt: { not: null },
      },
      orderBy: { finishedAt: "desc" },
    });

    res.json({ running, upcoming, completed });
  } catch (err) {
    console.error("Scheduler fetch error:", err);
    res.status(500).json({ error: "Scheduler fetch failed" });
  }
});

export default router;

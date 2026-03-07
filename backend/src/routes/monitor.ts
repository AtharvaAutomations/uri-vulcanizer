import express, { Request, Response } from "express";
import axios from "axios";
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

router.get("/monitor", async (req: Request, res: Response) => {
  try {
    // Get PLC status from PLC service (plc-service listens on 3001)
    const plcStatusResponse = await axios.get("http://localhost:3001/status");

    // Get currently active recipe
    const activeRecipe = await prisma.recipe.findFirst({
      where: { status: "activated", machineId: req.machineId },
      orderBy: { activatedAt: "desc" },
    });

    res.json({
      connected: plcStatusResponse.data.connected,
      lastRead: plcStatusResponse.data.lastRead,
      lastWrite: plcStatusResponse.data.lastWrite,
      activeRecipe: activeRecipe || null,
    });
  } catch (err) {
    res.status(500).json({
      error: "PLC service not reachable",
      connected: false,
      lastRead: null,
      lastWrite: null,
      activeRecipe: null,
    });
  }
});

export default router;

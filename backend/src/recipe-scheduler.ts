import { prisma } from "./db"; // Import the SAME shared instance
import { Recipe } from "@prisma/client";
import { setCurrentRecipe } from "./utils/plcState";
import axios from "axios";

// URL of the PLC service to hit when recipes activate (configurable via env)
import { ENVIRONMENT } from "./config/appConfig";
const PLC_SERVICE_URL = ENVIRONMENT.PLC_SERVICE_URL;

export class RecipeScheduler {
  private interval: NodeJS.Timeout | null = null;
  private io: any = null;

  setIo(io: any) {
    this.io = io;
  }

  start(ms = ENVIRONMENT.SCHEDULER_CHECK_INTERVAL) {
    this.interval = setInterval(async () => {
      await this.check();
    }, ms);
  }

  private async check() {
    const now = new Date();

    const due = await prisma.recipe.findMany({
      where: {
        status: "pending",
        scheduledAt: { lte: now },
      },
    });

    for (const recipe of due) {
      await this.activate(recipe);
    }
  }

  private async activate(recipe: Recipe) {
    // Activating recipe - expire only activated recipes for the same machine
    await prisma.recipe.updateMany({
      where: { status: "activated", machineId: recipe.machineId },
      data: {
        status: "expired",
        finishedAt: new Date(),
      },
    });

    const updated = await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        status: "activated",
        activatedAt: new Date(),
      },
    });

    // Store as current active recipe
    setCurrentRecipe(updated);

    // Push recipe values to PLC registers when recipe activates
    try {
      await axios.post(`${PLC_SERVICE_URL}/api/plc/sendRecipe`, {
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
    } catch (err) {
      console.error(
        "[Scheduler] Error writing recipe to PLC:",
        err instanceof Error ? err.message : err,
      );
    }

    await prisma.changeLog.create({
      data: {
        user: "System",
        action: "recipe-activated",
        details: updated,
      },
    });

    // Emit real-time updates
    if (this.io) {
      this.io.emit("recipe-activated", updated);
      this.io.emit("scheduler-updated", {
        machineId: updated.machineId,
        action: "activated",
        recipe: updated,
      });
    }
  }
}

export const recipeScheduler = new RecipeScheduler();

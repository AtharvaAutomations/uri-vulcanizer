import { Router } from "express";
import { getCurrentRecipe } from "../utils/plcState";

const router = Router();

router.get("/status", (req, res) => {
  const machineId = (req.query.machine as string) || "machine1";
  res.json({
    connected: false, // or real PLC status later
    currentRecipe: getCurrentRecipe(machineId),
  });
});

export default router;

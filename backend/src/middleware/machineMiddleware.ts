import { Request, Response, NextFunction } from "express";
import { isValidMachine, MachineId } from "../config/appConfig";

declare global {
  namespace Express {
    interface Request {
      machineId?: MachineId;
    }
  }
}

export const machineMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const machineId = (req.query.machine as string) || "machine1";

  if (!isValidMachine(machineId)) {
    return res.status(400).json({ error: "Invalid machine ID" });
  }

  req.machineId = machineId;
  next();
};

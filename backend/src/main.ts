import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { prisma } from "./db"; // Import the shared instance
import dotenv from "dotenv";
import { recipeScheduler } from "./recipe-scheduler";
import path from "path";
import schedulerRoutes from "./routes/scheduler";
import plcRoutes from "./routes/monitor";
import plcStatusRoutes from "./routes/plcStatus";
import reportsRoutes from "./routes/reports";
import recipesRoutes from "./routes/recipes";
import { machineMiddleware } from "./middleware/machineMiddleware";

dotenv.config();

interface ProcessWithPkg {
  pkg?: string;
}

const isPkg = typeof (process as ProcessWithPkg).pkg !== "undefined";
const executableDir = isPkg ? path.dirname(process.execPath) : process.cwd();

const app = express();

app.use(express.json());
app.use(cors());
app.use(machineMiddleware); // Apply before routes

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Ensure DB schema has required columns (when developer resets DB sometimes migrations are missing)
async function ensureDbSchema() {
  try {
    // Add machineId to Recipe and Reading if missing
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "machineId" TEXT DEFAULT 'machine1'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Reading" ADD COLUMN IF NOT EXISTS "machineId" TEXT DEFAULT 'machine1'`,
    );

    // Add indexes if missing
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Reading_machineId_timestamp_idx" ON "Reading" ("machineId", "timestamp")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Reading_machineId_cycleNumber_idx" ON "Reading" ("machineId", "cycleNumber")`,
    );
  } catch (err) {
    console.error("DB schema check failed:", err);
  }
}

// Start scheduler after ensuring DB schema
ensureDbSchema().then(() => recipeScheduler.start(5000)); // check every 5 sec

// Frontend folder should be next to the .exe when packaged
const frontendPath = path.join(executableDir, "frontend");

app.use("/api/scheduler", schedulerRoutes);
app.use("/api/plc", plcRoutes);
app.use("/api/plc", plcStatusRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/recipes", recipesRoutes);

// attach socket.io instance so routers can emit events
app.set("io", io);

// Set io for scheduler
recipeScheduler.setIo(io);

// Start server (keep this at the end)
server.listen(3000);

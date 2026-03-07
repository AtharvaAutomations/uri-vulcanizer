"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const db_1 = require("./db"); // Import the shared instance
const dotenv_1 = __importDefault(require("dotenv"));
const recipe_scheduler_1 = require("./recipe-scheduler");
const path_1 = __importDefault(require("path"));
const scheduler_1 = __importDefault(require("./routes/scheduler"));
const monitor_1 = __importDefault(require("./routes/monitor"));
const plcStatus_1 = __importDefault(require("./routes/plcStatus"));
const reports_1 = __importDefault(require("./routes/reports"));
const recipes_1 = __importDefault(require("./routes/recipes"));
const machineMiddleware_1 = require("./middleware/machineMiddleware");
dotenv_1.default.config();
const isPkg = typeof process.pkg !== "undefined";
const executableDir = isPkg ? path_1.default.dirname(process.execPath) : process.cwd();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(machineMiddleware_1.machineMiddleware); // Apply before routes
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
// Ensure DB schema has required columns (when developer resets DB sometimes migrations are missing)
async function ensureDbSchema() {
    try {
        // Add machineId to Recipe and Reading if missing
        await db_1.prisma.$executeRawUnsafe(`ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "machineId" TEXT DEFAULT 'machine1'`);
        await db_1.prisma.$executeRawUnsafe(`ALTER TABLE "Reading" ADD COLUMN IF NOT EXISTS "machineId" TEXT DEFAULT 'machine1'`);
        // Add indexes if missing
        await db_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Reading_machineId_timestamp_idx" ON "Reading" ("machineId", "timestamp")`);
        await db_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Reading_machineId_cycleNumber_idx" ON "Reading" ("machineId", "cycleNumber")`);
    }
    catch (err) {
        console.error("DB schema check failed:", err);
    }
}
// Start scheduler after ensuring DB schema
ensureDbSchema().then(() => recipe_scheduler_1.recipeScheduler.start(5000)); // check every 5 sec
// Frontend folder should be next to the .exe when packaged
const frontendPath = path_1.default.join(executableDir, "frontend");
app.use("/api/scheduler", scheduler_1.default);
app.use("/api/plc", monitor_1.default);
app.use("/api/plc", plcStatus_1.default);
app.use("/api/reports", reports_1.default);
app.use("/api/recipes", recipes_1.default);
// attach socket.io instance so routers can emit events
app.set("io", io);
// Set io for scheduler
recipe_scheduler_1.recipeScheduler.setIo(io);
// Start server (keep this at the end)
server.listen(3000);

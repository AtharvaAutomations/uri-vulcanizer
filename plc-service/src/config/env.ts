import dotenv from "dotenv";

dotenv.config();

/**
 * Environment configuration for plc-service
 * All values are read from process.env with sane defaults.
 * Centralizing here makes it easy to adjust at deployment time
 * without touching the business logic.
 */

export const PLC_IP = process.env.PLC_IP || "127.0.0.1";
export const PLC_PORT = Number(process.env.PLC_PORT) || 502;
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// polling / retry intervals (milliseconds)
export const PLC_POLL_INTERVAL = Number(process.env.PLC_POLL_INTERVAL) || 1000;
export const PLC_RECONNECT_DELAY =
  Number(process.env.PLC_RECONNECT_DELAY) || 2000;

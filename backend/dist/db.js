"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const isPkg = typeof process.pkg !== "undefined";
if (isPkg) {
    const exeDir = path_1.default.dirname(process.execPath);
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path_1.default.join(exeDir, "query_engine-windows.dll.node");
}
exports.prisma = new client_1.PrismaClient();

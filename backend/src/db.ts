import { PrismaClient } from "@prisma/client";
import path from "path";

const isPkg = typeof (process as any).pkg !== "undefined";

if (isPkg) {
  const exeDir = path.dirname(process.execPath);
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
    exeDir,
    "query_engine-windows.dll.node"
  );
}

export const prisma = new PrismaClient();

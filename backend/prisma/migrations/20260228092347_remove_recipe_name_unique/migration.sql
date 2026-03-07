-- AlterTable
ALTER TABLE "ChangeLog" ADD COLUMN     "machineId" TEXT DEFAULT 'machine1';

-- DropIndex
DROP INDEX IF EXISTS "Recipe_machineId_name_key";

-- AlterTable
ALTER TABLE "Reading" ADD COLUMN     "actualCuringTime" DOUBLE PRECISION,
ADD COLUMN     "actualExhaustDelay" DOUBLE PRECISION,
ADD COLUMN     "actualPressure" DOUBLE PRECISION,
ADD COLUMN     "actualTemperature" DOUBLE PRECISION,
ADD COLUMN     "m100Status" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "machineId" TEXT NOT NULL DEFAULT 'machine1',
ADD COLUMN     "setCuringTime" DOUBLE PRECISION,
ADD COLUMN     "setExhaustDelay" DOUBLE PRECISION,
ADD COLUMN     "setPressure" DOUBLE PRECISION,
ADD COLUMN     "setTemperature" DOUBLE PRECISION,
ALTER COLUMN "cycleNumber" DROP NOT NULL,
ALTER COLUMN "cycleNumber" DROP DEFAULT,
ALTER COLUMN "cycleNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "machineId" TEXT NOT NULL DEFAULT 'machine1';

-- CreateIndex
CREATE INDEX "Reading_machineId_timestamp_idx" ON "Reading"("machineId", "timestamp");

-- CreateIndex
CREATE INDEX "Reading_machineId_cycleNumber_idx" ON "Reading"("machineId", "cycleNumber");

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" SERIAL NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" INTEGER,
    "curingTemp" DOUBLE PRECISION NOT NULL,
    "tempBandPlus" DOUBLE PRECISION NOT NULL,
    "tempBandMinus" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "pressureBandPlus" DOUBLE PRECISION NOT NULL,
    "pressureBandMinus" DOUBLE PRECISION NOT NULL,
    "curingTime" INTEGER NOT NULL,
    "exhaustDelay" INTEGER NOT NULL,
    "purgingCycles" INTEGER NOT NULL,
    "high1" DOUBLE PRECISION NOT NULL,
    "low1" DOUBLE PRECISION NOT NULL,
    "high2" DOUBLE PRECISION NOT NULL,
    "low2" DOUBLE PRECISION NOT NULL,
    "high3" DOUBLE PRECISION NOT NULL,
    "low3" DOUBLE PRECISION NOT NULL,
    "high4" DOUBLE PRECISION NOT NULL,
    "low4" DOUBLE PRECISION NOT NULL,
    "high5" DOUBLE PRECISION NOT NULL,
    "low5" DOUBLE PRECISION NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

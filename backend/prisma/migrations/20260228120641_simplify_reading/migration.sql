/*
  Warnings:

  - You are about to drop the column `m100Status` on the `Reading` table. All the data in the column will be lost.
  - You are about to drop the column `pressure` on the `Reading` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `Reading` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reading" DROP COLUMN "m100Status",
DROP COLUMN "pressure",
DROP COLUMN "temperature";

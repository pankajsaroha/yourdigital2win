/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,periodStart,periodEnd]` on the table `Insight` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `periodEnd` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `Insight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Insight_userId_type_periodStart_periodEnd_key" ON "Insight"("userId", "type", "periodStart", "periodEnd");

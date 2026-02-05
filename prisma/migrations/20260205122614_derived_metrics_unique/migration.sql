/*
  Warnings:

  - A unique constraint covering the columns `[userId,periodStart,periodEnd]` on the table `DerivedMetrics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DerivedMetrics_userId_periodStart_periodEnd_key" ON "DerivedMetrics"("userId", "periodStart", "periodEnd");

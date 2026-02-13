/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `DailyLog` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DailyLog_date_key";

-- AlterTable
ALTER TABLE "DailyLog" ALTER COLUMN "gym" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_userId_date_key" ON "DailyLog"("userId", "date");

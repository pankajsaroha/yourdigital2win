/*
  Warnings:

  - A unique constraint covering the columns `[date]` on the table `DailyLog` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "DailyLog" DROP CONSTRAINT "DailyLog_userId_fkey";

-- DropIndex
DROP INDEX "DailyLog_userId_date_idx";

-- DropIndex
DROP INDEX "DailyLog_userId_date_key";

-- AlterTable
ALTER TABLE "DailyLog" ADD COLUMN     "energy" INTEGER,
ALTER COLUMN "gym" DROP NOT NULL,
ALTER COLUMN "gym" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_key" ON "DailyLog"("date");

-- CreateIndex
CREATE INDEX "DailyLog_userId_idx" ON "DailyLog"("userId");

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

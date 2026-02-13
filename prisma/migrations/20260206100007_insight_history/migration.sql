-- CreateTable
CREATE TABLE "InsightEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsightEvent_userId_insightKey_idx" ON "InsightEvent"("userId", "insightKey");

-- CreateIndex
CREATE UNIQUE INDEX "InsightFeedback_userId_insightKey_key" ON "InsightFeedback"("userId", "insightKey");

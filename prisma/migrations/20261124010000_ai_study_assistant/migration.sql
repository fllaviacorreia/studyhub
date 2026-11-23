CREATE TYPE "AIConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL');
CREATE TYPE "AIMessageStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "AIUsageStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "AIGenerationType" AS ENUM ('SUMMARY', 'EXPLANATION', 'QUESTION', 'STUDY_GUIDE');
CREATE TYPE "AIGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "AIRecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

CREATE TABLE "MaterialAccess" (
  "materialId" UUID NOT NULL, "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaterialAccess_pkey" PRIMARY KEY ("materialId", "userId")
);
CREATE INDEX "MaterialAccess_userId_idx" ON "MaterialAccess"("userId");
ALTER TABLE "MaterialAccess" ADD CONSTRAINT "MaterialAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialAccess" ADD CONSTRAINT "MaterialAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AIConversation" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "title" VARCHAR(160) NOT NULL,
  "studyGoalId" UUID, "studyPlanId" UUID, "status" "AIConversationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIMessage" (
  "id" UUID NOT NULL, "conversationId" UUID NOT NULL, "role" "AIMessageRole" NOT NULL,
  "content" TEXT NOT NULL, "status" "AIMessageStatus" NOT NULL DEFAULT 'PENDING',
  "providerResponseId" VARCHAR(160), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIMessageSource" (
  "id" UUID NOT NULL, "messageId" UUID NOT NULL, "sourceType" VARCHAR(60) NOT NULL,
  "sourceId" UUID, "sourceVersionId" UUID, "title" VARCHAR(240) NOT NULL, "sourceUrl" TEXT,
  "location" VARCHAR(240), "excerpt" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIMessageSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIUsageRecord" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "conversationId" UUID, "operation" VARCHAR(80) NOT NULL,
  "model" VARCHAR(120) NOT NULL, "inputTokens" INTEGER, "outputTokens" INTEGER, "cachedInputTokens" INTEGER,
  "estimatedCost" DECIMAL(14,6), "status" "AIUsageStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIGenerationJob" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "generationType" "AIGenerationType" NOT NULL,
  "status" "AIGenerationStatus" NOT NULL DEFAULT 'PENDING', "inputReference" JSONB, "outputReference" JSONB,
  "errorCode" VARCHAR(80), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIGenerationJob_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AIRecommendation" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "studyGoalId" UUID, "studyPlanId" UUID,
  "recommendationType" VARCHAR(80) NOT NULL, "title" VARCHAR(180) NOT NULL, "description" TEXT NOT NULL,
  "rationale" TEXT, "status" "AIRecommendationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIConversation_userId_status_updatedAt_idx" ON "AIConversation"("userId", "status", "updatedAt");
CREATE INDEX "AIConversation_studyGoalId_idx" ON "AIConversation"("studyGoalId");
CREATE INDEX "AIConversation_studyPlanId_idx" ON "AIConversation"("studyPlanId");
CREATE INDEX "AIMessage_conversationId_createdAt_id_idx" ON "AIMessage"("conversationId", "createdAt", "id");
CREATE INDEX "AIMessageSource_messageId_idx" ON "AIMessageSource"("messageId");
CREATE INDEX "AIMessageSource_sourceId_sourceVersionId_idx" ON "AIMessageSource"("sourceId", "sourceVersionId");
CREATE INDEX "AIUsageRecord_userId_createdAt_idx" ON "AIUsageRecord"("userId", "createdAt");
CREATE INDEX "AIUsageRecord_conversationId_idx" ON "AIUsageRecord"("conversationId");
CREATE INDEX "AIGenerationJob_userId_status_createdAt_idx" ON "AIGenerationJob"("userId", "status", "createdAt");
CREATE INDEX "AIRecommendation_userId_status_createdAt_idx" ON "AIRecommendation"("userId", "status", "createdAt");
CREATE INDEX "AIRecommendation_studyGoalId_idx" ON "AIRecommendation"("studyGoalId");
CREATE INDEX "AIRecommendation_studyPlanId_idx" ON "AIRecommendation"("studyPlanId");

ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_studyGoalId_fkey" FOREIGN KEY ("studyGoalId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIMessageSource" ADD CONSTRAINT "AIMessageSource_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AIMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIGenerationJob" ADD CONSTRAINT "AIGenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_studyGoalId_fkey" FOREIGN KEY ("studyGoalId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

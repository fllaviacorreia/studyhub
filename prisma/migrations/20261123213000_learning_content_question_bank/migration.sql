-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('MARKDOWN', 'STRUCTURED_CONTENT');

-- CreateEnum
CREATE TYPE "LearningProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExerciseMode" AS ENUM ('PRACTICE', 'EXAM');

-- CreateEnum
CREATE TYPE "ExerciseListStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ContentSourceType" AS ENUM ('OFFICIAL_DOCUMENT', 'LEGISLATION', 'ORIGINAL_CONTENT', 'LICENSED_MATERIAL', 'USER_PROVIDED', 'OTHER');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "contentFormat" "ContentFormat" NOT NULL DEFAULT 'MARKDOWN',
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" VARCHAR(240) NOT NULL,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "MaterialTopic" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MaterialVersion" ADD COLUMN     "changeDescription" TEXT,
ADD COLUMN     "createdById" UUID NOT NULL;

-- AlterTable
ALTER TABLE "PlanTask" ADD COLUMN     "exerciseListId" UUID,
ADD COLUMN     "materialId" UUID;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "currentVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "examinationId" UUID,
ADD COLUMN     "positionId" UUID,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "QuestionAttempt" ADD COLUMN     "explanationRevealed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "idempotencyKey" VARCHAR(120) NOT NULL,
ADD COLUMN     "questionSessionId" UUID NOT NULL,
ADD COLUMN     "questionVersionId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "QuestionOption" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" UUID NOT NULL,
    "materialId" UUID,
    "title" VARCHAR(220) NOT NULL,
    "sourceType" "ContentSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "author" VARCHAR(180),
    "publicationDate" DATE,
    "accessedAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "status" "LearningProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercentage" SMALLINT NOT NULL DEFAULT 0,
    "lastPosition" VARCHAR(500),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionVersion" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "kind" "QuestionKind" NOT NULL,
    "statement" TEXT NOT NULL,
    "explanation" TEXT,
    "options" JSONB NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseList" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "mode" "ExerciseMode" NOT NULL DEFAULT 'PRACTICE',
    "status" "ExerciseListStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseListQuestion" (
    "id" UUID NOT NULL,
    "exerciseListId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ExerciseListQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "exerciseListId" UUID,
    "studyTaskId" UUID,
    "studySessionId" UUID,
    "idempotencyKey" VARCHAR(120) NOT NULL,
    "status" "QuestionSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "mode" "ExerciseMode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSessionItem" (
    "id" UUID NOT NULL,
    "questionSessionId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "questionVersionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "QuestionSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentSource_materialId_idx" ON "ContentSource"("materialId");

-- CreateIndex
CREATE INDEX "LearningProgress_userId_status_updatedAt_idx" ON "LearningProgress"("userId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_materialId_key" ON "LearningProgress"("userId", "materialId");

-- CreateIndex
CREATE INDEX "QuestionVersion_questionId_createdAt_idx" ON "QuestionVersion"("questionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersion_questionId_version_key" ON "QuestionVersion"("questionId", "version");

-- CreateIndex
CREATE INDEX "ExerciseList_userId_status_createdAt_idx" ON "ExerciseList"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseListQuestion_exerciseListId_questionId_key" ON "ExerciseListQuestion"("exerciseListId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseListQuestion_exerciseListId_position_key" ON "ExerciseListQuestion"("exerciseListId", "position");

-- CreateIndex
CREATE INDEX "QuestionSession_userId_status_startedAt_idx" ON "QuestionSession"("userId", "status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSession_userId_idempotencyKey_key" ON "QuestionSession"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSessionItem_questionSessionId_questionId_key" ON "QuestionSessionItem"("questionSessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSessionItem_questionSessionId_position_key" ON "QuestionSessionItem"("questionSessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Material_slug_key" ON "Material"("slug");

-- CreateIndex
CREATE INDEX "Question_difficulty_status_idx" ON "Question"("difficulty", "status");

-- CreateIndex
CREATE INDEX "Question_examinationId_positionId_idx" ON "Question"("examinationId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttempt_questionSessionId_questionId_key" ON "QuestionAttempt"("questionSessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttempt_userId_idempotencyKey_key" ON "QuestionAttempt"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "MaterialVersion" ADD CONSTRAINT "MaterialVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ExamPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_exerciseListId_fkey" FOREIGN KEY ("exerciseListId") REFERENCES "ExerciseList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionSessionId_fkey" FOREIGN KEY ("questionSessionId") REFERENCES "QuestionSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseList" ADD CONSTRAINT "ExerciseList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseListQuestion" ADD CONSTRAINT "ExerciseListQuestion_exerciseListId_fkey" FOREIGN KEY ("exerciseListId") REFERENCES "ExerciseList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseListQuestion" ADD CONSTRAINT "ExerciseListQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSession" ADD CONSTRAINT "QuestionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSession" ADD CONSTRAINT "QuestionSession_exerciseListId_fkey" FOREIGN KEY ("exerciseListId") REFERENCES "ExerciseList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSession" ADD CONSTRAINT "QuestionSession_studyTaskId_fkey" FOREIGN KEY ("studyTaskId") REFERENCES "PlanTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSession" ADD CONSTRAINT "QuestionSession_studySessionId_fkey" FOREIGN KEY ("studySessionId") REFERENCES "StudySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSessionItem" ADD CONSTRAINT "QuestionSessionItem_questionSessionId_fkey" FOREIGN KEY ("questionSessionId") REFERENCES "QuestionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSessionItem" ADD CONSTRAINT "QuestionSessionItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSessionItem" ADD CONSTRAINT "QuestionSessionItem_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain constraints that Prisma cannot express in the schema.
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_percentage_check" CHECK ("progressPercentage" BETWEEN 0 AND 100);
ALTER TABLE "Material" ADD CONSTRAINT "Material_estimatedMinutes_check" CHECK ("estimatedMinutes" IS NULL OR "estimatedMinutes" > 0);
ALTER TABLE "Question" ADD CONSTRAINT "Question_year_check" CHECK ("year" IS NULL OR "year" BETWEEN 1900 AND 2200);
ALTER TABLE "QuestionSession" ADD CONSTRAINT "QuestionSession_totals_check" CHECK ("totalQuestions" >= 0 AND "correctAnswers" >= 0 AND "correctAnswers" <= "totalQuestions");
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_responseTimeMs_check" CHECK ("responseTimeMs" IS NULL OR "responseTimeMs" >= 0);

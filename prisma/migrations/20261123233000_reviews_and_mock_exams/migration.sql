CREATE TYPE "ReviewScheduleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "ReviewRating" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');
CREATE TYPE "ErrorNotebookStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'ARCHIVED');
CREATE TYPE "MockExamStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');
CREATE TYPE "MockExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'FINISHED', 'EXPIRED', 'ABANDONED');
CREATE TYPE "ScoringStrategy" AS ENUM ('SIMPLE', 'WEIGHTED_BY_SECTION');

ALTER TABLE "ReviewItem" RENAME TO "ReviewSchedule";
ALTER TABLE "ReviewSchedule" RENAME COLUMN "dueAt" TO "nextReviewAt";
ALTER TABLE "ReviewSchedule" RENAME COLUMN "repetitions" TO "reviewCount";
ALTER TABLE "ReviewSchedule" RENAME COLUMN "easeFactor" TO "difficulty";
ALTER TABLE "ReviewSchedule" ADD COLUMN "lapseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "stability" DECIMAL(10,3) NOT NULL DEFAULT 1,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ReviewSchedule" ALTER COLUMN "intervalDays" SET DEFAULT 1;
ALTER TABLE "ReviewSchedule" ALTER COLUMN "difficulty" TYPE DECIMAL(5,2);
ALTER TABLE "ReviewSchedule" ALTER COLUMN "difficulty" SET DEFAULT 5;
ALTER TABLE "ReviewSchedule" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ReviewSchedule" ALTER COLUMN "status" TYPE "ReviewScheduleStatus" USING (CASE WHEN "status"::text = 'COMPLETED' THEN 'COMPLETED' ELSE 'ACTIVE' END)::"ReviewScheduleStatus";
ALTER TABLE "ReviewSchedule" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TYPE "ReviewStatus";
DROP INDEX IF EXISTS "ReviewItem_userId_dueAt_status_idx";
CREATE INDEX "ReviewSchedule_userId_status_nextReviewAt_idx" ON "ReviewSchedule"("userId", "status", "nextReviewAt");
CREATE INDEX "ReviewSchedule_topicId_idx" ON "ReviewSchedule"("topicId");

CREATE TABLE "ReviewAttempt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "reviewScheduleId" UUID NOT NULL, "userId" UUID NOT NULL,
  "rating" "ReviewRating" NOT NULL, "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "previousIntervalDays" INTEGER NOT NULL, "nextIntervalDays" INTEGER NOT NULL, "responseTimeSeconds" INTEGER,
  "notes" TEXT, "idempotencyKey" VARCHAR(120) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReviewAttempt_userId_idempotencyKey_key" ON "ReviewAttempt"("userId", "idempotencyKey");
CREATE INDEX "ReviewAttempt_reviewScheduleId_reviewedAt_idx" ON "ReviewAttempt"("reviewScheduleId", "reviewedAt");
CREATE INDEX "ReviewAttempt_userId_reviewedAt_idx" ON "ReviewAttempt"("userId", "reviewedAt");
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_reviewScheduleId_fkey" FOREIGN KEY ("reviewScheduleId") REFERENCES "ReviewSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ErrorNotebookEntry" RENAME COLUMN "note" TO "notes";
ALTER TABLE "ErrorNotebookEntry" ADD COLUMN "sourceAttemptId" UUID, ADD COLUMN "status" "ErrorNotebookStatus" NOT NULL DEFAULT 'OPEN', ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ErrorNotebookEntry" ALTER COLUMN "questionId" SET NOT NULL;
DROP INDEX IF EXISTS "ErrorNotebookEntry_userId_resolvedAt_idx";
CREATE UNIQUE INDEX "ErrorNotebookEntry_sourceAttemptId_key" ON "ErrorNotebookEntry"("sourceAttemptId");
CREATE UNIQUE INDEX "ErrorNotebookEntry_userId_questionId_key" ON "ErrorNotebookEntry"("userId", "questionId");
CREATE INDEX "ErrorNotebookEntry_userId_status_updatedAt_idx" ON "ErrorNotebookEntry"("userId", "status", "updatedAt");
CREATE INDEX "ErrorNotebookEntry_userId_topicId_idx" ON "ErrorNotebookEntry"("userId", "topicId");
ALTER TABLE "ErrorNotebookEntry" DROP CONSTRAINT "ErrorNotebookEntry_questionId_fkey";
ALTER TABLE "ErrorNotebookEntry" ADD CONSTRAINT "ErrorNotebookEntry_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ErrorNotebookEntry" ADD CONSTRAINT "ErrorNotebookEntry_sourceAttemptId_fkey" FOREIGN KEY ("sourceAttemptId") REFERENCES "QuestionAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MockExam" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID NOT NULL, "title" VARCHAR(180) NOT NULL, "description" TEXT,
  "studyGoalId" UUID, "examinationId" UUID, "positionId" UUID, "durationMinutes" INTEGER, "totalQuestions" INTEGER NOT NULL,
  "status" "MockExamStatus" NOT NULL DEFAULT 'DRAFT', "scoringStrategy" "ScoringStrategy" NOT NULL DEFAULT 'SIMPLE',
  "selectionSeed" VARCHAR(120) NOT NULL, "selectionFilters" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MockExam_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MockExam_userId_status_createdAt_idx" ON "MockExam"("userId", "status", "createdAt");
ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_studyGoalId_fkey" FOREIGN KEY ("studyGoalId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ExamPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MockExamSection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "mockExamId" UUID NOT NULL, "subjectId" UUID, "title" VARCHAR(160) NOT NULL,
  "questionCount" INTEGER NOT NULL, "weight" DECIMAL(8,3) NOT NULL DEFAULT 1, "order" INTEGER NOT NULL, "filters" JSONB,
  CONSTRAINT "MockExamSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MockExamSection_mockExamId_order_key" ON "MockExamSection"("mockExamId", "order");
CREATE INDEX "MockExamSection_subjectId_idx" ON "MockExamSection"("subjectId");
ALTER TABLE "MockExamSection" ADD CONSTRAINT "MockExamSection_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockExamSection" ADD CONSTRAINT "MockExamSection_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuestionSessionItem" ADD COLUMN "mockExamSectionId" UUID;
ALTER TABLE "QuestionSessionItem" ADD CONSTRAINT "QuestionSessionItem_mockExamSectionId_fkey" FOREIGN KEY ("mockExamSectionId") REFERENCES "MockExamSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MockExamAttempt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "mockExamId" UUID NOT NULL, "userId" UUID NOT NULL, "questionSessionId" UUID NOT NULL,
  "status" "MockExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS', "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deadlineAt" TIMESTAMP(3), "submittedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3), "rawScore" DECIMAL(10,3),
  "weightedScore" DECIMAL(10,3), "correctAnswers" INTEGER, "totalQuestions" INTEGER NOT NULL, "resultSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MockExamAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MockExamAttempt_questionSessionId_key" ON "MockExamAttempt"("questionSessionId");
CREATE INDEX "MockExamAttempt_userId_status_startedAt_idx" ON "MockExamAttempt"("userId", "status", "startedAt");
CREATE INDEX "MockExamAttempt_mockExamId_startedAt_idx" ON "MockExamAttempt"("mockExamId", "startedAt");
ALTER TABLE "MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_questionSessionId_fkey" FOREIGN KEY ("questionSessionId") REFERENCES "QuestionSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlanTask" ADD COLUMN "reviewScheduleId" UUID, ADD COLUMN "mockExamId" UUID;
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_reviewScheduleId_fkey" FOREIGN KEY ("reviewScheduleId") REFERENCES "ReviewSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_intervalDays_check" CHECK ("intervalDays" BETWEEN 1 AND 3650);
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_counts_check" CHECK ("reviewCount" >= 0 AND "lapseCount" >= 0);
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_intervals_check" CHECK ("previousIntervalDays" >= 1 AND "nextIntervalDays" BETWEEN 1 AND 3650);
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_response_time_check" CHECK ("responseTimeSeconds" IS NULL OR "responseTimeSeconds" >= 0);
ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_counts_check" CHECK ("totalQuestions" > 0 AND ("durationMinutes" IS NULL OR "durationMinutes" > 0));
ALTER TABLE "MockExamSection" ADD CONSTRAINT "MockExamSection_values_check" CHECK ("questionCount" > 0 AND "weight" > 0);

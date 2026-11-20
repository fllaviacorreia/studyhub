-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('USER', 'CURATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ObjectiveStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ObjectiveMemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('NOTE', 'ARTICLE', 'BOOK', 'VIDEO', 'FILE', 'LINK', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "ContentProvenance" AS ENUM ('OFFICIAL', 'AUTHORED', 'LICENSED', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskOrigin" AS ENUM ('GENERATED', 'MANUAL', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('THEORY', 'PRACTICE', 'REVIEW', 'MOCK_EXAM');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "SystemRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "StudyArea" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectiveType" (
    "id" UUID NOT NULL,
    "ownerId" UUID,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectiveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "studyAreaId" UUID,
    "typeId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "priority" SMALLINT NOT NULL DEFAULT 3,
    "deadline" DATE,
    "status" "ObjectiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectiveMember" (
    "objectiveId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "ObjectiveMemberRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectiveMember_pkey" PRIMARY KEY ("objectiveId","userId")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "acronym" VARCHAR(30),
    "country" CHAR(2) NOT NULL DEFAULT 'BR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBoard" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "acronym" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "year" INTEGER,
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamPosition" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "specialty" VARCHAR(160),
    "requirements" TEXT,

    CONSTRAINT "ExamPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "boardId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeVersion" (
    "id" UUID NOT NULL,
    "noticeId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceUrl" TEXT,
    "sourceFileKey" TEXT,
    "extractionData" JSONB,
    "reviewerId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticePosition" (
    "noticeId" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "vacancies" INTEGER,

    CONSTRAINT "NoticePosition_pkey" PRIMARY KEY ("noticeId","positionId")
);

-- CreateTable
CREATE TABLE "ObjectiveNotice" (
    "objectiveId" UUID NOT NULL,
    "noticeId" UUID NOT NULL,

    CONSTRAINT "ObjectiveNotice_pkey" PRIMARY KEY ("objectiveId","noticeId")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "parentId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectiveSubject" (
    "objectiveId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "weight" DECIMAL(8,3) NOT NULL DEFAULT 1,
    "priority" SMALLINT NOT NULL DEFAULT 3,

    CONSTRAINT "ObjectiveSubject_pkey" PRIMARY KEY ("objectiveId","subjectId")
);

-- CreateTable
CREATE TABLE "NoticeSubjectRule" (
    "id" UUID NOT NULL,
    "noticeVersionId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "topicId" UUID,
    "weight" DECIMAL(8,3),
    "questionCount" INTEGER,
    "requirementText" TEXT,

    CONSTRAINT "NoticeSubjectRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" VARCHAR(220) NOT NULL,
    "kind" "MaterialKind" NOT NULL,
    "provenance" "ContentProvenance" NOT NULL,
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "license" VARCHAR(120),
    "sourceUrl" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialVersion" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT,
    "fileKey" TEXT,
    "mimeType" VARCHAR(120),
    "checksum" VARCHAR(128),
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialTopic" (
    "materialId" UUID NOT NULL,
    "topicId" UUID NOT NULL,

    CONSTRAINT "MaterialTopic_pkey" PRIMARY KEY ("materialId","topicId")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "authorId" UUID,
    "boardId" UUID,
    "kind" "QuestionKind" NOT NULL,
    "provenance" "ContentProvenance" NOT NULL,
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "statement" TEXT NOT NULL,
    "explanation" TEXT,
    "year" INTEGER,
    "sourceLabel" VARCHAR(220),
    "copyrightNote" TEXT,
    "aiModel" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" VARCHAR(10) NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTopic" (
    "questionId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionTopic_pkey" PRIMARY KEY ("questionId","topicId")
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'America/Bahia',
    "rulesVersion" INTEGER NOT NULL DEFAULT 1,
    "rules" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlanObjective" (
    "planId" UUID NOT NULL,
    "objectiveId" UUID NOT NULL,
    "priority" SMALLINT NOT NULL DEFAULT 3,

    CONSTRAINT "StudyPlanObjective_pkey" PRIMARY KEY ("planId","objectiveId")
);

-- CreateTable
CREATE TABLE "StudyAvailability" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "dayOfWeek" SMALLINT NOT NULL,
    "startMinute" SMALLINT NOT NULL,
    "endMinute" SMALLINT NOT NULL,

    CONSTRAINT "StudyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanTask" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "topicId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledMinutes" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PLANNED',
    "origin" "TaskOrigin" NOT NULL DEFAULT 'GENERATED',
    "manualLock" BOOLEAN NOT NULL DEFAULT false,
    "generationKey" VARCHAR(120),
    "supersedesId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID,
    "taskId" UUID,
    "objectiveId" UUID,
    "topicId" UUID,
    "kind" "SessionKind" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "sessionId" UUID,
    "selectedOptionIds" UUID[],
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTimeMs" INTEGER,

    CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "easeFactor" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorNotebookEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "questionId" UUID,
    "topicId" UUID,
    "note" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorNotebookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_sessionToken_key" ON "AuthSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "StudyArea_ownerId_archivedAt_idx" ON "StudyArea"("ownerId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudyArea_ownerId_name_key" ON "StudyArea"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ObjectiveType_ownerId_key_key" ON "ObjectiveType"("ownerId", "key");

-- CreateIndex
CREATE INDEX "Objective_ownerId_status_idx" ON "Objective"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Objective_deadline_idx" ON "Objective"("deadline");

-- CreateIndex
CREATE INDEX "ObjectiveMember_userId_idx" ON "ObjectiveMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_country_name_key" ON "Organization"("country", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBoard_name_key" ON "ExamBoard"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_organizationId_name_year_key" ON "Exam"("organizationId", "name", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ExamPosition_examId_name_specialty_key" ON "ExamPosition"("examId", "name", "specialty");

-- CreateIndex
CREATE INDEX "NoticeVersion_status_idx" ON "NoticeVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NoticeVersion_noticeId_version_key" ON "NoticeVersion"("noticeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");

-- CreateIndex
CREATE INDEX "Topic_subjectId_parentId_position_idx" ON "Topic"("subjectId", "parentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_subjectId_parentId_slug_key" ON "Topic"("subjectId", "parentId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "NoticeSubjectRule_noticeVersionId_subjectId_topicId_key" ON "NoticeSubjectRule"("noticeVersionId", "subjectId", "topicId");

-- CreateIndex
CREATE INDEX "Material_authorId_visibility_status_idx" ON "Material"("authorId", "visibility", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialVersion_materialId_version_key" ON "MaterialVersion"("materialId", "version");

-- CreateIndex
CREATE INDEX "Question_authorId_visibility_status_idx" ON "Question"("authorId", "visibility", "status");

-- CreateIndex
CREATE INDEX "Question_boardId_year_idx" ON "Question"("boardId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_label_key" ON "QuestionOption"("questionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_position_key" ON "QuestionOption"("questionId", "position");

-- CreateIndex
CREATE INDEX "StudyPlan_ownerId_active_idx" ON "StudyPlan"("ownerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "StudyAvailability_planId_dayOfWeek_startMinute_key" ON "StudyAvailability"("planId", "dayOfWeek", "startMinute");

-- CreateIndex
CREATE INDEX "PlanTask_planId_scheduledStart_status_idx" ON "PlanTask"("planId", "scheduledStart", "status");

-- CreateIndex
CREATE INDEX "PlanTask_generationKey_idx" ON "PlanTask"("generationKey");

-- CreateIndex
CREATE INDEX "StudySession_userId_startedAt_idx" ON "StudySession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "StudySession_objectiveId_topicId_idx" ON "StudySession"("objectiveId", "topicId");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_answeredAt_idx" ON "QuestionAttempt"("userId", "answeredAt");

-- CreateIndex
CREATE INDEX "QuestionAttempt_questionId_idx" ON "QuestionAttempt"("questionId");

-- CreateIndex
CREATE INDEX "ReviewItem_userId_dueAt_status_idx" ON "ReviewItem"("userId", "dueAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewItem_userId_topicId_key" ON "ReviewItem"("userId", "topicId");

-- CreateIndex
CREATE INDEX "ErrorNotebookEntry_userId_resolvedAt_idx" ON "ErrorNotebookEntry"("userId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyArea" ADD CONSTRAINT "StudyArea_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_studyAreaId_fkey" FOREIGN KEY ("studyAreaId") REFERENCES "StudyArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ObjectiveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveMember" ADD CONSTRAINT "ObjectiveMember_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveMember" ADD CONSTRAINT "ObjectiveMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPosition" ADD CONSTRAINT "ExamPosition_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ExamBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeVersion" ADD CONSTRAINT "NoticeVersion_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticePosition" ADD CONSTRAINT "NoticePosition_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticePosition" ADD CONSTRAINT "NoticePosition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ExamPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveNotice" ADD CONSTRAINT "ObjectiveNotice_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveNotice" ADD CONSTRAINT "ObjectiveNotice_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveSubject" ADD CONSTRAINT "ObjectiveSubject_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveSubject" ADD CONSTRAINT "ObjectiveSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeSubjectRule" ADD CONSTRAINT "NoticeSubjectRule_noticeVersionId_fkey" FOREIGN KEY ("noticeVersionId") REFERENCES "NoticeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeSubjectRule" ADD CONSTRAINT "NoticeSubjectRule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeSubjectRule" ADD CONSTRAINT "NoticeSubjectRule_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialVersion" ADD CONSTRAINT "MaterialVersion_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTopic" ADD CONSTRAINT "MaterialTopic_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTopic" ADD CONSTRAINT "MaterialTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ExamBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanObjective" ADD CONSTRAINT "StudyPlanObjective_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanObjective" ADD CONSTRAINT "StudyPlanObjective_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyAvailability" ADD CONSTRAINT "StudyAvailability_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "PlanTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlanTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorNotebookEntry" ADD CONSTRAINT "ErrorNotebookEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorNotebookEntry" ADD CONSTRAINT "ErrorNotebookEntry_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorNotebookEntry" ADD CONSTRAINT "ErrorNotebookEntry_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain constraints not expressible by the Prisma 7 schema language.
ALTER TABLE "Objective"
  ADD CONSTRAINT "Objective_priority_check" CHECK ("priority" BETWEEN 1 AND 5),
  ADD CONSTRAINT "Objective_archive_state_check" CHECK ("archivedAt" IS NULL OR "status" = 'ARCHIVED');

ALTER TABLE "ObjectiveSubject"
  ADD CONSTRAINT "ObjectiveSubject_priority_check" CHECK ("priority" BETWEEN 1 AND 5),
  ADD CONSTRAINT "ObjectiveSubject_weight_check" CHECK ("weight" > 0);

ALTER TABLE "StudyPlanObjective"
  ADD CONSTRAINT "StudyPlanObjective_priority_check" CHECK ("priority" BETWEEN 1 AND 5);

ALTER TABLE "StudyAvailability"
  ADD CONSTRAINT "StudyAvailability_day_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  ADD CONSTRAINT "StudyAvailability_minutes_check" CHECK (
    "startMinute" BETWEEN 0 AND 1439
    AND "endMinute" BETWEEN 1 AND 1440
    AND "startMinute" < "endMinute"
  );

ALTER TABLE "PlanTask"
  ADD CONSTRAINT "PlanTask_duration_check" CHECK ("scheduledMinutes" > 0),
  ADD CONSTRAINT "PlanTask_not_self_superseding_check" CHECK ("supersedesId" IS NULL OR "supersedesId" <> "id");

ALTER TABLE "StudySession"
  ADD CONSTRAINT "StudySession_time_check" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt"),
  ADD CONSTRAINT "StudySession_duration_check" CHECK ("durationSeconds" IS NULL OR "durationSeconds" >= 0);

ALTER TABLE "QuestionAttempt"
  ADD CONSTRAINT "QuestionAttempt_response_time_check" CHECK ("responseTimeMs" IS NULL OR "responseTimeMs" >= 0);

ALTER TABLE "ReviewItem"
  ADD CONSTRAINT "ReviewItem_interval_check" CHECK ("intervalDays" >= 0),
  ADD CONSTRAINT "ReviewItem_ease_check" CHECK ("easeFactor" > 0),
  ADD CONSTRAINT "ReviewItem_repetitions_check" CHECK ("repetitions" >= 0);

ALTER TABLE "NoticeVersion"
  ADD CONSTRAINT "NoticeVersion_version_check" CHECK ("version" > 0);

ALTER TABLE "Material"
  ADD CONSTRAINT "Material_current_version_check" CHECK ("currentVersion" > 0);

ALTER TABLE "MaterialVersion"
  ADD CONSTRAINT "MaterialVersion_version_check" CHECK ("version" > 0);

-- PostgreSQL unique constraints treat NULL values as distinct. Partial indexes
-- enforce the intended uniqueness for global/root records with nullable keys.
CREATE UNIQUE INDEX "ObjectiveType_global_key_key"
  ON "ObjectiveType" ("key") WHERE "ownerId" IS NULL;

CREATE UNIQUE INDEX "Topic_root_subject_slug_key"
  ON "Topic" ("subjectId", "slug") WHERE "parentId" IS NULL;

CREATE UNIQUE INDEX "NoticeSubjectRule_subject_only_key"
  ON "NoticeSubjectRule" ("noticeVersionId", "subjectId") WHERE "topicId" IS NULL;

CREATE UNIQUE INDEX "Exam_without_year_key"
  ON "Exam" ("organizationId", "name") WHERE "year" IS NULL;

CREATE UNIQUE INDEX "ExamPosition_without_specialty_key"
  ON "ExamPosition" ("examId", "name") WHERE "specialty" IS NULL;

-- A topic may only reference a parent from the same subject and cannot create a cycle.
CREATE FUNCTION "validate_topic_parent"() RETURNS trigger AS $$
DECLARE
  parent_subject uuid;
  creates_cycle boolean;
BEGIN
  IF NEW."parentId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "subjectId" INTO parent_subject FROM "Topic" WHERE "id" = NEW."parentId";
  IF parent_subject IS DISTINCT FROM NEW."subjectId" THEN
    RAISE EXCEPTION 'Topic parent must belong to the same subject';
  END IF;

  WITH RECURSIVE ancestors AS (
    SELECT "id", "parentId" FROM "Topic" WHERE "id" = NEW."parentId"
    UNION ALL
    SELECT topic."id", topic."parentId"
    FROM "Topic" topic
    JOIN ancestors ON topic."id" = ancestors."parentId"
  )
  SELECT EXISTS (SELECT 1 FROM ancestors WHERE "id" = NEW."id") INTO creates_cycle;

  IF creates_cycle THEN
    RAISE EXCEPTION 'Topic hierarchy cannot contain a cycle';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Topic_validate_parent_trigger"
  BEFORE INSERT OR UPDATE OF "parentId", "subjectId" ON "Topic"
  FOR EACH ROW EXECUTE FUNCTION "validate_topic_parent"();

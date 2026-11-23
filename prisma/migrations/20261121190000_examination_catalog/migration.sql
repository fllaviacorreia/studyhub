-- Evolve the foundation catalog without replacing existing identities.
CREATE TYPE "ExaminationStatus" AS ENUM ('PLANNED', 'AUTHORIZED', 'BOARD_DEFINED', 'NOTICE_PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'EXAM_SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "NoticeDocumentType" AS ENUM ('OPENING', 'AMENDMENT', 'RECTIFICATION', 'ANNOUNCEMENT', 'OTHER');

ALTER TABLE "Organization"
  ADD COLUMN "parentOrganizationId" UUID,
  ADD COLUMN "normalizedName" VARCHAR(180),
  ADD COLUMN "description" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Organization" SET "normalizedName" = lower(regexp_replace(trim("name"), '\s+', ' ', 'g'));
ALTER TABLE "Organization" ALTER COLUMN "normalizedName" SET NOT NULL;

ALTER TABLE "ExamBoard"
  ADD COLUMN "normalizedName" VARCHAR(180),
  ADD COLUMN "website" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "ExamBoard" SET "normalizedName" = lower(regexp_replace(trim("name"), '\s+', ' ', 'g'));
ALTER TABLE "ExamBoard" ALTER COLUMN "normalizedName" SET NOT NULL;

ALTER TABLE "Exam" RENAME COLUMN "status" TO "publicationStatus";
ALTER TABLE "Exam"
  ADD COLUMN "examBoardId" UUID,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "status" "ExaminationStatus" NOT NULL DEFAULT 'PLANNED',
  ADD COLUMN "registrationStartAt" TIMESTAMP(3),
  ADD COLUMN "registrationEndAt" TIMESTAMP(3),
  ADD COLUMN "examDate" TIMESTAMP(3),
  ADD COLUMN "officialUrl" TEXT,
  ADD COLUMN "sourceReference" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Preserve the board previously stored on notices when it is unambiguous.
UPDATE "Exam" e SET "examBoardId" = source."boardId"
FROM (
  SELECT "examId", min("boardId"::text)::uuid AS "boardId"
  FROM "Notice" WHERE "boardId" IS NOT NULL GROUP BY "examId" HAVING count(DISTINCT "boardId") = 1
) source WHERE source."examId" = e."id";

ALTER TABLE "ExamPosition"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "educationLevel" VARCHAR(120),
  ADD COLUMN "vacancies" INTEGER,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "Specialization" (
  "id" UUID NOT NULL,
  "positionId" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "vacancies" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);
INSERT INTO "Specialization" ("id", "positionId", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", "specialty", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ExamPosition" WHERE "specialty" IS NOT NULL;
ALTER TABLE "ExamPosition" DROP COLUMN "specialty";

ALTER TABLE "Notice" DROP CONSTRAINT "Notice_boardId_fkey";
ALTER TABLE "Notice"
  ADD COLUMN "originalNoticeId" UUID,
  ADD COLUMN "noticeNumber" VARCHAR(80),
  ADD COLUMN "documentType" "NoticeDocumentType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "officialUrl" TEXT,
  ADD COLUMN "filePath" TEXT,
  ADD COLUMN "sourceReference" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notice" DROP COLUMN "boardId";

ALTER TABLE "NoticeVersion"
  ADD COLUMN "documentUrl" TEXT,
  ADD COLUMN "contentHash" VARCHAR(128),
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "changeDescription" TEXT;

ALTER TABLE "Subject"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Topic"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Objective" ADD COLUMN "examinationId" UUID;

CREATE TABLE "ObjectivePosition" (
  "id" UUID NOT NULL,
  "objectiveId" UUID NOT NULL,
  "positionId" UUID NOT NULL,
  "specializationId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ObjectivePosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Syllabus" (
  "id" UUID NOT NULL,
  "examinationId" UUID NOT NULL,
  "noticeId" UUID,
  "positionId" UUID,
  "specializationId" UUID,
  "title" VARCHAR(200) NOT NULL,
  "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Syllabus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyllabusItem" (
  "id" UUID NOT NULL,
  "syllabusId" UUID NOT NULL,
  "parentItemId" UUID,
  "subjectId" UUID,
  "topicId" UUID,
  "title" VARCHAR(300) NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "weight" DECIMAL(8,3),
  "numberOfQuestions" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SyllabusItem_pkey" PRIMARY KEY ("id")
);

DROP INDEX IF EXISTS "Organization_country_name_key";
DROP INDEX IF EXISTS "ExamBoard_name_key";
DROP INDEX IF EXISTS "ExamPosition_examId_name_specialty_key";
CREATE UNIQUE INDEX "Organization_country_normalizedName_key" ON "Organization"("country", "normalizedName");
CREATE INDEX "Organization_parentOrganizationId_idx" ON "Organization"("parentOrganizationId");
CREATE UNIQUE INDEX "ExamBoard_normalizedName_key" ON "ExamBoard"("normalizedName");
CREATE INDEX "Exam_publicationStatus_status_year_idx" ON "Exam"("publicationStatus", "status", "year");
CREATE INDEX "Exam_examBoardId_idx" ON "Exam"("examBoardId");
CREATE UNIQUE INDEX "ExamPosition_examId_name_key" ON "ExamPosition"("examId", "name");
CREATE UNIQUE INDEX "Specialization_positionId_name_key" ON "Specialization"("positionId", "name");
CREATE INDEX "Notice_examId_status_publishedAt_idx" ON "Notice"("examId", "status", "publishedAt");
CREATE INDEX "Notice_originalNoticeId_idx" ON "Notice"("originalNoticeId");
CREATE INDEX "Objective_ownerId_examinationId_idx" ON "Objective"("ownerId", "examinationId");
CREATE UNIQUE INDEX "ObjectivePosition_objectiveId_positionId_specializationId_key" ON "ObjectivePosition"("objectiveId", "positionId", "specializationId");
CREATE INDEX "ObjectivePosition_positionId_idx" ON "ObjectivePosition"("positionId");
CREATE INDEX "ObjectivePosition_specializationId_idx" ON "ObjectivePosition"("specializationId");
CREATE INDEX "Syllabus_examinationId_status_idx" ON "Syllabus"("examinationId", "status");
CREATE INDEX "Syllabus_positionId_specializationId_idx" ON "Syllabus"("positionId", "specializationId");
CREATE UNIQUE INDEX "SyllabusItem_syllabusId_parentItemId_order_key" ON "SyllabusItem"("syllabusId", "parentItemId", "order");
CREATE INDEX "SyllabusItem_syllabusId_parentItemId_order_idx" ON "SyllabusItem"("syllabusId", "parentItemId", "order");
CREATE INDEX "SyllabusItem_subjectId_topicId_idx" ON "SyllabusItem"("subjectId", "topicId");

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentOrganizationId_fkey" FOREIGN KEY ("parentOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ExamPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_originalNoticeId_fkey" FOREIGN KEY ("originalNoticeId") REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ObjectivePosition" ADD CONSTRAINT "ObjectivePosition_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ObjectivePosition" ADD CONSTRAINT "ObjectivePosition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ExamPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ObjectivePosition" ADD CONSTRAINT "ObjectivePosition_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ExamPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SyllabusItem" ADD CONSTRAINT "SyllabusItem_syllabusId_fkey" FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyllabusItem" ADD CONSTRAINT "SyllabusItem_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "SyllabusItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SyllabusItem" ADD CONSTRAINT "SyllabusItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SyllabusItem" ADD CONSTRAINT "SyllabusItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExamPosition" ADD CONSTRAINT "ExamPosition_vacancies_check" CHECK ("vacancies" IS NULL OR "vacancies" >= 0);
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_vacancies_check" CHECK ("vacancies" IS NULL OR "vacancies" >= 0);
ALTER TABLE "SyllabusItem" ADD CONSTRAINT "SyllabusItem_numbers_check" CHECK (("weight" IS NULL OR "weight" >= 0) AND ("numberOfQuestions" IS NULL OR "numberOfQuestions" >= 0));
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_registration_dates_check" CHECK ("registrationStartAt" IS NULL OR "registrationEndAt" IS NULL OR "registrationStartAt" <= "registrationEndAt");

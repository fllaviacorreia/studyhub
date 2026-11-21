-- CreateEnum
CREATE TYPE "StudyAreaStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "StudyArea"
  ADD COLUMN "icon" VARCHAR(40),
  ADD COLUMN "status" "StudyAreaStatus" NOT NULL DEFAULT 'ACTIVE';

-- Existing archived rows remain semantically archived.
UPDATE "StudyArea" SET "status" = 'ARCHIVED' WHERE "archivedAt" IS NOT NULL;

-- CreateIndex
CREATE INDEX "StudyArea_ownerId_status_idx" ON "StudyArea"("ownerId", "status");
CREATE INDEX "Objective_ownerId_studyAreaId_status_idx" ON "Objective"("ownerId", "studyAreaId", "status");

-- Keep the explicit status and archive timestamp consistent.
ALTER TABLE "StudyArea"
  ADD CONSTRAINT "StudyArea_archive_state_check" CHECK (
    ("status" = 'ARCHIVED' AND "archivedAt" IS NOT NULL)
    OR ("status" = 'ACTIVE' AND "archivedAt" IS NULL)
  );

CREATE TYPE "StudyPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "PlanningStrategy" AS ENUM ('BALANCED', 'PRIORITY_BASED', 'DEADLINE_BASED');
CREATE TYPE "PlanTopicStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE "ActivityType" AS ENUM ('THEORY', 'PRACTICE', 'REVIEW', 'SIMULATION', 'CUSTOM');
CREATE TYPE "PlanningPreviewKind" AS ENUM ('GENERATE', 'REPLAN');
CREATE TYPE "PlanningPreviewStatus" AS ENUM ('PENDING', 'APPLIED', 'EXPIRED', 'CANCELLED');

ALTER TABLE "PlanTask" DROP CONSTRAINT "PlanTask_planId_fkey";
ALTER TABLE "StudyAvailability" DROP CONSTRAINT "StudyAvailability_planId_fkey";
ALTER TABLE "StudyPlan" DROP CONSTRAINT "StudyPlan_ownerId_fkey";
ALTER TABLE "StudyPlanObjective" DROP CONSTRAINT "StudyPlanObjective_planId_fkey";
DROP INDEX "PlanTask_generationKey_idx";
DROP INDEX "PlanTask_planId_scheduledStart_status_idx";
DROP INDEX "StudyPlan_ownerId_active_idx";

ALTER TABLE "StudyPlan"
  ADD COLUMN "archivedAt" TIMESTAMP(3), ADD COLUMN "dailyTargetMinutes" INTEGER,
  ADD COLUMN "description" TEXT, ADD COLUMN "endDate" DATE,
  ADD COLUMN "planningStrategy" "PlanningStrategy" NOT NULL DEFAULT 'BALANCED',
  ADD COLUMN "startDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN "status" "StudyPlanStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1, ADD COLUMN "weeklyTargetMinutes" INTEGER;
UPDATE "StudyPlan" SET "status" = CASE WHEN "active" THEN 'ACTIVE'::"StudyPlanStatus" ELSE 'ARCHIVED'::"StudyPlanStatus" END;
ALTER TABLE "StudyPlan" DROP COLUMN "active", DROP COLUMN "rules", DROP COLUMN "rulesVersion", ALTER COLUMN "startDate" DROP DEFAULT;

ALTER TABLE "StudyPlanObjective" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN "priorityWeight" DECIMAL(8,3) NOT NULL DEFAULT 1;
UPDATE "StudyPlanObjective" SET "priorityWeight" = GREATEST("priority", 1);
ALTER TABLE "StudyPlanObjective" DROP COLUMN "priority";

ALTER TABLE "StudyAvailability" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN "isEnabled" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "StudySession" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PlanTask" ADD COLUMN "activityType" "ActivityType" NOT NULL DEFAULT 'THEORY', ADD COLUMN "completedAt" TIMESTAMP(3), ADD COLUMN "description" TEXT, ADD COLUMN "plannedEndAt" TIMESTAMP(3), ADD COLUMN "scheduledDate" DATE, ADD COLUMN "studyPlanTopicId" UUID;
UPDATE "PlanTask" SET "scheduledDate" = "scheduledStart"::date;
ALTER TABLE "PlanTask" ALTER COLUMN "scheduledDate" SET NOT NULL;

CREATE TABLE "StudyPlanTopic" (
  "id" UUID NOT NULL, "planId" UUID NOT NULL, "topicId" UUID, "syllabusItemId" UUID,
  "customTitle" VARCHAR(200), "customSubject" VARCHAR(160), "estimatedMinutes" INTEGER NOT NULL,
  "priority" SMALLINT NOT NULL DEFAULT 3, "status" "PlanTopicStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudyPlanTopic_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StudyPlanTopicObjective" ("studyPlanTopicId" UUID NOT NULL, "objectiveId" UUID NOT NULL, CONSTRAINT "StudyPlanTopicObjective_pkey" PRIMARY KEY ("studyPlanTopicId", "objectiveId"));
CREATE TABLE "StudyPlanRevision" ("id" UUID NOT NULL, "planId" UUID NOT NULL, "revisionNumber" INTEGER NOT NULL, "reason" VARCHAR(200) NOT NULL, "changeSummary" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "StudyPlanRevision_pkey" PRIMARY KEY ("id"));
CREATE TABLE "PlanningPreview" ("id" UUID NOT NULL, "planId" UUID NOT NULL, "planVersion" INTEGER NOT NULL, "kind" "PlanningPreviewKind" NOT NULL, "status" "PlanningPreviewStatus" NOT NULL DEFAULT 'PENDING', "proposal" JSONB NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "appliedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PlanningPreview_pkey" PRIMARY KEY ("id"));

ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_targets_check" CHECK (("dailyTargetMinutes" IS NULL OR "dailyTargetMinutes" BETWEEN 1 AND 1440) AND ("weeklyTargetMinutes" IS NULL OR "weeklyTargetMinutes" BETWEEN 1 AND 10080) AND ("endDate" IS NULL OR "endDate" >= "startDate"));
ALTER TABLE "StudyPlanObjective" ADD CONSTRAINT "StudyPlanObjective_weight_check" CHECK ("priorityWeight" > 0);
ALTER TABLE "StudyAvailability" ADD CONSTRAINT "StudyAvailability_interval_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6 AND "startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");
ALTER TABLE "StudyPlanTopic" ADD CONSTRAINT "StudyPlanTopic_reference_check" CHECK (num_nonnulls("topicId", "syllabusItemId", "customTitle") = 1 AND "estimatedMinutes" > 0 AND "priority" BETWEEN 1 AND 5 AND (("customTitle" IS NULL AND "customSubject" IS NULL) OR ("customTitle" IS NOT NULL AND "customSubject" IS NOT NULL)));
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_planned_end_check" CHECK ("plannedEndAt" IS NULL OR "plannedEndAt" > "scheduledStart");

CREATE INDEX "StudyPlanTopic_planId_status_priority_idx" ON "StudyPlanTopic"("planId", "status", "priority");
CREATE UNIQUE INDEX "StudyPlanTopic_planId_topicId_key" ON "StudyPlanTopic"("planId", "topicId");
CREATE UNIQUE INDEX "StudyPlanTopic_planId_syllabusItemId_key" ON "StudyPlanTopic"("planId", "syllabusItemId");
CREATE INDEX "StudyPlanTopicObjective_objectiveId_idx" ON "StudyPlanTopicObjective"("objectiveId");
CREATE UNIQUE INDEX "StudyPlanRevision_planId_revisionNumber_key" ON "StudyPlanRevision"("planId", "revisionNumber");
CREATE INDEX "PlanningPreview_planId_status_expiresAt_idx" ON "PlanningPreview"("planId", "status", "expiresAt");
CREATE INDEX "PlanTask_planId_scheduledDate_status_idx" ON "PlanTask"("planId", "scheduledDate", "status");
CREATE UNIQUE INDEX "PlanTask_planId_generationKey_key" ON "PlanTask"("planId", "generationKey");
CREATE INDEX "StudyPlan_ownerId_status_createdAt_idx" ON "StudyPlan"("ownerId", "status", "createdAt");

ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudyPlanObjective" ADD CONSTRAINT "StudyPlanObjective_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudyAvailability" ADD CONSTRAINT "StudyAvailability_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudyPlanTopic" ADD CONSTRAINT "StudyPlanTopic_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudyPlanTopic" ADD CONSTRAINT "StudyPlanTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudyPlanTopic" ADD CONSTRAINT "StudyPlanTopic_syllabusItemId_fkey" FOREIGN KEY ("syllabusItemId") REFERENCES "SyllabusItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudyPlanTopicObjective" ADD CONSTRAINT "StudyPlanTopicObjective_studyPlanTopicId_fkey" FOREIGN KEY ("studyPlanTopicId") REFERENCES "StudyPlanTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudyPlanTopicObjective" ADD CONSTRAINT "StudyPlanTopicObjective_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_studyPlanTopicId_fkey" FOREIGN KEY ("studyPlanTopicId") REFERENCES "StudyPlanTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudyPlanRevision" ADD CONSTRAINT "StudyPlanRevision_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanningPreview" ADD CONSTRAINT "PlanningPreview_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION reject_overlapping_study_availability() RETURNS trigger AS $$
BEGIN
  IF NEW."isEnabled" AND EXISTS (SELECT 1 FROM "StudyAvailability" a WHERE a."planId" = NEW."planId" AND a."dayOfWeek" = NEW."dayOfWeek" AND a."isEnabled" AND a.id <> NEW.id AND int4range(a."startMinute", a."endMinute", '[)') && int4range(NEW."startMinute", NEW."endMinute", '[)')) THEN
    RAISE EXCEPTION 'study availability intervals overlap' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "StudyAvailability_no_overlap" BEFORE INSERT OR UPDATE ON "StudyAvailability" FOR EACH ROW EXECUTE FUNCTION reject_overlapping_study_availability();

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "SeasonRole" AS ENUM ('EMPLOYEE', 'MANAGER');

-- CreateEnum
CREATE TYPE "PlanVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ProjectScope" AS ENUM ('AGREED', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgreementType" AS ENUM ('CORE', 'BONUS');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TaskSourceType" AS ENUM ('MANUAL', 'JIRA', 'API');

-- CreateEnum
CREATE TYPE "AssignmentSource" AS ENUM ('MANAGER_ASSIGNED', 'CUSTOMER_REQUEST', 'STAKEHOLDER_REQUEST', 'SELF_INITIATED', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'FINAL_APPROVED');

-- CreateEnum
CREATE TYPE "PracticeStatus" AS ENUM ('DONE', 'NOT_DONE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('FIGMA', 'DOCUMENT', 'JIRA', 'OTHER_URL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SnapshotScope" AS ENUM ('SPRINT', 'SEASON');

-- CreateEnum
CREATE TYPE "MetricStatus" AS ENUM ('CALCULATED', 'NO_OPPORTUNITY', 'NOT_ENOUGH_DATA');

-- CreateEnum
CREATE TYPE "PerformanceLevel" AS ENUM ('PARTIALLY_ACHIEVED', 'MEETS_EXPECTATIONS', 'EXCEEDS_EXPECTATIONS');

-- CreateEnum
CREATE TYPE "PerformanceReasonCode" AS ENUM ('LIMITED_ALIGNMENT', 'EXECUTION_GAP', 'MIXED_ALIGNMENT_EXECUTION', 'STRONG_EXECUTION', 'STRONG_ALIGNMENT', 'BONUS_ACHIEVEMENT', 'ADDITIONAL_CONTRIBUTION', 'LIMITED_OPPORTUNITY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'ACTIVATED', 'FINALIZED', 'REOPENED', 'CLOSED', 'SNAPSHOT_CREATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "locale" VARCHAR(10) NOT NULL DEFAULT 'fa',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'DRAFT',
    "employee_id" UUID NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "closed_at" TIMESTAMPTZ(6),
    "reopened_at" TIMESTAMPTZ(6),

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_members" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "SeasonRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_plan_versions" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PlanVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "effective_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "scope" "ProjectScope" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_plans" (
    "id" UUID NOT NULL,
    "season_plan_version_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name_snapshot" VARCHAR(160) NOT NULL,
    "description_snapshot" TEXT,
    "weight" DECIMAL(7,4) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_revisions" (
    "id" UUID NOT NULL,
    "agreement_id" UUID NOT NULL,
    "project_plan_id" UUID NOT NULL,
    "season_plan_version_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "agreement_type" "AgreementType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_practices" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "work_practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_practices" (
    "id" UUID NOT NULL,
    "agreement_revision_id" UUID NOT NULL,
    "work_practice_id" UUID NOT NULL,
    "practice_name_snapshot" VARCHAR(160) NOT NULL,
    "practice_description_snapshot" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "sprint_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "season_plan_version_id" UUID NOT NULL,
    "external_code" VARCHAR(120),
    "external_id" VARCHAR(240),
    "source_url" VARCHAR(2048),
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "assignment_source" "AssignmentSource" NOT NULL,
    "source_type" "TaskSourceType" NOT NULL DEFAULT 'MANUAL',
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "finalized_at" TIMESTAMPTZ(6),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_practices" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "work_practice_id" UUID NOT NULL,
    "status" "PracticeStatus" NOT NULL,
    "practice_name_snapshot" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_agreement_matches" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "agreement_revision_id" UUID NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "confidence" DECIMAL(5,4),
    "matched_practice_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_agreement_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_setting_versions" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "meets_expectations_min_core_achievement" DECIMAL(7,4) NOT NULL DEFAULT 80,
    "minimum_aligned_execution" DECIMAL(7,4) NOT NULL DEFAULT 80,
    "bonus_required_for_exceeds" DECIMAL(7,4) NOT NULL DEFAULT 60,
    "additional_contribution_threshold" DECIMAL(7,4) NOT NULL DEFAULT 15,
    "low_alignment_threshold" DECIMAL(7,4) NOT NULL DEFAULT 60,
    "strong_metric_threshold" DECIMAL(7,4) NOT NULL DEFAULT 85,
    "minimum_additional_task_count" INTEGER NOT NULL DEFAULT 2,
    "minimum_observable_project_weight" DECIMAL(7,4) NOT NULL DEFAULT 30,
    "include_self_initiated_in_alignment" BOOLEAN NOT NULL DEFAULT false,
    "effective_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_setting_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_snapshots" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "sprint_id" UUID,
    "scope" "SnapshotScope" NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "as_of" TIMESTAMPTZ(6) NOT NULL,
    "calculation_version" VARCHAR(40) NOT NULL,
    "input_hash" VARCHAR(128) NOT NULL,
    "metric_status" "MetricStatus" NOT NULL,
    "performance_level" "PerformanceLevel",
    "primary_reason" "PerformanceReasonCode",
    "supporting_reasons" "PerformanceReasonCode"[],
    "core_achievement" DECIMAL(7,4),
    "core_opportunity_coverage" DECIMAL(7,4),
    "work_alignment" DECIMAL(7,4),
    "aligned_execution" DECIMAL(7,4),
    "bonus_achievement" DECIMAL(7,4),
    "additional_contribution" DECIMAL(7,4),
    "season_elapsed" DECIMAL(7,4) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_metric_details" (
    "id" UUID NOT NULL,
    "snapshot_id" UUID NOT NULL,
    "metric_key" VARCHAR(80) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "label_snapshot" VARCHAR(300) NOT NULL,
    "numerator" DECIMAL(18,6),
    "denominator" DECIMAL(18,6),
    "value" DECIMAL(18,6),
    "weight" DECIMAL(18,6),
    "contribution" DECIMAL(18,6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshot_metric_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "season_id" UUID,
    "actor_id" UUID NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "seasons_employee_id_status_idx" ON "seasons"("employee_id", "status");

-- CreateIndex
CREATE INDEX "season_members_user_id_role_idx" ON "season_members"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "season_members_season_id_user_id_key" ON "season_members"("season_id", "user_id");

-- CreateIndex
CREATE INDEX "season_plan_versions_season_id_status_effective_at_idx" ON "season_plan_versions"("season_id", "status", "effective_at");

-- CreateIndex
CREATE UNIQUE INDEX "season_plan_versions_season_id_version_key" ON "season_plan_versions"("season_id", "version");

-- CreateIndex
CREATE INDEX "projects_season_id_scope_status_idx" ON "projects"("season_id", "scope", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_season_id_name_key" ON "projects"("season_id", "name");

-- CreateIndex
CREATE INDEX "project_plans_project_id_idx" ON "project_plans"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_plans_season_plan_version_id_project_id_key" ON "project_plans"("season_plan_version_id", "project_id");

-- CreateIndex
CREATE INDEX "agreements_project_id_status_idx" ON "agreements"("project_id", "status");

-- CreateIndex
CREATE INDEX "agreement_revisions_project_plan_id_agreement_type_idx" ON "agreement_revisions"("project_plan_id", "agreement_type");

-- CreateIndex
CREATE INDEX "agreement_revisions_season_plan_version_id_idx" ON "agreement_revisions"("season_plan_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_revisions_agreement_id_revision_key" ON "agreement_revisions"("agreement_id", "revision");

-- CreateIndex
CREATE INDEX "work_practices_owner_id_active_idx" ON "work_practices"("owner_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "work_practices_owner_id_name_key" ON "work_practices"("owner_id", "name");

-- CreateIndex
CREATE INDEX "agreement_practices_work_practice_id_idx" ON "agreement_practices"("work_practice_id");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_practices_agreement_revision_id_work_practice_id_key" ON "agreement_practices"("agreement_revision_id", "work_practice_id");

-- CreateIndex
CREATE INDEX "sprints_season_id_status_idx" ON "sprints"("season_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sprints_season_id_sequence_number_key" ON "sprints"("season_id", "sequence_number");

-- CreateIndex
CREATE INDEX "tasks_season_id_approval_status_finalized_at_idx" ON "tasks"("season_id", "approval_status", "finalized_at");

-- CreateIndex
CREATE INDEX "tasks_project_id_approval_status_idx" ON "tasks"("project_id", "approval_status");

-- CreateIndex
CREATE INDEX "tasks_sprint_id_approval_status_idx" ON "tasks"("sprint_id", "approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_season_id_source_type_external_code_key" ON "tasks"("season_id", "source_type", "external_code");

-- CreateIndex
CREATE INDEX "task_practices_work_practice_id_status_idx" ON "task_practices"("work_practice_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "task_practices_task_id_work_practice_id_key" ON "task_practices"("task_id", "work_practice_id");

-- CreateIndex
CREATE INDEX "evidence_task_id_type_idx" ON "evidence"("task_id", "type");

-- CreateIndex
CREATE INDEX "task_agreement_matches_agreement_revision_id_status_idx" ON "task_agreement_matches"("agreement_revision_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "task_agreement_matches_task_id_agreement_revision_id_key" ON "task_agreement_matches"("task_id", "agreement_revision_id");

-- CreateIndex
CREATE INDEX "performance_setting_versions_season_id_effective_at_idx" ON "performance_setting_versions"("season_id", "effective_at");

-- CreateIndex
CREATE UNIQUE INDEX "performance_setting_versions_season_id_version_key" ON "performance_setting_versions"("season_id", "version");

-- CreateIndex
CREATE INDEX "performance_snapshots_season_id_as_of_idx" ON "performance_snapshots"("season_id", "as_of");

-- CreateIndex
CREATE UNIQUE INDEX "performance_snapshots_season_id_scope_sprint_id_revision_key" ON "performance_snapshots"("season_id", "scope", "sprint_id", "revision");

-- CreateIndex
CREATE INDEX "snapshot_metric_details_snapshot_id_metric_key_idx" ON "snapshot_metric_details"("snapshot_id", "metric_key");

-- CreateIndex
CREATE INDEX "snapshot_metric_details_entity_type_entity_id_idx" ON "snapshot_metric_details"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_season_id_created_at_idx" ON "audit_logs"("season_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_members" ADD CONSTRAINT "season_members_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_members" ADD CONSTRAINT "season_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_plan_versions" ADD CONSTRAINT "season_plan_versions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_plan_versions" ADD CONSTRAINT "season_plan_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_plans" ADD CONSTRAINT "project_plans_season_plan_version_id_fkey" FOREIGN KEY ("season_plan_version_id") REFERENCES "season_plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_plans" ADD CONSTRAINT "project_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_revisions" ADD CONSTRAINT "agreement_revisions_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_revisions" ADD CONSTRAINT "agreement_revisions_project_plan_id_fkey" FOREIGN KEY ("project_plan_id") REFERENCES "project_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_revisions" ADD CONSTRAINT "agreement_revisions_season_plan_version_id_fkey" FOREIGN KEY ("season_plan_version_id") REFERENCES "season_plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_practices" ADD CONSTRAINT "work_practices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_practices" ADD CONSTRAINT "agreement_practices_agreement_revision_id_fkey" FOREIGN KEY ("agreement_revision_id") REFERENCES "agreement_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_practices" ADD CONSTRAINT "agreement_practices_work_practice_id_fkey" FOREIGN KEY ("work_practice_id") REFERENCES "work_practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_season_plan_version_id_fkey" FOREIGN KEY ("season_plan_version_id") REFERENCES "season_plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_practices" ADD CONSTRAINT "task_practices_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_practices" ADD CONSTRAINT "task_practices_work_practice_id_fkey" FOREIGN KEY ("work_practice_id") REFERENCES "work_practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_agreement_matches" ADD CONSTRAINT "task_agreement_matches_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_agreement_matches" ADD CONSTRAINT "task_agreement_matches_agreement_revision_id_fkey" FOREIGN KEY ("agreement_revision_id") REFERENCES "agreement_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_setting_versions" ADD CONSTRAINT "performance_setting_versions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_snapshots" ADD CONSTRAINT "performance_snapshots_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_snapshots" ADD CONSTRAINT "performance_snapshots_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_metric_details" ADD CONSTRAINT "snapshot_metric_details_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "performance_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain constraints that Prisma Schema cannot fully express.
ALTER TABLE "seasons"
  ADD CONSTRAINT "seasons_date_range_check" CHECK ("end_date" >= "start_date"),
  ADD CONSTRAINT "seasons_lock_version_check" CHECK ("lock_version" >= 0);

ALTER TABLE "season_plan_versions"
  ADD CONSTRAINT "season_plan_versions_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "season_plan_versions_publish_dates_check" CHECK (
    ("status" = 'DRAFT' AND "published_at" IS NULL)
    OR ("status" <> 'DRAFT' AND "published_at" IS NOT NULL AND "effective_at" IS NOT NULL)
  );

ALTER TABLE "project_plans"
  ADD CONSTRAINT "project_plans_weight_check" CHECK ("weight" > 0 AND "weight" <= 100);

ALTER TABLE "agreement_revisions"
  ADD CONSTRAINT "agreement_revisions_revision_check" CHECK ("revision" > 0);

ALTER TABLE "sprints"
  ADD CONSTRAINT "sprints_sequence_check" CHECK ("sequence_number" > 0),
  ADD CONSTRAINT "sprints_date_range_check" CHECK ("end_date" >= "start_date");

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_finalized_state_check" CHECK (
    ("approval_status" = 'FINAL_APPROVED' AND "finalized_at" IS NOT NULL)
    OR ("approval_status" <> 'FINAL_APPROVED' AND "finalized_at" IS NULL)
  );

ALTER TABLE "task_agreement_matches"
  ADD CONSTRAINT "task_agreement_matches_confidence_check" CHECK (
    "confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)
  ),
  ADD CONSTRAINT "task_agreement_matches_count_check" CHECK ("matched_practice_count" > 0);

ALTER TABLE "performance_setting_versions"
  ADD CONSTRAINT "performance_setting_versions_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "performance_setting_versions_percentages_check" CHECK (
    "meets_expectations_min_core_achievement" BETWEEN 0 AND 100
    AND "minimum_aligned_execution" BETWEEN 0 AND 100
    AND "bonus_required_for_exceeds" BETWEEN 0 AND 100
    AND "additional_contribution_threshold" BETWEEN 0 AND 100
    AND "low_alignment_threshold" BETWEEN 0 AND 100
    AND "strong_metric_threshold" BETWEEN 0 AND 100
    AND "minimum_observable_project_weight" BETWEEN 0 AND 100
  ),
  ADD CONSTRAINT "performance_setting_versions_task_count_check" CHECK ("minimum_additional_task_count" >= 0);

ALTER TABLE "performance_snapshots"
  ADD CONSTRAINT "performance_snapshots_scope_check" CHECK (
    ("scope" = 'SPRINT' AND "sprint_id" IS NOT NULL)
    OR ("scope" = 'SEASON' AND "sprint_id" IS NULL)
  ),
  ADD CONSTRAINT "performance_snapshots_revision_check" CHECK ("revision" > 0),
  ADD CONSTRAINT "performance_snapshots_percentages_check" CHECK (
    ("core_achievement" IS NULL OR "core_achievement" BETWEEN 0 AND 100)
    AND ("core_opportunity_coverage" IS NULL OR "core_opportunity_coverage" BETWEEN 0 AND 100)
    AND ("work_alignment" IS NULL OR "work_alignment" BETWEEN 0 AND 100)
    AND ("aligned_execution" IS NULL OR "aligned_execution" BETWEEN 0 AND 100)
    AND ("bonus_achievement" IS NULL OR "bonus_achievement" BETWEEN 0 AND 100)
    AND ("additional_contribution" IS NULL OR "additional_contribution" BETWEEN 0 AND 100)
    AND "season_elapsed" BETWEEN 0 AND 100
  );

CREATE UNIQUE INDEX "performance_snapshots_season_revision_unique"
  ON "performance_snapshots" ("season_id", "scope", "revision")
  WHERE "sprint_id" IS NULL;

CREATE INDEX "tasks_final_approved_analytics_idx"
  ON "tasks" ("season_id", "project_id", "sprint_id", "finalized_at")
  WHERE "approval_status" = 'FINAL_APPROVED';

-- A plan can only contain AGREED projects from its own season and may only be edited as DRAFT.
CREATE OR REPLACE FUNCTION "guard_project_plan"()
RETURNS TRIGGER AS $$
DECLARE
  target_plan_id UUID;
  target_project_id UUID;
  plan_status "PlanVersionStatus";
  plan_season_id UUID;
  project_season_id UUID;
  project_scope "ProjectScope";
BEGIN
  target_plan_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."season_plan_version_id" ELSE NEW."season_plan_version_id" END;
  target_project_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."project_id" ELSE NEW."project_id" END;

  SELECT "status", "season_id" INTO plan_status, plan_season_id
  FROM "season_plan_versions" WHERE "id" = target_plan_id;

  IF plan_status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Published or superseded plan versions are immutable';
  END IF;

  IF TG_OP <> 'DELETE' THEN
    SELECT "season_id", "scope" INTO project_season_id, project_scope
    FROM "projects" WHERE "id" = target_project_id;

    IF project_scope <> 'AGREED' OR project_season_id <> plan_season_id THEN
      RAISE EXCEPTION 'Project plans require an AGREED project from the same season';
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "project_plans_guard_trigger"
BEFORE INSERT OR UPDATE OR DELETE ON "project_plans"
FOR EACH ROW EXECUTE FUNCTION "guard_project_plan"();

-- Agreement revisions must stay inside one project/plan boundary and published plans are immutable.
CREATE OR REPLACE FUNCTION "guard_agreement_revision"()
RETURNS TRIGGER AS $$
DECLARE
  target_plan_id UUID;
  target_project_plan_id UUID;
  target_agreement_id UUID;
  plan_status "PlanVersionStatus";
  project_plan_version_id UUID;
  project_plan_project_id UUID;
  agreement_project_id UUID;
BEGIN
  target_plan_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."season_plan_version_id" ELSE NEW."season_plan_version_id" END;
  target_project_plan_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."project_plan_id" ELSE NEW."project_plan_id" END;
  target_agreement_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."agreement_id" ELSE NEW."agreement_id" END;

  SELECT "status" INTO plan_status FROM "season_plan_versions" WHERE "id" = target_plan_id;
  IF plan_status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Published or superseded agreement revisions are immutable';
  END IF;

  IF TG_OP <> 'DELETE' THEN
    SELECT "season_plan_version_id", "project_id"
      INTO project_plan_version_id, project_plan_project_id
    FROM "project_plans" WHERE "id" = target_project_plan_id;
    SELECT "project_id" INTO agreement_project_id
    FROM "agreements" WHERE "id" = target_agreement_id;

    IF project_plan_version_id <> target_plan_id OR project_plan_project_id <> agreement_project_id THEN
      RAISE EXCEPTION 'Agreement revision crosses its project or plan boundary';
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "agreement_revisions_guard_trigger"
BEFORE INSERT OR UPDATE OR DELETE ON "agreement_revisions"
FOR EACH ROW EXECUTE FUNCTION "guard_agreement_revision"();

CREATE OR REPLACE FUNCTION "guard_agreement_practice"()
RETURNS TRIGGER AS $$
DECLARE
  target_revision_id UUID;
  plan_status "PlanVersionStatus";
BEGIN
  target_revision_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."agreement_revision_id" ELSE NEW."agreement_revision_id" END;

  SELECT spv."status" INTO plan_status
  FROM "agreement_revisions" ar
  JOIN "season_plan_versions" spv ON spv."id" = ar."season_plan_version_id"
  WHERE ar."id" = target_revision_id;

  IF plan_status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Expected practices of published plans are immutable';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "agreement_practices_guard_trigger"
BEFORE INSERT OR UPDATE OR DELETE ON "agreement_practices"
FOR EACH ROW EXECUTE FUNCTION "guard_agreement_practice"();

-- Publishing is the database transaction boundary for the official 100% project weights.
CREATE OR REPLACE FUNCTION "validate_plan_before_publish"()
RETURNS TRIGGER AS $$
DECLARE
  project_count INTEGER;
  total_weight NUMERIC;
  incomplete_core_agreement_count INTEGER;
BEGIN
  IF NEW."status" = 'PUBLISHED' AND OLD."status" <> 'PUBLISHED' THEN
    SELECT COUNT(*), COALESCE(SUM("weight"), 0)
      INTO project_count, total_weight
    FROM "project_plans"
    WHERE "season_plan_version_id" = NEW."id";

    IF project_count = 0 OR total_weight <> 100 THEN
      RAISE EXCEPTION 'Published plan project weights must sum exactly to 100';
    END IF;

    SELECT COUNT(*) INTO incomplete_core_agreement_count
    FROM "agreement_revisions" ar
    WHERE ar."season_plan_version_id" = NEW."id"
      AND ar."agreement_type" = 'CORE'
      AND NOT EXISTS (
        SELECT 1 FROM "agreement_practices" ap
        WHERE ap."agreement_revision_id" = ar."id"
      );

    IF incomplete_core_agreement_count > 0 THEN
      RAISE EXCEPTION 'Every core agreement requires at least one expected practice';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "season_plan_versions_publish_trigger"
BEFORE UPDATE OF "status" ON "season_plan_versions"
FOR EACH ROW EXECUTE FUNCTION "validate_plan_before_publish"();

-- Task foreign keys must all point to the same season. Final tasks require at least one practice result.
CREATE OR REPLACE FUNCTION "validate_task_context"()
RETURNS TRIGGER AS $$
DECLARE
  sprint_season_id UUID;
  project_season_id UUID;
  plan_season_id UUID;
  practice_count INTEGER;
BEGIN
  SELECT "season_id" INTO sprint_season_id FROM "sprints" WHERE "id" = NEW."sprint_id";
  SELECT "season_id" INTO project_season_id FROM "projects" WHERE "id" = NEW."project_id";
  SELECT "season_id" INTO plan_season_id FROM "season_plan_versions" WHERE "id" = NEW."season_plan_version_id";

  IF NEW."season_id" <> sprint_season_id
     OR NEW."season_id" <> project_season_id
     OR NEW."season_id" <> plan_season_id THEN
    RAISE EXCEPTION 'Task sprint, project and plan version must belong to the same season';
  END IF;

  IF NEW."approval_status" = 'FINAL_APPROVED'
     AND (TG_OP = 'INSERT' OR OLD."approval_status" <> 'FINAL_APPROVED') THEN
    SELECT COUNT(*) INTO practice_count FROM "task_practices" WHERE "task_id" = NEW."id";
    IF practice_count = 0 THEN
      RAISE EXCEPTION 'Final approved tasks require at least one work practice result';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "tasks_context_trigger"
BEFORE INSERT OR UPDATE ON "tasks"
FOR EACH ROW EXECUTE FUNCTION "validate_task_context"();

-- Main season data is read-only once the season is closed.
CREATE OR REPLACE FUNCTION "guard_closed_season_direct"()
RETURNS TRIGGER AS $$
DECLARE
  target_season_id UUID;
  target_status "SeasonStatus";
BEGIN
  target_season_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."season_id" ELSE NEW."season_id" END;
  SELECT "status" INTO target_status FROM "seasons" WHERE "id" = target_season_id;

  IF target_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Closed season data is read-only';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "projects_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "projects"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_direct"();
CREATE TRIGGER "sprints_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "sprints"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_direct"();
CREATE TRIGGER "tasks_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "tasks"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_direct"();
CREATE TRIGGER "plan_versions_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "season_plan_versions"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_direct"();
CREATE TRIGGER "settings_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "performance_setting_versions"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_direct"();
CREATE TRIGGER "members_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "season_members"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_direct"();

CREATE OR REPLACE FUNCTION "guard_closed_season_task_child"()
RETURNS TRIGGER AS $$
DECLARE
  target_task_id UUID;
  target_status "SeasonStatus";
BEGIN
  target_task_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."task_id" ELSE NEW."task_id" END;
  SELECT s."status" INTO target_status
  FROM "tasks" t JOIN "seasons" s ON s."id" = t."season_id"
  WHERE t."id" = target_task_id;

  IF target_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Closed season task data is read-only';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "task_practices_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "task_practices"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_task_child"();
CREATE TRIGGER "evidence_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "evidence"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_task_child"();
CREATE TRIGGER "task_matches_closed_season_guard"
BEFORE INSERT OR UPDATE OR DELETE ON "task_agreement_matches"
FOR EACH ROW EXECUTE FUNCTION "guard_closed_season_task_child"();

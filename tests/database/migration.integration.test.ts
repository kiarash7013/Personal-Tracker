import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const migrationUrls = [
  new URL("../../prisma/migrations/20260815150000_initial_schema/migration.sql", import.meta.url),
  new URL("../../prisma/migrations/20260816160000_one_active_sprint_per_season/migration.sql", import.meta.url),
];

const ids = {
  employee: "00000000-0000-4000-8000-000000000001",
  season: "00000000-0000-4000-8000-000000000002",
  plan: "00000000-0000-4000-8000-000000000003",
  agreedProjectA: "00000000-0000-4000-8000-000000000004",
  agreedProjectB: "00000000-0000-4000-8000-000000000005",
  additionalProject: "00000000-0000-4000-8000-000000000006",
  projectPlanA: "00000000-0000-4000-8000-000000000007",
  projectPlanB: "00000000-0000-4000-8000-000000000008",
  sprint: "00000000-0000-4000-8000-000000000009",
  taskA: "00000000-0000-4000-8000-000000000010",
  taskB: "00000000-0000-4000-8000-000000000011",
  practice: "00000000-0000-4000-8000-000000000012",
  taskPractice: "00000000-0000-4000-8000-000000000013",
  agreement: "00000000-0000-4000-8000-000000000014",
  agreementRevision: "00000000-0000-4000-8000-000000000015",
  agreementPractice: "00000000-0000-4000-8000-000000000016",
} as const;

let database: PGlite;

async function createBaseFixture() {
  await database.exec(`
    INSERT INTO "users" ("id", "email", "name", "updated_at")
    VALUES ('${ids.employee}', 'employee@example.test', 'کارمند تست', CURRENT_TIMESTAMP);

    INSERT INTO "seasons" (
      "id", "name", "start_date", "end_date", "employee_id", "updated_at"
    ) VALUES (
      '${ids.season}', 'تابستان ۱۴۰۵', DATE '2026-06-22', DATE '2026-10-22',
      '${ids.employee}', CURRENT_TIMESTAMP
    );

    INSERT INTO "season_plan_versions" (
      "id", "season_id", "version", "created_by_id"
    ) VALUES ('${ids.plan}', '${ids.season}', 1, '${ids.employee}');

    INSERT INTO "projects" (
      "id", "season_id", "name", "scope", "updated_at"
    ) VALUES
      ('${ids.agreedProjectA}', '${ids.season}', 'پیشخوان', 'AGREED', CURRENT_TIMESTAMP),
      ('${ids.agreedProjectB}', '${ids.season}', 'بانکداری همراه', 'AGREED', CURRENT_TIMESTAMP),
      ('${ids.additionalProject}', '${ids.season}', 'پروژه خارج توافق', 'ADDITIONAL', CURRENT_TIMESTAMP);

    INSERT INTO "sprints" (
      "id", "season_id", "name", "sequence_number", "start_date", "end_date", "updated_at"
    ) VALUES (
      '${ids.sprint}', '${ids.season}', 'اسپرینت ۱', 1,
      DATE '2026-06-22', DATE '2026-07-19', CURRENT_TIMESTAMP
    );
  `);
}

async function insertProjectPlans(firstWeight: number, secondWeight: number) {
  await database.exec(`
    INSERT INTO "project_plans" (
      "id", "season_plan_version_id", "project_id", "name_snapshot", "weight"
    ) VALUES
      ('${ids.projectPlanA}', '${ids.plan}', '${ids.agreedProjectA}', 'پیشخوان', ${firstWeight}),
      ('${ids.projectPlanB}', '${ids.plan}', '${ids.agreedProjectB}', 'بانکداری همراه', ${secondWeight});
  `);
}

async function insertDraftTask(taskId: string, code: string) {
  await database.exec(`
    INSERT INTO "tasks" (
      "id", "season_id", "sprint_id", "project_id", "season_plan_version_id",
      "external_code", "title", "assignment_source", "source_type", "created_by_id", "updated_at"
    ) VALUES (
      '${taskId}', '${ids.season}', '${ids.sprint}', '${ids.agreedProjectA}', '${ids.plan}',
      '${code}', 'تسک تست', 'MANAGER_ASSIGNED', 'MANUAL', '${ids.employee}', CURRENT_TIMESTAMP
    );
  `);
}

beforeEach(async () => {
  database = new PGlite();
  for (const migrationUrl of migrationUrls) {
    const migration = await readFile(fileURLToPath(migrationUrl), "utf8");
    await database.exec(migration);
  }
  await createBaseFixture();
});

afterEach(async () => {
  await database.close();
});

describe("initial PostgreSQL migration", () => {
  it("rejects an ADDITIONAL project in an official weighted plan", async () => {
    await expect(
      database.exec(`
        INSERT INTO "project_plans" (
          "id", "season_plan_version_id", "project_id", "name_snapshot", "weight"
        ) VALUES (
          '${ids.projectPlanA}', '${ids.plan}', '${ids.additionalProject}', 'خارج توافق', 100
        );
      `),
    ).rejects.toThrow(/AGREED project from the same season/);
  });

  it("rejects publication below 100 percent and accepts exactly 100 percent", async () => {
    await insertProjectPlans(70, 20);

    await expect(
      database.exec(`
        UPDATE "season_plan_versions"
        SET "status" = 'PUBLISHED', "effective_at" = CURRENT_TIMESTAMP, "published_at" = CURRENT_TIMESTAMP
        WHERE "id" = '${ids.plan}';
      `),
    ).rejects.toThrow(/sum exactly to 100/);

    await database.exec(`
      UPDATE "project_plans" SET "weight" = 30 WHERE "id" = '${ids.projectPlanB}';
      UPDATE "season_plan_versions"
      SET "status" = 'PUBLISHED', "effective_at" = CURRENT_TIMESTAMP, "published_at" = CURRENT_TIMESTAMP
      WHERE "id" = '${ids.plan}';
    `);

    const result = await database.query<{ status: string }>(
      `SELECT "status"::text AS status FROM "season_plan_versions" WHERE "id" = $1`,
      [ids.plan],
    );
    expect(result.rows[0]?.status).toBe("PUBLISHED");
  });

  it("enforces task code uniqueness inside season and source", async () => {
    await insertDraftTask(ids.taskA, "CXS-345");

    await expect(insertDraftTask(ids.taskB, "CXS-345")).rejects.toThrow(
      /tasks_season_id_source_type_external_code_key|duplicate key/,
    );
  });

  it("does not allow finalization before a work-practice result exists", async () => {
    await insertDraftTask(ids.taskA, "CXS-346");

    await expect(
      database.exec(`
        UPDATE "tasks"
        SET "approval_status" = 'FINAL_APPROVED', "finalized_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = '${ids.taskA}';
      `),
    ).rejects.toThrow(/require at least one work practice result/);

    await database.exec(`
      INSERT INTO "work_practices" ("id", "owner_id", "name", "updated_at")
      VALUES ('${ids.practice}', '${ids.employee}', 'تحلیل', CURRENT_TIMESTAMP);

      INSERT INTO "task_practices" (
        "id", "task_id", "work_practice_id", "status", "practice_name_snapshot", "updated_at"
      ) VALUES (
        '${ids.taskPractice}', '${ids.taskA}', '${ids.practice}', 'DONE', 'تحلیل', CURRENT_TIMESTAMP
      );

      UPDATE "tasks"
      SET "approval_status" = 'FINAL_APPROVED', "finalized_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = '${ids.taskA}';
    `);

    const result = await database.query<{ status: string }>(
      `SELECT "approval_status"::text AS status FROM "tasks" WHERE "id" = $1`,
      [ids.taskA],
    );
    expect(result.rows[0]?.status).toBe("FINAL_APPROVED");
  });

  it("protects task data after its season is closed", async () => {
    await insertDraftTask(ids.taskA, "CXS-347");
    await database.exec(`UPDATE "seasons" SET "status" = 'CLOSED', "closed_at" = CURRENT_TIMESTAMP WHERE "id" = '${ids.season}';`);

    await expect(
      database.exec(`UPDATE "tasks" SET "title" = 'تغییر غیرمجاز', "updated_at" = CURRENT_TIMESTAMP WHERE "id" = '${ids.taskA}';`),
    ).rejects.toThrow(/Closed season data is read-only/);
  });

  it("keeps published agreement mappings immutable and preserves practice labels", async () => {
    await insertProjectPlans(60, 40);
    await database.exec(`
      INSERT INTO "work_practices" ("id", "owner_id", "name", "updated_at")
      VALUES ('${ids.practice}', '${ids.employee}', 'تحلیل', CURRENT_TIMESTAMP);

      INSERT INTO "agreements" ("id", "project_id", "updated_at")
      VALUES ('${ids.agreement}', '${ids.agreedProjectA}', CURRENT_TIMESTAMP);

      INSERT INTO "agreement_revisions" (
        "id", "agreement_id", "project_plan_id", "season_plan_version_id",
        "revision", "title", "agreement_type"
      ) VALUES (
        '${ids.agreementRevision}', '${ids.agreement}', '${ids.projectPlanA}', '${ids.plan}',
        1, 'تحلیل کامل درخواست', 'CORE'
      );

      INSERT INTO "agreement_practices" (
        "id", "agreement_revision_id", "work_practice_id", "practice_name_snapshot"
      ) VALUES (
        '${ids.agreementPractice}', '${ids.agreementRevision}', '${ids.practice}', 'تحلیل'
      );

      UPDATE "season_plan_versions"
      SET "status" = 'PUBLISHED', "effective_at" = CURRENT_TIMESTAMP, "published_at" = CURRENT_TIMESTAMP
      WHERE "id" = '${ids.plan}';

      UPDATE "work_practices" SET "name" = 'تحلیل محصول', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = '${ids.practice}';
    `);

    await expect(
      database.exec(`UPDATE "agreement_revisions" SET "title" = 'بازنویسی تاریخی' WHERE "id" = '${ids.agreementRevision}';`),
    ).rejects.toThrow(/published.*immutable/i);

    const snapshot = await database.query<{ name: string }>(
      `SELECT "practice_name_snapshot" AS name FROM "agreement_practices" WHERE "id" = $1`,
      [ids.agreementPractice],
    );
    expect(snapshot.rows[0]?.name).toBe("تحلیل");
  });

  it("allows only one active sprint in a season", async () => {
    await database.exec(`UPDATE "sprints" SET "status" = 'ACTIVE' WHERE "id" = '${ids.sprint}';`);

    await expect(database.exec(`
      INSERT INTO "sprints" (
        "id", "season_id", "name", "sequence_number", "start_date", "end_date", "status", "updated_at"
      ) VALUES (
        '00000000-0000-4000-8000-000000000099', '${ids.season}', 'اسپرینت فعال دوم', 2,
        DATE '2026-07-20', DATE '2026-08-16', 'ACTIVE', CURRENT_TIMESTAMP
      );
    `)).rejects.toThrow(/sprints_one_active_per_season_idx|duplicate key/i);
  });
});

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authenticateUser } from "../../src/modules/authentication/application/authenticate-user";
import {
  hashPassword,
  verifyPassword,
} from "../../src/modules/authentication/infrastructure/password";

const migrationUrls = [
  new URL("../../prisma/migrations/20260815150000_initial_schema/migration.sql", import.meta.url),
  new URL("../../prisma/migrations/20260815163000_authentication/migration.sql", import.meta.url),
];

const userId = "00000000-0000-4000-8000-000000000101";
let database: PGlite;

beforeEach(async () => {
  database = new PGlite();

  for (const migrationUrl of migrationUrls) {
    const migration = await readFile(fileURLToPath(migrationUrl), "utf8");
    await database.exec(migration);
  }
});

afterEach(async () => {
  await database.close();
});

describe("authentication migration", () => {
  it("keeps existing users valid while adding an optional password hash", async () => {
    await database.exec(`
      INSERT INTO "users" ("id", "email", "name", "updated_at")
      VALUES ('${userId}', 'legacy@example.test', 'کاربر قدیمی', CURRENT_TIMESTAMP);
    `);

    const result = await database.query<{ passwordHash: string | null }>(
      `SELECT "password_hash" AS "passwordHash" FROM "users" WHERE "id" = $1`,
      [userId],
    );

    expect(result.rows[0]?.passwordHash).toBeNull();
  });

  it("authenticates an active database user with the migrated password field", async () => {
    const passwordHash = await hashPassword("Integration-password-42!");
    await database.query(
      `INSERT INTO "users" ("id", "email", "name", "password_hash", "updated_at")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [userId, "employee@example.test", "کارمند تست", passwordHash],
    );

    const result = await authenticateUser(
      { email: "employee@example.test", password: "Integration-password-42!" },
      {
        findUserByEmail: async (email) => {
          const query = await database.query<{
            id: string;
            email: string;
            name: string;
            active: boolean;
            passwordHash: string | null;
          }>(
            `SELECT "id"::text, "email", "name", "active", "password_hash" AS "passwordHash"
             FROM "users" WHERE "email" = $1`,
            [email],
          );
          return query.rows[0] ?? null;
        },
        verifyPassword,
      },
    );

    expect(result).toEqual({
      id: userId,
      email: "employee@example.test",
      name: "کارمند تست",
    });
  });

  it("enforces the storage limit for password hashes", async () => {
    await expect(
      database.query(
        `INSERT INTO "users" ("id", "email", "name", "password_hash", "updated_at")
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [userId, "employee@example.test", "کارمند تست", "x".repeat(256)],
      ),
    ).rejects.toThrow(/value too long|character varying\(255\)/iu);
  });
});

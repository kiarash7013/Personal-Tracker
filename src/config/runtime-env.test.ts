import { describe, expect, it } from "vitest";
import { parseDatabaseEnv } from "./runtime-env";

const databaseUrl = "postgresql://user:password@example.test:5432/app?sslmode=require";

describe("database environment", () => {
  it("uses conservative pool defaults", () => {
    expect(parseDatabaseEnv({ DATABASE_URL: databaseUrl })).toEqual({
      DATABASE_URL: databaseUrl,
      DATABASE_POOL_MAX: 5,
      DATABASE_CONNECTION_TIMEOUT_MS: 10_000,
      DATABASE_IDLE_TIMEOUT_MS: 30_000,
    });
  });

  it("accepts bounded overrides", () => {
    expect(parseDatabaseEnv({
      DATABASE_URL: databaseUrl,
      DATABASE_POOL_MAX: "8",
      DATABASE_CONNECTION_TIMEOUT_MS: "5000",
      DATABASE_IDLE_TIMEOUT_MS: "45000",
    })).toMatchObject({
      DATABASE_POOL_MAX: 8,
      DATABASE_CONNECTION_TIMEOUT_MS: 5_000,
      DATABASE_IDLE_TIMEOUT_MS: 45_000,
    });
  });

  it.each([
    {},
    { DATABASE_URL: "https://example.test/database" },
    { DATABASE_URL: databaseUrl, DATABASE_POOL_MAX: "0" },
    { DATABASE_URL: databaseUrl, DATABASE_CONNECTION_TIMEOUT_MS: "100" },
  ])("rejects unsafe values", (env) => {
    expect(() => parseDatabaseEnv(env)).toThrow("Invalid database environment configuration");
  });
});

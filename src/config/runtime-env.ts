import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).refine((value) => {
    try {
      return ["postgres:", "postgresql:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "must be a valid PostgreSQL connection URL"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(300_000).default(30_000),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function parseDatabaseEnv(env: Record<string, string | undefined>): DatabaseEnv {
  const result = databaseEnvSchema.safeParse(env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid database environment configuration: ${details}`);
  }

  return result.data;
}

export function getDatabaseEnv() {
  return parseDatabaseEnv(process.env);
}

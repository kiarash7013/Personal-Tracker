import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { getDatabaseEnv } from "@/config/runtime-env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const env = getDatabaseEnv();

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_MAX,
      connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,
      idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
      keepAlive: true,
    }),
    transactionOptions: {
      maxWait: 10_000,
      timeout: 20_000,
    },
  });

  globalForPrisma.prisma = prisma;

  return prisma;
}

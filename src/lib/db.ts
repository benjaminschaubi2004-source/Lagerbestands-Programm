import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

export function getDbPool(): Pool {
  if (globalForPrisma.pgPool) {
    return globalForPrisma.pgPool;
  }

  const rawUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/postgres";

  const connectionString = rawUrl.replace(/\[|\]/g, "");

  const pool = new Pool({
    connectionString,
    ssl:
      connectionString.includes("supabase.co") ||
      connectionString.includes("pooler.supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return pool;
}

export function getPrismaClient(): PrismaClient {
  // Falls die gecachte Instanz noch aus der Zeit vor Auto stammt, verwerfen
  if (globalForPrisma.prisma && (globalForPrisma.prisma as any).auto) {
    return globalForPrisma.prisma;
  }

  const pool = getDbPool();
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Proxy stellt sicher, dass db immer eine aktuelle Instanz verwendet
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});

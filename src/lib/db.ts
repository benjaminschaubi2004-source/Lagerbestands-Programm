import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const rawUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/postgres";

  // Bereinige versehentliche eckige Klammern [ ] aus Platzhaltern
  const connectionString = rawUrl.replace(/\[|\]/g, "");

  const pool = new Pool({
    connectionString,
    ssl:
      connectionString.includes("supabase.co") ||
      connectionString.includes("pooler.supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const db = getPrismaClient();

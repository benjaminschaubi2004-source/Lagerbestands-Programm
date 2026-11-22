import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function run() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL ist nicht gesetzt!");
  }

  const connectionString = rawUrl.replace(/\[|\]/g, "");
  const pool = new Pool({
    connectionString,
    ssl:
      connectionString.includes("supabase.co") ||
      connectionString.includes("pooler.supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const client = await pool.connect();
  try {
    console.log("Verbindung zur Datenbank erfolgreich.");

    const sql = `
      CREATE TABLE IF NOT EXISTS "Auto" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "kennzeichen" TEXT,
        "modell" TEXT,
        "defekte" TEXT,
        "tuevTermin" TIMESTAMP(3),
        "anmerkungen" TEXT,
        "kilometerstand" INTEGER,
        "status" TEXT NOT NULL DEFAULT 'BEREIT',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Auto_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "Auto_name_idx" ON "Auto"("name");
    `;

    await client.query(sql);
    console.log("Tabelle 'Auto' erfolgreich angelegt oder existiert bereits.");

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Auto'
      ORDER BY ordinal_position;
    `);
    console.log("Spalten in Tabelle 'Auto':", res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Fehler:", err);
  process.exit(1);
});

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

    await client.query("BEGIN");

    // 1. Zähle vorherige Datensätze
    const countVarianten = await client.query('SELECT COUNT(*) FROM "MaterialVariante"');
    const countBuchungen = await client.query('SELECT COUNT(*) FROM "Buchung"');
    const countActivity = await client.query('SELECT COUNT(*) FROM "ActivityLog"');

    console.log(`Vorher:`);
    console.log(`- Material-Varianten: ${countVarianten.rows[0].count}`);
    console.log(`- Buchungen: ${countBuchungen.rows[0].count}`);
    console.log(`- Aktivitäts-Logs: ${countActivity.rows[0].count}`);

    // 2. Setze Mindestbestand und Ist-Bestand auf 0
    const updateRes = await client.query(`
      UPDATE "MaterialVariante"
      SET "mindestbestand" = 0, "istBestand" = 0, "updatedAt" = NOW()
    `);
    console.log(`Aktualisierte Material-Varianten (Bestand & Mindestbestand auf 0): ${updateRes.rowCount}`);

    // 3. Lösche alle Buchungen (Eingänge & Ausgänge / Bewegungs-Log)
    const delBuchungen = await client.query('DELETE FROM "Buchung"');
    console.log(`Gelöschte Buchungen: ${delBuchungen.rowCount}`);

    // 4. Lösche alle Aktivitäts-Logs
    const delActivity = await client.query('DELETE FROM "ActivityLog"');
    console.log(`Gelöschte Aktivitäts-Logs: ${delActivity.rowCount}`);

    await client.query("COMMIT");
    console.log("Transaktion erfolgreich abgeschlossen.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Fehler aufgetreten, Rollback durchgeführt:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

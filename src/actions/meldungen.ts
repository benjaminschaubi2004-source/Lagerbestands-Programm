"use server";

import { db, getDbPool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/logs";

export interface MeldungItem {
  id: number;
  titel: string;
  kategorie: "IDEE" | "PROBLEM" | "BESCHWERDE" | "SONSTIGES" | string;
  nachricht: string;
  bereich: "MONTEUR" | "OFFICE" | string;
  absenderName: string;
  prioritaet: "NORMAL" | "WICHTIG" | "DRINGEND" | string;
  status: "OFFEN" | "IN_BEARBEITUNG" | "ERLEDIGT" | string;
  antwort: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeldungInput {
  titel: string;
  kategorie: "IDEE" | "PROBLEM" | "BESCHWERDE" | "SONSTIGES" | string;
  nachricht: string;
  bereich: "MONTEUR" | "OFFICE" | string;
  absenderName: string;
  prioritaet?: "NORMAL" | "WICHTIG" | "DRINGEND" | string;
}

export interface UpdateMeldungInput {
  status?: "OFFEN" | "IN_BEARBEITUNG" | "ERLEDIGT" | string;
  antwort?: string | null;
}

function mapRowToMeldung(row: any): MeldungItem {
  return {
    id: row.id,
    titel: row.titel,
    kategorie: row.kategorie,
    nachricht: row.nachricht,
    bereich: row.bereich,
    absenderName: row.absenderName,
    prioritaet: row.prioritaet || "NORMAL",
    status: row.status || "OFFEN",
    antwort: row.antwort ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * Stellt sicher, dass die Tabelle "Meldung" in PostgreSQL existiert
 */
export async function ensureMeldungTable(): Promise<void> {
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Meldung" (
      "id" SERIAL PRIMARY KEY,
      "titel" TEXT NOT NULL,
      "kategorie" TEXT NOT NULL,
      "nachricht" TEXT NOT NULL,
      "bereich" TEXT NOT NULL,
      "absenderName" TEXT NOT NULL,
      "prioritaet" TEXT NOT NULL DEFAULT 'NORMAL',
      "status" TEXT NOT NULL DEFAULT 'OFFEN',
      "antwort" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Alle Meldungen abrufen (neueste zuerst)
 */
export async function getMeldungen(): Promise<MeldungItem[]> {
  try {
    await ensureMeldungTable();
  } catch (err) {
    console.warn("Hinweis beim Sicherstellen der Meldung-Tabelle:", err);
  }

  try {
    if ((db as any)?.meldung?.findMany) {
      const list = await (db as any).meldung.findMany({
        orderBy: [{ createdAt: "desc" }],
      });
      return list;
    }
  } catch (error) {
    console.warn("Prisma db.meldung noch nicht initialisiert, nutze Pool-Fallback:", error);
  }

  try {
    const pool = getDbPool();
    const res = await pool.query('SELECT * FROM "Meldung" ORDER BY "createdAt" DESC');
    return res.rows.map(mapRowToMeldung);
  } catch (err) {
    console.error("Fehler beim Laden der Meldungen aus Postgres:", err);
    return [];
  }
}

/**
 * Neue Meldung erstellen (vom Monteur oder Office)
 */
export async function createMeldung(input: CreateMeldungInput): Promise<{
  success: boolean;
  error?: string;
  meldung?: MeldungItem;
}> {
  const trimmedTitel = input.titel?.trim();
  const trimmedNachricht = input.nachricht?.trim();
  const trimmedAbsender = input.absenderName?.trim() || "Unbekannt";
  const kategorie = input.kategorie?.trim() || "SONSTIGES";
  const bereich = input.bereich?.trim() || "MONTEUR";
  const prioritaet = input.prioritaet?.trim() || "NORMAL";

  if (!trimmedTitel) {
    return { success: false, error: "Bitte gib einen Titel bzw. Betreff für deine Meldung ein." };
  }
  if (!trimmedNachricht) {
    return { success: false, error: "Bitte beschreibe dein Anliegen oder deinen Vorschlag." };
  }

  try {
    await ensureMeldungTable();

    let newMeldung: MeldungItem;

    if ((db as any)?.meldung?.create) {
      newMeldung = await (db as any).meldung.create({
        data: {
          titel: trimmedTitel,
          kategorie,
          nachricht: trimmedNachricht,
          bereich,
          absenderName: trimmedAbsender,
          prioritaet,
          status: "OFFEN",
        },
      });
    } else {
      const pool = getDbPool();
      const insertSql = `
        INSERT INTO "Meldung"
          ("titel", "kategorie", "nachricht", "bereich", "absenderName", "prioritaet", "status", "createdAt", "updatedAt")
        VALUES
          ($1, $2, $3, $4, $5, $6, 'OFFEN', NOW(), NOW())
        RETURNING *;
      `;
      const res = await pool.query(insertSql, [
        trimmedTitel,
        kategorie,
        trimmedNachricht,
        bereich,
        trimmedAbsender,
        prioritaet,
      ]);
      newMeldung = mapRowToMeldung(res.rows[0]);
    }

    // Kategorie-Klartext für ActivityLog
    const katName =
      kategorie === "IDEE"
        ? "Idee / Vorschlag"
        : kategorie === "PROBLEM"
        ? "Problem / Fehler"
        : kategorie === "BESCHWERDE"
        ? "Beschwerde / Anmerkung"
        : "Sonstiges";

    await logActivity({
      bereich: bereich === "OFFICE" ? "OFFICE" : "TECHNIKER",
      aktion: "MELDUNG_GESENDET",
      beschreibung: `${katName} eingereicht von ${trimmedAbsender}: "${trimmedTitel}"`,
      details: trimmedNachricht.length > 120 ? `${trimmedNachricht.slice(0, 120)}...` : trimmedNachricht,
    });

    revalidatePath("/admin");
    revalidatePath("/office");
    revalidatePath("/monteur");
    revalidatePath("/techniker");
    revalidatePath("/");

    return { success: true, meldung: newMeldung };
  } catch (error: any) {
    console.error("Fehler beim Erstellen der Meldung:", error);
    return { success: false, error: error.message || "Fehler beim Speichern der Meldung in der Datenbank." };
  }
}

/**
 * Status oder Antwort einer Meldung durch den Admin aktualisieren
 */
export async function updateMeldungStatus(
  id: number,
  input: UpdateMeldungInput
): Promise<{ success: boolean; error?: string; meldung?: MeldungItem }> {
  try {
    await ensureMeldungTable();

    const pool = getDbPool();
    const existingRes = await pool.query('SELECT * FROM "Meldung" WHERE id = $1', [id]);
    if (!existingRes.rows[0]) {
      return { success: false, error: "Meldung nicht gefunden." };
    }

    const current = mapRowToMeldung(existingRes.rows[0]);
    const nextStatus = input.status !== undefined ? input.status : current.status;
    const nextAntwort = input.antwort !== undefined ? input.antwort : current.antwort;

    let updated: MeldungItem;

    if ((db as any)?.meldung?.update) {
      updated = await (db as any).meldung.update({
        where: { id },
        data: {
          status: nextStatus,
          antwort: nextAntwort,
        },
      });
    } else {
      const updateSql = `
        UPDATE "Meldung"
        SET "status" = $1, "antwort" = $2, "updatedAt" = NOW()
        WHERE id = $3
        RETURNING *;
      `;
      const res = await pool.query(updateSql, [nextStatus, nextAntwort, id]);
      updated = mapRowToMeldung(res.rows[0]);
    }

    await logActivity({
      bereich: "ADMIN",
      aktion: "MELDUNG_STATUS_UPDATE",
      beschreibung: `Meldung #${id} ("${updated.titel}") auf Status "${nextStatus}" gesetzt.`,
      details: nextAntwort ? `Admin-Notiz: ${nextAntwort}` : undefined,
    });

    revalidatePath("/admin");
    revalidatePath("/office");
    revalidatePath("/monteur");
    revalidatePath("/techniker");

    return { success: true, meldung: updated };
  } catch (error: any) {
    console.error("Fehler beim Aktualisieren der Meldung:", error);
    return { success: false, error: error.message || "Fehler beim Aktualisieren." };
  }
}

/**
 * Meldung löschen (nur Admin)
 */
export async function deleteMeldung(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureMeldungTable();

    const pool = getDbPool();
    const existingRes = await pool.query('SELECT * FROM "Meldung" WHERE id = $1', [id]);
    const titel = existingRes.rows[0]?.titel || `#${id}`;

    await pool.query('DELETE FROM "Meldung" WHERE id = $1', [id]);

    await logActivity({
      bereich: "ADMIN",
      aktion: "MELDUNG_DELETE",
      beschreibung: `Meldung #${id} ("${titel}") gelöscht.`,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Fehler beim Löschen der Meldung:", error);
    return { success: false, error: error.message || "Fehler beim Löschen der Meldung." };
  }
}

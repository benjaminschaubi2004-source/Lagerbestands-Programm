"use server";

import { db, getDbPool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/logs";

export interface AutoItem {
  id: number;
  name: string;
  kennzeichen: string | null;
  modell: string | null;
  defekte: string | null;
  tuevTermin: Date | null;
  anmerkungen: string | null;
  kilometerstand: number | null;
  status: string; // "BEREIT" | "DEFEKT" | "WERKSTATT" | "TUEV_FAELLIG"
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAutoInput {
  name: string;
  kennzeichen?: string | null;
  modell?: string | null;
  defekte?: string | null;
  tuevTermin?: string | Date | null;
  anmerkungen?: string | null;
  kilometerstand?: number | null;
  status?: string;
}

export interface UpdateAutoInput {
  name: string;
  kennzeichen?: string | null;
  modell?: string | null;
  defekte?: string | null;
  tuevTermin?: string | Date | null;
  anmerkungen?: string | null;
  kilometerstand?: number | null;
  status?: string;
}

/**
 * Hilfsfunktion: Konvertiert DB-Zeilen in AutoItem
 */
function mapRowToAuto(row: any): AutoItem {
  return {
    id: row.id,
    name: row.name,
    kennzeichen: row.kennzeichen ?? null,
    modell: row.modell ?? null,
    defekte: row.defekte ?? null,
    tuevTermin: row.tuevTermin ? new Date(row.tuevTermin) : null,
    anmerkungen: row.anmerkungen ?? null,
    kilometerstand:
      row.kilometerstand !== null && row.kilometerstand !== undefined
        ? Number(row.kilometerstand)
        : null,
    status: row.status || "BEREIT",
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * Hilfsfunktion zum Parsen des TÜV-Datums
 */
function parseTuevDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Alle Fahrzeuge abrufen
 */
export async function getAutos(): Promise<AutoItem[]> {
  try {
    if ((db as any)?.auto?.findMany) {
      const list = await db.auto.findMany({
        orderBy: [{ name: "asc" }],
      });
      return list;
    }
  } catch (error) {
    console.warn("Hinweis: Prisma db.auto noch nicht verfügbar, verwende Fallback-Verbindung:", error);
  }

  // Direkte PostgreSQL-Fallback-Abfrage
  try {
    const pool = getDbPool();
    const res = await pool.query('SELECT * FROM "Auto" ORDER BY "name" ASC');
    return res.rows.map(mapRowToAuto);
  } catch (err) {
    console.error("Fehler beim Laden der Fahrzeuge aus Postgres:", err);
    return [];
  }
}

/**
 * Einzelnes Fahrzeug anhand der ID abrufen
 */
export async function getAutoById(id: number): Promise<AutoItem | null> {
  try {
    if ((db as any)?.auto?.findUnique) {
      const item = await db.auto.findUnique({
        where: { id },
      });
      return item;
    }
  } catch {}

  try {
    const pool = getDbPool();
    const res = await pool.query('SELECT * FROM "Auto" WHERE id = $1', [id]);
    return res.rows[0] ? mapRowToAuto(res.rows[0]) : null;
  } catch (err) {
    console.error("Fehler beim Abrufen des Autos:", err);
    return null;
  }
}

/**
 * Neues Auto anlegen
 */
export async function createAuto(input: CreateAutoInput): Promise<{
  success: boolean;
  error?: string;
  auto?: AutoItem;
}> {
  const trimmedName = input.name?.trim();
  if (!trimmedName) {
    return { success: false, error: "Bitte geben Sie einen Namen bzw. eine Bezeichnung für das Auto an." };
  }

  const parsedTuev = parseTuevDate(input.tuevTermin);
  const km =
    input.kilometerstand !== undefined &&
    input.kilometerstand !== null &&
    !isNaN(Number(input.kilometerstand))
      ? Math.max(0, Math.floor(Number(input.kilometerstand)))
      : null;

  const vehicleStatus = input.status?.trim() || (input.defekte?.trim() ? "DEFEKT" : "BEREIT");

  try {
    let newAuto: AutoItem;

    if ((db as any)?.auto?.create) {
      newAuto = await db.auto.create({
        data: {
          name: trimmedName,
          kennzeichen: input.kennzeichen?.trim() || null,
          modell: input.modell?.trim() || null,
          defekte: input.defekte?.trim() || null,
          tuevTermin: parsedTuev,
          anmerkungen: input.anmerkungen?.trim() || null,
          kilometerstand: km,
          status: vehicleStatus,
        },
      });
    } else {
      // Robuster direkter SQL-Insert (falls laufender Server noch alten PrismaClient im Speicher hält)
      const pool = getDbPool();
      const insertSql = `
        INSERT INTO "Auto" 
          ("name", "kennzeichen", "modell", "defekte", "tuevTermin", "anmerkungen", "kilometerstand", "status", "createdAt", "updatedAt")
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
      `;
      const res = await pool.query(insertSql, [
        trimmedName,
        input.kennzeichen?.trim() || null,
        input.modell?.trim() || null,
        input.defekte?.trim() || null,
        parsedTuev,
        input.anmerkungen?.trim() || null,
        km,
        vehicleStatus,
      ]);
      newAuto = mapRowToAuto(res.rows[0]);
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "AUTO_CREATE",
      beschreibung: `Neues Fahrzeug angelegt: "${trimmedName}"${input.kennzeichen ? ` (${input.kennzeichen.trim()})` : ""}.`,
      details: input.defekte ? `Defekte: ${input.defekte}` : undefined,
    });

    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, auto: newAuto };
  } catch (error: any) {
    console.error("Fehler beim Anlegen des Autos:", error);
    return { success: false, error: error.message || "Fehler beim Speichern in der Datenbank." };
  }
}

/**
 * Bestehendes Auto aktualisieren
 */
export async function updateAuto(
  id: number,
  input: UpdateAutoInput
): Promise<{ success: boolean; error?: string; auto?: AutoItem }> {
  const trimmedName = input.name?.trim();
  if (!trimmedName) {
    return { success: false, error: "Der Name des Autos darf nicht leer sein." };
  }

  const parsedTuev = parseTuevDate(input.tuevTermin);
  const km =
    input.kilometerstand !== undefined &&
    input.kilometerstand !== null &&
    !isNaN(Number(input.kilometerstand))
      ? Math.max(0, Math.floor(Number(input.kilometerstand)))
      : null;

  try {
    let updated: AutoItem;

    if ((db as any)?.auto?.update) {
      const existing = await db.auto.findUnique({ where: { id } });
      if (!existing) {
        return { success: false, error: "Fahrzeug wurde nicht gefunden." };
      }

      updated = await db.auto.update({
        where: { id },
        data: {
          name: trimmedName,
          kennzeichen: input.kennzeichen?.trim() || null,
          modell: input.modell?.trim() || null,
          defekte: input.defekte?.trim() || null,
          tuevTermin: parsedTuev,
          anmerkungen: input.anmerkungen?.trim() || null,
          kilometerstand: km,
          status: input.status?.trim() || existing.status,
        },
      });
    } else {
      const pool = getDbPool();
      const existingRes = await pool.query('SELECT * FROM "Auto" WHERE id = $1', [id]);
      if (!existingRes.rows[0]) {
        return { success: false, error: "Fahrzeug wurde nicht gefunden." };
      }
      const existing = existingRes.rows[0];

      const updateSql = `
        UPDATE "Auto"
        SET 
          "name" = $1,
          "kennzeichen" = $2,
          "modell" = $3,
          "defekte" = $4,
          "tuevTermin" = $5,
          "anmerkungen" = $6,
          "kilometerstand" = $7,
          "status" = $8,
          "updatedAt" = NOW()
        WHERE id = $9
        RETURNING *;
      `;
      const res = await pool.query(updateSql, [
        trimmedName,
        input.kennzeichen?.trim() || null,
        input.modell?.trim() || null,
        input.defekte?.trim() || null,
        parsedTuev,
        input.anmerkungen?.trim() || null,
        km,
        input.status?.trim() || existing.status,
        id,
      ]);
      updated = mapRowToAuto(res.rows[0]);
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "AUTO_UPDATE",
      beschreibung: `Fahrzeugdaten aktualisiert: "${trimmedName}".`,
      details: input.defekte ? `Defekte: ${input.defekte}` : undefined,
    });

    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, auto: updated };
  } catch (error: any) {
    console.error("Fehler beim Aktualisieren des Autos:", error);
    return { success: false, error: error.message || "Fehler beim Aktualisieren in der Datenbank." };
  }
}

/**
 * Auto löschen
 */
export async function deleteAuto(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    let carName = "Fahrzeug";
    let carPlate = "";

    if ((db as any)?.auto?.findUnique) {
      const existing = await db.auto.findUnique({ where: { id } });
      if (!existing) {
        return { success: false, error: "Fahrzeug wurde nicht gefunden." };
      }
      carName = existing.name;
      carPlate = existing.kennzeichen ? ` (${existing.kennzeichen})` : "";
      await db.auto.delete({ where: { id } });
    } else {
      const pool = getDbPool();
      const existing = await pool.query('SELECT * FROM "Auto" WHERE id = $1', [id]);
      if (!existing.rows[0]) {
        return { success: false, error: "Fahrzeug wurde nicht gefunden." };
      }
      carName = existing.rows[0].name;
      carPlate = existing.rows[0].kennzeichen ? ` (${existing.rows[0].kennzeichen})` : "";
      await pool.query('DELETE FROM "Auto" WHERE id = $1', [id]);
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "AUTO_DELETE",
      beschreibung: `Fahrzeug gelöscht: "${carName}"${carPlate}.`,
    });

    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Fehler beim Löschen des Autos:", error);
    return { success: false, error: error.message || "Fehler beim Löschen." };
  }
}

/**
 * Beispielfahrzeuge für den Schnellstart anlegen
 */
export async function seedSampleAutos(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const dueSoon = new Date();
    dueSoon.setDate(dueSoon.getDate() + 35); // in 35 Tagen fällig

    if ((db as any)?.auto?.createMany) {
      await db.auto.createMany({
        data: [
          {
            name: "VW Caddy 1 (Montage)",
            kennzeichen: "B-LL 101",
            modell: "Volkswagen Caddy 2.0 TDI",
            defekte: null,
            tuevTermin: nextYear,
            anmerkungen: "Schlüssel liegt im Büroschrank Fach 1. Sommerreifen montiert.",
            kilometerstand: 89400,
            status: "BEREIT",
          },
          {
            name: "Sprinter Werkstattwagen",
            kennzeichen: "B-LL 202",
            modell: "Mercedes-Benz Sprinter 316 CDI",
            defekte: "Blinker hinten rechts defekt (Birne tauschen), Scheibenwischer vorne verschlissen",
            tuevTermin: dueSoon,
            anmerkungen: "Große Werkbank im Heck montiert. Tankkarte im Handschuhfach.",
            kilometerstand: 148200,
            status: "DEFEKT",
          },
        ],
      });
    } else {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO "Auto" 
          ("name", "kennzeichen", "modell", "defekte", "tuevTermin", "anmerkungen", "kilometerstand", "status", "createdAt", "updatedAt")
         VALUES
          ('VW Caddy 1 (Montage)', 'B-LL 101', 'Volkswagen Caddy 2.0 TDI', NULL, $1, 'Schlüssel liegt im Büroschrank Fach 1. Sommerreifen montiert.', 89400, 'BEREIT', NOW(), NOW()),
          ('Sprinter Werkstattwagen', 'B-LL 202', 'Mercedes-Benz Sprinter 316 CDI', 'Blinker hinten rechts defekt (Birne tauschen), Scheibenwischer vorne verschlissen', $2, 'Große Werkbank im Heck montiert. Tankkarte im Handschuhfach.', 148200, 'DEFEKT', NOW(), NOW());
        `,
        [nextYear, dueSoon]
      );
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "AUTO_SEED",
      beschreibung: "2 Beispielfahrzeuge für den Fuhrpark initialisiert.",
    });

    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, count: 2 };
  } catch (error: any) {
    console.error("Fehler beim Erstellen der Beispielfahrzeuge:", error);
    return { success: false, count: 0, error: error.message };
  }
}

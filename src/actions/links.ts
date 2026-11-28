"use server";

import { db, getDbPool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/logs";

export interface WebLinkItem {
  id: number;
  titel: string;
  url: string;
  beschreibung: string | null;
  kategorie: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebLinkInput {
  titel: string;
  url: string;
  beschreibung?: string | null;
  kategorie?: string | null;
  icon?: string | null;
}

export interface UpdateWebLinkInput {
  titel?: string;
  url?: string;
  beschreibung?: string | null;
  kategorie?: string | null;
  icon?: string | null;
}

/**
 * Normalisiert eine URL: Trimmt Leerzeichen und ergänzt 'https://', falls kein Protokoll angegeben wurde.
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function mapRowToWebLink(row: any): WebLinkItem {
  return {
    id: row.id,
    titel: row.titel,
    url: row.url,
    beschreibung: row.beschreibung ?? null,
    kategorie: row.kategorie || "Allgemein",
    icon: row.icon ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * Stellt sicher, dass die Tabelle "WebLink" in PostgreSQL existiert
 */
export async function ensureWebLinkTable(): Promise<void> {
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WebLink" (
      "id" SERIAL PRIMARY KEY,
      "titel" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "beschreibung" TEXT,
      "kategorie" TEXT DEFAULT 'Allgemein',
      "icon" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Standard-Startlinks für den Schnellstart
 */
const SAMPLE_LINKS: CreateWebLinkInput[] = [
  {
    titel: "Würth Online-Shop",
    url: "https://www.wuerth.de",
    beschreibung: "Hauptlieferant für Montagematerial, Schrauben, Dübel und Werkzeuge.",
    kategorie: "Lieferanten",
  },
  {
    titel: "Simu Antriebe & Steuerungen",
    url: "https://www.simu.com",
    beschreibung: "Herstellerportal für Rollladenmotoren, Antriebe und Schaltpläne.",
    kategorie: "Hersteller",
  },
  {
    titel: "Somfy Fachpartner Portal",
    url: "https://www.somfy.de",
    beschreibung: "Produktkataloge, Anleitungen und Fachpartner-Bestellsystem.",
    kategorie: "Hersteller",
  },
  {
    titel: "HORNBACH ProfiService",
    url: "https://www.hornbach.de",
    beschreibung: "Baumarkt-Direktabholung für kurzfristigen Baustellenbedarf.",
    kategorie: "Lieferanten",
  },
  {
    titel: "DHL Sendungsverfolgung",
    url: "https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html",
    beschreibung: "Tracking von Materialpaketen und Express-Sendungen.",
    kategorie: "Logistik",
  },
  {
    titel: "Google Maps / Routenplaner",
    url: "https://maps.google.com",
    beschreibung: "Baustellenadressen und Routenplanung für Monteure.",
    kategorie: "Tools",
  },
];

/**
 * Alle WebLinks abrufen
 */
export async function getWebLinks(): Promise<WebLinkItem[]> {
  try {
    await ensureWebLinkTable();
  } catch (err) {
    console.warn("Hinweis beim Sicherstellen der WebLink-Tabelle:", err);
  }

  try {
    if ((db as any)?.webLink?.findMany) {
      const list = await (db as any).webLink.findMany({
        orderBy: [{ kategorie: "asc" }, { titel: "asc" }],
      });

      // Falls noch keine Links existieren, Standardlinks anlegen
      if (list.length === 0) {
        await seedSampleLinks();
        return await (db as any).webLink.findMany({
          orderBy: [{ kategorie: "asc" }, { titel: "asc" }],
        });
      }

      return list;
    }
  } catch (error) {
    console.warn("Prisma db.webLink noch nicht initialisiert, nutze Pool-Fallback:", error);
  }

  try {
    const pool = getDbPool();
    const res = await pool.query('SELECT * FROM "WebLink" ORDER BY "kategorie" ASC, "titel" ASC');
    if (res.rows.length === 0) {
      await seedSampleLinks();
      const freshRes = await pool.query('SELECT * FROM "WebLink" ORDER BY "kategorie" ASC, "titel" ASC');
      return freshRes.rows.map(mapRowToWebLink);
    }
    return res.rows.map(mapRowToWebLink);
  } catch (err) {
    console.error("Fehler beim Laden der WebLinks aus Postgres:", err);
    return [];
  }
}

/**
 * Neuen WebLink erstellen
 */
export async function createWebLink(
  input: CreateWebLinkInput
): Promise<{ success: boolean; link?: WebLinkItem; error?: string }> {
  const trimmedTitel = input.titel?.trim();
  if (!trimmedTitel) {
    return { success: false, error: "Bitte geben Sie einen Namen oder Titel für den Link ein." };
  }

  const normalized = normalizeUrl(input.url || "");
  if (!normalized) {
    return { success: false, error: "Bitte geben Sie eine gültige Web-Adresse (URL) ein." };
  }

  const kategorie = input.kategorie?.trim() || "Allgemein";
  const beschreibung = input.beschreibung?.trim() || null;
  const icon = input.icon?.trim() || null;

  try {
    await ensureWebLinkTable();
    let created: WebLinkItem;

    if ((db as any)?.webLink?.create) {
      created = await (db as any).webLink.create({
        data: {
          titel: trimmedTitel,
          url: normalized,
          beschreibung,
          kategorie,
          icon,
        },
      });
    } else {
      const pool = getDbPool();
      const res = await pool.query(
        `INSERT INTO "WebLink" ("titel", "url", "beschreibung", "kategorie", "icon", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [trimmedTitel, normalized, beschreibung, kategorie, icon]
      );
      created = mapRowToWebLink(res.rows[0]);
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "LINK_CREATE",
      beschreibung: `Neuer Web-Link angelegt: "${trimmedTitel}" (${kategorie})`,
      details: `URL: ${normalized}${beschreibung ? ` | Notiz: ${beschreibung}` : ""}`,
    });

    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, link: created };
  } catch (err: any) {
    console.error("Fehler beim Erstellen des WebLinks:", err);
    return { success: false, error: err.message || "Fehler beim Speichern des Links." };
  }
}

/**
 * Bestehenden WebLink aktualisieren
 */
export async function updateWebLink(
  id: number,
  input: UpdateWebLinkInput
): Promise<{ success: boolean; link?: WebLinkItem; error?: string }> {
  try {
    await ensureWebLinkTable();

    let existingLink: WebLinkItem | null = null;
    if ((db as any)?.webLink?.findUnique) {
      existingLink = await (db as any).webLink.findUnique({ where: { id } });
    } else {
      const pool = getDbPool();
      const res = await pool.query('SELECT * FROM "WebLink" WHERE "id" = $1', [id]);
      if (res.rows[0]) existingLink = mapRowToWebLink(res.rows[0]);
    }

    if (!existingLink) {
      return { success: false, error: "Link wurde nicht gefunden." };
    }

    const trimmedTitel = input.titel !== undefined ? input.titel.trim() : existingLink.titel;
    if (!trimmedTitel) {
      return { success: false, error: "Der Titel darf nicht leer sein." };
    }

    let normalizedUrl = existingLink.url;
    if (input.url !== undefined) {
      normalizedUrl = normalizeUrl(input.url);
      if (!normalizedUrl) {
        return { success: false, error: "Die URL darf nicht leer sein." };
      }
    }

    const kategorie =
      input.kategorie !== undefined
        ? input.kategorie?.trim() || "Allgemein"
        : existingLink.kategorie;
    const beschreibung =
      input.beschreibung !== undefined
        ? input.beschreibung?.trim() || null
        : existingLink.beschreibung;
    const icon =
      input.icon !== undefined ? input.icon?.trim() || null : existingLink.icon;

    let updated: WebLinkItem;
    if ((db as any)?.webLink?.update) {
      updated = await (db as any).webLink.update({
        where: { id },
        data: {
          titel: trimmedTitel,
          url: normalizedUrl,
          beschreibung,
          kategorie,
          icon,
        },
      });
    } else {
      const pool = getDbPool();
      const res = await pool.query(
        `UPDATE "WebLink"
         SET "titel" = $1, "url" = $2, "beschreibung" = $3, "kategorie" = $4, "icon" = $5, "updatedAt" = NOW()
         WHERE "id" = $6
         RETURNING *`,
        [trimmedTitel, normalizedUrl, beschreibung, kategorie, icon, id]
      );
      updated = mapRowToWebLink(res.rows[0]);
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "LINK_UPDATE",
      beschreibung: `Web-Link geändert: "${trimmedTitel}"`,
      details: `URL: ${normalizedUrl} | Kategorie: ${kategorie}`,
    });

    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, link: updated };
  } catch (err: any) {
    console.error("Fehler beim Aktualisieren des WebLinks:", err);
    return { success: false, error: err.message || "Fehler beim Aktualisieren des Links." };
  }
}

/**
 * WebLink löschen
 */
export async function deleteWebLink(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureWebLinkTable();

    let linkTitel = `ID #${id}`;
    if ((db as any)?.webLink?.delete) {
      const existing = await (db as any).webLink.findUnique({ where: { id } });
      if (existing) linkTitel = existing.titel;
      await (db as any).webLink.delete({ where: { id } });
    } else {
      const pool = getDbPool();
      const res = await pool.query('SELECT "titel" FROM "WebLink" WHERE "id" = $1', [id]);
      if (res.rows[0]) linkTitel = res.rows[0].titel;
      await pool.query('DELETE FROM "WebLink" WHERE "id" = $1', [id]);
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "LINK_DELETE",
      beschreibung: `Web-Link gelöscht: "${linkTitel}"`,
    });

    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("Fehler beim Löschen des WebLinks:", err);
    return { success: false, error: err.message || "Fehler beim Löschen des Links." };
  }
}

/**
 * Standardlinks anlegen
 */
export async function seedSampleLinks(): Promise<{ success: boolean; count: number }> {
  try {
    await ensureWebLinkTable();
    let count = 0;

    for (const item of SAMPLE_LINKS) {
      if ((db as any)?.webLink?.create) {
        await (db as any).webLink.create({
          data: {
            titel: item.titel,
            url: item.url,
            beschreibung: item.beschreibung || null,
            kategorie: item.kategorie || "Allgemein",
            icon: item.icon || null,
          },
        });
        count++;
      } else {
        const pool = getDbPool();
        await pool.query(
          `INSERT INTO "WebLink" ("titel", "url", "beschreibung", "kategorie", "icon", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [item.titel, item.url, item.beschreibung || null, item.kategorie || "Allgemein", item.icon || null]
        );
        count++;
      }
    }

    return { success: true, count };
  } catch (err) {
    console.error("Fehler beim Seeden der Beispiellinks:", err);
    return { success: false, count: 0 };
  }
}

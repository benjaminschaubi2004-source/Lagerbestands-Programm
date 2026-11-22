"use server";

import { db } from "@/lib/db";
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
 * Alle Fahrzeuge abrufen
 */
export async function getAutos(): Promise<AutoItem[]> {
  try {
    const list = await db.auto.findMany({
      orderBy: [{ name: "asc" }],
    });
    return list;
  } catch (error) {
    console.warn("Hinweis: Fehler beim Laden der Autos aus der Datenbank:", error);
    return [];
  }
}

/**
 * Einzelnes Fahrzeug anhand der ID abrufen
 */
export async function getAutoById(id: number): Promise<AutoItem | null> {
  try {
    const item = await db.auto.findUnique({
      where: { id },
    });
    return item;
  } catch (error) {
    console.error("Fehler beim Abrufen des Autos:", error);
    return null;
  }
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
  const km = input.kilometerstand !== undefined && input.kilometerstand !== null && !isNaN(Number(input.kilometerstand))
    ? Math.max(0, Math.floor(Number(input.kilometerstand)))
    : null;

  try {
    const newAuto = await db.auto.create({
      data: {
        name: trimmedName,
        kennzeichen: input.kennzeichen?.trim() || null,
        modell: input.modell?.trim() || null,
        defekte: input.defekte?.trim() || null,
        tuevTermin: parsedTuev,
        anmerkungen: input.anmerkungen?.trim() || null,
        kilometerstand: km,
        status: input.status?.trim() || (input.defekte?.trim() ? "DEFEKT" : "BEREIT"),
      },
    });

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
  const km = input.kilometerstand !== undefined && input.kilometerstand !== null && !isNaN(Number(input.kilometerstand))
    ? Math.max(0, Math.floor(Number(input.kilometerstand)))
    : null;

  try {
    const existing = await db.auto.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Fahrzeug wurde nicht gefunden." };
    }

    const updated = await db.auto.update({
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
    const existing = await db.auto.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Fahrzeug wurde nicht gefunden." };
    }

    await db.auto.delete({
      where: { id },
    });

    await logActivity({
      bereich: "OFFICE",
      aktion: "AUTO_DELETE",
      beschreibung: `Fahrzeug gelöscht: "${existing.name}"${existing.kennzeichen ? ` (${existing.kennzeichen})` : ""}.`,
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

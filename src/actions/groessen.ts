"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/logs";

export interface GroesseWithCount {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    varianten: number;
  };
}

export async function getGroessen(): Promise<GroesseWithCount[]> {
  try {
    const list = await db.groesse.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { varianten: true },
        },
      },
    });
    return list;
  } catch (error) {
    console.warn("Hinweis: Datenbank noch nicht erreichbar oder unkonfiguriert (Größen).");
    return [];
  }
}

export async function createGroesse(name: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "Der Name der Größe darf nicht leer sein." };
  }

  try {
    const existing = await db.groesse.findUnique({
      where: { name: trimmed },
    });
    if (existing) {
      return { success: false, error: `Größe "${trimmed}" existiert bereits.` };
    }

    await db.groesse.create({
      data: { name: trimmed },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "GROESSE_CREATE",
      beschreibung: `Neue Größe "${trimmed}" im Variantenstamm angelegt.`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Erstellen der Größe:", error);
    return { success: false, error: "Größe konnte nicht erstellt werden." };
  }
}

export async function updateGroesse(
  id: number,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "Der Name der Größe darf nicht leer sein." };
  }

  try {
    const existing = await db.groesse.findFirst({
      where: {
        name: trimmed,
        id: { not: id },
      },
    });
    if (existing) {
      return {
        success: false,
        error: `Eine andere Größe mit dem Namen "${trimmed}" existiert bereits.`,
      };
    }

    await db.groesse.update({
      where: { id },
      data: { name: trimmed },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "GROESSE_UPDATE",
      beschreibung: `Größe ID #${id} umbenannt in "${trimmed}".`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Größe:", error);
    return { success: false, error: "Größe konnte nicht aktualisiert werden." };
  }
}

export async function deleteGroesse(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const groesse = await db.groesse.findUnique({
      where: { id },
      include: {
        _count: {
          select: { varianten: true },
        },
      },
    });

    if (!groesse) {
      return { success: false, error: "Größe nicht gefunden." };
    }

    if (groesse._count && groesse._count.varianten > 0) {
      return {
        success: false,
        error: `Größe kann nicht gelöscht werden, da sie noch von ${groesse._count.varianten} Material-Variante(n) verwendet wird.`,
      };
    }

    await db.groesse.delete({
      where: { id },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "GROESSE_DELETE",
      beschreibung: `Größe "${groesse.name}" aus Variantenstamm gelöscht.`,
      details: `Größen-ID #${id}`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Löschen der Größe:", error);
    return { success: false, error: "Größe konnte nicht gelöscht werden." };
  }
}

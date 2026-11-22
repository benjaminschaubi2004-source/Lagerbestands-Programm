"use server";

import { db, getDbPool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/logs";

export interface MaterialVarianteInfo {
  id: number;
  artikelnummer: string;
  mindestbestand: number;
  istBestand: number;
  isBestellt?: boolean;
  bestelltAm?: Date | null;
  bestelltMenge?: number | null;
  bestelltNotiz?: string | null;
  materialId: number;
  groesseId: number;
  groesse: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialWithVarianten {
  id: number;
  name: string;
  hersteller: string | null;
  beschreibung: string | null;
  createdAt: Date;
  updatedAt: Date;
  varianten: MaterialVarianteInfo[];
}

export interface CreateVarianteInput {
  groesseId?: number;
  newGroesseName?: string;
  artikelnummer: string;
  mindestbestand: number;
  istBestand?: number;
}

export async function getMaterialien(search?: string): Promise<MaterialWithVarianten[]> {
  try {
    const where: any = {};

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { hersteller: { contains: term, mode: "insensitive" } },
        { beschreibung: { contains: term, mode: "insensitive" } },
        {
          varianten: {
            some: {
              artikelnummer: { contains: term, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const items = await db.material.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        varianten: {
          include: {
            groesse: {
              select: { id: true, name: true },
            },
          },
          orderBy: {
            groesse: { name: "asc" },
          },
        },
      },
    });

    return items;
  } catch (error) {
    console.warn("Hinweis: Datenbank noch nicht erreichbar oder unkonfiguriert (Materialien).");
    return [];
  }
}

export async function createMaterial(data: {
  name: string;
  hersteller?: string;
  beschreibung?: string;
  varianten?: CreateVarianteInput[];
}): Promise<{ success: boolean; error?: string; material?: MaterialWithVarianten }> {
  const name = data.name?.trim();
  const hersteller = data.hersteller?.trim() || null;
  const beschreibung = data.beschreibung?.trim() || null;

  if (!name) {
    return { success: false, error: "Der Materialname ist ein Pflichtfeld." };
  }

  try {
    const existing = await db.material.findUnique({
      where: { name },
    });
    if (existing) {
      return { success: false, error: `Ein Material mit dem Namen "${name}" existiert bereits.` };
    }

    // Validiere Varianten falls vorhanden
    const validVariantsToCreate: Array<{
      groesseId: number;
      artikelnummer: string;
      mindestbestand: number;
      istBestand: number;
    }> = [];

    if (data.varianten && data.varianten.length > 0) {
      for (const v of data.varianten) {
        const artNr = v.artikelnummer?.trim();
        if (!artNr) continue;

        // Prüfe ob Artikelnummer doppelt
        const existingArt = await db.materialVariante.findUnique({
          where: { artikelnummer: artNr },
        });
        if (existingArt) {
          return { success: false, error: `Artikelnummer "${artNr}" ist bereits vergeben.` };
        }

        let targetGId = v.groesseId ? Number(v.groesseId) : null;
        if (v.newGroesseName && v.newGroesseName.trim()) {
          const gName = v.newGroesseName.trim();
          let g = await db.groesse.findUnique({ where: { name: gName } });
          if (!g) {
            g = await db.groesse.create({ data: { name: gName } });
          }
          targetGId = g.id;
        }

        if (targetGId) {
          validVariantsToCreate.push({
            groesseId: targetGId,
            artikelnummer: artNr,
            mindestbestand: Math.max(0, Number(v.mindestbestand) || 0),
            istBestand: Math.max(0, Number(v.istBestand) || 0),
          });
        }
      }
    }

    const created = await db.material.create({
      data: {
        name,
        hersteller,
        beschreibung,
        ...(validVariantsToCreate.length > 0
          ? {
              varianten: {
                create: validVariantsToCreate,
              },
            }
          : {}),
      },
      include: {
        varianten: {
          include: {
            groesse: { select: { id: true, name: true } },
          },
        },
      },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "MATERIAL_CREATE",
      beschreibung: `Neues Material "${name}"${hersteller ? ` (Hersteller: ${hersteller})` : ""} angelegt.`,
      details: validVariantsToCreate.length > 0 ? `${validVariantsToCreate.length} initiale Größen-Variante(n) erstellt.` : undefined,
    });

    revalidatePath("/");
    revalidatePath("/monteur");
    revalidatePath("/techniker");
    revalidatePath("/office");
    revalidatePath("/admin");
    return { success: true, material: created };
  } catch (error) {
    console.error("Fehler beim Anlegen des Materials:", error);
    return { success: false, error: "Material konnte nicht angelegt werden." };
  }
}

export async function updateMaterial(
  id: number,
  data: { name: string; hersteller?: string | null; beschreibung?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const name = data.name?.trim();
  const hersteller = data.hersteller !== undefined ? (data.hersteller?.trim() || null) : undefined;
  const beschreibung = data.beschreibung !== undefined ? (data.beschreibung?.trim() || null) : undefined;

  if (!name) {
    return { success: false, error: "Der Materialname ist ein Pflichtfeld." };
  }

  try {
    const duplicate = await db.material.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });
    if (duplicate) {
      return { success: false, error: `Ein Material mit dem Namen "${name}" existiert bereits.` };
    }

    await db.material.update({
      where: { id },
      data: {
        name,
        ...(hersteller !== undefined ? { hersteller } : {}),
        ...(beschreibung !== undefined ? { beschreibung } : {}),
      },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "MATERIAL_UPDATE",
      beschreibung: `Material ID #${id} aktualisiert (Neuer Name: "${name}"${hersteller ? `, Hersteller: "${hersteller}"` : ""}).`,
    });

    revalidatePath("/");
    revalidatePath("/monteur");
    revalidatePath("/techniker");
    revalidatePath("/office");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Materials:", error);
    return { success: false, error: "Material konnte nicht aktualisiert werden." };
  }
}

export async function deleteMaterial(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const toDelete = await db.material.findUnique({ where: { id } });
    await db.material.delete({
      where: { id },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "MATERIAL_DELETE",
      beschreibung: `Material "${toDelete?.name || id}" samt zugehöriger Varianten gelöscht.`,
      details: `Material-ID #${id}`,
    });

    revalidatePath("/");
    revalidatePath("/monteur");
    revalidatePath("/techniker");
    revalidatePath("/office");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Löschen des Materials:", error);
    return { success: false, error: "Material konnte nicht gelöscht werden." };
  }
}

/* ---------------- VARIANTEN CRUD ---------------- */

export async function addVariante(
  materialId: number,
  data: CreateVarianteInput
): Promise<{ success: boolean; error?: string }> {
  const artikelnummer = data.artikelnummer?.trim();
  const mindestbestand = Math.max(0, Number(data.mindestbestand) || 0);
  const istBestand = Math.max(0, Number(data.istBestand) || 0);

  if (!artikelnummer) {
    return { success: false, error: "Artikelnummer ist ein Pflichtfeld." };
  }

  try {
    // Falls eine neue Größe direkt eingetippt wurde
    let groesseId = data.groesseId ? Number(data.groesseId) : null;
    if (data.newGroesseName && data.newGroesseName.trim()) {
      const gName = data.newGroesseName.trim();
      let g = await db.groesse.findUnique({ where: { name: gName } });
      if (!g) {
        g = await db.groesse.create({ data: { name: gName } });
      }
      groesseId = g.id;
    }

    if (!groesseId) {
      return { success: false, error: "Bitte wähle eine Größe aus oder gib eine neue Größe an." };
    }

    // Prüfe eindeutige Artikelnummer
    const existingArtNr = await db.materialVariante.findUnique({
      where: { artikelnummer },
    });
    if (existingArtNr) {
      return { success: false, error: `Artikelnummer "${artikelnummer}" wird bereits verwendet.` };
    }

    // Prüfe, ob Material diese Größe schon hat
    const existingPair = await db.materialVariante.findUnique({
      where: {
        materialId_groesseId: {
          materialId,
          groesseId,
        },
      },
    });
    if (existingPair) {
      return {
        success: false,
        error: "Für dieses Material existiert bereits eine Variante mit dieser Größe.",
      };
    }

    const createdVar = await db.materialVariante.create({
      data: {
        materialId,
        groesseId,
        artikelnummer,
        mindestbestand,
        istBestand,
      },
      include: {
        material: true,
        groesse: true,
      },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "VARIANTE_CREATE",
      beschreibung: `Größen-Variante "${artikelnummer}" (${createdVar.groesse.name}) für Material "${createdVar.material.name}" angelegt.`,
      details: `Mindestbestand: ${mindestbestand} Stk. | Ist-Bestand: ${istBestand} Stk.`,
    });

    revalidatePath("/");
    revalidatePath("/monteur");
    revalidatePath("/techniker");
    revalidatePath("/office");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Variante:", error);
    return { success: false, error: "Variante konnte nicht angelegt werden." };
  }
}

export async function updateVariante(
  id: number,
  data: {
    artikelnummer: string;
    mindestbestand: number;
    istBestand?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const artikelnummer = data.artikelnummer?.trim();
  const mindestbestand = Math.max(0, Number(data.mindestbestand) || 0);
  const istBestand = data.istBestand !== undefined ? Math.max(0, Number(data.istBestand) || 0) : undefined;

  if (!artikelnummer) {
    return { success: false, error: "Artikelnummer darf nicht leer sein." };
  }

  try {
    const existingArtNr = await db.materialVariante.findFirst({
      where: {
        artikelnummer,
        id: { not: id },
      },
    });
    if (existingArtNr) {
      return { success: false, error: `Artikelnummer "${artikelnummer}" wird bereits verwendet.` };
    }

    const updatedVar = await db.materialVariante.update({
      where: { id },
      data: {
        artikelnummer,
        mindestbestand,
        ...(istBestand !== undefined ? { istBestand } : {}),
      },
      include: {
        material: true,
        groesse: true,
      },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "VARIANTE_UPDATE",
      beschreibung: `Größen-Variante "${artikelnummer}" (${updatedVar.groesse.name}) für "${updatedVar.material.name}" aktualisiert.`,
      details: `Mindestbestand: ${mindestbestand} Stk.${istBestand !== undefined ? ` | Ist-Bestand: ${istBestand} Stk.` : ""}`,
    });

    revalidatePath("/");
    revalidatePath("/monteur");
    revalidatePath("/techniker");
    revalidatePath("/office");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Variante:", error);
    return { success: false, error: "Variante konnte nicht aktualisiert werden." };
  }
}

export async function deleteVariante(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const toDeleteVar = await db.materialVariante.findUnique({
      where: { id },
      include: { material: true, groesse: true },
    });
    await db.materialVariante.delete({
      where: { id },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "VARIANTE_DELETE",
      beschreibung: `Größen-Variante "${toDeleteVar?.artikelnummer || id}" (${toDeleteVar?.groesse.name}) für Material "${toDeleteVar?.material.name}" gelöscht.`,
      details: `Variante-ID #${id}`,
    });

    revalidatePath("/");
    revalidatePath("/monteur");
    revalidatePath("/techniker");
    revalidatePath("/office");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Löschen der Variante:", error);
    return { success: false, error: "Variante konnte nicht gelöscht werden." };
  }
}

/* ---------------- TECHNIKER-SUCHE & BESTANDS-PRÜFUNG ---------------- */

export interface TechnikerLookupResult {
  found: boolean;
  variante?: {
    id: number;
    artikelnummer: string;
    mindestbestand: number;
    istBestand: number;
    groesseName: string;
    materialName: string;
    beschreibung: string | null;
    isBelowMinStock: boolean;
  };
  error?: string;
}

export async function getVarianteByMaterialAndGroesse(
  materialId: number,
  groesseId: number
): Promise<TechnikerLookupResult> {
  try {
    const variante = await db.materialVariante.findUnique({
      where: {
        materialId_groesseId: {
          materialId,
          groesseId,
        },
      },
      include: {
        groesse: true,
        material: true,
      },
    });

    if (!variante) {
      return {
        found: false,
        error: "Für die gewählte Kombination aus Material und Größe ist keine Artikelnummer hinterlegt.",
      };
    }

    return {
      found: true,
      variante: {
        id: variante.id,
        artikelnummer: variante.artikelnummer,
        mindestbestand: variante.mindestbestand,
        istBestand: variante.istBestand,
        groesseName: variante.groesse.name,
        materialName: variante.material.name,
        beschreibung: variante.material.beschreibung,
        isBelowMinStock: variante.istBestand < variante.mindestbestand,
      },
    };
  } catch (error) {
    console.error("Fehler bei Techniker-Abfrage:", error);
    return { found: false, error: "Fehler beim Abrufen der Stammdaten." };
  }
}

export interface BuchungInfo {
  id: number;
  typ: string;
  menge: number;
  bestandVorher: number;
  bestandNachher: number;
  createdAt: Date;
  variante: {
    id: number;
    artikelnummer: string;
    groesse: {
      name: string;
    };
    material: {
      id: number;
      name: string;
    };
  };
}

export async function getBuchungen(limit = 25): Promise<BuchungInfo[]> {
  try {
    const list = await db.buchung.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        variante: {
          select: {
            id: true,
            artikelnummer: true,
            groesse: {
              select: { name: true },
            },
            material: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    return list;
  } catch (error) {
    console.warn("Hinweis: Fehler beim Laden der Buchungen:", error);
    return [];
  }
}

export async function bookBestand(
  varianteId: number,
  menge: number,
  typ: "ausgabe" | "einnahme"
): Promise<{ success: boolean; error?: string; neuerBestand?: number }> {
  if (menge <= 0) {
    return { success: false, error: "Die Menge muss mindestens 1 sein." };
  }

  try {
    const variante = await db.materialVariante.findUnique({
      where: { id: varianteId },
      include: {
        material: true,
        groesse: true,
      },
    });
    if (!variante) {
      return { success: false, error: "Variante nicht gefunden." };
    }

    const bestandVorher = variante.istBestand;
    let bestandNachher = bestandVorher;

    if (typ === "ausgabe") {
      if (variante.istBestand < menge) {
        return {
          success: false,
          error: `Nicht genügend Bestand vorhanden! Aktuell auf Lager: ${variante.istBestand} Stk., gewünschte Entnahme: ${menge} Stk.`,
        };
      }
      bestandNachher = bestandVorher - menge;

      await db.$transaction([
        db.materialVariante.update({
          where: { id: varianteId },
          data: { istBestand: bestandNachher },
        }),
        db.buchung.create({
          data: {
            typ: "AUSGANG",
            menge,
            bestandVorher,
            bestandNachher,
            varianteId,
          },
        }),
      ]);
    } else {
      // Einnahme / Einlagern
      bestandNachher = bestandVorher + menge;

      const isRestocked = bestandNachher >= variante.mindestbestand;
      const updateData: any = { istBestand: bestandNachher };
      // Wenn der Mindestbestand wieder erreicht oder überschritten ist, wird der Status "bestellt" automatisch zurückgesetzt
      if (isRestocked && (variante as any).isBestellt) {
        updateData.isBestellt = false;
        updateData.bestelltAm = null;
        updateData.bestelltMenge = null;
        updateData.bestelltNotiz = null;
      }

      await db.$transaction([
        db.materialVariante.update({
          where: { id: varianteId },
          data: updateData,
        }),
        db.buchung.create({
          data: {
            typ: "EINGANG",
            menge,
            bestandVorher,
            bestandNachher,
            varianteId,
          },
        }),
      ]);
    }

    await logActivity({
      bereich: "TECHNIKER",
      aktion: typ === "ausgabe" ? "AUSGABE" : "EINNAHME",
      beschreibung:
        typ === "ausgabe"
          ? `Ausgabe: ${menge} Stk. ${variante.material.name} (${variante.groesse.name}) entnommen.`
          : `Einnahme: ${menge} Stk. ${variante.material.name} (${variante.groesse.name}) eingelagert.`,
      details: `Art.-Nr: ${variante.artikelnummer} | Bestand: ${bestandVorher} Stk. ➔ ${bestandNachher} Stk.`,
    });

    revalidatePath("/");
    revalidatePath("/techniker");
    revalidatePath("/monteur");
    revalidatePath("/office");
    revalidatePath("/admin");
    return { success: true, neuerBestand: bestandNachher };
  } catch (error) {
    console.error("Fehler beim Buchen des Bestands:", error);
    return { success: false, error: "Buchung konnte nicht durchgeführt werden." };
  }
}

export async function bookEntnahme(
  varianteId: number,
  menge: number
): Promise<{ success: boolean; error?: string; neuerBestand?: number }> {
  return bookBestand(varianteId, menge, "ausgabe");
}

/* ---------------- OFFICE: MATERIAL-BESTELLSTATUS ---------------- */

export interface OrderMaterialInput {
  bestelltMenge?: number | null;
  bestelltNotiz?: string | null;
}

export interface OrderResult {
  success: boolean;
  error?: string;
  variante?: {
    id: number;
    isBestellt: boolean;
    bestelltAm?: Date | null;
    bestelltMenge?: number | null;
    bestelltNotiz?: string | null;
  };
}

/**
 * Setzt den Status einer Material-Variante auf 'isBestellt = true'.
 * Dadurch gilt sie im Office nicht mehr als kritisch oder ausverkauft.
 */
export async function orderMaterialVariante(
  varianteId: number,
  options?: OrderMaterialInput
): Promise<OrderResult> {
  try {
    const id = Number(varianteId);
    if (!id || isNaN(id)) {
      return { success: false, error: "Ungültige Varianten-ID." };
    }

    const menge =
      options?.bestelltMenge !== undefined && options?.bestelltMenge !== null
        ? Math.max(1, Math.round(Number(options.bestelltMenge)))
        : null;
    const notiz = options?.bestelltNotiz?.trim() || null;
    const now = new Date();

    let updatedVariante: any = null;

    try {
      updatedVariante = await db.materialVariante.update({
        where: { id },
        data: {
          isBestellt: true,
          bestelltAm: now,
          bestelltMenge: menge,
          bestelltNotiz: notiz,
        },
        include: {
          material: true,
          groesse: true,
        },
      });
    } catch (prismaErr) {
      // Direkter PostgreSQL Fallback
      const pool = getDbPool();
      const res = await pool.query(
        `UPDATE "MaterialVariante" 
         SET "isBestellt" = true, "bestelltAm" = $1, "bestelltMenge" = $2, "bestelltNotiz" = $3, "updatedAt" = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [now, menge, notiz, id]
      );
      if (res.rows.length === 0) {
        return { success: false, error: "Variante nicht gefunden." };
      }
      const mRes = await pool.query(
        `SELECT m.name as "materialName", g.name as "groesseName" 
         FROM "MaterialVariante" mv 
         LEFT JOIN "Material" m ON m.id = mv."materialId" 
         LEFT JOIN "Groesse" g ON g.id = mv."groesseId" 
         WHERE mv.id = $1`,
        [id]
      );
      const mRow = mRes.rows[0];
      updatedVariante = {
        ...res.rows[0],
        material: { name: mRow?.materialName || `Material #${res.rows[0].materialId}` },
        groesse: { name: mRow?.groesseName || "" },
      };
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "MATERIAL_BESTELLT",
      beschreibung: `Material "${updatedVariante.material.name}" (${updatedVariante.groesse.name}) als bestellt markiert.${menge ? ` Bestellmenge: ${menge} Stk.` : ""}`,
      details: `Art.-Nr: ${updatedVariante.artikelnummer}${notiz ? ` | Notiz: ${notiz}` : ""}`,
    });

    revalidatePath("/");
    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/monteur");
    revalidatePath("/techniker");

    return {
      success: true,
      variante: {
        id: Number(updatedVariante.id),
        isBestellt: true,
        bestelltAm: now,
        bestelltMenge: menge,
        bestelltNotiz: notiz,
      },
    };
  } catch (error) {
    console.error("Fehler beim Bestellen der Variante:", error);
    return { success: false, error: "Bestellstatus konnte nicht gesetzt werden." };
  }
}

/**
 * Hebt den 'isBestellt'-Status auf (Stornierung oder manuelle Rücksetzung).
 */
export async function cancelOrderMaterialVariante(
  varianteId: number
): Promise<OrderResult> {
  try {
    const id = Number(varianteId);
    if (!id || isNaN(id)) {
      return { success: false, error: "Ungültige Varianten-ID." };
    }

    let updatedVariante: any = null;

    try {
      updatedVariante = await db.materialVariante.update({
        where: { id },
        data: {
          isBestellt: false,
          bestelltAm: null,
          bestelltMenge: null,
          bestelltNotiz: null,
        },
        include: {
          material: true,
          groesse: true,
        },
      });
    } catch (prismaErr) {
      const pool = getDbPool();
      const res = await pool.query(
        `UPDATE "MaterialVariante" 
         SET "isBestellt" = false, "bestelltAm" = NULL, "bestelltMenge" = NULL, "bestelltNotiz" = NULL, "updatedAt" = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      if (res.rows.length === 0) {
        return { success: false, error: "Variante nicht gefunden." };
      }
      const mRes = await pool.query(
        `SELECT m.name as "materialName", g.name as "groesseName" 
         FROM "MaterialVariante" mv 
         LEFT JOIN "Material" m ON m.id = mv."materialId" 
         LEFT JOIN "Groesse" g ON g.id = mv."groesseId" 
         WHERE mv.id = $1`,
        [id]
      );
      const mRow = mRes.rows[0];
      updatedVariante = {
        ...res.rows[0],
        material: { name: mRow?.materialName || `Material #${res.rows[0].materialId}` },
        groesse: { name: mRow?.groesseName || "" },
      };
    }

    await logActivity({
      bereich: "OFFICE",
      aktion: "BESTELLUNG_STORNO",
      beschreibung: `Bestell-Status für "${updatedVariante.material.name}" (${updatedVariante.groesse.name}) aufgehoben.`,
      details: `Art.-Nr: ${updatedVariante.artikelnummer}`,
    });

    revalidatePath("/");
    revalidatePath("/office");
    revalidatePath("/admin");
    revalidatePath("/monteur");
    revalidatePath("/techniker");

    return {
      success: true,
      variante: {
        id: Number(updatedVariante.id),
        isBestellt: false,
        bestelltAm: null,
        bestelltMenge: null,
        bestelltNotiz: null,
      },
    };
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Bestellstatus:", error);
    return { success: false, error: "Bestellstatus konnte nicht aufgehoben werden." };
  }
}

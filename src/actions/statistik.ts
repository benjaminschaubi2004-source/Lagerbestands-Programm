"use server";

import { db } from "@/lib/db";

export interface VarianteStatistik {
  varianteId: number;
  artikelnummer: string;
  groesseName: string;
  materialId: number;
  materialName: string;
  hersteller: string | null;
  istBestand: number;
  mindestbestand: number;
  isCritical: boolean;
  isOutOfStock: boolean;
  totalZugangMenge: number;
  totalZugangAnzahl: number;
  totalAbgangMenge: number;
  totalAbgangAnzahl: number;
  totalBuchungenAnzahl: number;
  historischerHoechstbestand: number;
  historischerTiefstbestand: number;
  letzteBuchung: Date | null;
}

export interface HerstellerStatistik {
  hersteller: string;
  materialCount: number;
  variantenCount: number;
  gesamtBestand: number;
}

export interface LagerStatistikData {
  gesamtEinheitenIst: number;
  materialienGesamt: number;
  variantenGesamt: number;
  kritischeVarianten: number;
  ausverkaufteVarianten: number;
  gesunderBestand: number;

  gesamtZugangMenge: number;
  gesamtZugangBuchungen: number;
  gesamtAbgangMenge: number;
  gesamtAbgangBuchungen: number;
  gesamtBuchungen: number;

  herstellerListe: HerstellerStatistik[];
  variantenStatistik: VarianteStatistik[];
}

export async function getLagerStatistik(): Promise<LagerStatistikData> {
  try {
    const materialien = await db.material.findMany({
      orderBy: { name: "asc" },
      include: {
        varianten: {
          include: {
            groesse: { select: { id: true, name: true } },
            buchungen: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    let gesamtEinheitenIst = 0;
    let variantenGesamt = 0;
    let kritischeVarianten = 0;
    let ausverkaufteVarianten = 0;

    let gesamtZugangMenge = 0;
    let gesamtZugangBuchungen = 0;
    let gesamtAbgangMenge = 0;
    let gesamtAbgangBuchungen = 0;

    const herstellerMap = new Map<string, { materialIds: Set<number>; variantenCount: number; gesamtBestand: number }>();
    const variantenStatistik: VarianteStatistik[] = [];

    for (const mat of materialien) {
      const hKey = mat.hersteller?.trim() || "Ohne Herstellerangabe";
      if (!herstellerMap.has(hKey)) {
        herstellerMap.set(hKey, {
          materialIds: new Set<number>(),
          variantenCount: 0,
          gesamtBestand: 0,
        });
      }
      const hEntry = herstellerMap.get(hKey)!;
      hEntry.materialIds.add(mat.id);

      for (const v of mat.varianten) {
        variantenGesamt++;
        gesamtEinheitenIst += v.istBestand;
        hEntry.variantenCount++;
        hEntry.gesamtBestand += v.istBestand;

        const isCritical = v.istBestand <= v.mindestbestand;
        const isOutOfStock = v.istBestand === 0;
        if (isCritical) kritischeVarianten++;
        if (isOutOfStock) ausverkaufteVarianten++;

        let vZugangMenge = 0;
        let vZugangCount = 0;
        let vAbgangMenge = 0;
        let vAbgangCount = 0;
        let maxStand = v.istBestand;
        let minStand = v.istBestand;
        let lastDate: Date | null = null;

        for (const b of v.buchungen) {
          const typUpper = b.typ.toUpperCase();
          if (typUpper === "EINGANG" || typUpper === "EINNAHME") {
            vZugangMenge += b.menge;
            vZugangCount++;
            gesamtZugangMenge += b.menge;
            gesamtZugangBuchungen++;
          } else if (typUpper === "AUSGANG" || typUpper === "AUSGABE") {
            vAbgangMenge += b.menge;
            vAbgangCount++;
            gesamtAbgangMenge += b.menge;
            gesamtAbgangBuchungen++;
          }

          if (b.bestandNachher > maxStand) maxStand = b.bestandNachher;
          if (b.bestandVorher > maxStand) maxStand = b.bestandVorher;
          if (b.bestandNachher < minStand) minStand = b.bestandNachher;

          if (!lastDate || b.createdAt > lastDate) {
            lastDate = b.createdAt;
          }
        }

        variantenStatistik.push({
          varianteId: v.id,
          artikelnummer: v.artikelnummer,
          groesseName: v.groesse.name,
          materialId: mat.id,
          materialName: mat.name,
          hersteller: mat.hersteller,
          istBestand: v.istBestand,
          mindestbestand: v.mindestbestand,
          isCritical,
          isOutOfStock,
          totalZugangMenge: vZugangMenge,
          totalZugangAnzahl: vZugangCount,
          totalAbgangMenge: vAbgangMenge,
          totalAbgangAnzahl: vAbgangCount,
          totalBuchungenAnzahl: v.buchungen.length,
          historischerHoechstbestand: maxStand,
          historischerTiefstbestand: minStand,
          letzteBuchung: lastDate,
        });
      }
    }

    const herstellerListe: HerstellerStatistik[] = Array.from(herstellerMap.entries())
      .map(([hersteller, data]) => ({
        hersteller,
        materialCount: data.materialIds.size,
        variantenCount: data.variantenCount,
        gesamtBestand: data.gesamtBestand,
      }))
      .sort((a, b) => b.gesamtBestand - a.gesamtBestand);

    const gesunderBestand = variantenGesamt - kritischeVarianten;

    return {
      gesamtEinheitenIst,
      materialienGesamt: materialien.length,
      variantenGesamt,
      kritischeVarianten,
      ausverkaufteVarianten,
      gesunderBestand,

      gesamtZugangMenge,
      gesamtZugangBuchungen,
      gesamtAbgangMenge,
      gesamtAbgangBuchungen,
      gesamtBuchungen: gesamtZugangBuchungen + gesamtAbgangBuchungen,

      herstellerListe,
      variantenStatistik,
    };
  } catch (error) {
    console.error("Fehler beim Laden der Lagerstatistik:", error);
    return {
      gesamtEinheitenIst: 0,
      materialienGesamt: 0,
      variantenGesamt: 0,
      kritischeVarianten: 0,
      ausverkaufteVarianten: 0,
      gesunderBestand: 0,
      gesamtZugangMenge: 0,
      gesamtZugangBuchungen: 0,
      gesamtAbgangMenge: 0,
      gesamtAbgangBuchungen: 0,
      gesamtBuchungen: 0,
      herstellerListe: [],
      variantenStatistik: [],
    };
  }
}

"use client";

import React, { useState, useMemo } from "react";
import { MaterialWithVarianten, BuchungInfo } from "@/actions/materialien";
import { GroesseWithCount } from "@/actions/groessen";
import { AutoItem } from "@/actions/autos";
import { LagerStatistikData } from "@/actions/statistik";
import { TechnikerFinder } from "./TechnikerFinder";
import { OfficeView } from "./OfficeView";
import { ToastProvider, useToast } from "./Toast";
import {
  Boxes,
  Wrench,
  Building2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

interface DemoClientPageProps {
  initialMaterialien: MaterialWithVarianten[];
  initialGroessen: GroesseWithCount[];
  initialAutos: AutoItem[];
}

export function DemoClientPage({
  initialMaterialien,
  initialGroessen,
  initialAutos,
}: DemoClientPageProps) {
  return (
    <ToastProvider>
      <DemoClientPageContent
        initialMaterialien={initialMaterialien}
        initialGroessen={initialGroessen}
        initialAutos={initialAutos}
      />
    </ToastProvider>
  );
}

function DemoClientPageContent({
  initialMaterialien,
  initialGroessen,
  initialAutos,
}: DemoClientPageProps) {
  const { toast } = useToast();

  const [materialien, setMaterialien] = useState<MaterialWithVarianten[]>(initialMaterialien);
  const [autos, setAutos] = useState<AutoItem[]>(initialAutos);
  const [groessen] = useState<GroesseWithCount[]>(initialGroessen);
  const [buchungen, setBuchungen] = useState<BuchungInfo[]>([]);
  const [activeTab, setActiveTab] = useState<"monteur" | "office">("monteur");

  // Zurücksetzen aller Testbuchungen auf Ausgangszustand
  const handleResetDemoData = () => {
    setMaterialien(JSON.parse(JSON.stringify(initialMaterialien)));
    setAutos(JSON.parse(JSON.stringify(initialAutos)));
    setBuchungen([]);
    toast("Demo-Bestände wurden auf den Ausgangszustand zurückgesetzt! 🔄");
  };

  // Lokale Buchungsausführung ohne Datenbank-Schreibzugriff
  const handleDemoBooking = async (
    varianteId: number,
    menge: number,
    typ: "ausgabe" | "einnahme"
  ): Promise<{ success: boolean; neuerBestand?: number; error?: string }> => {
    let targetVariante: any = null;
    let targetMaterial: any = null;

    for (const m of materialien) {
      const found = m.varianten.find((v) => v.id === varianteId);
      if (found) {
        targetMaterial = m;
        targetVariante = found;
        break;
      }
    }

    if (!targetVariante) {
      return { success: false, error: "Variante nicht gefunden" };
    }

    if (typ === "ausgabe" && targetVariante.istBestand < menge) {
      return {
        success: false,
        error: `Nicht genügend Bestand! Verfügbar: ${targetVariante.istBestand} Stk.`,
      };
    }

    const bestandVorher = targetVariante.istBestand;
    const neuerBestand =
      typ === "ausgabe" ? bestandVorher - menge : bestandVorher + menge;

    // State aktualisieren
    setMaterialien((prev) =>
      prev.map((m) => {
        if (m.id !== targetMaterial.id) return m;
        return {
          ...m,
          varianten: m.varianten.map((v) => {
            if (v.id !== varianteId) return v;
            return { ...v, istBestand: neuerBestand };
          }),
        };
      })
    );

    // Buchungsjournal ergänzen
    const newBuchung: BuchungInfo = {
      id: Date.now(),
      typ: typ === "ausgabe" ? "AUSGABE" : "EINNAHME",
      menge: menge,
      bestandVorher: bestandVorher,
      bestandNachher: neuerBestand,
      createdAt: new Date(),
      variante: {
        id: targetVariante.id,
        artikelnummer: targetVariante.artikelnummer,
        material: {
          id: targetMaterial.id,
          name: targetMaterial.name,
        },
        groesse: {
          name: targetVariante.groesse.name,
        },
      },
    };

    setBuchungen((prev) => [newBuchung, ...prev]);

    return {
      success: true,
      neuerBestand: neuerBestand,
    };
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* 1. Auffälliges Demo-Modus Banner */}
      <div className="bg-amber-600 text-white px-3 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-200" />
            <span className="truncate">
              <strong>DEMO-MODUS:</strong> Alle Funktionen aktiv – keine Verbindung zur echten Datenbank.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
            title="Alle Teständerungen verwerfen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Header mit Monteur / Office Switcher (KEIN ADMIN) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight truncate">Lagerliste</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  Demo
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">
                {activeTab === "monteur" ? "Monteur-Assistent" : "Office-Übersicht"}
              </p>
            </div>
          </div>

          {/* Bereichs-Umschalter: Monteur vs Office */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setActiveTab("monteur")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "monteur"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Monteur</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("office")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "office"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Office</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hauptinhalt: Die echten Originalkomponenten! */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 pb-20">
        {activeTab === "monteur" ? (
          <TechnikerFinder
            materialien={materialien}
            groessen={groessen}
            buchungen={buchungen}
            autos={autos}
            currentMonteurName="Demo Monteur"
            onDataChanged={() => {}}
            onCustomBook={handleDemoBooking}
            isStandaloneMobile={true}
          />
        ) : (
          <OfficeView
            materialien={materialien}
            initialStatistik={null}
            initialAutos={autos}
          />
        )}
      </main>
    </div>
  );
}

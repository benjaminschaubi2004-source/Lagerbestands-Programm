"use client";

import React, { useState, useMemo } from "react";
import {
  Ruler,
  Scissors,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  Layers,
  ArrowRight,
  Sparkles,
  FileText,
} from "lucide-react";
import { useToast } from "./Toast";

export type RechnerTyp = "rollladen_kasten" | "rollladen_schiene";

interface BerechnungsProfil {
  id: RechnerTyp;
  titel: string;
  untertitel: string;
  kategorie: string;
  abzugBreite: number; // in mm
  abzugHoehe: number; // in mm
  erklaerungBreite: string;
  erklaerungHoehe: string;
  hinweis: string;
}

const BERECHNUNGS_PROFILE: BerechnungsProfil[] = [
  {
    id: "rollladen_kasten",
    titel: "Rollladenbehang – Kastenzuschnitt",
    untertitel: "Breite -75 mm | Höhe -100 mm (10 cm)",
    kategorie: "Rollladen",
    abzugBreite: 75,
    abzugHoehe: 100,
    erklaerungBreite: "Kastenzuschnitt-Abzugsmaß: -75 mm",
    erklaerungHoehe: "Höhen-Abzugsmaß: -100 mm (10 cm)",
    hinweis:
      "Vom gemessenen Maß wird in der Breite 75 mm abgezogen (Kastenzuschnitt) und in der Höhe 100 mm (10 cm).",
  },
  {
    id: "rollladen_schiene",
    titel: "Rollladenbehang – Schienenzwischenmaß",
    untertitel: "Breite -20 mm (2 cm Luft & Arretierung)",
    kategorie: "Rollladen",
    abzugBreite: 20,
    abzugHoehe: 0,
    erklaerungBreite: "Luft & Arretierung Abzug: -20 mm (2 cm) insgesamt",
    erklaerungHoehe: "Kein Höhenabzug (1:1 übernommen)",
    hinweis:
      "Vom Schienenzwischenmaß wird für Luft und Arretierung insgesamt minus 20 mm (2 cm) abgezogen.",
  },
];

interface GespeichertesMass {
  id: string;
  bezeichnung: string;
  profilTitel: string;
  eingabeBreite: number;
  eingabeHoehe: number;
  fertigBreite: number;
  fertigHoehe: number;
  abzugBreite: number;
  abzugHoehe: number;
  zeitpunkt: string;
}

interface MassRechnerProps {
  embeddedIn?: "MONTEUR" | "OFFICE";
}

export function MassRechner({ embeddedIn = "MONTEUR" }: MassRechnerProps) {
  const { toast } = useToast();

  const [ausgewaehltesProfilId, setAusgewaehltesProfilId] = useState<RechnerTyp>("rollladen_kasten");
  const [breiteInput, setBreiteInput] = useState<string>("");
  const [hoeheInput, setHoeheInput] = useState<string>("");
  const [raumBezeichnung, setRaumBezeichnung] = useState<string>("");
  const [einheit, setEinheit] = useState<"mm" | "cm">("mm");
  const [merkliste, setMerkliste] = useState<GespeichertesMass[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const profil = useMemo(() => {
    return (
      BERECHNUNGS_PROFILE.find((p) => p.id === ausgewaehltesProfilId) ||
      BERECHNUNGS_PROFILE[0]
    );
  }, [ausgewaehltesProfilId]);

  // Berechnung in Millimeter umrechnen
  const parsedBreiteMm = useMemo(() => {
    const val = parseFloat(breiteInput.replace(",", "."));
    if (isNaN(val) || val <= 0) return null;
    return einheit === "cm" ? Math.round(val * 10) : Math.round(val);
  }, [breiteInput, einheit]);

  const parsedHoeheMm = useMemo(() => {
    const val = parseFloat(hoeheInput.replace(",", "."));
    if (isNaN(val) || val <= 0) return null;
    return einheit === "cm" ? Math.round(val * 10) : Math.round(val);
  }, [hoeheInput, einheit]);

  // Fertigmaße
  const fertigBreite = useMemo(() => {
    if (parsedBreiteMm === null) return null;
    return Math.max(0, parsedBreiteMm - profil.abzugBreite);
  }, [parsedBreiteMm, profil.abzugBreite]);

  const fertigHoehe = useMemo(() => {
    if (parsedHoeheMm === null) return null;
    return Math.max(0, parsedHoeheMm - profil.abzugHoehe);
  }, [parsedHoeheMm, profil.abzugHoehe]);

  const hatErgebnis = fertigBreite !== null && fertigHoehe !== null;

  // Maße in Zwischenablage kopieren
  const handleCopyResult = (textToCopy: string, id: string = "main") => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    toast("Maß in Zwischenablage kopiert.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Maß zur Merkliste hinzufügen
  const handleAddToMerkliste = () => {
    if (!hatErgebnis || parsedBreiteMm === null || parsedHoeheMm === null || fertigBreite === null || fertigHoehe === null) {
      toast("Bitte erst Breite und Höhe eingeben.", "error");
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const bezeichnung = raumBezeichnung.trim() || `Position ${merkliste.length + 1}`;

    const neuerEintrag: GespeichertesMass = {
      id: Math.random().toString(36).substring(2, 9),
      bezeichnung,
      profilTitel: profil.titel,
      eingabeBreite: parsedBreiteMm,
      eingabeHoehe: parsedHoeheMm,
      fertigBreite,
      fertigHoehe,
      abzugBreite: profil.abzugBreite,
      abzugHoehe: profil.abzugHoehe,
      zeitpunkt: timeStr,
    };

    setMerkliste((prev) => [neuerEintrag, ...prev]);
    toast(`"${bezeichnung}" zur Liste hinzugefügt.`);
    setRaumBezeichnung("");
  };

  const handleResetInputs = () => {
    setBreiteInput("");
    setHoeheInput("");
    setRaumBezeichnung("");
  };

  const handleCopyAllMerkliste = () => {
    if (merkliste.length === 0) return;
    const lines = merkliste.map(
      (m, idx) =>
        `${idx + 1}. ${m.bezeichnung} (${m.profilTitel}): Zuschnitt ${m.fertigBreite} × ${m.fertigHoehe} mm (Gemessen: ${m.eingabeBreite} × ${m.eingabeHoehe} mm)`
    );
    navigator.clipboard.writeText(lines.join("\n"));
    toast(`${merkliste.length} Positionen kopiert.`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Header Info */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Aufmaß- & Abzugsrechner</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                  {embeddedIn === "OFFICE" ? "Office" : "Monteur"}
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Wähle die passende Berechnung aus dem Menü und gib deine gemessenen Maße ein.
              </p>
            </div>
          </div>

          {/* Maßeinheit Umschalter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setEinheit("mm")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                einheit === "mm"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              mm
            </button>
            <button
              type="button"
              onClick={() => setEinheit("cm")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                einheit === "cm"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              cm
            </button>
          </div>
        </div>
      </div>

      {/* SCHRITT 1: BERECHNUNGS-MENÜ (Auswahl) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block flex items-center justify-between">
          <span>1. Berechnungsart auswählen</span>
          <span className="text-[11px] font-normal text-zinc-400">Rollladenbehang</span>
        </label>

        {/* Menü-Kacheln für verschiedene Berechnungsformeln */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {BERECHNUNGS_PROFILE.map((item) => {
            const isSelected = item.id === ausgewaehltesProfilId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAusgewaehltesProfilId(item.id)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold">{item.titel}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {item.untertitel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailhinweis zur Formel */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <span>{profil.hinweis}</span>
        </div>
      </div>

      {/* SCHRITT 2: MAßE EINGEBEN */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            2. Gemessene Maße ({einheit})
          </label>
          {(breiteInput || hoeheInput || raumBezeichnung) && (
            <button
              type="button"
              onClick={handleResetInputs}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Felder leeren</span>
            </button>
          )}
        </div>

        {/* Optionale Raum-/Positionsangabe */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Raum / Fenster / Baustelle (optional)
          </label>
          <input
            type="text"
            placeholder="z.B. Wohnzimmer links, Fenster 1 EG..."
            value={raumBezeichnung}
            onChange={(e) => setRaumBezeichnung(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gemessene Breite */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Gemessene Breite *</span>
              <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                Abzug: -{profil.abzugBreite} mm
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder={einheit === "mm" ? "z.B. 1200" : "z.B. 120.0"}
                value={breiteInput}
                onChange={(e) => setBreiteInput(e.target.value)}
                className="w-full pl-3.5 pr-12 py-3 text-base font-bold border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                {einheit}
              </span>
            </div>
            {parsedBreiteMm !== null && parsedBreiteMm < profil.abzugBreite && (
              <p className="text-[11px] text-red-500 mt-1 font-semibold">
                Eingabemaß muss mindestens {profil.abzugBreite} mm betragen!
              </p>
            )}
          </div>

          {/* Gemessene Höhe */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Gemessene Höhe / Länge *</span>
              <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                {profil.abzugHoehe > 0 ? `Abzug: -${profil.abzugHoehe} mm` : "Kein Abzug"}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder={einheit === "mm" ? "z.B. 1500" : "z.B. 150.0"}
                value={hoeheInput}
                onChange={(e) => setHoeheInput(e.target.value)}
                className="w-full pl-3.5 pr-12 py-3 text-base font-bold border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                {einheit}
              </span>
            </div>
            {parsedHoeheMm !== null && parsedHoeheMm < profil.abzugHoehe && (
              <p className="text-[11px] text-red-500 mt-1 font-semibold">
                Eingabemaß muss mindestens {profil.abzugHoehe} mm betragen!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SCHRITT 3: BERECHNETES ERGEBNIS */}
      {hatErgebnis ? (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl p-5 sm:p-6 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Fertiges Zuschnittsmaß
            </span>
            <span className="text-xs font-medium text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full">
              {profil.titel}
            </span>
          </div>

          {/* Große Anzeige */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/20 pb-4">
            <div className="text-3xl sm:text-4xl font-black tracking-tight">
              {fertigBreite} × {fertigHoehe} <span className="text-xl sm:text-2xl font-bold text-indigo-200">mm</span>
            </div>
            {einheit === "cm" && (
              <div className="text-sm font-semibold text-indigo-100">
                entspricht {(fertigBreite! / 10).toFixed(1)} × {(fertigHoehe! / 10).toFixed(1)} cm
              </div>
            )}
          </div>

          {/* Detail-Aufschlüsselung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 p-3 rounded-xl space-y-1">
              <span className="font-semibold text-indigo-200 block">Breiten-Berechnung:</span>
              <div className="font-mono text-sm font-bold">
                {parsedBreiteMm} mm - {profil.abzugBreite} mm ={" "}
                <span className="text-white underline">{fertigBreite} mm</span>
              </div>
              <span className="text-[11px] text-indigo-200 block">{profil.erklaerungBreite}</span>
            </div>

            <div className="bg-white/10 p-3 rounded-xl space-y-1">
              <span className="font-semibold text-indigo-200 block">Höhen-Berechnung:</span>
              <div className="font-mono text-sm font-bold">
                {parsedHoeheMm} mm {profil.abzugHoehe > 0 ? `- ${profil.abzugHoehe} mm` : "± 0 mm"} ={" "}
                <span className="text-white underline">{fertigHoehe} mm</span>
              </div>
              <span className="text-[11px] text-indigo-200 block">{profil.erklaerungHoehe}</span>
            </div>
          </div>

          {/* Aktionen: Kopieren & Zur Merkliste */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() =>
                handleCopyResult(
                  `${raumBezeichnung ? `${raumBezeichnung}: ` : ""}${fertigBreite} x ${fertigHoehe} mm`,
                  "main"
                )
              }
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {copiedId === "main" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>Maße kopieren ({fertigBreite} × {fertigHoehe} mm)</span>
            </button>

            <button
              type="button"
              onClick={handleAddToMerkliste}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/20 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Zur Merkliste hinzufügen</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 dark:text-zinc-600 space-y-2">
          <Scissors className="w-8 h-8 mx-auto stroke-1" />
          <p className="text-xs font-medium text-zinc-500">
            Gib oben Breite und Höhe ein, um das fertige Zuschnittsmaß sofort zu berechnen.
          </p>
        </div>
      )}

      {/* SCHRITT 4: MERKLISTE / BERECHNETE MAßE */}
      {merkliste.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Merkliste ({merkliste.length})
              </span>
              <span className="text-[11px] text-zinc-400">• Zuletzt berechnet</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAllMerkliste}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Alle Maße kopieren"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Alle kopieren</span>
              </button>
              <button
                type="button"
                onClick={() => setMerkliste([])}
                className="px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                title="Liste leeren"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {merkliste.map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-lg px-2 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>{item.bezeichnung}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800">
                      {item.profilTitel}
                    </span>
                  </div>
                  <div className="text-zinc-500 font-mono text-[11px]">
                    Gemessen: {item.eingabeBreite} × {item.eingabeHoehe} mm (Abzug B:-{item.abzugBreite} H:-{item.abzugHoehe})
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {item.fertigBreite} × {item.fertigHoehe} mm
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyResult(
                        `${item.bezeichnung}: ${item.fertigBreite} x ${item.fertigHoehe} mm`,
                        item.id
                      )
                    }
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Kopieren"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMerkliste((prev) => prev.filter((m) => m.id !== item.id))}
                    className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                    title="Löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

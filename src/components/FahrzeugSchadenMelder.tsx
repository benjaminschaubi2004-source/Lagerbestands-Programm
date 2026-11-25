"use client";

import React, { useState, useTransition, useMemo } from "react";
import { AutoItem, reportFahrzeugSchaden } from "@/actions/autos";
import {
  Car,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  RotateCcw,
  Gauge,
  User,
  FileText,
  Search,
  Lock,
} from "lucide-react";
import { useToast } from "./Toast";

interface FahrzeugSchadenMelderProps {
  autos: AutoItem[];
  currentMonteurName?: string;
  onSchadenGemeldet: () => void;
}

export function FahrzeugSchadenMelder({
  autos,
  currentMonteurName = "Monteur",
  onSchadenGemeldet,
}: FahrzeugSchadenMelderProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedAutoId, setSelectedAutoId] = useState<number | null>(() => {
    return autos.length > 0 ? autos[0].id : null;
  });

  const [schadenText, setSchadenText] = useState("");
  const [dringlichkeit, setDringlichkeit] = useState<"DEFEKT" | "WERKSTATT" | "BEREIT">("DEFEKT");
  const [kmStandInput, setKmStandInput] = useState<string>("");
  const reporterName = currentMonteurName?.trim() || "Monteur";
  const [searchCar, setSearchCar] = useState("");

  const filteredAutos = useMemo(() => {
    if (!searchCar.trim()) return autos;
    const term = searchCar.toLowerCase().trim();
    return autos.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        (a.kennzeichen && a.kennzeichen.toLowerCase().includes(term)) ||
        (a.modell && a.modell.toLowerCase().includes(term))
    );
  }, [autos, searchCar]);

  const selectedAuto = useMemo(() => {
    return autos.find((a) => a.id === selectedAutoId) || autos[0] || null;
  }, [autos, selectedAutoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuto) {
      toast("Bitte ein Fahrzeug auswählen.", "error");
      return;
    }
    const trimmedText = schadenText.trim();
    if (!trimmedText) {
      toast("Bitte beschreibe den Schaden oder Mangel.", "error");
      return;
    }

    const km = kmStandInput ? parseInt(kmStandInput, 10) : undefined;

    startTransition(async () => {
      try {
        const res = await reportFahrzeugSchaden({
          autoId: selectedAuto.id,
          schaden: trimmedText,
          status: dringlichkeit,
          kilometerstand: km && !isNaN(km) ? km : undefined,
          gemeldetVon: reporterName,
        });

        if (res.success) {
          toast(`Schadensmeldung für "${selectedAuto.name}" erfolgreich übermittelt!`);
          setSchadenText("");
          setKmStandInput("");
          onSchadenGemeldet();
        } else {
          toast(res.error || "Fehler beim Senden der Meldung.", "error");
        }
      } catch (err) {
        console.error("Fehler beim Schaden melden:", err);
        toast("Netzwerkfehler beim Übertragen der Meldung.", "error");
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Info */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Fahrzeugschaden melden
            </h2>
            <p className="text-xs text-zinc-500">
              Mängel, Schäden oder Defekte direkt an das Office-Team übermitteln.
            </p>
          </div>
        </div>
      </div>

      {autos.length === 0 ? (
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 space-y-2">
          <Car className="w-10 h-10 mx-auto stroke-1 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Noch keine Fahrzeuge im Fuhrpark hinterlegt.
          </p>
          <p className="text-xs text-zinc-400">
            Fahrzeuge können im Office-Bereich angelegt werden.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Schritt 1: Fahrzeug auswählen */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              1. Betroffenes Fahrzeug wählen
            </label>

            <select
              value={selectedAuto?.id ?? ""}
              onChange={(e) => setSelectedAutoId(Number(e.target.value))}
              className="w-full px-3.5 py-3 text-sm font-semibold border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {autos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.kennzeichen ? `(${a.kennzeichen})` : ""} - Status: {a.status}
                </option>
              ))}
            </select>

            {/* Fahrzeug Schnellübersicht */}
            {selectedAuto && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {selectedAuto.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedAuto.status === "BEREIT"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : selectedAuto.status === "WERKSTATT"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {selectedAuto.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  {selectedAuto.kennzeichen && (
                    <div>
                      Kennzeichen: <strong className="text-zinc-800 dark:text-zinc-200">{selectedAuto.kennzeichen}</strong>
                    </div>
                  )}
                  {selectedAuto.modell && (
                    <div>
                      Modell: <strong className="text-zinc-800 dark:text-zinc-200">{selectedAuto.modell}</strong>
                    </div>
                  )}
                  {selectedAuto.kilometerstand && (
                    <div>
                      KM-Stand: <strong className="text-zinc-800 dark:text-zinc-200">{selectedAuto.kilometerstand.toLocaleString("de-DE")} km</strong>
                    </div>
                  )}
                </div>

                {selectedAuto.defekte && (
                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                      Bisher bekannte Mängel:
                    </span>
                    <pre className="text-[11px] whitespace-pre-wrap font-sans text-zinc-600 dark:text-zinc-300 bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60 max-h-28 overflow-y-auto">
                      {selectedAuto.defekte}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schritt 2: Schadensdetails */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              2. Schaden & Details beschreiben
            </label>

            {/* Beschreibung Textarea */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Schadens- oder Mangelbeschreibung *
              </label>
              <textarea
                required
                rows={3}
                value={schadenText}
                onChange={(e) => setSchadenText(e.target.value)}
                placeholder="z.B. Reifendruckverlust vorne rechts, Steinschlag Windschutzscheibe Beifahrerseite, Blinker hinten links defekt..."
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Dringlichkeit / Status-Auswahl */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Fahrbereitschaft / Einstufung
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDringlichkeit("DEFEKT")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 ${
                    dringlichkeit === "DEFEKT"
                      ? "bg-red-50 dark:bg-red-950 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-red-500/20"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Defekt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDringlichkeit("WERKSTATT")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 ${
                    dringlichkeit === "WERKSTATT"
                      ? "bg-purple-50 dark:bg-purple-950 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-purple-600" />
                  <span>Werkstatt fällig</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDringlichkeit("BEREIT")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 ${
                    dringlichkeit === "BEREIT"
                      ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fahrbereit (Hinweis)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {/* Kilometerstand */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-zinc-400" />
                  Aktueller KM-Stand (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="z.B. 94250"
                  value={kmStandInput}
                  onChange={(e) => setKmStandInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Gemeldet von (Automatisch ausgewählt & nicht änderbar) */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  Gemeldet von (Monteur)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={reporterName}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="w-full pl-3.5 pr-24 py-2 text-sm border border-zinc-200 dark:border-zinc-700/80 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 font-semibold cursor-not-allowed select-none"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-200/80 dark:bg-zinc-700/80 px-2 py-0.5 rounded-md select-none">
                    <Lock className="w-2.5 h-2.5 text-zinc-500" />
                    <span>Automatisch</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Wird automatisch aus deinem angemeldeten Profil übernommen und kann nicht geändert werden.
                </p>
              </div>
            </div>

            {/* Senden Button */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isPending || !schadenText.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isPending ? "Wird übertragen..." : "Schaden jetzt ans Office senden"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

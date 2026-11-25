"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  MaterialWithVarianten,
  BuchungInfo,
  bookBestand,
} from "@/actions/materialien";
import { GroesseWithCount } from "@/actions/groessen";
import {
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Check,
  Plus,
  Minus,
  ArrowDownCircle,
  ArrowUpCircle,
  PlusCircle,
  Search,
  History,
  Clock,
  ArrowRight,
  X,
  Trash2,
  Car,
  Ruler,
} from "lucide-react";
import { useToast } from "./Toast";
import { VarianteModal } from "./VarianteModal";
import { MaterialModal } from "./MaterialModal";
import { ConfirmModal } from "./ConfirmModal";
import { FahrzeugSchadenMelder } from "./FahrzeugSchadenMelder";
import { MassRechner } from "./MassRechner";
import { MeldungForm } from "./MeldungForm";
import { clearAndBackupAllLogs } from "@/actions/logs";
import { AutoItem } from "@/actions/autos";
import { MessageSquarePlus } from "lucide-react";

interface TechnikerFinderProps {
  materialien: MaterialWithVarianten[];
  groessen: GroesseWithCount[];
  buchungen?: BuchungInfo[];
  autos?: AutoItem[];
  currentMonteurName?: string;
  onDataChanged: () => void;
  isStandaloneMobile?: boolean;
  isAdmin?: boolean;
}

export function TechnikerFinder({
  materialien,
  groessen,
  buchungen = [],
  autos = [],
  currentMonteurName = "Monteur",
  onDataChanged,
  isStandaloneMobile = false,
  isAdmin = false,
}: TechnikerFinderProps) {
  const { toast } = useToast();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const res = await clearAndBackupAllLogs();
      if (res.success) {
        toast(`Logs erfolgreich geleert! Backup erstellt: ${res.backupFileName}`);
        setIsClearModalOpen(false);
        onDataChanged();
      } else {
        toast(res.message || "Fehler beim Leeren der Logs.", "error");
      }
    } catch {
      toast("Fehler beim Ausführen der Aktion.", "error");
    } finally {
      setIsClearing(false);
    }
  };

  // Aktiver Tab auf Mobile: "buchen" | "schaden" | "rechner" | "meldung" | "journal"
  const [activeMobileView, setActiveMobileView] = useState<"buchen" | "schaden" | "rechner" | "meldung" | "journal">("buchen");

  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(() => {
    return materialien.length > 0 ? materialien[0].id : null;
  });
  const [selectedVarianteId, setSelectedVarianteId] = useState<number | null>(null);
  const [menge, setMenge] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [isAddVarianteOpen, setIsAddVarianteOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  // Finde das ausgewählte Material
  const currentMaterial = useMemo(() => {
    return materialien.find((m) => m.id === selectedMaterialId) || null;
  }, [materialien, selectedMaterialId]);

  // Gefilterte Materialien für Suchleiste
  const filteredMaterialien = useMemo(() => {
    if (!materialSearch.trim()) return materialien;
    const term = materialSearch.toLowerCase().trim();
    return materialien.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.hersteller && m.hersteller.toLowerCase().includes(term)) ||
        (m.beschreibung && m.beschreibung.toLowerCase().includes(term))
    );
  }, [materialien, materialSearch]);

  // Wenn Suche aktiv ist und aktuelles Material nicht mehr in der Liste ist: erstes Treffer-Material wählen
  useEffect(() => {
    if (filteredMaterialien.length > 0) {
      const isStillInFiltered = filteredMaterialien.some((m) => m.id === selectedMaterialId);
      if (!isStillInFiltered) {
        setSelectedMaterialId(filteredMaterialien[0].id);
      }
    }
  }, [filteredMaterialien, selectedMaterialId]);

  // Verfügbare Varianten für das gewählte Material
  const availableVarianten = useMemo(() => {
    if (!currentMaterial) return [];
    return currentMaterial.varianten;
  }, [currentMaterial]);

    // Synchronisiere ausgewählte Variante wenn Material wechselt
    useEffect(() => {
      if (availableVarianten.length > 0) {
        const stillValid = availableVarianten.some((v) => v.id === selectedVarianteId);
        if (!stillValid) {
          setSelectedVarianteId(availableVarianten[0].id);
        }
      } else {
        setSelectedVarianteId(null);
      }
    }, [selectedMaterialId, availableVarianten]);

    // Finde die aktive Variante direkt über ID
    const currentVariante = useMemo(() => {
      if (!availableVarianten.length) return null;
      return availableVarianten.find((v) => v.id === selectedVarianteId) || availableVarianten[0] || null;
    }, [availableVarianten, selectedVarianteId]);

    const isKleinkram =
      currentMaterial?.kategorie === "SCHRAUBEN_KLEINKRAM" || currentMaterial?.einheit === "Pakete";
    const unitText = isKleinkram ? "Pakete" : "Stk.";
    const unitSingular = isKleinkram ? "Paket" : "Stk.";

    const handleBooking = async (typ: "ausgabe" | "einnahme") => {
      if (!currentVariante || menge <= 0) return;
        try {
          setIsBooking(true);
          const res = await bookBestand(currentVariante.id, menge, typ);
          if (res.success) {
            const actionText = typ === "ausgabe" ? "Ausgabe verbucht" : "Eingang verbucht";
            const bookingUnit = isKleinkram ? (menge === 1 ? "Paket" : "Pakete") : "Stk.";
            toast(
              `${actionText}: ${menge} ${bookingUnit}. Neuer Lagerbestand: ${res.neuerBestand} ${bookingUnit}`
            );
            setMenge(1);
            onDataChanged();
          } else {
            toast(res.error || "Fehler beim Buchen", "error");
          }
        } catch (err: any) {
          toast("Fehler: " + (err?.message || "Buchung konnte nicht abgeschlossen werden"), "error");
        } finally {
          setIsBooking(false);
        }
      };

      const isBelowMin =
      currentVariante && currentVariante.istBestand <= currentVariante.mindestbestand;

      const formatBuchungsDatum = (d: Date) => {
        const date = new Date(d);
        return date.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      return (
        <div className="w-full max-w-2xl mx-auto space-y-4 pb-16 touch-manipulation">
          {/* Umschalter für Monteure: Material buchen vs. Auto-Schaden vs. Maß-Rechner vs. Meldung an Admin vs. Journal */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveMobileView("buchen")}
              className={`min-h-[44px] py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                activeMobileView === "buchen"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:bg-zinc-100 dark:active:bg-zinc-800"
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="truncate">Material</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileView("schaden")}
              className={`min-h-[44px] py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                activeMobileView === "schaden"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:bg-zinc-100 dark:active:bg-zinc-800"
              }`}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span className="truncate">Auto-Schaden</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileView("rechner")}
              className={`min-h-[44px] py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                activeMobileView === "rechner"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:bg-zinc-100 dark:active:bg-zinc-800"
              }`}
            >
              <Ruler className="w-4 h-4 shrink-0" />
              <span className="truncate">Maß-Rechner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileView("meldung")}
              className={`min-h-[44px] py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                activeMobileView === "meldung"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:bg-zinc-100 dark:active:bg-zinc-800"
              }`}
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="truncate">Admin-Meldung</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileView("journal")}
              className={`min-h-[44px] py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation col-span-2 sm:col-span-1 ${
                activeMobileView === "journal"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:bg-zinc-100 dark:active:bg-zinc-800"
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="truncate">Journal</span>
              {buchungen.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                    activeMobileView === "journal"
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {buchungen.length}
                </span>
              )}
            </button>
          </div>

          {/* VIEW 1: MATERIAL BUCHEN */}
          {activeMobileView === "buchen" && (
            <div className="space-y-4">
                {/* Schritt 1: Material auswählen */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      1. Material
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddMaterialOpen(true)}
                      className="min-h-[40px] text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 active:bg-indigo-100 transition-colors touch-manipulation"
                      title="Neues Material anlegen"
                    >
                      <Plus className="w-4 h-4" />
                      + Material hinzufügen
                    </button>
                  </div>

                  {/* Suchfeld */}
                  <div className="relative mb-2.5">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Material filtern (z.B. T5, Wago, Klemmen)..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium touch-manipulation"
                    />
                    {materialSearch && (
                      <button
                        type="button"
                        onClick={() => setMaterialSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {filteredMaterialien.length === 0 ? (
                    <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-2.5">
                      <p className="text-xs font-medium text-indigo-900 dark:text-indigo-300">
                        Kein Material gefunden{materialSearch ? ` für "${materialSearch}"` : ""}.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddMaterialOpen(true)}
                        className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs touch-manipulation"
                      >
                        <Plus className="w-4 h-4" />
                        Jetzt &quot;{materialSearch.trim() || "Neues Material"}&quot; anlegen
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedMaterialId ?? ""}
                      onChange={(e) => {
                        const newId = Number(e.target.value) || null;
                        setSelectedMaterialId(newId);
                      }}
                      className="w-full px-3.5 py-3 text-base sm:text-sm font-semibold border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer touch-manipulation"
                    >
                      {filteredMaterialien.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                          {m.hersteller ? ` [${m.hersteller}]` : ""} ({m.varianten.length}{" "}
                          {m.varianten.length === 1 ? "Variante" : "Varianten"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Schritt 2: Variante auswählen */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      2. Variante
                    </label>

                    {currentMaterial && (
                      <button
                        type="button"
                        onClick={() => setIsAddVarianteOpen(true)}
                        className="min-h-[40px] text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 active:bg-indigo-100 transition-colors touch-manipulation"
                      >
                        <PlusCircle className="w-4 h-4" />
                        + Variante hinzufügen
                      </button>
                    )}
                  </div>

                  {availableVarianten.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2.5">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        Für dieses Material sind noch keine Varianten hinterlegt.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddVarianteOpen(true)}
                        className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs touch-manipulation"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Jetzt erste Variante anlegen
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                        {/* Große, responsive Touch-Kacheln für alle Varianten (auf Mobile kompakt) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                          {availableVarianten.map((v) => {
                            const isSelected = currentVariante?.id === v.id;
                            const isCritical = v.istBestand <= v.mindestbestand;

                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedVarianteId(v.id)}
                                className={`min-h-[46px] sm:min-h-[64px] p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-colors cursor-pointer flex flex-col justify-between touch-manipulation ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md font-bold ring-2 ring-indigo-400/40"
                                    : "bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 active:bg-zinc-200 dark:active:bg-zinc-700"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs sm:text-sm font-bold truncate leading-tight">
                                    {v.groesse.name}
                                  </span>
                                  {isSelected && (
                                    <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1.5 font-semibold flex items-center justify-between gap-1 ${
                                    isSelected
                                      ? "text-indigo-100"
                                      : isCritical
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-zinc-500 dark:text-zinc-400"
                                  }`}
                                >
                                  <span>Bestand: {v.istBestand}</span>
                                  {isCritical && !isSelected && (
                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                    </div>
                  )}
                </div>

                {/* Schritt 3: Details & Buchungs-Bereich (Entnehmen / Einlagern) */}
                {currentVariante && (
                  <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-500/50 dark:border-indigo-500/40 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
                    {/* Artikeldaten & Bestandsstatus */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                          Gewählte Variante
                        </span>
                        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{currentMaterial?.name} – {currentVariante.groesse.name}</span>
                          {currentMaterial?.hersteller && (
                            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              🏷️ {currentMaterial.hersteller}
                            </span>
                          )}
                          {isKleinkram && (
                            <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                              <span>🔩 Schrauben/Kleinkram</span>
                              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">(in Paketen)</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                            {currentVariante.artikelnummer}
                          </span>
                        </div>
                      </div>

                      {/* Status-Badge */}
                      <div>
                        {isBelowMin ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>{currentVariante.istBestand === 0 ? "Ausverkauft" : "Meldebestand unterschritten"}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Bestand OK</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kennzahlen (auf Mobile kompakt) */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Mindestbestand
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
                          <span className="text-xs sm:text-base font-semibold sm:font-bold text-zinc-800 dark:text-zinc-200">
                            {currentVariante.mindestbestand} {unitText}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border ${isBelowMin
                            ? "bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800"
                            : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800"
                          }`}
                      >
                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Ist-Lagerbestand
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                          <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                          <span className="text-xs sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                            {currentVariante.istBestand} {unitText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mengenauswahl */}
                    <div className="space-y-2 pt-1 w-full">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                        3. Menge wählen
                      </label>

                      <div className="flex items-center gap-2 w-full max-w-full">
                        <button
                          type="button"
                          onClick={() => setMenge((prev) => Math.max(1, prev - 1))}
                          className="min-h-[48px] h-12 w-12 sm:w-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xl flex items-center justify-center hover:bg-zinc-200 active:bg-zinc-300 transition-colors cursor-pointer touch-manipulation shrink-0"
                          title="Menge verringern"
                        >
                          <Minus className="w-5 h-5" />
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={menge}
                          onChange={(e) => setMenge(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 min-w-0 w-full min-h-[48px] h-12 text-center text-xl font-bold border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                        />

                        <button
                          type="button"
                          onClick={() => setMenge((prev) => prev + 1)}
                          className="min-h-[48px] h-12 w-12 sm:w-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xl flex items-center justify-center hover:bg-zinc-200 active:bg-zinc-300 transition-colors cursor-pointer touch-manipulation shrink-0"
                          title="Menge erhöhen"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Schnellauswahl Buttons */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1 w-full">
                        {[1, 2, 5, 10].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => setMenge(step)}
                            className={`min-h-[40px] py-1 px-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer touch-manipulation text-center ${
                              menge === step
                                ? "bg-indigo-100 dark:bg-indigo-950 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-extrabold ring-1 ring-indigo-400"
                                : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 active:bg-zinc-200"
                            }`}
                          >
                            {step} {isKleinkram ? (step === 1 ? "Paket" : "Pakete") : "Stk."}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Buchungs-Aktionen: Entnehmen (Ausgabe) oder Einlagern (Einnahme) - Auf Mobile größer & griffiger */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2.5 sm:gap-3">
                      {/* AUSGABE */}
                      <button
                        type="button"
                        disabled={isBooking || currentVariante.istBestand <= 0}
                        onClick={() => handleBooking("ausgabe")}
                        className="min-h-[66px] sm:min-h-[56px] py-2.5 sm:py-2 px-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-manipulation"
                      >
                        <div className="flex items-center gap-1.5 font-extrabold text-base sm:text-sm">
                          <ArrowDownCircle className="w-5 h-5" />
                          <span>Ausgabe</span>
                        </div>
                        <span className="text-xs sm:text-[11px] font-normal opacity-95">
                          {currentVariante.istBestand <= 0
                            ? "Kein Bestand"
                            : `${menge} ${menge === 1 ? unitSingular : unitText} entnehmen`}
                        </span>
                      </button>

                      {/* EINNAHME */}
                      <button
                        type="button"
                        disabled={isBooking}
                        onClick={() => handleBooking("einnahme")}
                        className="min-h-[66px] sm:min-h-[56px] py-2.5 sm:py-2 px-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-manipulation"
                      >
                        <div className="flex items-center gap-1.5 font-extrabold text-base sm:text-sm">
                          <ArrowUpCircle className="w-5 h-5" />
                          <span>Einnahme</span>
                        </div>
                        <span className="text-xs sm:text-[11px] font-normal opacity-95">
                          {menge} {menge === 1 ? unitSingular : unitText} einlagern
                        </span>
                      </button>
                    </div>
            </div>
          )}
        </div>
      )}

          {/* VIEW 2: FAHRZEUG-SCHADEN MELDEN */}
          {activeMobileView === "schaden" && (
            <FahrzeugSchadenMelder
              autos={autos}
              currentMonteurName={currentMonteurName}
              onSchadenGemeldet={onDataChanged}
            />
          )}

          {/* VIEW 3: AUFMAß- / ABZUGSRECHNER */}
          {activeMobileView === "rechner" && (
            <MassRechner embeddedIn="MONTEUR" />
          )}

          {/* VIEW 4: MELDUNG AN DEN ADMIN */}
          {activeMobileView === "meldung" && (
            <MeldungForm
              bereich="MONTEUR"
              currentUserName={currentMonteurName}
              onSuccess={onDataChanged}
              title="Meldung an den Administrator"
              subtitle="Ideen, Werkzeug-Wünsche, Baustellen-Probleme oder Feedback direkt an die Geschäftsleitung."
            />
          )}

          {/* VIEW 5: EINGÄNGE & AUSGÄNGE (BUCHUNGSHISTORIE) */}
          {activeMobileView === "journal" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Letzte Buchungen (Ein- & Ausgänge)
              </h3>
              <p className="text-xs text-zinc-500">Live-Protokoll aller Lagerbewegungen</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  disabled={isClearing}
                  className="min-h-[38px] px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Buchungs- und Aktivitätslogs leeren und Backup erstellen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Log leeren & sichern</span>
                </button>
              )}
              <button
                type="button"
                onClick={onDataChanged}
                className="min-h-[38px] px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline active:bg-indigo-50 dark:active:bg-indigo-950 rounded-lg cursor-pointer touch-manipulation"
              >
                Aktualisieren
              </button>
            </div>
          </div>

          {buchungen.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="font-medium text-zinc-600 dark:text-zinc-400">Noch keine Buchungen erfasst.</p>
              <p className="mt-1">Buche oben deine erste Ausgabe oder Einnahme.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 space-y-2.5">
              {buchungen.map((b) => {
                const isEingang = b.typ === "EINGANG";

                return (
                  <div key={b.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p - 2 rounded - xl mt - 0.5 shrink - 0 ${
                          isEingang
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {isEingang ? (
                          <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-rose-600" />
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {b.variante.material.name} – {b.variante.groesse.name}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          {b.variante.artikelnummer}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatBuchungsDatum(b.createdAt)}</span>
                          <span>•</span>
                          <span>
                            Bestand: {b.bestandVorher} <ArrowRight className="w-2.5 h-2.5 inline" />{" "}
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">
                              {b.bestandNachher} Stk.
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline - block px - 2.5 py - 1 rounded - full text - xs font - extrabold ${
                          isEingang
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {isEingang ? `+ ${ b.menge }` : ` - ${ b.menge }`} Stk.
                      </span>
                      <span className="block text-[10px] text-zinc-400 uppercase font-semibold mt-0.5">
                        {isEingang ? "Eingang" : "Ausgabe"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal zum Hinzufügen eines neuen Materials */}
      <MaterialModal
        isOpen={isAddMaterialOpen}
        groessen={groessen}
        initialName={materialSearch.trim()}
        onClose={() => setIsAddMaterialOpen(false)}
        onSaved={(created) => {
          onDataChanged();
          if (created?.id) {
            setSelectedMaterialId(created.id);
            setMaterialSearch("");
          }
        }}
      />

      {/* Modal zum Hinzufügen einer Variante */}
      {currentMaterial && (
        <VarianteModal
          isOpen={isAddVarianteOpen}
          materialId={currentMaterial.id}
          materialName={currentMaterial.name}
          existingGroessenIds={currentMaterial.varianten.map((v) => v.groesseId)}
          groessen={groessen}
          onClose={() => setIsAddVarianteOpen(false)}
          onSaved={onDataChanged}
        />
      )}

      {/* Modal: Buchungs- und Aktivitäts-Log leeren Bestätigung */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Buchungs- und Aktivitäts-Logs leeren?"
        message="Möchtest du das gesamte Buchungs-Journal (Eingänge & Ausgänge) sowie das Aktivitäts-Log leeren? Vor dem Leeren wird automatisch ein vollständiges, lesbares Backup aller Daten im Projektordner ('backups/logs/') erstellt."
        confirmText="Logs sichern & leeren"
        cancelText="Abbrechen"
        isDestructive={true}
        isLoading={isClearing}
        onConfirm={handleClearLogs}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}

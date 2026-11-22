"use client";

import React, { useState, useMemo, useTransition } from "react";
import { AutoItem, getAutos, deleteAuto, updateAuto, seedSampleAutos } from "@/actions/autos";
import { AutoModal } from "./AutoModal";
import { ConfirmModal } from "./ConfirmModal";
import { useToast } from "./Toast";
import {
  Car,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Wrench,
  Pencil,
  Trash2,
  FileText,
  Gauge,
  Tag,
  RefreshCw,
  Check,
  ShieldAlert,
} from "lucide-react";

interface AutosViewProps {
  initialAutos?: AutoItem[];
}

type AutoFilterStatus = "ALL" | "DEFEKT" | "TUEV" | "BEREIT";

export function AutosView({ initialAutos = [] }: AutosViewProps) {
  const { toast } = useToast();
  const [autos, setAutos] = useState<AutoItem[]>(initialAutos);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<AutoFilterStatus>("ALL");
  const [isPending, startTransition] = useTransition();

  // Modal-Zustände
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuto, setEditingAuto] = useState<AutoItem | null>(null);

  // Löschen-Zustand
  const [deletingAuto, setDeletingAuto] = useState<AutoItem | null>(null);

  // Synchronisieren falls initialAutos sich ändern
  React.useEffect(() => {
    setAutos(initialAutos);
  }, [initialAutos]);

  // Daten neu laden
  const handleReload = () => {
    startTransition(async () => {
      try {
        const fresh = await getAutos();
        setAutos(fresh);
        toast("Fahrzeugdaten aktualisiert.");
      } catch {
        toast("Fehler beim Aktualisieren der Fahrzeuge.", "error");
      }
    });
  };

  // Hilfsfunktion: TÜV-Status berechnen
  const getTuevInfo = (tuevDate: Date | null) => {
    if (!tuevDate) {
      return { status: "NONE", label: "Kein TÜV hinterlegt", daysDiff: null };
    }
    const d = new Date(tuevDate);
    if (isNaN(d.getTime())) {
      return { status: "NONE", label: "Ungültiges Datum", daysDiff: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(d);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Formatiertes Datum
    const formatted = d.toLocaleDateString("de-DE", {
      month: "2-digit",
      year: "numeric",
    });

    if (daysDiff < 0) {
      return {
        status: "EXPIRED",
        label: `TÜV abgelaufen (${formatted})`,
        daysDiff,
        formatted,
      };
    } else if (daysDiff <= 60) {
      return {
        status: "WARNING",
        label: `TÜV in ${daysDiff} Tagen fällig (${formatted})`,
        daysDiff,
        formatted,
      };
    } else {
      return {
        status: "OK",
        label: `TÜV gültig bis ${formatted}`,
        daysDiff,
        formatted,
      };
    }
  };

  // KPI-Statistiken
  const stats = useMemo(() => {
    let defektCount = 0;
    let tuevDueCount = 0;
    let bereitCount = 0;

    for (const a of autos) {
      const hasDefekt = Boolean(a.defekte && a.defekte.trim().length > 0) || a.status === "DEFEKT" || a.status === "WERKSTATT";
      if (hasDefekt) defektCount++;

      const tuev = getTuevInfo(a.tuevTermin);
      if (tuev.status === "EXPIRED" || tuev.status === "WARNING" || a.status === "TUEV_FAELLIG") {
        tuevDueCount++;
      }

      if (a.status === "BEREIT" && !hasDefekt && tuev.status !== "EXPIRED") {
        bereitCount++;
      }
    }

    return {
      total: autos.length,
      defektCount,
      tuevDueCount,
      bereitCount,
    };
  }, [autos]);

  // Gefilterte Autos
  const filteredAutos = useMemo(() => {
    return autos.filter((auto) => {
      // 1. Suche
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const searchable = [
          auto.name,
          auto.kennzeichen || "",
          auto.modell || "",
          auto.defekte || "",
          auto.anmerkungen || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      // 2. Filter nach Status
      const hasDefekt = Boolean(auto.defekte && auto.defekte.trim().length > 0) || auto.status === "DEFEKT" || auto.status === "WERKSTATT";
      const tuev = getTuevInfo(auto.tuevTermin);
      const isTuevCritical = tuev.status === "EXPIRED" || tuev.status === "WARNING" || auto.status === "TUEV_FAELLIG";

      if (filterStatus === "DEFEKT" && !hasDefekt) return false;
      if (filterStatus === "TUEV" && !isTuevCritical) return false;
      if (filterStatus === "BEREIT" && (hasDefekt || auto.status !== "BEREIT")) return false;

      return true;
    });
  }, [autos, searchTerm, filterStatus]);

  // Handler: Fahrzeug löschen
  const handleDeleteConfirm = async () => {
    if (!deletingAuto) return;
    try {
      const res = await deleteAuto(deletingAuto.id);
      if (res.success) {
        toast(`Fahrzeug "${deletingAuto.name}" wurde gelöscht.`);
        setAutos((prev) => prev.filter((a) => a.id !== deletingAuto.id));
      } else {
        toast(res.error || "Fehler beim Löschen des Fahrzeugs.", "error");
      }
    } catch {
      toast("Fehler beim Löschen.", "error");
    } finally {
      setDeletingAuto(null);
    }
  };

  // Handler: Defekt schnell als behoben markieren
  const handleResolveDefektQuick = async (auto: AutoItem) => {
    try {
      const res = await updateAuto(auto.id, {
        name: auto.name,
        kennzeichen: auto.kennzeichen,
        modell: auto.modell,
        defekte: null,
        tuevTermin: auto.tuevTermin,
        anmerkungen: auto.anmerkungen,
        kilometerstand: auto.kilometerstand,
        status: "BEREIT",
      });

      if (res.success) {
        toast(`Mängel an "${auto.name}" als behoben markiert.`);
        const fresh = await getAutos();
        setAutos(fresh);
      }
    } catch {
      toast("Fehler beim Aktualisieren des Mängels.", "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards & Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Car className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Fuhrpark & Auto-Verwaltung
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              Office
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Fahrzeuge erfassen, bekannte Mängel/Defekte dokumentieren und TÜV-Termine überwachen.
          </p>
        </div>

        {/* Schnellfilter-Kacheln */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Alle */}
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              filterStatus === "ALL"
                ? "bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-xs"
                : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
            }`}
            title="Alle Fahrzeuge anzeigen"
          >
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Fahrzeuge</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</span>
          </button>

          {/* Mängel / Defekte */}
          <button
            type="button"
            onClick={() => setFilterStatus("DEFEKT")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              filterStatus === "DEFEKT"
                ? "bg-red-100 dark:bg-red-950 border-red-500 dark:border-red-600 ring-2 ring-red-500/30 text-red-900 dark:text-red-100 shadow-xs"
                : "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 hover:bg-red-100/70"
            }`}
            title="Fahrzeuge mit Mängeln / Defekten"
          >
            <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              Mängel
            </span>
            <span className="text-sm font-bold">{stats.defektCount}</span>
          </button>

          {/* TÜV fällig */}
          <button
            type="button"
            onClick={() => setFilterStatus("TUEV")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              filterStatus === "TUEV"
                ? "bg-amber-100 dark:bg-amber-950 border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/30 text-amber-900 dark:text-amber-100 shadow-xs"
                : "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70"
            }`}
            title="Fahrzeuge mit abgelaufenem oder bald fälligem TÜV"
          >
            <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              TÜV fällig
            </span>
            <span className="text-sm font-bold">{stats.tuevDueCount}</span>
          </button>

          {/* Bereit */}
          <button
            type="button"
            onClick={() => setFilterStatus("BEREIT")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              filterStatus === "BEREIT"
                ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/30 text-emerald-900 dark:text-emerald-100 shadow-xs"
                : "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70"
            }`}
            title="Einsatzbereite Fahrzeuge"
          >
            <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Bereit
            </span>
            <span className="text-sm font-bold">{stats.bereitCount}</span>
          </button>

          {/* Neues Auto anlegen Button */}
          <button
            type="button"
            onClick={() => {
              setEditingAuto(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Neues Auto anlegen</span>
          </button>
        </div>
      </div>

      {/* Suchleiste & Refresh */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Fahrzeug, Kennzeichen, Defekt suchen..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReload}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Fahrzeugliste neu laden"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-blue-600" : ""}`} />
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

      {/* Fahrzeugliste / Cards */}
      {filteredAutos.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {autos.length === 0 ? "Noch keine Fahrzeuge erfasst" : "Keine passenden Fahrzeuge gefunden"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-5">
            {autos.length === 0
              ? "Erfassen Sie hier Ihre Firmenfahrzeuge mit Kennzeichen, TÜV-Terminen und anstehenden Reparaturen oder Mängeln."
              : "Versuchen Sie, den Suchbegriff oder die Filterkriterien anzupassen."}
          </p>
          {autos.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingAuto(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Erstes Auto anlegen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    const res = await seedSampleAutos();
                    if (res.success) {
                      toast("2 Beispielfahrzeuge erfolgreich erstellt!");
                      const fresh = await getAutos();
                      setAutos(fresh);
                    } else {
                      toast("Fehler beim Erstellen der Beispieldaten.", "error");
                    }
                  });
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Car className="w-4 h-4 text-blue-500" />
                <span>Beispielfahrzeuge anlegen</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAutos.map((auto) => {
            const tuev = getTuevInfo(auto.tuevTermin);
            const hasDefekte = Boolean(auto.defekte && auto.defekte.trim().length > 0);

            return (
              <div
                key={auto.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {/* Farbiger Top-Akzent je nach Status */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    hasDefekte || auto.status === "DEFEKT"
                      ? "bg-red-500"
                      : auto.status === "WERKSTATT"
                      ? "bg-amber-500"
                      : tuev.status === "EXPIRED"
                      ? "bg-red-500"
                      : tuev.status === "WARNING"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />

                <div className="space-y-3.5">
                  {/* Obere Leiste: Name, Kennzeichen & Aktionen */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{auto.name}</span>
                      </h3>
                      {auto.modell && (
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">{auto.modell}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAuto(auto);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                        title="Fahrzeug bearbeiten"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingAuto(auto)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                        title="Fahrzeug löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Kennzeichen & Status-Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    {auto.kennzeichen ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
                        <span className="w-2 h-3 bg-blue-600 rounded-[1px] inline-block mr-0.5 text-[7px] text-white font-sans text-center leading-3">
                          D
                        </span>
                        {auto.kennzeichen}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 italic">Kein Kennzeichen</span>
                    )}

                    {/* Status Badge */}
                    {auto.status === "WERKSTATT" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Wrench className="w-3 h-3" />
                        In Werkstatt
                      </span>
                    ) : auto.status === "DEFEKT" || hasDefekte ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                        <AlertTriangle className="w-3 h-3" />
                        Mangel gemeldet
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Einsatzbereit
                      </span>
                    )}

                    {auto.kilometerstand !== null && auto.kilometerstand !== undefined && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium ml-auto">
                        <Gauge className="w-3 h-3 text-zinc-400" />
                        {auto.kilometerstand.toLocaleString("de-DE")} km
                      </span>
                    )}
                  </div>

                  {/* TÜV Termin Box */}
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      tuev.status === "EXPIRED"
                        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300"
                        : tuev.status === "WARNING"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300"
                        : tuev.status === "OK"
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                        : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="font-semibold block">{tuev.label}</span>
                        {auto.tuevTermin && (
                          <span className="text-[10px] opacity-80">
                            Fälligkeitsdatum: {new Date(auto.tuevTermin).toLocaleDateString("de-DE")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Defekte / Mängel Box */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      Mögliche Defekte / Schäden:
                    </span>

                    {hasDefekte ? (
                      <div className="p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-900 dark:text-red-200">
                        <p className="whitespace-pre-line leading-relaxed font-medium">{auto.defekte}</p>
                        <div className="mt-2 pt-2 border-t border-red-200/60 dark:border-red-900/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleResolveDefektQuick(auto)}
                            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Als behoben markieren
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Keine Mängel eingetragen (Alles i.O.)</span>
                      </div>
                    )}
                  </div>

                  {/* Anmerkungen Box */}
                  {auto.anmerkungen && (
                    <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Anmerkungen:
                      </span>
                      <p className="whitespace-pre-line leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {auto.anmerkungen}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer mit letzter Aktualisierung */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>ID: #{auto.id}</span>
                  <span>Aktualisiert: {new Date(auto.updatedAt).toLocaleDateString("de-DE")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto Modal (Neu / Bearbeiten) */}
      <AutoModal
        isOpen={isModalOpen}
        auto={editingAuto}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAuto(null);
        }}
        onSaved={async () => {
          const fresh = await getAutos();
          setAutos(fresh);
        }}
      />

      {/* Sicherheitsabfrage beim Löschen */}
      <ConfirmModal
        isOpen={Boolean(deletingAuto)}
        title="Fahrzeug wirklich löschen?"
        message={`Möchten Sie das Fahrzeug "${deletingAuto?.name}" wirklich unwiderruflich aus dem System löschen?`}
        confirmText="Fahrzeug löschen"
        cancelText="Abbrechen"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingAuto(null)}
      />
    </div>
  );
}

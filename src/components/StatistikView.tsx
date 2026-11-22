"use client";

import React, { useState, useMemo, useTransition } from "react";
import { LagerStatistikData, VarianteStatistik, getLagerStatistik } from "@/actions/statistik";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  Layers,
  Download,
  Activity,
  History,
} from "lucide-react";
import { useToast } from "./Toast";

interface StatistikViewProps {
  initialData: LagerStatistikData;
  userRole?: string; // "ADMIN" | "OFFICE"
}

type SortField =
  | "material"
  | "istBestand"
  | "mindestbestand"
  | "hoechststand"
  | "buchungen"
  | "zugang"
  | "abgang";

type FilterType = "ALL" | "CRITICAL" | "OUT_OF_STOCK" | "ACTIVE" | "INACTIVE";

export function StatistikView({ initialData, userRole = "OFFICE" }: StatistikViewProps) {
  const { toast } = useToast();
  const [data, setData] = useState<LagerStatistikData>(initialData);
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHersteller, setSelectedHersteller] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [sortField, setSortField] = useState<SortField>("istBestand");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Live Refresh
  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const fresh = await getLagerStatistik();
        setData(fresh);
        toast("Statistiken erfolgreich aktualisiert.");
      } catch (err) {
        toast("Fehler beim Aktualisieren der Statistiken.", "error");
      }
    });
  };

  // Hersteller Dropdown Options
  const herstellerOptions = useMemo(() => {
    return data.herstellerListe.map((h) => h.hersteller);
  }, [data.herstellerListe]);

  // Gefilterte & Sortierte Varianten
  const filteredRows = useMemo(() => {
    let result = [...data.variantenStatistik];

    // Volltextsuche
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.materialName.toLowerCase().includes(q) ||
          r.groesseName.toLowerCase().includes(q) ||
          r.artikelnummer.toLowerCase().includes(q) ||
          (r.hersteller && r.hersteller.toLowerCase().includes(q))
      );
    }

    // Hersteller Filter
    if (selectedHersteller !== "ALL") {
      result = result.filter((r) => {
        const h = r.hersteller?.trim() || "Ohne Herstellerangabe";
        return h === selectedHersteller;
      });
    }

    // Status Filter
    if (filterType === "CRITICAL") {
      result = result.filter((r) => r.isCritical);
    } else if (filterType === "OUT_OF_STOCK") {
      result = result.filter((r) => r.isOutOfStock);
    } else if (filterType === "ACTIVE") {
      result = result.filter((r) => r.totalBuchungenAnzahl > 0);
    } else if (filterType === "INACTIVE") {
      result = result.filter((r) => r.totalBuchungenAnzahl === 0);
    }

    // Sortierung
    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case "material":
          valA = a.materialName.toLowerCase();
          valB = b.materialName.toLowerCase();
          return sortAsc
            ? (valA as string).localeCompare(valB as string, "de")
            : (valB as string).localeCompare(valA as string, "de");
        case "istBestand":
          valA = a.istBestand;
          valB = b.istBestand;
          break;
        case "mindestbestand":
          valA = a.mindestbestand;
          valB = b.mindestbestand;
          break;
        case "hoechststand":
          valA = a.historischerHoechstbestand;
          valB = b.historischerHoechstbestand;
          break;
        case "buchungen":
          valA = a.totalBuchungenAnzahl;
          valB = b.totalBuchungenAnzahl;
          break;
        case "zugang":
          valA = a.totalZugangMenge;
          valB = b.totalZugangMenge;
          break;
        case "abgang":
          valA = a.totalAbgangMenge;
          valB = b.totalAbgangMenge;
          break;
      }

      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [data.variantenStatistik, searchTerm, selectedHersteller, filterType, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // standardmäßig absteigend (höchste zuerst)
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = [
      "Material",
      "Hersteller",
      "Groesse",
      "Artikelnummer",
      "Aktueller_Bestand",
      "Mindestbestand",
      "Historischer_Hoechststand",
      "Historischer_Tiefststand",
      "Gesamter_Zugang_Menge",
      "Zugang_Buchungen_Anzahl",
      "Gesamter_Abgang_Menge",
      "Abgang_Buchungen_Anzahl",
      "Buchungen_Gesamt",
      "Status",
    ];

    const rows = filteredRows.map((r) => [
      `"${r.materialName.replace(/"/g, '""')}"`,
      `"${(r.hersteller || "").replace(/"/g, '""')}"`,
      `"${r.groesseName.replace(/"/g, '""')}"`,
      `"${r.artikelnummer.replace(/"/g, '""')}"`,
      r.istBestand,
      r.mindestbestand,
      r.historischerHoechstbestand,
      r.historischerTiefstbestand,
      r.totalZugangMenge,
      r.totalZugangAnzahl,
      r.totalAbgangMenge,
      r.totalAbgangAnzahl,
      r.totalBuchungenAnzahl,
      r.isOutOfStock ? "Ausverkauft" : r.isCritical ? "Kritisch" : "OK",
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lagerstatistik_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("CSV-Statistikdatei heruntergeladen.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Bestands- & Umschlagstatistik
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {userRole}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Übersicht: Wie viel aktuell vorhanden ist & wie oft Materialien historisch bewegt wurden
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Statistik als CSV für Excel exportieren"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            CSV Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Aktueller Bestand */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Aktueller Gesamtbestand
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {data.gesamtEinheitenIst.toLocaleString("de-DE")}
            </span>
            <span className="text-xs text-zinc-500">Einheiten vorhanden</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span>{data.materialienGesamt} Materialien</span>
            <span>•</span>
            <span>{data.variantenGesamt} Varianten</span>
          </div>
        </div>

        {/* KPI 2: Kritisch / Unterdeckung */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Bestandsstatus
            </span>
            <div className={`p-2 rounded-xl ${data.kritischeVarianten > 0 ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"}`}>
              {data.kritischeVarianten > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${data.kritischeVarianten > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {data.kritischeVarianten}
            </span>
            <span className="text-xs text-zinc-500">unter Mindestbestand</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span className="text-red-600 font-medium">{data.ausverkaufteVarianten} komplett leer</span>
            <span>•</span>
            <span className="text-emerald-600">{data.gesunderBestand} im Soll</span>
          </div>
        </div>

        {/* KPI 3: Zugänge Historisch */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Eingelagert (Historisch)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{data.gesamtZugangMenge.toLocaleString("de-DE")}
            </span>
            <span className="text-xs text-zinc-500">Einheiten Zugang</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{data.gesamtZugangBuchungen}</span>
            <span>Einlagerungsvorgänge registriert</span>
          </div>
        </div>

        {/* KPI 4: Entnahmen Historisch */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Entnommen (Historisch)
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              -{data.gesamtAbgangMenge.toLocaleString("de-DE")}
            </span>
            <span className="text-xs text-zinc-500">Einheiten entnommen</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{data.gesamtAbgangBuchungen}</span>
            <span>Entnahmevorgänge registriert</span>
          </div>
        </div>
      </div>

      {/* Hersteller Breakdown */}
      {data.herstellerListe.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Bestand nach Herstellern
            </h3>
            <span className="text-xs text-zinc-500">
              {data.herstellerListe.length} {data.herstellerListe.length === 1 ? "Hersteller" : "Hersteller"} erfasst
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {data.herstellerListe.map((h) => {
              const isSelected = selectedHersteller === h.hersteller;
              return (
                <button
                  key={h.hersteller}
                  onClick={() => setSelectedHersteller(isSelected ? "ALL" : h.hersteller)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 dark:border-indigo-500"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1">
                    <span>🏷️</span>
                    <span title={h.hersteller}>{h.hersteller}</span>
                  </p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {h.gesamtBestand}{" "}
                    <span className="text-[10px] font-normal text-zinc-500">Stk.</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {h.materialCount} {h.materialCount === 1 ? "Material" : "Materialien"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Suchleiste */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Material, Hersteller, Größe oder Artikelnummer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Hersteller Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedHersteller}
              onChange={(e) => setSelectedHersteller(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Alle Hersteller ({data.herstellerListe.length})</option>
              {herstellerOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                filterType === "ALL"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              Alle ({data.variantenStatistik.length})
            </button>
            <button
              onClick={() => setFilterType("CRITICAL")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === "CRITICAL"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Kritisch ({data.kritischeVarianten})
            </button>
            <button
              onClick={() => setFilterType("ACTIVE")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === "ACTIVE"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 hover:bg-indigo-100"
              }`}
            >
              <Activity className="w-3 h-3" />
              Mit Bewegungen
            </button>
            <button
              onClick={() => setFilterType("INACTIVE")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                filterType === "INACTIVE"
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              Ladenhüter (0 Buchungen)
            </button>
          </div>
        </div>
      </div>

      {/* Detaillierte Statistiktabelle */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => toggleSort("material")}>
                  <div className="flex items-center gap-1.5">
                    <span>Material & Hersteller</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4">Größe & Art.-Nr.</th>
                <th className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => toggleSort("istBestand")}>
                  <div className="flex items-center gap-1.5">
                    <span>Aktueller Bestand</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => toggleSort("mindestbestand")}>
                  <div className="flex items-center gap-1.5">
                    <span>Mindestbestand</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => toggleSort("hoechststand")}>
                  <div className="flex items-center gap-1.5">
                    <span>Histor. Höchststand</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => toggleSort("zugang")}>
                  <div className="flex items-center gap-1.5">
                    <span>Gesamt-Zugang</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => toggleSort("abgang")}>
                  <div className="flex items-center gap-1.5">
                    <span>Gesamt-Entnahme</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 text-center" onClick={() => toggleSort("buchungen")}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Buchungen</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    Keine Varianten mit den aktuellen Filterkriterien gefunden.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  return (
                    <tr
                      key={row.varianteId}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Material & Hersteller */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {row.materialName}
                        </div>
                        {row.hersteller ? (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                            <span>🏷️</span>
                            <span className="font-medium">{row.hersteller}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 italic">
                            Kein Hersteller
                          </div>
                        )}
                      </td>

                      {/* Größe & Artikelnummer */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">
                          {row.groesseName}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          {row.artikelnummer}
                        </div>
                      </td>

                      {/* Aktueller Bestand */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold text-sm ${
                            row.isOutOfStock
                              ? "text-red-600 dark:text-red-400"
                              : row.isCritical
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {row.istBestand.toLocaleString("de-DE")}
                        </span>
                        <span className="text-zinc-400 text-[11px] ml-1">Stk.</span>
                      </td>

                      {/* Mindestbestand */}
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                        {row.mindestbestand.toLocaleString("de-DE")} Stk.
                      </td>

                      {/* Historischer Höchststand */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {row.historischerHoechstbestand.toLocaleString("de-DE")}
                        </span>
                        <span className="text-zinc-400 text-[11px] ml-1">Stk.</span>
                      </td>

                      {/* Zugang */}
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                        +{row.totalZugangMenge.toLocaleString("de-DE")}{" "}
                        <span className="text-[10px] text-zinc-400">({row.totalZugangAnzahl}x)</span>
                      </td>

                      {/* Abgang */}
                      <td className="py-3 px-4 text-purple-600 dark:text-purple-400 font-medium">
                        -{row.totalAbgangMenge.toLocaleString("de-DE")}{" "}
                        <span className="text-[10px] text-zinc-400">({row.totalAbgangAnzahl}x)</span>
                      </td>

                      {/* Gesamtbuchungen */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                          {row.totalBuchungenAnzahl}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-right">
                        {row.isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <AlertOctagon className="w-3 h-3" />
                            Leer
                          </span>
                        ) : row.isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            Knapp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Soll
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

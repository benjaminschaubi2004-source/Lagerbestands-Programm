"use client";

import React, { useState, useMemo, useTransition } from "react";
import { MaterialWithVarianten, getMaterialien } from "@/actions/materialien";
import { LagerStatistikData, getLagerStatistik } from "@/actions/statistik";
import { AutoItem, getAutos } from "@/actions/autos";
import { StatistikView } from "./StatistikView";
import { AutosView } from "./AutosView";
import {
  Search,
  Filter,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  FileSpreadsheet,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  RotateCcw,
  AlertOctagon,
  BarChart3,
  TableProperties,
  Car,
  ShoppingBag,
  PackageCheck,
} from "lucide-react";
import { useToast } from "./Toast";
import { BestellModal, ModalVarianteTarget } from "./BestellModal";

interface OfficeViewProps {
  materialien: MaterialWithVarianten[];
  initialStatistik?: LagerStatistikData | null;
  initialAutos?: AutoItem[];
}

type StatusFilterType = "ALL" | "CRITICAL" | "OUT_OF_STOCK" | "ORDERED" | "OK";
type SortField = "material" | "variante" | "artikelnummer" | "mindestbestand" | "istBestand" | "status";
type SortDirection = "asc" | "desc";

interface FlatVarianteRow {
  materialId: number;
  materialName: string;
  hersteller: string | null;
  materialBeschreibung: string | null;
  varianteId: number;
  varianteName: string;
  artikelnummer: string;
  mindestbestand: number;
  istBestand: number;
  diff: number; // istBestand - mindestbestand
  isBestellt: boolean;
  bestelltAm: Date | null;
  bestelltMenge: number | null;
  bestelltNotiz: string | null;
  isCritical: boolean; // istBestand <= mindestbestand && !isBestellt
  isOutOfStock: boolean; // istBestand === 0 && !isBestellt
}

export function OfficeView({
  materialien: initialMaterialien,
  initialStatistik,
  initialAutos,
}: OfficeViewProps) {
  const { toast } = useToast();
  const [materialien, setMaterialien] = useState<MaterialWithVarianten[]>(initialMaterialien);
  const [activeOfficeTab, setActiveOfficeTab] = useState<"tabelle" | "statistik" | "autos">("tabelle");
  const [statistikData, setStatistikData] = useState<LagerStatistikData | null>(initialStatistik || null);
  const [autosData, setAutosData] = useState<AutoItem[]>(initialAutos || []);
  const [isPending, startTransition] = useTransition();

  // Filter-Zustände
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>("ALL");
  const [selectedVarianteFilter, setSelectedVarianteFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");

  // Sortier-Zustand
  const [sortField, setSortField] = useState<SortField>("material");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Kopier-Zustand
  const [copiedArtNr, setCopiedArtNr] = useState<string | null>(null);

  // Bestell-Modal Zustand
  const [orderModalTarget, setOrderModalTarget] = useState<ModalVarianteTarget | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Synchronisieren falls initialMaterialien sich ändern
  React.useEffect(() => {
    setMaterialien(initialMaterialien);
  }, [initialMaterialien]);

  React.useEffect(() => {
    if (initialStatistik) {
      setStatistikData(initialStatistik);
    } else {
      getLagerStatistik().then(setStatistikData).catch(() => {});
    }
  }, [initialStatistik]);

  React.useEffect(() => {
    if (initialAutos) {
      setAutosData(initialAutos);
    } else {
      getAutos().then(setAutosData).catch(() => {});
    }
  }, [initialAutos]);

  // Daten neu laden (Live-Refresh)
  const handleReload = () => {
    startTransition(async () => {
      try {
        const [freshMats, freshStat, freshAutos] = await Promise.all([
          getMaterialien(),
          getLagerStatistik(),
          getAutos(),
        ]);
        setMaterialien(freshMats);
        setStatistikData(freshStat);
        setAutosData(freshAutos);
        toast("Bestands-, Statistik- und Fahrzeugdaten aktualisiert.");
      } catch (err) {
        toast("Fehler beim Aktualisieren der Daten.", "error");
      }
    });
  };

  // Flache Liste aller Varianten
  const allVariantenRows = useMemo<FlatVarianteRow[]>(() => {
    const rows: FlatVarianteRow[] = [];

    for (const m of materialien) {
      for (const v of m.varianten) {
        const diff = v.istBestand - v.mindestbestand;
        const isBestellt = Boolean(v.isBestellt);
        // Sobald ein Material bestellt ist, steht es NICHT MEHR auf kritisch oder ausverkauft!
        const isOutOfStock = v.istBestand === 0 && !isBestellt;
        const isCritical = v.istBestand <= v.mindestbestand && !isBestellt;

        rows.push({
          materialId: m.id,
          materialName: m.name,
          hersteller: m.hersteller,
          materialBeschreibung: m.beschreibung,
          varianteId: v.id,
          varianteName: v.groesse.name,
          artikelnummer: v.artikelnummer,
          mindestbestand: v.mindestbestand,
          istBestand: v.istBestand,
          diff,
          isBestellt,
          bestelltAm: v.bestelltAm ? new Date(v.bestelltAm) : null,
          bestelltMenge: v.bestelltMenge ?? null,
          bestelltNotiz: v.bestelltNotiz ?? null,
          isCritical,
          isOutOfStock,
        });
      }
    }

    return rows;
  }, [materialien]);

  // Einzigartige Materialnamen für Dropdown
  const uniqueMaterialNames = useMemo(() => {
    const names = Array.from(new Set(allVariantenRows.map((r) => r.materialName)));
    return names.sort((a, b) => a.localeCompare(b, "de"));
  }, [allVariantenRows]);

  // Einzigartige Variantennamen für Dropdown
  const uniqueVariantenNames = useMemo(() => {
    const names = Array.from(new Set(allVariantenRows.map((r) => r.varianteName)));
    return names.sort((a, b) => a.localeCompare(b, "de"));
  }, [allVariantenRows]);

  // Kennzahlen
  const totalCount = allVariantenRows.length;
  const criticalCount = useMemo(() => allVariantenRows.filter((r) => r.isCritical).length, [allVariantenRows]);
  const outOfStockCount = useMemo(() => allVariantenRows.filter((r) => r.isOutOfStock).length, [allVariantenRows]);
  const orderedCount = useMemo(() => allVariantenRows.filter((r) => r.isBestellt).length, [allVariantenRows]);
  const okCount = useMemo(
    () => allVariantenRows.filter((r) => !r.isCritical && !r.isOutOfStock && !r.isBestellt).length,
    [allVariantenRows]
  );

  // Prüfen, ob irgendein Filter aktiv ist
  const isAnyFilterActive =
    searchTerm.trim() !== "" ||
    selectedMaterialFilter !== "ALL" ||
    selectedVarianteFilter !== "ALL" ||
    statusFilter !== "ALL";

  // Filter zurücksetzen
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedMaterialFilter("ALL");
    setSelectedVarianteFilter("ALL");
    setStatusFilter("ALL");
  };

  // Sortierung umschalten
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Gefilterte und sortierte Zeilen
  const filteredAndSortedRows = useMemo(() => {
    // 1. Filtern
    const filtered = allVariantenRows.filter((row) => {
      // Volltextsuche: Jedes Wort muss in mindestens einem der Felder vorkommen
      if (searchTerm.trim() !== "") {
        const queryTerms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const searchableString = [
          row.materialName,
          row.hersteller || "",
          row.varianteName,
          row.artikelnummer,
          row.materialBeschreibung || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesAllTerms = queryTerms.every((term) => searchableString.includes(term));
        if (!matchesAllTerms) return false;
      }

      // Material-Filter
      if (selectedMaterialFilter !== "ALL" && row.materialName !== selectedMaterialFilter) {
        return false;
      }

      // Varianten-Filter
      if (selectedVarianteFilter !== "ALL" && row.varianteName !== selectedVarianteFilter) {
        return false;
      }

      // Status-Filter
      if (statusFilter === "CRITICAL" && !row.isCritical) {
        return false;
      }
      if (statusFilter === "OUT_OF_STOCK" && !row.isOutOfStock) {
        return false;
      }
      if (statusFilter === "ORDERED" && !row.isBestellt) {
        return false;
      }
      if (statusFilter === "OK" && (row.isCritical || row.isOutOfStock || row.isBestellt)) {
        return false;
      }

      return true;
    });

    // 2. Sortieren
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "material":
          comparison = a.materialName.localeCompare(b.materialName, "de");
          if (comparison === 0) comparison = a.varianteName.localeCompare(b.varianteName, "de");
          break;
        case "variante":
          comparison = a.varianteName.localeCompare(b.varianteName, "de");
          break;
        case "artikelnummer":
          comparison = a.artikelnummer.localeCompare(b.artikelnummer, "de");
          break;
        case "mindestbestand":
          comparison = a.mindestbestand - b.mindestbestand;
          break;
        case "istBestand":
          comparison = a.istBestand - b.istBestand;
          break;
        case "status":
          // Dringlichkeit: kleinster diff (am stärksten im Minus) zuerst
          comparison = a.diff - b.diff;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    allVariantenRows,
    searchTerm,
    selectedMaterialFilter,
    selectedVarianteFilter,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  // Kopier-Handler
  const handleCopy = (artNr: string) => {
    navigator.clipboard.writeText(artNr);
    setCopiedArtNr(artNr);
    toast(`Artikelnummer "${artNr}" kopiert.`);
    setTimeout(() => setCopiedArtNr(null), 2000);
  };

  // CSV Export der aktuell gefilterten Liste
  const handleExportCSV = () => {
    if (filteredAndSortedRows.length === 0) {
      toast("Keine Datensätze zum Exportieren vorhanden.", "error");
      return;
    }

    const headers = [
      "Material",
      "Variante",
      "Artikelnummer",
      "Mindestbestand",
      "Ist-Lagerbestand",
      "Differenz",
      "Status",
    ];

    const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    const lines = [
      headers.join(";"),
      ...filteredAndSortedRows.map((r) =>
        [
          escapeCsv(r.materialName),
          escapeCsv(r.varianteName),
          escapeCsv(r.artikelnummer),
          r.mindestbestand,
          r.istBestand,
          r.diff,
          escapeCsv(
            r.isBestellt
              ? `Bestellt (${r.bestelltMenge ? `${r.bestelltMenge} Stk.` : "Menge n.a."}${r.bestelltAm ? `, am ${new Date(r.bestelltAm).toLocaleDateString("de-DE")}` : ""}${r.bestelltNotiz ? ` - ${r.bestelltNotiz}` : ""})`
              : r.isOutOfStock
              ? "Ausverkauft"
              : r.isCritical
              ? "Nachbestellen (Meldebestand unterschritten)"
              : "Ausreichend"
          ),
        ].join(";")
      ),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `Lagerliste_Office_Bestand_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(`${filteredAndSortedRows.length} Positionen als CSV exportiert.`);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 font-bold" />
    );
  };

  return (
    <div className="space-y-5">
      {/* Office Ansichten-Umschalter: Tabelle vs Statistik */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveOfficeTab("tabelle")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeOfficeTab === "tabelle"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>📋 Bestandsübersicht (Tabelle)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveOfficeTab("statistik")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeOfficeTab === "statistik"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Bestands- & Bewegungsstatistik</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveOfficeTab("autos")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeOfficeTab === "autos"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>🚗 Auto&apos;s</span>
            {autosData.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeOfficeTab === "autos"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {autosData.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleReload}
          disabled={isPending}
          className="self-end sm:self-auto px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Bestand und Statistiken live neu laden"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-blue-600" : ""}`} />
          <span>Daten aktualisieren</span>
        </button>
      </div>

      {activeOfficeTab === "autos" ? (
        <AutosView initialAutos={autosData} />
      ) : activeOfficeTab === "statistik" ? (
        statistikData ? (
          <StatistikView initialData={statistikData} userRole="OFFICE" />
        ) : (
          <div className="p-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-medium">Lade Bestands- und Bewegungsstatistiken...</p>
          </div>
        )
      ) : (
        <>
          {/* Header Info & Klickbare KPI-Kacheln */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Office-Lagerliste & Bestandsübersicht
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              Bestandsübersicht &amp; Einkauf
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Vollständige Bestandsübersicht mit Filter- und Nachbestellfunktionen für Einkauf & Lagerleitung.
          </p>
        </div>

        {/* Quick KPI Badges mit Filter-Klickfunktion */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Alle Positionen */}
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-xs"
                : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
            }`}
            title="Alle Positionen anzeigen"
          >
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Positionen</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{totalCount}</span>
          </button>

          {/* Kritischer Bestand */}
          <button
            type="button"
            onClick={() => setStatusFilter("CRITICAL")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === "CRITICAL"
                ? "bg-red-100 dark:bg-red-950 border-red-500 dark:border-red-600 ring-2 ring-red-500/30 text-red-900 dark:text-red-100 shadow-xs"
                : "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 hover:bg-red-100/70"
            }`}
            title="Nachbestellungen (Bestand <= Mindestbestand, noch nicht bestellt) filtern"
          >
            <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              Kritisch
            </span>
            <span className="text-sm font-bold">{criticalCount}</span>
          </button>

          {/* Ausverkauft */}
          {outOfStockCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter("OUT_OF_STOCK")}
              className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                statusFilter === "OUT_OF_STOCK"
                  ? "bg-amber-100 dark:bg-amber-950 border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/30 text-amber-900 dark:text-amber-100 shadow-xs"
                  : "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70"
              }`}
              title="Artikel mit Bestand 0 (noch nicht bestellt) filtern"
            >
              <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center justify-center gap-1">
                <AlertOctagon className="w-3 h-3 text-amber-600" />
                Ausverkauft
              </span>
              <span className="text-sm font-bold">{outOfStockCount}</span>
            </button>
          )}

          {/* Bereits bestellt */}
          <button
            type="button"
            onClick={() => setStatusFilter("ORDERED")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === "ORDERED"
                ? "bg-indigo-100 dark:bg-indigo-950 border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/30 text-indigo-900 dark:text-indigo-100 shadow-xs"
                : "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100/70"
            }`}
            title="Bereits nachbestellte Artikel filtern"
          >
            <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center justify-center gap-1">
              <ShoppingBag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              Bestellt
            </span>
            <span className="text-sm font-bold">{orderedCount}</span>
          </button>

          {/* Ausreichend */}
          <button
            type="button"
            onClick={() => setStatusFilter("OK")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === "OK"
                ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/30 text-emerald-900 dark:text-emerald-100 shadow-xs"
                : "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70"
            }`}
            title="Ausreichend gedeckte Artikel filtern"
          >
            <span className="text-[10px] uppercase font-bold opacity-80 block flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Ausreichend
            </span>
            <span className="text-sm font-bold">{okCount}</span>
          </button>

          {/* Live Reload Button */}
          <button
            type="button"
            onClick={handleReload}
            disabled={isPending}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Daten neu laden"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* FILTER- & STEUERUNGSLEISTE */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* 1. Volltextsuche mit Schnell-Löschung */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Volltextsuche (z.B. T5 20, Wago 3er, Handsender, Grau)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Suche leeren"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Dropdown: Material filtern */}
          <div className="w-full md:w-56">
            <select
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
              className="w-full py-2.5 px-3 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Alle Materialien ({uniqueMaterialNames.length})</option>
              {uniqueMaterialNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Dropdown: Variante filtern */}
          <div className="w-full md:w-52">
            <select
              value={selectedVarianteFilter}
              onChange={(e) => setSelectedVarianteFilter(e.target.value)}
              className="w-full py-2.5 px-3 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Alle Varianten ({uniqueVariantenNames.length})</option>
              {uniqueVariantenNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zweite Reihe: Status-Filter & Aktionen (Export + Reset) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {/* Status Tabs */}
          <div className="flex flex-wrap rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Alle ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CRITICAL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "CRITICAL"
                  ? "bg-white dark:bg-zinc-700 text-red-600 dark:text-red-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-red-600"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Nachbestellen ({criticalCount})
            </button>
            {outOfStockCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("OUT_OF_STOCK")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "OUT_OF_STOCK"
                    ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-amber-600"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Ausverkauft ({outOfStockCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatusFilter("ORDERED")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "ORDERED"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-indigo-600"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Bestellt ({orderedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("OK")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "OK"
                  ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-emerald-600"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Ausreichend ({okCount})
            </button>
          </div>

          {/* Rechte Aktionen: Filter zurücksetzen & CSV Export */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Filter zurücksetzen</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Aktuelle Ansicht als Excel-kompatible CSV exportieren"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* READ-ONLY TABELLE MIT SPALTENSORTIERUNG */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider select-none">
                {/* Spalte Material */}
                <th
                  onClick={() => handleSort("material")}
                  className="py-3 px-4 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Materialbezeichnung</span>
                    {renderSortIndicator("material")}
                  </div>
                </th>

                {/* Spalte Variante */}
                <th
                  onClick={() => handleSort("variante")}
                  className="py-3 px-4 w-32 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Variante</span>
                    {renderSortIndicator("variante")}
                  </div>
                </th>

                {/* Spalte Artikelnummer */}
                <th
                  onClick={() => handleSort("artikelnummer")}
                  className="py-3 px-4 w-44 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Artikelnummer</span>
                    {renderSortIndicator("artikelnummer")}
                  </div>
                </th>

                {/* Spalte Mindestbestand */}
                <th
                  onClick={() => handleSort("mindestbestand")}
                  className="py-3 px-4 w-32 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Mindestbestand</span>
                    {renderSortIndicator("mindestbestand")}
                  </div>
                </th>

                {/* Spalte Ist-Lagerbestand */}
                <th
                  onClick={() => handleSort("istBestand")}
                  className="py-3 px-4 w-32 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Lagerbestand</span>
                    {renderSortIndicator("istBestand")}
                  </div>
                </th>

                {/* Spalte Status / Handlungsbedarf */}
                <th
                  onClick={() => handleSort("status")}
                  className="py-3 px-4 w-48 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status / Bedarf</span>
                    {renderSortIndicator("status")}
                  </div>
                </th>

                {/* Spalte Aktion */}
                <th className="py-3 px-4 w-36 text-right">Aktion</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAndSortedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-zinc-500">
                    <Filter className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Keine Positionen für diese Filterkriterien gefunden.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Alle Filter zurücksetzen
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSortedRows.map((row) => (
                  <tr
                    key={row.varianteId}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Material */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {row.materialName}
                        </span>
                        {row.hersteller && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <span>🏷️</span>
                            <span>{row.hersteller}</span>
                          </span>
                        )}
                      </div>
                      {row.materialBeschreibung && (
                        <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                          {row.materialBeschreibung}
                        </div>
                      )}
                    </td>

                    {/* Variante */}
                    <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        {row.varianteName}
                      </span>
                    </td>

                    {/* Artikelnummer mit Kopier-Button */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                          {row.artikelnummer}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(row.artikelnummer)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                          title="Artikelnummer kopieren"
                        >
                          {copiedArtNr === row.artikelnummer ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Mindestbestand */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                      {row.mindestbestand.toLocaleString("de-DE")} Stk.
                    </td>

                    {/* Ist-Lagerbestand */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span
                          className={`text-base ${
                            row.isOutOfStock
                              ? "text-red-700 dark:text-red-400"
                              : row.isCritical
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {row.istBestand.toLocaleString("de-DE")} Stk.
                        </span>
                      </div>
                    </td>

                    {/* Status Badge mit Differenz */}
                    <td className="py-3.5 px-4">
                      {row.isBestellt ? (
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 shadow-2xs">
                            <PackageCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            Bestellt
                          </span>
                          <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold pl-1">
                            {row.bestelltMenge ? `${row.bestelltMenge} Stk.` : "Bestellung aktiv"}
                            {row.bestelltAm ? ` (am ${row.bestelltAm.toLocaleDateString("de-DE")})` : ""}
                          </span>
                          {row.bestelltNotiz && (
                            <span className="text-[10px] text-zinc-500 italic pl-1 line-clamp-1 max-w-[200px]" title={row.bestelltNotiz}>
                              &quot;{row.bestelltNotiz}&quot;
                            </span>
                          )}
                        </div>
                      ) : row.isOutOfStock ? (
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                            Ausverkauft (0 Stk.)
                          </span>
                          <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold pl-1">
                            Bedarf: {row.mindestbestand} Stk.
                          </span>
                        </div>
                      ) : row.isCritical ? (
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Meldebestand erreicht
                          </span>
                          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold pl-1">
                            {row.diff < 0 ? `Fehlt: ${Math.abs(row.diff)} Stk.` : "Am Mindestbestand"}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Ausreichend (+{row.diff})
                        </span>
                      )}
                    </td>

                    {/* Aktion / Bestellen */}
                    <td className="py-3.5 px-4 text-right">
                      {row.isBestellt ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderModalTarget({
                              id: row.varianteId,
                              artikelnummer: row.artikelnummer,
                              groesseName: row.varianteName,
                              materialName: row.materialName,
                              hersteller: row.hersteller,
                              istBestand: row.istBestand,
                              mindestbestand: row.mindestbestand,
                              isBestellt: true,
                              bestelltAm: row.bestelltAm,
                              bestelltMenge: row.bestelltMenge,
                              bestelltNotiz: row.bestelltNotiz,
                            });
                            setIsOrderModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Bestelldetails einsehen, bearbeiten oder Status aufheben"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Verwalten</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderModalTarget({
                              id: row.varianteId,
                              artikelnummer: row.artikelnummer,
                              groesseName: row.varianteName,
                              materialName: row.materialName,
                              hersteller: row.hersteller,
                              istBestand: row.istBestand,
                              mindestbestand: row.mindestbestand,
                              isBestellt: false,
                            });
                            setIsOrderModalOpen(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                            row.isOutOfStock || row.isCritical
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-sm"
                              : "text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                          }`}
                          title="Material als bestellt markieren"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Bestellen</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer-Leiste */}
        <div className="px-4 py-3 bg-zinc-50/75 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Gefiltert:{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {filteredAndSortedRows.length}
            </span>{" "}
            von {totalCount} Positionen
            {isAnyFilterActive && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
                (Filter aktiv)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>Sortiert nach: <strong className="text-zinc-700 dark:text-zinc-300">{sortField}</strong> ({sortDirection.toUpperCase()})</span>
            <span>•</span>
            <span>Lagerliste Office</span>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Modal zum Nachbestellen / Status ändern */}
      <BestellModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setOrderModalTarget(null);
        }}
        variante={orderModalTarget}
        onSuccess={(payload) => {
          if (payload) {
            setMaterialien((prev) =>
              prev.map((m) => ({
                ...m,
                varianten: m.varianten.map((v) =>
                  v.id === payload.id
                    ? {
                        ...v,
                        isBestellt: payload.isBestellt,
                        bestelltAm: payload.bestelltAm ? new Date(payload.bestelltAm) : null,
                        bestelltMenge: payload.bestelltMenge ?? null,
                        bestelltNotiz: payload.bestelltNotiz ?? null,
                      }
                    : v
                ),
              }))
            );
          }
          handleReload();
        }}
      />
    </div>
  );
}

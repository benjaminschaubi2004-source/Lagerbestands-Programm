"use client";

import React, { useState, useMemo } from "react";
import {
  MaterialWithVarianten,
  MaterialVarianteInfo,
  deleteMaterial,
  deleteVariante,
  setMaterialKategorie,
} from "@/actions/materialien";
import { GroesseWithCount } from "@/actions/groessen";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Ruler,
  Layers,
  PackageOpen,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  PlusCircle,
  Tag,
} from "lucide-react";
import { useToast } from "./Toast";
import { MaterialModal } from "./MaterialModal";
import { VarianteModal } from "./VarianteModal";
import { ConfirmModal } from "./ConfirmModal";

interface MaterialienTableProps {
  initialMaterialien: MaterialWithVarianten[];
  groessen: GroesseWithCount[];
  onChanged: () => void;
  onOpenGroessenTab: () => void;
}

export function MaterialienTable({
  initialMaterialien,
  groessen,
  onChanged,
  onOpenGroessenTab,
}: MaterialienTableProps) {
  const { toast } = useToast();
  const [materialien, setMaterialien] = useState<MaterialWithVarianten[]>(initialMaterialien);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<number[]>([]);

  // Material Modal (Create / Edit)
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialWithVarianten | null>(null);

  // Variante Modal (Create / Edit)
  const [isVarianteModalOpen, setIsVarianteModalOpen] = useState(false);
  const [targetMaterialForVariante, setTargetMaterialForVariante] = useState<MaterialWithVarianten | null>(null);
  const [editingVariante, setEditingVariante] = useState<MaterialVarianteInfo | null>(null);

  // Löschen Dialoge
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialWithVarianten | null>(null);
  const [deletingVariante, setDeletingVariante] = useState<MaterialVarianteInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setMaterialien(initialMaterialien);
    // Expand all by default if count <= 10
    if (initialMaterialien.length <= 10) {
      setExpandedMaterialIds(initialMaterialien.map((m) => m.id));
    }
  }, [initialMaterialien]);

  const toggleExpand = (id: number) => {
    setExpandedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return materialien;
    const term = searchTerm.toLowerCase();

    return materialien.filter((m) => {
      const matchName = m.name.toLowerCase().includes(term);
      const matchHersteller = m.hersteller && m.hersteller.toLowerCase().includes(term);
      const matchDesc = m.beschreibung && m.beschreibung.toLowerCase().includes(term);
      const matchVar = m.varianten.some(
        (v) =>
          v.artikelnummer.toLowerCase().includes(term) ||
          v.groesse.name.toLowerCase().includes(term)
      );
      return matchName || matchHersteller || matchDesc || matchVar;
    });
  }, [materialien, searchTerm]);

  // Material CRUD handlers
  const handleOpenCreateMaterial = () => {
    setEditingMaterial(null);
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterial = (m: MaterialWithVarianten) => {
    setEditingMaterial(m);
    setIsMaterialModalOpen(true);
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!deletingMaterial) return;
    setIsDeleting(true);
    const res = await deleteMaterial(deletingMaterial.id);
    setIsDeleting(false);

    if (res.success) {
      toast(`Material "${deletingMaterial.name}" wurde gelöscht.`);
      setDeletingMaterial(null);
      onChanged();
    } else {
      toast(res.error || "Fehler beim Löschen des Materials", "error");
    }
  };

  // Variante CRUD handlers
  const handleOpenAddVariante = (m: MaterialWithVarianten) => {
    setTargetMaterialForVariante(m);
    setEditingVariante(null);
    setIsVarianteModalOpen(true);
  };

  const handleOpenEditVariante = (m: MaterialWithVarianten, v: MaterialVarianteInfo) => {
    setTargetMaterialForVariante(m);
    setEditingVariante(v);
    setIsVarianteModalOpen(true);
  };

  const handleConfirmDeleteVariante = async () => {
    if (!deletingVariante) return;
    setIsDeleting(true);
    const res = await deleteVariante(deletingVariante.id);
    setIsDeleting(false);

    if (res.success) {
      toast(`Größen-Variante "${deletingVariante.artikelnummer}" wurde gelöscht.`);
      setDeletingVariante(null);
      onChanged();
    } else {
      toast(res.error || "Fehler beim Löschen der Variante", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Steuerungsleiste */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Material, Artikelnummer oder Größe suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleOpenCreateMaterial}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Neues Material anlegen
        </button>
      </div>

      {/* Materialliste mit verschachtelten Größen-Varianten */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
            <PackageOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="font-medium text-zinc-700 dark:text-zinc-300 text-base">
              Keine Materialien gefunden
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {searchTerm ? "Versuche einen anderen Suchbegriff." : "Lege dein erstes Material an."}
            </p>
          </div>
        ) : (
          filteredItems.map((m) => {
            const isExpanded = expandedMaterialIds.includes(m.id);

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden transition-all"
              >
                {/* Material Header Zeile */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(m.id)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-zinc-500 transition-colors cursor-pointer"
                      title={isExpanded ? "Einklappen" : "Ausklappen"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                          {m.name}
                        </h4>
                        {m.hersteller && (
                          <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <span>🏷️</span>
                            <span>{m.hersteller}</span>
                          </span>
                        )}
                        {m.kategorie === "SCHRAUBEN_KLEINKRAM" && (
                          <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                            <span>🔩 Schrauben/Kleinkram</span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">(Zählung in Paketen)</span>
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {m.varianten.length}{" "}
                          {m.varianten.length === 1 ? "Größe hinterlegt" : "Größen hinterlegt"}
                        </span>
                      </div>
                      {m.beschreibung && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {m.beschreibung}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Material Aktionen */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    {/* Tag Schnell-Umschalter */}
                    <button
                      type="button"
                      onClick={async () => {
                        const nextKat =
                          m.kategorie === "SCHRAUBEN_KLEINKRAM" ? "STANDARD" : "SCHRAUBEN_KLEINKRAM";
                        const res = await setMaterialKategorie(m.id, nextKat);
                        if (res.success) {
                          toast(
                            `Material "${m.name}" auf Tag "${
                              nextKat === "SCHRAUBEN_KLEINKRAM"
                                ? "Schrauben/Kleinkram (Zählung in Paketen)"
                                : "Standard (Zählung in Stück)"
                            }" gesetzt.`
                          );
                          onChanged();
                        } else {
                          toast(res.error || "Fehler beim Setzen des Tags", "error");
                        }
                      }}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                        m.kategorie === "SCHRAUBEN_KLEINKRAM"
                          ? "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                          : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                      }`}
                      title={
                        m.kategorie === "SCHRAUBEN_KLEINKRAM"
                          ? "Tag entfernen (zurück auf Standard Stück-Zählung)"
                          : "Tag auf Schrauben/Kleinkram setzen (nur in Paketen zählen)"
                      }
                    >
                      <Tag className="w-3 h-3" />
                      <span>{m.kategorie === "SCHRAUBEN_KLEINKRAM" ? "🔩 Pakete-Zählung" : "+ Tag: Schrauben"}</span>
                    </button>

                    <button
                      onClick={() => handleOpenAddVariante(m)}
                      className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Weitere Größe für dieses Material hinzufügen"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Größe hinzufügen
                    </button>

                    <button
                      onClick={() => handleOpenEditMaterial(m)}
                      className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                      title="Materialbezeichnung bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingMaterial(m)}
                      className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                      title="Gesamtes Material samt Varianten löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Aufgeklappte Tabelle der Größen-Varianten */}
                {isExpanded && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                    {m.varianten.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                          Für dieses Material sind noch keine Größen-Varianten hinterlegt.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddVariante(m)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Erste Größe für {m.name} anlegen
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-100/70 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                            <th className="py-2.5 px-6 w-32">Größe</th>
                            <th className="py-2.5 px-4 w-44">Gültige Artikelnummer</th>
                            <th className="py-2.5 px-4 w-36">Mindestbestand</th>
                            <th className="py-2.5 px-4 w-36">Ist-Lagerbestand</th>
                            <th className="py-2.5 px-4">Status & Prüfung</th>
                            <th className="py-2.5 px-6 text-right w-24">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {m.varianten.map((v) => {
                            const isCritical = v.istBestand < v.mindestbestand;
                            const isSchrauben = m.kategorie === "SCHRAUBEN_KLEINKRAM";
                            const unitText = isSchrauben ? "Pakete" : "Stk.";

                            return (
                              <tr
                                key={v.id}
                                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                              >
                                <td className="py-2.5 px-6">
                                  <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                                    <Ruler className="w-3.5 h-3.5 text-zinc-400" />
                                    {v.groesse.name}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-mono font-medium text-indigo-700 dark:text-indigo-400">
                                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                                    {v.artikelnummer}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300">
                                  {v.mindestbestand.toLocaleString("de-DE")} {unitText}
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                  {v.istBestand.toLocaleString("de-DE")} {unitText}
                                </td>
                                <td className="py-2.5 px-4">
                                  {v.isBestellt ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                      📦 Bestellt{v.bestelltMenge ? ` (${v.bestelltMenge} ${unitText})` : ""}
                                    </span>
                                  ) : isCritical ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                                      <AlertTriangle className="w-3 h-3" /> Unter Mindestbestand
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      ✓ Vorrat ausreichend
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-6 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenEditVariante(m, v)}
                                      className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors cursor-pointer"
                                      title="Größen-Variante bearbeiten"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingVariante(v)}
                                      className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors cursor-pointer"
                                      title="Größen-Variante löschen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Material anlegen / bearbeiten */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        materialToEdit={editingMaterial}
        groessen={groessen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSaved={onChanged}
      />

      {/* Modal: Größen-Variante anlegen / bearbeiten */}
      {targetMaterialForVariante && (
        <VarianteModal
          isOpen={isVarianteModalOpen}
          materialId={targetMaterialForVariante.id}
          materialName={targetMaterialForVariante.name}
          varianteToEdit={editingVariante}
          existingGroessenIds={targetMaterialForVariante.varianten.map((v) => v.groesseId)}
          groessen={groessen}
          onClose={() => setIsVarianteModalOpen(false)}
          onSaved={onChanged}
        />
      )}

      {/* Dialog: Material löschen */}
      <ConfirmModal
        isOpen={deletingMaterial !== null}
        title="Material löschen"
        message={`Möchtest du das Material "${deletingMaterial?.name}" und alle seine zugehörigen Größen-Varianten wirklich löschen?`}
        confirmText="Löschen"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteMaterial}
        onCancel={() => setDeletingMaterial(null)}
      />

      {/* Dialog: Variante löschen */}
      <ConfirmModal
        isOpen={deletingVariante !== null}
        title="Größen-Variante löschen"
        message={`Möchtest du die Variante "${deletingVariante?.artikelnummer}" (Größe: ${deletingVariante?.groesse.name}) wirklich löschen?`}
        confirmText="Löschen"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteVariante}
        onCancel={() => setDeletingVariante(null)}
      />
    </div>
  );
}

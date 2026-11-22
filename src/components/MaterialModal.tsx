"use client";

import React, { useState, useEffect } from "react";
import { MaterialWithVarianten, createMaterial, updateMaterial } from "@/actions/materialien";
import { GroesseWithCount } from "@/actions/groessen";
import { X, Package, Bookmark, AlignLeft, Hash, Layers, Plus, Building2 } from "lucide-react";
import { useToast } from "./Toast";

interface MaterialModalProps {
  isOpen: boolean;
  materialToEdit?: MaterialWithVarianten | null;
  groessen: GroesseWithCount[];
  onClose: () => void;
  onSaved: () => void;
}

export function MaterialModal({
  isOpen,
  materialToEdit,
  groessen,
  onClose,
  onSaved,
}: MaterialModalProps) {
  const { toast } = useToast();
  const isEditing = Boolean(materialToEdit);

  const [name, setName] = useState("");
  const [hersteller, setHersteller] = useState("");
  const [beschreibung, setBeschreibung] = useState("");

  // Initiale Variante beim Neuanlegen
  const [createInitialVariante, setCreateInitialVariante] = useState(true);
  const [sizeMode, setSizeMode] = useState<"select" | "new">("select");
  const [groesseId, setGroesseId] = useState<number>(groessen.length > 0 ? groessen[0].id : 0);
  const [newGroesseName, setNewGroesseName] = useState("");
  const [artikelnummer, setArtikelnummer] = useState("");
  const [mindestbestand, setMindestbestand] = useState(20);
  const [istBestand, setIstBestand] = useState(20);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (materialToEdit) {
      setName(materialToEdit.name);
      setHersteller(materialToEdit.hersteller || "");
      setBeschreibung(materialToEdit.beschreibung || "");
      setCreateInitialVariante(false);
    } else {
      setName("");
      setHersteller("");
      setBeschreibung("");
      setCreateInitialVariante(true);
      if (groessen.length > 0) {
        setGroesseId(groessen[0].id);
        setSizeMode("select");
      } else {
        setSizeMode("new");
      }
      setNewGroesseName("");
      setArtikelnummer("");
      setMindestbestand(20);
      setIstBestand(20);
    }
    setErrorMessage(null);
  }, [materialToEdit, isOpen, groessen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const matName = name.trim();
    if (!matName) {
      setErrorMessage("Bitte gib eine Materialbezeichnung ein.");
      return;
    }

    if (!isEditing && createInitialVariante) {
      const artNr = artikelnummer.trim();
      if (!artNr) {
        setErrorMessage("Bitte gib eine Artikelnummer für die erste Größen-Variante an.");
        return;
      }

      if (sizeMode === "new" && !newGroesseName.trim()) {
        setErrorMessage("Bitte gib eine Bezeichnung für die neue Größe an.");
        return;
      }
      if (sizeMode === "select" && (!groesseId || groesseId === 0)) {
        setErrorMessage("Bitte wähle eine Größe für die Variante aus.");
        return;
      }
    }

    setIsSubmitting(true);
    let res;
    if (isEditing && materialToEdit) {
      res = await updateMaterial(materialToEdit.id, {
        name: matName,
        hersteller: hersteller.trim() || null,
        beschreibung,
      });
    } else {
      res = await createMaterial({
        name: matName,
        hersteller: hersteller.trim() || undefined,
        beschreibung,
        varianten: createInitialVariante
          ? [
              {
                groesseId: sizeMode === "select" ? groesseId : undefined,
                newGroesseName: sizeMode === "new" ? newGroesseName.trim() : undefined,
                artikelnummer: artikelnummer.trim(),
                mindestbestand,
                istBestand,
              },
            ]
          : undefined,
      });
    }
    setIsSubmitting(false);

    if (res.success) {
      toast(
        isEditing
          ? `Material "${matName}" erfolgreich aktualisiert.`
          : `Material "${matName}" erfolgreich angelegt.`
      );
      onSaved();
      onClose();
    } else {
      setErrorMessage(res.error || "Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {isEditing ? "Material bearbeiten" : "Neues Material anlegen"}
              </h3>
              <p className="text-xs text-zinc-500">
                {isEditing ? `ID #${materialToEdit?.id}` : "Stammdaten für neues Material erfassen"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
              Materialbezeichnung / Name *
            </label>
            <input
              type="text"
              required
              placeholder="z.B. Arbeitshandschuhe Nitril"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Hersteller (optional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                Hersteller
              </span>
              <span className="text-[11px] font-normal text-zinc-400 dark:text-zinc-500">optional</span>
            </label>
            <input
              type="text"
              placeholder="z. B. Bosch, Würth, Somfy... (kann frei bleiben)"
              value={hersteller}
              onChange={(e) => setHersteller(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Beschreibung */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-zinc-400" />
              Beschreibung / Spezifikation
            </label>
            <textarea
              rows={2}
              placeholder="Optionale Details für die Monteure..."
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Initiale Variante beim Neuanlegen */}
          {!isEditing && (
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Erste Größen-Variante direkt anlegen
                </span>
                <input
                  type="checkbox"
                  checked={createInitialVariante}
                  onChange={(e) => setCreateInitialVariante(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {createInitialVariante && (
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  {/* Größe wählen oder neu anlegen */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        Größe *
                      </label>
                      <div className="flex gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSizeMode("select")}
                          className={`hover:underline cursor-pointer ${
                            sizeMode === "select"
                              ? "text-indigo-600 font-bold"
                              : "text-zinc-400"
                          }`}
                        >
                          Vorhandene wählen
                        </button>
                        <span className="text-zinc-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSizeMode("new")}
                          className={`hover:underline cursor-pointer ${
                            sizeMode === "new"
                              ? "text-indigo-600 font-bold"
                              : "text-zinc-400"
                          }`}
                        >
                          + Neue Größe
                        </button>
                      </div>
                    </div>

                    {sizeMode === "select" && groessen.length > 0 ? (
                      <select
                        value={groesseId}
                        onChange={(e) => setGroesseId(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 font-medium"
                      >
                        {groessen.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="z.B. XL, 44, M12..."
                        value={newGroesseName}
                        onChange={(e) => setNewGroesseName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-indigo-300 dark:border-indigo-700 rounded-md bg-white dark:bg-zinc-800 font-medium"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-zinc-400" />
                      Artikelnummer für diese Größe *
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. MAT-1001-L"
                      value={artikelnummer}
                      onChange={(e) => setArtikelnummer(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-medium border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-zinc-400" />
                        Mindestbestand
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={mindestbestand}
                        onChange={(e) =>
                          setMindestbestand(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3 text-zinc-400" />
                        Lagerbestand (Ist)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={istBestand}
                        onChange={(e) =>
                          setIstBestand(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Wird gespeichert..." : isEditing ? "Speichern" : "Material erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

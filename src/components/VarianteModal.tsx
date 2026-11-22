"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MaterialVarianteInfo, addVariante, updateVariante } from "@/actions/materialien";
import { GroesseWithCount } from "@/actions/groessen";
import { X, Layers, Hash, Package, PlusCircle, Check } from "lucide-react";
import { useToast } from "./Toast";

interface VarianteModalProps {
  isOpen: boolean;
  materialId: number;
  materialName: string;
  varianteToEdit?: MaterialVarianteInfo | null;
  existingGroessenIds: number[];
  groessen: GroesseWithCount[];
  onClose: () => void;
  onSaved: () => void;
}

export function VarianteModal({
  isOpen,
  materialId,
  materialName,
  varianteToEdit,
  existingGroessenIds,
  groessen,
  onClose,
  onSaved,
}: VarianteModalProps) {
  const { toast } = useToast();
  const isEditing = Boolean(varianteToEdit);

  // Modus: "select" (vorhandene Größe) oder "new" (neue Größe on-the-fly eintippen)
  const [sizeMode, setSizeMode] = useState<"select" | "new">("select");
  const [selectedGroesseId, setSelectedGroesseId] = useState<number>(0);
  const [newGroesseName, setNewGroesseName] = useState("");

  const [artikelnummer, setArtikelnummer] = useState("");
  const [mindestbestand, setMindestbestand] = useState(10);
  const [istBestand, setIstBestand] = useState(10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Berechne wählbare Größen
  const selectableGroessen = useMemo(() => {
    return groessen.filter((g) => {
      if (isEditing && varianteToEdit && g.id === varianteToEdit.groesseId) return true;
      return !existingGroessenIds.includes(g.id);
    });
  }, [groessen, existingGroessenIds, isEditing, varianteToEdit]);

  // Initialisierung beim Öffnen oder Wechseln des Materials
  useEffect(() => {
    if (!isOpen) return;

    if (varianteToEdit) {
      setSelectedGroesseId(varianteToEdit.groesseId);
      setNewGroesseName("");
      setSizeMode("select");
      setArtikelnummer(varianteToEdit.artikelnummer);
      setMindestbestand(varianteToEdit.mindestbestand);
      setIstBestand(varianteToEdit.istBestand);
    } else {
      // Beim Neuanlegen
      if (selectableGroessen.length > 0) {
        setSelectedGroesseId(selectableGroessen[0].id);
        setSizeMode("select");
      } else {
        // Falls alle Größen bereits vergeben sind, direkt auf "new" schalten
        setSizeMode("new");
        setSelectedGroesseId(0);
      }
      setNewGroesseName("");
      setArtikelnummer("");
      setMindestbestand(10);
      setIstBestand(10);
    }
    setErrorMessage(null);
  }, [isOpen, varianteToEdit, materialId, existingGroessenIds]);

  // Wenn keine wählbare Größe da ist und Nutzer auf "select" steht, automatisch auf "new"
  useEffect(() => {
    if (!isEditing && selectableGroessen.length === 0 && sizeMode === "select") {
      setSizeMode("new");
    }
  }, [selectableGroessen, sizeMode, isEditing]);

  if (!isOpen) return null;

  // Helfer: Generiere Artikelnummer-Vorschlag
  const handleAutoSuggestArtNr = () => {
    const prefix = materialName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 6) || "MAT";

    let sizeSuffix = "VAR";
    if (sizeMode === "select") {
      const g = groessen.find((item) => item.id === selectedGroesseId);
      if (g) sizeSuffix = g.name.toUpperCase().replace(/[^A-Z0-9]/g, "");
    } else if (newGroesseName.trim()) {
      sizeSuffix = newGroesseName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    setArtikelnummer(`${prefix}-${sizeSuffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const artNr = artikelnummer.trim();
    if (!artNr) {
      setErrorMessage("Bitte gib eine Artikelnummer ein.");
      return;
    }

    let finalGroesseId: number | undefined = selectedGroesseId;
    let finalNewName: string | undefined = undefined;

    if (!isEditing) {
      if (sizeMode === "new") {
        const trimmedNew = newGroesseName.trim();
        if (!trimmedNew) {
          setErrorMessage("Bitte gib eine Bezeichnung für die neue Größe ein.");
          return;
        }
        finalGroesseId = undefined;
        finalNewName = trimmedNew;
      } else {
        if (!selectedGroesseId || selectedGroesseId === 0) {
          setErrorMessage("Bitte wähle eine gültige Größe aus.");
          return;
        }
        finalGroesseId = selectedGroesseId;
      }
    }

    setIsSubmitting(true);
    let res;
    if (isEditing && varianteToEdit) {
      res = await updateVariante(varianteToEdit.id, {
        artikelnummer: artNr,
        mindestbestand,
        istBestand,
      });
    } else {
      res = await addVariante(materialId, {
        groesseId: finalGroesseId,
        newGroesseName: finalNewName,
        artikelnummer: artNr,
        mindestbestand,
        istBestand,
      });
    }
    setIsSubmitting(false);

    if (res.success) {
      toast(
        isEditing
          ? `Variante "${artNr}" erfolgreich aktualisiert.`
          : `Variante "${artNr}" erfolgreich hinzugefügt.`
      );
      onSaved();
      onClose();
    } else {
      setErrorMessage(res.error || "Fehler beim Speichern der Variante.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {isEditing ? "Variante bearbeiten" : "Neue Variante hinzufügen"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">
              Für Material: <span className="text-zinc-900 dark:text-zinc-200 font-semibold">{materialName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Varianten-Typ Auswahl */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Variante festlegen *
            </label>

            {isEditing ? (
              <div className="px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                {varianteToEdit?.groesse.name}
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Modus Umschalter */}
                <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setSizeMode("select")}
                    disabled={selectableGroessen.length === 0}
                    className={`flex-1 py-1.5 text-center rounded-md transition-all cursor-pointer ${
                      sizeMode === "select"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    Bestehende Variante ({selectableGroessen.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeMode("new")}
                    className={`flex-1 py-1.5 text-center rounded-md transition-all cursor-pointer ${
                      sizeMode === "new"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    + Neue Variante anlegen
                  </button>
                </div>

                {sizeMode === "select" ? (
                  <select
                    value={selectedGroesseId}
                    onChange={(e) => setSelectedGroesseId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    {selectableGroessen.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="z.B. 10Nm, 3er, 85x85mm, Vestamatic..."
                      value={newGroesseName}
                      onChange={(e) => setNewGroesseName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-indigo-300 dark:border-indigo-700 rounded-lg bg-indigo-50/30 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Wird automatisch angelegt und mit dem Material verknüpft.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Artikelnummer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                Artikelnummer *
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleAutoSuggestArtNr}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Vorschlag generieren
                </button>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="z.B. ART-1001-L"
              value={artikelnummer}
              onChange={(e) => setArtikelnummer(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Bestände */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                Mindestbestand *
              </label>
              <input
                type="number"
                min="0"
                required
                value={mindestbestand}
                onChange={(e) => setMindestbestand(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-zinc-400" />
                Lagerbestand (Ist)
              </label>
              <input
                type="number"
                min="0"
                value={istBestand}
                onChange={(e) => setIstBestand(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? "Speichern..." : isEditing ? "Änderungen speichern" : "Variante anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

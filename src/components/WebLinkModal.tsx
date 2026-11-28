"use client";

import React, { useState, useEffect, useTransition } from "react";
import { WebLinkItem, createWebLink, updateWebLink } from "@/actions/links";
import { useToast } from "./Toast";
import { Globe, X, Link2, Tag, FileText, Check, AlertCircle } from "lucide-react";

interface WebLinkModalProps {
  isOpen: boolean;
  link?: WebLinkItem | null;
  existingCategories?: string[];
  onClose: () => void;
  onSaved: (link: WebLinkItem) => void;
}

const DEFAULT_CATEGORY_SUGGESTIONS = [
  "Lieferanten",
  "Hersteller",
  "Tools",
  "Logistik",
  "Behörden & KFZ",
  "Interne Links",
];

export function WebLinkModal({
  isOpen,
  link,
  existingCategories = [],
  onClose,
  onSaved,
}: WebLinkModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [titel, setTitel] = useState("");
  const [url, setUrl] = useState("");
  const [kategorie, setKategorie] = useState("Allgemein");
  const [beschreibung, setBeschreibung] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = Boolean(link);

  // Vorschläge kombinieren
  const allCategorySuggestions = Array.from(
    new Set([...DEFAULT_CATEGORY_SUGGESTIONS, ...existingCategories.filter(Boolean)])
  );

  useEffect(() => {
    if (link) {
      setTitel(link.titel || "");
      setUrl(link.url || "");
      setKategorie(link.kategorie || "Allgemein");
      setBeschreibung(link.beschreibung || "");
    } else {
      setTitel("");
      setUrl("");
      setKategorie("Allgemein");
      setBeschreibung("");
    }
    setFormError(null);
  }, [link, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitel = titel.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitel) {
      setFormError("Bitte geben Sie einen Namen/Titel für den Weblink an.");
      return;
    }
    if (!trimmedUrl) {
      setFormError("Bitte geben Sie eine Web-Adresse (URL) ein.");
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && link) {
          const res = await updateWebLink(link.id, {
            titel: trimmedTitel,
            url: trimmedUrl,
            kategorie: kategorie.trim() || "Allgemein",
            beschreibung: beschreibung.trim() || null,
          });

          if (res.success && res.link) {
            toast(`Weblink "${trimmedTitel}" erfolgreich aktualisiert.`);
            onSaved(res.link);
            onClose();
          } else {
            setFormError(res.error || "Fehler beim Aktualisieren des Weblinks.");
          }
        } else {
          const res = await createWebLink({
            titel: trimmedTitel,
            url: trimmedUrl,
            kategorie: kategorie.trim() || "Allgemein",
            beschreibung: beschreibung.trim() || null,
          });

          if (res.success && res.link) {
            toast(`Weblink "${trimmedTitel}" erfolgreich angelegt.`);
            onSaved(res.link);
            onClose();
          } else {
            setFormError(res.error || "Fehler beim Anlegen des Weblinks.");
          }
        }
      } catch (err: any) {
        setFormError(err.message || "Unerwarteter Fehler beim Speichern.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {isEditing ? "Weblink bearbeiten" : "Neuen Weblink hinzufügen"}
              </h2>
              <p className="text-xs text-zinc-500">
                Wichtige Portale, Lieferanten oder Webseiten für das Office hinterlegen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Titel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Bezeichnung / Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="z.B. Würth Online-Shop, Simu Portal, Hornbach..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Web-Adresse (URL) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.wuerth.de (oder wuerth.de)"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Tipp: Falls Sie kein &quot;https://&quot; eingeben, wird es beim Speichern automatisch ergänzt.
            </p>
          </div>

          {/* Kategorie */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Kategorie / Gruppe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value)}
                placeholder="z.B. Lieferanten, Hersteller, Tools..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Vorschlag-Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-zinc-400 self-center mr-1">Vorschläge:</span>
              {allCategorySuggestions.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setKategorie(cat)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    kategorie === cat
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Beschreibung / Notizen */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Beschreibung & Notizen (optional)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="z.B. Kundennummer: 104239, Ansprechpartner Herr Müller, Zugangsdaten im Bürotresor..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Hilfreiche Infos für Kollegen im Büro wie Kundennummern, Zweck oder Besonderheiten.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{isPending ? "Speichern..." : isEditing ? "Änderungen speichern" : "Weblink hinzufügen"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

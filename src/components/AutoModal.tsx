"use client";

import React, { useState, useEffect, useTransition } from "react";
import { AutoItem, createAuto, updateAuto } from "@/actions/autos";
import { useToast } from "./Toast";
import {
  Car,
  X,
  Calendar,
  AlertTriangle,
  FileText,
  Tag,
  Gauge,
  CheckCircle2,
  Wrench,
  Clock,
} from "lucide-react";

interface AutoModalProps {
  isOpen: boolean;
  auto?: AutoItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AutoModal({ isOpen, auto, onClose, onSaved }: AutoModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [kennzeichen, setKennzeichen] = useState("");
  const [modell, setModell] = useState("");
  const [tuevTermin, setTuevTermin] = useState("");
  const [defekte, setDefekte] = useState("");
  const [anmerkungen, setAnmerkungen] = useState("");
  const [status, setStatus] = useState("BEREIT");
  const [kilometerstand, setKilometerstand] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (auto) {
      setName(auto.name || "");
      setKennzeichen(auto.kennzeichen || "");
      setModell(auto.modell || "");
      if (auto.tuevTermin) {
        const d = new Date(auto.tuevTermin);
        if (!isNaN(d.getTime())) {
          setTuevTermin(d.toISOString().split("T")[0]);
        } else {
          setTuevTermin("");
        }
      } else {
        setTuevTermin("");
      }
      setDefekte(auto.defekte || "");
      setAnmerkungen(auto.anmerkungen || "");
      setStatus(auto.status || (auto.defekte ? "DEFEKT" : "BEREIT"));
      setKilometerstand(auto.kilometerstand !== null && auto.kilometerstand !== undefined ? String(auto.kilometerstand) : "");
    } else {
      setName("");
      setKennzeichen("");
      setModell("");
      setTuevTermin("");
      setDefekte("");
      setAnmerkungen("");
      setStatus("BEREIT");
      setKilometerstand("");
    }
    setFormError(null);
  }, [auto, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(auto);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Bitte geben Sie einen Namen bzw. eine Bezeichnung für das Auto an.");
      return;
    }

    startTransition(async () => {
      setFormError(null);
      const kmNum = kilometerstand.trim() ? parseInt(kilometerstand.replace(/\D/g, ""), 10) : null;

      try {
        if (isEdit && auto) {
          const res = await updateAuto(auto.id, {
            name: trimmedName,
            kennzeichen: kennzeichen.trim() || null,
            modell: modell.trim() || null,
            defekte: defekte.trim() || null,
            tuevTermin: tuevTermin ? new Date(tuevTermin) : null,
            anmerkungen: anmerkungen.trim() || null,
            kilometerstand: kmNum,
            status,
          });

          if (!res.success) {
            setFormError(res.error || "Fehler beim Aktualisieren.");
            return;
          }
          toast(`Fahrzeug "${trimmedName}" wurde aktualisiert.`);
        } else {
          const res = await createAuto({
            name: trimmedName,
            kennzeichen: kennzeichen.trim() || null,
            modell: modell.trim() || null,
            defekte: defekte.trim() || null,
            tuevTermin: tuevTermin ? new Date(tuevTermin) : null,
            anmerkungen: anmerkungen.trim() || null,
            kilometerstand: kmNum,
            status: status || (defekte.trim() ? "DEFEKT" : "BEREIT"),
          });

          if (!res.success) {
            setFormError(res.error || "Fehler beim Anlegen.");
            return;
          }
          toast(`Neues Fahrzeug "${trimmedName}" erfolgreich hinzugefügt.`);
        }

        onSaved();
        onClose();
      } catch (err: any) {
        setFormError(err.message || "Unerwarteter Fehler beim Speichern.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {isEdit ? "Fahrzeug bearbeiten" : "Neues Fahrzeug anlegen"}
              </h3>
              <p className="text-xs text-zinc-500">
                {isEdit
                  ? "Stammdaten, Mängel oder TÜV-Termin anpassen"
                  : "Neues Auto für den Firmenfuhrpark erfassen"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {formError && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Name / Bezeichnung */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Name / Bezeichnung <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Caddy 1, Sprinter Nord, Werkstattwagen..."
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* 2 Spalten: Kennzeichen & Modell */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kennzeichen <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Tag className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={kennzeichen}
                  onChange={(e) => setKennzeichen(e.target.value.toUpperCase())}
                  placeholder="z.B. B-LL 2026"
                  className="w-full pl-9 pr-3.5 py-2 text-sm uppercase font-mono tracking-wider bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Modell / Fahrzeugtyp <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={modell}
                onChange={(e) => setModell(e.target.value)}
                placeholder="z.B. VW Caddy Maxi, Sprinter 316..."
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* 2 Spalten: Nächster TÜV-Termin & Kilometerstand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nächster TÜV-Termin <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={tuevTermin}
                  onChange={(e) => setTuevTermin(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kilometerstand <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={kilometerstand}
                  onChange={(e) => setKilometerstand(e.target.value)}
                  placeholder="z.B. 142500"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Status-Auswahl */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Fahrzeugstatus
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus("BEREIT")}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === "BEREIT"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Einsatzbereit</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("DEFEKT")}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === "DEFEKT"
                    ? "bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-red-500/20"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Mangel / Defekt</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("WERKSTATT")}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === "WERKSTATT"
                    ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>In Werkstatt</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("TUEV_FAELLIG")}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === "TUEV_FAELLIG"
                    ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                <Clock className="w-4 h-4 text-purple-500" />
                <span>TÜV fällig</span>
              </button>
            </div>
          </div>

          {/* Mögliche Defekte */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Mögliche Defekte / Mängel</span>
              </label>
              {defekte.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setDefekte("");
                    if (status === "DEFEKT") setStatus("BEREIT");
                  }}
                  className="text-[11px] text-zinc-400 hover:text-red-500 cursor-pointer"
                >
                  Als behoben leeren
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={defekte}
              onChange={(e) => {
                setDefekte(e.target.value);
                // Wenn ein Defekt getippt wird und Status noch BEREIT ist, automatisch auf DEFEKT vorschlagen
                if (e.target.value.trim() && status === "BEREIT") {
                  setStatus("DEFEKT");
                }
              }}
              placeholder="z.B. Blinker vorne rechts defekt, Bremsen quietschen, Steinschlag Windschutzscheibe, Schiebetür klemmt..."
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Anmerkungen */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Anmerkungen & Notizen</span>
            </label>
            <textarea
              rows={3}
              value={anmerkungen}
              onChange={(e) => setAnmerkungen(e.target.value)}
              placeholder="z.B. Ersatzschlüssel liegt im Büroschrank Fach 2, Sommerreifen im Lager eingelagert, Tankkarte im Handschuhfach..."
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Speichern...</span>
                </>
              ) : (
                <span>{isEdit ? "Änderungen speichern" : "Auto anlegen"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { createMeldung } from "@/actions/meldungen";
import {
  Lightbulb,
  AlertTriangle,
  MessageSquareWarning,
  HelpCircle,
  Send,
  CheckCircle2,
  User,
  Tag,
  Clock,
  Sparkles,
} from "lucide-react";
import { useToast } from "./Toast";

interface MeldungFormProps {
  bereich: "MONTEUR" | "OFFICE";
  currentUserName?: string;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export function MeldungForm({
  bereich,
  currentUserName = "Mitarbeiter",
  onSuccess,
  title = "Meldung an den Admin",
  subtitle = "Teile Ideen, Verbesserungsvorschläge, Probleme oder Beschwerden direkt mit der Lagerleitung.",
}: MeldungFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [kategorie, setKategorie] = useState<"IDEE" | "PROBLEM" | "BESCHWERDE" | "SONSTIGES">("IDEE");
  const [prioritaet, setPrioritaet] = useState<"NORMAL" | "WICHTIG" | "DRINGEND">("NORMAL");
  const [titelInput, setTitelInput] = useState("");
  const [nachrichtInput, setNachrichtInput] = useState("");
  const [absenderInput, setAbsenderInput] = useState(currentUserName);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titelInput.trim()) {
      toast("Bitte gib einen Betreff bzw. Titel für deine Meldung ein.", "error");
      return;
    }
    if (!nachrichtInput.trim()) {
      toast("Bitte beschreibe dein Anliegen genauer.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createMeldung({
          titel: titelInput.trim(),
          kategorie,
          nachricht: nachrichtInput.trim(),
          bereich,
          absenderName: absenderInput.trim() || currentUserName,
          prioritaet,
        });

        if (res.success) {
          toast("Meldung erfolgreich an den Administrator gesendet!");
          setSubmitted(true);
          setTitelInput("");
          setNachrichtInput("");
          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast(res.error || "Fehler beim Absenden der Meldung.", "error");
        }
      } catch (err: any) {
        toast("Fehler: " + (err?.message || "Meldung konnte nicht gesendet werden."), "error");
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Kopfbereich */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800">
                {bereich === "OFFICE" ? "Office" : "Monteur"}
              </span>
            </h2>
            <p className="text-xs text-zinc-500">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Bestätigung nach Absenden */}
      {submitted && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Vielen Dank für deine Rückmeldung!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Deine Meldung wurde sicher in der Datenbank gespeichert und ist für die Administratoren im Dashboard sichtbar.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
            >
              + Weitere Meldung verfassen
            </button>
          </div>
        </div>
      )}

      {/* Formular */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* 1. Kategorie-Auswahl */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block mb-2">
            1. Art der Meldung auswählen
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Idee / Vorschlag */}
            <button
              type="button"
              onClick={() => setKategorie("IDEE")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                kategorie === "IDEE"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold"
                  : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
              }`}
            >
              <Lightbulb className={`w-4 h-4 mb-1.5 ${kategorie === "IDEE" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`} />
              <span className="text-xs">Idee / Vorschlag</span>
            </button>

            {/* Problem / Fehler */}
            <button
              type="button"
              onClick={() => setKategorie("PROBLEM")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                kategorie === "PROBLEM"
                  ? "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20 font-bold"
                  : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
              }`}
            >
              <AlertTriangle className={`w-4 h-4 mb-1.5 ${kategorie === "PROBLEM" ? "text-rose-600 dark:text-rose-400" : "text-zinc-400"}`} />
              <span className="text-xs">Problem / Bug</span>
            </button>

            {/* Beschwerde / Anmerkung */}
            <button
              type="button"
              onClick={() => setKategorie("BESCHWERDE")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                kategorie === "BESCHWERDE"
                  ? "bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 font-bold"
                  : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
              }`}
            >
              <MessageSquareWarning className={`w-4 h-4 mb-1.5 ${kategorie === "BESCHWERDE" ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"}`} />
              <span className="text-xs">Beschwerde</span>
            </button>

            {/* Sonstiges */}
            <button
              type="button"
              onClick={() => setKategorie("SONSTIGES")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                kategorie === "SONSTIGES"
                  ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 font-bold"
                  : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
              }`}
            >
              <HelpCircle className={`w-4 h-4 mb-1.5 ${kategorie === "SONSTIGES" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
              <span className="text-xs">Sonstiges</span>
            </button>
          </div>
        </div>

        {/* 2. Dringlichkeit / Priorität */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block mb-2">
            2. Dringlichkeit
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPrioritaet("NORMAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                prioritaet === "NORMAL"
                  ? "bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                  : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setPrioritaet("WICHTIG")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                prioritaet === "WICHTIG"
                  ? "bg-amber-600 text-white border-amber-600 font-bold"
                  : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Wichtig
            </button>
            <button
              type="button"
              onClick={() => setPrioritaet("DRINGEND")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                prioritaet === "DRINGEND"
                  ? "bg-red-600 text-white border-red-600 font-bold"
                  : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Dringend
            </button>
          </div>
        </div>

        {/* 3. Titel / Betreff */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Betreff / Titel der Meldung *
          </label>
          <input
            type="text"
            required
            placeholder={
              kategorie === "IDEE"
                ? "z.B. Neuer Scanner für Werkstattwagen..."
                : kategorie === "PROBLEM"
                ? "z.B. Falscher Bestand bei Rolladenkasten weiß..."
                : kategorie === "BESCHWERDE"
                ? "z.B. Unaufgeräumter Arbeitsplatz in Lager 2..."
                : "z.B. Rückfrage zu Bestellung..."
            }
            value={titelInput}
            onChange={(e) => setTitelInput(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-medium"
          />
        </div>

        {/* 4. Ausführliche Nachricht */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Beschreibung / Details *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Beschreibe deinen Vorschlag oder das Problem so genau wie möglich..."
            value={nachrichtInput}
            onChange={(e) => setNachrichtInput(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-medium resize-y"
          />
        </div>

        {/* 5. Absender Name (Automatisch aus Benutzerkonto) */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Absender (Angemeldeter Benutzer)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={absenderInput}
              readOnly
              disabled
              tabIndex={-1}
              className="w-full pl-3.5 pr-24 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-not-allowed select-none"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-md select-none">
              Automatisch
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending || !titelInput.trim() || !nachrichtInput.trim()}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-sm shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 touch-manipulation"
          >
            <Send className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
            <span>{isPending ? "Wird gesendet..." : "Meldung an Admin senden"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  MeldungItem,
  getMeldungen,
  updateMeldungStatus,
  deleteMeldung,
} from "@/actions/meldungen";
import {
  Lightbulb,
  AlertTriangle,
  MessageSquareWarning,
  HelpCircle,
  CheckCircle2,
  Clock,
  User,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Wrench,
} from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmModal } from "./ConfirmModal";

interface AdminMeldungenViewProps {
  initialMeldungen?: MeldungItem[];
  onChanged?: () => void;
}

export function AdminMeldungenView({
  initialMeldungen = [],
  onChanged,
}: AdminMeldungenViewProps) {
  const { toast } = useToast();
  const [meldungen, setMeldungen] = useState<MeldungItem[]>(initialMeldungen);
  const [isPending, startTransition] = useTransition();

  // Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OFFEN" | "IN_BEARBEITUNG" | "ERLEDIGT">("ALL");
  const [kategorieFilter, setKategorieFilter] = useState<string>("ALL");
  const [bereichFilter, setBereichFilter] = useState<"ALL" | "MONTEUR" | "OFFICE">("ALL");

  // Inline-Antwort-Zustand für eine Meldung
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  // Lösch-Modal
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Synchronisieren falls sich initialMeldungen ändern
  React.useEffect(() => {
    setMeldungen(initialMeldungen);
  }, [initialMeldungen]);

  const handleReload = () => {
    startTransition(async () => {
      try {
        const fresh = await getMeldungen();
        setMeldungen(fresh);
        if (onChanged) onChanged();
        toast("Meldungen aktualisiert.");
      } catch {
        toast("Fehler beim Aktualisieren der Meldungen.", "error");
      }
    });
  };

  const handleStatusChange = async (id: number, nextStatus: string) => {
    try {
      const res = await updateMeldungStatus(id, { status: nextStatus });
      if (res.success && res.meldung) {
        setMeldungen((prev) => prev.map((m) => (m.id === id ? res.meldung! : m)));
        toast(`Meldung #${id} auf "${nextStatus}" gesetzt.`);
        if (onChanged) onChanged();
      } else {
        toast(res.error || "Fehler beim Aktualisieren des Status.", "error");
      }
    } catch {
      toast("Fehler beim Ändern des Status.", "error");
    }
  };

  const handleSaveReply = async (id: number) => {
    try {
      const res = await updateMeldungStatus(id, { antwort: replyText.trim() });
      if (res.success && res.meldung) {
        setMeldungen((prev) => prev.map((m) => (m.id === id ? res.meldung! : m)));
        setActiveReplyId(null);
        setReplyText("");
        toast("Admin-Notiz / Rückmeldung gespeichert.");
        if (onChanged) onChanged();
      } else {
        toast(res.error || "Fehler beim Speichern der Notiz.", "error");
      }
    } catch {
      toast("Fehler beim Speichern der Notiz.", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await deleteMeldung(deleteTargetId);
      if (res.success) {
        setMeldungen((prev) => prev.filter((m) => m.id !== deleteTargetId));
        setDeleteTargetId(null);
        toast("Meldung gelöscht.");
        if (onChanged) onChanged();
      } else {
        toast(res.error || "Fehler beim Löschen.", "error");
      }
    } catch {
      toast("Fehler beim Löschen der Meldung.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = meldungen.length;
    const offen = meldungen.filter((m) => m.status === "OFFEN").length;
    const inBearbeitung = meldungen.filter((m) => m.status === "IN_BEARBEITUNG").length;
    const erledigt = meldungen.filter((m) => m.status === "ERLEDIGT").length;
    return { total, offen, inBearbeitung, erledigt };
  }, [meldungen]);

  // Gefilterte Liste
  const filteredMeldungen = useMemo(() => {
    return meldungen.filter((m) => {
      // Status Filter
      if (statusFilter !== "ALL" && m.status !== statusFilter) {
        return false;
      }
      // Kategorie Filter
      if (kategorieFilter !== "ALL" && m.kategorie !== kategorieFilter) {
        return false;
      }
      // Bereich Filter
      if (bereichFilter !== "ALL" && m.bereich !== bereichFilter) {
        return false;
      }
      // Suchbegriff
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesTitel = m.titel.toLowerCase().includes(term);
        const matchesText = m.nachricht.toLowerCase().includes(term);
        const matchesAbsender = m.absenderName.toLowerCase().includes(term);
        const matchesAntwort = m.antwort ? m.antwort.toLowerCase().includes(term) : false;
        if (!matchesTitel && !matchesText && !matchesAbsender && !matchesAntwort) {
          return false;
        }
      }
      return true;
    });
  }, [meldungen, statusFilter, kategorieFilter, bereichFilter, searchTerm]);

  const formatDate = (d: Date) => {
    return new Date(d).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-5">
      {/* KPI Kacheln */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-violet-50 dark:bg-violet-950/60 border-violet-500 ring-2 ring-violet-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="text-xs font-semibold text-zinc-500">Alle Meldungen</div>
          <div className="text-2xl font-black mt-1 text-zinc-900 dark:text-zinc-100">{stats.total}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("OFFEN")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "OFFEN"
              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Offen / Neu</span>
          </div>
          <div className="text-2xl font-black mt-1 text-rose-700 dark:text-rose-300">{stats.offen}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("IN_BEARBEITUNG")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "IN_BEARBEITUNG"
              ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">In Bearbeitung</div>
          <div className="text-2xl font-black mt-1 text-blue-700 dark:text-blue-300">{stats.inBearbeitung}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("ERLEDIGT")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ERLEDIGT"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Erledigt</div>
          <div className="text-2xl font-black mt-1 text-emerald-700 dark:text-emerald-300">{stats.erledigt}</div>
        </button>
      </div>

      {/* Filterleiste */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Suche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Meldungen nach Titel, Text oder Absender durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Aktualisieren Button */}
            <button
              type="button"
              onClick={handleReload}
              disabled={isPending}
              className="px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Meldungen neu laden"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-violet-600" : ""}`} />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-zinc-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {/* Bereich Filter */}
          <button
            type="button"
            onClick={() => setBereichFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
              bereichFilter === "ALL"
                ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Alle Bereiche
          </button>
          <button
            type="button"
            onClick={() => setBereichFilter("MONTEUR")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer flex items-center gap-1 ${
              bereichFilter === "MONTEUR"
                ? "bg-indigo-600 text-white font-bold"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span>Monteur</span>
          </button>
          <button
            type="button"
            onClick={() => setBereichFilter("OFFICE")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer flex items-center gap-1 ${
              bereichFilter === "OFFICE"
                ? "bg-blue-600 text-white font-bold"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Office</span>
          </button>

          <span className="text-zinc-300 dark:text-zinc-700">|</span>

          {/* Kategorie Filter */}
          <button
            type="button"
            onClick={() => setKategorieFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
              kategorieFilter === "ALL"
                ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Alle Arten
          </button>
          <button
            type="button"
            onClick={() => setKategorieFilter("IDEE")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
              kategorieFilter === "IDEE"
                ? "bg-emerald-600 text-white font-bold"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            }`}
          >
            💡 Ideen
          </button>
          <button
            type="button"
            onClick={() => setKategorieFilter("PROBLEM")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
              kategorieFilter === "PROBLEM"
                ? "bg-rose-600 text-white font-bold"
                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            ⚠️ Probleme
          </button>
          <button
            type="button"
            onClick={() => setKategorieFilter("BESCHWERDE")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
              kategorieFilter === "BESCHWERDE"
                ? "bg-amber-600 text-white font-bold"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            📢 Beschwerden
          </button>
        </div>
      </div>

      {/* Meldungen Liste */}
      {filteredMeldungen.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-sm">
          <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">Keine Meldungen gefunden</p>
          <p className="text-xs text-zinc-500 mt-1">
            {searchTerm || statusFilter !== "ALL" || kategorieFilter !== "ALL" || bereichFilter !== "ALL"
              ? "Passe deine Filterkriterien an, um andere Einträge anzuzeigen."
              : "Es wurden bisher noch keine Ideen, Probleme oder Vorschläge eingereicht."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredMeldungen.map((m) => {
            const isOffen = m.status === "OFFEN";
            const isInBearbeitung = m.status === "IN_BEARBEITUNG";
            const isErledigt = m.status === "ERLEDIGT";

            const isIdee = m.kategorie === "IDEE";
            const isProblem = m.kategorie === "PROBLEM";
            const isBeschwerde = m.kategorie === "BESCHWERDE";

            const isReplying = activeReplyId === m.id;

            return (
              <div
                key={m.id}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                  isOffen
                    ? "border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/10"
                    : isInBearbeitung
                    ? "border-blue-300 dark:border-blue-900/60"
                    : "border-zinc-200 dark:border-zinc-800 opacity-90"
                }`}
              >
                {/* Header-Zeile mit Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Kategorie Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isIdee
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : isProblem
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : isBeschwerde
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      }`}
                    >
                      {isIdee && <Lightbulb className="w-3.5 h-3.5" />}
                      {isProblem && <AlertTriangle className="w-3.5 h-3.5" />}
                      {isBeschwerde && <MessageSquareWarning className="w-3.5 h-3.5" />}
                      {!isIdee && !isProblem && !isBeschwerde && <HelpCircle className="w-3.5 h-3.5" />}
                      <span>
                        {isIdee
                          ? "Idee / Vorschlag"
                          : isProblem
                          ? "Problem / Fehler"
                          : isBeschwerde
                          ? "Beschwerde"
                          : "Sonstiges"}
                      </span>
                    </span>

                    {/* Bereich Badge */}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                      {m.bereich === "OFFICE" ? (
                        <>
                          <Building2 className="w-3 h-3 text-blue-500" />
                          <span>Office</span>
                        </>
                      ) : (
                        <>
                          <Wrench className="w-3 h-3 text-indigo-500" />
                          <span>Monteur</span>
                        </>
                      )}
                    </span>

                    {/* Dringlichkeit Badge */}
                    {m.prioritaet === "DRINGEND" && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                        Dringend
                      </span>
                    )}
                    {m.prioritaet === "WICHTIG" && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white">
                        Wichtig
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                        isOffen
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : isInBearbeitung
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {isOffen && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                      {isInBearbeitung && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                      {isErledigt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>
                        {isOffen ? "Offen" : isInBearbeitung ? "In Bearbeitung" : "Erledigt"}
                      </span>
                    </span>

                    {/* Löschen Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(m.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Meldung löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Titel & Absender */}
                <div className="mt-3">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{m.titel}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{m.absenderName}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{formatDate(m.createdAt)}</span>
                    </span>
                  </div>
                </div>

                {/* Nachricht Inhalt */}
                <div className="mt-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {m.nachricht}
                </div>

                {/* Bestehende Admin-Antwort / Notiz */}
                {m.antwort && !isReplying && (
                  <div className="mt-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 text-xs">
                    <div className="flex items-center justify-between font-bold text-violet-900 dark:text-violet-200 mb-1">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                        Admin-Rückmeldung / Notiz:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(m.id);
                          setReplyText(m.antwort || "");
                        }}
                        className="text-[11px] text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                      >
                        Bearbeiten
                      </button>
                    </div>
                    <p className="text-violet-800 dark:text-violet-300 whitespace-pre-wrap">{m.antwort}</p>
                  </div>
                )}

                {/* Inline-Formular: Admin Antwort verfassen / bearbeiten */}
                {isReplying && (
                  <div className="mt-3 p-3.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 space-y-2.5 animate-in fade-in">
                    <label className="text-xs font-bold text-violet-900 dark:text-violet-200 block">
                      Admin-Rückmeldung / Notiz verfassen:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Schreibe eine Rückmeldung oder Notiz für diese Meldung..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-violet-300 dark:border-violet-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(null);
                          setReplyText("");
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveReply(m.id)}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-700 text-white cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Speichern</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Aktionen-Leiste */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-zinc-400 mr-1">Status:</span>

                    {/* Auf "Offen" setzen */}
                    {!isOffen && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(m.id, "OFFEN")}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                      >
                        Wieder öffnen
                      </button>
                    )}

                    {/* Auf "In Bearbeitung" setzen */}
                    {!isInBearbeitung && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(m.id, "IN_BEARBEITUNG")}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                      >
                        In Bearbeitung
                      </button>
                    )}

                    {/* Auf "Erledigt" setzen */}
                    {!isErledigt && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(m.id, "ERLEDIGT")}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Erledigt</span>
                      </button>
                    )}
                  </div>

                  {/* Notiz / Antwort Button falls noch nicht offen */}
                  {!isReplying && !m.antwort && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyId(m.id);
                        setReplyText("");
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>+ Rückmeldung / Notiz</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lösch-Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Meldung löschen?"
        message="Möchtest du diese Meldung wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Meldung löschen"
        cancelText="Abbrechen"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

"use client";

import React, { useState, useMemo, useTransition } from "react";
import { ActivityLogItem, getActivityLogs, clearAndBackupAllLogs } from "@/actions/logs";
import {
  History,
  Clock,
  User,
  ShieldCheck,
  Building2,
  Wrench,
  Search,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  PlusCircle,
  Trash2,
  Edit2,
  LogIn,
  LogOut,
  Layers,
  Package,
  FolderArchive,
} from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmModal } from "./ConfirmModal";
import { LogBackupsModal } from "./LogBackupsModal";

interface ActivityLogViewProps {
  initialLogs: ActivityLogItem[];
  onLogsCleared?: () => void;
}

export function ActivityLogView({ initialLogs, onLogsCleared }: ActivityLogViewProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLogItem[]>(initialLogs);
  const [selectedBereich, setSelectedBereich] = useState<"ALL" | "TECHNIKER" | "OFFICE" | "ADMIN">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isBackupsModalOpen, setIsBackupsModalOpen] = useState(false);

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const fresh = await getActivityLogs({ limit: 150 });
        setLogs(fresh);
        toast("Aktivitäts-Log aktualisiert.");
      } catch (err) {
        toast("Fehler beim Aktualisieren des Logs.", "error");
      }
    });
  };

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const res = await clearAndBackupAllLogs();
      if (res.success) {
        setLogs([]);
        toast(`Logs erfolgreich geleert! Backup erstellt: ${res.backupFileName}`);
        setIsClearModalOpen(false);
        if (onLogsCleared) {
          onLogsCleared();
        }
      } else {
        toast(res.message || "Fehler beim Leeren der Logs.", "error");
      }
    } catch {
      toast("Fehler beim Ausführen der Aktion.", "error");
    } finally {
      setIsClearing(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // 1. Bereichsfilter
      if (selectedBereich !== "ALL" && item.bereich !== selectedBereich) {
        return false;
      }
      // 2. Suche
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchUser = item.username.toLowerCase().includes(term);
        const matchDesc = item.beschreibung.toLowerCase().includes(term);
        const matchAction = item.aktion.toLowerCase().includes(term);
        const matchDetails = item.details ? item.details.toLowerCase().includes(term) : false;
        return matchUser || matchDesc || matchAction || matchDetails;
      }
      return true;
    });
  }, [logs, selectedBereich, searchTerm]);

  const countTechniker = useMemo(() => logs.filter((l) => l.bereich === "TECHNIKER").length, [logs]);
  const countOffice = useMemo(() => logs.filter((l) => l.bereich === "OFFICE").length, [logs]);
  const countAdmin = useMemo(() => logs.filter((l) => l.bereich === "ADMIN").length, [logs]);

  const formatTimestamp = (d: Date) => {
    const date = new Date(d);
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Icon je nach Aktion
  const getActionIcon = (aktion: string, bereich: string) => {
    if (aktion === "AUSGABE") return <ArrowDownCircle className="w-4 h-4 text-rose-600" />;
    if (aktion === "EINNAHME") return <ArrowUpCircle className="w-4 h-4 text-emerald-600" />;
    if (aktion.includes("CREATE")) return <PlusCircle className="w-4 h-4 text-indigo-600" />;
    if (aktion.includes("DELETE")) return <Trash2 className="w-4 h-4 text-red-600" />;
    if (aktion.includes("UPDATE")) return <Edit2 className="w-4 h-4 text-amber-600" />;
    if (aktion === "LOGIN") return <LogIn className="w-4 h-4 text-emerald-600" />;
    if (aktion === "LOGOUT") return <LogOut className="w-4 h-4 text-zinc-400" />;
    if (bereich === "ADMIN") return <ShieldCheck className="w-4 h-4 text-violet-600" />;
    if (bereich === "OFFICE") return <Building2 className="w-4 h-4 text-blue-600" />;
    return <Wrench className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Audit- & Bewegungs-Log
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Lückenloses Journal aller Aktionen bei Techniker, Office und Admin mit Datum, Uhrzeit und angemeldetem User.
          </p>
        </div>

        {/* Buttons rechts */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Roter, gut sichtbarer kleiner Button zum Leeren & Sichern */}
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            disabled={isClearing}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            title="Aktivitäts- und Bewegungs-Logs leeren und automatische Sicherungsdatei erstellen"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Logs leeren & sichern</span>
          </button>

          {/* Button: Gesicherte Backups */}
          <button
            type="button"
            onClick={() => setIsBackupsModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Archivierte Backups ansehen und herunterladen"
          >
            <FolderArchive className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Archivierte Backups</span>
            <span className="sm:hidden">Backups</span>
          </button>

          {/* Log aktualisieren */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-violet-600" : ""}`} />
            <span className="hidden md:inline">Log aktualisieren</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Suche */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Alle */}
          <button
            type="button"
            onClick={() => setSelectedBereich("ALL")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedBereich === "ALL"
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/60 font-bold text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500" />
              <span className="text-xs sm:text-sm">Alle Bereiche</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-zinc-100 dark:bg-zinc-800">
              {logs.length}
            </span>
          </button>

          {/* Techniker */}
          <button
            type="button"
            onClick={() => setSelectedBereich("TECHNIKER")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedBereich === "TECHNIKER"
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs sm:text-sm">Techniker</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {countTechniker}
            </span>
          </button>

          {/* Office */}
          <button
            type="button"
            onClick={() => setSelectedBereich("OFFICE")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedBereich === "OFFICE"
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm">Office</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {countOffice}
            </span>
          </button>

          {/* Admin */}
          <button
            type="button"
            onClick={() => setSelectedBereich("ADMIN")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedBereich === "ADMIN"
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/60 font-bold text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs sm:text-sm">Admin</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
              {countAdmin}
            </span>
          </button>
        </div>

        {/* Suchfeld */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Log filtern nach Benutzer, Aktion oder Bewegung..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/50 focus:outline-hidden focus:ring-2 focus:ring-violet-500 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* 3. Log-Tabelle */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs">
            <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">
              Keine Log-Einträge gefunden
            </p>
            <p className="mt-1">
              {logs.length === 0
                ? "Das Log ist aktuell leer. Alle neuen Aktionen werden hier automatisch protokolliert."
                : "Passe die Filter oder den Suchbegriff an."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Zeitpunkt</th>
                  <th className="py-3 px-4">Bereich</th>
                  <th className="py-3 px-4">Benutzer</th>
                  <th className="py-3 px-4">Aktion & Bewegung</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredLogs.map((item) => {
                  const isAdminItem = item.bereich === "ADMIN";
                  const isOfficeItem = item.bereich === "OFFICE";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Zeitpunkt */}
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {formatTimestamp(item.createdAt)}
                      </td>

                      {/* Bereich */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAdminItem
                              ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                              : isOfficeItem
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          }`}
                        >
                          {isAdminItem ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : isOfficeItem ? (
                            <Building2 className="w-3 h-3" />
                          ) : (
                            <Wrench className="w-3 h-3" />
                          )}
                          <span>{item.bereich}</span>
                        </span>
                      </td>

                      {/* Benutzer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">
                            @{item.username}
                          </span>
                        </div>
                      </td>

                      {/* Aktion & Bewegung */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0">
                            {getActionIcon(item.aktion, item.bereich)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                {item.aktion}
                              </span>
                              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                {item.beschreibung}
                              </span>
                            </div>
                            {item.details && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 lg:hidden">
                                {item.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Details (Große Bildschirme) */}
                      <td className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 hidden lg:table-cell max-w-xs truncate">
                        {item.details || "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Logs leeren Bestätigung */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Aktivitäts- und Bewegungs-Logs leeren?"
        message="Möchtest du das gesamte Aktivitäts- und Audit-Log sowie die Buchungshistorie (Eingänge & Ausgänge) leeren? Vor dem Leeren wird automatisch ein vollständiges Backup mit allen Daten im Projektordner ('backups/logs/') erstellt. Techniker, Office und Admins sehen danach ein leeres Log."
        confirmText="Logs sichern & leeren"
        cancelText="Abbrechen"
        isDestructive={true}
        isLoading={isClearing}
        onConfirm={handleClearLogs}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Modal: Archivierte Backups */}
      <LogBackupsModal
        isOpen={isBackupsModalOpen}
        onClose={() => setIsBackupsModalOpen(false)}
      />
    </div>
  );
}

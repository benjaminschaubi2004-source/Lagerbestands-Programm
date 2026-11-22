"use client";

import React, { useState, useEffect } from "react";
import { LogBackupItem, getLogBackupsList, getLogBackupFileContent } from "@/actions/logs";
import {
  X,
  FileText,
  Download,
  Eye,
  FolderArchive,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useToast } from "./Toast";

interface LogBackupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogBackupsModal({ isOpen, onClose }: LogBackupsModalProps) {
  const { toast } = useToast();
  const [backups, setBackups] = useState<LogBackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string; content: string } | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const list = await getLogBackupsList();
      setBackups(list);
    } catch {
      toast("Fehler beim Laden der Backups.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBackups();
      setViewingFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyPath = () => {
    navigator.clipboard.writeText("backups/logs/");
    setCopied(true);
    toast("Pfad 'backups/logs/' in die Zwischenablage kopiert.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleView = async (filename: string) => {
    setLoadingContent(true);
    try {
      const content = await getLogBackupFileContent(filename);
      if (content !== null) {
        setViewingFile({ name: filename, content });
      } else {
        toast("Konnte Dateiinhalt nicht laden.", "error");
      }
    } catch {
      toast("Fehler beim Lesen der Datei.", "error");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const content = await getLogBackupFileContent(filename);
      if (!content) {
        toast("Datei nicht gefunden.", "error");
        return;
      }
      const blob = new Blob([content], {
        type: filename.endsWith(".json") ? "application/json" : "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(`Download gestartet: ${filename}`);
    } catch {
      toast("Download fehlgeschlagen.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Archivierte Log-Backups</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
                  {backups.length}
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Sicherungen der Aktivitäts-, Bewegungs- und Buchungs-Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadBackups}
              disabled={loading}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg cursor-pointer"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-violet-600" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info-Leiste: Speicherort */}
        <div className="px-5 py-2.5 bg-zinc-100/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
            <span className="text-zinc-400 font-sans">Speicherort im Projekt:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
              backups/logs/
            </span>
          </div>
          <button
            onClick={handleCopyPath}
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer shrink-0 ml-2"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Kopiert!" : "Pfad kopieren"}</span>
          </button>
        </div>

        {/* Content-Bereich */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {viewingFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setViewingFile(null)}
                  className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Zurück zur Übersicht</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-zinc-500">
                    {viewingFile.name}
                  </span>
                  <button
                    onClick={() => handleDownload(viewingFile.name)}
                    className="px-2.5 py-1 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[55vh] border border-zinc-800 leading-relaxed whitespace-pre-wrap">
                  {viewingFile.content}
                </pre>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
              <span>Lade Sicherungen...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              <FolderArchive className="w-10 h-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                Noch keine Log-Backups vorhanden
              </p>
              <p className="mt-1 text-zinc-500 max-w-sm mx-auto">
                Sobald du im Admin-Bereich auf den roten Button &quot;Logs leeren&quot; klickst, wird hier automatisch
                eine lesbare Sicherung abgelegt.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/60">
              {backups.map((b) => (
                <div
                  key={b.filename}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                          {b.filename}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                          {(b.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          {b.formattedDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                          <Layers className="w-3.5 h-3.5 text-zinc-400" />
                          {b.activityCount} Aktionen / {b.buchungCount} Buchungen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aktionen */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleView(b.filename)}
                      disabled={loadingContent}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Im Browser ansehen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ansehen</span>
                    </button>
                    <button
                      onClick={() => handleDownload(b.filename)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Textdatei (.txt) herunterladen"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.txt</span>
                    </button>
                    {b.jsonFilename && (
                      <button
                        onClick={() => handleDownload(b.jsonFilename)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="JSON-Datei herunterladen"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.json</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span>Dateien sind sowohl als lesbarer Text (.txt) als auch strukturiert (.json) gesichert.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

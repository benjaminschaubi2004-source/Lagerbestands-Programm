"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  X,
  Mail,
  Send,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  AlertOctagon,
  Server,
  Sparkles,
  Info,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  BedarfsMailItem,
  checkSmtpStatus,
  sendBedarfslisteSmtp,
  getFormattedBedarfsText,
  SmtpConfigStatus,
} from "@/actions/mail";
import { useToast } from "./Toast";

interface BedarfsMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BedarfsMailItem[];
}

export function BedarfsMailModal({ isOpen, onClose, items }: BedarfsMailModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Empfänger-E-Mail (wird in localStorage gemerkt)
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");

  // Auswahl der Artikel (Checkboxen)
  const [selectedArtNrs, setSelectedArtNrs] = useState<Set<string>>(new Set());

  // SMTP-Status (Version B Vorbereitung)
  const [smtpStatus, setSmtpStatus] = useState<SmtpConfigStatus | null>(null);
  const [activeTab, setActiveTab] = useState<"outlook" | "smtp">("outlook");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedSmtpSample, setCopiedSmtpSample] = useState(false);

  // Initialisierung beim Öffnen
  useEffect(() => {
    if (!isOpen) return;

    // Gespeicherte E-Mail aus localStorage laden
    try {
      const savedEmail = localStorage.getItem("lagerlurch_order_email") || "";
      setRecipientEmail(savedEmail);
    } catch {}

    // Alle Artikel standardmäßig auswählen
    setSelectedArtNrs(new Set(items.map((i) => i.artikelnummer)));
    setCopiedText(false);

    // SMTP-Status abfragen
    checkSmtpStatus()
      .then((status) => {
        setSmtpStatus(status);
        if (status.defaultTo && !recipientEmail) {
          setRecipientEmail(status.defaultTo);
        }
      })
      .catch(() => {});
  }, [isOpen, items]);

  // Gefilterte ausgewählte Elemente
  const selectedItems = useMemo(() => {
    return items.filter((i) => selectedArtNrs.has(i.artikelnummer));
  }, [items, selectedArtNrs]);

  const ausverkauftCount = selectedItems.filter((i) => i.status === "OUT_OF_STOCK").length;
  const kritischCount = selectedItems.filter((i) => i.status === "CRITICAL").length;

  if (!isOpen) return null;

  // Toggle alle Artikel
  const handleToggleSelectAll = () => {
    if (selectedArtNrs.size === items.length) {
      setSelectedArtNrs(new Set());
    } else {
      setSelectedArtNrs(new Set(items.map((i) => i.artikelnummer)));
    }
  };

  const handleToggleItem = (artNr: string) => {
    setSelectedArtNrs((prev) => {
      const next = new Set(prev);
      if (next.has(artNr)) {
        next.delete(artNr);
      } else {
        next.add(artNr);
      }
      return next;
    });
  };

  const saveEmailToStorage = () => {
    if (recipientEmail.trim()) {
      try {
        localStorage.setItem("lagerlurch_order_email", recipientEmail.trim());
      } catch {}
    }
  };

  const getEmailSubject = () => {
    const dateStr = new Date().toLocaleDateString("de-DE");
    return `Lagerbestands-Meldung: Nachbestellung (${selectedItems.length} Positionen) – ${dateStr}`;
  };

  // VERSION A: In Outlook / Standard-Mailprogramm öffnen
  const handleOpenOutlookApp = async () => {
    if (selectedItems.length === 0) {
      toast("Bitte wähle mindestens eine Position aus.", "error");
      return;
    }
    saveEmailToStorage();

    const text = await getFormattedBedarfsText(selectedItems, customNote);
    const subject = getEmailSubject();
    const to = recipientEmail.trim();

    // mailto Link generieren
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(text)}`;

    window.location.href = mailtoUrl;
    toast("Outlook / E-Mail-Programm wird geöffnet...");
  };

  // VERSION A: In Outlook Web öffnen (Office 365)
  const handleOpenOutlookWeb = async () => {
    if (selectedItems.length === 0) {
      toast("Bitte wähle mindestens eine Position aus.", "error");
      return;
    }
    saveEmailToStorage();

    const text = await getFormattedBedarfsText(selectedItems, customNote);
    const subject = getEmailSubject();
    const to = recipientEmail.trim();

    // Outlook Web Deeplink
    const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
      to
    )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

    window.open(outlookWebUrl, "_blank", "noopener,noreferrer");
    toast("Outlook Web wird in einem neuen Tab geöffnet...");
  };

  // Text in Zwischenablage kopieren
  const handleCopyText = async () => {
    if (selectedItems.length === 0) {
      toast("Keine Positionen ausgewählt.", "error");
      return;
    }
    saveEmailToStorage();

    const text = await getFormattedBedarfsText(selectedItems, customNote);
    await navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast("Bedarfsliste in die Zwischenablage kopiert!");
    setTimeout(() => setCopiedText(false), 2500);
  };

  // VERSION B: Direkter SMTP-Versand über Server
  const handleSendViaSmtp = () => {
    if (selectedItems.length === 0) {
      toast("Bitte wähle mindestens eine Position aus.", "error");
      return;
    }
    if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
      toast("Bitte gib eine gültige Empfänger-E-Mail-Adresse an.", "error");
      return;
    }

    saveEmailToStorage();

    startTransition(async () => {
      try {
        const res = await sendBedarfslisteSmtp({
          to: recipientEmail.trim(),
          subject: getEmailSubject(),
          notiz: customNote.trim() || undefined,
          items: selectedItems,
        });

        if (res.success) {
          toast(`E-Mail erfolgreich per Server an ${recipientEmail.trim()} gesendet!`);
          onClose();
        } else {
          toast(res.error || "Fehler beim Senden per SMTP.", "error");
        }
      } catch (err: any) {
        toast("Netzwerkfehler beim Versenden.", "error");
      }
    });
  };

  const sampleSmtpEnv = `# Microsoft 365 / Outlook SMTP-Konfiguration:
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="deine-adresse@deine-firma.de"
SMTP_PASS="dein-app-passwort"
SMTP_FROM="LagerLurch <deine-adresse@deine-firma.de>"
DEFAULT_ORDER_EMAIL="einkauf@deine-firma.de"`;

  const handleCopySampleEnv = () => {
    navigator.clipboard.writeText(sampleSmtpEnv);
    setCopiedSmtpSample(true);
    toast("Muster-Konfiguration in die Zwischenablage kopiert!");
    setTimeout(() => setCopiedSmtpSample(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Bedarfsliste / Sammelmail an Outlook
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Ausverkaufte und kritische Positionen gebündelt per E-Mail versenden
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Version A vs Version B) */}
        <div className="px-6 pt-3 pb-1 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-850/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("outlook")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "outlook"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Version A: 1-Klick Outlook</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("smtp")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "smtp"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Version B: Server SMTP</span>
            {smtpStatus?.isConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="SMTP eingerichtet" />
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                Vorbereitet
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Empfänger E-Mail */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Empfänger Outlook- / E-Mail-Adresse *
            </label>
            <div className="relative">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="z.B. einkauf@deine-firma.de oder bestellungen@outlook.de"
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Wird auf deinem Gerät gespeichert und für zukünftige Sammelmails automatisch vorausgefüllt.
            </p>
          </div>

          {/* Notiz / Bemerkung */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Zusätzliche Notiz / Hinweis (optional)
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="z.B. Bitte dringend bis Freitag bestellen / Für Baustelle Musterstraße..."
              className="w-full px-3.5 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Übersicht Positionen */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <span>Zu bestellende Positionen ({items.length})</span>
                <span className="text-zinc-400 font-normal">
                  ({ausverkauftCount} Ausverkauft, {kritischCount} Meldebestand)
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {selectedArtNrs.size === items.length ? "Keine auswählen" : "Alle auswählen"}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                🎉 Aktuell sind keine Positionen ausverkauft oder kritisch!
              </div>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 max-h-56 overflow-y-auto">
                {items.map((item) => {
                  const isChecked = selectedArtNrs.has(item.artikelnummer);
                  const isOut = item.status === "OUT_OF_STOCK";

                  return (
                    <label
                      key={item.artikelnummer}
                      className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-zinc-50/80 dark:bg-zinc-800/40 hover:bg-zinc-100/70"
                          : "bg-white dark:bg-zinc-900 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItem(item.artikelnummer)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                            <span>{item.materialName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300">
                              {item.groesseName}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            Art.-Nr: {item.artikelnummer}
                            {item.url && <span className="ml-2 text-blue-600 font-sans">🔗 Mit Shop-Link</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {isOut ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>Fehlt: {item.fehlmenge} {item.einheit}</span>
                        </span>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Bestand: {item.istBestand} / Min: {item.mindestbestand}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* TAB SPEZIFISCHER CONTENT */}
          {activeTab === "outlook" ? (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4" />
                <span>Version A: 1-Klick Übergabe</span>
              </div>
              <p>
                Mit Klick auf einen der Buttons unten wird Microsoft Outlook (App oder Web) direkt mit
                Empfänger, Betreff und strukturierter Artikelliste samt Fehlmengen und Shop-Links geöffnet.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
              <div className="font-bold flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                  <Server className="w-4 h-4" />
                  <span>Version B: Server SMTP-Status</span>
                </div>
                {smtpStatus?.isConfigured ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Konfiguriert ({smtpStatus.host})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Noch nicht aktiv
                  </span>
                )}
              </div>

              {smtpStatus?.isConfigured ? (
                <p>
                  Der SMTP-Server ist aktiv. Die Mail kann direkt über den Server als schön formatierte
                  HTML-Tabelle verschickt werden.
                </p>
              ) : (
                <div className="space-y-2">
                  <p>
                    Die Funktion für direkten Hintergrund-Versand ist im Code fertig programmiert. Um sie zu
                    aktivieren, trage einfach deine E-Mail-Zugangsdaten in die <code>.env</code>-Datei ein.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopySampleEnv}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-semibold cursor-pointer text-[11px]"
                  >
                    {copiedSmtpSample ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSmtpSample ? "Kopiert!" : "Muster-Konfiguration für .env kopieren"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Linke Seite: Text in Zwischenablage kopieren */}
          <button
            type="button"
            onClick={handleCopyText}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Textformatierte Liste in die Zwischenablage kopieren"
          >
            {copiedText ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedText ? "In Zwischenablage kopiert!" : "Text kopieren"}</span>
          </button>

          {/* Rechte Seite: Absende-Optionen */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Schließen
            </button>

            {activeTab === "outlook" ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenOutlookWeb}
                  disabled={selectedItems.length === 0}
                  className="px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="In Outlook Web (Browser) öffnen"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Outlook Web</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenOutlookApp}
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Im installierten Outlook / Standard-Mailprogramm öffnen"
                >
                  <Mail className="w-4 h-4" />
                  <span>In Outlook öffnen</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSendViaSmtp}
                disabled={isPending || selectedItems.length === 0 || !smtpStatus?.isConfigured}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Wird per Server versendet...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Per Server (SMTP) senden</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

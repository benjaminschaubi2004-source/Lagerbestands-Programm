"use client";

import React from "react";
import {
  Smartphone,
  Download,
  ShieldCheck,
  Wrench,
  Building2,
  CheckCircle2,
  HelpCircle,
  HardDrive,
  Wifi,
  ExternalLink,
} from "lucide-react";
import { useToast } from "./Toast";

export function AndroidAppView() {
  const { toast } = useToast();

  const handleDownloadClick = () => {
    toast("Download gestartet: Lagerliste.apk");
  };

  return (
    <div className="space-y-6">
      {/* 1. Haupt-Download Kachel */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white rounded-3xl p-6 sm:p-10 border border-indigo-800/50 shadow-xl relative overflow-hidden">
        {/* Dekorative Hintergrundelemente */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-4">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Offizielle Android App (Release v1.0)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Lagerliste für Android
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6 max-w-2xl">
            Installiere die Lagerliste als eigenständige App auf Android-Smartphones und -Tablets. Ideal für Techniker in der Werkstatt und unterwegs vor dem Lagerregal sowie fürs Office.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <a
              href="/downloads/Lagerliste.apk"
              download="Lagerliste.apk"
              onClick={handleDownloadClick}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Lagerliste.apk herunterladen (2.8 MB)</span>
            </a>

            <div className="text-xs text-zinc-400 flex items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Desktop-Kopie: <code className="text-zinc-200 font-mono">C:\Users\benja\Desktop\Lagerliste.apk</code>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Rollen-Unterstützung */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Techniker */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-600/20">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Für Techniker & Werkstatt
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Direkt vor dem Lagerregal: Material & Variante auswählen, Artikelnummer ablesen und Bestandsbuchungen (Ausgabe / Einnahme) in Sekundenschnelle erfassen.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Schnellauswahl & Buchung</span>
          </div>
        </div>

        {/* Office */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Für Office & Einkauf
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Vollständige Bestands- und Variantenübersicht mit Filter- und Nachbestellampel auf dem Tablet oder Smartphone immer griffbereit.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Geschützter Lesezugriff</span>
          </div>
        </div>

        {/* Admin */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3 shadow-md shadow-violet-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Für Administratoren
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Vollzugriff auch in der App: Materialien anlegen, Benutzer verwalten (Techniker/Office/Admin) und das vollständige Aktivitäts-Log einsehen.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Vollständige CRUD & Logs</span>
          </div>
        </div>
      </div>

      {/* 3. Installations-Anleitung & Netzwerk-Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anleitung */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Installationsanleitung für Android
            </h3>
          </div>

          <ol className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-zinc-900 dark:text-zinc-200 block mb-0.5">
                  APK-Datei auf das Smartphone laden
                </strong>
                Tippe oben auf <strong>„Lagerliste.apk herunterladen“</strong> direkt über den Browser deines Smartphones oder übertrage die Datei vom Desktop (<code className="font-mono text-zinc-500">C:\Users\benja\Desktop\Lagerliste.apk</code>) per USB-Kabel oder Messenger.
              </div>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-zinc-900 dark:text-zinc-200 block mb-0.5">
                  Unbekannte Quellen / Sideloading erlauben
                </strong>
                Öffne die heruntergeladene <code className="font-mono text-zinc-500">Lagerliste.apk</code> auf dem Smartphone. Bestätige den Android-Sicherheitshinweis mit <em>„Aus dieser Quelle installieren erlauben“</em>.
              </div>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-zinc-900 dark:text-zinc-200 block mb-0.5">
                  App starten & Anmelden
                </strong>
                Die App öffnet sich und verbindet sich direkt mit der Lagerliste im WLAN. Melde dich einfach mit deinen Benutzerdaten (z. B. <code className="font-mono text-zinc-500">techniker</code> / <code className="font-mono text-zinc-500">techniker123</code>) an!
              </div>
            </li>
          </ol>
        </div>

        {/* Server & Netzwerk-Status */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Netzwerk-Konfiguration
              </h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              Die Android-App ist ab Werk vorkonfiguriert, um sich im lokalen WLAN automatisch mit folgendem Server zu verbinden:
            </p>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold break-all">
              http://192.168.178.97:3000
            </div>

            <p className="text-[11px] text-zinc-400 mt-2">
              Sollte sich die IP-Adresse des Servers im Router einmal ändern, bietet die App direkt auf dem Startbildschirm eine Option zur Eingabe der neuen IP-Adresse.
            </p>
          </div>

          <a
            href="/downloads/Lagerliste.apk"
            download="Lagerliste.apk"
            onClick={handleDownloadClick}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>APK erneut herunterladen</span>
          </a>
        </div>
      </div>
    </div>
  );
}

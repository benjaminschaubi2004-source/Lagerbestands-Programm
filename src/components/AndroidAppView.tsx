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
  Sparkles,
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
            <span>Offizielle Android Apps (Release v1.0)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Lagerliste für Android
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6 max-w-2xl">
            Installiere die Lagerliste als eigenständige App auf Android-Smartphones und -Tablets. Ideal für Monteure in der Werkstatt, vor dem Lagerregal, fürs Office oder als autarke Offline-Demo ohne Serververbindung.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            {/* 1. Vollversion / Admin */}
            <a
              href="/downloads/Lagerliste.apk"
              download="Lagerliste.apk"
              onClick={() => toast("Download gestartet: Lagerliste.apk (Vollversion)")}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Lagerliste.apk (Vollversion / Admin)</span>
            </a>

            {/* 2. Nur Techniker */}
            <a
              href="/downloads/Lagerliste-Techniker.apk"
              download="Lagerliste-Techniker.apk"
              onClick={() => toast("Download gestartet: Lagerliste-Techniker.apk (Exklusiv Techniker)")}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <Wrench className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Lagerliste-Techniker.apk (Nur Techniker)</span>
            </a>

            {/* 3. NEU: Offline Demo-Version */}
            <a
              href="/downloads/Lagerliste-Demo.apk"
              download="Lagerliste-Demo.apk"
              onClick={() => toast("Download gestartet: Lagerliste-Demo.apk (Offline Demo)")}
              className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group border border-amber-400/30"
            >
              <Sparkles className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-amber-200" />
              <span>Lagerliste-Demo.apk (Offline Demo)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Rollen-Unterstützung (4 Kacheln inkl. Demo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Techniker */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-600/20">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Für Monteure & Werkstatt
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
              Vollzugriff auch in der App: Materialien anlegen, Benutzer verwalten (Monteur/Office/Admin) und das vollständige Aktivitäts-Log einsehen.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Vollständige CRUD & Logs</span>
          </div>
        </div>

        {/* NEU: Offline Demo */}
        <div className="bg-white dark:bg-zinc-900 border border-amber-300/40 dark:border-amber-700/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between bg-gradient-to-b from-amber-500/5 to-transparent">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-600/20">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Offline Demo-Version</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">100% Offline</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Vollfunktionsfähige Simulation aller 19 Materialien, 38 Varianten und Fuhrpark. Funktioniert ohne WLAN oder Server – ideal für Vorführungen mit 1-Klick Reset.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Autarke Simulation & Reset</span>
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
                  Gewünschte APK auf das Smartphone laden
                </strong>
                Tippe oben auf <strong>„Lagerliste.apk“</strong> (Vollversion im WLAN) oder <strong>„Lagerliste-Demo.apk“</strong> (100% autarke Offline-Demo ohne WLAN) direkt über den Browser deines Smartphones.
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
                Öffne die heruntergeladene APK-Datei auf dem Smartphone. Bestätige den Android-Sicherheitshinweis mit <em>„Aus dieser Quelle installieren erlauben“</em>.
              </div>
            </li>

            <li className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-zinc-900 dark:text-zinc-200 block mb-0.5">
                  App starten
                </strong>
                Die App öffnet sich sofort im Vollbildmodus. Bei der Demo kannst du direkt loslegen; die Live-App verbindet sich automatisch mit dem Server im WLAN.
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
              Die Live-App verbindet sich im WLAN mit:
            </p>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold break-all">
              http://192.168.178.97:3000
            </div>

            <p className="text-[11px] text-zinc-400 mt-2">
              💡 Die <strong>Lagerliste-Demo.apk</strong> benötigt keine Serververbindung und läuft vollständig autark auf dem Smartphone.
            </p>
          </div>

          <div className="space-y-2">
            <a
              href="/downloads/Lagerliste-Demo.apk"
              download="Lagerliste-Demo.apk"
              onClick={() => toast("Download gestartet: Lagerliste-Demo.apk")}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo-APK herunterladen (Offline)</span>
            </a>

            <a
              href="/downloads/Lagerliste.apk"
              download="Lagerliste.apk"
              onClick={handleDownloadClick}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Live-APK herunterladen (WLAN)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

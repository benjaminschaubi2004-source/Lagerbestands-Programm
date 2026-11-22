"use client";

import React, { useState, useTransition } from "react";
import { MaterialWithVarianten, getMaterialien, BuchungInfo, getBuchungen } from "@/actions/materialien";
import { GroesseWithCount, getGroessen } from "@/actions/groessen";
import { UserInfo, getUsers } from "@/actions/users";
import { ActivityLogItem, getActivityLogs } from "@/actions/logs";
import { LagerStatistikData, getLagerStatistik } from "@/actions/statistik";
import { AutoItem, getAutos } from "@/actions/autos";
import type { SessionUser } from "@/actions/auth";
import { TechnikerFinder } from "./TechnikerFinder";
import { MaterialienTable } from "./MaterialienTable";
import { GroessenManager } from "./GroessenManager";
import { UserManager } from "./UserManager";
import { ActivityLogView } from "./ActivityLogView";
import { StatistikView } from "./StatistikView";
import { AutosView } from "./AutosView";
import { UserHeaderBadge } from "./UserHeaderBadge";
import { AndroidAppView } from "./AndroidAppView";
import { ToastProvider } from "./Toast";
import Link from "next/link";
import {
  Boxes,
  Ruler,
  Package,
  RefreshCw,
  Wrench,
  ArrowLeft,
  ShieldCheck,
  Users,
  History,
  Smartphone,
  Download,
  BarChart3,
  Car,
} from "lucide-react";

interface DashboardProps {
  initialMaterialien: MaterialWithVarianten[];
  initialGroessen: GroesseWithCount[];
  initialUsers: UserInfo[];
  initialLogs: ActivityLogItem[];
  initialStatistik?: LagerStatistikData | null;
  initialAutos?: AutoItem[];
  currentUser?: SessionUser | null;
  isAdmin?: boolean;
}

export function Dashboard({
  initialMaterialien,
  initialGroessen,
  initialUsers,
  initialLogs,
  initialStatistik,
  initialAutos,
  currentUser,
  isAdmin = true,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "materialien" | "statistik" | "autos" | "groessen" | "users" | "logs" | "techniker" | "apk"
  >("materialien");

  const [materialien, setMaterialien] = useState<MaterialWithVarianten[]>(initialMaterialien);
  const [groessen, setGroessen] = useState<GroesseWithCount[]>(initialGroessen);
  const [users, setUsers] = useState<UserInfo[]>(initialUsers);
  const [logs, setLogs] = useState<ActivityLogItem[]>(initialLogs);
  const [statistik, setStatistik] = useState<LagerStatistikData | null>(initialStatistik || null);
  const [autos, setAutos] = useState<AutoItem[]>(initialAutos || []);
  const [buchungen, setBuchungen] = useState<BuchungInfo[]>([]);
  const [isPending, startTransition] = useTransition();

  const reloadData = () => {
    startTransition(async () => {
      try {
        const [mats, grs, buchs, usrs, lgs, stat, freshAutos] = await Promise.all([
          getMaterialien(),
          getGroessen(),
          getBuchungen(30),
          getUsers(),
          getActivityLogs({ limit: 150 }),
          getLagerStatistik(),
          getAutos(),
        ]);
        setMaterialien(mats);
        setGroessen(grs);
        setBuchungen(buchs);
        setUsers(usrs);
        setLogs(lgs);
        setStatistik(stat);
        setAutos(freshAutos);
      } catch (err) {
        console.error("Fehler beim Aktualisieren der Daten:", err);
      }
    });
  };

  React.useEffect(() => {
    getBuchungen(30).then(setBuchungen).catch(() => {});
    if (!initialStatistik) {
      getLagerStatistik().then(setStatistik).catch(() => {});
    }
    if (!initialAutos) {
      getAutos().then(setAutos).catch(() => {});
    }
  }, [initialStatistik, initialAutos]);

  const totalVarianten = materialien.reduce((acc, m) => acc + m.varianten.length, 0);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                      Lagerliste Admin
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800">
                      Vollzugriff
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Stammdaten, Benutzerverwaltung & Daten-Log</p>
                </div>
              </div>

              {/* Actions, User Badge & Role Switcher */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={reloadData}
                  disabled={isPending}
                  className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Alle Daten aktualisieren"
                >
                  <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-violet-600" : ""}`} />
                </button>

                {/* Android APK Download Button */}
                <a
                  href="/downloads/Lagerliste.apk"
                  download="Lagerliste.apk"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Lagerliste Android APK herunterladen"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Android APK</span>
                  <Download className="w-3.5 h-3.5" />
                </a>

                {/* Angemeldeter Benutzer Badge mit Logout */}
                <UserHeaderBadge currentUser={currentUser} targetRoleHint="ADMIN" />

                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rolle wechseln</span>
                </Link>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-1 -mb-px overflow-x-auto">
              {/* 1. Tab: Materialien */}
              <button
                onClick={() => setActiveTab("materialien")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "materialien"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Lagerliste (Materialien & Varianten)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  {materialien.length} ({totalVarianten})
                </span>
              </button>

              {/* 2. Tab: Statistik (NEU) */}
              <button
                onClick={() => setActiveTab("statistik")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "statistik"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Bestands- & Umschlagstatistik</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  Neu
                </span>
              </button>

              {/* 3. Tab: Auto's (Fuhrpark) */}
              <button
                onClick={() => setActiveTab("autos")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "autos"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Car className="w-4 h-4 text-blue-500" />
                <span>Auto&apos;s (Fuhrpark)</span>
                {autos.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                    {autos.length}
                  </span>
                )}
              </button>

              {/* 3. Tab: Größen */}
              <button
                onClick={() => setActiveTab("groessen")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "groessen"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span>Variantenstamm (Größen)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  {groessen.length}
                </span>
              </button>

              {/* 3. Tab: Benutzerverwaltung (NEU) */}
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "users"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Benutzerverwaltung</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold">
                  {users.length}
                </span>
              </button>

              {/* 4. Tab: Daten-Log (NEU) */}
              <button
                onClick={() => setActiveTab("logs")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "logs"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Daten- & Bewegungs-Log</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  {logs.length}
                </span>
              </button>

              {/* 5. Tab: Techniker-Vorschau */}
              <button
                onClick={() => setActiveTab("techniker")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "techniker"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Techniker-Vorschau</span>
              </button>

              {/* 6. Tab: Android App Download (NEU) */}
              <button
                onClick={() => setActiveTab("apk")}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer shrink-0 ${
                  activeTab === "apk"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <span>Android App (APK)</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  Download
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "materialien" ? (
            <MaterialienTable
              initialMaterialien={materialien}
              groessen={groessen}
              onChanged={reloadData}
              onOpenGroessenTab={() => setActiveTab("groessen")}
            />
          ) : activeTab === "statistik" ? (
            statistik ? (
              <StatistikView initialData={statistik} userRole="ADMIN" />
            ) : (
              <div className="p-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                <p>Lade Bestands- und Bewegungsstatistiken...</p>
              </div>
            )
          ) : activeTab === "autos" ? (
            <AutosView initialAutos={autos} />
          ) : activeTab === "groessen" ? (
            <GroessenManager initialGroessen={groessen} onChanged={reloadData} />
          ) : activeTab === "users" ? (
            <UserManager initialUsers={users} onChanged={reloadData} />
          ) : activeTab === "logs" ? (
            <ActivityLogView initialLogs={logs} onLogsCleared={reloadData} />
          ) : activeTab === "apk" ? (
            <AndroidAppView />
          ) : (
            <TechnikerFinder
              materialien={materialien}
              groessen={groessen}
              buchungen={buchungen}
              onDataChanged={reloadData}
              isAdmin={isAdmin}
            />
          )}
        </main>
      </div>
    </ToastProvider>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import {
  MaterialWithVarianten,
  BuchungInfo,
  getMaterialien,
  getBuchungen,
} from "@/actions/materialien";
import { GroesseWithCount, getGroessen } from "@/actions/groessen";
import { AutoItem, getAutos } from "@/actions/autos";
import type { SessionUser } from "@/actions/auth";
import { TechnikerFinder } from "./TechnikerFinder";
import { ToastProvider } from "./Toast";
import { UserHeaderBadge } from "./UserHeaderBadge";
import Link from "next/link";
import { Wrench, ArrowLeft, RefreshCw } from "lucide-react";

interface TechnikerClientPageProps {
  initialMaterialien: MaterialWithVarianten[];
  initialGroessen: GroesseWithCount[];
  initialBuchungen: BuchungInfo[];
  initialAutos?: AutoItem[];
  currentUser?: SessionUser | null;
  isLocked?: boolean;
}

export function TechnikerClientPage({
  initialMaterialien,
  initialGroessen,
  initialBuchungen,
  initialAutos = [],
  currentUser,
  isLocked = false,
}: TechnikerClientPageProps) {
  const [materialien, setMaterialien] = useState(initialMaterialien);
  const [groessen, setGroessen] = useState(initialGroessen);
  const [buchungen, setBuchungen] = useState<BuchungInfo[]>(initialBuchungen);
  const [autos, setAutos] = useState<AutoItem[]>(initialAutos);
  const [isPending, startTransition] = useTransition();

  const reloadData = () => {
    startTransition(async () => {
      try {
        const [mats, grs, buchs, freshAutos] = await Promise.all([
          getMaterialien(),
          getGroessen(),
          getBuchungen(30),
          getAutos(),
        ]);
        setMaterialien(mats);
        setGroessen(grs);
        setBuchungen(buchs);
        setAutos(freshAutos);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      }
    });
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shadow-xs">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight">Monteur-Assistent</h1>
                <p className="text-[11px] text-zinc-500">Material & Variante wählen</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reloadData}
                disabled={isPending}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Aktualisieren"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-indigo-600" : ""}`} />
              </button>

              <UserHeaderBadge currentUser={currentUser} targetRoleHint="TECHNIKER" />

              {!isLocked && (
                <Link
                  href="/"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
                  title="Rolle wechseln"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rolle</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6">
          <TechnikerFinder
            materialien={materialien}
            groessen={groessen}
            buchungen={buchungen}
            autos={autos}
            currentMonteurName={currentUser?.username}
            onDataChanged={reloadData}
            isStandaloneMobile={true}
          />
        </main>
      </div>
    </ToastProvider>
  );
}

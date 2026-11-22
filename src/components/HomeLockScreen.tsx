"use client";

import React, { useState } from "react";
import { loginUser, logoutUser } from "@/actions/auth";
import type { SessionUser } from "@/actions/auth";
import {
  Lock,
  LogIn,
  KeyRound,
  AtSign,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Building2,
  Boxes,
  ArrowRight,
  LogOut,
  Laptop,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "./Toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HomeLockScreenProps {
  currentUser: SessionUser | null;
  isLocalhost: boolean;
  redirectTarget?: string;
  authRequired?: boolean;
  accessDenied?: boolean;
  materialienCount: number;
  totalVarianten: number;
  criticalCount: number;
}

export function HomeLockScreen({
  currentUser,
  isLocalhost,
  redirectTarget,
  authRequired,
  accessDenied,
  materialienCount,
  totalVarianten,
  criticalCount,
}: HomeLockScreenProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Schnellauswahl der Test-Accounts
  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  // Login-Handler mit automatischer Weiterleitung in die jeweilige User-Kategorie
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Bitte gib Benutzername und Passwort ein.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginUser(username, password);
    setIsSubmitting(false);

    if (res.success && res.user) {
      toast(`Erfolgreich angemeldet als ${res.user.name}`);

      // Falls ein Ziel per Redirect gewünscht war und die Rolle passt
      if (redirectTarget) {
        const role = res.user.role;
        const isTargetAllowed =
          role === "ADMIN" ||
          (redirectTarget.startsWith("/techniker") && role === "TECHNIKER") ||
          (redirectTarget.startsWith("/office") && role === "OFFICE");

        if (isTargetAllowed) {
          router.push(redirectTarget);
          router.refresh();
          return;
        }
      }

      // Automatische Weiterleitung in die jeweilige Benutzer-Kategorie
      if (res.user.role === "ADMIN") {
        router.push("/admin");
      } else if (res.user.role === "OFFICE") {
        router.push("/office");
      } else {
        router.push("/techniker");
      }
      router.refresh();
    } else {
      setErrorMessage(res.error || "Ungültiger Benutzername oder Passwort.");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    setIsLoggingOut(false);
    toast("Erfolgreich abgemeldet.");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Lagerliste
              </span>
              <p className="text-xs text-zinc-500">Lagerverwaltung & Bestandsführung</p>
            </div>
          </div>

          {/* Status & Localhost Indicator */}
          <div className="flex items-center gap-3 text-xs">
            {isLocalhost ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Modus:</span> Localhost
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                LAN-Zugriff (Geschützt)
              </span>
            )}

            {currentUser && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Abmelden"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* FALL 1: BEREITS ANGEMELDET */}
        {currentUser ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in duration-200">
            {/* Header / Begrüßung */}
            <div className="text-center space-y-3">
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  currentUser.role === "ADMIN"
                    ? "bg-violet-600 shadow-violet-600/30"
                    : currentUser.role === "OFFICE"
                    ? "bg-blue-600 shadow-blue-600/30"
                    : "bg-indigo-600 shadow-indigo-600/30"
                }`}
              >
                {currentUser.role === "ADMIN" ? (
                  <ShieldCheck className="w-9 h-9" />
                ) : currentUser.role === "OFFICE" ? (
                  <Building2 className="w-9 h-9" />
                ) : (
                  <Wrench className="w-9 h-9" />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Willkommen zurück, {currentUser.name}!
              </h1>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  @{currentUser.username}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    currentUser.role === "ADMIN"
                      ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800"
                      : currentUser.role === "OFFICE"
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                  }`}
                >
                  Rolle: {currentUser.role}
                </span>
              </div>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Du bist erfolgreich authentifiziert und kannst direkt in deinen Arbeitsbereich wechseln.
              </p>
            </div>

            {/* Aktionen basierend auf der Rolle */}
            {currentUser.role === "ADMIN" ? (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">
                  Als Administrator hast du Zugriff auf alle Bereiche:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link
                    href="/admin"
                    className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border-2 border-violet-300 dark:border-violet-800 hover:border-violet-600 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                        Admin-Dashboard
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Materialien, Benutzerverwaltung & Audit-Logs
                      </p>
                    </div>
                    <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-violet-700 dark:text-violet-300 group-hover:translate-x-1 transition-transform">
                      <span>Öffnen</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>

                  <Link
                    href="/techniker"
                    className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800 hover:border-indigo-600 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                        Techniker-Portal
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Werkstatt-Ansicht, Entnahme & Einlagerung
                      </p>
                    </div>
                    <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 group-hover:translate-x-1 transition-transform">
                      <span>Öffnen</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>

                  <Link
                    href="/office"
                    className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800 hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                        Office (Read-Only)
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Bestands- und Artikelübersicht fürs Büro
                      </p>
                    </div>
                    <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300 group-hover:translate-x-1 transition-transform">
                      <span>Öffnen</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </div>
              </div>
            ) : currentUser.role === "OFFICE" ? (
              <div className="max-w-md mx-auto w-full text-center space-y-4">
                <Link
                  href="/office"
                  className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all group"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Weiter zur Office-Übersicht</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <div className="max-w-md mx-auto w-full text-center space-y-4">
                <Link
                  href="/techniker"
                  className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all group"
                >
                  <Wrench className="w-5 h-5" />
                  <span>Weiter zum Techniker-Assistenten</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}

            {/* Logout Option */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Von Benutzerkonto @{currentUser.username} abmelden</span>
              </button>
            </div>
          </div>
        ) : (
          /* FALL 2: NICHT ANGEMELDET -> LOCK-IN SCREEN */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Sperrhinweis / Warning bei URL-Weiterleitung */}
            {authRequired && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
                <div className="p-2 rounded-xl bg-amber-200/80 dark:bg-amber-800 text-amber-800 dark:text-amber-100 shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Anmeldung erforderlich</h4>
                  <p className="text-xs mt-0.5 text-amber-800 dark:text-amber-300 leading-relaxed">
                    Der direkte Zugriff auf{" "}
                    <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      {redirectTarget || "diesen Bereich"}
                    </code>{" "}
                    ist nur für angemeldete Benutzer gestattet. Bitte melde dich an, um fortzufahren.
                  </p>
                </div>
              </div>
            )}

            {accessDenied && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/70 border-2 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-sm">
                <div className="p-2 rounded-xl bg-red-200/80 dark:bg-red-800 text-red-800 dark:text-red-100 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Keine Berechtigung</h4>
                  <p className="text-xs mt-0.5 text-red-800 dark:text-red-300 leading-relaxed">
                    Dein Benutzerkonto verfügt nicht über die erforderliche Rolle für den gewünschten Bereich. Bitte melde dich mit entsprechenden Rechten an.
                  </p>
                </div>
              </div>
            )}

            {/* Das Haupt-Anmeldefenster */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Lock className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Lagerliste Anmeldung
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
                  Melde dich mit deinen Zugangsdaten an. Du wirst automatisch in deine Benutzerkategorie weitergeleitet.
                </p>
              </div>

              {/* Fehlermeldung */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Login-Formular */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Benutzername (Login-Name)
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="z. B. techniker, office oder admin"
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Passwort
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Passwort eingeben"
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Anmelden & Arbeitsbereich öffnen</span>
                    </>
                  )}
                </button>
              </form>

              {/* Schnellauswahl der Standard-Konten */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 text-center">
                  Schnell-Login für Test-Accounts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill("techniker", "techniker123")}
                    className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-indigo-700 dark:text-indigo-300">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Techniker</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      techniker / techniker123
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill("office", "office123")}
                    className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-300">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Office</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      office / office123
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill("admin", "admin123")}
                    className="p-2.5 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/60 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-violet-700 dark:text-violet-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      admin / admin123
                    </span>
                  </button>
                </div>
              </div>

              {/* LOCALHOST DEVELOPER BYPASS (Wird NUR auf localhost angezeigt, niemals im LAN) */}
              {isLocalhost && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                      Entwickler-Schnellzugriff (Nur auf Localhost aktiv):
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Bypass aktiv
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Da du dich auf <code>localhost</code> befindest, kannst du die Bereiche auch direkt ohne Login aufrufen:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href="/techniker"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:border-indigo-500 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5"
                    >
                      <Wrench className="w-3 h-3 text-indigo-500" />
                      <span>/techniker</span>
                    </Link>
                    <Link
                      href="/office"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:border-blue-500 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5"
                    >
                      <Building2 className="w-3 h-3 text-blue-500" />
                      <span>/office</span>
                    </Link>
                    <Link
                      href="/admin"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:border-violet-500 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3 h-3 text-violet-500" />
                      <span>/admin</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Info bar */}
        <div className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-around gap-4 text-center">
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Materialstämme</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {materialienCount}
            </span>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:border-zinc-800 hidden sm:block" />
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Gesamtvarianten</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {totalVarianten}
            </span>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:border-zinc-800 hidden sm:block" />
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Lagerstatus</span>
            <span
              className={`text-lg font-bold ${
                criticalCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {criticalCount > 0 ? `${criticalCount} unter Minimum` : "Optimal"}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 px-4 text-center text-xs text-zinc-400">
        Lagerliste – Geschützte Lagerverwaltung mit rollenbasierter Authentifizierung & Aktivitäts-Audit
      </footer>
    </div>
  );
}

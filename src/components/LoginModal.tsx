"use client";

import React, { useState } from "react";
import { loginUser } from "@/actions/auth";
import type { SessionUser } from "@/actions/auth";
import { LogIn, KeyRound, AtSign, Eye, EyeOff, AlertTriangle, ShieldCheck, Wrench, Building2, X } from "lucide-react";
import { useToast } from "./Toast";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  targetRoleHint?: "TECHNIKER" | "OFFICE" | "ADMIN";
  onLoggedIn?: (user: SessionUser) => void;
}

export function LoginModal({
  isOpen,
  onClose,
  targetRoleHint,
  onLoggedIn,
}: LoginModalProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
      toast(`Willkommen zurück, ${res.user.name}!`);
      if (onLoggedIn) {
        onLoggedIn(res.user);
      }
      if (onClose) {
        onClose();
      }

      // Weiterleitung nach Rolle, falls passend
      if (res.user.role === "ADMIN") {
        router.push("/admin");
      } else if (res.user.role === "OFFICE") {
        router.push("/office");
      } else {
        router.push("/techniker");
      }
      router.refresh();
    } else {
      setErrorMessage(res.error || "Ungültige Anmeldedaten.");
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Lagerliste Anmeldung
              </h3>
              <p className="text-xs text-zinc-500">
                {targetRoleHint
                  ? `Zugang für Bereich: ${targetRoleHint}`
                  : "Melde dich mit deinem Benutzerkonto an"}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs sm:text-sm text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-zinc-400" />
              Anmeldename (Benutzername)
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="z.B. admin, techniker oder office"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Dein Passwort..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-11 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-1"
                title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? "Wird angemeldet..." : "Jetzt anmelden"}</span>
          </button>

          {/* Schnellauswahl / Standardkonten für einfaches Testen */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-2 text-center">
              Schnellauswahl für Testkonten:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => handleQuickFill("techniker", "techniker123")}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                <Wrench className="w-3 h-3 text-indigo-600 inline mr-1" />
                Techniker
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("office", "office123")}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                <Building2 className="w-3 h-3 text-blue-600 inline mr-1" />
                Office
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin", "admin123")}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3 text-violet-600 inline mr-1" />
                Admin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

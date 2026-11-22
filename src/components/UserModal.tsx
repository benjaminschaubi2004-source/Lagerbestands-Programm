"use client";

import React, { useState, useEffect } from "react";
import { UserInfo, createUser, updateUser } from "@/actions/users";
import type { UserRole } from "@/actions/auth";
import {
  X,
  User,
  ShieldCheck,
  Building2,
  Wrench,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  AtSign,
} from "lucide-react";
import { useToast } from "./Toast";

interface UserModalProps {
  isOpen: boolean;
  userToEdit?: UserInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

export function UserModal({
  isOpen,
  userToEdit,
  onClose,
  onSaved,
}: UserModalProps) {
  const { toast } = useToast();
  const isEditing = Boolean(userToEdit);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("TECHNIKER");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pop-Up Überprüfung für Admin-Rolle
  const [showAdminConfirmPopup, setShowAdminConfirmPopup] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (userToEdit) {
      setUsername(userToEdit.username);
      setName(userToEdit.name);
      setPassword("");
      setRole(userToEdit.role);
    } else {
      setUsername("");
      setName("");
      setPassword("");
      setRole("TECHNIKER");
    }
    setShowPassword(false);
    setErrorMessage(null);
    setShowAdminConfirmPopup(false);
    setPendingRole(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  // Wenn der Nutzer auf eine Rolle klickt
  const handleSelectRole = (newRole: UserRole) => {
    // Wenn Admin ausgewählt wird und der Nutzer aktuell noch nicht Admin ist:
    // Pop-Up Bestätigung anzeigen!
    if (newRole === "ADMIN" && role !== "ADMIN") {
      setPendingRole("ADMIN");
      setShowAdminConfirmPopup(true);
    } else {
      setRole(newRole);
    }
  };

  // Bestätigung im Admin-Pop-Up
  const handleConfirmAdminRole = () => {
    setRole("ADMIN");
    setShowAdminConfirmPopup(false);
    setPendingRole(null);
  };

  const handleCancelAdminRole = () => {
    setShowAdminConfirmPopup(false);
    setPendingRole(null);
    // Rolle bleibt bei der bisherigen Auswahl
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const uName = username.trim().toLowerCase();
    const displayName = name.trim();
    const pwd = password.trim();

    if (!uName) {
      setErrorMessage("Bitte gib einen Anmeldenamen (Benutzername) ein.");
      return;
    }
    if (!displayName) {
      setErrorMessage("Bitte gib den vollständigen Namen des Benutzers ein.");
      return;
    }

    if (!isEditing && (!pwd || pwd.length < 4)) {
      setErrorMessage("Das Passwort muss mindestens 4 Zeichen lang sein.");
      return;
    }

    if (isEditing && pwd && pwd.length < 4) {
      setErrorMessage("Das neue Passwort muss mindestens 4 Zeichen lang sein.");
      return;
    }

    setIsSubmitting(true);
    let res;

    if (isEditing && userToEdit) {
      res = await updateUser(userToEdit.id, {
        username: uName,
        name: displayName,
        password: pwd ? pwd : undefined,
        role,
      });
    } else {
      res = await createUser({
        username: uName,
        name: displayName,
        password: pwd,
        role,
      });
    }

    setIsSubmitting(false);

    if (res.success) {
      toast(
        isEditing
          ? `Benutzer "${displayName}" wurde erfolgreich aktualisiert.`
          : `Benutzer "${displayName}" erfolgreich angelegt.`
      );
      onSaved();
      onClose();
    } else {
      setErrorMessage(res.error || "Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {isEditing ? "Benutzer bearbeiten" : "Neuen Benutzer anlegen"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {isEditing ? `Bearbeitung von @${userToEdit?.username}` : "Zugangsdaten & Rolle konfigurieren"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formular */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {errorMessage && (
              <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Rolle / Kategorie Auswahl */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                1. Benutzer-Kategorie / Rolle *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Techniker */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("TECHNIKER")}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === "TECHNIKER"
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold block">Monteur</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Werkstatt & Montage
                  </span>
                </button>

                {/* Office */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("OFFICE")}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === "OFFICE"
                      ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/30 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold block">Office</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Büro / Read-Only
                  </span>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("ADMIN")}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === "ADMIN"
                      ? "border-violet-600 bg-violet-50/70 dark:bg-violet-950/50 text-violet-950 dark:text-violet-200 ring-2 ring-violet-500/30 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-violet-300 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold block">Admin</span>
                    <span className="text-[10px] bg-violet-200 dark:bg-violet-900 text-violet-800 dark:text-violet-200 px-1 rounded font-bold">
                      Voll
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Leitung & Log
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Anmeldename (Benutzername) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-zinc-400" />
                Anmeldename (Login-Name) *
              </label>
              <input
                type="text"
                required
                placeholder="z.B. max_mustermann oder monteur1"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono font-medium"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Kleinbuchstaben, Ziffern und Bindestrich/Unterstrich. Wird für den Login verwendet.
              </span>
            </div>

            {/* 3. Vollständiger Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Vollständiger Name / Anzeigename *
              </label>
              <input
                type="text"
                required
                placeholder="z.B. Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-medium"
              />
            </div>

            {/* 4. Passwort */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                {isEditing ? "Neues Passwort (optional leer lassen)" : "Passwort *"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={!isEditing}
                  placeholder={isEditing ? "Unverändert lassen..." : "Mindestens 4 Zeichen..."}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-11 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-medium"
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
              {isEditing && (
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Lasse das Feld leer, wenn das bisherige Passwort beibehalten werden soll.
                </span>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-md flex items-center gap-2"
              >
                {isSubmitting ? "Wird gespeichert..." : isEditing ? "Änderungen speichern" : "Benutzer anlegen"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SICHERHEITS-POP-UP: WIRD SICHTBAR WENN ADMIN AUSGEWÄHLT WIRD */}
      {showAdminConfirmPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-violet-500 dark:border-violet-600 p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Sicherheitsabfrage
                </span>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  Admin-Rechte wirklich zuweisen?
                </h3>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <p className="font-semibold mb-1">
                Achtung: Du bist dabei, diesem Benutzer die Rolle <strong>ADMIN</strong> zuzuweisen!
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
                <li>Vollständiger Zugriff auf alle Stammdaten & Größen</li>
                <li>Benutzer anlegen, bearbeiten und löschen</li>
                <li>Einsicht in alle System- und Benutzer-Logs</li>
              </ul>
              <p className="mt-2 font-medium">
                Möchtest du diese Änderung wirklich tätigen?
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelAdminRole}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmAdminRole}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Ja, Admin-Rechte zuweisen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

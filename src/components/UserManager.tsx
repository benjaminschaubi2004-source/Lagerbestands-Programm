"use client";

import React, { useState, useMemo } from "react";
import { UserInfo, deleteUser } from "@/actions/users";
import type { UserRole } from "@/actions/auth";
import {
  User,
  UserPlus,
  ShieldCheck,
  Building2,
  Wrench,
  Search,
  Edit2,
  Trash2,
  Users,
  KeyRound,
  Clock,
  AtSign,
} from "lucide-react";
import { useToast } from "./Toast";
import { UserModal } from "./UserModal";
import { ConfirmModal } from "./ConfirmModal";

interface UserManagerProps {
  initialUsers: UserInfo[];
  onChanged: () => void;
}

export function UserManager({ initialUsers, onChanged }: UserManagerProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"ALL" | UserRole>("ALL");

  // User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);

  // Löschen State
  const [deletingUser, setDeletingUser] = useState<UserInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Zähler für die Kategorien
  const countTechniker = useMemo(() => {
    return initialUsers.filter((u) => u.role === "TECHNIKER").length;
  }, [initialUsers]);

  const countOffice = useMemo(() => {
    return initialUsers.filter((u) => u.role === "OFFICE").length;
  }, [initialUsers]);

  const countAdmin = useMemo(() => {
    return initialUsers.filter((u) => u.role === "ADMIN").length;
  }, [initialUsers]);

  // Gefilterte Benutzerliste
  const filteredUsers = useMemo(() => {
    return initialUsers.filter((u) => {
      // 1. Rollen-Filter
      if (selectedRoleFilter !== "ALL" && u.role !== selectedRoleFilter) {
        return false;
      }
      // 2. Suchbegriff
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchUsername = u.username.toLowerCase().includes(term);
        const matchName = u.name.toLowerCase().includes(term);
        return matchUsername || matchName;
      }
      return true;
    });
  }, [initialUsers, selectedRoleFilter, searchTerm]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserInfo) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    const res = await deleteUser(deletingUser.id);
    setIsDeleting(false);

    if (res.success) {
      toast(`Benutzer "${deletingUser.name}" (@${deletingUser.username}) wurde gelöscht.`);
      setDeletingUser(null);
      onChanged();
    } else {
      toast(res.error || "Fehler beim Löschen des Benutzers", "error");
    }
  };

  const formatDatum = (d: Date) => {
    const date = new Date(d);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. Kopfbereich mit Übersicht & Neuer Benutzer Button */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Benutzer- & Rollenverwaltung
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Verwalte Zugangsdaten und Rollen für Werkstatt (Techniker), Büro (Office) und Lagerleitung (Admin).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Neuen Benutzer anlegen</span>
        </button>
      </div>

      {/* 2. Rollen-Kategorie-Filter & Suche */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        {/* Filter-Karten für die 3 Kategorien */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Alle */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("ALL")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "ALL"
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/60 font-bold text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="text-xs sm:text-sm">Alle Rollen</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-zinc-100 dark:bg-zinc-800">
              {initialUsers.length}
            </span>
          </button>

          {/* 1. Techniker */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("TECHNIKER")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "TECHNIKER"
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

          {/* 2. Office */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("OFFICE")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "OFFICE"
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

          {/* 3. Admin */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("ADMIN")}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "ADMIN"
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
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Benutzer filtern (nach Name oder @anmeldename)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* 3. Benutzer-Tabelle */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="py-12 px-4 text-center text-zinc-500">
            <User className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="font-semibold text-sm">Keine Benutzer gefunden</p>
            <p className="text-xs text-zinc-400 mt-1">
              {searchTerm ? "Versuche einen anderen Suchbegriff." : "Lege einen neuen Benutzer an."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-zinc-50/75 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-4 sm:px-6">Benutzer</th>
                  <th className="py-3 px-4">Anmeldename</th>
                  <th className="py-3 px-4">Kategorie / Rolle</th>
                  <th className="py-3 px-4 hidden md:table-cell">Erstellt am</th>
                  <th className="py-3 px-4 sm:px-6 text-right w-24">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredUsers.map((user) => {
                  const isTechniker = user.role === "TECHNIKER";
                  const isOffice = user.role === "OFFICE";
                  const isAdmin = user.role === "ADMIN";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                              isAdmin
                                ? "bg-violet-600 text-white"
                                : isOffice
                                ? "bg-blue-600 text-white"
                                : "bg-indigo-600 text-white"
                            }`}
                          >
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-sm">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-zinc-400 md:hidden">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Anmeldename */}
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                          @{user.username}
                        </span>
                      </td>

                      {/* Kategorie / Rolle Badge */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Admin
                          </span>
                        ) : isOffice ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Building2 className="w-3.5 h-3.5" />
                            Office
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Wrench className="w-3.5 h-3.5" />
                            Techniker
                          </span>
                        )}
                      </td>

                      {/* Erstellungsdatum */}
                      <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{formatDatum(user.createdAt)}</span>
                        </div>
                      </td>

                      {/* Aktionen */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Benutzer bearbeiten"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Benutzer löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Benutzer anlegen / bearbeiten */}
      <UserModal
        isOpen={isModalOpen}
        userToEdit={editingUser}
        onClose={() => setIsModalOpen(false)}
        onSaved={onChanged}
      />

      {/* Bestätigungsdialog: Benutzer löschen */}
      <ConfirmModal
        isOpen={deletingUser !== null}
        title="Benutzer löschen"
        message={`Möchtest du den Benutzer "${deletingUser?.name}" (@${deletingUser?.username}, Rolle: ${deletingUser?.role}) wirklich unwiderruflich löschen?`}
        confirmText="Benutzer löschen"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}

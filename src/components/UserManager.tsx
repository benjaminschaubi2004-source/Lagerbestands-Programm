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
  Clock,
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
    <div className="space-y-3 sm:space-y-5">
      {/* 1. Kopfbereich mit Übersicht & Neuer Benutzer Button */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Benutzerverwaltung
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Werkstatt (Monteur), Büro (Office) und Leitung (Admin).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Neuer Benutzer</span>
        </button>
      </div>

      {/* 2. Rollen-Kategorie-Filter & Suche */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-4 shadow-xs space-y-2 sm:space-y-3">
        {/* Filter-Karten für die 3 Kategorien */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {/* Alle */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("ALL")}
            className={`p-2 sm:p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "ALL"
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/60 font-bold text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[11px] sm:text-xs">Alle</span>
            </div>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold bg-zinc-100 dark:bg-zinc-800">
              {initialUsers.length}
            </span>
          </button>

          {/* 1. Techniker */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("TECHNIKER")}
            className={`p-2 sm:p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "TECHNIKER"
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[11px] sm:text-xs">Monteur</span>
            </div>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {countTechniker}
            </span>
          </button>

          {/* 2. Office */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("OFFICE")}
            className={`p-2 sm:p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "OFFICE"
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-[11px] sm:text-xs">Office</span>
            </div>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {countOffice}
            </span>
          </button>

          {/* 3. Admin */}
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("ADMIN")}
            className={`p-2 sm:p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
              selectedRoleFilter === "ADMIN"
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/60 font-bold text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/40"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-[11px] sm:text-xs">Admin</span>
            </div>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
              {countAdmin}
            </span>
          </button>
        </div>

        {/* Suchfeld */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Benutzer filtern (Name oder @anmeldename)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* 3. Benutzer-Liste (Kompakt auf Mobile & Tabelle auf Desktop) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="py-10 px-4 text-center text-zinc-500">
            <User className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-1.5" />
            <p className="font-semibold text-xs">Keine Benutzer gefunden</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {searchTerm ? "Versuche einen anderen Suchbegriff." : "Lege einen neuen Benutzer an."}
            </p>
          </div>
        ) : (
          <>
            {/* A) Mobile Kompakt-Ansicht (sm:hidden) */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 sm:hidden">
              {filteredUsers.map((user) => {
                const isTechniker = user.role === "TECHNIKER";
                const isOffice = user.role === "OFFICE";
                const isAdmin = user.role === "ADMIN";

                return (
                  <div
                    key={user.id}
                    className="p-2.5 flex items-center justify-between gap-2.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Links: Avatar & Infos */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                          isAdmin
                            ? "bg-violet-600 text-white"
                            : isOffice
                            ? "bg-blue-600 text-white"
                            : "bg-indigo-600 text-white"
                        }`}
                      >
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {user.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                            @{user.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Admin
                            </span>
                          ) : isOffice ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Building2 className="w-2.5 h-2.5" />
                              Office
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Wrench className="w-2.5 h-2.5" />
                              Monteur
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400">
                            {formatDatum(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rechts: Aktionen */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* B) Desktop / Tablet Tabellen-Ansicht (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50/75 dark:bg-zinc-800/50 text-zinc-500 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2.5 px-4">Benutzer</th>
                    <th className="py-2.5 px-3">Anmeldename</th>
                    <th className="py-2.5 px-3">Rolle</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Erstellt am</th>
                    <th className="py-2.5 px-4 text-right w-20">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                                isAdmin
                                  ? "bg-violet-600 text-white"
                                  : isOffice
                                  ? "bg-blue-600 text-white"
                                  : "bg-indigo-600 text-white"
                              }`}
                            >
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">
                              {user.name}
                            </span>
                          </div>
                        </td>

                        {/* Anmeldename */}
                        <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                            @{user.username}
                          </span>
                        </td>

                        {/* Rolle Badge */}
                        <td className="py-2.5 px-3">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          ) : isOffice ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Building2 className="w-3 h-3" />
                              Office
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Wrench className="w-3 h-3" />
                              Monteur
                            </span>
                          )}
                        </td>

                        {/* Erstellungsdatum */}
                        <td className="py-2.5 px-3 text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{formatDatum(user.createdAt)}</span>
                          </div>
                        </td>

                        {/* Aktionen */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                              title="Benutzer bearbeiten"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                              title="Benutzer löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
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

"use client";

import React, { useState } from "react";
import { GroesseWithCount, createGroesse, updateGroesse, deleteGroesse } from "@/actions/groessen";
import { Plus, Edit2, Trash2, Check, X, Ruler, AlertCircle } from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmModal } from "./ConfirmModal";

interface GroessenManagerProps {
  initialGroessen: GroesseWithCount[];
  onChanged: () => void;
}

export function GroessenManager({ initialGroessen, onChanged }: GroessenManagerProps) {
  const { toast } = useToast();
  const [groessen, setGroessen] = useState<GroesseWithCount[]>(initialGroessen);
  const [newGroesseName, setNewGroesseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Lösch-Dialog
  const [deletingGroesse, setDeletingGroesse] = useState<GroesseWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setGroessen(initialGroessen);
  }, [initialGroessen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroesseName.trim()) return;

    setIsCreating(true);
    const res = await createGroesse(newGroesseName);
    setIsCreating(false);

    if (res.success) {
      toast(`Größe "${newGroesseName.trim()}" erfolgreich erstellt.`);
      setNewGroesseName("");
      onChanged();
    } else {
      toast(res.error || "Fehler beim Erstellen", "error");
    }
  };

  const startEdit = (g: GroesseWithCount) => {
    setEditingId(g.id);
    setEditName(g.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setIsSavingEdit(true);
    const res = await updateGroesse(id, editName);
    setIsSavingEdit(false);

    if (res.success) {
      toast(`Größe erfolgreich in "${editName.trim()}" umbenannt.`);
      setEditingId(null);
      onChanged();
    } else {
      toast(res.error || "Fehler beim Aktualisieren", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deletingGroesse) return;
    setIsDeleting(true);
    const res = await deleteGroesse(deletingGroesse.id);
    setIsDeleting(false);

    if (res.success) {
      toast(`Größe "${deletingGroesse.name}" wurde gelöscht.`);
      setDeletingGroesse(null);
      onChanged();
    } else {
      toast(res.error || "Fehler beim Löschen", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Kopfbereich & Neue Größe anlegen */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Größenverwaltung (Stammdaten)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Definiere hier Größen (z.B. Konfektionsgrößen, metrische Maße oder Zollgrößen), die
              deinen Materialien zugeordnet werden können.
            </p>
          </div>

          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="z.B. XXL, M12, 1/2 Zoll..."
              value={newGroesseName}
              onChange={(e) => setNewGroesseName(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
            />
            <button
              type="submit"
              disabled={isCreating || !newGroesseName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? "Speichern..." : "Hinzufügen"}
            </button>
          </form>
        </div>
      </div>

      {/* Liste der Größen */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4">Bezeichnung der Größe</th>
                <th className="py-3 px-4">Verknüpfte Materialien</th>
                <th className="py-3 px-4 text-right w-36">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {groessen.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Noch keine Größen angelegt. Trage oben eine neue Größe ein.
                  </td>
                </tr>
              ) : (
                groessen.map((g) => {
                  const isEditing = editingId === g.id;
                  const variantenCount = g._count?.varianten ?? 0;

                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500">#{g.id}</td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdate(g.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              autoFocus
                              className="px-2.5 py-1 text-sm border border-indigo-400 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleUpdate(g.id)}
                              disabled={isSavingEdit}
                              className="p-1 text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md cursor-pointer"
                              title="Speichern"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md cursor-pointer"
                              title="Abbrechen"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {g.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {variantenCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {variantenCount} {variantenCount === 1 ? "Material-Variante" : "Material-Varianten"}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">Keine Zuordnung</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => startEdit(g)}
                                className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                                title="Größe bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setDeletingGroesse(g)}
                                disabled={variantenCount > 0}
                                className={`p-1.5 rounded-md transition-colors ${
                                  variantenCount > 0
                                    ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                                    : "text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                }`}
                                title={
                                  variantenCount > 0
                                    ? `Kann nicht gelöscht werden (noch ${variantenCount} Material-Varianten verknüpft)`
                                    : "Größe löschen"
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lösch-Bestätigung */}
      <ConfirmModal
        isOpen={deletingGroesse !== null}
        title="Größe löschen"
        message={`Möchtest du die Größe "${deletingGroesse?.name}" wirklich unwiderruflich löschen?`}
        confirmText="Löschen"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingGroesse(null)}
      />
    </div>
  );
}


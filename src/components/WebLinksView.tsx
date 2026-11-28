"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  WebLinkItem,
  getWebLinks,
  deleteWebLink,
  seedSampleLinks,
} from "@/actions/links";
import { WebLinkModal } from "./WebLinkModal";
import { ConfirmModal } from "./ConfirmModal";
import { useToast } from "./Toast";
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  Tag,
  RefreshCw,
  FolderOpen,
  Sparkles,
  Link2,
  FileText,
} from "lucide-react";

interface WebLinksViewProps {
  initialLinks?: WebLinkItem[];
  onLinksChanged?: () => void;
}

export function WebLinksView({ initialLinks = [], onLinksChanged }: WebLinksViewProps) {
  const { toast } = useToast();
  const [links, setLinks] = useState<WebLinkItem[]>(initialLinks);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Modal-Zustände
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<WebLinkItem | null>(null);

  // Lösch-Modal Zustand
  const [deletingLink, setDeletingLink] = useState<WebLinkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Kopier-Feedback Zustand
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Synchronisieren mit Props
  React.useEffect(() => {
    if (initialLinks && initialLinks.length > 0) {
      setLinks(initialLinks);
    }
  }, [initialLinks]);

  // Alle vorhandenen Kategorien ermitteln
  const categories = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => {
      if (l.kategorie && l.kategorie.trim()) {
        set.add(l.kategorie.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
  }, [links]);

  // Daten neu laden
  const handleReload = () => {
    startTransition(async () => {
      try {
        const fresh = await getWebLinks();
        setLinks(fresh);
        toast("Web-Links aktualisiert.");
        if (onLinksChanged) onLinksChanged();
      } catch {
        toast("Fehler beim Aktualisieren der Links.", "error");
      }
    });
  };

  // Gefilterte Links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      // 1. Kategorie-Filter
      if (selectedCategory !== "ALL" && (link.kategorie || "Allgemein") !== selectedCategory) {
        return false;
      }

      // 2. Volltextsuche
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase().trim();
        const fullText = [
          link.titel,
          link.url,
          link.beschreibung || "",
          link.kategorie || "",
        ]
          .join(" ")
          .toLowerCase();

        return fullText.includes(query);
      }

      return true;
    });
  }, [links, selectedCategory, searchTerm]);

  // Link kopieren
  const handleCopy = (link: WebLinkItem) => {
    navigator.clipboard
      .writeText(link.url)
      .then(() => {
        setCopiedId(link.id);
        toast(`URL von "${link.titel}" in die Zwischenablage kopiert.`);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        toast("Kopieren fehlgeschlagen.", "error");
      });
  };

  // Link löschen bestätigen
  const handleConfirmDelete = async () => {
    if (!deletingLink) return;
    setIsDeleting(true);

    try {
      const res = await deleteWebLink(deletingLink.id);
      if (res.success) {
        setLinks((prev) => prev.filter((l) => l.id !== deletingLink.id));
        toast(`Weblink "${deletingLink.titel}" gelöscht.`);
        setDeletingLink(null);
        if (onLinksChanged) onLinksChanged();
      } else {
        toast(res.error || "Fehler beim Löschen.", "error");
      }
    } catch {
      toast("Netzwerkfehler beim Löschen des Links.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Beispiellinks anlegen / zurücksetzen
  const handleSeedDefaults = async () => {
    startTransition(async () => {
      try {
        const res = await seedSampleLinks();
        if (res.success) {
          const fresh = await getWebLinks();
          setLinks(fresh);
          toast(`${res.count} Standard-Weblinks erfolgreich geladen.`);
          if (onLinksChanged) onLinksChanged();
        } else {
          toast("Fehler beim Laden der Standardlinks.", "error");
        }
      } catch {
        toast("Netzwerkfehler beim Laden.", "error");
      }
    });
  };

  // Hostname extrahieren für eine saubere Anzeige
  const getDomainFromUrl = (urlString: string) => {
    try {
      const u = new URL(urlString);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return urlString.replace(/^https?:\/\//, "").split("/")[0];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header-Kopfbereich mit Aktionen */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Wichtige Webseiten & Portale
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  {links.length} {links.length === 1 ? "Link" : "Links"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Zentrale Linksammlung für das Office: Lieferanten, Hersteller, KFZ-Portale & tägliche Tools
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleReload}
            disabled={isPending}
            className="px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Liste aktualisieren"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">Aktualisieren</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Weblink</span>
          </button>
        </div>
      </div>

      {/* Such- & Filterleiste */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Suchfeld */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Webseiten durchsuchen (Name, URL, Notiz, Kategorie)..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                Löschen
              </button>
            )}
          </div>
        </div>

        {/* Kategorie-Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "ALL"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <span>Alle Kategorien</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {links.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = links.filter((l) => (l.kategorie || "Allgemein") === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Tag className="w-3 h-3 opacity-70" />
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Link-Karten / Grid */}
      {filteredLinks.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-10 border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
            <Globe className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {searchTerm || selectedCategory !== "ALL"
                ? "Keine passenden Webseiten gefunden"
                : "Noch keine Webseiten hinterlegt"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {searchTerm || selectedCategory !== "ALL"
                ? "Versuchen Sie andere Suchbegriffe oder setzen Sie den Filter zurück."
                : "Erstellen Sie Ihren ersten Weblink oder laden Sie die praktischen Standard-Vorlagen."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {searchTerm || selectedCategory !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("ALL");
                }}
                className="px-4 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
              >
                Filter zurücksetzen
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLink(null);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ersten Weblink anlegen</span>
                </button>
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Standardlinks einfügen</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => {
            const domain = getDomainFromUrl(link.url);
            const isCopied = copiedId === link.id;

            return (
              <div
                key={link.id}
                className="group bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Icon + Category + Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                      {link.kategorie || "Allgemein"}
                    </span>

                    {/* Quick Edit & Delete Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLink(link);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Weblink bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingLink(link)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Weblink löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Titel & Domain */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {link.titel}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                      <Link2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{domain}</span>
                    </div>
                  </div>

                  {/* Beschreibung / Notizen */}
                  {link.beschreibung && (
                    <div className="mt-3.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {link.beschreibung}
                    </div>
                  )}
                </div>

                {/* Bottom Buttons: Öffnen & URL kopieren */}
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title={`Öffnen: ${link.url}`}
                  >
                    <span>Webseite öffnen</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopy(link)}
                    className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="URL in Zwischenablage kopieren"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Kopieren</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal zum Hinzufügen / Bearbeiten */}
      {isModalOpen && (
        <WebLinkModal
          isOpen={isModalOpen}
          link={editingLink}
          existingCategories={categories}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLink(null);
          }}
          onSaved={(savedLink) => {
            setLinks((prev) => {
              const idx = prev.findIndex((l) => l.id === savedLink.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = savedLink;
                return next;
              }
              return [...prev, savedLink];
            });
            if (onLinksChanged) onLinksChanged();
          }}
        />
      )}

      {/* Löschen-Bestätigungs-Modal */}
      {deletingLink && (
        <ConfirmModal
          isOpen={Boolean(deletingLink)}
          title="Weblink wirklich löschen?"
          message={`Möchten Sie die Verlinkung zu "${deletingLink.titel}" (${deletingLink.url}) wirklich unwiderruflich entfernen?`}
          confirmText="Ja, Link löschen"
          cancelText="Abbrechen"
          isDestructive={true}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingLink(null)}
        />
      )}
    </div>
  );
}

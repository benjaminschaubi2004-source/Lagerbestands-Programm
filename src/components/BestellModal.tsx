"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  ShoppingBag,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  Calendar,
  FileText,
  Hash,
  Layers,
  Building2,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useToast } from "./Toast";
import { orderMaterialVariante, cancelOrderMaterialVariante } from "@/actions/materialien";

export interface ModalVarianteTarget {
  id: number;
  artikelnummer: string;
  groesseName: string;
  materialName: string;
  hersteller?: string | null;
  kategorie?: string | null;
  einheit?: string | null;
  istBestand: number;
  mindestbestand: number;
  isBestellt: boolean;
  bestelltAm?: Date | null;
  bestelltMenge?: number | null;
  bestelltNotiz?: string | null;
  url?: string | null;
}

export interface OrderSuccessPayload {
  id: number;
  isBestellt: boolean;
  bestelltAm?: Date | null;
  bestelltMenge?: number | null;
  bestelltNotiz?: string | null;
}

interface BestellModalProps {
  isOpen: boolean;
  onClose: () => void;
  variante: ModalVarianteTarget | null;
  onSuccess?: (payload: OrderSuccessPayload) => void;
}

export function BestellModal({ isOpen, onClose, variante, onSuccess }: BestellModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [bestellMenge, setBestellMenge] = useState<number | string>(1);
  const [bestelltNotiz, setBestelltNotiz] = useState<string>("");

  const isKleinkram =
    variante?.kategorie === "SCHRAUBEN_KLEINKRAM" || variante?.einheit === "Pakete";
  const modalUnit = isKleinkram ? "Pakete" : "Stk.";

  useEffect(() => {
    if (variante) {
      if (variante.isBestellt) {
        setBestellMenge(
          variante.bestelltMenge ?? Math.max(1, variante.mindestbestand - variante.istBestand)
        );
        setBestelltNotiz(variante.bestelltNotiz ?? "");
      } else {
        const empfohleneMenge = Math.max(1, variante.mindestbestand - variante.istBestand);
        setBestellMenge(empfohleneMenge);
        setBestelltNotiz("");
      }
    }
  }, [variante]);

  if (!isOpen || !variante) return null;

  const fehlbestand = Math.max(0, variante.mindestbestand - variante.istBestand);

  const handleOrderSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const parsedMenge = Math.max(1, parseInt(String(bestellMenge), 10) || 1);

    startTransition(async () => {
      try {
        const trimmedNotiz = bestelltNotiz.trim() || null;
        const res = await orderMaterialVariante(variante.id, {
          bestelltMenge: parsedMenge,
          bestelltNotiz: trimmedNotiz,
        });

        if (res.success) {
          toast(`"${variante.materialName} (${variante.groesseName})" erfolgreich auf "Bestellt" gesetzt.`);
          if (onSuccess) {
            onSuccess({
              id: variante.id,
              isBestellt: true,
              bestelltAm: new Date(),
              bestelltMenge: parsedMenge,
              bestelltNotiz: trimmedNotiz,
            });
          }
          onClose();
        } else {
          toast(res.error || "Fehler beim Setzen des Bestellstatus.", "error");
        }
      } catch (err) {
        console.error("Fehler bei Bestellung:", err);
        toast("Netzwerkfehler beim Bestellen.", "error");
      }
    });
  };

  const handleCancelOrder = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    startTransition(async () => {
      try {
        const res = await cancelOrderMaterialVariante(variante.id);
        if (res.success) {
          toast(`Bestellstatus für "${variante.materialName}" aufgehoben.`);
          if (onSuccess) {
            onSuccess({
              id: variante.id,
              isBestellt: false,
              bestelltAm: null,
              bestelltMenge: null,
              bestelltNotiz: null,
            });
          }
          onClose();
        } else {
          toast(res.error || "Fehler beim Aufheben des Bestellstatus.", "error");
        }
      } catch (err) {
        console.error("Fehler beim Aufheben:", err);
        toast("Netzwerkfehler beim Aufheben.", "error");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <form
        onSubmit={handleOrderSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                variante.isBestellt
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                  : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
              }`}
            >
              {variante.isBestellt ? <PackageCheck className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {variante.isBestellt ? "Bestellstatus verwalten" : "Material nachbestellen"}
              </h2>
              <p className="text-xs text-zinc-500">
                {variante.isBestellt
                  ? "Status aufheben oder Bestelldaten aktualisieren"
                  : "Status auf 'Bestellt' setzen (nicht mehr kritisch/ausverkauft)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Artikel Info Box */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 block">
                  Material
                </span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                  {variante.materialName}
                  {variante.hersteller && (
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {variante.hersteller}
                    </span>
                  )}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-200/80 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                {variante.groesseName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 text-xs">
              <div>
                <span className="text-zinc-400 block font-medium">Artikelnummer:</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {variante.artikelnummer}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Ist-Bestand:</span>
                <span
                  className={`font-bold ${
                    variante.istBestand === 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {variante.istBestand} {modalUnit}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Mindestbestand:</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {variante.mindestbestand} {modalUnit}
                </span>
              </div>
            </div>

            {variante.isBestellt && variante.bestelltAm && (
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-950/60 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Bereits bestellt am:{" "}
                  <strong>{new Date(variante.bestelltAm).toLocaleDateString("de-DE")}</strong>
                  {variante.bestelltMenge ? ` (${variante.bestelltMenge} ${modalUnit})` : ""}
                </span>
              </div>
            )}

            {variante.url && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Lieferanten-Shop / Produktlink:</span>
                <a
                  href={variante.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Zum Lieferanten-Shop öffnen</span>
                </a>
              </div>
            )}
          </div>

          {/* Hinweis zur Verhaltensweise */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>Automatische Bereinigung:</strong> Nach dem Klick auf &quot;Als Bestellt markieren&quot; wird das Material im Office nicht mehr als kritisch oder ausverkauft gewertet. Sobald ein Wareneingang gebucht wird und der Mindestbestand wieder erreicht ist, erlischt der Bestellstatus automatisch.
            </div>
          </div>

          {/* Formularfelder */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Bestellmenge ({modalUnit}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={bestellMenge}
                  onChange={(e) => setBestellMenge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. 50"
                />
                {fehlbestand > 0 && (
                  <button
                    type="button"
                    onClick={() => setBestellMenge(fehlbestand)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 cursor-pointer"
                    title="Empfohlene Fehlmenge übernehmen"
                  >
                    Fehlmenge ({fehlbestand} Stk.)
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Lieferant / Notiz / Bemerkung (optional)
              </label>
              <textarea
                rows={3}
                value={bestelltNotiz}
                onChange={(e) => setBestelltNotiz(e.target.value)}
                placeholder="z.B. Bestellt bei Fa. Würth, Auftragsnr. 48291, voraussichtliche Lieferung KW 48..."
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {variante.isBestellt ? (
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={isPending}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 border border-red-200 dark:border-red-900/80 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>Bestellstatus aufheben (Stornieren)</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Wird gespeichert...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{variante.isBestellt ? "Bestelldaten aktualisieren" : "Als Bestellt markieren"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

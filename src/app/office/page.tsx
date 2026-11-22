import { getMaterialien } from "@/actions/materialien";
import { getLagerStatistik } from "@/actions/statistik";
import { getAutos } from "@/actions/autos";
import { protectRoute } from "@/lib/auth";
import { OfficeView } from "@/components/OfficeView";
import { ToastProvider } from "@/components/Toast";
import { UserHeaderBadge } from "@/components/UserHeaderBadge";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Office-Übersicht – Lagerliste",
  description: "Readonly-Bestandsübersicht, Statistiken und Fuhrpark/Autos",
};

export default async function OfficePage() {
  const { currentUser } = await protectRoute(["OFFICE", "ADMIN"], "/office");

  const [materialien, statistik, autos] = await Promise.all([
    getMaterialien(),
    getLagerStatistik(),
    getAutos(),
  ]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Office Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight">Lagerliste Office</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                    Office
                  </span>
                </div>
                <p className="text-xs text-zinc-500">Material- und Variantenübersicht, Statistiken & Fuhrpark</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <UserHeaderBadge currentUser={currentUser} targetRoleHint="OFFICE" />

              <Link
                href="/"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rolle wechseln</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Office Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <OfficeView
            materialien={materialien}
            initialStatistik={statistik}
            initialAutos={autos}
          />
        </main>
      </div>
    </ToastProvider>
  );
}

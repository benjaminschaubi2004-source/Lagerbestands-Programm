import { getMaterialien } from "@/actions/materialien";
import { getLagerStatistik } from "@/actions/statistik";
import { getAutos } from "@/actions/autos";
import { getWebLinks } from "@/actions/links";
import { protectRoute } from "@/lib/auth";
import { OfficeView } from "@/components/OfficeView";
import { ToastProvider } from "@/components/Toast";
import { UserHeaderBadge } from "@/components/UserHeaderBadge";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Office-Übersicht – Lagerliste",
  description: "Readonly-Bestandsübersicht, Statistiken, Fuhrpark und wichtige Webseiten",
};

export default async function OfficePage() {
  const { currentUser } = await protectRoute(["OFFICE", "ADMIN"], "/office");

  const [materialien, statistik, autos, links] = await Promise.all([
    getMaterialien(),
    getLagerStatistik(),
    getAutos(),
    getWebLinks(),
  ]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Office Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full max-w-full">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                  <span className="font-bold text-sm sm:text-lg tracking-tight truncate">Lagerliste Office</span>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800 shrink-0">
                    Office
                  </span>
                </div>
                <p className="text-xs text-zinc-500 hidden md:block truncate">Material- und Variantenübersicht, Statistiken, Fuhrpark & Portale</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              <UserHeaderBadge currentUser={currentUser} targetRoleHint="OFFICE" />

              <Link
                href="/"
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 shrink-0"
                title="Rolle wechseln"
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
            initialLinks={links}
          />
        </main>
      </div>
    </ToastProvider>
  );
}

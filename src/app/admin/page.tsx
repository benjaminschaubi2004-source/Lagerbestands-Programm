import { getMaterialien } from "@/actions/materialien";
import { getGroessen } from "@/actions/groessen";
import { getUsers } from "@/actions/users";
import { getActivityLogs } from "@/actions/logs";
import { getLagerStatistik } from "@/actions/statistik";
import { protectRoute } from "@/lib/auth";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin – Lagerliste",
  description: "Vollständige Verwaltung aller Materialien, Benutzer, Logs und Bestände",
};

export default async function AdminPage() {
  const { currentUser } = await protectRoute(["ADMIN"], "/admin");

  const [materialien, groessen, users, logs, statistik] = await Promise.all([
    getMaterialien(),
    getGroessen(),
    getUsers(),
    getActivityLogs({ limit: 150 }),
    getLagerStatistik(),
  ]);

  return (
    <Dashboard
      initialMaterialien={materialien}
      initialGroessen={groessen}
      initialUsers={users}
      initialLogs={logs}
      initialStatistik={statistik}
      currentUser={currentUser}
      isAdmin={true}
    />
  );
}

import { getMaterialien } from "@/actions/materialien";
import { getGroessen } from "@/actions/groessen";
import { getUsers } from "@/actions/users";
import { getActivityLogs } from "@/actions/logs";
import { getLagerStatistik } from "@/actions/statistik";
import { getAutos } from "@/actions/autos";
import { getMeldungen } from "@/actions/meldungen";
import { getWebLinks } from "@/actions/links";
import { protectRoute } from "@/lib/auth";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin – Lagerliste",
  description: "Vollständige Verwaltung aller Materialien, Benutzer, Logs, Fuhrpark, Meldungen und Webseiten",
};

export default async function AdminPage() {
  const { currentUser } = await protectRoute(["ADMIN"], "/admin");

  const [materialien, groessen, users, logs, statistik, autos, meldungen, links] = await Promise.all([
    getMaterialien(),
    getGroessen(),
    getUsers(),
    getActivityLogs({ limit: 150 }),
    getLagerStatistik(),
    getAutos(),
    getMeldungen(),
    getWebLinks(),
  ]);

  return (
    <Dashboard
      initialMaterialien={materialien}
      initialGroessen={groessen}
      initialUsers={users}
      initialLogs={logs}
      initialStatistik={statistik}
      initialAutos={autos}
      initialMeldungen={meldungen}
      initialLinks={links}
      currentUser={currentUser}
      isAdmin={true}
    />
  );
}

import { getMaterialien, getBuchungen } from "@/actions/materialien";
import { getGroessen } from "@/actions/groessen";
import { protectRoute } from "@/lib/auth";
import { TechnikerClientPage } from "@/components/TechnikerClientPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monteur-Assistent – Lagerliste",
  description: "Mobile Materialauswahl, Einnahme und Ausgabe für Monteure",
};

export default async function MonteurPage() {
  const { currentUser } = await protectRoute(["TECHNIKER", "MONTEUR", "ADMIN"], "/monteur");

  const [materialien, groessen, buchungen] = await Promise.all([
    getMaterialien(),
    getGroessen(),
    getBuchungen(30),
  ]);

  return (
    <TechnikerClientPage
      initialMaterialien={materialien}
      initialGroessen={groessen}
      initialBuchungen={buchungen}
      currentUser={currentUser}
    />
  );
}

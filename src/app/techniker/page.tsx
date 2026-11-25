import { getMaterialien, getBuchungen } from "@/actions/materialien";
import { getGroessen } from "@/actions/groessen";
import { getAutos } from "@/actions/autos";
import { protectRoute } from "@/lib/auth";
import { TechnikerClientPage } from "@/components/TechnikerClientPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monteur-Assistent – Lagerliste",
  description: "Mobile Materialauswahl, Einnahme und Ausgabe für Monteure",
};

export default async function TechnikerPage(props: {
  searchParams?: Promise<{ app?: string; lock?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const isLocked = searchParams.app === "1" || searchParams.app === "techniker" || searchParams.lock === "1";
  const { currentUser } = await protectRoute(["TECHNIKER", "ADMIN"], "/techniker");

  const [materialien, groessen, buchungen, autos] = await Promise.all([
    getMaterialien(),
    getGroessen(),
    getBuchungen(30),
    getAutos(),
  ]);

  return (
    <TechnikerClientPage
      initialMaterialien={materialien}
      initialGroessen={groessen}
      initialBuchungen={buchungen}
      initialAutos={autos}
      currentUser={currentUser}
      isLocked={isLocked}
    />
  );
}

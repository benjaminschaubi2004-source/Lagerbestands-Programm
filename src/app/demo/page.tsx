import { getMaterialien } from "@/actions/materialien";
import { getGroessen } from "@/actions/groessen";
import { getAutos } from "@/actions/autos";
import { DemoClientPage } from "@/components/DemoClientPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lagerliste Demo – Vollfunktionsfähige Testumgebung",
  description: "Demo-Version der Lagerliste für Vorführungs- und Schulungszwecke ohne Auswirkung auf echte Bestände",
};

export default async function DemoPage() {
  let materialien: any[] = [];
  let groessen: any[] = [];
  let autos: any[] = [];

  try {
    const [m, g, a] = await Promise.all([
      getMaterialien(),
      getGroessen(),
      getAutos(),
    ]);
    materialien = m;
    groessen = g;
    autos = a;
  } catch (err) {
    console.warn("Konnte Daten für Demo nicht direkt aus DB laden, nutze Fallback:", err);
  }

  return (
    <DemoClientPage
      initialMaterialien={materialien}
      initialGroessen={groessen}
      initialAutos={autos}
    />
  );
}

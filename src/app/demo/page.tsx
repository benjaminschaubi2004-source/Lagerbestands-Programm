import { getMaterialien } from "@/actions/materialien";
import { getGroessen } from "@/actions/groessen";
import { getAutos } from "@/actions/autos";
import { DemoClientPage } from "@/components/DemoClientPage";
import {
  DEMO_FALLBACK_MATERIALIEN,
  DEMO_FALLBACK_GROESSEN,
  DEMO_FALLBACK_AUTOS,
} from "@/lib/demoFallbackData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lagerliste Demo – Vollfunktionsfähige Testumgebung",
  description: "Demo-Version der Lagerliste für Vorführungs- und Schulungszwecke ohne Auswirkung auf echte Bestände",
};

export default async function DemoPage() {
  let materialien = DEMO_FALLBACK_MATERIALIEN;
  let groessen = DEMO_FALLBACK_GROESSEN;
  let autos = DEMO_FALLBACK_AUTOS;

  try {
    const [m, g, a] = await Promise.all([
      getMaterialien(),
      getGroessen(),
      getAutos(),
    ]);
    if (m && m.length > 0) materialien = m;
    if (g && g.length > 0) groessen = g;
    if (a && a.length > 0) autos = a;
  } catch (err) {
    console.warn("Konnte Daten für Demo nicht direkt aus DB laden, nutze statisches Fallback:", err);
  }

  return (
    <DemoClientPage
      initialMaterialien={materialien}
      initialGroessen={groessen}
      initialAutos={autos}
    />
  );
}

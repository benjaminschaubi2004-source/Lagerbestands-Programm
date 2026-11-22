import { getMaterialien } from "@/actions/materialien";
import { getCurrentUser, isLocalhost } from "@/lib/auth";
import { HomeLockScreen } from "@/components/HomeLockScreen";
import { ToastProvider } from "@/components/Toast";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lagerliste – Lagerverwaltung & Monteur-Portal",
  description: "Geschützter Zugang zu Monteur, Office und Admin",
};

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const redirectTarget = typeof params.redirect === "string" ? params.redirect : undefined;
  const authRequired = params.auth === "required";
  const accessDenied = params.denied === "true";

  const [materialien, currentUser, isLocal] = await Promise.all([
    getMaterialien(),
    getCurrentUser(),
    isLocalhost(),
  ]);

  const totalVarianten = materialien.reduce((acc, m) => acc + m.varianten.length, 0);
  const criticalCount = materialien.reduce(
    (acc, m) => acc + m.varianten.filter((v) => v.istBestand < v.mindestbestand).length,
    0
  );

  return (
    <ToastProvider>
      <HomeLockScreen
        currentUser={currentUser}
        isLocalhost={isLocal}
        redirectTarget={redirectTarget}
        authRequired={authRequired}
        accessDenied={accessDenied}
        materialienCount={materialien.length}
        totalVarianten={totalVarianten}
        criticalCount={criticalCount}
      />
    </ToastProvider>
  );
}

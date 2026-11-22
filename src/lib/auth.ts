import { db } from "@/lib/db";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type UserRole = "TECHNIKER" | "MONTEUR" | "OFFICE" | "ADMIN";

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}

const COOKIE_NAME = "lagerliste_session";

// Passwort-Hashing mit Node.js scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Erstellt ein signiertes Session-Token
function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const secret = process.env.SESSION_SECRET || "lagerliste-super-secret-system-key-2026";
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const secret = process.env.SESSION_SECRET || "lagerliste-super-secret-system-key-2026";
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(json) as SessionUser;
  } catch {
    return null;
  }
}

// Aktuell eingeloggten User abrufen
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) return null;
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

// Benutzer einloggen
export async function loginUser(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string; user?: SessionUser }> {
  const username = usernameInput?.trim().toLowerCase();
  const password = passwordInput?.trim();

  if (!username || !password) {
    return { success: false, error: "Benutzername und Passwort sind erforderlich." };
  }

  try {
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, error: "Ungültiger Benutzername oder Passwort." };
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return { success: false, error: "Ungültiger Benutzername oder Passwort." };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as UserRole,
    };

    const token = createSessionToken(sessionUser);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
    });

    // Login im ActivityLog vermerken
    try {
      await db.activityLog.create({
        data: {
          bereich: sessionUser.role,
          aktion: "LOGIN",
          beschreibung: `Benutzer "${sessionUser.name}" (@${sessionUser.username}) hat sich angemeldet.`,
          username: sessionUser.username,
          userRole: sessionUser.role,
          userId: sessionUser.id,
          details: `Erfolgreicher Login im Bereich ${sessionUser.role}`,
        },
      });
    } catch (logErr) {
      console.warn("Konnte Login nicht im Log erfassen:", logErr);
    }

    return { success: true, user: sessionUser };
  } catch (err: any) {
    console.error("Fehler beim Login:", err);
    return { success: false, error: "Anmeldung fehlgeschlagen. Bitte versuche es erneut." };
  }
}

// Benutzer ausloggen
export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const user = await getCurrentUser();
    if (user) {
      try {
        await db.activityLog.create({
          data: {
            bereich: user.role,
            aktion: "LOGOUT",
            beschreibung: `Benutzer "${user.name}" (@${user.username}) hat sich abgemeldet.`,
            username: user.username,
            userRole: user.role,
            userId: user.id,
          },
        });
      } catch {}
    }

    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return { success: true };
  } catch {
    return { success: true };
  }
}

// Prüft, ob der aktuelle Request über Localhost erfolgt (127.0.0.1 oder localhost)
export async function isLocalhost(): Promise<boolean> {
  try {
    const headersList = await headers();
    const host = (headersList.get("host") || "").toLowerCase();
    const forwardedHost = (headersList.get("x-forwarded-host") || "").toLowerCase();
    const forwardedFor = (headersList.get("x-forwarded-for") || "").toLowerCase();
    const realIp = (headersList.get("x-real-ip") || "").toLowerCase();

    const targetHost = forwardedHost || host;

    // Prüfe Host-Namen & typische Localhost-Header
    if (
      targetHost.startsWith("localhost") ||
      targetHost.startsWith("127.0.0.1") ||
      targetHost.startsWith("[::1]") ||
      targetHost.startsWith("::1")
    ) {
      return true;
    }

    if (
      forwardedFor.startsWith("127.0.0.1") ||
      forwardedFor.startsWith("::1") ||
      realIp.startsWith("127.0.0.1") ||
      realIp.startsWith("::1")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// Prüft Berechtigung für eine Route
export async function checkRouteAccess(allowedRoles: UserRole[]): Promise<{
  allowed: boolean;
  user: SessionUser | null;
  isLocal: boolean;
  reason?: "not_logged_in" | "wrong_role";
}> {
  const [user, isLocal] = await Promise.all([getCurrentUser(), isLocalhost()]);

  // 1. Wenn auf localhost und NICHT angemeldet:
  // Anforderung: "ausser localhost ohne anmeldung" -> Auf localhost ist Zugriff ohne vorherigen Login gestattet
  if (isLocal && !user) {
    return { allowed: true, user: null, isLocal: true };
  }

  // 2. Wenn nicht angemeldet (und nicht auf localhost):
  if (!user) {
    return { allowed: false, user: null, isLocal: false, reason: "not_logged_in" };
  }

  // 3. Wenn angemeldet:
  // Admin darf grundsätzlich in alle Bereiche (Admin, Monteur, Office)
  const isTechnikerOrMonteur = user.role === "TECHNIKER" || (user.role as string) === "MONTEUR";
  const allowsMonteur = allowedRoles.includes("TECHNIKER") || (allowedRoles as string[]).includes("MONTEUR");

  if (
    user.role === "ADMIN" ||
    allowedRoles.includes(user.role) ||
    (isTechnikerOrMonteur && allowsMonteur)
  ) {
    return { allowed: true, user, isLocal };
  }

  // Angemeldet, aber die Rolle reicht für diese Route nicht aus
  return { allowed: false, user, isLocal, reason: "wrong_role" };
}

// Schützt Server-Komponenten vor unbefugtem Aufruf
export async function protectRoute(
  allowedRoles: UserRole[],
  targetPath: string
): Promise<{
  currentUser: SessionUser | null;
  isLocalhost: boolean;
}> {
  const { allowed, user, isLocal, reason } = await checkRouteAccess(allowedRoles);

  if (!allowed) {
    if (reason === "not_logged_in") {
      redirect(`/?redirect=${encodeURIComponent(targetPath)}&auth=required`);
    } else if (reason === "wrong_role") {
      // Wenn falsche Rolle: Weiterleitung in den für den Benutzer passenden Bereich
      if (user?.role === "TECHNIKER" || (user?.role as string) === "MONTEUR") {
        redirect("/techniker?denied=true");
      } else if (user?.role === "OFFICE") {
        redirect("/office?denied=true");
      } else {
        redirect("/?denied=true");
      }
    }
  }

  return { currentUser: user, isLocalhost: isLocal };
}

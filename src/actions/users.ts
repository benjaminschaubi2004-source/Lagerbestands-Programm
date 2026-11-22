"use server";

import { db } from "@/lib/db";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/actions/logs";
import { revalidatePath } from "next/cache";

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  role: "TECHNIKER" | "OFFICE" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export async function getUsers(roleFilter?: string): Promise<UserInfo[]> {
  try {
    const where: any = {};
    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter;
    }

    const users = await db.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users as UserInfo[];
  } catch (error) {
    console.warn("Hinweis: Fehler beim Laden der Benutzer:", error);
    return [];
  }
}

export async function createUser(data: {
  username: string;
  name: string;
  password: string;
  role: "TECHNIKER" | "OFFICE" | "ADMIN";
}): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
  const username = data.username?.trim().toLowerCase();
  const name = data.name?.trim();
  const password = data.password?.trim();
  const role = data.role;

  if (!username) {
    return { success: false, error: "Der Anmeldename (Benutzername) ist erforderlich." };
  }
  if (!name) {
    return { success: false, error: "Der vollständige Name ist erforderlich." };
  }
  if (!password || password.length < 4) {
    return { success: false, error: "Das Passwort muss mindestens 4 Zeichen lang sein." };
  }
  if (!["TECHNIKER", "OFFICE", "ADMIN"].includes(role)) {
    return { success: false, error: "Ungültige Rolle ausgewählt." };
  }

  try {
    const existing = await db.user.findUnique({
      where: { username },
    });
    if (existing) {
      return { success: false, error: `Der Benutzername "${username}" ist bereits vergeben.` };
    }

    const hashedPassword = hashPassword(password);

    const newUser = await db.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logActivity({
      bereich: "ADMIN",
      aktion: "USER_CREATE",
      beschreibung: `Neuer Benutzer "${name}" (@${username}) mit Rolle [${role}] angelegt.`,
      details: `Kategorie: ${role}, ID: ${newUser.id}`,
    });

    revalidatePath("/admin");
    return { success: true, user: newUser as UserInfo };
  } catch (error: any) {
    console.error("Fehler beim Erstellen des Benutzers:", error);
    return { success: false, error: "Benutzer konnte nicht erstellt werden." };
  }
}

export async function updateUser(
  id: number,
  data: {
    username: string;
    name: string;
    password?: string;
    role: "TECHNIKER" | "OFFICE" | "ADMIN";
  }
): Promise<{ success: boolean; error?: string }> {
  const username = data.username?.trim().toLowerCase();
  const name = data.name?.trim();
  const password = data.password?.trim();
  const role = data.role;

  if (!username) {
    return { success: false, error: "Der Anmeldename (Benutzername) ist erforderlich." };
  }
  if (!name) {
    return { success: false, error: "Der vollständige Name ist erforderlich." };
  }
  if (!["TECHNIKER", "OFFICE", "ADMIN"].includes(role)) {
    return { success: false, error: "Ungültige Rolle ausgewählt." };
  }

  try {
    const existing = await db.user.findFirst({
      where: {
        username,
        id: { not: id },
      },
    });
    if (existing) {
      return { success: false, error: `Der Benutzername "${username}" wird bereits von einem anderen Benutzer verwendet.` };
    }

    const currentUser = await db.user.findUnique({ where: { id } });
    if (!currentUser) {
      return { success: false, error: "Benutzer nicht gefunden." };
    }

    // Falls die Admin-Rolle entzogen werden soll, prüfen ob es der letzte Admin ist
    if (currentUser.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { success: false, error: "Es muss mindestens ein Administrator im System verbleiben." };
      }
    }

    const updateData: any = {
      username,
      name,
      role,
    };

    if (password && password.length >= 4) {
      updateData.password = hashPassword(password);
    }

    await db.user.update({
      where: { id },
      data: updateData,
    });

    const roleChanged = currentUser.role !== role;
    const desc = roleChanged
      ? `Benutzer "${name}" (@${username}) aktualisiert: Rolle von [${currentUser.role}] zu [${role}] geändert.`
      : `Benutzer "${name}" (@${username}) Stammdaten aktualisiert.`;

    await logActivity({
      bereich: "ADMIN",
      aktion: "USER_UPDATE",
      beschreibung: desc,
      details: password ? "Passwort wurde ebenfalls neu gesetzt." : undefined,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Fehler beim Aktualisieren des Benutzers:", error);
    return { success: false, error: "Benutzer konnte nicht aktualisiert werden." };
  }
}

export async function deleteUser(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: "Benutzer existiert nicht mehr." };
    }

    if (user.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { success: false, error: "Der letzte verbleibende Administrator kann nicht gelöscht werden!" };
      }
    }

    await db.user.delete({ where: { id } });

    await logActivity({
      bereich: "ADMIN",
      aktion: "USER_DELETE",
      beschreibung: `Benutzer "${user.name}" (@${user.username}) mit Rolle [${user.role}] gelöscht.`,
      details: `Benutzer-ID #${user.id}`,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Fehler beim Löschen des Benutzers:", error);
    return { success: false, error: "Benutzer konnte nicht gelöscht werden." };
  }
}

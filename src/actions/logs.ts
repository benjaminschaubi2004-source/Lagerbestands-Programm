"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export interface ActivityLogItem {
  id: number;
  bereich: string; // "TECHNIKER" | "OFFICE" | "ADMIN"
  aktion: string;
  beschreibung: string;
  username: string;
  userRole: string;
  userId: number | null;
  details: string | null;
  createdAt: Date;
}

export async function logActivity(data: {
  bereich: "TECHNIKER" | "OFFICE" | "ADMIN";
  aktion: string;
  beschreibung: string;
  details?: string;
  customUsername?: string;
  customUserRole?: string;
}): Promise<void> {
  try {
    const user = await getCurrentUser();
    const username = data.customUsername || user?.username || "system";
    const userRole = data.customUserRole || user?.role || data.bereich;
    const userId = user?.id || null;

    await db.activityLog.create({
      data: {
        bereich: data.bereich,
        aktion: data.aktion,
        beschreibung: data.beschreibung,
        username,
        userRole,
        userId,
        details: data.details || null,
      },
    });
  } catch (error) {
    console.warn("Hinweis: Fehler beim Erstellen des Activity-Logs:", error);
  }
}

export async function getActivityLogs(options?: {
  bereich?: string;
  search?: string;
  limit?: number;
}): Promise<ActivityLogItem[]> {
  try {
    const where: any = {};

    if (options?.bereich && options.bereich !== "ALL") {
      where.bereich = options.bereich;
    }

    if (options?.search && options.search.trim()) {
      const term = options.search.trim();
      where.OR = [
        { beschreibung: { contains: term, mode: "insensitive" } },
        { username: { contains: term, mode: "insensitive" } },
        { aktion: { contains: term, mode: "insensitive" } },
        { details: { contains: term, mode: "insensitive" } },
      ];
    }

    const logs = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 100,
    });

    return logs;
  } catch (error) {
    console.warn("Hinweis: Fehler beim Abrufen der Activity-Logs:", error);
    return [];
  }
}

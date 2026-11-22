"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";

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

export interface LogBackupItem {
  filename: string;
  jsonFilename: string;
  formattedDate: string;
  createdAt: string;
  sizeBytes: number;
  activityCount: number;
  buchungCount: number;
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

// ============================================================================
// BACKUP & CLEAR ACTIONS
// ============================================================================
const BACKUP_DIR = path.join(process.cwd(), "backups", "logs");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(BACKUP_DIR, "README.txt"),
      "Lagerliste – Archivierter Speicherort fuer Log- und Bewegungs-Backups.\r\n" +
      "Hier abgelegte Backups wurden beim Leeren der Logs erstellt und sind jederzeit einsehbar.\r\n",
      "utf-8"
    );
  }
}

export async function clearAndBackupAllLogs(): Promise<{
  success: boolean;
  message: string;
  backupFileName?: string;
  backupJsonFileName?: string;
  backupPath?: string;
  activityCount?: number;
  buchungCount?: number;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Nur Administratoren duerfen Logs leeren und archivieren.",
      };
    }

    ensureBackupDir();

    // 1. Alle Activity-Logs laden
    const allActivityLogs = await db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 2. Alle Buchungen laden (mit Material & Varianten-Details)
    const allBuchungen = await db.buchung.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        variante: {
          include: {
            material: { select: { id: true, name: true, hersteller: true } },
            groesse: { select: { id: true, name: true } },
          },
        },
      },
    });

    const now = new Date();
    const dateFormatted = now.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const txtFileName = `backup-logs-${stamp}.txt`;
    const jsonFileName = `backup-logs-${stamp}.json`;
    const txtFilePath = path.join(BACKUP_DIR, txtFileName);
    const jsonFilePath = path.join(BACKUP_DIR, jsonFileName);

    // 3. JSON-Datei generieren
    const jsonData = {
      backupId: `backup-${stamp}`,
      zeitstempel: now.toISOString(),
      zeitstempelFormatiert: dateFormatted,
      durchgefuehrtVon: currentUser
        ? `${currentUser.name} (@${currentUser.username}, Rolle: ${currentUser.role})`
        : "Administrator (über System)",
      uebersicht: {
        anzahlAktivitaetsLogs: allActivityLogs.length,
        anzahlBuchungen: allBuchungen.length,
        gesamtEintraege: allActivityLogs.length + allBuchungen.length,
      },
      aktivitaetsLogs: allActivityLogs.map((l) => ({
        id: l.id,
        datum: l.createdAt.toISOString(),
        datumFormatiert: new Date(l.createdAt).toLocaleString("de-DE"),
        bereich: l.bereich,
        aktion: l.aktion,
        benutzer: l.username,
        rolle: l.userRole,
        beschreibung: l.beschreibung,
        details: l.details,
      })),
      buchungen: allBuchungen.map((b) => ({
        id: b.id,
        datum: b.createdAt.toISOString(),
        datumFormatiert: new Date(b.createdAt).toLocaleString("de-DE"),
        typ: b.typ,
        menge: b.menge,
        bestandVorher: b.bestandVorher,
        bestandNachher: b.bestandNachher,
        artikelnummer: b.variante?.artikelnummer || "Unbekannt",
        material: b.variante?.material?.name || "Unbekannt",
        hersteller: b.variante?.material?.hersteller || null,
        varianteGroesse: b.variante?.groesse?.name || "Einheitsgröße",
      })),
    };

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf-8");

    // 4. Menschenlesbare Textdatei generieren
    const lines: string[] = [];
    lines.push("================================================================================");
    lines.push("                 LAGERLISTE – ARCHIV & LOG-SICHERUNG");
    lines.push("================================================================================");
    lines.push(`Erstellt am:           ${dateFormatted}`);
    lines.push(`Durchgeführt von:      ${jsonData.durchgefuehrtVon}`);
    lines.push(`Gesicherte Aktionen:   ${allActivityLogs.length} Aktivitäts-Logs`);
    lines.push(`Gesicherte Buchungen:  ${allBuchungen.length} Eingänge & Ausgänge`);
    lines.push(`Dateipfad auf Server:  backups/logs/${txtFileName}`);
    lines.push("================================================================================\r\n");

    lines.push("--------------------------------------------------------------------------------");
    lines.push(" TEIL 1: EINGÄNGE & AUSGÄNGE (LAGERBEWEGUNGEN)");
    lines.push("--------------------------------------------------------------------------------");
    if (allBuchungen.length === 0) {
      lines.push("Keine Buchungen vorhanden.");
    } else {
      allBuchungen.forEach((b, idx) => {
        const dStr = new Date(b.createdAt).toLocaleString("de-DE");
        const mat = b.variante?.material?.name || "Unbekannt";
        const groesse = b.variante?.groesse?.name || "-";
        const artNr = b.variante?.artikelnummer || "-";
        const symbol = b.typ === "EINGANG" ? "[+ EINNAHME]" : "[- AUSGABE ]";
        lines.push(
          `${String(idx + 1).padStart(3, " ")}. [${dStr}] ${symbol} Menge: ${b.menge}x | ${mat} (${groesse}, Art.-Nr: ${artNr}) | Bestand: ${b.bestandVorher} -> ${b.bestandNachher}`
        );
      });
    }
    lines.push("\r\n");

    lines.push("--------------------------------------------------------------------------------");
    lines.push(" TEIL 2: AUDIT- & AKTIVITÄTS-DATENLOG");
    lines.push("--------------------------------------------------------------------------------");
    if (allActivityLogs.length === 0) {
      lines.push("Keine Aktivitäts-Logs vorhanden.");
    } else {
      allActivityLogs.forEach((l, idx) => {
        const dStr = new Date(l.createdAt).toLocaleString("de-DE");
        lines.push(
          `${String(idx + 1).padStart(3, " ")}. [${dStr}] [${l.bereich.padEnd(9, " ")}] [${l.aktion.padEnd(10, " ")}] @${l.username} (${l.userRole}):`
        );
        lines.push(`     Beschreibung: ${l.beschreibung}`);
        if (l.details) {
          lines.push(`     Details:      ${l.details}`);
        }
      });
    }
    lines.push("\r\n================================================================================");
    lines.push("ENDE DER SICHERUNGSDATEI");
    lines.push("================================================================================");

    fs.writeFileSync(txtFilePath, lines.join("\r\n"), "utf-8");

    // 5. Datenbank-Tabellen leeren
    await db.buchung.deleteMany();
    await db.activityLog.deleteMany();

    // Revalidierung
    revalidatePath("/admin");
    revalidatePath("/office");
    revalidatePath("/techniker");
    revalidatePath("/");

    return {
      success: true,
      message: `Logs erfolgreich geleert! Sicherung wurde erstellt (${allActivityLogs.length} Aktivitäten, ${allBuchungen.length} Buchungen).`,
      backupFileName: txtFileName,
      backupJsonFileName: jsonFileName,
      backupPath: `backups/logs/${txtFileName}`,
      activityCount: allActivityLogs.length,
      buchungCount: allBuchungen.length,
    };
  } catch (err: any) {
    console.error("Fehler beim Sichern und Leeren der Logs:", err);
    return {
      success: false,
      message: err.message || "Fehler beim Sichern und Leeren der Logs.",
    };
  }
}

export async function getLogBackupsList(): Promise<LogBackupItem[]> {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR);
    const jsonFiles = files.filter((f) => f.startsWith("backup-logs-") && f.endsWith(".json"));

    const list: LogBackupItem[] = [];

    for (const jFile of jsonFiles) {
      try {
        const fullPath = path.join(BACKUP_DIR, jFile);
        const stat = fs.statSync(fullPath);
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const txtFile = jFile.replace(".json", ".txt");

        list.push({
          filename: fs.existsSync(path.join(BACKUP_DIR, txtFile)) ? txtFile : jFile,
          jsonFilename: jFile,
          formattedDate: content.zeitstempelFormatiert || stat.mtime.toLocaleString("de-DE"),
          createdAt: content.zeitstempel || stat.mtime.toISOString(),
          sizeBytes: stat.size,
          activityCount: content.uebersicht?.anzahlAktivitaetsLogs ?? 0,
          buchungCount: content.uebersicht?.anzahlBuchungen ?? 0,
        });
      } catch {}
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    console.warn("Hinweis: Fehler beim Lesen der Backup-Liste:", error);
    return [];
  }
}

export async function getLogBackupFileContent(filename: string): Promise<string | null> {
  try {
    ensureBackupDir();
    const safeName = path.basename(filename);
    const fullPath = path.join(BACKUP_DIR, safeName);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
}

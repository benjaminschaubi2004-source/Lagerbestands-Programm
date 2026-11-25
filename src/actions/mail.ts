"use server";

import nodemailer from "nodemailer";
import { logActivity } from "@/actions/logs";

export interface BedarfsMailItem {
  materialName: string;
  hersteller?: string | null;
  groesseName: string;
  artikelnummer: string;
  istBestand: number;
  mindestbestand: number;
  fehlmenge: number;
  einheit: string;
  status: "OUT_OF_STOCK" | "CRITICAL";
  url?: string | null;
}

export interface SendBedarfsMailInput {
  to: string;
  subject?: string;
  notiz?: string;
  items: BedarfsMailItem[];
}

export interface SmtpConfigStatus {
  isConfigured: boolean;
  host?: string;
  user?: string;
  defaultTo?: string;
}

/**
 * Text-Formatierer für Version A (mailto & Zwischenablage) und Version B (Fallback-Text)
 */
export async function getFormattedBedarfsText(items: BedarfsMailItem[], notiz?: string): Promise<string> {
  const ausverkauft = items.filter((i) => i.status === "OUT_OF_STOCK");
  const kritisch = items.filter((i) => i.status === "CRITICAL");

  const lines: string[] = [];
  lines.push("Hallo,");
  lines.push("");
  lines.push("folgende Materialien haben den Mindestbestand erreicht oder sind ausverkauft und müssen nachbestellt werden:");
  lines.push("");

  if (notiz && notiz.trim()) {
    lines.push("HINWEIS / BEMERKUNG:");
    lines.push(notiz.trim());
    lines.push("");
  }

  if (ausverkauft.length > 0) {
    lines.push("=========================================");
    lines.push(`🔴 AUSVERKAUFT (${ausverkauft.length} Positionen - Bestand: 0)`);
    lines.push("=========================================");
    ausverkauft.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. ${item.materialName}${item.hersteller ? ` [${item.hersteller}]` : ""} – Variante: ${item.groesseName}`
      );
      lines.push(`   * Art.-Nr.: ${item.artikelnummer}`);
      lines.push(
        `   * Fehlmenge: ${item.fehlmenge} ${item.einheit} (Mindestbestand: ${item.mindestbestand} ${item.einheit})`
      );
      if (item.url) {
        lines.push(`   * Lieferanten-Link: ${item.url}`);
      }
      lines.push("");
    });
  }

  if (kritisch.length > 0) {
    lines.push("=========================================");
    lines.push(`🟡 NACHBESTELLEN / MELDEBESTAND (${kritisch.length} Positionen)`);
    lines.push("=========================================");
    kritisch.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. ${item.materialName}${item.hersteller ? ` [${item.hersteller}]` : ""} – Variante: ${item.groesseName}`
      );
      lines.push(`   * Art.-Nr.: ${item.artikelnummer}`);
      lines.push(
        `   * Bestand: ${item.istBestand} ${item.einheit} | Mindestbestand: ${item.mindestbestand} ${item.einheit} (Fehlmenge: ${item.fehlmenge} ${item.einheit})`
      );
      if (item.url) {
        lines.push(`   * Lieferanten-Link: ${item.url}`);
      }
      lines.push("");
    });
  }

  lines.push("-----------------------------------------");
  lines.push(`Gesamt: ${items.length} Position(en) zur Nachbestellung.`);
  lines.push(`Erstellt über LagerLurch am ${new Date().toLocaleDateString("de-DE")}.`);

  return lines.join("\n");
}

/**
 * Schicker HTML-Tabellen-Formatierer für Version B
 */
function buildHtmlMail(items: BedarfsMailItem[], notiz?: string, dateStr?: string): string {
  const rowsHtml = items
    .map((item, idx) => {
      const isOut = item.status === "OUT_OF_STOCK";
      const statusBadge = isOut
        ? `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:bold;background:#fee2e2;color:#991b1b;border:1px solid #f87171;">🔴 Ausverkauft</span>`
        : `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:bold;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;">🟡 Nachbestellen</span>`;

      const linkHtml = item.url
        ? `<a href="${item.url}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:600;font-size:12px;background:#eff6ff;padding:4px 8px;border-radius:4px;border:1px solid #bfdbfe;display:inline-block;">🔗 Shop-Link</a>`
        : `<span style="color:#9ca3af;font-size:11px;">–</span>`;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? "#ffffff" : "#f9fafb"};">
          <td style="padding: 10px 12px; font-weight: bold; color: #111827;">
            ${item.materialName}
            ${item.hersteller ? `<span style="font-size:11px;color:#6b7280;display:block;">${item.hersteller}</span>` : ""}
          </td>
          <td style="padding: 10px 12px; font-weight: 600; color: #374151;">${item.groesseName}</td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 12px; color: #1e40af;">${item.artikelnummer}</td>
          <td style="padding: 10px 12px; text-align: center;">${statusBadge}</td>
          <td style="padding: 10px 12px; text-align: right; color: ${isOut ? "#dc2626" : "#111827"}; font-weight: bold;">
            ${item.istBestand} ${item.einheit}
          </td>
          <td style="padding: 10px 12px; text-align: right; color: #4b5563;">${item.mindestbestand} ${item.einheit}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #b91c1c;">${item.fehlmenge} ${item.einheit}</td>
          <td style="padding: 10px 12px; text-align: center;">${linkHtml}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Lagerbestands-Meldung</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #1f2937;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background: #1e3a8a; padding: 24px 28px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold;">📦 LagerLurch – Bedarfsliste zur Nachbestellung</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #bfdbfe;">
              Generiert am ${dateStr || new Date().toLocaleDateString("de-DE")} • ${items.length} Position(en)
            </p>
          </td>
        </tr>

        ${
          notiz && notiz.trim()
            ? `
        <!-- Notiz Box -->
        <tr>
          <td style="padding: 16px 28px; background: #eff6ff; border-bottom: 1px solid #dbeafe;">
            <strong style="color: #1e40af; font-size: 13px;">Hinweis / Bemerkung:</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e3a8a;">${notiz.trim()}</p>
          </td>
        </tr>
        `
            : ""
        }

        <!-- Tabelle -->
        <tr>
          <td style="padding: 24px 28px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb; text-align: left; color: #4b5563; font-size: 12px;">
                  <th style="padding: 10px 12px;">Material</th>
                  <th style="padding: 10px 12px;">Variante</th>
                  <th style="padding: 10px 12px;">Art.-Nr.</th>
                  <th style="padding: 10px 12px; text-align: center;">Status</th>
                  <th style="padding: 10px 12px; text-align: right;">Ist-Bestand</th>
                  <th style="padding: 10px 12px; text-align: right;">Mindest</th>
                  <th style="padding: 10px 12px; text-align: right;">Fehlmenge</th>
                  <th style="padding: 10px 12px; text-align: center;">Link</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background: #f9fafb; padding: 16px 28px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
            Diese E-Mail wurde automatisch aus dem <strong>LagerLurch</strong> Lagerverwaltungssystem erstellt.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Prüft ob die SMTP-Umgebungsvariablen für Version B hinterlegt sind
 */
export async function checkSmtpStatus(): Promise<SmtpConfigStatus> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const defaultTo = process.env.DEFAULT_ORDER_EMAIL?.trim() || "";

  const isConfigured = Boolean(host && user && pass);

  let maskedUser: string | undefined = undefined;
  if (user) {
    const atIdx = user.indexOf("@");
    if (atIdx > 2) {
      maskedUser = `${user.substring(0, 2)}***${user.substring(atIdx)}`;
    } else {
      maskedUser = user;
    }
  }

  return {
    isConfigured,
    host: host || undefined,
    user: maskedUser,
    defaultTo: defaultTo || undefined,
  };
}

/**
 * Version B: Sendet die Bedarfsliste direkt per SMTP als formatierte HTML-E-Mail
 */
export async function sendBedarfslisteSmtp(data: SendBedarfsMailInput): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  try {
    const to = data.to?.trim();
    if (!to || !to.includes("@")) {
      return { success: false, error: "Bitte gib eine gültige Empfänger-E-Mail-Adresse an." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Keine Positionen für den E-Mail-Versand ausgewählt." };
    }

    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.SMTP_FROM?.trim() || user || `LagerLurch <noreply@lagerlurch.local>`;

    if (!host || !user || !pass) {
      return {
        success: false,
        error:
          "SMTP ist noch nicht konfiguriert. Bitte trage SMTP_HOST, SMTP_USER und SMTP_PASS in deiner .env-Datei ein.",
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const dateStr = new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const subject =
      data.subject?.trim() ||
      `Lagerbestands-Meldung: Nachbestellung erforderlich (${data.items.length} Positionen) – ${new Date().toLocaleDateString("de-DE")}`;

    const textContent = await getFormattedBedarfsText(data.items, data.notiz);
    const htmlContent = buildHtmlMail(data.items, data.notiz, dateStr);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    await logActivity({
      bereich: "OFFICE",
      aktion: "BEDARFS_MAIL_GESENDET",
      beschreibung: `Bedarfsliste mit ${data.items.length} Positionen per SMTP an "${to}" gesendet.`,
      details: `Betreff: ${subject}${data.notiz ? ` | Notiz: ${data.notiz}` : ""}`,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Fehler beim SMTP-Versand:", error);
    return {
      success: false,
      error: error.message || "E-Mail konnte nicht über den SMTP-Server versendet werden.",
    };
  }
}

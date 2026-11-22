# Lagerliste 📦
### Lagerbestandsführung & Techniker-Materialauswahl

Lagerliste ist eine moderne Webanwendung für das Lagermanagement mit 3 maßgeschneiderten Oberflächen:

---

## 🌐 Die 3 Oberflächen (Routen)

| Route | Bereich | Zielgruppe & Berechtigungen |
| :--- | :--- | :--- |
| **[`/techniker`](http://localhost:3001/techniker)** | **Techniker-Assistent** | **100% Mobile-Ready:** Material & Variante wählen, Artikelnummer ablesen, Schnell-Mengenauswahl und direkte Buchung über **„Ausgabe (Entnehmen)“** oder **„Einnahme (Einlagern)“**. |
| **[`/office`](http://localhost:3001/office)** | **Office-Übersicht** | **Read-Only:** Alle Materialien, Varianten, Artikelnummern, Mindestbestände und Lagerbestände einsehen und durchsuchen (geschützt vor versehentlichen Änderungen). |
| **[`/admin`](http://localhost:3001/admin)** | **Admin-Verwaltung** | **Vollzugriff (CRUD):** Materialien und Varianten anlegen, bearbeiten und löschen sowie den globalen Variantenstamm pflegen. |
| **[`/`](http://localhost:3001)** | **Portal & Rollenauswahl** | Startseite mit Übersicht der Kennzahlen und direkten Links zu allen 3 Bereichen. |

---

## 🚀 How-To: Im Terminal starten

### 1. In das Projektverzeichnis wechseln
```bash
cd Lagerliste
```

### 2. Entwicklungsserver starten
```bash
npm run dev
```

Sobald im Terminal `✓ Ready` steht, ist die App im Browser erreichbar (standardmäßig auf Port 3000 oder 3001).

### 3. Server stoppen
Im Terminal `Ctrl + C` drücken.

---

## 📱 Mobile Techniker-Funktionen (`/techniker`)
- **Schritt 1:** Material auswählen (inkl. Schnellsuche).
- **Schritt 2:** Variante auswählen (große touch-freundliche Kacheln mit Live-Bestandsanzeige).
- **Schritt 3:** Menge festlegen (über `[-]` / `[+]`, Zahleneingabe oder Schnelltasten `1`, `2`, `5`, `10`).
- **Schritt 4:** Über zwei große Buttons buchen:
  - 🔴 **Ausgabe** (Bestand wird reduziert, Prüfung auf ausreichenden Bestand)
  - 🟢 **Einnahme** (Bestand wird erhöht / eingelagert)
- **Automatische Prüfung im Hintergrund:** Mindestbestand-Ampel, Warnung bei Meldebestand-Unterschreitung und 1-Klick-Kopieren der Artikelnummer.

---

## 🛠️ Nützliche Terminal-Befehle

| Befehl | Beschreibung |
| :--- | :--- |
| `npm run dev` | Startet den Entwicklungsserver mit Hot-Reloading. |
| `node prisma/seed.mjs` | Setzt die Datenbank mit praxisnahen Testdaten zurück oder ergänzt diese. |
| `npx prisma studio` | Startet eine Weboberfläche zur direkten Inspektion aller SQLite-Tabellen. |
| `npm run build` | Erstellt einen produktionsreifen, optimierten Build. |
| `npm start` | Startet den zuvor gebauten Produktions-Server. |

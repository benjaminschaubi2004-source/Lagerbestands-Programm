const { Pool } = require("pg");
require("dotenv").config();

const rawCsvData = `Material,Variante,Ist Bestand,Mindestbestand
T5,10Nm,4,5
T5,20Nm,11,6
T5,30Nm,10,7
T5,50Nm,4,8
T5 Auto,10Nm,15,16
T5 Auto,20Nm,14,7
T5 Auto,35Nm,12,7
T5 Ebhz,10Nm,5,5
T5 Ebhz,20Nm,9,6
T5 Ebhz,35Nm,6,7
Wandsender,Ebhz,16,8
Wandsender ,Ehz,,16
Handsender 1-Kanal,Ebhz,9,7
Handsender 5-Kanal,Ebhz,4,7
Handsender,ehz,1,5
Zeitschaltuhr,Vestamatic,2,6
Lichtsennsor für Zeitschaltuhr,1m,1,7
"Lichtsennsor für Zeitschaltuhr



",2m,0,8
"Lichtsennsor für Zeitschaltuhr



",3m,9,16
"Lichtsennsor für Zeitschaltuhr



",5m,3,7
"Lichtsennsor für Zeitschaltuhr



",8m,1,7
Wago-Klemmen,4er,2,7
Wago-Klemmen,3er,4,5
Wago-Klemmen,2er,1,6
Aderenthülsen,"0,75mm²",10,7
Anschlussklemmen (Lüsterklemmen),"1,5-6qmm",18,8
Haft-clipse (Nagelschellen),7-12mm,1,16
Winkelstecker (Stecker),,12,7
Abzweigdose,89x43x37mm grau,13,5
Abzweigdose,85x85x37mm grau,19,6
Abzweigdose,85x85x37mm Schwarz,12,7
Abzweigdose,85x85x37mm,22,8
Knebelschalter,Unterputz,18,16
Wippschalter,6229-2R-UW,10,7
Knebelschalter,Aufputz klein,8,7
Wippschalter,Für Aussen,12,5
Steckdose,Für Aussen,8,6
Wipptaster,Für Aussen,5,7`;

// Parse CSV
function parseCSV(text) {
  const lines = text.split("\n");
  const rows = [];
  let inQuotes = false;
  let currentField = "";
  let currentRow = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((f) => f.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim() !== "")) {
      rows.push(currentRow);
    }
  }
  return rows;
}

// Generate unique clean SKU
const usedSkus = new Set();
function generateSKU(materialName, varianteName) {
  const cleanMat = materialName
    .toUpperCase()
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ß/g, "SS")
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const cleanVar = varianteName
    .toUpperCase()
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ß/g, "SS")
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  let baseSku = cleanVar ? `${cleanMat}-${cleanVar}` : `${cleanMat}-STD`;
  // Limit length
  if (baseSku.length > 25) {
    baseSku = baseSku.substring(0, 25).replace(/-$/, "");
  }

  let finalSku = baseSku;
  let counter = 1;
  while (usedSkus.has(finalSku)) {
    finalSku = `${baseSku}-${counter}`;
    counter++;
  }
  usedSkus.add(finalSku);
  return finalSku;
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL ist nicht in .env definiert");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Verbinde mit Supabase...");
  const client = await pool.connect();

  try {
    const rawRows = parseCSV(rawCsvData);
    // Remove header
    const dataRows = rawRows.slice(1);

    console.log(`Gelesene Zeilen aus CSV: ${dataRows.length}`);

    // Map and sanitize
    const records = [];
    for (const r of dataRows) {
      const materialName = (r[0] || "").trim().replace(/\s+/g, " ");
      let varianteName = (r[1] || "").trim().replace(/\s+/g, " ");
      if (!varianteName) {
        varianteName = "Standard";
      }

      const istStr = (r[2] || "").trim();
      const minStr = (r[3] || "").trim();

      const istBestand = istStr === "" ? 0 : parseInt(istStr, 10) || 0;
      const mindestbestand = minStr === "" ? 0 : parseInt(minStr, 10) || 0;

      if (materialName) {
        records.push({
          materialName,
          varianteName,
          istBestand,
          mindestbestand,
        });
      }
    }

    console.log(`Gültige Datensätze: ${records.length}`);

    await client.query("BEGIN");

    // 1. Lösche alle bisherigen Testdaten
    console.log("Lösche alte Testdaten aus Supabase...");
    await client.query('TRUNCATE TABLE "MaterialVariante", "Material", "Groesse" RESTART IDENTITY CASCADE;');

    // 2. Sammle eindeutige Größen und Materialien
    const uniqueGroessen = [...new Set(records.map((r) => r.varianteName))];
    const uniqueMaterialien = [...new Set(records.map((r) => r.materialName))];

    console.log(`Erstelle ${uniqueGroessen.length} Varianten/Größen...`);
    const groesseMap = new Map();
    for (const gName of uniqueGroessen) {
      const res = await client.query(
        'INSERT INTO "Groesse" ("name", "createdAt", "updatedAt") VALUES ($1, NOW(), NOW()) RETURNING id',
        [gName]
      );
      groesseMap.set(gName, res.rows[0].id);
    }

    console.log(`Erstelle ${uniqueMaterialien.length} Materialien...`);
    const materialMap = new Map();
    for (const mName of uniqueMaterialien) {
      const res = await client.query(
        'INSERT INTO "Material" ("name", "createdAt", "updatedAt") VALUES ($1, NOW(), NOW()) RETURNING id',
        [mName]
      );
      materialMap.set(mName, res.rows[0].id);
    }

    // 3. Erstelle MaterialVarianten
    console.log(`Füge ${records.length} Material-Varianten ein...`);
    for (const rec of records) {
      const matId = materialMap.get(rec.materialName);
      const gId = groesseMap.get(rec.varianteName);
      const sku = generateSKU(rec.materialName, rec.varianteName);

      await client.query(
        `INSERT INTO "MaterialVariante" 
          ("artikelnummer", "mindestbestand", "istBestand", "materialId", "groesseId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [sku, rec.mindestbestand, rec.istBestand, matId, gId]
      );
    }

    await client.query("COMMIT");
    console.log("✓ Alle Daten wurden erfolgreich in Supabase aktualisiert!");

    // Prüfung
    const countCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM "Material") as mat_count,
        (SELECT COUNT(*) FROM "Groesse") as groesse_count,
        (SELECT COUNT(*) FROM "MaterialVariante") as var_count
    `);
    console.log("Zusammenfassung in Supabase:", countCheck.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Fehler beim Aktualisieren:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


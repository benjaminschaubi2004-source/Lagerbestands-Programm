import Database from "better-sqlite3";

const db = new Database("dev.db");

console.log("Seeding Database...");

// Initialisiere Größen
const sizes = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "Einheitsgröße",
  'DN 15 (1/2")',
  'DN 20 (3/4")',
  'DN 25 (1")',
  "M6",
  "M8",
  "M10",
  "M12",
];

const insertSize = db.prepare(`
  INSERT OR IGNORE INTO Groesse (name, createdAt, updatedAt)
  VALUES (?, datetime('now'), datetime('now'))
`);

for (const name of sizes) {
  insertSize.run(name);
}

const getGroesseId = (name) => {
  return db.prepare(`SELECT id FROM Groesse WHERE name = ?`).get(name)?.id;
};

const insertMaterial = db.prepare(`
  INSERT INTO Material (name, beschreibung, createdAt, updatedAt)
  VALUES (?, ?, datetime('now'), datetime('now'))
`);

const insertVariante = db.prepare(`
  INSERT INTO MaterialVariante (artikelnummer, mindestbestand, istBestand, materialId, groesseId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

// 1. Arbeitshandschuhe
const mat1 = insertMaterial.run(
  "Arbeitshandschuhe Nitril",
  "Robuste Montagehandschuhe mit griffiger Nitrilbeschichtung für Werkstatt und Montage"
);
const mat1Id = Number(mat1.lastInsertRowid);
insertVariante.run("GLV-NIT-S", 20, 35, mat1Id, getGroesseId("S"));
insertVariante.run("GLV-NIT-M", 50, 48, mat1Id, getGroesseId("M"));
insertVariante.run("GLV-NIT-L", 50, 62, mat1Id, getGroesseId("L"));
insertVariante.run("GLV-NIT-XL", 25, 14, mat1Id, getGroesseId("XL"));

// 2. Sicherheitsschuhe S3
const mat2 = insertMaterial.run(
  "Sicherheitsschuhe S3",
  "Knöchelhoher Sicherheitsschuh mit Stahlkappe und Durchtrittschutz, wasserabweisend"
);
const mat2Id = Number(mat2.lastInsertRowid);
insertVariante.run("SHOE-S3-M", 5, 8, mat2Id, getGroesseId("M"));
insertVariante.run("SHOE-S3-L", 5, 3, mat2Id, getGroesseId("L"));
insertVariante.run("SHOE-S3-XL", 3, 4, mat2Id, getGroesseId("XL"));

// 3. Sechskantschraube DIN 933
const mat3 = insertMaterial.run(
  "Sechskantschraube DIN 933 verzinkt",
  "Vollgewindeschraube Güteklasse 8.8, galvanisch verzinkt"
);
const mat3Id = Number(mat3.lastInsertRowid);
insertVariante.run("SCR-933-M6", 200, 450, mat3Id, getGroesseId("M6"));
insertVariante.run("SCR-933-M8", 500, 600, mat3Id, getGroesseId("M8"));
insertVariante.run("SCR-933-M10", 250, 180, mat3Id, getGroesseId("M10"));

// 4. Kugelhahn Messing
const mat4 = insertMaterial.run(
  "Kugelhahn Messing vernickelt",
  "Absperrhahn für Wasser und Druckluft mit vollem Durchgang und rotem Hebelgriff"
);
const mat4Id = Number(mat4.lastInsertRowid);
insertVariante.run("VALVE-BR-15", 15, 22, mat4Id, getGroesseId('DN 15 (1/2")'));
insertVariante.run("VALVE-BR-20", 25, 25, mat4Id, getGroesseId('DN 20 (3/4")'));
insertVariante.run("VALVE-BR-25", 10, 9, mat4Id, getGroesseId('DN 25 (1")'));

// 5. Schutzbrille
const mat5 = insertMaterial.run(
  "Schutzbrille klar UV-400",
  "Kratzfeste Panoramascheibe mit verstellbaren Bügeln nach EN 166"
);
const mat5Id = Number(mat5.lastInsertRowid);
insertVariante.run("EYE-PROT-STD", 30, 45, mat5Id, getGroesseId("Einheitsgröße"));

console.log("Seeding mit Materialvarianten erfolgreich abgeschlossen.");

-- ====================================================================
-- LagerLurch: Aktualisierung der echten Testdaten in Supabase
-- ====================================================================
-- 1. Alle bisherigen Daten löschen und Zähler zurücksetzen
TRUNCATE TABLE "MaterialVariante", "Material", "Groesse" RESTART IDENTITY CASCADE;

-- 2. Varianten / Größen einfügen
INSERT INTO "Groesse" ("id", "name", "createdAt", "updatedAt") VALUES
  (1, '10Nm', NOW(), NOW()),
  (2, '20Nm', NOW(), NOW()),
  (3, '30Nm', NOW(), NOW()),
  (4, '50Nm', NOW(), NOW()),
  (5, '35Nm', NOW(), NOW()),
  (6, 'Ebhz', NOW(), NOW()),
  (7, 'Ehz', NOW(), NOW()),
  (8, 'ehz', NOW(), NOW()),
  (9, 'Vestamatic', NOW(), NOW()),
  (10, '1m', NOW(), NOW()),
  (11, '2m', NOW(), NOW()),
  (12, '3m', NOW(), NOW()),
  (13, '5m', NOW(), NOW()),
  (14, '8m', NOW(), NOW()),
  (15, '4er', NOW(), NOW()),
  (16, '3er', NOW(), NOW()),
  (17, '2er', NOW(), NOW()),
  (18, '0,75mm²', NOW(), NOW()),
  (19, '1,5-6qmm', NOW(), NOW()),
  (20, '7-12mm', NOW(), NOW()),
  (21, 'Standard', NOW(), NOW()),
  (22, '89x43x37mm grau', NOW(), NOW()),
  (23, '85x85x37mm grau', NOW(), NOW()),
  (24, '85x85x37mm Schwarz', NOW(), NOW()),
  (25, '85x85x37mm', NOW(), NOW()),
  (26, 'Unterputz', NOW(), NOW()),
  (27, '6229-2R-UW', NOW(), NOW()),
  (28, 'Aufputz klein', NOW(), NOW()),
  (29, 'Für Aussen', NOW(), NOW());

-- 3. Materialien einfügen
INSERT INTO "Material" ("id", "name", "beschreibung", "createdAt", "updatedAt") VALUES
  (1, 'T5', NULL, NOW(), NOW()),
  (2, 'T5 Auto', NULL, NOW(), NOW()),
  (3, 'T5 Ebhz', NULL, NOW(), NOW()),
  (4, 'Wandsender', NULL, NOW(), NOW()),
  (5, 'Handsender 1-Kanal', NULL, NOW(), NOW()),
  (6, 'Handsender 5-Kanal', NULL, NOW(), NOW()),
  (7, 'Handsender', NULL, NOW(), NOW()),
  (8, 'Zeitschaltuhr', NULL, NOW(), NOW()),
  (9, 'Lichtsennsor für Zeitschaltuhr', NULL, NOW(), NOW()),
  (10, 'Wago-Klemmen', NULL, NOW(), NOW()),
  (11, 'Aderenthülsen', NULL, NOW(), NOW()),
  (12, 'Anschlussklemmen (Lüsterklemmen)', NULL, NOW(), NOW()),
  (13, 'Haft-clipse (Nagelschellen)', NULL, NOW(), NOW()),
  (14, 'Winkelstecker (Stecker)', NULL, NOW(), NOW()),
  (15, 'Abzweigdose', NULL, NOW(), NOW()),
  (16, 'Knebelschalter', NULL, NOW(), NOW()),
  (17, 'Wippschalter', NULL, NOW(), NOW()),
  (18, 'Steckdose', NULL, NOW(), NOW()),
  (19, 'Wipptaster', NULL, NOW(), NOW());

-- 4. Material-Varianten mit Artikelnummer, Mindestbestand & Ist-Bestand einfügen
INSERT INTO "MaterialVariante" ("artikelnummer", "mindestbestand", "istBestand", "materialId", "groesseId", "createdAt", "updatedAt") VALUES
  ('T5-10NM', 5, 4, 1, 1, NOW(), NOW()),
  ('T5-20NM', 6, 11, 1, 2, NOW(), NOW()),
  ('T5-30NM', 7, 10, 1, 3, NOW(), NOW()),
  ('T5-50NM', 8, 4, 1, 4, NOW(), NOW()),
  ('T5-AUTO-10NM', 16, 15, 2, 1, NOW(), NOW()),
  ('T5-AUTO-20NM', 7, 14, 2, 2, NOW(), NOW()),
  ('T5-AUTO-35NM', 7, 12, 2, 5, NOW(), NOW()),
  ('T5-EBHZ-10NM', 5, 5, 3, 1, NOW(), NOW()),
  ('T5-EBHZ-20NM', 6, 9, 3, 2, NOW(), NOW()),
  ('T5-EBHZ-35NM', 7, 6, 3, 5, NOW(), NOW()),
  ('WANDSENDER-EBHZ', 8, 16, 4, 6, NOW(), NOW()),
  ('WANDSENDER-EHZ', 16, 0, 4, 7, NOW(), NOW()),
  ('HANDSENDER-1-KANAL-EBHZ', 7, 9, 5, 6, NOW(), NOW()),
  ('HANDSENDER-5-KANAL-EBHZ', 7, 4, 6, 6, NOW(), NOW()),
  ('HANDSENDER-EHZ', 5, 1, 7, 8, NOW(), NOW()),
  ('ZEITSCHALTUHR-VESTAMATIC', 6, 2, 8, 9, NOW(), NOW()),
  ('LICHTSENNSOR-FUER-ZEITSCH', 7, 1, 9, 10, NOW(), NOW()),
  ('LICHTSENNSOR-FUER-ZEITSCH-1', 8, 0, 9, 11, NOW(), NOW()),
  ('LICHTSENNSOR-FUER-ZEITSCH-2', 16, 9, 9, 12, NOW(), NOW()),
  ('LICHTSENNSOR-FUER-ZEITSCH-3', 7, 3, 9, 13, NOW(), NOW()),
  ('LICHTSENNSOR-FUER-ZEITSCH-4', 7, 1, 9, 14, NOW(), NOW()),
  ('WAGO-KLEMMEN-4ER', 7, 2, 10, 15, NOW(), NOW()),
  ('WAGO-KLEMMEN-3ER', 5, 4, 10, 16, NOW(), NOW()),
  ('WAGO-KLEMMEN-2ER', 6, 1, 10, 17, NOW(), NOW()),
  ('ADERENTHUELSEN-0-75MM', 7, 10, 11, 18, NOW(), NOW()),
  ('ANSCHLUSSKLEMMEN-LUESTERK', 8, 18, 12, 19, NOW(), NOW()),
  ('HAFT-CLIPSE-NAGELSCHELLEN', 16, 1, 13, 20, NOW(), NOW()),
  ('WINKELSTECKER-STECKER-STA', 7, 12, 14, 21, NOW(), NOW()),
  ('ABZWEIGDOSE-89X43X37MM-GR', 5, 13, 15, 22, NOW(), NOW()),
  ('ABZWEIGDOSE-85X85X37MM-GR', 6, 19, 15, 23, NOW(), NOW()),
  ('ABZWEIGDOSE-85X85X37MM-SC', 7, 12, 15, 24, NOW(), NOW()),
  ('ABZWEIGDOSE-85X85X37MM', 8, 22, 15, 25, NOW(), NOW()),
  ('KNEBELSCHALTER-UNTERPUTZ', 16, 18, 16, 26, NOW(), NOW()),
  ('WIPPSCHALTER-6229-2R-UW', 7, 10, 17, 27, NOW(), NOW()),
  ('KNEBELSCHALTER-AUFPUTZ-KL', 7, 8, 16, 28, NOW(), NOW()),
  ('WIPPSCHALTER-FUER-AUSSEN', 5, 12, 17, 29, NOW(), NOW()),
  ('STECKDOSE-FUER-AUSSEN', 6, 8, 18, 29, NOW(), NOW()),
  ('WIPPTASTER-FUER-AUSSEN', 7, 5, 19, 29, NOW(), NOW());

-- Sequenzen synchronisieren
SELECT setval(pg_get_serial_sequence('"Groesse"', 'id'), COALESCE(MAX(id), 1)) FROM "Groesse";
SELECT setval(pg_get_serial_sequence('"Material"', 'id'), COALESCE(MAX(id), 1)) FROM "Material";
SELECT setval(pg_get_serial_sequence('"MaterialVariante"', 'id'), COALESCE(MAX(id), 1)) FROM "MaterialVariante";

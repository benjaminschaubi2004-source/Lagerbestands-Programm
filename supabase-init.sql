-- ====================================================================
-- LagerLurch – Supabase Initialisierungs-Skript (PostgreSQL DDL & Seed)
-- ====================================================================
-- Dieses Skript kann 1:1 im Supabase SQL-Editor ausgeführt werden.
-- Navigiere dazu im Supabase Dashboard zu: SQL Editor -> "New query" -> Ausführen

-- 1. Schema & Tabellen anlegen
-- --------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS "public";

-- Tabelle: Groesse (Variantenstamm)
CREATE TABLE IF NOT EXISTS "Groesse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Groesse_pkey" PRIMARY KEY ("id")
);

-- Tabelle: Material (Artikelstamm)
CREATE TABLE IF NOT EXISTS "Material" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "beschreibung" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- Tabelle: MaterialVariante (Verknüpfung mit Artikelnummer, Mindestbestand & Ist-Bestand)
CREATE TABLE IF NOT EXISTS "MaterialVariante" (
    "id" SERIAL NOT NULL,
    "artikelnummer" TEXT NOT NULL,
    "mindestbestand" INTEGER NOT NULL DEFAULT 0,
    "istBestand" INTEGER NOT NULL DEFAULT 0,
    "isBestellt" BOOLEAN NOT NULL DEFAULT FALSE,
    "bestelltAm" TIMESTAMP(3),
    "bestelltMenge" INTEGER,
    "bestelltNotiz" TEXT,
    "materialId" INTEGER NOT NULL,
    "groesseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialVariante_pkey" PRIMARY KEY ("id")
);

-- Tabelle: Auto (Fuhrpark-Verwaltung für Office)
CREATE TABLE IF NOT EXISTS "Auto" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "kennzeichen" TEXT,
    "modell" TEXT,
    "defekte" TEXT,
    "tuevTermin" TIMESTAMP(3),
    "anmerkungen" TEXT,
    "kilometerstand" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'BEREIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Auto_name_idx" ON "Auto"("name");

-- 2. Indizes & Constraints anlegen
-- --------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "Groesse_name_key" ON "Groesse"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Material_name_key" ON "Material"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "MaterialVariante_artikelnummer_key" ON "MaterialVariante"("artikelnummer");
CREATE UNIQUE INDEX IF NOT EXISTS "MaterialVariante_materialId_groesseId_key" ON "MaterialVariante"("materialId", "groesseId");

-- Fremdschlüssel: Löschen eines Materials löscht dessen Varianten (Cascade)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaterialVariante_materialId_fkey'
    ) THEN
        ALTER TABLE "MaterialVariante" 
        ADD CONSTRAINT "MaterialVariante_materialId_fkey" 
        FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Fremdschlüssel: Löschschutz für Größen (Restrict)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaterialVariante_groesseId_fkey'
    ) THEN
        ALTER TABLE "MaterialVariante" 
        ADD CONSTRAINT "MaterialVariante_groesseId_fkey" 
        FOREIGN KEY ("groesseId") REFERENCES "Groesse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Initiale Testdaten (Seeding)
-- --------------------------------------------------------------------

-- Größen einfügen
INSERT INTO "Groesse" ("name", "createdAt", "updatedAt") VALUES
    ('XS', NOW(), NOW()),
    ('S', NOW(), NOW()),
    ('M', NOW(), NOW()),
    ('L', NOW(), NOW()),
    ('XL', NOW(), NOW()),
    ('XXL', NOW(), NOW()),
    ('Einheitsgröße', NOW(), NOW()),
    ('DN 15 (1/2")', NOW(), NOW()),
    ('DN 20 (3/4")', NOW(), NOW()),
    ('DN 25 (1")', NOW(), NOW()),
    ('M6', NOW(), NOW()),
    ('M8', NOW(), NOW()),
    ('M10', NOW(), NOW()),
    ('M12', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Materialien & Varianten einfügen
DO $$
DECLARE
    v_mat_id INT;
    v_g_s INT;
    v_g_m INT;
    v_g_l INT;
    v_g_xl INT;
    v_g_m6 INT;
    v_g_m8 INT;
    v_g_m10 INT;
    v_g_dn15 INT;
    v_g_dn20 INT;
    v_g_dn25 INT;
    v_g_std INT;
BEGIN
    -- Größen-IDs holen
    SELECT id INTO v_g_s FROM "Groesse" WHERE "name" = 'S';
    SELECT id INTO v_g_m FROM "Groesse" WHERE "name" = 'M';
    SELECT id INTO v_g_l FROM "Groesse" WHERE "name" = 'L';
    SELECT id INTO v_g_xl FROM "Groesse" WHERE "name" = 'XL';
    SELECT id INTO v_g_m6 FROM "Groesse" WHERE "name" = 'M6';
    SELECT id INTO v_g_m8 FROM "Groesse" WHERE "name" = 'M8';
    SELECT id INTO v_g_m10 FROM "Groesse" WHERE "name" = 'M10';
    SELECT id INTO v_g_dn15 FROM "Groesse" WHERE "name" = 'DN 15 (1/2")';
    SELECT id INTO v_g_dn20 FROM "Groesse" WHERE "name" = 'DN 20 (3/4")';
    SELECT id INTO v_g_dn25 FROM "Groesse" WHERE "name" = 'DN 25 (1")';
    SELECT id INTO v_g_std FROM "Groesse" WHERE "name" = 'Einheitsgröße';

    -- 1. Arbeitshandschuhe Nitril
    INSERT INTO "Material" ("name", "beschreibung", "createdAt", "updatedAt")
    VALUES ('Arbeitshandschuhe Nitril', 'Robuste Montagehandschuhe mit griffiger Nitrilbeschichtung', NOW(), NOW())
    ON CONFLICT ("name") DO UPDATE SET "beschreibung" = EXCLUDED."beschreibung"
    RETURNING id INTO v_mat_id;

    INSERT INTO "MaterialVariante" ("artikelnummer", "mindestbestand", "istBestand", "materialId", "groesseId", "createdAt", "updatedAt")
    VALUES
        ('GLV-NIT-S', 20, 35, v_mat_id, v_g_s, NOW(), NOW()),
        ('GLV-NIT-M', 50, 48, v_mat_id, v_g_m, NOW(), NOW()),
        ('GLV-NIT-L', 50, 62, v_mat_id, v_g_l, NOW(), NOW()),
        ('GLV-NIT-XL', 25, 14, v_mat_id, v_g_xl, NOW(), NOW())
    ON CONFLICT ("artikelnummer") DO NOTHING;

    -- 2. Sicherheitsschuhe S3
    INSERT INTO "Material" ("name", "beschreibung", "createdAt", "updatedAt")
    VALUES ('Sicherheitsschuhe S3', 'Knöchelhoher Sicherheitsschuh mit Stahlkappe und Durchtrittschutz', NOW(), NOW())
    ON CONFLICT ("name") DO UPDATE SET "beschreibung" = EXCLUDED."beschreibung"
    RETURNING id INTO v_mat_id;

    INSERT INTO "MaterialVariante" ("artikelnummer", "mindestbestand", "istBestand", "materialId", "groesseId", "createdAt", "updatedAt")
    VALUES
        ('SHOE-S3-M', 5, 8, v_mat_id, v_g_m, NOW(), NOW()),
        ('SHOE-S3-L', 5, 3, v_mat_id, v_g_l, NOW(), NOW()),
        ('SHOE-S3-XL', 3, 4, v_mat_id, v_g_xl, NOW(), NOW())
    ON CONFLICT ("artikelnummer") DO NOTHING;

    -- 3. Sechskantschraube DIN 933
    INSERT INTO "Material" ("name", "beschreibung", "createdAt", "updatedAt")
    VALUES ('Sechskantschraube DIN 933 verzinkt', 'Vollgewindeschraube Güteklasse 8.8, galvanisch verzinkt', NOW(), NOW())
    ON CONFLICT ("name") DO UPDATE SET "beschreibung" = EXCLUDED."beschreibung"
    RETURNING id INTO v_mat_id;

    INSERT INTO "MaterialVariante" ("artikelnummer", "mindestbestand", "istBestand", "materialId", "groesseId", "createdAt", "updatedAt")
    VALUES
        ('SCR-933-M6', 200, 450, v_mat_id, v_g_m6, NOW(), NOW()),
        ('SCR-933-M8', 500, 600, v_mat_id, v_g_m8, NOW(), NOW()),
        ('SCR-933-M10', 250, 180, v_mat_id, v_g_m10, NOW(), NOW())
    ON CONFLICT ("artikelnummer") DO NOTHING;

    -- 4. Kugelhahn Messing
    INSERT INTO "Material" ("name", "beschreibung", "createdAt", "updatedAt")
    VALUES ('Kugelhahn Messing vernickelt', 'Absperrhahn mit vollem Durchgang und Hebelgriff', NOW(), NOW())
    ON CONFLICT ("name") DO UPDATE SET "beschreibung" = EXCLUDED."beschreibung"
    RETURNING id INTO v_mat_id;

    INSERT INTO "MaterialVariante" ("artikelnummer", "mindestbestand", "istBestand", "materialId", "groesseId", "createdAt", "updatedAt")
    VALUES
        ('VALVE-BR-15', 15, 22, v_mat_id, v_g_dn15, NOW(), NOW()),
        ('VALVE-BR-20', 25, 25, v_mat_id, v_g_dn20, NOW(), NOW()),
        ('VALVE-BR-25', 10, 9, v_mat_id, v_g_dn25, NOW(), NOW())
    ON CONFLICT ("artikelnummer") DO NOTHING;

    -- 5. Schutzbrille klar
    INSERT INTO "Material" ("name", "beschreibung", "createdAt", "updatedAt")
    VALUES ('Schutzbrille klar UV-400', 'Kratzfeste Panoramascheibe mit verstellbaren Bügeln', NOW(), NOW())
    ON CONFLICT ("name") DO UPDATE SET "beschreibung" = EXCLUDED."beschreibung"
    RETURNING id INTO v_mat_id;

    INSERT INTO "MaterialVariante" ("artikelnummer", "mindestbestand", "istBestand", "materialId", "groesseId", "createdAt", "updatedAt")
    VALUES
        ('EYE-PROT-STD', 30, 45, v_mat_id, v_g_std, NOW(), NOW())
    ON CONFLICT ("artikelnummer") DO NOTHING;

END $$;


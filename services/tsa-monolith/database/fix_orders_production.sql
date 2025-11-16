-- ================================================
-- Script SQL d'urgence pour ajouter les colonnes manquantes à la table orders
-- À exécuter directement sur la base PostgreSQL de production
-- ================================================

-- Vérifier si les colonnes existent déjà et les ajouter si nécessaire

-- 1. Ajouter customer_name (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name VARCHAR(200) NOT NULL DEFAULT '';
        RAISE NOTICE 'Colonne customer_name ajoutée';
    ELSE
        RAISE NOTICE 'Colonne customer_name existe déjà';
    END IF;
END $$;

-- 2. Ajouter customer_email (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_email VARCHAR(200) NOT NULL DEFAULT '';
        RAISE NOTICE 'Colonne customer_email ajoutée';
    ELSE
        RAISE NOTICE 'Colonne customer_email existe déjà';
    END IF;
END $$;

-- 3. Ajouter customer_phone (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(20) NOT NULL DEFAULT '';
        RAISE NOTICE 'Colonne customer_phone ajoutée';
    ELSE
        RAISE NOTICE 'Colonne customer_phone existe déjà';
    END IF;
END $$;

-- 4. Ajouter subtotal (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0);
        RAISE NOTICE 'Colonne subtotal ajoutée';
    ELSE
        RAISE NOTICE 'Colonne subtotal existe déjà';
    END IF;
END $$;

-- 5. Ajouter shipping_cost (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'shipping_cost'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(12, 2) DEFAULT 0;
        RAISE NOTICE 'Colonne shipping_cost ajoutée';
    ELSE
        RAISE NOTICE 'Colonne shipping_cost existe déjà';
    END IF;
END $$;

-- 6. Ajouter tax (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'tax'
    ) THEN
        ALTER TABLE orders ADD COLUMN tax DECIMAL(12, 2) DEFAULT 0;
        RAISE NOTICE 'Colonne tax ajoutée';
    ELSE
        RAISE NOTICE 'Colonne tax existe déjà';
    END IF;
END $$;

-- 7. Ajouter payment_reference (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(100) NULL;
        RAISE NOTICE 'Colonne payment_reference ajoutée';
    ELSE
        RAISE NOTICE 'Colonne payment_reference existe déjà';
    END IF;
END $$;

-- 8. Ajouter tracking_number (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) NULL;
        RAISE NOTICE 'Colonne tracking_number ajoutée';
    ELSE
        RAISE NOTICE 'Colonne tracking_number existe déjà';
    END IF;
END $$;

-- 9. Ajouter paid_at (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ NULL;
        RAISE NOTICE 'Colonne paid_at ajoutée';
    ELSE
        RAISE NOTICE 'Colonne paid_at existe déjà';
    END IF;
END $$;

-- 10. Ajouter shipped_at (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'shipped_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMPTZ NULL;
        RAISE NOTICE 'Colonne shipped_at ajoutée';
    ELSE
        RAISE NOTICE 'Colonne shipped_at existe déjà';
    END IF;
END $$;

-- 11. Ajouter delivered_at (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMPTZ NULL;
        RAISE NOTICE 'Colonne delivered_at ajoutée';
    ELSE
        RAISE NOTICE 'Colonne delivered_at existe déjà';
    END IF;
END $$;

-- 12. Ajouter cancelled_at (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMPTZ NULL;
        RAISE NOTICE 'Colonne cancelled_at ajoutée';
    ELSE
        RAISE NOTICE 'Colonne cancelled_at existe déjà';
    END IF;
END $$;

-- Vérifier la structure finale de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

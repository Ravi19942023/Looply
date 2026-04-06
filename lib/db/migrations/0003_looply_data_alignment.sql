ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'USD';

ALTER TABLE "CustomerMetric"
ALTER COLUMN "churnRiskScore" TYPE numeric(4, 2)
USING CASE
  WHEN "churnRiskScore" > 1 THEN round(("churnRiskScore"::numeric / 100), 2)
  ELSE round("churnRiskScore"::numeric, 2)
END;

ALTER TABLE "CustomerMetric"
ADD COLUMN IF NOT EXISTS "recencyScore" numeric(4, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "frequencyScore" numeric(4, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "monetaryScore" numeric(4, 2) NOT NULL DEFAULT 0;

ALTER TABLE "Transaction"
ADD COLUMN IF NOT EXISTS "productId" uuid,
ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Transaction_productId_Product_id_fk'
  ) THEN
    ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_productId_Product_id_fk"
    FOREIGN KEY ("productId") REFERENCES "Product"("id");
  END IF;
END $$;

INSERT INTO "Product" ("name", "category", "price", "currency", "createdAt", "updatedAt")
SELECT
  tx."product",
  'uncategorized',
  max(tx."amount"),
  'USD',
  now(),
  now()
FROM "Transaction" tx
LEFT JOIN "Product" p ON p."name" = tx."product"
WHERE p."id" IS NULL
GROUP BY tx."product";

UPDATE "Transaction" tx
SET
  "productId" = p."id",
  "currency" = COALESCE(tx."currency", p."currency", 'USD')
FROM "Product" p
WHERE p."name" = tx."product"
  AND tx."productId" IS NULL;

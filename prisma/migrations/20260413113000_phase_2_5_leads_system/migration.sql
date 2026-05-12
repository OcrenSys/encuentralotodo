-- CreateEnum
CREATE TYPE "AnalyticsEventName" AS ENUM ('lead_created');

-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'LOST';

-- CreateEnum
CREATE TYPE "LeadSource_new" AS ENUM ('WHATSAPP_CLICK', 'CALL_CLICK', 'CONTACT_CLICK', 'PROMOTION_CLICK', 'PRODUCT_CLICK');

-- AlterTable
ALTER TABLE "Lead"
    ADD COLUMN "notes" TEXT,
    ADD COLUMN "phone" TEXT,
    ADD COLUMN "productId" TEXT,
    ADD COLUMN "promotionId" TEXT,
    ADD COLUMN "source_new" "LeadSource_new";

ALTER TABLE "Lead"
    ALTER COLUMN "name" DROP NOT NULL;

UPDATE "Lead"
SET "source_new" = CASE "source"::TEXT
    WHEN 'WhatsApp' THEN 'WHATSAPP_CLICK'::"LeadSource_new"
    WHEN 'Promo' THEN 'PROMOTION_CLICK'::"LeadSource_new"
    WHEN 'Perfil' THEN 'CONTACT_CLICK'::"LeadSource_new"
    WHEN 'Formulario' THEN 'CONTACT_CLICK'::"LeadSource_new"
    ELSE 'CONTACT_CLICK'::"LeadSource_new"
END;

ALTER TABLE "Lead"
    ALTER COLUMN "source_new" SET NOT NULL;

ALTER TABLE "Lead"
    DROP COLUMN "source";

ALTER TABLE "Lead"
    RENAME COLUMN "source_new" TO "source";

DROP TYPE "LeadSource";
ALTER TYPE "LeadSource_new" RENAME TO "LeadSource";

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" "AnalyticsEventName" NOT NULL,
    "businessId" TEXT NOT NULL,
    "leadId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_businessId_status_createdAt_idx" ON "Lead"("businessId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_productId_idx" ON "Lead"("productId");

-- CreateIndex
CREATE INDEX "Lead_promotionId_idx" ON "Lead"("promotionId");

-- CreateIndex
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_businessId_createdAt_idx" ON "AnalyticsEvent"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_leadId_idx" ON "AnalyticsEvent"("leadId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
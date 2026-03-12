-- Add SLA and CSAT fields to support_tickets
ALTER TABLE "support_tickets" ADD COLUMN "sla_breach_at" TIMESTAMP(6);
ALTER TABLE "support_tickets" ADD COLUMN "csat_score" INTEGER;
ALTER TABLE "support_tickets" ADD COLUMN "csat_comment" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN "custom_fields" JSONB;

-- Create support_macros table for pre-defined agent response templates
CREATE TABLE "support_macros" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_macros_pkey" PRIMARY KEY ("id")
);

-- Add index for efficient macro lookups by creator
CREATE INDEX "idx_support_macros_created_by" ON "support_macros"("created_by");

-- Add foreign key constraint
ALTER TABLE "support_macros" ADD CONSTRAINT "support_macros_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

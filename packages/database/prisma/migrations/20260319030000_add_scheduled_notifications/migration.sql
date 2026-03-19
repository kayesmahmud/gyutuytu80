-- Scheduled Notifications table (admin-created notifications that fire at a future time)
CREATE TABLE "scheduled_notifications" (
    "id" SERIAL NOT NULL,
    "created_by" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'announcement',
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "image_url" VARCHAR(500),
    "target_audience" VARCHAR(50) NOT NULL DEFAULT 'all',
    "scheduled_for" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(6),
    "recipient_count" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "idx_scheduled_notifications_status" ON "scheduled_notifications"("status", "scheduled_for");
CREATE INDEX "idx_scheduled_notifications_created_by" ON "scheduled_notifications"("created_by");

-- Foreign key
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

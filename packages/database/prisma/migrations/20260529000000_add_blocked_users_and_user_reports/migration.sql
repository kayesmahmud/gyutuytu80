-- Blocked users: bidirectional messaging block
CREATE TABLE "blocked_users" (
    "id" SERIAL NOT NULL,
    "blocker_id" INTEGER NOT NULL,
    "blocked_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

-- User reports: reporting users from chat conversations
CREATE TABLE "user_reports" (
    "id" SERIAL NOT NULL,
    "reported_user_id" INTEGER NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "status" VARCHAR(20) DEFAULT 'pending',
    "admin_notes" TEXT,
    "conversation_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "resolved_by" INTEGER,
    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- Indexes: blocked_users
CREATE UNIQUE INDEX "idx_blocked_users_unique" ON "blocked_users"("blocker_id", "blocked_id");
CREATE INDEX "idx_blocked_users_blocker_id" ON "blocked_users"("blocker_id");
CREATE INDEX "idx_blocked_users_blocked_id" ON "blocked_users"("blocked_id");

-- Indexes: user_reports
CREATE UNIQUE INDEX "idx_user_reports_unique" ON "user_reports"("reported_user_id", "reporter_id");
CREATE INDEX "idx_user_reports_reported_user_id" ON "user_reports"("reported_user_id");
CREATE INDEX "idx_user_reports_reporter_id" ON "user_reports"("reporter_id");
CREATE INDEX "idx_user_reports_status" ON "user_reports"("status");
CREATE INDEX "idx_user_reports_created_at" ON "user_reports"("created_at" DESC);

-- Status check constraint (mirrors shop_reports allowed statuses)
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_status_check"
  CHECK (status::text = ANY (ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying, 'restored'::character varying]::text[]));

-- Foreign keys: blocked_users
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Foreign keys: user_reports
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

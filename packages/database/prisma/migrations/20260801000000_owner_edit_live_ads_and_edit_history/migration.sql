-- Owner edits of live ads: trusted-business direct publish + Facebook-style edit history

-- Direct-publish privilege revocation (business-verified users who abuse live edits)
ALTER TABLE "users" ADD COLUMN "direct_edit_revoked" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "direct_edit_revoked_at" TIMESTAMP(6);
ALTER TABLE "users" ADD COLUMN "direct_edit_revoked_by" INTEGER;
ALTER TABLE "users" ADD COLUMN "direct_edit_revoke_reason" TEXT;

-- Snapshot of the ad before each owner edit
CREATE TABLE "ad_edit_history" (
    "id" SERIAL NOT NULL,
    "ad_id" INTEGER NOT NULL,
    "edited_by" INTEGER NOT NULL,
    "previous_data" JSONB NOT NULL,
    "resulting_status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_edit_history_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ad_edit_history"
    ADD CONSTRAINT "fk_ad_edit_history_ad" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "ad_edit_history"
    ADD CONSTRAINT "fk_ad_edit_history_user" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX "idx_ad_edit_history_ad_id" ON "ad_edit_history"("ad_id");
CREATE INDEX "idx_ad_edit_history_created_at" ON "ad_edit_history"("created_at" DESC);
CREATE INDEX "idx_ad_edit_history_resulting_status" ON "ad_edit_history"("resulting_status");

-- Phone number change history, written by auth-core updatePhone().
-- Additive only: new table + FK to users, no existing rows touched.

-- CreateTable
CREATE TABLE "user_phone_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "old_phone" VARCHAR(20),
    "new_phone" VARCHAR(20) NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_phone_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_phone_history_user_id" ON "user_phone_history"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_phone_history_old_phone" ON "user_phone_history"("old_phone");

-- CreateIndex
CREATE INDEX "idx_user_phone_history_new_phone" ON "user_phone_history"("new_phone");

-- AddForeignKey
ALTER TABLE "user_phone_history" ADD CONSTRAINT "fk_user_phone_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

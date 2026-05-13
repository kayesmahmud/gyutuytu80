-- Drop announcement chat-tab feature: tables, indexes, and target-audience enum.
-- The 'announcement' value in NotificationType is intentionally retained because
-- the editor broadcast notification feature still uses it.

-- DropForeignKey
ALTER TABLE "announcement_read_receipts" DROP CONSTRAINT IF EXISTS "announcement_read_receipts_announcement_id_fkey";
ALTER TABLE "announcement_read_receipts" DROP CONSTRAINT IF EXISTS "announcement_read_receipts_user_id_fkey";
ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "announcements_created_by_fkey";

-- DropTable
DROP TABLE IF EXISTS "announcement_read_receipts";
DROP TABLE IF EXISTS "announcements";

-- DropEnum
DROP TYPE IF EXISTS "announcement_audience";

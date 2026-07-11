-- Per-editor "last seen" timestamp for dashboard notification sections.
--
-- Dashboard badges (Reported Ads, Support Chat) used to count *unresolved* items,
-- so they stayed lit until an editor actioned each item — opening the page did
-- nothing. This table gives them "unread" semantics instead: a badge counts only
-- items created after the editor last opened that section, so it clears on view
-- and relights only when genuinely new items arrive.
--
-- Idempotent.
CREATE TABLE IF NOT EXISTS "editor_section_seen" (
    "editor_id" INTEGER NOT NULL,
    "section" VARCHAR(50) NOT NULL,
    "last_seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editor_section_seen_pkey" PRIMARY KEY ("editor_id", "section")
);

CREATE INDEX IF NOT EXISTS "idx_editor_section_seen_editor" ON "editor_section_seen" ("editor_id");

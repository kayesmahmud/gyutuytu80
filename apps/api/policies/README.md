# AI moderation policy library

These markdown files ARE the AI moderator's rules — edit them and the live
behavior changes (no code deploy needed beyond shipping the files; the API
re-reads them every 5 minutes).

- `core.md` — the universal system prompt: hold-on-doubt, prohibited items,
  explicit content, reply format. Loaded on every moderation call. If this file
  is missing the code falls back to a built-in copy in
  `src/services/moderation.service.ts` (keep the two in sync on core changes).
- `categories/<parent-slug>.md` — per-category guidance appended after the core
  prompt, ONLY for ads in that category: real NPR price ranges, what good
  listings look like, category-specific scam signals. Missing file = no extra
  guidance (fail-open). On any conflict the core rules win.

Rules for editing:

- Every sentence must plausibly change a real verdict; guidance that only
  sounds nice dilutes the rules that matter.
- Category files must never restate or alter the core rules (prohibited list,
  explicit policy, reply format).
- Keep files small — each one rides along on every API call for its category
  (~45 lines max; the loader hard-caps at 6000 chars).

## Regenerating category files from fresh production data

The category files were generated 2026-08-26 from live production ads
(price percentiles, approved titles, editor rejection reasons). To refresh:
run the read-only extraction against prod (see `AI_LISTING_PLAN.md` and the
session notes — percentiles per subcategory from approved live ads, recent
titles, `status_reason` of rejected ads), then regenerate each file from its
category's data slice and review the diff before committing. Re-check against
recent AI-verdict-vs-editor-decision disagreements: files should grow where
the AI gets things wrong, not speculatively.

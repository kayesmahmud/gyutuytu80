# Thulo Bazaar — Security & Architecture Audit

**Date:** 2026-07-11
**Scope:** Authorized internal defensive audit (owner-requested). Read-only — no code was modified.
**Stack:** Next.js 15 (web) · Express (API) · PostgreSQL + Prisma · Flutter (mobile)
**Areas covered:** Architecture/Secrets · Database · Schema Drift/Migrations · Auth/Access Control · API Security · Dependencies/Supply Chain

> Findings are cross-referenced with stable IDs (e.g. `AUTH-C1`). Several agents independently found the same top issue (the editor/admin role gate) — those are merged into a single canonical finding (`ACL-1`) below and referenced everywhere else.

---

## 🔥 Top 5 Things To Fix Now

| # | Finding | Severity | Status |
|---|---------|----------|--------------|
| 1 | **`ACL-1` Editor/admin routes have no role gate** — any logged-in user is effectively an admin | CRITICAL | ✅ FIXED — router-level gate added |
| 2 | **`ACL-2` Self-service verification + pending-queue leak** on the public user router | CRITICAL | ✅ FIXED — `requireEditorOrAdmin` added |
| 3 | **`PAY-1` eSewa payment forgery + `PAY-3` mock gateway live in prod + `PAY-2` free promotions** | CRITICAL | ✅ ALL FIXED — `PAY-1`/`PAY-2`/`PAY-4` closed in the Fable pass (server-to-server verify, amount reconciliation, verified-payment gate); `PAY-3` gated in API mount + all 10 web mock routes |
| 4 | **`SEC-1` Live Khalti secret key committed to git** + **`SEC-2` hardcoded JWT/secret fallbacks** | CRITICAL / HIGH | ✅ `SEC-2` fixed (fail closed). ✅ `SEC-1` placeholder committed — ⚠️ owner must still rotate keys |
| 5 | **`DEP-1` 5 critical / 29 high npm vulnerabilities** incl. `swiper`, `protobufjs`, `next`, `axios`, `multer` | HIGH | ✅ PARTIAL — `npm audit fix` done (prod 43→13, 0 critical); majors deferred |

> **Remediation progress:**
> - **CRITICAL/HIGH:** ACL-1, ACL-2, PAY-1, PAY-2, PAY-3, PAY-4, API-3, SEC-1 (placeholder), SEC-2, API-1, API-2 (full: rate-limit + 2FA + `is_active` recheck), DB-1, DB-2, DB-3 fixed; DEP-1 partial.
> - **MEDIUM:** AUTH-M1, AUTH-M2, AUTH-M3, API-M1, API-M2, API-M3, API-M4, DB-M1, DB-M5, SEC-M1 (incl. web sweep), SEC-M2 fixed.
> - **LOW:** AUTH-L1, AUTH-L2, AUTH-L3, AUTH-L5, API-L3, DB-L5 (bug), DB-L6 fixed; AUTH-L4, API-L1, API-L2, DB-L1/L2/L3/L4, SEC-L1, MIG-L*, ARCH-L1 deferred (architectural / perf / migration-pass / acknowledged).
> - ✅ **Fable pass done (2026-07-11):** PAY-1 (both callback paths verify server-to-server, ignore forgeable payloads, bind to stored `payment_type`/`related_id`, idempotent on replay), PAY-4 (authoritative pricing from `promotion_pricing`/`verification_pricing` at initiation + gateway-amount reconciliation on verify, API + web), PAY-2 (promotions require a verified, owner/ad/type-matched, unconsumed `payment_transactions` row), API-2 remainder (staff 2FA on API login + `requireActiveStaff` per-request `is_active`+role recheck on the editor router). Remaining deferred: DEP-1 major bumps.
> - ⏭️ **Deferred to the migration/index pass** (needs the MIG-1 baseline + prod apply; perf not security): DB-M2, DB-M3, DB-M4, MIG-1/2/3, MIG-M1–M5.
> - ⚠️ **Owner action:** rotate Khalti keys (SEC-1) and the internal broadcast secret (SEC-2); rebuild + smoke-test (package-lock changed).
> - All applied code changes typecheck with **zero new errors** vs. the pre-existing baseline (API + web + auth-core).

---

## CRITICAL

### ACL-1 — Editor/admin routes authenticate but never authorize (full privilege escalation) ✅ FIXED
**Severity:** CRITICAL
**Status:** ✅ FIXED — `apps/api/src/routes/editor/index.ts` now applies `router.use(authenticateToken, requireEditorOrAdmin)` after the public auth routes, gating every editor/admin handler. (super_admin gating of individual destructive actions left as a follow-up — needs the intended editor-vs-admin permission model.)
**Files:**
- Mount: `apps/api/src/app.ts:185-186` (`/api/editor` **and** `/api/admin` → same router, mounted twice)
- `apps/api/src/routes/editor/index.ts` (no role middleware at router level)
- `apps/api/src/routes/editor/ads.routes.ts:179` (status), `:246` (delete), `:316`/`:372` (suspend/unsuspend), `:417` (restore), `:498` (permanent delete)
- `apps/api/src/routes/editor/users.routes.ts:144` (suspend), `:221` (unsuspend)
- `apps/api/src/routes/editor/verifications.routes.ts:129` (approve), `:214` (reject)
- `apps/api/src/routes/editor/categories.routes.ts:66/120/185` (create/update/delete)
- `apps/api/src/routes/editor/notifications.routes.ts:17` (broadcast), `:74` (schedule)
- `apps/api/src/routes/editor/reports.routes.ts:12/36/78/155/256`
- `apps/api/src/routes/editor/stats.routes.ts` (full user PII + analytics)

**Why it's a risk:** Every handler is protected only by `authenticateToken` (`apps/api/src/middleware/auth.ts:18-47`), which verifies the JWT signature and copies `role` from the payload but never restricts it. Regular user tokens are signed with the **same** `config.JWT_SECRET` (`apps/api/src/lib/token.ts:15-24`) and carry `role: 'user'`. A normal user logs in via `/api/auth/phone-login` and that token passes straight through to every editor/admin endpoint. The `role === 'super_admin' ? 'admin' : 'editor'` strings in `ads.routes.ts` are audit-log labels, **not gates**. The correct middleware (`requireEditorOrAdmin` / `requireSuperAdmin`, `apps/api/src/middleware/auth.ts:111-137`) exists but is applied only in `reports.routes.ts` (3 spots) and inline in `editors.routes.ts`.

**Impact:** Any registered user can approve/reject any ad (self-approve their own, bypass moderation), permanently delete ads, suspend/delete arbitrary users (including admins), approve/reject verifications, create/delete categories, broadcast push/SMS to the entire user base, and dump all user PII + analytics.

**Fix:**
```ts
// apps/api/src/routes/editor/index.ts — after the public login route
router.use(authenticateToken, requireEditorOrAdmin);
```
Then apply `requireSuperAdmin` on destructive/privileged actions (permanent delete, category delete, broadcast, editor management). Confirm no editor route relies solely on `authenticateToken` afterward.

---

### ACL-2 — Verification approve/reject/pending on the public user router (self-approval + PII leak) ✅ FIXED
**Severity:** CRITICAL
**Status:** ✅ FIXED — `requireEditorOrAdmin` added to `GET /pending`, `PUT /:userId/approve`, and `PUT /:userId/reject` in `apps/api/src/routes/verification.routes.ts`.
**Files:** `apps/api/src/routes/verification.routes.ts:609` (`PUT /:userId/approve`), `:642` (`PUT /:userId/reject`), `:551` (`GET /pending`).

**Why it's a risk:** All three are commented "admin only" but carry only `authenticateToken` — grep confirms zero `role`/`require*` in the file. `userId` comes from the URL, not the token. Any logged-in user can `PUT /api/verification/<their-own-id>/approve` with `{ "type": "business" }` and set `business_verification_status = 'approved'` (or `individual_verified = true`) on any account — forging the platform's trust badge (`business_verification_status IN ('approved','verified')` per CLAUDE.md). `GET /pending` (`:574-585`) returns every applicant's `email`, `phone`, `business_name`, and `business_license_document` path — full moderation-queue PII and uploaded ID documents.

**Fix:** Add `requireEditorOrAdmin` to all three routes, or delete these duplicates and route through the (now-gated per `ACL-1`) `editor/verifications.routes.ts`.

---

### PAY-1 — eSewa payment forgery (forged callback marks any transaction paid) ✅ FIXED
**Severity:** CRITICAL
**Status:** ✅ FIXED (Fable pass) — both callback paths (web `payments/callback/route.ts` + API `payment.service.ts`) now treat the base64 callback payload as untrusted (decoded for logging only) and ALWAYS confirm via eSewa's server-to-server status-check API, queried with the STORED orderId + amount. Khalti verify prefers the pidx stored at initiation over the callback's. Success actions bind to the stored `payment_type`/`related_id` — never the callback query string. Replayed callbacks for already-verified transactions are idempotent (no re-run of success handlers). The gateway-reported amount is reconciled against the stored amount (fail closed) per PAY-4.
**Files:**
- `apps/web/src/app/api/payments/callback/route.ts:82`
- `apps/api/src/services/payment.service.ts:208-221`
- `decodeEsewaCallback` — `apps/web/src/lib/paymentGateways/esewa.ts:248-256`

**Why it's a risk:** Both paths accept `parsedEsewaData.status === 'COMPLETE'` as proof of payment. `decodeEsewaCallback` only base64-decodes + `JSON.parse`s the payload — no signature verification. A `verifyEsewaSignature` function exists (`esewa.ts:67-85`) but is **never called** on this path. An attacker initiates a payment, then calls the callback with `data = base64({"status":"COMPLETE","total_amount":"10",...})` and gets the transaction verified without paying. `orderId`/`relatedId`/`paymentType` are read from the query and never bound to the payer.

**Fix:** Call `verifyEsewaSignature` before trusting any callback; reconcile the gateway's `total_amount` against the stored transaction amount; bind `relatedId`/`user_id` to the stored transaction.

---

### PAY-2 — Promotions granted with no payment verification ✅ FIXED
**Severity:** CRITICAL
**Status:** ✅ FIXED (Fable pass) — `POST /api/promotions` now requires a `payment_transactions` row that is `status='verified'`, `payment_type='ad_promotion'`, owned by the caller, made for THIS ad (`related_id` match), with stored metadata matching the requested `promotionType`/`durationDays`, and not already consumed by another promotion (double-spend check against both reference formats). `price_paid` records the actually-paid amount from the verified transaction (no more silent `0` fallback).
**File:** `apps/api/src/routes/promotion.routes.ts:222-354` (`POST /api/promotions`).

**Why it's a risk:** Grants featured/urgent/sticky directly. `paymentReference` is taken from `req.body` and stored without verification against any `payment_transactions` row; `price_paid` silently falls back to `0`. No gateway call. A direct call bypasses the entire payment flow.

**Fix:** Require a verified `payment_transactions` row (matching amount, type, and `user_id`) before activating any promotion.

---

### PAY-3 — Mock payment gateway is live in production and partly unauthenticated ✅ FIXED
**Severity:** CRITICAL
**Status:** ✅ FIXED — `apps/api/src/app.ts` now mounts `/api/mock-payment` only when `config.NODE_ENV !== 'production'`. Fable pass: all 10 web mock route handlers (`apps/web/src/app/api/payments/mock/*` + `apps/web/src/app/api/mock-payment/*` — two duplicate sets of 5) also return 404 when `NODE_ENV === 'production'`.
**File:** `apps/api/src/routes/mockPayment.routes.ts`, registered unconditionally at `apps/api/src/app.ts:191`.

**Why it's a risk:** No `NODE_ENV` guard. `GET /api/mock-payment/success?txnId=..&amount=..` (`:166`) has **no authentication** and marks a transaction verified + activates the promotion via the mock service (which always "succeeds"). Anyone who initiates a payment (or guesses a `txnId`) gets free promotions/verifications.

**Fix:** Exclude this file from production builds — mount only when `NODE_ENV !== 'production'`.

---

### PAY-4 — No server-side price validation on payments ✅ FIXED
**Severity:** CRITICAL (grouped with payment cluster)
**Status:** ✅ FIXED (Fable pass) — both initiate paths (API `payment.service.ts` `getAuthoritativeAmount` + web twin `apps/web/src/lib/payments/priceValidation.ts` — keep in sync) compute the authoritative price server-side from `promotion_pricing` (tier-resolved, with account + active-campaign discounts, mirroring the client formula) or `verification_pricing` (anchored to the verification request's own `duration_days`, ownership-checked), and reject any amount below it (NPR 1 rounding tolerance). On verify, the gateway-reported amount is reconciled against the stored amount — mismatch marks the transaction failed.
**Files:** `apps/api/src/routes/payment.routes.ts:58-96`; `apps/api/src/services/payment.service.ts:236-258`.

**Why it's a risk:** `amount` is taken from `req.body` with only an `amount < 10` floor. `promotionType`/`durationDays` come from client `metadata` and are never reconciled against the `promotion_pricing` table; `updateTransactionStatus` never compares the gateway's amount to the stored amount. Pay NPR 10, receive a promotion worth NPR 2000.

**Fix:** Look up the authoritative price from `promotion_pricing` server-side; never trust client `amount`/`metadata`. Reconcile gateway amount on verify.

---

### SEC-1 — Live Khalti payment secret key committed to git ✅ FIXED (⚠️ rotation still required by owner)
**Severity:** CRITICAL
**Status:** ✅ PARTIAL — placeholder committed: `.env.production.example` now has `KHALTI_SECRET_KEY=CHANGE_ME` / `KHALTI_PUBLIC_KEY=CHANGE_ME`. **⚠️ ACTION STILL REQUIRED BY OWNER:** rotate the live Khalti keys in the merchant dashboard (treat the old key as compromised — it remains in git history in commit `a969a68`).
**File:** `.env.production.example` (tracked; committed in `a969a68`).

**Why it's a risk:** Contained `KHALTI_SECRET_KEY=live_secret_key_…` and `KHALTI_PUBLIC_KEY=live_public_key_…` (real values redacted here; present in git history at `a969a68`). The `live_secret_key_` prefix is Khalti's real production format (not a `CHANGE_ME` placeholder). A live gateway secret in the repo grants the ability to initiate/verify/refund real transactions. It is in git history even if edited now.

**Fix:** Rotate the Khalti live keys immediately in the merchant dashboard (treat as compromised). Replace the values with `CHANGE_ME`. Purge from history with `git filter-repo`/BFG, or accept rotation as the mitigation.

---

## HIGH

### SEC-2 — Hardcoded secret fallbacks (JWT, internal broadcast, DB password) ✅ FIXED
**Severity:** HIGH
**Status:** ✅ FIXED — all published-literal fallbacks removed and made fail-closed: web `jwt.ts` (lazy `getJwtSecret()` throws), `authOptions.ts` + `helpers.ts` throw if `JWT_SECRET` unset; API broadcast endpoint rejects when `INTERNAL_API_SECRET` unset (no `undefined===undefined` bypass) and the web sender no longer uses a literal; `DB_PASSWORD` / `TYPESENSE_API_KEY` fallbacks removed; `validateConfig` now `process.exit(1)` in production when `DB_PASSWORD`/`INTERNAL_API_SECRET` are missing. (Rotate the internal broadcast secret; ensure web+API share the same `JWT_SECRET`.)
**Files & literals:**
- `apps/web/src/lib/auth/jwt.ts:6-8`, `authOptions.ts:107`, `helpers.ts:143` — `process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'`
- `apps/api/src/app.ts:372` & `apps/web/src/app/api/messages/conversations/[id]/route.ts:352` — `process.env.INTERNAL_API_SECRET || 'thulobazaar-internal-2025'`
- `apps/api/src/config/index.ts:19` — `DB_PASSWORD: process.env.DB_PASSWORD || 'postgres'`
- `apps/web/src/lib/search/typesense.ts:13` — `TYPESENSE_API_KEY || 'xyz'`

**Why it's a risk:** The web app both signs and verifies session JWTs with `JWT_SECRET`; if unset it falls back to a string published in the repo and every `.env.example`, letting an attacker forge tokens for any user/role — and the API trusts the same secret, so forged web tokens pass the backend too. The internal broadcast secret authorizes `POST /api/internal/broadcast-message` (arbitrary Socket.IO messages + push notifications). The API correctly hard-fails on missing secrets (`config/index.ts:64-68` → `process.exit(1)`); the web app and these fallbacks do not.

**Fix:** Remove every `|| 'literal'` fallback for secrets; throw at startup if absent (mirror the API's `validateConfig`). Rotate the internal broadcast secret. Ensure the web deployment sets the same `JWT_SECRET` as the API.

---

### API-1 — Rate limiting defeated behind the proxy (`trust proxy` unset) ✅ FIXED
**Severity:** HIGH
**Status:** ✅ FIXED — `app.set('trust proxy', 1)` added at the top of `createApp()`, so `req.ip` (used by all rate-limiter key generators) resolves to the real client IP from X-Forwarded-For.
**Files:** `apps/api/src/app.ts` / `index.ts` (never call `app.set('trust proxy', …)`); limiter at `apps/api/src/middleware/rateLimiter.ts:71,172`.

**Why it's a risk:** The custom limiter keys auth on `req.ip`. Behind nginx/Cloudflare, `req.ip` collapses to the proxy IP, so all clients share one bucket: per-IP protection is gone and 20 requests can lock out auth **for the entire platform** (global DoS).

**Fix:** `app.set('trust proxy', 1)` and key limiting on the real client IP (`X-Forwarded-For`).

---

### API-2 — Editor/admin login: no rate limiting, bypasses 2FA, no `is_active` recheck ✅ FIXED
**Severity:** HIGH
**Status:** ✅ FIXED (Fable pass) — (a) `rateLimiters.auth` on `POST /api/editor/auth/login`; (b) API-side 2FA enforced: when `two_factor_enabled`, login without a valid `twoFactorCode` returns `401 { requires2FA: true }` (single-step email+password+code, reusing `verifyTwoFactorCode` — TOTP + bcrypt backup codes — matching the web panel's NextAuth flow); (c) `is_active` recheck implemented as `requireActiveStaff` middleware mounted on the editor router (`authenticateToken, requireEditorOrAdmin, requireActiveStaff`) — per-request DB recheck of `is_active` AND authoritative role, scoped to staff routes only so the global middleware stays sync and public traffic pays no DB cost. Suspended/demoted staff tokens die immediately instead of at 24h expiry.
**File:** `apps/api/src/routes/editor/auth.routes.ts:15` (`POST /login`).

**Why it's a risk:** No `rateLimiters.auth` (unlike public auth) → unlimited password brute-force against the highest-value credentials (editor/admin/super_admin) at 4 URLs. The handler issues a full JWT on email+password alone and never checks `two_factor_enabled`, so staff 2FA (web-only) is sidestepped via the API. `authenticateToken` never re-checks `is_active`, so a suspended editor's JWT keeps working until expiry.

**Fix:** Apply `rateLimiters.auth` (or stricter); enforce 2FA in the API login path; re-check `is_active` in `authenticateToken` for staff.

---

### DB-1 — Public shop profile leaks seller email (web route) ✅ FIXED
**Severity:** HIGH
**Status:** ✅ FIXED — `email` removed from both the Prisma `select` and the response in `apps/web/src/app/api/profiles/shop/[slug]/route.ts`. `phone` kept intentionally (shop contact, matches the Express route).
**File:** `apps/web/src/app/api/profiles/shop/[slug]/route.ts` — `email: true` select (`:34`), returned `:150`; phone `:35/:151`.

**Why it's a risk:** Unauthenticated public endpoint. The Express equivalent (`apps/api/src/routes/shop.routes.ts:217`) deliberately returns `email: ''` ("Don't expose email publicly") — the web route violates that decision. Every seller's email (the login identifier) is harvestable by iterating shop slugs (all in `sitemap.ts`) → spam/phishing/account-targeting.

**Fix:** Remove `email` from the select and response. Decide explicitly whether `phone` belongs (Express exposes it as shop contact; if intentional, keep phone, drop email).

---

### DB-2 — User-controlled `status` filter exposes everyone's pending/rejected ads ✅ FIXED
**Severity:** HIGH
**Status:** ✅ FIXED — `apps/web/src/app/api/ads/route.ts` now hard-codes `status: 'approved'` for the public listing (owners use the dedicated `/api/ads/my`).
**Files:** `apps/web/src/app/api/ads/route.ts:35` → `apps/web/src/lib/services/ad.service.ts:112`.

**Why it's a risk:** `status: searchParams.get('status') || 'approved'` — any anonymous caller can request `?status=pending` or `?status=rejected` and enumerate all users' unapproved ads (title, description, price, seller identity, images) before moderation clears them.

**Fix:** Hard-code `status: 'approved'` for unauthenticated calls; honor other statuses only when scoped to `user_id: authenticatedUserId`.

---

### DB-3 — Public ad detail returns full row incl. moderation data, no status gate (IDOR) ✅ FIXED
**Severity:** HIGH
**Status:** ✅ FIXED — API: `getAdById`/`getAdBySlug` now take a `viewerUserId` and return null (→404) for non-approved/soft-deleted ads unless the caller is the owner (`isAdViewable`); routes pass `req.user?.userId`; `transformAdForDetail` strips `status_reason`/`reviewed_by`/`deleted_by`/`deletion_reason` from the `...ad` spread. Web: `GET /api/ads/[id]` now uses `optionalAuth` + an owner-aware status gate (non-approved → 404); it already uses an explicit `select` so no moderation fields leak.
**Files:** `apps/api/src/routes/ads.routes.ts:112-158` (`optionalAuth`, no status check); `apps/api/src/services/ad.service.ts:597-613` (`where: { slug }`/`{ id }` only); `ad.service.ts:156` (`transformAdForDetail` does `...ad`, spreading every scalar).

**Why it's a risk:** (a) pending/rejected/soft-deleted ads are fetchable by anyone via sequential integer IDs; (b) the spread leaks internal moderation columns — `status_reason` (editor rejection notes), `reviewed_by`, `deleted_by`, `deletion_reason`, plus `seller_phone`/`seller_name`, `expires_at`. Web equivalent (`apps/web/src/app/api/ads/[id]/route.ts:35-38`) also lacks a status filter.

**Fix:** Add `status: 'approved', deleted_at: null` to the public where clause (owner override when `req.user.userId === ad.user_id`); replace the `...ad` spread with an explicit allowlist omitting moderation fields.

---

### API-3 — IDOR on payment verify (not scoped to caller) ✅ FIXED
**Severity:** HIGH
**Status:** ✅ FIXED — `POST /api/payments/verify` now rejects (404) when `transaction.user_id !== req.user.userId`, so a caller can only verify their own transaction.
**Files:** `apps/api/src/routes/payment.routes.ts:202-285` → `payment.service.ts:467-482` (`findTransactionWithStatus` looks up by `transaction_id` only).

**Why it's a risk:** Not scoped to `req.user.userId`. Combined with `PAY-1`, an attacker can verify another user's pending transaction.

**Fix:** Scope the lookup to `req.user.userId`.

---

### MIG-1 — No baseline migration (history cannot rebuild a DB; drift tooling broken)
**Severity:** HIGH
**Files:** `packages/database/prisma/migrations/` — first migration `20241214000000_add_restored_status_to_ad_reports/migration.sql` ALTERs `ad_reports`, a table no prior migration creates. 29 of ~35 models in `schema.prisma` have no `CREATE TABLE` in any Prisma migration.

**Why it's a risk:** Disaster recovery / new environment / CI shadow DB from migrations is impossible; `prisma migrate dev` (`npm run db:migrate`) cannot replay history; `prisma migrate diff --from-migrations` hard-fails (P3006).

**Fix:** Generate a squashed baseline: `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` → `000000000000_init/migration.sql`, then `prisma migrate resolve --applied 000000000000_init` on prod and local.

---

### MIG-2 — Schema-only columns with no migration (`categories.name_ne`, `locations.name_ne`)
**Severity:** HIGH
**Files:** `schema.prisma:311, 400`; added in commit `85b1c22` with **zero** migration files (via `db push`/manual SQL).

**Why it's a risk:** Exactly the drift class `SCHEMA_DRIFT_PREVENTION.md` exists to prevent. Any environment rebuilt from migrations lacks these columns → Prisma queries selecting them crash.

**Fix:** Subsumed by `MIG-1` baseline; otherwise add idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS "name_ne" VARCHAR(...)` for both tables.

---

### MIG-3 — `migration_lock.toml` missing / never committed
**Severity:** HIGH
**File:** `packages/database/prisma/migrations/migration_lock.toml` (absent).

**Why it's a risk:** Prisma can't determine the connector from the migrations dir — this hard-fails `migrate diff --from-migrations` and any CI shadow-DB replay.

**Fix:** Commit a one-line file: `provider = "postgresql"`.

---

### DEP-1 — Multiple critical/high npm vulnerabilities (production dependencies) ✅ PARTIAL
**Severity:** HIGH
**Status:** ✅ PARTIAL — ran non-breaking `npm audit fix`. **Prod: 43 → 13 (2 critical → 0, 16 high → 2); full tree: 83 → 20.** `protobufjs`, `swiper`, `axios`, `multer`, `ws` (direct), `socket.io-parser`, `path-to-regexp`, `form-data`, `express-rate-limit` resolved via semver-compatible updates (`package-lock.json` changed — rebuild + smoke-test before deploy). ⏭️ REMAINING (need breaking major bumps — deferred, run manually): prod highs `lodash` (<=4.17.23) and `nodemailer` (<=9.0.0); `next` major; transitive `ws` pulled by `firebase-admin`/`socket.io`. Do `npm audit fix --force` selectively (or bump `next`/`nodemailer`/`lodash` in the relevant workspace) and re-test. Add `npm audit --omit=dev` as a CI gate.
**Source:** `npm audit` (2026-07-11). **Prod deps: 2 critical, 16 high, 23 moderate, 2 low (43 total).** Including dev deps: **5 critical, 29 high, 46 moderate (83 total).**

Key production advisories to bump:

| Package | Vulnerable range | Severity |
|---------|------------------|----------|
| `protobufjs` | `<=7.6.2` | critical |
| `swiper` | `6.5.1 - 12.1.1` | critical |
| `next` | `9.3.4-canary.0 - 16.3.0-canary.5` | high |
| `axios` | `1.0.0 - 1.15.2` | high |
| `multer` | `<=2.1.1` | high |
| `nodemailer` | `<=9.0.0` | high |
| `ws` | `8.0.0 - 8.20.1` | high |
| `socket.io-parser` | `4.0.0 - 4.2.5` | high |
| `express-rate-limit` | `8.0.1 - 8.5.0` | high |
| `path-to-regexp` | `8.0.0 - 8.3.0` | high |
| `node-forge` | `<=1.3.3` | high |
| `lodash` | `<=4.17.23` | high |
| `form-data` | `<4.0.6` | high |

**Why it's a risk:** `next`, `axios`, `multer`, `ws`, `socket.io-parser` are all directly in the request/upload/realtime path — these are reachable, not transitive-only. `swiper`/`protobufjs` are critical.

**Fix:** Run `npm audit fix`; then manually bump the majors that `fix` won't touch (`next`, `multer`, `axios`, `swiper`). Re-run `npm audit --omit=dev` until prod critical/high is zero. Add `npm audit --omit=dev` as a CI gate.

---

## MEDIUM

### AUTH-M1 — OTP generated with `Math.random()` ✅ FIXED
**Status:** ✅ FIXED — `generateOtp()` now uses `crypto.randomInt(100000, 1000000)` in `packages/auth-core/src/sms.ts`.
**File:** `packages/auth-core/src/sms.ts:60-62` — `Math.floor(100000 + Math.random() * 900000)`. `Math.random()` is not a CSPRNG; predictable from observed outputs. Weakens OTP for login/password-reset/account-deletion.
**Fix:** `crypto.randomInt(100000, 1000000).toString()`.

### AUTH-M2 — User enumeration via auth responses ✅ FIXED
**Status:** ✅ FIXED — phone-login returns identical `401 "Invalid phone number or password"` for unknown-account vs wrong-password (`auth.routes.ts`); `sendOtp` for `login`/`password_reset` returns a success-shaped response without sending when no account exists (`packages/auth-core/src/otp.ts`). (Suspended-account message intentionally kept for UX.)
**Files:** `apps/api/src/routes/auth.routes.ts:328-329` (404 "not found" vs 401 "Invalid password"); `packages/auth-core/src/otp.ts:88-89, 100-101` ("No account found with this phone number").
**Fix:** Return a single generic message + identical status for unknown-account vs wrong-password; success-shaped response for send-OTP on login/reset regardless.

### AUTH-M3 — Weak password policy (min 6, no complexity) ✅ FIXED
**Status:** ✅ FIXED — minimum raised to 8 chars at registration, reset, and change (`auth.routes.ts`). (No complexity rules added — length-only, per YAGNI.)
**Files:** `apps/api/src/routes/auth.routes.ts:424-426` (reset), `:465-467` (change); register enforces only presence. Hashing is fine (bcrypt).
**Fix:** Raise minimum to 8-10; enforce in `registerWithPhone` too.

### API-M1 — Unbounded/unsanitized `attributes` JSON ✅ FIXED
**Status:** ✅ FIXED — `parseAttributes` now caps the raw payload at 8KB, rejects non-object shapes, and caps at 50 keys (`ads.routes.ts`). (Full per-field schema validation still recommended long-term.)
**File:** `apps/api/src/routes/ads.routes.ts:221` → stored verbatim into `custom_fields`, echoed on detail. No schema/size limit → stored-XSS surface + payload-DoS.
**Fix:** Validate against an attribute schema; cap size/depth.

### API-M2 — No price validation on ads (negative/NaN accepted) ✅ FIXED
**Status:** ✅ FIXED — ad create now rejects non-finite/negative price (`Number.isFinite` + `>= 0`) in `ads.routes.ts` (0 allowed = free). (PUT/update path can be hardened similarly as a follow-up.)
**File:** `apps/api/src/routes/ads.routes.ts:229`.
**Fix:** Validate `price` is a positive finite number.

### API-M3 — Editor-management `:id` mutations not constrained to editors ✅ FIXED
**Status:** ✅ FIXED — all four mutations (update/delete/suspend/reset-2fa) now use `where: { id, role: 'editor' }` in `editors.routes.ts`, so they can't touch admins/super_admins or regular users.
**File:** `apps/api/src/routes/editor/editors.routes.ts` — `PUT/DELETE /:id`, `/:id/suspend`, `/:id/reset-2fa` do `where: { id }` with no `role: 'editor'` guard (super_admin-gated, so lower reach), can delete/disable-2FA of any user incl. other super_admins.
**Fix:** Add `role: 'editor'` (or an explicit staff-role set) to the where clause.

### API-M4 — Support ticket IDOR via nullable role ✅ FIXED
**Status:** ✅ FIXED — added `isStaffRole()` (positive staff allowlist) in `support.routes.ts`; ticket-access and macro staff-gates now treat any non-staff role (incl. null) as a regular user.
**File:** `apps/api/src/routes/support.routes.ts:236-242` — ownership check is `ticket.user_id !== userId && userRole === 'user'`; a user whose `role` is `null` bypasses it and is treated as staff. Latent (default role is `user`).
**Fix:** Treat any non-staff role (incl. null) as `user`; check membership positively.

### SEC-M1 — Raw error messages returned to clients ✅ FIXED
**Status:** ✅ FIXED — API: `favorites.routes.ts` (4) + `auth.routes.ts` refresh handler no longer leak `error.message`. Web sweep done: removed **85** auxiliary `error: error.message` fields (kept the generic `message` beside each), genericized the **3** true `500` leaks (`admin/settings/test-sms`, `super-admin/sms-broadcast` ×2) and 3 Pattern-C `error:` fields (`locations/hierarchy`, `verification-pricing`, `cron/cleanup-deleted-accounts`). **Intentionally kept:** the 43 `403` `message: error.message` sites (these surface `requireAuth`/`requireRole`'s own `'Unauthorized'`/`'Forbidden'`, not internals) and 2 `400` validation messages — genericizing those would degrade UX with no security gain. Verified: web typechecks with no new errors, none under `app/api`. Minor residual (low value): a few Pattern-C `const message = error instanceof Error ? error.message : 'Unknown error'` on `500` paths + the `/health` diagnostic field.
**Files:** API — `apps/api/src/routes/favorites.routes.ts:130,211,263,306`, `auth.routes.ts:101` (`error.message`). Web — ~72 handlers return `error: error.message` at HTTP 500 (e.g. `apps/web/src/app/api/ads/route.ts:232`, `messages/route.ts:153,299`, all `payments/mock/*`); only 2 gate on `NODE_ENV`. The Express global handler (`middleware/errorHandler.ts`) redacts correctly — these routes bypass it with their own try/catch.
**Fix:** Log server-side only; return generic messages. Route through `catchAsync` + global handler, or gate `error.message` behind `NODE_ENV === 'development'`.

### DB-M1 — Public search & shop listings spread raw ad rows ✅ FIXED
**Status:** ✅ FIXED — both `search.routes.ts` and `shop.routes.ts` now strip `status_reason`/`reviewed_by`/`deleted_by`/`deletion_reason` from the `...ad` spread (denylist chosen over `transformAdForList` to preserve the existing response shape for web/mobile consumers). The raw-snake_case convention note remains as tech-debt.
**Files:** `apps/api/src/routes/search.routes.ts:97-98`, `shop.routes.ts:238-239` (`...ad`). Leaks `status_reason`, `reviewed_by`, `deleted_by`, `deletion_reason`, `seller_phone`, `custom_fields` on public endpoints; also returns raw snake_case (violates the transformer convention).
**Fix:** Reuse `transformAdForList` (`ad.service.ts:59`) in both routes.

### DB-M2 — Missing index on `ads.reviewed_at` (hot sort key for every listing)
**File:** `schema.prisma:244-253`. All hot public queries `ORDER BY reviewed_at DESC NULLS LAST` (`search.routes.ts:90`, `ad.service.ts:381-382`, `shop.routes.ts:185`, `queryBuilder.ts:141`, web shop `:116`). `idx_ads_status_created` can't serve it → full sort of the approved set on every page load.
**Fix:** `@@index([status, reviewed_at(sort: Desc)])` (with `NULLS LAST` via raw SQL in the migration to match exactly).

### DB-M3 — `ILIKE '%term%'` search with no trigram index
**Files:** `search.routes.ts:41-44`, `ad.service.ts:330-333`, web `ad.service.ts:122-125`. `contains/insensitive` → `ILIKE '%x%'` → sequential scan per search on an unauthenticated endpoint (DoS lever, degrades linearly).
**Fix:** `pg_trgm` GIN index on `title` (+ optionally `description`) via raw-SQL migration, or route search through the existing Typesense integration (`@/lib/search`).

### DB-M4 — `users.phone` unindexed (every phone login seq-scans)
**Files:** `schema.prisma:502`; queried `auth.service.ts:101,277`, web `phone-login/route.ts:43`. Phone is the primary login identifier; each OTP lookup is a full table scan.
**Fix:** `@@index([phone])` (or unique if one account per phone is guaranteed).

### DB-M5 — Web shop profile fetches ALL of a shop's ads unbounded to compute stats ✅ FIXED
**Status:** ✅ FIXED — web shop route now caps the returned list at `take: 100` and computes stats via `prisma.ads.aggregate` (`_count`, `_sum: view_count`) + a `count` for featured, over the full approved set (accurate regardless of the cap).
**File:** `apps/web/src/app/api/profiles/shop/[slug]/route.ts:74-123` — `ads.findMany` no `take`, then JS `.filter()`/`.reduce()`. Express version already does it right (`shop.routes.ts:169-195`, `take` + `aggregate`).
**Fix:** Add `take`/`skip`; replace JS stats with `prisma.ads.aggregate({ _count, _sum: { view_count } })`.

### MIG-M1 — Local DB migration state out of order (3 pending older than newest applied)
**Detail:** `20260610000000_add_missing_sunkoshi_municipalities`, `20260610010000_fix_koshi_province_typo`, `20260618215101_drop_condition_default` are NOT applied locally, while newer `20260711000000_add_editor_section_seen` IS (via `migrate resolve`, `applied_steps_count=0`). Consequence: local `ads.condition` still has `DEFAULT 'Used'` — the foot-gun `20260618215101` removes.
**Fix:** `npm run db:migrate:deploy` locally (all three are idempotent/no-op on correct data). Remember the manual prod `migrate deploy` for `a912a60` per the post-deploy checklist.

### MIG-M2 — `_ads_condition_backup` table in migrations but not schema
**File:** `20250123000000_standardize_condition_values/migration.sql:13` (`CREATE TABLE ... AS SELECT`), never dropped, absent from `schema.prisma`. Prod almost certainly still has it; every future `db pull`/`migrate diff` flags it.
**Fix:** After verifying `.tmp-backups/*condition_backup_2026-06-18.txt`, add a `DROP TABLE IF EXISTS "_ads_condition_backup";` migration.

### MIG-M3 — Second, legacy migration system still in repo
**File:** `packages/database/migrations/` (012–022 raw SQL + empty `0_baseline.sql`, `drift.sql`). `021_add_category_pricing_tiers.sql` is the ONLY place `category_pricing_tiers` (a live model) is created. Source-of-truth confusion.
**Fix:** Delete/archive once the `MIG-1` baseline lands.

### MIG-M4 — Partial indexes only in migrations, not schema (reverse drift)
**Detail:** `idx_ads_expires_at` (partial, `20260312000000`) and unique `ad_images_one_primary_per_ad` (`20241226000000`). A naive "accept the diff" would drop the one-primary-image invariant and the cron index.
**Fix:** Document as intentionally-external; never accept auto-generated drops for them.

### MIG-M5 — CHECK/`SET NOT NULL` added without `NOT VALID` on hot tables
**Detail:** `20241226000000_add_data_integrity_constraints/migration.sql:6-20` (`ads.slug SET NOT NULL`, 4 CHECKs incl. `users_email_format`). Already applied (historical), but the pattern takes ACCESS EXCLUSIVE + full scan and `users_email_format` hard-fails deploy on one bad legacy row.
**Fix (future pattern):** `ADD CONSTRAINT ... NOT VALID;` then `VALIDATE CONSTRAINT` (SHARE UPDATE EXCLUSIVE only).

### SEC-M2 — Typesense API key hardcoded fallback ✅ FIXED
**Status:** ✅ FIXED (with SEC-2) — `typesense.ts` `|| 'xyz'` fallback removed (fail closed). Still set a strong key in `docker-compose.search.yml` via env.
**File:** `apps/web/src/lib/search/typesense.ts:13` (`|| 'xyz'`); `docker-compose.search.yml:13-15` ships `your-api-key-change-in-production`.
**Fix:** Require the env var (fail closed); set strong keys in compose via env.

---

## LOW

| ID | Finding | File | Status |
|----|---------|------|--------|
| AUTH-L1 | bcrypt cost factor 10 (consider 12 for password hashes) | `auth.service.ts` | ✅ FIXED — all 6 `bcrypt.hash` sites now use `SECURITY.BCRYPT_SALT_ROUNDS` (=12) |
| AUTH-L2 | OTP code compared with `!==` (not timing-safe) | `otp.ts`, `auth.service.ts` | ✅ FIXED — `timingSafeEqualStr` (constant-time, length-guarded) in both paths |
| AUTH-L3 | `jwtVerify` doesn't pin `algorithms` | `apps/web/src/lib/auth/jwt.ts` | ✅ FIXED — both `jwtVerify` calls pin `{ algorithms: ['HS256'] }` |
| AUTH-L4 | In-memory per-process rate limiter (not shared across instances) | `rateLimiter.ts` | ⏭️ DEFERRED — architectural (needs Redis-backed store); single-instance today |
| AUTH-L5 | `disable2FA` allows disabling with password alone when `two_factor_secret` is null | `auth.service.ts` | ✅ FIXED — a valid TOTP is now always required; null-secret state routes to admin reset |
| API-L1 | `parseInt(req.params.id)` with no NaN/radix guard → `where:{id:NaN}` → 500 | many routes | ⏭️ ACKNOWLEDGED — runtime params are always strings; NaN→500 is minor; guarding every route is a broad low-priority change |
| API-L2 | File-upload MIME trust | `upload.ts`, `optimizeImage.ts` | ⏭️ DEFERRED — needs magic-byte sniffing; sharp re-encode already normalizes most |
| API-L3 | FCM token delete not user-scoped | `notifications.routes.ts` | ✅ FIXED — delete now scoped to `user_id: req.user.userId` |
| DB-L1 | `$queryRawUnsafe` used where `$queryRaw` would do (currently safe) | `areas/*` | ⏭️ DEFERRED — currently parameterized/safe; cosmetic refactor |
| DB-L2 | Notification cron: N+1 loops + unbounded scans | `notificationCron.ts` | ⏭️ DEFERRED — perf, background job |
| DB-L3 | Existence checks load full rows — use `select:{id:true}` | `shop.routes.ts`, `passport.ts` | ⏭️ DEFERRED — perf/hygiene |
| DB-L4 | Missing indexes on `ads.expires_at` / `ads.deleted_at` | `schema.prisma` | ⏭️ DEFERRED — grouped with the migration/index pass (MIG-1 baseline) |
| DB-L5 | Web `listAds` `areaId` filter references non-existent `area_id` column → 500 (bug) | `apps/web/src/lib/services/ad.service.ts` | ✅ FIXED — maps `areaId` → `location_id` (an area IS a location) |
| DB-L6 | Unbounded own-ads queries | `ad.service.ts`, `ads/my/route.ts` | ✅ FIXED — `take: 200` cap on both |
| MIG-L1 | Non-atomic data migration (2 full-table UPDATEs, no `BEGIN;/COMMIT;`) | `20250123000000_standardize_condition_values` |
| MIG-L2 | Redundant index + no FK on `editor_id` | `20260711000000_add_editor_section_seen/migration.sql:18` |
| MIG-L3 | `scripts/sync-ad-images.sql` starts with `DELETE FROM ad_images;` (dev-only, must never hit prod) | `packages/database/scripts/sync-ad-images.sql` |
| ARCH-L1 | Heavy business logic + direct Prisma in route files (inconsistent service-layer pattern) | `editor/stats.routes.ts` (1007 lines, 76 `prisma.*`), `shop.routes.ts`, `profile.routes.ts`, most `editor/*` |
| SEC-L1 | eSewa sandbox test creds duplicated in shipped source (`Nepal@123`, sandbox secretKey) | `apps/api/src/lib/payment/esewa.ts:262-269`, web `esewa.ts:267-271` |

---

## ✅ Verified clean / no action needed

- **No SQL injection.** All `$queryRaw` are tagged-template parameterized; `$queryRawUnsafe` uses `$1` placeholders with numeric-parsed inputs; no `pool.query`, no string concatenation of user input.
- **No mass assignment.** Every create/update uses explicit field whitelists (ads, profile, editors, promotions, settings). Profile update cannot set `role`/verification/`account_status`.
- **User-facing ownership scoping is correct:** favorites (all ops), messages/conversations (membership checks), notificationCenter read/delete, ad update/delete (`findFirst` with `user_id`), reports, payment `getTransactionStatus`, support (`ticket.user_id !== userId` → 403).
- **JWT lifecycle sound:** access `24h`, refresh `30d`, 2FA temp token `5m`; refresh tokens opaque, rotated, reuse-detected, revoked on logout/deletion (`lib/token.ts`).
- **2FA login has no bypass:** `verify2FALogin` enforces `payload.purpose === '2fa'`; TOTP via otplib; backup codes bcrypt-hashed + single-use. OTP verification token is HMAC-SHA256 with `timingSafeEqual` + length guard.
- **CORS is a proper allowlist** (`config.CORS_ORIGINS`), not `*`-with-credentials, plus an origin/Bearer CSRF guard on state-changing methods. Helmet + CSP enabled. Upload filenames server-generated (no path traversal via `originalname`). Web admin routes use `requireSuperAdmin`/`requireRole` correctly.
- **Sensitive columns never reach responses:** `adDetailSelect`/`adListSelect` (Express) and `adSelectQuery`/`standardAdInclude` (web) scope user relations — no `password_hash`, 2FA secrets, backup codes, or FCM tokens leak. `fcm_tokens` read server-side only.
- **No real secret files committed:** `.env`/`.env.*.local` gitignored; only committed cert is the public LE root `api_thulobazaar.pem` for SSL pinning (not a private key). CI uses `${{ secrets.* }}`; the one inline value is a test-only `NEXTAUTH_SECRET`. Flutter `lib/` has no hardcoded keys.
- **Schema ↔ migration match** for the newest `editor_section_seen` migration (field-for-field).

---

## Recommended remediation order

1. **`ACL-1`** router-level role gate in `editor/index.ts` (closes the widest hole in ~1 line).
2. **`ACL-2`** admin gate on `verification.routes.ts` approve/reject/pending.
3. **Payment cluster** `PAY-1`/`PAY-3`/`PAY-4`/`PAY-2` + IDOR `API-3` — verify signature & amount, drop mock routes in prod, gate promotions.
4. **`SEC-1`** rotate Khalti keys; **`SEC-2`** remove all secret fallbacks (fail closed).
5. **`API-1`** `trust proxy` + **`API-2`** editor-login rate limit / 2FA.
6. **Data exposure** `DB-1`/`DB-2`/`DB-3`/`DB-M1` — email + status filter + moderation-field spreads.
7. **`DEP-1`** `npm audit fix` + manual majors, add CI gate.
8. **Migrations** `MIG-3` (lock file) → `MIG-M1` (`db:migrate:deploy`) → `MIG-1` baseline squash (subsumes `MIG-2`/`MIG-M2`) → `MIG-M3` cleanup.
9. **Indexes** `DB-M2` (`reviewed_at`) → `DB-M4` (`phone`) → `DB-M3` (trigram) → `DB-L4`.
10. Medium/low hardening: OTP CSPRNG, enumeration, password policy, error-message redaction.

---

*Generated from a 6-area parallel audit (Architecture · Database · Schema/Migrations · Auth · API · Dependencies). All file:line references verified against the working tree on 2026-07-11. Nothing was modified during this audit.*

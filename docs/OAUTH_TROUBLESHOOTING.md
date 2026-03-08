# Google OAuth Login Troubleshooting Guide

This document covers common issues and solutions for Google OAuth login in the Thulo Bazaar monorepo.

---

## Common Errors

### 1. "Authentication failed. Please try again."

This generic error can have multiple underlying causes. Check the server logs for specific error messages.

---

### 2. "Token verification failed: invalid signature"

**Symptom**: Logs show:
```
🔑 JWT_SECRET available: true length: 46
❌ Token verification failed: invalid signature
```

**Cause**: JWT_SECRET mismatch between API and Web apps.

**Solution**:
1. Check all environment files have the **same** JWT_SECRET:
   ```bash
   grep JWT_SECRET .env apps/api/.env apps/web/.env apps/web/.env.local
   ```

2. Ensure `apps/web/.env.local` matches (it has **higher priority** than `.env`):
   ```
   JWT_SECRET=thulobazaar_secure_jwt_secret_key_2024_change_in_production
   ```

3. **Fully restart** the dev server (hot reload may not pick up `.env` changes):
   ```bash
   # Kill all processes first
   lsof -ti:3333,5000 | xargs kill -9
   npm run dev
   ```

---

### 3. "Argument `id` is missing" / "userId: undefined"

**Symptom**: Logs show:
```
✅ Token verified: { userId: undefined, email: '...' }
prisma:error Argument `id` is missing.
```

**Cause**: The JWT payload doesn't contain `userId` because Passport.js uses `userId` property but `generateAccessToken()` expects `id`.

**Solution**: In `apps/api/src/routes/auth.routes.ts`, ensure the Google OAuth callback maps properties correctly:

```typescript
// ❌ Wrong - user.id is undefined (Passport uses userId)
const accessToken = generateAccessToken(user);

// ✅ Correct - explicitly map userId to id
const accessToken = generateAccessToken({ 
  id: user.userId, 
  email: user.email, 
  role: user.role 
});
```

---

### 4. "Cannot read properties of undefined (reading 'create')"

**Symptom**: Error mentions `prisma.refresh_tokens.create()` failing.

**Cause**: Prisma Client wasn't regenerated after schema changes.

**Solution**:
```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

---

### 5. "EADDRINUSE: address already in use"

**Symptom**: Server won't start, ports 3333 or 5000 are blocked.

**Solution**:
```bash
lsof -ti:3333,5000 | xargs kill -9
npm run dev
```

---

## Environment File Priority

Next.js loads environment files in this order (later files override earlier):
1. `.env` (lowest priority)
2. `.env.local` (highest priority for local dev)
3. `.env.development` / `.env.production` (environment-specific)

**Important**: `apps/web/.env.local` overrides `apps/web/.env`, so secrets must match!

---

## Debug Checklist

1. **Check JWT_SECRET consistency**:
   ```bash
   grep -r "JWT_SECRET=" .env* apps/*/.env*
   ```

2. **View decoded token** (use [jwt.io](https://jwt.io)):
   - Copy token from URL: `?token=eyJ...`
   - Paste into jwt.io to see payload
   - Verify `userId` is present and a number

3. **Check server logs** for the specific error:
   - `🔑 JWT_SECRET available: true length: XX` - Should be 58 chars
   - `✅ Token verified: { userId: X }` - userId should NOT be undefined

4. **Restart completely**:
   ```bash
   pkill -f "next dev" ; pkill -f "tsx watch"
   npm run dev
   ```

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/lib/token.ts` | JWT generation (access + refresh tokens) |
| `apps/api/src/routes/auth.routes.ts` | Google OAuth callback handler |
| `apps/api/src/config/passport.ts` | Passport.js Google strategy |
| `apps/web/src/app/api/auth/oauth-callback/route.ts` | Frontend token verification |
| `apps/web/src/app/[lang]/auth/oauth-success/page.tsx` | NextAuth session creation |
| `apps/web/src/lib/auth/authOptions.ts` | NextAuth configuration |

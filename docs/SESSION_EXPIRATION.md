# Session & Token Expiration Guide

This document explains how authentication sessions work in Thulo Bazaar, including token lifetimes and potential conflicts.

---

## Token Lifetimes Overview

| Token Type | Duration | Configured In |
|------------|----------|---------------|
| **Access Token (JWT)** | 24 hours | `apps/api/src/config/index.ts` → `JWT_EXPIRES_IN` |
| **Refresh Token** | 30 days | `apps/api/src/config/index.ts` → `REFRESH_TOKEN_EXPIRES_IN` |
| **NextAuth Session** | 30 days | `apps/web/src/lib/auth/authOptions.ts` → `session.maxAge` |

---

## How Token Refresh Works

```
User logs in
    │
    ▼
┌─────────────────────────────────────┐
│  Access Token issued (24h expiry)   │
│  Refresh Token issued (30d expiry)  │
│  NextAuth Session created (30d)     │
└─────────────────────────────────────┘
    │
    ▼ (User visits page after 23+ hours)
    │
┌─────────────────────────────────────┐
│  NextAuth jwt callback checks:      │
│  if (tokenAge > 82800) {  // 23h    │ 
│    refreshAccessToken(token);       │
│  }                                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  API /auth/refresh-token called     │
│  • Old refresh token revoked        │
│  • New access token issued          │
│  • New refresh token issued         │
└─────────────────────────────────────┘
```

### Key Points:
- **Access token refresh triggers at 23 hours** (1 hour before expiry)
- **Refresh tokens are rotated** - each use generates a new one
- **Reuse detection** - if old refresh token is reused, ALL tokens for that user are revoked (security measure)

---

## User Experience

| Scenario | What Happens |
|----------|--------------|
| **User active daily** | Seamless - tokens refresh automatically in background |
| **User returns after 2 days** | Access token expired → Refresh token used → New tokens issued → User stays logged in |
| **User returns after 35 days** | Refresh token expired → User must log in again |
| **User's refresh token reused (theft attempt)** | All tokens revoked → User must log in again |

---

## Potential Conflicts & How They're Handled

### 1. NextAuth Session vs Backend JWT

**Risk**: NextAuth session (30 days) could outlive the refresh token (30 days) if times are slightly off.

**Current Solution**: Both are set to 30 days. The refresh token rotation ensures fresh tokens as long as the user is active.

**Recommendation**: Consider setting NextAuth `session.maxAge` slightly shorter (e.g., 29 days) to ensure it expires before the refresh token.

```typescript
// apps/web/src/lib/auth/authOptions.ts
session: {
  strategy: 'jwt',
  maxAge: 29 * 24 * 60 * 60, // 29 days (1 day less than refresh token)
},
```

### 2. Clock Skew

**Risk**: Server and client clocks may differ slightly.

**Current Solution**: Token refresh triggers at 23 hours (1 hour buffer before 24h expiry).

### 3. Race Conditions During Refresh

**Risk**: Multiple tabs could attempt to refresh simultaneously.

**Current Solution**: Refresh token rotation with reuse detection. If the same token is used twice:
```typescript
// apps/api/src/lib/token.ts
if (existingToken.is_revoked || existingToken.replaced_by) {
  // Revoke all tokens for this user family (security measure)
  await prisma.refresh_tokens.updateMany({
    where: { user_id: existingToken.user_id },
    data: { is_revoked: true },
  });
  throw new Error('Refresh token reused - security alert');
}
```

### 4. Error Handling in Frontend

**Risk**: If token refresh fails, user could be stuck in a broken state.

**Current Solution**: `authOptions.ts` catches refresh errors and sets `token.error`:
```typescript
if (token.error === 'RefreshAccessTokenError') {
  // Frontend can detect this and force logout
}
```

---

## Configuration Reference

### API Configuration (`apps/api/src/config/index.ts`)
```typescript
JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
```

### NextAuth Configuration (`apps/web/src/lib/auth/authOptions.ts`)
```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
},
```

### To Change Expiration Times:

1. **Access Token**: Set `JWT_EXPIRES_IN` in `.env` (e.g., `48h`, `7d`)
2. **Refresh Token**: Set `REFRESH_TOKEN_EXPIRES_IN` in `.env` (e.g., `60d`, `90d`)
3. **NextAuth Session**: Edit `session.maxAge` in `authOptions.ts`

---

## Recommendations

1. **Keep refresh token longer than access token** ✅ (Currently: 30d vs 24h)
2. **Keep NextAuth session ≤ refresh token** ⚠️ (Both are 30d - consider 29d for session)
3. **Refresh before expiry** ✅ (Currently: refreshes at 23h mark)
4. **Implement refresh token rotation** ✅ (Already implemented)
5. **Handle refresh errors gracefully** ✅ (Error state propagated to session)

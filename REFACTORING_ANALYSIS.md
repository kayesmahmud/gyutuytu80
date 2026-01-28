# 🔧 Refactoring Analysis - Top 10 Largest Files

**Generated:** 2025-01-XX  
**Analysis of:** Top 10 files by line count that need refactoring

---

## 📊 Summary

| Rank | File | Lines | Priority | Refactoring Needed |
|------|------|-------|----------|-------------------|
| 1 | `ShopSidebar.tsx` | 996 | 🔴 HIGH | Extract components, custom hooks |
| 2 | `socket/index.ts` | 792 | 🟡 MEDIUM | Split into modules, extract handlers |
| 3 | `SecurityTab.tsx` | 753 | 🟡 MEDIUM | Extract sub-components, hooks |
| 4 | `utils/src/index.ts` | 750 | 🟢 LOW | Split into category modules |
| 5 | `payment.routes.ts` | 745 | 🟡 MEDIUM | Extract service layer |
| 6 | `ads.routes.ts` | 712 | 🟡 MEDIUM | Extract service layer, validators |
| 7 | `auth.routes.ts` | 676 | 🟡 MEDIUM | Extract service layer, validators |
| 8 | `PromoteAdModal.tsx` | 629 | 🟡 MEDIUM | Extract components, hooks |
| 9 | `notifications.ts` | 607 | 🟢 LOW | Split into modules |
| 10 | `ads/route.ts` | 601 | 🟡 MEDIUM | Extract service layer |

---

## 1. 🔴 ShopSidebar.tsx (996 lines) - HIGH PRIORITY

**Location:** `apps/web/src/app/[lang]/shop/[shopSlug]/ShopSidebar.tsx`

### Issues:
- **Massive component** with 4 major sections (About, Contact, Category, Location)
- **Multiple state management** (8+ useState hooks)
- **Repeated patterns** for edit/save/cancel
- **Inline helper functions** that could be extracted
- **Complex form logic** mixed with UI
- **No separation of concerns**

### Refactoring Plan:

#### A. Extract Sub-Components:
```typescript
// components/shop/AboutSection.tsx
// components/shop/ContactSection.tsx
// components/shop/CategorySection.tsx
// components/shop/LocationSection.tsx
```

#### B. Extract Custom Hooks:
```typescript
// hooks/useShopAbout.ts
// hooks/useShopContact.ts
// hooks/useShopCategory.ts
// hooks/useShopLocation.ts
```

#### C. Extract Utilities:
```typescript
// utils/socialMedia.ts - extractSocialUsername, buildSocialUrl, ensureHttps
```

#### D. Create Shared Edit Section Component:
```typescript
// components/shop/EditableSection.tsx - Reusable edit/save/cancel pattern
```

### Expected Reduction: ~600 lines → ~150 lines per component

---

## 2. 🟡 socket/index.ts (792 lines) - MEDIUM PRIORITY

**Location:** `apps/api/src/socket/index.ts`

### Issues:
- **Single file handles all socket events** (messages, typing, conversations, support)
- **Mixed concerns** (authentication, business logic, database operations)
- **Hard to test** individual handlers
- **No separation** between event handlers

### Refactoring Plan:

#### A. Split into Event Handler Modules:
```typescript
// socket/handlers/messageHandlers.ts
// socket/handlers/typingHandlers.ts
// socket/handlers/conversationHandlers.ts
// socket/handlers/supportHandlers.ts
// socket/handlers/auth.ts
```

#### B. Extract Helper Functions:
```typescript
// socket/utils/roomManagement.ts
// socket/utils/userStatus.ts
```

#### C. Create Socket Service Layer:
```typescript
// socket/services/messageService.ts
// socket/services/conversationService.ts
```

### Expected Structure:
```typescript
// socket/index.ts (main file - ~100 lines)
import { initializeMessageHandlers } from './handlers/messageHandlers';
import { initializeSupportHandlers } from './handlers/supportHandlers';
// ... etc

export function initializeSocketIO(httpServer: HttpServer): Server {
  const io = new Server(...);
  io.use(authMiddleware);
  io.on('connection', (socket) => {
    initializeMessageHandlers(io, socket);
    initializeSupportHandlers(io, socket);
    // ... etc
  });
}
```

### Expected Reduction: ~792 lines → ~100 lines main + ~150 lines per handler

---

## 3. 🟡 SecurityTab.tsx (753 lines) - MEDIUM PRIORITY

**Location:** `apps/web/src/components/profile/SecurityTab.tsx`

### Issues:
- **Multiple features** in one component (phone verification, password change, account deletion)
- **Complex state management** for OTP flows
- **Inline sub-components** that should be separate files
- **Repeated OTP input logic**

### Refactoring Plan:

#### A. Extract Sub-Components:
```typescript
// components/profile/PhoneVerificationSection.tsx
// components/profile/ChangePasswordSection.tsx
// components/profile/DangerZone.tsx
// components/profile/OtpInput.tsx (already exists but could be shared)
```

#### B. Extract Custom Hooks:
```typescript
// hooks/useOtpInput.ts - Extract OTP input logic
// hooks/usePhoneVerificationFlow.ts - Extract verification flow
```

#### C. Create Shared Components:
```typescript
// components/shared/SecurityTips.tsx
// components/shared/OAuthOnlyMessage.tsx
```

### Expected Reduction: ~753 lines → ~100 lines main + ~150 lines per section

---

## 4. 🟢 utils/src/index.ts (750 lines) - LOW PRIORITY

**Location:** `packages/utils/src/index.ts`

### Issues:
- **Single file with all utilities** (30+ functions)
- **Well-organized by categories** but could be split
- **Easy to find** but harder to tree-shake

### Refactoring Plan:

#### A. Split into Category Modules:
```typescript
// utils/date.ts
// utils/price.ts
// utils/string.ts
// utils/validation.ts
// utils/url.ts
// utils/location.ts
// utils/array.ts
// utils/storage.ts
// utils/seo.ts
// utils/performance.ts
// utils/browser.ts
// utils/geolocation.ts
// utils/recentlyViewed.ts
```

#### B. Keep Main Index for Re-exports:
```typescript
// utils/index.ts
export * from './date';
export * from './price';
// ... etc
```

### Benefits:
- Better tree-shaking
- Easier to find specific utilities
- Can lazy-load utilities if needed

### Expected Reduction: ~750 lines → ~50-100 lines per module

---

## 5. 🟡 payment.routes.ts (745 lines) - MEDIUM PRIORITY

**Location:** `apps/api/src/routes/payment.routes.ts`

### Issues:
- **Business logic mixed with routes**
- **Large handler functions** (200+ lines)
- **Repeated payment verification logic**
- **Complex callback handling**

### Refactoring Plan:

#### A. Extract Payment Service:
```typescript
// services/payment.service.ts
class PaymentService {
  async initiatePayment(...)
  async verifyPayment(...)
  async handlePaymentSuccess(...)
  async getPaymentStatus(...)
}
```

#### B. Extract Gateway Handlers:
```typescript
// services/paymentGateways/khalti.handler.ts
// services/paymentGateways/esewa.handler.ts
```

#### C. Extract Validators:
```typescript
// validators/payment.validator.ts
```

#### D. Simplify Routes:
```typescript
// routes/payment.routes.ts (thin layer - ~150 lines)
router.post('/initiate', authenticateToken, paymentController.initiate);
router.get('/callback', paymentController.callback);
// ... etc
```

### Expected Reduction: ~745 lines → ~150 lines routes + ~200 lines service

---

## 6. 🟡 ads.routes.ts (712 lines) - MEDIUM PRIORITY

**Location:** `apps/api/src/routes/ads.routes.ts`

### Issues:
- **Multiple endpoints** in one file
- **Business logic in route handlers**
- **Repeated transformation logic** (snake_case → camelCase)
- **Complex query building**

### Refactoring Plan:

#### A. Extract Ad Service:
```typescript
// services/ads.service.ts
class AdService {
  async getAds(filters, pagination)
  async getAdById(id)
  async createAd(data)
  async updateAd(id, data)
  async deleteAd(id)
  async transformAdForApi(ad) // snake_case → camelCase
}
```

#### B. Extract Validators:
```typescript
// validators/ads.validator.ts
```

#### C. Extract Query Builders:
```typescript
// utils/queryBuilders.ts - buildAdWhereClause, buildAdOrderBy
```

#### D. Create Controller Layer:
```typescript
// controllers/ads.controller.ts
```

### Expected Reduction: ~712 lines → ~150 lines routes + ~300 lines service

---

## 7. 🟡 auth.routes.ts (676 lines) - MEDIUM PRIORITY

**Location:** `apps/api/src/routes/auth.routes.ts`

### Issues:
- **Multiple authentication methods** (OTP, OAuth, refresh tokens)
- **Complex OTP flow logic**
- **Repeated validation patterns**
- **Mixed concerns** (SMS, tokens, OAuth)

### Refactoring Plan:

#### A. Extract Auth Service:
```typescript
// services/auth.service.ts
class AuthService {
  async sendOtp(phone, purpose)
  async verifyOtp(phone, otp, purpose)
  async handleOAuthCallback(provider, profile)
  async refreshToken(refreshToken)
}
```

#### B. Extract OTP Service:
```typescript
// services/otp.service.ts
class OtpService {
  async generateAndSend(phone, purpose)
  async verify(phone, otp, purpose)
  async checkCooldown(phone)
}
```

#### C. Extract Validators:
```typescript
// validators/auth.validator.ts
```

#### D. Create Controller Layer:
```typescript
// controllers/auth.controller.ts
```

### Expected Reduction: ~676 lines → ~150 lines routes + ~250 lines services

---

## 8. 🟡 PromoteAdModal.tsx (629 lines) - MEDIUM PRIORITY

**Location:** `apps/web/src/components/promotion/PromoteAdModal.tsx`

### Issues:
- **Complex pricing calculations** mixed with UI
- **Multiple steps** (select, payment) in one component
- **Campaign logic** embedded in component
- **Repeated price calculation functions**

### Refactoring Plan:

#### A. Extract Pricing Logic:
```typescript
// hooks/usePromotionPricing.ts
// utils/promotionPricing.ts - calculatePrice, getDiscounts
```

#### B. Extract Sub-Components:
```typescript
// components/promotion/PromotionTypeSelector.tsx
// components/promotion/DurationSelector.tsx
// components/promotion/PricingDisplay.tsx
// components/promotion/CampaignBanner.tsx
```

#### C. Extract Payment Flow:
```typescript
// hooks/usePromotionPayment.ts
```

#### D. Split into Steps:
```typescript
// components/promotion/SelectPromotionStep.tsx
// components/promotion/PaymentStep.tsx
```

### Expected Reduction: ~629 lines → ~150 lines main + ~100 lines per step

---

## 9. 🟢 notifications.ts (607 lines) - LOW PRIORITY

**Location:** `apps/web/src/lib/notifications/notifications.ts`

### Issues:
- **Single file with all notification logic**
- **Could be split by notification type**

### Refactoring Plan:

#### A. Split by Notification Type:
```typescript
// notifications/push.ts
// notifications/email.ts
// notifications/sms.ts
// notifications/inApp.ts
```

#### B. Create Notification Manager:
```typescript
// notifications/manager.ts - Unified interface
```

### Expected Reduction: ~607 lines → ~150 lines per type

---

## 10. 🟡 ads/route.ts (601 lines) - MEDIUM PRIORITY

**Location:** `apps/web/src/app/api/ads/route.ts`

### Issues:
- **Next.js API route** with business logic
- **Should delegate to service layer**
- **Repeated patterns** with backend routes

### Refactoring Plan:

#### A. Extract Service Layer:
```typescript
// services/ads.service.ts (shared with backend if possible)
```

#### B. Create Thin API Route:
```typescript
// app/api/ads/route.ts (thin layer - ~100 lines)
// Just handles request/response, delegates to service
```

#### C. Consider:
- Move logic to backend API
- Use API client instead of duplicating logic

### Expected Reduction: ~601 lines → ~100 lines route + service layer

---

## 🎯 Refactoring Priority Matrix

### High Priority (Do First):
1. **ShopSidebar.tsx** - Most complex, most benefit from refactoring

### Medium Priority (Do Next):
2. **socket/index.ts** - Important for maintainability
3. **SecurityTab.tsx** - User-facing, needs to be maintainable
4. **payment.routes.ts** - Critical business logic
5. **ads.routes.ts** - Core functionality
6. **auth.routes.ts** - Security-critical
7. **PromoteAdModal.tsx** - User-facing, complex logic
8. **ads/route.ts** - Duplication with backend

### Low Priority (Nice to Have):
9. **utils/src/index.ts** - Already well-organized
10. **notifications.ts** - Less critical

---

## 📋 Refactoring Guidelines

### General Principles:
1. **Single Responsibility** - Each file should do one thing
2. **Extract Hooks** - Move stateful logic to custom hooks
3. **Extract Services** - Move business logic out of routes/components
4. **Create Shared Components** - Reuse common UI patterns
5. **Type Safety** - Maintain TypeScript types throughout
6. **Testability** - Make code easier to test

### File Size Targets:
- **Components:** Max 200-300 lines
- **Hooks:** Max 100-150 lines
- **Services:** Max 300-400 lines
- **Routes:** Max 150-200 lines (thin controllers)

### Testing Strategy:
- Write tests for extracted services/hooks
- Ensure existing tests still pass
- Add integration tests for refactored flows

---

## 🚀 Implementation Order

### Phase 1: High Priority (Week 1)
1. ShopSidebar.tsx refactoring

### Phase 2: Medium Priority - Backend (Week 2)
2. socket/index.ts
3. payment.routes.ts
4. ads.routes.ts
5. auth.routes.ts

### Phase 3: Medium Priority - Frontend (Week 3)
6. SecurityTab.tsx
7. PromoteAdModal.tsx
8. ads/route.ts

### Phase 4: Low Priority (Week 4)
9. utils/src/index.ts
10. notifications.ts

---

## ✅ Success Metrics

After refactoring, we should see:
- **Reduced file sizes** (target: <300 lines per file)
- **Improved testability** (easier to unit test)
- **Better maintainability** (easier to find and fix bugs)
- **Code reuse** (shared components/hooks)
- **Type safety** (maintained throughout)
- **No breaking changes** (all existing functionality works)

---

## 📝 Notes

- All refactoring should maintain backward compatibility
- Update tests as you refactor
- Document new file structure
- Consider creating a migration guide for team members



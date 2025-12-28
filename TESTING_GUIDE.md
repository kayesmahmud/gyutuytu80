# ThuluBazaar Testing Guide

> Comprehensive testing strategy for the ThuluBazaar marketplace platform.
> Last updated: December 2025

## Table of Contents

1. [Overview](#overview)
2. [Current Setup](#current-setup)
3. [Test Categories](#test-categories)
4. [P1: Critical Tests](#p1-critical-tests)
5. [P2: Important Tests](#p2-important-tests)
6. [P3: Nice-to-Have Tests](#p3-nice-to-have-tests)
7. [Running Tests](#running-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Test Data Management](#test-data-management)

---

## Overview

### Codebase Statistics

| Category | Count | Test Coverage |
|----------|-------|---------------|
| Express API Routes (apps/api) | 22 files | ❌ None |
| Next.js API Routes (apps/web) | 133 routes | ⚠️ Minimal |
| React Components | 87 components | ❌ None |
| Custom Hooks | 17 hooks | ❌ None |
| Shared Packages | 5 packages | ❌ None |
| E2E Test Files | 3 specs | ✅ Basic |

### Testing Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        Testing Pyramid                          │
├─────────────────────────────────────────────────────────────────┤
│                         E2E Tests                               │
│                    (Playwright - Slow)                          │
│              ┌─────────────────────────────────┐                │
│              │   • Auth flows                  │                │
│              │   • Critical user journeys      │                │
│              │   • Payment flows               │                │
├──────────────┴─────────────────────────────────┴────────────────┤
│                    Integration Tests                            │
│              (Vitest + Supertest - Medium)                      │
│         ┌─────────────────────────────────────────┐             │
│         │   • API route handlers                  │             │
│         │   • Database operations                 │             │
│         │   • External service mocks              │             │
├─────────┴─────────────────────────────────────────┴─────────────┤
│                       Unit Tests                                │
│                  (Vitest - Fast)                                │
│    ┌───────────────────────────────────────────────────┐        │
│    │   • Helper functions                              │        │
│    │   • Transformers                                  │        │
│    │   • React components                              │        │
│    │   • Custom hooks                                  │        │
│    │   • Validation schemas                            │        │
└────┴───────────────────────────────────────────────────┴────────┘
```

---

## Current Setup

### Installed Tools

```bash
# Unit/Integration Testing
vitest                    # Test runner
@testing-library/react    # React component testing
@testing-library/jest-dom # DOM matchers
jsdom                     # Browser environment simulation

# E2E Testing
@playwright/test          # End-to-end testing

# Accessibility Testing
pa11y                     # Accessibility checker
pa11y-ci                  # CI accessibility runner
@axe-core/cli             # Axe accessibility CLI
```

### Configuration Files

```
apps/web/
├── vitest.config.ts      # Vitest configuration
├── playwright.config.ts  # Playwright configuration
├── .pa11yci              # pa11y CI configuration
└── src/__tests__/
    └── setup.ts          # Test setup and mocks
```

---

## Test Categories

### By Priority

| Priority | Type | Tools | Run Frequency |
|----------|------|-------|---------------|
| 🔴 P1 | Unit Tests | Vitest | Every commit |
| 🔴 P1 | API Route Tests | Vitest + Supertest | Every commit |
| 🔴 P1 | Critical E2E | Playwright | Every PR |
| 🟡 P2 | Component Tests | Testing Library | Every commit |
| 🟡 P2 | Integration Tests | Vitest + PGLite | Every PR |
| 🟢 P3 | Visual Regression | Playwright | Weekly/Release |
| 🟢 P3 | Load Tests | Artillery | Pre-release |
| 🟢 P3 | Accessibility | pa11y | Every PR |

---

## P1: Critical Tests

### 1. API Route Tests (Express Backend)

**Location:** `apps/api/src/__tests__/`

#### Routes to Test (Priority Order)

```typescript
// 🔴 CRITICAL - Authentication
apps/api/src/routes/auth.routes.ts
├── POST /api/auth/login          // User login
├── POST /api/auth/register       // User registration
├── POST /api/auth/refresh        // Token refresh
└── POST /api/auth/logout         // User logout

// 🔴 CRITICAL - Ads (Core Business)
apps/api/src/routes/ads.routes.ts
├── GET  /api/ads                 // List ads
├── GET  /api/ads/:id             // Get single ad
├── POST /api/ads                 // Create ad
├── PUT  /api/ads/:id             // Update ad
└── DELETE /api/ads/:id           // Delete ad

// 🔴 CRITICAL - Payments
apps/api/src/routes/promotion.routes.ts
├── POST /api/promotion/initiate  // Start payment
└── POST /api/promotion/verify    // Verify payment

// 🟡 IMPORTANT - Verification
apps/api/src/routes/verification.routes.ts
├── GET  /api/verification/pricing
├── POST /api/verification/individual
└── POST /api/verification/business

// 🟡 IMPORTANT - Editor/Admin
apps/api/src/routes/editor/*.ts
├── POST /api/editor/auth/login
├── GET  /api/editor/verifications
├── PUT  /api/editor/verifications/:id/approve
└── PUT  /api/editor/verifications/:id/reject
```

#### Test Template for Express Routes

```typescript
// apps/api/src/__tests__/routes/auth.routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index'; // Export app without listen()

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' });

      expect(response.status).toBe(401);
    });

    it('should return token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'test123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });
});
```

### 2. Next.js API Route Tests

**Location:** `apps/web/src/__tests__/api/`

#### Routes to Test (Priority Order)

```typescript
// 🔴 CRITICAL - Authentication
apps/web/src/app/api/auth/
├── login/route.ts
├── register/route.ts
├── send-otp/route.ts
├── verify-otp/route.ts
├── phone-login/route.ts
└── change-password/route.ts

// 🔴 CRITICAL - Payments
apps/web/src/app/api/payments/
├── initiate/route.ts
├── callback/route.ts
└── mock/*/route.ts

// 🔴 CRITICAL - Ads
apps/web/src/app/api/ads/
├── route.ts (GET, POST)
├── [id]/route.ts (GET, PUT, DELETE)
└── [id]/mark-sold/route.ts

// 🟡 IMPORTANT - Verification
apps/web/src/app/api/verification/
├── individual/route.ts
├── business/route.ts
└── pricing/route.ts

// 🟡 IMPORTANT - Shop
apps/web/src/app/api/shop/
├── check-slug/route.ts
└── update-slug/route.ts
```

#### Test Template for Next.js Routes

```typescript
// apps/web/src/__tests__/api/auth/login.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

// Mock Prisma
vi.mock('@thulobazaar/database', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
    },
  },
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for missing email/phone', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 401 for invalid password', async () => {
    const { prisma } = await import('@thulobazaar/database');
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      password_hash: 'hashed_password',
      // ... other fields
    });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

### 3. Critical Component Tests

**Location:** `apps/web/src/__tests__/components/`

#### Components to Test (Priority Order)

```typescript
// 🔴 CRITICAL - Auth Components
components/profile/SecurityTab.tsx       // OTP input, password change
components/auth/LoginForm.tsx            // Login flow
components/auth/RegisterForm.tsx         // Registration flow

// 🔴 CRITICAL - Payment Components
components/payment/PaymentMethodSelector.tsx
components/verification/OrderSummary.tsx
components/promotion/PromoteAdModal.tsx

// 🟡 IMPORTANT - Core UI
components/ads/AdCard.tsx
components/forms/ImageUpload.tsx
components/LocationSelector/LocationSelector.tsx
components/CascadingLocationFilter/CascadingLocationFilter.tsx

// 🟡 IMPORTANT - Dashboard
components/dashboard/AdsList.tsx
components/dashboard/VerificationBanner.tsx
```

#### Test Template for Components

```typescript
// apps/web/src/__tests__/components/profile/SecurityTab.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecurityTab } from '@/components/profile/SecurityTab';

// Mock fetch
global.fetch = vi.fn();

describe('SecurityTab', () => {
  const defaultProps = {
    isPhoneVerified: false,
    currentPhone: null,
    canChangePassword: true,
    onPhoneVerified: vi.fn(),
  };

  it('renders phone verification section when not verified', () => {
    render(<SecurityTab {...defaultProps} />);

    expect(screen.getByText(/verify.*phone/i)).toBeInTheDocument();
  });

  it('shows verified badge when phone is verified', () => {
    render(<SecurityTab {...defaultProps} isPhoneVerified={true} />);

    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  describe('OTP Input', () => {
    it('auto-advances to next input on digit entry', async () => {
      const user = userEvent.setup();
      render(<SecurityTab {...defaultProps} />);

      // Trigger OTP flow first
      const sendOtpButton = screen.getByRole('button', { name: /send.*otp/i });
      await user.click(sendOtpButton);

      // Find OTP inputs and test auto-advance
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');

      expect(inputs[1]).toHaveFocus();
    });

    it('handles paste of full OTP code', async () => {
      const user = userEvent.setup();
      render(<SecurityTab {...defaultProps} />);

      // ... paste test
    });
  });
});
```

### 4. Critical E2E Tests

**Location:** `apps/web/e2e/`

#### User Journeys to Test

```typescript
// e2e/auth.spec.ts - ✅ EXISTS (expand it)
├── Login with email/password
├── Login with phone/OTP
├── Registration flow
├── Password reset flow
└── OAuth login (Google)

// e2e/ad-posting.spec.ts - 🆕 NEW
├── Post new ad (all categories)
├── Edit existing ad
├── Mark ad as sold
├── Delete ad
└── View ad details

// e2e/payment.spec.ts - 🆕 NEW
├── Promote ad flow
├── Business verification payment
├── Individual verification payment
└── Payment failure handling

// e2e/verification.spec.ts - 🆕 NEW
├── Individual verification submission
├── Business verification submission
├── Resubmission after rejection
└── Verification expiry handling

// e2e/messaging.spec.ts - 🆕 NEW
├── Start new conversation
├── Send/receive messages
├── Image upload in chat
└── Conversation archive/mute

// e2e/shop.spec.ts - 🆕 NEW
├── View shop page
├── Edit custom shop URL
├── Report shop
└── View shop ads
```

#### E2E Test Template

```typescript
// apps/web/e2e/ad-posting.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ad Posting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/en/auth/login');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test('should post a new ad successfully', async ({ page }) => {
    await page.goto('/en/post-ad');

    // Fill form
    await page.fill('[name="title"]', 'Test iPhone 15 Pro');
    await page.fill('[name="description"]', 'Brand new iPhone for sale');
    await page.fill('[name="price"]', '150000');

    // Select category
    await page.click('[data-testid="category-selector"]');
    await page.click('text=Electronics');
    await page.click('text=Mobile Phones');

    // Select location
    await page.click('[data-testid="location-selector"]');
    await page.click('text=Kathmandu');

    // Upload image
    await page.setInputFiles('input[type="file"]', 'test-image.jpg');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Test iPhone 15 Pro')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/en/post-ad');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/title.*required/i)).toBeVisible();
  });
});
```

---

## P2: Important Tests

### 1. Custom Hook Tests

**Location:** `apps/web/src/__tests__/hooks/`

```typescript
// Hooks to test
usePhoneVerification.ts   // OTP sending/verification
useAdActions.ts           // Ad CRUD operations
useProfileData.ts         // Profile fetching
useShopSlug.ts            // Shop URL management
useChangePassword.ts      // Password change flow
useDashboard.ts           // Dashboard data
useVerificationForm.ts    // Verification submission
useSocket.ts              // WebSocket connection
```

#### Hook Test Template

```typescript
// apps/web/src/__tests__/hooks/usePhoneVerification.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';

global.fetch = vi.fn();

describe('usePhoneVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends OTP successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendOtp('9800000000');
    });

    expect(result.current.otpSent).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles invalid phone number', async () => {
    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      await result.current.sendOtp('123'); // Invalid
    });

    expect(result.current.error).toContain('invalid');
  });

  it('verifies OTP successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { verified: true } }),
    } as Response);

    const { result } = renderHook(() => usePhoneVerification());

    await act(async () => {
      const verified = await result.current.verifyOtp('9800000000', '123456');
      expect(verified).toBe(true);
    });
  });
});
```

### 2. Database Integration Tests

**Location:** `apps/web/src/__tests__/integration/`

```typescript
// Test scenarios
├── User CRUD operations
├── Ad creation with relations
├── Verification request workflow
├── Payment transaction logging
├── Message conversation creation
└── Shop report handling
```

#### Integration Test Setup with PGLite

```typescript
// apps/web/src/__tests__/integration/setup.ts
import { PGlite } from '@electric-sql/pglite';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

let db: PGlite;
let prisma: PrismaClient;

beforeAll(async () => {
  // Create in-memory PostgreSQL
  db = new PGlite();

  // Run migrations
  // ... setup schema
});

beforeEach(async () => {
  // Clean tables between tests
  await prisma.$executeRaw`TRUNCATE users, ads, messages CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
  await db.close();
});

export { prisma };
```

### 3. Package Tests

**Location:** `packages/*/src/__tests__/`

```typescript
// packages/types/src/__tests__/
├── transformers.test.ts    // DB ↔ API transformations
└── guards.test.ts          // Type guards

// packages/api-client/src/__tests__/
├── base.test.ts            // Base client
└── methods/*.test.ts       // API methods

// packages/utils/src/__tests__/
└── index.test.ts           // Utility functions
```

#### Transformer Test Example

```typescript
// packages/types/src/__tests__/transformers.test.ts
import { describe, it, expect } from 'vitest';
import { transformDbUserToApi, transformDbAdToApi } from '../transformers';

describe('transformDbUserToApi', () => {
  it('transforms snake_case to camelCase', () => {
    const dbUser = {
      id: 1,
      full_name: 'John Doe',
      email: 'john@test.com',
      phone_verified: true,
      created_at: new Date('2024-01-01'),
    };

    const apiUser = transformDbUserToApi(dbUser);

    expect(apiUser.fullName).toBe('John Doe');
    expect(apiUser.phoneVerified).toBe(true);
    expect(apiUser.createdAt).toEqual(new Date('2024-01-01'));
  });

  it('handles null values correctly', () => {
    const dbUser = {
      id: 1,
      full_name: null,
      email: null,
    };

    const apiUser = transformDbUserToApi(dbUser);

    expect(apiUser.fullName).toBeNull();
    expect(apiUser.email).toBeNull();
  });
});
```

---

## P3: Nice-to-Have Tests

### 1. Visual Regression Tests

**Location:** `apps/web/e2e/visual/`

```typescript
// apps/web/e2e/visual/screenshots.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage screenshot', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 100,
    });
  });

  test('login page screenshot', async ({ page }) => {
    await page.goto('/en/auth/login');
    await expect(page).toHaveScreenshot('login.png');
  });

  test('ad card screenshot', async ({ page }) => {
    await page.goto('/en');
    const adCard = page.locator('[data-testid="ad-card"]').first();
    await expect(adCard).toHaveScreenshot('ad-card.png');
  });
});
```

### 2. Load Testing with Artillery

**Location:** `tests/load/`

```yaml
# tests/load/api-load.yml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Peak load"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "Browse ads"
    weight: 60
    flow:
      - get:
          url: "/api/ads?page=1&limit=20"
      - get:
          url: "/api/categories"

  - name: "Search"
    weight: 30
    flow:
      - get:
          url: "/api/search?q=iphone&location=kathmandu"

  - name: "View ad"
    weight: 10
    flow:
      - get:
          url: "/api/ads/1"
```

```bash
# Run load test
npx artillery run tests/load/api-load.yml
```

### 3. Contract Testing

**Location:** `tests/contracts/`

```typescript
// tests/contracts/api-schema.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define API contract schemas
const AdResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),
    price: z.number().nullable(),
    description: z.string(),
    images: z.array(z.string()),
    category: z.object({
      id: z.number(),
      name: z.string(),
    }),
    location: z.object({
      id: z.number(),
      name: z.string(),
    }),
    user: z.object({
      id: z.number(),
      fullName: z.string(),
    }),
    createdAt: z.string(),
  }),
});

describe('API Contract Tests', () => {
  it('GET /api/ads/:id matches schema', async () => {
    const response = await fetch('http://localhost:5000/api/ads/1');
    const data = await response.json();

    const result = AdResponseSchema.safeParse(data);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.format());
    }
  });
});
```

---

## Running Tests

### Available Commands

```bash
# From apps/web directory
cd apps/web

# Unit tests
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage report

# Specific test types
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:api          # API route tests only

# E2E tests
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # See browser

# Accessibility
npm run a11y              # Run pa11y-ci
```

### Test Patterns

```bash
# Run specific test file
npm run test -- helpers.test.ts

# Run tests matching pattern
npm run test -- --grep "auth"

# Run with verbose output
npm run test -- --reporter=verbose

# Update snapshots
npm run test -- --update
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run test:run --workspace=web

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: thulobazaar_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e --workspace=web
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/thulobazaar_test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report/

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run a11y --workspace=web
```

---

## Test Data Management

### Test Fixtures

```typescript
// apps/web/src/__tests__/fixtures/users.ts
export const testUsers = {
  regular: {
    id: 1,
    email: 'user@test.com',
    password: 'test123',
    fullName: 'Test User',
  },
  verified: {
    id: 2,
    email: 'verified@test.com',
    password: 'test123',
    fullName: 'Verified User',
    individualVerified: true,
  },
  business: {
    id: 3,
    email: 'business@test.com',
    password: 'test123',
    businessName: 'Test Business',
    businessVerificationStatus: 'approved',
  },
  editor: {
    id: 100,
    email: 'editor@thulobazaar.com',
    password: 'editor123',
    role: 'editor',
  },
};

// apps/web/src/__tests__/fixtures/ads.ts
export const testAds = {
  basic: {
    title: 'Test Ad',
    description: 'Test description',
    price: 10000,
    categoryId: 1,
    locationId: 1,
  },
  withImages: {
    title: 'Ad with Images',
    description: 'Has images',
    price: 20000,
    images: ['image1.jpg', 'image2.jpg'],
  },
};
```

### Database Seeding for Tests

```typescript
// packages/database/src/test-seed.ts
import { prisma } from './client';
import { testUsers, testAds } from './fixtures';

export async function seedTestDatabase() {
  // Clear existing data
  await prisma.$executeRaw`TRUNCATE users, ads, categories CASCADE`;

  // Seed categories
  await prisma.categories.createMany({
    data: [
      { id: 1, name: 'Electronics', slug: 'electronics' },
      { id: 2, name: 'Vehicles', slug: 'vehicles' },
    ],
  });

  // Seed test users
  for (const user of Object.values(testUsers)) {
    await prisma.users.create({ data: user });
  }

  // Seed test ads
  // ...
}

export async function cleanupTestDatabase() {
  await prisma.$executeRaw`TRUNCATE users, ads CASCADE`;
}
```

---

## Checklist: Tests to Implement

### P1 - Must Have (Before Next Release)

- [ ] **Auth Routes Tests** (apps/api)
  - [ ] Login (email + phone)
  - [ ] Register
  - [ ] Token refresh
  - [ ] Password reset

- [ ] **Auth API Tests** (apps/web)
  - [ ] OTP send/verify
  - [ ] Phone login
  - [ ] Change password

- [ ] **Payment Tests**
  - [ ] Initiate payment
  - [ ] Payment callback
  - [ ] Mock payment flow

- [ ] **Core Component Tests**
  - [ ] OtpInput component
  - [ ] PaymentMethodSelector
  - [ ] ImageUpload

### P2 - Should Have (Next Sprint)

- [ ] **Hook Tests**
  - [ ] usePhoneVerification
  - [ ] useShopSlug
  - [ ] useDashboard

- [ ] **More E2E Coverage**
  - [ ] Ad posting flow
  - [ ] Verification submission
  - [ ] Shop page

- [ ] **Package Tests**
  - [ ] Transformer functions
  - [ ] API client methods

### P3 - Nice to Have (Future)

- [ ] Visual regression setup
- [ ] Load testing scripts
- [ ] Contract tests with Zod
- [ ] Performance benchmarks

---

## Quick Reference

```bash
# Run all tests
npm run test:run

# Run E2E before deploy
npm run test:e2e

# Check accessibility
npm run a11y

# Generate coverage report
npm run test:coverage
```

**Coverage Targets:**
- Unit Tests: 80%+
- API Routes: 90%+
- Critical Paths: 100%

---

*Document maintained by the ThuluBazaar development team.*

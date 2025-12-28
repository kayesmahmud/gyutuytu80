# 🚀 Development vs Production: Why Code Works Locally But Fails on Vercel

## Table of Contents
- [The Problem](#the-problem)
- [Why It Happens](#why-it-happens)
- [How to Avoid It](#how-to-avoid-it)
- [Best Practices for Big Projects](#best-practices-for-big-projects)
- [Quick Reference](#quick-reference)

---

## 🔴 The Problem

Your code works perfectly on `localhost` but fails when deploying to Vercel (or any production environment). This is one of the most common issues in web development!

### Common Error Messages:
- ❌ `Type error: Type 'string' is not assignable to type 'literal'`
- ❌ `Module not found: Can't resolve 'package-name'`
- ❌ `Error: Command "npm run build" exited with 1`
- ❌ `ReferenceError: window is not defined`

---

## 🤔 Why It Happens

### 1. Development vs Production Mode

| Aspect | Development (`npm run dev`) | Production (`npm run build`) |
|--------|---------------------------|----------------------------|
| **Speed** | Fast, hot reload | Slower, full optimization |
| **TypeScript** | Lenient, shows warnings | Strict, fails on errors |
| **Error Handling** | Allows many errors | Zero tolerance for errors |
| **Code Optimization** | Minimal | Full minification, tree-shaking |
| **Purpose** | Quick iteration | Final deployment |

```bash
# Development - Forgiving
npm run dev
# ✅ Type errors? Just warnings, app keeps running
# ✅ Missing packages? Hot reload might still work
# ✅ Undefined variables? Shows in console, doesn't crash

# Production - Strict
npm run build
# ❌ Type errors? Build fails immediately
# ❌ Missing packages? Build stops
# ❌ Any errors? No deployment
```

### 2. TypeScript Checking Levels

**Development Mode:**
```typescript
// This might work in dev mode
const role = 'user';  // TypeScript infers as 'string'
const message = { role, content: 'hi' };  // ⚠️ Warning, but doesn't stop app
```

**Production Mode:**
```typescript
// This FAILS in production build
const role = 'user';  // Type: string
const message: Message = { role, content: 'hi' };
// ❌ ERROR: Type 'string' not assignable to '"user" | "assistant"'

// ✅ FIX: Use type assertion
const role = 'user' as const;  // Type: 'user' (literal)
const message: Message = { role, content: 'hi' };  // ✅ Works!
```

### 3. Server-Side Rendering (SSR) vs Client-Side

**The Issue:**
```typescript
// ❌ This fails on Vercel (tries to run on server)
import { UltravoxSession } from 'ultravox-client';  // Browser-only package

// Server tries to execute this during build → Error: window is not defined
```

**The Fix:**
```typescript
// ✅ Dynamic import (only runs in browser)
let UltravoxSession: any = null;
if (typeof window !== 'undefined') {
  import('ultravox-client').then(module => {
    UltravoxSession = module.UltravoxSession;
  });
}

// Or use async/await
const loadUltravox = async () => {
  if (typeof window !== 'undefined') {
    const { UltravoxSession } = await import('ultravox-client');
    return UltravoxSession;
  }
};
```

### 4. Package Installation Differences

**Localhost:**
- Uses existing `node_modules/` (already installed)
- Has cache from previous installs
- Might have global packages

**Vercel:**
- Fresh install from `package.json`
- No cache on first deploy
- Only installs listed dependencies
- Version mismatches can cause issues

---

## ✅ How to Avoid It

### 1. **Always Test Production Build Locally** (Most Important!)

```bash
# Run BEFORE pushing to GitHub/Vercel
npm run build

# If it succeeds, your deployment will likely succeed
# If it fails, fix errors locally first
```

**Add to your workflow:**
```bash
# Step 1: Make changes
# Step 2: Test in dev mode
npm run dev

# Step 3: Test production build
npm run build

# Step 4: Only if build succeeds, deploy
git add .
git commit -m "your changes"
git push
```

### 2. **Enable Strict TypeScript Mode**

Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,              // Enable all strict type checks
    "noImplicitAny": true,       // Error on implied 'any' type
    "strictNullChecks": true,    // Check for null/undefined
    "noUncheckedIndexedAccess": true,  // Check array access
    "noUnusedLocals": true,      // Error on unused variables
    "noUnusedParameters": true,  // Error on unused parameters
    "noImplicitReturns": true    // Ensure all paths return a value
  }
}
```

**Why?** Catches errors in development that would fail in production.

### 3. **Use Type Assertions Correctly**

```typescript
// ❌ Wrong - Type is inferred as 'string'
const messages = [...prev, { role: 'user', content: text }];

// ✅ Right - Type is literal 'user'
const messages = [...prev, { role: 'user' as const, content: text }];

// ✅ Alternative - Explicit type annotation
const messages: Message[] = [...prev, { role: 'user', content: text }];
```

### 4. **Handle Browser-Only Code**

```typescript
// ✅ Method 1: Check if window exists
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value');
  window.addEventListener('resize', handler);
}

// ✅ Method 2: Dynamic import
const loadBrowserModule = async () => {
  if (typeof window !== 'undefined') {
    const module = await import('./browser-only-module');
    return module;
  }
};

// ✅ Method 3: Use Next.js dynamic import
import dynamic from 'next/dynamic';

const BrowserComponent = dynamic(() => import('./BrowserComponent'), {
  ssr: false  // Don't render on server
});
```

### 5. **Lock Package Versions**

```bash
# Install with exact version (no ^ or ~)
npm install --save-exact package-name

# This creates package-lock.json with exact versions
# Both dev and production use identical versions
```

**In `package.json`:**
```json
{
  "dependencies": {
    "next": "14.2.35",           // ✅ Exact version
    "react": "^18.3.0"           // ⚠️ May update to 18.3.x
  }
}
```

---

## 🛡️ Best Practices for Big Projects

### 1. Pre-commit Hooks (Husky)

**Prevents bad code from being committed**

```bash
# Install
npm install --save-dev husky lint-staged

# Initialize
npx husky install
```

**Create `.husky/pre-commit`:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run build
npm run build || exit 1

# Run linter
npm run lint || exit 1

# Run tests (if you have them)
npm test || exit 1

echo "✅ All checks passed!"
```

Now Git won't let you commit if build fails!

### 2. GitHub Actions CI/CD

**Automatically test every push**

Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run TypeScript check
      run: npx tsc --noEmit

    - name: Run linter
      run: npm run lint

    - name: Run production build
      run: npm run build

    - name: Run tests
      run: npm test

    - name: Deploy to Vercel (only on main)
      if: github.ref == 'refs/heads/main'
      run: vercel --prod
      env:
        VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### 3. Project Scripts Setup

**Add to `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "verify": "npm run type-check && npm run lint && npm run build",
    "deploy": "npm run verify && git push"
  }
}
```

**Usage:**
```bash
# Before deploying
npm run verify

# Or use the deploy script
npm run deploy  # Runs all checks, then pushes
```

### 4. Environment Variables Management

**Create `.env.example`:**
```bash
# Copy this to .env.local and fill in your values
DEEPSEEK_API_KEY=your_key_here
NEXT_PUBLIC_ULTRAVOX_API_KEY=your_key_here
```

**In Vercel Dashboard:**
- Add all environment variables from `.env.example`
- Use different values for production if needed
- Never commit `.env.local` to Git

### 5. Error Boundaries

**Add global error handling:**

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 6. Logging and Monitoring

```typescript
// Use environment-aware logging
const isDev = process.env.NODE_ENV === 'development';

const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
    // In production, send to error tracking service
    if (!isDev) {
      // sendToSentry(args);
    }
  }
};
```

### 7. Testing Strategy

```bash
# Install testing libraries
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Add test script
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

**Write tests for critical features:**
```typescript
// __tests__/chat.test.tsx
import { render, screen } from '@testing-library/react';
import RoleplayChat from '@/app/page';

describe('RoleplayChat', () => {
  it('renders persona selection', () => {
    render(<RoleplayChat />);
    expect(screen.getByText('Choose Your Companion')).toBeInTheDocument();
  });
});
```

---

## 📋 Quick Reference

### Development Checklist (Every Deploy)

```bash
# 1. Make changes
# 2. Test in dev mode
npm run dev

# 3. Check TypeScript
npm run type-check

# 4. Lint code
npm run lint

# 5. Test production build
npm run build

# 6. Run tests
npm test

# 7. If all pass, deploy
git add .
git commit -m "your message"
git push
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Type error in build | Loose type inference | Add `as const` or explicit types |
| Module not found | Package not in dependencies | Add to `package.json` |
| window is not defined | SSR trying to access browser APIs | Use `typeof window !== 'undefined'` |
| Build works locally, fails on Vercel | Different Node versions | Specify Node version in `package.json` |
| Environment variables not working | Not added to Vercel | Add in Vercel dashboard |

### Environment-Specific Code Template

```typescript
// For browser-only code
if (typeof window !== 'undefined') {
  // Browser code here
}

// For server-only code
if (typeof window === 'undefined') {
  // Server code here
}

// For dynamic imports
const loadModule = async () => {
  if (typeof window !== 'undefined') {
    const module = await import('browser-only-package');
    return module;
  }
};

// For Next.js
import dynamic from 'next/dynamic';

const Component = dynamic(() => import('./Component'), {
  ssr: false
});
```

---

## 🎯 Summary

**The Core Issue:**
- `npm run dev` is forgiving and fast
- `npm run build` is strict and catches all errors
- Production environment is different from development

**The Solution:**
1. Always run `npm run build` locally before deploying
2. Enable TypeScript strict mode
3. Use proper type assertions
4. Handle browser-only code correctly
5. Set up automated checks (CI/CD, pre-commit hooks)

**For Big Projects:**
- Use pre-commit hooks (Husky)
- Set up GitHub Actions for CI/CD
- Write tests for critical features
- Use error boundaries
- Add logging and monitoring
- Lock package versions
- Document environment variables

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Husky Documentation](https://typicode.github.io/husky/)

---

**Remember:** The best way to avoid deployment issues is to test production builds locally before deploying. Make `npm run build` part of your regular workflow! 🚀

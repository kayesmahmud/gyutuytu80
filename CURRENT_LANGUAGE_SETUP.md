# Your Current Language Setup (Already Configured!)

## 🌐 Web App - URL Structure

### Current Configuration

**Base URL:** `http://localhost:3333`

**Language URLs:**
```
✅ English:  /en/*
✅ Nepali:   /ne/*

Root:        / → redirects to /en
```

### Examples of Your Current URLs

| Page | English URL | Nepali URL |
|------|-------------|------------|
| Home | http://localhost:3333/en | http://localhost:3333/ne |
| Ads List | http://localhost:3333/en/ads | http://localhost:3333/ne/ads |
| Post Ad | http://localhost:3333/en/post-ad | http://localhost:3333/ne/post-ad |
| Profile | http://localhost:3333/en/profile | http://localhost:3333/ne/profile |
| Dashboard | http://localhost:3333/en/dashboard | http://localhost:3333/ne/dashboard |
| Ad Detail | http://localhost:3333/en/ad/[slug] | http://localhost:3333/ne/ad/[slug] |

### How It Works

```
apps/web/src/app/
├── [lang]/                    ← Dynamic language segment
│   ├── layout.tsx            ← Supports 'en' and 'ne'
│   ├── page.tsx              ← Home page
│   ├── ads/
│   ├── post-ad/
│   └── profile/
```

**File:** `apps/web/src/app/[lang]/layout.tsx`
```typescript
const supportedLanguages = ['en', 'ne'] as const;
//                                ^^
//                         ALREADY CONFIGURED!

export async function generateMetadata({ params }) {
  const { lang } = await params;

  return {
    description: lang === 'ne'
      ? 'नेपालको अग्रणी क्लासिफाइड मार्केटप्लेस'
      : "Nepal's Leading Classifieds Marketplace",
  };
}
```

---

## 🎨 Current Implementation Status

### ✅ What's Already Working
- `/en` and `/ne` URLs are configured
- Language routing is set up
- Metadata changes based on language
- Header receives language prop

### ⚠️ What's Missing (Manual Translations)
- Content is still hardcoded in English
- No centralized translation files yet
- Language switching doesn't change text

### Example from your code:

**Current (Hardcoded):**
```typescript
// apps/web/src/app/[lang]/page.tsx
<h1>Buy & Sell Everything</h1>  // Always English
```

**After implementing i18n:**
```typescript
const t = useTranslations();
<h1>{t('home.title')}</h1>
// English: "Buy & Sell Everything"
// Nepali: "सबै किन्नुहोस् र बेच्नुहोस्"
```

---

## 📱 Mobile App - Language Setup

### Current Status
- No language support yet
- App is in English only

### After Implementation
- Auto-detects device language
- Stores preference: `AsyncStorage.setItem('@language', 'ne')`
- No URLs (native app)

---

## 🚀 Next Steps

### To Make Language Switching Actually Work:

#### Option 1: Web App (next-intl)
```bash
cd apps/web
npm install next-intl

# Configure next-intl to use @thulobazaar/translations
# Update components to use t('key') instead of hardcoded text
```

#### Option 2: Mobile App (react-i18next)
```bash
cd apps/mobile
npm install i18next react-i18next expo-localization

# Configure i18n to use @thulobazaar/translations
# Update components to use t('key')
```

---

## 🎯 Summary

**Your Question:**
> "which url u puted nepali language"

**Answer:**
> I didn't put any URL - you **already have** `/ne` for Nepali!
> - English: `/en/*`
> - Nepali: `/ne/*`
>
> This is already in your code at:
> - `apps/web/src/app/[lang]/layout.tsx` (line 6)
> - `apps/web/next.config.ts` (line 55)

**What I Created:**
> Translation files (`packages/translations/`) so when users visit:
> - `/en/ads` → Shows "Post Ad"
> - `/ne/ads` → Shows "विज्ञापन पोस्ट गर्नुहोस्"

**Current State:**
> - URLs exist ✅
> - Routing works ✅
> - Translation files ready ✅
> - Need to connect them together ⚠️

---

## 🔗 How URLs Currently Work

### User Visits `/en`
```
1. Next.js sees [lang] = 'en'
2. Validates: supportedLanguages.includes('en') ✅
3. Sets metadata in English
4. Passes lang='en' to Header
5. Shows page (currently hardcoded English)
```

### User Visits `/ne`
```
1. Next.js sees [lang] = 'ne'
2. Validates: supportedLanguages.includes('ne') ✅
3. Sets metadata in Nepali (नेपालको अग्रणी...)
4. Passes lang='ne' to Header
5. Shows page (currently STILL English - needs translation)
```

### User Visits `/fr` (French - Not Supported)
```
1. Next.js sees [lang] = 'fr'
2. Validates: supportedLanguages.includes('fr') ❌
3. Returns 404 Not Found
```

---

## 🧪 Test Your Current URLs

Open your browser and try:

```bash
# Start web app
cd /Users/elw/Documents/Web/thulobazaar/monorepo/apps/web
npm run dev

# Then visit:
http://localhost:3333/en        # ✅ Works
http://localhost:3333/ne        # ✅ Works (but content still English)
http://localhost:3333           # ✅ Redirects to /en
http://localhost:3333/fr        # ❌ 404 (not supported)
```

The URLs work! You just need to connect the translation files I created! 🎉

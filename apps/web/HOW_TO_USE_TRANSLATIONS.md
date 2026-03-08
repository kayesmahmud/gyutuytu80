# How to Use Translations in Your Components

## ✅ Setup Complete!

Your app is now configured with next-intl. Here's how to use it:

---

## 🎯 Basic Usage

### Server Component (Default)

```typescript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations(); // Get translations

  return (
    <div>
      <h1>{t('home.title')}</h1>
      {/* Nepali: सबै किन्नुहोस् र बेच्नुहोस् */}
      {/* English: Buy & Sell Everything */}

      <p>{t('home.subtitle')}</p>
      {/* Nepali: नेपालको अग्रणी क्लासिफाइड मार्केटप्लेस */}
      {/* English: Nepal's Leading Classifieds Marketplace */}

      <button>{t('ads.postAd')}</button>
      {/* Nepali: विज्ञापन पोस्ट गर्नुहोस् */}
      {/* English: Post Ad */}
    </div>
  );
}
```

### Client Component

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function SearchButton() {
  const t = useTranslations();

  return (
    <button onClick={() => console.log('Searching...')}>
      {t('common.search')}
      {/* Nepali: खोज्नुहोस् */}
      {/* English: Search */}
    </button>
  );
}
```

---

## 📝 Translation Keys Reference

### Common UI
```typescript
t('common.search')      // खोज्नुहोस् / Search
t('common.filter')      // फिल्टर / Filter
t('common.save')        // सुरक्षित गर्नुहोस् / Save
t('common.delete')      // मेटाउनुहोस् / Delete
t('common.edit')        // सम्पादन गर्नुहोस् / Edit
t('common.cancel')      // रद्द गर्नुहोस् / Cancel
t('common.submit')      // पेश गर्नुहोस् / Submit
t('common.loading')     // लोड हुँदैछ... / Loading...
t('common.error')       // केहि गलत भयो / Something went wrong
```

### Authentication
```typescript
t('auth.login')         // लगइन / Login
t('auth.logout')        // लगआउट / Logout
t('auth.register')      // दर्ता गर्नुहोस् / Register
t('auth.welcome')       // ठूलोबजारमा स्वागत छ / Welcome to Thulo Bazaar
t('auth.phoneNumber')   // फोन नम्बर / Phone Number
t('auth.enterOTP')      // OTP प्रविष्ट गर्नुहोस् / Enter OTP
```

### Home Page
```typescript
t('home.title')         // सबै किन्नुहोस् र बेच्नुहोस् / Buy & Sell Everything
t('home.subtitle')      // नेपालको अग्रणी... / Nepal's Leading...
t('home.categories')    // वर्गहरू / Categories
t('home.featuredAds')   // विशेष विज्ञापनहरू / Featured Ads
t('home.recentAds')     // भर्खरका विज्ञापनहरू / Recent Ads
t('home.viewAll')       // सबै हेर्नुहोस् / View All
```

### Ads
```typescript
t('ads.postAd')         // विज्ञापन पोस्ट गर्नुहोस् / Post Ad
t('ads.myAds')          // मेरा विज्ञापनहरू / My Ads
t('ads.favorites')      // मनपर्नेहरू / Favorites
t('ads.price')          // मूल्य / Price
t('ads.location')       // स्थान / Location
t('ads.negotiable')     // मोलमोलाई / Negotiable
t('ads.contactSeller')  // विक्रेतालाई सम्पर्क गर्नुहोस् / Contact Seller
```

### Categories
```typescript
t('categories.all')         // सबै वर्गहरू / All Categories
t('categories.vehicles')    // सवारी साधन / Vehicles
t('categories.electronics') // इलेक्ट्रोनिक्स / Electronics
t('categories.realEstate')  // घर जग्गा / Real Estate
t('categories.jobs')        // रोजगारी / Jobs
```

### Profile
```typescript
t('profile.myProfile')      // मेरो प्रोफाइल / My Profile
t('profile.editProfile')    // प्रोफाइल सम्पादन गर्नुहोस् / Edit Profile
t('profile.settings')       // सेटिङहरू / Settings
t('profile.accountType')    // खाता प्रकार / Account Type
```

---

## 🎨 Scoped Translations (Recommended)

Instead of passing the full key every time, you can scope translations:

```typescript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home'); // Scoped to 'home'

  return (
    <div>
      <h1>{t('title')}</h1>          {/* home.title */}
      <p>{t('subtitle')}</p>          {/* home.subtitle */}
      <button>{t('viewAll')}</button> {/* home.viewAll */}
    </div>
  );
}
```

Multiple scopes in one component:

```typescript
export default function AdCard() {
  const tCommon = useTranslations('common');
  const tAds = useTranslations('ads');

  return (
    <div>
      <h3>{tAds('price')}</h3>              {/* ads.price */}
      <button>{tCommon('save')}</button>     {/* common.save */}
      <button>{tCommon('delete')}</button>   {/* common.delete */}
    </div>
  );
}
```

---

## 🔄 Replace Hardcoded Text

### Before (Hardcoded)
```typescript
<h1 className="text-4xl font-bold">
  Buy, Sell, and Rent Across Nepal
</h1>
```

### After (Translated)
```typescript
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('home');

  return (
    <h1 className="text-4xl font-bold">
      {t('title')}
    </h1>
  );
}
```

**Result:**
- `/en` → "Buy & Sell Everything"
- `/ne` → "सबै किन्नुहोस् र बेच्नुहोस्"

---

## 📋 Step-by-Step Example: Update Homepage

### 1. Add Import
```typescript
// At top of page.tsx
import { useTranslations } from 'next-intl';
```

### 2. Get Translation Function
```typescript
export default function HomePage() {
  const t = useTranslations(); // Or scoped: useTranslations('home')

  // ... rest of code
}
```

### 3. Replace Text
```typescript
// BEFORE
<h1>Buy, Sell, and Rent Across Nepal</h1>

// AFTER
<h1>{t('home.title')}</h1>
```

```typescript
// BEFORE
<button>POST FREE AD</button>

// AFTER
<button>{t('ads.postAd')}</button>
```

```typescript
// BEFORE
<h2>Browse Categories</h2>

// AFTER
<h2>{t('home.categories')}</h2>
```

---

## 🎯 Common Patterns

### Buttons
```typescript
const t = useTranslations('common');

<button>{t('save')}</button>
<button>{t('cancel')}</button>
<button>{t('delete')}</button>
<button>{t('submit')}</button>
```

### Links
```typescript
const t = useTranslations('home');

<Link href="/ads">{t('viewAll')}</Link>
```

### Headings
```typescript
const t = useTranslations('home');

<h1>{t('title')}</h1>
<h2>{t('categories')}</h2>
<h3>{t('featuredAds')}</h3>
```

### Placeholders
```typescript
const t = useTranslations('common');

<input placeholder={t('search')} />
```

### Error Messages
```typescript
const t = useTranslations('errors');

{error && <p>{t('networkError')}</p>}
```

---

## 🚀 See It in Action

### 1. Start Server
```bash
# Already running at http://localhost:3333
```

### 2. Visit URLs
```
http://localhost:3333/en  → English version
http://localhost:3333/ne  → Nepali version
```

### 3. See Translations Work!
- Same component
- Different language based on URL
- All automatic! ✨

---

## 📝 Quick Checklist

When updating a component:

- [ ] Add import: `import { useTranslations } from 'next-intl';`
- [ ] Get function: `const t = useTranslations();` or `const t = useTranslations('section');`
- [ ] Replace hardcoded text: `{t('key')}`
- [ ] Save file
- [ ] Refresh browser
- [ ] Test both `/en` and `/ne` URLs
- [ ] Fix any missing translations in ne.json
- [ ] Done! ✅

---

## 💡 Pro Tips

### 1. Use Scoped Translations
```typescript
// Good ✅
const t = useTranslations('home');
<h1>{t('title')}</h1>

// Also works, but more typing
const t = useTranslations();
<h1>{t('home.title')}</h1>
```

### 2. TypeScript Autocomplete
If you want autocomplete for translation keys, you can add type definitions (optional).

### 3. Missing Key Warning
If you use `t('non.existent.key')`, it will show the key itself. Check console for warnings.

### 4. Dynamic Content
For database content (ad titles, descriptions), DON'T translate:
```typescript
// DON'T
<h3>{t(ad.title)}</h3> // ❌ Won't work

// DO
<h3>{ad.title}</h3> // ✅ Show as is
```

---

## 🎉 You're Ready!

Now you can translate any component:

1. Import `useTranslations`
2. Get the `t` function
3. Replace hardcoded text with `t('key')`
4. Test on `/en` and `/ne`

**The translations are already done - just use them!** 🚀

---

## 📚 See Full Translation Keys

Check these files:
- `packages/translations/en.json` - All English text
- `packages/translations/ne.json` - All Nepali text

**250+ translations ready to use!**

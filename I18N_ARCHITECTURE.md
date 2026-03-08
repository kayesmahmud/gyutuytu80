# Thulo Bazaar i18n Architecture

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOREPO ROOT                            │
│  /Users/elw/Documents/Web/thulobazaar/monorepo             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                             │
        ▼                                             ▼
┌──────────────────┐                         ┌──────────────────┐
│    packages/     │                         │      apps/       │
│  translations/   │◄────────────────────────│  web + mobile    │
└──────────────────┘         imports         └──────────────────┘
        │
        │ Contains
        │
        ├── en.json ────────────► English translations
        ├── ne.json ────────────► Nepali translations (नेपाली)
        └── src/index.ts ───────► TypeScript exports
```

---

## 🔄 Data Flow

### React Native Mobile App

```
User Opens App
     │
     ▼
┌─────────────────────────────────────────┐
│  expo-localization                      │
│  Detects: Device Language = "ne-NP"    │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  AsyncStorage                           │
│  Check saved preference                 │
│  Found: "ne"                            │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  react-i18next                          │
│  Load translations from:                │
│  @thulobazaar/translations/ne.json      │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  React Components                       │
│  const { t } = useTranslation()         │
│  t('auth.welcome')                      │
│  → "ठूलोबजारमा स्वागत छ"              │
└─────────────────────────────────────────┘
```

### Next.js Web App

```
User Visits URL: /ne/ads
     │
     ▼
┌─────────────────────────────────────────┐
│  Next.js Middleware                     │
│  Extracts locale: "ne"                  │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  next-intl                              │
│  Load translations from:                │
│  @thulobazaar/translations/ne.json      │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  React Components                       │
│  const t = useTranslations()            │
│  t('ads.postAd')                        │
│  → "विज्ञापन पोस्ट गर्नुहोस्"          │
└─────────────────────────────────────────┘
```

---

## 🎯 Translation Key Structure

```typescript
{
  "common": {           // 🔧 Shared UI elements
    "search": "...",
    "filter": "...",
    "save": "..."
  },

  "auth": {            // 🔐 Authentication
    "login": "...",
    "logout": "...",
    "welcome": "..."
  },

  "home": {            // 🏠 Home screen
    "title": "...",
    "subtitle": "...",
    "categories": "..."
  },

  "ads": {             // 📢 Advertisements
    "postAd": "...",
    "myAds": "...",
    "price": "..."
  },

  "profile": {         // 👤 User profile
    "myProfile": "...",
    "settings": "..."
  },

  "validation": {      // ✅ Form validation
    "required": "...",
    "invalidPhone": "..."
  },

  "errors": {          // ❌ Error messages
    "networkError": "...",
    "serverError": "..."
  }
}
```

---

## 📱 Mobile Implementation Pattern

### File Structure

```
apps/mobile/
├── App.tsx                          # Import i18n
├── src/
│   ├── lib/
│   │   └── i18n.ts                 # i18n configuration
│   │
│   ├── contexts/
│   │   └── LanguageContext.tsx     # Language state (optional)
│   │
│   ├── components/
│   │   └── LanguageSwitcher.tsx    # UI to switch languages
│   │
│   └── screens/
│       ├── HomeScreen.tsx          # Use: t('home.title')
│       ├── LoginScreen.tsx         # Use: t('auth.login')
│       └── PostAdScreen.tsx        # Use: t('postAd.title')
```

### Usage Pattern

```typescript
// ❌ OLD WAY (Hardcoded)
<Text>Welcome to Thulo Bazaar</Text>
<Button title="Login" />

// ✅ NEW WAY (i18n)
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<Text>{t('auth.welcome')}</Text>
<Button title={t('auth.login')} />
```

---

## 🌐 Web Implementation Pattern

### File Structure

```
apps/web/
├── next.config.ts               # Configure next-intl
├── src/
│   ├── i18n/
│   │   └── request.ts          # Load translations
│   │
│   ├── middleware.ts            # Route locale detection
│   │
│   └── app/
│       └── [lang]/
│           ├── layout.tsx       # Language layout
│           ├── page.tsx         # Use: t('home.title')
│           └── ads/
│               └── page.tsx     # Use: t('ads.myAds')
```

### Routing

```
URL Structure:
  /en              → English home
  /ne              → Nepali home
  /en/ads          → English ads
  /ne/ads          → Nepali ads
  /en/post-ad      → English post ad
  /ne/post-ad      → Nepali post ad
```

---

## 🔧 Language Detection Priority

### Mobile (React Native)

```
Priority Order:
1. AsyncStorage saved preference ─────► User's last choice
2. Device locale (Localization.locale) ► Device setting
3. Fallback to 'en' ──────────────────► Default
```

**Example:**
```
User's device: "ne-NP" (Nepali - Nepal)
First launch: App shows in Nepali
User switches to English
Next launch: App shows in English (saved in AsyncStorage)
```

### Web (Next.js)

```
Priority Order:
1. URL segment (/en or /ne) ──────────► Explicit choice
2. Cookie (next-intl) ────────────────► Remembered preference
3. Accept-Language header ────────────► Browser setting
4. Fallback to 'en' ──────────────────► Default
```

---

## 🎨 Nepali Rendering

### Font Support

**Mobile:**
```typescript
// Option 1: Google Fonts (Recommended)
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari';

<Text style={{ fontFamily: 'NotoSansDevanagari' }}>
  ठूलोबजार
</Text>

// Option 2: System Font (Automatic)
<Text>ठूलोबजार</Text>  // Works out of box!
```

**Web:**
```css
/* Import Google Font */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari');

body {
  font-family: 'Noto Sans Devanagari', sans-serif;
}
```

### Right-to-Left (RTL) Support

Nepali is Left-to-Right (LTR) like English, so **no RTL configuration needed**!

```
English: Left → Right ✅
नेपाली:  Left → Right ✅
```

---

## 📊 Translation File Examples

### English (en.json)

```json
{
  "auth": {
    "welcome": "Welcome to Thulo Bazaar",
    "login": "Login",
    "enterPhone": "Enter your phone number"
  },
  "ads": {
    "postAd": "Post Ad",
    "price": "Price",
    "negotiable": "Negotiable"
  }
}
```

### Nepali (ne.json)

```json
{
  "auth": {
    "welcome": "ठूलोबजारमा स्वागत छ",
    "login": "लगइन",
    "enterPhone": "आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्"
  },
  "ads": {
    "postAd": "विज्ञापन पोस्ट गर्नुहोस्",
    "price": "मूल्य",
    "negotiable": "मोलमोलाई"
  }
}
```

---

## 🚀 Build & Deployment

### Development

```bash
# 1. Build translations package
cd packages/translations
npm run build

# 2. Start mobile dev
cd ../../apps/mobile
npm run start

# 3. Start web dev
cd ../web
npm run dev
```

### Production

```bash
# Build all packages
turbo run build

# Translations are bundled into apps
# No separate deployment needed
```

---

## 🔄 Adding New Translations

### Workflow

```
1. Edit both en.json and ne.json
   └── Add: "newKey": "New Value"

2. Rebuild translations package
   └── cd packages/translations && npm run build

3. Use in components
   └── t('newKey')

4. Hot reload shows new translations immediately
```

### Example

```json
// Step 1: Add to en.json
{
  "ads": {
    "featured": "Featured"
  }
}

// Step 1: Add to ne.json
{
  "ads": {
    "featured": "विशेष"
  }
}

// Step 2: Rebuild
npm run build

// Step 3: Use in code
const { t } = useTranslation();
<Text>{t('ads.featured')}</Text>
```

---

## 🎯 Best Practices

### ✅ DO

```typescript
// 1. Organize by domain
t('auth.login')
t('ads.postAd')
t('profile.settings')

// 2. Use meaningful keys
t('errors.networkError')  // ✅ Clear
t('err1')                 // ❌ Unclear

// 3. Handle variables
t('validation.minLength', { count: 5 })
// "Minimum 5 characters required"

// 4. Provide context
t('common.delete')  // "Delete"
t('ads.delete')     // "Delete Ad"
```

### ❌ DON'T

```typescript
// 1. Don't hardcode strings
<Text>Login</Text>  // ❌

// 2. Don't mix languages
t('auth.login') + ' नेपाली'  // ❌

// 3. Don't translate in code
const text = lang === 'ne' ? 'नेपाली' : 'English'  // ❌
```

---

## 📈 Scalability

### Adding More Languages (Future)

**Easy to add Hindi, Bengali, etc:**

```typescript
// 1. Create hi.json (Hindi)
{
  "auth": {
    "welcome": "थुलोबाजार में आपका स्वागत है"
  }
}

// 2. Update i18n config
const supportedLanguages = ['en', 'ne', 'hi'];

// 3. Done! ✅
```

### Dynamic Content Translation

**For user-generated content (ads, descriptions):**

```typescript
// Option 1: Store in multiple languages (DB columns)
{
  title_en: "Car for sale",
  title_ne: "कार बिक्रीको लागि"
}

// Option 2: Use Google Translate API
const translated = await translate(text, 'ne');

// Option 3: Show original + translate button
<Text>{ad.title}</Text>
<Button onPress={translateAd}>Translate</Button>
```

---

## 🎉 Summary

### Architecture Benefits

✅ **Single Source of Truth**
- One `packages/translations` for all platforms
- No duplication between web and mobile

✅ **Type-Safe**
- TypeScript autocomplete for keys
- Compile-time error if key doesn't exist

✅ **Platform-Optimized**
- Mobile: `react-i18next` (lightweight, async)
- Web: `next-intl` (Next.js optimized, SSR)

✅ **User-Friendly**
- Auto-detects language from device
- Remembers user preference
- Instant language switching

✅ **Developer-Friendly**
- Simple `t('key')` API
- Hot reload during development
- Easy to add new translations

✅ **Production-Ready**
- Battle-tested libraries
- Used by Fortune 500 companies
- Excellent performance

---

## 📚 Resources

- **react-i18next docs**: https://react.i18next.com/
- **next-intl docs**: https://next-intl-docs.vercel.app/
- **expo-localization**: https://docs.expo.dev/versions/latest/sdk/localization/
- **Nepali typing**: https://www.google.com/inputtools/try/

---

## 🤝 Contributing Translations

### Translation Guidelines

1. **Be Concise**: Mobile screens have limited space
2. **Use Formal Tone**: For professional context
3. **Test on Device**: Ensure Devanagari renders correctly
4. **Cultural Context**: Use appropriate terms for Nepal

### Translation Checklist

- [ ] Translation is accurate
- [ ] Devanagari spelling is correct
- [ ] Fits in UI (not too long)
- [ ] Tested on actual device
- [ ] Both en.json and ne.json updated
- [ ] Package rebuilt after changes

---

**Need help?** Check `IMPLEMENTATION_GUIDE.md` and `REACT_NATIVE_I18N_QUICKSTART.md` for detailed setup instructions! 🚀

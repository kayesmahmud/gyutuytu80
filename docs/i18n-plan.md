# Thulo Bazaar i18n Plan — English + Nepali

## Overview

Translate the entire monorepo (Next.js web + Flutter mobile) to support both English (en) and Nepali (ne).

---

## Current State

| Aspect | Web (Next.js) | Mobile (Flutter) |
|--------|--------------|-----------------|
| Routing | `[lang]` param exists (`/en`, `/ne`) | No locale support |
| i18n Library | None installed | `intl` installed (date formatting only) |
| Translation Files | None | None (no `.arb` files) |
| Middleware/Detection | None | No locale delegates |
| Hardcoded Strings | ~2,000+ English strings | ~370-500 English strings |
| Current Coverage | ~2% (metadata only) | 0% |

---

## Architecture

```
monorepo/
├── packages/
│   └── translations/          # Shared translation source of truth (future)
│       ├── en.json
│       ├── ne.json
│       └── scripts/
│           └── arb-export.js  # Converts JSON -> ARB for Flutter
├── apps/
│   ├── web/
│   │   ├── messages/
│   │   │   ├── en.json
│   │   │   └── ne.json
│   │   └── src/
│   │       ├── i18n/
│   │       │   ├── routing.ts
│   │       │   └── request.ts
│   │       └── middleware.ts
│   └── mobile/
│       ├── l10n.yaml
│       └── lib/l10n/
│           ├── app_en.arb
│           └── app_ne.arb
```

---

## Part 1: Web App — next-intl

### Library: `next-intl` (latest, App Router compatible)

### Setup Steps

#### 1. Install
```bash
cd apps/web && npm install next-intl
```

#### 2. Plugin — `next.config.ts`
```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

#### 3. Routing — `src/i18n/routing.ts`
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ne'],
  defaultLocale: 'en'
});
```

#### 4. Request Config — `src/i18n/request.ts`
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

#### 5. Middleware — `src/middleware.ts`
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

#### 6. Layout — wrap with `NextIntlClientProvider`
```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

#### 7. Usage in components
```tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');
  return <h1>{t('hero')}</h1>;
}
```

#### 8. Language Switcher
```tsx
import { useRouter, usePathname } from 'next-intl/navigation';

function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button onClick={() => router.replace(pathname, { locale: 'ne' })}>
      नेपाली
    </button>
  );
}
```

### Translation JSON Structure

Namespaced by feature:
```json
{
  "home": { ... },
  "auth": { ... },
  "nav": { ... },
  "footer": { ... },
  "ads": { ... },
  "profile": { ... },
  "messages": { ... },
  "support": { ... },
  "common": { ... }
}
```

### Files to Refactor (~70 files)

**Shared components (~15 files):**
- Header.tsx, Footer.tsx, BottomNav.tsx
- EmptyState.tsx, AdCard components
- Auth forms (LoginForm, RegisterForm)

**Pages (~50+ files):**
- Homepage, Browse/Search, Ad Detail
- Dashboard, Profile, My Ads
- Messages, Chat
- Post Ad (Create Ad)
- Support Tickets
- Payment History
- Shop pages, Category pages
- Admin panels

---

## Part 2: Flutter App — gen-l10n

### Library: Official Flutter `gen-l10n` with ARB files

### Setup Steps

#### 1. Update `pubspec.yaml`
```yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.20.2  # already installed

flutter:
  generate: true
```

#### 2. Create `l10n.yaml`
```yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

#### 3. Create ARB files

`lib/l10n/app_en.arb`:
```json
{
  "@@locale": "en",
  "appTitle": "Thulo Bazaar",
  "welcomeBack": "Welcome back",
  "loginSubtitle": "Login to your account to continue",
  "signIn": "Sign In",
  "signUp": "Create an account",
  "continueWithGoogle": "Continue with Google",
  "orSignInWithPhone": "or sign in with phone",
  "phone": "Phone Number",
  "password": "Password",
  "rememberMe": "Remember me",
  "forgotPassword": "Forgot password?",
  "searchAds": "Search Ads",
  "postFreeAd": "Post Free Ad",
  "adCount": "{count, plural, =0{No ads} =1{1 ad} other{{count} ads}}",
  "@adCount": {
    "placeholders": { "count": { "type": "int" } }
  }
}
```

`lib/l10n/app_ne.arb`:
```json
{
  "@@locale": "ne",
  "appTitle": "ठूलो बजार",
  "welcomeBack": "फेरि स्वागत छ",
  "loginSubtitle": "जारी राख्न आफ्नो खातामा लगइन गर्नुहोस्",
  "signIn": "साइन इन",
  "signUp": "खाता बनाउनुहोस्",
  "continueWithGoogle": "गुगलसँग जारी राख्नुहोस्",
  "orSignInWithPhone": "वा फोनबाट साइन इन गर्नुहोस्",
  "phone": "फोन नम्बर",
  "password": "पासवर्ड",
  "rememberMe": "मलाई सम्झनुहोस्",
  "forgotPassword": "पासवर्ड बिर्सनुभयो?",
  "searchAds": "विज्ञापन खोज्नुहोस्",
  "postFreeAd": "निःशुल्क विज्ञापन पोस्ट गर्नुहोस्",
  "adCount": "{count, plural, =0{विज्ञापन छैन} =1{१ विज्ञापन} other{{count} विज्ञापनहरू}}"
}
```

#### 4. Configure MaterialApp
```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

MaterialApp(
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  locale: selectedLocale, // from a provider
  home: const MainNavScreen(),
);
```

#### 5. Usage
```dart
// Before
Text('Welcome back')

// After
Text(AppLocalizations.of(context)!.welcomeBack)
```

### Screens to Refactor (~55 files)

**High Priority:**
- signin_screen.dart, signup_screen.dart
- dashboard_screen.dart, main_nav_screen.dart
- messages_screen.dart, chat_screen.dart
- profile_screen.dart
- create_ad_screen.dart, ad_detail widgets

**Medium Priority:**
- Search screen, Shop screen
- Verification screens, Payment screens
- Support tickets, Help center

**Low Priority:**
- Core widgets (14 files)
- Dialogs and alerts

---

## Part 3: Translation Management

### Current Recommendation: Manual JSON/ARB

For the current scale (~2,500 total strings), manual management is fine.

### Future: Crowdin (when 500+ strings and need a translator)
- Free tier available
- Has official next-intl integration
- Supports ARB format for Flutter
- GitHub integration for auto-sync
- Web UI for translators

---

## Nepali Translation Reference

### Common UI Terms

| English | Nepali |
|---------|--------|
| Sign In | साइन इन |
| Sign Up | साइन अप |
| Sign Out | साइन आउट |
| Search | खोज्नुहोस् |
| Post Free Ad | निःशुल्क विज्ञापन पोस्ट गर्नुहोस् |
| Buy | किन्नुहोस् |
| Sell | बेच्नुहोस् |
| Rent | भाडामा |
| Phone Number | फोन नम्बर |
| Password | पासवर्ड |
| Email | इमेल |
| Name | नाम |
| Price | मूल्य |
| Category | श्रेणी |
| Location | स्थान |
| Description | विवरण |
| Submit | पेश गर्नुहोस् |
| Cancel | रद्द गर्नुहोस् |
| Delete | मेटाउनुहोस् |
| Edit | सम्पादन गर्नुहोस् |
| Save | सेभ गर्नुहोस् |
| Loading | लोड हुँदैछ... |
| Error | त्रुटि |
| Success | सफल |
| Retry | पुनः प्रयास |
| View All | सबै हेर्नुहोस् |
| Latest Ads | नयाँ विज्ञापनहरू |
| Featured Ads | विशेष विज्ञापनहरू |
| My Ads | मेरा विज्ञापनहरू |
| Profile | प्रोफाइल |
| Dashboard | ड्यासबोर्ड |
| Messages | सन्देशहरू |
| Inbox | इनबक्स |
| Settings | सेटिङ |
| Help | मद्दत |
| Contact Us | सम्पर्क गर्नुहोस् |
| About | बारेमा |
| Privacy Policy | गोपनीयता नीति |
| Terms & Conditions | नियम र सर्तहरू |
| Active | सक्रिय |
| Pending | पेन्डिङ |
| Rejected | अस्वीकृत |
| Sold | बिक्री भयो |
| Verified | प्रमाणित |
| Brand New | नयाँ |
| Used | पुरानो |
| Negotiable | मोलमोलाई हुन्छ |
| Fixed Price | निश्चित मूल्य |

### Locale Codes
- English: `en` / `en_US`
- Nepali: `ne` / `ne_NP`
- Devanagari script (UTF-8)
- Number system: Can use both Western (0-9) and Devanagari (०-९)

---

## Implementation Phases

| Phase | Scope | Est. Files |
|-------|-------|-----------|
| 1. Web infra | Install next-intl, config, middleware | 5 new files |
| 2. Web shared | Header, Footer, BottomNav, auth | ~15 files |
| 3. Web pages | All remaining pages | ~50 files |
| 4. Flutter infra | flutter_localizations, l10n.yaml, ARB | 4 files |
| 5. Flutter screens | All 55 feature files | ~55 files |
| 6. Translations | Complete ne.json and app_ne.arb | 2 files |
| 7. Polish | Language switcher, locale detection, SEO hreflang | 5 files |

---

## Sources

- next-intl App Router: https://next-intl.dev/docs/getting-started/app-router
- next-intl Routing: https://next-intl.dev/docs/routing/setup
- Flutter i18n: https://docs.flutter.dev/ui/internationalization
- ARB Tips: https://yapb.dev/tips-and-tricks-13-tips-when-working-with-arb-files-for-localization
- Crowdin + next-intl: https://next-intl.dev/docs/workflows/localization-management

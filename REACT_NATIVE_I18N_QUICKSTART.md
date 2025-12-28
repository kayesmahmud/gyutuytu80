# React Native i18n Quick Start Guide

## 🎯 The Best Approach for ThuluBazaar Mobile

Based on your monorepo architecture, here's the **easiest and most maintainable** way to implement dual language support:

### ✅ Recommended Solution

```
Strategy: Shared Translations + react-i18next + expo-localization

Why?
✅ Simple setup (15 minutes)
✅ Automatic language detection
✅ Same translations as web app
✅ Type-safe with TypeScript
✅ Battle-tested libraries
✅ Perfect Nepali Devanagari support
```

---

## 🚀 Implementation (5 Steps)

### Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo/apps/mobile

npm install i18next react-i18next expo-localization @react-native-async-storage/async-storage
```

### Step 2: Build Translations Package (1 minute)

```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo/packages/translations
npm install
npm run build
```

### Step 3: Create i18n Config (5 minutes)

Create file: `apps/mobile/src/lib/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '@thulobazaar/translations';

const LANGUAGE_KEY = '@thulobazaar_language';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Check saved preference
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (saved) return callback(saved);

      // Use device language
      const device = Localization.locale.split('-')[0];
      callback(['ne', 'en'].includes(device) ? device : 'en');
    } catch {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      ne: { translation: translations.ne },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
```

### Step 4: Initialize in App.tsx (30 seconds)

```typescript
import './src/lib/i18n'; // Add this line at top

export default function App() {
  // ... rest of your code
}
```

### Step 5: Use in Components (Easy!)

**Before (Hardcoded):**
```typescript
<Text>Welcome to ThuluBazaar</Text>
<Button title="Login" />
```

**After (i18n):**
```typescript
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Text>{t('auth.welcome')}</Text>
      <Button title={t('auth.login')} />
    </>
  );
}
```

**That's it!** 🎉

---

## 📱 Common Screen Examples

### Example 1: Home Screen

```typescript
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
      {/* Category list */}

      <Text style={styles.sectionTitle}>{t('home.featuredAds')}</Text>
      {/* Featured ads */}
    </ScrollView>
  );
}
```

### Example 2: Post Ad Screen

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function PostAdScreen() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('postAd.title')}</Text>

      <TextInput
        placeholder={t('postAd.adTitle')}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder={t('postAd.adDescription')}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.button}>
        <Text>{t('postAd.publish')}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Example 3: Language Switcher

```typescript
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const switchLanguage = async (lang: 'en' | 'ne') => {
    await i18n.changeLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, currentLang === 'en' && styles.active]}
        onPress={() => switchLanguage('en')}
      >
        <Text>English</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, currentLang === 'ne' && styles.active]}
        onPress={() => switchLanguage('ne')}
      >
        <Text>नेपाली</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Example 4: Settings Screen with Language Option

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ne', label: 'नेपाली' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('profile.settings')}</Text>

      <Text style={styles.label}>Language / भाषा</Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.option,
            i18n.language === lang.code && styles.selected,
          ]}
          onPress={() => i18n.changeLanguage(lang.code)}
        >
          <Text>{lang.label}</Text>
          {i18n.language === lang.code && <Text>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## 🎨 Nepali Font Support

### Option 1: Google Fonts (Recommended - Easier)

```bash
npx expo install expo-font @expo-google-fonts/noto-sans-devanagari
```

```typescript
import { useFonts, NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari';

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari: NotoSansDevanagari_400Regular,
  });

  if (!fontsLoaded) return null;

  return <YourApp />;
}

// Use in styles
const styles = StyleSheet.create({
  text: {
    fontFamily: 'NotoSansDevanagari',
  },
});
```

### Option 2: System Font (Easiest - Works Out of Box)

Most modern devices have Devanagari support built-in:

```typescript
const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
});
```

**No extra setup needed!** Nepali text will render correctly.

---

## 🔧 How It Works

### 1. First App Launch

```
User opens app
  ↓
i18n detects device language
  ↓
Device is "ne-NP" → Use Nepali
Device is "en-US" → Use English
  ↓
Save preference to AsyncStorage
```

### 2. User Changes Language

```
User taps language switcher
  ↓
i18n.changeLanguage('ne')
  ↓
All t() calls re-render with Nepali text
  ↓
Preference saved to AsyncStorage
```

### 3. Next App Launch

```
User opens app
  ↓
i18n checks AsyncStorage
  ↓
Finds saved preference ("ne")
  ↓
App loads in Nepali immediately
```

---

## 📊 Comparison: Different Approaches

| Approach | Pros | Cons | Rating |
|----------|------|------|--------|
| **react-i18next** (Recommended) | ✅ Industry standard<br>✅ Auto-detection<br>✅ Shared translations<br>✅ TypeScript support | ❌ Small bundle size increase | ⭐⭐⭐⭐⭐ |
| Manual Context API | ✅ No dependencies<br>✅ Full control | ❌ More code to write<br>❌ No auto-detection<br>❌ Harder to maintain | ⭐⭐⭐ |
| Hardcoded if/else | ✅ Simple to start | ❌ Unmaintainable<br>❌ No sharing with web<br>❌ Hard to add languages | ⭐ |

---

## ✅ Migration Checklist

```bash
# 1. Install packages
cd apps/mobile
npm install i18next react-i18next expo-localization @react-native-async-storage/async-storage

# 2. Build translations package
cd ../../packages/translations
npm install && npm run build

# 3. Create i18n config file
# Copy from Step 3 above

# 4. Import in App.tsx
# Add: import './src/lib/i18n';

# 5. Replace hardcoded strings
# Before: <Text>Login</Text>
# After: <Text>{t('auth.login')}</Text>

# 6. Test language switching
# Add language switcher component

# 7. Test on device
# Check both languages render correctly
```

---

## 🎯 Why This Is The Best Approach

### ✅ Advantages

1. **Shared with Web**: Same translations as Next.js app
2. **Type-Safe**: TypeScript autocomplete for translation keys
3. **Auto-Detection**: Uses device language by default
4. **Persistent**: Remembers user preference
5. **Scalable**: Easy to add more languages later
6. **Standard**: Most popular React Native i18n solution
7. **Small Bundle**: Only loads active language
8. **Zero Config**: Works immediately after setup

### ✅ Perfect for ThuluBazaar Because

1. **Monorepo Structure**: Shared translations package
2. **Dual Platform**: Web and mobile use same strings
3. **Nepali Support**: Perfect Devanagari rendering
4. **Maintainable**: One place to update all translations
5. **Developer Experience**: Simple `t()` function

---

## 🚀 Next Steps

1. **Install packages** (2 min)
2. **Create i18n config** (5 min)
3. **Start replacing strings** (ongoing)
4. **Add language switcher** (10 min)
5. **Test both languages** (5 min)

**Total setup time: ~20 minutes**

Then gradually migrate existing screens by replacing:
```typescript
"Login" → t('auth.login')
"Post Ad" → t('ads.postAd')
"Settings" → t('profile.settings')
```

---

## 💡 Pro Tips

### 1. Use Namespaces for Better Organization

```typescript
const t = useTranslations(); // All translations

// Better:
t('auth.login')     // auth namespace
t('ads.postAd')     // ads namespace
t('common.search')  // common namespace
```

### 2. Create Translation Helper Hook

```typescript
// src/hooks/useAppTranslation.ts
import { useTranslation } from 'react-i18next';

export function useAppTranslation() {
  const { t, i18n } = useTranslation();

  return {
    t,
    language: i18n.language as 'en' | 'ne',
    isNepali: i18n.language === 'ne',
    isEnglish: i18n.language === 'en',
    changeLanguage: (lang: 'en' | 'ne') => i18n.changeLanguage(lang),
  };
}

// Usage
const { t, isNepali } = useAppTranslation();
```

### 3. Handle Missing Translations Gracefully

```typescript
i18n.init({
  // ... other config
  saveMissing: true,
  missingKeyHandler: (lng, ns, key) => {
    console.warn(`Missing translation: ${key} for ${lng}`);
  },
});
```

---

## 🎉 Summary

**Easiest Setup:**
1. Install `react-i18next` + `expo-localization`
2. Create simple i18n config (copy-paste from Step 3)
3. Use `t('key')` in components
4. Done! 🚀

**Result:**
- ✅ Automatic language detection
- ✅ Shared translations with web
- ✅ Type-safe with TypeScript
- ✅ Perfect Nepali support
- ✅ Easy to maintain

**This is the industry-standard approach used by apps like Airbnb, Facebook, and thousands of others.**

---

Need help implementing? Just follow Step 1-5 above and you're done! 🎯

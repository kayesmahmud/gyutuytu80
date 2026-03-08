# React Native App Development Plan for Thulo Bazaar

## Overview
Build a React Native (Expo) app that mirrors the web app's mobile interface, reusing existing shared packages and API infrastructure.

## 🎯 Design Approach: Mirror Mobile Web View

**The React Native app will look exactly like the mobile web view of the website.**

This makes implementation straightforward because:
1. **Copy mobile CSS classes directly** - Take web components with `md:hidden` or mobile-first styles
2. **Same Tailwind classes** - NativeWind uses identical Tailwind syntax
3. **Existing mobile components to port:**

| Web Component (Mobile View) | Location | Port To |
|----------------------------|----------|---------|
| `MobileCard` (compact AdCard) | `AdCard.tsx:116-187` | `components/ads/AdCard.tsx` |
| Image gallery with swipe | `AdDetailClient.tsx` | `screens/ads/AdDetailScreen.tsx` |
| Bottom navigation | `BottomNav.tsx` | `navigation/MainTabs.tsx` |
| Filter carousel/pills | `FilterCarousel.tsx` | `components/filters/FilterPills.tsx` |
| Mobile filter drawer | `MobileFilterDrawer.tsx` | `components/filters/FilterBottomSheet.tsx` |
| Compact header | `Header.tsx` (mobile) | `components/layout/Header.tsx` |

**Example - Direct CSS Migration:**
```tsx
// Web (MobileCard in AdCard.tsx)
<div className="p-2 sm:p-2.5">
  <h3 className="text-[10px] sm:text-sm font-semibold mb-1 text-gray-900 truncate">
    {ad.title}
  </h3>
</div>

// React Native (identical Tailwind with NativeWind)
<View className="p-2">
  <Text className="text-xs font-semibold mb-1 text-gray-900" numberOfLines={1}>
    {ad.title}
  </Text>
</View>
```

---

## ✅ Confirmed Decisions
- **Framework**: Expo SDK 54 + React Navigation v7
- **Styling**: NativeWind v4.1 (compiled Tailwind - zero runtime overhead)
- **Location**: Use existing `apps/mobile/` folder
- **Scope**: Full MVP (Core + Post Ad + Messaging)
- **Architecture**: React Native New Architecture (Fabric, JSI, TurboModules)

---

## 📦 Latest Stable Versions (January 2025)

| Package | Version | Notes |
|---------|---------|-------|
| **Expo SDK** | 54.0.x | React Native 0.81, React 19.1 |
| **React Native** | 0.82/0.83 | 0.82+ is New Architecture only |
| **NativeWind** | 4.1.x | Stable for production (v5 in pre-release) |
| **React Navigation** | 7.1.x | Static API, preloading screens |
| **FlashList** | 2.2.x | New Architecture only, no estimates needed |
| **Reanimated** | 4.2.x | CSS animations, Shared Element Transitions |
| **Zustand** | 5.x | Latest stable |
| **React Query** | 5.x | Latest stable |

> **Sources**: [Expo Changelog](https://expo.dev/changelog), [React Native Releases](https://reactnative.dev/docs/releases), [NativeWind Blog](https://www.nativewind.dev/blog), [FlashList v2](https://shopify.engineering/flashlist-v2), [Reanimated 4](https://blog.swmansion.com/reanimated-4-stable-release)

---

## Current Monorepo Architecture

### Shared Packages (60-70% code reuse potential)
```
packages/
├── types/           ✅ 100% reusable - All TypeScript types, transformers
├── api-client/      ✅ 95% reusable - Axios-based, just change token storage
├── database/        ✅ Server-only (API uses this, not mobile)
├── utils/           ✅ 100% reusable - Generic utilities
├── upload-utils/    ✅ 90% reusable - Has platform conditionals
├── messaging-core/  ✅ 100% reusable - Business logic
├── translations/    ✅ 100% reusable - i18n files
└── config/          ✅ 100% reusable - Shared configuration
```

### Existing Mobile App Folder
`apps/mobile/` already exists with basic Expo setup:
- `src/lib/api.ts` - API client with SecureStore token storage
- Basic structure for auth flow

---

## What Needs to Be Built

### 1. NAVIGATION STRUCTURE
Recreate web navigation using React Navigation:

```
├── AuthStack (not logged in)
│   ├── Login Screen
│   ├── Register Screen
│   └── OAuth Screens (Google, Facebook)
│
├── MainTabs (logged in)
│   ├── Home Tab
│   │   ├── HomeScreen (categories, featured ads)
│   │   └── AdsListScreen (with filters)
│   │
│   ├── Search Tab
│   │   └── SearchScreen (filter drawer)
│   │
│   ├── Post Ad Tab (FAB center button)
│   │   └── PostAdScreen (multi-step form)
│   │
│   ├── Messages Tab
│   │   ├── ConversationsListScreen
│   │   └── ChatScreen
│   │
│   └── Profile Tab
│       ├── ProfileScreen
│       ├── MyAdsScreen
│       ├── SavedAdsScreen
│       ├── SettingsScreen
│       └── ShopScreen (if business)
│
└── Modal Stacks
    ├── AdDetailScreen
    ├── ShopProfileScreen
    ├── FilterDrawer (bottom sheet)
    └── ImageViewer
```

### 2. SCREENS TO BUILD (Priority Order)

**Phase 1 - Core MVP:**
| Screen | Web Equivalent | Complexity |
|--------|---------------|------------|
| Login/Register | `/auth/signin`, `/auth/signup` | Medium |
| Home | `/[lang]/page.tsx` | Medium |
| Ads List | `/[lang]/ads/` | High |
| Ad Detail | `/[lang]/ad/[slug]/` | High |
| Post Ad | `/[lang]/post-ad/` | High |
| Profile | `/[lang]/profile/` | Medium |

**Phase 2 - Messaging:**
| Screen | Web Equivalent | Complexity |
|--------|---------------|------------|
| Conversations | `MessagesPage.tsx` | High |
| Chat | `ChatWindow.tsx` | High |

**Phase 3 - Enhanced Features:**
| Screen | Notes |
|--------|-------|
| Shop Profile | Business users |
| Notifications | Push notifications |
| Settings | Account management |
| Support Tickets | Help system |

### 3. AUTHENTICATION ADAPTATION

**Web (NextAuth):**
```typescript
// Uses NextAuth session
const session = await getSession();
const token = session?.user?.backendToken;
```

**Mobile (SecureStore):**
```typescript
// Direct JWT storage
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  AUTH_TOKEN: 'thulobazaar_auth_token',
  REFRESH_TOKEN: 'thulobazaar_refresh_token',
  USER: 'thulobazaar_user',
};

// Login
const { token, refreshToken, user } = await api.auth.login(credentials);
await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token);
await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));

// Get token
const token = await SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
```

**Auth Context for Mobile:**
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

### 4. API CLIENT ADAPTATION

The existing `packages/api-client/` is almost 100% reusable. Only change needed:

```typescript
// apps/mobile/src/lib/api.ts
import { createApiClient } from '@thulobazaar/api-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@env';

export const apiClient = createApiClient({
  baseURL: API_URL,
  getAuthToken: async () => {
    return await SecureStore.getItemAsync('thulobazaar_auth_token');
  },
  onUnauthorized: () => {
    // Navigate to login screen
    // Clear stored tokens
  },
});
```

### 5. SOCKET.IO (Real-time Messaging)

**Socket.io-client works on React Native:**
```typescript
// apps/mobile/src/hooks/useSocket.ts
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      const token = await SecureStore.getItemAsync('thulobazaar_auth_token');
      if (!token) return;

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      setSocket(newSocket);
    };

    initSocket();
    return () => socket?.disconnect();
  }, []);

  return socket;
};
```

### 6. UI COMPONENT MAPPING

| Web Component | React Native Equivalent |
|--------------|------------------------|
| `<Link>` | `<Pressable>` + navigation |
| Tailwind classes | NativeWind (same classes) |
| `hidden md:block` | Not needed (mobile only) |
| `grid grid-cols-2` | `FlashList numColumns={2}` |
| Bottom sheet drawer | `@gorhom/bottom-sheet` |
| Image gallery | Swipe with Reanimated |
| Form inputs | Custom with NativeWind |
| Icons (lucide-react) | `lucide-react-native` |
| Maps | `react-native-maps` |

### 7. STYLING APPROACH: NativeWind v4.1

NativeWind compiles Tailwind classes to native StyleSheet at **build time** - zero runtime overhead:

```tsx
// Write this:
<View className="flex-row items-center p-4 bg-white rounded-xl shadow-sm">
  <Image className="w-20 h-20 rounded-lg" source={{ uri }} />
  <Text className="text-lg font-semibold text-gray-900">Title</Text>
</View>

// Compiles to (at build time):
<View style={styles.container}>
  <Image style={styles.image} source={{ uri }} />
  <Text style={styles.title}>Title</Text>
</View>
// Where styles = StyleSheet.create({...}) with equivalent native values
```

**Why NativeWind:**
- Same Tailwind classes as web = faster porting
- Zero runtime overhead (compiled)
- Same performance as hand-written StyleSheet

### 8. KEY DEPENDENCIES

```json
{
  "dependencies": {
    // Core
    "expo": "~54.0.0",
    "react": "19.1.0",
    "react-native": "0.81.0",

    // Navigation
    "@react-navigation/native": "^7.1.0",
    "@react-navigation/bottom-tabs": "^7.2.0",
    "@react-navigation/native-stack": "^7.2.0",

    // UI & Styling
    "nativewind": "^4.1.0",
    "tailwindcss": "^3.4.0",

    // Performance (60fps animations & lists)
    "react-native-reanimated": "^4.2.0",
    "react-native-worklets": "^1.0.0",
    "@shopify/flash-list": "^2.2.0",
    "expo-image": "~2.0.0",

    // UI Components
    "@gorhom/bottom-sheet": "^5.1.0",
    "lucide-react-native": "^0.470.0",
    "react-native-gesture-handler": "~2.24.0",
    "react-native-screens": "~4.4.0",
    "react-native-safe-area-context": "~5.0.0",

    // Data/State
    "@tanstack/react-query": "^5.62.0",
    "zustand": "^5.0.0",

    // Storage/Auth
    "expo-secure-store": "~14.0.0",
    "expo-image-picker": "~16.0.0",

    // Real-time
    "socket.io-client": "^4.8.0",

    // Shared packages
    "@thulobazaar/types": "workspace:*",
    "@thulobazaar/api-client": "workspace:*",
    "@thulobazaar/utils": "workspace:*",
    "@thulobazaar/upload-utils": "workspace:*"
  }
}
```

---

## 🚀 React Native New Architecture

### Why New Architecture?
The New Architecture provides **buttery smooth 60fps** performance through:

### 1. Fabric (New Rendering System)
- **Synchronous layout** - No async bridge delay for UI updates
- **Concurrent rendering** - Smooth transitions even with heavy computation
- **Improved memory** - Better view flattening

```typescript
// Enable in app.json
{
  "expo": {
    "newArchEnabled": true
  }
}
```

### 2. JSI (JavaScript Interface)
- **Direct C++ communication** - No JSON serialization overhead
- **Sync native calls** - Call native code directly from JS
- **Shared memory** - Zero-copy data transfer

```typescript
// Libraries using JSI (already fast):
// - react-native-reanimated (worklets run on UI thread)
// - react-native-mmkv (sync storage, 30x faster than AsyncStorage)
// - expo-image (native image loading with blurhash)
```

### 3. TurboModules (Lazy Loading)
- **On-demand loading** - Native modules load when first used
- **Faster startup** - App launches quicker
- **Type-safe** - CodeGen generates typed interfaces

### Performance Stack Summary

| Need | Solution | Why |
|------|----------|-----|
| Styling | NativeWind v4.1 | Compiles to StyleSheet at build time |
| Animations | Reanimated 4 | CSS animations, UI thread via JSI |
| Lists | FlashList v2 | No estimates needed, recycling |
| Images | expo-image | Blurhash placeholders, native caching |
| Storage | expo-secure-store | Encrypted, sync with JSI |
| State | Zustand + React Query | Minimal re-renders |

### Performance Patterns

```typescript
// 1. Animated values on UI thread (60fps)
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

const offset = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: withSpring(offset.value) }]
}));

// 2. FlashList for large lists (ads, messages) - NO estimates in v2!
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={ads}
  renderItem={({ item }) => <AdCard ad={item} />}
  // No estimatedItemSize needed in v2
/>

// 3. expo-image with blurhash placeholders
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```

---

## Implementation Phases

### Phase 1: Foundation
1. Set up Expo SDK 54 with TypeScript + New Architecture
2. Configure monorepo integration (shared packages)
3. Set up navigation structure with React Navigation v7
4. Implement auth flow (login, register, token storage)
5. Create base UI components (AdCard, Header, BottomNav)

### Phase 2: Core Features
1. Home screen with categories
2. Ads listing with FlashList + filters
3. Ad detail screen with image gallery
4. Search functionality
5. Profile screen

### Phase 3: Post Ad Flow
1. Multi-step post ad form
2. Image picker integration
3. Category/location selection
4. Form validation

### Phase 4: Messaging
1. Socket.IO integration
2. Conversations list with FlashList
3. Chat screen with real-time messages
4. Typing indicators with Reanimated

### Phase 5: Polish
1. Push notifications (expo-notifications)
2. Deep linking
3. Offline support
4. Performance optimization
5. App store preparation (EAS Build)

---

## Files to Create

```
apps/mobile/
├── app.json                    # Expo config with newArchEnabled
├── babel.config.js             # react-native-worklets/plugin
├── tailwind.config.js          # NativeWind config
├── metro.config.js             # Monorepo + NativeWind
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── ads/
│   │   │   ├── AdsListScreen.tsx
│   │   │   ├── AdDetailScreen.tsx
│   │   │   └── PostAdScreen.tsx
│   │   ├── messages/
│   │   │   ├── ConversationsScreen.tsx
│   │   │   └── ChatScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── components/
│   │   ├── ads/
│   │   │   ├── AdCard.tsx          # Port from MobileCard
│   │   │   └── AdsList.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── BottomNav.tsx
│   │   └── filters/
│   │       ├── FilterPills.tsx     # Port from FilterCarousel
│   │       └── FilterBottomSheet.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   └── useApi.ts
│   ├── lib/
│   │   └── api.ts              # API client setup
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   └── MainTabs.tsx
│   └── utils/
│       └── storage.ts          # SecureStore helpers
```

---

## ✅ Finalized Tech Stack

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Expo SDK 54 | New Arch, React 19.1, EAS build |
| Navigation | React Navigation v7.1 | Static API, preloading |
| Styling | NativeWind v4.1 | Same Tailwind as web, zero runtime |
| State | React Query 5 + Zustand 5 | Matches web patterns |
| Lists | FlashList v2.2 | No estimates, recycling, New Arch |
| Images | expo-image | Blurhash, native caching |
| Animations | Reanimated 4.2 | CSS animations, UI thread |
| Architecture | New (Fabric/JSI) | Sync rendering, no bridge |

---

## Verification Plan

### After Phase 1 (Foundation):
```bash
# 1. Shared packages import correctly
npx expo start
# Check no "cannot find module" errors for @thulobazaar/*

# 2. NativeWind works
# Tailwind classes render correctly on screen

# 3. New Architecture enabled
# No yellow box warnings about bridge
```

### After Phase 2 (Core Features):
```bash
# 1. API calls work
# Ads load on home screen from backend

# 2. 60fps scroll performance
# Use React Native Performance Monitor (shake → Perf Monitor)
# Should show 60fps during scroll

# 3. Images load with blurhash
# See placeholder → image transition
```

### After Phase 4 (Messaging):
```bash
# 1. Socket.IO connects
# Check console for "socket connected"

# 2. Real-time messages work
# Send message on web, receive instantly on mobile
```

### Final Verification:
```bash
# Build release APK/IPA
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Check startup time (should be <2 seconds)
# Check memory usage in profiler
# Verify all screens scroll at 60fps
```

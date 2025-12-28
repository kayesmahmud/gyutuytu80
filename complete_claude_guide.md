# 🚀 Code & UI Best Practices (2025)

## 🔴 CRITICAL GUIDELINES (MUST READ!)

### Rule #1: Snake_case vs camelCase (CRITICAL!)

**THE PROBLEM:**
```typescript
// Database returns (PostgreSQL uses snake_case):
{
  "full_name": "John Doe",
  "created_at": "2024-01-01",
  "is_active": true
}

// But you try to access (JavaScript convention is camelCase):
user.fullName  // ❌ undefined!
user.createdAt // ❌ undefined!
user.isActive  // ❌ undefined!
```

**THE SOLUTION - ALWAYS use transformers:**
```typescript
// ✅ CORRECT - Backend code
import { transformDbUserToApi, DbUser } from '@thulobazaar/types';

const result = await pool.query<DbUser>('SELECT * FROM users WHERE id = $1', [id]);
const dbUser = result.rows[0];

// Transform DB format to API format
const apiUser = transformDbUserToApi(dbUser);

res.json({ success: true, data: apiUser });
```

Now frontend can access:
```typescript
user.fullName  // ✅ "John Doe"
user.createdAt // ✅ Date
user.isActive  // ✅ true
```

### Rule #2: Never Assume Property Names

```typescript
// ❌ WRONG - Assuming property names
const userId = req.user.sub;

// ✅ CORRECT - Log first, then access
console.log('🔍 Full req.user:', req.user);
console.log('🔍 Keys:', Object.keys(req.user));
const userId = req.user.id;

// ✅ EVEN BETTER - Use safe accessor
import { safeGet } from '@thulobazaar/types';
const userId = safeGet<number>(req.user, 'id', 'req.user.id');
if (!userId) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Rule #3: Always Use Optional Chaining

```typescript
// ❌ WRONG
const name = user.profile.name;
const price = ad.attributes.price;

// ✅ CORRECT - Option 1: Optional Chaining
const name = user?.profile?.name;
const price = ad?.attributes?.price;

// ✅ CORRECT - Option 2: With Defaults
const name = user?.profile?.name || 'Unknown';
const price = ad?.attributes?.price ?? 0;
```

### Rule #4: Explicit TypeScript Types

```typescript
// ❌ WRONG - TypeScript infers wrong type
let existingImages = [];  // Inferred as never[]
existingImages = JSON.parse(body.existingImages);  // ❌ Type error!

// ✅ CORRECT - Explicit types
let existingImages: string[] = [];
existingImages = JSON.parse(body.existingImages);

// ✅ EVEN BETTER - Use interface
interface ImageData {
  url: string;
  order: number;
}
let existingImages: ImageData[] = [];
```

### Rule #5: Type-Safe Database Queries

```typescript
// ❌ WRONG - No type safety
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
const user = result.rows[0]; // user is typed as 'any'

// ✅ CORRECT - Use generic types
import { DbUser } from '@thulobazaar/types';

const result = await pool.query<DbUser>(
  'SELECT * FROM users WHERE id = $1',
  [id]
);
const user = result.rows[0]; // ✅ Typed as DbUser!
console.log(user.full_name);  // ✅ Type-safe
console.log(user.created_at); // ✅ Type-safe
```

### Complete Correct Endpoint Example

```typescript
// ✅ CORRECT EXAMPLE - Follow this pattern!

// 1. Import types
import { DbAd, transformDbAdToApi, safeGet } from '@thulobazaar/types';
import { Request, Response } from 'express';

// 2. Type the request
interface GetAdRequest extends Request {
  user?: { id: number; email: string };
}

// 3. Handler with full type safety
async function getAd(req: GetAdRequest, res: Response) {
  try {
    // 4. Safe property access
    const userId = safeGet<number>(req.user, 'id', 'req.user.id');
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const adId = parseInt(req.params.id);
    if (isNaN(adId)) {
      return res.status(400).json({ error: 'Invalid ad ID' });
    }

    // 5. Typed query
    const result = await pool.query<DbAd>(
      'SELECT * FROM ads WHERE id = $1 AND user_id = $2',
      [adId, userId]
    );

    // 6. Check for null
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const dbAd = result.rows[0];

    // 7. Transform to API format
    const apiAd = transformDbAdToApi(dbAd);

    // 8. Return
    res.json({ success: true, data: apiAd });

  } catch (error) {
    console.error('❌ Error in getAd:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Pre-Commit Checklist (ALWAYS CHECK!)

Before committing code:
- [ ] Used transformers for DB → API data?
- [ ] Logged unknown objects before accessing?
- [ ] Used optional chaining for nested objects?
- [ ] Added explicit TypeScript types (no `any` without reason)?
- [ ] Verified database property names?
- [ ] Checked JWT/session structure before using?

### Common Mistakes to AVOID

1. ❌ Passing Prisma/DB results directly to client components
2. ❌ Assuming property names without logging first
3. ❌ Using `any` type without explicit reason
4. ❌ Accessing nested properties without optional chaining
5. ❌ Mixing snake_case and camelCase
6. ❌ Not checking for null/undefined before accessing properties

## TypeScript 2025 Best Practices

### Strict Mode (MUST HAVE)
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Safety Rules
1. **Use `unknown` over `any`** - Forces type checking
2. **Template Literal Types** - Enforce string patterns: `type AdId = \`ad_${number}\``
3. **Utility Types** - `Partial<>`, `Pick<>`, `Omit<>`, `Required<>`, `Record<>`
4. **Type Inference** - Let TypeScript infer when obvious
5. **Discriminated Unions** - Type-safe state management:
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Type Guards (Runtime Validation)
```typescript
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}

if (isUser(data)) {
  console.log(data.email); // Type-safe!
}
```

### Never Assume Property Names
```typescript
// L WRONG
const userId = req.user.sub;

//  CORRECT - Log first
console.log('= Full req.user:', req.user);
const userId = req.user.id;
```

### Always Use Optional Chaining
```typescript
// L WRONG
const name = user.profile.name;

//  CORRECT
const name = user?.profile?.name || 'Unknown';
```

## Next.js 15 (2025) Best Practices

### 1. App Router (Not Pages Router)
```
app/
   layout.tsx          � Root layout
   page.tsx           � Home page
   [lang]/            � Dynamic segment
      layout.tsx
      page.tsx
   api/
       route.ts       � API routes
```

### 2. React Server Components (RSC)
```typescript
// Server Component (default)
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`/api/products/${params.id}`);
  return <ProductDetails product={product} />;
}

// Client Component (interactive)
'use client';
function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 3. Error Handling (Required Files)
- **error.tsx** - Error boundary
- **not-found.tsx** - Custom 404
- **loading.tsx** - Loading states

### 4. Metadata API (SEO)
```typescript
// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const ad = await getAd(params.slug);
  return {
    title: `${ad.title} - Site Name`,
    description: ad.description,
    openGraph: { images: ad.images },
  };
}
```

### 5. Turbopack (700x Faster)
```json
{
  "scripts": {
    "dev": "next dev --turbo"
  }
}
```

### 6. Data Fetching Patterns
```typescript
// Parallel fetching
const [users, products] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json()),
]);

// With caching (ISR)
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // Revalidate every hour
});

// Streaming with Suspense
function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlowComponent />
    </Suspense>
  );
}
```

### 7. Server Actions (2025 Standard)
```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createAd(formData: FormData) {
  const title = formData.get('title') as string;
  const price = Number(formData.get('price'));

  if (!title || !price) {
    return { error: 'Invalid data' };
  }

  // Create ad via API or database
  const ad = await db.ads.create({ title, price });

  // Revalidate and redirect
  revalidatePath('/ads');
  redirect(`/en/ad/${ad.slug}`);
}

// Use in Client Component
'use client';
function AdForm() {
  return (
    <form action={createAd}>
      <input name="title" required />
      <input name="price" type="number" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### 8. ESM Modules (2025 Standard)
```json
// package.json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### 9. Route Handlers (API Routes 2025)
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  const users = await db.users.findMany({
    where: { name: { contains: query } }
  });

  return NextResponse.json({ success: true, data: users });
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.users.create({ data: body });

  return NextResponse.json(
    { success: true, data: user },
    { status: 201 }
  );
}
```

## Tailwind CSS 2025 Best Practices

### Use Tailwind v3.4 (Stable)
- Better browser compatibility
- Production-ready
- All plugins work

**Avoid v4** until ecosystem matures (breaking changes, browser requirements)

### Best Practices
1. **Utility-first** - Keep classes in HTML
```tsx
//  GOOD
<button className="px-4 py-2 bg-primary text-white rounded-lg">

// L BAD - Overusing @apply
.btn { @apply px-4 py-2 bg-primary; }
```

2. **Mobile-First Responsive**
```tsx
//  GOOD - Mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

3. **Semantic Color Names**
```js
colors: {
  primary: '#dc1e4a',
  secondary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
}
```

4. **Component Composition**
```tsx
export function Button({ variant = 'primary', children }) {
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover',
    secondary: 'bg-secondary hover:bg-secondary-hover',
  };
  return (
    <button className={`px-4 py-2 rounded-lg ${variants[variant]}`}>
      {children}
    </button>
  );
}
```

## Database & API Patterns

### Snake_case vs CamelCase (CRITICAL!)
**Problem:** Database uses snake_case, JavaScript uses camelCase

**Solution:** Always use transformers
```typescript
// Backend - Transform DB to API
import { transformDbUserToApi, DbUser } from '@thulobazaar/types';

const dbUser = await query<DbUser>('SELECT * FROM users...');
const apiUser = transformDbUserToApi(dbUser);
res.json({ success: true, data: apiUser });

// Frontend - Receives camelCase
user.fullName  //  Works!
user.createdAt //  Works!
```

### Type-Safe Database Queries
```typescript
import { DbUser } from '@thulobazaar/types';

const result = await pool.query<DbUser>(
  'SELECT * FROM users WHERE id = $1',
  [id]
);
const user = result.rows[0]; //  Typed as DbUser!
```

## Prisma Critical Rules (2025 - MUST KNOW!)

### Rule 1: NEVER use both `include` and `select`
```typescript
// ❌ WRONG - Prisma doesn't allow mixing
const result = await prisma.categories.findMany({
  include: { categories: true },  // ❌
  select: { id: true, name: true }, // ❌ CONFLICT!
});

// ✅ CORRECT - Use only select
const result = await prisma.categories.findMany({
  select: {
    id: true,
    name: true,
    categories: {  // Nested select for relation
      select: { id: true, name: true }
    }
  }
});
```

### Rule 2: NEVER use `orderBy` in nested select
```typescript
// ❌ WRONG - orderBy not allowed in nested select
const categories = await prisma.categories.findMany({
  select: {
    id: true,
    categories: {
      select: { id: true, name: true },
      orderBy: { name: 'asc' }, // ❌ ERROR!
    }
  }
});

// ✅ CORRECT - Sort in JavaScript after fetching
const categories = await prisma.categories.findMany({
  select: {
    id: true,
    categories: { select: { id: true, name: true } }
  }
});

categories.forEach((cat) => {
  cat.categories?.sort((a, b) => a.name.localeCompare(b.name));
});
```

### Rule 3: Check relation names (Self-referencing models)
```typescript
// Prisma schema:
// model categories {
//   parent_id        Int?
//   categories       categories?  @relation(...)  ← Parent (many-to-one)
//   other_categories categories[] @relation(...)  ← Children (one-to-many)
// }

// ❌ WRONG - Using parent relation for children
const cats = await prisma.categories.findMany({
  include: { categories: true } // Gets parent, not children!
});

// ✅ CORRECT - Use other_categories for children
const cats = await prisma.categories.findMany({
  include: { other_categories: true } // Gets children!
});
```

### Rule 4: Always check actual database enum values
```typescript
// ❌ WRONG - Assuming enum value
if (user.status === 'verified') {
  // Fails if DB uses 'approved' instead!
}

// ✅ CORRECT - Check DB first
// Run: SELECT DISTINCT status FROM users;
// Found: 'pending', 'approved', 'rejected'
if (user.status === 'approved') {
  // Works!
}
```

### Rule 5: Type your Prisma queries
```typescript
// ❌ BAD - Untyped
const user = await prisma.user.findUnique({ where: { id: 1 } });
// user.fullName - no autocomplete, no type checking

// ✅ GOOD - With select for specific fields
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    fullName: true,
  }
});
// Now TypeScript knows exact shape!
```

## Performance Best Practices

### 1. Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={500}
  height={300}
  priority={false} // true for above-fold
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 2. Code Splitting
```typescript
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('@/components/Heavy'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-side only
});
```

### 3. Caching Strategy
```typescript
// ISR - Incremental Static Regeneration
export const revalidate = 3600; // 1 hour

// On-demand revalidation
import { revalidatePath } from 'next/cache';
revalidatePath('/ads');
```

## Common Debugging Patterns

### Debugging Template (Always Use This)
```typescript
console.log('🔍 Debug Point:', {
  input: variableName,
  keys: Object.keys(variableName),
  type: typeof variableName,
  isArray: Array.isArray(variableName),
  value: JSON.stringify(variableName, null, 2)
});
```

### Cache Issues (Monorepo)
When code changes don't apply:
```bash
# Clear all caches
rm -rf .turbo packages/*/dist packages/*/.turbo apps/web/.next apps/web/.turbo

# Rebuild packages
cd packages/types && npm run build
cd ../api-client && npm run build

# Restart dev server
npm run dev
```

### Null Safety Checklist
```typescript
//  Always check before accessing
if (user && user.profile && user.profile.name) {
  const name = user.profile.name;
}

//  Or use optional chaining
const name = user?.profile?.name;

//  Provide defaults
const name = user?.profile?.name || 'Unknown';
```

## SEO Best Practices 2025

### 1. Slug-based URLs
```typescript
//  GOOD - SEO-friendly
/en/ads/kathmandu/mobiles

// L BAD - Not SEO-friendly
/en/ads?category=1&location=301
```

### 2. Structured Data
```typescript
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "offers": {
    "@type": "Offer",
    "price": "50000",
    "priceCurrency": "NPR"
  }
}
</script>
```

### 3. Dynamic Metadata
```typescript
export async function generateMetadata({ params }) {
  const ad = await getAd(params.slug);
  return {
    title: ad.title,
    description: ad.description.substring(0, 160),
    openGraph: { images: ad.images },
    twitter: { card: 'summary_large_image' },
  };
}
```

## Security Best Practices

### 1. Input Validation
```typescript
// Validate all user input
if (!email || !validateEmail(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

### 2. SQL Injection Prevention
```typescript
//  GOOD - Parameterized queries
await query('SELECT * FROM users WHERE id = $1', [userId]);

// L BAD - String concatenation
await query(`SELECT * FROM users WHERE id = ${userId}`);
```

### 3. XSS Prevention
```typescript
// Next.js automatically escapes output
<div>{user.name}</div> //  Safe

// Only use dangerouslySetInnerHTML when necessary
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

## Code Quality Rules

### Pre-Commit Checklist
- [ ] Used transformers for DB � API data?
- [ ] Logged unknown objects before accessing?
- [ ] Used optional chaining for nested objects?
- [ ] Added explicit TypeScript types?
- [ ] Verified database property names?
- [ ] No `any` types without reason?

### Common Mistakes to Avoid
1. L Passing DB results directly to client
2. L Assuming property names without logging
3. L Using `any` type excessively
4. L Accessing nested properties without optional chaining
5. L Mixing snake_case and camelCase
6. L Overusing @apply in Tailwind

## UI/UX Trends 2025

### 1. Minimal & Clean Design
- White space is important
- Clear typography hierarchy
- Subtle animations (not excessive)

### 2. Mobile-First Always
- Design for mobile, enhance for desktop
- Touch-friendly targets (min 44x44px)
- Responsive images

### 3. Dark Mode Support
```typescript
// Tailwind dark mode
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">
```

### 4. Accessibility (A11y)
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast (WCAG AA minimum)

### 5. Loading States & Skeletons
```typescript
// Better than spinners
<Skeleton className="h-8 w-full" />
```

## Testing Best Practices

### 1. Type Testing
```typescript
// TypeScript catches many bugs
const user: User = await getUser(); // Type-checked!
```

### 2. E2E Testing
- Playwright (modern, fast)
- Test critical user journeys

### 3. Unit Testing
- Vitest (fast, compatible with Vite)
- Test shared utilities

## Advanced Debugging Tools

### Prisma Debugging Commands
```bash
# Check schema structure
grep -A 15 "model categories" prisma/schema.prisma

# View relation names (for self-referencing models)
grep "relation" prisma/schema.prisma

# Pull current database schema
npx prisma db pull

# Validate schema
npx prisma validate
```

### Database Inspection
```bash
# Connect to database
psql -d database_name

# List all tables
\dt

# Describe table structure
\d table_name

# Check enum values
SELECT unnest(enum_range(NULL::enum_type_name));

# Verify actual data
SELECT * FROM users WHERE id = 1;
```

### Common Error Patterns & Solutions

**Error: "Cannot read property 'X' of undefined"**
- **Cause:** Accessing property on null/undefined
- **Fix:** Use optional chaining `obj?.property?.nested`

**Error: "Property 'fullName' does not exist on type 'DbUser'"**
- **Cause:** Using camelCase on database type (uses snake_case)
- **Fix:** Use `full_name` OR transform with `transformDbUserToApi()`

**Error: "Type 'never[]' is not assignable to type 'string[]'"**
- **Cause:** TypeScript inferred wrong type from empty array
- **Fix:** Add explicit type `let arr: string[] = []`

**Error: "Cannot use both include and select"**
- **Cause:** Prisma doesn't allow mixing
- **Fix:** Choose either `include` OR `select`

**Error: "Module not found: @package/name"**
- **Cause:** Package not built
- **Fix:** Run `npm run build` in monorepo root

### When Code Changes Don't Apply

**Symptoms:**
- New console.log() doesn't appear
- Code changes not reflected
- Old behavior persists

**Solution - Clear all caches:**
```bash
# In monorepo
rm -rf .turbo packages/*/dist packages/*/.turbo apps/web/.next apps/web/.turbo

# Rebuild packages
cd packages/types && npm run build
cd ../api-client && npm run build

# Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
```

## React Native / Mobile Best Practices (2025)

### State Management: Zustand (Not Redux!)

**Why Zustand in 2025:**
- 70% less boilerplate than Redux
- 1KB vs Redux's 10KB
- Better TypeScript inference
- No Context Provider needed

```typescript
// Create store
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// Usage
const { user, login, logout } = useAuthStore();
```

### Performance: FlashList (Not FlatList!)

**Why FlashList in 2025:**
- 10x better performance than FlatList
- 90% less memory usage
- Developed by Shopify

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  estimatedItemSize={100}
  keyExtractor={(item, index) => `${item.id}-${index}`}
/>
```

### Server State: TanStack Query (React Query)

**Why in 2025:**
- Automatic caching
- Background refetching
- Optimistic updates

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, refetch } = useQuery({
  queryKey: ['deals'],
  queryFn: () => api.getDeals(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutate data
const mutation = useMutation({
  mutationFn: (newDeal) => api.createDeal(newDeal),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
  },
});
```

### Animations: React Native Reanimated 3

**Why in 2025:**
- 60 FPS guaranteed (runs on UI thread)
- Advanced gestures

```tsx
import Animated, { FadeInDown, useAnimatedStyle } from 'react-native-reanimated';

// Entry animations
<Animated.View entering={FadeInDown.duration(400)}>
  <Card />
</Animated.View>

// Press feedback
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(isPressed ? 0.95 : 1) }],
}));
```

### UX Patterns (2025 Standard)

**1. Haptic Feedback:**
```typescript
import * as Haptics from 'expo-haptics';

// On button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On success
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

**2. Skeleton Loaders** (Better than spinners):
```tsx
if (isLoading) {
  return <SkeletonCard />;
}
```

**3. Pull-to-Refresh:**
```tsx
<FlashList
  refreshControl={
    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
  }
/>
```

**4. Bottom Sheets** (Not modals):
```tsx
import BottomSheet from '@gorhom/bottom-sheet';

const bottomSheetRef = useRef<BottomSheet>(null);
bottomSheetRef.current?.snapToIndex(0); // Open
```

### Custom Hooks Pattern (Mobile)

```typescript
// Template for data fetching hooks
export const useFeatureName = (param?: string) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.get(`/endpoint?param=${param}`);
      setData(response.data);
    } catch (err) {
      setError(err.message);
      logError(err, { context: 'useFeatureName' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [param]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return { data, isLoading, isRefreshing, error, refresh: () => fetchData(true) };
};
```

### React Hooks Rules (2025 Strict)

**❌ NEVER:**
- Call hooks inside JSX (it's conditional!)
- Call hooks after conditions/returns
- Call hooks in loops

```typescript
// ❌ WRONG
<FlashList renderItem={useCallback(() => {}, [])} />

// ✅ CORRECT
const renderItem = useCallback(() => {}, []);
<FlashList renderItem={renderItem} />
```

### FlatList Duplicate Key Error (Common Mobile Bug)

**Symptom:**
```
ERROR  Encountered two children with the same key
```

**Root Cause:** Backend returning duplicate records OR keyExtractor not unique

**Fix Approach 1 - Update keyExtractor:**
```tsx
// ❌ WRONG
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
/>

// ✅ CORRECT - Add index for uniqueness
<FlashList
  data={items}
  keyExtractor={(item, index) => `${item.id}-${index}`}
/>
```

**Fix Approach 2 - Deduplicate in Hook:**
```typescript
const fetchData = async () => {
  const response = await apiClient.get('/endpoint');

  // Deduplicate by ID
  const uniqueItems = response.data.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
  );

  setData(uniqueItems);
};
```

**Prevention:**
- Always use `keyExtractor={(item, index) => \`${item.id}-${index}\`}`
- Add deduplication in data fetching hooks
- Check database for duplicate entries

## Production Logging (2025 Standards)

### Pino Logger (Faster than Winston)

**For NestJS:**
```typescript
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: { colorize: true },
        } : undefined,
      },
    }),
  ],
})
```

### Correlation IDs (Track Requests)

```typescript
// Add correlation ID to every request
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
    }),
  ],
})
```

### OpenTelemetry (2025 Observability)

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

**Auto-tracks:**
- Request rate
- Error rate
- Duration (latency)
- Database queries

## VS Code Debugging (Advanced)

### Debug Configuration

**.vscode/launch.json:**
```json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/main.ts"],
      "sourceMaps": true,
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

### Conditional Breakpoints

Right-click breakpoint → Add condition:
- `user.id === '123'` - Break when condition is true
- `index === 99` - Break on specific iteration

### Logpoints (Non-breaking)

Right-click → Logpoint:
```
User {user.email} logged in at {new Date().toISOString()}
```

## Systematic Debugging Approach

### Step-by-Step Process

```
1. Reproduce the Bug
2. Check Frontend Console Logs
3. Check Backend Server Logs
4. Verify Database State
5. Add Strategic Logging
6. Identify Root Cause
7. Fix & Verify
8. Document the Fix
```

### Never Assume Property Names

```typescript
// ❌ WRONG - Assuming
const userId = req.user.sub;

// ✅ CORRECT - Log first, then access
console.log('🔍 Full req.user:', req.user);
console.log('🔍 Keys:', Object.keys(req.user));
const userId = req.user.id; // or .sub - verify first!
```

### Check for Multiple Server Processes

```bash
# Find processes on port
lsof -i :3000

# Kill old processes
lsof -ti :3000 | xargs kill -9
```

## Analytics & Tracking (Essential)

### Track Everything

```typescript
import { trackScreenView, trackEvent } from './analytics';

// Screen views
useEffect(() => {
  trackScreenView('ScreenName');
}, []);

// User actions
trackEvent('button_clicked', {
  buttonName: 'redeem_deal',
  dealId: deal.id,
});

// Form submissions
trackEvent('form_submitted', {
  formName: 'registration',
});
```

## React Web PropTypes (Runtime Validation)

### Why PropTypes in 2025

Even with TypeScript, PropTypes provide **runtime validation** that catches errors during development:

```jsx
import PropTypes from 'prop-types';

function AdCard({ ad, onClick, isOwner = false }) {
  return <div onClick={onClick}>{ad.title}</div>;
}

AdCard.propTypes = {
  ad: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  isOwner: PropTypes.bool,
};

AdCard.defaultProps = {
  isOwner: false,
};

export default AdCard;
```

### PropTypes Patterns

```jsx
// Primitives
PropTypes.string
PropTypes.number
PropTypes.bool
PropTypes.func
PropTypes.array
PropTypes.object

// Required
PropTypes.string.isRequired

// Array of specific type
PropTypes.arrayOf(PropTypes.string)
PropTypes.arrayOf(PropTypes.number)

// Object with shape
PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string,
})

// One of specific values
PropTypes.oneOf(['pending', 'approved', 'rejected'])

// One of specific types
PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
])

// Any type (avoid if possible)
PropTypes.any
```

### Benefits

1. **Runtime validation** catches type errors during development
2. **Self-documenting** code - shows component API
3. **IDE autocomplete** improvement
4. **Better error messages** than TypeScript alone

## Dependency Management (2025)

### When to Research Updates

**Triggers:**
- Deprecation warnings
- Performance issues
- Security vulnerabilities
- Build failures

### Research Process

```bash
# Search pattern
"[package-name] 2025 latest stable version"
"[feature] React Native Expo 2025 best practice"

# Check versions
npm list [package-name]
npm view [package-name] versions --json

# For Expo packages - always use
npx expo install [package-name]
```

### Modernization Patterns

**File Operations:**
- ❌ Old: Base64 string conversion
- ✅ New: `File` class from expo-file-system

**Network:**
- ❌ Old: `fetch()` (no File support)
- ✅ New: `expo/fetch` (supports File + streaming)

**Image Upload:**
- ❌ Old: JSON with base64
- ✅ New: multipart/form-data with File objects

## React Custom Hooks Patterns (2025)

### Naming Conventions (CRITICAL)

**Rule:** Hook names MUST start with `use` followed by capital letter

```typescript
// ✅ CORRECT
useOnlineStatus
useLocalStorage
useDebounce
useClickOutside

// ❌ WRONG
onlineStatus
getLocalStorage
debounce
```

### Single Responsibility Principle

Each custom hook should have ONE clear purpose:

```typescript
// ✅ GOOD - Single responsibility
function useUserData(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
}

// ❌ BAD - Multiple responsibilities
function useEverything() {
  // Fetches user, manages cart, handles auth, etc.
  // Too complex! Break into smaller hooks
}
```

### Hide Implementation Details

```typescript
// ✅ GOOD - Clean interface
export function useAuth() {
  return {
    user,
    login: (email, password) => { /* internal logic */ },
    logout: () => { /* internal logic */ },
    isAuthenticated: !!user,
  };
}

// ❌ BAD - Exposing internals
export function useAuth() {
  return {
    user,
    setUser,
    token,
    setToken,
    refreshToken,
    // Too many implementation details exposed!
  };
}
```

### Dependency Array Best Practices

```typescript
// ✅ CORRECT - Include all dependencies
const fetchData = useCallback(async () => {
  await api.get(`/data/${userId}`);
}, [userId]); // userId is dependency

// ❌ WRONG - Missing dependencies
const fetchData = useCallback(async () => {
  await api.get(`/data/${userId}`);
}, []); // Missing userId!
```

### Rules of Hooks (2025)

1. **Top-level only** - Never call hooks inside loops, conditions, or nested functions
2. **React functions only** - Only call from React components or custom hooks
3. **Same order** - Hooks must be called in same order every render

```typescript
// ❌ WRONG
if (condition) {
  useEffect(() => { }); // Conditional hook call!
}

// ✅ CORRECT
useEffect(() => {
  if (condition) {
    // Condition inside hook
  }
}, [condition]);
```

## React Reusable Components Patterns (2025)

### Composition Over Configuration

**Modern 2025 Approach:** Build flexible components through composition, not props

```tsx
// ❌ OLD WAY - Too many props (configuration)
<Card
  title="Hello"
  subtitle="World"
  hasImage
  imageUrl="/img.jpg"
  hasButton
  buttonText="Click"
  buttonOnClick={() => {}}
/>

// ✅ NEW WAY - Composition
<Card>
  <Card.Image src="/img.jpg" />
  <Card.Title>Hello</Card.Title>
  <Card.Subtitle>World</Card.Subtitle>
  <Card.Button onClick={() => {}}>Click</Card.Button>
</Card>
```

### Compound Components Pattern

Share state between parent and children without prop drilling:

```tsx
// Implementation
const TabsContext = createContext(null);

function Tabs({ children, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }) {
  return <div className="tabs-list">{children}</div>;
};

Tabs.Trigger = function TabsTrigger({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      className={activeTab === value ? 'active' : ''}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

Tabs.Content = function TabsContent({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  return activeTab === value ? <div>{children}</div> : null;
};

// Usage - Beautiful API!
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>
```

### Container-Presentational Pattern

Separate logic from UI for better reusability:

```tsx
// ✅ Presentational Component (Dumb - No logic)
function UserCard({ name, email, avatar, onFollow }) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
      <button onClick={onFollow}>Follow</button>
    </div>
  );
}

// ✅ Container Component (Smart - Has logic)
function UserCardContainer({ userId }) {
  const { user, loading } = useUser(userId);
  const { follow } = useFollow();

  if (loading) return <Skeleton />;

  return (
    <UserCard
      name={user.name}
      email={user.email}
      avatar={user.avatar}
      onFollow={() => follow(userId)}
    />
  );
}
```

### Atomic Design Pattern (2025 Standard)

Build from smallest to largest:

```
Atoms → Molecules → Organisms → Templates → Pages

Atoms: Button, Input, Label, Icon
Molecules: SearchBar (Input + Button), FormField (Label + Input)
Organisms: Header (Logo + Nav + SearchBar), Card (Image + Title + Button)
Templates: PageLayout (Header + Sidebar + Content)
Pages: HomePage (PageLayout + specific content)
```

## TypeScript Clean Code & Refactoring (2025)

### Prefer `unknown` Over `any`

```typescript
// ❌ BAD - No type safety
function processData(data: any) {
  return data.value; // No checks, will crash!
}

// ✅ GOOD - Type-safe
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: string }).value);
  }
  throw new Error('Invalid data structure');
}
```

### Template Literal Types (Advanced)

```typescript
// ✅ Type-safe string patterns
type AdId = `ad_${number}`;
type UserId = `user_${string}`;

const adId: AdId = 'ad_123'; // ✅ Valid
const adId2: AdId = 'invalid'; // ❌ Type error!

// ✅ Type-safe event names
type EventName = `${string}Changed` | `${string}Clicked`;
const event: EventName = 'buttonClicked'; // ✅ Valid
```

### Discriminated Unions (Type-safe States)

```typescript
// ✅ BEST PRACTICE for API states
type ApiResponse<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function handleResponse(response: ApiResponse<User>) {
  switch (response.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <div>{response.data.name}</div>; // ✅ TypeScript knows .data exists!
    case 'error':
      return <Error message={response.error} />; // ✅ TypeScript knows .error exists!
  }
}
```

### Clean Code Principles (2025)

**In 2025, clean code must be:**
- Easy to read
- Easy to test
- Easy to extend
- Easy to refactor
- **Easy for AI tools to understand** (NEW!)
- Predictable and consistent
- Uses modern syntax

### Service Layer Pattern

```typescript
// ✅ Keep services shallow - don't nest logic
class UserService {
  async createUser(data: CreateUserDto) {
    // Validate
    this.validate(data);

    // Create
    const user = await this.repository.create(data);

    // Send email (delegated to another service)
    await this.emailService.sendWelcome(user.email);

    return user;
  }

  private validate(data: CreateUserDto) {
    // Simple validation logic
  }
}
```

### Composition Over Inheritance

```typescript
// ❌ BAD - Inheritance
class Animal {
  move() {}
}
class Dog extends Animal {
  bark() {}
}

// ✅ GOOD - Composition
interface Movable {
  move: () => void;
}
interface Barkable {
  bark: () => void;
}

class Dog implements Movable, Barkable {
  move() { /* implementation */ }
  bark() { /* implementation */ }
}
```

## Next.js 15 Advanced Patterns (2025)

### Server Components First (Default)

**2025 Standard:** Default to Server Components, use Client Components sparingly

```tsx
// ✅ Server Component (Default) - No "use client"
async function ProductPage({ params }: { params: { id: string } }) {
  // Fetch directly in component
  const product = await db.products.findUnique({
    where: { id: params.id }
  });

  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCartButton productId={product.id} /> {/* Client island */}
    </div>
  );
}

// ✅ Small Client Component for interactivity
'use client';
function AddToCartButton({ productId }: { productId: string }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Add ({count})</button>;
}
```

**Benefits:**
- ⚡ Faster load times (no JS for server components)
- 📦 Smaller bundles
- 🔍 Better SEO
- 🚀 Server-side data access

### Route Segment Config (Replaces getStaticProps)

```typescript
// Force SSR (Server-Side Rendering)
export const dynamic = 'force-dynamic';

// Force SSG (Static Site Generation)
export const dynamic = 'force-static';

// ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds
```

### Server Actions (2025 Form Standard)

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));

  // Validate
  if (!name || !price) {
    return { error: 'Invalid data' };
  }

  // Create in database
  const product = await db.products.create({ name, price });

  // Revalidate cache
  revalidatePath('/products');

  // Redirect
  redirect(`/products/${product.id}`);
}

// Client component
'use client';
function ProductForm() {
  return (
    <form action={createProduct}>
      <input name="name" required />
      <input name="price" type="number" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Project Structure (2025 Best Practice)

```
app/
├── (marketing)/          # Route group (doesn't affect URL)
│   ├── layout.tsx       # Marketing layout
│   ├── page.tsx         # Home page
│   └── about/
│       └── page.tsx
├── (shop)/              # Route group
│   ├── layout.tsx       # Shop layout
│   ├── products/
│   │   ├── page.tsx     # Products list
│   │   ├── loading.tsx  # Loading state
│   │   ├── error.tsx    # Error boundary
│   │   └── [id]/
│   │       └── page.tsx # Product detail
│   └── cart/
│       └── page.tsx
├── api/
│   └── products/
│       └── route.ts     # API route
├── layout.tsx           # Root layout
└── globals.css
```

### Rendering Strategy Guide

```typescript
// Static (SSG) - Best for performance
export const dynamic = 'force-static';
// Use for: Blog posts, product pages, documentation

// Dynamic (SSR) - Best for personalization
export const dynamic = 'force-dynamic';
// Use for: User dashboards, admin panels, personalized content

// ISR - Best for frequently updated content
export const revalidate = 60;
// Use for: News sites, product catalogs, pricing pages
```

### Edge Runtime (2025 Recommended)

```typescript
// Deploy to Edge for global performance
export const runtime = 'edge';

export async function GET() {
  return Response.json({ message: 'Hello from the edge!' });
}
```

## Prisma Performance & Query Optimization (2025)

### Avoid N+1 Problem (CRITICAL!)

```typescript
// ❌ N+1 Problem - BAD!
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { userId: user.id }
  }); // N queries! Very slow!
}

// ✅ Solution 1: Include relations
const users = await prisma.user.findMany({
  include: { posts: true } // Single query with JOIN!
});

// ✅ Solution 2: Use JOIN strategy
const users = await prisma.user.findMany({
  relationLoadStrategy: 'join',
  include: { posts: true }
});
```

### Selective Field Retrieval

```typescript
// ❌ BAD - Fetches ALL fields
const users = await prisma.user.findMany();

// ✅ GOOD - Only fetch what you need
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // Don't fetch password, metadata, etc.
  }
});
```

### Batch Operations

```typescript
// ❌ BAD - 50,000 individual inserts
for (const item of items) {
  await prisma.product.create({ data: item });
}

// ✅ GOOD - Batch insert (1000 at a time)
const batchSize = 1000;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await prisma.product.createMany({ data: batch });
}
```

### Pagination Best Practices

```typescript
// ✅ Cursor-based pagination (recommended)
const products = await prisma.product.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastProductId },
  orderBy: { id: 'asc' }
});

// ✅ Offset-based pagination (simpler but slower)
const products = await prisma.product.findMany({
  take: 20,
  skip: (page - 1) * 20,
});
```

### Add Proper Indexes

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique  // ✅ Automatic index
  name      String
  createdAt DateTime @default(now())

  posts     Post[]

  // ✅ Add indexes for common queries
  @@index([email])
  @@index([createdAt])
}

model Post {
  id      String @id @default(uuid())
  userId  String
  title   String

  user    User   @relation(fields: [userId], references: [id])

  // ✅ Index foreign keys for relation queries
  @@index([userId])
}
```

### Use `in` Operator for Batch Queries

```typescript
// ❌ BAD - Multiple queries
const user1 = await prisma.user.findUnique({ where: { id: '1' } });
const user2 = await prisma.user.findUnique({ where: { id: '2' } });
const user3 = await prisma.user.findUnique({ where: { id: '3' } });

// ✅ GOOD - Single query
const users = await prisma.user.findMany({
  where: { id: { in: ['1', '2', '3'] } }
});
```

### Caching Strategy

```typescript
import Redis from 'ioredis';
const redis = new Redis();

async function getCachedUser(userId: string) {
  // Try cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // Cache for 5 minutes
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user));

  return user;
}
```

## React Native Performance (2025)

### Use Hermes JavaScript Engine

**2025 Standard:** Hermes is now default and recommended

```json
// android/app/build.gradle
project.ext.react = [
    enableHermes: true  // ✅ Enable Hermes
]
```

**Benefits:**
- ⚡ Faster startup (ahead-of-time compilation)
- 📦 Smaller bundle size
- 💾 Lower memory usage

### New Architecture (TurboModules + Fabric)

**2025 Update:** New Architecture is now stable

```json
// package.json
{
  "dependencies": {
    "react-native": "^0.76.0" // New Architecture enabled by default
  }
}
```

**Benefits:**
- 🚀 Faster native module access (TurboModules)
- 🎨 Better rendering (Fabric renderer)
- ⚡ Reduced bridge overhead

### Avoid Anonymous Functions in Render

```tsx
// ❌ BAD - Creates new function every render
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
/>

// ✅ GOOD - Stable references
const renderItem = useCallback(({ item }) => <ItemCard item={item} />, []);
const keyExtractor = useCallback((item) => item.id, []);

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
/>
```

### Use getItemLayout for FlatList

```tsx
// ✅ Optimize FlatList rendering
const ITEM_HEIGHT = 100;

<FlatList
  data={items}
  renderItem={renderItem}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Image Optimization

```tsx
import { Image } from 'expo-image';

// ✅ Use expo-image (better than React Native Image)
<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  placeholder={blurhash}
  contentFit="cover"
  transition={1000}
  cachePolicy="memory-disk" // Automatic caching
/>
```

### Animation Best Practices (2025)

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

// ✅ Use Reanimated 3 (runs on UI thread = 60 FPS)
function AnimatedCard() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text>Card</Text>
    </Animated.View>
  );
}

// ❌ Don't use Animated API (runs on JS thread, can drop frames)
```

### React Query for Server State

```typescript
// ✅ 2025 Standard: TanStack Query for data fetching
import { useQuery } from '@tanstack/react-query';

function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes cache
  });
}

// Usage
const { data, isLoading, refetch } = useProducts();
```

## NestJS Clean Architecture (2025)

### Dependency Injection Best Practices

```typescript
// ✅ GOOD - Inject interface, not implementation
@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IEmailService')
    private readonly emailService: IEmailService,
  ) {}
}

// ❌ BAD - Injecting concrete class
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository, // Tightly coupled!
  ) {}
}
```

### Layered Architecture

```
Presentation Layer (Controllers)
    ↓
Application Layer (Use Cases / Services)
    ↓
Domain Layer (Entities / Business Logic)
    ↓
Infrastructure Layer (Database, External APIs)
```

**Implementation:**

```typescript
// Domain Layer - No dependencies
export class User {
  constructor(
    public id: string,
    public email: string,
    private password: string
  ) {}

  validatePassword(password: string): boolean {
    // Business logic here
  }
}

// Use Case Layer - Depends only on Domain
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private userRepo: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // Business logic
    const user = new User(uuid(), dto.email, dto.password);
    return this.userRepo.save(user);
  }
}

// Infrastructure Layer - Implements interfaces
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@InjectRepository(UserEntity) private repo: Repository<UserEntity>) {}

  async save(user: User): Promise<User> {
    // Database implementation
  }
}
```

### Module Organization (Single Responsibility)

```typescript
// ✅ GOOD - Feature module with single responsibility
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    CreateUserUseCase,
    UpdateUserUseCase,
  ],
  exports: [UserService], // Only export what's needed
})
export class UserModule {}
```

### Avoid Circular Dependencies

```typescript
// ❌ BAD - Circular dependency
// user.service.ts
import { PostService } from './post.service';

// post.service.ts
import { UserService } from './user.service'; // Circular!

// ✅ GOOD - Use events or extract common logic
// user.service.ts
@Injectable()
export class UserService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.save(dto);
    this.eventEmitter.emit('user.created', user); // No direct dependency!
    return user;
  }
}

// post.service.ts
@Injectable()
export class PostService {
  @OnEvent('user.created')
  handleUserCreated(user: User) {
    // React to event
  }
}
```

### Keep Controllers Lean

```typescript
// ✅ GOOD - Thin controller
@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto); // Delegate to use case
  }
}

// ❌ BAD - Fat controller with business logic
@Controller('users')
export class UserController {
  @Post()
  async create(@Body() dto: CreateUserDto) {
    // Validation
    if (!dto.email) throw new BadRequestException();

    // Business logic (should be in service!)
    const user = new User();
    user.email = dto.email;

    // Database (should be in repository!)
    await this.repo.save(user);

    // Email (should be in email service!)
    await this.sendEmail(user.email);

    return user;
  }
}
```

## Code Refactoring Best Practices (2025)

### When to Refactor

**Refactoring Triggers:**
- ✅ Before adding new features (clean code first)
- ✅ During code reviews (improve as you review)
- ✅ When fixing bugs (fix root cause, not symptoms)
- ✅ When code is hard to understand
- ✅ When tests are difficult to write
- ✅ **Before AI-assisted development** (clean code = better AI suggestions)

**DON'T Refactor When:**
- ❌ Deadline is tomorrow
- ❌ Code works and nobody touches it
- ❌ You don't have tests
- ❌ Rewrite would be faster

### Code Smells (2025 Detection Guide)

**Bloaters** (Code that's grown too large):

```typescript
// ❌ Long Method (>20-30 lines)
function processOrder(order) {
  // 150 lines of code
  // Too complex to understand!
}

// ✅ Extract Methods
function processOrder(order) {
  validateOrder(order);
  calculateTotal(order);
  applyDiscount(order);
  processPayment(order);
  sendConfirmation(order);
}

// ❌ Long Parameter List (>3 parameters)
function createUser(name, email, age, address, city, state, zip, country) {}

// ✅ Use Object Parameter
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}
function createUser(params: CreateUserParams) {}

// ❌ Large Class (>250 lines)
class UserManager {
  // 500 lines - does everything!
}

// ✅ Split Responsibilities
class UserAuthenticator {}
class UserProfileManager {}
class UserNotificationService {}
```

**Object-Orientation Abusers:**

```typescript
// ❌ Switch Statements (use polymorphism)
function getArea(shape) {
  switch (shape.type) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle': return 0.5 * shape.base * shape.height;
  }
}

// ✅ Use Polymorphism (OOP) or Strategy Pattern
interface Shape {
  getArea(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  getArea() { return Math.PI * this.radius ** 2; }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  getArea() { return this.width * this.height; }
}

// ❌ Temporary Fields
class Order {
  discount?: number; // Only used during sale season
}

// ✅ Extract to Separate Class
class SaleOrder extends Order {
  discount: number;
}
```

**Change Preventers:**

```typescript
// ❌ Divergent Change (one class changes for multiple reasons)
class User {
  // Changes when auth logic changes
  login() {}
  logout() {}

  // Changes when profile logic changes
  updateProfile() {}
  uploadAvatar() {}

  // Changes when payment logic changes
  addPaymentMethod() {}
}

// ✅ Single Responsibility Principle
class UserAuth { login(); logout(); }
class UserProfile { update(); uploadAvatar(); }
class UserPayment { addMethod(); }

// ❌ Shotgun Surgery (one change requires many small changes)
// Example: Changing API URL requires updating 20 files

// ✅ Centralize Configuration
// config.ts
export const API_URL = process.env.API_URL;
```

**Dispensables** (Unnecessary code):

```typescript
// ❌ Dead Code
function oldFeature() {
  // Nobody calls this anymore
}

// ✅ Delete it! (Git remembers)

// ❌ Speculative Generality
class AbstractUserFactoryBuilder {
  // Over-engineered for future needs that never came
}

// ✅ YAGNI (You Aren't Gonna Need It) - Keep it simple

// ❌ Duplicate Code
function calculateUserDiscount(user) {
  if (user.isPremium) return user.total * 0.2;
  return user.total * 0.1;
}

function calculateOrderDiscount(order) {
  if (order.user.isPremium) return order.total * 0.2;
  return order.total * 0.1;
}

// ✅ Extract Common Logic
function calculateDiscount(total: number, isPremium: boolean) {
  return total * (isPremium ? 0.2 : 0.1);
}
```

**Couplers** (Excessive coupling):

```typescript
// ❌ Feature Envy (method uses more from another class)
class Order {
  calculateTotal() {
    return this.customer.getDiscount() * this.customer.getCredit();
    // Uses customer more than order!
  }
}

// ✅ Move Method to Correct Class
class Customer {
  calculateOrderTotal(order: Order) {
    return order.total * this.getDiscount();
  }
}

// ❌ Inappropriate Intimacy (classes know too much about each other)
class User {
  wallet: Wallet; // Direct access
}
class Wallet {
  user: User; // Circular dependency
}

// ✅ Reduce Coupling
class User {
  getBalance(): number {
    return this.walletService.getBalance(this.id);
  }
}
```

### Refactoring Strategies (2025)

**1. Incremental Refactoring (RECOMMENDED)**

```typescript
// Week 1: Extract methods
function processOrder(order) {
  validateOrder(order);
  // ... rest of old code
}

// Week 2: Extract more methods
function processOrder(order) {
  validateOrder(order);
  calculateTotal(order);
  // ... rest of old code
}

// Week 3: Add types
function processOrder(order: Order): OrderResult {
  validateOrder(order);
  calculateTotal(order);
  // ... rest
}
```

**Benefits:**
- ✅ Less risky
- ✅ Continuous delivery
- ✅ Easier to review
- ✅ Learn as you go

**2. Strangler Fig Pattern (Legacy Modernization)**

```typescript
// Old system still running
class LegacyUserService {
  getUser(id) { /* old code */ }
}

// New system intercepts gradually
class UserService {
  async getUser(id: string): Promise<User> {
    // Route to new implementation
    if (isNewImplementationEnabled(id)) {
      return this.newUserRepo.findById(id);
    }
    // Fall back to legacy
    return this.legacyService.getUser(id);
  }
}

// Eventually remove legacy code completely
```

**3. Branch by Abstraction**

```typescript
// Step 1: Create abstraction
interface PaymentProvider {
  charge(amount: number): Promise<void>;
}

// Step 2: Implement old and new
class StripeProvider implements PaymentProvider {
  async charge(amount: number) { /* old Stripe code */ }
}

class NewPaymentProvider implements PaymentProvider {
  async charge(amount: number) { /* new system */ }
}

// Step 3: Switch via feature flag
const provider = featureFlags.newPayment
  ? new NewPaymentProvider()
  : new StripeProvider();

// Step 4: Remove old implementation when ready
```

### TypeScript Refactoring Patterns

**1. Add Types Incrementally**

```typescript
// Phase 1: Any (start here with legacy JS)
function processData(data: any) {
  return data.value;
}

// Phase 2: Unknown (safer)
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.value;
  }
}

// Phase 3: Proper Types (final goal)
interface Data {
  value: string;
}
function processData(data: Data): string {
  return data.value;
}
```

**2. Extract Type from Implementation**

```typescript
// ❌ Inline types (hard to maintain)
function getUser(id: string): { id: string; name: string; email: string } {
  // ...
}

// ✅ Extract interface
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User {
  // ...
}
```

**3. Use Type Guards**

```typescript
// Add runtime validation during refactoring
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}

function processUser(data: unknown) {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  // TypeScript knows data is User here
  console.log(data.email);
}
```

### React Modernization (Class to Hooks)

**Step-by-Step Migration:**

```tsx
// BEFORE: Class Component
class UserProfile extends React.Component {
  state = {
    user: null,
    loading: true,
  };

  componentDidMount() {
    this.fetchUser();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser();
    }
  }

  fetchUser = async () => {
    this.setState({ loading: true });
    const user = await api.getUser(this.props.userId);
    this.setState({ user, loading: false });
  };

  render() {
    if (this.state.loading) return <Spinner />;
    return <div>{this.state.user.name}</div>;
  }
}

// AFTER: Functional Component with Hooks
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      const data = await api.getUser(userId);
      if (!cancelled) {
        setUser(data);
        setLoading(false);
      }
    }

    fetchUser();

    return () => {
      cancelled = true; // Cleanup
    };
  }, [userId]);

  if (loading) return <Spinner />;
  return <div>{user?.name}</div>;
}
```

**Refactoring Checklist:**
- [ ] Replace `this.state` → `useState`
- [ ] Replace `componentDidMount` → `useEffect(..., [])`
- [ ] Replace `componentDidUpdate` → `useEffect(..., [deps])`
- [ ] Replace `componentWillUnmount` → `useEffect cleanup function`
- [ ] Replace `this.method` → regular function or `useCallback`
- [ ] Replace class properties → `useMemo` or constants
- [ ] Add proper TypeScript types

### Next.js Migration (Pages → App Router)

**Incremental Migration Strategy:**

```
Phase 1: New Features in App Router
✅ Create app/ directory
✅ Build new routes in app/
✅ Keep existing pages/ working

Phase 2: Migrate Static Pages
✅ Move /about, /contact, /privacy
✅ Test thoroughly

Phase 3: Migrate Simple Dynamic Routes
✅ Move /blog/[slug]
✅ Update data fetching

Phase 4: Migrate Complex Features
✅ Move authenticated routes
✅ Migrate layouts
✅ Update middleware

Phase 5: Remove Pages Router
✅ Delete pages/ directory
✅ Update documentation
```

**Data Fetching Migration:**

```tsx
// BEFORE: Pages Router
export async function getServerSideProps({ params }) {
  const product = await db.products.findUnique({
    where: { id: params.id }
  });
  return { props: { product } };
}

export default function ProductPage({ product }) {
  return <div>{product.name}</div>;
}

// AFTER: App Router (Server Component)
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.products.findUnique({
    where: { id: params.id }
  });

  return <div>{product.name}</div>;
}

export default ProductPage;
```

**Client Component Migration:**

```tsx
// BEFORE: Pages Router
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// AFTER: App Router (add "use client")
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### AI-Assisted Refactoring (2025)

**Use AI Tools for:**

1. **Code Smell Detection**
   - AI flags long parameter lists, deep nesting, duplicated logic
   - Suggests classic refactoring moves

2. **Type Inference**
   - AI generates TypeScript types from JavaScript
   - Creates interfaces from usage patterns

3. **Pattern Recognition**
   - Identifies repeated code across files
   - Suggests shared utilities or components

4. **Test Generation**
   - Creates test cases during refactoring
   - Ensures behavior doesn't change

**Best Practices with AI:**
- ✅ Review AI suggestions (don't blindly accept)
- ✅ Refactor in small chunks
- ✅ Run tests after each AI change
- ✅ Commit frequently

### Classic Refactoring Techniques

**Extract Method:**
```typescript
// Before
function printOwing() {
  printBanner();
  console.log(`Name: ${name}`);
  console.log(`Amount: ${getOutstanding()}`);
}

// After
function printOwing() {
  printBanner();
  printDetails(getOutstanding());
}

function printDetails(outstanding: number) {
  console.log(`Name: ${name}`);
  console.log(`Amount: ${outstanding}`);
}
```

**Inline Method:**
```typescript
// Before
function getRating() {
  return moreThanFiveLateDeliveries() ? 2 : 1;
}

function moreThanFiveLateDeliveries() {
  return this.numberOfLateDeliveries > 5;
}

// After (method too simple)
function getRating() {
  return this.numberOfLateDeliveries > 5 ? 2 : 1;
}
```

**Replace Temp with Query:**
```typescript
// Before
function getPrice() {
  const basePrice = quantity * itemPrice;
  const discountFactor = basePrice > 1000 ? 0.95 : 0.98;
  return basePrice * discountFactor;
}

// After
function getPrice() {
  return getBasePrice() * getDiscountFactor();
}

function getBasePrice() {
  return quantity * itemPrice;
}

function getDiscountFactor() {
  return getBasePrice() > 1000 ? 0.95 : 0.98;
}
```

**Introduce Parameter Object:**
```typescript
// Before
function amountInvoiced(startDate: Date, endDate: Date) {}
function amountReceived(startDate: Date, endDate: Date) {}
function amountOverdue(startDate: Date, endDate: Date) {}

// After
interface DateRange {
  startDate: Date;
  endDate: Date;
}

function amountInvoiced(dateRange: DateRange) {}
function amountReceived(dateRange: DateRange) {}
function amountOverdue(dateRange: DateRange) {}
```

**Replace Conditional with Polymorphism:**
```typescript
// Before
function getSpeed(type: string) {
  switch (type) {
    case 'european': return getBaseSpeed();
    case 'african': return getBaseSpeed() - getLoadFactor();
    case 'norwegian': return isNailed ? 0 : getBaseSpeed();
  }
}

// After
interface Bird {
  getSpeed(): number;
}

class EuropeanBird implements Bird {
  getSpeed() { return this.getBaseSpeed(); }
}

class AfricanBird implements Bird {
  getSpeed() { return this.getBaseSpeed() - this.getLoadFactor(); }
}

class NorwegianBird implements Bird {
  getSpeed() { return this.isNailed ? 0 : this.getBaseSpeed(); }
}
```

### Testing During Refactoring

**Golden Rule:** Write tests BEFORE refactoring

```typescript
// 1. Write characterization tests (document current behavior)
describe('processOrder', () => {
  it('applies 20% discount to premium users', () => {
    const order = { user: { isPremium: true }, total: 100 };
    expect(processOrder(order).total).toBe(80);
  });

  it('applies 10% discount to regular users', () => {
    const order = { user: { isPremium: false }, total: 100 };
    expect(processOrder(order).total).toBe(90);
  });
});

// 2. Refactor
function processOrder(order: Order): ProcessedOrder {
  const discount = order.user.isPremium ? 0.2 : 0.1;
  return {
    ...order,
    total: order.total * (1 - discount)
  };
}

// 3. Tests should still pass!
```

### Refactoring Workflow (2025)

```
1. Identify Code Smell
   ↓
2. Write/Update Tests
   ↓
3. Refactor in Small Steps
   ↓
4. Run Tests After Each Step
   ↓
5. Commit Frequently
   ↓
6. Code Review
   ↓
7. Deploy
```

### Tools for 2025

**Static Analysis:**
- ESLint + TypeScript ESLint
- SonarQube (code smells, complexity)
- PMD (duplicate code detection)

**AI-Powered:**
- GitHub Copilot (refactoring suggestions)
- Cursor AI (code modernization)
- Qodo (test generation)

**Refactoring IDEs:**
- VSCode (rename symbol, extract method)
- WebStorm (advanced refactoring tools)
- Cursor (AI-assisted refactoring)

### Refactoring Metrics

**Track These:**
- Cyclomatic Complexity (target: <10 per function)
- Code Coverage (target: >80%)
- Duplicated Code (target: <3%)
- Lines per File (target: <250)
- Functions per File (target: <10)

### Red Flags (Stop Refactoring If)

❌ Tests are failing
❌ No tests exist
❌ Deadline is critical
❌ You're changing behavior (that's not refactoring!)
❌ Team doesn't understand changes

### Key Principles

1. **Refactor ≠ Rewrite** - Preserve behavior
2. **Small Steps** - One smell at a time
3. **Test-Driven** - Tests first, refactor second
4. **Incremental** - Ship improvements continuously
5. **Reversible** - Use Git, commit often
6. **Team Agreement** - Everyone understands why

## Resources

- TypeScript Docs: https://www.typescriptlang.org/docs/
- Next.js 15 Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- React Docs: https://react.dev
- React Native Docs: https://reactnative.dev
- Expo Docs: https://docs.expo.dev
- Zustand: https://github.com/pmndrs/zustand
- TanStack Query: https://tanstack.com/query
- FlashList: https://shopify.github.io/flash-list
- Refactoring Guru: https://refactoring.guru

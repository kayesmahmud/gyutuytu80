# Thulo Bazaar Next.js Monorepo Architecture

## 🎯 SEO-Friendly URL Structure (2025 Best Practices)

### Hierarchical Ad Listings
All ad listings now use SEO-optimized URLs with slugs instead of numeric IDs:

#### Route: `/[lang]/ads/[[...params]]`
- `/en/ads` → All ads
- `/en/ads/mobiles` → All mobiles category
- `/en/ads/kathmandu` → All ads in Kathmandu
- `/en/ads/kathmandu/mobiles` → Mobiles in Kathmandu
- `/en/ads/thamel/mobile-phones` → Mobile phones in Thamel

**Logic:**
- First param checked as location slug → if found, second param is category
- If not location → first param is category
- Returns 404 if neither match

### Search & Filter Pages

#### Route: `/[lang]/search`
Query parameters use slugs:
- `?category=mobiles` (not `?category=1`)
- `?location=kathmandu` (not `?location=301`)
- Full: `/en/search?category=mobile-phones&minPrice=10000&condition=new`

#### Route: `/[lang]/all-ads`
Similar slug-based filtering with sidebar navigation.

## 📁 Project Structure

### Active Routes
```
apps/web/src/app/[lang]/
├── ads/
│   └── [[...params]]/          # Hierarchical location/category routes
│       └── page.tsx
├── search/                      # Search with filters
│   ├── page.tsx
│   ├── SearchFilters.tsx
│   ├── SearchPagination.tsx
│   └── SortDropdown.tsx
├── all-ads/                     # Browse all ads
│   ├── page.tsx
│   └── AllAdsFilters.tsx
└── ad/[slug]/                   # Individual ad detail
    └── page.tsx
```

### Filter Components
- **SearchFilters.tsx** → Used by `/search` page
- **AllAdsFilters.tsx** → Used by `/all-ads` page
- Both use category/location slugs for SEO-friendly URLs

### Shared Components
```
apps/web/src/components/
├── AdCard.tsx                   # Unified ad card (used everywhere)
├── LocationSelector.tsx         # Hierarchical location picker
└── CategorySelector.tsx         # Category/subcategory selector
```

## 🗃️ Database Schema

### Categories (Hierarchical)
- **Parent categories**: `parent_id = NULL`
- **Subcategories**: `parent_id` references parent category
- All have unique `slug` field for SEO URLs
- Example: `Mobile` (parent) → `Mobile Phones` (child)

### Locations (3-Level Hierarchy)
- **Province** (`type = 'province'`, `parent_id = NULL`)
- **District** (`type = 'district'`, `parent_id = province.id`)
- **Municipality** (`type = 'municipality'`, `parent_id = district.id`)
- All have unique `slug` field for SEO URLs
- Total: 835 locations with slugs

### Ads
- References `category_id` and `location_id`
- Has `slug` field for SEO-friendly ad URLs
- Soft delete with `deleted_at`

## 🔍 SEO Features

### Slug Generation
All slugs auto-generated from names:
```sql
UPDATE locations 
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;
```

### Dynamic Metadata
Each page generates dynamic `<title>` and `<meta description>`:
- `/en/ads/kathmandu/mobiles` → "Mobiles in Kathmandu - Thulo Bazaar"
- `/en/search?category=mobile-phones` → "Mobile Phones - Thulo Bazaar"

### Breadcrumbs
All pages include structured breadcrumbs with proper hierarchy.

## 🚀 Performance Optimizations

### Server Components (Next.js 15)
- All data fetching in Server Components
- Parallel queries with `Promise.all()`
- Prisma query optimization

### Database Queries
- Hierarchical filtering (province → districts → municipalities)
- Indexed on `slug`, `category_id`, `location_id`
- Only fetch required fields with Prisma `select`

## 📦 Removed/Deprecated

### Old Routes (Removed for cleanup)
- ❌ `/ads/[location]` → Replaced by `[[...params]]`
- ❌ `/ads/category` → Replaced by `[[...params]]`

### Unused Components (Removed)
- ❌ `UnifiedAdFilters.tsx` → Not used, removed in cleanup

## 🎨 Styling
- Tailwind CSS with custom config
- Responsive design with mobile-first approach
- Unified AdCard component across all pages

## 🔐 API Endpoints (Backend on port 5000)
- Images served from Express backend
- Authentication handled by backend
- Next.js frontend fetches from `http://localhost:5000`

---
**Last Updated:** October 23, 2025
**Next.js Version:** 15
**Architecture Pattern:** SEO-First, Hierarchical URLs

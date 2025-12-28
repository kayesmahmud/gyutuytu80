# Missing Avatar Files Report

## 🔍 Investigation Results

### Database Claims: 10 shops have avatars
### Actual Files: Only 2 files exist

---

## ✅ Files That EXIST (2)

| Shop ID | Shop Name | Avatar File | File Size | Status |
|---------|-----------|-------------|-----------|--------|
| 12 | Bikash Thapa | avatar-1764399515222-188897987.jpg | 96KB | ✅ EXISTS |
| 35 | Bahadur Thakur | avatar-1765307286540-753602356.jpg | 236KB | ✅ EXISTS |

**These 2 shops display correctly!**

---

## ❌ Files That DON'T EXIST (8)

| Shop ID | Shop Name | Avatar File | Status |
|---------|-----------|-------------|--------|
| 15 | Kayes Luxury Motor Shop | avatar-undefined-1759625284298-609220624.jpg | ❌ MISSING |
| 27 | Shanti beauty Shop | avatar-27-1761733269545-218942829.jpg | ❌ MISSING |
| 44 | Wimax Mobile Store | avatar-44-1764943202682-522472506.jpg | ❌ MISSING |
| 45 | Falguni Tamang | avatar-45-1764945312663-978410727.jpg | ❌ MISSING |
| 47 | Akash Subedi | avatar-47-1765207981303-64317584.jpg | ❌ MISSING |
| 57 | Pixel Studio | https://lh3.googleusercontent.com/... | ✅ EXTERNAL (Google) |
| 60 | Amit Sharma | avatar-60-1766050775103-293224978.jpg | ❌ MISSING |
| 62 | Dija Fashion Shop | avatar-62-1766059434651-684816538.jpg | ❌ MISSING |

---

## 🎯 Summary

**Database records:** 10 shops with avatars
**Files on server:** 2 local + 1 external = 3 should work
**Actually working:** Only 2 showing

---

## 🐛 Why Files Are Missing

### Possible Reasons:
1. **Files were deleted** from server but DB not updated
2. **Upload failed** but DB was updated
3. **Wrong upload directory** used
4. **Server migration** lost files
5. **Manual database entries** without actual files

---

## ✅ What's Working

The ShopCard correctly handles missing files:
```typescript
onError={(e) => {
  (e.target as HTMLImageElement).style.display = 'none';
}}
```

**Result:** Missing images gracefully fall back to 🏪 emoji

---

## 🔧 Solutions

### Option 1: Clean Database (Recommended)
Remove avatar references for missing files:

```sql
UPDATE users
SET avatar = NULL
WHERE id IN (15, 27, 44, 45, 47, 60, 62)
  AND avatar NOT LIKE 'http%';
```

### Option 2: Restore Missing Files
If you have backups, restore the avatar files to:
```
/Users/elw/Documents/Web/thulobazaar/monorepo/apps/api/uploads/avatars/
```

### Option 3: Ask Users to Re-upload
Notify affected users to upload avatars again.

---

## 🧪 Test External URL (Google)

**Pixel Studio (ID 57)** has Google profile photo.

**URL:**
```
https://lh3.googleusercontent.com/a/ACg8ocLufpjr5v--b2WM5infXGq8Lkm0XlN3TXGbG1btS1bNOI3b2nQ=s96-c
```

**Should work** if external URLs are allowed in ShopCard!

Let me verify if this shop shows the Google avatar...

---

## 📊 Current vs Expected

### What You See Now:
- ✅ 2 shops with local avatars
- ⚠️ 1 shop with Google avatar (should work)
- ❌ 7 shops with missing files (show emoji)
- ✅ 10 shops without avatars (show emoji)

### What You Should See (if all files existed):
- ✅ 9 shops with avatars (2 local + 7 restored)
- ✅ 1 shop with Google avatar
- ✅ 10 shops with emoji fallback

---

## 🎯 Recommendation

**Clean up the database:**

```sql
-- Check which files are missing
SELECT id, full_name, avatar
FROM users
WHERE avatar IS NOT NULL
  AND avatar NOT LIKE 'http%'
  AND avatar NOT IN (
    'avatar-1764399515222-188897987.jpg',
    'avatar-1765307286540-753602356.jpg'
  );

-- Set avatar to NULL for missing files
UPDATE users
SET avatar = NULL
WHERE avatar IS NOT NULL
  AND avatar NOT LIKE 'http%'
  AND avatar NOT IN (
    'avatar-1764399515222-188897987.jpg',
    'avatar-1765307286540-753602356.jpg'
  );
```

**This will:**
1. Remove broken avatar references
2. Keep only the 2 working avatars + 1 Google URL
3. Clean up data integrity
4. Make the UI consistent

---

## ✅ After Cleanup

**Expected result:**
- 2 shops show local avatars ✅
- 1 shop shows Google avatar ✅
- All others show 🏪 emoji ✅
- No broken images ✅
- Clean database ✅

---

**Want me to run the cleanup SQL?**

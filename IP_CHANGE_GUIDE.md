# IP Address Change Guide

When your laptop's IP address changes (e.g., switching WiFi networks), update these files:

## Quick Commands

```bash
# 1. Find your current IP
ipconfig getifaddr en0

# 2. Find & replace old IP in all files (dry run first)
grep -r "192.168.1.OLD_IP" --include="*.env*" --include="*.ts" --include="*.dart" .

# 3. Update files (see below)
```

## Files to Update

### 1. Root `.env`
**Path:** `/monorepo/.env`

```env
NEXT_PUBLIC_API_URL=http://YOUR_IP:5000
NEXT_PUBLIC_SITE_URL=http://YOUR_IP:3333
FRONTEND_URL=http://YOUR_IP:3333
BACKEND_URL=http://YOUR_IP:5000
CORS_ORIGIN=http://localhost:3333,http://YOUR_IP:3333
```

### 2. Web `.env.local`
**Path:** `/monorepo/apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://YOUR_IP:5000
NEXTAUTH_URL=http://YOUR_IP:3333
```

### 3. Next.js Config
**Path:** `/monorepo/apps/web/next.config.ts`

```typescript
allowedDevOrigins: ['http://YOUR_IP:3333'],
// ...
images: {
  remotePatterns: [
    // ...
    {
      protocol: 'http',
      hostname: 'YOUR_IP',  // <-- Update this
      port: '5000',
      pathname: '/uploads/**',
    },
  ],
},
```

### 4. Flutter API Config
**Path:** `/monorepo/apps/mobile/lib/core/api/api_config.dart`

```dart
return 'http://YOUR_IP:5000/api'; // Physical device on same WiFi
```

## After Updating

```bash
# 1. Restart servers
lsof -ti:3333 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# 2. Clear Next.js cache (important!)
rm -rf apps/web/.next .turbo apps/web/.turbo

# 3. Start servers
npm run dev:api
npm run dev:web

# 4. Restart Flutter app (Shift+R for full restart, not just 'r')
```

## Quick Sed Commands

Replace `OLD_IP` with your previous IP and `NEW_IP` with your current IP:

```bash
# macOS sed syntax
sed -i '' 's/OLD_IP/NEW_IP/g' .env
sed -i '' 's/OLD_IP/NEW_IP/g' apps/web/.env.local
sed -i '' 's/OLD_IP/NEW_IP/g' apps/web/next.config.ts
sed -i '' 's/OLD_IP/NEW_IP/g' apps/mobile/lib/core/api/api_config.dart
```

## Checklist

- [ ] `.env` (root)
- [ ] `apps/web/.env.local`
- [ ] `apps/web/next.config.ts`
- [ ] `apps/mobile/lib/core/api/api_config.dart`
- [ ] Clear `.next` cache
- [ ] Restart API server
- [ ] Restart Web server
- [ ] Restart Flutter app (full restart)

## Verify Everything Works

```bash
# Check API
curl http://YOUR_IP:5000/api/health

# Check Web (should return redirect 308)
curl -s -o /dev/null -w "%{http_code}" http://YOUR_IP:3333

# Check images load
curl -I "http://YOUR_IP:5000/uploads/ads/ad-1766772381101-265117936.jpeg"

# Test from mobile device
adb shell "curl http://YOUR_IP:5000/api/health"
```

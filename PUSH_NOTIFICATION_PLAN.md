# Thulo Bazaar — Complete Push Notification Implementation Plan

> **Total: 38 notification types + In-App Notification Center (Flutter + Web)**
> **Cost: $0/month** — FCM is free, all logic runs on existing PostgreSQL + Express + crons
> **Current status:** Only #1 (chat messages) is working

---

## Table of Contents

1. [Notification Catalog (All 38 Types)](#notification-catalog)
2. [Phase 0: Foundation](#phase-0-foundation)
3. [Phase 1: Quick Wins](#phase-1-quick-wins)
4. [Phase 2: In-App Notification Center](#phase-2-in-app-notification-center)
5. [Phase 3: Cron-Based Notifications](#phase-3-cron-based-notifications)
6. [Phase 4: Location-Based Notifications](#phase-4-location-based-notifications)
7. [Phase 5: Tracking & Behavior](#phase-5-tracking--behavior)
8. [Phase 6: Admin & Announcements](#phase-6-admin--announcements)
9. [Database Migrations Summary](#database-migrations-summary)
10. [Flutter Changes Summary](#flutter-changes-summary)
11. [Web Changes Summary](#web-changes-summary)

---

## Notification Catalog

### Chat & Messaging
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 1 | New chat message | Someone sends message (offline) | `/messages/{id}` | **Done** |
| 2 | Unread messages reminder | Messages unread 6+ hours | `/messages` | Phase 3 |

### Ad Lifecycle
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 3 | Ad approved | Editor approves ad | `/ad/{adId}` | Phase 1 |
| 4 | Ad rejected | Editor rejects ad (with reason) | `/ad/{adId}` | Phase 1 |
| 5 | Ad expiring soon | Ad expires in 3 days | `/ad/{adId}` | Phase 3 |
| 6 | Ad expired | Ad has expired | `/ad/{adId}` | Phase 3 |
| 7 | Ad views milestone | Ad hits 50/100/500 views | `/ad/{adId}` | Phase 5 |

### Buyer Engagement
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 8 | New inquiry on your ad | Buyer sends contact message | `/ad/{adId}` | Phase 1 |
| 9 | Seller replied to inquiry | Seller responds to inquiry | `/ad/{adId}` | Phase 5 |

### Verification
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 10 | Business verification approved | Editor approves | `/verification` | Phase 1 |
| 11 | Business verification rejected | Editor rejects | `/verification` | Phase 1 |
| 12 | Individual verification approved | Editor approves | `/verification` | Phase 1 |
| 13 | Individual verification rejected | Editor rejects | `/verification` | Phase 1 |
| 14 | Verification expiring soon | 30 days before expiry | `/verification` | Phase 3 |
| 15 | Verification expired | Verification expired | `/verification` | Phase 3 |

### Promotions & Payments
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 16 | Payment confirmed | Khalti/eSewa success | `/promotion` | Phase 1 |
| 17 | Promotion started | Promotion goes live | `/promotion` | Phase 3 |
| 18 | Promotion expiring soon | Expires in 24 hours | `/promotion` | Phase 3 |
| 19 | Promotion expired | Promotion ended | `/promotion` | Phase 3 |

### Location-Based
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 20 | Better deal nearby | Similar ad, lower price, same area | `/ad/{adId}` | Phase 4 |
| 21 | New ad in your area + category | Matches interests + location | `/ad/{adId}` | Phase 4 |
| 22 | Trending in your area | High activity category in city | `/ad/{adId}` | Phase 4 |
| 23 | Nearby verified seller | Verified seller posts near user | `/ad/{adId}` | Phase 4 |

### Re-engagement
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 24 | Abandoned bookmark | Bookmarked 3+ days ago, hasn't returned | `/ad/{adId}` | Phase 3 |
| 25 | Viewed but didn't act | Viewed 3+ times, no action | `/ad/{adId}` | Phase 5 |
| 26 | Win-back inactive user | No app open in 7+ days | `/home` | Phase 3 |
| 27 | Bookmark still available | Weekly reminder of saved ads | `/favorites` | Phase 3 |

### Favorites & Price
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 28 | Price drop on favorite | Price lowered on bookmarked ad | `/ad/{adId}` | Phase 5 |
| 29 | Favorite ad removed | Bookmarked ad deleted/sold | `/favorites` | Phase 3 |

### Support
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 30 | Support ticket reply | Admin responds to ticket | `/support/{id}` | Phase 6 |
| 31 | Ticket resolved | Ticket marked resolved | `/support/{id}` | Phase 6 |

### System & Admin
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 32 | App update available | New version released | `/home` | Phase 6 |
| 33 | System maintenance | Scheduled downtime | `/home` | Phase 6 |
| 34 | Welcome new user | First registration | `/home` | Phase 6 |

### Festivals & Announcements (NEW)
| # | Notification | Trigger | Route | Phase |
|---|-------------|---------|-------|-------|
| 35 | Festival greeting | Scheduled for festival dates | `/home` | Phase 6 |
| 36 | Promotional offer | Admin creates discount campaign | `/promotion` | Phase 6 |
| 37 | New feature announcement | Admin announces new feature | `/home` | Phase 6 |
| 38 | Flash sale / event | Time-limited event or sale | `/home` | Phase 6 |

---

## Phase 0: Foundation

> **Goal:** Build the generic notification service and database table that ALL other phases depend on.
> **This phase is required before any other phase.**

### 0.1 — Database: `notifications` Table (Prisma Migration)

This table stores ALL notifications (push + in-app) for the notification center.

**File to edit:** `packages/database/prisma/schema.prisma`

```prisma
model notifications {
  id              Int       @id @default(autoincrement())
  user_id         Int
  type            String    @db.VarChar(50)    // 'ad_approved', 'new_message', 'price_drop', etc.
  title           String    @db.VarChar(255)
  body            String
  data            Json?                        // { adId: 123, route: '/ad/123', etc. }
  image_url       String?   @db.VarChar(500)   // optional icon/image
  is_read         Boolean   @default(false)
  read_at         DateTime?
  created_at      DateTime  @default(now())    @db.Timestamp(6)

  users           users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, is_read])
  @@index([user_id, created_at(sort: Desc)])
  @@index([type])
}
```

Also add to `users` model:
```prisma
notifications   notifications[]
```

**Migration command:**
```bash
cd packages/database
npx prisma migrate dev --name add_notifications_table
```

### 0.2 — Database: `notification_log` Table

Prevents spamming — tracks what was sent and enforces rate limits.

```prisma
model notification_log {
  id              Int       @id @default(autoincrement())
  user_id         Int
  notification_type String  @db.VarChar(50)
  reference_id    Int?                          // adId, ticketId, etc.
  sent_at         DateTime  @default(now())     @db.Timestamp(6)

  users           users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, notification_type, sent_at])
  @@index([user_id, notification_type, reference_id])
}
```

### 0.3 — Backend: Generic Notification Service

**New file:** `apps/api/src/services/notificationService.ts`

This replaces the chat-only `pushNotification.ts` with a generic service.

```typescript
// Core function used by ALL notification types
interface SendNotificationParams {
  recipientUserIds: number[];
  type: string;              // 'ad_approved', 'verification_approved', etc.
  title: string;
  body: string;
  data?: Record<string, string>;  // { route, adId, etc. }
  imageUrl?: string | null;
  saveToDb?: boolean;        // default true — saves to notifications table
  sendPush?: boolean;        // default true — sends FCM push
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  // 1. Save to `notifications` table (for in-app notification center)
  // 2. Send FCM push to all recipients' devices
  // 3. Emit socket event 'notification:new' for real-time badge updates
  // 4. Log to `notification_log` for rate limiting
}

// Helper: check rate limit before sending
export async function canSendNotification(
  userId: number,
  type: string,
  referenceId?: number,
  cooldownMinutes?: number
): Promise<boolean> {
  // Query notification_log — return false if sent within cooldown
}
```

**Key behaviors:**
- `saveToDb: true` → creates record in `notifications` table (for notification center)
- `sendPush: true` → sends FCM push notification
- Some notifications are push-only (e.g., festival greetings — no need to store)
- Some are DB-only (e.g., low priority — store but don't push)
- Rate limiting via `notification_log` prevents duplicate sends

### 0.4 — Backend: Notification API Endpoints

**New file:** `apps/api/src/routes/notificationCenter.routes.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List user's notifications (paginated, newest first) |
| GET | `/api/notifications/unread-count` | Get unread count (for badge) |
| PUT | `/api/notifications/:id/read` | Mark single notification as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete single notification |

**Mount in:** `apps/api/src/app.ts`
```typescript
app.use('/api/notifications', notificationCenterRoutes);
```

### 0.5 — Backend: Socket Event for Real-Time Badge

**File to edit:** `apps/api/src/socket/index.ts`

When a notification is created, emit to the user's socket room:
```typescript
io.to(`user:${userId}`).emit('notification:new', {
  id, type, title, body, data, createdAt, unreadCount
});
```

This allows the Flutter app and web app to update the notification badge in real-time without polling.

### 0.6 — Update Existing Chat Push Notification

**File to edit:** `apps/api/src/services/pushNotification.ts`

Refactor `sendMessagePushNotification()` to use the new generic `sendNotification()` internally:
```typescript
export async function sendMessagePushNotification(params) {
  await sendNotification({
    recipientUserIds: params.recipientUserIds,
    type: 'new_message',
    title: params.senderName,
    body: formatMessageBody(params),
    data: {
      type: 'new_message',
      conversationId: String(params.conversationId),
      route: `/messages/${params.conversationId}`,
    },
    saveToDb: true,   // now also appears in notification center
    sendPush: true,
  });
}
```

### Files Changed in Phase 0
| File | Action |
|------|--------|
| `packages/database/prisma/schema.prisma` | Add `notifications` and `notification_log` models |
| `apps/api/src/services/notificationService.ts` | **New** — generic notification service |
| `apps/api/src/routes/notificationCenter.routes.ts` | **New** — notification center API |
| `apps/api/src/app.ts` | Mount new routes |
| `apps/api/src/socket/index.ts` | Add `notification:new` socket event |
| `apps/api/src/services/pushNotification.ts` | Refactor to use generic service |

---

## Phase 1: Quick Wins

> **Goal:** Add push notifications to existing endpoints that already have all the data.
> **No new tables, no new crons — just add `sendNotification()` calls.**
> **Notifications: #3, #4, #8, #10, #11, #12, #13, #16**

### 1.1 — Ad Approved (#3) & Ad Rejected (#4)

**File to edit:** `apps/api/src/routes/editor/ads.routes.ts`
**Endpoint:** `PUT /api/editor/ads/:id/status` (line ~169)

**Where to add:** After the `prisma.ads.update()` call and `logReviewHistory()` (around line 200).

```typescript
// After ad status update:
const ad = await prisma.ads.findUnique({
  where: { id: adId },
  select: { user_id: true, title: true },
});

if (status === 'approved') {
  await sendNotification({
    recipientUserIds: [ad.user_id],
    type: 'ad_approved',
    title: 'Ad Approved!',
    body: `Your ad "${ad.title}" is now live!`,
    data: { route: '/ad', adId: String(adId) },
  });
} else if (status === 'rejected') {
  await sendNotification({
    recipientUserIds: [ad.user_id],
    type: 'ad_rejected',
    title: 'Ad Not Approved',
    body: `Your ad "${ad.title}" was rejected: ${rejection_reason || 'See details'}`,
    data: { route: '/ad', adId: String(adId) },
  });
}
```

**Also add for:**
- `POST /api/editor/ads/:id/suspend` (line ~285) → "Your ad has been suspended"
- `POST /api/editor/ads/:id/unsuspend` (line ~341) → "Your ad has been restored"

### 1.2 — Verification Approved (#10, #12) & Rejected (#11, #13)

**File to edit:** `apps/api/src/routes/editor/verifications.routes.ts`

**Approve endpoint:** `POST /api/editor/verifications/:id/approve` (line ~128)

```typescript
// After verification update:
if (type === 'business') {
  await sendNotification({
    recipientUserIds: [request.user_id],
    type: 'verification_approved',
    title: 'Business Verified!',
    body: `Your business "${request.business_name}" is now verified!`,
    data: { route: '/verification', verificationType: 'business' },
  });
} else {
  await sendNotification({
    recipientUserIds: [request.user_id],
    type: 'verification_approved',
    title: 'You\'re Verified!',
    body: 'Your identity has been verified. You now have a verified badge!',
    data: { route: '/verification', verificationType: 'individual' },
  });
}
```

**Reject endpoint:** `POST /api/editor/verifications/:id/reject` (line ~197)

```typescript
await sendNotification({
  recipientUserIds: [request.user_id],
  type: 'verification_rejected',
  title: 'Verification Not Approved',
  body: `${type === 'business' ? 'Business' : 'Identity'} verification rejected: ${reason}`,
  data: { route: '/verification', verificationType: type },
});
```

### 1.3 — New Inquiry on Ad (#8)

**File to edit:** `apps/api/src/routes/contact.routes.ts` (or wherever contact_messages are created)

**Where:** After `prisma.contact_messages.create()`:

```typescript
await sendNotification({
  recipientUserIds: [sellerId],
  type: 'new_inquiry',
  title: 'New Inquiry!',
  body: `${buyerName} is interested in your "${adTitle}"`,
  data: { route: '/ad', adId: String(adId) },
});
```

### 1.4 — Payment Confirmed (#16)

**File to edit:** `apps/api/src/services/payment.service.ts`
**Function:** `handlePaymentSuccess()` (line ~273)

```typescript
// After successful payment processing:
await sendNotification({
  recipientUserIds: [transaction.user_id],
  type: 'payment_confirmed',
  title: 'Payment Confirmed',
  body: `Payment of Rs. ${transaction.amount} confirmed for ${paymentType.replace('_', ' ')}`,
  data: {
    route: paymentType === 'ad_promotion' ? '/promotion' : '/verification',
    paymentType,
  },
});
```

### Files Changed in Phase 1
| File | Action |
|------|--------|
| `apps/api/src/routes/editor/ads.routes.ts` | Add sendNotification calls |
| `apps/api/src/routes/editor/verifications.routes.ts` | Add sendNotification calls |
| `apps/api/src/routes/contact.routes.ts` | Add sendNotification call for inquiries |
| `apps/api/src/services/payment.service.ts` | Add sendNotification call |

---

## Phase 2: In-App Notification Center

> **Goal:** Build the notification screen in Flutter and notification page on the web.
> **Like Facebook's notification bell — shows all notifications, unread badge, mark as read.**
> **Depends on:** Phase 0 (notifications table + API endpoints)

### 2.1 — Flutter: Notification Screen

**New file:** `apps/mobile/lib/features/notifications/notification_screen.dart`

**Features:**
- List of all notifications, newest first (paginated with infinite scroll)
- Unread notifications have a colored background / dot indicator
- Pull-to-refresh
- Tap notification → mark as read + navigate to route (ad, verification, etc.)
- "Mark all as read" button in app bar
- Swipe to delete individual notifications
- Empty state: "No notifications yet"
- Group by date: "Today", "Yesterday", "This Week", "Earlier"

**UI Design:**
```
┌─────────────────────────────────┐
│  ← Notifications    Mark all ✓  │
├─────────────────────────────────┤
│  Today                          │
│  ┌─────────────────────────────┐│
│  │ 🟢 Ad Approved!             ││
│  │ Your ad "iPhone 15" is live  ││
│  │ 2 minutes ago                ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 💬 Ram                      ││
│  │ Is this phone available?     ││
│  │ 1 hour ago                   ││
│  └─────────────────────────────┘│
│  Yesterday                      │
│  ┌─────────────────────────────┐│
│  │ ✅ Business Verified!        ││
│  │ Ram Electronics is verified  ││
│  │ Yesterday at 3:00 PM         ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Notification icons by type:**
| Type | Icon | Color |
|------|------|-------|
| `ad_approved` | ✅ checkmark | Green |
| `ad_rejected` | ❌ cross | Red |
| `new_message` | 💬 chat bubble | Blue |
| `new_inquiry` | 🔔 bell | Orange |
| `verification_approved` | ✅ shield | Green |
| `verification_rejected` | ❌ shield | Red |
| `payment_confirmed` | 💳 card | Green |
| `price_drop` | 📉 arrow down | Green |
| `promotion_*` | ⭐ star | Gold |
| `festival` | 🎉 party | Multi |
| `announcement` | 📢 megaphone | Blue |
| default | 🔔 bell | Gray |

### 2.2 — Flutter: Notification Badge (Bell Icon)

**Files to edit:**
- `apps/mobile/lib/features/home/home_screen.dart` (or wherever the app bar is)

**Add:** Bell icon with unread count badge in the app bar:
```dart
// In app bar actions:
Stack(
  children: [
    IconButton(icon: Icon(Icons.notifications_outlined), onPressed: () => navigateToNotifications()),
    if (unreadCount > 0)
      Positioned(
        right: 8, top: 8,
        child: Badge(count: unreadCount),
      ),
  ],
)
```

**Unread count source:**
- On app launch: call `GET /api/notifications/unread-count`
- Real-time updates: listen to socket event `notification:new` → increment badge
- When user opens notification screen: call `PUT /api/notifications/read-all` → reset badge

### 2.3 — Flutter: Notification Provider/Service

**New file:** `apps/mobile/lib/core/providers/notification_provider.dart`

```dart
class NotificationProvider extends ChangeNotifier {
  int _unreadCount = 0;
  List<NotificationItem> _notifications = [];
  bool _isLoading = false;
  bool _hasMore = true;

  // Fetch notifications (paginated)
  Future<void> fetchNotifications({bool refresh = false});

  // Fetch unread count
  Future<void> fetchUnreadCount();

  // Mark single as read
  Future<void> markAsRead(int notificationId);

  // Mark all as read
  Future<void> markAllAsRead();

  // Delete notification
  Future<void> deleteNotification(int notificationId);

  // Handle socket event (real-time update)
  void onNewNotification(NotificationItem notification);
}
```

### 2.4 — Flutter: Update Notification Tap Routing

**File to edit:** `apps/mobile/lib/main.dart` (lines 83-120)

Add new routes to `_handleNotificationTap`:
```dart
case '/support':
  navigatorKey.currentState?.pushNamed('/support', arguments: data);
  break;
case '/favorites':
  navigatorKey.currentState?.pushNamed('/favorites', arguments: data);
  break;
case '/home':
  navigatorKey.currentState?.pushNamed('/home', arguments: data);
  break;
case '/notifications':
  navigatorKey.currentState?.pushNamed('/notifications', arguments: data);
  break;
```

### 2.5 — Web: Notification Page

**New file:** `apps/web/src/app/notifications/page.tsx`

**Features (same as Flutter):**
- Server component that fetches notifications
- Unread indicator
- Click to navigate to relevant page
- Mark as read / mark all as read
- Infinite scroll or pagination
- Grouped by date

### 2.6 — Web: Notification Bell in Header

**File to edit:** `apps/web/src/components/layout/Header.tsx` (or similar)

**Add:** Bell icon with unread badge, links to `/notifications` page.

**Real-time updates:** Listen to socket event `notification:new` for live badge count.

### 2.7 — API Client Methods

**File to edit:** `packages/api-client/src/index.ts`

Add methods:
```typescript
getNotifications(page?: number, limit?: number): Promise<NotificationListResponse>
getUnreadNotificationCount(): Promise<{ count: number }>
markNotificationRead(id: number): Promise<void>
markAllNotificationsRead(): Promise<void>
deleteNotification(id: number): Promise<void>
```

### 2.8 — Types

**File to edit:** `packages/types/src/index.ts`

```typescript
export interface AppNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  imageUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
```

### Files Changed in Phase 2
| File | Action |
|------|--------|
| `apps/mobile/lib/features/notifications/notification_screen.dart` | **New** |
| `apps/mobile/lib/core/providers/notification_provider.dart` | **New** |
| `apps/mobile/lib/core/models/notification_item.dart` | **New** |
| `apps/mobile/lib/main.dart` | Add new routes to tap handler |
| `apps/mobile/lib/features/home/home_screen.dart` | Add bell icon + badge |
| `apps/web/src/app/notifications/page.tsx` | **New** |
| `apps/web/src/components/layout/Header.tsx` | Add bell icon + badge |
| `packages/api-client/src/index.ts` | Add notification methods |
| `packages/types/src/index.ts` | Add AppNotification type |

---

## Phase 3: Cron-Based Notifications

> **Goal:** Scheduled notifications for expiry warnings, reminders, and re-engagement.
> **Notifications: #2, #5, #6, #14, #15, #17, #18, #19, #24, #26, #27, #29**
> **Pattern:** New cron jobs in `apps/api/src/jobs/`, following existing patterns.

### 3.1 — Notification Cron Job

**New file:** `apps/api/src/jobs/notificationCron.ts`

**Schedule:** Runs every hour (`0 * * * *`)

**Register in:** `apps/api/src/index.ts` (alongside existing cron registrations, line ~54)

This single cron job runs all notification checks:

```typescript
export async function runNotificationChecks(): Promise<void> {
  await Promise.all([
    checkUnreadMessages(),        // #2
    checkExpiringAds(),           // #5
    checkExpiredAds(),            // #6
    checkExpiringVerifications(), // #14
    checkExpiredVerifications(),  // #15
    checkPromotionStarted(),     // #17
    checkExpiringPromotions(),   // #18
    checkExpiredPromotions(),    // #19
    checkAbandonedBookmarks(),   // #24
    checkInactiveUsers(),        // #26
    checkWeeklyBookmarks(),      // #27
    checkRemovedFavorites(),     // #29
  ]);
}
```

### 3.2 — Each Check Function

**#2 — Unread Messages Reminder**
```sql
-- Users with messages unread for 6+ hours, not already notified today
SELECT DISTINCT cm.recipient_id as user_id, COUNT(*) as unread_count
FROM messages m
JOIN conversation_participants cp ON ...
WHERE cp.last_read_at < m.created_at
  AND m.created_at < NOW() - INTERVAL '6 hours'
  AND NOT EXISTS (notification_log for this user/type in last 24h)
GROUP BY cm.recipient_id
```
→ Send: "You have {count} unread messages"

**#5 — Ad Expiring Soon (3 days)**
```sql
SELECT id, user_id, title FROM ads
WHERE status = 'approved'
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
  AND NOT EXISTS (notification_log for this ad/type)
```
→ Send: "Your ad '{title}' expires in 3 days — renew it?"

**#6 — Ad Expired**
```sql
-- Hook into existing adExpiry.ts job
-- After marking ads as expired, send notifications
```
→ Send: "Your ad '{title}' has expired. Repost it?"

**#14 — Verification Expiring (30 days)**
```sql
SELECT id, business_name FROM users
WHERE business_verification_status = 'approved'
  AND business_verification_expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND NOT EXISTS (notification_log for this user/type)
```
→ Send: "Your business verification expires in 30 days — renew now"

**#15 — Verification Expired**
→ Hook into existing `verificationCleanup.ts` job. After expiring, send notification.

**#17, #18, #19 — Promotion lifecycle**
→ Hook into existing `promotionCleanup.ts` job. Before cleanup, check and notify.

**#24 — Abandoned Bookmark (3+ days)**
```sql
SELECT uf.user_id, uf.ad_id, a.title
FROM user_favorites uf
JOIN ads a ON a.id = uf.ad_id
WHERE uf.created_at < NOW() - INTERVAL '3 days'
  AND a.status = 'approved'
  AND NOT EXISTS (notification_log for this user/ad in last 7 days)
  AND user not active in last 3 days
```
→ Send: "Still interested in '{title}'? It's still available!"

**#26 — Win-back Inactive User (7+ days)**
```sql
SELECT u.id, COUNT(a.id) as new_ads_count
FROM users u
CROSS JOIN LATERAL (
  SELECT id FROM ads
  WHERE status = 'approved' AND created_at > NOW() - INTERVAL '7 days'
  LIMIT 1
) a
WHERE u.last_login_at < NOW() - INTERVAL '7 days'
  AND NOT EXISTS (notification_log for this user/type in last 14 days)
```
→ Send: "We miss you! {count} new ads in your favorite categories"

**#27 — Weekly Bookmark Reminder**
```sql
-- Every Sunday, find users with active bookmarks
SELECT uf.user_id, COUNT(*) as count
FROM user_favorites uf
JOIN ads a ON a.id = uf.ad_id
WHERE a.status = 'approved'
GROUP BY uf.user_id
HAVING COUNT(*) > 0
```
→ Send: "{count} of your saved ads are still available"

**#29 — Favorite Ad Removed**
→ When ads are deleted/expired, check `user_favorites` and notify those users.
→ Hook into ad deletion and expiry flows.

### Rate Limiting Rules
| Type | Cooldown |
|------|----------|
| unread_messages_reminder | 24 hours per user |
| ad_expiring | Once per ad |
| verification_expiring | Once per 7 days per user |
| abandoned_bookmark | 7 days per user per ad |
| win_back | 14 days per user |
| weekly_bookmarks | 7 days per user |

### Files Changed in Phase 3
| File | Action |
|------|--------|
| `apps/api/src/jobs/notificationCron.ts` | **New** — all scheduled checks |
| `apps/api/src/index.ts` | Register new cron job |
| `apps/api/src/jobs/adExpiry.ts` | Hook notification after expiring ads |
| `apps/api/src/jobs/verificationCleanup.ts` | Hook notification after expiring verifications |
| `apps/api/src/jobs/promotionCleanup.ts` | Hook notification for promotion lifecycle |

---

## Phase 4: Location-Based Notifications

> **Goal:** Notify users about relevant ads near them.
> **Notifications: #20, #21, #22, #23**
> **Requires:** User location detection + location matching cron job.

### 4.1 — Database: `user_locations` Table

**File to edit:** `packages/database/prisma/schema.prisma`

```prisma
model user_locations {
  id           Int       @id @default(autoincrement())
  user_id      Int       @unique
  latitude     Float?                          // from GPS (most accurate)
  longitude    Float?                          // from GPS
  city         String?   @db.VarChar(100)      // from GPS, IP, or inference
  district     String?   @db.VarChar(100)
  source       String    @db.VarChar(20)       // 'gps', 'ip', 'inferred'
  updated_at   DateTime  @default(now())       @db.Timestamp(6)

  users        users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([city])
  @@index([district])
}
```

### 4.2 — Backend: IP Geolocation (MaxMind GeoLite2)

**New file:** `apps/api/src/services/geolocation.ts`

**Setup:**
1. Download MaxMind GeoLite2-City database (free, ~60MB)
2. Use `maxmind` npm package to query locally
3. No external API calls, no rate limits

```typescript
import maxmind from 'maxmind';

// Called on each API request (middleware) or on login
export async function resolveLocationFromIp(ip: string): Promise<{city, district, lat, lng} | null>

// Called from Flutter when GPS permission granted
export async function updateUserGpsLocation(userId: number, lat: number, lng: number): Promise<void>

// Infer location from user's favorite/viewed ads
export async function inferLocationFromBehavior(userId: number): Promise<string | null>
```

**Location cascade (used when no explicit location):**
1. GPS location stored? → use it
2. Resolve IP → get city
3. Infer from bookmarks/views → most common ad location

### 4.3 — Backend: Location Middleware

**New file:** `apps/api/src/middleware/locationTracker.ts`

Lightweight middleware that runs on authenticated requests:
```typescript
// On each authenticated request:
// 1. Check if user has location in user_locations
// 2. If not (or stale > 24 hours), resolve IP
// 3. Upsert user_locations (fire-and-forget, don't block request)
```

### 4.4 — Flutter: GPS Location Permission

**File to edit:** `apps/mobile/lib/core/services/notification_service.dart`

Add optional GPS location capture:
```dart
// On app launch (after auth):
// 1. Request location permission (one-time)
// 2. If granted, get coordinates
// 3. Send to backend: POST /api/users/location
```

**New dependency:** `geolocator` package in `pubspec.yaml`

**Android permission:** Add `ACCESS_COARSE_LOCATION` to `AndroidManifest.xml`
(Fine location not needed — city-level is enough)

### 4.5 — Backend: Location Update Endpoint

**Add to:** `apps/api/src/routes/notifications.routes.ts`

```typescript
// POST /api/users/location
// Body: { latitude: number, longitude: number }
// → Reverse geocode to get city/district
// → Upsert user_locations
```

### 4.6 — Location Notification Cron Job

**Add to:** `apps/api/src/jobs/notificationCron.ts`

**Schedule:** Every 2 hours

**#20 — Better Deal Nearby**
```sql
-- Find new ads (posted in last 2 hours) that are better deals
-- for users who viewed similar category + same city
SELECT ul.user_id, a.id as ad_id, a.title, a.price
FROM ads a
JOIN user_locations ul ON a.location matches ul.city
JOIN user_favorites uf ON uf.user_id = ul.user_id
JOIN ads fav_ad ON fav_ad.id = uf.ad_id
WHERE a.created_at > NOW() - INTERVAL '2 hours'
  AND a.category_id = fav_ad.category_id
  AND a.price < fav_ad.price
  AND a.status = 'approved'
```
→ Send: "'{title}' for Rs. {price} just posted near you — Rs. {savings} less!"

**#21 — New Ad in Your Area + Category**
```sql
-- New ads matching user's interest categories + location
SELECT ul.user_id, a.id, a.title
FROM ads a
JOIN user_locations ul ON location match
WHERE a.created_at > NOW() - INTERVAL '2 hours'
  AND a.category_id IN (user's interested categories from favorites)
  AND a.status = 'approved'
```
→ Send: "New '{title}' listed in {city} — check it out!"

**#22 — Trending in Your Area**
```sql
-- Categories with 10+ new ads in user's city in last 24 hours
SELECT ul.user_id, c.name as category, COUNT(*) as count
FROM ads a
JOIN categories c ON c.id = a.category_id
JOIN user_locations ul ON location match
WHERE a.created_at > NOW() - INTERVAL '24 hours'
GROUP BY ul.user_id, c.name
HAVING COUNT(*) >= 10
```
→ Send: "{category} is trending in {city} — {count} new ads today!"

**#23 — Nearby Verified Seller**
```sql
-- Verified sellers posting new ads in user's area
SELECT ul.user_id, u.business_name, COUNT(*) as count
FROM ads a
JOIN users u ON u.id = a.user_id
JOIN user_locations ul ON location match
WHERE u.business_verification_status = 'approved'
  AND a.created_at > NOW() - INTERVAL '24 hours'
```
→ Send: "{business_name} near you just posted {count} new deals"

### Rate Limiting for Location Notifications
| Type | Cooldown |
|------|----------|
| better_deal_nearby | 24 hours per user per category |
| new_ad_area | 12 hours per user |
| trending_area | 7 days per user per category |
| nearby_seller | 7 days per user per seller |

### Files Changed in Phase 4
| File | Action |
|------|--------|
| `packages/database/prisma/schema.prisma` | Add `user_locations` model |
| `apps/api/src/services/geolocation.ts` | **New** — MaxMind + GPS + inference |
| `apps/api/src/middleware/locationTracker.ts` | **New** — IP location on requests |
| `apps/api/src/routes/notifications.routes.ts` | Add location update endpoint |
| `apps/api/src/jobs/notificationCron.ts` | Add location-based checks |
| `apps/mobile/pubspec.yaml` | Add `geolocator` package |
| `apps/mobile/android/app/src/main/AndroidManifest.xml` | Add location permission |
| `apps/mobile/lib/core/services/notification_service.dart` | Add GPS capture |

---

## Phase 5: Tracking & Behavior

> **Goal:** Track user behavior (views, interactions) to enable smart notifications.
> **Notifications: #7, #9, #25, #28**
> **Requires:** New `ad_views` table and price history tracking.

### 5.1 — Database: `ad_views` Table

```prisma
model ad_views {
  id         Int       @id @default(autoincrement())
  user_id    Int?                              // null for anonymous views
  ad_id      Int
  ip_address String?   @db.VarChar(45)
  created_at DateTime  @default(now())        @db.Timestamp(6)

  users      users?    @relation(fields: [user_id], references: [id], onDelete: SetNull)
  ads        ads       @relation(fields: [ad_id], references: [id], onDelete: Cascade)

  @@index([ad_id, user_id])
  @@index([user_id, created_at(sort: Desc)])
  @@index([ad_id, created_at(sort: Desc)])
}
```

### 5.2 — Database: `ad_price_history` Table

```prisma
model ad_price_history {
  id         Int       @id @default(autoincrement())
  ad_id      Int
  old_price  Decimal   @db.Decimal(12, 2)
  new_price  Decimal   @db.Decimal(12, 2)
  changed_at DateTime  @default(now())        @db.Timestamp(6)

  ads        ads       @relation(fields: [ad_id], references: [id], onDelete: Cascade)

  @@index([ad_id])
}
```

### 5.3 — Track Ad Views

**File to edit:** `apps/api/src/routes/ads.routes.ts`

In the ad detail endpoint (`GET /api/ads/:id`), log the view:
```typescript
// Fire-and-forget — don't slow down the response
if (req.user?.userId) {
  prisma.ad_views.create({
    data: { ad_id: adId, user_id: req.user.userId, ip_address: req.ip }
  }).catch(() => {});
}
```

### 5.4 — Track Price Changes

**File to edit:** `apps/api/src/routes/ads.routes.ts`

In the ad update endpoint, when price changes:
```typescript
if (existingAd.price !== newPrice) {
  await prisma.ad_price_history.create({
    data: { ad_id: adId, old_price: existingAd.price, new_price: newPrice }
  });

  // #28 — Notify users who favorited this ad
  const favUsers = await prisma.user_favorites.findMany({
    where: { ad_id: adId },
    select: { user_id: true },
  });

  if (favUsers.length > 0 && newPrice < existingAd.price) {
    await sendNotification({
      recipientUserIds: favUsers.map(f => f.user_id),
      type: 'price_drop',
      title: 'Price Drop!',
      body: `${ad.title}: Rs. ${existingAd.price} → Rs. ${newPrice}`,
      data: { route: '/ad', adId: String(adId) },
    });
  }
}
```

### 5.5 — Ad Views Milestone (#7)

**Add to cron job:**
```sql
-- Check ads that crossed milestone since last check
SELECT a.id, a.user_id, a.title, a.view_count
FROM ads a
WHERE a.view_count IN (50, 100, 500, 1000)
  AND NOT EXISTS (notification_log for this ad + milestone)
```
→ Send: "Your ad '{title}' just hit {count} views!"

### 5.6 — Viewed But Didn't Act (#25)

**Add to cron job:**
```sql
SELECT av.user_id, av.ad_id, a.title, COUNT(*) as view_count
FROM ad_views av
JOIN ads a ON a.id = av.ad_id
WHERE av.created_at > NOW() - INTERVAL '7 days'
  AND a.status = 'approved'
  AND NOT EXISTS (user_favorites for this user+ad)
  AND NOT EXISTS (contact_messages from this user for this ad)
  AND NOT EXISTS (notification_log for this user/ad/type in 7 days)
GROUP BY av.user_id, av.ad_id, a.title
HAVING COUNT(*) >= 3
```
→ Send: "'{title}' you viewed is still available"

### 5.7 — Seller Replied to Inquiry (#9)

**File to edit:** `apps/api/src/routes/contact.routes.ts`

When seller creates a reply (is_reply = true):
```typescript
await sendNotification({
  recipientUserIds: [originalMessage.buyer_id],
  type: 'inquiry_reply',
  title: 'Seller Replied!',
  body: `${sellerName} replied about "${adTitle}"`,
  data: { route: '/ad', adId: String(adId) },
});
```

### Files Changed in Phase 5
| File | Action |
|------|--------|
| `packages/database/prisma/schema.prisma` | Add `ad_views`, `ad_price_history` models |
| `apps/api/src/routes/ads.routes.ts` | Track views + price changes + notifications |
| `apps/api/src/routes/contact.routes.ts` | Seller reply notification |
| `apps/api/src/jobs/notificationCron.ts` | Add milestone + viewed-but-didn't-act checks |

---

## Phase 6: Admin & Announcements

> **Goal:** Admin panel to send manual notifications — festivals, promotions, announcements.
> **Notifications: #30-38**
> **Requires:** Admin broadcast endpoint + scheduling system.

### 6.1 — Database: `scheduled_notifications` Table

For festivals and scheduled campaigns:

```prisma
model scheduled_notifications {
  id              Int       @id @default(autoincrement())
  title           String    @db.VarChar(255)
  body            String
  type            String    @db.VarChar(50)    // 'festival', 'announcement', 'promotion', etc.
  data            Json?                        // { route, image, etc. }
  image_url       String?   @db.VarChar(500)
  target_audience String    @db.VarChar(50)    // 'all', 'active_users', 'sellers', 'buyers', 'verified'
  scheduled_for   DateTime                     // when to send
  status          String    @db.VarChar(20)    @default("pending") // 'pending', 'sent', 'cancelled'
  sent_at         DateTime?
  sent_count      Int?                         // how many users received it
  created_by      Int                          // admin user ID
  created_at      DateTime  @default(now())    @db.Timestamp(6)

  users           users     @relation(fields: [created_by], references: [id])

  @@index([status, scheduled_for])
  @@index([type])
}
```

### 6.2 — Admin API: Broadcast Notifications

**New file:** `apps/api/src/routes/editor/broadcast.routes.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/editor/notifications/broadcast` | Send notification to all users immediately |
| POST | `/api/editor/notifications/schedule` | Schedule notification for future date |
| GET | `/api/editor/notifications/scheduled` | List scheduled notifications |
| PUT | `/api/editor/notifications/scheduled/:id` | Edit scheduled notification |
| DELETE | `/api/editor/notifications/scheduled/:id` | Cancel scheduled notification |

**Broadcast request body:**
```json
{
  "title": "Happy Dashain!",
  "body": "Wishing you a joyful Dashain from Thulo Bazaar! Check out festive deals 🎉",
  "type": "festival",
  "targetAudience": "all",
  "data": { "route": "/home" },
  "imageUrl": "https://...",
  "scheduledFor": null
}
```

**Target audience options:**
| Value | Recipients |
|-------|-----------|
| `all` | All users with FCM tokens |
| `active_users` | Users who logged in within 30 days |
| `sellers` | Users who have posted at least 1 ad |
| `buyers` | Users who have favorited or inquired on ads |
| `verified` | Business or individually verified users |
| `location:{city}` | Users in a specific city (requires Phase 4) |

### 6.3 — Scheduled Notification Cron Job

**Add to:** `apps/api/src/jobs/notificationCron.ts`

```typescript
// Runs every minute
async function processScheduledNotifications() {
  const pending = await prisma.scheduled_notifications.findMany({
    where: {
      status: 'pending',
      scheduled_for: { lte: new Date() },
    },
  });

  for (const notification of pending) {
    const recipients = await getRecipientsByAudience(notification.target_audience);
    await sendNotification({
      recipientUserIds: recipients,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });
    await prisma.scheduled_notifications.update({
      where: { id: notification.id },
      data: { status: 'sent', sent_at: new Date(), sent_count: recipients.length },
    });
  }
}
```

### 6.4 — Pre-configured Festival Dates (Nepal)

Set up these as default scheduled notifications each year:

| Festival | Typical Month | Message |
|----------|--------------|---------|
| Dashain | October | "Happy Dashain! Find the best festive deals on Thulo Bazaar 🎉" |
| Tihar | October/November | "Happy Tihar! Light up your shopping with amazing deals ✨" |
| Holi | March | "Happy Holi! Colorful deals await you 🎨" |
| Bisket Jatra | April | "Happy New Year! Start the year with great finds 🎊" |
| Buddha Jayanti | May | "Happy Buddha Jayanti from Thulo Bazaar 🙏" |
| Teej | August/September | "Happy Teej! Special deals for you 💚" |
| Christmas | December 25 | "Merry Christmas! Season's greetings from Thulo Bazaar 🎄" |
| New Year | January 1 | "Happy New Year 2027! New year, new deals 🎆" |

**Admin can add/edit/delete festivals from the admin panel.**

### 6.5 — Support Ticket Notifications (#30, #31)

**File to edit:** `apps/api/src/routes/support.routes.ts`

**#30 — When admin replies to ticket** (POST `/api/support/tickets/:id/messages`):
```typescript
// If sender is admin/editor and ticket owner is different:
if (senderId !== ticket.user_id) {
  await sendNotification({
    recipientUserIds: [ticket.user_id],
    type: 'support_reply',
    title: 'Support Response',
    body: `New reply on ticket #${ticket.ticket_number}: ${ticket.subject}`,
    data: { route: '/support', ticketId: String(ticketId) },
  });
}
```

**#31 — When ticket is resolved:**
```typescript
await sendNotification({
  recipientUserIds: [ticket.user_id],
  type: 'ticket_resolved',
  title: 'Ticket Resolved',
  body: `Your ticket #${ticket.ticket_number} has been resolved`,
  data: { route: '/support', ticketId: String(ticketId) },
});
```

### 6.6 — Welcome Notification (#34)

**File to edit:** `apps/api/src/routes/auth.routes.ts`

After user registration:
```typescript
await sendNotification({
  recipientUserIds: [newUser.id],
  type: 'welcome',
  title: 'Welcome to Thulo Bazaar!',
  body: 'Start exploring deals or post your first ad',
  data: { route: '/home' },
  sendPush: false,  // Only save to notification center (they just registered, may not have FCM token yet)
});
```

### 6.7 — App Update / System Maintenance (#32, #33)

These are admin-triggered broadcasts using the broadcast endpoint (6.2).

### 6.8 — Flutter: Support Ticket Route

**File to edit:** `apps/mobile/lib/main.dart`

Add to `_handleNotificationTap`:
```dart
case '/support':
  final ticketId = data?['ticketId'];
  navigatorKey.currentState?.pushNamed('/support/ticket', arguments: {'ticketId': ticketId});
  break;
```

### 6.9 — Web: Admin Notification Panel

**New file:** `apps/web/src/app/editor/notifications/page.tsx`

Admin page to:
- Compose and send broadcast notifications
- Schedule future notifications (festivals, campaigns)
- View sent notification history with delivery stats
- Manage pre-configured festival dates

### Files Changed in Phase 6
| File | Action |
|------|--------|
| `packages/database/prisma/schema.prisma` | Add `scheduled_notifications` model |
| `apps/api/src/routes/editor/broadcast.routes.ts` | **New** — admin broadcast/schedule API |
| `apps/api/src/routes/support.routes.ts` | Add notification on reply/resolve |
| `apps/api/src/routes/auth.routes.ts` | Add welcome notification |
| `apps/api/src/jobs/notificationCron.ts` | Add scheduled notification processor |
| `apps/api/src/app.ts` | Mount broadcast routes |
| `apps/mobile/lib/main.dart` | Add support route |
| `apps/web/src/app/editor/notifications/page.tsx` | **New** — admin notification panel |

---

## Database Migrations Summary

All new tables across all phases:

| Table | Phase | Purpose |
|-------|-------|---------|
| `notifications` | Phase 0 | Store all notifications for notification center |
| `notification_log` | Phase 0 | Rate limiting — prevent spam |
| `user_locations` | Phase 4 | User location (GPS, IP, inferred) |
| `ad_views` | Phase 5 | Track which ads users view |
| `ad_price_history` | Phase 5 | Track price changes for drop alerts |
| `scheduled_notifications` | Phase 6 | Admin-scheduled broadcasts & festivals |

**Recommended:** Create one migration per phase to keep things clean.

---

## Flutter Changes Summary

### New Files
| File | Phase | Description |
|------|-------|-------------|
| `lib/features/notifications/notification_screen.dart` | Phase 2 | Notification list screen |
| `lib/core/providers/notification_provider.dart` | Phase 2 | State management for notifications |
| `lib/core/models/notification_item.dart` | Phase 2 | Notification data model |

### Modified Files
| File | Phase | Change |
|------|-------|--------|
| `lib/main.dart` | Phase 2 | Add new routes to tap handler |
| `lib/features/home/home_screen.dart` | Phase 2 | Add bell icon with unread badge |
| `lib/core/services/notification_service.dart` | Phase 4 | Add GPS location capture |
| `pubspec.yaml` | Phase 4 | Add `geolocator` package |
| `android/app/src/main/AndroidManifest.xml` | Phase 4 | Add location permission |

---

## Web Changes Summary

### New Files
| File | Phase | Description |
|------|-------|-------------|
| `src/app/notifications/page.tsx` | Phase 2 | User notification page |
| `src/app/editor/notifications/page.tsx` | Phase 6 | Admin broadcast panel |

### Modified Files
| File | Phase | Change |
|------|-------|--------|
| `src/components/layout/Header.tsx` | Phase 2 | Add bell icon with badge |

---

## Implementation Order

```
Phase 0: Foundation (REQUIRED FIRST)
  ├── notifications table
  ├── notification_log table
  ├── generic sendNotification() service
  ├── notification API endpoints
  └── socket event for real-time badge
          │
          ▼
Phase 1: Quick Wins ──────────────── Phase 2: Notification Center
  ├── Ad approved/rejected              ├── Flutter notification screen
  ├── Verification approved/rejected    ├── Flutter bell icon + badge
  ├── New inquiry                       ├── Web notification page
  └── Payment confirmed                 ├── Web bell icon + badge
                                        └── API client methods
          │                                       │
          ▼                                       ▼
Phase 3: Cron Jobs ──────────────── Phase 4: Location
  ├── Expiry warnings                   ├── user_locations table
  ├── Re-engagement                     ├── MaxMind IP geolocation
  ├── Bookmark reminders                ├── GPS from Flutter
  └── Promotion lifecycle               └── Location-based cron
          │                                       │
          ▼                                       ▼
Phase 5: Tracking ──────────────── Phase 6: Admin & Announcements
  ├── ad_views table                    ├── scheduled_notifications table
  ├── Price drop alerts                 ├── Admin broadcast API
  ├── View milestones                   ├── Festival scheduling
  └── Seller reply                      ├── Support ticket notifications
                                        └── Welcome notification
```

**Phase 0 is a prerequisite for everything. Phases 1-2 can run in parallel. Phases 3-6 can be done in any order.**

# Push Notifications — Thulo Bazaar (iOS + Android)

Complete reference for how push notifications work, how iOS was fixed, and how
notification taps deep-link into the app (e.g. tap a chat push → open that
conversation).

**Status:** ✅ Working on both Android and iOS (verified June 2026).

---

## 1. How it works (the full chain)

```
Backend (FCM Admin SDK)
   │  notification {title, body} + data {type, route, ...ids}
   ▼
Firebase Cloud Messaging (FCM)
   │
   ├── Android ──────────────► device (FCM talks to Google directly)
   │
   └── iOS ──► APNs (Apple) ──► device   ← iOS REQUIRES an APNs auth key in FCM
```

- **Android** never touches APNs, so it "just works" once `google-services.json`
  is bundled (Gradle does this automatically).
- **iOS** must go FCM → **APNs** → device. This needs three things to all be
  correct (see §3). Missing any one = silent failure on iOS only.

### Token storage
- Each device registers an FCM token via `POST /api/users/fcm-token`
  (`{ fcmToken, platform }`). Stored in the `fcm_tokens` table
  (`user_id, token, platform`).
- On logout the app calls `DELETE /api/users/fcm-token`.
- Backend send functions early-return if a user has **0 tokens** — so if a
  device never registered, it silently gets nothing.

### Two backend send paths
| Path | File | Used for | Pushes to |
|------|------|----------|-----------|
| Generic | `apps/api/src/services/notification.service.ts` (`sendPushToUser`) | ad approved/rejected, verification, payment, promotions, host notifications | **all** the user's tokens, always |
| Chat | `apps/api/src/services/pushNotification.ts` (`sendMessagePushNotification`) | new chat messages | **only OFFLINE recipients** |

> ⚠️ **Chat pushes only fire when the recipient is OFFLINE** (app fully closed /
> socket disconnected) — by design, so users aren't buzzed while already viewing
> the chat. See `messageHandlers.ts` (`offlineRecipientIds` filter).
> **To test message push: fully close the app on the receiving device.**

### Firebase Admin credentials (backend)
- The API reads the **monorepo ROOT `.env`** (via
  `apps/api/src/config/index.ts` → `dotenv.config({ path: '../../../../.env' })`).
  `apps/api/.env` is **not** read.
- Root `.env` has `FIREBASE_SERVICE_ACCOUNT_JSON` (inline JSON, project
  `thulobazaar-488907`). Production EC2 also has it + a
  `/opt/thulobazaar/firebase-service-account.json` file.

### In-app Notifications screen ≠ push
The in-app Notifications list is populated from the **database/socket**, totally
independent of push. It fills up even when push is broken — so "I see it in the
list but got no banner" is normal and does **not** mean push works.

---

## 2. iOS setup — what must be in place (checklist)

All of these are currently done. Use this list when setting up a new
environment, a new Apple account, or debugging a regression.

- [ ] **APNs capability** in entitlements
  - `ios/Runner/Debug.entitlements` → `aps-environment = development`
  - `ios/Runner/Release.entitlements` → `aps-environment = production`
- [ ] **`GoogleService-Info.plist` bundled in the app** — must be referenced in
  `ios/Runner.xcodeproj/project.pbxproj` (PBXFileReference + Runner group +
  Resources build phase). If added via Xcode: drag into the Runner group, check
  "Copy items if needed" **and** the Runner target.
  - Verify: `grep -c "GoogleService-Info.plist" ios/Runner.xcodeproj/project.pbxproj`
    should be ≥ 3 (we have 4).
- [ ] **`AppDelegate.swift` forwards the APNs token to Firebase** (see §4 — required
  under the new UIScene / `FlutterImplicitEngineDelegate` lifecycle, otherwise
  the FCM token is never generated).
- [ ] **`UIBackgroundModes`** in `ios/Runner/Info.plist` includes
  `remote-notification`.
- [ ] **APNs Authentication Key (.p8)** created at Apple Developer → Keys, scope
  **Sandbox & Production**.
  - Current key: ID `6B9HT5YZ82`, Team `6AFL485WA2`,
    file `apps/mobile/AuthKey_6B9HT5YZ82.p8` (gitignored, **cannot be
    re-downloaded** — keep a backup).
- [ ] **The .p8 uploaded to Firebase in BOTH slots** — Firebase Console → Project
  Settings → Cloud Messaging → Apple app config → APNs Authentication Key:
  fill **Development** AND **Production** rows with the same file + Key ID +
  Team ID. (TestFlight/App Store builds use the *production* slot; an empty
  production slot → `third-party-auth-error`.)
- [ ] **Bundle ID consistent** everywhere: `com.thulobazaar.mobile`
  (GoogleService-Info.plist `BUNDLE_ID`, Xcode `PRODUCT_BUNDLE_IDENTIFIER`, IPA).

---

## 3. The three iOS bugs we hit (history / how to recognize them)

iOS needed **all three** fixed; Android needed none.

1. **`GoogleService-Info.plist` not bundled** → `Firebase.initializeApp()` threw →
   notification init skipped → no permission prompt → app absent from
   iOS Settings → Notifications → no token.
   *Symptom:* no permission popup ever; app not in Settings → Notifications.

2. **AppDelegate had no APNs handling** (relied on Firebase swizzling, which
   fails under the new UIScene lifecycle) → APNs token never captured →
   `getToken()` null → nothing registered.
   *Symptom:* permission granted, app in Settings, but **0 ios rows** in
   `fcm_tokens` and no `POST /users/fcm-token` in API logs.

3. **APNs key missing from Firebase's Production slot** → every send returned
   `messaging/third-party-auth-error`.
   *Symptom:* token exists, but direct FCM send fails with
   `third-party-auth-error` ("Auth error from APNS").

---

## 4. iOS AppDelegate (required code)

`ios/Runner/AppDelegate.swift` — explicitly hands the APNs token to Firebase
Messaging (do **not** rely on swizzling under the UIScene lifecycle):

```swift
import Flutter
import UIKit
import FirebaseCore
import FirebaseMessaging

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if FirebaseApp.app() == nil { FirebaseApp.configure() }
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
```

(`Podfile` has `use_frameworks!`, so the Swift `import FirebaseMessaging` compiles.)

---

## 5. Notification tap → deep link (open the right screen)

When the user taps a push, the app should open the relevant screen — e.g. a chat
push opens **that conversation**, an ad push opens **that ad**.

### How it works in the app (already implemented)
- `lib/core/services/notification_service.dart` listens for:
  - `FirebaseMessaging.onMessageOpenedApp` — tapped while app was in background
  - `getInitialMessage()` — tapped while app was terminated (cold start)
  - local-notification taps (foreground)
- The handler reads `data['route']` and the relevant id, then
  `lib/main.dart` → `_handleNotificationTap(route, data)` pushes the screen.
  This is the **actual** implementation:

```dart
// lib/main.dart  (_handleNotificationTap)
void _handleNotificationTap(String? route, Map<String, dynamic>? data) {
  if (route == null) return;

  // Navigator not ready yet (cold start) — store and replay once it's up.
  if (navigatorKey.currentState == null) {
    _pendingNotification = {'route': route, ...?data};
    return;
  }

  // FCM data values are always strings — parse IDs defensively.
  final conversationId = int.tryParse('${data?['conversationId'] ?? ''}');
  final adId = int.tryParse('${data?['adId'] ?? ''}');
  final navigator = navigatorKey.currentState!;

  switch (route) {
    case '/chat':
      if (conversationId != null) {
        navigator.push(MaterialPageRoute(
          builder: (_) => ChatScreen(
            conversationId: conversationId,
            recipientName: data?['senderName'] as String? ?? 'Chat',
            adId: adId,
          ),
        ));
      }
      break;
    case '/ad':
      if (adId != null) {
        navigator.push(MaterialPageRoute(builder: (_) => AdDetailScreen(adId: adId)));
      }
      break;
    case '/verification':
      navigator.push(MaterialPageRoute(builder: (_) => const VerificationScreen()));
      break;
    case '/notifications':
      navigator.push(MaterialPageRoute(builder: (_) => const NotificationScreen()));
      break;
  }
}
```

> **Cold-start handling (important):** if a tap launches the app from a
> terminated state, the splash screen runs first and ends with
> `pushReplacement(MainNavScreen)`. If we push `ChatScreen` *during* the splash,
> that pushReplacement **clobbers it** and the user lands on the main nav / list
> — this was the "tap chat push → opens the conversation list, not the chat" bug.
>
> The fix is a global gate `appReadyForDeepLinks` (in `main.dart`):
> - `_handleNotificationTap` stashes the tap in `_pendingNotification` until the
>   gate is open (and the navigator exists).
> - `SplashScreen` sets `appReadyForDeepLinks = true` **after** its
>   `pushReplacement(MainNav)` completes, then calls `processPendingNotification()`
>   to replay the stashed tap — so `ChatScreen` is pushed on top of MainNav and
>   survives.
>
> This affects iOS **and** Android (pure Dart). The other two states (app in
> background, app in foreground) already navigate immediately since the gate is
> open by then.

### The contract: the backend MUST send `route` + ids in `data`
Deep-linking only works if the push **`data`** payload carries a `route` plus the
ids that screen needs. FCM `data` values must be **strings**.

| Tap should open | `route` | Required `data` keys | App `case` |
|-----------------|---------|----------------------|-----------|
| A conversation | `/chat` | `conversationId`, `senderName` (`adId` optional) | ✅ handled |
| An ad detail | `/ad` | `adId` | ✅ handled |
| Verification screen | `/verification` | — | ✅ handled |
| Notifications list | `/notifications` | — | ✅ handled |

> Any other `route` value (e.g. `/promotion`, `/post-ad`) is currently **not**
> handled in `_handleNotificationTap` and falls through to no navigation — add a
> `case` for it if you want those to deep-link (see "Adding a new destination").

### How the backend sets `route` (already wired up)
The generic `sendNotification(...)` in
`apps/api/src/services/notification.service.ts` passes whatever you put in
`data` straight into the FCM push (`data: { type, ...data }`). So each caller
includes a `route` + ids. Current senders:

| Trigger | File | `data` sent |
|---------|------|-------------|
| New chat message | `services/pushNotification.ts` | `{ route:'/chat', conversationId, senderName }` |
| Ad approved / rejected | `routes/editor/ads.routes.ts` | `{ route:'/ad', adId }` |
| Ad-related (other) | `routes/ads.routes.ts` | `{ route:'/ad', adId }` |
| Business/individual verification | `routes/editor/verifications.routes.ts` | `{ route:'/verification', verificationType }` |
| Payment (promotion/verification) | `services/payment.service.ts` | `{ route:'/promotion' \| '/verification' }` |
| Post-ad reminders | `services/auth.service.ts` | `{ route:'/post-ad' }` |

> ⚠️ **Mind the route coverage gap.** The backend already sends `/promotion` and
> `/post-ad`, but the app's `_handleNotificationTap` only has cases for `/chat`,
> `/ad`, `/verification`, `/notifications`. Pushes with `/promotion` or
> `/post-ad` will deliver and show, but tapping them won't navigate until you add
> those cases (see below).

**Rule for any new push that should deep-link:** include `route` (+ the ids that
screen needs) in `data`. FCM `data` values **must be strings** (`String(id)`).

```ts
sendNotification({
  recipientUserIds: [ownerId],
  type: 'ad_approved',
  title: 'Your ad was approved 🎉',
  body: `"${adTitle}" is now live`,
  data: { route: '/ad', adId: String(adId) },  // strings only
  referenceId: adId,
});
```

### Adding a NEW destination
1. **App:** add a `case '/your_route':` in `_handleNotificationTap`
   (`lib/main.dart`) that reads its ids from `data` and pushes the screen.
2. **Backend:** send `data: { route: '/your_route', someId: String(id) }`.
3. Keep ids as strings; parse with `int.tryParse('${data?['someId'] ?? ''}')`.

### Foreground behavior
While the app is open, iOS suppresses the system banner by default. The app
shows a local notification instead (and suppresses it for the conversation the
user is currently viewing — see `setActiveConversation` in
`notification_service.dart`). Tap handling is the same.

---

## 6. Build & release (iOS)

```bash
cd apps/mobile

# pod install (CocoaPods needs UTF-8 or it crashes)
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
cd ios && pod install && cd ..

# bump build number in pubspec.yaml (version: 1.0.x+N) each upload

# build a signed App Store IPA (automatic Xcode signing, team 6AFL485WA2)
flutter build ipa --release --export-method app-store
# → apps/mobile/build/ios/ipa/mobile.ipa  → upload via Transporter
```

Verify the IPA before uploading:
```bash
cd /tmp && rm -rf ipachk && mkdir ipachk && cd ipachk
unzip -q /Users/elw/Documents/Web/thulobazaar/monorepo/apps/mobile/build/ios/ipa/mobile.ipa
APP=$(find Payload -maxdepth 1 -name "*.app")
[ -f "$APP/GoogleService-Info.plist" ] && echo "plist bundled ✓"
codesign -d --entitlements :- "$APP" 2>/dev/null | grep -o 'aps-environment</key><string>[a-z]*'  # expect production
```

---

## 7. Troubleshooting / diagnostics

**Check registered tokens (prod):**
```bash
ssh -i thulobazaar-key.pem ubuntu@52.66.73.213 \
  'cd /opt/thulobazaar && docker compose -f docker-compose.prod.yml exec -T postgres \
   psql -U thulobazaar -d thulobazaar -c "SELECT platform,count(*) FROM fcm_tokens GROUP BY platform;"'
```

**Send a direct test push to the newest iOS token (server-side, no rebuild):**
```bash
ssh -i thulobazaar-key.pem ubuntu@52.66.73.213 \
 'cd /opt/thulobazaar && TOKEN=$(docker compose -f docker-compose.prod.yml exec -T postgres \
   psql -U thulobazaar -d thulobazaar -t -A -c "SELECT token FROM fcm_tokens WHERE platform='"'"'ios'"'"' ORDER BY updated_at DESC LIMIT 1;" | tr -d "[:space:]") && \
  docker compose -f docker-compose.prod.yml exec -T -e TBTOKEN="$TOKEN" api node -e "
   const admin=require(\"firebase-admin\"),fs=require(\"fs\");
   admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS,\"utf8\")))});
   admin.messaging().send({token:process.env.TBTOKEN,notification:{title:\"Test\",body:\"hi\"},apns:{payload:{aps:{sound:\"default\",alert:{title:\"Test\",body:\"hi\"}}}}})
     .then(id=>console.log(\"SENT OK\",id)).catch(e=>console.log(\"FAIL\",e.code));
  "'
```

**Error → meaning:**
| Error / symptom | Meaning | Fix |
|-----------------|---------|-----|
| `messaging/third-party-auth-error` | FCM can't auth to APNs | Upload .p8 to **both** Firebase slots; check Key ID/Team ID; wait a few min to propagate |
| `registration-token-not-registered` | token stale/uninstalled | normal; backend auto-cleans stale tokens |
| 0 ios rows in `fcm_tokens` | device never got a token | check plist bundled + AppDelegate APNs code (§4) |
| Permission prompt never appears | Firebase init failing on iOS | check `GoogleService-Info.plist` is bundled |
| Banner only when app closed | working as designed (foreground suppresses) | not a bug |
| Chat push never arrives but app open | only offline users get message push | test with app fully closed |

**Notes**
- `flutter run` debug-to-device often fails to attach on iOS 26 + UIScene
  ("Dart VM Service not discovered"); release/TestFlight silences `debugPrint`.
  Diagnose via server-side `fcm_tokens` + FCM send errors, not device logs.
- A newly uploaded APNs key can take a few minutes to propagate in FCM.

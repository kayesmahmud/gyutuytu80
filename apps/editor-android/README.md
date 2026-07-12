# Thulobazaar Editor — Android app

A thin native Android WebView shell around the **editor panel** of the live
Thulo Bazaar site (`https://thulobazaar.com.np/en/editor`). Editors install it
directly (no Play Store) to approve/reject ads, handle verifications, and answer
support chat from a phone — with native push notifications.

It is **not** a rewrite: it loads the real, mobile-responsive editor website in a
`WebView`, keeps the login session (cookies), and adds native FCM push.

## What it does

- Loads `/en/editor/dashboard` (redirects to login if the session expired).
- Persists cookies → the NextAuth editor session survives app restarts.
- Registers the device's FCM token under the logged-in editor (via the existing
  `POST /api/users/fcm-token`), by injecting the token into the page where
  `NativeFcmBridge` picks it up.
- Receives pushes on channel `thulobazaar_notifications` for: new pending ad,
  business/individual verification requests, and support messages.
- Tapping a notification deep-links to the relevant editor page.

## One-time setup (required before it can build)

The Firebase Messaging plugin needs a `google-services.json` for this app's
package id, `com.thulobazaar.editor`:

1. Open the Firebase console → project **`thulobazaar-488907`** (the same project
   the backend already uses to send pushes).
2. **Add app → Android**, package name `com.thulobazaar.editor`.
3. Download the generated `google-services.json` into:
   `apps/editor-android/app/google-services.json`

No backend/service-account change is needed — pushes are sent with the existing
service account; this only registers a new *client* app in the same project.

## Build

Requires JDK 17 and the Android SDK (`ANDROID_HOME`). The Gradle wrapper jar is
not committed — generate it once (or just open the folder in Android Studio,
which does everything below automatically):

```bash
cd apps/editor-android
gradle wrapper --gradle-version 8.7   # if you have a system Gradle; otherwise use Android Studio

# Debug build (installable, no signing needed):
./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk

# Release build (signed — see below):
./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

### Signing a release APK

Generate a keystore once and pass it via env vars (read by `app/build.gradle`):

```bash
keytool -genkey -v -keystore editor-release.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias editor

export EDITOR_KEYSTORE=$(pwd)/editor-release.jks
export EDITOR_KEYSTORE_PASSWORD=****
export EDITOR_KEY_ALIAS=editor
export EDITOR_KEY_PASSWORD=****

./gradlew assembleRelease
```

## Install on an editor's phone

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

Or send the `.apk` file to the editor; they enable “install unknown apps” for
their file manager, tap it, then grant the notification permission on first launch.

## Files

- `MainActivity.kt` — the WebView shell, cookie persistence, JS bridge, deep links.
- `MyFirebaseMessagingService.kt` — receives pushes, builds notifications.
- `TokenStore.kt` — caches the FCM token and re-injects it into the page.
- `App.kt` — creates the `thulobazaar_notifications` channel.

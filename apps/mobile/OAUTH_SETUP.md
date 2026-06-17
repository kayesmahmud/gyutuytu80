# OAuth (Google + Apple) — Maintenance Guide

How Sign in with Google and Sign in with Apple are wired across **iOS, Android,
and Web**, and what to do when something breaks. One Firebase/Google Cloud
project backs everything: **`thulobazaar-488907`** (project number `665688327385`).

---

## 1. The mental model

Each platform authenticates with a **different OAuth client**, but the backend
verifies **every** Google token against the **Web client ID** (the audience).

```
                         Google Cloud project 665688327385
                         ┌───────────────────────────────────────────┐
 iOS app  ──────────────►│ iOS client       …lbpla4ui  (bundle id)   │
 Android app ───────────►│ Android client   …jkf0kslno (pkg + SHA-1) │
 Web (NextAuth) ────────►│ Web client       …bc35e5a0  (+ secret)    │◄─┐
 Mobile serverClientId ─►│ Web client       …bc35e5a0                │  │ audience
                         └───────────────────────────────────────────┘  │
 API verifies ID token audience == GOOGLE_CLIENT_ID (= Web client …bc35e5a0) ┘
```

### The Google OAuth client IDs (all in project 665688327385)
| Client | ID prefix | Bound to | Used by |
|--------|-----------|----------|---------|
| **Web / server** | `…bc35e5a0jfis22p5d20k089l9ivm3fge` | client secret | Web NextAuth + mobile `serverClientId` + **API token audience** |
| **iOS** | `…lbpla4ui0ghmpq2k10mmmhj1s7cvgjfd` | bundle id `com.thulobazaar.mobile` | iOS app (GoogleService-Info.plist) |
| **Android** | `…jkf0kslno15q34h9toh9u08443qnb84h` | package + **SHA-1 fingerprint** | Android app (google-services.json) |

> **Golden rule:** `GOOGLE_CLIENT_ID` env var on the API **must be the Web client**
> (`…bc35e5a0…`). Mobile sends its ID token with the Web client as audience (via
> `serverClientId`), and the web app uses it directly. If the API's
> `GOOGLE_CLIENT_ID` is ever set to the iOS or Android client, mobile **or** web
> Google login breaks.

### Apple (much simpler — no fingerprints, iOS only)
- Button shown only on iOS. Token audience = the **app bundle id**.
- API verifies with `APPLE_CLIENT_ID` env (= `com.thulobazaar.mobile`).
- Backed by the APNs/Sign-in key in the Apple Developer portal.

---

## 2. Where each piece lives

| Platform | Config file / setting | Key fields |
|----------|----------------------|-----------|
| iOS | `ios/Runner/GoogleService-Info.plist` | `CLIENT_ID`, `REVERSED_CLIENT_ID` (also a URL scheme in Info.plist) |
| iOS | `ios/Runner/Info.plist` → CFBundleURLTypes | `REVERSED_CLIENT_ID` url scheme (for the Google callback) |
| Android | `android/app/google-services.json` | `oauth_client` entries (Android type=1 needs SHA-1, Web type=3) |
| Mobile code | `lib/features/auth/signin_screen.dart` + `signup_screen.dart` | `clientId` (iOS) + `serverClientId` (Web client, both platforms) |
| Web | env `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; `lib/auth/authOptions.ts` | NextAuth GoogleProvider |
| API | env `GOOGLE_CLIENT_ID` (Web client), `APPLE_CLIENT_ID` (bundle id) | `auth.service.ts` `verifyIdToken({ audience })` |

---

## 3. Android signing fingerprints — the thing that breaks

Google Sign-In on Android validates the app's **signing certificate SHA-1**. The
fingerprint must be registered on the **Android OAuth client** in Firebase. There
are up to **three** different certs depending on how the app is built/installed:

| Build / install path | Signed with | SHA-1 | Status |
|----------------------|-------------|-------|--------|
| **Play Store** install (AAB) | **Google Play App Signing key** (Google holds it) | `03249514ad7a9e9a1bdd56a0ba6cfdda2941b5f7` | ✅ **registered — Play login works** |
| Release **APK** (sideload) | upload keystore `thulobazaar-upload.jks` | `6f42851b9a8d384adccedc51b67986d463e78099` | ⚠️ register for sideload to work |
| `flutter run` (debug) | debug keystore (`~/.android/debug.keystore`) | its own (run `gradlew signingReport`) | register if you debug Google login |

> **Confirmed 2026-06-01:** Google login works on the **live Play Store** app, so
> the registered `03249514…` is the **Play app-signing** SHA-1 (NOT debug).
> Play Store path is complete. The only gap is the sideload APK (`6f42…`).
> The Play app-signing SHA-1 can also be confirmed at **Play Console → App signing**.

> Get the upload-key SHA-1 anytime:
> ```bash
> APKSIGNER=$(ls "$HOME/Library/Android/sdk/build-tools/"*/apksigner | tail -1)
> "$APKSIGNER" verify --print-certs apps/mobile/build/app/outputs/flutter-apk/app-release.apk | grep -i SHA-1
> ```

### Add a fingerprint (Firebase Console)
1. https://console.firebase.google.com → project **thulobazaar-488907**
2. ⚙️ **Project settings → General → Your apps →** the **Android** app
3. **Add fingerprint** → paste SHA-1 (and SHA-256) → **Save**
4. **Download the updated `google-services.json`** → replace
   `apps/mobile/android/app/google-services.json`
5. Rebuild the APK/AAB so it bundles the new config.

### Play Store specifically — ALREADY WORKING
Uploading the AAB to Play means **Google re-signs** the app users download with
its **own** App Signing key — a different cert than your upload key. That Play
app-signing SHA-1 (`03249514…`) **is already registered**, which is why Google
login works on the live Play Store app. **Nothing to do for Play** — new AAB
uploads use the same Play signing key, so login keeps working with no re-upload.

If you ever need to re-confirm it: **Play Console → your app → Test and release →
Setup → App signing** → "App signing key certificate" SHA-1.

Fingerprints are additive — registering more never breaks existing ones. Current
state: **Play app-signing** ✅ registered; **upload key** (`6f42…`) ⚠️ add only if
you sideload release APKs.

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Google login works on iOS + debug Android, fails in **release APK** | release/upload SHA-1 not registered | add `6f42…` to Android client in Firebase, refresh `google-services.json`, rebuild |
| Google login works sideloaded, fails from **Play Store** | Play app-signing SHA-1 not registered | add Play's app-signing SHA-1 (Play Console → App signing) |
| `ApiException: 10` / `DEVELOPER_ERROR` on Android | SHA-1 or package mismatch | verify package `com.thulobazaar.mobile` + registered SHA-1 |
| Backend rejects a valid Google token (`audience mismatch`) | API `GOOGLE_CLIENT_ID` is not the **Web** client | set env `GOOGLE_CLIENT_ID` = `…bc35e5a0…` |
| iOS Google login fails / no callback | `REVERSED_CLIENT_ID` url scheme missing in Info.plist | ensure `com.googleusercontent.apps.665688327385-lbpla4ui…` is a CFBundleURLScheme |
| Apple login `third-party-auth` / verify fails | `APPLE_CLIENT_ID` wrong | must equal bundle id `com.thulobazaar.mobile` |

### Quick audits
```bash
# What SHA-1s are registered in the bundled google-services.json?
python3 -c "import json;d=json.load(open('apps/mobile/android/app/google-services.json'));[print(o.get('client_type'),o.get('android_info',{}).get('certificate_hash','-'),o['client_id'][:32]) for c in d['client'] for o in c.get('oauth_client',[])]"

# Live backend Google/Apple endpoints (expect 400/401, never 404)
curl -s -o /dev/null -w "google-token %{http_code}\n" -X POST https://api.thulobazaar.com.np/api/auth/google-token -d '{}'
curl -s -o /dev/null -w "apple-token  %{http_code}\n" -X POST https://api.thulobazaar.com.np/api/auth/apple-token  -d '{}'
```

---

## 5. Checklist when adding a NEW environment / re-keying

- [ ] Same Firebase project (`thulobazaar-488907`) for all platforms — don't split.
- [ ] API `GOOGLE_CLIENT_ID` = **Web** client (`…bc35e5a0…`), `GOOGLE_CLIENT_SECRET` set.
- [ ] API `APPLE_CLIENT_ID` = `com.thulobazaar.mobile`.
- [ ] iOS: `GoogleService-Info.plist` bundled in Xcode target; `REVERSED_CLIENT_ID` url scheme in Info.plist; Apple sign-in entitlement.
- [ ] Android: every signing cert SHA-1 (debug + upload + Play) registered on the Android OAuth client; `google-services.json` refreshed after each addition.
- [ ] Web: `GOOGLE_CLIENT_ID/SECRET` + `NEXTAUTH_URL` + authorized redirect URIs in Google Cloud console include the web domain.
</content>

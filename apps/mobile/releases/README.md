# Mobile Release Artifacts

Local archive of signed Android/iOS release builds. **Binaries (`*.aab`, `*.apk`,
`*.ipa`) are gitignored** — only this README and the folder structure are tracked.

## Layout

```
releases/
├── README.md
├── v1.0.1+2/                  ← versionName+versionCode
│   ├── app-release.aab        ← Play Store upload artifact
│   ├── adi-verification.apk   ← one-time ADI registration APK
│   └── app-release.apk        ← (optional) sideload-able APK for testing
└── v<next-version>/
    └── ...
```

## Conventions

- One subfolder per `pubspec.yaml` version (`<versionName>+<versionCode>`).
- `app-release.aab` — the bundle uploaded to Play Console.
- `app-release.apk` — universal APK for direct install / sharing with testers.
- `adi-verification.apk` — only present for the version that performed the
  one-time Android Developer Identity registration.

## Building

From `apps/mobile/`:

```bash
# Production AAB (Play Store)
flutter build appbundle --release

# Universal APK (sideload / testers)
flutter build apk --release

# Output:
#   build/app/outputs/bundle/release/app-release.aab
#   build/app/outputs/flutter-apk/app-release.apk
```

After building, copy the output into a versioned folder here:

```bash
VERSION=$(grep '^version:' pubspec.yaml | awk '{print $2}')
mkdir -p "releases/v${VERSION}"
cp build/app/outputs/bundle/release/app-release.aab "releases/v${VERSION}/"
cp build/app/outputs/flutter-apk/app-release.apk    "releases/v${VERSION}/" 2>/dev/null || true
```

## Verifying the signature

The AAB and APK must be signed with the upload key registered with Google Play:

```bash
# AAB (uses jarsigner v1 signing)
unzip -p releases/v1.0.1+2/app-release.aab META-INF/UPLOAD.RSA \
  | keytool -printcert | grep SHA256

# APK (uses apksigner v2/v3)
$ANDROID_HOME/build-tools/<version>/apksigner verify --print-certs \
  releases/v1.0.1+2/app-release.apk | grep SHA-256
```

Expected SHA-256:
`AA:00:01:DD:3B:7D:CF:AB:8B:4B:7F:C4:B5:F9:91:58:97:02:74:C2:0E:FF:C2:BF:EC:37:BB:E7:3B:19:36:9F`

## Keystore reference

The signing keystore lives at `apps/mobile/thulobazaar-upload.jks` (gitignored).
Passwords are in `apps/mobile/android/key.properties` (gitignored, chmod 600).
Backups: local + iCloud + Apple Passwords. **If the keystore is lost, Play Store
uploads break permanently** — see `apps/mobile/android/KEYSTORE_SETUP.md`.

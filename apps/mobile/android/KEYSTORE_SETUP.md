# Keystore Setup — Thulo Bazaar Upload Key

This guide creates the **upload keystore** used to sign the AAB you upload to
Google Play. With **Play App Signing** enabled, Google manages the app-signing
key on their servers — if you ever lose this upload key, Google can reset it.

> ⚠️ **Never commit `*.jks`, `*.keystore`, or `key.properties`.** They are
> already in `.gitignore`.

---

## 1. Generate the upload keystore

Run from `apps/mobile/` root (NOT inside `android/`). This puts the keystore
one level above `android/` so it's out of that subdirectory but still easy
to back up.

```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo/apps/mobile

keytool -genkey -v \
  -keystore thulobazaar-upload.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

You'll be prompted for:

| Prompt | Enter |
|--------|-------|
| Keystore password | **CHOOSE A STRONG PASSWORD** (save in 1Password / Bitwarden) |
| Re-enter password | Same |
| First and last name | Your real name or business name |
| Organizational unit | "Mobile" (anything) |
| Organization | "Thulo Bazaar" |
| City | e.g. "Kathmandu" |
| State/Province | e.g. "Bagmati" |
| Country code (2 letters) | **NP** |
| Correct? | **yes** |
| Key password for <upload> | Press **ENTER** to reuse keystore password |

A file `thulobazaar-upload.jks` appears at
`apps/mobile/thulobazaar-upload.jks`.

---

## 2. Create `key.properties`

```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo/apps/mobile/android
cp key.properties.example key.properties
```

Edit `android/key.properties` and replace `CHANGE_ME`:

```properties
storePassword=THE_PASSWORD_YOU_CHOSE_ABOVE
keyPassword=THE_PASSWORD_YOU_CHOSE_ABOVE
keyAlias=upload
storeFile=../../thulobazaar-upload.jks
```

(The `../../` is relative to `android/app/` — it points to the `.jks` you
generated.)

---

## 3. Back up the keystore — CRITICAL

Copy `thulobazaar-upload.jks` and remember the password in **3 places**:

- [ ] 1Password / Bitwarden (attach file + password)
- [ ] Cloud drive (iCloud / Google Drive) — encrypted ZIP
- [ ] External USB drive

If you lose BOTH the keystore AND the password, you cannot update the app
unless you go through Google's upload-key-reset process (which requires
account verification).

---

## 4. Verify signing works

```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo/apps/mobile
flutter clean
flutter pub get
flutter pub run flutter_launcher_icons   # regenerate icons with new PNG
flutter build appbundle --release
```

On success:
- Output: `build/app/outputs/bundle/release/app-release.aab`
- Verify signed with YOUR key (not debug):

```bash
keytool -list -printcert -jarfile build/app/outputs/bundle/release/app-release.aab
```

Look at the output — the signer's **CN** should be your name (step 1),
**NOT** `CN=Android Debug, O=Android, C=US`.

---

## 5. (Optional) Also build an APK for sideloading / testing

```bash
flutter build apk --release --split-per-abi
```

Outputs 3 smaller APKs in `build/app/outputs/flutter-apk/` — one per
architecture (arm64, arm, x86_64). Upload the AAB to Play Store; use
the APKs for direct-install testing.

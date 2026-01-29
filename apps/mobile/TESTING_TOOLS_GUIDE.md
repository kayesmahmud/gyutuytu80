# Mobile Testing Tools Guide

This guide documents all testing tools available for the ThuluBazaar Flutter app and what Claude can do with them.

## Installed Tools

| Tool | Version | Type | Installation |
|------|---------|------|--------------|
| **Maestro** | 2.1.0 | Global | `~/.maestro/bin` |
| **scrcpy** | 3.3.4 | Global | Homebrew |
| **Flutter integration_test** | SDK | Local | `pubspec.yaml` |
| **Appium** | 3.1.2 | Global | npm global |
| └─ uiautomator2 driver | 6.7.10 | Plugin | Appium driver |
| └─ flutter driver | 3.3.0 | Plugin | Appium driver |

---

## Capability Matrix

### What Claude Can Do WITH These Tools

| Capability | ADB (Direct) | Maestro | scrcpy | Flutter Test | Appium |
|------------|--------------|---------|--------|--------------|--------|
| Screenshot | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tap by text | ❌ | ✅ | ❌ | ✅ | ✅ |
| Tap by coordinates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Swipe/Scroll | ✅ | ✅ | ✅ | ✅ | ✅ |
| Type text | ✅ | ✅ | ✅ | ✅ | ✅ |
| Find element by ID | ❌ | ✅ | ❌ | ✅ | ✅ |
| Wait for element | ❌ | ✅ | ❌ | ✅ | ✅ |
| Assert visible | ❌ | ✅ | ❌ | ✅ | ✅ |
| Long press | ❌ | ✅ | ✅ | ✅ | ✅ |
| Double tap | ❌ | ✅ | ❌ | ✅ | ✅ |
| Pinch/Zoom | ❌ | ❌ | ❌ | ✅ | ✅ |
| Record video | ❌ | ✅ | ✅ | ❌ | ✅ |
| Run automated flow | ❌ | ✅ | ❌ | ✅ | ✅ |
| Back button | ✅ | ✅ | ✅ | ✅ | ✅ |
| Home button | ✅ | ✅ | ✅ | ❌ | ✅ |
| Launch app | ❌ | ✅ | ❌ | ✅ | ✅ |
| Kill app | ❌ | ✅ | ❌ | ❌ | ✅ |
| Clear app data | ✅ | ✅ | ✅ | ❌ | ✅ |
| Multiple devices | ✅ | ✅ | ✅ | ✅ | ✅ |
| iOS support | ❌ | ✅ | ❌ | ✅ | ✅ |
| CI/CD ready | ❌ | ✅ | ❌ | ✅ | ✅ |
| No code needed | ✅ | ✅ YAML | ✅ | ❌ Dart | ❌ Python/JS |

---

## Quick Commands Reference

### 1. ADB (Direct - Claude's Default)

```bash
# Check connected devices
adb devices

# Screenshot
adb exec-out screencap -p > screen.png

# Tap at coordinates
adb shell input tap 540 1200

# Swipe up
adb shell input swipe 540 1500 540 500 300

# Type text
adb shell input text "Hello"

# Press back
adb shell input keyevent 4

# Press home
adb shell input keyevent 3

# Get screen resolution
adb shell wm size

# Clear app data
adb shell pm clear com.thulobazaar.mobile

# For specific device
adb -s <device_id> <command>
```

### 2. Maestro

```bash
# Take screenshot
maestro screenshot output.png

# Run a flow
maestro test flow.yaml

# Run with video recording
maestro test flow.yaml --video

# Studio (visual editor)
maestro studio
```

**Example Flow (YAML):**
```yaml
# maestro/browse_flow.yaml
appId: com.thulobazaar.mobile
---
- launchApp
- assertVisible: "ThuluBazaar"
- takeScreenshot: 01_home

- tapOn: "Browse"
- assertVisible: "Search for anything"
- takeScreenshot: 02_browse

- scroll:
    direction: DOWN
- takeScreenshot: 03_browse_scrolled

- tapOn: ".*Mercedes.*"
- assertVisible: "Rs."
- takeScreenshot: 04_ad_detail

- back
- tapOn: "Messages"
- takeScreenshot: 05_messages

- tapOn: "Profile"
- takeScreenshot: 06_profile
```

### 3. scrcpy

```bash
# Mirror device screen
scrcpy

# Mirror + record video
scrcpy --record demo.mp4

# Record with time limit (10 seconds)
scrcpy --record demo.mp4 --time-limit 10

# Mirror specific device
scrcpy -s <device_id>

# Reduce resolution for performance
scrcpy --max-size 1024

# Show touches
scrcpy --show-touches

# Stay awake while connected
scrcpy --stay-awake

# Turn off screen (mirror only)
scrcpy --turn-screen-off
```

### 4. Flutter Integration Test

```bash
# Run integration tests
cd apps/mobile
flutter test integration_test/screenshot_test.dart

# Run on specific device
flutter test integration_test/screenshot_test.dart -d <device_id>

# Run with verbose output
flutter test integration_test/screenshot_test.dart --verbose
```

**Example Test (Dart):**
```dart
// integration_test/screenshot_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('capture all screens', (tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Home screen
    await binding.takeScreenshot('01_home');

    // Tap Browse
    await tester.tap(find.text('Browse'));
    await tester.pumpAndSettle();
    await binding.takeScreenshot('02_browse');

    // Scroll down
    await tester.fling(
      find.byType(ListView),
      const Offset(0, -500),
      1000,
    );
    await tester.pumpAndSettle();
    await binding.takeScreenshot('03_browse_scrolled');

    // Tap on an ad
    await tester.tap(find.textContaining('Mercedes'));
    await tester.pumpAndSettle();
    await binding.takeScreenshot('04_ad_detail');
  });
}
```

### 5. Appium

```bash
# Start Appium server
appium

# List installed drivers
appium driver list --installed
```

**Example Script (Python):**
```python
# appium_test.py
from appium import webdriver
from appium.options.android import UiAutomator2Options
import time

def test_browse_flow():
    options = UiAutomator2Options()
    options.platform_name = "Android"
    options.device_name = "emulator-5554"
    options.app_package = "com.thulobazaar.mobile"
    options.app_activity = ".MainActivity"
    options.no_reset = True

    driver = webdriver.Remote("http://localhost:4723", options=options)

    try:
        # Wait for app to load
        time.sleep(3)
        driver.save_screenshot("01_home.png")

        # Tap Browse
        browse = driver.find_element("xpath", "//android.widget.TextView[@text='Browse']")
        browse.click()
        time.sleep(2)
        driver.save_screenshot("02_browse.png")

        # Swipe up
        driver.swipe(540, 1500, 540, 500, 300)
        time.sleep(1)
        driver.save_screenshot("03_browse_scrolled.png")

        # Find and tap ad
        ad = driver.find_element("xpath", "//android.widget.TextView[contains(@text, 'Mercedes')]")
        ad.click()
        time.sleep(2)
        driver.save_screenshot("04_ad_detail.png")

    finally:
        driver.quit()

if __name__ == "__main__":
    test_browse_flow()
```

---

## Best Tool For Each Task

| Task | Best Tool | Command/Example |
|------|-----------|-----------------|
| Quick screenshot | ADB | `adb exec-out screencap -p > screen.png` |
| Tap by text | Maestro | `tapOn: "Login"` |
| Record demo video | scrcpy | `scrcpy --record demo.mp4` |
| Full UI test | Flutter Test | `flutter test integration_test/` |
| Complex automation | Appium | Python/JS scripts |
| E2E flow testing | Maestro | YAML flows |
| Widget testing | Flutter Test | `find.byKey()` |
| Live debugging | scrcpy | `scrcpy` |
| CI/CD pipeline | Maestro/Flutter Test | GitHub Actions |

---

## Claude's Workflow

### For Quick Debugging (ADB Direct)
```bash
# Claude captures and analyzes
adb exec-out screencap -p > screen.png
# Claude reads the image and provides feedback
```

### For Automated Testing (Maestro)
```bash
# Claude writes the YAML flow
# User runs:
maestro test maestro/flow.yaml
```

### For Demo Recording (scrcpy)
```bash
# User runs:
scrcpy --record demo.mp4
# Claude can analyze frames later
```

---

## Directory Structure

```
apps/mobile/
├── integration_test/
│   └── screenshot_test.dart    # Flutter integration tests
├── maestro/
│   ├── browse_flow.yaml        # Browse screen flow
│   ├── login_flow.yaml         # Login flow
│   └── full_app_flow.yaml      # Complete app walkthrough
├── appium/
│   ├── test_browse.py          # Python Appium tests
│   └── requirements.txt        # Python dependencies
└── TESTING_TOOLS_GUIDE.md      # This file
```

---

## Setup Checklist

- [x] Maestro installed (`~/.maestro/bin`)
- [x] scrcpy installed (Homebrew)
- [x] Flutter integration_test in pubspec.yaml
- [x] Appium installed (npm global)
- [x] Appium uiautomator2 driver
- [x] Appium flutter driver

---

## Troubleshooting

### Device not found
```bash
adb kill-server && adb start-server
adb devices
```

### Maestro can't find app
```bash
# Make sure app is installed
adb shell pm list packages | grep thulobazaar
```

### scrcpy black screen
```bash
# Device might be locked - unlock it first
# Or try reducing resolution
scrcpy --max-size 800
```

### Flutter test timeout
```dart
// Increase pump timeout
await tester.pumpAndSettle(const Duration(seconds: 10));
```

### Appium connection refused
```bash
# Make sure Appium server is running
appium
# In another terminal, run your script
```

---

## Resources

- [Maestro Docs](https://maestro.mobile.dev/)
- [scrcpy GitHub](https://github.com/Genymobile/scrcpy)
- [Flutter Integration Testing](https://docs.flutter.dev/testing/integration-tests)
- [Appium Docs](https://appium.io/docs/en/latest/)

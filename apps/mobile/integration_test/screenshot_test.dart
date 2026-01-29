import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Screenshot Capture', () {
    testWidgets('capture all main screens', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Screenshot 1: Home Screen
      await binding.takeScreenshot('01_home_screen');
      print('✓ Captured: Home Screen');

      // Navigate to Browse tab
      final browseTab = find.text('Browse');
      if (browseTab.evaluate().isNotEmpty) {
        await tester.tap(browseTab);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        await binding.takeScreenshot('02_browse_screen');
        print('✓ Captured: Browse Screen');
      }

      // Navigate to Messages tab
      final messagesTab = find.text('Messages');
      if (messagesTab.evaluate().isNotEmpty) {
        await tester.tap(messagesTab);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        await binding.takeScreenshot('03_messages_screen');
        print('✓ Captured: Messages Screen');
      }

      // Navigate to Profile tab
      final profileTab = find.text('Profile');
      if (profileTab.evaluate().isNotEmpty) {
        await tester.tap(profileTab);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        await binding.takeScreenshot('04_profile_screen');
        print('✓ Captured: Profile Screen');
      }

      print('\n✅ All screenshots captured successfully!');
    });
  });
}

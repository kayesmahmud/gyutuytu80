import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/signin_screen.dart';

void main() {
  testWidgets('SignInScreen has +977 prefix', (WidgetTester tester) async {
    // Build the SignInScreen
    await tester.pumpWidget(const MaterialApp(home: SignInScreen()));

    // Verify +977 text exists
    expect(find.text('+977'), findsOneWidget);
    
    // Verify Phone Input field exists
    expect(find.byType(TextFormField), findsAtLeastNWidgets(1));
    
    // Verify Password Input field exists
    expect(find.text('Password'), findsOneWidget);
  });
}

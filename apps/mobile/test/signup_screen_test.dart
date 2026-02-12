import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/signup_screen.dart';

void main() {
  testWidgets('SignUpScreen has initial phone input and does not show registration fields', (WidgetTester tester) async {
    // Build the SignUpScreen
    await tester.pumpWidget(const MaterialApp(home: SignUpScreen()));
    await tester.pumpAndSettle();

    // Verify +977 prefix exists
    expect(find.text('+977'), findsOneWidget);
    
    // Verify Phone Input field exists
    expect(find.text('Phone Number *'), findsOneWidget);
    
    // Verify Send OTP button exists
    expect(find.text('Send OTP'), findsOneWidget);

    // Verify Registration fields DO NOT exist yet
    expect(find.text('Confirm Password *'), findsNothing);
    expect(find.text('Terms & Conditions'), findsNothing);
    expect(find.text('Verify & Register'), findsNothing);
  });
}

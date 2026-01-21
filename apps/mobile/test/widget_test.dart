import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/features/main_nav/main_nav_screen.dart';

void main() {
  testWidgets('App renders usage test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ThuloBazaarApp());

    // Verify that the MainNavScreen is displayed
    expect(find.byType(MainNavScreen), findsOneWidget);
    
    // Verify that the HomeScreen is the default tab
    expect(find.text('Buy, Sell, and Rent Across Nepal'), findsOneWidget);
    
    // Verify Bottom Navigation Bar exists
    expect(find.byType(BottomNavigationBar), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Browse'), findsOneWidget);
  });
}

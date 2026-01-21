import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/main_nav/main_nav_screen.dart';

void main() {
  runApp(const ThuloBazaarApp());
}

class ThuloBazaarApp extends StatelessWidget {
  const ThuloBazaarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ThuloBazaar',
      theme: AppTheme.lightTheme,
      home: const MainNavScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}


import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MainAppBar extends StatelessWidget implements PreferredSizeWidget {
  final PreferredSizeWidget? bottom;
  final Widget? leading;
  
  const MainAppBar({super.key, this.bottom, this.leading});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      leading: leading ?? IconButton(
        icon: const Icon(Icons.menu, color: Colors.black),
        onPressed: () {
          Scaffold.of(context).openDrawer();
        },
      ),
      title: Image.asset(
        'assets/images/logo.png',
        height: 28, // Adjusted height to look sharp
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => Text(
          "THULO BAZAAR", 
          style: GoogleFonts.poppins( // Cleaner, bold font closer to logo
            color: const Color(0xFFDC2626), // Red 600
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: -0.5,
          ),
        ),
      ),
      bottom: bottom,
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight + (bottom?.preferredSize.height ?? 0));
}

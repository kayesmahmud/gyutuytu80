import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MainDrawer extends StatelessWidget {
  const MainDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
             // Header
             Padding(
               padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
               child: Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                 children: [
                    Image.asset(
                      'assets/images/logo.png', 
                      height: 28, // Matches AppBar logo height
                      errorBuilder: (context, error, stackTrace) => Text("THULO BAZAAR", style: GoogleFonts.poppins(color: const Color(0xFFDC2626), fontWeight: FontWeight.bold)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.grey, size: 28),
                      onPressed: () => Navigator.pop(context),
                    ),
                 ],
               ),
             ),
             const Divider(height: 1, color: Color(0xFFE5E7EB)), // Light gray divider
             
             Expanded(
               child: SingleChildScrollView(
                 padding: const EdgeInsets.symmetric(vertical: 16),
                 child: Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                     _buildMenuItem("Browse Ads", onTap: () {}),
                     _buildMenuItem("Get Verified", onTap: () {}),
                     
                     const SizedBox(height: 16),
                     const Padding(padding: EdgeInsets.symmetric(horizontal: 24), child: Divider(height: 1, color: Color(0xFFE5E7EB))),
                     const SizedBox(height: 16),
                     
                     // Auth Buttons
                     Padding(
                       padding: const EdgeInsets.symmetric(horizontal: 24),
                       child: Column(
                         children: [
                           OutlinedButton(
                             onPressed: () {
                               Navigator.pop(context);
                               // Navigate to Sign In
                             },
                             style: OutlinedButton.styleFrom(
                               side: const BorderSide(color: Color(0xFFE11D48)), // Pinkish red
                               foregroundColor: const Color(0xFFE11D48),
                               minimumSize: const Size(double.infinity, 48),
                               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                             ),
                             child: Text("Sign In", style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16)),
                           ),
                           const SizedBox(height: 12),
                           ElevatedButton(
                             onPressed: () {
                               Navigator.pop(context);
                               // Navigate to Sign Up
                             },
                             style: ElevatedButton.styleFrom(
                               backgroundColor: const Color(0xFFE11D48),
                               foregroundColor: Colors.white,
                               minimumSize: const Size(double.infinity, 48),
                               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                               elevation: 0,
                             ),
                             child: Text("Sign Up", style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16)),
                           ),
                         ],
                       ),
                     ),
                     
                     const SizedBox(height: 24),
                     const Padding(padding: EdgeInsets.symmetric(horizontal: 24), child: Divider(height: 1, color: Color(0xFFE5E7EB))),
                     const SizedBox(height: 16),

                     _buildMenuItem("Help Center", icon: Icons.help_outline),
                     _buildMenuItem("FAQ", icon: Icons.description_outlined),
                     _buildMenuItem("Support Tickets", icon: Icons.confirmation_number_outlined),
                     _buildMenuItem("Contact Us", icon: Icons.mail_outline),
                   ],
                 ),
               ),
             ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(String title, {IconData? icon, VoidCallback? onTap}) {
    return ListTile(
      leading: icon != null ? Icon(icon, color: Colors.grey[600], size: 22) : null,
      title: Text(
        title, 
        style: GoogleFonts.inter(
          color: const Color(0xFF374151), // Gray 700
          fontSize: 15,
          fontWeight: FontWeight.w500
        )
      ),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      horizontalTitleGap: 12, // reduce gap if icon is present
      minLeadingWidth: icon != null ? 24 : 0,
    );
  }
}

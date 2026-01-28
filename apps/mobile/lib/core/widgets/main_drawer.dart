import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/auth/signin_screen.dart';
import 'package:mobile/features/auth/signup_screen.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';
import 'package:mobile/features/shop/shop_screen.dart';
import 'package:mobile/features/verification/verification_screen.dart';
import 'package:mobile/features/profile/profile_screen.dart';
import 'package:mobile/features/browse/browse_screen.dart';

class MainDrawer extends StatelessWidget {
  const MainDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isLoggedIn = authProvider.isLoggedIn;
    final user = authProvider.user;

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
             const Divider(height: 1, color: Color(0xFFE5E7EB)),
             
             Expanded(
               child: SingleChildScrollView(
                 padding: const EdgeInsets.symmetric(vertical: 16),
                 child: Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                     _buildMenuItem("Browse Ads", onTap: () {
                       Navigator.pop(context);
                       Navigator.push(context, MaterialPageRoute(builder: (_) => const BrowseScreen()));
                     }),
                     _buildMenuItem("Get Verified", onTap: () {
                       Navigator.pop(context);
                       Navigator.push(context, MaterialPageRoute(builder: (_) => const VerificationScreen()));
                     }),
                     
                     const SizedBox(height: 16),
                     const Padding(padding: EdgeInsets.symmetric(horizontal: 24), child: Divider(height: 1, color: Color(0xFFE5E7EB))),
                     const SizedBox(height: 16),
                     
                     if (isLoggedIn) ...[
                        _buildMenuItem("My Profile", icon: Icons.person_outline, onTap: () {
                          Navigator.pop(context);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
                        }),
                        _buildMenuItem("Dashboard", icon: Icons.dashboard_outlined, onTap: () {
                          Navigator.pop(context);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
                        }),
                        _buildMenuItem("My Shop", icon: Icons.store_outlined, onTap: () {
                          Navigator.pop(context);
                          // Get user's shop slug (custom or fallback to user-{id})
                          final shopSlug = user?['shopSlug'] ?? user?['shop_slug'] ?? user?['customShopSlug'] ?? user?['custom_shop_slug'] ?? 'user-${user?['id']}';
                          Navigator.push(context, MaterialPageRoute(builder: (_) => ShopScreen(shopSlug: shopSlug)));
                        }),
                        
                        const SizedBox(height: 24),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: ElevatedButton(
                             onPressed: () {
                               authProvider.logout();
                               Navigator.pop(context);
                             },
                             style: ElevatedButton.styleFrom(
                               backgroundColor: const Color(0xFFDC2626), // Red color for Sign Out
                               foregroundColor: Colors.white,
                               minimumSize: const Size(double.infinity, 48),
                               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                               elevation: 0,
                             ),
                             child: Text("Sign Out", style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16)),
                           ),
                        ),
                     ] else ...[
                       // Guest View
                       Padding(
                         padding: const EdgeInsets.symmetric(horizontal: 24),
                         child: Column(
                           children: [
                             OutlinedButton(
                               onPressed: () {
                                 Navigator.pop(context); 
                                 Navigator.push(context, MaterialPageRoute(builder: (_) => const SignInScreen()));
                               },
                               style: OutlinedButton.styleFrom(
                                 side: const BorderSide(color: Color(0xFFE11D48)),
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
                                 Navigator.push(context, MaterialPageRoute(builder: (_) => const SignUpScreen()));
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
                     ],
                     
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

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/models/models.dart';

class FloatingContactBar extends StatelessWidget {
  final AdWithDetails ad;

  const FloatingContactBar({super.key, required this.ad});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 34), // Safe area bottom padding
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, -4)),
        ],
      ),
      child: Row(
        children: [
          Expanded(
              child: _buildContactBtn(
                  Icons.phone,
                  "Call",
                  const Color(0xFF1F2937),
                  Colors.white,
                  () => _launchPhone(ad.userPhone))),
          const SizedBox(width: 12),
          Expanded(
              child: _buildContactBtn(
                  Icons.chat_bubble_outline,
                  "Chat",
                  const Color(0xFF4B5563),
                  Colors.white,
                  () {})), // Outline style?
          const SizedBox(width: 12),
          Expanded(
              child: _buildContactBtn(
                  Icons.message,
                  "WhatsApp",
                  const Color(0xFF25D366),
                  Colors.white,
                  () => _launchWhatsApp(ad.userPhone))),
        ],
      ),
    );
  }

  Widget _buildContactBtn(
      IconData icon, String label, Color bg, Color fg, VoidCallback onTap) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        elevation: 0,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20),
          const SizedBox(height: 2),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Future<void> _launchPhone(String? phone) async {
    if (phone == null) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _launchWhatsApp(String? phone) async {
    if (phone == null) return;
    final uri = Uri.parse('https://wa.me/$phone');
    if (await canLaunchUrl(uri))
      await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SafetyTipsCard extends StatelessWidget {
  const SafetyTipsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED), // Orange-50
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFEDD5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Safety Tips",
              style: GoogleFonts.inter(
                  color: const Color(0xFFC2410C), fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _buildBullet("Meet in a safe public place"),
          _buildBullet("Inspect the item before payment"),
          _buildBullet("Never pay in advance"),
        ],
      ),
    );
  }

  Widget _buildBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          const Icon(Icons.circle, size: 6, color: Color(0xFFC2410C)),
          const SizedBox(width: 8),
          Expanded(
              child: Text(text,
                  style: GoogleFonts.inter(
                      fontSize: 12, color: const Color(0xFF9A3412)))),
        ],
      ),
    );
  }
}

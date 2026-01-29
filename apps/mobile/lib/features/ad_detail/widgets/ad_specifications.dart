import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/models/models.dart';

class AdSpecifications extends StatelessWidget {
  final AdWithDetails ad;

  const AdSpecifications({super.key, required this.ad});

  @override
  Widget build(BuildContext context) {
    if (ad.attributes == null || ad.attributes!.isEmpty) {
      return const SizedBox.shrink();
    }

    final specs = ad.attributes!.entries
        .where((e) => e.value != null && e.value.toString().isNotEmpty)
        .toList();

    if (specs.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text(
              "Specifications",
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1F2937),
              ),
            ),
          ),
          const Divider(height: 16, color: Color(0xFFF3F4F6)),
          ListView.separated(
            physics: const NeverScrollableScrollPhysics(),
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            itemCount: specs.length,
            separatorBuilder: (_, __) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: Colors.grey[100]),
            ),
            itemBuilder: (context, index) {
              final entry = specs[index];
              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _formatKey(entry.key),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF6B7280), // Subtle Gray
                    ),
                  ),
                  const SizedBox(width: 16),
                  Flexible(
                    child: Text(
                      entry.value.toString(),
                      textAlign: TextAlign.end,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF111827), // Bold Black
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  String _formatKey(String key) {
    if (key.isEmpty) return key;
    // Handle snake_case and camelCase
    final formatted = key.replaceAll('_', ' ');
    return formatted[0].toUpperCase() +
        formatted.substring(1).replaceAllMapped(
            RegExp(r'[A-Z]'), (m) => ' ${m[0]}');
  }
}

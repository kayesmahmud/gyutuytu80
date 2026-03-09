import 'dart:io';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/utils/localized_helpers.dart';

class BusinessReviewStep extends StatelessWidget {
  final String businessName;
  final String businessCategory;
  final String businessPhone;
  final String businessAddress;
  final int durationDays;
  final double price;
  final bool isFreeVerification;
  final File? businessLicenseFile;

  const BusinessReviewStep({
    super.key,
    required this.businessName,
    required this.businessCategory,
    required this.businessPhone,
    required this.businessAddress,
    required this.durationDays,
    required this.price,
    required this.isFreeVerification,
    required this.businessLicenseFile,
  });

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          lang == 'ne' ? 'समीक्षा र पेश गर्नुहोस्' : 'Review & Submit',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'कृपया पेश गर्नु अघि आफ्नो जानकारी समीक्षा गर्नुहोस्।'
              : 'Please review your information before submitting.',
          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),

        // Summary card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            children: [
              _buildReviewRow(lang == 'ne' ? 'व्यापारको नाम' : 'Business Name', businessName),
              if (businessCategory.isNotEmpty) ...[
                const Divider(height: 24),
                _buildReviewRow(lang == 'ne' ? 'वर्ग' : 'Category', businessCategory),
              ],
              if (businessPhone.isNotEmpty) ...[
                const Divider(height: 24),
                _buildReviewRow(lang == 'ne' ? 'फोन' : 'Phone', businessPhone),
              ],
              if (businessAddress.isNotEmpty) ...[
                const Divider(height: 24),
                _buildReviewRow(lang == 'ne' ? 'ठेगाना' : 'Address', businessAddress),
              ],
              const Divider(height: 24),
              _buildReviewRow(lang == 'ne' ? 'अवधि' : 'Duration', lang == 'ne' ? '$durationDays दिन' : '$durationDays days'),
              const Divider(height: 24),
              _buildReviewRow(
                lang == 'ne' ? 'मूल्य' : 'Price',
                isFreeVerification
                    ? (lang == 'ne' ? 'निःशुल्क' : 'FREE')
                    : formatLocalizedPrice(price, lang),
                isHighlighted: true,
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Document preview
        Text(
          lang == 'ne' ? 'अपलोड गरिएको कागजात' : 'Document Uploaded',
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 12),
        if (businessLicenseFile != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              businessLicenseFile!,
              width: double.infinity,
              height: 150,
              fit: BoxFit.cover,
            ),
          )
        else
          Text(
            lang == 'ne' ? 'कुनै कागजात अपलोड गरिएको छैन' : 'No document uploaded',
            style: GoogleFonts.inter(color: Colors.red),
          ),
      ],
    );
  }

  Widget _buildReviewRow(String label, String value, {bool isHighlighted = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        Flexible(
          child: Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: isHighlighted ? FontWeight.bold : FontWeight.w500,
              color: isHighlighted ? const Color(0xFF10B981) : Colors.grey[800],
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}

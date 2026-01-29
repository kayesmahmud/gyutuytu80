import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Review & Submit',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Please review your information before submitting.',
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
              _buildReviewRow('Business Name', businessName),
              if (businessCategory.isNotEmpty) ...[
                const Divider(height: 24),
                _buildReviewRow('Category', businessCategory),
              ],
              if (businessPhone.isNotEmpty) ...[
                const Divider(height: 24),
                _buildReviewRow('Phone', businessPhone),
              ],
              if (businessAddress.isNotEmpty) ...[
                const Divider(height: 24),
                _buildReviewRow('Address', businessAddress),
              ],
              const Divider(height: 24),
              _buildReviewRow('Duration', '$durationDays days'),
              const Divider(height: 24),
              _buildReviewRow(
                'Price',
                isFreeVerification ? 'FREE' : 'Rs. ${price.toStringAsFixed(0)}',
                isHighlighted: true,
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Document preview
        Text(
          'Document Uploaded',
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
            'No document uploaded',
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

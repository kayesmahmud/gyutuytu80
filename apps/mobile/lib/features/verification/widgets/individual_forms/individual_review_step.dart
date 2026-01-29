import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class IndividualReviewStep extends StatelessWidget {
  final String fullName;
  final String idType;
  final String idNumber;
  final int durationDays;
  final double price;
  final bool isFreeVerification;
  final File? idFrontFile;
  final File? idBackFile;
  final File? selfieFile;

  const IndividualReviewStep({
    super.key,
    required this.fullName,
    required this.idType,
    required this.idNumber,
    required this.durationDays,
    required this.price,
    required this.isFreeVerification,
    required this.idFrontFile,
    required this.idBackFile,
    required this.selfieFile,
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
              _buildReviewRow('Full Name', fullName),
              const Divider(height: 24),
              _buildReviewRow('ID Type', _getIdTypeLabel(idType)),
              const Divider(height: 24),
              _buildReviewRow('ID Number', idNumber),
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

        // Documents preview
        Text(
          'Documents Uploaded',
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            if (idFrontFile != null)
              Expanded(child: _buildDocPreview('ID Front', idFrontFile!)),
            const SizedBox(width: 8),
            if (idBackFile != null)
              Expanded(child: _buildDocPreview('ID Back', idBackFile!))
            else
              const Spacer(),
          ],
        ),
        const SizedBox(height: 12),
        if (selfieFile != null)
          _buildDocPreview('Selfie with ID', selfieFile!),
      ],
    );
  }

  Widget _buildReviewRow(String label, String value,
      {bool isHighlighted = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isHighlighted ? const Color(0xFF6366F1) : Colors.grey[800],
          ),
        ),
      ],
    );
  }

  Widget _buildDocPreview(String label, File file) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600]),
        ),
        const SizedBox(height: 4),
        Container(
          height: 100,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
            image: DecorationImage(
              image: FileImage(file),
              fit: BoxFit.cover,
            ),
          ),
        ),
      ],
    );
  }

  String _getIdTypeLabel(String type) {
    switch (type) {
      case 'citizenship':
        return 'Citizenship';
      case 'passport':
        return 'Passport';
      case 'driving_license':
        return 'Driving License';
      default:
        return type;
    }
  }
}

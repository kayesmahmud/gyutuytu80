import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class BusinessInfoStep extends StatelessWidget {
  final TextEditingController businessNameController;
  final TextEditingController businessCategoryController;
  final TextEditingController businessDescriptionController;
  final TextEditingController businessWebsiteController;
  final TextEditingController businessPhoneController;
  final TextEditingController businessAddressController;

  const BusinessInfoStep({
    super.key,
    required this.businessNameController,
    required this.businessCategoryController,
    required this.businessDescriptionController,
    required this.businessWebsiteController,
    required this.businessPhoneController,
    required this.businessAddressController,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Business Information',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Enter your business details. Fields marked with * are required.',
          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),

        // Business Name
        _buildTextField(
          controller: businessNameController,
          label: 'Business Name *',
          hint: 'Enter your registered business name',
        ),
        const SizedBox(height: 16),

        // Business Category
        _buildTextField(
          controller: businessCategoryController,
          label: 'Business Category',
          hint: 'e.g., Electronics, Fashion, Real Estate',
        ),
        const SizedBox(height: 16),

        // Business Description
        _buildTextField(
          controller: businessDescriptionController,
          label: 'Business Description',
          hint: 'Brief description of your business',
          maxLines: 3,
        ),
        const SizedBox(height: 16),

        // Business Website
        _buildTextField(
          controller: businessWebsiteController,
          label: 'Business Website',
          hint: 'https://www.example.com',
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 16),

        // Business Phone
        _buildTextField(
          controller: businessPhoneController,
          label: 'Business Phone',
          hint: '+977 9XXXXXXXXX',
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 16),

        // Business Address
        _buildTextField(
          controller: businessAddressController,
          label: 'Business Address',
          hint: 'Enter your business address',
          maxLines: 2,
        ),

        const SizedBox(height: 24),

        // Tips
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFEEF2FF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.lightbulb_outline, color: Color(0xFF6366F1), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Tips',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF6366F1),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '• Use your official registered business name\n'
                '• Complete information helps with faster verification\n'
                '• Provide accurate contact details',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
            ),
          ),
        ),
      ],
    );
  }
}

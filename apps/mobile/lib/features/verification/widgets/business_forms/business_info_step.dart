import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
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
    final lang = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          lang == 'ne' ? 'व्यापार जानकारी' : 'Business Information',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'आफ्नो व्यापार विवरणहरू लेख्नुहोस्। * चिन्ह लागेका फिल्डहरू आवश्यक छन्।'
              : 'Enter your business details. Fields marked with * are required.',
          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),

        // Business Name
        _buildTextField(
          controller: businessNameController,
          label: lang == 'ne' ? 'व्यापारको नाम *' : 'Business Name *',
          hint: lang == 'ne' ? 'आफ्नो दर्ता गरिएको व्यापारको नाम लेख्नुहोस्' : 'Enter your registered business name',
        ),
        const SizedBox(height: 16),

        // Business Category
        _buildTextField(
          controller: businessCategoryController,
          label: lang == 'ne' ? 'व्यापार वर्ग' : 'Business Category',
          hint: lang == 'ne' ? 'जस्तै इलेक्ट्रोनिक्स, फेसन, रियल इस्टेट' : 'e.g., Electronics, Fashion, Real Estate',
        ),
        const SizedBox(height: 16),

        // Business Description
        _buildTextField(
          controller: businessDescriptionController,
          label: lang == 'ne' ? 'व्यापार विवरण' : 'Business Description',
          hint: lang == 'ne' ? 'आफ्नो व्यापारको संक्षिप्त विवरण' : 'Brief description of your business',
          maxLines: 3,
        ),
        const SizedBox(height: 16),

        // Business Website
        _buildTextField(
          controller: businessWebsiteController,
          label: lang == 'ne' ? 'व्यापार वेबसाइट' : 'Business Website',
          hint: 'https://www.example.com',
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 16),

        // Business Phone
        _buildTextField(
          controller: businessPhoneController,
          label: lang == 'ne' ? 'व्यापार फोन' : 'Business Phone',
          hint: '+977 9XXXXXXXXX',
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 16),

        // Business Address
        _buildTextField(
          controller: businessAddressController,
          label: lang == 'ne' ? 'व्यापार ठेगाना' : 'Business Address',
          hint: lang == 'ne' ? 'आफ्नो व्यापार ठेगाना लेख्नुहोस्' : 'Enter your business address',
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
                  const Icon(LucideIcons.lightbulb, color: Color(0xFF6366F1), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    lang == 'ne' ? 'सुझावहरू' : 'Tips',
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
                lang == 'ne'
                    ? '• आधिकारिक दर्ता गरिएको व्यापारको नाम प्रयोग गर्नुहोस्\n'
                      '• पूर्ण जानकारीले छिटो प्रमाणीकरणमा मद्दत गर्छ\n'
                      '• सही सम्पर्क विवरणहरू दिनुहोस्'
                    : '• Use your official registered business name\n'
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

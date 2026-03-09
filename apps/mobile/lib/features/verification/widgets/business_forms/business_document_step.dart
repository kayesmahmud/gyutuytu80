import 'dart:io';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';

class BusinessDocumentStep extends StatelessWidget {
  final File? businessLicenseFile;
  final VoidCallback onPickImage;
  final VoidCallback onClearImage;

  const BusinessDocumentStep({
    super.key,
    required this.businessLicenseFile,
    required this.onPickImage,
    required this.onClearImage,
  });

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          lang == 'ne' ? 'व्यापार लाइसेन्स अपलोड गर्नुहोस्' : 'Upload Business License',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          lang == 'ne'
              ? 'आफ्नो व्यापार दर्ता वा लाइसेन्स कागजातको स्पष्ट फोटो अपलोड गर्नुहोस्।'
              : 'Upload a clear photo of your business registration or license document.',
          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),

        // File Upload
        Text(
          lang == 'ne' ? 'व्यापार लाइसेन्स कागजात *' : 'Business License Document *',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onPickImage,
          child: Container(
            width: double.infinity,
            height: businessLicenseFile != null ? 200 : 150,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: businessLicenseFile != null
                    ? const Color(0xFF10B981)
                    : Colors.grey[300]!,
                width: businessLicenseFile != null ? 2 : 1,
              ),
            ),
            child: businessLicenseFile != null
                ? Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.file(
                          businessLicenseFile!,
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: onClearImage,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(LucideIcons.x, color: Colors.white, size: 18),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(LucideIcons.check, color: Colors.white, size: 16),
                        ),
                      ),
                    ],
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.upload, size: 48, color: Colors.grey[400]),
                      const SizedBox(height: 12),
                      Text(
                        lang == 'ne'
                            ? 'व्यापार लाइसेन्स अपलोड गर्न ट्याप गर्नुहोस्'
                            : 'Tap to upload business license',
                        style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        lang == 'ne'
                            ? 'JPEG, PNG, वा PDF • अधिकतम ५MB'
                            : 'JPEG, PNG, or PDF • Max 5MB',
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
                      ),
                    ],
                  ),
          ),
        ),

        const SizedBox(height: 24),

        // Accepted documents
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDF4),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.checkCircle, color: Color(0xFF10B981), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    lang == 'ne' ? 'स्वीकृत कागजातहरू' : 'Accepted Documents',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                lang == 'ne'
                    ? '• कम्पनी दर्ता प्रमाणपत्र\n'
                      '• PAN/VAT दर्ता\n'
                      '• व्यापार लाइसेन्स\n'
                      '• व्यापार अनुमतिपत्र'
                    : '• Company Registration Certificate\n'
                      '• PAN/VAT Registration\n'
                      '• Business License\n'
                      '• Trade License',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Photo tips
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.alertTriangle, color: Color(0xFFF59E0B), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    lang == 'ne' ? 'फोटो आवश्यकताहरू' : 'Photo Requirements',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFFD97706),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                lang == 'ne'
                    ? '• सबै पाठ स्पष्ट पढ्न सकिनुपर्छ\n'
                      '• चम्किलो प्रकाश र छायाबाट बच्नुहोस्\n'
                      '• कागजात पूर्ण रूपमा देखिनुपर्छ\n'
                      '• काटिएको वा धमिलो छविहरू नराख्नुहोस्'
                    : '• All text must be clearly readable\n'
                      '• Avoid glare and shadows\n'
                      '• Document should be fully visible\n'
                      '• No cropped or blurry images',
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
}

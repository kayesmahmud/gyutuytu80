import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:mobile/features/post_ad/create_ad_screen.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/main_app_bar.dart';
import 'package:mobile/core/widgets/main_drawer.dart';
import 'package:mobile/core/widgets/login_required_widget.dart';

class PostAdScreen extends StatelessWidget {
  const PostAdScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      return Scaffold(
        appBar: MainAppBar(
          leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        ),
        drawer: const MainDrawer(),
        body: LoginRequiredWidget(
          icon: LucideIcons.plusCircle,
          title: context.locale.languageCode == 'ne' ? 'विज्ञापन पोस्ट गर्न लगइन गर्नुहोस्' : 'Login to Post an Ad',
          subtitle: context.locale.languageCode == 'ne'
              ? 'आफ्ना सामानहरू सूचीबद्ध गर्न\nर हजारौं खरिदकर्ताहरूसम्म पुग्न साइन इन गर्नुहोस्'
              : 'Sign in to list your items\nand reach thousands of buyers',
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: MainAppBar(
        leading: Navigator.canPop(context) 
          ? IconButton(
              icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
              onPressed: () => Navigator.pop(context),
            )
          : null, // Default to hamburger
      ),
      drawer: const MainDrawer(),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              Builder(builder: (context) {
                final isNe = context.locale.languageCode == 'ne';
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isNe ? "निःशुल्क विज्ञापन पोस्ट गर्नुहोस्" : "Post a Free Ad",
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isNe ? "आफ्नो सूची बनाउन तलका विवरणहरू भर्नुहोस्" : "Fill in the details below to create your listing",
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                );
              }),
              const SizedBox(height: 32),

              // Saved Drafts Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        context.locale.languageCode == 'ne' ? "सुरक्षित ड्राफ्ट (१०)" : "Saved Drafts (10)",
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                         debugPrint("🔘 Start New Ad button clicked");
                         try {
                           Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateAdScreen()));
                         } catch (e) {
                           debugPrint("🔴 Error navigating to CreateAdScreen: $e");
                           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: $e')));
                         }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1), // Indigo/Purple color from screenshot
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                      icon: const Icon(LucideIcons.plus, size: 18),
                      label: Text(
                        context.locale.languageCode == 'ne' ? "नयाँ विज्ञापन" : "Start New Ad",
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Draft List
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    left: BorderSide(color: Colors.grey[200]!),
                    right: BorderSide(color: Colors.grey[200]!),
                    bottom: BorderSide(color: Colors.grey[200]!),
                  ),
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: 3,
                  separatorBuilder: (context, index) => Divider(height: 1, color: Colors.grey[200]),
                  itemBuilder: (context, index) {
                    final isNe = context.locale.languageCode == 'ne';
                    final untitled = isNe ? "शीर्षकविहीन - ..." : "Untitled - ...";
                    final lastEdited = isNe ? "अन्तिम सम्पादन" : "Last edited";
                    final justNow = isNe ? "भर्खरै" : "Just now";
                    return _buildDraftItem(
                      context: context,
                      title: index == 0 ? untitled : (index == 1 ? untitled : "house 55"),
                      subtitle: index == 0
                        ? "$lastEdited: $justNow • Women's Fashion & Beauty"
                        : (index == 1 ? "$lastEdited: ${isNe ? '४ घण्टा अघि' : '4 hours ago'} • Property" : "$lastEdited: Jan 14 • Property"),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildDraftItem({required BuildContext context, required String title, required String subtitle}) {
    final isNe = context.locale.languageCode == 'ne';
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.grey[50],
                    side: BorderSide(color: Colors.grey[200]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    isNe ? "जारी राख्नुहोस्" : "Continue",
                    style: GoogleFonts.inter(
                      color: Colors.black87,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: BorderSide(color: Colors.red[100]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                     padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    isNe ? "हटाउनुहोस्" : "Delete",
                    style: GoogleFonts.inter(
                      color: Colors.red,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

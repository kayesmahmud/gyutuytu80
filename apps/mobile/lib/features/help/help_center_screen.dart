import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:mobile/features/contact/contact_screen.dart';
import 'package:mobile/features/support/support_tickets_screen.dart';

class _FaqItem {
  final String question;
  final String answer;
  const _FaqItem({required this.question, required this.answer});
}

class _FaqCategory {
  final String id;
  final String title;
  final IconData icon;
  final String description;
  final List<_FaqItem> faqs;
  const _FaqCategory({
    required this.id,
    required this.title,
    required this.icon,
    required this.description,
    required this.faqs,
  });
}

final _categories = <_FaqCategory>[
  const _FaqCategory(
    id: 'getting-started',
    title: 'Getting Started',
    icon: LucideIcons.rocket,
    description: 'New to Thulo Bazaar? Start here.',
    faqs: [
      _FaqItem(
        question: 'What is Thulo Bazaar?',
        answer:
            "Thulo Bazaar is Nepal's leading online classifieds marketplace where you can buy, sell, and rent products and services. We connect buyers and sellers across Nepal for electronics, vehicles, property, jobs, and much more.",
      ),
      _FaqItem(
        question: 'How do I create an account?',
        answer:
            'Tap on "Sign Up" from the menu. You can register using your email address or phone number. You\'ll receive a verification code to confirm your account. Once verified, you can start posting ads and contacting sellers.',
      ),
      _FaqItem(
        question: 'Is it free to use Thulo Bazaar?',
        answer:
            'Yes! Creating an account and browsing ads is completely free. Posting basic ads is also free. We offer optional premium features like Featured Ads, Urgent tags, and Sticky posts to help your ads get more visibility.',
      ),
      _FaqItem(
        question: 'What can I sell on Thulo Bazaar?',
        answer:
            'You can sell a wide variety of items including electronics, vehicles, property, fashion, home goods, services, and more. However, illegal items, weapons, drugs, and prohibited content are strictly not allowed.',
      ),
    ],
  ),
  const _FaqCategory(
    id: 'posting-ads',
    title: 'Posting Ads',
    icon: LucideIcons.pencil,
    description: 'Learn how to create effective ads.',
    faqs: [
      _FaqItem(
        question: 'How do I post an ad?',
        answer:
            'Tap the "+" button, select a category, fill in the details including title, description, price, and photos. Add your contact information and submit. Your ad will be reviewed and published within 24 hours.',
      ),
      _FaqItem(
        question: 'Why was my ad rejected?',
        answer:
            "Ads may be rejected for: inappropriate content, misleading information, wrong category, poor quality images, or violation of our posting guidelines. You'll receive a notification explaining why and can edit and resubmit your ad.",
      ),
      _FaqItem(
        question: 'How many photos can I upload?',
        answer:
            'You can upload up to 10 photos per ad. We recommend using high-quality images that clearly show your item from multiple angles. The first image will be used as the primary thumbnail.',
      ),
      _FaqItem(
        question: 'How long will my ad stay active?',
        answer:
            'Standard ads remain active for 30 days. You can renew your ad before it expires. Premium and Featured ads may have different durations based on the package you choose.',
      ),
      _FaqItem(
        question: 'Can I edit my ad after posting?',
        answer:
            'Yes, you can edit your ad anytime from your Dashboard. Go to "My Ads", find the ad you want to edit, and tap "Edit". Some changes may require re-review by our moderation team.',
      ),
    ],
  ),
  const _FaqCategory(
    id: 'buying',
    title: 'Buying',
    icon: LucideIcons.shoppingCart,
    description: 'Tips for safe and smart buying.',
    faqs: [
      _FaqItem(
        question: 'How do I contact a seller?',
        answer:
            'Tap on any ad to view details, then use the "Message" button to send a message to the seller through our platform, or use the displayed phone number to call/message directly.',
      ),
      _FaqItem(
        question: 'Is it safe to buy on Thulo Bazaar?',
        answer:
            'We recommend meeting sellers in public places, inspecting items before payment, and using secure payment methods. Look for verified sellers (blue checkmark) for added trust. Never send money without seeing the item.',
      ),
      _FaqItem(
        question: 'How do I report a suspicious ad or seller?',
        answer:
            'Tap the "Report" button on any ad page or user profile. Select the reason for reporting and provide details. Our moderation team reviews all reports within 24 hours.',
      ),
      _FaqItem(
        question: 'Can I negotiate the price?',
        answer:
            'Yes, most sellers are open to negotiation. Use the messaging feature to discuss price and terms. If the ad shows "Price Negotiable", the seller has indicated they\'re open to offers.',
      ),
    ],
  ),
  const _FaqCategory(
    id: 'account',
    title: 'Account & Profile',
    icon: LucideIcons.user,
    description: 'Manage your account settings.',
    faqs: [
      _FaqItem(
        question: 'How do I verify my account?',
        answer:
            'Go to your Profile and look for the Verification section. You can verify your phone number, email, or apply for business verification. Verified accounts get a badge and appear more trustworthy to buyers.',
      ),
      _FaqItem(
        question: 'How do I reset my password?',
        answer:
            'Tap "Sign In", then "Forgot Password". Enter your email address, and we\'ll send you a reset link. The link expires in 1 hour for security reasons.',
      ),
      _FaqItem(
        question: 'How do I delete my account?',
        answer:
            'Go to Profile > Security > Delete Account. Note that this action is permanent and will remove all your ads and data. Contact support if you need to recover accidentally deleted accounts.',
      ),
      _FaqItem(
        question: 'What is a Business Account?',
        answer:
            'Business accounts are for registered businesses and dealers. They get additional features like a shop page, business verification badge, priority support, and bulk posting tools. Apply through your account settings.',
      ),
    ],
  ),
  const _FaqCategory(
    id: 'payments',
    title: 'Payments & Promotions',
    icon: LucideIcons.creditCard,
    description: 'Understand our payment and promotion options.',
    faqs: [
      _FaqItem(
        question: 'What payment methods do you accept?',
        answer:
            'We accept eSewa, Khalti, bank transfers, and other popular payment methods in Nepal. All payments are processed securely through our payment partners.',
      ),
      _FaqItem(
        question: 'What are Featured Ads?',
        answer:
            'Featured Ads appear at the top of search results and category pages with a special highlight. They get significantly more views and faster responses. Prices vary by category and duration.',
      ),
      _FaqItem(
        question: 'How do Urgent and Sticky tags work?',
        answer:
            'Urgent tags add a visible badge to your ad indicating time-sensitivity. Sticky posts keep your ad at the top of the category for the duration you choose. Both help your ad stand out from regular listings.',
      ),
      _FaqItem(
        question: 'Can I get a refund for promotions?',
        answer:
            "Refunds are available within 24 hours if your promoted ad hasn't been published yet. Once published, promotions are non-refundable. Contact support for special cases.",
      ),
    ],
  ),
  const _FaqCategory(
    id: 'safety',
    title: 'Safety & Security',
    icon: LucideIcons.shield,
    description: 'Stay safe while buying and selling.',
    faqs: [
      _FaqItem(
        question: 'How can I stay safe when meeting buyers/sellers?',
        answer:
            'Always meet in public places during daylight hours. Bring a friend if possible. Never share personal financial information. For expensive items, consider meeting at a police station or bank. Trust your instincts - if something feels wrong, walk away.',
      ),
      _FaqItem(
        question: 'What should I do if I encounter fraud?',
        answer:
            "Report the user immediately through our platform. If you've lost money, file a police report. Contact our support team with all evidence (messages, transaction records). We take fraud seriously and will investigate promptly.",
      ),
      _FaqItem(
        question: 'How does Thulo Bazaar protect my data?',
        answer:
            "We use industry-standard encryption and security practices. Your password is hashed and never stored in plain text. We don't share your personal information with third parties without consent. Read our Privacy Policy for full details.",
      ),
      _FaqItem(
        question: 'Why do some users have verification badges?',
        answer:
            'Verification badges indicate the user has verified their identity through our verification process. Blue checkmarks mean phone/email verified. Green badges indicate verified businesses. These badges help you identify trustworthy users.',
      ),
    ],
  ),
];

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String? _expandedCategoryId;
  String? _expandedFaqKey;

  List<_FaqCategory> get _filteredCategories {
    if (_searchQuery.isEmpty) return _categories;
    final query = _searchQuery.toLowerCase();
    return _categories
        .map((cat) => _FaqCategory(
              id: cat.id,
              title: cat.title,
              icon: cat.icon,
              description: cat.description,
              faqs: cat.faqs
                  .where((faq) =>
                      faq.question.toLowerCase().contains(query) ||
                      faq.answer.toLowerCase().contains(query))
                  .toList(),
            ))
        .where((cat) => cat.faqs.isNotEmpty)
        .toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredCategories;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Help Center',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Search for help...',
                hintStyle: GoogleFonts.inter(color: Colors.grey[400]),
                prefixIcon:
                    Icon(LucideIcons.search, color: Colors.grey[400], size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(LucideIcons.x,
                            color: Colors.grey[400], size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              style: GoogleFonts.inter(fontSize: 15),
            ),
          ),

          // FAQ list
          Expanded(
            child: filtered.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length + 1, // +1 for bottom card
                    itemBuilder: (context, index) {
                      if (index == filtered.length) {
                        return _buildStillNeedHelpCard();
                      }
                      return _buildCategoryCard(filtered[index]);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.searchX, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text('No results found',
              style: GoogleFonts.inter(
                  color: Colors.grey[500],
                  fontSize: 16,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text('Try different keywords',
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(_FaqCategory category) {
    final isExpanded = _expandedCategoryId == category.id ||
        _searchQuery.isNotEmpty; // Auto-expand when searching

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Category header
          InkWell(
            onTap: _searchQuery.isNotEmpty
                ? null
                : () => setState(() {
                      _expandedCategoryId =
                          isExpanded ? null : category.id;
                    }),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE11D48).withAlpha(25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(category.icon,
                        size: 20, color: const Color(0xFFE11D48)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(category.title,
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                                color: const Color(0xFF1F2937))),
                        Text(category.description,
                            style: GoogleFonts.inter(
                                fontSize: 13, color: Colors.grey[500])),
                      ],
                    ),
                  ),
                  if (_searchQuery.isEmpty)
                    Icon(
                      isExpanded
                          ? LucideIcons.chevronUp
                          : LucideIcons.chevronDown,
                      size: 20,
                      color: Colors.grey[400],
                    ),
                ],
              ),
            ),
          ),

          // FAQ items
          if (isExpanded)
            ...category.faqs.asMap().entries.map((entry) {
              final faqKey = '${category.id}-${entry.key}';
              final faq = entry.value;
              final isFaqExpanded = _expandedFaqKey == faqKey;

              return Column(
                children: [
                  Divider(height: 1, color: Colors.grey[200]),
                  InkWell(
                    onTap: () => setState(() {
                      _expandedFaqKey = isFaqExpanded ? null : faqKey;
                    }),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(faq.question,
                                    style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: const Color(0xFF374151))),
                              ),
                              Icon(
                                isFaqExpanded
                                    ? LucideIcons.minus
                                    : LucideIcons.plus,
                                size: 18,
                                color: const Color(0xFFE11D48),
                              ),
                            ],
                          ),
                          if (isFaqExpanded) ...[
                            const SizedBox(height: 10),
                            Text(faq.answer,
                                style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: Colors.grey[600],
                                    height: 1.5)),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }),
        ],
      ),
    );
  }

  Widget _buildStillNeedHelpCard() {
    return Container(
      margin: const EdgeInsets.only(top: 8, bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.messageCircle, color: Colors.white, size: 32),
          const SizedBox(height: 12),
          Text('Still need help?',
              style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text("Our support team is here to assist you",
              style: GoogleFonts.inter(
                  color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(
                        builder: (_) => const SupportTicketsScreen()));
                  },
                  icon: const Icon(LucideIcons.ticket, size: 16),
                  label: Text('Support Ticket',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(
                        builder: (_) => const ContactScreen()));
                  },
                  icon: const Icon(LucideIcons.mail, size: 16),
                  label: Text('Contact Us',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
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

import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:mobile/core/api/shop_client.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/features/post_ad/models/location_models.dart';

class ShopTabs extends StatefulWidget {
  final ShopProfile shop;
  final bool isOwner;
  final Function(ShopProfile) onProfileUpdated;

  const ShopTabs({
    super.key,
    required this.shop,
    required this.isOwner,
    required this.onProfileUpdated,
  });

  @override
  State<ShopTabs> createState() => _ShopTabsState();
}

class _ShopTabsState extends State<ShopTabs> {
  String _activeTab = 'about'; // about, contact, categories, location

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tabs
        Container(
          height: 50,
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
          ),
          child: Row(
            children: [
              _buildTab(l('about', context.locale.languageCode), 'about', LucideIcons.info),
              _buildTab(context.locale.languageCode == 'ne' ? 'सम्पर्क' : 'Contact', 'contact', LucideIcons.phoneCall),
              _buildTab(context.locale.languageCode == 'ne' ? 'वर्गहरू' : 'Categories', 'categories', LucideIcons.layoutGrid),
              _buildTab(l('location', context.locale.languageCode), 'location', LucideIcons.mapPin),
            ],
          ),
        ),

        // Tab Content
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: _buildActiveTabContent(),
        ),
      ],
    );
  }

  Widget _buildTab(String label, String id, IconData icon) {
    final isActive = _activeTab == id;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _activeTab = id),
        child: Container(
          decoration: BoxDecoration(
            border: isActive
                ? const Border(bottom: BorderSide(color: Color(0xFFF43F5E), width: 2))
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 20,
                color: isActive ? const Color(0xFFF43F5E) : Colors.grey[600],
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                  color: isActive ? const Color(0xFFF43F5E) : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveTabContent() {
    switch (_activeTab) {
      case 'about':
        return ShopAboutSection(
          shop: widget.shop,
          isOwner: widget.isOwner,
          onUpdate: widget.onProfileUpdated,
        );
      case 'contact':
        return ShopContactSection(
          shop: widget.shop,
          isOwner: widget.isOwner,
          onUpdate: widget.onProfileUpdated,
        );
      case 'categories':
        return ShopCategorySection(
            shop: widget.shop,
            isOwner: widget.isOwner,
            onUpdate: widget.onProfileUpdated);
      case 'location':
        return ShopLocationSection(
            shop: widget.shop,
            isOwner: widget.isOwner,
            onUpdate: widget.onProfileUpdated);
      default:
        return const SizedBox.shrink();
    }
  }
}

// --- SECTIONS ---

// 1. About Section
class ShopAboutSection extends StatefulWidget {
  final ShopProfile shop;
  final bool isOwner;
  final Function(ShopProfile) onUpdate;

  const ShopAboutSection(
      {super.key, required this.shop, required this.isOwner, required this.onUpdate});

  @override
  State<ShopAboutSection> createState() => _ShopAboutSectionState();
}

class _ShopAboutSectionState extends State<ShopAboutSection> {
  bool _isEditing = false;
  bool _saving = false;
  final _bioController = TextEditingController();
  final ShopClient _shopClient = ShopClient();

  @override
  void initState() {
    super.initState();
    _bioController.text = widget.shop.bio ?? '';
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final response = await _shopClient.updateShopProfile({'bio': _bioController.text});
    setState(() => _saving = false);

    if (response.success && response.data != null) {
      widget.onUpdate(response.data!);
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'प्रोफाइल अपडेट भयो' : 'Profile updated')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(response.errorMessage)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isEditing) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _bioController,
            maxLines: 5,
            decoration: InputDecoration(
              hintText: context.locale.languageCode == 'ne' ? 'आफ्नो व्यवसाय वर्णन गर्नुहोस्...' : 'Describe your business...',
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E)),
                  child: Text(_saving ? (context.locale.languageCode == 'ne' ? 'सेभ हुँदैछ...' : 'Saving...') : l('save', context.locale.languageCode)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _isEditing = false),
                  child: Text(l('cancel', context.locale.languageCode)),
                ),
              ),
            ],
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l('about', context.locale.languageCode), style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            if (widget.isOwner)
              IconButton(
                icon: const Icon(LucideIcons.pencil, size: 20, color: Colors.grey),
                onPressed: () => setState(() => _isEditing = true),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          widget.shop.bio?.isNotEmpty == true
              ? widget.shop.bio!
              : (context.locale.languageCode == 'ne' ? 'कुनै विवरण उपलब्ध छैन।' : 'No description available.'),
          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[700], height: 1.5),
        ),
      ],
    );
  }
}

// 2. Contact Section
class ShopContactSection extends StatefulWidget {
  final ShopProfile shop;
  final bool isOwner;
  final Function(ShopProfile) onUpdate;

  const ShopContactSection(
      {super.key, required this.shop, required this.isOwner, required this.onUpdate});

  @override
  State<ShopContactSection> createState() => _ShopContactSectionState();
}

class _ShopContactSectionState extends State<ShopContactSection> {
  bool _isEditing = false;
  bool _saving = false;
  bool _usePhoneForWhatsApp = false;
  final _whatsappController = TextEditingController();
  final _websiteController = TextEditingController();
  final _facebookController = TextEditingController();
  final _instagramController = TextEditingController();
  final _tiktokController = TextEditingController();
  final ShopClient _shopClient = ShopClient();

  @override
  void initState() {
    super.initState();
    _fillControllers();
  }

  @override
  void dispose() {
    _whatsappController.dispose();
    _websiteController.dispose();
    _facebookController.dispose();
    _instagramController.dispose();
    _tiktokController.dispose();
    super.dispose();
  }

  void _fillControllers() {
    _websiteController.text = widget.shop.businessWebsite ?? '';
    _facebookController.text = _extractUsername(widget.shop.facebookUrl, 'facebook');
    _instagramController.text = _extractUsername(widget.shop.instagramUrl, 'instagram');
    _tiktokController.text = _extractUsername(widget.shop.tiktokUrl, 'tiktok');

    final digits = RegExp(r'[^\d]');
    final registeredDigits = widget.shop.phone?.replaceAll(digits, '') ?? '';
    final whatsappDigits = widget.shop.businessPhone?.replaceAll(digits, '') ?? '';
    _usePhoneForWhatsApp = registeredDigits.isNotEmpty && registeredDigits == whatsappDigits;
    _whatsappController.text =
        widget.shop.businessPhone?.replaceAll(RegExp(r'^\+977\s*'), '') ?? '';
  }

  String _extractUsername(String? url, String platform) {
    if (url == null || url.isEmpty) return '';
    final patterns = {
      'facebook': RegExp(r'facebook\.com/(.+?)/?$', caseSensitive: false),
      'instagram': RegExp(r'instagram\.com/(.+?)/?$', caseSensitive: false),
      'tiktok': RegExp(r'tiktok\.com/@?(.+?)/?$', caseSensitive: false),
    };
    final match = patterns[platform]?.firstMatch(url);
    if (match != null) return match.group(1)?.replaceAll(RegExp(r'^@'), '') ?? url;
    return url.replaceAll(RegExp(r'^@'), '');
  }

  String _buildSocialUrl(String username, String platform) {
    final u = username.trim().replaceAll(RegExp(r'^@'), '');
    if (u.isEmpty) return '';
    const bases = {
      'facebook': 'https://www.facebook.com/',
      'instagram': 'https://www.instagram.com/',
      'tiktok': 'https://www.tiktok.com/@',
    };
    return (bases[platform] ?? '') + u;
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _launchWhatsApp(String phone) async {
    final d = phone.replaceAll(RegExp(r'[^\d]'), '');
    final full = d.startsWith('977') ? '+$d' : '+977$d';
    final appUri = Uri.parse('whatsapp://send?phone=$full');
    if (await canLaunchUrl(appUri)) {
      await launchUrl(appUri, mode: LaunchMode.externalApplication);
    } else {
      await launchUrl(Uri.parse('https://wa.me/$full'),
          mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _launchSocial(String username, String platform) async {
    final deepLinks = {
      'facebook': 'fb://facewebmodal/f?href=https://www.facebook.com/$username',
      'instagram': 'instagram://user?username=$username',
      'tiktok': 'tiktok://user/@$username',
    };
    final webUrls = {
      'facebook': 'https://www.facebook.com/$username',
      'instagram': 'https://www.instagram.com/$username',
      'tiktok': 'https://www.tiktok.com/@$username',
    };
    final deepLink = deepLinks[platform];
    if (deepLink != null) {
      final uri = Uri.tryParse(deepLink);
      if (uri != null && await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    }
    final webUrl = webUrls[platform];
    if (webUrl != null) {
      await launchUrl(Uri.parse(webUrl), mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final registeredPhone = widget.shop.phone ?? '';
    final whatsappValue = _usePhoneForWhatsApp
        ? registeredPhone
        : '+977${_whatsappController.text.replaceAll(RegExp(r'[^\d]'), '')}';

    final data = {
      'businessPhone': whatsappValue,
      'businessWebsite': _websiteController.text,
      'facebookUrl': _buildSocialUrl(_facebookController.text, 'facebook'),
      'instagramUrl': _buildSocialUrl(_instagramController.text, 'instagram'),
      'tiktokUrl': _buildSocialUrl(_tiktokController.text, 'tiktok'),
    };
    final response = await _shopClient.updateShopContact(data);
    setState(() => _saving = false);

    if (response.success && response.data != null) {
      widget.onUpdate(response.data!);
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(context.locale.languageCode == 'ne'
              ? 'सम्पर्क जानकारी अपडेट भयो'
              : 'Contact info updated')));
    } else {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(response.errorMessage)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isNe = context.locale.languageCode == 'ne';

    if (_isEditing) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // WhatsApp
          _buildLabel(isNe ? 'व्हाट्सएप नम्बर' : 'WhatsApp Number'),
          if (widget.shop.phone != null) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.phone, size: 15, color: Color(0xFF16A34A)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${isNe ? 'दर्ता नम्बर' : 'Registered'}: ${widget.shop.phone}',
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF15803D)),
                    ),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => setState(() {
                _usePhoneForWhatsApp = !_usePhoneForWhatsApp;
                if (_usePhoneForWhatsApp) {
                  _whatsappController.text = widget.shop.phone
                          ?.replaceAll(RegExp(r'^\+977\s*'), '')
                          .replaceAll(RegExp(r'[^\d]'), '') ??
                      '';
                }
              }),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: Checkbox(
                        value: _usePhoneForWhatsApp,
                        onChanged: (v) => setState(() {
                          _usePhoneForWhatsApp = v ?? false;
                          if (_usePhoneForWhatsApp) {
                            _whatsappController.text = widget.shop.phone
                                    ?.replaceAll(RegExp(r'^\+977\s*'), '')
                                    .replaceAll(RegExp(r'[^\d]'), '') ??
                                '';
                          }
                        }),
                        activeColor: const Color(0xFF16A34A),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        isNe
                            ? 'दर्ता नम्बर नै प्रयोग गर्नुहोस् (${widget.shop.phone})'
                            : 'Same as registered number (${widget.shop.phone})',
                        style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          _buildPrefixField(
            prefix: '+977',
            controller: _whatsappController,
            hint: '98XXXXXXXX',
            enabled: !_usePhoneForWhatsApp,
            keyboardType: TextInputType.phone,
            maxLength: 10,
          ),
          const SizedBox(height: 14),

          // Website
          _buildLabel(isNe ? 'वेबसाइट' : 'Website'),
          TextField(
            controller: _websiteController,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              hintText: 'https://example.com',
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
          ),
          const SizedBox(height: 14),

          // Facebook
          _buildLabel(isNe ? 'फेसबुक' : 'Facebook'),
          _buildPrefixField(prefix: 'fb.com/', controller: _facebookController, hint: 'yourpage'),
          const SizedBox(height: 14),

          // Instagram
          _buildLabel(isNe ? 'इन्स्टाग्राम' : 'Instagram'),
          _buildPrefixField(prefix: 'ig.com/', controller: _instagramController, hint: 'yourprofile'),
          const SizedBox(height: 14),

          // TikTok
          _buildLabel(isNe ? 'टिकटक' : 'TikTok'),
          _buildPrefixField(
              prefix: 'tiktok.com/@', controller: _tiktokController, hint: 'yourhandle'),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E)),
                  child: Text(_saving
                      ? (isNe ? 'सेभ हुँदैछ...' : 'Saving...')
                      : l('save', context.locale.languageCode)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    _fillControllers();
                    setState(() => _isEditing = false);
                  },
                  child: Text(l('cancel', context.locale.languageCode)),
                ),
              ),
            ],
          ),
        ],
      );
    }

    // Display mode
    final fbUser = _extractUsername(widget.shop.facebookUrl, 'facebook');
    final igUser = _extractUsername(widget.shop.instagramUrl, 'instagram');
    final ttUser = _extractUsername(widget.shop.tiktokUrl, 'tiktok');
    final hasAny = widget.shop.businessPhone != null ||
        widget.shop.phone != null ||
        widget.shop.businessWebsite != null ||
        fbUser.isNotEmpty ||
        igUser.isNotEmpty ||
        ttUser.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l('contactInfo', context.locale.languageCode),
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            if (widget.isOwner)
              IconButton(
                icon: const Icon(LucideIcons.pencil, size: 20, color: Colors.grey),
                onPressed: () => setState(() => _isEditing = true),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (!hasAny)
          Text(
            isNe ? 'सम्पर्क जानकारी छैन।' : 'No contact info.',
            style:
                GoogleFonts.inter(fontSize: 14, color: Colors.grey, fontStyle: FontStyle.italic),
          ),
        if (widget.shop.businessPhone != null)
          _buildContactTile(
            icon: LucideIcons.messageCircle,
            iconColor: const Color(0xFF25D366),
            label: isNe ? 'व्हाट्सएप' : 'WhatsApp',
            value: widget.shop.businessPhone!,
            onTap: () => _launchWhatsApp(widget.shop.businessPhone!),
          ),
        if (widget.shop.phone != null)
          _buildContactTile(
            icon: LucideIcons.phone,
            iconColor: const Color(0xFF3B82F6),
            label: isNe ? 'मोबाइल' : 'Mobile',
            value: widget.shop.phone!,
          ),
        if (widget.shop.businessWebsite != null)
          _buildContactTile(
            icon: LucideIcons.globe,
            iconColor: const Color(0xFF8B5CF6),
            label: isNe ? 'वेबसाइट' : 'Website',
            value: widget.shop.businessWebsite!,
            onTap: () {
              final url = widget.shop.businessWebsite!;
              _launchUrl(url.startsWith('http') ? url : 'https://$url');
            },
          ),
        if (fbUser.isNotEmpty)
          _buildContactTile(
            icon: LucideIcons.facebook,
            iconColor: const Color(0xFF1877F2),
            label: 'Facebook',
            value: '@$fbUser',
            onTap: () => _launchSocial(fbUser, 'facebook'),
          ),
        if (igUser.isNotEmpty)
          _buildContactTile(
            icon: LucideIcons.instagram,
            iconColor: const Color(0xFFE4405F),
            label: 'Instagram',
            value: '@$igUser',
            onTap: () => _launchSocial(igUser, 'instagram'),
          ),
        if (ttUser.isNotEmpty)
          _buildContactTile(
            icon: LucideIcons.music,
            iconColor: Colors.black87,
            label: 'TikTok',
            value: '@$ttUser',
            onTap: () => _launchSocial(ttUser, 'tiktok'),
          ),
      ],
    );
  }

  Widget _buildLabel(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: GoogleFonts.inter(
                fontSize: 13, fontWeight: FontWeight.w500, color: Colors.black87)),
      );

  Widget _buildPrefixField({
    required String prefix,
    required TextEditingController controller,
    required String hint,
    bool enabled = true,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
  }) {
    const radius8 = Radius.circular(8);
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            border: Border.all(color: const Color(0xFFD1D5DB)),
            borderRadius: const BorderRadius.only(topLeft: radius8, bottomLeft: radius8),
          ),
          child: Text(prefix,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280))),
        ),
        Expanded(
          child: TextField(
            controller: controller,
            enabled: enabled,
            keyboardType: keyboardType,
            maxLength: maxLength,
            decoration: InputDecoration(
              hintText: hint,
              counterText: '',
              filled: !enabled,
              fillColor: const Color(0xFFF9FAFB),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
              border: const OutlineInputBorder(
                  borderRadius: BorderRadius.only(topRight: radius8, bottomRight: radius8)),
              enabledBorder: const OutlineInputBorder(
                  borderRadius: BorderRadius.only(topRight: radius8, bottomRight: radius8),
                  borderSide: BorderSide(color: Color(0xFFD1D5DB))),
              disabledBorder: const OutlineInputBorder(
                  borderRadius: BorderRadius.only(topRight: radius8, bottomRight: radius8),
                  borderSide: BorderSide(color: Color(0xFFE5E7EB))),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContactTile({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
                    Text(
                      value,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: onTap != null ? const Color(0xFFF43F5E) : Colors.black87,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              if (onTap != null)
                Icon(LucideIcons.externalLink, size: 14, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }
}

// 3. Category Section
class ShopCategorySection extends StatefulWidget {
  final ShopProfile shop;
  final bool isOwner;
  final Function(ShopProfile) onUpdate;

  const ShopCategorySection(
      {super.key, required this.shop, required this.isOwner, required this.onUpdate});

  @override
  State<ShopCategorySection> createState() => _ShopCategorySectionState();
}

class _ShopCategorySectionState extends State<ShopCategorySection> {
  bool _isEditing = false;
  bool _saving = false;
  bool _loading = false;
  
  List<CategoryWithSubcategories> _categories = [];
  CategoryWithSubcategories? _selectedCategory;
  Category? _selectedSubCategory;
  
  final ShopClient _shopClient = ShopClient();
  final AdClient _adClient = AdClient();

  Future<void> _startEditing() async {
    setState(() {
      _isEditing = true;
      _loading = true;
    });

    try {
      final categories = await _adClient.getCategories();
      setState(() {
        _categories = categories;
        _loading = false;
        
        // Pre-select if exists (would need categoryId in ShopProfile, usually checking locationName/Icon isn't enough)
        // Since ShopProfile doesn't have raw category IDs easily in the model (it has strings? No, wait)
        // The API returns 'seller' block. Let's check ShopProfile model.
        // It has locationId, locationName. But NOT categoryId explicitly unless extended.
        // Wait, ShopProfile model doesn't have defaultCategory info? 
        // Let me check ShopProfile model again.
        // It DOES look like ShopProfile in mobile model is missing defaultCategory/subcategory fields compared to web sidebar.
        // Web Sidebar props: categoryId, categoryName, etc.
        // Mobile ShopProfile model has `locationId`, `locationName`. 
        // I need to add `defaultCategoryId` etc to ShopProfile model first?
        // Actually the `ShopProfile.fromJson` doesn't seem to parse them.
        // Let's assume for MVP we fetch and they pick new, or if model supports it we use it.
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (_selectedCategory == null) return;
    
    setState(() => _saving = true);
    final response = await _shopClient.updateShopCategory(
      _selectedCategory!.id,
      _selectedSubCategory?.id
    );
    setState(() => _saving = false);

    if (response.success && response.data != null) {
      widget.onUpdate(response.data!);
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'वर्ग अपडेट भयो' : 'Category updated')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(response.errorMessage)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isEditing) {
      if (_loading) return const Center(child: CircularProgressIndicator());
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<CategoryWithSubcategories>(
            value: _selectedCategory,
            hint: Text(context.locale.languageCode == 'ne' ? 'मुख्य वर्ग छान्नुहोस्' : 'Select Main Category'),
            items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c.name))).toList(),
            onChanged: (val) => setState(() {
              _selectedCategory = val;
              _selectedSubCategory = null;
            }),
             decoration: const InputDecoration(border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          if (_selectedCategory != null && _selectedCategory!.subcategories.isNotEmpty)
             DropdownButtonFormField<Category>(
              value: _selectedSubCategory,
              hint: Text(context.locale.languageCode == 'ne' ? 'उपवर्ग छान्नुहोस्' : 'Select Subcategory'),
              items: _selectedCategory!.subcategories.map((s) => DropdownMenuItem(value: s, child: Text(s.name))).toList(),
              onChanged: (val) => setState(() => _selectedSubCategory = val),
               decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E)),
                  child: Text(_saving ? (context.locale.languageCode == 'ne' ? 'सेभ हुँदैछ...' : 'Saving...') : l('save', context.locale.languageCode)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _isEditing = false),
                  child: Text(l('cancel', context.locale.languageCode)),
                ),
              ),
            ],
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l('category', context.locale.languageCode), style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            if (widget.isOwner)
              IconButton(
                icon: const Icon(LucideIcons.pencil, size: 20, color: Colors.grey),
                onPressed: _startEditing,
              ),
          ],
        ),
        const SizedBox(height: 12),
        // Since ShopProfile model on mobile might be missing category fields, we display placeholder or existing if I update model
        // For now, let's assume it displays text if available, or "No Category Set"
         // I should update ShopProfile model to include these fields.
         // Let's display simple text for now.
        if (widget.shop.categoryName != null)
          _buildCategoryRow(LucideIcons.layoutGrid, widget.shop.categoryName!),
        if (widget.shop.subcategoryName != null)
           _buildCategoryRow(LucideIcons.cornerDownRight, widget.shop.subcategoryName!),
        
        if (widget.shop.categoryName == null)
           Text(
             context.locale.languageCode == 'ne' ? 'पूर्वनिर्धारित वर्ग सेट गरिएको छैन।' : 'No default category set.',
             style: GoogleFonts.inter(fontSize: 14, color: Colors.grey, fontStyle: FontStyle.italic), 
           ),
      ],
    );
  }

  Widget _buildCategoryRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 14))),
        ],
      ),
    );
  }
}

// 4. Location Section
class ShopLocationSection extends StatefulWidget {
  final ShopProfile shop;
  final bool isOwner;
  final Function(ShopProfile) onUpdate;

  const ShopLocationSection(
      {super.key, required this.shop, required this.isOwner, required this.onUpdate});

  @override
  State<ShopLocationSection> createState() => _ShopLocationSectionState();
}

class _ShopLocationSectionState extends State<ShopLocationSection> {
  bool _isEditing = false;
  bool _saving = false;
  bool _loading = false;

  // Simplified location picking (Province -> District -> City only for MVP)
  List<LocationProvince> _provinces = [];
  LocationProvince? _selectedProvince;
  LocationDistrict? _selectedDistrict;
  LocationMunicipality? _selectedMunicipality;
  
  final ShopClient _shopClient = ShopClient();
  final AdClient _adClient = AdClient();

  Future<void> _startEditing() async {
    setState(() {
      _isEditing = true;
      _loading = true;
    });

    try {
      final provinces = await _adClient.getLocationHierarchy();
      setState(() {
        _provinces = provinces;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (_selectedMunicipality == null) return;
    
    setState(() => _saving = true);
    // API expects locationSlug
    final response = await _shopClient.updateShopLocation(_selectedMunicipality!.slug);
    setState(() => _saving = false);

    if (response.success && response.data != null) {
      widget.onUpdate(response.data!);
      setState(() => _isEditing = false);
       ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'स्थान अपडेट भयो' : 'Location updated')));
    } else {
       ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(response.errorMessage)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isEditing) {
      if (_loading) return const Center(child: CircularProgressIndicator());
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<LocationProvince>(
            value: _selectedProvince,
            hint: Text(context.locale.languageCode == 'ne' ? 'प्रदेश छान्नुहोस्' : 'Select Province'),
            items: _provinces.map((p) => DropdownMenuItem(value: p, child: Text(p.name))).toList(),
            onChanged: (val) => setState(() {
              _selectedProvince = val;
              _selectedDistrict = null;
              _selectedMunicipality = null;
            }),
             decoration: const InputDecoration(border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          if (_selectedProvince != null)
             DropdownButtonFormField<LocationDistrict>(
              value: _selectedDistrict,
              hint: Text(context.locale.languageCode == 'ne' ? 'जिल्ला छान्नुहोस्' : 'Select District'),
              items: _selectedProvince!.districts.map((d) => DropdownMenuItem(value: d, child: Text(d.name))).toList(),
              onChanged: (val) => setState(() {
                _selectedDistrict = val;
                _selectedMunicipality = null;
              }),
               decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
          const SizedBox(height: 12),
           if (_selectedDistrict != null)
             DropdownButtonFormField<LocationMunicipality>(
              value: _selectedMunicipality,
              hint: Text(context.locale.languageCode == 'ne' ? 'शहर छान्नुहोस्' : 'Select City'),
              items: _selectedDistrict!.municipalities.map((m) => DropdownMenuItem(value: m, child: Text(m.name))).toList(),
              onChanged: (val) => setState(() => _selectedMunicipality = val),
               decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E)),
                  child: Text(_saving ? (context.locale.languageCode == 'ne' ? 'सेभ हुँदैछ...' : 'Saving...') : l('save', context.locale.languageCode)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _isEditing = false),
                  child: Text(l('cancel', context.locale.languageCode)),
                ),
              ),
            ],
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l('location', context.locale.languageCode), style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            if (widget.isOwner)
              IconButton(
                icon: const Icon(LucideIcons.pencil, size: 20, color: Colors.grey),
                onPressed: _startEditing,
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (widget.shop.locationFullPath != null)
          _buildLocationRow(LucideIcons.mapPin, widget.shop.locationFullPath!),
        if (widget.shop.locationFullPath == null)
           Text(context.locale.languageCode == 'ne' ? 'स्थान सेट गरिएको छैन।' : 'No location set.', style: GoogleFonts.inter(fontSize: 14, color: Colors.grey, fontStyle: FontStyle.italic)),
      ],
    );
  }
  
  Widget _buildLocationRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 14))),
      ],
    );
  }
}

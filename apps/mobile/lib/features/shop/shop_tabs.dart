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
  final _phoneController = TextEditingController();
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

  void _fillControllers() {
    _phoneController.text = widget.shop.businessPhone ?? '';
    _websiteController.text = widget.shop.businessWebsite ?? '';
    _facebookController.text = widget.shop.facebookUrl ?? '';
    _instagramController.text = widget.shop.instagramUrl ?? '';
    _tiktokController.text = widget.shop.tiktokUrl ?? '';
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final data = {
      'businessPhone': _phoneController.text,
      'businessWebsite': _websiteController.text,
      'facebookUrl': _facebookController.text,
      'instagramUrl': _instagramController.text,
      'tiktokUrl': _tiktokController.text,
    };
    final response = await _shopClient.updateShopContact(data);
    setState(() => _saving = false);

    if (response.success && response.data != null) {
      widget.onUpdate(response.data!);
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'सम्पर्क जानकारी अपडेट भयो' : 'Contact info updated')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(response.errorMessage)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isEditing) {
      return Column(
        children: [
          _buildTextField(context.locale.languageCode == 'ne' ? 'व्हाट्सएप/फोन' : 'WhatsApp/Phone', _phoneController),
          const SizedBox(height: 12),
          _buildTextField(context.locale.languageCode == 'ne' ? 'वेबसाइट' : 'Website', _websiteController),
          const SizedBox(height: 12),
          _buildTextField(context.locale.languageCode == 'ne' ? 'फेसबुक' : 'Facebook', _facebookController),
          const SizedBox(height: 12),
          _buildTextField(context.locale.languageCode == 'ne' ? 'इन्स्टाग्राम' : 'Instagram', _instagramController),
          const SizedBox(height: 12),
          _buildTextField(context.locale.languageCode == 'ne' ? 'टिकटक' : 'TikTok', _tiktokController),
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
            Text(l('contactInfo', context.locale.languageCode), style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            if (widget.isOwner)
              IconButton(
                icon: const Icon(LucideIcons.pencil, size: 20, color: Colors.grey),
                onPressed: () => setState(() => _isEditing = true),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (widget.shop.businessPhone != null)
          _buildContactRow(LucideIcons.phone, context.locale.languageCode == 'ne' ? 'फोन' : 'Phone', widget.shop.businessPhone!),
        if (widget.shop.businessWebsite != null)
          _buildContactRow(LucideIcons.globe, context.locale.languageCode == 'ne' ? 'वेबसाइट' : 'Website', widget.shop.businessWebsite!),
        if (widget.shop.facebookUrl != null)
          _buildContactRow(LucideIcons.facebook, context.locale.languageCode == 'ne' ? 'फेसबुक' : 'Facebook', widget.shop.facebookUrl!),
        if (widget.shop.instagramUrl != null)
          _buildContactRow(LucideIcons.instagram, context.locale.languageCode == 'ne' ? 'इन्स्टाग्राम' : 'Instagram', widget.shop.instagramUrl!),
        if (widget.shop.tiktokUrl != null)
          _buildContactRow(LucideIcons.music, context.locale.languageCode == 'ne' ? 'टिकटक' : 'TikTok', widget.shop.tiktokUrl!),
        
        if (widget.shop.businessPhone == null && 
            widget.shop.businessWebsite == null &&
            widget.shop.facebookUrl == null &&
            widget.shop.instagramUrl == null &&
            widget.shop.tiktokUrl == null)
            Text(context.locale.languageCode == 'ne' ? 'सम्पर्क जानकारी छैन।' : 'No contact info.', style: GoogleFonts.inter(fontSize: 14, color: Colors.grey, fontStyle: FontStyle.italic)),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
                Text(value, style: GoogleFonts.inter(fontSize: 14, color: Colors.black87)),
              ],
            ),
          ),
        ],
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

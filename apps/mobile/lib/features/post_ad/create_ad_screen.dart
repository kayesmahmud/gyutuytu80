import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:dio/dio.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/api/location_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/services/analytics_service.dart';
import 'package:mobile/core/services/review_service.dart';
import 'package:mobile/core/utils/category_suggest.dart';
import 'package:mobile/core/widgets/category_icon.dart';
import 'package:mobile/core/widgets/success_checkmark.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';
import 'package:mobile/features/post_ad/models/ad_draft_model.dart';
import 'package:mobile/features/post_ad/models/location_models.dart';
import 'package:mobile/features/post_ad/services/ad_draft_service.dart';
import 'package:mobile/features/post_ad/services/form_template_service.dart';
import 'package:mobile/features/post_ad/widgets/dynamic_form_fields.dart';

class CreateAdScreen extends StatefulWidget {
  final String? draftId;
  final AdWithDetails? existingAd;

  const CreateAdScreen({super.key, this.draftId, this.existingAd});

  bool get isEditMode => existingAd != null;

  @override
  State<CreateAdScreen> createState() => _CreateAdScreenState();
}

class _CreateAdScreenState extends State<CreateAdScreen> {
  // Single-screen progressive form: sections reveal as earlier ones are
  // filled, and never collapse again (monotonic) so editing doesn't hide work.
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();
  final Set<String> _revealedSections = {};
  final Map<String, GlobalKey> _sectionKeys = {
    'title': GlobalKey(),
    'category': GlobalKey(),
    'details': GlobalKey(),
    'location': GlobalKey(),
    'contact': GlobalKey(),
  };
  String? _pendingRevealScroll;
  bool _initialBuildDone = false;

  // Title → category suggestion (keyword dictionary, matched locally)
  List<CategoryKeyword> _categoryKeywords = [];
  CategoryKeyword? _suggestion;
  Timer? _suggestDebounce;

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();

  bool _isLoading = false;
  bool _priceNegotiable = false;

  // 0..1 while the multipart body is uploading; null once the server is
  // processing (or when idle). Drives the "Uploading X%" label on the button.
  double? _uploadProgress;

  // Data
  List<CategoryWithSubcategories> _categories = [];
  CategoryWithSubcategories? _selectedCategory;
  Category? _selectedSubCategory;

  // Images
  final ImagePicker _picker = ImagePicker();
  List<XFile> _selectedImages = [];
  List<String> _existingImagePaths =
      []; // For edit mode: existing image paths to keep
  int _maxImages = 5; // Default, updated from server

  // Dynamic Fields
  final AdClient _adClient = AdClient();
  final FormTemplateService _templateService = FormTemplateService();
  final Map<String, dynamic> _attributeValues = {};

  // Location Data
  List<LocationProvince> _provinces = [];
  LocationProvince? _selectedProvince;
  LocationDistrict? _selectedDistrict;
  LocationMunicipality? _selectedMunicipality;
  LocationArea? _selectedArea;

  // Location quick-search (type a place, auto-fills the dropdowns below)
  final LocationClient _locationClient = LocationClient();
  final _locationSearchController = TextEditingController();
  Timer? _locationSearchDebounce;
  List<Location> _locationSearchResults = [];
  bool _searchingLocation = false;

  // Contact Data
  final _whatsappController = TextEditingController();
  bool _whatsappSameAsPhone = true;

  // Contact phone + verification status come from the logged-in user profile.
  Map<String, dynamic>? get _authUser => context.read<AuthProvider>().user;
  String get _verifiedPhone => (_authUser?['phone'] as String?)?.trim() ?? '';
  bool get _isPhoneVerified => _authUser?['phoneVerified'] == true;

  // Edit mode: track if initial prefill is done (to avoid clearing attributes)
  bool _editPrefillDone = false;

  // Draft State
  String? _currentDraftId;
  bool _isSaving = false;
  DateTime? _lastSaved;
  List<AdDraft> _drafts = [];
  bool _showDraftsPanel = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _whatsappController.text = _verifiedPhone;
    _initializeScreen();
    _titleController.addListener(_onFormChanged);
    _titleController.addListener(_onTitleChangedForSuggestion);
    _descriptionController.addListener(_onTitleChangedForSuggestion);
    _descriptionController.addListener(_onFormChanged);
    _priceController.addListener(_onFormChanged);
  }

  void _onTitleChangedForSuggestion() {
    _suggestDebounce?.cancel();
    _suggestDebounce = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      // Title wins; description is only a fallback (it's noisier text).
      final next =
          suggestCategory(_titleController.text, _categoryKeywords) ??
          suggestCategory(_descriptionController.text, _categoryKeywords);
      if (next?.keyword != _suggestion?.keyword) {
        setState(() => _suggestion = next);
      }
    });
  }

  // Full ad details fetched for edit mode (dashboard data is incomplete)
  AdWithDetails? _fullAdDetails;

  Future<void> _initializeScreen() async {
    try {
      if (widget.isEditMode) {
        // Edit mode: fetch full ad details (dashboard data lacks attributes etc.)
        // and load categories/locations in parallel
        final futures = await Future.wait([
          _loadInitialData(),
          _adClient.getAdById(widget.existingAd!.id),
        ]);
        final adResponse = futures[1] as ApiResponse<AdWithDetails>;
        if (adResponse.success && adResponse.data != null) {
          _fullAdDetails = adResponse.data;
        }
        if (mounted) _prefillFromExistingAd();
      } else {
        // Create mode: load data and drafts
        await Future.wait([_loadInitialData(), _loadDrafts()]);
        if (widget.draftId != null && mounted) {
          final match = _drafts.where((d) => d.id == widget.draftId);
          if (match.isNotEmpty) {
            await _restoreDraft(match.first);
          }
        }
      }
    } catch (e) {
      log('Error initializing create ad screen: $e', name: 'CreateAdScreen');
      // Retry once after a short delay (handles auth token propagation timing)
      if (mounted) {
        await Future.delayed(const Duration(milliseconds: 500));
        try {
          await _loadInitialData();
          if (widget.isEditMode && mounted) _prefillFromExistingAd();
        } catch (retryError) {
          log('Retry also failed: $retryError', name: 'CreateAdScreen');
        }
      }
    }
  }

  void _prefillFromExistingAd() {
    // Use full details from API if available, fallback to dashboard data
    final ad = _fullAdDetails ?? widget.existingAd!;

    _titleController.text = ad.title;
    _descriptionController.text = ad.description;
    _priceController.text = ad.price.toStringAsFixed(0);
    // isNegotiable is stored in custom_fields (like web), check there first
    _priceNegotiable =
        ad.attributes?['isNegotiable'] as bool? ?? ad.isNegotiable;

    // Pre-fill existing images — use paths as-is (getAdImageUrl handles them)
    _existingImagePaths = List<String>.from(ad.images);

    // Pre-fill category
    // The ad has categoryId (parent) and subcategoryId (child)
    // If subcategoryId exists, categoryId is the parent; otherwise categoryId could be a parent or subcategory
    try {
      // First try: categoryId matches a parent category directly
      final cat = _categories.firstWhere(
        (c) => c.id == ad.categoryId,
        orElse: () {
          // Second try: categoryId might actually be a subcategory ID
          // Search all parent categories for a subcategory matching categoryId
          for (final parent in _categories) {
            for (final sub in parent.subcategories) {
              if (sub.id == ad.categoryId) {
                return parent;
              }
            }
          }
          throw StateError('Category not found');
        },
      );
      _selectedCategory = cat;

      // Now find subcategory
      final subId = ad.subcategoryId ?? ad.categoryId;
      if (subId != cat.id) {
        try {
          _selectedSubCategory = cat.subcategories.firstWhere(
            (s) => s.id == subId,
          );
        } catch (_) {}
      }
    } catch (_) {
      log(
        'Edit: category not found for id ${ad.categoryId}, sub: ${ad.subcategoryId}',
        name: 'CreateAdScreen',
      );
    }

    // Pre-fill location
    try {
      for (final prov in _provinces) {
        for (final dist in prov.districts) {
          for (final muni in dist.municipalities) {
            if (muni.id == ad.locationId) {
              _selectedProvince = prov;
              _selectedDistrict = dist;
              _selectedMunicipality = muni;
              if (ad.areaId != null) {
                try {
                  _selectedArea = muni.areas.firstWhere(
                    (a) => a.id == ad.areaId,
                  );
                } catch (_) {}
              }
              break;
            }
            // Check areas too
            for (final area in muni.areas) {
              if (area.id == ad.locationId || area.id == ad.areaId) {
                _selectedProvince = prov;
                _selectedDistrict = dist;
                _selectedMunicipality = muni;
                _selectedArea = area;
                break;
              }
            }
          }
        }
      }
    } catch (_) {
      log(
        'Edit: location not found for id ${ad.locationId}',
        name: 'CreateAdScreen',
      );
    }

    // Pre-fill custom attributes
    if (ad.attributes != null) {
      _attributeValues.addAll(ad.attributes!);
    }
    // Condition is stored separately in DB, not in custom_fields — inject it back
    if (ad.condition != null && !_attributeValues.containsKey('condition')) {
      _attributeValues['condition'] = ad.condition;
    }

    // Pre-fill WhatsApp: it lives in custom_fields only when the seller set a
    // number different from their profile phone. Managed via the toggle below,
    // so keep it out of the dynamic-fields map.
    final savedWhatsapp = (ad.attributes?['whatsapp_number'] as String?)
        ?.trim();
    _attributeValues.remove('whatsapp_number');
    if (savedWhatsapp != null &&
        savedWhatsapp.isNotEmpty &&
        savedWhatsapp != _verifiedPhone) {
      _whatsappSameAsPhone = false;
      _whatsappController.text = savedWhatsapp;
    } else {
      _whatsappSameAsPhone = true;
      _whatsappController.text = _verifiedPhone;
    }

    _editPrefillDone = true;
    setState(() {});
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _adClient.getCategories(),
        _adClient.getLocationHierarchy(),
        _adClient.getAdLimits(),
        _adClient.getCategoryKeywords(),
      ]);
      final categories = results[0] as List<CategoryWithSubcategories>;
      final provinces = results[1] as List<LocationProvince>;
      final limits = results[2] as AdLimitsResponse;
      final keywords = results[3] as List<CategoryKeyword>;

      setState(() {
        _categories = categories;
        _provinces = provinces;
        _maxImages = limits.effectiveImageLimit;
        _categoryKeywords = keywords;
      });
    } catch (e) {
      debugPrint("Error loading initial data: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadDrafts() async {
    final drafts = await AdDraftService.loadDrafts();
    if (mounted) setState(() => _drafts = drafts);
  }

  void _onFormChanged() {
    // Rebuild so char counters and progressive reveals track typing.
    if (mounted) setState(() {});
    if (!widget.isEditMode) _triggerAutoSave();
  }

  void _triggerAutoSave() {
    _debounceTimer?.cancel();

    final hasContent =
        _titleController.text.trim().isNotEmpty ||
        _descriptionController.text.trim().isNotEmpty ||
        _priceController.text.trim().isNotEmpty ||
        _selectedCategory != null;

    if (!hasContent) return;

    _debounceTimer = Timer(const Duration(seconds: 3), _saveCurrentDraft);
  }

  Future<void> _saveCurrentDraft() async {
    if (!mounted) return;
    setState(() => _isSaving = true);

    final now = DateTime.now();
    final draftId = _currentDraftId ?? AdDraftService.generateId();

    final existing = _drafts.firstWhere(
      (d) => d.id == draftId,
      orElse: () => AdDraft(
        id: draftId,
        title: '',
        description: '',
        price: '',
        isNegotiable: false,
        customFields: {},
        createdAt: now,
        updatedAt: now,
      ),
    );

    final draft = AdDraft(
      id: draftId,
      title: _titleController.text,
      description: _descriptionController.text,
      price: _priceController.text,
      categoryId: _selectedCategory?.id,
      subcategoryId: _selectedSubCategory?.id,
      provinceId: _selectedProvince?.id,
      districtId: _selectedDistrict?.id,
      municipalityId: _selectedMunicipality?.id,
      areaId: _selectedArea?.id,
      isNegotiable: _priceNegotiable,
      customFields: Map<String, dynamic>.from(_attributeValues),
      createdAt: existing.createdAt,
      updatedAt: now,
    );

    await AdDraftService.saveDraft(draft);
    final updatedDrafts = await AdDraftService.loadDrafts();

    if (mounted) {
      setState(() {
        _currentDraftId = draftId;
        _drafts = updatedDrafts;
        _isSaving = false;
        _lastSaved = now;
      });
    }
  }

  Future<void> _restoreDraft(AdDraft draft) async {
    _titleController.text = draft.title;
    _descriptionController.text = draft.description;
    _priceController.text = draft.price;

    CategoryWithSubcategories? category;
    Category? subcategory;

    if (draft.categoryId != null) {
      try {
        category = _categories.firstWhere((c) => c.id == draft.categoryId);
        if (draft.subcategoryId != null) {
          subcategory = category.subcategories.firstWhere(
            (s) => s.id == draft.subcategoryId,
          );
        }
      } catch (_) {
        log(
          'AdDraft restore: category not found for id ${draft.categoryId}',
          name: 'CreateAdScreen',
        );
      }
    }

    LocationProvince? province;
    LocationDistrict? district;
    LocationMunicipality? municipality;
    LocationArea? area;

    if (draft.provinceId != null) {
      try {
        province = _provinces.firstWhere((p) => p.id == draft.provinceId);
        if (draft.districtId != null) {
          district = province.districts.firstWhere(
            (d) => d.id == draft.districtId,
          );
          if (draft.municipalityId != null) {
            municipality = district.municipalities.firstWhere(
              (m) => m.id == draft.municipalityId,
            );
            if (draft.areaId != null) {
              area = municipality.areas.firstWhere((a) => a.id == draft.areaId);
            }
          }
        }
      } catch (_) {
        log('AdDraft restore: location not found', name: 'CreateAdScreen');
      }
    }

    setState(() {
      _selectedCategory = category;
      _selectedSubCategory = subcategory;
      _selectedProvince = province;
      _selectedDistrict = district;
      _selectedMunicipality = municipality;
      _selectedArea = area;
      _priceNegotiable = draft.isNegotiable;
      _attributeValues
        ..clear()
        ..addAll(draft.customFields);
      _currentDraftId = draft.id;
      _lastSaved = draft.updatedAt;
      _showDraftsPanel = false;
    });
  }

  Future<void> _deleteDraft(String id) async {
    await AdDraftService.deleteDraft(id);
    final updatedDrafts = await AdDraftService.loadDrafts();
    if (mounted) {
      setState(() {
        _drafts = updatedDrafts;
        if (_currentDraftId == id) {
          _currentDraftId = null;
          _lastSaved = null;
        }
      });
    }
  }

  Future<void> _deleteDraftAfterPost() async {
    final id = _currentDraftId;
    if (id != null) {
      await AdDraftService.deleteDraft(id);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _suggestDebounce?.cancel();
    _locationSearchDebounce?.cancel();
    _titleController.removeListener(_onFormChanged);
    _titleController.removeListener(_onTitleChangedForSuggestion);
    _descriptionController.removeListener(_onTitleChangedForSuggestion);
    _descriptionController.removeListener(_onFormChanged);
    _priceController.removeListener(_onFormChanged);
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _whatsappController.dispose();
    _locationSearchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  int get _totalImageCount =>
      _existingImagePaths.length + _selectedImages.length;

  // ── Location quick-search ────────────────────────────────────────────────
  // Type a place name, pick a result, and the cascading dropdowns below
  // auto-fill from the already-loaded province tree (no extra API calls).

  void _onLocationSearchChanged(String query) {
    _locationSearchDebounce?.cancel();
    if (query.trim().length < 2) {
      setState(() => _locationSearchResults = []);
      return;
    }
    _locationSearchDebounce = Timer(
      const Duration(milliseconds: 300),
      () async {
        setState(() => _searchingLocation = true);
        final results = await _locationClient.searchAllLocations(query.trim());
        if (!mounted) return;
        setState(() {
          _locationSearchResults = results;
          _searchingLocation = false;
        });
      },
    );
  }

  /// Locate a flat search result inside the loaded province tree and return its
  /// full ancestry path. Returns null if the location isn't in the tree.
  ({
    LocationProvince p,
    LocationDistrict? d,
    LocationMunicipality? m,
    LocationArea? a,
  })?
  _resolveLocationPath(Location loc) {
    for (final prov in _provinces) {
      if (loc.type == LocationType.province && prov.id == loc.id) {
        return (p: prov, d: null, m: null, a: null);
      }
      for (final dist in prov.districts) {
        if (loc.type == LocationType.district && dist.id == loc.id) {
          return (p: prov, d: dist, m: null, a: null);
        }
        for (final muni in dist.municipalities) {
          if (loc.type == LocationType.municipality && muni.id == loc.id) {
            return (p: prov, d: dist, m: muni, a: null);
          }
          for (final area in muni.areas) {
            if (loc.type == LocationType.area && area.id == loc.id) {
              return (p: prov, d: dist, m: muni, a: area);
            }
          }
        }
      }
    }
    return null;
  }

  void _selectSearchedLocation(Location loc) {
    final path = _resolveLocationPath(loc);
    FocusScope.of(context).unfocus();
    if (path == null) {
      // Result isn't in the loaded tree (rare) — let the user pick manually.
      setState(() => _locationSearchResults = []);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.locationSearchManual'.tr())),
      );
      return;
    }
    setState(() {
      _selectedProvince = path.p;
      _selectedDistrict = path.d;
      _selectedMunicipality = path.m;
      _selectedArea = path.a;
      _locationSearchResults = [];
      _locationSearchController.text = loc.name;
    });
    _onFormChanged();
  }

  /// One-line parent hierarchy for a result, e.g. "Kathmandu Metro, Kathmandu, Bagmati".
  String _locationPathHint(Location loc) {
    final path = _resolveLocationPath(loc);
    if (path == null) return '';
    final lang = context.locale.languageCode;
    final parents = <String>[];
    // Municipality is a parent only when an area was picked.
    if (loc.type == LocationType.area && path.m != null) {
      parents.add(path.m!.localizedName(lang));
    }
    // District is a parent for areas and municipalities.
    if ((loc.type == LocationType.area ||
            loc.type == LocationType.municipality) &&
        path.d != null) {
      parents.add(path.d!.localizedName(lang));
    }
    // Province is a parent for everything below it.
    if (loc.type != LocationType.province) {
      parents.add(path.p.localizedName(lang));
    }
    return parents.join(', ');
  }

  Widget _buildLocationResultTile(Location loc) {
    final hint = _locationPathHint(loc);
    return InkWell(
      onTap: () => _selectSearchedLocation(loc),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            const Icon(LucideIcons.mapPin, size: 16, color: Color(0xFF10B981)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    loc.name,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (hint.isNotEmpty)
                    Text(
                      hint,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showImageSourceSheet() {
    if (_totalImageCount >= _maxImages) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.maxImagesError'.tr())));
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(LucideIcons.camera),
                title: Text(
                  context.locale.languageCode == 'ne'
                      ? 'क्यामेराबाट फोटो खिच्नुहोस्'
                      : 'Take Photo',
                  style: GoogleFonts.inter(),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickFromCamera();
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.image),
                title: Text(
                  context.locale.languageCode == 'ne'
                      ? 'ग्यालेरीबाट छान्नुहोस्'
                      : 'Choose from Gallery',
                  style: GoogleFonts.inter(),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImages();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickFromCamera() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1200,
        imageQuality: 85,
      );
      if (image == null) return;

      const maxSize = 5 * 1024 * 1024; // 5MB
      final size = await image.length();
      if (size > maxSize) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.locale.languageCode == 'ne'
                    ? 'छवि ५MB भन्दा ठूलो छ। कृपया ५MB भन्दा सानो छवि अपलोड गर्नुहोस्।'
                    : 'Image exceeds 5MB. Please upload an image under 5MB.',
              ),
            ),
          );
        }
        return;
      }

      setState(() {
        _selectedImages.add(image);
      });
    } catch (e) {
      debugPrint('Error capturing image: $e');
    }
  }

  Future<void> _pickImages() async {
    try {
      // Same downscaling as the camera path — without it, gallery picks upload
      // the original 4-12MB photo, which dominates post time on slow upstream.
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: 1200,
        imageQuality: 85,
      );
      if (images.isNotEmpty) {
        // Validate each image is under 5MB
        const maxSize = 5 * 1024 * 1024; // 5MB
        final List<XFile> validImages = [];
        final List<String> oversizedNames = [];

        for (final img in images) {
          final size = await img.length();
          if (size > maxSize) {
            oversizedNames.add(img.name);
          } else {
            validImages.add(img);
          }
        }

        if (oversizedNames.isNotEmpty && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.locale.languageCode == 'ne'
                    ? '${oversizedNames.length} छवि(हरू) ५MB भन्दा ठूलो भएकाले छोडियो। कृपया ५MB भन्दा सानो छवि अपलोड गर्नुहोस्।'
                    : '${oversizedNames.length} image(s) exceed 5MB and were skipped. Please upload images under 5MB.',
              ),
              duration: const Duration(seconds: 4),
            ),
          );
        }

        setState(() {
          _selectedImages.addAll(validImages);
          if (_selectedImages.length > _maxImages) {
            _selectedImages = _selectedImages.sublist(0, _maxImages);
          }
        });
      }
    } catch (e) {
      debugPrint('Error picking images: $e');
    }
  }

  // ── Progressive reveal ───────────────────────────────────────────────────

  /// Marks [key] revealed once [condition] first becomes true; sections never
  /// collapse again. Called from build (top-down), so a newly satisfied
  /// condition schedules an auto-scroll to the freshly revealed section.
  bool _reveal(String key, bool condition) {
    if (widget.isEditMode) return true;
    if (condition && !_revealedSections.contains(key)) {
      _revealedSections.add(key);
      if (_initialBuildDone) {
        _pendingRevealScroll = key;
        WidgetsBinding.instance.addPostFrameCallback(
          (_) => _scrollToPendingReveal(),
        );
      }
    }
    return _revealedSections.contains(key);
  }

  void _scrollToPendingReveal() {
    final key = _pendingRevealScroll;
    _pendingRevealScroll = null;
    if (key == null || !mounted) return;
    final ctx = _sectionKeys[key]?.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
        alignment: 0.05,
      );
    }
  }

  // ── Title → category suggestion ──────────────────────────────────────────

  CategoryWithSubcategories? get _suggestedParent {
    final suggestion = _suggestion;
    if (suggestion == null) return null;
    for (final cat in _categories) {
      if (cat.id == suggestion.categoryId) return cat;
    }
    return null;
  }

  Category? get _suggestedSub {
    final suggestion = _suggestion;
    final parent = _suggestedParent;
    if (suggestion == null || parent == null) return null;
    final subId = suggestion.subcategoryId;
    if (subId == null) return null;
    for (final sub in parent.subcategories) {
      if (sub.id == subId) return sub;
    }
    return null;
  }

  bool get _suggestionApplied {
    final suggestion = _suggestion;
    if (suggestion == null) return false;
    if (_selectedCategory?.id != suggestion.categoryId) return false;
    final subId = suggestion.subcategoryId;
    return subId == null || _selectedSubCategory?.id == subId;
  }

  void _applySuggestion() {
    final parent = _suggestedParent;
    if (parent == null) return;
    setState(() {
      _selectedCategory = parent;
      _selectedSubCategory = _suggestedSub;
      if (!widget.isEditMode || _editPrefillDone) {
        _attributeValues.clear();
      }
    });
    _onFormChanged();
  }

  Future<void> _submitAd() async {
    // The Form only validates fields that are currently in the widget tree, so
    // check section completeness explicitly (replaces the old per-step gates).
    if (_titleController.text.trim().isEmpty ||
        _descriptionController.text.trim().isEmpty ||
        _priceController.text.trim().isEmpty) {
      _formKey.currentState?.validate();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.completeAllFields'.tr())));
      return;
    }

    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.selectCategoryError'.tr())),
      );
      return;
    }

    final selectedCategory = _selectedCategory;
    if (selectedCategory != null &&
        selectedCategory.subcategories.isNotEmpty &&
        _selectedSubCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.selectSubcategoryError'.tr())),
      );
      return;
    }

    if (_selectedImages.isEmpty && _existingImagePaths.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.addImageError'.tr())));
      return;
    }

    if (_selectedProvince == null ||
        _selectedDistrict == null ||
        _selectedMunicipality == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('postAd.selectLocationError'.tr())),
      );
      return;
    }

    // Phone must be verified before posting (mirrors the web post-ad flow).
    if (!_isPhoneVerified) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.verifyBeforePost'.tr())));
      return;
    }

    if (_whatsappController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.validContactError'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (widget.isEditMode) {
        await _updateExistingAd();
      } else {
        await _createNewAd();
      }
    } catch (e) {
      debugPrint("🔴 ${widget.isEditMode ? 'Update' : 'Post'} Ad Error: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: $e',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _uploadProgress = null;
        });
      }
    }
  }

  void _onUploadProgress(int sent, int total) {
    if (!mounted || total <= 0) return;
    setState(() => _uploadProgress = sent / total);
  }

  /// Builds the attributes map including isNegotiable + a custom WhatsApp number
  /// (both stored in custom_fields). WhatsApp is only persisted when the seller
  /// set a number different from their profile phone.
  Map<String, dynamic> _buildSubmitAttributes() {
    final attrs = <String, dynamic>{
      ..._attributeValues,
      'isNegotiable': _priceNegotiable,
    };
    final whatsapp = _whatsappController.text.trim();
    if (!_whatsappSameAsPhone &&
        whatsapp.isNotEmpty &&
        whatsapp != _verifiedPhone) {
      attrs['whatsapp_number'] = whatsapp;
    } else {
      attrs.remove('whatsapp_number');
    }
    return attrs;
  }

  Future<void> _createNewAd() async {
    final formData = FormData.fromMap({
      'title': _titleController.text,
      'description': _descriptionController.text,
      'price': _priceController.text,
      'categoryId': _selectedCategory!.id,
      'subcategoryId': _selectedSubCategory?.id,
      'locationId': _selectedArea?.id ?? _selectedMunicipality!.id,
      'province_id': _selectedProvince!.id,
      'district_id': _selectedDistrict!.id,
      'city_id': _selectedMunicipality!.id,
      'area_id': _selectedArea?.id,
      'attributes': jsonEncode(_buildSubmitAttributes()),
    });

    for (var image in _selectedImages) {
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(image.path, filename: image.name),
        ),
      );
    }

    final result = await _adClient.createAd(
      formData,
      onSendProgress: _onUploadProgress,
    );

    if (result.success) {
      await _deleteDraftAfterPost();
      AnalyticsService.logPostAd(
        adId: result.data?.id ?? 0,
        title: _titleController.text.trim(),
        price: double.tryParse(_priceController.text.trim()),
      );
      // Positive moment: record it and maybe ask for a store review.
      await ReviewService.recordSignificantAction();
      await ReviewService.maybeRequestReview();
      if (mounted) {
        final isNepali = context.locale.languageCode == 'ne';
        if (result.isLive) {
          // Verified business: ad published instantly, no review needed.
          await showSuccessDialog(
            context,
            message: isNepali ? 'तपाईंको विज्ञापन लाइभ छ!' : 'Your ad is live!',
          );
        } else {
          await showSuccessDialog(
            context,
            message: 'postAd.adPosted'.tr(),
            subtitle: 'postAd.adPostedReviewNote'.tr(),
            subtitleTransliteration: isNepali
                ? null
                : 'postAd.adPostedReviewNoteLatin'.tr(),
          );
        }
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => DashboardScreen(
                initialFilter: result.isLive ? 'Active' : 'Pending',
              ),
            ),
          );
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(result.errorMessage)));
      }
    }
  }

  Future<void> _updateExistingAd() async {
    final ad = widget.existingAd!;
    final isRejected = ad.status == AdStatus.rejected;

    final formData = FormData.fromMap({
      'title': _titleController.text,
      'description': _descriptionController.text,
      'price': _priceController.text,
      'categoryId': _selectedCategory!.id,
      'subcategoryId': _selectedSubCategory?.id,
      'locationId': _selectedArea?.id ?? _selectedMunicipality!.id,
      'attributes': jsonEncode(_buildSubmitAttributes()),
      'existingImages': jsonEncode(_existingImagePaths),
    });

    for (var image in _selectedImages) {
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(image.path, filename: image.name),
        ),
      );
    }

    final result = await _adClient.updateAd(
      ad.id,
      formData,
      onSendProgress: _onUploadProgress,
    );

    if (result.success && mounted) {
      final isNepali = context.locale.languageCode == 'ne';
      final message = result.isLive
          // Verified business: the edit published instantly.
          ? (isNepali
                ? 'तपाईंको विज्ञापन अपडेट भयो र लाइभ छ।'
                : 'Your ad has been updated and is live.')
          : isRejected
          ? (isNepali
                ? 'विज्ञापन पुन: पेश गरियो। समीक्षाको लागि पर्खनुहोस्।'
                : 'Ad resubmitted for review.')
          : (isNepali
                ? 'विज्ञापन अपडेट भयो। सम्पादक समीक्षाको लागि पर्खनुहोस्।'
                : 'Ad updated. Waiting for editor review.');

      await showSuccessDialog(context, message: message);
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => DashboardScreen(
              initialFilter: result.isLive ? 'Active' : 'Pending',
            ),
          ),
        );
      }
    } else if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.errorMessage)));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Subscribe to auth changes so the verified badge / warning banner update
    // immediately after the user verifies their phone.
    context.watch<AuthProvider>();

    if (_isLoading && _categories.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.x, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.isEditMode
              ? (widget.existingAd!.status == AdStatus.rejected
                    ? (context.locale.languageCode == 'ne'
                          ? 'सम्पादन र पुन: पेश'
                          : 'Edit & Resubmit')
                    : (context.locale.languageCode == 'ne'
                          ? 'विज्ञापन सम्पादन'
                          : 'Edit Ad'))
              : 'postAd.title'.tr(),
          style: GoogleFonts.inter(
            color: Colors.black,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
        actions: [
          if (!widget.isEditMode &&
              (_drafts.isNotEmpty || _currentDraftId != null))
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(LucideIcons.fileText, color: Colors.black87),
                  tooltip: 'Drafts',
                  onPressed: () =>
                      setState(() => _showDraftsPanel = !_showDraftsPanel),
                ),
                if (_drafts.isNotEmpty)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${_drafts.length}',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Draft status bar (create mode only)
            if (!widget.isEditMode) _buildDraftStatusBar(),

            // Drafts panel (slides in/out, create mode only)
            if (!widget.isEditMode)
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeInOut,
                child: _showDraftsPanel
                    ? _buildDraftsPanel()
                    : const SizedBox.shrink(),
              ),

            // Single-screen progressive form
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollController,
                padding: const EdgeInsets.all(20),
                child: Form(key: _formKey, child: _buildFormContent()),
              ),
            ),

            // Sticky Post/Update button
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildDraftStatusBar() {
    if (_isSaving) {
      return _buildStatusRow(
        LucideIcons.arrowUpFromLine,
        'Saving draft...',
        Colors.grey[500]!,
      );
    }
    if (_lastSaved != null) {
      final diff = DateTime.now().difference(_lastSaved!);
      final label = diff.inSeconds < 10
          ? 'Draft saved'
          : diff.inMinutes < 1
          ? 'Saved ${diff.inSeconds}s ago'
          : 'Saved ${diff.inMinutes}m ago';
      return _buildStatusRow(
        LucideIcons.cloudLightning,
        label,
        Colors.grey[500]!,
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildStatusRow(IconData icon, String label, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: color)),
        ],
      ),
    );
  }

  Widget _buildDraftsPanel() {
    if (_drafts.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Text(
          'No saved drafts',
          style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500]),
        ),
      );
    }

    return Container(
      constraints: const BoxConstraints(maxHeight: 240),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
            child: Text(
              'Saved Drafts',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.grey[700],
              ),
            ),
          ),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.only(bottom: 8),
              itemCount: _drafts.length,
              itemBuilder: (context, index) {
                final draft = _drafts[index];
                final isActive = draft.id == _currentDraftId;
                final diff = DateTime.now().difference(draft.updatedAt);
                final timeLabel = diff.inMinutes < 1
                    ? 'Just now'
                    : diff.inHours < 1
                    ? '${diff.inMinutes}m ago'
                    : diff.inDays < 1
                    ? '${diff.inHours}h ago'
                    : '${diff.inDays}d ago';

                return ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 0,
                  ),
                  leading: Icon(
                    LucideIcons.fileText,
                    size: 18,
                    color: isActive
                        ? const Color(0xFF10B981)
                        : Colors.grey[400],
                  ),
                  title: Text(
                    draft.displayName,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: isActive
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: Colors.black87,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    timeLabel,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.grey[500],
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(
                      LucideIcons.trash2,
                      size: 15,
                      color: Colors.redAccent,
                    ),
                    onPressed: () => _deleteDraft(draft.id),
                  ),
                  onTap: () => _restoreDraft(draft),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormContent() {
    final selectedCategory = _selectedCategory;
    final titleFilled = _titleController.text.trim().isNotEmpty;
    final categoryComplete =
        selectedCategory != null &&
        (selectedCategory.subcategories.isEmpty ||
            _selectedSubCategory != null);
    final detailsFilled =
        _descriptionController.text.trim().isNotEmpty &&
        _priceController.text.trim().isNotEmpty;
    final locationChosen = _selectedMunicipality != null;

    // Photos first (always visible); the title also reveals from restored
    // drafts, which carry text but no images.
    final photosAdded = _totalImageCount > 0;
    final showTitle = _reveal('title', photosAdded || titleFilled);
    final showCategory = _reveal('category', titleFilled);
    final showDetails = _reveal('details', categoryComplete);
    final showLocation = _reveal('location', showDetails && detailsFilled);
    final showContact = _reveal('contact', showLocation && locationChosen);

    if (!_initialBuildDone) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _initialBuildDone = true,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPhotosSection(),
        _buildRevealedSection('title', showTitle, _buildTitleSection),
        _buildRevealedSection('category', showCategory, _buildCategorySection),
        _buildRevealedSection('details', showDetails, _buildDetailsSection),
        _buildRevealedSection('location', showLocation, _buildLocationSection),
        _buildRevealedSection('contact', showContact, _buildContactSection),
      ],
    );
  }

  /// Animates a section into view the first time its reveal condition is met.
  Widget _buildRevealedSection(
    String key,
    bool visible,
    Widget Function() builder,
  ) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      alignment: Alignment.topCenter,
      child: visible
          ? KeyedSubtree(key: _sectionKeys[key], child: builder())
          : const SizedBox.shrink(),
    );
  }

  Widget _buildSuggestionChip() {
    final parent = _suggestedParent;
    if (parent == null) return const SizedBox.shrink();
    final sub = _suggestedSub;
    final locale = context.locale.languageCode;
    final label = sub == null
        ? parent.localizedName(locale)
        : '${parent.localizedName(locale)} › ${sub.localizedName(locale)}';

    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: InkWell(
        onTap: _applySuggestion,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              CategoryIcon(
                slug: parent.slug,
                emoji: parent.icon ?? '📁',
                size: 22,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  '${'postAd.suggestedCategory'.tr()}: $label',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF047857),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'postAd.tapToUse'.tr(),
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: const Color(0xFF10B981),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openCategoryPicker() async {
    final locale = context.locale.languageCode;
    final picked = await showModalBottomSheet<CategoryWithSubcategories>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: SizedBox(
          height: MediaQuery.of(ctx).size.height * 0.72,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'postAd.selectCategoryHint'.tr(),
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 0.95,
                        ),
                    itemCount: _categories.length,
                    itemBuilder: (ctx2, i) {
                      final cat = _categories[i];
                      final selected = _selectedCategory?.id == cat.id;
                      return InkWell(
                        onTap: () => Navigator.pop(ctx, cat),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFFECFDF5)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF10B981)
                                  : Colors.grey[200]!,
                              width: selected ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CategoryIcon(
                                slug: cat.slug,
                                emoji: cat.icon ?? '📁',
                                size: 44,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                cat.localizedName(locale),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
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
    if (picked == null || !mounted) return;
    setState(() {
      _selectedCategory = picked;
      _selectedSubCategory = null;
      if (!widget.isEditMode || _editPrefillDone) {
        _attributeValues.clear();
      }
    });
    _onFormChanged();
  }

  // Title (after photos) — the suggestion chip appears right under it.
  Widget _buildTitleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Text(
          'postAd.aboutProduct'.tr(),
          style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),

        _buildLabel('postAd.adTitle'.tr()),
        _buildTextField(
          controller: _titleController,
          hintText: 'postAd.adTitleHint'.tr(),
          validator: (val) => val == null || val.isEmpty
              ? (context.locale.languageCode == 'ne'
                    ? 'शीर्षक आवश्यक छ'
                    : 'Title is required')
              : null,
        ),
        _buildCharCount("${_titleController.text.length}/100"),
        if (_suggestedParent != null && !_suggestionApplied)
          _buildSuggestionChip(),
      ],
    );
  }

  // Category right after the title: tappable field opening the icon tile
  // grid, then subcategory chips, then category-specific dynamic fields.
  Widget _buildCategorySection() {
    final selectedCategory = _selectedCategory;
    final locale = context.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        _buildLabel('postAd.selectCategory'.tr()),
        InkWell(
          onTap: _openCategoryPicker,
          borderRadius: BorderRadius.circular(8),
          child: InputDecorator(
            decoration: _inputDecoration(),
            child: Row(
              children: [
                if (selectedCategory != null) ...[
                  CategoryIcon(
                    slug: selectedCategory.slug,
                    emoji: selectedCategory.icon ?? '📁',
                    size: 24,
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: Text(
                    selectedCategory?.localizedName(locale) ??
                        'postAd.selectCategoryHint'.tr(),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: selectedCategory == null
                          ? Colors.grey[400]
                          : Colors.black87,
                    ),
                  ),
                ),
                const Icon(
                  LucideIcons.chevronDown,
                  color: Colors.grey,
                  size: 18,
                ),
              ],
            ),
          ),
        ),

        if (selectedCategory != null &&
            selectedCategory.subcategories.isNotEmpty) ...[
          const SizedBox(height: 20),
          _buildLabel('postAd.selectSubcategory'.tr()),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: selectedCategory.subcategories.map((sub) {
              final selected = _selectedSubCategory?.id == sub.id;
              return ChoiceChip(
                label: Text(
                  sub.localizedName(locale),
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: selected ? Colors.white : Colors.black87,
                  ),
                ),
                selected: selected,
                showCheckmark: false,
                selectedColor: const Color(0xFF10B981),
                backgroundColor: Colors.white,
                side: BorderSide(
                  color: selected ? const Color(0xFF10B981) : Colors.grey[300]!,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                onSelected: (_) {
                  setState(() {
                    _selectedSubCategory = sub;
                    if (!widget.isEditMode || _editPrefillDone) {
                      _attributeValues.clear();
                    }
                  });
                  _onFormChanged();
                },
              );
            }).toList(),
          ),
        ],

        // Dynamic Fields
        Builder(
          builder: (context) {
            final category = _selectedCategory;
            final subcategory = _selectedSubCategory;
            if (category == null || subcategory == null) {
              return const SizedBox.shrink();
            }

            final fields = _templateService.getApplicableFields(
              category.name,
              subcategory.name,
            );

            if (fields.isEmpty) return const SizedBox.shrink();

            return Padding(
              padding: const EdgeInsets.only(top: 24),
              child: DynamicFormFields(
                locale: context.locale.languageCode,
                fields: fields,
                values: _attributeValues,
                onChanged: (key, value) {
                  setState(() {
                    _attributeValues[key] = value;
                  });
                },
              ),
            );
          },
        ),
      ],
    );
  }

  // Description, price, and negotiable checkbox.
  Widget _buildDetailsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        _buildLabel('postAd.descriptionLabel'.tr()),
        _buildTextField(
          controller: _descriptionController,
          hintText: 'postAd.descriptionHint'.tr(),
          maxLines: 5,
          validator: (val) => val == null || val.isEmpty
              ? (context.locale.languageCode == 'ne'
                    ? 'विवरण आवश्यक छ'
                    : 'Description is required')
              : null,
        ),
        _buildCharCount("${_descriptionController.text.length}/5000"),

        const SizedBox(height: 24),
        _buildLabel('postAd.priceLabel'.tr()),
        _buildTextField(
          controller: _priceController,
          hintText: "0",
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          validator: (val) => val == null || val.isEmpty
              ? (context.locale.languageCode == 'ne'
                    ? 'मूल्य आवश्यक छ'
                    : 'Price is required')
              : null,
        ),

        const SizedBox(height: 8),
        Row(
          children: [
            SizedBox(
              height: 24,
              width: 24,
              child: Checkbox(
                value: _priceNegotiable,
                activeColor: const Color(0xFF10B981),
                onChanged: (val) {
                  setState(() => _priceNegotiable = val ?? false);
                  _onFormChanged();
                },
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'postAd.priceNegotiable'.tr(),
              style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
            ),
          ],
        ),
      ],
    );
  }

  // Photos section — first thing on the form ("let me show you the thing")
  Widget _buildPhotosSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'postAd.photosLabel'.tr(),
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'postAd.maxImages'.tr(),
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _showImageSourceSheet,
          child: Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey[300]!,
                style: BorderStyle.solid,
              ),
            ),
            child: _totalImageCount == 0
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          LucideIcons.camera,
                          size: 24,
                          color: Colors.blue[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'postAd.tapToUpload'.tr(),
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.all(12),
                    itemCount: _totalImageCount + 1,
                    itemBuilder: (context, index) {
                      // Add button at the end
                      if (index == _totalImageCount) {
                        if (_totalImageCount < _maxImages) {
                          return GestureDetector(
                            onTap: _showImageSourceSheet,
                            child: Container(
                              width: 100,
                              margin: const EdgeInsets.only(left: 8),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: Colors.grey[300]!,
                                  style: BorderStyle.solid,
                                ),
                              ),
                              child: const Icon(
                                LucideIcons.plus,
                                color: Colors.grey,
                              ),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      }

                      // Existing images first, then new images
                      final isExisting = index < _existingImagePaths.length;

                      return Stack(
                        children: [
                          Container(
                            width: 100,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: isExisting
                                ? AppCachedImage(
                                    imageUrl: ApiConfig.getAdImageUrl(
                                      _existingImagePaths[index],
                                    ),
                                    fit: BoxFit.cover,
                                    width: 100,
                                  )
                                : Image.file(
                                    File(
                                      _selectedImages[index -
                                              _existingImagePaths.length]
                                          .path,
                                    ),
                                    fit: BoxFit.cover,
                                    width: 100,
                                    height: double.infinity,
                                  ),
                          ),
                          Positioned(
                            right: 4,
                            top: 4,
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  if (isExisting) {
                                    _existingImagePaths.removeAt(index);
                                  } else {
                                    _selectedImages.removeAt(
                                      index - _existingImagePaths.length,
                                    );
                                  }
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  LucideIcons.x,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }

  // Location section
  Widget _buildLocationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Text(
          'postAd.locationLabel'.tr(),
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 16),

        // Quick search — type a place name to auto-fill the dropdowns below
        _buildLabel('postAd.searchLocationLabel'.tr()),
        TextField(
          controller: _locationSearchController,
          onChanged: _onLocationSearchChanged,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: _inputDecoration().copyWith(
            hintText: 'postAd.searchLocationHint'.tr(),
            hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            prefixIcon: const Icon(
              LucideIcons.search,
              size: 18,
              color: Colors.grey,
            ),
            suffixIcon: _searchingLocation
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : (_locationSearchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(
                            LucideIcons.x,
                            size: 18,
                            color: Colors.grey,
                          ),
                          onPressed: () {
                            _locationSearchController.clear();
                            setState(() => _locationSearchResults = []);
                          },
                        )
                      : null),
          ),
        ),
        if (_locationSearchResults.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Column(
              children: [
                for (int i = 0; i < _locationSearchResults.length; i++) ...[
                  if (i > 0) Divider(height: 1, color: Colors.grey[200]),
                  _buildLocationResultTile(_locationSearchResults[i]),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),

        _buildLabel('postAd.provinceLabel'.tr()),
        DropdownButtonFormField<LocationProvince>(
          value: _selectedProvince,
          isExpanded: true,
          hint: Text(
            'postAd.selectProvince'.tr(),
            style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
          ),
          decoration: _inputDecoration(),
          items: _provinces.map<DropdownMenuItem<LocationProvince>>((
            LocationProvince prov,
          ) {
            return DropdownMenuItem<LocationProvince>(
              value: prov,
              child: Text(
                prov.localizedName(context.locale.languageCode),
                style: GoogleFonts.inter(fontSize: 14),
              ),
            );
          }).toList(),
          onChanged: (val) {
            setState(() {
              _selectedProvince = val;
              _selectedDistrict = null;
              _selectedMunicipality = null;
            });
          },
          icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
        ),

        if (_selectedProvince != null) ...[
          const SizedBox(height: 16),
          _buildLabel('postAd.districtLabel'.tr()),
          DropdownButtonFormField<LocationDistrict>(
            value: _selectedDistrict,
            isExpanded: true,
            hint: Text(
              'postAd.selectDistrict'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            ),
            decoration: _inputDecoration(),
            items: _selectedProvince!.districts
                .map<DropdownMenuItem<LocationDistrict>>((
                  LocationDistrict dist,
                ) {
                  return DropdownMenuItem<LocationDistrict>(
                    value: dist,
                    child: Text(
                      dist.localizedName(context.locale.languageCode),
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                  );
                })
                .toList(),
            onChanged: (val) {
              setState(() {
                _selectedDistrict = val;
                _selectedMunicipality = null;
              });
            },
            icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          ),
        ],

        if (_selectedDistrict != null) ...[
          const SizedBox(height: 16),
          _buildLabel('postAd.cityLabel'.tr()),
          DropdownButtonFormField<LocationMunicipality>(
            value: _selectedMunicipality,
            isExpanded: true,
            hint: Text(
              'postAd.selectCity'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            ),
            decoration: _inputDecoration(),
            items: _selectedDistrict!.municipalities
                .map<DropdownMenuItem<LocationMunicipality>>((
                  LocationMunicipality city,
                ) {
                  return DropdownMenuItem<LocationMunicipality>(
                    value: city,
                    child: Text(
                      city.localizedName(context.locale.languageCode),
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                  );
                })
                .toList(),
            onChanged: (val) {
              setState(() {
                _selectedMunicipality = val;
                _selectedArea = null;
              });
            },
            icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          ),
        ],

        if (_selectedMunicipality != null &&
            _selectedMunicipality!.areas.isNotEmpty) ...[
          const SizedBox(height: 16),
          _buildLabel('postAd.areaLabel'.tr()),
          DropdownButtonFormField<LocationArea>(
            value: _selectedArea,
            isExpanded: true,
            hint: Text(
              'postAd.selectArea'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            ),
            decoration: _inputDecoration(),
            items: _selectedMunicipality!.areas
                .map<DropdownMenuItem<LocationArea>>((LocationArea area) {
                  return DropdownMenuItem<LocationArea>(
                    value: area,
                    child: Text(
                      area.localizedName(context.locale.languageCode),
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                  );
                })
                .toList(),
            onChanged: (val) {
              setState(() {
                _selectedArea = val;
              });
            },
            icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          ),
        ],
      ],
    );
  }

  // Contact section (Phone + WhatsApp)
  Widget _buildContactSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Text(
          'postAd.contactInfo'.tr(),
          style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),

        // Verified Phone Display
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'postAd.phoneLabel'.tr(),
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    LucideIcons.smartphone,
                    size: 20,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _verifiedPhone.isNotEmpty
                        ? _verifiedPhone
                        : 'postAd.noPhoneAdded'.tr(),
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: _verifiedPhone.isNotEmpty
                          ? Colors.black87
                          : Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Only show the green "Verified" badge when the user's phone
                  // is actually verified on their profile.
                  if (_isPhoneVerified)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            LucideIcons.checkCircle,
                            size: 12,
                            color: Color(0xFF10B981),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'common.verified'.tr(),
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFF047857),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),

        // Warning banner + CTA when the phone is not verified. Mirrors the web
        // post-ad flow: posting is blocked until the phone is verified.
        if (!_isPhoneVerified) ...[
          const SizedBox(height: 16),
          _buildPhoneVerificationWarning(),
        ],

        const SizedBox(height: 24),

        // WhatsApp Section
        Text(
          'postAd.whatsappLabel'.tr(),
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 12),

        // Checkbox: "Same as phone number"
        InkWell(
          onTap: () {
            setState(() {
              _whatsappSameAsPhone = !_whatsappSameAsPhone;
              if (_whatsappSameAsPhone) {
                _whatsappController.text = _verifiedPhone;
              } else {
                _whatsappController.clear();
              }
            });
          },
          child: Row(
            children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Checkbox(
                  value: _whatsappSameAsPhone,
                  activeColor: const Color(0xFF10B981),
                  onChanged: (val) {
                    setState(() {
                      _whatsappSameAsPhone = val!;
                      if (_whatsappSameAsPhone) {
                        _whatsappController.text = _verifiedPhone;
                      } else {
                        _whatsappController.clear();
                      }
                    });
                  },
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'postAd.sameAsPhone'.tr(),
                style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        _buildTextField(
          controller: _whatsappController,
          hintText: 'postAd.enterWhatsapp'.tr(),
          keyboardType: TextInputType.phone,
          // Disable if checked
          // We can't easily 'disable' with just _buildTextField custom method unless we add 'enabled' prop
          // For now, let's keep it editable but auto-filled, or assume user unchecks to edit.
          // Ideally: enabled: !_whatsappSameAsPhone
        ),
        if (_whatsappSameAsPhone)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 4),
            child: Text(
              'postAd.uncheckNote'.tr(),
              style: GoogleFonts.inter(
                fontSize: 12,
                color: Colors.grey[500],
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
      ],
    );
  }

  // Amber warning shown on the Contact step when the user's phone is not
  // verified. Includes a CTA to the phone verification screen.
  Widget _buildPhoneVerificationWarning() {
    final detail = _verifiedPhone.isNotEmpty
        ? 'postAd.phoneNotVerifiedWithNumber'.tr(args: [_verifiedPhone])
        : 'postAd.noPhoneAdded'.tr();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF59E0B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                LucideIcons.alertTriangle,
                size: 20,
                color: Color(0xFFB45309),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'postAd.phoneNotVerifiedTitle'.tr(),
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF92400E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${'postAd.phoneNotVerifiedMsg'.tr()} $detail',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        height: 1.4,
                        color: const Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openPhoneVerification,
              icon: const Icon(LucideIcons.shieldCheck, size: 16),
              label: Text(
                'postAd.verifyPhoneCta'.tr(),
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openPhoneVerification() async {
    final verified = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            PhoneVerificationScreen(isChanging: _verifiedPhone.isNotEmpty),
      ),
    );
    // The screen pops `true` after a successful verify+save. Reload the profile
    // so the phone number and verified badge update on this screen.
    if (verified == true && mounted) {
      await context.read<AuthProvider>().refreshProfile();
    }
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _isLoading ? null : _submitAd,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: const Color(0xFF10B981),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: _isLoading
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      _uploadLabel(),
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                )
              : Text(
                  widget.isEditMode
                      ? (widget.existingAd?.status == AdStatus.rejected
                            ? (context.locale.languageCode == 'ne'
                                  ? 'पुन: पेश गर्नुहोस्'
                                  : 'Resubmit')
                            : (context.locale.languageCode == 'ne'
                                  ? 'अपडेट गर्नुहोस्'
                                  : 'Update Ad'))
                      : 'postAd.postAdNow'.tr(),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }

  /// "Uploading X%" while bytes are leaving the phone, then "Processing..."
  /// while the server optimizes images and creates the ad.
  String _uploadLabel() {
    final progress = _uploadProgress;
    final isNepali = context.locale.languageCode == 'ne';
    if (progress != null && progress < 0.99) {
      final percent = (progress * 100).round();
      return isNepali ? 'अपलोड हुँदैछ $percent%' : 'Uploading $percent%';
    }
    return isNepali ? 'प्रोसेस हुँदैछ...' : 'Processing...';
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: Colors.grey[800],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      fillColor: Colors.white,
      filled: true,
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    String? hintText,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      inputFormatters: inputFormatters,
      style: GoogleFonts.inter(fontSize: 15, color: Colors.black87),
      decoration: _inputDecoration().copyWith(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
      ),
    );
  }

  Widget _buildCharCount(String text) {
    return Align(
      alignment: Alignment.centerRight,
      child: Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Text(
          text,
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
        ),
      ),
    );
  }
}

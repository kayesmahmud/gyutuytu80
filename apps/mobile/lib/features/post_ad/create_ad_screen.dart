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
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/widgets/success_checkmark.dart';
import 'package:mobile/features/post_ad/models/ad_draft_model.dart';
import 'package:mobile/features/post_ad/models/location_models.dart';
import 'package:mobile/features/post_ad/services/ad_draft_service.dart';
import 'package:mobile/features/post_ad/services/form_template_service.dart';
import 'package:mobile/features/post_ad/widgets/dynamic_form_fields.dart';

class CreateAdScreen extends StatefulWidget {
  const CreateAdScreen({super.key});

  @override
  State<CreateAdScreen> createState() => _CreateAdScreenState();
}

class _CreateAdScreenState extends State<CreateAdScreen> {
  // Step Control
  int _currentStep = 0;
  final int _totalSteps = 3;

  // Form Keys for validation per step
  final _step1Key = GlobalKey<FormState>();
  final _step2Key = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();

  bool _isLoading = false;
  bool _priceNegotiable = false;

  // Data
  List<CategoryWithSubcategories> _categories = [];
  CategoryWithSubcategories? _selectedCategory;
  Category? _selectedSubCategory;

  // Images
  final ImagePicker _picker = ImagePicker();
  List<XFile> _selectedImages = [];

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

  // Contact Data
  final _whatsappController = TextEditingController();
  bool _whatsappSameAsPhone = true;
  final String _verifiedPhone =
      "9860887312"; // Mocked for now, should come from user profile

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
    _loadInitialData();
    _loadDrafts();
    _titleController.addListener(_onFormChanged);
    _descriptionController.addListener(_onFormChanged);
    _priceController.addListener(_onFormChanged);
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final categories = await _adClient.getCategories();
      final provinces = await _adClient.getLocationHierarchy();

      setState(() {
        _categories = categories;
        _provinces = provinces;
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
    _triggerAutoSave();
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
      _currentStep = 0;
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
    _titleController.removeListener(_onFormChanged);
    _descriptionController.removeListener(_onFormChanged);
    _priceController.removeListener(_onFormChanged);
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _whatsappController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    if (_selectedImages.length >= 5) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.maxImagesError'.tr())));
      return;
    }

    try {
      final List<XFile> images = await _picker.pickMultiImage();
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
          if (_selectedImages.length > 5) {
            _selectedImages = _selectedImages.sublist(0, 5);
          }
        });
      }
    } catch (e) {
      debugPrint('Error picking images: $e');
    }
  }

  void _nextStep() {
    if (_currentStep == 0) {
      if (!_step1Key.currentState!.validate()) return;
      if (_selectedCategory == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('postAd.selectCategoryError'.tr())),
        );
        return;
      }
      if (_selectedCategory!.subcategories.isNotEmpty &&
          _selectedSubCategory == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('postAd.selectSubcategoryError'.tr())),
        );
        return;
      }
    } else if (_currentStep == 1) {
      // Step 2: Visuals & Location
      // No Form key for images, but location uses dropdowns which might not be wrapped in Form, or we can wrap.
      // Actually previously Step 2 had _step2Key, which we are reusing.
      if (!_step2Key.currentState!.validate()) return;

      if (_selectedImages.isEmpty) {
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
    }

    if (_currentStep < _totalSteps - 1) {
      setState(() => _currentStep++);
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      Navigator.pop(context);
    }
  }

  Future<void> _submitAd() async {
    // Step 3 valid? WhatsApp check if needed
    if (_whatsappController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('postAd.validContactError'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Create FormData
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
        'attributes': jsonEncode(_attributeValues),
        'whatsapp_number':
            _whatsappController.text, // Assuming backend accepts this
      });

      // Add Images
      for (var image in _selectedImages) {
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(image.path, filename: image.name),
          ),
        );
      }

      final result = await _adClient.createAd(formData);

      if (result.success) {
        await _deleteDraftAfterPost();
        if (mounted) {
          await showSuccessDialog(context, message: 'postAd.adPosted'.tr());
          if (mounted) Navigator.pop(context);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(result.errorMessage)));
        }
      }
    } catch (e) {
      debugPrint("🔴 Post Ad Error: $e");
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
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
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
          'postAd.title'.tr(),
          style: GoogleFonts.inter(
            color: Colors.black,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
        actions: [
          if (_drafts.isNotEmpty || _currentDraftId != null)
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
            // Custom Stepper Indicator
            _buildStepIndicator(),
            const Divider(height: 1),

            // Draft status bar
            _buildDraftStatusBar(),

            // Drafts panel (slides in/out)
            AnimatedSize(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeInOut,
              child: _showDraftsPanel
                  ? _buildDraftsPanel()
                  : const SizedBox.shrink(),
            ),

            // Step Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: _buildCurrentStep(),
              ),
            ),

            // Bottom Navigation
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

  Widget _buildStepIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      child: Row(
        children: [
          _buildStepCircle(0, 'postAd.stepProduct'.tr()),
          _buildStepLine(0),
          _buildStepCircle(1, 'postAd.stepVisuals'.tr()),
          _buildStepLine(1),
          _buildStepCircle(2, 'postAd.stepContact'.tr()),
        ],
      ),
    );
  }

  Widget _buildStepCircle(int step, String label) {
    bool isActive = _currentStep >= step;
    bool isCurrent = _currentStep == step;

    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF10B981) : Colors.grey[200],
            shape: BoxShape.circle,
            border: isCurrent
                ? Border.all(color: const Color(0xFF047857), width: 2)
                : null,
          ),
          child: Center(
            child: isActive
                ? const Icon(LucideIcons.check, size: 18, color: Colors.white)
                : Text(
                    "${step + 1}",
                    style: GoogleFonts.inter(
                      color: Colors.grey[500],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            color: isActive ? Colors.black87 : Colors.grey[500],
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(int step) {
    bool isActive = _currentStep > step;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(
          horizontal: 8,
          vertical: 16,
        ), // Align with circle center roughly
        color: isActive ? const Color(0xFF10B981) : Colors.grey[200],
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildStep1();
      case 1:
        return _buildStep2();
      case 2:
        return _buildStep3();
      default:
        return const SizedBox.shrink();
    }
  }

  // Step 1: Product Info (Title -> Desc -> Price -> Category -> Specs)
  Widget _buildStep1() {
    return Form(
      key: _step1Key,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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

          const SizedBox(height: 16),
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
                    setState(() => _priceNegotiable = val!);
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

          const SizedBox(height: 24),
          _buildLabel('postAd.selectCategory'.tr()),
          DropdownButtonFormField<CategoryWithSubcategories>(
            value: _selectedCategory,
            hint: Text(
              'postAd.selectCategoryHint'.tr(),
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
            ),
            decoration: _inputDecoration(),
            items: _categories.map<DropdownMenuItem<CategoryWithSubcategories>>(
              (CategoryWithSubcategories cat) {
                return DropdownMenuItem<CategoryWithSubcategories>(
                  value: cat,
                  child: Text(
                    cat.localizedName(context.locale.languageCode),
                    style: GoogleFonts.inter(fontSize: 14),
                  ),
                );
              },
            ).toList(),
            onChanged: (val) {
              setState(() {
                _selectedCategory = val;
                _selectedSubCategory = null;
                _attributeValues.clear();
              });
              _onFormChanged();
            },
            icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
          ),

          if (_selectedCategory != null &&
              _selectedCategory!.subcategories.isNotEmpty) ...[
            const SizedBox(height: 20),
            _buildLabel('postAd.selectSubcategory'.tr()),
            DropdownButtonFormField<Category>(
              value: _selectedSubCategory,
              hint: Text(
                'postAd.selectSubcategoryHint'.tr(),
                style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
              ),
              decoration: _inputDecoration(),
              items: _selectedCategory!.subcategories
                  .map<DropdownMenuItem<Category>>((Category sub) {
                    return DropdownMenuItem<Category>(
                      value: sub,
                      child: Text(
                        sub.localizedName(context.locale.languageCode),
                        style: GoogleFonts.inter(fontSize: 14),
                      ),
                    );
                  })
                  .toList(),
              onChanged: (val) {
                setState(() {
                  _selectedSubCategory = val;
                  _attributeValues.clear();
                });
                _onFormChanged();
              },
              icon: const Icon(LucideIcons.chevronDown, color: Colors.grey),
            ),
          ],

          const SizedBox(height: 24),

          // Dynamic Fields
          Builder(
            builder: (context) {
              if (_selectedSubCategory == null) return const SizedBox.shrink();

              final categoryName = _selectedCategory!.name;
              final subcategoryName = _selectedSubCategory!.name;

              final fields = _templateService.getApplicableFields(
                categoryName,
                subcategoryName,
              );

              if (fields.isEmpty) return const SizedBox.shrink();

              return DynamicFormFields(
                locale: context.locale.languageCode,
                fields: fields,
                values: _attributeValues,
                onChanged: (key, value) {
                  setState(() {
                    _attributeValues[key] = value;
                  });
                },
              );
            },
          ),
        ],
      ),
    );
  }

  // Step 2: Visuals & Location
  Widget _buildStep2() {
    return Form(
      key: _step2Key,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'postAd.photosAndLocation'.tr(),
            style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),

          // Photos
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
            onTap: _pickImages,
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
              child: _selectedImages.isEmpty
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
                      itemCount: _selectedImages.length + 1,
                      itemBuilder: (context, index) {
                        if (index == _selectedImages.length) {
                          if (_selectedImages.length < 5) {
                            return GestureDetector(
                              onTap: _pickImages,
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
                        return Stack(
                          children: [
                            Container(
                              width: 100,
                              margin: const EdgeInsets.only(right: 8),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: DecorationImage(
                                  image: FileImage(
                                    File(_selectedImages[index].path),
                                  ),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            Positioned(
                              right: 4,
                              top: 4,
                              child: InkWell(
                                onTap: () {
                                  setState(() {
                                    _selectedImages.removeAt(index);
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

          const SizedBox(height: 32),

          // Location
          Text(
            'postAd.locationLabel'.tr(),
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),

          _buildLabel('postAd.provinceLabel'.tr()),
          DropdownButtonFormField<LocationProvince>(
            value: _selectedProvince,
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
      ),
    );
  }

  // Step 3: Contact (Phone + WhatsApp)
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                    _verifiedPhone,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: Colors.black87,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
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
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: OutlinedButton(
                  onPressed: _prevStep,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: BorderSide(color: Colors.grey[300]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    'common.back'.tr(),
                    style: GoogleFonts.inter(
                      color: Colors.black87,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),

          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _currentStep == _totalSteps - 1
                  ? (_isLoading ? null : _submitAd)
                  : _nextStep,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF10B981),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      _currentStep == _totalSteps - 1
                          ? 'postAd.postAdNow'.tr()
                          : 'common.next'.tr(),
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
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

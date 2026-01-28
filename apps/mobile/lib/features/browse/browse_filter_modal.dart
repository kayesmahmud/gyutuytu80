import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/api/ad_client.dart';

class BrowseFilterModal extends StatefulWidget {
  final String? initialExpandedSection;
  final SearchFilters? currentFilters;
  final Function(SearchFilters)? onApplyFilters;

  const BrowseFilterModal({
    super.key,
    this.initialExpandedSection,
    this.currentFilters,
    this.onApplyFilters,
  });

  @override
  State<BrowseFilterModal> createState() => _BrowseFilterModalState();
}

class _BrowseFilterModalState extends State<BrowseFilterModal> {
  final AdClient _adClient = AdClient();

  // Track expanded state of each section
  final Map<String, bool> _expandedSections = {
    "Categories": false,
    "Locations": false,
    "Price Range": false,
    "Condition": false,
    "Sort By": false,
  };

  // Track expanded state of specific IDs (for cascading location/categories)
  final Set<String> _expandedItems = {};

  // Selected values
  int? _selectedCategoryId;
  int? _selectedSubcategoryId;
  String? _selectedCategoryName;
  int? _selectedLocationId;
  String? _selectedLocationName;
  String _selectedCondition = ""; // empty = any
  String _selectedSort = "newest";
  double? _minPrice;
  double? _maxPrice;

  // Category data from API
  List<CategoryWithSubcategories> _categories = [];
  bool _loadingCategories = true;

  // Price controllers
  final TextEditingController _minPriceController = TextEditingController();
  final TextEditingController _maxPriceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialExpandedSection != null) {
      _expandedSections[widget.initialExpandedSection!] = true;
    }
    _loadFromCurrentFilters();
    _fetchCategories();
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  void _loadFromCurrentFilters() {
    if (widget.currentFilters != null) {
      final f = widget.currentFilters!;
      _selectedCategoryId = f.categoryId;
      _selectedSubcategoryId = f.subcategoryId;
      _selectedLocationId = f.locationId;
      _selectedCondition = f.condition ?? "";
      _minPrice = f.minPrice;
      _maxPrice = f.maxPrice;
      if (f.minPrice != null) {
        _minPriceController.text = f.minPrice!.toStringAsFixed(0);
      }
      if (f.maxPrice != null) {
        _maxPriceController.text = f.maxPrice!.toStringAsFixed(0);
      }
      // Map sortBy + sortOrder to our sort option
      if (f.sortBy == 'date') {
        _selectedSort = f.sortOrder == 'asc' ? 'oldest' : 'newest';
      } else if (f.sortBy == 'price') {
        _selectedSort = f.sortOrder == 'asc' ? 'price_asc' : 'price_desc';
      }
    }
  }

  Future<void> _fetchCategories() async {
    try {
      final categories = await _adClient.getCategories();
      if (mounted) {
        setState(() {
          _categories = categories;
          _loadingCategories = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingCategories = false;
        });
      }
    }
  }

  void _toggleSection(String title) {
    setState(() {
      _expandedSections[title] = !(_expandedSections[title] ?? false);
    });
  }

  void _toggleItem(String id) {
    setState(() {
      if (_expandedItems.contains(id)) {
        _expandedItems.remove(id);
      } else {
        _expandedItems.add(id);
      }
    });
  }

  void _applyFilters() {
    // Parse sort option
    String? sortBy;
    String? sortOrder;
    switch (_selectedSort) {
      case 'newest':
        sortBy = 'date';
        sortOrder = 'desc';
        break;
      case 'oldest':
        sortBy = 'date';
        sortOrder = 'asc';
        break;
      case 'price_asc':
        sortBy = 'price';
        sortOrder = 'asc';
        break;
      case 'price_desc':
        sortBy = 'price';
        sortOrder = 'desc';
        break;
    }

    // Parse price
    final minPrice = double.tryParse(_minPriceController.text);
    final maxPrice = double.tryParse(_maxPriceController.text);

    final filters = SearchFilters(
      categoryId: _selectedCategoryId,
      subcategoryId: _selectedSubcategoryId,
      locationId: _selectedLocationId,
      areaId: null,
      condition: _selectedCondition.isEmpty ? null : _selectedCondition,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sortBy: sortBy,
      sortOrder: sortOrder,
      query: widget.currentFilters?.query, // Preserve search query
    );

    widget.onApplyFilters?.call(filters);
    Navigator.pop(context);
  }

  void _resetFilters() {
    setState(() {
      _selectedCategoryId = null;
      _selectedSubcategoryId = null;
      _selectedCategoryName = null;
      _selectedLocationId = null;
      _selectedLocationName = null;
      _selectedCondition = "";
      _selectedSort = "newest";
      _minPrice = null;
      _maxPrice = null;
      _minPriceController.clear();
      _maxPriceController.clear();
      _expandedItems.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle Bar (Grey line at top)
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Filters",
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Scrollable Content
          Expanded(
            child: ListView(
              children: [
                _buildExpandableSection(
                  title: "Categories",
                  isExpanded: _expandedSections["Categories"] ?? false,
                  content: _buildCategoriesContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Locations",
                  isExpanded: _expandedSections["Locations"] ?? false,
                  content: _buildLocationsContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Price Range",
                  isExpanded: _expandedSections["Price Range"] ?? false,
                  content: _buildPriceContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Condition",
                  isExpanded: _expandedSections["Condition"] ?? false,
                  content: _buildConditionContent(),
                ),
                _buildDivider(),
                _buildExpandableSection(
                  title: "Sort By",
                  isExpanded: _expandedSections["Sort By"] ?? false,
                  content: _buildSortContent(),
                ),
                _buildDivider(),
              ],
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _resetFilters,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(color: Colors.grey[300]!),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      "Reset",
                      style: GoogleFonts.inter(
                        color: Colors.black,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _applyFilters,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      "Show Results",
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() => Divider(height: 1, color: Colors.grey[100]);

  Widget _buildExpandableSection({
    required String title,
    required bool isExpanded,
    required Widget content,
  }) {
    return Column(
      children: [
        InkWell(
          onTap: () => _toggleSection(title),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                Icon(
                  isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  color: Colors.grey[600],
                ),
              ],
            ),
          ),
        ),
        if (isExpanded) content,
      ],
    );
  }

  // --- Category Builder with API Data ---
  Widget _buildCategoriesContent() {
    if (_loadingCategories) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Container(
      color: Colors.grey[50],
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          // "All Categories" Option
          InkWell(
            onTap: () => setState(() {
              _selectedCategoryId = null;
              _selectedSubcategoryId = null;
              _selectedCategoryName = null;
            }),
            child: Container(
              color: _selectedCategoryId == null ? const Color(0xFFFFF1F2) : Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  const Icon(Icons.folder_open, color: Colors.grey),
                  const SizedBox(width: 12),
                  Text("All Categories", style: GoogleFonts.inter(fontSize: 14)),
                  const Spacer(),
                  if (_selectedCategoryId == null)
                    Icon(Icons.check, color: AppTheme.primary, size: 18),
                ],
              ),
            ),
          ),

          // List of Categories from API
          ..._categories.map((cat) => _buildCategoryItem(cat)),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(CategoryWithSubcategories category) {
    final hasSub = category.subcategories?.isNotEmpty ?? false;
    final isExpanded = _expandedItems.contains("cat_${category.id}");
    final isSelected = _selectedCategoryId == category.id && _selectedSubcategoryId == null;

    return Column(
      children: [
        InkWell(
          onTap: () {
            setState(() {
              _selectedCategoryId = category.id;
              _selectedSubcategoryId = null;
              _selectedCategoryName = category.name;
            });
          },
          child: Container(
            color: isSelected ? const Color(0xFFFFF1F2) : Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
            child: Row(
              children: [
                // Expand Icon (if has subs)
                if (hasSub)
                  InkWell(
                    onTap: () => _toggleItem("cat_${category.id}"),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: Icon(
                        isExpanded ? Icons.keyboard_arrow_down : Icons.keyboard_arrow_right,
                        size: 18,
                        color: Colors.grey[600],
                      ),
                    ),
                  )
                else
                  const SizedBox(width: 26),

                // Icon
                Text(category.icon ?? "📁", style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 12),

                // Name
                Expanded(
                  child: Text(
                    category.name,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: isSelected ? AppTheme.primary : Colors.black87,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),

                if (isSelected)
                  Icon(Icons.check, color: AppTheme.primary, size: 18),
              ],
            ),
          ),
        ),
        // Draw Subcategories if expanded
        if (hasSub && isExpanded)
          ...category.subcategories!.map((sub) => _buildSubcategoryItem(sub, category.id)),
      ],
    );
  }

  Widget _buildSubcategoryItem(Category subcategory, int parentId) {
    final isSelected = _selectedSubcategoryId == subcategory.id;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedCategoryId = parentId;
          _selectedSubcategoryId = subcategory.id;
          _selectedCategoryName = subcategory.name;
        });
      },
      child: Container(
        color: isSelected ? const Color(0xFFFFF1F2) : Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
        child: Row(
          children: [
            const SizedBox(width: 50), // Indentation
            Expanded(
              child: Text(
                subcategory.name,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: isSelected ? AppTheme.primary : Colors.black87,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check, color: AppTheme.primary, size: 18),
          ],
        ),
      ),
    );
  }

  // --- Location Builder (simplified for now) ---
  Widget _buildLocationsContent() {
    return Container(
      color: Colors.grey[50],
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        children: [
          // Search Box
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: TextField(
              decoration: InputDecoration(
                hintText: "Search location...",
                hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
                prefixIcon: Icon(Icons.search, color: Colors.grey[400], size: 20),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ),

          // All Nepal Option
          InkWell(
            onTap: () => setState(() {
              _selectedLocationId = null;
              _selectedLocationName = null;
            }),
            child: Container(
              color: _selectedLocationId == null ? const Color(0xFFFFF1F2) : Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
              child: Row(
                children: [
                  const Icon(Icons.public, color: Colors.grey, size: 20),
                  const SizedBox(width: 12),
                  Text("All Nepal", style: GoogleFonts.inter(fontSize: 14)),
                  const Spacer(),
                  if (_selectedLocationId == null)
                    Icon(Icons.check, color: AppTheme.primary, size: 18),
                ],
              ),
            ),
          ),

          // TODO: Fetch and display actual locations from API
          // For now, showing a placeholder message
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              "Location filter coming soon",
              style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceContent() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _minPriceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: "Min Price (Rs.)",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _maxPriceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: "Max Price (Rs.)",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConditionContent() {
    final conditions = ["Any Condition", "Brand New", "Used"];
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: conditions.map((c) {
          final val = c == "Any Condition" ? "" : c; // Use exact value for DB match
          return RadioListTile(
            title: Text(c),
            value: val,
            groupValue: _selectedCondition,
            onChanged: (v) => setState(() => _selectedCondition = v.toString()),
            dense: true,
            activeColor: AppTheme.primary,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSortContent() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          RadioListTile(
            value: "newest",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: const Text("Newest First"),
            activeColor: AppTheme.primary,
          ),
          RadioListTile(
            value: "oldest",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: const Text("Oldest First"),
            activeColor: AppTheme.primary,
          ),
          RadioListTile(
            value: "price_asc",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: const Text("Price: Low to High"),
            activeColor: AppTheme.primary,
          ),
          RadioListTile(
            value: "price_desc",
            groupValue: _selectedSort,
            onChanged: (v) => setState(() => _selectedSort = v.toString()),
            title: const Text("Price: High to Low"),
            activeColor: AppTheme.primary,
          ),
        ],
      ),
    );
  }
}

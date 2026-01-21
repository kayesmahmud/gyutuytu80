import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/theme/app_theme.dart';

import 'package:mobile/core/data/mock_filter_data.dart';

class BrowseFilterModal extends StatefulWidget {
  final String? initialExpandedSection;

  const BrowseFilterModal({super.key, this.initialExpandedSection});

  @override
  State<BrowseFilterModal> createState() => _BrowseFilterModalState();
}

class _BrowseFilterModalState extends State<BrowseFilterModal> {
  // Track expanded state of each section
  final Map<String, bool> _expandedSections = {
    "Categories": false,
    "Locations": false,
    "Price Range": false,
    "Condition": false,
    "Sort By": false,
  };

  // Track expanded state of specific IDs (for cascading location/categories)
  // Using a Set of Strings to store unique identifiers like "cat_mobiles", "loc_bagmati", "loc_kathmandu_dist"
  final Set<String> _expandedItems = {};

  // Selected values
  String? _selectedCategorySlug;
  String? _selectedLocationName;
  String _selectedCondition = ""; // empty = any
  String _selectedSort = "newest";


  @override
  void initState() {
    super.initState();
    if (widget.initialExpandedSection != null) {
      _expandedSections[widget.initialExpandedSection!] = true;
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
                    onPressed: () {
                      setState(() {
                         _selectedCategorySlug = null;
                         _selectedLocationName = null;
                         _selectedCondition = "";
                         _selectedSort = "newest";
                         _expandedItems.clear();
                      });
                    },
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
                    onPressed: () => Navigator.pop(context),
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

  // --- Recursive Category Builder ---
  Widget _buildCategoriesContent() {
    return Container(
      color: Colors.grey[50], // Light grey background for the dropdown area
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          // "All Categories" Option
           InkWell(
             onTap: () => setState(() => _selectedCategorySlug = null),
             child: Container(
               color: _selectedCategorySlug == null ? const Color(0xFFFFF1F2) : Colors.transparent, // Rose-50 looks
               padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
               child: Row(
                 children: [
                   const Icon(Icons.folder_open, color: Colors.grey),
                   const SizedBox(width: 12),
                   Text("All Categories", style: GoogleFonts.inter(fontSize: 14)),
                   const Spacer(),
                     if (_selectedCategorySlug == null) 
                       Icon(Icons.check, color: AppTheme.primary, size: 18),
                 ],
               ),
             ),
           ),
           
           // List of Categories
           ...MockFilterData.categories.map((cat) => _buildRecursiveCategoryItem(cat, 0)),
        ],
      ),
    );
  }

  Widget _buildRecursiveCategoryItem(Map<String, dynamic> category, int depth) {
    final subcategories = category['subcategories'] as List?;
    final hasSub = subcategories != null && subcategories.isNotEmpty;
    final slug = category['slug'] as String;
    final isExpanded = _expandedItems.contains("cat_$slug");
    final isSelected = _selectedCategorySlug == slug;

    return Column(
      children: [
        InkWell(
          onTap: () {
            if (hasSub) {
              // If tapping parent, user might want to expand OR select. 
              // Typically tapping the arrow expands, tapping body selects.
              // For simplicity, let's say tapping selects, but we also have an arrow to expand.
              setState(() => _selectedCategorySlug = slug);
            } else {
               setState(() => _selectedCategorySlug = slug);
            }
          },
          child: Container(
            color: isSelected ? const Color(0xFFFFF1F2) : Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
            child: Row(
              children: [
                // Indentation
                SizedBox(width: depth * 24.0),
                
                // Expand Icon (if has subs)
                if (hasSub) 
                  InkWell(
                    onTap: () => _toggleItem("cat_$slug"),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: Icon(
                        isExpanded ? Icons.keyboard_arrow_down : Icons.keyboard_arrow_right, 
                        size: 18, 
                        color: Colors.grey[600]
                      ),
                    ),
                  )
                else
                   SizedBox(width: 26), // alignment spacer

                // Icon
                if (depth == 0) ...[
                  Text(category['icon'] ?? "📁", style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 12),
                ],

                // Name
                Expanded(
                  child: Text(
                    category['name'],
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
          ...subcategories.map((sub) => _buildRecursiveCategoryItem(sub, depth + 1)),
      ],
    );
  }

  // --- Cascading Location Builder ---
  // Structure: Province -> District -> Municipality -> Area
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
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ),
          
          // Locations Tree
           ...MockFilterData.locations.map((loc) => _buildRecursiveLocationItem(loc, 0)),
        ],
      ),
    );
  }

  Widget _buildRecursiveLocationItem(Map<String, dynamic> location, int depth) {
    final children = location['children'] as List?;
    final hasChildren = children != null && children.isNotEmpty;
    final name = location['name'] as String;
    // Use name as ID for simplicity in this mock
    final isExpanded = _expandedItems.contains("loc_$name");
    final isSelected = _selectedLocationName == name;

    return Column(
      children: [
        // Location Row
        Container(
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
          ),
          child: Row(
            children: [
                 // Indentation
                SizedBox(width: depth * 16.0),
                
                // Expand Button
                IconButton(
                  icon: Icon(
                    isExpanded ? Icons.keyboard_arrow_down : Icons.keyboard_arrow_right,
                    size: 18,
                    color: hasChildren ? Colors.grey[600] : Colors.transparent, // Hide arrow if no kids
                  ),
                  onPressed: hasChildren ? () => _toggleItem("loc_$name") : null,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 40),
                ),

                // Name (Selectable)
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _selectedLocationName = name),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(
                        name,
                        style: GoogleFonts.inter(
                          fontSize: 14 - (depth * 0.5), // Slightly smaller for deeper levels
                          color: isSelected ? AppTheme.primary : Colors.black87,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),

        // Render Children
        if (hasChildren && isExpanded)
          ...children.map((child) => _buildRecursiveLocationItem(child, depth + 1)),
      ],
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
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: "Max Price (Rs.)",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (){},
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white),
              child: const Text("Apply Price"),
            ),
          )
        ],
      ),
    );
  }

   Widget _buildConditionContent() {
     final conditions = ["Any Condition", "New", "Used"];
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: conditions.map((c) {
          final val = c == "Any Condition" ? "" : c.toLowerCase();
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
          RadioListTile(value: "newest", groupValue: _selectedSort, onChanged: (v) => setState(() => _selectedSort = v.toString()), title: const Text("Newest First"), activeColor: AppTheme.primary),
          RadioListTile(value: "oldest", groupValue: _selectedSort, onChanged: (v) => setState(() => _selectedSort = v.toString()), title: const Text("Oldest First"), activeColor: AppTheme.primary),
          RadioListTile(value: "price_asc", groupValue: _selectedSort, onChanged: (v) => setState(() => _selectedSort = v.toString()), title: const Text("Price: Low to High"), activeColor: AppTheme.primary),
          RadioListTile(value: "price_desc", groupValue: _selectedSort, onChanged: (v) => setState(() => _selectedSort = v.toString()), title: const Text("Price: High to Low"), activeColor: AppTheme.primary),
        ],
      ),
    );
  }
}

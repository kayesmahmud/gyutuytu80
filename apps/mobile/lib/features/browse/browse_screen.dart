import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/browse/browse_filter_modal.dart';

import 'package:mobile/core/widgets/main_app_bar.dart';

class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50], // Light grey background
      appBar: const MainAppBar(),
      body: SafeArea(
        child: Column(
          children: [
            // Sticky Header (Search & Filters)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.only(top: 16, bottom: 8),
              child: Column(
                children: [
                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 48, // Taller search bar
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.grey[300]!),
                            ),
                            child: Row(
                              children: [
                                const SizedBox(width: 12),
                                Icon(Icons.search, color: Colors.grey[500]),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextField(
                                    decoration: InputDecoration(
                                      hintText: "Search for anything...",
                                      hintStyle: GoogleFonts.inter(color: Colors.grey[500]),
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(vertical: 13), // Center text
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Search Button
                        Container(
                          height: 48,
                          width: 48,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981), // Emerald Green
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.search, color: Colors.white),
                            onPressed: () {},
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Filter Chips (Horizontal Scroll)
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        _buildFilterChip(context, "All Nepal", icon: Icons.location_on, openSection: "Locations"),
                        _buildFilterChip(context, "Category", icon: Icons.grid_view, openSection: "Categories"),
                        _buildFilterChip(context, "Condition", icon: Icons.tag, openSection: "Condition"),
                        _buildFilterChip(context, "Sort by", icon: Icons.sort, openSection: "Sort By"),
                        // Circular Filter Settings
                        InkWell(
                          onTap: () => _showFilterModal(context),
                          child: Container(
                             width: 36,
                             height: 36,
                             margin: const EdgeInsets.only(left: 8),
                             decoration: BoxDecoration(
                               shape: BoxShape.circle,
                               border: Border.all(color: Colors.grey[300]!),
                             ),
                             child: Icon(Icons.tune, size: 18, color: Colors.grey[700]),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),

            // Ad Grid
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.65, // Adjust based on card content height
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                ),
                itemCount: 8, // Demo count
                itemBuilder: (context, index) {
                  return _buildAdCard(
                    title: index % 2 == 0 ? "iPhone 13 Pro Max - Blue" : "Leather Sofa Set",
                    price: index % 2 == 0 ? "Rs. 1,15,000" : "Rs. 45,000",
                    category: index % 2 == 0 ? "Mobiles" : "Furniture",
                    location: "Kathmandu",
                    timeAgo: "2 hours ago",
                    isNew: index % 3 == 0,
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Scroll to top logic
        },
        mini: true,
        backgroundColor: Colors.red,
        child: const Icon(Icons.arrow_upward, color: Colors.white),
      ),
    );
  }

  void _showFilterModal(BuildContext context, {String? expandSection}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => BrowseFilterModal(initialExpandedSection: expandSection),
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, String label, {IconData? icon, String? openSection}) {
    return InkWell(
      onTap: () => _showFilterModal(context, expandSection: openSection),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: Colors.grey[700]),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: Colors.grey[800],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down, size: 16, color: Colors.grey[500]),
          ],
        ),
      ),
    );
  }

  Widget _buildAdCard({
    required String title,
    required String price,
    required String category,
    required String location,
    required String timeAgo,
    required bool isNew,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image / Badge Section
          Expanded(
            child: Stack(
              children: [
                // Placeholder Image
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  ),
                  child: Center(
                    child: Icon(Icons.image_outlined, size: 40, color: Colors.grey[300]),
                  ),
                ),
                // Location/Featured Badge (Top Left - inferred from common patterns, screenshot shows badge)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.camera_alt, color: Colors.white, size: 10),
                         const SizedBox(width: 4),
                        Text("3", style: GoogleFonts.inter(color: Colors.white, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
                // Status Badge (Bottom Right)
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isNew ? const Color(0xFF10B981) : Colors.blue, // Green for NEW, Blue for USED (inferred)
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isNew ? "NEW" : "USED",
                      style: GoogleFonts.inter(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Info Section
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppTheme.textDark,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                
                // Category with Icon
                Row(
                  children: [
                    Icon(Icons.folder_open, size: 12, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        category,
                        style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600]),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 6),
                
                // Price
                Text(
                  price,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF10B981),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                
                const SizedBox(height: 8),
                Divider(height: 1, color: Colors.grey[200]),
                const SizedBox(height: 8),

                // Footer (Seller & Time)
                Row(
                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 8,
                          backgroundColor: Colors.grey[200],
                          child: Icon(Icons.person, size: 10, color: Colors.grey[500]),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          "Seller",
                          style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600]),
                        ),
                        const SizedBox(width: 2),
                        const Icon(Icons.verified, size: 10, color: Colors.blue),
                      ],
                    ),
                    Row(
                      children: [
                         Icon(Icons.access_time, size: 10, color: Colors.grey[400]),
                         const SizedBox(width: 2),
                         Text(
                          timeAgo,
                           style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400]),
                         ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

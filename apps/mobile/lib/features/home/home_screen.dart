import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import 'package:mobile/core/widgets/main_app_bar.dart';
import 'package:mobile/core/widgets/main_drawer.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/data/mock_filter_data.dart';
import 'package:mobile/core/widgets/ad_banner_widget.dart';
import 'package:mobile/core/services/ad_service.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:mobile/core/widgets/tap_scale.dart';
import 'package:mobile/core/widgets/search_suggestions_overlay.dart';
import 'package:mobile/core/services/search_history_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:mobile/core/utils/skeleton_data.dart';

class HomeScreen extends StatefulWidget {
  final void Function(String query)? onSearch;
  final void Function(int categoryId, String categoryName)? onCategoryTap;

  const HomeScreen({super.key, this.onSearch, this.onCategoryTap});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final AdClient _adClient = AdClient();
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final LayerLink _searchLayerLink = LayerLink();
  final SearchSuggestionsController _suggestionsController =
      SearchSuggestionsController();

  // State
  List<CategoryWithSubcategories> _categories = [];
  List<AdWithDetails> _featuredAds = [];
  List<AdWithDetails> _latestAds = [];
  // Pre-sliced lists to avoid .take().toList() in build
  List<AdWithDetails> _displayLatestAds = [];
  List<AdWithDetails> _displayFeaturedAds = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _searchFocusNode.addListener(_onSearchFocusChanged);
  }

  @override
  void dispose() {
    _searchFocusNode.removeListener(_onSearchFocusChanged);
    _searchFocusNode.dispose();
    _suggestionsController.hide();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchFocusChanged() {
    if (_searchFocusNode.hasFocus) {
      _suggestionsController.show(
        context: context,
        layerLink: _searchLayerLink,
        width: MediaQuery.of(context).size.width - 32,
        textController: _searchController,
        onSearch: _submitSearch,
      );
    } else {
      _suggestionsController.hide();
    }
  }

  void _submitSearch() {
    _suggestionsController.hide();
    _searchFocusNode.unfocus();
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      SearchHistoryService.addSearch(query);
      widget.onSearch?.call(query);
    }
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);

    try {
      // Fetch all data in parallel
      final results = await Future.wait([
        _adClient.getCategories(),
        _adClient.getFeaturedAds(limit: 6),
        _adClient.getLatestAds(limit: 8),
      ]);

      if (mounted) {
        setState(() {
          _categories = results[0] as List<CategoryWithSubcategories>;
          _featuredAds = (results[1] as PaginatedResponse<AdWithDetails>).data;
          _latestAds = (results[2] as PaginatedResponse<AdWithDetails>).data;
          _displayLatestAds = _latestAds.take(4).toList();
          _displayFeaturedAds = _featuredAds.take(4).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainAppBar(),
      drawer: const MainDrawer(),
      body: RefreshIndicator(
        onRefresh: () async {
          await _fetchData();
          HapticFeedback.mediumImpact();
        },
        color: const Color(0xFF10B981),
        child: Skeletonizer(
          enabled: _isLoading,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeroSection(context),

                const SizedBox(height: 24),
                _buildSectionHeader("Browse Categories", ""),
                const SizedBox(height: 12),
                _buildCategoriesList(),

                const SizedBox(height: 24),
                _buildSectionHeader("Latest Ads", "View All Ads >"),
                const SizedBox(height: 12),
                _buildAdsGrid(
                  _isLoading ? SkeletonData.fakeAds(4) : _displayLatestAds,
                ),

                if (!_isLoading)
                  AdBannerWidget(adUnitId: AdService.homeBannerTopId),

                const SizedBox(height: 24),
                _buildFeaturedHeader(),
                const SizedBox(height: 12),
                _buildFeaturedAdsGrid(
                  _isLoading ? SkeletonData.fakeAds(4) : _displayFeaturedAds,
                ),

                const SizedBox(height: 50),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF6366f1), Color(0xFFA855F7), Color(0xFFEC4899)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Buy, Sell, and Rent Across Nepal",
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Nepal's Leading Classifieds Marketplace",
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
          const SizedBox(height: 16),

          // Search Bar
          CompositedTransformTarget(
            link: _searchLayerLink,
            child: TextField(
              controller: _searchController,
              focusNode: _searchFocusNode,
              onSubmitted: (_) => _submitSearch(),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: "Search for anything...",
                hintStyle: GoogleFonts.inter(fontSize: 14, color: Colors.grey),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 0,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                suffixIcon: GestureDetector(
                  onTap: _submitSearch,
                  child: Container(
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      LucideIcons.search,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, String actionText) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textDark,
            ),
          ),
          Text(
            actionText,
            style: GoogleFonts.inter(
              color: AppTheme.primary,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriesList() {
    // Merge hardcoded categories with API categories
    // - Hardcoded: always shown (works offline)
    // - API: if new categories exist from backend, append them
    final mergedCategories = _getMergedCategories();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(left: 16),
      child: Row(
        children: mergedCategories
            .map(
              (cat) => _buildStaticEmojiCategoryItem(
                cat['icon'] as String,
                (cat['shortName'] ?? cat['name'])
                    as String, // Use shortName for display
                cat['slug'] as String,
              ),
            )
            .toList(),
      ),
    );
  }

  /// Merges hardcoded categories with API categories
  /// Returns hardcoded list + any new categories from API
  List<Map<String, dynamic>> _getMergedCategories() {
    // Start with hardcoded categories
    final List<Map<String, dynamic>> merged = List.from(
      MockFilterData.categories,
    );

    // Get slugs from hardcoded categories for comparison
    final hardcodedSlugs = MockFilterData.categories
        .map((c) => c['slug'] as String)
        .toSet();

    // Add any new categories from API that don't exist in hardcoded list
    for (final apiCategory in _categories) {
      if (!hardcodedSlugs.contains(apiCategory.slug)) {
        merged.add({
          'name': apiCategory.name,
          'shortName': apiCategory.name, // API categories use name as shortName
          'icon': apiCategory.icon ?? '📁', // Default icon if none
          'slug': apiCategory.slug,
        });
      }
    }

    return merged;
  }

  Widget _buildStaticCategoryItem(IconData icon, String label) {
    bool isProperty = label == "Property";
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isProperty ? const Color(0xFFF43F5E) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Icon(
              icon,
              size: 24,
              color: isProperty ? Colors.white : AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textDark),
          ),
        ],
      ),
    );
  }

  Widget _buildStaticEmojiCategoryItem(String emoji, String name, String slug) {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: TapScale(
        onTap: () {
          // Find category ID from API categories by slug
          final apiCat = _categories
              .cast<CategoryWithSubcategories?>()
              .firstWhere((c) => c?.slug == slug, orElse: () => null);
          if (apiCat != null && widget.onCategoryTap != null) {
            widget.onCategoryTap!(apiCat.id, apiCat.name);
          }
        },
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Text(emoji, style: const TextStyle(fontSize: 24)),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 70,
              child: Text(
                name,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textDark,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryItem(CategoryWithSubcategories category) {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      child: GestureDetector(
        onTap: () {
          // TODO: Navigate to browse with category filter
        },
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Text(
                category.icon ?? "📁",
                style: const TextStyle(fontSize: 24),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 60,
              child: Text(
                category.name,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textDark,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdsGrid(List<AdWithDetails> ads) {
    if (ads.isEmpty) {
      return StaggeredFadeIn(
        index: 0,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Center(
            child: Text(
              "No ads yet",
              style: GoogleFonts.inter(color: Colors.grey[500]),
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        childAspectRatio: 0.65, // Adjusted for more info content
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: ads
            .asMap()
            .entries
            .map(
              (entry) => StaggeredFadeIn(
                index: entry.key,
                child: RepaintBoundary(child: AdCard(ad: entry.value)),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildFeaturedHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.star, color: Colors.amber, size: 24),
              const SizedBox(width: 8),
              Text(
                "Featured Ads",
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "Premium listings from verified sellers",
            style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedAdsGrid(List<AdWithDetails> ads) {
    if (ads.isEmpty) {
      return StaggeredFadeIn(
        index: 0,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Center(
            child: Text(
              "No featured ads yet",
              style: GoogleFonts.inter(color: Colors.grey[500]),
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        childAspectRatio: 0.65, // Unified aspect ratio
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: ads
            .asMap()
            .entries
            .map(
              (entry) => StaggeredFadeIn(
                index: entry.key,
                child: RepaintBoundary(child: AdCard(ad: entry.value)),
              ),
            )
            .toList(),
      ),
    );
  }

  String _formatPrice(double? price) {
    if (price == null) return 'Contact for price';
    final formatted = price
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return 'Rs. $formatted';
  }
}

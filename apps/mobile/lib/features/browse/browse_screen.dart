import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/features/browse/browse_filter_modal.dart';
import 'package:mobile/core/widgets/main_app_bar.dart';
import 'package:mobile/core/widgets/main_drawer.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/core/widgets/staggered_fade_in.dart';
import 'package:mobile/core/widgets/search_suggestions_overlay.dart';
import 'package:mobile/core/services/search_history_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:mobile/core/utils/skeleton_data.dart';

class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  @override
  State<BrowseScreen> createState() => BrowseScreenState();
}

class BrowseScreenState extends State<BrowseScreen> {
  final AdClient _adClient = AdClient();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _searchFocusNode = FocusNode();
  final LayerLink _searchLayerLink = LayerLink();
  final SearchSuggestionsController _suggestionsController =
      SearchSuggestionsController();

  // State
  List<AdWithDetails> _ads = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;

  bool _showFab = false;

  // Filters
  SearchFilters _filters = SearchFilters();

  @override
  void initState() {
    super.initState();
    _fetchAds();
    _scrollController.addListener(_onScroll);
    _searchFocusNode.addListener(_onSearchFocusChanged);
  }

  @override
  void dispose() {
    _searchFocusNode.removeListener(_onSearchFocusChanged);
    _searchFocusNode.dispose();
    _suggestionsController.hide();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onSearchFocusChanged() {
    if (_searchFocusNode.hasFocus) {
      _suggestionsController.show(
        context: context,
        layerLink: _searchLayerLink,
        width: MediaQuery.of(context).size.width - 92,
        textController: _searchController,
        onSearch: _onSearch,
      );
    } else {
      _suggestionsController.hide();
    }
  }

  void _onScroll() {
    final show = _scrollController.offset > 200;
    if (show != _showFab) setState(() => _showFab = show);

    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreAds();
    }
  }

  Future<void> _fetchAds({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _ads = [];
      });
    }

    setState(() {
      _isLoading = _ads.isEmpty;
      _error = null;
    });

    try {
      final response = await _adClient.searchAds(
        _filters,
        page: _currentPage,
        limit: 20,
      );

      if (response.success) {
        setState(() {
          _ads = response.data;
          _totalPages = response.pagination?.totalPages ?? 1;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response.errorMessage ?? 'Failed to load ads';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Network error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreAds() async {
    if (_isLoadingMore || _currentPage >= _totalPages) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final response = await _adClient.searchAds(
        _filters,
        page: _currentPage + 1,
        limit: 20,
      );

      if (response.success) {
        setState(() {
          _ads.addAll(response.data);
          _currentPage++;
          _isLoadingMore = false;
        });
      } else {
        setState(() {
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingMore = false;
      });
    }
  }

  void _onSearch() {
    _suggestionsController.hide();
    _searchFocusNode.unfocus();
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      SearchHistoryService.addSearch(query);
    }
    setState(() {
      _filters = _filters.copyWith(query: query);
    });
    _fetchAds(refresh: true);
  }

  /// Called from HomeScreen search to trigger search with a query
  void searchFor(String query) {
    _searchController.text = query;
    _onSearch();
  }

  /// Called from HomeScreen category carousel to filter by category
  void filterByCategory(int categoryId, String categoryName) {
    _searchController.clear();
    _applyFilters(
      SearchFilters(categoryId: categoryId, categoryName: categoryName),
    );
  }

  void _applyFilters(SearchFilters newFilters) {
    setState(() {
      _filters = newFilters;
    });
    _fetchAds(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: const MainAppBar(),
      drawer: const MainDrawer(),
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
                          child: CompositedTransformTarget(
                            link: _searchLayerLink,
                            child: SizedBox(
                              height: 48,
                              child: TextField(
                                controller: _searchController,
                                focusNode: _searchFocusNode,
                                onSubmitted: (_) => _onSearch(),
                                decoration: InputDecoration(
                                  hintText: "Search for anything...",
                                  hintStyle: GoogleFonts.inter(
                                    color: Colors.grey[500],
                                  ),
                                  filled: true,
                                  fillColor: Colors.grey[100],
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 13,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: Colors.grey[300]!,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: Colors.grey[300]!,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: const BorderSide(
                                      color: Color(0xFF10B981),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          height: 48,
                          width: 48,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: IconButton(
                            icon: const Icon(
                              LucideIcons.search,
                              color: Colors.white,
                            ),
                            onPressed: _onSearch,
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
                        _buildFilterChip(
                          context,
                          _filters.locationName ?? "All Nepal",
                          icon: LucideIcons.mapPin,
                          openSection: "Locations",
                          isActive: _filters.locationId != null,
                        ),
                        _buildFilterChip(
                          context,
                          _filters.categoryName ?? "Category",
                          icon: LucideIcons.layoutGrid,
                          openSection: "Categories",
                          isActive: _filters.categoryId != null,
                        ),
                        _buildFilterChip(
                          context,
                          _filters.condition != null
                              ? (_filters.condition == 'new'
                                    ? 'Brand New'
                                    : 'Used')
                              : "Condition",
                          icon: LucideIcons.tag,
                          openSection: "Condition",
                          isActive: _filters.condition != null,
                        ),
                        _buildFilterChip(
                          context,
                          "Sort by",
                          icon: LucideIcons.arrowUpDown,
                          openSection: "Sort By",
                          isActive: _filters.sortBy != null,
                        ),
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
                            child: Icon(
                              LucideIcons.slidersHorizontal,
                              size: 18,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),

            // Ad Grid or Loading/Error State
            Expanded(child: _buildBody()),
          ],
        ),
      ),
      floatingActionButton: IgnorePointer(
        ignoring: !_showFab,
        child: AnimatedSlide(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
          offset: _showFab ? Offset.zero : const Offset(0, 2),
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 300),
            opacity: _showFab ? 1.0 : 0.0,
            child: FloatingActionButton(
              onPressed: () {
                _scrollController.animateTo(
                  0,
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeInOut,
                );
              },
              mini: true,
              backgroundColor: Colors.red,
              child: const Icon(LucideIcons.arrowUp, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      final fakeAds = SkeletonData.fakeAds(6);
      return Skeletonizer(
        enabled: true,
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.65,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
          ),
          itemCount: 6,
          itemBuilder: (context, index) => AdCard(ad: fakeAds[index]),
        ),
      );
    }

    if (_error != null) {
      return StaggeredFadeIn(
        index: 0,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.alertCircle, size: 48, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: GoogleFonts.inter(color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => _fetchAds(refresh: true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                ),
                child: const Text(
                  'Retry',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_ads.isEmpty) {
      return StaggeredFadeIn(
        index: 0,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.inbox, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                'No ads found',
                style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 8),
              Text(
                'Try adjusting your filters',
                style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await _fetchAds(refresh: true);
        HapticFeedback.mediumImpact();
      },
      color: const Color(0xFF10B981),
      child: GridView.builder(
        controller: _scrollController,
        cacheExtent: 500,
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.65,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
        ),
        itemCount: _ads.length + (_isLoadingMore ? 2 : 0),
        itemBuilder: (context, index) {
          if (index >= _ads.length) {
            return const Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
          }

          final ad = _ads[index];
          return StaggeredFadeIn(
            index: index,
            child: RepaintBoundary(child: AdCard(ad: ad)),
          );
        },
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
        builder: (_, controller) => BrowseFilterModal(
          initialExpandedSection: expandSection,
          currentFilters: _filters,
          onApplyFilters: _applyFilters,
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    String label, {
    IconData? icon,
    String? openSection,
    bool isActive = false,
  }) {
    return InkWell(
      onTap: () => _showFilterModal(context, expandSection: openSection),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFECFDF5) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? const Color(0xFF10B981) : Colors.grey[300]!,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 16,
                color: isActive ? const Color(0xFF10B981) : Colors.grey[700],
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: isActive ? const Color(0xFF10B981) : Colors.grey[800],
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              LucideIcons.chevronDown,
              size: 16,
              color: isActive ? const Color(0xFF10B981) : Colors.grey[500],
            ),
          ],
        ),
      ),
    );
  }
}

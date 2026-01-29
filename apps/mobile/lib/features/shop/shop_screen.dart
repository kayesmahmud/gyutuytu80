import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/api/shop_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/widgets/ad_card.dart';

class ShopScreen extends StatefulWidget {
  final String shopSlug;

  const ShopScreen({super.key, required this.shopSlug});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final ShopClient _shopClient = ShopClient();
  final ScrollController _scrollController = ScrollController();

  // State
  ShopProfile? _shop;
  List<AdWithDetails> _ads = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _fetchShopData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      _loadMoreAds();
    }
  }

  Future<void> _fetchShopData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch shop profile and ads in parallel
      final results = await Future.wait([
        _shopClient.getShopBySlug(widget.shopSlug),
        _shopClient.getShopAds(widget.shopSlug, page: 1, limit: 20),
      ]);

      final shopResponse = results[0] as ApiResponse<ShopProfile>;
      final adsResponse = results[1] as PaginatedResponse<AdWithDetails>;

      if (mounted) {
        if (shopResponse.success && shopResponse.data != null) {
          setState(() {
            _shop = shopResponse.data;
            _ads = adsResponse.success ? adsResponse.data : [];
            _totalPages = adsResponse.pagination?.totalPages ?? 1;
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = shopResponse.errorMessage ?? 'Shop not found';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Network error: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadMoreAds() async {
    if (_isLoadingMore || _currentPage >= _totalPages) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final response = await _shopClient.getShopAds(
        widget.shopSlug,
        page: _currentPage + 1,
        limit: 20,
      );

      if (response.success && mounted) {
        setState(() {
          _ads.addAll(response.data);
          _currentPage++;
          _isLoadingMore = false;
        });
      } else if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB), // gray-50
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFF43F5E)))
          : _error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Something went wrong',
              style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchShopData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                foregroundColor: Colors.white,
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_shop == null) return const SizedBox.shrink();

    return RefreshIndicator(
      onRefresh: _fetchShopData,
      color: const Color(0xFFF43F5E),
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Custom App Bar with back button
          SliverAppBar(
            expandedHeight: 0,
            floating: true,
            pinned: true,
            backgroundColor: Colors.white,
            elevation: 1,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black87),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              _shop!.displayName,
              style: GoogleFonts.inter(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.share, color: Colors.black87),
                onPressed: () {
                  // TODO: Implement share
                },
              ),
            ],
          ),

          // Cover Photo & Profile Section
          SliverToBoxAdapter(
            child: _buildProfileHeader(),
          ),

          // Shop Info Card
          SliverToBoxAdapter(
            child: _buildShopInfoCard(),
          ),

          // Ads Section Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Text(
                'Ads from ${_shop!.displayName} (${_ads.length})',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ),
          ),

          // Ads Grid or Empty State
          _ads.isEmpty ? _buildEmptyAds() : _buildAdsGrid(),

          // Loading More Indicator
          if (_isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              ),
            ),

          // Bottom Padding
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final coverUrl = _shop!.coverPhoto != null
        ? ApiConfig.getAvatarUrl(_shop!.coverPhoto)
        : null;
    final avatarUrl = _shop!.avatar != null
        ? ApiConfig.getAvatarUrl(_shop!.avatar)
        : null;

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          // Cover Photo
          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: coverUrl == null
                  ? const LinearGradient(
                      colors: [Color(0xFFF43F5E), Color(0xFF9333EA)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : null,
            ),
            child: coverUrl != null
                ? CachedNetworkImage(
                    imageUrl: coverUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFF43F5E), Color(0xFF9333EA)],
                        ),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFF43F5E), Color(0xFF9333EA)],
                        ),
                      ),
                    ),
                  )
                : null,
          ),

          // Profile Info Section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar (overlapping cover)
                Transform.translate(
                  offset: const Offset(0, -40),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Avatar
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _shop!.isBusinessVerified
                                ? const Color(0xFFD97706) // amber-600
                                : _shop!.individualVerified
                                    ? const Color(0xFF3B82F6) // blue-500
                                    : Colors.white,
                            width: 4,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: avatarUrl != null
                              ? CachedNetworkImage(
                                  imageUrl: avatarUrl,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => _buildAvatarPlaceholder(),
                                  errorWidget: (context, url, error) => _buildAvatarPlaceholder(),
                                )
                              : _buildAvatarPlaceholder(),
                        ),
                      ),
                      const SizedBox(width: 16),

                      // Name and Badge
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Flexible(
                                child: Text(
                                  _shop!.displayName,
                                  style: GoogleFonts.inter(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Verification Badge
                              if (_shop!.isBusinessVerified)
                                Image.asset(
                                  'assets/images/golden-badge.png',
                                  width: 28,
                                  height: 28,
                                  errorBuilder: (context, error, stackTrace) =>
                                      const Icon(Icons.verified, color: Color(0xFFD97706), size: 28),
                                )
                              else if (_shop!.individualVerified)
                                Image.asset(
                                  'assets/images/blue-badge.png',
                                  width: 28,
                                  height: 28,
                                  errorBuilder: (context, error, stackTrace) =>
                                      const Icon(Icons.verified, color: Color(0xFF3B82F6), size: 28),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Account Type Label
                Transform.translate(
                  offset: const Offset(0, -24),
                  child: Text(
                    _shop!.isBusinessVerified
                        ? 'Verified Business Account'
                        : _shop!.individualVerified
                            ? 'Verified Individual Seller'
                            : _shop!.accountType == 'business'
                                ? 'Business Account'
                                : 'Individual Seller',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ),

                // Stats Row
                Transform.translate(
                  offset: const Offset(0, -8),
                  child: Row(
                    children: [
                      _buildStatItem('${_shop!.totalAds}', 'Active Ads'),
                      const SizedBox(width: 24),
                      _buildStatItem(_formatNumber(_shop!.totalViews), 'Total Views'),
                      const SizedBox(width: 24),
                      _buildStatItem(_shop!.memberSince, 'Member Since'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarPlaceholder() {
    return Container(
      color: const Color(0xFFE5E7EB),
      child: Center(
        child: Text(
          _shop!.displayName.isNotEmpty ? _shop!.displayName[0].toUpperCase() : '?',
          style: GoogleFonts.inter(
            fontSize: 40,
            fontWeight: FontWeight.bold,
            color: Colors.grey[500],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFFF43F5E),
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildShopInfoCard() {
    final hasContactInfo = _shop!.phone != null ||
        _shop!.businessPhone != null ||
        _shop!.locationName != null ||
        _shop!.bio != null;

    if (!hasContactInfo) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'About',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),

          // Bio
          if (_shop!.bio != null && _shop!.bio!.isNotEmpty) ...[
            Text(
              _shop!.bio!,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[700],
                height: 1.5,
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Location
          if (_shop!.locationName != null)
            _buildInfoRow(Icons.location_on_outlined, _shop!.locationFullPath ?? _shop!.locationName!),

          // Phone
          if (_shop!.businessPhone != null || _shop!.phone != null)
            GestureDetector(
              onTap: () => _launchPhone(_shop!.businessPhone ?? _shop!.phone!),
              child: _buildInfoRow(
                Icons.phone_outlined,
                _shop!.businessPhone ?? _shop!.phone!,
                isLink: true,
              ),
            ),

          // Website
          if (_shop!.businessWebsite != null)
            GestureDetector(
              onTap: () => _launchUrl(_shop!.businessWebsite!),
              child: _buildInfoRow(
                Icons.language,
                _shop!.businessWebsite!,
                isLink: true,
              ),
            ),

          // Social Links
          if (_shop!.facebookUrl != null || _shop!.instagramUrl != null || _shop!.tiktokUrl != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                if (_shop!.facebookUrl != null)
                  _buildSocialButton(Icons.facebook, _shop!.facebookUrl!, const Color(0xFF1877F2)),
                if (_shop!.instagramUrl != null)
                  _buildSocialButton(Icons.camera_alt, _shop!.instagramUrl!, const Color(0xFFE4405F)),
                if (_shop!.tiktokUrl != null)
                  _buildSocialButton(Icons.music_note, _shop!.tiktokUrl!, Colors.black),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text, {bool isLink = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey[500]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: isLink ? const Color(0xFFF43F5E) : Colors.grey[700],
                decoration: isLink ? TextDecoration.underline : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialButton(IconData icon, String url, Color color) {
    return GestureDetector(
      onTap: () => _launchUrl(url),
      child: Container(
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 20, color: color),
      ),
    );
  }

  Widget _buildEmptyAds() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.symmetric(vertical: 48),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          children: [
            const Text('📦', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text(
              'No active ads at the moment',
              style: GoogleFonts.inter(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdsGrid() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.65, // Adjusted for more info content
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => AdCard(ad: _ads[index]),
          childCount: _ads.length,
        ),
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  Future<void> _launchPhone(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _launchUrl(String url) async {
    String finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://$url';
    }
    final uri = Uri.parse(finalUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

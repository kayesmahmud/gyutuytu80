import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/features/shop/shop_screen.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/features/ad_detail/widgets/ad_image_gallery.dart';
import 'package:mobile/features/ad_detail/widgets/ad_specifications.dart';
import 'package:mobile/features/ad_detail/widgets/seller_card.dart';
import 'package:mobile/features/ad_detail/widgets/floating_contact_bar.dart';
import 'package:mobile/features/ad_detail/widgets/ad_detail_banners.dart';

class AdDetailScreen extends StatefulWidget {
  final int? adId;
  final String? slug;

  const AdDetailScreen({super.key, this.adId, this.slug});

  @override
  State<AdDetailScreen> createState() => _AdDetailScreenState();
}

class _AdDetailScreenState extends State<AdDetailScreen> {
  final AdClient _adClient = AdClient();
  final ScrollController _scrollController = ScrollController();
  
  AdWithDetails? _ad;
  List<AdWithDetails> _relatedAds = [];
  bool _isLoading = true;
  String? _error;
// Removed unused state variables
  bool _isFavorite = false;
  int _favoriteCount = 0;

  // Scroll-aware contact bar
  double _lastScrollPosition = 0;
  bool _isContactBarVisible = true;

  @override
  void initState() {
    super.initState();
    _fetchAdDetails();
    _scrollController.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _handleScroll() {
    final currentPos = _scrollController.position.pixels;
    if (currentPos < 0) return; // Ignore bounce

    if (currentPos < _lastScrollPosition || currentPos < 50) {
      // Scrolling UP or near top → show
      if (!_isContactBarVisible) {
        setState(() => _isContactBarVisible = true);
      }
    } else if (currentPos > _lastScrollPosition && currentPos > 100) {
      // Scrolling DOWN past 100px → hide
      if (_isContactBarVisible) {
        setState(() => _isContactBarVisible = false);
      }
    }

    _lastScrollPosition = currentPos;
  }

  Future<void> _fetchAdDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      ApiResponse<AdWithDetails> response;

      if (widget.slug != null) {
        response = await _adClient.getAdBySlug(widget.slug!);
      } else if (widget.adId != null) {
        response = await _adClient.getAdById(widget.adId!);
      } else {
        setState(() {
          _error = 'No ad ID or slug provided';
          _isLoading = false;
        });
        return;
      }

      if (response.success && response.data != null) {
        final ad = response.data!;
        _adClient.incrementView(ad.id);

        final related = await _adClient.getRelatedAds(
          ad.categoryId,
          limit: 4,
          excludeAdId: ad.id,
        );

        if (mounted) {
          setState(() {
            _ad = ad;
            _relatedAds = related;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = response.errorMessage;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load ad: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Something went wrong',
              style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchAdDetails,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              child: const Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    final ad = _ad!;

    return Stack(
      children: [
        CustomScrollView(
          controller: _scrollController,
          slivers: [
            // 1. IMAGE GALLERY (Parallax)
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              backgroundColor: Colors.white,
              elevation: 0,
              leading: Container(
                margin: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.black87),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                ),
              ),
              actions: [
                Container(
                  margin: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.share, color: Colors.black87),
                    onPressed: () {
                      // Share action
                    },
                    padding: EdgeInsets.zero,
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: AdImageGallery(ad: ad),
                collapseMode: CollapseMode.parallax,
              ),
            ),

            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 2. TITLE & META
                        Text(
                          ad.title,
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${_formatTimeAgo(ad.createdAt)} • ${ad.viewCount} views',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280)),
                        ),
                        const SizedBox(height: 12),

                        // 3. PRICE
                        Text(
                          _formatPrice(ad.price),
                          style: GoogleFonts.inter(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // 4. BADGES ROW
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            if (ad.condition != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.grey[200],
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  ad.condition!,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: Colors.grey[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            if (ad.categoryName.isNotEmpty)
                              GestureDetector(
                                onTap: () {
                                  // Navigate categories
                                },
                                child: Text(
                                  ad.subcategoryName != null 
                                    ? '${ad.categoryName} > ${ad.subcategoryName}' 
                                    : ad.categoryName,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF10B981),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Divider(height: 1, color: Color(0xFFE5E7EB)),

                  // 5. DESCRIPTION
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Description",
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          ad.description,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: const Color(0xFF4B5563),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 6. SPECIFICATIONS (Dynamic)
                  AdSpecifications(ad: ad),

                  // 7. LOCATION
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Location",
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.location_on, color: Color(0xFFEF4444), size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  ad.locationName,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: const Color(0xFF374151),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 8. SELLER INFORMATION CARD
                  SellerCard(ad: ad),

                  // 9. REPORT LINK
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: GestureDetector(
                      onTap: () {},
                      child: Row(
                        children: [
                          const Icon(Icons.flag, color: Color(0xFFEF4444), size: 16),
                          const SizedBox(width: 8),
                          Text(
                            "Report this ad",
                            style: GoogleFonts.inter(
                              color: const Color(0xFF6B7280),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 10. RELATED ADS
                  if (_relatedAds.isNotEmpty) _buildRelatedAds(),
 
                  // 11. SELL YOUR ITEMS BANNER
                  const SellYourItemsBanner(),

                  // 12. SAFETY TIPS
                  const SafetyTipsCard(),

                  // 13. PREMIUM MEMBERSHIP
                  const PremiumMembershipBanner(),
                  
                  // 14. BOTTOM PADDING
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ],
        ),

        // FLOATING BOTTOM CONTACT BAR
        AnimatedPositioned(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          left: 0,
          right: 0,
          bottom: _isContactBarVisible ? 0 : -100,
          child: FloatingContactBar(ad: ad),
        ),
      ],
    );
  }

// Image Gallery extracted to widgets/ad_image_gallery.dart

// Specifications and Seller Card extracted to widgets/

  Widget _buildRelatedAds() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            "Related Ads",
            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1F2937)),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 280, // Height for AdCard
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: _relatedAds.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return SizedBox(
                width: 180,
                child: AdCard(ad: _relatedAds[index]),
              );
            },
          ),
        ),
      ],
    );
  }

// Banners extracted to widgets/ad_detail_banners.dart

// Contact Bar logic extracted to widgets/floating_contact_bar.dart
  String _formatPrice(double price) {
    if (price == 0) return 'Free';
    final formatter = NumberFormat("#,##0", "en_US");
    return 'Rs. ${formatter.format(price)}';
  }

  String _formatTimeAgo(DateTime dateTime) {
    final difference = DateTime.now().difference(dateTime);
    if (difference.inDays > 7) {
      return DateFormat('MMM d, yyyy').format(dateTime);
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}

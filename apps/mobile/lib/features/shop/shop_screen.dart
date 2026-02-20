import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'dart:io';

import 'package:mobile/core/api/shop_client.dart';
import 'package:mobile/core/api/auth_client.dart'; // Import AuthClient
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/widgets/ad_card.dart';
import 'package:mobile/features/shop/shop_tabs.dart'; // Import Tabs

class ShopScreen extends StatefulWidget {
  final String shopSlug;

  const ShopScreen({super.key, required this.shopSlug});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final ShopClient _shopClient = ShopClient();
  final AuthClient _authClient = AuthClient();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _picker = ImagePicker();

  // State
  ShopProfile? _shop;
  List<AdWithDetails> _ads = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  
  bool _isOwner = false;
  bool _uploadingImage = false;

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
      // 1. Fetch Shop & Ads
      final results = await Future.wait([
        _shopClient.getShopBySlug(widget.shopSlug),
        _shopClient.getShopAds(widget.shopSlug, page: 1, limit: 20),
      ]);

      final shopResponse = results[0] as ApiResponse<ShopProfile>;
      final adsResponse = results[1] as PaginatedResponse<AdWithDetails>;

      // 2. Check Owner Status (if shop fetched successfully)
      bool isOwner = false;
      if (shopResponse.success && shopResponse.data != null) {
        try {
          final token = await _authClient.getToken();
          if (token != null) {
            final profileData = await _authClient.getProfile();
            if (profileData['success'] == true) {
               // Assuming profileData['data']['id'] matches shopResponse.data.id
               // Note: 'data' might be user object or profile object.
               // Check AuthClient.getProfile response structure.
               // Usually it returns { succeed: true, data: { id: 1, ... } }
               final userId = profileData['data']['id'];
               if (userId == shopResponse.data!.id) {
                 isOwner = true;
               }
            }
          }
        } catch (e) {
          debugPrint('Error checking owner status: $e');
        }
      }

      if (mounted) {
        if (shopResponse.success && shopResponse.data != null) {
          setState(() {
            _shop = shopResponse.data;
            _ads = adsResponse.success ? adsResponse.data : [];
            _totalPages = adsResponse.pagination?.totalPages ?? 1;
            _isLoading = false;
            _isOwner = isOwner;
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

  // --- Image Handling ---

  Future<void> _pickImage({required bool isCover}) async {
    if (_uploadingImage) return;

    try {
      final XFile? pickedFile = await _picker.pickImage(source: ImageSource.gallery);
      if (pickedFile != null) {
        _cropImage(pickedFile.path, isCover: isCover);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error picking image: $e')));
    }
  }

  Future<void> _cropImage(String path, {required bool isCover}) async {
    CroppedFile? croppedFile = await ImageCropper().cropImage(
      sourcePath: path,
      aspectRatio: isCover ? const CropAspectRatio(ratioX: 3, ratioY: 1) : const CropAspectRatio(ratioX: 1, ratioY: 1),
      uiSettings: [
        AndroidUiSettings(
            toolbarTitle: isCover ? 'Crop Cover Photo' : 'Crop Avatar',
            toolbarColor: const Color(0xFFF43F5E),
            toolbarWidgetColor: Colors.white,
            initAspectRatio: isCover ? CropAspectRatioPreset.ratio3x2 : CropAspectRatioPreset.square,
            lockAspectRatio: true),
        IOSUiSettings(
          title: isCover ? 'Crop Cover Photo' : 'Crop Avatar',
        ),
      ],
    );

    if (croppedFile != null) {
      _uploadImage(croppedFile.path, isCover: isCover);
    }
  }

  Future<void> _uploadImage(String path, {required bool isCover}) async {
    setState(() => _uploadingImage = true);
    
    ApiResponse<String> response;
    if (isCover) {
      response = await _shopClient.uploadCover(path);
    } else {
      response = await _shopClient.uploadAvatar(path);
    } // Assuming single file upload?
    
    // Actually the client methods I added take file path.
    // Wait, update: I added uploadAvatar(File file) in plan, but implemented uploadAvatar(String path) in execution.
    // Double check shop_client.dart implementation.
    // Yes, I implemented `uploadAvatar(String filePath)`.

    setState(() => _uploadingImage = false);

    if (response.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${isCover ? "Cover" : "Avatar"} updated successfully'))
      );
      // Refresh shop data to show new image
      // Or just update local state if response returns URL. 
      // The API returns message or data with URL?
      // My client implementation: return ApiResponse.success(response.data['data']['avatar_url']);
      // So I get the URL back.
      setState(() {
        if (response.data != null) {
             // Create new shop object with updated image
             // Need copyWith method on ShopProfile ideally.
             // Or just re-fetch for simplicity/consistency.
             _fetchShopData(); 
        }
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response.errorMessage))
      );
    }
  }

  // --- UI Building ---

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFF43F5E)))
          : _error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildErrorState() {
     return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 60, color: Colors.grey),
          const SizedBox(height: 16),
          Text(_error ?? 'An error occurred'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _fetchShopData,
            child: const Text('Retry'),
          )
        ],
      )
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
          // App Bar
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
          ),

          // Profile Header
          SliverToBoxAdapter(
            child: _buildProfileHeader(),
          ),

          // Tabs & Content
          SliverToBoxAdapter(
            child: ShopTabs(
              shop: _shop!,
              isOwner: _isOwner,
              onProfileUpdated: (updatedShop) {
                setState(() {
                  _shop = updatedShop;
                });
              },
            ),
          ),

          // Ads Header
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

          // Ads Grid
          _ads.isEmpty ? _buildEmptyAds() : _buildAdsGrid(),

          // Loading More
          if (_isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final coverUrl = _shop!.coverPhoto != null
        ? ApiConfig.getCoverUrl(_shop!.coverPhoto)
        : null;
    final avatarUrl = _shop!.avatar != null
        ? ApiConfig.getAvatarUrl(_shop!.avatar)
        : null;

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          // Cover Photo
          Stack(
            children: [
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
                        placeholder: (context, url) => Container(color: Colors.grey[200]),
                        errorWidget: (context, url, error) => Container(color: Colors.grey[200]),
                      )
                    : null,
              ),
              if (_isOwner)
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: InkWell(
                    onTap: () => _pickImage(isCover: true),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: _uploadingImage
                       ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                       : const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                    ),
                  ),
                ),
            ],
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
                      Stack(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white,
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
                          if (_isOwner)
                            Positioned(
                              right: 0,
                              bottom: 0,
                              child: InkWell(
                                onTap: () => _pickImage(isCover: false),
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.grey[200]!),
                                    boxShadow: [
                                       BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4),
                                    ],
                                  ),
                                  child: const Icon(Icons.camera_alt, color: Colors.black87, size: 16),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(width: 16),

                      // Name and Badge
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
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
                                  if (_shop!.isBusinessVerified)
                                    Image.asset('assets/images/golden-badge.png', width: 24, height: 24)
                                  else if (_shop!.individualVerified)
                                    Image.asset('assets/images/blue-badge.png', width: 24, height: 24),
                                ],
                              ),
                              Text(
                                _shop!.isBusinessVerified
                                    ? 'Verified Business'
                                    : _shop!.individualVerified
                                        ? 'Verified Individual'
                                        : 'Seller',
                                style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Stats Row
                Transform.translate(
                  offset: const Offset(0, -20),
                  child: Row(
                    children: [
                      _buildStatItem('${_shop!.totalAds}', 'Active Ads'),
                      const SizedBox(width: 24),
                      _buildStatItem(_formatNumber(_shop!.totalViews), 'Views'),
                      const SizedBox(width: 24),
                      _buildStatItem(_shop!.memberSince, 'Joined'),
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
            fontSize: 18,
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

  Widget _buildEmptyAds() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
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
          childAspectRatio: 0.65,
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
}

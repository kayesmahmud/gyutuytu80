import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import 'api_config.dart';

/// Shop/Seller API Client - handles shop profile and seller ads
class ShopClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: ApiConfig.connectTimeout,
    receiveTimeout: ApiConfig.receiveTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ShopClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("ShopClient Error: ${e.message}");
        if (e.response != null) {
          print("Response Data: ${e.response?.data}");
        }
        return handler.next(e);
      },
    ));
  }

  /// Get shop profile by slug
  Future<ApiResponse<ShopProfile>> getShopBySlug(String shopSlug) async {
    try {
      final response = await _dio.get('/shop/$shopSlug');

      if (response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        // API returns { seller: {...}, ads: [...], pagination: {...} }
        final sellerData = data['seller'] as Map<String, dynamic>?;

        if (sellerData != null) {
          return ApiResponse.success(ShopProfile.fromJson(sellerData));
        }
        // Fallback: try parsing data directly (older API format)
        return ApiResponse.success(ShopProfile.fromJson(data));
      }
      return ApiResponse.failure(response.data['error'] ?? 'Shop not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch shop',
      );
    }
  }

  /// Get shop's ads
  /// Note: Uses same endpoint as getShopBySlug since API returns both together
  Future<PaginatedResponse<AdWithDetails>> getShopAds(
    String shopSlug, {
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': (page - 1) * limit,
      };

      final response = await _dio.get(
        '/shop/$shopSlug',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        final adsList = data['ads'] as List? ?? [];
        final pagination = data['pagination'] as Map<String, dynamic>?;

        // Parse ads with proper nested object handling
        final ads = adsList.map((adJson) {
          final ad = adJson as Map<String, dynamic>;
          // Flatten nested category/location objects
          final flattened = Map<String, dynamic>.from(ad);

          // Handle nested categories object
          if (ad['categories'] is Map) {
            flattened['categoryName'] = (ad['categories'] as Map)['name'];
          }
          flattened['categoryName'] ??= ad['category_name'];

          // Handle nested locations object
          if (ad['locations'] is Map) {
            flattened['locationName'] = (ad['locations'] as Map)['name'];
          }
          flattened['locationName'] ??= ad['location_name'];

          // Handle primary_image → thumbnail
          flattened['thumbnail'] ??= ad['primary_image'];

          // Handle ad_images → images (extract filenames)
          if (ad['ad_images'] is List && flattened['images'] == null) {
            flattened['images'] = (ad['ad_images'] as List)
                .map((img) => img is Map ? (img['filename'] ?? img['file_path']) : img)
                .where((img) => img != null)
                .toList();
          }

          return AdWithDetails.fromJson(flattened);
        }).toList();

        final total = pagination?['total'] as int? ?? ads.length;
        final totalPages = (total / limit).ceil();

        return PaginatedResponse.success(
          ads,
          PaginationInfo(page: page, limit: limit, total: total, totalPages: totalPages),
        );
      }
      return PaginatedResponse.failure(response.data['error'] ?? 'Failed to fetch shop ads');
    } on DioException catch (e) {
      return PaginatedResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch shop ads',
      );
    }
  }

  /// Get seller profile by slug (alias for getShopBySlug)
  Future<ApiResponse<ShopProfile>> getSellerBySlug(String sellerSlug) {
    return getShopBySlug(sellerSlug);
  }

  /// Get seller's ads (alias for getShopAds)
  Future<PaginatedResponse<AdWithDetails>> getSellerAds(
    String sellerSlug, {
    int page = 1,
    int limit = 20,
  }) {
    return getShopAds(sellerSlug, page: page, limit: limit);
  }
}

/// Shop Profile model with extended seller info
class ShopProfile {
  final int id;
  final String fullName;
  final String? businessName;
  final String? email;
  final String? phone;
  final String? avatar;
  final String? coverPhoto;
  final String? bio;
  final String? businessDescription;
  final String? businessPhone;
  final String? businessWebsite;
  final String? googleMapsLink;
  final String? facebookUrl;
  final String? instagramUrl;
  final String? tiktokUrl;
  final String? accountType;
  final String? businessVerificationStatus;
  final bool individualVerified;
  final String? shopSlug;
  final String? customShopSlug;
  final int? locationId;
  final String? locationName;
  final String? locationFullPath;
  final DateTime? createdAt;

  // Stats
  final int totalAds;
  final int totalViews;
  final int featuredAds;

  ShopProfile({
    required this.id,
    required this.fullName,
    this.businessName,
    this.email,
    this.phone,
    this.avatar,
    this.coverPhoto,
    this.bio,
    this.businessDescription,
    this.businessPhone,
    this.businessWebsite,
    this.googleMapsLink,
    this.facebookUrl,
    this.instagramUrl,
    this.tiktokUrl,
    this.accountType,
    this.businessVerificationStatus,
    this.individualVerified = false,
    this.shopSlug,
    this.customShopSlug,
    this.locationId,
    this.locationName,
    this.locationFullPath,
    this.createdAt,
    this.totalAds = 0,
    this.totalViews = 0,
    this.featuredAds = 0,
  });

  /// Display name: business name or full name
  String get displayName => businessName ?? fullName;

  /// Check if business verified
  bool get isBusinessVerified =>
      businessVerificationStatus == 'verified' || businessVerificationStatus == 'approved';

  /// Check if verified (either business or individual)
  bool get isVerified => isBusinessVerified || individualVerified;

  /// Verification badge type: 'gold', 'blue', or null
  String? get badgeType {
    if (isBusinessVerified) return 'gold';
    if (individualVerified) return 'blue';
    return null;
  }

  /// Member since formatted
  String get memberSince {
    if (createdAt == null) return '';
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[createdAt!.month - 1]} ${createdAt!.year}';
  }

  factory ShopProfile.fromJson(Map<String, dynamic> json) {
    return ShopProfile(
      id: json['id'] as int,
      fullName: json['fullName'] as String? ?? json['full_name'] as String? ?? '',
      businessName: json['businessName'] as String? ?? json['business_name'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      avatar: json['avatar'] as String?,
      coverPhoto: json['coverPhoto'] as String? ?? json['cover_photo'] as String?,
      bio: json['bio'] as String?,
      businessDescription: json['businessDescription'] as String? ?? json['business_description'] as String?,
      businessPhone: json['businessPhone'] as String? ?? json['business_phone'] as String?,
      businessWebsite: json['businessWebsite'] as String? ?? json['business_website'] as String?,
      googleMapsLink: json['googleMapsLink'] as String? ?? json['google_maps_link'] as String?,
      facebookUrl: json['facebookUrl'] as String? ?? json['facebook_url'] as String?,
      instagramUrl: json['instagramUrl'] as String? ?? json['instagram_url'] as String?,
      tiktokUrl: json['tiktokUrl'] as String? ?? json['tiktok_url'] as String?,
      accountType: json['accountType'] as String? ?? json['account_type'] as String?,
      businessVerificationStatus: json['businessVerificationStatus'] as String? ?? json['business_verification_status'] as String?,
      individualVerified: json['individualVerified'] as bool? ?? json['individual_verified'] as bool? ?? false,
      shopSlug: json['shopSlug'] as String? ?? json['shop_slug'] as String?,
      customShopSlug: json['customShopSlug'] as String? ?? json['custom_shop_slug'] as String?,
      locationId: json['locationId'] as int? ?? json['location_id'] as int?,
      locationName: json['locationName'] as String? ?? json['location_name'] as String? ?? (json['location'] as Map<String, dynamic>?)?['name'] as String?,
      locationFullPath: json['locationFullPath'] as String? ?? json['location_full_path'] as String?,
      createdAt: _parseDateTime(json['memberSince'] ?? json['createdAt'] ?? json['created_at']),
      totalAds: json['totalAds'] as int? ?? json['total_ads'] as int? ?? 0,
      totalViews: json['totalViews'] as int? ?? json['total_views'] as int? ?? 0,
      featuredAds: json['featuredAds'] as int? ?? json['featured_ads'] as int? ?? 0,
    );
  }
}

DateTime? _parseDateTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}

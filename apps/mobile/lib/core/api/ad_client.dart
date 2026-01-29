import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import 'package:mobile/features/post_ad/models/location_models.dart';
import 'api_config.dart';

/// Ad API Client - handles all ad-related API calls
class AdClient {
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

  AdClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Log errors for debugging (remove in production)
        print("AdClient Error: ${e.message}");
        if (e.response != null) {
          print("Response Data: ${e.response?.data}");
        }
        return handler.next(e);
      },
    ));
  }

  // ==========================================
  // BROWSE/LIST ADS
  // ==========================================

  /// Get paginated list of ads with optional filters
  Future<PaginatedResponse<AdWithDetails>> getAds({
    int page = 1,
    int limit = 20,
    int? categoryId,
    int? subcategoryId,
    int? locationId,
    int? areaId,
    double? minPrice,
    double? maxPrice,
    String? condition,
    String? sortBy,
    String? sortOrder,
    String? search,
    bool? isFeatured,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (categoryId != null) queryParams['category_id'] = categoryId;
      if (subcategoryId != null) queryParams['subcategory_id'] = subcategoryId;
      if (locationId != null) queryParams['location_id'] = locationId;
      if (areaId != null) queryParams['area_id'] = areaId;
      if (minPrice != null) queryParams['min_price'] = minPrice;
      if (maxPrice != null) queryParams['max_price'] = maxPrice;
      if (condition != null) queryParams['condition'] = condition;
      // Map sort params to API format (price-low, price-high, newest, oldest)
      if (sortBy != null) {
        String apiSort = 'newest'; // Default
        if (sortBy == 'price') {
          apiSort = sortOrder == 'asc' ? 'price-low' : 'price-high';
        } else if (sortBy == 'date') {
          apiSort = sortOrder == 'asc' ? 'oldest' : 'newest';
        }
        queryParams['sortBy'] = apiSort;
      }
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (isFeatured != null) queryParams['is_featured'] = isFeatured;

      final response = await _dio.get('/ads', queryParameters: queryParams);

      return PaginatedResponse.fromJson(
        response.data as Map<String, dynamic>,
        (json) => AdWithDetails.fromJson(json),
      );
    } on DioException catch (e) {
      return PaginatedResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch ads',
      );
    }
  }

  /// Get ads using SearchFilters object
  Future<PaginatedResponse<AdWithDetails>> searchAds(
    SearchFilters filters, {
    int page = 1,
    int limit = 20,
  }) async {
    return getAds(
      page: page,
      limit: limit,
      categoryId: filters.categoryId,
      subcategoryId: filters.subcategoryId,
      locationId: filters.locationId,
      areaId: filters.areaId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      condition: filters.condition,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      search: filters.query,
    );
  }

  /// Get featured ads
  Future<PaginatedResponse<AdWithDetails>> getFeaturedAds({int limit = 6}) async {
    return getAds(limit: limit, isFeatured: true);
  }

  /// Get latest ads
  Future<PaginatedResponse<AdWithDetails>> getLatestAds({int limit = 8}) async {
    return getAds(limit: limit, sortBy: 'date', sortOrder: 'desc');
  }

  // ==========================================
  // SINGLE AD
  // ==========================================

  /// Get ad by ID
  Future<ApiResponse<AdWithDetails>> getAdById(int id) async {
    try {
      final response = await _dio.get('/ads/$id');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          AdWithDetails.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Ad not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch ad',
      );
    }
  }

  /// Get ad by slug
  Future<ApiResponse<AdWithDetails>> getAdBySlug(String slug) async {
    try {
      final response = await _dio.get('/ads/slug/$slug');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          AdWithDetails.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Ad not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch ad',
      );
    }
  }

  /// Increment ad view count
  Future<void> incrementView(int adId) async {
    try {
      await _dio.post('/ads/$adId/view');
    } catch (e) {
      // Silently fail - view count is not critical
      print('Failed to increment view: $e');
    }
  }

  // ==========================================
  // USER'S ADS (MY ADS)
  // ==========================================

  /// Get current user's ads (requires auth)
  Future<PaginatedResponse<AdWithDetails>> getMyAds({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (status != null) queryParams['status'] = status;

      final response = await _dio.get('/ads/my-ads', queryParameters: queryParams);

      // Handle both paginated and non-paginated responses
      if (response.data['success'] == true) {
        final data = response.data['data'];
        if (data is List) {
          // Non-paginated response
          return PaginatedResponse.success(
            data.map((e) => AdWithDetails.fromJson(e as Map<String, dynamic>)).toList(),
            PaginationInfo(page: 1, limit: data.length, total: data.length, totalPages: 1),
          );
        }
        // Paginated response
        return PaginatedResponse.fromJson(
          response.data as Map<String, dynamic>,
          (json) => AdWithDetails.fromJson(json),
        );
      }
      return PaginatedResponse.failure(response.data['error'] ?? 'Failed to fetch your ads');
    } on DioException catch (e) {
      return PaginatedResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch your ads',
      );
    }
  }

  // ==========================================
  // CREATE/UPDATE/DELETE ADS
  // ==========================================

  /// Create a new ad
  Future<ApiResponse<Ad>> createAd(FormData formData) async {
    try {
      final response = await _dio.post('/ads', data: formData);
      print("🔵 createAd response: ${response.data}");

      if (response.data['success'] == true) {
        print("🔵 Parsing Ad...");
        return ApiResponse.success(
          Ad.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] is String 
          ? response.data['error'] 
          : response.data['message'] ?? 'Failed to create ad');
    } on DioException catch (e) {
      final errorData = e.response?.data;
      String errorMessage = 'Failed to create ad';
      
      if (errorData != null) {
        if (errorData['message'] is String) {
          errorMessage = errorData['message'];
        } else if (errorData['error'] is String) {
          errorMessage = errorData['error'];
        } else if (errorData['error'] is Map && errorData['error']['message'] is String) {
          errorMessage = errorData['error']['message'];
        }
      }
      
      return ApiResponse.failure(errorMessage);
    }
  }

  /// Update an existing ad
  Future<ApiResponse<Ad>> updateAd(int adId, FormData formData) async {
    try {
      final response = await _dio.put('/ads/$adId', data: formData);

      if (response.data['success'] == true) {
        return ApiResponse.success(
          Ad.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to update ad');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to update ad',
      );
    }
  }

  /// Delete an ad
  Future<ApiResponse<void>> deleteAd(int adId) async {
    try {
      final response = await _dio.delete('/ads/$adId');

      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to delete ad');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to delete ad',
      );
    }
  }

  /// Mark ad as sold
  Future<ApiResponse<void>> markAsSold(int adId) async {
    try {
      final response = await _dio.post('/ads/$adId/mark-sold');

      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to mark ad as sold');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to mark ad as sold',
      );
    }
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  /// Get all categories with subcategories
  Future<List<CategoryWithSubcategories>> getCategories() async {
    try {
      final response = await _dio.get('/categories?includeSubcategories=true');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => CategoryWithSubcategories.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error fetching categories: $e');
      return [];
    }
  }

  /// Get category by slug
  Future<ApiResponse<CategoryWithSubcategories>> getCategoryBySlug(String slug) async {
    try {
      final response = await _dio.get('/categories/slug/$slug');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          CategoryWithSubcategories.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Category not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch category',
      );
    }
  }

  // ==========================================
  // LOCATIONS
  // ==========================================

  /// Get full location hierarchy
  Future<List<LocationProvince>> getLocationHierarchy() async {
    try {
      final response = await _dio.get('/locations/hierarchy');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => LocationProvince.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error fetching location hierarchy: $e');
      return [];
    }
  }

  // ==========================================
  // RELATED ADS
  // ==========================================

  /// Get related ads (same category)
  Future<List<AdWithDetails>> getRelatedAds(int categoryId, {int limit = 3, int? excludeAdId}) async {
    try {
      final response = await getAds(
        categoryId: categoryId,
        limit: limit + 1, // Get extra in case we need to exclude
        sortBy: 'date',
        sortOrder: 'desc',
      );

      if (response.success) {
        var ads = response.data;
        if (excludeAdId != null) {
          ads = ads.where((ad) => ad.id != excludeAdId).toList();
        }
        return ads.take(limit).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching related ads: $e');
      return [];
    }
  }
}

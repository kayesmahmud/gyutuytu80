import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import 'api_config.dart';

/// Location API Client - handles all location-related API calls
class LocationClient {
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

  LocationClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("LocationClient Error: ${e.message}");
        return handler.next(e);
      },
    ));
  }

  // ==========================================
  // LOCATION HIERARCHY
  // ==========================================

  /// Get location hierarchy (for cascading dropdowns)
  Future<List<LocationHierarchy>> getHierarchy({int? provinceId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (provinceId != null) queryParams['provinceId'] = provinceId;

      final response = await _dio.get('/locations/hierarchy', queryParameters: queryParams);

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => LocationHierarchy.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error fetching location hierarchy: $e');
      return [];
    }
  }

  /// Get all provinces
  Future<List<Province>> getProvinces() async {
    try {
      final response = await _dio.get('/locations', queryParameters: {'type': 'province'});

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => Province.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error fetching provinces: $e');
      return [];
    }
  }

  /// Get districts for a province
  Future<List<District>> getDistricts(int provinceId) async {
    try {
      final response = await _dio.get('/locations', queryParameters: {
        'type': 'district',
        'parent_id': provinceId,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => District.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error fetching districts: $e');
      return [];
    }
  }

  /// Get municipalities for a district
  Future<List<Municipality>> getMunicipalities(int districtId) async {
    try {
      final response = await _dio.get('/locations', queryParameters: {
        'type': 'municipality',
        'parent_id': districtId,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => Municipality.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error fetching municipalities: $e');
      return [];
    }
  }

  // ==========================================
  // AREAS
  // ==========================================

  /// Get areas hierarchy (for detailed location selection)
  Future<AreasHierarchyResponse?> getAreasHierarchy({int? provinceId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (provinceId != null) queryParams['province_id'] = provinceId;

      final response = await _dio.get('/areas/hierarchy', queryParameters: queryParams);

      if (response.data['success'] == true) {
        return AreasHierarchyResponse.fromJson(response.data['data'] as Map<String, dynamic>);
      }
      return null;
    } on DioException catch (e) {
      print('Error fetching areas hierarchy: $e');
      return null;
    }
  }

  /// Get areas for a municipality
  Future<List<Area>> getAreas(int municipalityId) async {
    try {
      final response = await _dio.get('/locations', queryParameters: {
        'type': 'area',
        'parent_id': municipalityId,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => Area.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error fetching areas: $e');
      return [];
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  /// Search locations by query
  Future<List<Location>> searchLocations(String query, {int limit = 10}) async {
    try {
      final response = await _dio.get('/locations/search', queryParameters: {
        'q': query,
        'limit': limit,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => Location.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error searching locations: $e');
      return [];
    }
  }

  /// Search ALL locations (prioritized by hierarchy)
  Future<List<Location>> searchAllLocations(String query, {int limit = 15}) async {
    try {
      final response = await _dio.get('/locations/search-all', queryParameters: {
        'q': query,
        'limit': limit,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => Location.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error searching all locations: $e');
      return [];
    }
  }

  /// Search areas by query
  Future<List<Area>> searchAreas(String query, {int limit = 10}) async {
    try {
      final response = await _dio.get('/areas/search', queryParameters: {
        'q': query,
        'limit': limit,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return data
            .map((e) => Area.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('Error searching areas: $e');
      return [];
    }
  }

  // ==========================================
  // GET BY SLUG/ID
  // ==========================================

  /// Get location by slug
  Future<ApiResponse<Location>> getLocationBySlug(String slug) async {
    try {
      final response = await _dio.get('/locations/slug/$slug');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          Location.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Location not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch location',
      );
    }
  }

  /// Get location by ID
  Future<ApiResponse<Location>> getLocationById(int id) async {
    try {
      final response = await _dio.get('/locations/$id');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          Location.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Location not found');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch location',
      );
    }
  }
}

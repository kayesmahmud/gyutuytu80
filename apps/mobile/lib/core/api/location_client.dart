import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/models.dart';
import 'dio_client.dart';

/// Location API Client - handles all location-related API calls
class LocationClient {
  final Dio _dio;

  LocationClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

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
      if (kDebugMode) developer.log('Error fetching location hierarchy: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error fetching provinces: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error fetching districts: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error fetching municipalities: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error fetching areas hierarchy: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error fetching areas: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error searching locations: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error searching all locations: $e', name: 'LocationClient');
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
      if (kDebugMode) developer.log('Error searching areas: $e', name: 'LocationClient');
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


import 'dart:developer' as developer;
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/api/auth_client.dart';

class AuthProvider with ChangeNotifier {
  final AuthClient _authClient = AuthClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  bool _isLoggedIn = false;
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  bool get isLoggedIn => _isLoggedIn;
  bool get isAuthenticated => _isLoggedIn;  // Alias for notification service
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;

  /// Get user ID safely from the user map
  int? get userId => _user?['id'] as int?;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    final token = await _storage.read(key: 'auth_token');
    if (token != null) {
      _isLoggedIn = true;
      try {
        final response = await _authClient.getProfile();
        if (response != null && response['success'] == true) {
          _user = response['data'];
        } else {
          // Token might be invalid
          _isLoggedIn = false;
          await _storage.delete(key: 'auth_token');
        }
      } catch (e) {
        // Error fetching profile
        _isLoggedIn = false;
      }
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _authClient.updateProfile(data);
      if (response['success'] == true) {
        _user = response['data']; // Assuming API returns updated profile in 'data'
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshProfile() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _authClient.getProfile();
      if (response['success'] == true) {
        _user = response['data'];
      }
    } catch (e) {
      if (kDebugMode) developer.log('Error refreshing profile: $e', name: 'AuthProvider');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String token) async {
    await _storage.write(key: 'auth_token', value: token);
    _isLoggedIn = true;
    
    try {
      final response = await _authClient.getProfile(); 
      if (kDebugMode) developer.log('API Response: $response', name: 'AuthProvider');
      if (response['success'] == true) {
        _user = response['data'];
        if (kDebugMode) developer.log('Parsed User: $_user', name: 'AuthProvider');
        if (kDebugMode) developer.log('User Name: ${_user?['fullName']}', name: 'AuthProvider');
      }
    } catch (e, stack) {
      if (kDebugMode) developer.log('Error fetching profile: $e', name: 'AuthProvider');
      if (kDebugMode) developer.log('$stack', name: 'AuthProvider');
    }
    
    notifyListeners();
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    _isLoggedIn = false;
    _user = null;
    notifyListeners();
  }
}

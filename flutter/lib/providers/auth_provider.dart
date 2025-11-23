import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../constants/app_constants.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isLoggedIn = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _isLoggedIn;

  AuthProvider() {
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.userTokenKey);
      
      if (token != null) {
        // Set token for API calls
        ApiService.setToken(token);
        
        // Try to get current user
        await getCurrentUser();
      }
    } catch (e) {
      // Silent error - user not logged in
      _isLoggedIn = false;
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final response = await AuthService.login(
        email: email,
        password: password,
      );

      // Handle different response formats
      String? token;
      Map<String, dynamic>? userData;
      
      // Check for direct token/user structure
      if (response['accessToken'] != null || response['token'] != null) {
        token = response['accessToken'] ?? response['token'];
        userData = response['user'];
      }
      // Check for nested structure
      else if (response['success'] == true && response['data'] != null) {
        token = response['data']['token'] ?? response['data']['accessToken'];
        userData = response['data']['user'];
      }
      // Legacy structure
      else {
        token = response['token'];
        userData = response['user'];
      }

      if (token != null && userData != null) {
        // Save token and user data
        await _saveAuthData(token, userData);
        
        _user = User.fromJson(userData);
        _isLoggedIn = true;
        
        _setLoading(false);
        notifyListeners();
        
        return true;
      } else {
        throw Exception('Invalid response format: missing token or user data');
      }
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
    String? gender,
    String? birthday,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final response = await AuthService.register(
        email: email,
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber,
        gender: gender,
        birthday: birthday,
      );

      // Handle different response formats
      String? token;
      Map<String, dynamic>? userData;
      
      // Check for direct token/user structure
      if (response['accessToken'] != null || response['token'] != null) {
        token = response['accessToken'] ?? response['token'];
        userData = response['user'];
      }
      // Check for nested structure
      else if (response['success'] == true && response['data'] != null) {
        token = response['data']['token'] ?? response['data']['accessToken'];
        userData = response['data']['user'];
      }
      // Legacy structure
      else {
        token = response['token'];
        userData = response['user'];
      }

      if (token != null && userData != null) {
        // Save token and user data
        await _saveAuthData(token, userData);
        
        _user = User.fromJson(userData);
        _isLoggedIn = true;
        
        _setLoading(false);
        notifyListeners();
        
        return true;
      } else {
        throw Exception('Invalid response format: missing token or user data');
      }
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<bool> forgotPassword({required String email}) async {
    return await sendPasswordResetOtp(email: email);
  }

  Future<bool> sendPasswordResetOtp({required String email}) async {
    try {
      _setLoading(true);
      _setError(null);

      await AuthService.sendPasswordResetOtp(email: email);
      
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<String?> verifyPasswordResetOtp({
    required String email,
    required String otp,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final token = await AuthService.verifyPasswordResetOtp(
        email: email,
        otp: otp,
      );

      _setLoading(false);
      return token;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return null;
    }
  }

  Future<bool> resetPasswordWithToken({
    required String resetToken,
    required String newPassword,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      await AuthService.resetPasswordWithToken(
        resetToken: resetToken,
        newPassword: newPassword,
      );

      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<void> getCurrentUser() async {
    try {
      _user = await AuthService.getCurrentUser();
      _isLoggedIn = true;
      notifyListeners();
    } catch (e) {
      await logout();
    }
  }

  Future<bool> updateProfile({
    String? fullName,
    String? phoneNumber,
    String? avatar,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final updatedUser = await AuthService.updateProfile(
        fullName: fullName,
        phoneNumber: phoneNumber,
        avatar: avatar,
      );

      _user = updatedUser;
      
      // Update stored user data
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.userDataKey, updatedUser.toJson().toString());
      
      _setLoading(false);
      notifyListeners();
      
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      await AuthService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await AuthService.logout();
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      await _clearAuthData();
      _user = null;
      _isLoggedIn = false;
      notifyListeners();
    }
  }

  Future<void> _saveAuthData(String token, Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.userTokenKey, token);
    await prefs.setString(AppConstants.userDataKey, userData.toString());
  }

  Future<void> _clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.userTokenKey);
    await prefs.remove(AppConstants.userDataKey);
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    if (error != null) {
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

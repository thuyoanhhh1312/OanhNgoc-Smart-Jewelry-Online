import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  // Register (like register in React)
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
  }) async {
    try {
      final response = await ApiService.post('/auth/register', body: {
        'email': email,
        'password': password,
        'name': fullName, // Backend expects 'name', not 'fullName'
        'phoneNumber': phoneNumber,
      });

      // Handle response - could be Map or other type
      Map<String, dynamic> result;
      if (response is Map<String, dynamic>) {
        result = response;
      } else {
        result = {'data': response};
      }

      // Set token if available (backend returns 'accessToken')
      if (result['accessToken'] != null) {
        ApiService.setToken(result['accessToken']);
      }

      return result;
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  // Login (like login in React)
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await ApiService.post('/auth/login', body: {
        'email': email,
        'password': password,
      });

      // Handle response - could be Map or other type
      Map<String, dynamic> result;
      if (response is Map<String, dynamic>) {
        result = response;
      } else {
        result = {'data': response};
      }

      // Set token if available (backend returns 'accessToken')
      if (result['accessToken'] != null) {
        ApiService.setToken(result['accessToken']);
      }

      return result;
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  // Refresh Token (like refreshToken in React)
  static Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    try {
      final response = await ApiService.post('/auth/refresh-token', body: {
        'refreshToken': refreshToken,
      });

      // Update token if available
      if (response['accessToken'] != null) {
        ApiService.setToken(response['accessToken']);
      }

      return response;
    } catch (e) {
      throw Exception('Token refresh failed: $e');
    }
  }

  // Logout (like logout in React)
  static Future<void> logout() async {
    try {
      await ApiService.post('/auth/logout');
    } finally {
      ApiService.clearToken();
    }
  }

  // Get Current User (like currentUser in React)
  static Future<User> getCurrentUser() async {
    try {
      final response = await ApiService.get('/auth/current-user');
      
      // Backend returns direct response, not wrapped in success/data
      return User.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get current user: $e');
    }
  }

  // Forgot Password (like forgotPassword in React)
  static Future<Map<String, dynamic>> forgotPassword({
    required String email,
  }) async {
    try {
      return await ApiService.post('/auth/forgot-password', body: {
        'email': email,
      });
    } catch (e) {
      throw Exception('Forgot password failed: $e');
    }
  }

  // Reset Password (like resetPassword in React)
  static Future<Map<String, dynamic>> resetPassword({
    required String password,
    required String confirmPassword,
    required String resetToken,
  }) async {
    try {
      return await ApiService.post('/auth/reset-password', body: {
        'password': password,
        'confirm_password': confirmPassword,
        'resetToken': resetToken,
      });
    } catch (e) {
      throw Exception('Reset password failed: $e');
    }
  }

  // Update Profile (customer can update their own profile)
  static Future<User> updateProfile({
    String? fullName,
    String? phoneNumber,
    String? avatar,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (fullName != null) body['name'] = fullName; // Backend expects 'name'
      if (phoneNumber != null) body['phoneNumber'] = phoneNumber;
      if (avatar != null) body['avatar'] = avatar;

      final response = await ApiService.put('/customers/profile', body: body); // Use customer profile endpoint
      
      // Backend returns direct response
      return User.fromJson(response);
    } catch (e) {
      throw Exception('Profile update failed: $e');
    }
  }

  // Change Password (customer can change their own password)
  static Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      return await ApiService.post('/auth/change-password', body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
    } catch (e) {
      throw Exception('Change password failed: $e');
    }
  }

  // Verify Email
  static Future<Map<String, dynamic>> verifyEmail({
    required String token,
  }) async {
    try {
      return await ApiService.post('/auth/verify-email', body: {
        'token': token,
      });
    } catch (e) {
      throw Exception('Email verification failed: $e');
    }
  }

  // Resend Verification Email
  static Future<Map<String, dynamic>> resendVerificationEmail() async {
    try {
      return await ApiService.post('/auth/resend-verification');
    } catch (e) {
      throw Exception('Resend verification email failed: $e');
    }
  }
}

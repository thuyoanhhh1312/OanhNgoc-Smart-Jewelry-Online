import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

class ApiService {
  static String get _baseUrl => AppConstants.baseUrl;
  static String? _token;

  static void setToken(String token) {
    _token = token;
  }

  static void clearToken() {
    _token = null;
  }

  static Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    
    return headers;
  }

  static Future<dynamic> _handleResponse(http.Response response) async {
    final data = json.decode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Return data as-is (can be Map, List, or any type)
      return data;
    } else {
      // For errors, try to extract message
      String errorMessage = 'Unknown error occurred';
      
      if (data is Map<String, dynamic> && data['message'] != null) {
        errorMessage = data['message'];
      } else if (data is String) {
        errorMessage = data;
      }
      
      throw ApiException(
        statusCode: response.statusCode,
        message: errorMessage,
      );
    }
  }

  // GET Request
  static Future<dynamic> get(String endpoint, {Map<String, String>? queryParams}) async {
    try {
      var uri = Uri.parse('$_baseUrl$endpoint');
      if (queryParams != null) {
        uri = uri.replace(queryParameters: queryParams);
      }
      
      final response = await http.get(uri, headers: _headers);
      return await _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // POST Request
  static Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final url = '$_baseUrl$endpoint';
      print('=== API POST Request ===');
      print('URL: $url');
      print('Headers: $_headers');
      print('Body: ${body != null ? json.encode(body) : null}');
      
      final response = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: body != null ? json.encode(body) : null,
      );
      
      print('Response Status: ${response.statusCode}');
      print('Response Body: ${response.body}');
      print('========================');
      
      return await _handleResponse(response);
    } catch (e) {
      print('API Error: $e');
      throw _handleError(e);
    }
  }

  // PUT Request
  static Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl$endpoint'),
        headers: _headers,
        body: body != null ? json.encode(body) : null,
      );
      return await _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE Request
  static Future<dynamic> delete(String endpoint) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl$endpoint'),
        headers: _headers,
      );
      return await _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Exception _handleError(dynamic error) {
    print('Error details: $error');
    print('Error type: ${error.runtimeType}');
    
    if (error is ApiException) {
      return error;
    } else if (error is http.ClientException) {
      print('ClientException: ${error.message}');
      return const ApiException(
        statusCode: 0,
        message: AppConstants.networkErrorMessage,
      );
    } else {
      print('Unknown error: $error');
      return const ApiException(
        statusCode: 500,
        message: AppConstants.unknownErrorMessage,
      );
    }
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  const ApiException({
    required this.statusCode,
    required this.message,
  });

  @override
  String toString() {
    return 'ApiException: $statusCode - $message';
  }
}

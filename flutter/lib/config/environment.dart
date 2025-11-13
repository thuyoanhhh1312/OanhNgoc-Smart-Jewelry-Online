import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class Environment {
  // Cached values to avoid NotInitializedError
  static late String _apiBaseUrl;
  static late int _apiTimeout;
  static late String _appEnv;
  static late bool _enableLogging;
  static late int _connectTimeout;
  static late int _receiveTimeout;
  static late String _imageBaseUrl;
  static late String _appName;
  static late String _appVersion;
  static late int _tokenExpireTime;
  static late int _refreshTokenExpireTime;

  // Initialize environment variables
  static Future<void> init() async {
    try {
      // Load .env file on mobile/desktop platforms only
      if (!kIsWeb) {
        try {
          await dotenv.load(fileName: ".env");
        } catch (e) {
          print('Warning: Could not load .env file: $e');
        }
      }
    } catch (e) {
      print('Error initializing environment: $e');
    }

    // Cache all values safely
    _cacheValues();
  }

  // Cache all environment values safely
  static void _cacheValues() {
    _apiBaseUrl = _getEnv('API_BASE_URL', 
      kIsWeb ? 'http://127.0.0.1:3001/api' : 'http://localhost:3001/api'
    );
    
    _apiTimeout = int.tryParse(_getEnv('API_TIMEOUT', '30000')) ?? 30000;
    
    _appEnv = _getEnv('APP_ENV', 'development');
    
    _enableLogging = _getEnv('ENABLE_LOGGING', 'false').toLowerCase() == 'true';
    
    _connectTimeout = int.tryParse(_getEnv('CONNECT_TIMEOUT', '5000')) ?? 5000;
    
    _receiveTimeout = int.tryParse(_getEnv('RECEIVE_TIMEOUT', '30000')) ?? 30000;
    
    _imageBaseUrl = _getEnv('IMAGE_BASE_URL',
      kIsWeb ? 'http://127.0.0.1:3001/uploads' : 'http://localhost:3001/uploads'
    );
    
    _appName = _getEnv('APP_NAME', 'Smart Jewelry');
    
    _appVersion = _getEnv('APP_VERSION', '1.0.0');
    
    _tokenExpireTime = int.tryParse(_getEnv('TOKEN_EXPIRE_TIME', '3600')) ?? 3600;
    
    _refreshTokenExpireTime = int.tryParse(_getEnv('REFRESH_TOKEN_EXPIRE_TIME', '86400')) ?? 86400;
  }

  // Safe getter for environment variable
  static String _getEnv(String key, String defaultValue) {
    try {
      if (kIsWeb) {
        // On Web, dotenv might not be fully initialized, use defaults
        return defaultValue;
      }
      return dotenv.env[key] ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  // Public getters - use cached values
  static String get apiBaseUrl => _apiBaseUrl;
  
  static int get apiTimeout => _apiTimeout;
  
  // App Environment
  static String get appEnv => _appEnv;
  static bool get isDevelopment => _appEnv == 'development';
  static bool get isProduction => _appEnv == 'production';
  
  // Debug Configuration
  static bool get enableLogging => _enableLogging;
  
  // Network Configuration
  static int get connectTimeout => _connectTimeout;
  static int get receiveTimeout => _receiveTimeout;
  
  // Image Configuration
  static String get imageBaseUrl => _imageBaseUrl;
  
  // App Configuration
  static String get appName => _appName;
  static String get appVersion => _appVersion;
  
  // Security Configuration
  static int get tokenExpireTime => _tokenExpireTime;
  static int get refreshTokenExpireTime => _refreshTokenExpireTime;

  // Helper methods
  static void printConfig() {
    if (_enableLogging) {
      print('=== Environment Configuration ===');
      print('Environment: $_appEnv');
      print('API Base URL: $_apiBaseUrl');
      print('Image Base URL: $_imageBaseUrl');
      print('App Name: $_appName');
      print('App Version: $_appVersion');
      print('Enable Logging: $_enableLogging');
      print('Platform: ${kIsWeb ? 'Web' : 'Mobile'}');
      print('==============================');
    }
  }
}

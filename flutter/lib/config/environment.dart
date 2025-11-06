import 'package:flutter_dotenv/flutter_dotenv.dart';

class Environment {
  // Initialize environment variables
  static Future<void> init() async {
    await dotenv.load(fileName: ".env");
  }

  // API Configuration
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000/api';
  static int get apiTimeout => int.tryParse(dotenv.env['API_TIMEOUT'] ?? '30000') ?? 30000;
  
  // App Environment
  static String get appEnv => dotenv.env['APP_ENV'] ?? 'development';
  static bool get isDevelopment => appEnv == 'development';
  static bool get isProduction => appEnv == 'production';
  
  // Debug Configuration
  static bool get enableLogging => dotenv.env['ENABLE_LOGGING']?.toLowerCase() == 'true';
  
  // Network Configuration
  static int get connectTimeout => int.tryParse(dotenv.env['CONNECT_TIMEOUT'] ?? '5000') ?? 5000;
  static int get receiveTimeout => int.tryParse(dotenv.env['RECEIVE_TIMEOUT'] ?? '30000') ?? 30000;
  
  // Image Configuration
  static String get imageBaseUrl => dotenv.env['IMAGE_BASE_URL'] ?? 'http://localhost:5000/uploads';
  
  // App Configuration
  static String get appName => dotenv.env['APP_NAME'] ?? 'Smart Jewelry';
  static String get appVersion => dotenv.env['APP_VERSION'] ?? '1.0.0';
  
  // Security Configuration
  static int get tokenExpireTime => int.tryParse(dotenv.env['TOKEN_EXPIRE_TIME'] ?? '3600') ?? 3600;
  static int get refreshTokenExpireTime => int.tryParse(dotenv.env['REFRESH_TOKEN_EXPIRE_TIME'] ?? '86400') ?? 86400;

  // Helper methods
  static void printConfig() {
    if (enableLogging) {
      print('=== Environment Configuration ===');
      print('Environment: $appEnv');
      print('API Base URL: $apiBaseUrl');
      print('Image Base URL: $imageBaseUrl');
      print('App Name: $appName');
      print('App Version: $appVersion');
      print('Enable Logging: $enableLogging');
      print('==============================');
    }
  }
}

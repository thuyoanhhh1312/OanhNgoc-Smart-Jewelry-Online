import '../config/environment.dart';

class AppConstants {
  // API Configuration (use Environment config)
  static String get baseUrl => Environment.apiBaseUrl;
  static String get imageBaseUrl => Environment.imageBaseUrl;
  static String get apiVersion => 'v1';
  
  // Storage Keys
  static const String userTokenKey = 'user_token';
  static const String userDataKey = 'user_data';
  static const String cartDataKey = 'cart_data';
  static const String wishlistDataKey = 'wishlist_data';
  static const String settingsKey = 'app_settings';
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 50;
  
  // Image Sizes
  static const int thumbnailSize = 150;
  static const int mediumImageSize = 300;
  static const int largeImageSize = 600;
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Debounce Durations
  static const Duration searchDebounce = Duration(milliseconds: 500);
  static const Duration apiDebounce = Duration(milliseconds: 300);
  
  // Validation
  static const int minPasswordLength = 6;
  static const int maxNameLength = 50;
  static const int maxDescriptionLength = 500;
  
  // Currency
  static const String currencySymbol = '₫';
  static const String currencyCode = 'VND';
  
  // Default Values
  static const String defaultProductImage = 'assets/images/placeholder_product.png';
  static const String defaultUserAvatar = 'assets/images/placeholder_avatar.png';
  static const String defaultBrandLogo = 'assets/images/app_logo.png';
  
  // Image Paths
  static const String imagesPath = 'assets/images/';
  static const String iconsPath = 'assets/icons/';
  
  // Social Links
  static const String facebookUrl = 'https://facebook.com/smartjewelry';
  static const String instagramUrl = 'https://instagram.com/smartjewelry';
  static const String twitterUrl = 'https://twitter.com/smartjewelry';
  static const String youtubeUrl = 'https://youtube.com/smartjewelry';
  
  // Contact Info
  static const String supportEmail = 'support@smartjewelry.com';
  static const String supportPhone = '+84 123 456 789';
  static const String companyAddress = '123 Đường ABC, Quận 1, TP.HCM';
  
  // Error Messages
  static const String networkErrorMessage = 'Không thể kết nối. Vui lòng kiểm tra mạng.';
  static const String serverErrorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
  static const String unknownErrorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
  
  // Success Messages
  static const String loginSuccessMessage = 'Đăng nhập thành công!';
  static const String registerSuccessMessage = 'Đăng ký thành công!';
  static const String addToCartSuccessMessage = 'Đã thêm vào giỏ hàng!';
  static const String orderSuccessMessage = 'Đặt hàng thành công!';
}

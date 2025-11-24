import 'package:flutter/material.dart';

/// Rose Gold Elegant Theme - Luxury Jewelry App
/// Màu sắc sang trọng, ấm áp và thanh lịch dành cho app bán trang sức vàng bạc
class AppColors {
  // Primary Rose Gold Palette
  static const Color roseGold = Color(0xFFB76E79); // Rose Gold chính
  static const Color roseGoldDark = Color(0xFF9E5A64); // Rose Gold đậm
  static const Color roseGoldLight = Color(0xFFD4949D); // Rose Gold nhạt
  
  // Champagne & Beige Tones
  static const Color champagne = Color(0xFFF7E7CE); // Champagne sang trọng
  static const Color softBeige = Color(0xFFEFE7DA); // Beige mềm mại
  
  // Base Colors
  static const Color warmBlack = Color(0xFF1C1B1B); // Đen ấm
  static const Color softWhite = Color(0xFFFAF9F6); // Trắng mềm
  static const Color warmGray = Color(0xFFB3ADA7); // Xám ấm
  
  // Primary Colors (mapped to Rose Gold)
  static const Color primary = roseGold;
  static const Color primaryDark = roseGoldDark;
  static const Color primaryLight = roseGoldLight;
  
  // Secondary Colors
  static const Color secondary = warmBlack;
  static const Color secondaryLight = Color(0xFF4A4A4A);
  
  // Accent Colors
  static const Color accent = champagne;
  static const Color accentDark = softBeige;
  
  // Background Colors
  static const Color background = softWhite;
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = softBeige;
  
  // Text Colors
  static const Color textPrimary = warmBlack;
  static const Color textSecondary = Color(0xFF4A4A4A);
  static const Color textLight = warmGray;
  static const Color textOnPrimary = softWhite;
  static const Color textAccent = roseGoldDark;
  
  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFE53E3E);
  static const Color warning = Color(0xFFFF9800);
  static const Color info = roseGold;
  
  // Special Colors
  static const Color shadow = Color(0x1A000000);
  static const Color shadowLight = Color(0x0D000000); // 5% opacity
  static const Color border = warmGray;
  static const Color borderLight = champagne;
  static const Color divider = champagne;
  
  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [roseGoldLight, roseGold],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [softWhite, champagne],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  static const LinearGradient champagneGradient = LinearGradient(
    colors: [Color(0xFFFFFBF3), champagne],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Box Shadow presets
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: shadow,
      blurRadius: 20,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> get lightShadow => [
    BoxShadow(
      color: shadowLight,
      blurRadius: 10,
      offset: const Offset(0, 2),
      spreadRadius: 0,
    ),
  ];
}

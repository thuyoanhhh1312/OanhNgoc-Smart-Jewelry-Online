import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors - Luxury Jewelry Theme
  static const Color primary = Color(0xFFD4AF37); // Gold
  static const Color primaryDark = Color(0xFFB8860B); // Dark Gold
  static const Color primaryLight = Color(0xFFFFD700); // Light Gold
  
  // Secondary Colors
  static const Color secondary = Color(0xFF2C2C2C); // Dark Gray
  static const Color secondaryLight = Color(0xFF4A4A4A); // Medium Gray
  
  // Accent Colors
  static const Color accent = Color(0xFFE6E6FA); // Lavender
  static const Color accentDark = Color(0xFF9370DB); // Medium Slate Blue
  
  // Background Colors
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F5F5);
  
  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textLight = Color(0xFF9E9E9E);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  
  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFE53E3E);
  static const Color warning = Color(0xFFFF9800);
  static const Color info = Color(0xFF2196F3);
  
  // Special Colors
  static const Color shadow = Color(0x1A000000);
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFEEEEEE);
  
  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryLight, primary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [Color(0xFFFFF8E1), Color(0xFFFFFAF0)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}

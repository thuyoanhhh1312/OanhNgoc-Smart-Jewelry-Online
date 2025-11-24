import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';

/// Rose Gold Elegant Theme
/// Theme sang trọng cho app trang sức với màu sắc Rose Gold
class AppTheme {
  // Luxury fonts - sử dụng Google Fonts trong pubspec.yaml
  static const String luxuryFontFamily = 'Playfair Display'; // Title font
  static const String bodyFontFamily = 'Inter'; // Body font
  
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      
      // Primary colors
      primaryColor: AppColors.roseGold,
      scaffoldBackgroundColor: AppColors.softWhite,
      colorScheme: ColorScheme.light(
        primary: AppColors.roseGold,
        primaryContainer: AppColors.roseGoldLight,
        secondary: AppColors.champagne,
        secondaryContainer: AppColors.softBeige,
        surface: Colors.white,
        error: AppColors.error,
        onPrimary: AppColors.softWhite,
        onSecondary: AppColors.warmBlack,
        onSurface: AppColors.warmBlack,
        onError: Colors.white,
      ),
      
      // AppBar Theme
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.softWhite,
        foregroundColor: AppColors.warmBlack,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(
          color: AppColors.roseGold,
          size: 24,
        ),
        titleTextStyle: const TextStyle(
          fontFamily: luxuryFontFamily,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.5,
        ),
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.roseGold,
          foregroundColor: AppColors.softWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: bodyFontFamily,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
      
      // Outlined Button Theme
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.roseGold,
          side: const BorderSide(color: AppColors.roseGold, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: bodyFontFamily,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
      
      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.roseGold,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: const TextStyle(
            fontFamily: bodyFontFamily,
            fontSize: 15,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.3,
          ),
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.warmGray, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.warmGray, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.roseGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        labelStyle: const TextStyle(
          color: AppColors.roseGoldDark,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
        hintStyle: const TextStyle(
          color: AppColors.warmGray,
          fontSize: 15,
        ),
        prefixIconColor: AppColors.warmGray,
        suffixIconColor: AppColors.warmGray,
      ),
      
      // Card Theme
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shadowColor: AppColors.shadow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.champagne, width: 1),
        ),
        margin: const EdgeInsets.all(0),
      ),
      
      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.champagne,
        thickness: 1,
        space: 1,
      ),
      
      // Icon Theme
      iconTheme: const IconThemeData(
        color: AppColors.roseGold,
        size: 24,
      ),
      
      // Typography
      textTheme: const TextTheme(
        // Display - Luxury titles
        displayLarge: TextStyle(
          fontFamily: luxuryFontFamily,
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppColors.warmBlack,
          letterSpacing: 0.5,
          height: 1.2,
        ),
        displayMedium: TextStyle(
          fontFamily: luxuryFontFamily,
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.5,
          height: 1.3,
        ),
        displaySmall: TextStyle(
          fontFamily: luxuryFontFamily,
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.3,
          height: 1.3,
        ),
        
        // Headline - Section titles
        headlineLarge: TextStyle(
          fontFamily: luxuryFontFamily,
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.3,
        ),
        headlineMedium: TextStyle(
          fontFamily: luxuryFontFamily,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.2,
        ),
        headlineSmall: TextStyle(
          fontFamily: luxuryFontFamily,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.2,
        ),
        
        // Title - Card titles
        titleLarge: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.15,
        ),
        titleMedium: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.15,
        ),
        titleSmall: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.warmBlack,
          letterSpacing: 0.1,
        ),
        
        // Body - Regular text
        bodyLarge: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Color(0xFF4A4A4A),
          letterSpacing: 0.2,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: Color(0xFF4A4A4A),
          letterSpacing: 0.15,
          height: 1.5,
        ),
        bodySmall: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: Color(0xFF4A4A4A),
          letterSpacing: 0.1,
          height: 1.5,
        ),
        
        // Label - Subtitles and captions
        labelLarge: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.roseGoldDark,
          letterSpacing: 0.3,
        ),
        labelMedium: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.roseGoldDark,
          letterSpacing: 0.2,
        ),
        labelSmall: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: AppColors.roseGoldDark,
          letterSpacing: 0.2,
        ),
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.roseGold,
        unselectedItemColor: AppColors.warmGray,
        selectedIconTheme: IconThemeData(size: 28),
        unselectedIconTheme: IconThemeData(size: 24),
        selectedLabelStyle: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
        elevation: 8,
        type: BottomNavigationBarType.fixed,
      ),
      
      // Floating Action Button Theme
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.roseGold,
        foregroundColor: AppColors.softWhite,
        elevation: 4,
        shape: CircleBorder(),
      ),
      
      // Chip Theme
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.champagne,
        selectedColor: AppColors.roseGold,
        labelStyle: const TextStyle(
          fontFamily: bodyFontFamily,
          fontSize: 13,
          color: AppColors.warmBlack,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}

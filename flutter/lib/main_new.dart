import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'constants/app_theme.dart';
import 'constants/app_strings.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/auth/login_screen.dart' as auth_login;
import 'screens/auth/register_screen.dart' as auth_register;
import 'screens/main_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/product_provider.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
      ],
      child: MaterialApp(
        title: AppStrings.appName,
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        home: const SplashScreen(),
        routes: {
          '/splash': (context) => const SplashScreen(),
          '/onboarding': (context) => const OnboardingScreen(),
          '/login': (context) => const auth_login.LoginScreen(),
          '/register': (context) => const auth_register.RegisterScreen(),
          '/home': (context) => const MainScreen(),
          '/profile': (context) => const ProfileScreen(),
        },
      ),
    );
  }
}

// Placeholder screens - will be implemented  
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const MainScreen();
  }
}

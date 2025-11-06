import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/environment.dart';
import 'constants/app_theme.dart';
import 'constants/app_strings.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/auth/login_screen.dart' as auth_login;
import 'screens/auth/register_screen.dart' as auth_register;
import 'screens/auth/forgot_password_screen.dart';
import 'screens/main_screen.dart';
import 'screens/search_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/product_detail_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/product_provider.dart';

void main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize environment configuration
  await Environment.init();
  
  // Print configuration in debug mode
  Environment.printConfig();
  
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
        initialRoute: '/',
        onGenerateRoute: (RouteSettings settings) {
          switch (settings.name) {
            case '/product':
              final args = settings.arguments as Map<String, dynamic>?;
              final productId = args?['id'] ?? '';
              return MaterialPageRoute(
                builder: (context) => ProductDetailScreen(productId: productId),
              );
            default:
              return null;
          }
        },
        routes: {
          '/': (context) => const SplashScreen(),
          '/onboarding': (context) => const OnboardingScreen(),
          '/login': (context) => const auth_login.LoginScreen(),
          '/register': (context) => const auth_register.RegisterScreen(),
          '/forgot-password': (context) => const ForgotPasswordScreen(),
          '/main': (context) => const MainScreen(),
          '/home': (context) => const MainScreen(), // Alias for /main
          '/search': (context) => const SearchScreen(),
          '/cart': (context) => const CartScreen(),
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

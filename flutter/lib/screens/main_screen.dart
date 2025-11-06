import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import 'home_screen.dart';
import 'categories_screen.dart';
import 'search_screen.dart';
import 'cart_screen.dart';
import 'profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      const HomeScreen(),
      const CategoriesScreen(),
      const SearchScreen(),
      const CartScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return Container(
          decoration: const BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: AppColors.shadow,
                blurRadius: 10,
                offset: Offset(0, -2),
              ),
            ],
          ),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: _onTabTapped,
            type: BottomNavigationBarType.fixed,
            backgroundColor: AppColors.surface,
            selectedItemColor: AppColors.primary,
            unselectedItemColor: AppColors.textLight,
            selectedFontSize: 12,
            unselectedFontSize: 12,
            elevation: 0,
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home),
                label: 'Trang chủ',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.grid_view_outlined),
                activeIcon: Icon(Icons.grid_view),
                label: 'Danh mục',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.search_outlined),
                activeIcon: Icon(Icons.search),
                label: 'Tìm kiếm',
              ),
              BottomNavigationBarItem(
                icon: _buildCartIcon(),
                activeIcon: _buildCartIcon(isActive: true),
                label: 'Giỏ hàng',
              ),
              BottomNavigationBarItem(
                icon: authProvider.isLoggedIn
                    ? const Icon(Icons.person)
                    : const Icon(Icons.person_outline),
                activeIcon: const Icon(Icons.person),
                label: authProvider.isLoggedIn ? 'Tài khoản' : 'Đăng nhập',
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCartIcon({bool isActive = false}) {
    return Consumer<CartProvider>(
      builder: (context, cartProvider, child) {
        return Stack(
          children: [
            Icon(
              isActive ? Icons.shopping_cart : Icons.shopping_cart_outlined,
            ),
            if (cartProvider.itemCount > 0)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    '${cartProvider.itemCount > 99 ? '99+' : cartProvider.itemCount}',
                    style: const TextStyle(
                      color: AppColors.textOnPrimary,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

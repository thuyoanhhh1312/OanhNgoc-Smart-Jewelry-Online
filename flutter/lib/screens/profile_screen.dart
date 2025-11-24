import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/luxury/luxury_buttons.dart';
import '../widgets/luxury/luxury_layout_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.softWhite,
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (!authProvider.isLoggedIn) {
            return _buildGuestView();
          }
          
          return _buildUserProfile(authProvider);
        },
      ),
    );
  }

  Widget _buildGuestView() {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Profile Icon
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.champagne,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.roseGold,
                    width: 2,
                  ),
                ),
                child: const Icon(
                  Icons.person_outline,
                  size: 50,
                  color: AppColors.roseGold,
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Welcome Text
              Text(
                'Chào mừng bạn!',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.warmBlack,
                  fontWeight: FontWeight.bold,
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Đăng nhập để quản lý tài khoản và đơn hàng của bạn',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Login Button
              LuxuryPrimaryButton(
                onPressed: () {
                  Navigator.of(context).pushNamed('/login');
                },
                text: 'Đăng nhập',
                width: double.infinity,
              ),
              
              const SizedBox(height: 16),
              
              // Register Button
              LuxurySecondaryButton(
                onPressed: () {
                  Navigator.of(context).pushNamed('/register');
                },
                text: 'Đăng ký tài khoản',
                width: double.infinity,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUserProfile(AuthProvider authProvider) {
    return CustomScrollView(
      slivers: [
        // Profile Header
        _buildProfileHeader(authProvider),
        
        // Profile Menu
        SliverToBoxAdapter(
          child: _buildProfileMenu(authProvider),
        ),
      ],
    );
  }

  Widget _buildProfileHeader(AuthProvider authProvider) {
    return SliverAppBar(
      expandedHeight: 200,
      floating: false,
      pinned: true,
      backgroundColor: AppColors.roseGold,
      automaticallyImplyLeading: false,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Avatar with rose gold border
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white,
                        width: 3,
                      ),
                      boxShadow: AppColors.lightShadow,
                    ),
                    child: CircleAvatar(
                      radius: 40,
                      backgroundColor: AppColors.champagne,
                      child: Text(
                        authProvider.user?.fullName?.substring(0, 1).toUpperCase() ?? 'U',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: AppColors.roseGoldDark,
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // User Name
                  Text(
                    authProvider.user?.fullName ?? 'Người dùng',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  
                  const SizedBox(height: 4),
                  
                  // User Email
                  Text(
                    authProvider.user?.email ?? '',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileMenu(AuthProvider authProvider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Account Section
          _buildMenuSection(
            title: 'Tài khoản',
            items: [
              _buildMenuItem(
                icon: Icons.person_outline,
                title: 'Thông tin cá nhân',
                onTap: () {
                  Navigator.of(context).pushNamed('/profile/info');
                },
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Orders Section
          _buildMenuSection(
            title: 'Đơn hàng',
            items: [
              _buildMenuItem(
                icon: Icons.shopping_bag_outlined,
                title: 'Đơn hàng của tôi',
                onTap: () {
                  Navigator.of(context).pushNamed('/profile/orders');
                },
              ),
              _buildMenuItem(
                icon: Icons.rate_review_outlined,
                title: 'Đánh giá của tôi',
                onTap: () {
                  Navigator.of(context).pushNamed('/profile/reviews');
                },
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // Logout Button
          LuxurySecondaryButton(
            onPressed: () => _showLogoutDialog(authProvider),
            text: 'Đăng xuất',
            icon: Icons.logout,
            width: double.infinity,
          ),
          
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildMenuSection({
    required String title,
    required List<Widget> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        LuxuryCard(
          padding: EdgeInsets.zero,
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Widget? trailing,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: AppColors.roseGold,
        size: 24,
      ),
      title: Text(
        title,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: AppColors.warmBlack,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: trailing ?? const Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: AppColors.roseGold,
      ),
      onTap: onTap,
    );
  }

  void _showLogoutDialog(AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              if (!mounted) return;
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              await authProvider.logout();
              messenger.showSnackBar(
                const SnackBar(
                  content: Text('Đã đăng xuất thành công'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            child: Text(
              'Đăng xuất',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_strings.dart';
import '../providers/auth_provider.dart';
import '../providers/product_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/product_card.dart';
import '../widgets/category_card.dart';
import '../widgets/promo_banner.dart';
import '../models/product.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _setupScrollListener();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _setupScrollListener() {
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= 
          _scrollController.position.maxScrollExtent - 200) {
        _loadMoreProducts();
      }
    });
  }

  Future<void> _loadInitialData() async {
    final productProvider = Provider.of<ProductProvider>(context, listen: false);
    await productProvider.loadInitialData();
  }

  Future<void> _loadMoreProducts() async {
    if (_isLoadingMore) return;
    
    setState(() {
      _isLoadingMore = true;
    });

    final productProvider = Provider.of<ProductProvider>(context, listen: false);
    await productProvider.loadMore();
    
    setState(() {
      _isLoadingMore = false;
    });
  }

  Future<void> _refreshData() async {
    final productProvider = Provider.of<ProductProvider>(context, listen: false);
    await productProvider.refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshData,
          color: AppColors.primary,
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              // App Bar
              _buildSliverAppBar(),
              
              // Search Bar
              SliverToBoxAdapter(
                child: _buildSearchBar(),
              ),
              
              // Promo Banners
              SliverToBoxAdapter(
                child: _buildPromoBanners(),
              ),
              
              // Categories
              SliverToBoxAdapter(
                child: _buildCategoriesSection(),
              ),
              
              // Featured Products
              SliverToBoxAdapter(
                child: _buildFeaturedProducts(),
              ),
              
              // New Arrivals
              SliverToBoxAdapter(
                child: _buildNewArrivals(),
              ),
              
              // Best Sellers
              SliverToBoxAdapter(
                child: _buildBestSellers(),
              ),
              
              // Bottom Spacing và Loading Indicator
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // Loading indicator khi đang load thêm
                    if (_isLoadingMore)
                      Container(
                        padding: const EdgeInsets.all(16),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                              ),
                            ),
                            SizedBox(width: 12),
                            Text(
                              'Đang tải thêm sản phẩm...',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return SliverAppBar(
          floating: true,
          backgroundColor: AppColors.surface,
          elevation: 0,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authProvider.isLoggedIn 
                    ? 'Xin chào, ${authProvider.user?.fullName ?? 'Khách hàng'}!'
                    : 'Chào mừng đến với',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                AppStrings.appName,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          actions: [
            // Login/Profile Button
            Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                if (authProvider.isLoggedIn) {
                  // Profile Button for logged in user
                  return IconButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/profile');
                    },
                    icon: CircleAvatar(
                      radius: 16,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        authProvider.user?.fullName?.substring(0, 1).toUpperCase() ?? 'U',
                        style: const TextStyle(
                          color: AppColors.textOnPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                } else {
                  // Login Button for guest user
                  return TextButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/login');
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      backgroundColor: AppColors.primary.withOpacity(0.1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.person_outline,
                          size: 18,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Đăng nhập',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  );
                }
              },
            ),
            
            // Notifications
            IconButton(
              onPressed: () {
                Navigator.of(context).pushNamed('/notifications');
              },
              icon: Stack(
                children: [
                  const Icon(
                    Icons.notifications_outlined,
                    color: AppColors.textSecondary,
                  ),
                  // Notification badge
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Cart
            Consumer<CartProvider>(
              builder: (context, cartProvider, child) {
                return IconButton(
                  onPressed: () {
                    Navigator.of(context).pushNamed('/cart');
                  },
                  icon: Stack(
                    children: [
                      const Icon(
                        Icons.shopping_bag_outlined,
                        color: AppColors.textSecondary,
                      ),
                      if (cartProvider.itemCount > 0)
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 16,
                              minHeight: 16,
                            ),
                            child: Text(
                              '${cartProvider.itemCount}',
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
                  ),
                );
              },
            ),
            
            const SizedBox(width: 8),
          ],
        );
      },
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: GestureDetector(
        onTap: () {
          Navigator.of(context).pushNamed('/search');
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadow,
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(
                Icons.search,
                color: AppColors.textLight,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  AppStrings.searchHint,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textLight,
                  ),
                ),
              ),
              const Icon(
                Icons.tune,
                color: AppColors.textLight,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPromoBanners() {
    return PromoBanner(
      banners: BannerItem.defaultBanners(),
      height: 160,
      margin: const EdgeInsets.symmetric(horizontal: 16),
    );
  }

  Widget _buildCategoriesSection() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.categories.isEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppStrings.categories,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/categories');
                    },
                    child: Text(AppStrings.viewAll),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            SizedBox(
              height: 120,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: productProvider.categories.length,
                itemBuilder: (context, index) {
                  final category = productProvider.categories[index];
                  return SizedBox(
                    width: 90,
                    child: CategoryCard(
                      category: category,
                      onTap: () {
                        Navigator.of(context).pushNamed(
                          '/category',
                          arguments: category,
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildFeaturedProducts() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.featuredProducts.isEmpty) {
          return const SizedBox.shrink();
        }

        return _buildProductSection(
          title: AppStrings.featuredProducts,
          products: productProvider.featuredProducts,
          onViewAll: () {
            Navigator.of(context).pushNamed('/products', arguments: {
              'title': AppStrings.featuredProducts,
              'isFeatured': true,
            });
          },
        );
      },
    );
  }

  Widget _buildNewArrivals() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.newArrivals.isEmpty) {
          return const SizedBox.shrink();
        }

        return _buildProductSection(
          title: AppStrings.newArrivals,
          products: productProvider.newArrivals,
          onViewAll: () {
            Navigator.of(context).pushNamed('/products', arguments: {
              'title': AppStrings.newArrivals,
              'sortBy': 'created_desc',
            });
          },
        );
      },
    );
  }

  Widget _buildBestSellers() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.bestSellers.isEmpty) {
          return const SizedBox.shrink();
        }

        return _buildProductSection(
          title: AppStrings.bestSellers,
          products: productProvider.bestSellers,
          onViewAll: () {
            Navigator.of(context).pushNamed('/products', arguments: {
              'title': AppStrings.bestSellers,
              'sortBy': 'sales_desc',
            });
          },
        );
      },
    );
  }

  Widget _buildProductSection({
    required String title,
    required List<Product> products,
    VoidCallback? onViewAll,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (onViewAll != null)
                TextButton(
                  onPressed: onViewAll,
                  child: Text(AppStrings.viewAll),
                ),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Hiển thị full sản phẩm với lazy loading
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.7,
            ),
            itemCount: products.length, // Hiển thị tất cả sản phẩm
            itemBuilder: (context, index) {
              final product = products[index];
              return _buildLazyProductCard(product, index);
            },
          ),
        ),
      ],
    );
  }

  // Widget lazy loading cho product card
  Widget _buildLazyProductCard(Product product, int index) {
    return FutureBuilder<Widget>(
      future: _loadProductCard(product, index),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          // Placeholder khi đang load
          return Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 80,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  width: 60,
                  height: 6,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ],
            ),
          );
        }
        
        if (snapshot.hasError) {
          // Error state
          return Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.error),
            ),
            child: const Center(
              child: Icon(
                Icons.error_outline,
                color: AppColors.error,
                size: 24,
              ),
            ),
          );
        }
        
        return snapshot.data ?? const SizedBox();
      },
    );
  }

  // Simulate lazy loading với delay
  Future<Widget> _loadProductCard(Product product, int index) async {
    // Thêm delay để simulate lazy loading
    await Future.delayed(Duration(milliseconds: 100 * (index % 5)));
    
    return ProductCard(
      product: product,
      onTap: () {
        Navigator.of(context).pushNamed(
          '/product',
          arguments: {'id': product.id},
        );
      },
      onAddToCart: () => _addToCart(product),
      onToggleWishlist: () => _toggleWishlist(product),
    );
  }

  void _addToCart(Product product) {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    cartProvider.addToCart(product);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} đã được thêm vào giỏ hàng'),
        backgroundColor: AppColors.success,
        action: SnackBarAction(
          label: 'Xem giỏ hàng',
          textColor: AppColors.textOnPrimary,
          onPressed: () {
            Navigator.of(context).pushNamed('/cart');
          },
        ),
      ),
    );
  }

  void _toggleWishlist(Product product) {
    // TODO: Implement wishlist functionality
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} đã được thêm vào danh sách yêu thích'),
        backgroundColor: AppColors.success,
      ),
    );
  }
}

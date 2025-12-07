import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/product_provider.dart';
import '../providers/cart_provider.dart';

import '../widgets/category_card.dart';
import '../widgets/promo_banner.dart';
import '../widgets/luxury/luxury_layout_widgets.dart';
import '../widgets/luxury/luxury_product_widgets.dart';
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
      backgroundColor: AppColors.softWhite,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshData,
          color: AppColors.roseGold,
          backgroundColor: Colors.white,
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
          pinned: false,
          expandedHeight: 0,
          backgroundColor: AppColors.softWhite,
          elevation: 0,
          flexibleSpace: Container(
            decoration: BoxDecoration(
              color: AppColors.softWhite,
              border: const Border(
                bottom: BorderSide(
                  color: AppColors.champagne,
                  width: 1,
                ),
              ),
            ),
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authProvider.isLoggedIn 
                    ? 'Xin chào, ${authProvider.user?.fullName?.split(' ').last ?? 'Khách hàng'}!'
                    : 'Chào mừng đến với',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.2,
                ),
              ),
              ShaderMask(
                shaderCallback: (bounds) {
                  return const LinearGradient(
                    colors: [
                      AppColors.roseGold,
                      AppColors.roseGoldDark,
                    ],
                  ).createShader(bounds);
                },
                child: Text(
                  'Oanh Ngọc Jewelry',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
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
                  return Container(
                    margin: const EdgeInsets.only(right: 12),
                    child: IconButton(
                      onPressed: () {
                        Navigator.of(context).pushNamed('/profile');
                      },
                      icon: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppColors.primary,
                              AppColors.primary.withValues(alpha: 0.8),
                            ],
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.transparent,
                          child: Text(
                            authProvider.user?.fullName?.substring(0, 1).toUpperCase() ?? 'U',
                            style: const TextStyle(
                              color: AppColors.textOnPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                } else {
                  // Login Button for guest user
                  return Container(
                    margin: const EdgeInsets.only(right: 12),
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(context).pushNamed('/login');
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.person_outline,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Đăng nhập',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
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
                    size: 22,
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
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: IconButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/cart');
                    },
                    icon: Stack(
                      children: [
                        const Icon(
                          Icons.shopping_bag_outlined,
                          color: AppColors.textSecondary,
                          size: 22,
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
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: GestureDetector(
        onTap: () {
          Navigator.of(context).pushNamed('/search');
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.surface,
                AppColors.surface.withValues(alpha: 0.95),
              ],
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.search,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Tìm kiếm sản phẩm...',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textLight,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.roseGold.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.tune,
                  color: AppColors.roseGold,
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPromoBanners() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: PromoBanner(
                banners: BannerItem.defaultBanners(),
                height: 180,
                margin: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
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
            const SizedBox(height: 32),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShaderMask(
                          shaderCallback: (bounds) {
                            return LinearGradient(
                              colors: [
                                AppColors.primary,
                                AppColors.primary.withValues(alpha: 0.6),
                              ],
                            ).createShader(bounds);
                          },
                          child: Text(
                            'Danh mục sản phẩm',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Khám phá các loại trang sức sang trọng',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(context).pushNamed('/categories');
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Xem tất cả',
                            style: TextStyle(
                              color: AppColors.roseGold,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.arrow_forward,
                            size: 16,
                            color: AppColors.roseGold,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
            
            SizedBox(
              height: 140,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: productProvider.categories.length,
                itemBuilder: (context, index) {
                  final category = productProvider.categories[index];
                  return SizedBox(
                    width: 100,
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
          title: 'Sản phẩm nổi bật',
          products: productProvider.featuredProducts,
          onViewAll: () {
            Navigator.of(context).pushNamed('/products', arguments: {
              'title': 'Sản phẩm nổi bật',
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
          title: 'Hàng mới về',
          products: productProvider.newArrivals,
          onViewAll: () {
            Navigator.of(context).pushNamed('/products', arguments: {
              'title': 'Hàng mới về',
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
          title: 'Bán chạy nhất',
          products: productProvider.bestSellers,
          onViewAll: () {
            Navigator.of(context).pushNamed('/products', arguments: {
              'title': 'Bán chạy nhất',
              'sortBy': 'sales_desc',
            });
          },
        );
      },
    );
  }

  ProductBadge? _getProductBadge(Product product) {
    if (product.hasDiscount) {
      return ProductBadge.sale(text: '-${product.discountPercentage.round()}%');
    }
    if (product.isFeatured) {
      return ProductBadge.hot();
    }
    if (DateTime.now().difference(product.createdAt).inDays <= 7) {
      return ProductBadge.newProduct();
    }
    if (product.reviewsCount > 50) {
      return ProductBadge.bestseller();
    }
    return null;
  }

  Widget _buildProductSection({
    required String title,
    required List<Product> products,
    VoidCallback? onViewAll,
  }) {
    const horizontalPadding = 16.0;
    const crossAxisSpacing = 12.0;
    const infoHeight = 120.0; // Extra height for text, rating, price to avoid overflow
    final screenWidth = MediaQuery.of(context).size.width;
    final gridContentWidth = screenWidth - (horizontalPadding * 2);
    final itemWidth = (gridContentWidth - crossAxisSpacing) / 2;
    final childAspectRatio = itemWidth / (itemWidth + infoHeight);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SectionTitle(
            title: title,
            onSeeAll: onViewAll,
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Hiển thị full sản phẩm với lazy loading
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: horizontalPadding),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: crossAxisSpacing,
              mainAxisSpacing: 12,
              childAspectRatio: childAspectRatio,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return LuxuryProductCard(
                imageUrl: product.mainImage,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                rating: product.rating,
                soldCount: product.reviewsCount,
                badge: _getProductBadge(product),
                onTap: () {
                  Navigator.of(context).pushNamed(
                    '/product-detail',
                    arguments: product,
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

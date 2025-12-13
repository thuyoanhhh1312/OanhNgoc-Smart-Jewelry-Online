import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:flutter/services.dart';
import '../models/product.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../services/product_service.dart';
import '../widgets/product_card.dart';
import '../widgets/review_card.dart';
import '../widgets/rating_summary.dart';
import '../widgets/add_to_cart_modal.dart';
import '../widgets/review_modal.dart';
import '../widgets/loading_widget.dart';
import '../constants/app_colors.dart';
import '../widgets/luxury/luxury_buttons.dart';
import '../widgets/luxury/luxury_product_widgets.dart';
import '../widgets/luxury/luxury_layout_widgets.dart';
import '../widgets/three_d_viewer.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  ProductDetailScreenState createState() => ProductDetailScreenState();
}

class ProductDetailScreenState extends State<ProductDetailScreen>
    with TickerProviderStateMixin {
  // slug -> local GLB asset path, loaded dynamically from AssetManifest
  final Map<String, String> _modelAssets = {};

  Product? product;
  List<Product> similarProducts = [];
  List<dynamic> reviews = [];
  Map<String, dynamic>? reviewSummary;
  bool isLoading = true;
  bool isLoadingReviews = false;

  // Tab controllers
  late TabController _tabController;
  int _selectedMediaIndex = 0;

  // Modal states
  bool _showAddToCartModal = false;
  bool _showBuyNowModal = false;
  bool _showReviewModal = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadModelAssets();
    _loadProductDetail();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProductDetail() async {
    try {
      setState(() {
        isLoading = true;
      });

      // Load product detail
      final productData = await ProductService.getProductById(widget.productId);
      setState(() {
        product = productData;
        _selectedMediaIndex = 0;
      });

      // Load similar products
      if (product!.categoryId.isNotEmpty && product!.subCategoryId != null) {
        final similarData = await ProductService.getSimilarProducts(
          categoryId: product!.categoryId,
          subcategoryId: product!.subCategoryId!,
        );
        setState(() {
          similarProducts = similarData;
        });
      }

      // Load reviews and rating summary
      await _loadReviews();
      await _loadRatingSummary();

      // Save to viewed products
      _saveToViewedProducts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi khi tải chi tiết sản phẩm: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  Future<void> _loadModelAssets() async {
    try {
      final manifestContent = await rootBundle.loadString('AssetManifest.json');
      final Map<String, dynamic> manifestMap = json.decode(manifestContent);
      final entries = manifestMap.keys.where((path) {
        return path.startsWith('assets/3d/') && path.endsWith('.glb');
      }).map((path) {
        final filename = path.split('/').last;
        final slug = filename.replaceFirst('.glb', '');
        return MapEntry(slug, path);
      });

      if (mounted) {
        setState(() {
          _modelAssets
            ..clear()
            ..addEntries(entries);
        });
      }
    } catch (_) {
      // silently ignore if manifest is not available
    }
  }

  Future<void> _loadReviews() async {
    if (product == null) return;

    try {
      setState(() {
        isLoadingReviews = true;
      });

      final reviewData = await ProductService.getProductReviews(product!.id);

      // Handle response - backend returns { message: '...', reviews: [...] }
      if (reviewData['reviews'] != null) {
        setState(() {
          reviews = reviewData['reviews'] ?? [];
        });
      }
    } catch (e) {
      // ignore error, show empty reviews
    } finally {
      setState(() {
        isLoadingReviews = false;
      });
    }
  }

  Future<void> _loadRatingSummary() async {
    if (product == null || product!.id.isEmpty) {
      return;
    }

    try {
      final summaryData = await ProductService.getProductReviewSummary(
        product!.id,
      );

      // Handle response - backend returns { message: '...', data: {...} }
      if (summaryData['data'] != null) {
        setState(() {
          reviewSummary = summaryData['data'];
        });
      } else {
        reviewSummary = null;
      }
    } catch (e) {
      reviewSummary = null;
    }
  }

  void _saveToViewedProducts() {
    if (product == null) return;

    // Implementation for saving to viewed products
    // This would typically use SharedPreferences or local storage
  }

  void _handleAddToCart(int quantity) {
    if (product == null) return;

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    cartProvider.addToCart(product!, quantity: quantity);

    setState(() {
      _showAddToCartModal = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã thêm vào giỏ hàng thành công!')),
    );
  }

  void _handleBuyNow(int quantity) {
    if (product == null) return;

    // Navigate to checkout with selected product
    Navigator.pushNamed(
      context,
      '/checkout',
      arguments: {
        'selectedItems': [
          {'product': product, 'quantity': quantity},
        ],
        'totalAmount': product!.price * quantity,
      },
    );

    setState(() {
      _showBuyNowModal = false;
    });
  }

  Future<void> _handleSubmitReview(Map<String, dynamic> review) async {
    if (product == null) return;

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.user == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng đăng nhập để đánh giá')),
        );
        return;
      }

      final result = await ProductService.addProductReview(
        productId: product!.id,
        userId: authProvider.user!.id,
        rating: review['rating'],
        content: review['content'],
      );

      if (!mounted) return;

      final bool success =
          (result['success'] == true) || (result['review'] != null);

      if (success) {
        setState(() {
          _showReviewModal = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đánh giá đã gửi thành công!')),
        );

        // Reload reviews
        await _loadReviews();
        await _loadRatingSummary();
      } else {
        final msg = result['message'] ?? 'Không thể gửi đánh giá';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gửi đánh giá thất bại: $msg')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Gửi đánh giá thất bại: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết sản phẩm')),
        body: const LoadingWidget(),
      );
    }

    if (product == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết sản phẩm')),
        body: const Center(child: Text('Không tìm thấy sản phẩm')),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.softWhite,
      appBar: LuxuryAppBar(
        title: product!.name,
        actions: [
          LuxuryIconButton(
            icon: Icons.share_outlined,
            onPressed: () {
              // Share functionality
            },
          ),
          const SizedBox(width: 8),
          LuxuryIconButton(
            icon: Icons.favorite_border,
            iconColor: AppColors.roseGold,
            onPressed: () {
              // Add to wishlist functionality
            },
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product images
            _buildProductImages(),

            // Divider
            Container(height: 8, color: Colors.grey.withValues(alpha: 0.08)),

            // Product info
            _buildProductInfo(),

            // Action buttons
            _buildActionButtons(),

            // Divider
            Container(height: 8, color: Colors.grey.withValues(alpha: 0.08)),

            // Benefits section
            _buildBenefitsSection(),

            // Divider
            Container(height: 8, color: Colors.grey.withValues(alpha: 0.08)),

            // Product details tabs
            _buildProductDetailsTabs(),

            // Divider
            Container(height: 8, color: Colors.grey.withValues(alpha: 0.08)),

            // Similar products
            _buildSimilarProducts(),

            // Divider
            Container(height: 8, color: Colors.grey.withValues(alpha: 0.08)),

            // Reviews section
            _buildReviewsSection(),

            // Bottom padding
            const SizedBox(height: 20),
          ],
        ),
      ),
      // Modals
      bottomSheet: _buildModals(),
    );
  }

  bool _shouldShow3DModel() {
    if (product?.slug == null) return false;
    return _modelAssets.containsKey(product!.slug);
  }

  List<_MediaItem> _buildMediaItems() {
    if (product == null) return [];

    final items = <_MediaItem>[];
    if (product!.images.isNotEmpty) {
      items.addAll(product!.images.map((url) => _MediaItem.image(url)));
    } else {
      items.add(const _MediaItem.image('https://via.placeholder.com/400'));
    }

    if (_shouldShow3DModel()) {
      final slug = product?.slug ?? '';
      final modelPath = _modelAssets[slug];
      if (modelPath != null) {
        items.add(_MediaItem.model(modelPath));
      }
    }

    return items;
  }

  Widget _buildProductImages() {
    final mediaItems = _buildMediaItems();
    if (mediaItems.isEmpty) {
      return const SizedBox.shrink();
    }

    final safeIndex = _selectedMediaIndex.clamp(0, mediaItems.length - 1);
    final selectedMedia = mediaItems[safeIndex];

    return SizedBox(
      height: 420,
      child: Column(
        children: [
          // Main image with luxury styling
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.white,
                boxShadow: AppColors.lightShadow,
                border: Border.all(color: AppColors.champagne, width: 1.5),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    if (selectedMedia.type == _MediaType.image)
                      Image.network(
                        selectedMedia.source,
                        fit: BoxFit.contain,
                        width: double.infinity,
                      )
                    else
                      ThreeDViewer(modelAssetPath: selectedMedia.source),
                    // Image counter badge
                    if (mediaItems.length > 1)
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${safeIndex + 1}/${mediaItems.length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),

          // Image thumbnails
          if (mediaItems.length > 1)
            Container(
              height: 90,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: mediaItems.length,
                itemBuilder: (context, index) {
                  final item = mediaItems[index];
                  final isSelected = safeIndex == index;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedMediaIndex = index;
                      });
                    },
                    child: Container(
                      width: 72,
                      height: 72,
                      margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          if (isSelected)
                            BoxShadow(
                              color: const Color(
                                0xFFD4AF37,
                              ).withValues(alpha: 0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                        border: Border.all(
                          color: isSelected
                              ? AppColors.roseGold
                              : AppColors.champagne,
                          width: isSelected ? 2.5 : 1.5,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Stack(
                          children: [
                            if (item.type == _MediaType.image)
                              Image.network(
                                item.source,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                              )
                            else
                              Container(
                                color: Colors.black.withValues(alpha: 0.7),
                                child: const Center(
                                  child: Text(
                                    '3D',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ),
                            // Overlay for selected thumbnail
                            if (isSelected)
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      AppColors.roseGold.withValues(
                                        alpha: 0.15,
                                      ),
                                    ],
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProductInfo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product name
          Text(
            product!.name,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.3,
              color: AppColors.warmBlack,
            ),
          ),
          const SizedBox(height: 12),

          // Price with ProductPriceText
          ProductPriceText(
            price: product!.price,
            originalPrice: product!.originalPrice,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
          const SizedBox(height: 16),

          // Stock info with icon
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.inventory_2_outlined,
                  color: Colors.green,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Còn ${product!.stockQuantity} sản phẩm',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.green.shade700,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Rating section
          if (reviewSummary != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.amber.withValues(alpha: 0.15),
                    Colors.amber.withValues(alpha: 0.08),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.amber.withValues(alpha: 0.3),
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Stars
                      Row(
                        children: List.generate(5, (index) {
                          final rating =
                              reviewSummary!['avgRating']?.toDouble() ?? 0.0;
                          return Icon(
                            index < rating.floor()
                                ? Icons.star
                                : index < rating
                                ? Icons.star_half
                                : Icons.star_border,
                            color: Colors.amber,
                            size: 18,
                          );
                        }),
                      ),
                      const SizedBox(width: 12),

                      // Rating text
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${reviewSummary!['avgRating']?.toStringAsFixed(2) ?? '0.0'}/5.0',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A1A1A),
                            ),
                          ),
                          Text(
                            '${reviewSummary!['totalReviews'] ?? 0} đánh giá',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Sentiment badges (wraps to new line to avoid overflow)
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _buildSentimentBadge(
                        'Tích cực',
                        reviewSummary!['sentimentCount']['POS'] ?? 0,
                        Colors.green,
                      ),
                      _buildSentimentBadge(
                        'Tiêu cực',
                        reviewSummary!['sentimentCount']['NEG'] ?? 0,
                        Colors.red,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSentimentBadge(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        '$label ($count)',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        children: [
          // Single row: add to cart + buy now (lightning icon)
          Row(
            children: [
              Expanded(
                child: LuxurySecondaryButton(
                  onPressed: () {
                    setState(() {
                      _showAddToCartModal = true;
                    });
                  },
                  text: 'Thêm vào giỏ',
                  icon: Icons.shopping_bag_outlined,
                  height: 52,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: LuxuryPrimaryButton(
                  onPressed: () {
                    setState(() {
                      _showBuyNowModal = true;
                    });
                  },
                  text: 'Mua ngay',
                  icon: Icons.flash_on,
                  height: 52,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitsSection() {
    final benefits = [
      {
        'title': 'MIỄN PHÍ',
        'subtitle': 'VẬN CHUYỂN',
        'icon': Icons.local_shipping,
        'color': const Color(0xFF2196F3),
        'tooltip':
            'Miễn phí giao hàng trong 3 giờ. Nếu giao trễ, tặng ngay voucher 100k cho lần mua hàng tiếp theo.',
      },
      {
        'title': 'PHỤC VỤ',
        'subtitle': '24/7',
        'icon': Icons.access_time,
        'color': const Color(0xFF4CAF50),
        'tooltip': 'Khách hàng có thể xem, đặt hàng và thanh toán 24/7.',
      },
      {
        'title': 'THU ĐỔI',
        'subtitle': '48H',
        'icon': Icons.autorenew,
        'color': const Color(0xFFFF9800),
        'tooltip':
            'Áp dụng đổi 48 giờ đối với trang sức vàng và 72 giờ đối với trang sức bạc (chỉ đổi size).',
      },
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: benefits.map((benefit) {
          final color = benefit['color'] as Color;
          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 6),
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    color.withValues(alpha: 0.15),
                    color.withValues(alpha: 0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: color.withValues(alpha: 0.25),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.1),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Icon with gradient background
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [color, color.withValues(alpha: 0.7)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: color.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      benefit['icon'] as IconData,
                      size: 28,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    benefit['title'] as String,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: color,
                      letterSpacing: 0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  // Subtitle
                  if ((benefit['subtitle'] as String).isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      benefit['subtitle'] as String,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: color.withValues(alpha: 0.8),
                        letterSpacing: 0.2,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildProductDetailsTabs() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF202E65).withValues(alpha: 0.2),
                width: 1.5,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: TabBar(
                controller: _tabController,
                isScrollable: false, // Chia đều ô, tránh cảm giác gom nhóm
                labelColor: Colors.white,
                unselectedLabelColor: const Color(0xFF202E65),
                labelPadding: EdgeInsets.zero,
                indicatorPadding: EdgeInsets.zero,
                indicatorSize: TabBarIndicatorSize.tab,
                indicator: const BoxDecoration(
                  color: Color(0xFF202E65), // Nền xanh phủ full ô
                ),
                labelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.3,
                ),
                tabs: const [
                  Tab(text: 'Mô tả'),
                  Tab(text: 'Chính sách'),
                  Tab(text: 'FAQ'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            constraints: const BoxConstraints(maxHeight: 400),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey.withValues(alpha: 0.2),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Description tab
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Html(
                      data: product!.description.isNotEmpty
                          ? product!.description
                          : '<p>Không có mô tả</p>',
                      style: {
                        'body': Style(
                          fontSize: FontSize(14),
                          lineHeight: LineHeight(1.6),
                          color: const Color(0xFF1A1A1A),
                        ),
                        'p': Style(
                          margin: Margins.all(8),
                          fontWeight: FontWeight.w500,
                        ),
                        'ul': Style(margin: Margins.symmetric(vertical: 8)),
                        'li': Style(
                          margin: Margins.symmetric(vertical: 6),
                          fontWeight: FontWeight.w500,
                        ),
                      },
                    ),
                  ),

                  // Policy tab
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildPolicyCard(
                          icon: Icons.local_shipping,
                          iconColor: const Color(0xFF2196F3),
                          title: 'Chính sách giao hàng',
                          description:
                              'Miễn phí giao hàng trong 3 giờ cho các đơn nội thành. Nếu giao trễ, tặng ngay voucher 100.000đ cho lần mua tiếp theo.',
                        ),
                        const SizedBox(height: 12),
                        _buildPolicyCard(
                          icon: Icons.autorenew,
                          iconColor: const Color(0xFFFF9800),
                          title: 'Chính sách đổi trả',
                          description:
                              'Đổi 48 giờ đối với trang sức vàng và 72 giờ với trang sức bạc (đổi size). Tính từ lúc xuất hóa đơn hoặc thời điểm nhận hàng.',
                        ),
                        const SizedBox(height: 12),
                        _buildPolicyCard(
                          icon: Icons.credit_card,
                          iconColor: const Color(0xFF4CAF50),
                          title: 'Phương thức thanh toán',
                          description: 'Hỗ trợ COD (thanh toán khi nhận hàng) và VNPay.',
                        ),
                      ],
                    ),
                  ),

                  // FAQ tab
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        _buildFaqItem(
                          question: 'Sản phẩm có bảo hành không?',
                          answer:
                              'Có, tất cả sản phẩm đều được bảo hành 1 năm từ ngày mua. Nếu lỗi kỹ thuật, sẽ được thay thế miễn phí.',
                        ),
                        _buildFaqItem(
                          question: 'Làm thế nào để kiểm tra tính chính hãng?',
                          answer:
                              'Sản phẩm nhập trực tiếp từ nhà sản xuất, kèm giấy chứng nhận bảo hành chính hãng.',
                        ),
                        _buildFaqItem(
                          question: 'Có thể trả lại nếu không hài lòng không?',
                          answer:
                              'Có thể trả trong 48 giờ từ khi nhận hàng nếu sản phẩm còn nguyên vẹn và chưa qua sử dụng.',
                        ),
                        _buildFaqItem(
                          question: 'Giao hàng đến các tỉnh thành khác?',
                          answer:
                              'Có, giao hàng toàn quốc. Phí vận chuyển tính theo khoảng cách và đơn vị vận chuyển.',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String description,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: iconColor.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: iconColor.withValues(alpha: 0.25)),
        boxShadow: [
          BoxShadow(
            color: iconColor.withValues(alpha: 0.12),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFaqItem({required String question, required String answer}) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          title: Text(
            question,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A1A1A),
            ),
          ),
          iconColor: const Color(0xFF202E65),
          collapsedIconColor: Colors.grey.shade600,
          children: [
            Text(
              answer,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
                height: 1.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimilarProducts() {
    if (similarProducts.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with gradient text
          Row(
            children: [
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [Color(0xFFD4AF37), Color(0xFF8B7500)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ).createShader(bounds),
                child: const Text(
                  'Sản phẩm tương tự',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              const Spacer(),
              Icon(Icons.trending_up, color: const Color(0xFFD4AF37), size: 20),
            ],
          ),
          const SizedBox(height: 16),

          // Product carousel
          SizedBox(
            height: 300,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: similarProducts.length,
              itemBuilder: (context, index) {
                return Container(
                  width: 180,
                  margin: const EdgeInsets.only(right: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: ProductCard(product: similarProducts[index]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [Color(0xFFD4AF37), Color(0xFF8B7500)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ).createShader(bounds),
                child: const Text(
                  'Đánh giá sản phẩm',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  if (authProvider.isLoggedIn) {
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _showReviewModal = true;
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          elevation: 4,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        icon: const Icon(Icons.edit, size: 18),
                        label: const Text(
                          'Viết đánh giá của bạn',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.2,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Rating summary - always show if we have data
          if (reviewSummary != null)
            Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.amber.withValues(alpha: 0.12),
                        Colors.amber.withValues(alpha: 0.06),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.amber.withValues(alpha: 0.2),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.amber.withValues(alpha: 0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: RatingSummary(
                    avgRating: reviewSummary!['avgRating']?.toDouble() ?? 0.0,
                    totalReviews: reviewSummary!['totalReviews'] ?? 0,
                    ratingDistribution:
                        reviewSummary!['ratingDistribution'] ?? {},
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),

          // Reviews list heading
          if (reviews.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  Icon(
                    Icons.comment_outlined,
                    color: const Color(0xFF202E65),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Bình luận từ người dùng',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A1A1A),
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),

          // Reviews list
          if (isLoadingReviews)
            const LoadingWidget()
          else if (reviews.isEmpty && reviewSummary == null)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 32),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.star_outline,
                    size: 48,
                    color: Colors.grey.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Chưa có đánh giá nào',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            )
          else if (reviews.isNotEmpty)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: reviews.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.grey.withValues(alpha: 0.15),
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: ReviewCard(review: reviews[index]),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget? _buildModals() {
    if (_showAddToCartModal) {
      return AddToCartModal(
        product: product!,
        onClose: () {
          setState(() {
            _showAddToCartModal = false;
          });
        },
        onConfirm: _handleAddToCart,
      );
    }

    if (_showBuyNowModal) {
      return AddToCartModal(
        product: product!,
        onClose: () {
          setState(() {
            _showBuyNowModal = false;
          });
        },
        onConfirm: _handleBuyNow,
      );
    }

    if (_showReviewModal) {
      return ReviewModal(
        onClose: () {
          setState(() {
            _showReviewModal = false;
          });
        },
        onSubmit: _handleSubmitReview,
      );
    }

    return null;
  }
}

enum _MediaType { image, model }

class _MediaItem {
  final _MediaType type;
  final String source;

  const _MediaItem.image(this.source) : type = _MediaType.image;

  const _MediaItem.model(this.source) : type = _MediaType.model;
}

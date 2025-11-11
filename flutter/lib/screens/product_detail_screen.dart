import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_html/flutter_html.dart';
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

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({
    super.key,
    required this.productId,
  });

  @override
  _ProductDetailScreenState createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen>
    with TickerProviderStateMixin {
  Product? product;
  List<Product> similarProducts = [];
  List<dynamic> reviews = [];
  Map<String, dynamic>? reviewSummary;
  bool isLoading = true;
  bool isLoadingReviews = false;
  
  // Tab controllers
  late TabController _tabController;
  int _selectedImageIndex = 0;
  
  // Modal states
  bool _showAddToCartModal = false;
  bool _showBuyNowModal = false;
  bool _showReviewModal = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadProductDetail();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProductDetail() async {
    try {
      print('=== ProductDetailScreen Loading ===');
      print('Product ID: ${widget.productId}');
      
      setState(() {
        isLoading = true;
      });

      // Load product detail
      final productData = await ProductService.getProductById(widget.productId);
      print('Product loaded: ${productData.name}');
      setState(() {
        product = productData;
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
      print('Loading reviews for product ID: ${product!.id}');
      await _loadReviews();
      await _loadRatingSummary();

      // Save to viewed products
      _saveToViewedProducts();
      print('=== ProductDetailScreen Loaded Successfully ===');
    } catch (e) {
      print('Error loading product detail: $e');
      print('Stack trace: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi khi tải chi tiết sản phẩm: $e')),
      );
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _loadReviews() async {
    if (product == null) return;
    
    try {
      setState(() {
        isLoadingReviews = true;
      });

      final reviewData = await ProductService.getProductReviews(product!.id);
      print('Review data response: $reviewData');
      
      // Handle response - backend returns { message: '...', reviews: [...] }
      if (reviewData['reviews'] != null) {
        setState(() {
          reviews = reviewData['reviews'] ?? [];
        });
        print('Reviews loaded: ${reviews.length} reviews');
      } else {
        print('No reviews key in response');
      }
    } catch (e) {
      print('Error loading reviews: $e');
    } finally {
      setState(() {
        isLoadingReviews = false;
      });
    }
  }

  Future<void> _loadRatingSummary() async {
    if (product == null) {
      print('ERROR: Product is null in _loadRatingSummary');
      return;
    }
    
    if (product!.id.isEmpty) {
      print('ERROR: Product ID is empty in _loadRatingSummary');
      return;
    }
    
    try {
      print('Calling API for reviews summary with product ID: "${product!.id}"');
      final summaryData = await ProductService.getProductReviewSummary(product!.id);
      print('Rating summary response: $summaryData');
      print('Response type: ${summaryData.runtimeType}');
      print('Has data key: ${summaryData.containsKey("data")}');
      
      // Handle response - backend returns { message: '...', data: {...} }
      if (summaryData['data'] != null) {
        setState(() {
          reviewSummary = summaryData['data'];
        });
        print('Rating summary loaded successfully: avgRating=${reviewSummary!['avgRating']}, totalReviews=${reviewSummary!['totalReviews']}');
      } else {
        print('ERROR: No data key in summary response or invalid format');
        print('Full response keys: ${summaryData.keys}');
      }
    } catch (e) {
      print('ERROR loading rating summary: $e');
      print('Stack trace: ${StackTrace.current}');
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
        'selectedItems': [{'product': product, 'quantity': quantity}],
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

      if (result['success']) {
        setState(() {
          _showReviewModal = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đánh giá đã gửi thành công!')),
        );
        
        // Reload reviews
        await _loadReviews();
        await _loadRatingSummary();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gửi đánh giá thất bại: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Chi tiết sản phẩm'),
        ),
        body: const LoadingWidget(),
      );
    }

    if (product == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Chi tiết sản phẩm'),
        ),
        body: const Center(
          child: Text('Không tìm thấy sản phẩm'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(product!.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // Share functionality
            },
          ),
          IconButton(
            icon: const Icon(Icons.favorite_border),
            onPressed: () {
              // Add to wishlist functionality
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product images
            _buildProductImages(),
            
            // Product info
            _buildProductInfo(),
            
            // Action buttons
            _buildActionButtons(),
            
            // Benefits section
            _buildBenefitsSection(),
            
            // Product details tabs
            _buildProductDetailsTabs(),
            
            // Similar products
            _buildSimilarProducts(),
            
            // Reviews section
            _buildReviewsSection(),
          ],
        ),
      ),
      // Modals
      bottomSheet: _buildModals(),
    );
  }

  Widget _buildProductImages() {
    return SizedBox(
      height: 420,
      child: Column(
        children: [
          // Main image with luxury styling
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: LinearGradient(
                  colors: [
                    Colors.grey.withOpacity(0.05),
                    Colors.grey.withOpacity(0.02),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFD4AF37).withOpacity(0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
                border: Border.all(
                  color: const Color(0xFFD4AF37).withOpacity(0.2),
                  width: 1.5,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    Image.network(
                      product!.images.isNotEmpty
                          ? product!.images[_selectedImageIndex]
                          : 'https://via.placeholder.com/400',
                      fit: BoxFit.contain,
                      width: double.infinity,
                    ),
                    // Image counter badge
                    if (product!.images.length > 1)
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${_selectedImageIndex + 1}/${product!.images.length}',
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
          if (product!.images.length > 1)
            Container(
              height: 90,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: product!.images.length,
                itemBuilder: (context, index) {
                  final isSelected = _selectedImageIndex == index;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedImageIndex = index;
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
                              color: const Color(0xFFD4AF37).withOpacity(0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFFD4AF37)
                              : Colors.grey.withOpacity(0.2),
                          width: isSelected ? 2.5 : 1.5,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Stack(
                          children: [
                            Image.network(
                              product!.images[index],
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: double.infinity,
                            ),
                            // Overlay for selected thumbnail
                            if (isSelected)
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      const Color(0xFFD4AF37).withOpacity(0.15),
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
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 12),
          
          // Price with gradient
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFD4AF37), Color(0xFFB8932E)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFD4AF37).withOpacity(0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Text(
              '${product!.price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ₫',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 0.5,
                shadows: [
                  Shadow(
                    offset: Offset(0, 2),
                    blurRadius: 4,
                    color: Color.fromARGB(100, 0, 0, 0),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Stock info with icon
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: Colors.green.withOpacity(0.3),
              ),
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
                    Colors.amber.withOpacity(0.15),
                    Colors.amber.withOpacity(0.08),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.amber.withOpacity(0.3),
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  // Stars
                  Row(
                    children: List.generate(5, (index) {
                      final rating = reviewSummary!['avgRating']?.toDouble() ?? 0.0;
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
                  const Spacer(),
                  
                  // Sentiment badges
                  Wrap(
                    spacing: 8,
                    children: [
                      _buildSentimentBadge('Tích cực', reviewSummary!['sentimentCount']['POS'] ?? 0, Colors.green),
                      _buildSentimentBadge('Tiêu cực', reviewSummary!['sentimentCount']['NEG'] ?? 0, Colors.red),
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
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.4)),
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
          // Buy now button with gradient
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFAD2A36), Color(0xFF8B1F27)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFAD2A36).withOpacity(0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
                BoxShadow(
                  color: const Color(0xFFAD2A36).withOpacity(0.15),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  setState(() {
                    _showBuyNowModal = true;
                  });
                },
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  height: 56,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Mua ngay',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.3,
                          shadows: [
                            Shadow(
                              offset: Offset(0, 2),
                              blurRadius: 4,
                              color: Color.fromARGB(100, 0, 0, 0),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        'Giao hàng miễn phí tận nhà',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withOpacity(0.9),
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Add to cart and call buttons
          Row(
            children: [
              // Add to cart button
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: const Color(0xFF202E65),
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF202E65).withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          _showAddToCartModal = true;
                        });
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.shopping_bag_outlined,
                              color: Color(0xFF202E65),
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Thêm vào giỏ',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF202E65),
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Call button
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF202E65), Color(0xFF1A1F4D)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF202E65).withOpacity(0.25),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        // Call functionality
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        height: 48,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.phone_in_talk_rounded,
                                  color: Colors.white,
                                  size: 18,
                                ),
                                SizedBox(width: 6),
                                Text(
                                  'Gọi ngay',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: 0.2,
                                    shadows: [
                                      Shadow(
                                        offset: Offset(0, 1),
                                        blurRadius: 2,
                                        color: Color.fromARGB(80, 0, 0, 0),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              'Nhận ưu đãi',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.white.withOpacity(0.85),
                                letterSpacing: 0.1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
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
        'tooltip': 'Miễn phí giao hàng trong 3 giờ. Nếu giao trễ, tặng ngay voucher 100k cho lần mua hàng tiếp theo.',
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
        'tooltip': 'Áp dụng đổi 48 giờ đối với trang sức vàng và 72 giờ đối với trang sức bạc (chỉ đổi size).',
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
                    color.withOpacity(0.15),
                    color.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: color.withOpacity(0.25),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.1),
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
                        colors: [color, color.withOpacity(0.7)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: color.withOpacity(0.3),
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
                        color: color.withOpacity(0.8),
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
                color: const Color(0xFF202E65).withOpacity(0.2),
                width: 1.5,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: TabBar(
                controller: _tabController,
                labelColor: Colors.white,
                unselectedLabelColor: const Color(0xFF202E65),
                indicator: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF202E65), Color(0xFF1A1F4D)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
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
            height: 200,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey.withOpacity(0.2),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
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
                      data: product!.description.isNotEmpty ? product!.description : '<p>Không có mô tả</p>',
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
                        'ul': Style(
                          margin: Margins.symmetric(vertical: 8),
                        ),
                        'li': Style(
                          margin: Margins.symmetric(vertical: 6),
                          fontWeight: FontWeight.w500,
                        ),
                      },
                    ),
                  ),
                  
                  // Policy tab
                  const SingleChildScrollView(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Thông tin chính sách đổi trả và bảo hành sẽ được hiển thị ở đây.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF1A1A1A),
                        height: 1.6,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  
                  // FAQ tab
                  const SingleChildScrollView(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Câu hỏi thường gặp về sản phẩm sẽ được hiển thị ở đây.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF1A1A1A),
                        height: 1.6,
                        fontWeight: FontWeight.w500,
                      ),
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
              Icon(
                Icons.trending_up,
                color: const Color(0xFFD4AF37),
                size: 20,
              ),
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
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
              Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  if (authProvider.isLoggedIn) {
                    return Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF4CAF50), Color(0xFF388E3C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF4CAF50).withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              _showReviewModal = true;
                            });
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            child: Row(
                              children: [
                                Icon(Icons.edit, color: Colors.white, size: 18),
                                SizedBox(width: 6),
                                Text(
                                  'Viết đánh giá',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ],
                            ),
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
                        Colors.amber.withOpacity(0.12),
                        Colors.amber.withOpacity(0.06),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.amber.withOpacity(0.2),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.amber.withOpacity(0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: RatingSummary(
                    avgRating: reviewSummary!['avgRating']?.toDouble() ?? 0.0,
                    totalReviews: reviewSummary!['totalReviews'] ?? 0,
                    ratingDistribution: reviewSummary!['ratingDistribution'] ?? {},
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
                color: Colors.grey.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.star_outline,
                    size: 48,
                    color: Colors.grey.withOpacity(0.5),
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
                        color: Colors.grey.withOpacity(0.15),
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
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

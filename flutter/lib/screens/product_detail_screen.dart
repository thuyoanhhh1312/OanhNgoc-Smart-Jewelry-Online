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
      height: 400,
      child: Column(
        children: [
          // Main image
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.3),
                    spreadRadius: 2,
                    blurRadius: 8,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  product!.images.isNotEmpty
                      ? product!.images[_selectedImageIndex]
                      : 'https://via.placeholder.com/400',
                  fit: BoxFit.contain,
                  width: double.infinity,
                ),
              ),
            ),
          ),
          
          // Image thumbnails
          if (product!.images.length > 1)
            Container(
              height: 80,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: product!.images.length,
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedImageIndex = index;
                      });
                    },
                    child: Container(
                      width: 70,
                      height: 70,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _selectedImageIndex == index
                              ? Theme.of(context).primaryColor
                              : Colors.grey.shade300,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.network(
                          product!.images[index],
                          fit: BoxFit.cover,
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
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            product!.name,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${product!.price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ₫',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.red,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Số lượng còn lại: ${product!.stockQuantity}',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
            ),
          ),
          if (reviewSummary != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.star, color: Colors.amber, size: 20),
                const SizedBox(width: 4),
                Text(
                  '${reviewSummary!['avgRating']?.toStringAsFixed(1) ?? '0.0'}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                Text(
                  '(${reviewSummary!['totalReviews'] ?? 0} đánh giá)',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Buy now button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                setState(() {
                  _showBuyNowModal = true;
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFAD2A36),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Mua ngay',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '(Giao hàng miễn phí tận nhà)',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          
          // Add to cart and call buttons
          Row(
            children: [
              // Add to cart button
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _showAddToCartModal = true;
                      });
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF202E65)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Thêm vào giỏ hàng',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF202E65),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Call button
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: ElevatedButton(
                    onPressed: () {
                      // Call functionality
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF202E65),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Gọi ngay (miễn phí)',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          '(Nhận ngay ưu đãi)',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.white,
                          ),
                        ),
                      ],
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
        'tooltip': 'Miễn phí giao hàng trong 3 giờ. Nếu giao trễ, tặng ngay voucher 100k cho lần mua hàng tiếp theo.',
      },
      {
        'title': 'PHỤC VỤ 24/7',
        'subtitle': '',
        'icon': Icons.access_time,
        'tooltip': 'Khách hàng có thể xem, đặt hàng và thanh toán 24/7.',
      },
      {
        'title': 'THU ĐỔI 48H',
        'subtitle': '',
        'icon': Icons.autorenew,
        'tooltip': 'Áp dụng đổi 48 giờ đối với trang sức vàng và 72 giờ đối với trang sức bạc (chỉ đổi size).',
      },
    ];

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: benefits.map((benefit) {
          return Expanded(
            child: Column(
              children: [
                Icon(
                  benefit['icon'] as IconData,
                  size: 24,
                  color: const Color(0xFF202E65),
                ),
                const SizedBox(height: 4),
                Text(
                  benefit['title'] as String,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF202E65),
                  ),
                  textAlign: TextAlign.center,
                ),
                if ((benefit['subtitle'] as String).isNotEmpty)
                  Text(
                    benefit['subtitle'] as String,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF202E65),
                    ),
                    textAlign: TextAlign.center,
                  ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildProductDetailsTabs() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        children: [
          TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF202E65),
            unselectedLabelColor: Colors.grey,
            indicatorColor: const Color(0xFF202E65),
            tabs: const [
              Tab(text: 'Mô tả'),
              Tab(text: 'Chính sách'),
              Tab(text: 'FAQ'),
            ],
          ),
          SizedBox(
            height: 200,
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
                        lineHeight: LineHeight(1.4),
                      ),
                      'p': Style(
                        margin: Margins.all(8),
                      ),
                      'ul': Style(
                        margin: Margins.symmetric(vertical: 8),
                      ),
                      'li': Style(
                        margin: Margins.symmetric(vertical: 4),
                      ),
                    },
                  ),
                ),
                
                // Policy tab
                const SingleChildScrollView(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'Thông tin chính sách đổi trả và bảo hành sẽ được hiển thị ở đây.',
                    style: TextStyle(fontSize: 14),
                  ),
                ),
                
                // FAQ tab
                const SingleChildScrollView(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'Câu hỏi thường gặp về sản phẩm sẽ được hiển thị ở đây.',
                    style: TextStyle(fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSimilarProducts() {
    if (similarProducts.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Sản phẩm tương tự',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 280,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: similarProducts.length,
              itemBuilder: (context, index) {
                return Container(
                  width: 200,
                  margin: const EdgeInsets.only(right: 12),
                  child: ProductCard(product: similarProducts[index]),
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
      margin: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Đánh giá sản phẩm',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  if (authProvider.isLoggedIn) {
                    return ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _showReviewModal = true;
                        });
                      },
                      child: const Text('Viết đánh giá'),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Rating summary - always show if we have data
          if (reviewSummary != null)
            Column(
              children: [
                RatingSummary(
                  avgRating: reviewSummary!['avgRating']?.toDouble() ?? 0.0,
                  totalReviews: reviewSummary!['totalReviews'] ?? 0,
                  ratingDistribution: reviewSummary!['ratingDistribution'] ?? {},
                ),
                const SizedBox(height: 16),
              ],
            ),
          
          // Reviews list heading
          if (reviews.isNotEmpty)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Text(
                'Bình luận từ người dùng',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          
          // Reviews list
          if (isLoadingReviews)
            const LoadingWidget()
          else if (reviews.isEmpty && reviewSummary == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text('Chưa có đánh giá nào cho sản phẩm này'),
            )
          else if (reviews.isNotEmpty)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: reviews.length,
              itemBuilder: (context, index) {
                return ReviewCard(review: reviews[index]);
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

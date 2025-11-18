import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/order_service.dart';
import '../../services/product_service.dart';

class MyReviewsScreen extends StatefulWidget {
  const MyReviewsScreen({super.key});

  @override
  State<MyReviewsScreen> createState() => _MyReviewsScreenState();
}

class _MyReviewsScreenState extends State<MyReviewsScreen> {
  final Map<String, _ProductInfo> _purchasedProducts = {};
  final List<_UserReview> _userReviews = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    final authProvider = context.read<AuthProvider>();
    final user = authProvider.user;
    if (user == null || user.email.isEmpty) {
      setState(() {
        _error = 'Bạn cần đăng nhập để xem đánh giá.';
        _isLoading = false;
      });
      return;
    }

    try {
      setState(() {
        _isLoading = true;
        _error = null;
        _purchasedProducts.clear();
        _userReviews.clear();
      });

      final orders = await OrderService.getOrdersByCustomerId(user.id);
      for (final order in orders) {
        for (final item in order.items) {
          if (item.productId.isEmpty) continue;
          _purchasedProducts[item.productId] = _ProductInfo(
            productId: item.productId,
            name: item.displayName,
            image: item.product?.mainImage ?? '',
          );
        }
      }

      final productIds = _purchasedProducts.keys.toList();
      for (final productId in productIds) {
        final data = await ProductService.getProductReviews(productId);
        final reviews = data['reviews'];
        if (reviews is List) {
          for (final review in reviews) {
            final customer = review['Customer'] as Map<String, dynamic>? ?? {};
            final email = customer['email']?.toString();
            if (email != null && email == user.email) {
              _userReviews.add(
                _UserReview(
                  productId: productId,
                  productName: _purchasedProducts[productId]?.name ?? 'Sản phẩm',
                  productImage: _purchasedProducts[productId]?.image,
                  rating: (review['rating'] as num?)?.toDouble() ?? 0,
                  content: review['content'] ?? '',
                  createdAt: DateTime.tryParse(review['created_at'] ?? '') ?? DateTime.now(),
                  sentiment: review['sentiment']?.toString(),
                ),
              );
              break;
            }
          }
        }
      }
    } catch (e) {
      setState(() => _error = 'Không thể tải đánh giá: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingProducts = _purchasedProducts.keys.where(
      (id) => !_userReviews.any((review) => review.productId == id),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đánh giá của tôi'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
      ),
      body: RefreshIndicator(
        onRefresh: _loadReviews,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_userReviews.isEmpty)
                        _buildEmptyState(
                          title: 'Bạn chưa có đánh giá nào.',
                          description: 'Hãy chia sẻ trải nghiệm của bạn về các sản phẩm đã mua.',
                        )
                      else
                        ..._userReviews.map((review) => _ReviewCard(review: review)),
                      const SizedBox(height: 24),
                      Text(
                        'Chưa đánh giá',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                      const SizedBox(height: 12),
                      if (pendingProducts.isEmpty)
                        _buildEmptyState(
                          title: 'Bạn đã đánh giá tất cả sản phẩm đã mua.',
                          description: 'Tiếp tục mua sắm để khám phá thêm sản phẩm mới.',
                        )
                      else
                        ...pendingProducts.map(
                          (id) => _PendingReviewCard(
                            product: _purchasedProducts[id]!,
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildEmptyState({required String title, required String description}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final _UserReview review;

  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('dd/MM/yyyy HH:mm');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow.withValues(alpha: 0.08),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if ((review.productImage ?? '').isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    review.productImage!,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 60,
                      height: 60,
                      color: AppColors.surfaceVariant,
                      child: const Icon(Icons.image_not_supported),
                    ),
                  ),
                )
              else
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.image_outlined),
                ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.productName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: List.generate(
                        5,
                        (index) => Icon(
                          index < review.rating ? Icons.star : Icons.star_border,
                          color: AppColors.primary,
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            review.content,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (review.sentiment != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    review.sentiment!,
                    style: const TextStyle(
                      color: AppColors.primaryDark,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              const Spacer(),
              Text(
                formatter.format(review.createdAt),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PendingReviewCard extends StatelessWidget {
  final _ProductInfo product;
  const _PendingReviewCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          if (product.image != null && product.image!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                product.image!,
                width: 54,
                height: 54,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  width: 54,
                  height: 54,
                  color: AppColors.surfaceVariant,
                  child: const Icon(Icons.image_not_supported),
                ),
              ),
            )
          else
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.image_outlined),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Bạn chưa đánh giá sản phẩm này.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          OutlinedButton(
            onPressed: () {
              Navigator.of(context).pushNamed(
                '/product',
                arguments: {'id': product.productId},
              );
            },
            child: const Text('Đánh giá'),
          ),
        ],
      ),
    );
  }
}

class _ProductInfo {
  final String productId;
  final String name;
  final String? image;

  _ProductInfo({
    required this.productId,
    required this.name,
    this.image,
  });
}

class _UserReview {
  final String productId;
  final String productName;
  final String? productImage;
  final double rating;
  final String content;
  final DateTime createdAt;
  final String? sentiment;

  _UserReview({
    required this.productId,
    required this.productName,
    required this.productImage,
    required this.rating,
    required this.content,
    required this.createdAt,
    this.sentiment,
  });
}

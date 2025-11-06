import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/app_colors.dart';
import '../models/product.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final VoidCallback? onToggleWishlist;
  final bool isWishlisted;
  final bool showAddToCart;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.onAddToCart,
    this.onToggleWishlist,
    this.isWishlisted = false,
    this.showAddToCart = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        print('ProductCard tapped: ${product.name}');
        if (onTap != null) {
          onTap!();
        } else {
          // Default navigation to product detail
          print('Navigating to product detail with id: ${product.id}');
          Navigator.pushNamed(
            context,
            '/product',
            arguments: {'id': product.id}, // Using product.id
          );
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  // Main Image
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                      color: AppColors.surfaceVariant,
                    ),
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                      child: product.mainImage.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: product.mainImage,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                color: AppColors.surfaceVariant,
                                child: const Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: AppColors.surfaceVariant,
                                child: const Icon(
                                  Icons.image_not_supported,
                                  color: AppColors.textLight,
                                  size: 40,
                                ),
                              ),
                            )
                          : Container(
                              color: AppColors.surfaceVariant,
                              child: const Icon(
                                Icons.diamond,
                                color: AppColors.primary,
                                size: 40,
                              ),
                            ),
                    ),
                  ),
                  
                  // Discount Badge
                  if (product.hasDiscount)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.error,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '-${product.discountPercentage.round()}%',
                          style: const TextStyle(
                            color: AppColors.textOnPrimary,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  
                  // Wishlist Button
                  if (onToggleWishlist != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: onToggleWishlist,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppColors.surface.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            isWishlisted ? Icons.favorite : Icons.favorite_border,
                            color: isWishlisted ? AppColors.error : AppColors.textSecondary,
                            size: 16,
                          ),
                        ),
                      ),
                    ),
                  
                  // Stock Status
                  if (!product.inStock)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.textPrimary.withOpacity(0.7),
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(16),
                          ),
                        ),
                        child: const Center(
                          child: Text(
                            'Hết hàng',
                            style: TextStyle(
                              color: AppColors.textOnPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            
            // Product Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product Name
                    Text(
                      product.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    
                    const SizedBox(height: 4),
                    
                    // Rating
                    if (product.rating > 0)
                      Row(
                        children: [
                          const Icon(
                            Icons.star,
                            color: Colors.amber,
                            size: 14,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            product.rating.toStringAsFixed(1),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '(${product.reviewsCount})',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textLight,
                            ),
                          ),
                        ],
                      ),
                    
                    const Spacer(),
                    
                    // Price Row
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Current Price
                              Text(
                                '${product.price.toStringAsFixed(0)}₫',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              
                              // Original Price
                              if (product.hasDiscount)
                                Text(
                                  '${product.originalPrice!.toStringAsFixed(0)}₫',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textLight,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        
                        // Add to Cart Button
                        if (showAddToCart && product.inStock)
                          GestureDetector(
                            onTap: () {
                              print('Add to cart tapped');
                              if (onAddToCart != null) {
                                onAddToCart!();
                              }
                            },
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.add_shopping_cart,
                                color: AppColors.textOnPrimary,
                                size: 16,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

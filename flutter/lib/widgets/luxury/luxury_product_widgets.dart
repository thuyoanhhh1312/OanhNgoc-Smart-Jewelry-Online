import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../constants/app_colors.dart';

/// Luxury Product Price Text
/// Hiển thị giá sản phẩm với màu rose gold và định dạng VND
class ProductPriceText extends StatelessWidget {
  final double price;
  final double? originalPrice; // Giá gốc khi có sale
  final double fontSize;
  final FontWeight fontWeight;
  final bool showCurrency;

  const ProductPriceText({
    super.key,
    required this.price,
    this.originalPrice,
    this.fontSize = 18,
    this.fontWeight = FontWeight.w700,
    this.showCurrency = true,
  });

  String _formatPrice(double price) {
    final formatter = NumberFormat('#,###', 'vi_VN');
    return '${formatter.format(price)}${showCurrency ? ' ₫' : ''}';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          _formatPrice(price),
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: AppColors.roseGold,
            letterSpacing: 0.3,
          ),
        ),
        if (originalPrice != null && originalPrice! > price) ...[
          const SizedBox(width: 8),
          Text(
            _formatPrice(originalPrice!),
            style: TextStyle(
              fontSize: fontSize * 0.75,
              fontWeight: FontWeight.w500,
              color: AppColors.warmGray,
              decoration: TextDecoration.lineThrough,
              decorationColor: AppColors.warmGray,
            ),
          ),
        ],
      ],
    );
  }
}

/// Luxury Product Badge
/// Badge cho sản phẩm (Sale, New, Hot...)
class ProductBadge extends StatelessWidget {
  final String text;
  final Color? backgroundColor;
  final Color? textColor;
  final IconData? icon;

  const ProductBadge({
    super.key,
    required this.text,
    this.backgroundColor,
    this.textColor,
    this.icon,
  });

  // Predefined badges
  factory ProductBadge.sale({String? text}) {
    return ProductBadge(
      text: text ?? 'SALE',
      backgroundColor: AppColors.error,
      textColor: Colors.white,
    );
  }

  factory ProductBadge.newProduct() {
    return const ProductBadge(
      text: 'MỚI',
      backgroundColor: AppColors.roseGold,
      textColor: Colors.white,
    );
  }

  factory ProductBadge.hot() {
    return const ProductBadge(
      text: 'HOT',
      backgroundColor: AppColors.warning,
      textColor: Colors.white,
      icon: Icons.local_fire_department,
    );
  }

  factory ProductBadge.bestseller() {
    return const ProductBadge(
      text: 'BÁN CHẠY',
      backgroundColor: AppColors.roseGoldDark,
      textColor: Colors.white,
      icon: Icons.star,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.roseGold,
        borderRadius: BorderRadius.circular(8),
        boxShadow: AppColors.lightShadow,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 14,
              color: textColor ?? Colors.white,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: textColor ?? Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Luxury Product Card
/// Card sản phẩm sang trọng với thiết kế Rose Gold Elegant
class LuxuryProductCard extends StatelessWidget {
  final String imageUrl;
  final String name;
  final double price;
  final double? originalPrice;
  final VoidCallback? onTap;
  final VoidCallback? onFavorite;
  final bool isFavorite;
  final ProductBadge? badge;
  final double? rating;
  final int? soldCount;

  const LuxuryProductCard({
    super.key,
    required this.imageUrl,
    required this.name,
    required this.price,
    this.originalPrice,
    this.onTap,
    this.onFavorite,
    this.isFavorite = false,
    this.badge,
    this.rating,
    this.soldCount,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.champagne,
            width: 1,
          ),
          boxShadow: AppColors.lightShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: AppColors.softBeige,
                          child: const Icon(
                            Icons.diamond_outlined,
                            size: 48,
                            color: AppColors.warmGray,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                // Badge
                if (badge != null)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: badge!,
                  ),
                // Favorite button
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      shape: BoxShape.circle,
                      boxShadow: AppColors.lightShadow,
                    ),
                    child: IconButton(
                      onPressed: onFavorite,
                      icon: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? AppColors.error : AppColors.warmGray,
                        size: 20,
                      ),
                      padding: const EdgeInsets.all(8),
                      constraints: const BoxConstraints(),
                    ),
                  ),
                ),
              ],
            ),
            
            // Product Info
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Name
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.warmBlack,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Rating and Sold Count
                  if (rating != null || soldCount != null)
                    Row(
                      children: [
                        if (rating != null) ...[
                          const Icon(
                            Icons.star,
                            size: 14,
                            color: AppColors.warning,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            rating!.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                        if (rating != null && soldCount != null)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            child: Container(
                              width: 3,
                              height: 3,
                              decoration: const BoxDecoration(
                                color: AppColors.warmGray,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        if (soldCount != null)
                          Text(
                            'Đã bán ${NumberFormat('#,###', 'vi_VN').format(soldCount!)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  
                  const SizedBox(height: 8),
                  
                  // Price
                  ProductPriceText(
                    price: price,
                    originalPrice: originalPrice,
                    fontSize: 16,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

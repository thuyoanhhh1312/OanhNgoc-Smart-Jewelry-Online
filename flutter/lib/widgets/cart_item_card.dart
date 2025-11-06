import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/app_colors.dart';
import '../models/cart.dart';

class CartItemCard extends StatelessWidget {
  final CartItem item;
  final Function(int) onQuantityChanged;
  final VoidCallback onRemove;

  const CartItemCard({
    super.key,
    required this.item,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            _buildProductImage(),
            
            const SizedBox(width: 12),
            
            // Product Info
            Expanded(
              child: _buildProductInfo(context),
            ),
            
            const SizedBox(width: 8),
            
            // Quantity Controls
            _buildQuantityControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildProductImage() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: AppColors.surfaceVariant,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: CachedNetworkImage(
          imageUrl: item.product.images.isNotEmpty ? item.product.images.first : '',
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: AppColors.surfaceVariant,
            child: const Icon(
              Icons.image_outlined,
              color: AppColors.textLight,
              size: 32,
            ),
          ),
          errorWidget: (context, url, error) => Container(
            color: AppColors.surfaceVariant,
            child: const Icon(
              Icons.broken_image_outlined,
              color: AppColors.textLight,
              size: 32,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductInfo(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Product Name
        Text(
          item.product.name,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        
        const SizedBox(height: 4),
        
        // Product Category
        if (item.product.categoryName != null)
          Text(
            item.product.categoryName!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        
        const SizedBox(height: 8),
        
        // Price
        Row(
          children: [
            Text(
              '${item.product.price.toStringAsFixed(0)}đ',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (item.product.originalPrice != null && 
                item.product.originalPrice! > item.product.price) ...[
              const SizedBox(width: 8),
              Text(
                '${item.product.originalPrice!.toStringAsFixed(0)}đ',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textLight,
                  decoration: TextDecoration.lineThrough,
                ),
              ),
            ],
          ],
        ),
        
        const SizedBox(height: 8),
        
        // Total Price for this item
        Text(
          'Tổng: ${(item.product.price * item.quantity).toStringAsFixed(0)}đ',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildQuantityControls() {
    return Column(
      children: [
        // Remove Button
        GestureDetector(
          onTap: onRemove,
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Icon(
              Icons.delete_outline,
              size: 16,
              color: AppColors.error,
            ),
          ),
        ),
        
        const SizedBox(height: 12),
        
        // Quantity Controls
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              // Increase Button
              GestureDetector(
                onTap: () => onQuantityChanged(item.quantity + 1),
                child: Container(
                  width: 32,
                  height: 28,
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: const Icon(
                    Icons.add,
                    size: 16,
                    color: AppColors.primary,
                  ),
                ),
              ),
              
              // Quantity Display
              Container(
                width: 32,
                height: 28,
                alignment: Alignment.center,
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              
              // Decrease Button
              GestureDetector(
                onTap: item.quantity > 1 
                    ? () => onQuantityChanged(item.quantity - 1)
                    : null,
                child: Container(
                  width: 32,
                  height: 28,
                  decoration: const BoxDecoration(
                    border: Border(
                      top: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: Icon(
                    Icons.remove,
                    size: 16,
                    color: item.quantity > 1 
                        ? AppColors.primary 
                        : AppColors.textLight,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

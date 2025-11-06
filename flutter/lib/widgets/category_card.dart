import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/app_colors.dart';
import '../models/category.dart' as cat;

class CategoryCard extends StatelessWidget {
  final cat.Category category;
  final VoidCallback? onTap;

  const CategoryCard({
    super.key,
    required this.category,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8),
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
          children: [
            // Category Image
            Expanded(
              flex: 3,
              child: Container(
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
                  child: category.image != null
                      ? CachedNetworkImage(
                          imageUrl: category.image!,
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
                          errorWidget: (context, url, error) => _buildDefaultIcon(),
                        )
                      : _buildDefaultIcon(),
                ),
              ),
            ),
            
            // Category Name
            Expanded(
              flex: 1,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                child: Center(
                  child: Text(
                    category.name,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultIcon() {
    IconData iconData;
    
    switch (category.name.toLowerCase()) {
      case 'nhẫn':
      case 'rings':
        iconData = Icons.circle_outlined;
        break;
      case 'dây chuyền':
      case 'necklaces':
        iconData = Icons.favorite_border;
        break;
      case 'bông tai':
      case 'earrings':
        iconData = Icons.water_drop_outlined;
        break;
      case 'vòng tay':
      case 'bracelets':
        iconData = Icons.watch_outlined;
        break;
      case 'đồng hồ':
      case 'watches':
        iconData = Icons.watch;
        break;
      default:
        iconData = Icons.diamond;
    }

    return Container(
      color: AppColors.primary.withOpacity(0.1),
      child: Center(
        child: Icon(
          iconData,
          color: AppColors.primary,
          size: 32,
        ),
      ),
    );
  }
}

class CategoryListItem extends StatelessWidget {
  final cat.Category category;
  final VoidCallback? onTap;
  final bool isSelected;

  const CategoryListItem({
    super.key,
    required this.category,
    this.onTap,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          category.name,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: isSelected ? AppColors.textOnPrimary : AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

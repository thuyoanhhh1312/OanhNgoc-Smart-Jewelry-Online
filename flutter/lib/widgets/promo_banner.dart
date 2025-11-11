import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/app_colors.dart';

class PromoBanner extends StatefulWidget {
  final List<BannerItem> banners;
  final double height;
  final EdgeInsetsGeometry? margin;

  const PromoBanner({
    super.key,
    required this.banners,
    this.height = 180,
    this.margin,
  });

  @override
  State<PromoBanner> createState() => _PromoBannerState();
}

class _PromoBannerState extends State<PromoBanner> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoPlay();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoPlay() {
    if (widget.banners.length > 1) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _pageController.hasClients) {
          int nextPage = (_currentIndex + 1) % widget.banners.length;
          _pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
          _startAutoPlay();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: widget.margin,
      height: widget.height,
      child: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              itemCount: widget.banners.length,
              itemBuilder: (context, index) {
                final banner = widget.banners[index];
                return _buildBannerItem(banner);
              },
            ),
          ),
          
          if (widget.banners.length > 1) ...[
            const SizedBox(height: 12),
            _buildIndicators(),
          ],
        ],
      ),
    );
  }

  Widget _buildBannerItem(BannerItem banner) {
    return GestureDetector(
      onTap: banner.onTap,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.2),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: AppColors.primary.withOpacity(0.1),
              blurRadius: 40,
              offset: const Offset(0, 16),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            children: [
              // Background Image
              if (banner.imageUrl != null)
                Positioned.fill(
                  child: CachedNetworkImage(
                    imageUrl: banner.imageUrl!,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: AppColors.surfaceVariant,
                      child: const Center(
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                      ),
                    ),
                  ),
                )
              else
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: banner.gradient ?? AppColors.primaryGradient,
                    ),
                  ),
                ),
              
              // Overlay with gradient
              if (banner.hasOverlay)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.4),
                        ],
                      ),
                    ),
                  ),
                ),
              
              // Content with better styling
              if (banner.title != null || banner.subtitle != null)
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (banner.title != null)
                        Text(
                          banner.title!,
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(
                            color:
                                banner.titleColor ?? AppColors.textOnPrimary,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            shadows: [
                              Shadow(
                                offset: const Offset(0, 2),
                                blurRadius: 4,
                                color: Colors.black.withOpacity(0.3),
                              ),
                            ],
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      
                      if (banner.subtitle != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          banner.subtitle!,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(
                            color: banner.subtitleColor ??
                                AppColors.textOnPrimary.withOpacity(0.95),
                            letterSpacing: 0.3,
                            shadows: [
                              Shadow(
                                offset: const Offset(0, 1),
                                blurRadius: 2,
                                color: Colors.black.withOpacity(0.2),
                              ),
                            ],
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.textOnPrimary.withOpacity(0.95),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Khám phá ngay',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIndicators() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: widget.banners.asMap().entries.map((entry) {
        return GestureDetector(
          onTap: () => _pageController.animateToPage(
            entry.key,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          ),
          child: Container(
            width: _currentIndex == entry.key ? 24 : 8,
            height: 8,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              color: _currentIndex == entry.key
                  ? AppColors.primary
                  : AppColors.primary.withOpacity(0.3),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class BannerItem {
  final String? imageUrl;
  final String? title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Color? titleColor;
  final Color? subtitleColor;
  final Gradient? gradient;
  final bool hasOverlay;

  BannerItem({
    this.imageUrl,
    this.title,
    this.subtitle,
    this.onTap,
    this.titleColor,
    this.subtitleColor,
    this.gradient,
    this.hasOverlay = true,
  });

  // Predefined banners for jewelry store
  static List<BannerItem> defaultBanners() {
    return [
      BannerItem(
        title: 'Bộ Sưu Tập Mới',
        subtitle: 'Trang sức kim cương cao cấp',
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        onTap: () {
          // Navigate to new collection
        },
      ),
      BannerItem(
        title: 'Ưu Đãi Đặc Biệt',
        subtitle: 'Giảm giá lên đến 50% cho nhẫn cưới',
        gradient: const LinearGradient(
          colors: [AppColors.accentDark, AppColors.accent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        onTap: () {
          // Navigate to wedding rings
        },
      ),
      BannerItem(
        title: 'Trang Sức Thông Minh',
        subtitle: 'Công nghệ hiện đại trong từng thiết kế',
        gradient: const LinearGradient(
          colors: [AppColors.secondary, AppColors.secondaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        onTap: () {
          // Navigate to smart jewelry
        },
      ),
    ];
  }
}

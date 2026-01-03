import 'package:flutter/foundation.dart';

class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? originalPrice;
  final String slug;
  final List<String> images;
  final String categoryId;
  final String? subCategoryId;
  final List<String> tags;
  final Map<String, dynamic> specifications;
  final int stockQuantity;
  final bool isAvailable;
  final bool isFeatured;
  final double rating;
  final int reviewsCount;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? categoryName; // Add category name field

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    this.slug = '',
    required this.images,
    required this.categoryId,
    this.subCategoryId,
    this.tags = const [],
    this.specifications = const {},
    required this.stockQuantity,
    this.isAvailable = true,
    this.isFeatured = false,
    this.rating = 0.0,
    this.reviewsCount = 0,
    required this.createdAt,
    this.updatedAt,
    this.categoryName,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: (json['product_id'] ?? json['id'] ?? json['_id'] ?? '').toString(),
      name: json['product_name'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      price: json['price'] != null
          ? double.parse(json['price'].toString())
          : 0.0,
      originalPrice: json['originalPrice'] != null
          ? double.parse(json['originalPrice'].toString())
          : null,
      slug: json['slug'] ?? json['product_slug'] ?? json['productSlug'] ?? '',
      images: _extractImages(json),
      categoryId: (json['category_id'] ?? json['categoryId'] ?? '').toString(),
      subCategoryId: json['subcategory_id'] != null
          ? json['subcategory_id'].toString()
          : json['subCategoryId']?.toString(),
      tags: json['tags'] != null ? List<String>.from(json['tags']) : [],
      specifications: json['specifications'] != null
          ? Map<String, dynamic>.from(json['specifications'])
          : {},
      stockQuantity:
          json['quantity'] ??
          json['stockQuantity'] ??
          json['stock_quantity'] ??
          0,
      isAvailable: (json['quantity'] ?? 0) > 0,
      isFeatured: json['isFeatured'] ?? json['is_featured'] ?? false,
      rating: json['avgRating'] != null
          ? double.parse(json['avgRating'].toString())
          : (json['rating'] != null
                ? double.parse(json['rating'].toString())
                : 0.0),
      reviewsCount:
          json['totalReviews'] ??
          json['reviewsCount'] ??
          json['reviews_count'] ??
          0,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : (json['createdAt'] != null
                ? DateTime.parse(json['createdAt'])
                : DateTime.now()),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : (json['updatedAt'] != null
                ? DateTime.parse(json['updatedAt'])
                : null),
      categoryName:
          json['Category']?['category_name'] ??
          json['categoryName'] ??
          json['category_name'],
    );
  }

  // Helper method to extract images from different response formats
  static List<String> _extractImages(Map<String, dynamic> json) {
    const String imageBaseUrl = 'http://127.0.0.1:3001';

    // If images field exists and is a list
    if (json['images'] != null && json['images'] is List) {
      return (json['images'] as List)
          .map((img) {
            final url = img is String ? img : img.toString();
            final fullUrl = _ensureFullUrl(url, imageBaseUrl);
            debugPrint('[ProductImage] images field: $url -> $fullUrl');
            return fullUrl;
          })
          .where((url) => url.isNotEmpty)
          .cast<String>()
          .toList();
    }

    // If ProductImages exists (from API response)
    if (json['ProductImages'] != null && json['ProductImages'] is List) {
      return (json['ProductImages'] as List)
          .map((img) {
            final url = img['image_url'] ?? '';
            final fullUrl = _ensureFullUrl(url, imageBaseUrl);
            debugPrint('[ProductImage] ProductImages field: $url -> $fullUrl');
            return fullUrl;
          })
          .where((url) => url.isNotEmpty)
          .cast<String>()
          .toList();
    }

    debugPrint('[ProductImage] No images found in response');
    return [];
  }

  // Helper to ensure URL is complete
  static String _ensureFullUrl(String url, String baseUrl) {
    if (url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative path, prepend the base URL
    return '$baseUrl$url';
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'originalPrice': originalPrice,
      'slug': slug,
      'images': images,
      'categoryId': categoryId,
      'subCategoryId': subCategoryId,
      'tags': tags,
      'specifications': specifications,
      'stockQuantity': stockQuantity,
      'isAvailable': isAvailable,
      'isFeatured': isFeatured,
      'rating': rating,
      'reviewsCount': reviewsCount,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  String get mainImage => images.isNotEmpty ? images.first : '';

  bool get hasDiscount => originalPrice != null && originalPrice! > price;

  double get discountPercentage {
    if (!hasDiscount) return 0.0;
    return ((originalPrice! - price) / originalPrice!) * 100;
  }

  bool get inStock => stockQuantity > 0 && isAvailable;

  Product copyWith({
    String? id,
    String? name,
    String? description,
    double? price,
    double? originalPrice,
    String? slug,
    List<String>? images,
    String? categoryId,
    String? subCategoryId,
    List<String>? tags,
    Map<String, dynamic>? specifications,
    int? stockQuantity,
    bool? isAvailable,
    bool? isFeatured,
    double? rating,
    int? reviewsCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      originalPrice: originalPrice ?? this.originalPrice,
      slug: slug ?? this.slug,
      images: images ?? this.images,
      categoryId: categoryId ?? this.categoryId,
      subCategoryId: subCategoryId ?? this.subCategoryId,
      tags: tags ?? this.tags,
      specifications: specifications ?? this.specifications,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      isAvailable: isAvailable ?? this.isAvailable,
      isFeatured: isFeatured ?? this.isFeatured,
      rating: rating ?? this.rating,
      reviewsCount: reviewsCount ?? this.reviewsCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

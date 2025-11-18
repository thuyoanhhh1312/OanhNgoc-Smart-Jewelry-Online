import '../models/product.dart';
import '../models/category.dart';
import 'api_service.dart';
import 'category_service.dart';

class ProductService {
    // Get Products (like getProducts in React)
  static Future<List<Product>> getProducts({
    int page = 1,
    int limit = 20,
    String? categoryId,
    String? search,
    String? sortBy,
    String? order,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (categoryId != null) queryParams['category_id'] = categoryId;
      if (search != null) queryParams['search'] = search;
      if (sortBy != null) queryParams['sort_by'] = sortBy;
      if (order != null) queryParams['order'] = order;

      final response = await ApiService.get('/products', queryParams: queryParams);
      
      // Handle response - could be List or Map
      List<dynamic> productList;
      if (response is List) {
        productList = response;
      } else if (response is Map<String, dynamic>) {
        productList = response['data'] as List<dynamic>? ?? response['products'] as List<dynamic>? ?? [];
      } else {
        productList = [];
      }

      return productList.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception('Failed to get products: $e');
    }
  }

  // Get Product with Review Summary (like getProductWithReviewSummary in React)
  static Future<List<Product>> getProductWithReviewSummary({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final response = await ApiService.get('/products/with-review-summary', queryParams: queryParams);
      
      // Handle response - could be List or Map
      List<dynamic> productList;
      if (response is List) {
        productList = response;
      } else if (response is Map<String, dynamic>) {
        productList = response['data'] as List<dynamic>? ?? response['products'] as List<dynamic>? ?? [];
      } else {
        productList = [];
      }

      return productList.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception('Failed to get products with review summary: $e');
    }
  }

  // Get product by ID
  static Future<Product> getProductById(String id) async {
    try {
      final response = await ApiService.get('/products/$id');
      
      // Handle direct product response (no wrapper)
      if (response is Map<String, dynamic> && response['product_id'] != null) {
        return Product.fromJson(response);
      }
      // Handle wrapped response
      else if (response['success'] == true && response['data'] != null) {
        return Product.fromJson(response['data']);
      } else {
        throw Exception('Product not found');
      }
    } catch (e) {
      throw Exception('Failed to fetch product: $e');
    }
  }

  // Get product by slug (like getProductBySlug in React)
  static Future<Product> getProductBySlug(String slug) async {
    try {
      final response = await ApiService.get('/get-product-by-slug/$slug');
      
      if (response['success'] == true && response['data'] != null) {
        return Product.fromJson(response['data']);
      } else {
        throw Exception('Product not found');
      }
    } catch (e) {
      throw Exception('Failed to fetch product by slug: $e');
    }
  }

  // Get similar products (like getSimilarProducts in React)
  static Future<List<Product>> getSimilarProducts({
    required String categoryId,
    required String subcategoryId,
  }) async {
    try {
      final response = await ApiService.get('/products/similar', queryParams: {
        'category_id': categoryId,
        'subcategory_id': subcategoryId,
      });
      
      // Backend returns array directly, not wrapped in {success, data}
      if (response is List) {
        return response
            .map((product) => Product.fromJson(product as Map<String, dynamic>))
            .toList();
      } else if (response is Map<String, dynamic> && response['data'] != null) {
        // Handle wrapped response format if needed
        return (response['data'] as List)
            .map((product) => Product.fromJson(product as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch similar products: $e');
    }
  }

  // Get product reviews
  static Future<Map<String, dynamic>> getProductReviews(String productId) async {
    try {
      final response = await ApiService.get('/products/$productId/reviews');
      return response;
    } catch (e) {
      throw Exception('Failed to fetch product reviews: $e');
    }
  }

  // Add product review (customer can add reviews)
  static Future<Map<String, dynamic>> addProductReview({
    required String productId,
    required String userId,
    required int rating,
    required String content,
  }) async {
    try {
      final response = await ApiService.post('/products/$productId/reviews', body: {
        'user_id': userId,
        'rating': rating,
        'content': content,
      });
      return response;
    } catch (e) {
      throw Exception('Failed to add product review: $e');
    }
  }

  // Get product review summary
  static Future<Map<String, dynamic>> getProductReviewSummary(String productId) async {
    try {
      final response = await ApiService.get('/products/$productId/reviews/summary');
      return response;
    } catch (e) {
      throw Exception('Failed to fetch product review summary: $e');
    }
  }

  // Search products (like searchProduct in React)
  static Future<Map<String, dynamic>> searchProduct({
    String keyword = '',
    String? categoryId,
    String? subcategoryId,
    double? priceMin,
    double? priceMax,
    double? ratingMax,
    int limit = 20,
    int page = 1,
    String sortField = 'product_name',
    String sortOrder = 'ASC',
  }) async {
    try {
      final queryParams = <String, String>{};
      
      if (keyword.isNotEmpty) queryParams['keyword'] = keyword;
      if (categoryId != null) queryParams['category'] = categoryId;
      if (subcategoryId != null) queryParams['subcategory'] = subcategoryId;
      if (priceMin != null) queryParams['price_min'] = priceMin.toString();
      if (priceMax != null) queryParams['price_max'] = priceMax.toString();
      if (ratingMax != null) queryParams['rating_max'] = ratingMax.toString();
      queryParams['limit'] = limit.toString();
      queryParams['page'] = page.toString();
      queryParams['sort_field'] = sortField;
      queryParams['sort_order'] = sortOrder;
      
      final response = await ApiService.get('/search-product', queryParams: queryParams);
      return response;
    } catch (e) {
      throw Exception('Failed to search products: $e');
    }
  }

  // Quick search products (like quickSearchProducts in React)
  static Future<List<Product>> quickSearchProducts({
    required String keyword,
    int limit = 8,
  }) async {
    try {
      final response = await ApiService.get('/quick-search-products', queryParams: {
        'keyword': keyword,
        'limit': limit.toString(),
      });
      
      if (response['success'] == true && response['data'] != null) {
        return (response['data'] as List)
            .map((product) => Product.fromJson(product))
            .toList();
      }
      return [];
    } catch (e) {
      return []; // Return empty list on error for quick search
    }
  }

  // Get products by category (like getProductsByCategory in React)
  static Future<Map<String, dynamic>> getProductsByCategory(String categoryName) async {
    try {
      final response = await ApiService.get('/product-by-category', queryParams: {
        'category_name': categoryName,
      });
      return response;
    } catch (e) {
      throw Exception('Failed to fetch products by category: $e');
    }
  }

  // Get categories with subcategories (like getCategoriesWithSubCategories in React)
  static Future<List<Category>> getCategoriesWithSubCategories() async {
    return await CategoryService.getCategoriesWithSubCategories();
  }

  // Get top rated products by sentiment (like getTopRatedProductsBySentiment in React)
  static Future<List<Product>> getTopRatedProductsBySentiment() async {
    try {
      final response = await ApiService.get('/get-product-top-rated-by-sentiment');
      
      if (response['success'] == true && response['data'] != null) {
        return (response['data'] as List)
            .map((product) => Product.fromJson(product))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch top rated products by sentiment: $e');
    }
  }

  // Filter products (like filterProducts in React)
  static Future<Map<String, dynamic>> filterProducts(Map<String, dynamic> params) async {
    try {
      final response = await ApiService.get('/products/filter', queryParams: 
        params.map((key, value) => MapEntry(key, value.toString()))
      );
      return response;
    } catch (e) {
      throw Exception('Failed to filter products: $e');
    }
  }
}

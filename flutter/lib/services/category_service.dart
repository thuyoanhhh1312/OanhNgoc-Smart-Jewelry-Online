import '../models/category.dart';
import 'api_service.dart';

class CategoryService {
  // Get Categories
  static Future<List<Category>> getCategories() async {
    try {
      final response = await ApiService.get('/categories');
      
      // Handle response - could be List or Map
      List<dynamic> categoryList;
      if (response is List) {
        categoryList = response;
      } else if (response is Map<String, dynamic>) {
        categoryList = response['data'] as List<dynamic>? ?? response['categories'] as List<dynamic>? ?? [];
      } else {
        categoryList = [];
      }

      return categoryList.map((json) => Category.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception('Failed to get categories: $e');
    }
  }

  // Get categories with subcategories (like getCategoriesWithSubCategories in React)
  static Future<List<Category>> getCategoriesWithSubCategories() async {
    try {
      final response = await ApiService.get('/get-category-subcategory');
      
      // Handle response - could be List or Map
      List<dynamic> categoryList;
      if (response is List) {
        categoryList = response;
      } else if (response is Map<String, dynamic>) {
        // Check for success field that might be causing the type error
        if (response.containsKey('success') && response['success'] == true) {
          categoryList = response['data'] as List<dynamic>? ?? [];
        } else {
          categoryList = response['data'] as List<dynamic>? ?? response['categories'] as List<dynamic>? ?? [];
        }
      } else {
        categoryList = [];
      }

      return categoryList.map((json) => Category.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception('Failed to fetch categories with subcategories: $e');
    }
  }

  // Get category by ID (like getCategoryById in React)
  static Future<Category> getCategoryById(String id) async {
    try {
      final response = await ApiService.get('/categories/$id');
      
      if (response['success'] == true && response['data'] != null) {
        return Category.fromJson(response['data']);
      } else {
        throw Exception('Category not found');
      }
    } catch (e) {
      throw Exception('Failed to fetch category: $e');
    }
  }

  // Get subcategories by category ID
  static Future<List<SubCategory>> getSubcategoriesByCategoryId(String categoryId) async {
    try {
      final response = await ApiService.get('/subcategories', queryParams: {
        'category_id': categoryId,
      });
      
      if (response['success'] == true && response['data'] != null) {
        return (response['data'] as List)
            .map((subcategory) => SubCategory.fromJson(subcategory))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch subcategories: $e');
    }
  }

  // Get subcategory by ID
  static Future<SubCategory> getSubcategoryById(String id) async {
    try {
      final response = await ApiService.get('/subcategories/$id');
      
      if (response['success'] == true && response['data'] != null) {
        return SubCategory.fromJson(response['data']);
      } else {
        throw Exception('Subcategory not found');
      }
    } catch (e) {
      throw Exception('Failed to fetch subcategory: $e');
    }
  }
}

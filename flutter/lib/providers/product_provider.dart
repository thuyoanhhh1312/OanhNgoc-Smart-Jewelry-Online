import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../models/category.dart' as cat;
import '../services/product_service.dart';

class ProductProvider extends ChangeNotifier {
  List<Product> _products = [];
  List<Product> _featuredProducts = [];
  List<Product> _newArrivals = [];
  List<Product> _bestSellers = [];
  List<cat.Category> _categories = [];
  List<Product> _searchResults = [];
  
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  // Getters
  List<Product> get products => _products;
  List<Product> get featuredProducts => _featuredProducts;
  List<Product> get newArrivals => _newArrivals;
  List<Product> get bestSellers => _bestSellers;
  List<cat.Category> get categories => _categories;
  List<Product> get searchResults => _searchResults;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _hasMore;
  int get currentPage => _currentPage;

  ProductProvider() {
    loadInitialData();
  }

  Future<void> loadInitialData() async {
    await Future.wait([
      loadProducts(),
      loadCategories(),
      loadFeaturedProducts(),
      loadNewArrivals(),
      loadBestSellers(),
    ]);
  }

  Future<void> loadProducts({bool refresh = false}) async {
    if (_isLoading) return;

    try {
      _setLoading(true);
      _setError(null);

      if (refresh) {
        _currentPage = 1;
        _products.clear();
        _hasMore = true;
      }

      // Use the new getProducts method
      final newProducts = await ProductService.getProducts();
      
      if (refresh) {
        _products = newProducts;
      } else {
        _products.addAll(newProducts);
      }

      // Simple pagination logic - assume hasMore if we got items
      _hasMore = newProducts.isNotEmpty && newProducts.length >= 20;
      _currentPage++;

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> loadCategories() async {
    try {
      _setLoading(true);
      _setError(null);

      // Use the new getCategoriesWithSubCategories method
      _categories = await ProductService.getCategoriesWithSubCategories();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> loadFeaturedProducts() async {
    try {
      _setLoading(true);
      _setError(null);

      // Use the new getProductWithReviewSummary method for featured products
      _featuredProducts = await ProductService.getProductWithReviewSummary();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> loadNewArrivals() async {
    try {
      _setLoading(true);
      _setError(null);

      // Use search with sort by newest to get new arrivals
      final response = await ProductService.searchProduct(
        sortField: 'created_at',
        sortOrder: 'DESC',
        limit: 10,
      );

      if (response['success'] == true && response['data'] != null) {
        _newArrivals = (response['data'] as List)
            .map((productJson) => Product.fromJson(productJson))
            .toList();
      } else {
        _newArrivals = [];
      }

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> loadBestSellers() async {
    try {
      _setLoading(true);
      _setError(null);

      // Use the new getTopRatedProductsBySentiment method
      _bestSellers = await ProductService.getTopRatedProductsBySentiment();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> searchProducts(String query, {
    String sortBy = 'newest',
    double minPrice = 0,
    double maxPrice = 10000000,
    List<String> categories = const [],
  }) async {
    if (query.trim().isEmpty) {
      _searchResults.clear();
      notifyListeners();
      return;
    }

    try {
      _setLoading(true);
      _setError(null);

      // Use the new searchProduct method
      final response = await ProductService.searchProduct(
        keyword: query.trim(),
        priceMin: minPrice,
        priceMax: maxPrice,
        sortField: sortBy == 'newest' ? 'created_at' : 'product_name',
        sortOrder: sortBy == 'newest' ? 'DESC' : 'ASC',
      );

      if (response['success'] == true && response['data'] != null) {
        _searchResults = (response['data'] as List)
            .map((productJson) => Product.fromJson(productJson))
            .toList();
      } else {
        _searchResults = [];
      }

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> refresh() async {
    await loadInitialData();
  }

  Future<void> loadMore() async {
    if (!_hasMore || _isLoading) return;
    await loadProducts();
  }

  Product? getProductById(String id) {
    try {
      return _products.firstWhere((product) => product.id == id);
    } catch (e) {
      return null;
    }
  }

  List<Product> getProductsByCategory(String categoryId) {
    return _products.where((product) => 
      product.categoryId == categoryId
    ).toList();
  }

  List<Product> getRelatedProducts(Product product, {int limit = 4}) {
    return _products.where((p) => 
      p.id != product.id && 
      p.categoryId == product.categoryId
    ).take(limit).toList();
  }

  void clearSearchResults() {
    _searchResults.clear();
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
  }

  void _setError(String? error) {
    _error = error;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

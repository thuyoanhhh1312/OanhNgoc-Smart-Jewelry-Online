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
  
  // Search pagination
  int _searchPage = 1;
  bool _searchHasMore = true;
  String _lastSearchQuery = '';
  String _lastSearchSortBy = 'newest';
  double _lastSearchMinPrice = 0;
  double _lastSearchMaxPrice = 10000000;

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
  
  // Search pagination getters
  int get searchPage => _searchPage;
  bool get searchHasMore => _searchHasMore;

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
      
      // Reset pagination for new search
      _searchPage = 1;
      _searchHasMore = true;
      _searchResults.clear();
      
      // Save search parameters for load more
      _lastSearchQuery = query.trim();
      _lastSearchSortBy = sortBy;
      _lastSearchMinPrice = minPrice;
      _lastSearchMaxPrice = maxPrice;

      // Map sortBy to valid server fields
      String sortField = 'product_name';
      String sortOrder = 'ASC';
      
      if (sortBy == 'newest') {
        sortField = 'product_name';
        sortOrder = 'DESC';
      } else if (sortBy == 'price_low') {
        sortField = 'price';
        sortOrder = 'ASC';
      } else if (sortBy == 'price_high') {
        sortField = 'price';
        sortOrder = 'DESC';
      }

      // Use the new searchProduct method
      final response = await ProductService.searchProduct(
        keyword: query.trim(),
        priceMin: minPrice,
        priceMax: maxPrice,
        sortField: sortField,
        sortOrder: sortOrder,
        page: _searchPage,
        limit: 20,
      );

      print('📦 Search response received');
      
      // API returns {data: [...], pagination: {...}}
      if (response['data'] != null) {
        final dataList = response['data'];
        if (dataList is List) {
          _searchResults = dataList
              .map((productJson) => Product.fromJson(productJson as Map<String, dynamic>))
              .toList();
          print('✅ Loaded ${_searchResults.length} products from search');
          
          // Check if there are more results
          if (response['pagination'] != null) {
            final pagination = response['pagination'];
            _searchHasMore = _searchPage < (pagination['totalPages'] ?? 1);
            print('📄 Page ${_searchPage} of ${pagination['totalPages']}, hasMore: $_searchHasMore');
          }
        } else {
          _searchResults = [];
          print('⚠️ Data is not a list: ${dataList.runtimeType}');
        }
      } else {
        _searchResults = [];
        print('⚠️ No data field in response');
      }

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      print('❌ Search error: $e');
      _setError(e.toString());
      _setLoading(false);
    }
  }
  
  Future<void> loadMoreSearchResults() async {
    if (_isLoading || !_searchHasMore || _lastSearchQuery.isEmpty) {
      print('⚠️ Cannot load more: isLoading=$_isLoading, hasMore=$_searchHasMore, query=$_lastSearchQuery');
      return;
    }

    try {
      _searchPage++;
      print('📄 Loading page $_searchPage...');

      // Map sortBy to valid server fields
      String sortField = 'product_name';
      String sortOrder = 'ASC';
      
      if (_lastSearchSortBy == 'newest') {
        sortField = 'product_name';
        sortOrder = 'DESC';
      } else if (_lastSearchSortBy == 'price_low') {
        sortField = 'price';
        sortOrder = 'ASC';
      } else if (_lastSearchSortBy == 'price_high') {
        sortField = 'price';
        sortOrder = 'DESC';
      }

      final response = await ProductService.searchProduct(
        keyword: _lastSearchQuery,
        priceMin: _lastSearchMinPrice,
        priceMax: _lastSearchMaxPrice,
        sortField: sortField,
        sortOrder: sortOrder,
        page: _searchPage,
        limit: 20,
      );

      if (response['data'] != null) {
        final dataList = response['data'];
        if (dataList is List) {
          final newProducts = dataList
              .map((productJson) => Product.fromJson(productJson as Map<String, dynamic>))
              .toList();
          
          _searchResults.addAll(newProducts);
          print('✅ Loaded ${newProducts.length} more products. Total: ${_searchResults.length}');
          
          // Check if there are more results
          if (response['pagination'] != null) {
            final pagination = response['pagination'];
            _searchHasMore = _searchPage < (pagination['totalPages'] ?? 1);
            print('📄 Page $_searchPage of ${pagination['totalPages']}, hasMore: $_searchHasMore');
          }
        }
      }

      notifyListeners();
    } catch (e) {
      print('❌ Load more error: $e');
      _searchPage--; // Revert page increment on error
      _setError(e.toString());
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

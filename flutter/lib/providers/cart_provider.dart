import 'package:flutter/foundation.dart';
import '../models/cart.dart';
import '../models/product.dart';
import '../services/cart_service.dart';

class CartProvider extends ChangeNotifier {
  Cart _cart = Cart(lastUpdated: DateTime.now());
  bool _isLoading = false;
  String? _error;

  Cart get cart => _cart;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  int get itemCount => _cart.totalItems;
  double get total => _cart.total;
  double get subtotal => _cart.subtotal;
  double get shippingFee => _cart.shippingFee;
  double get tax => _cart.tax;
  bool get isEmpty => _cart.isEmpty;
  bool get isNotEmpty => _cart.isNotEmpty;
  List<CartItem> get items => _cart.items;

  CartProvider() {
    loadCart();
  }

  Future<void> loadCart() async {
    try {
      _isLoading = true;
      _cart = await CartService.loadCart();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _isLoading = false;
    }
  }

  Future<void> addItem(Product product, int quantity) async {
    await addToCart(product, quantity: quantity);
  }

  Future<void> clear() async {
    await clearCart();
  }

  Future<void> addToCart(Product product, {int quantity = 1}) async {
    try {
      _isLoading = true;
      _setError(null);
      
      _cart = await CartService.addToCart(product, quantity);
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _isLoading = false;
    }
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    try {
      _isLoading = true;
      _setError(null);
      
      _cart = await CartService.updateCartItem(itemId, quantity);
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _isLoading = false;
    }
  }

  Future<void> removeItem(String itemId) async {
    try {
      _isLoading = true;
      _setError(null);
      
      _cart = await CartService.removeFromCart(itemId);
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _isLoading = false;
    }
  }

  Future<void> clearCart() async {
    try {
      _isLoading = true;
      _setError(null);
      
      _cart = await CartService.clearCart();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _isLoading = false;
    }
  }

  Future<bool> isProductInCart(String productId) async {
    return await CartService.isProductInCart(productId);
  }

  Future<int> getProductQuantity(String productId) async {
    return await CartService.getProductQuantityInCart(productId);
  }

  CartItem? getCartItem(String productId) {
    try {
      return _cart.items.firstWhere((item) => item.product.id == productId);
    } catch (e) {
      return null;
    }
  }

  bool hasProduct(String productId) {
    return _cart.items.any((item) => item.product.id == productId);
  }

  void _setError(String? error) {
    _error = error;
    if (error != null) {
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

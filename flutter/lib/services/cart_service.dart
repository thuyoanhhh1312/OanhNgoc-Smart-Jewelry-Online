import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart.dart';
import '../models/product.dart';
import '../constants/app_constants.dart';

class CartService {
  static const String _cartKey = AppConstants.cartDataKey;

  // Load cart from local storage
  static Future<Cart> loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = prefs.getString(_cartKey);
      
      if (cartJson != null) {
        final cartData = json.decode(cartJson);
        return Cart.fromJson(cartData);
      } else {
        return Cart(lastUpdated: DateTime.now());
      }
    } catch (e) {
      return Cart(lastUpdated: DateTime.now());
    }
  }

  // Save cart to local storage
  static Future<void> saveCart(Cart cart) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = json.encode(cart.toJson());
      await prefs.setString(_cartKey, cartJson);
    } catch (e) {
      // Handle error silently
    }
  }

  // Add item to cart
  static Future<Cart> addToCart(Product product, int quantity) async {
    final currentCart = await loadCart();
    final updatedCart = currentCart.addItem(product, quantity);
    await saveCart(updatedCart);
    return updatedCart;
  }

  // Update item quantity in cart
  static Future<Cart> updateCartItem(String itemId, int quantity) async {
    final currentCart = await loadCart();
    
    if (quantity <= 0) {
      final updatedCart = currentCart.removeItem(itemId);
      await saveCart(updatedCart);
      return updatedCart;
    } else {
      final updatedCart = currentCart.updateItem(itemId, quantity);
      await saveCart(updatedCart);
      return updatedCart;
    }
  }

  // Remove item from cart
  static Future<Cart> removeFromCart(String itemId) async {
    final currentCart = await loadCart();
    final updatedCart = currentCart.removeItem(itemId);
    await saveCart(updatedCart);
    return updatedCart;
  }

  // Clear cart
  static Future<Cart> clearCart() async {
    final clearedCart = Cart(lastUpdated: DateTime.now());
    await saveCart(clearedCart);
    return clearedCart;
  }

  // Get cart item count
  static Future<int> getCartItemCount() async {
    final cart = await loadCart();
    return cart.totalItems;
  }

  // Check if product is in cart
  static Future<bool> isProductInCart(String productId) async {
    final cart = await loadCart();
    return cart.items.any((item) => item.product.id == productId);
  }

  // Get product quantity in cart
  static Future<int> getProductQuantityInCart(String productId) async {
    final cart = await loadCart();
    final item = cart.items.firstWhere(
      (item) => item.product.id == productId,
      orElse: () => CartItem(
        id: '',
        product: Product(
          id: '',
          name: '',
          description: '',
          price: 0,
          images: [],
          categoryId: '',
          stockQuantity: 0,
          createdAt: DateTime.now(),
        ),
        quantity: 0,
        addedAt: DateTime.now(),
      ),
    );
    return item.quantity;
  }

  // Sync cart with server (if user is logged in)
  static Future<void> syncCartWithServer() async {
    // TODO: Implement cart sync with server
    // This would upload the local cart to the server
    // and merge with any existing server cart
  }

  // Calculate cart totals
  static Future<Map<String, double>> getCartTotals() async {
    final cart = await loadCart();
    return {
      'subtotal': cart.subtotal,
      'shippingFee': cart.shippingFee,
      'tax': cart.tax,
      'total': cart.total,
    };
  }
}

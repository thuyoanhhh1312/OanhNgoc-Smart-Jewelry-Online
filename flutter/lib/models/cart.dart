import 'product.dart';

class CartItem {
  final String id;
  final Product product;
  final int quantity;
  final DateTime addedAt;

  CartItem({
    required this.id,
    required this.product,
    required this.quantity,
    required this.addedAt,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'] ?? json['_id'],
      product: Product.fromJson(json['product']),
      quantity: json['quantity'],
      addedAt: DateTime.parse(json['addedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product': product.toJson(),
      'quantity': quantity,
      'addedAt': addedAt.toIso8601String(),
    };
  }

  double get totalPrice => product.price * quantity;

  CartItem copyWith({
    String? id,
    Product? product,
    int? quantity,
    DateTime? addedAt,
  }) {
    return CartItem(
      id: id ?? this.id,
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      addedAt: addedAt ?? this.addedAt,
    );
  }
}

class Cart {
  final List<CartItem> items;
  final DateTime lastUpdated;

  Cart({
    this.items = const [],
    required this.lastUpdated,
  });

  factory Cart.fromJson(Map<String, dynamic> json) {
    return Cart(
      items: (json['items'] as List<dynamic>?)
          ?.map((item) => CartItem.fromJson(item))
          .toList() ?? [],
      lastUpdated: DateTime.parse(json['lastUpdated']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'items': items.map((item) => item.toJson()).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.totalPrice);

  double get shippingFee => subtotal > 500000 ? 0.0 : 30000; // Free shipping over 500k VND

  double get tax => subtotal * 0.1; // 10% tax

  double get total => subtotal + shippingFee + tax;

  bool get isEmpty => items.isEmpty;

  bool get isNotEmpty => items.isNotEmpty;

  Cart addItem(Product product, int quantity) {
    final existingItemIndex = items.indexWhere((item) => item.product.id == product.id);
    
    List<CartItem> newItems = List.from(items);
    
    if (existingItemIndex >= 0) {
      final existingItem = items[existingItemIndex];
      newItems[existingItemIndex] = existingItem.copyWith(
        quantity: existingItem.quantity + quantity,
      );
    } else {
      newItems.add(CartItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        product: product,
        quantity: quantity,
        addedAt: DateTime.now(),
      ));
    }

    return Cart(
      items: newItems,
      lastUpdated: DateTime.now(),
    );
  }

  Cart updateItem(String itemId, int quantity) {
    final newItems = items.map((item) {
      if (item.id == itemId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();

    return Cart(
      items: newItems,
      lastUpdated: DateTime.now(),
    );
  }

  Cart removeItem(String itemId) {
    final newItems = items.where((item) => item.id != itemId).toList();

    return Cart(
      items: newItems,
      lastUpdated: DateTime.now(),
    );
  }

  Cart clear() {
    return Cart(
      items: [],
      lastUpdated: DateTime.now(),
    );
  }
}

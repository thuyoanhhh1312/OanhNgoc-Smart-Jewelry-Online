import 'product.dart';

class CartItem {
  final Product product;
  final int quantity;
  final DateTime addedAt;

  CartItem({
    required this.product,
    required this.quantity,
    DateTime? addedAt,
  }) : addedAt = addedAt ?? DateTime.now();

  // Calculate total price for this item
  double get totalPrice => product.price * quantity;

  // Create a copy with updated quantity
  CartItem copyWith({
    Product? product,
    int? quantity,
    DateTime? addedAt,
  }) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      addedAt: addedAt ?? this.addedAt,
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'product': product.toJson(),
      'quantity': quantity,
      'addedAt': addedAt.toIso8601String(),
    };
  }

  // Create from JSON
  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      product: Product.fromJson(json['product']),
      quantity: json['quantity'],
      addedAt: DateTime.parse(json['addedAt']),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CartItem &&
        other.product.id == product.id &&
        other.quantity == quantity;
  }

  @override
  int get hashCode => product.id.hashCode ^ quantity.hashCode;

  @override
  String toString() {
    return 'CartItem(product: ${product.name}, quantity: $quantity, totalPrice: $totalPrice)';
  }
}

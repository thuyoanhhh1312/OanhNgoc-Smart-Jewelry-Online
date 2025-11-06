import 'product.dart';
import 'user.dart';

enum OrderStatus {
  pending,
  confirmed,
  processing,
  shipping,
  delivered,
  cancelled,
  refunded,
}

enum PaymentMethod {
  cash,
  card,
  bankTransfer,
  momo,
  zalopay,
  vnpay,
}

enum PaymentStatus {
  pending,
  paid,
  failed,
  refunded,
}

class OrderItem {
  final String id;
  final Product product;
  final int quantity;
  final double price;
  final double totalPrice;

  OrderItem({
    required this.id,
    required this.product,
    required this.quantity,
    required this.price,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] ?? json['_id'],
      product: Product.fromJson(json['product']),
      quantity: json['quantity'],
      price: (json['price'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product': product.toJson(),
      'quantity': quantity,
      'price': price,
      'totalPrice': totalPrice,
    };
  }
}

class Order {
  final String id;
  final String userId;
  final List<OrderItem> items;
  final double subtotal;
  final double shippingFee;
  final double tax;
  final double total;
  final OrderStatus status;
  final PaymentMethod paymentMethod;
  final PaymentStatus paymentStatus;
  final Address shippingAddress;
  final String? notes;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? deliveredAt;

  Order({
    required this.id,
    required this.userId,
    required this.items,
    required this.subtotal,
    required this.shippingFee,
    required this.tax,
    required this.total,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.shippingAddress,
    this.notes,
    required this.createdAt,
    this.updatedAt,
    this.deliveredAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? json['_id'],
      userId: json['userId'],
      items: (json['items'] as List<dynamic>)
          .map((item) => OrderItem.fromJson(item))
          .toList(),
      subtotal: (json['subtotal'] as num).toDouble(),
      shippingFee: (json['shippingFee'] as num).toDouble(),
      tax: (json['tax'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      status: OrderStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['status'],
        orElse: () => OrderStatus.pending,
      ),
      paymentMethod: PaymentMethod.values.firstWhere(
        (e) => e.toString().split('.').last == json['paymentMethod'],
        orElse: () => PaymentMethod.cash,
      ),
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['paymentStatus'],
        orElse: () => PaymentStatus.pending,
      ),
      shippingAddress: Address.fromJson(json['shippingAddress']),
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : null,
      deliveredAt: json['deliveredAt'] != null 
          ? DateTime.parse(json['deliveredAt']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'items': items.map((item) => item.toJson()).toList(),
      'subtotal': subtotal,
      'shippingFee': shippingFee,
      'tax': tax,
      'total': total,
      'status': status.toString().split('.').last,
      'paymentMethod': paymentMethod.toString().split('.').last,
      'paymentStatus': paymentStatus.toString().split('.').last,
      'shippingAddress': shippingAddress.toJson(),
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'deliveredAt': deliveredAt?.toIso8601String(),
    };
  }

  String get orderNumber => 'SJ${id.substring(0, 8).toUpperCase()}';

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  bool get canCancel => status == OrderStatus.pending || status == OrderStatus.confirmed;

  bool get canReorder => status == OrderStatus.delivered || status == OrderStatus.cancelled;

  String get statusText {
    switch (status) {
      case OrderStatus.pending:
        return 'Chờ xử lý';
      case OrderStatus.confirmed:
        return 'Đã xác nhận';
      case OrderStatus.processing:
        return 'Đang xử lý';
      case OrderStatus.shipping:
        return 'Đang giao hàng';
      case OrderStatus.delivered:
        return 'Đã giao hàng';
      case OrderStatus.cancelled:
        return 'Đã hủy';
      case OrderStatus.refunded:
        return 'Đã hoàn tiền';
    }
  }

  String get paymentMethodText {
    switch (paymentMethod) {
      case PaymentMethod.cash:
        return 'Tiền mặt';
      case PaymentMethod.card:
        return 'Thẻ tín dụng';
      case PaymentMethod.bankTransfer:
        return 'Chuyển khoản';
      case PaymentMethod.momo:
        return 'MoMo';
      case PaymentMethod.zalopay:
        return 'ZaloPay';
      case PaymentMethod.vnpay:
        return 'VNPay';
    }
  }

  String get paymentStatusText {
    switch (paymentStatus) {
      case PaymentStatus.pending:
        return 'Chờ thanh toán';
      case PaymentStatus.paid:
        return 'Đã thanh toán';
      case PaymentStatus.failed:
        return 'Thanh toán thất bại';
      case PaymentStatus.refunded:
        return 'Đã hoàn tiền';
    }
  }
}

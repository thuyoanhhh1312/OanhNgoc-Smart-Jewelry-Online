import 'product.dart';

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
  final String productId;
  final String name;
  final Product? product;
  final int quantity;
  final double price;
  final double totalPrice;

  OrderItem({
    required this.id,
    required this.productId,
    required this.name,
    this.product,
    required this.quantity,
    required this.price,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final productJson = json['product'] ?? json['Product'];
    Product? product;
    if (productJson is Map<String, dynamic>) {
      product = Product.fromJson(productJson);
    }

    final fallbackName = product?.name ??
        json['product_name'] ??
        json['productName'] ??
        'Sản phẩm';
    final priceValue = json['price'] ?? product?.price ?? 0;
    final totalValue = json['total_price'] ??
        json['totalPrice'] ??
        (priceValue is num && json['quantity'] is num
            ? priceValue * (json['quantity'] as num)
            : 0);

    return OrderItem(
      id: (json['order_item_id'] ?? json['id'] ?? json['_id'] ?? '').toString(),
      productId:
          (json['product_id'] ?? product?.id ?? json['productId'] ?? '').toString(),
      name: fallbackName,
      product: product,
      quantity: json['quantity'] is int
          ? json['quantity'] as int
          : int.tryParse(json['quantity']?.toString() ?? '0') ?? 0,
      price: Order._toDouble(priceValue),
      totalPrice: Order._toDouble(totalValue),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'name': name,
      'product': product?.toJson(),
      'quantity': quantity,
      'price': price,
      'totalPrice': totalPrice,
    };
  }

  String get displayName => product?.name ?? name;
}

class Order {
  final String id;
  final List<OrderItem> items;
  final double subtotal;
  final double shippingFee;
  final double tax;
  final double total;
  final double discount;
  final double deposit;
  final bool isDeposit;
  final String depositStatus;
  final OrderStatus status;
  final PaymentMethod paymentMethod;
  final PaymentStatus paymentStatus;
  final String shippingAddress;
  final String? notes;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? deliveredAt;
  final String statusLabel;
  final String? statusColor;
  final String? customerId;

  Order({
    required this.id,
    required this.items,
    required this.subtotal,
    required this.shippingFee,
    required this.tax,
    required this.total,
    required this.discount,
    required this.deposit,
    required this.isDeposit,
    required this.depositStatus,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.shippingAddress,
    this.notes,
    required this.createdAt,
    this.updatedAt,
    this.deliveredAt,
    required this.statusLabel,
    this.statusColor,
    this.customerId,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemList = _extractItems(json);
    final subtotalValue = json['sub_total'] ?? json['subtotal'];
    final discountValue = json['discount'] ?? json['discount_total'];
    final shippingFeeValue = json['shipping_fee'] ?? json['shippingFee'] ?? 0;
    final taxValue = json['tax'] ?? json['tax_total'] ?? 0;
    final totalValue = json['total_amount'] ?? json['total'];

    final paymentMethodValue =
        (json['payment_method'] ?? json['paymentMethod'] ?? 'cod').toString();
    final paymentStatusValue =
        (json['payment_status'] ?? json['deposit_status'] ?? 'pending').toString();
    final statusValue = json['status'] ??
        json['status_code'] ??
        json['OrderStatus']?['status_code'] ??
        json['OrderStatus']?['status_name'] ??
        'pending';
    final statusLabel =
        json['OrderStatus']?['status_name'] ?? json['status_text'] ?? 'Chờ xử lý';

    return Order(
      id: (json['order_id'] ?? json['id'] ?? json['_id'] ?? '').toString(),
      customerId:
          (json['customer_id'] ?? json['customerId'] ?? json['userId'])?.toString(),
      items: itemList,
      subtotal: _toDouble(subtotalValue),
      discount: _toDouble(discountValue),
      shippingFee: _toDouble(shippingFeeValue),
      tax: _toDouble(taxValue),
      total: _toDouble(totalValue),
      deposit: _toDouble(json['deposit']),
      isDeposit: json['is_deposit'] ?? json['isDeposit'] ?? false,
      depositStatus: paymentStatusValue,
      status: _parseOrderStatus(statusValue.toString()),
      paymentMethod: _parsePaymentMethod(paymentMethodValue),
      paymentStatus: _parsePaymentStatus(paymentStatusValue),
      shippingAddress: _extractShippingAddress(
        json['shipping_address'] ?? json['shippingAddress'],
      ),
      notes: json['notes'],
      createdAt: _parseDate(json['created_at'] ?? json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updated_at'] ?? json['updatedAt']),
      deliveredAt: _parseDate(json['delivered_at'] ?? json['deliveredAt']),
      statusLabel: statusLabel,
      statusColor: json['OrderStatus']?['color_code'] ?? json['status_color'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'items': items.map((item) => item.toJson()).toList(),
      'subtotal': subtotal,
      'shippingFee': shippingFee,
      'tax': tax,
      'total': total,
      'discount': discount,
      'deposit': deposit,
      'isDeposit': isDeposit,
      'depositStatus': depositStatus,
      'status': status.toString().split('.').last,
      'paymentMethod': paymentMethod.toString().split('.').last,
      'paymentStatus': paymentStatus.toString().split('.').last,
      'shippingAddress': shippingAddress,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'deliveredAt': deliveredAt?.toIso8601String(),
      'statusText': statusLabel,
      'statusColor': statusColor,
    };
  }

  String get orderNumber {
    final sanitized = id.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
    final trimmed = sanitized.length >= 6
        ? sanitized.substring(0, 6).toUpperCase()
        : sanitized.toUpperCase().padLeft(6, '0');
    return 'SJ$trimmed';
  }

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  bool get canCancel => status == OrderStatus.pending || status == OrderStatus.confirmed;

  bool get canReorder => status == OrderStatus.delivered || status == OrderStatus.cancelled;

  String get statusText {
    if (statusLabel.isNotEmpty) {
      return statusLabel;
    }
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
        return 'Thanh toán khi nhận hàng';
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

  static List<OrderItem> _extractItems(Map<String, dynamic> json) {
    final rawItems = json['items'] ??
        json['order_items'] ??
        json['OrderItems'] ??
        json['orderItems'];
    if (rawItems is List) {
      return rawItems
          .whereType<Map<String, dynamic>>()
          .map(OrderItem.fromJson)
          .toList();
    }
    return [];
  }

  static OrderStatus _parseOrderStatus(String value) {
    final normalized = value.toLowerCase();
    return OrderStatus.values.firstWhere(
      (status) => status.name.toLowerCase() == normalized,
      orElse: () => OrderStatus.pending,
    );
  }

  static PaymentMethod _parsePaymentMethod(String value) {
    final normalized = value.toLowerCase();
    switch (normalized) {
      case 'cod':
      case 'cash':
        return PaymentMethod.cash;
      case 'card':
        return PaymentMethod.card;
      case 'banktransfer':
      case 'bank_transfer':
      case 'ck':
        return PaymentMethod.bankTransfer;
      case 'momo':
        return PaymentMethod.momo;
      case 'zalopay':
        return PaymentMethod.zalopay;
      case 'vnpay':
        return PaymentMethod.vnpay;
      default:
        return PaymentMethod.cash;
    }
  }

  static PaymentStatus _parsePaymentStatus(String value) {
    final normalized = value.toLowerCase();
    switch (normalized) {
      case 'paid':
      case 'completed':
        return PaymentStatus.paid;
      case 'failed':
        return PaymentStatus.failed;
      case 'refunded':
        return PaymentStatus.refunded;
      default:
        return PaymentStatus.pending;
    }
  }

  static String _extractShippingAddress(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    if (value is Map<String, dynamic>) {
      final parts = [
        value['address'] ?? value['address_detail'],
        value['ward'] ?? value['wardName'],
        value['district'] ?? value['districtName'],
        value['city'] ?? value['provinceName'],
      ].where((part) => part != null && part.toString().isNotEmpty).toList();
      return parts.join(', ');
    }
    return value.toString();
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    return DateTime.tryParse(value.toString());
  }
}

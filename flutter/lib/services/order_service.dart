import '../models/order.dart';
import 'api_service.dart';

class OrderService {
  // Get orders by user ID (customer's own orders)
  static Future<List<Order>> getMyOrders(String userId) async {
    try {
      final response = await ApiService.get('/orders/by-user/$userId');

      if (response is List) {
        return response
            .whereType<Map<String, dynamic>>()
            .map(Order.fromJson)
            .toList();
      } else if (response is Map<String, dynamic>) {
        final data = response['data'];
        if (data is List) {
          return data.whereType<Map<String, dynamic>>().map(Order.fromJson).toList();
        }
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch my orders: $e');
    }
  }

  // Get order by ID (customer can view their own order details)
  static Future<Order> getOrderById(String id) async {
    try {
      final response = await ApiService.get('/orders/$id');

      if (response is Map<String, dynamic>) {
        return Order.fromJson(response);
      }
      throw Exception('Order not found');
    } catch (e) {
      throw Exception('Failed to fetch order: $e');
    }
  }

  // Create new order (like createOrder in React)
  static Future<Order> createOrder(Map<String, dynamic> orderData) async {
    try {
      final response = await ApiService.post('/orders', body: orderData);

      if (response is Map<String, dynamic>) {
        return Order.fromJson(response);
      }
      throw Exception('Failed to create order');
    } catch (e) {
      throw Exception('Failed to create order: $e');
    }
  }

  // Checkout - create order with payment (like checkout in React)
  static Future<Order> checkout(Map<String, dynamic> orderData) async {
    try {
      final response = await ApiService.post('/checkout', body: orderData);

      if (response is Map<String, dynamic>) {
        if (response['order'] is Map<String, dynamic>) {
          return Order.fromJson(response['order'] as Map<String, dynamic>);
        }
        if (response.containsKey('id') || response.containsKey('order_id')) {
          return Order.fromJson(response);
        }
        final message = response['message'] ?? 'Checkout failed';
        throw Exception(message);
      }
      throw Exception('Checkout failed');
    } catch (e) {
      throw Exception('Checkout failed: $e');
    }
  }

  // Calculate price with promotion (like calculatePrice in React)
  static Future<Map<String, dynamic>> calculatePrice({
    required List<Map<String, dynamic>> items,
    String? promotionCode,
    required int userId,
  }) async {
    try {
      final response = await ApiService.post('/calculate-price', body: {
        'items': items,
        'promotion_code': promotionCode,
        'user_id': userId,
      });

      if (response is Map<String, dynamic>) {
        return response;
      }
      throw Exception('Failed to calculate price');
    } catch (e) {
      throw Exception('Failed to calculate price: $e');
    }
  }

  // Get orders by customer ID (alternative method)
  static Future<List<Order>> getOrdersByCustomerId(String customerId) async {
    try {
      final response = await ApiService.get('/orders/by-customer/$customerId');

      if (response is List) {
        return response
            .whereType<Map<String, dynamic>>()
            .map(Order.fromJson)
            .toList();
      } else if (response is Map<String, dynamic>) {
        final data = response['data'];
        if (data is List) {
          return data.whereType<Map<String, dynamic>>().map(Order.fromJson).toList();
        }
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch customer orders: $e');
    }
  }

  // Get order status list (for display purposes)
  static Future<List<Map<String, dynamic>>> getOrderStatuses() async {
    try {
      final response = await ApiService.get('/order-status');

      if (response is List) {
        return response
            .whereType<Map<String, dynamic>>()
            .toList();
      } else if (response is Map<String, dynamic>) {
        final data = response['data'];
        if (data is List) {
          return data.whereType<Map<String, dynamic>>().toList();
        }
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch order statuses: $e');
    }
  }
}

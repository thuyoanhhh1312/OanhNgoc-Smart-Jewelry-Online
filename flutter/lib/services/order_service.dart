import '../models/order.dart';
import 'api_service.dart';

class OrderService {
  // Get orders by user ID (customer's own orders)
  static Future<List<Order>> getMyOrders(String userId) async {
    try {
      final response = await ApiService.get('/orders/by-user/$userId');
      
      if (response['success'] == true && response['data'] != null) {
        return (response['data'] as List)
            .map((order) => Order.fromJson(order))
            .toList();
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
      
      if (response['success'] == true && response['data'] != null) {
        return Order.fromJson(response['data']);
      } else {
        throw Exception('Order not found');
      }
    } catch (e) {
      throw Exception('Failed to fetch order: $e');
    }
  }

  // Create new order (like createOrder in React)
  static Future<Order> createOrder(Map<String, dynamic> orderData) async {
    try {
      final response = await ApiService.post('/orders', body: orderData);
      
      if (response['success'] == true && response['data'] != null) {
        return Order.fromJson(response['data']);
      } else {
        throw Exception('Failed to create order');
      }
    } catch (e) {
      throw Exception('Failed to create order: $e');
    }
  }

  // Checkout - create order with payment (like checkout in React)
  static Future<Map<String, dynamic>> checkout(Map<String, dynamic> orderData) async {
    try {
      final response = await ApiService.post('/checkout', body: orderData);
      
      if (response['success'] == true) {
        return response;
      } else {
        throw Exception('Checkout failed');
      }
    } catch (e) {
      throw Exception('Checkout failed: $e');
    }
  }

  // Calculate price with promotion (like calculatePrice in React)
  static Future<Map<String, dynamic>> calculatePrice({
    required List<Map<String, dynamic>> items,
    String? promotionCode,
    String? userId,
  }) async {
    try {
      final response = await ApiService.post('/calculate-price', body: {
        'items': items,
        'promotion_code': promotionCode,
        'user_id': userId,
      });
      
      if (response['success'] == true) {
        return response;
      } else {
        throw Exception('Failed to calculate price');
      }
    } catch (e) {
      throw Exception('Failed to calculate price: $e');
    }
  }

  // Get orders by customer ID (alternative method)
  static Future<List<Order>> getOrdersByCustomerId(String customerId) async {
    try {
      final response = await ApiService.get('/orders/by-customer/$customerId');
      
      if (response['success'] == true && response['data'] != null) {
        return (response['data'] as List)
            .map((order) => Order.fromJson(order))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch customer orders: $e');
    }
  }

  // Get order status list (for display purposes)
  static Future<List<Map<String, dynamic>>> getOrderStatuses() async {
    try {
      final response = await ApiService.get('/order-statuses');
      
      if (response['success'] == true && response['data'] != null) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch order statuses: $e');
    }
  }
}

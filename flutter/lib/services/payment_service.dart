import 'api_service.dart';

class PaymentService {
  static Future<String?> createVnPayPaymentUrl({
    required String orderId,
    required double amount,
  }) async {
    try {
      final response = await ApiService.post(
        '/payment/create_payment_url',
        body: {
          'orderId': orderId,
          'amount': amount.round(),
        },
      );

      if (response is Map && response['paymentUrl'] is String) {
        return response['paymentUrl'] as String;
      }
      return null;
    } catch (e) {
      throw Exception('Không thể tạo liên kết thanh toán VNPay: $e');
    }
  }
}

import 'api_service.dart';

class PromotionService {
  /// Lấy danh sách khuyến mãi dành riêng cho khách hàng hiện tại.
  static Future<List<Map<String, dynamic>>> getCustomerPromotions() async {
    final response = await ApiService.get('/promotions/customer/my-promotions');

    List<dynamic> rawList = [];
    if (response is List) {
      rawList = response;
    } else if (response is Map<String, dynamic>) {
      // Một số API trả về { data: [...] }
      if (response['data'] is List) {
        rawList = response['data'] as List;
      } else if (response['promotions'] is List) {
        rawList = response['promotions'] as List;
      }
    }

    return rawList
        .whereType<Map<String, dynamic>>()
        .toList(growable: false);
  }
}

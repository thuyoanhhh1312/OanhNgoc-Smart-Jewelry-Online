import '../models/customer_profile.dart';
import 'api_service.dart';

class CustomerService {
  static Future<CustomerProfile> getProfileByUserId(String userId) async {
    final response = await ApiService.get('/customers/by-user/$userId');
    if (response is Map<String, dynamic>) {
      return CustomerProfile.fromJson(response);
    }
    throw Exception('Không thể lấy thông tin khách hàng');
  }

  static Future<CustomerProfile> updateProfile({
    String? name,
    String? phone,
    String? gender,
    String? address,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (gender != null) body['gender'] = gender;
    if (address != null) body['address'] = address;

    final response = await ApiService.put('/customers/profile', body: body);
    if (response is Map<String, dynamic> && response['customer'] != null) {
      return CustomerProfile.fromJson(response['customer']);
    } else if (response is Map<String, dynamic>) {
      return CustomerProfile.fromJson(response);
    }
    throw Exception('Không thể cập nhật thông tin cá nhân');
  }
}

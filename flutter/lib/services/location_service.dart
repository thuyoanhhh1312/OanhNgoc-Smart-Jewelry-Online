import 'api_service.dart';

class LocationService {
  // Get all provinces
  static Future<List<Map<String, dynamic>>> getProvinces() async {
    try {
      final response = await ApiService.get('/locations/provinces');
      
      // If response is directly a list
      if (response is List) {
        return List<Map<String, dynamic>>.from(response);
      }
      
      // If response has success wrapper
      if (response is Map && response['success'] == true && response['data'] != null) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
      
      return [];
    } catch (e) {
      throw Exception('Lỗi khi lấy danh sách tỉnh/thành: $e');
    }
  }

  // Get districts by province code
  static Future<List<Map<String, dynamic>>> getDistricts(String provinceCode) async {
    if (provinceCode.isEmpty) {
      throw Exception('provinceCode là bắt buộc');
    }

    try {
      final response = await ApiService.get('/locations/districts/$provinceCode');
      
      // If response is directly a list
      if (response is List) {
        return List<Map<String, dynamic>>.from(response);
      }
      
      // If response has success wrapper
      if (response is Map && response['success'] == true && response['data'] != null) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
      
      return [];
    } catch (e) {
      throw Exception('Lỗi khi lấy danh sách quận/huyện: $e');
    }
  }

  // Get wards by district code
  static Future<List<Map<String, dynamic>>> getWards(String districtCode) async {
    if (districtCode.isEmpty) {
      throw Exception('districtCode là bắt buộc');
    }

    try {
      final response = await ApiService.get('/locations/wards/$districtCode');
      
      // If response is directly a list
      if (response is List) {
        return List<Map<String, dynamic>>.from(response);
      }
      
      // If response has success wrapper
      if (response is Map && response['success'] == true && response['data'] != null) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
      
      return [];
    } catch (e) {
      throw Exception('Lỗi khi lấy danh sách phường/xã: $e');
    }
  }
}

import '../models/bank_account.dart';
import 'api_service.dart';

class BankService {
  static Future<List<BankAccount>> getBankAccounts({bool includeAll = false}) async {
    try {
      final response = await ApiService.get(
        '/bank-accounts',
        queryParams: {'all': includeAll.toString()},
      );

      if (response is List) {
        return response
            .whereType<Map<String, dynamic>>()
            .map(BankAccount.fromJson)
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Lỗi khi tải danh sách tài khoản ngân hàng: $e');
    }
  }
}

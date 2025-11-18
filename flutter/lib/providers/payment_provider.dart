import 'package:flutter/foundation.dart';
import '../models/bank_account.dart';
import '../services/bank_service.dart';

class PaymentProvider extends ChangeNotifier {
  List<BankAccount> _bankAccounts = [];
  bool _isLoading = false;
  String? _error;
  BankAccount? _selectedBank;

  List<BankAccount> get bankAccounts => _bankAccounts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  BankAccount? get selectedBank => _selectedBank;

  Future<void> loadBankAccounts() async {
    if (_isLoading) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final accounts = await BankService.getBankAccounts();
      _bankAccounts = accounts;
      if (_bankAccounts.isNotEmpty) {
        _selectedBank = _bankAccounts.first;
      } else {
        _selectedBank = null;
      }
    } catch (e) {
      _error = e.toString();
      _bankAccounts = [];
      _selectedBank = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectBank(int? id) {
    if (id == null) {
      _selectedBank = null;
    } else {
      try {
        _selectedBank = _bankAccounts.firstWhere((bank) => bank.id == id);
      } catch (_) {
        _selectedBank = null;
      }
    }
    notifyListeners();
  }
}

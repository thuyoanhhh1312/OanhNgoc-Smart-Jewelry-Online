import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../services/order_service.dart';
import '../services/promotion_service.dart';

class OrderProvider extends ChangeNotifier {
  // Address selection
  String _selectedProvinceCode = '';
  String _selectedProvinceName = '';
  String _selectedDistrictCode = '';
  String _selectedDistrictName = '';
  String _selectedWardCode = '';
  String _selectedWardName = '';
  String _addressDetail = '';

  String get selectedProvinceCode => _selectedProvinceCode;
  String get selectedProvinceName => _selectedProvinceName;
  String get selectedDistrictCode => _selectedDistrictCode;
  String get selectedDistrictName => _selectedDistrictName;
  String get selectedWardCode => _selectedWardCode;
  String get selectedWardName => _selectedWardName;
  String get addressDetail => _addressDetail;

  // Payment method
  String _paymentMethod = 'cod'; // 'cod', 'vnpay'
  String get paymentMethod => _paymentMethod;

  // Promotions for current customer
  List<Map<String, dynamic>> _customerPromotions = [];
  bool _promoListLoading = false;
  String _promoListError = '';

  List<Map<String, dynamic>> get customerPromotions => _customerPromotions;
  bool get promoListLoading => _promoListLoading;
  String get promoListError => _promoListError;

  // Promo code
  String _promoCode = '';
  bool _promoLoading = false;
  Map<String, dynamic> _promoResult = {
    'valid': false,
    'message': '',
    'discount': 0,
    'promotion': null,
  };

  String get promoCode => _promoCode;
  bool get promoLoading => _promoLoading;
  Map<String, dynamic> get promoResult => _promoResult;
  double get discountAmount => (_promoResult['discount'] ?? 0).toDouble();

  // Totals
  double _subTotal = 0;
  double _shippingFee = 0;
  double _discount = 0;
  double _total = 0;

  double get subTotal => _subTotal;
  double get shippingFee => _shippingFee;
  double get discount => _discount;
  double get total => _total;

  // Checkout state
  bool _isSubmitting = false;
  String _error = '';

  bool get isSubmitting => _isSubmitting;
  String get error => _error;

  // Initialize with cart totals
  void initializeWithCartTotals({
    required double subtotal,
    double shippingFee = 0,
    double discount = 0,
  }) {
    _subTotal = subtotal;
    _shippingFee = 0; // miễn phí vận chuyển
    _discount = discount;
    _total = 0;
    _recalculateTotal(subtotal: subtotal, shippingFee: shippingFee, discount: discount);
    _promoCode = '';
    _promoResult = {
      'valid': false,
      'message': '',
      'discount': 0,
      'promotion': null,
    };
    notifyListeners();
  }

  // Address selection
  void setProvince(String code, String name) {
    _selectedProvinceCode = code;
    _selectedProvinceName = name;
    // Reset district and ward when province changes
    _selectedDistrictCode = '';
    _selectedDistrictName = '';
    _selectedWardCode = '';
    _selectedWardName = '';
    notifyListeners();
  }

  void setDistrict(String code, String name) {
    _selectedDistrictCode = code;
    _selectedDistrictName = name;
    // Reset ward when district changes
    _selectedWardCode = '';
    _selectedWardName = '';
    notifyListeners();
  }

  void setWard(String code, String name) {
    _selectedWardCode = code;
    _selectedWardName = name;
    notifyListeners();
  }

  void setAddressDetail(String address) {
    _addressDetail = address;
    notifyListeners();
  }

  // Payment method
  void setPaymentMethod(String method) {
    _paymentMethod = method;
    notifyListeners();
  }

  // Load available promotions for logged-in customer
  Future<void> loadCustomerPromotions({bool force = false}) async {
    if (_promoListLoading) return;
    if (_customerPromotions.isNotEmpty && !force) return;

    _promoListLoading = true;
    _promoListError = '';
    notifyListeners();

    try {
      final promos = await PromotionService.getCustomerPromotions();
      _customerPromotions = promos;
    } catch (e) {
      _promoListError = 'Không thể tải khuyến mãi: $e';
      _customerPromotions = [];
    } finally {
      _promoListLoading = false;
      notifyListeners();
    }
  }

  // Promo code
  void setPromoCode(String code) {
    _promoCode = code;
    notifyListeners();
  }

  void clearPromoCode() {
    _promoCode = '';
    _promoResult = {
      'valid': false,
      'message': '',
      'discount': 0,
      'promotion': null,
    };
    _discount = 0;
    _recalculateTotal();
    notifyListeners();
  }

  // Apply promo code
  Future<void> applyPromoCode({
    required List<Map<String, dynamic>> items,
    required int userId,
  }) async {
    if (_promoCode.trim().isEmpty) {
      clearPromoCode();
      return;
    }

    _promoLoading = true;
    _error = '';
    notifyListeners();

    try {
      final response = await OrderService.calculatePrice(
        items: items,
        promotionCode: _promoCode.trim(),
        userId: userId,
      );

      _promoResult = response;

      if (response['valid'] == true) {
        _discount = (response['discount'] ?? 0).toDouble();
        _recalculateTotal();
      } else {
        _discount = 0;
        _recalculateTotal();
      }
    } catch (e) {
      _error = 'Lỗi khi áp dụng mã ưu đãi: $e';
      _promoResult = {
        'valid': false,
        'message': _error,
        'discount': 0,
        'promotion': null,
      };
      _discount = 0;
      _recalculateTotal();
    } finally {
      _promoLoading = false;
      notifyListeners();
    }
  }

  // Validate form
  String? validateForm() {
    if (_selectedProvinceCode.isEmpty) {
      return 'Vui lòng chọn tỉnh/thành.';
    }
    if (_selectedDistrictCode.isEmpty) {
      return 'Vui lòng chọn quận/huyện.';
    }
    if (_selectedWardCode.isEmpty) {
      return 'Vui lòng chọn phường/xã.';
    }
    if (_addressDetail.trim().isEmpty) {
      return 'Vui lòng nhập địa chỉ chi tiết.';
    }
    return null;
  }

  // Get full address
  String getFullAddress() {
    return '$_addressDetail, $_selectedWardName, $_selectedDistrictName, $_selectedProvinceName';
  }

  double get paymentAmount {
    final amount = _paymentMethod == 'cod' ? _total * 0.1 : _total;
    return amount < 0 ? 0 : amount;
  }

  // Submit order
  Future<Order?> submitOrder({
    required int userId,
    required List<Map<String, dynamic>> items,
  }) async {
    // Validate form first
    final validationError = validateForm();
    if (validationError != null) {
      _error = validationError;
      notifyListeners();
      return null;
    }

    _isSubmitting = true;
    _error = '';
    notifyListeners();

    try {
      final orderData = {
        'user_id': userId,
        'promotion_code': _promoResult['valid'] == true ? _promoCode.trim() : null,
        'payment_method': _paymentMethod,
        'shipping_address': getFullAddress(),
        'is_deposit': false,
        'deposit_status': _paymentMethod == 'cod' ? 'pending' : 'none',
        'items': items.map((item) => {
          'product_id': item['product_id'],
          'quantity': item['quantity'],
        }).toList(),
      };

      final order = await OrderService.checkout(orderData);
      return order;
    } catch (e) {
      _error = 'Lỗi khi đặt hàng: $e';
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
    return null;
  }

  // Reset all
  void reset() {
    _selectedProvinceCode = '';
    _selectedProvinceName = '';
    _selectedDistrictCode = '';
    _selectedDistrictName = '';
    _selectedWardCode = '';
    _selectedWardName = '';
    _addressDetail = '';
    _paymentMethod = 'cod';
    _promoCode = '';
    _promoLoading = false;
    _promoResult = {
      'valid': false,
      'message': '',
      'discount': 0,
      'promotion': null,
    };
    _subTotal = 0;
    _shippingFee = 0;
    _discount = 0;
    _total = 0;
    _isSubmitting = false;
    _error = '';
    _customerPromotions = [];
    _promoListError = '';
    _promoListLoading = false;
    notifyListeners();
  }

  void _recalculateTotal({
    double? subtotal,
    double? shippingFee,
    double? discount,
  }) {
    if (subtotal != null) {
      _subTotal = subtotal;
    }
    if (shippingFee != null) {
      _shippingFee = 0; // giữ phí vận chuyển = 0
    }
    if (discount != null) {
      _discount = discount;
    }
    _total = _subTotal + _shippingFee - _discount;
    if (_total < 0) {
      _total = 0;
    }
  }
}

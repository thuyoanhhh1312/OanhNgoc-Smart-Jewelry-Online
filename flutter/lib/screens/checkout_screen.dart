import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/order_provider.dart';
import '../providers/location_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../models/order_success_arguments.dart';
import '../models/cart.dart';
import '../models/product.dart';
import '../services/payment_service.dart';
import '../theme/app_colors.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart' as colors;
import '../widgets/luxury/luxury_buttons.dart';
import '../widgets/luxury/luxury_product_widgets.dart';
import '../widgets/luxury/luxury_layout_widgets.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late LocationProvider locationProvider;
  late OrderProvider orderProvider;
  late CartProvider cartProvider;
  late AuthProvider authProvider;

  final TextEditingController _promoController = TextEditingController();
  bool _requestedPromos = false;
  bool _isBuyNowFlow = false;
  List<CartItem> _checkoutItems = [];

  @override
  void initState() {
    super.initState();
    locationProvider = context.read<LocationProvider>();
    orderProvider = context.read<OrderProvider>();
    cartProvider = context.read<CartProvider>();
    authProvider = context.read<AuthProvider>();

    Future.microtask(() {
      // Load provinces
      if (locationProvider.provinces.isEmpty) {
        locationProvider.loadProvinces();
      }
      // Load items from buy-now arguments or cart
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadCheckoutItems();
      });

      // Preload khuyến mãi cá nhân nếu đã đăng nhập
      if (authProvider.isLoggedIn && !_requestedPromos) {
        _requestedPromos = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          orderProvider.loadCustomerPromotions();
        });
      }
    });
  }

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  String _formatPrice(double price) {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(1)}M₫';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(0)}K₫';
    } else {
      return '${price.toStringAsFixed(0)}₫';
    }
  }

  void _handleProvinceChange(String? provinceCode, String provinceName) {
    if (provinceCode != null) {
      orderProvider.setProvince(provinceCode, provinceName);
      locationProvider.loadDistricts(provinceCode);
    }
  }

  Future<void> _applyPromoFromCode(
    String code,
    OrderProvider orderProvider,
    CartProvider cartProvider,
    AuthProvider authProvider,
  ) async {
    if (authProvider.user == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập để áp dụng mã khuyến mãi')),
      );
      return;
    }
    _promoController.text = code;
    orderProvider.setPromoCode(code);
    await _handleApplyPromo();
  }

  void _loadCheckoutItems() {
    final args = ModalRoute.of(context)?.settings.arguments;
    List<CartItem> items = [];
    bool isBuyNow = false;

    if (args is Map && args['selectedItems'] is List) {
      final List raw = args['selectedItems'] as List;
      items = raw.map<CartItem?>((item) {
        if (item is CartItem) return item;
        final product = item['product'];
        final qtyRaw = item['quantity'] ?? 1;
        final qty = qtyRaw is int ? qtyRaw : int.tryParse(qtyRaw.toString()) ?? 1;
        if (product is Product) {
          return CartItem(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            product: product,
            quantity: qty,
            addedAt: DateTime.now(),
          );
        }
        return null;
      }).whereType<CartItem>().toList();
      if (items.isNotEmpty) {
        isBuyNow = true;
      }
    }

    if (items.isEmpty) {
      items = List<CartItem>.from(cartProvider.items);
    }

    _isBuyNowFlow = isBuyNow;
    _checkoutItems = items;
    orderProvider.initializeWithCartTotals(
      subtotal: _checkoutItems.fold(0.0, (sum, item) => sum + item.totalPrice),
      shippingFee: 0,
      discount: orderProvider.discount,
    );
    setState(() {});
  }

  String _formatCampaignDuration(String? start, String? end) {
    String fmt(String? value) {
      if (value == null || value.isEmpty) return '';
      try {
        final date = DateTime.parse(value);
        return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
      } catch (_) {
        return value;
      }
    }

    final startStr = fmt(start);
    final endStr = fmt(end);
    if (startStr.isEmpty && endStr.isEmpty) return '';
    if (startStr.isNotEmpty && endStr.isNotEmpty) {
      return 'Hiệu lực: $startStr - $endStr';
    }
    if (startStr.isNotEmpty) return 'Bắt đầu: $startStr';
    return 'Kết thúc: $endStr';
  }

  void _handleDistrictChange(String? districtCode, String districtName) {
    if (districtCode != null) {
      orderProvider.setDistrict(districtCode, districtName);
      // Use the district code directly - no need to convert
      locationProvider.loadWards(districtCode);
    }
  }

  void _handleWardChange(String? wardCode, String wardName) {
    if (wardCode != null) {
      orderProvider.setWard(wardCode, wardName);
    }
  }

  Future<void> _handleApplyPromo() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập để sử dụng mã khuyến mãi')),
      );
      return;
    }

    final userIdInt = int.tryParse(user.id);
    if (userIdInt == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tài khoản không hợp lệ: thiếu user_id dạng số')),
      );
      return;
    }

    // Chuẩn hóa items cho API tính giá (product_id dạng số)
    final promoItems = <Map<String, dynamic>>[];
    for (final item in _checkoutItems) {
      final parsedId = int.tryParse(item.product.id);
      if (parsedId == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể áp dụng mã: mã sản phẩm không hợp lệ')),
        );
        return;
      }
      promoItems.add({
        'product_id': parsedId,
        'quantity': item.quantity,
      });
    }

    await orderProvider.applyPromoCode(
      items: promoItems,
      userId: userIdInt,
    );

    if (!mounted) return;

    if (orderProvider.promoResult['valid'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '✓ ${orderProvider.promoResult['message'] ?? "Áp dụng mã ưu đãi thành công"}',
          ),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            orderProvider.error.isEmpty
                ? orderProvider.promoResult['message'] ?? 'Mã ưu đãi không hợp lệ'
                : orderProvider.error,
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _handleSubmitOrder() async {
    final authProvider = context.read<AuthProvider>();
    final user = authProvider.user;

    if (user == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập để tiếp tục')),
      );
      return;
    }

    final validationError = orderProvider.validateForm();
    if (validationError != null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(validationError),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Prepare order items (buy-now or cart)
    final parsedItems = <Map<String, dynamic>>[];
    for (final item in _checkoutItems) {
      final parsedId = int.tryParse(item.product.id);
      if (parsedId == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể đặt hàng: mã sản phẩm không hợp lệ')),
        );
        return;
      }
      parsedItems.add({
        'product_id': parsedId,
        'quantity': item.quantity,
        'price': item.product.price,
      });
    }

    // Preserve items for success screen
    final purchasedItems = _checkoutItems.map((item) => item.copyWith()).toList();

    // Submit order
    final userIdInt = int.tryParse(user.id);
    if (userIdInt == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tài khoản không hợp lệ: thiếu user_id dạng số')),
      );
      return;
    }

    final order = await orderProvider.submitOrder(
      userId: userIdInt,
      items: parsedItems,
    );

    if (!mounted) return;

    if (order != null) {
      // Clear cart nếu không phải buy-now flow
      if (!_isBuyNowFlow) {
        await cartProvider.clearCart();
      }

      if (!mounted) return;

      if (orderProvider.paymentMethod == 'vnpay') {
        await _openVnPayPayment(order.id, orderProvider.total);
      } else if (orderProvider.paymentMethod == 'cod') {
        // Cọc 10% qua VNPay trước, giống luồng web
        await _openVnPayPayment(order.id, orderProvider.paymentAmount);
      }

      if (!mounted) return;

      final arguments = OrderSuccessArguments(
        order: order,
        purchasedItems: purchasedItems,
      );

      Navigator.of(context).pushNamedAndRemoveUntil(
        '/order-success',
        (route) => false,
        arguments: arguments,
      );
    } else if (orderProvider.error.isNotEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(orderProvider.error),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _openVnPayPayment(String orderId, double amount) async {
    try {
      final paymentUrl = await PaymentService.createVnPayPaymentUrl(
        orderId: orderId,
        amount: amount,
      );

      if (paymentUrl == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể tạo liên kết VNPay')),
        );
        return;
      }

      final uri = Uri.parse(paymentUrl);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể mở VNPay trên thiết bị của bạn')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi khi mở VNPay: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: colors.AppColors.softWhite,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: colors.AppColors.softWhite,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: colors.AppColors.roseGold),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Thanh toán',
          style: TextStyle(
            color: colors.AppColors.warmBlack,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: Consumer4<OrderProvider, LocationProvider, CartProvider, AuthProvider>(
        builder: (context, orderProvider, locationProvider, cartProvider, authProvider, _) {
          if (authProvider.isLoggedIn && !_requestedPromos) {
            _requestedPromos = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              orderProvider.loadCustomerPromotions();
            });
          }
          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Summary
                  _buildOrderSummary(),
                  const SizedBox(height: 24),

                  // Address Section
                  _buildAddressSection(orderProvider, locationProvider),

                  // Payment Method
                  _buildPaymentMethod(orderProvider),
                  const SizedBox(height: 12),
                  _buildPaymentDetails(orderProvider),
                  const SizedBox(height: 24),

                  // Promo Code
                  _buildPromoCodeSection(orderProvider, cartProvider, authProvider),
                  const SizedBox(height: 24),

                  // Price Summary
                  _buildPriceSummary(orderProvider, cartProvider),
                  const SizedBox(height: 24),

                  // Submit Button
                  LuxuryPrimaryButton(
                    onPressed: orderProvider.isSubmitting
                        ? null
                        : _handleSubmitOrder,
                    text: 'ĐẶT HÀNG',
                    width: double.infinity,
                    height: 56,
                    isLoading: orderProvider.isSubmitting,
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildOrderSummary() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Sản phẩm trong đơn hàng',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 12),
          if (_checkoutItems.isEmpty)
            const Text(
              'Chưa có sản phẩm.',
              style: TextStyle(color: Colors.grey),
            ),
          ..._checkoutItems.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.product.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'x${item.quantity}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  _formatPrice(item.totalPrice),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.goldColor,
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildAddressSection(
    OrderProvider orderProvider,
    LocationProvider locationProvider,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Địa chỉ giao hàng',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 12),

        // Province
        _buildLocationDropdown(
          label: 'Tỉnh/Thành',
          isLoading: locationProvider.provincesLoading,
          items: locationProvider.provinces,
          value: orderProvider.selectedProvinceCode,
          onChanged: (code, name) => _handleProvinceChange(code, name),
        ),
        const SizedBox(height: 12),

        // District
        _buildLocationDropdown(
          label: 'Quận/Huyện',
          isLoading: locationProvider.districtsLoading,
          items: locationProvider.districts,
          value: orderProvider.selectedDistrictCode,
          enabled: orderProvider.selectedProvinceCode.isNotEmpty,
          onChanged: (code, name) => _handleDistrictChange(code, name),
        ),
        const SizedBox(height: 12),

        // Ward
        _buildLocationDropdown(
          label: 'Phường/Xã',
          isLoading: locationProvider.wardsLoading,
          items: locationProvider.wards,
          value: orderProvider.selectedWardCode,
          enabled: orderProvider.selectedDistrictCode.isNotEmpty,
          onChanged: (code, name) => _handleWardChange(code, name),
        ),
        const SizedBox(height: 12),

        // Address Detail
        TextField(
          onChanged: (value) => orderProvider.setAddressDetail(value),
          decoration: InputDecoration(
            labelText: 'Địa chỉ chi tiết',
            hintText: 'Số nhà, tên đường...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildLocationDropdown({
    required String label,
    required bool isLoading,
    required List<Map<String, dynamic>> items,
    required String value,
    required Function(String?, String) onChanged,
    bool enabled = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        isLoading
            ? const SizedBox(
          height: 48,
          child: Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        )
            : DropdownButtonFormField<String>(
          initialValue: value.isEmpty ? null : value,
          items: items
              .map<DropdownMenuItem<String>>(
                (item) => DropdownMenuItem<String>(
                  value: (item['code'] ?? item['id']).toString(),
                  child: Text(item['name']?.toString() ?? ''),
                ),
              )
              .toList(),
          onChanged: enabled
              ? (selectedCode) {
            if (selectedCode != null) {
              // Convert selectedCode to int for comparison if needed
              final codeAsString = selectedCode.toString();
              final selectedItem = items.firstWhere(
                (item) {
                  final itemCode = (item['code'] ?? item['id']).toString();
                  return itemCode == codeAsString;
                },
              );
              onChanged(selectedCode, selectedItem['name'] ?? '');
            }
          }
              : null,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: enabled ? Colors.grey[300]! : Colors.grey[200]!,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethod(OrderProvider orderProvider) {
    final List<Map<String, String>> paymentOptions = [
      {
        'value': 'cod',
        'title': '💳 Thanh toán khi nhận hàng (COD)',
        'subtitle': 'Cọc 10% qua VNPay, thanh toán 90% khi nhận hàng',
      },
      {
        'value': 'vnpay',
        'title': '🏦 Thanh toán qua VNPay',
        'subtitle': 'Thanh toán toàn bộ qua cổng VNPay sau khi đặt hàng',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Phương thức thanh toán',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 12),
        ...paymentOptions.map(
          (option) {
            final value = option['value']!;
            final isSelected = orderProvider.paymentMethod == value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: () => orderProvider.setPaymentMethod(value),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isSelected ? AppColors.goldColor : Colors.grey[300]!,
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(8),
                    color: isSelected ? AppColors.goldColor.withValues(alpha: 0.05) : Colors.transparent,
                  ),
                  child: Row(
                    children: [
                      _buildSelectionIndicator(isSelected),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                            option['title']!,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              option['subtitle']!,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildPaymentDetails(
    OrderProvider orderProvider,
  ) {
    final amount = orderProvider.paymentAmount;
    if (amount <= 0) {
      return _buildInfoBanner(
        title: 'Không thể hiển thị thông tin thanh toán',
        message: 'Giá trị đơn hàng không hợp lệ, vui lòng kiểm tra lại.',
        icon: Icons.warning_amber_rounded,
      );
    }

    if (orderProvider.paymentMethod == 'vnpay') {
      return _buildInfoBanner(
        title: 'Thanh toán qua VNPay',
        message: 'Sau khi đặt hàng, bạn sẽ được chuyển sang cổng VNPay để thanh toán toàn bộ số tiền.',
        icon: Icons.link,
      );
    }

    // COD với cọc 10% qua VNPay
    return _buildInfoBanner(
      title: 'Thanh toán khi nhận hàng (COD)',
      message:
          'Bạn sẽ thanh toán 10% giá trị đơn hàng qua VNPay để giữ đơn (khoảng ${_formatPrice(amount)}). '
          'Phần còn lại thanh toán khi nhận hàng.',
      icon: Icons.verified,
    );
  }

  Widget _buildInfoBanner({
    required String title,
    required String message,
    IconData icon = Icons.info_outline,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: AppColors.creamColor,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.goldColor),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoCodeSection(
    OrderProvider orderProvider,
    CartProvider cartProvider,
    AuthProvider authProvider,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mã ưu đãi',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _promoController,
                onChanged: (value) => orderProvider.setPromoCode(value),
                enabled: !orderProvider.promoLoading,
                decoration: InputDecoration(
                  hintText: 'Nhập mã ưu đãi...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                  suffixIcon: orderProvider.promoLoading
                      ? const Padding(
                    padding: EdgeInsets.all(8),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                      : null,
                ),
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: orderProvider.promoLoading ? null : _handleApplyPromo,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.goldColor,
                disabledBackgroundColor: Colors.grey[300],
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: Text(
                orderProvider.promoResult['valid'] == true ? '✓ Áp dụng' : 'Áp dụng',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        if (orderProvider.promoResult['valid'] == true)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              orderProvider.promoResult['message'] ?? '',
              style: const TextStyle(
                color: Colors.green,
                fontSize: 12,
              ),
            ),
          ),
        if (authProvider.isLoggedIn) ...[
          const SizedBox(height: 14),
          Text(
            'Khuyến mãi của bạn',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 10),
          if (orderProvider.promoListLoading)
            const Center(child: CircularProgressIndicator(strokeWidth: 2))
          else if (orderProvider.promoListError.isNotEmpty)
            Text(
              orderProvider.promoListError,
              style: const TextStyle(color: Colors.red, fontSize: 12),
            )
          else if (orderProvider.customerPromotions.isEmpty)
            Text(
              'Hiện chưa có mã khuyến mãi nào khả dụng.',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            )
          else
            Column(
              children: orderProvider.customerPromotions.map((promo) {
                final code = promo['promotion_code']?.toString() ?? '';
                final discount = promo['discount'];
                final desc = promo['description']?.toString();
                final campaign = promo['campaign'] as Map<String, dynamic>?;
                final start = campaign?['start_date'] as String?;
                final end = campaign?['end_date'] as String?;
                return Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              code,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                          ),
                          ElevatedButton(
                            onPressed: code.isEmpty || orderProvider.promoLoading
                                ? null
                                : () => _applyPromoFromCode(
                                      code,
                                      orderProvider,
                                      cartProvider,
                                      authProvider,
                                    ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.goldColor,
                              minimumSize: const Size(90, 36),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            child: const Text(
                              'Áp dụng',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (discount != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            'Giảm ${discount.toString()}%',
                            style: const TextStyle(
                              color: Color(0xFF00796B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      if (desc != null && desc.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            desc,
                            style: TextStyle(
                              color: Colors.grey[700],
                              fontSize: 12.5,
                              height: 1.4,
                            ),
                          ),
                        ),
                      if (start != null || end != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            _formatCampaignDuration(start, end),
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              }).toList(),
            ),
        ],
      ],
    );
  }

  Widget _buildPriceSummary(
    OrderProvider orderProvider,
    CartProvider cartProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
        color: Colors.grey[50],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tổng tiền',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),
          _priceRow('Tạm tính', orderProvider.subTotal),
          if (orderProvider.discount > 0) ...[
            const SizedBox(height: 8),
            _priceRow(
              'Giảm giá',
              -orderProvider.discount,
              color: Colors.green,
            ),
          ],
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: Colors.grey[300]),
          ),
          _priceRow(
            'Tổng cộng',
            orderProvider.total,
            isBold: true,
            fontSize: 16,
            color: AppColors.goldColor,
          ),
        ],
      ),
    );
  }

  Widget _priceRow(
    String label,
    double price, {
    Color color = Colors.black,
    bool isBold = false,
    double fontSize = 14,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            fontSize: fontSize,
          ),
        ),
        Text(
          price < 0 ? '-${_formatPrice(price.abs())}' : _formatPrice(price),
          style: TextStyle(
            color: color,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            fontSize: fontSize,
          ),
        ),
      ],
    );
  }

  Widget _buildSelectionIndicator(bool isSelected) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: isSelected ? AppColors.goldColor : Colors.grey[400]!,
          width: 2,
        ),
        color: isSelected ? AppColors.goldColor : Colors.transparent,
      ),
      child: isSelected
          ? const Icon(
              Icons.check,
              size: 12,
              color: Colors.white,
            )
          : null,
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/order_provider.dart';
import '../providers/location_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/payment_provider.dart';
import '../models/order_success_arguments.dart';
import '../services/payment_service.dart';
import '../theme/app_colors.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart' as colors;
import '../widgets/luxury/luxury_buttons.dart';
import '../widgets/luxury/luxury_product_widgets.dart';
import '../widgets/luxury/luxury_layout_widgets.dart';

const _codBankName = 'MB Bank';
const _codBankCode = 'MBbank';
const _codAccountNumber = '0816837690';
const _codAccountHolder = 'SMART JEWELRY';
const _momoAccountNumber = '99MM23332M53758772';
const _momoAccountHolder = 'SMART JEWELRY';
const _defaultTransferDescription = 'Thanh toan don hang Smart Jewelry';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late LocationProvider locationProvider;
  late OrderProvider orderProvider;
  late CartProvider cartProvider;
  late PaymentProvider paymentProvider;

  @override
  void initState() {
    super.initState();
    locationProvider = context.read<LocationProvider>();
    orderProvider = context.read<OrderProvider>();
    cartProvider = context.read<CartProvider>();
    paymentProvider = context.read<PaymentProvider>();

    Future.microtask(() {
      // Load provinces
      if (locationProvider.provinces.isEmpty) {
        locationProvider.loadProvinces();
      }
      if (paymentProvider.bankAccounts.isEmpty) {
        paymentProvider.loadBankAccounts();
      }

      // Initialize order with cart totals
      orderProvider.initializeWithCartTotals(
        subtotal: cartProvider.subtotal,
        shippingFee: cartProvider.shippingFee,
        discount: 0,
      );
    });
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

  void _handleApplyPromo() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập để sử dụng mã khuyến mãi')),
      );
      return;
    }

    final items = cartProvider.items
        .map((item) => {
          'product_id': item.product.id,
          'quantity': item.quantity,
          'price': item.product.price,
        })
        .toList();

    await orderProvider.applyPromoCode(
      items: items,
      userId: user.id,
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

    // Prepare order items
    final items = cartProvider.items
        .map((item) => {
          'product_id': item.product.id,
          'quantity': item.quantity,
          'price': item.product.price,
        })
        .toList();

    // Preserve cart items for success screen before clearing
    final purchasedItems = cartProvider.items
        .map((item) => item.copyWith())
        .toList();

    // Submit order
    final order = await orderProvider.submitOrder(
      userId: user.id,
      items: items,
    );

    if (!mounted) return;

    if (order != null) {
      // Clear cart
      await cartProvider.clearCart();

      if (!mounted) return;

      if (orderProvider.paymentMethod == 'vnpay') {
        await _openVnPayPayment(order.id, orderProvider.total);
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
      body: Consumer5<OrderProvider, LocationProvider, CartProvider, AuthProvider, PaymentProvider>(
        builder: (context, orderProvider, locationProvider, cartProvider, authProvider, paymentProvider, _) {
          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Summary
                  _buildOrderSummary(cartProvider),
                  const SizedBox(height: 24),

                  // Address Section
                  _buildAddressSection(orderProvider, locationProvider),

                  // Payment Method
                  _buildPaymentMethod(orderProvider, paymentProvider),
                  if (orderProvider.paymentMethod == 'ck') ...[
                    const SizedBox(height: 12),
                    _buildBankSelection(paymentProvider),
                  ],
                  const SizedBox(height: 12),
                  _buildPaymentDetails(orderProvider, paymentProvider),
                  const SizedBox(height: 24),

                  // Promo Code
                  _buildPromoCodeSection(orderProvider),
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

  Widget _buildOrderSummary(CartProvider cartProvider) {
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
          ...cartProvider.items.map((item) => Padding(
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

  Widget _buildPaymentMethod(OrderProvider orderProvider, PaymentProvider paymentProvider) {
    final List<Map<String, String>> paymentOptions = [
      {
        'value': 'cod',
        'title': '💳 Thanh toán khi nhận hàng (COD)',
        'subtitle': 'Đặt cọc 10% giá trị đơn hàng qua MB Bank',
      },
      {
        'value': 'momo',
        'title': '📱 Thanh toán qua MoMo',
        'subtitle': 'Thanh toán toàn bộ bằng ví MoMo',
      },
      {
        'value': 'ck',
        'title': '🏧 Chuyển khoản ngân hàng',
        'subtitle': paymentProvider.selectedBank != null
            ? '${paymentProvider.selectedBank!.bankName} - ${paymentProvider.selectedBank!.accountNumber}'
            : 'Chọn ngân hàng để thanh toán toàn bộ đơn hàng',
      },
      {
        'value': 'vnpay',
        'title': '🏦 Thanh toán qua VNPay',
        'subtitle': 'Chuyển hướng tới cổng VNPay sau khi đặt hàng',
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

  Widget _buildBankSelection(PaymentProvider paymentProvider) {
    if (paymentProvider.isLoading) {
      return const SizedBox(
        height: 60,
        child: Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    if (paymentProvider.error != null) {
      return Text(
        paymentProvider.error ?? '',
        style: const TextStyle(color: AppColors.errorColor),
      );
    }

    if (paymentProvider.bankAccounts.isEmpty) {
      return const Text(
        'Hiện chưa có tài khoản ngân hàng nào khả dụng.',
        style: TextStyle(color: AppColors.errorColor),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Chọn ngân hàng',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 8),
        InputDecorator(
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: paymentProvider.selectedBank?.id,
              isExpanded: true,
              items: paymentProvider.bankAccounts
                  .map(
                    (bank) => DropdownMenuItem<int>(
                      value: bank.id,
                      child: Text('${bank.bankName} - ${bank.accountNumber}'),
                    ),
                  )
                  .toList(),
              onChanged: (value) => paymentProvider.selectBank(value),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentDetails(
    OrderProvider orderProvider,
    PaymentProvider paymentProvider,
  ) {
    final amount = orderProvider.paymentAmount;
    if (orderProvider.paymentMethod == 'vnpay') {
      return _buildInfoBanner(
        title: 'Thanh toán qua VNPay',
        message: 'Sau khi đặt hàng, bạn sẽ được chuyển sang cổng VNPay để thanh toán toàn bộ số tiền.',
        icon: Icons.link,
      );
    }

    if (amount <= 0) {
      return _buildInfoBanner(
        title: 'Không thể hiển thị thông tin thanh toán',
        message: 'Giá trị đơn hàng không hợp lệ, vui lòng kiểm tra lại.',
        icon: Icons.warning_amber_rounded,
      );
    }

    late final String title;
    late final String bankName;
    late final String accountNumber;
    late final String accountHolder;
    late final String description;
    late final String helperText;
    late final String qrUrl;

    switch (orderProvider.paymentMethod) {
      case 'cod':
        title = 'Đặt cọc giữ đơn (10%)';
        bankName = _codBankName;
        accountNumber = _codAccountNumber;
        accountHolder = _codAccountHolder;
        description = 'Thanh toan dat coc';
        helperText = 'Vui lòng chuyển khoản 10% giá trị đơn hàng để xác nhận giao dịch.';
        qrUrl = _buildVietQrUrl(
          bankCode: _codBankCode,
          accountNumber: accountNumber,
          amount: amount,
          description: description,
        );
        break;
      case 'momo':
        title = 'Thanh toán qua ví MoMo';
        bankName = 'Ví MoMo';
        accountNumber = _momoAccountNumber;
        accountHolder = _momoAccountHolder;
        description = _defaultTransferDescription;
        helperText = 'Quét mã hoặc nhập thông tin ví để thanh toán toàn bộ đơn hàng.';
        qrUrl = _buildTextQrUrl(
          'PAYMENT|MOMO|$accountNumber|${amount.round()}|$description',
        );
        break;
      case 'ck':
        final bank = paymentProvider.selectedBank;
        if (bank == null) {
          return _buildInfoBanner(
            title: 'Chuyển khoản ngân hàng',
            message: paymentProvider.bankAccounts.isEmpty
                ? 'Hiện chưa có tài khoản ngân hàng nào khả dụng.'
                : 'Vui lòng chọn tài khoản ngân hàng để tiếp tục.',
            icon: Icons.account_balance,
          );
        }
        title = 'Chuyển khoản ngân hàng';
        bankName = bank.bankName;
        accountNumber = bank.accountNumber;
        accountHolder = bank.accountName ?? _codAccountHolder;
        description = _defaultTransferDescription;
        helperText = 'Quét mã VietQR hoặc nhập thông tin bên dưới để thanh toán toàn bộ đơn hàng.';
        final bankCode = bank.bankCode?.isNotEmpty == true ? bank.bankCode! : _codBankCode;
        qrUrl = _buildVietQrUrl(
          bankCode: bankCode,
          accountNumber: bank.accountNumber,
          amount: amount,
          description: description,
        );
        break;
      default:
        return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
      ),
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
          const SizedBox(height: 8),
          Text(
            helperText,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPaymentInfoRow('Số tiền cần thanh toán', _formatPrice(amount)),
                    const SizedBox(height: 8),
                    _buildPaymentInfoRow('Ngân hàng/ Ví', bankName),
                    _buildPaymentInfoRow('Số tài khoản', accountNumber),
                    _buildPaymentInfoRow('Chủ tài khoản', accountHolder),
                    _buildPaymentInfoRow('Nội dung chuyển khoản', description),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  qrUrl,
                  width: 140,
                  height: 140,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return const SizedBox(
                      width: 140,
                      height: 140,
                      child: Center(
                        child: Icon(Icons.qr_code, size: 48, color: Colors.grey),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
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

  Widget _buildPaymentInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 2),
          SelectableText(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  String _buildVietQrUrl({
    required String bankCode,
    required String accountNumber,
    required double amount,
    required String description,
  }) {
    final amountValue = amount <= 0 ? 0 : amount.round();
    final encodedInfo = Uri.encodeComponent(description);
    return 'https://img.vietqr.io/image/$bankCode-$accountNumber-compact2.png?amount=$amountValue&addInfo=$encodedInfo';
  }

  String _buildTextQrUrl(String content) {
    final encoded = Uri.encodeComponent(content);
    return 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=$encoded&choe=UTF-8';
  }

  Widget _buildPromoCodeSection(OrderProvider orderProvider) {
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
          const SizedBox(height: 8),
          _priceRow('Phí vận chuyển', orderProvider.shippingFee),
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

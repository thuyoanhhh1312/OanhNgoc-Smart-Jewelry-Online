import 'package:flutter/material.dart';
import '../models/cart.dart';
import '../models/order.dart';
import '../theme/app_colors.dart';

class OrderSuccessScreen extends StatefulWidget {
  final Order order;
  final List<CartItem> purchasedItems;

  const OrderSuccessScreen({
    super.key,
    required this.order,
    this.purchasedItems = const [],
  });

  @override
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Success Animation
              ScaleTransition(
                scale: _scaleAnimation,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    size: 60,
                    color: Colors.green,
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Success Message
              const Text(
                'ĐẶT HÀNG THÀNH CÔNG!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 12),

              Text(
                'Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xác nhận đơn hàng trong thời gian sớm nhất.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 32),

              // Order Details Card
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Order ID
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Mã đơn hàng:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          widget.order.orderNumber,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppColors.goldColor,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // Order Date
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Ngày đặt hàng:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          _formatOrderDate(widget.order.createdAt),
                          style: const TextStyle(fontSize: 14),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // Status
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Trạng thái:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          widget.order.statusText,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: _statusColor ?? Colors.orange,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // Shipping Address
                    const Text(
                      'Địa chỉ giao hàng:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _shippingAddressText,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                    ),
                    const Divider(height: 24),

                    // Items Summary
                    const Text(
                      'Sản phẩm đã đặt:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ..._buildOrderedItems(),
                    const Divider(height: 24),

                    // Total Price
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tổng cộng:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _formatPrice(widget.order.total),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.goldColor,
                          ),
                        ),
                      ],
                    ),

                    // Payment Method
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Phương thức thanh toán:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          widget.order.paymentMethodText,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ],
                    ),

                    // Payment Status
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Trạng thái thanh toán:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          widget.order.paymentStatusText,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: widget.order.paymentStatus == PaymentStatus.paid
                                ? Colors.green
                                : Colors.orange,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Next Steps
              Container(
                decoration: BoxDecoration(
                  color: AppColors.creamColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Bước tiếp theo:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildNextStep('1', 'Chúng tôi sẽ gửi xác nhận đơn hàng qua email'),
                    const SizedBox(height: 8),
                    _buildNextStep('2', 'Đơn hàng sẽ được chuẩn bị và gói hàng'),
                    const SizedBox(height: 8),
                    _buildNextStep('3', 'Bạn sẽ nhận được thông báo khi hàng được giao'),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Action Buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                    '/home',
                    (route) => false,
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.goldColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'TIẾP TỤC MUA SẮM',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                    '/main',
                    (route) => false,
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.goldColor),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'XEM ĐƠN HÀNG CỦA TÔI',
                    style: TextStyle(
                      color: AppColors.goldColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  String get _shippingAddressText {
    final address = widget.order.shippingAddress.trim();
    if (address.isNotEmpty) {
      return address;
    }
    return 'Đang cập nhật';
  }

  Color? get _statusColor {
    final hex = widget.order.statusColor;
    if (hex == null || hex.isEmpty) return null;
    final normalized = hex.replaceAll('#', '');
    final padded = normalized.length >= 6
        ? normalized.substring(normalized.length - 6)
        : normalized.padLeft(6, '0');
    try {
      return Color(int.parse('0xff$padded'));
    } catch (_) {
      return null;
    }
  }

  List<Widget> _buildOrderedItems() {
    final orderItems = widget.order.items;
    if (orderItems.isNotEmpty) {
      return orderItems
          .map((item) => _buildItemRow(
                name: item.displayName,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
              ))
          .toList();
    }

    if (widget.purchasedItems.isNotEmpty) {
      return widget.purchasedItems
          .map((item) => _buildItemRow(
                name: item.product.name,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
              ))
          .toList();
    }

    return [
      Text(
        'Không có sản phẩm trong đơn hàng',
        style: TextStyle(
          fontSize: 13,
          color: Colors.grey[600],
        ),
      ),
    ];
  }

  Widget _buildItemRow({
    required String name,
    required int quantity,
    required double totalPrice,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'x$quantity',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Text(
            _formatPrice(totalPrice),
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.goldColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNextStep(String number, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            color: AppColors.goldColor,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              text,
              style: const TextStyle(fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }

  String _formatOrderDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}

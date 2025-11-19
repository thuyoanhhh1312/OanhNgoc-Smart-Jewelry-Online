import 'cart.dart';
import 'order.dart';

class OrderSuccessArguments {
  final Order order;
  final List<CartItem> purchasedItems;

  const OrderSuccessArguments({
    required this.order,
    this.purchasedItems = const [],
  });
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/promotion_service.dart';
import '../../theme/app_colors.dart' as theme;
import '../../constants/app_colors.dart' as colors;

class MyPromotionsScreen extends StatefulWidget {
  const MyPromotionsScreen({super.key});

  @override
  State<MyPromotionsScreen> createState() => _MyPromotionsScreenState();
}

class _MyPromotionsScreenState extends State<MyPromotionsScreen> {
  bool _loading = false;
  String _error = '';
  List<Map<String, dynamic>> _promotions = [];

  @override
  void initState() {
    super.initState();
    _loadPromotions();
  }

  Future<void> _loadPromotions() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) return;

    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final promos = await PromotionService.getCustomerPromotions();
      // Lọc chỉ những mã còn dùng được (usage_limit == null hoặc usage_count < usage_limit)
      final filtered = promos.where((p) {
        final limit = p['usage_limit'];
        final used = p['usage_count'] ?? 0;
        if (limit == null) return true;
        if (limit is num) return used is num ? used < limit : true;
        return true;
      }).toList();
      setState(() {
        _promotions = filtered;
      });
    } catch (e) {
      setState(() {
        _error = 'Không thể tải khuyến mãi: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Khuyến mãi của tôi'),
        backgroundColor: colors.AppColors.softWhite,
        foregroundColor: colors.AppColors.warmBlack,
        elevation: 0,
      ),
      backgroundColor: colors.AppColors.softWhite,
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: auth.isLoggedIn
            ? _buildContent()
            : _buildLoginPrompt(context),
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error.isNotEmpty) {
      return Center(
        child: Text(
          _error,
          style: const TextStyle(color: Colors.red),
          textAlign: TextAlign.center,
        ),
      );
    }
    if (_promotions.isEmpty) {
      return Center(
        child: Text(
          'Hiện chưa có mã khuyến mãi khả dụng.',
          style: TextStyle(color: Colors.grey[700]),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadPromotions,
      child: ListView.separated(
        itemCount: _promotions.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final promo = _promotions[index];
          final code = promo['promotion_code']?.toString() ?? '';
          final discount = promo['discount'];
          final desc = promo['description']?.toString();
          final campaign = promo['campaign'] as Map<String, dynamic>?;
          final start = campaign?['start_date'] as String?;
          final end = campaign?['end_date'] as String?;
          return _buildPromoCard(code, discount, desc, start, end);
        },
      ),
    );
  }

  Widget _buildPromoCard(
    String code,
    dynamic discount,
    String? description,
    String? start,
    String? end,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
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
                    fontSize: 16,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: theme.AppColors.goldColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Có thể dùng',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (discount != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                'Giảm $discount%',
                style: const TextStyle(
                  color: Color(0xFF00796B),
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ),
          if (description != null && description.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                description,
                style: TextStyle(
                  color: Colors.grey[700],
                  height: 1.4,
                ),
              ),
            ),
          if (start != null || end != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                _formatDuration(start, end),
                style: TextStyle(
                  color: Colors.grey[600],
                  fontStyle: FontStyle.italic,
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLoginPrompt(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Vui lòng đăng nhập để xem khuyến mãi của bạn',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.AppColors.goldColor,
            ),
            child: const Text('Đăng nhập'),
          ),
        ],
      ),
    );
  }

  String _formatDuration(String? start, String? end) {
    String fmt(String? value) {
      if (value == null || value.isEmpty) return '';
      try {
        final dt = DateTime.parse(value);
        return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
      } catch (_) {
        return value;
      }
    }

    final s = fmt(start);
    final e = fmt(end);
    if (s.isEmpty && e.isEmpty) return '';
    if (s.isNotEmpty && e.isNotEmpty) return 'Hiệu lực: $s - $e';
    if (s.isNotEmpty) return 'Bắt đầu: $s';
    return 'Kết thúc: $e';
  }
}

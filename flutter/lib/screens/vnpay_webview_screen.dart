import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../constants/app_colors.dart' as colors;

class VnPayWebViewScreen extends StatefulWidget {
  final String paymentUrl;
  final String orderId;

  const VnPayWebViewScreen({
    super.key,
    required this.paymentUrl,
    required this.orderId,
  });

  @override
  State<VnPayWebViewScreen> createState() => _VnPayWebViewScreenState();
}

class _VnPayWebViewScreenState extends State<VnPayWebViewScreen>
    with WidgetsBindingObserver {
  late WebViewController _webViewController;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeWebView();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Clean up WebViewController to prevent memory leaks
    _webViewController.clearCache();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Khi quay lại app từ VNPay app, tắt overlay để tránh màn hình đen
    if (state == AppLifecycleState.resumed && mounted) {
      setState(() => _isLoading = false);
    }
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => _isLoading = true);
            _checkPaymentStatus(url);
          },
          onPageFinished: (String url) {
            setState(() => _isLoading = false);
            _checkPaymentStatus(url);
          },
          onWebResourceError: (WebResourceError error) {
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Lỗi: ${error.description}')),
            );
          },
          onNavigationRequest: (NavigationRequest request) {
            return _handleNavigationRequest(request.url);
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  NavigationDecision _handleNavigationRequest(String url) {
    final handled = _checkPaymentStatus(url);
    if (handled) {
      return NavigationDecision.prevent;
    }

    final uri = Uri.tryParse(url);
    // Nếu là custom scheme (mở app VNPay hoặc callback) mà không có response code, tránh giữ overlay đen
    if (uri != null &&
        uri.scheme.isNotEmpty &&
        uri.scheme != 'http' &&
        uri.scheme != 'https') {
      if (mounted) {
        setState(() => _isLoading = false);
        // coi như hủy giao dịch để không kẹt màn đen
        Future.microtask(() {
          if (mounted) Navigator.pop(context, false);
        });
      }
      return NavigationDecision.prevent;
    }

    return NavigationDecision.navigate;
  }

  bool _checkPaymentStatus(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;

    if (uri.queryParameters.containsKey('vnp_ResponseCode')) {
      final responseCode = uri.queryParameters['vnp_ResponseCode'] ?? '';

      if (responseCode == '00') {
        _handlePaymentSuccess();
      } else {
        _handlePaymentFailure(responseCode);
      }
      return true;
    }
    return false;
  }

  void _handlePaymentSuccess() {
    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✓ Thanh toán thành công'),
        backgroundColor: Colors.green,
      ),
    );

    Future.delayed(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      Navigator.of(context).pop(true);
    });
  }

  void _handlePaymentFailure(String responseCode) {
    final messages = {
      '01': 'Giao dịch không thành công',
      '02': 'Ngân hàng từ chối giao dịch',
      '04': 'Giao dịch bị hủy',
      '05': 'Giao dịch không thành công',
      '06': 'Giao dịch chưa hoàn tất',
      '07': 'Giao dịch không hợp lệ',
      '09': 'Giao dịch bị từ chối',
    };

    final message =
        messages[responseCode] ??
        'Thanh toán không thành công (Mã lỗi: $responseCode)';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );

    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() => _isLoading = false);
      Navigator.of(context).pop(false);
    });
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
          onPressed: () {
            // Safe pop with false result (payment cancelled)
            if (mounted) {
              Navigator.pop(context, false);
            }
          },
        ),
        title: const Text(
          'Thanh toán VNPay',
          style: TextStyle(
            color: colors.AppColors.warmBlack,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _webViewController),
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    colors.AppColors.roseGold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

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

class _VnPayWebViewScreenState extends State<VnPayWebViewScreen> {
  late WebViewController _webViewController;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  @override
  void dispose() {
    // Clean up WebViewController to prevent memory leaks
    _webViewController.clearCache();
    super.dispose();
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
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Lỗi: ${error.description}')),
            );
          },
          onNavigationRequest: (NavigationRequest request) {
            _checkPaymentStatus(request.url);
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  void _checkPaymentStatus(String url) {
    final uri = Uri.parse(url);

    if (uri.queryParameters.containsKey('vnp_ResponseCode')) {
      final responseCode = uri.queryParameters['vnp_ResponseCode'] ?? '';

      if (responseCode == '00') {
        _handlePaymentSuccess();
      } else {
        _handlePaymentFailure(responseCode);
      }
    }
  }

  void _handlePaymentSuccess() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✓ Thanh toán thành công'),
        backgroundColor: Colors.green,
      ),
    );

    Future.delayed(const Duration(seconds: 1), () {
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

    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
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

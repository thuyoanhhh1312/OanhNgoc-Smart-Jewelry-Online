import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';

class VerifyOtpScreen extends StatefulWidget {
  const VerifyOtpScreen({super.key});

  @override
  State<VerifyOtpScreen> createState() => _VerifyOtpScreenState();
}

class _VerifyOtpScreenState extends State<VerifyOtpScreen> {
  static const _otpLength = 6;
  static const _resendInterval = 60;

  final List<TextEditingController> _controllers =
      List.generate(_otpLength, (_) => TextEditingController());
  final List<FocusNode> _focusNodes =
      List.generate(_otpLength, (_) => FocusNode());

  Timer? _timer;
  int _secondsRemaining = _resendInterval;
  bool _isVerifying = false;
  bool _isResending = false;
  String? _email;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map && args['email'] is String) {
      _email = args['email'] as String;
    }
    _email ??= '';
    if (_email!.isEmpty) {
      Future.microtask(() {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng nhập email trước khi xác thực OTP.'),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.of(context).pop();
      });
    }
    if (_secondsRemaining == _resendInterval) {
      _startTimer();
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _secondsRemaining = _resendInterval);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (timer.tick >= _resendInterval) {
        timer.cancel();
        setState(() => _secondsRemaining = 0);
      } else {
        setState(() => _secondsRemaining = _resendInterval - timer.tick);
      }
    });
  }

  void _onOtpChanged(int index, String value) {
    if (value.length > 1) {
      value = value.substring(value.length - 1);
    }
    if (!RegExp(r'^[0-9]?$').hasMatch(value)) {
      return;
    }

    _controllers[index].text = value;
    _controllers[index].selection =
        TextSelection.collapsed(offset: value.length);

    if (value.isNotEmpty && index < _otpLength - 1) {
      _focusNodes[index + 1].requestFocus();
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _controllers.map((c) => c.text).join();
    if (otp.length != _otpLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập đủ 6 số OTP.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    if ((_email ?? '').isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Email không hợp lệ.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isVerifying = true);
    final authProvider = context.read<AuthProvider>();
    final token = await authProvider.verifyPasswordResetOtp(
      email: _email!,
      otp: otp,
    );
    setState(() => _isVerifying = false);

    if (!mounted) return;

    if (token != null) {
      Navigator.of(context).pushNamed(
        '/forgot-password/reset',
        arguments: {'token': token, 'email': _email},
      );
    } else if (authProvider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error!),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _handleResendOtp() async {
    if (_secondsRemaining > 0 || (_email ?? '').isEmpty) return;

    setState(() => _isResending = true);
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.sendPasswordResetOtp(email: _email!);
    setState(() => _isResending = false);

    if (!mounted) return;

    if (success) {
      for (final controller in _controllers) {
        controller.clear();
      }
      _focusNodes.first.requestFocus();
      _startTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã gửi lại OTP.'),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (authProvider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error!),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.4),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.sms_outlined,
                  color: AppColors.primary,
                  size: 32,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Nhập mã OTP',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Mã gồm 6 chữ số đã được gửi tới email ${_email ?? ''}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[700],
                    ),
              ),
              const SizedBox(height: 32),
              Center(
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  alignment: WrapAlignment.center,
                  children: List.generate(_otpLength, (index) {
                    return SizedBox(
                      width: 56,
                      child: TextField(
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLength: 1,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        decoration: InputDecoration(
                          counterText: '',
                          filled: true,
                          fillColor: AppColors.surface,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2),
                          ),
                        ),
                        onChanged: (value) => _onOtpChanged(index, value),
                        onSubmitted: (_) {
                          if (index == _otpLength - 1) {
                            _handleVerifyOtp();
                          }
                        },
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 32),
              CustomButton(
                onPressed: _handleVerifyOtp,
                isLoading: _isVerifying,
                child: const Text('Xác thực OTP'),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: _secondsRemaining == 0 && !_isResending
                    ? _handleResendOtp
                    : null,
                child: _isResending
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        _secondsRemaining > 0
                            ? 'Gửi lại OTP sau ${_secondsRemaining}s'
                            : 'Gửi lại OTP',
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../constants/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendResetEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.forgotPassword(email: _emailController.text.trim());
      
      setState(() {
        _emailSent = true;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email khôi phục mật khẩu đã được gửi!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
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
          icon: Icon(Icons.arrow_back, color: AppColors.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Quên mật khẩu',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              const SizedBox(height: 40),
              Icon(
                _emailSent ? Icons.check_circle : Icons.lock_reset,
                size: 80,
                color: _emailSent ? Colors.green : AppColors.primary,
              ),
              const SizedBox(height: 24),
              Text(
                _emailSent ? 'Email đã được gửi!' : 'Khôi phục mật khẩu',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                _emailSent
                    ? 'Vui lòng kiểm tra email của bạn và làm theo hướng dẫn để đặt lại mật khẩu.'
                    : 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi link khôi phục mật khẩu.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.grey[600],
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),

              if (!_emailSent) ...[
                // Form
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      CustomTextField(
                        controller: _emailController,
                        label: 'Email',
                        hint: 'Nhập email của bạn',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Vui lòng nhập email';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                              .hasMatch(value)) {
                            return 'Email không hợp lệ';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 32),
                      CustomButton(
                        onPressed: _sendResetEmail,
                        isLoading: _isLoading,
                        child: const Text('Gửi email khôi phục'),
                      ),
                    ],
                  ),
                ),
              ],

              const Spacer(),

              // Back to login
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(
                  _emailSent ? 'Quay lại đăng nhập' : 'Quay lại',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

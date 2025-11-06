import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_strings.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  bool _obscurePassword = true;
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();
    _initAnimations();
  }

  void _initAnimations() {
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));

    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final success = await authProvider.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (success && mounted) {
      Navigator.of(context).pushReplacementNamed('/main');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Đăng nhập thất bại'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundGradient,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 40),
                      
                      // Logo and Welcome
                      _buildHeader(),
                      
                      const SizedBox(height: 48),
                      
                      // Login Form
                      _buildLoginForm(),
                      
                      const SizedBox(height: 24),
                      
                      // Remember Me & Forgot Password
                      _buildRememberAndForgot(),
                      
                      const SizedBox(height: 32),
                      
                      // Login Button
                      _buildLoginButton(),
                      
                      const SizedBox(height: 24),
                      
                      // Divider
                      _buildDivider(),
                      
                      const SizedBox(height: 24),
                      
                      // Social Login
                      _buildSocialLogin(),
                      
                      const SizedBox(height: 32),
                      
                      // Sign Up Link
                      _buildSignUpLink(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Logo
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.3),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: const Icon(
            Icons.diamond,
            size: 40,
            color: AppColors.textOnPrimary,
          ),
        ),
        
        const SizedBox(height: 24),
        
        // Welcome Text
        Text(
          'Chào mừng trở lại!',
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        const SizedBox(height: 8),
        
        Text(
          'Đăng nhập để tiếp tục mua sắm',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildLoginForm() {
    return Column(
      children: [
        // Email Field
        CustomTextField(
          controller: _emailController,
          label: AppStrings.email,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: Icons.email_outlined,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Vui lòng nhập email';
            }
            if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value)) {
              return 'Email không hợp lệ';
            }
            return null;
          },
        ),
        
        const SizedBox(height: 16),
        
        // Password Field
        CustomTextField(
          controller: _passwordController,
          label: AppStrings.password,
          obscureText: _obscurePassword,
          prefixIcon: Icons.lock_outline,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_off : Icons.visibility,
              color: AppColors.textSecondary,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Vui lòng nhập mật khẩu';
            }
            if (value.length < 6) {
              return 'Mật khẩu phải có ít nhất 6 ký tự';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildRememberAndForgot() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Remember Me
        Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: Checkbox(
                value: _rememberMe,
                onChanged: (value) {
                  setState(() {
                    _rememberMe = value ?? false;
                  });
                },
                activeColor: AppColors.primary,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Ghi nhớ đăng nhập',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        
        // Forgot Password
        TextButton(
          onPressed: () {
            Navigator.of(context).pushNamed('/forgot-password');
          },
          child: Text(
            AppStrings.forgotPassword,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return CustomButton(
          onPressed: authProvider.isLoading ? null : _login,
          isLoading: authProvider.isLoading,
          child: Text(AppStrings.login),
        );
      },
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Hoặc đăng nhập với',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }

  Widget _buildSocialLogin() {
    return Row(
      children: [
        Expanded(
          child: _buildSocialButton(
            icon: FontAwesomeIcons.google,
            label: 'Google',
            onPressed: () {
              // TODO: Implement Google login
            },
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildSocialButton(
            icon: FontAwesomeIcons.facebook,
            label: 'Facebook',
            onPressed: () {
              // TODO: Implement Facebook login
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: FaIcon(icon, size: 18),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
    );
  }

  Widget _buildSignUpLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          '${AppStrings.dontHaveAccount} ',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        TextButton(
          onPressed: () {
            Navigator.of(context).pushReplacementNamed('/register');
          },
          child: Text(
            AppStrings.register,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

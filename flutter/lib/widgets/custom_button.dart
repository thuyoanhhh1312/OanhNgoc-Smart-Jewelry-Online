import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class CustomButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isLoading;
  final ButtonType type;
  final Size? minimumSize;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;

  const CustomButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.isLoading = false,
    this.type = ButtonType.primary,
    this.minimumSize,
    this.padding,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
  });

  @override
  Widget build(BuildContext context) {
    switch (type) {
      case ButtonType.primary:
        return _buildElevatedButton(context);
      case ButtonType.secondary:
        return _buildOutlinedButton(context);
      case ButtonType.text:
        return _buildTextButton(context);
    }
  }

  Widget _buildElevatedButton(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor ?? AppColors.primary,
        foregroundColor: foregroundColor ?? AppColors.textOnPrimary,
        elevation: elevation ?? 2,
        shadowColor: AppColors.shadow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: padding ?? const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        minimumSize: minimumSize ?? const Size(double.infinity, 48),
      ),
      child: isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  foregroundColor ?? AppColors.textOnPrimary,
                ),
              ),
            )
          : child,
    );
  }

  Widget _buildOutlinedButton(BuildContext context) {
    return OutlinedButton(
      onPressed: isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: foregroundColor ?? AppColors.primary,
        side: BorderSide(
          color: backgroundColor ?? AppColors.primary,
          width: 1.5,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: padding ?? const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        minimumSize: minimumSize ?? const Size(double.infinity, 48),
      ),
      child: isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  foregroundColor ?? AppColors.primary,
                ),
              ),
            )
          : child,
    );
  }

  Widget _buildTextButton(BuildContext context) {
    return TextButton(
      onPressed: isLoading ? null : onPressed,
      style: TextButton.styleFrom(
        foregroundColor: foregroundColor ?? AppColors.primary,
        padding: padding ?? const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        minimumSize: minimumSize,
      ),
      child: isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  foregroundColor ?? AppColors.primary,
                ),
              ),
            )
          : child,
    );
  }
}

enum ButtonType {
  primary,
  secondary,
  text,
}

// Predefined button styles
class PrimaryButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isLoading;

  const PrimaryButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return CustomButton(
      onPressed: onPressed,
      isLoading: isLoading,
      type: ButtonType.primary,
      child: child,
    );
  }
}

class SecondaryButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isLoading;

  const SecondaryButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return CustomButton(
      onPressed: onPressed,
      isLoading: isLoading,
      type: ButtonType.secondary,
      child: child,
    );
  }
}

class SmallButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isLoading;
  final ButtonType type;

  const SmallButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.isLoading = false,
    this.type = ButtonType.primary,
  });

  @override
  Widget build(BuildContext context) {
    return CustomButton(
      onPressed: onPressed,
      isLoading: isLoading,
      type: type,
      minimumSize: const Size(80, 36),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: child,
    );
  }
}

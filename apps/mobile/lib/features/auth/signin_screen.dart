import 'dart:io' show Platform;
import 'package:easy_localization/easy_localization.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import 'signup_screen.dart';
import 'two_factor_verify_screen.dart';
import 'forgot_password_screen.dart';
import '../main_nav/main_nav_screen.dart';

class SignInScreen extends StatefulWidget {
  final bool isEmbedded;
  final VoidCallback? onSuccess;

  const SignInScreen({super.key, this.isEmbedded = false, this.onSuccess});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  static const String _rememberMeKey = 'remember_me';
  static const String _savedPhoneKey = 'saved_phone';

  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: Platform.isIOS
        ? '665688327385-lbpla4ui0ghmpq2k10mmmhj1s7cvgjfd.apps.googleusercontent.com'
        : null,
    serverClientId:
        '665688327385-bc35e5a0jfis22p5d20k089l9ivm3fge.apps.googleusercontent.com',
  );

  bool _rememberMe = false;
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _loadSavedCredentials();
  }

  Future<void> _loadSavedCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool(_rememberMeKey) ?? false;
    final savedPhone = prefs.getString(_savedPhoneKey) ?? '';

    if (rememberMe && savedPhone.isNotEmpty) {
      setState(() {
        _rememberMe = true;
        _phoneController.text = savedPhone;
      });
    }
  }

  Future<void> _saveCredentials(String phone) async {
    final prefs = await SharedPreferences.getInstance();
    if (_rememberMe) {
      await prefs.setBool(_rememberMeKey, true);
      await prefs.setString(_savedPhoneKey, phone);
    } else {
      await prefs.remove(_rememberMeKey);
      await prefs.remove(_savedPhoneKey);
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final auth = await account.authentication;
      final idToken = auth.idToken;

      if (idToken == null) throw Exception("Failed to get Google ID Token");

      // Use AuthProvider
      final authClient = AuthClient(); // Helper to key token
      final result = await authClient.googleLogin(idToken);

      if (!mounted) return;

      if (result['success'] == true) {
        final token = result['token'];
        await context.read<AuthProvider>().login(token);

        if (mounted) {
          if (widget.onSuccess != null) {
            widget.onSuccess!();
          } else {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (_) => const MainNavScreen()),
              (route) => false,
            );
          }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'auth.googleLoginFailed'.tr()),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'गुगल लगइन त्रुटि: $e'
                : 'Google Login Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleLogin() async {
    final rawPhone = _phoneController.text.trim();
    final password = _passwordController.text;

    if (rawPhone.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('auth.enterPhoneAndPassword'.tr())),
      );
      return;
    }

    // Prepend Nepal country code
    final phone = "+977$rawPhone";
    setState(() => _isLoading = true);

    try {
      // Use helper to get token, then provider to set state
      final authClient = AuthClient();
      final result = await authClient.login(phone, password);

      if (!mounted) return;

      if (result['success'] == true) {
        // Check if 2FA is required
        if (result['requires2FA'] == true) {
          await _saveCredentials(rawPhone);
          if (mounted) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => TwoFactorVerifyScreen(
                  tempToken: result['tempToken'],
                  onSuccess: widget.onSuccess,
                ),
              ),
            );
          }
          return;
        }

        final token = result['token'];
        // Save credentials if "Remember me" is checked
        await _saveCredentials(rawPhone);
        // Update Global State
        await context.read<AuthProvider>().login(token);

        if (mounted) {
          if (widget.onSuccess != null) {
            widget.onSuccess!();
          } else {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (_) => const MainNavScreen()),
              (route) => false,
            );
          }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message'] ??
                  (context.locale.languageCode == 'ne'
                      ? 'लगइन असफल'
                      : 'Login failed'),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'त्रुटि भयो: $e'
                : 'An error occurred: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: widget.isEmbedded
          ? null
          : AppBar(
              // Hide AppBar if embedded
              leading: IconButton(
                icon: const Icon(LucideIcons.arrowLeft),
                onPressed: () => Navigator.pop(context),
              ),
              title: Image.asset(
                'assets/images/logo.png',
                height: 28,
                fit: BoxFit.contain,
                errorBuilder: (ctx, err, stack) => Text(
                  'common.appNameFallback'.tr(),
                  style: GoogleFonts.poppins(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              centerTitle: true,
              backgroundColor: Colors.white,
              elevation: 0,
            ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Text(
              'common.appName'.tr(),
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'auth.welcomeBack'.tr(),
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'auth.loginSubtitle'.tr(),
              style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]),
            ),
            const SizedBox(height: 32),

            // Container Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[200]!),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Google Sign In Button
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _isLoading ? null : _handleGoogleLogin,
                      borderRadius: BorderRadius.circular(28),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: Colors.grey[300]!,
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: SvgPicture.asset(
                                'assets/images/google_logo.svg',
                                width: 24,
                                height: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'auth.continueWithGoogle'.tr(),
                              style: GoogleFonts.roboto(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey[700],
                                letterSpacing: 0.25,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: Divider(color: Colors.grey[200])),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'auth.orSignInWithPhone'.tr(),
                          style: GoogleFonts.inter(
                            color: Colors.grey[400],
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: Colors.grey[200])),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Phone Number
                  Text(
                    'auth.phoneNumber'.tr(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textDark,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            border: Border(
                              right: BorderSide(color: Colors.grey[300]!),
                            ),
                            color: Colors.grey[50],
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(8),
                              bottomLeft: Radius.circular(8),
                            ),
                          ),
                          child: Text(
                            'auth.phonePrefix'.tr(),
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textDark,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        Expanded(
                          child: TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              hintText: 'auth.phonePlaceholder'.tr(),
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 16,
                              ),
                            ),
                            style: GoogleFonts.inter(fontSize: 15),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Password
                  Text(
                    'auth.password'.tr(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textDark,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      hintText: 'auth.enterPassword'.tr(),
                      hintStyle: GoogleFonts.inter(color: Colors.grey[400]),
                      suffixIcon: IconButton(
                        icon: AnimatedRotation(
                          turns: _obscurePassword ? 0 : 0.5,
                          duration: const Duration(milliseconds: 200),
                          child: Icon(
                            _obscurePassword
                                ? LucideIcons.eye
                                : LucideIcons.eyeOff,
                            color: Colors.grey,
                          ),
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Remember Me & Forgot Password
                  Row(
                    children: [
                      SizedBox(
                        height: 20,
                        width: 20,
                        child: Checkbox(
                          value: _rememberMe,
                          onChanged: (val) =>
                              setState(() => _rememberMe = val!),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),
                          activeColor: AppTheme.primary,
                          side: BorderSide(color: Colors.grey[400]!),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'auth.rememberMe'.tr(),
                        style: GoogleFonts.inter(
                          color: Colors.grey[600],
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ForgotPasswordScreen(),
                            ),
                          );
                        },
                        child: Text(
                          'auth.forgotPassword'.tr(),
                          style: GoogleFonts.inter(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Sign In Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary, // Pink/Red
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              'auth.signIn'.tr(),
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: Divider(color: Colors.grey[200])),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'auth.dontHaveAccount'.tr(),
                          style: GoogleFonts.inter(
                            color: Colors.grey[400],
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: Colors.grey[200])),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Create Account Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                SignUpScreen(onSuccess: widget.onSuccess),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: AppTheme.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        'auth.createAccount'.tr(),
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';
import 'dart:io' show Platform;
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';
import '../../core/services/analytics_service.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import '../main_nav/main_nav_screen.dart';
import 'signin_screen.dart';

enum SignUpStep { phone, otp, details }

class SignUpScreen extends StatefulWidget {
  final VoidCallback? onSuccess;

  const SignUpScreen({super.key, this.onSuccess});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authClient = AuthClient();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: Platform.isIOS
        ? '665688327385-lbpla4ui0ghmpq2k10mmmhj1s7cvgjfd.apps.googleusercontent.com'
        : null,
    serverClientId:
        '665688327385-bc35e5a0jfis22p5d20k089l9ivm3fge.apps.googleusercontent.com',
  );

  bool _isLoading = false;
  SignUpStep _currentStep = SignUpStep.phone;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreedToTerms = false;
  String? _verificationToken;

  // OTP timers
  int _otpCooldown = 0;
  int _otpExpiry = 0;
  Timer? _cooldownTimer;
  Timer? _expiryTimer;

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _fullNameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _cooldownTimer?.cancel();
    _expiryTimer?.cancel();
    super.dispose();
  }

  bool _isValidNepaliPhone(String phone) {
    return RegExp(r'^(97|98)\d{8}$').hasMatch(phone);
  }

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }

  void _startCooldownTimer() {
    _cooldownTimer?.cancel();
    setState(() => _otpCooldown = 60);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_otpCooldown <= 1) {
        timer.cancel();
        if (mounted) setState(() => _otpCooldown = 0);
      } else {
        if (mounted) setState(() => _otpCooldown--);
      }
    });
  }

  void _startExpiryTimer(int expiresIn) {
    _expiryTimer?.cancel();
    setState(() => _otpExpiry = expiresIn);
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_otpExpiry <= 1) {
        timer.cancel();
        if (mounted) setState(() => _otpExpiry = 0);
      } else {
        if (mounted) setState(() => _otpExpiry--);
      }
    });
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

      final authClient = AuthClient();
      final result = await authClient.googleLogin(idToken);

      if (!mounted) return;

      if (result['success'] == true) {
        final token = result['token'];
        // OAuth registers on first login, so only a brand-new account counts
        // as a sign_up conversion — returning users would inflate the metric.
        if (result['isNewUser'] == true) {
          AnalyticsService.logSignUp('google');
        }
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
                      ? 'गुगल साइन अप असफल'
                      : 'Google Sign Up failed'),
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
                ? 'गुगल साइन अप त्रुटि: $e'
                : 'Google Sign Up Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleAppleLogin() async {
    setState(() => _isLoading = true);
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final identityToken = credential.identityToken;
      if (identityToken == null) {
        throw Exception('Failed to get Apple identity token');
      }

      final authClient = AuthClient();
      final result = await authClient.appleLogin(
        identityToken,
        givenName: credential.givenName,
        familyName: credential.familyName,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        final token = result['token'];
        if (result['isNewUser'] == true) {
          AnalyticsService.logSignUp('apple');
        }
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
                      ? 'एप्पल साइन अप असफल'
                      : 'Apple Sign Up failed'),
            ),
          ),
        );
      }
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'एप्पल साइन अप त्रुटि: ${e.message}'
                : 'Apple Sign Up Error: ${e.message}',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne'
                ? 'एप्पल साइन अप त्रुटि: $e'
                : 'Apple Sign Up Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleSendOtp() async {
    final rawPhone = _phoneController.text.trim();

    if (!_isValidNepaliPhone(rawPhone)) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.invalidPhone'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _authClient.sendOtp(rawPhone);
      if (!mounted) return;

      if (result['success'] == true) {
        setState(() => _currentStep = SignUpStep.otp);
        _startCooldownTimer();
        final expiresIn = result['expiresIn'] as int? ?? 600;
        _startExpiryTimer(expiresIn);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('auth.otpSentSuccess'.tr())));
      } else {
        // Handle cooldown from API response
        final cooldown = result['cooldownRemaining'] as int?;
        if (cooldown != null) {
          setState(() => _otpCooldown = cooldown);
          _startCooldownTimer();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['error'] ??
                  result['message'] ??
                  (context.locale.languageCode == 'ne'
                      ? 'OTP पठाउन असफल'
                      : 'Failed to send OTP'),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.locale.languageCode == 'ne' ? 'त्रुटि: $e' : 'Error: $e',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleChangeNumber() {
    _cooldownTimer?.cancel();
    _expiryTimer?.cancel();
    setState(() {
      _currentStep = SignUpStep.phone;
      _otpController.clear();
      _otpCooldown = 0;
      _otpExpiry = 0;
      _verificationToken = null;
    });
  }

  void _handleVerifyOtp() async {
    final rawPhone = _phoneController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.length != 6) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.enterValidOtp'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final verifyResult = await _authClient.verifyOtp(rawPhone, otp);
      if (!mounted) return;

      if (verifyResult['success'] == true) {
        _expiryTimer?.cancel();
        setState(() {
          _verificationToken = verifyResult['verificationToken'];
          _currentStep = SignUpStep.details;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('auth.phoneVerifiedComplete'.tr())),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              verifyResult['error'] ??
                  verifyResult['message'] ??
                  (context.locale.languageCode == 'ne'
                      ? 'अमान्य OTP'
                      : 'Invalid OTP'),
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: ${e.toString().replaceAll("Exception: ", "")}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleCreateAccount() async {
    final rawPhone = _phoneController.text.trim();
    final fullName = _fullNameController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (fullName.length < 2) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.nameMinLength'.tr())));
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.passwordMinLength'.tr())));
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.passwordsDoNotMatch'.tr())));
      return;
    }

    if (!_agreedToTerms) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('auth.agreeToTerms'.tr())));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final registerResult = await _authClient.register(
        rawPhone,
        password,
        fullName,
        _verificationToken!,
      );

      if (!mounted) return;

      if (registerResult['success'] == true) {
        final authToken = registerResult['token'];

        // Phone registration is unambiguous: this endpoint only ever creates.
        AnalyticsService.logSignUp('phone');

        if (authToken != null) {
          await context.read<AuthProvider>().login(authToken);
        }

        if (!mounted) return;
        if (widget.onSuccess != null) {
          widget.onSuccess!();
        } else {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const MainNavScreen()),
            (route) => false,
          );
        }
      } else {
        throw Exception(
          registerResult['error'] ??
              registerResult['message'] ??
              (context.locale.languageCode == 'ne'
                  ? 'दर्ता असफल'
                  : 'Registration failed'),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: ${e.toString().replaceAll("Exception: ", "")}',
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
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
          onPressed: () {
            if (_currentStep == SignUpStep.otp) {
              _handleChangeNumber();
            } else if (_currentStep == SignUpStep.details) {
              // Can't go back from details (OTP already verified)
              Navigator.pop(context);
            } else {
              Navigator.pop(context);
            }
          },
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
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 16),
        child: Column(
          children: [
            Text(
              _currentStep == SignUpStep.details
                  ? 'auth.completeRegistration'.tr()
                  : 'auth.createAccount'.tr(),
              style: GoogleFonts.inter(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _currentStep == SignUpStep.details
                  ? 'auth.fillDetails'.tr()
                  : 'auth.joinSubtitle'.tr(),
              style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[200]!),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ============== STEP 1: PHONE ==============
                  if (_currentStep == SignUpStep.phone) ...[
                    // Google Sign Up Button
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _isLoading ? null : _handleGoogleLogin,
                        borderRadius: BorderRadius.circular(28),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 8),
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
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: SvgPicture.asset(
                                  'assets/images/google_logo.svg',
                                  width: 18,
                                  height: 18,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'auth.signUpWithGoogle'.tr(),
                                style: GoogleFonts.roboto(
                                  fontSize: 13,
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
                    if (Platform.isIOS) ...[
                      const SizedBox(height: 12),
                      SignInWithAppleButton(
                        onPressed: _isLoading ? () {} : _handleAppleLogin,
                        style: SignInWithAppleButtonStyle.black,
                        borderRadius: BorderRadius.circular(28),
                        height: 36,
                      ),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey[200])),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'auth.orRegisterWithPhone'.tr(),
                            style: GoogleFonts.inter(
                              color: Colors.grey[400],
                              fontSize: 13,
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: Colors.grey[200])),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Phone Number Input
                    Text(
                      'auth.phoneRequired'.tr(),
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textDark,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildPhoneInput(enabled: true),
                    const SizedBox(height: 8),
                    Text(
                      'auth.phoneValidation'.tr(),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading || _otpCooldown > 0
                            ? null
                            : _handleSendOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
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
                                _otpCooldown > 0
                                    ? 'auth.resendIn'.tr(
                                        args: ['$_otpCooldown'],
                                      )
                                    : 'auth.sendOtp'.tr(),
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],

                  // ============== STEP 2: OTP ==============
                  if (_currentStep == SignUpStep.otp) ...[
                    // OTP sent confirmation
                    Center(
                      child: Column(
                        children: [
                          Text(
                            'auth.otpSentTo'.tr(
                              args: [_phoneController.text.trim()],
                            ),
                            style: GoogleFonts.inter(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                          if (_otpExpiry > 0)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                context.locale.languageCode == 'ne'
                                    ? '${_formatTime(_otpExpiry)} मा समाप्त हुन्छ'
                                    : 'Expires in ${_formatTime(_otpExpiry)}',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.orange[700],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    Text(
                      'auth.enterOtp'.tr(),
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(fontSize: 24, letterSpacing: 8),
                      decoration: InputDecoration(
                        hintText: 'auth.otpPlaceholder'.tr(),
                        counterText: "",
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed:
                            _isLoading || _otpController.text.trim().length != 6
                            ? null
                            : _handleVerifyOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
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
                                'auth.verifyOtp'.tr(),
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Change number + Resend OTP
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: _handleChangeNumber,
                          child: Text(
                            'auth.changeNumber'.tr(),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _isLoading || _otpCooldown > 0
                              ? null
                              : _handleSendOtp,
                          child: Text(
                            _otpCooldown > 0
                                ? 'auth.resendIn'.tr(args: ['$_otpCooldown'])
                                : 'auth.resendOtp'.tr(),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: _otpCooldown > 0
                                  ? Colors.grey[400]
                                  : AppTheme.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],

                  // ============== STEP 3: DETAILS ==============
                  if (_currentStep == SignUpStep.details) ...[
                    // Verified badge
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.grey[200]!),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            LucideIcons.checkCircle,
                            color: AppTheme.success,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            context.locale.languageCode == 'ne'
                                ? '+977 ${_phoneController.text.trim()} प्रमाणित'
                                : '+977 ${_phoneController.text.trim()} verified',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.success,
                            ),
                          ),
                        ],
                      ),
                    ),

                    Text(
                      'auth.fullName'.tr(),
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _fullNameController,
                      decoration: InputDecoration(
                        hintText: 'auth.enterFullName'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Text(
                      'auth.passwordRequired'.tr(),
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: 'auth.atLeast6Chars'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
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
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Text(
                      'auth.confirmPassword'.tr(),
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirmPassword,
                      decoration: InputDecoration(
                        hintText: 'auth.reEnterPassword'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        suffixIcon: IconButton(
                          icon: AnimatedRotation(
                            turns: _obscureConfirmPassword ? 0 : 0.5,
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              _obscureConfirmPassword
                                  ? LucideIcons.eye
                                  : LucideIcons.eyeOff,
                              color: Colors.grey,
                            ),
                          ),
                          onPressed: () => setState(
                            () => _obscureConfirmPassword =
                                !_obscureConfirmPassword,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Terms & Conditions checkbox
                    Row(
                      children: [
                        SizedBox(
                          height: 24,
                          width: 24,
                          child: Checkbox(
                            value: _agreedToTerms,
                            onChanged: (v) =>
                                setState(() => _agreedToTerms = v ?? false),
                            activeColor: AppTheme.primary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Wrap(
                            children: [
                              Text(
                                'auth.iAgreeTo'.tr(),
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: Colors.grey[700],
                                ),
                              ),
                              InkWell(
                                onTap: () => _openUrl(
                                  'https://thulobazaar.com.np/en/support/terms-of-service',
                                ),
                                child: Text(
                                  'auth.termsAndConditions'.tr(),
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                              Text(
                                'auth.and'.tr(),
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: Colors.grey[700],
                                ),
                              ),
                              InkWell(
                                onTap: () => _openUrl(
                                  'https://thulobazaar.com.np/en/support/privacy-policy',
                                ),
                                child: Text(
                                  'auth.privacyPolicy'.tr(),
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading || !_agreedToTerms
                            ? null
                            : _handleCreateAccount,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
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
                                'auth.createAccount'.tr(),
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: Divider(color: Colors.grey[200])),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'auth.alreadyHaveAccount'.tr(),
                          style: GoogleFonts.inter(
                            color: Colors.grey[400],
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: Colors.grey[200])),
                    ],
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                SignInScreen(onSuccess: widget.onSuccess),
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
                        'auth.signInInstead'.tr(),
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

  Widget _buildPhoneInput({required bool enabled}) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Colors.grey[300]!)),
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
              enabled: enabled,
              maxLength: 10,
              decoration: InputDecoration(
                hintText: 'auth.phonePlaceholder'.tr(),
                counterText: "",
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16),
              ),
              style: GoogleFonts.inter(fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }
}

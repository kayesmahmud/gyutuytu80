import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile/core/api/auth_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/utils/localized_helpers.dart';

class PhoneVerificationScreen extends StatefulWidget {
  final VoidCallback? onVerified;

  const PhoneVerificationScreen({super.key, this.onVerified});

  @override
  State<PhoneVerificationScreen> createState() => _PhoneVerificationScreenState();
}

class _PhoneVerificationScreenState extends State<PhoneVerificationScreen> {
  final AuthClient _authClient = AuthClient();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  
  bool _isLoading = false;
  bool _otpSent = false;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _startTimer() {
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldown > 0) {
        setState(() => _cooldown--);
      } else {
        _timer?.cancel();
      }
    });
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'कृपया मान्य फोन नम्बर प्रविष्ट गर्नुहोस्' : 'Please enter a valid phone number')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await _authClient.sendOtp(phone, purpose: 'phone_verification');
      if (result['success'] == true) {
        setState(() {
          _otpSent = true;
          _isLoading = false;
        });
        _startTimer();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'OTP सफलतापूर्वक पठाइयो' : 'OTP sent successfully')),
          );
        }
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'OTP पठाउन असफल: $e' : 'Failed to send OTP: $e')),
        );
      }
    }
  }

  Future<void> _verifyAndSave() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'कृपया मान्य ६ अंकको OTP प्रविष्ट गर्नुहोस्' : 'Please enter a valid 6-digit OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      // 1. Verify OTP
      final verifyResult = await _authClient.verifyOtp(phone, otp, purpose: 'phone_verification');
      
      if (verifyResult['success'] != true) {
        throw Exception(verifyResult['message'] ?? 'Verification failed');
      }

      final token = verifyResult['verificationToken'];
      if (token == null) {
        throw Exception('No verification token received');
      }

      // 2. Update Phone
      final updateResult = await _authClient.updatePhone(phone, token);
      
      if (updateResult['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.locale.languageCode == 'ne' ? 'फोन नम्बर प्रमाणित र अपडेट भयो!' : 'Phone number verified and updated!')),
          );
          widget.onVerified?.call();
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(updateResult['message']);
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.locale.languageCode == 'ne' ? 'फोन प्रमाणित गर्नुहोस्' : 'Verify Phone'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.5,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              context.locale.languageCode == 'ne'
                  ? 'तपाईंको खाता सुरक्षित गर्न र थप सुविधाहरू सक्षम गर्न फोन नम्बर थप्नुहोस्।'
                  : 'Add a phone number to secure your account and enable more features.',
              style: const TextStyle(color: Colors.grey, fontSize: 16),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: context.locale.languageCode == 'ne' ? 'मोबाइल नम्बर' : 'Mobile Number',
                prefixText: '+977 ',
                border: const OutlineInputBorder(),
                enabled: !_otpSent, // Disable editing after OTP sent
              ),
            ),
            if (_otpSent) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: context.locale.languageCode == 'ne' ? 'OTP कोड प्रविष्ट गर्नुहोस्' : 'Enter OTP Code',
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _cooldown > 0 ? null : _sendOtp,
                  child: Text(_cooldown > 0
                    ? (context.locale.languageCode == 'ne' ? '${_cooldown}s मा OTP पुन: पठाउनुहोस्' : 'Resend OTP in ${_cooldown}s')
                    : (context.locale.languageCode == 'ne' ? 'OTP पुन: पठाउनुहोस्' : 'Resend OTP')
                  ),
                ),
              ),
            ],
            const Spacer(),
            ElevatedButton(
              onPressed: _isLoading 
                ? null 
                : (_otpSent ? _verifyAndSave : _sendOtp),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                ? const SizedBox(
                    height: 20, 
                    width: 20, 
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                  )
                : Text(
                    _otpSent
                        ? (context.locale.languageCode == 'ne' ? 'प्रमाणित गर्नुहोस् र सेभ गर्नुहोस्' : 'Verify & Save')
                        : (context.locale.languageCode == 'ne' ? 'OTP पठाउनुहोस्' : 'Send OTP'),
                    style: const TextStyle(fontSize: 16, color: Colors.white),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

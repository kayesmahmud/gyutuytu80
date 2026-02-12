import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/api/verification_client.dart';
import '../../core/models/verification_models.dart';
import 'verification_widgets.dart';
import 'individual_verification_form.dart';
import 'business_verification_form.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({Key? key}) : super(key: key);

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final VerificationClient _client = VerificationClient();
  bool _isLoading = true;
  String? _error;
  VerificationStatusResponse? _statusResponse;

  @override
  void initState() {
    super.initState();
    _fetchStatus();
  }

  Future<void> _fetchStatus() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await _client.getVerificationStatus();

    if (mounted) {
      if (result.success) {
        setState(() {
          _statusResponse = result;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = result.error ?? 'Failed to load status';
          _isLoading = false;
        });
      }
    }
  }

  void _navigateToIndividualForm() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const IndividualVerificationForm()),
    );
    if (result == true) {
      _fetchStatus();
    }
  }

  void _navigateToBusinessForm() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const BusinessVerificationForm()),
    );
    if (result == true) {
      _fetchStatus();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Verification Center'),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchStatus,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchStatus,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Show "Not Verified Yet" banner if completely unverified
                        if (_statusResponse?.businessVerification?.status == 'unverified' &&
                            _statusResponse?.individualVerification?.status == 'unverified')
                          VerificationBanner(),

                        // Individual Verification Card
                        VerificationStatusCard(
                          title: 'Individual',
                          subtitle: _statusResponse?.individualVerification?.verified == true
                              ? 'Your identity has been verified.'
                              : 'Verify identity with government ID for trust & features.',
                          status: _statusResponse?.individualVerification?.status ?? 'unverified',
                          color: Colors.blue,
                          icon: LucideIcons.user,
                          onTap: _navigateToIndividualForm,
                        ),

                        // Business Verification Card
                        VerificationStatusCard(
                          title: 'Business',
                          subtitle: _statusResponse?.businessVerification?.verified == true
                              ? 'Your business has been verified.'
                              : 'Verify business with official docs for premium access.',
                          status: _statusResponse?.businessVerification?.status ?? 'unverified',
                          color: Colors.amber,
                          icon: LucideIcons.building,
                          onTap: _navigateToBusinessForm,
                        ),

                        const SizedBox(height: 24),
                        FaqSection(),
                      ],
                    ),
                  ),
                ),
    );
  }
}

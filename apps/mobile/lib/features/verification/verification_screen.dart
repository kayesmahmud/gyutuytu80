import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/api/verification_client.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/models/verification.dart';
import 'package:mobile/features/verification/individual_verification_form.dart';
import 'package:mobile/features/verification/business_verification_form.dart';
import 'package:mobile/features/verification/widgets/verification_hero_header.dart';
import 'package:mobile/features/verification/widgets/verification_banners.dart';
import 'package:mobile/features/verification/widgets/verification_benefits_grid.dart';
import 'package:mobile/features/verification/widgets/verification_status_cards.dart';
import 'package:mobile/features/verification/widgets/verification_duration_selector.dart';
import 'package:mobile/features/verification/widgets/verification_faq.dart';
class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final VerificationClient _verificationClient = VerificationClient();

  bool _isLoading = true;
  String? _error;
  VerificationStatusResponse? _status;
  VerificationPricing? _pricing;

  // Selection state
  String? _selectedType; // 'individual' | 'business'
  PricingOption? _selectedDuration;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Load both status and pricing in parallel
      final results = await Future.wait([
        _verificationClient.getVerificationStatus(),
        _verificationClient.getVerificationPricing(),
      ]);

      final statusResult = results[0] as ApiResponse<VerificationStatusResponse>;
      final pricingResult = results[1] as ApiResponse<VerificationPricing>;

      if (mounted) {
        setState(() {
          if (statusResult.success) {
            _status = statusResult.data;
          }
          if (pricingResult.success) {
            _pricing = pricingResult.data;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load verification data';
          _isLoading = false;
        });
      }
    }
  }

  void _handleTypeSelect(String type) {
    setState(() {
      _selectedType = type;
      _selectedDuration = null;
      _showForm = false;
    });
  }

  void _handleDurationSelect(PricingOption option) {
    setState(() {
      _selectedDuration = option;
    });
  }

  void _handleProceedToForm() {
    if (_selectedDuration == null && !_isFreeVerification) return;

    final durationDays = _isFreeVerification
        ? _pricing!.freeVerification.durationDays
        : _selectedDuration!.durationDays;
    final price = _isFreeVerification ? 0.0 : _selectedDuration!.finalPrice;

    Widget formScreen;
    if (_selectedType == 'individual') {
      formScreen = IndividualVerificationForm(
        onSuccess: () {
          Navigator.pop(context);
          _handleFormSuccess();
        },
        onCancel: () => Navigator.pop(context),
        durationDays: durationDays,
        price: price,
        isFreeVerification: _isFreeVerification,
      );
    } else {
      formScreen = BusinessVerificationForm(
        onSuccess: () {
          Navigator.pop(context);
          _handleFormSuccess();
        },
        onCancel: () => Navigator.pop(context),
        durationDays: durationDays,
        price: price,
        isFreeVerification: _isFreeVerification,
      );
    }

    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => formScreen),
    );
  }

  void _handleFormSuccess() {
    setState(() {
      _showForm = false;
      _selectedType = null;
      _selectedDuration = null;
    });
    _loadData(); // Refresh data
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Verification request submitted successfully!'),
        backgroundColor: Color(0xFF10B981),
      ),
    );
  }

  void _handleFormCancel() {
    setState(() {
      _showForm = false;
    });
  }

  void _handleClearSelection() {
    setState(() {
      _selectedType = null;
      _selectedDuration = null;
      _showForm = false;
    });
  }

  bool get _isFreeVerification {
    if (_pricing == null) return false;
    return _pricing!.freeVerification.isEligible &&
        _pricing!.freeVerification.appliesToType(_selectedType ?? '');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F3FF), // Light purple gradient effect
      appBar: AppBar(
        title: Text(
          'Get Verified',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.grey[800],
      ),
      body: _isLoading
          ? _buildLoadingState()
          : _error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
              ),
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 3,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Loading verification status...',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Something went wrong',
              style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
              ),
              child: const Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF6366F1),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            // Hero Header
            const VerificationHeroHeader(),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Free Verification Banner
                  if (_pricing?.freeVerification.isEligible == true)
                    FreeVerificationBanner(pricing: _pricing!),

                  // Campaign Banner
                  if (_pricing?.hasCampaign == true) 
                    CampaignBanner(campaign: _pricing!.campaign!),

                  // Benefits Grid
                  const VerificationBenefitsGrid(),

                  const SizedBox(height: 24),

                  // Status Cards
                  _buildStatusCards(),

                  const SizedBox(height: 24),

                  // Duration Selection
                  if (_selectedType != null && !_showForm)
                    VerificationDurationSelector(
                      pricing: _pricing,
                      selectedType: _selectedType,
                      selectedDuration: _selectedDuration,
                      isFreeVerification: _isFreeVerification,
                      onDurationSelect: _handleDurationSelect,
                      onFreeSelect: _handleFreeDurationSelect,
                      onClearSelection: _handleClearSelection,
                      onProceed: _handleProceedToForm,
                    ),

                  const SizedBox(height: 24),

                  // FAQ Section
                  const VerificationFaqSection(),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

// Hero Header, Banners, and Benefits Grid extracted to widgets/

  Widget _buildStatusCards() {
    return Column(
      children: [
        // Individual Verification Card
        VerificationStatusCard(
          type: 'individual',
          title: 'Individual Seller',
          subtitle: 'For personal accounts',
          icon: Icons.person,
          statusData: _status?.individual,
          isSelected: _selectedType == 'individual',
          onTap: () => _handleTypeSelect('individual'),
        ),
        const SizedBox(height: 16),
        // Business Verification Card
        VerificationStatusCard(
          type: 'business',
          title: 'Business Seller',
          subtitle: 'For registered businesses',
          icon: Icons.business,
          statusData: _status?.business,
          isSelected: _selectedType == 'business',
          onTap: () => _handleTypeSelect('business'),
        ),
      ],
    );
  }

  void _handleFreeDurationSelect() {
    if (_pricing == null) return;
    final free = _pricing!.freeVerification;
    setState(() {
      _selectedDuration = PricingOption(
        id: 0,
        durationDays: free.durationDays,
        durationLabel: '${free.durationDays} Days (Free)',
        price: 0,
        discountPercentage: 100,
        finalPrice: 0,
        hasCampaignDiscount: false,
      );
    });
  }

// Status Cards, Duration Selector, and FAQ extracted to widgets/
}

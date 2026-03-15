import 'dart:io';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/api/verification_client.dart';
import '../../core/models/payment.dart';
import '../../core/utils/localized_helpers.dart';
import '../payment/payment_screen.dart';
import 'verification_widgets.dart';

class IndividualVerificationForm extends StatefulWidget {
  final int durationDays;
  final double price;
  final bool isFreeVerification;
  final bool isResubmission;

  const IndividualVerificationForm({
    super.key,
    required this.durationDays,
    required this.price,
    required this.isFreeVerification,
    required this.isResubmission,
  });

  @override
  State<IndividualVerificationForm> createState() =>
      _IndividualVerificationFormState();
}

class _IndividualVerificationFormState
    extends State<IndividualVerificationForm> {
  final _formKey = GlobalKey<FormState>();
  final VerificationClient _client = VerificationClient();
  final _picker = ImagePicker();

  // 2-step flow state
  String _step = 'form'; // 'form' | 'payment'
  PaymentGateway? _selectedPaymentMethod;

  bool _isSubmitting = false;
  File? _idFront;
  File? _idBack;
  File? _selfie;

  String _fullName = '';
  String _idType = 'citizenship';
  String _idNumber = '';

  Future<void> _pickImage(String type) async {
    final picked =
        await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1200, imageQuality: 85);
    if (picked != null) {
      // Validate file size (max 5MB)
      final file = File(picked.path);
      final fileSize = await file.length();
      if (fileSize > 5 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.locale.languageCode == 'ne'
                  ? 'छवि ५MB भन्दा कम हुनुपर्छ। कृपया सानो फाइल अपलोड गर्नुहोस्।'
                  : 'Image must be less than 5MB. Please upload a smaller file.'),
            ),
          );
        }
        return;
      }

      setState(() {
        switch (type) {
          case 'front':
            _idFront = file;
            break;
          case 'back':
            _idBack = file;
            break;
          case 'selfie':
            _selfie = file;
            break;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (_step == 'form') {
      if (!_formKey.currentState!.validate()) return;
      _formKey.currentState!.save();

      if (_idFront == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(context.locale.languageCode == 'ne'
                    ? 'कृपया आफ्नो परिचयपत्रको अगाडिको छवि अपलोड गर्नुहोस्'
                    : 'Please upload front image of your ID document')),
          );
        }
        return;
      }

      if (_selfie == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(context.locale.languageCode == 'ne'
                    ? 'कृपया आफ्नो परिचयपत्र समातेको सेल्फी अपलोड गर्नुहोस्'
                    : 'Please upload a selfie holding your ID document')),
          );
        }
        return;
      }

      if (widget.isFreeVerification || widget.isResubmission) {
        await _submitFreeVerification();
      } else {
        // Move to payment step
        setState(() => _step = 'payment');
      }
      return;
    }

    // Step 2: Payment
    if (_step == 'payment') {
      if (_selectedPaymentMethod == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.locale.languageCode == 'ne'
              ? 'कृपया भुक्तानी विधि छान्नुहोस्'
              : 'Please select a payment method')),
        );
        return;
      }
      await _submitPaidVerification();
    }
  }

  Future<void> _submitFreeVerification() async {
    setState(() => _isSubmitting = true);

    try {
      final uploadResult = await _client.uploadIndividualDocuments(
        idFront: _idFront!,
        idBack: _idBack,
        selfie: _selfie!,
        idType: _idType,
      );

      if (!uploadResult.success || uploadResult.data == null) {
        throw Exception(uploadResult.error ?? 'Document upload failed');
      }

      final submitResult = await _client.submitIndividualVerification(
        documentUrls: uploadResult.data!,
        fullName: _fullName,
        idType: _idType,
        idNumber: _idNumber,
        durationDays: widget.durationDays,
        paymentStatus: 'free',
      );

      if (submitResult.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(context.locale.languageCode == 'ne'
                    ? 'प्रमाणीकरण सफलतापूर्वक पेश गरियो!'
                    : 'Verification submitted successfully!')),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(submitResult.error ?? 'Submission failed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _submitPaidVerification() async {
    setState(() => _isSubmitting = true);

    try {
      // 1. Upload documents
      final uploadResult = await _client.uploadIndividualDocuments(
        idFront: _idFront!,
        idBack: _idBack,
        selfie: _selfie!,
        idType: _idType,
      );

      if (!uploadResult.success || uploadResult.data == null) {
        throw Exception(uploadResult.error ?? 'Document upload failed');
      }

      // 2. Submit verification with payment_status='pending' — get requestId
      final submitResult = await _client.submitIndividualVerification(
        documentUrls: uploadResult.data!,
        fullName: _fullName,
        idType: _idType,
        idNumber: _idNumber,
        durationDays: widget.durationDays,
        paymentStatus: 'pending',
        paymentAmount: widget.price,
      );

      if (!submitResult.success || submitResult.requestId == null) {
        throw Exception(submitResult.error ?? 'Submission failed');
      }

      final requestId = submitResult.requestId!;

      // 3. Navigate to PaymentScreen with relatedId
      if (mounted) {
        final paymentResult = await Navigator.push<bool>(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentScreen(
              gateway: _selectedPaymentMethod!,
              amount: widget.price,
              paymentType: PaymentType.individualVerification,
              relatedId: requestId,
              orderName:
                  'Individual Verification - ${_formatDuration(widget.durationDays, context.locale.languageCode)}',
              metadata: {
                'fullName': _fullName,
                'verificationRequestId': requestId,
              },
            ),
          ),
        );

        if (paymentResult == true && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(context.locale.languageCode == 'ne'
                    ? 'भुक्तानी सफल! प्रमाणीकरण पेश गरियो।'
                    : 'Payment successful! Verification submitted.')),
          );
          Navigator.pop(context, true);
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(context.locale.languageCode == 'ne'
                    ? 'भुक्तानी पूरा भएन। तपाईंको प्रमाणीकरण भुक्तानी पर्खिरहेको छ।'
                    : 'Payment was not completed. Your verification is pending payment.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${context.locale.languageCode == 'ne' ? 'त्रुटि' : 'Error'}: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _formatDuration(int days, String lang) {
    if (lang == 'ne') {
      switch (days) {
        case 30:
          return '१ महिना';
        case 90:
          return '३ महिना';
        case 180:
          return '६ महिना';
        case 365:
          return '१ वर्ष';
        default:
          return '$days दिन';
      }
    }
    switch (days) {
      case 30:
        return '1 Month';
      case 90:
        return '3 Months';
      case 180:
        return '6 Months';
      case 365:
        return '1 Year';
      default:
        return '$days Days';
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _step == 'form'
                  ? (lang == 'ne' ? 'व्यक्तिगत प्रमाणीकरण' : 'Individual Verification')
                  : (lang == 'ne' ? 'भुक्तानी विधि छान्नुहोस्' : 'Select Payment Method'),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              widget.isFreeVerification || widget.isResubmission
                  ? '${lang == 'ne' ? 'निःशुल्क' : 'Free'} — ${_formatDuration(widget.durationDays, lang)}'
                  : '${formatLocalizedPrice(widget.price, lang)} — ${_formatDuration(widget.durationDays, lang)}',
              style: TextStyle(
                fontSize: 12,
                color: widget.isFreeVerification || widget.isResubmission
                    ? Colors.green
                    : Colors.indigo,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        leading: _step == 'payment'
            ? IconButton(
                icon: const Icon(LucideIcons.arrowLeft),
                onPressed: () => setState(() => _step = 'form'),
              )
            : null,
      ),
      body: _step == 'form' ? _buildFormStep() : _buildPaymentStep(),
    );
  }

  Widget _buildFormStep() {
    final lang = context.locale.languageCode;
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Plan summary
          PlanSummaryCard(
            type: 'individual',
            durationDays: widget.durationDays,
            price: widget.price,
            isFree: widget.isFreeVerification,
            isResubmission: widget.isResubmission,
          ),

          // Step indicator (paid flows only)
          if (!widget.isFreeVerification && !widget.isResubmission)
            const VerificationStepIndicator(
              currentStep: 1,
              accentColor: Colors.indigo,
            ),

          // Full Name
          _buildLabel(lang == 'ne' ? 'पूरा नाम (परिचयपत्रमा जस्तो) *' : 'Full Name (as on ID document) *'),
          TextFormField(
            decoration: _inputDecoration(lang == 'ne' ? 'आफ्नो पूरा नाम परिचयपत्रमा देखिए जस्तै लेख्नुहोस्' : 'Enter your full name exactly as shown on ID'),
            validator: (v) =>
                v?.isEmpty == true ? (lang == 'ne' ? 'कृपया आफ्नो पूरा नाम लेख्नुहोस्' : 'Please enter your full name') : null,
            onSaved: (v) => _fullName = v ?? '',
          ),
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              lang == 'ne'
                  ? 'यो नाम प्रमाणित गरिनेछ र तपाईंको निलो ब्याजसँग देखाइनेछ'
                  : 'This name will be verified and displayed with your blue badge',
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
          ),
          const SizedBox(height: 16),

          // ID Type
          _buildLabel(lang == 'ne' ? 'परिचयपत्र प्रकार *' : 'ID Document Type *'),
          DropdownButtonFormField<String>(
            value: _idType,
            decoration: _inputDecoration(''),
            items: [
              DropdownMenuItem(
                  value: 'citizenship', child: Text(lang == 'ne' ? 'नागरिकता' : 'Citizenship')),
              DropdownMenuItem(value: 'passport', child: Text(lang == 'ne' ? 'राहदानी' : 'Passport')),
              DropdownMenuItem(
                  value: 'driving_license',
                  child: Text(lang == 'ne' ? 'सवारी चालक अनुमतिपत्र' : 'Driving License')),
            ],
            onChanged: (v) => setState(() => _idType = v ?? 'citizenship'),
          ),
          const SizedBox(height: 16),

          // ID Number
          _buildLabel(lang == 'ne' ? 'परिचयपत्र नम्बर *' : 'ID Document Number *'),
          TextFormField(
            decoration: _inputDecoration(lang == 'ne' ? 'आफ्नो परिचयपत्र नम्बर लेख्नुहोस्' : 'Enter your ID number'),
            validator: (v) =>
                v?.isEmpty == true ? (lang == 'ne' ? 'कृपया आफ्नो परिचयपत्र नम्बर लेख्नुहोस्' : 'Please enter your ID document number') : null,
            onSaved: (v) => _idNumber = v ?? '',
          ),
          const SizedBox(height: 24),

          // Documents
          _buildLabel(lang == 'ne' ? 'परिचयपत्र अगाडिको छवि *' : 'ID Front Image *'),
          _buildDocUpload(
              _idFront, 'front', lang == 'ne' ? 'आफ्नो परिचयपत्रको अगाडिको भाग अपलोड गर्नुहोस्' : 'Upload front of your ID'),
          _buildFileHint(lang == 'ne' ? 'अधिकतम ५MB' : 'Max 5MB'),
          const SizedBox(height: 12),

          _buildLabel(lang == 'ne'
              ? 'परिचयपत्र पछाडिको छवि ${_idType != 'passport' ? '*' : ''}'
              : 'ID Back Image ${_idType != 'passport' ? '*' : ''}'),
          _buildDocUpload(_idBack, 'back', lang == 'ne' ? 'आफ्नो परिचयपत्रको पछाडिको भाग अपलोड गर्नुहोस्' : 'Upload back of your ID'),
          _buildFileHint(_idType == 'passport'
              ? (lang == 'ne' ? 'ऐच्छिक' : 'Optional')
              : (lang == 'ne' ? 'अधिकतम ५MB' : 'Max 5MB')),
          const SizedBox(height: 12),

          _buildLabel(lang == 'ne' ? 'परिचयपत्रसहित सेल्फी *' : 'Selfie with ID Document *'),
          _buildDocUpload(
              _selfie, 'selfie', lang == 'ne' ? 'आफ्नो परिचयपत्र समातेको सेल्फी अपलोड गर्नुहोस्' : 'Upload a selfie holding your ID'),
          _buildFileHint(lang == 'ne'
              ? 'आफ्नो अनुहारको छेउमा परिचयपत्र समातेको स्पष्ट सेल्फी'
              : 'Clear selfie holding your ID next to your face'),
          const SizedBox(height: 32),

          // Submit button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      widget.isFreeVerification || widget.isResubmission
                          ? (lang == 'ne' ? 'प्रमाणीकरणको लागि पेश गर्नुहोस्' : 'Submit for Verification')
                          : (lang == 'ne' ? 'भुक्तानीमा जानुहोस्' : 'Proceed to Payment'),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildPaymentStep() {
    final lang = context.locale.languageCode;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Step indicator
        const VerificationStepIndicator(
          currentStep: 2,
          accentColor: Colors.indigo,
        ),

        // Order Summary
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.indigo.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.indigo.shade100),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.receipt, size: 20, color: Colors.indigo),
                  const SizedBox(width: 8),
                  Text(
                    lang == 'ne' ? 'अर्डर सारांश' : 'Order Summary',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildSummaryRow(lang == 'ne' ? 'योजना' : 'Plan', lang == 'ne' ? 'व्यक्तिगत प्रमाणीकरण' : 'Individual Verification'),
              _buildSummaryRow(
                  lang == 'ne' ? 'अवधि' : 'Duration', _formatDuration(widget.durationDays, lang)),
              _buildSummaryRow(lang == 'ne' ? 'नाम' : 'Name', _fullName),
              const Divider(height: 24),
              _buildSummaryRow(
                lang == 'ne' ? 'कुल रकम' : 'Total Amount',
                formatLocalizedPrice(widget.price, lang),
                isTotal: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Payment Method Selection
        Text(
          lang == 'ne' ? 'भुक्तानी विधि छान्नुहोस्' : 'Select Payment Method',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),

        _buildPaymentMethodCard(
          name: 'Khalti',
          description: lang == 'ne' ? 'Khalti वालेट वा बैंकबाट भुक्तानी गर्नुहोस्' : 'Pay with Khalti wallet or bank',
          color: const Color(0xFF5C2D91),
          icon: LucideIcons.wallet,
          gateway: PaymentGateway.khalti,
        ),
        const SizedBox(height: 12),

        _buildPaymentMethodCard(
          name: 'eSewa',
          description: lang == 'ne' ? 'eSewa वालेटबाट भुक्तानी गर्नुहोस्' : 'Pay with eSewa wallet',
          color: const Color(0xFF60BB46),
          icon: LucideIcons.smartphone,
          gateway: PaymentGateway.esewa,
        ),
        const SizedBox(height: 32),

        // Pay button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    lang == 'ne'
                        ? 'भुक्तानी गर्नुहोस् ${formatLocalizedPrice(widget.price, lang)}'
                        : 'Pay NPR ${widget.price.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
          ),
        ),

        const SizedBox(height: 12),
        Center(
          child: Text(
            lang == 'ne'
                ? '२५६-बिट SSL इन्क्रिप्शनले सुरक्षित'
                : 'Secured with 256-bit SSL encryption',
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.indigo : Colors.black87,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontSize: isTotal ? 16 : 14,
                fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
                color: isTotal ? Colors.indigo : Colors.black87,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodCard({
    required String name,
    required String description,
    required Color color,
    required IconData icon,
    required PaymentGateway gateway,
  }) {
    final isSelected = _selectedPaymentMethod == gateway;

    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = gateway),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          color: isSelected ? color.withValues(alpha: 0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(LucideIcons.checkCircle, color: color, size: 24)
            else
              Icon(LucideIcons.circle, color: Colors.grey[400], size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildFileHint(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text(
        text,
        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.indigo, width: 2),
      ),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  Widget _buildDocUpload(File? file, String type, String label) {
    return GestureDetector(
      onTap: () => _pickImage(type),
      child: Container(
        height: file != null ? 180 : 100,
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: file != null ? Colors.green.shade300 : Colors.grey.shade300,
            width: 1.5,
          ),
        ),
        child: file != null
            ? Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(file,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: 180),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(LucideIcons.check,
                          color: Colors.white, size: 16),
                    ),
                  ),
                ],
              )
            : Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.upload,
                        color: Colors.grey[400], size: 28),
                    const SizedBox(height: 8),
                    Text(
                      label,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

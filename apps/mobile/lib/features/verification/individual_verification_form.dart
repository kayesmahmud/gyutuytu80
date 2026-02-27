import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/api/verification_client.dart';
import '../../core/models/payment.dart';
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
            const SnackBar(
              content: Text('Image must be less than 5MB. Please upload a smaller file.'),
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

      if (_idFront == null || _selfie == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Please upload required documents')),
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
          const SnackBar(content: Text('Please select a payment method')),
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
            const SnackBar(
                content: Text('Verification submitted successfully!')),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(submitResult.error ?? 'Submission failed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
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
                  'Individual Verification - ${_formatDuration(widget.durationDays)}',
              metadata: {
                'fullName': _fullName,
                'verificationRequestId': requestId,
              },
            ),
          ),
        );

        if (paymentResult == true && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Payment successful! Verification submitted.')),
          );
          Navigator.pop(context, true);
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text(
                    'Payment was not completed. Your verification is pending payment.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _formatDuration(int days) {
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
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _step == 'form'
                  ? 'Individual Verification'
                  : 'Select Payment Method',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              widget.isFreeVerification || widget.isResubmission
                  ? 'Free — ${_formatDuration(widget.durationDays)}'
                  : 'NPR ${widget.price.toInt()} — ${_formatDuration(widget.durationDays)}',
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
            VerificationStepIndicator(
              currentStep: 1,
              accentColor: Colors.indigo,
            ),

          // Full Name
          _buildLabel('Full Name (as on ID)'),
          TextFormField(
            decoration: _inputDecoration('Enter your full name'),
            validator: (v) =>
                v?.isEmpty == true ? 'Full name is required' : null,
            onSaved: (v) => _fullName = v ?? '',
          ),
          const SizedBox(height: 16),

          // ID Type
          _buildLabel('ID Document Type'),
          DropdownButtonFormField<String>(
            value: _idType,
            decoration: _inputDecoration(''),
            items: const [
              DropdownMenuItem(
                  value: 'citizenship', child: Text('Citizenship')),
              DropdownMenuItem(value: 'passport', child: Text('Passport')),
              DropdownMenuItem(
                  value: 'driving_license',
                  child: Text('Driving License')),
            ],
            onChanged: (v) => setState(() => _idType = v ?? 'citizenship'),
          ),
          const SizedBox(height: 16),

          // ID Number
          _buildLabel('ID Number'),
          TextFormField(
            decoration: _inputDecoration('Enter your ID number'),
            validator: (v) =>
                v?.isEmpty == true ? 'ID number is required' : null,
            onSaved: (v) => _idNumber = v ?? '',
          ),
          const SizedBox(height: 24),

          // Documents
          _buildLabel('ID Document - Front *'),
          _buildDocUpload(
              _idFront, 'front', 'Upload front of your ID'),
          const SizedBox(height: 12),

          _buildLabel('ID Document - Back (optional)'),
          _buildDocUpload(_idBack, 'back', 'Upload back of your ID'),
          const SizedBox(height: 12),

          _buildLabel('Selfie with ID *'),
          _buildDocUpload(
              _selfie, 'selfie', 'Upload a selfie holding your ID'),
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
                          ? 'Submit Verification'
                          : 'Proceed to Payment',
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
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Step indicator
        VerificationStepIndicator(
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
                  Icon(LucideIcons.receipt, size: 20, color: Colors.indigo),
                  const SizedBox(width: 8),
                  const Text(
                    'Order Summary',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildSummaryRow('Plan', 'Individual Verification'),
              _buildSummaryRow(
                  'Duration', _formatDuration(widget.durationDays)),
              _buildSummaryRow('Name', _fullName),
              const Divider(height: 24),
              _buildSummaryRow(
                'Total Amount',
                'NPR ${widget.price.toInt()}',
                isTotal: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Payment Method Selection
        const Text(
          'Select Payment Method',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),

        _buildPaymentMethodCard(
          name: 'Khalti',
          description: 'Pay with Khalti wallet or bank',
          color: const Color(0xFF5C2D91),
          icon: LucideIcons.wallet,
          gateway: PaymentGateway.khalti,
        ),
        const SizedBox(height: 12),

        _buildPaymentMethodCard(
          name: 'eSewa',
          description: 'Pay with eSewa wallet',
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
                    'Pay NPR ${widget.price.toInt()}',
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
            'Secured with 256-bit SSL encryption',
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

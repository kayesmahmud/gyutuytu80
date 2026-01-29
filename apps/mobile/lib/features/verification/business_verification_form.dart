import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/api/verification_client.dart';
import 'package:mobile/features/verification/widgets/validated_step_indicator.dart';
import 'package:mobile/features/verification/widgets/business_forms/business_info_step.dart';
import 'package:mobile/features/verification/widgets/business_forms/business_document_step.dart';
import 'package:mobile/features/verification/widgets/business_forms/business_review_step.dart';

class BusinessVerificationForm extends StatefulWidget {
  final VoidCallback onSuccess;
  final VoidCallback onCancel;
  final int durationDays;
  final double price;
  final bool isFreeVerification;
  final bool isResubmission;

  const BusinessVerificationForm({
    super.key,
    required this.onSuccess,
    required this.onCancel,
    required this.durationDays,
    required this.price,
    this.isFreeVerification = false,
    this.isResubmission = false,
  });

  @override
  State<BusinessVerificationForm> createState() => _BusinessVerificationFormState();
}

class _BusinessVerificationFormState extends State<BusinessVerificationForm> {
  final VerificationClient _verificationClient = VerificationClient();
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  // Form fields
  final _businessNameController = TextEditingController();
  final _businessCategoryController = TextEditingController();
  final _businessDescriptionController = TextEditingController();
  final _businessWebsiteController = TextEditingController();
  final _businessPhoneController = TextEditingController();
  final _businessAddressController = TextEditingController();

  // Files
  File? _businessLicenseFile;

  // State
  bool _isLoading = false;
  String? _error;
  int _currentStep = 0; // 0: Info, 1: Document, 2: Review

  @override
  void dispose() {
    _businessNameController.dispose();
    _businessCategoryController.dispose();
    _businessDescriptionController.dispose();
    _businessWebsiteController.dispose();
    _businessPhoneController.dispose();
    _businessAddressController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _businessLicenseFile = File(image.path);
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick image';
      });
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _businessLicenseFile = File(image.path);
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to take photo';
      });
    }
  }

  void _showImagePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Select Image Source',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: Color(0xFF6366F1)),
                title: const Text('Take Photo'),
                onTap: () {
                  Navigator.pop(context);
                  _takePhoto();
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: Color(0xFF6366F1)),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _validateStep(int step) {
    setState(() => _error = null);

    switch (step) {
      case 0: // Info step
        if (_businessNameController.text.trim().isEmpty) {
          setState(() => _error = 'Please enter your business name');
          return false;
        }
        return true;
      case 1: // Document step
        if (_businessLicenseFile == null) {
          setState(() => _error = 'Please upload your business license document');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  void _nextStep() {
    if (_validateStep(_currentStep)) {
      setState(() {
        _currentStep++;
      });
    }
  }

  void _previousStep() {
    setState(() {
      _currentStep--;
    });
  }

  Future<void> _submit() async {
    if (!_validateStep(0) || !_validateStep(1)) {
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await _verificationClient.submitBusinessVerification(
        businessName: _businessNameController.text.trim(),
        businessLicenseDocPath: _businessLicenseFile!.path,
        businessCategory: _businessCategoryController.text.trim().isNotEmpty
            ? _businessCategoryController.text.trim()
            : null,
        businessDescription: _businessDescriptionController.text.trim().isNotEmpty
            ? _businessDescriptionController.text.trim()
            : null,
        businessWebsite: _businessWebsiteController.text.trim().isNotEmpty
            ? _businessWebsiteController.text.trim()
            : null,
        businessPhone: _businessPhoneController.text.trim().isNotEmpty
            ? _businessPhoneController.text.trim()
            : null,
        businessAddress: _businessAddressController.text.trim().isNotEmpty
            ? _businessAddressController.text.trim()
            : null,
        durationDays: widget.durationDays,
        paymentAmount: widget.isFreeVerification ? 0 : widget.price,
        paymentReference: widget.isFreeVerification ? 'FREE' : 'PENDING',
        isFree: widget.isFreeVerification || widget.isResubmission,
      );

      if (result.success) {
        widget.onSuccess();
      } else {
        setState(() {
          _error = result.errorMessage ?? 'Failed to submit verification';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'An error occurred. Please try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          'Business Verification',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.grey[800],
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: widget.onCancel,
        ),
      ),
      body: Column(
        children: [
          // Stepper indicator
          // Stepper indicator
          ValidatedStepIndicator(
            currentStep: _currentStep,
            steps: const ['Business Info', 'Document', 'Review'],
          ),

          // Error message
          if (_error != null)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFFEF4444),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Form content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: _buildCurrentStep(),
              ),
            ),
          ),

          // Bottom buttons
          _buildBottomButtons(),
        ],
      ),
    );
  }



  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return BusinessInfoStep(
          businessNameController: _businessNameController,
          businessCategoryController: _businessCategoryController,
          businessDescriptionController: _businessDescriptionController,
          businessWebsiteController: _businessWebsiteController,
          businessPhoneController: _businessPhoneController,
          businessAddressController: _businessAddressController,
        );
      case 1:
        return BusinessDocumentStep(
          businessLicenseFile: _businessLicenseFile,
          onPickImage: _showImagePicker,
          onClearImage: () => setState(() => _businessLicenseFile = null),
        );
      case 2:
        return BusinessReviewStep(
          businessName: _businessNameController.text,
          businessCategory: _businessCategoryController.text,
          businessPhone: _businessPhoneController.text,
          businessAddress: _businessAddressController.text,
          durationDays: widget.durationDays,
          price: widget.price,
          isFreeVerification: widget.isFreeVerification,
          businessLicenseFile: _businessLicenseFile,
        );
      default:
        return SizedBox.shrink();
    }
  }

// Extracted steps to widgets/business_forms/


  Widget _buildBottomButtons() {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(color: Colors.grey[300]!),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'Back',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading
                  ? null
                  : (_currentStep == 2 ? _submit : _nextStep),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                disabledBackgroundColor: Colors.grey[300],
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      _currentStep == 2 ? 'Submit Application' : 'Continue',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

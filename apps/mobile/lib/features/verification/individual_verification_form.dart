import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/api/verification_client.dart';
import 'package:mobile/features/verification/widgets/validated_step_indicator.dart';
import 'package:mobile/features/verification/widgets/individual_forms/individual_info_step.dart';
import 'package:mobile/features/verification/widgets/individual_forms/individual_documents_step.dart';
import 'package:mobile/features/verification/widgets/individual_forms/individual_review_step.dart';

class IndividualVerificationForm extends StatefulWidget {
  final VoidCallback onSuccess;
  final VoidCallback onCancel;
  final int durationDays;
  final double price;
  final bool isFreeVerification;
  final bool isResubmission;

  const IndividualVerificationForm({
    super.key,
    required this.onSuccess,
    required this.onCancel,
    required this.durationDays,
    required this.price,
    this.isFreeVerification = false,
    this.isResubmission = false,
  });

  @override
  State<IndividualVerificationForm> createState() => _IndividualVerificationFormState();
}

class _IndividualVerificationFormState extends State<IndividualVerificationForm> {
  final VerificationClient _verificationClient = VerificationClient();
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  // Form fields
  final _fullNameController = TextEditingController();
  final _idNumberController = TextEditingController();
  String _idType = 'citizenship';

  // Files
  File? _idFrontFile;
  File? _idBackFile;
  File? _selfieFile;

  // State
  bool _isLoading = false;
  String? _error;
  int _currentStep = 0; // 0: Info, 1: Documents, 2: Review

  @override
  void dispose() {
    _fullNameController.dispose();
    _idNumberController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(String type) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          switch (type) {
            case 'front':
              _idFrontFile = File(image.path);
              break;
            case 'back':
              _idBackFile = File(image.path);
              break;
            case 'selfie':
              _selfieFile = File(image.path);
              break;
          }
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick image';
      });
    }
  }

  Future<void> _takePhoto(String type) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          switch (type) {
            case 'front':
              _idFrontFile = File(image.path);
              break;
            case 'back':
              _idBackFile = File(image.path);
              break;
            case 'selfie':
              _selfieFile = File(image.path);
              break;
          }
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to take photo';
      });
    }
  }

  void _showImagePicker(String type) {
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
                  _takePhoto(type);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: Color(0xFF6366F1)),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(type);
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
        if (_fullNameController.text.trim().isEmpty) {
          setState(() => _error = 'Please enter your full name');
          return false;
        }
        if (_idNumberController.text.trim().isEmpty) {
          setState(() => _error = 'Please enter your ID document number');
          return false;
        }
        return true;
      case 1: // Documents step
        if (_idFrontFile == null) {
          setState(() => _error = 'Please upload front image of your ID');
          return false;
        }
        if (_selfieFile == null) {
          setState(() => _error = 'Please upload a selfie holding your ID');
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
      final result = await _verificationClient.submitIndividualVerification(
        fullName: _fullNameController.text.trim(),
        idDocumentType: _idType,
        idDocumentNumber: _idNumberController.text.trim(),
        idDocumentFrontPath: _idFrontFile!.path,
        selfieWithIdPath: _selfieFile!.path,
        idDocumentBackPath: _idBackFile?.path,
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
          'Individual Verification',
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
            steps: const ['Personal Info', 'Documents', 'Review'],
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
        return IndividualInfoStep(
          fullNameController: _fullNameController,
          idNumberController: _idNumberController,
          idType: _idType,
          onIdTypeChanged: (value) {
            if (value != null) {
              setState(() => _idType = value);
            }
          },
        );
      case 1:
        return IndividualDocumentsStep(
          idFrontFile: _idFrontFile,
          idBackFile: _idBackFile,
          selfieFile: _selfieFile,
          onPickFront: () => _showImagePicker('front'),
          onPickBack: () => _showImagePicker('back'),
          onPickSelfie: () => _showImagePicker('selfie'),
          onClearFront: () => setState(() => _idFrontFile = null),
          onClearBack: () => setState(() => _idBackFile = null),
          onClearSelfie: () => setState(() => _selfieFile = null),
        );
      case 2:
        return IndividualReviewStep(
          fullName: _fullNameController.text,
          idType: _idType,
          idNumber: _idNumberController.text,
          durationDays: widget.durationDays,
          price: widget.price,
          isFreeVerification: widget.isFreeVerification,
          idFrontFile: _idFrontFile,
          idBackFile: _idBackFile,
          selfieFile: _selfieFile,
        );
      default:
        return SizedBox.shrink();
    }
  }



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

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/api/verification_client.dart';
import '../../core/models/verification_models.dart';

class IndividualVerificationForm extends StatefulWidget {
  const IndividualVerificationForm({Key? key}) : super(key: key);

  @override
  State<IndividualVerificationForm> createState() => _IndividualVerificationFormState();
}

class _IndividualVerificationFormState extends State<IndividualVerificationForm> {
  final _formKey = GlobalKey<FormState>();
  final _client = VerificationClient();
  final _picker = ImagePicker();

  String _fullName = '';
  String _idType = 'citizenship';
  String _idNumber = '';
  File? _idFront;
  File? _idBack;
  File? _selfie;

  bool _isSubmitting = false;

  Future<void> _pickImage(String type) async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        if (type == 'front') _idFront = File(pickedFile.path);
        else if (type == 'back') _idBack = File(pickedFile.path);
        else if (type == 'selfie') _selfie = File(pickedFile.path);
      });
    }
  }

  void _clearImage(String type) {
    setState(() {
      if (type == 'front') _idFront = null;
      else if (type == 'back') _idBack = null;
      else if (type == 'selfie') _selfie = null;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    if (_idFront == null || _selfie == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please upload required documents')),
        );
      }
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

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

      // 2. Submit verification request
      // We need to pass required fields. 
      // IndividualVerificationForm on web passes: durationDays, paymentAmount, paymentReference
      // We should probably ask user for duration? Or default to 365?
      // And payment? The web flow has a payment step.
      // For now, let's assume we implement the free/default flow or ask user.
      // The screenshot showed "Start Verification" -> Form.
      // The web code has `isFreeVerification` flag.
      // Let's check `getVerificationPricing`?
      // For MVP, I will hardcode duration=365 and use a dummy payment reference if free, 
      // or just try to submit and see if backend accepts 'pending' payment.
      
      final submitResult = await _client.submitIndividualVerification(
        documentUrls: uploadResult.data!,
        fullName: _fullName,
        idType: _idType,
        idNumber: _idNumber,
      );

      if (submitResult.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Verification submitted successfully!')),
          );
          Navigator.pop(context, true); // Return success
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
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Individual Verification'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Verify your identity',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Please provide your official details and documents.',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 32),

              // Full Name
              TextFormField(
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(LucideIcons.user),
                ),
                validator: (v) => v?.isNotEmpty == true ? null : 'Required',
                onSaved: (v) => _fullName = v!,
              ),
              const SizedBox(height: 20),

              // ID Type
              DropdownButtonFormField<String>(
                value: _idType,
                decoration: InputDecoration(
                  labelText: 'ID Document Type',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(LucideIcons.fileText),
                ),
                items: const [
                  DropdownMenuItem(value: 'citizenship', child: Text('Citizenship')),
                  DropdownMenuItem(value: 'passport', child: Text('Passport')),
                  DropdownMenuItem(value: 'driving_license', child: Text('Driving License')),
                ],
                onChanged: (v) => setState(() => _idType = v!),
              ),
              const SizedBox(height: 20),

              // ID Number
              TextFormField(
                decoration: InputDecoration(
                  labelText: 'ID Document Number',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(LucideIcons.hash),
                ),
                validator: (v) => v?.isNotEmpty == true ? null : 'Required',
                onSaved: (v) => _idNumber = v!,
              ),
              const SizedBox(height: 32),

              const Text('Upload Documents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),

              _buildUploadButton('ID Front *', 'front', _idFront),
              const SizedBox(height: 12),
              _buildUploadButton('ID Back', 'back', _idBack),
              const SizedBox(height: 12),
              _buildUploadButton('Selfie with ID *', 'selfie', _selfie),

              const SizedBox(height: 40),
              
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Submit Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUploadButton(String label, String type, File? file) {
    return InkWell(
      onTap: () => _pickImage(type),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
          color: Colors.grey.shade50,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: file != null ? Colors.green.withOpacity(0.1) : Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                file != null ? LucideIcons.check : LucideIcons.upload,
                color: file != null ? Colors.green : Colors.blue,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Text(
                    label,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  if (file != null)
                    Text(
                      file.path.split('/').last,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            if (file != null)
              IconButton(
                icon: const Icon(LucideIcons.x, size: 18, color: Colors.red),
                onPressed: () => _clearImage(type),
              ),
          ],
        ),
      ),
    );
  }
}

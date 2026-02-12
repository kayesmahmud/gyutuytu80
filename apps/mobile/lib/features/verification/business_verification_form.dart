import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/api/verification_client.dart';
import '../../core/models/verification_models.dart';

class BusinessVerificationForm extends StatefulWidget {
  const BusinessVerificationForm({Key? key}) : super(key: key);

  @override
  State<BusinessVerificationForm> createState() => _BusinessVerificationFormState();
}

class _BusinessVerificationFormState extends State<BusinessVerificationForm> {
  final _formKey = GlobalKey<FormState>();
  final _client = VerificationClient();
  final _picker = ImagePicker();

  String _businessName = '';
  String _businessCategory = '';
  String _businessDescription = '';
  String _businessWebsite = '';
  String _businessPhone = '';
  String _businessAddress = '';
  File? _licenseDocument;

  bool _isSubmitting = false;

  Future<void> _pickDocument() async {
    // For MVP, using ImagePicker. In production, FilePicker might be better for PDFs.
    // Assuming backend accepts images for license.
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _licenseDocument = File(pickedFile.path);
      });
    }
  }

  void _clearDocument() {
    setState(() {
      _licenseDocument = null;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    if (_licenseDocument == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please upload business license document')),
        );
      }
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      // 1. Upload business document
      final uploadResult = await _client.uploadBusinessDocument(_licenseDocument!);

      if (!uploadResult.success || uploadResult.data == null) {
        throw Exception(uploadResult.error ?? 'Document upload failed');
      }

      final String uploadedFilename = uploadResult.data!['filename'];

      // 2. Submit verification request
      // Similar to Individual, defaulting duration/payment for MVP.
      final submitResult = await _client.submitBusinessVerification(
        businessName: _businessName,
        licenseDocument: uploadedFilename,
        businessCategory: _businessCategory,
        businessDescription: _businessDescription,
        businessWebsite: _businessWebsite,
        businessPhone: _businessPhone,
        businessAddress: _businessAddress,
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
        title: const Text('Business Verification'),
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
                'Verify your business',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Provide your business details and license.',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 32),

              // Business Name
              TextFormField(
                decoration: _inputDecoration('Business Name', LucideIcons.building),
                validator: (v) => v?.isNotEmpty == true ? null : 'Required',
                onSaved: (v) => _businessName = v!,
              ),
              const SizedBox(height: 20),

              // Category
              TextFormField(
                decoration: _inputDecoration('Category', LucideIcons.tag),
                onSaved: (v) => _businessCategory = v ?? '',
              ),
              const SizedBox(height: 20),

              // Description
              TextFormField(
                decoration: _inputDecoration('Description', LucideIcons.fileText),
                maxLines: 3,
                onSaved: (v) => _businessDescription = v ?? '',
              ),
              const SizedBox(height: 20),

              // Contact Info
              TextFormField(
                decoration: _inputDecoration('Phone', LucideIcons.phone),
                keyboardType: TextInputType.phone,
                onSaved: (v) => _businessPhone = v ?? '',
              ),
              const SizedBox(height: 20),
              
              TextFormField(
                decoration: _inputDecoration('Address', LucideIcons.mapPin),
                onSaved: (v) => _businessAddress = v ?? '',
              ),
              const SizedBox(height: 20),

              TextFormField(
                decoration: _inputDecoration('Website (Optional)', LucideIcons.globe),
                keyboardType: TextInputType.url,
                onSaved: (v) => _businessWebsite = v ?? '',
              ),
              const SizedBox(height: 32),

              const Text('Business License', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),

              _buildUploadButton('Upload License *', _licenseDocument),

              const SizedBox(height: 40),
              
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber, // Business color
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

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      prefixIcon: Icon(icon),
    );
  }

  Widget _buildUploadButton(String label, File? file) {
    return InkWell(
      onTap: _pickDocument,
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
                color: file != null ? Colors.green.withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                file != null ? LucideIcons.check : LucideIcons.upload,
                color: file != null ? Colors.green : Colors.amber,
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
                onPressed: _clearDocument,
              ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/support_ticket.dart';
import 'ticket_detail_screen.dart';

class CreateTicketScreen extends StatefulWidget {
  const CreateTicketScreen({super.key});

  @override
  State<CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends State<CreateTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _client = SupportClient();

  SupportTicketCategory _category = SupportTicketCategory.general;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final response = await _client.createTicket(
      subject: _subjectController.text.trim(),
      message: _messageController.text.trim(),
      category: _category.name,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (response.hasData) {
      // Navigate to ticket detail, replacing this screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
            builder: (_) => TicketDetailScreen(ticketId: response.data!.id)),
      );
      // Also tell the previous screen a ticket was created
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.errorMessage),
          backgroundColor: Colors.red[700],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('New Support Ticket',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Category dropdown
              Text('Category',
                  style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF374151))),
              const SizedBox(height: 6),
              DropdownButtonFormField<SupportTicketCategory>(
                initialValue: _category,
                decoration: _inputDecoration('Select a category'),
                items: SupportTicketCategory.values
                    .map((c) => DropdownMenuItem(
                        value: c, child: Text(c.label)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _category = v);
                },
              ),

              const SizedBox(height: 20),

              // Subject
              Text('Subject',
                  style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF374151))),
              const SizedBox(height: 6),
              TextFormField(
                controller: _subjectController,
                decoration: _inputDecoration('Brief summary of your issue'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Subject is required' : null,
                textInputAction: TextInputAction.next,
                style: GoogleFonts.inter(fontSize: 15),
              ),

              const SizedBox(height: 20),

              // Message
              Text('Description',
                  style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF374151))),
              const SizedBox(height: 6),
              TextFormField(
                controller: _messageController,
                decoration: _inputDecoration('Describe your issue in detail...'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Description is required' : null,
                maxLines: 6,
                style: GoogleFonts.inter(fontSize: 15),
              ),

              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE11D48),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                    disabledBackgroundColor: Colors.grey[300],
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : Text('Submit Ticket',
                          style: GoogleFonts.inter(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(color: Colors.grey[400]),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE11D48)),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    );
  }
}

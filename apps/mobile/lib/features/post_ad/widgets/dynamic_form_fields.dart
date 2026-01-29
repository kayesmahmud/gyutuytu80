import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/post_ad/services/form_template_service.dart';

class DynamicFormFields extends StatelessWidget {
  final List<FormFieldModel> fields;
  final Map<String, dynamic> values;
  final Function(String key, dynamic value) onChanged;

  const DynamicFormFields({
    super.key,
    required this.fields,
    required this.values,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (fields.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.blue[50], // Light blue bg like web
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue[100]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.assignment_outlined, color: Colors.blue, size: 20),
              const SizedBox(width: 8),
              Text(
                "Additional Details",
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue[900],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...fields.map((field) => _buildField(field)).toList(),
        ],
      ),
    );
  }

  Widget _buildField(FormFieldModel field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLabel(field),
          const SizedBox(height: 8),
          _buildInput(field),
        ],
      ),
    );
  }

  Widget _buildLabel(FormFieldModel field) {
    return RichText(
      text: TextSpan(
        text: field.label,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: Colors.grey[800],
        ),
        children: [
          if (field.required)
            const TextSpan(
              text: " *",
              style: TextStyle(color: Colors.red),
            ),
        ],
      ),
    );
  }

  Widget _buildInput(FormFieldModel field) {
    switch (field.type) {
      case FieldType.text:
      case FieldType.number:
        return TextFormField(
          initialValue: values[field.name]?.toString(),
          keyboardType: field.type == FieldType.number
              ? TextInputType.number
              : TextInputType.text,
          onChanged: (val) => onChanged(field.name, val),
          validator: (val) {
            if (field.required && (val == null || val.isEmpty)) {
              return '${field.label} is required';
            }
            return null;
          },
          decoration: _inputDecoration(field.placeholder),
        );

      case FieldType.select:
        return DropdownButtonFormField<String>(
          value: values[field.name],
          decoration: _inputDecoration(field.placeholder),
          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
          onChanged: (val) => onChanged(field.name, val),
          validator: (val) {
            if (field.required && val == null) {
              return 'Please select ${field.label}';
            }
            return null;
          },
          items: field.options?.map((opt) {
            return DropdownMenuItem(
              value: opt,
              child: Text(opt, style: GoogleFonts.inter(fontSize: 14)),
            );
          }).toList(),
        );

      case FieldType.checkbox:
        // TODO: Implement checkbox if needed, usually boolean switch
        return CheckboxListTile(
          value: values[field.name] ?? false,
          onChanged: (val) => onChanged(field.name, val),
          title: Text(field.label, style: GoogleFonts.inter(fontSize: 14)),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        );
        
      default:
        return const SizedBox.shrink();
    }
  }

  InputDecoration _inputDecoration(String? hint) {
    return InputDecoration(
      hintText: hint ?? 'Enter value',
      hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      fillColor: Colors.white,
      filled: true,
    );
  }
}

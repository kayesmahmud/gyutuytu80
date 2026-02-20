import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
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
        color: Colors.blue[50],
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
          ...fields.map((field) => _buildField(context, field)).toList(),
        ],
      ),
    );
  }

  Widget _buildField(BuildContext context, FormFieldModel field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLabel(field),
          const SizedBox(height: 8),
          _buildInput(context, field),
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

  Widget _buildInput(BuildContext context, FormFieldModel field) {
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
          decoration: _inputDecoration(field.placeholder ?? 'Enter ${field.label.toLowerCase()}'),
        );

      case FieldType.select:
        return DropdownButtonFormField<String>(
          value: values[field.name],
          decoration: _inputDecoration(field.placeholder ?? 'Select ${field.label}'),
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

      case FieldType.multiselect:
        return _buildMultiselect(field);

      case FieldType.checkbox:
        return CheckboxListTile(
          value: values[field.name] ?? false,
          onChanged: (val) => onChanged(field.name, val),
          title: Text(field.label, style: GoogleFonts.inter(fontSize: 14)),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        );

      case FieldType.date:
        return _buildDatePicker(context, field);
    }
  }

  Widget _buildMultiselect(FormFieldModel field) {
    final selected = List<String>.from(values[field.name] ?? []);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: (field.options ?? []).map((opt) {
          final isSelected = selected.contains(opt);
          return FilterChip(
            label: Text(
              opt,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: isSelected ? Colors.white : Colors.grey[800],
              ),
            ),
            selected: isSelected,
            selectedColor: const Color(0xFF10B981),
            checkmarkColor: Colors.white,
            backgroundColor: Colors.grey[100],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: isSelected ? const Color(0xFF10B981) : Colors.grey[300]!,
              ),
            ),
            onSelected: (val) {
              final updated = List<String>.from(selected);
              if (val) {
                updated.add(opt);
              } else {
                updated.remove(opt);
              }
              onChanged(field.name, updated);
            },
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDatePicker(BuildContext context, FormFieldModel field) {
    final currentValue = values[field.name]?.toString();
    return TextFormField(
      readOnly: true,
      controller: TextEditingController(text: currentValue ?? ''),
      decoration: _inputDecoration(field.placeholder ?? 'Select date').copyWith(
        suffixIcon: const Icon(Icons.calendar_today, size: 18, color: Colors.grey),
      ),
      validator: (val) {
        if (field.required && (val == null || val.isEmpty)) {
          return '${field.label} is required';
        }
        return null;
      },
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(primary: Color(0xFF10B981)),
              ),
              child: child!,
            );
          },
        );
        if (picked != null) {
          onChanged(field.name, DateFormat('yyyy-MM-dd').format(picked));
        }
      },
    );
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

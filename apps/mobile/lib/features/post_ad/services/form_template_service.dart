import 'package:flutter/material.dart';

enum FieldType { text, number, select, multiselect, checkbox, date }

class FormFieldModel {
  final String name;
  final String label;
  final FieldType type;
  final bool required;
  final String? placeholder;
  final List<String>? options;
  final dynamic appliesTo; // List<String> or "all"
  final double? min;
  final double? max;

  FormFieldModel({
    required this.name,
    required this.label,
    required this.type,
    this.required = false,
    this.placeholder,
    this.options,
    this.appliesTo = 'all',
    this.min,
    this.max,
  });

  bool isApplicable(String subcategory) {
    if (appliesTo == 'all') return true;
    if (appliesTo is List) {
      return (appliesTo as List).contains(subcategory);
    }
    return false;
  }
}

class FormTemplate {
  final String name;
  final List<FormFieldModel> fields;

  FormTemplate({required this.name, required this.fields});
}

class FormTemplateService {
  // --- Constants (Ported from Web) ---
  static const _CONDITION_OPTIONS = ['Brand New', 'Used'];
  static const _WARRANTY_OPTIONS = [
    'No Warranty',
    'Under Warranty (< 6 months)',
    'Under Warranty (6-12 months)',
    'Under Warranty (1+ years)',
  ];
  
  // Category Mapping
  static const Map<String, String> _categoryTemplateMap = {
    'Mobiles': 'electronics',
    'Electronics': 'electronics',
    'Vehicles': 'vehicles',
    'Property': 'property',
    "Men's Fashion & Grooming": 'fashion',
    "Women's Fashion & Beauty": 'fashion',
    'Pets & Animals': 'pets',
    'Services': 'services',
    'Jobs': 'services',
    'Education': 'services',
    'Overseas Jobs': 'services',
    'Home & Living': 'general',
    'Hobbies, Sports & Kids': 'general',
    'Business & Industry': 'general',
    'Essentials': 'general',
    'Agriculture': 'general',
  };

  // --- Helpers ---
  static FormFieldModel _createConditionField([List<String>? options]) {
    return FormFieldModel(
      name: 'condition',
      label: 'Condition',
      type: FieldType.select,
      required: true,
      options: options ?? _CONDITION_OPTIONS,
    );
  }

  static FormFieldModel _createBrandField(String placeholder) {
    return FormFieldModel(
      name: 'brand',
      label: 'Brand',
      type: FieldType.text,
      required: true,
      placeholder: placeholder,
    );
  }

  static FormFieldModel _createModelField(String placeholder) {
    return FormFieldModel(
      name: 'model',
      label: 'Model',
      type: FieldType.text,
      required: false,
      placeholder: placeholder,
    );
  }
  
  static FormFieldModel _createWarrantyField() {
    return FormFieldModel(
      name: 'warranty',
      label: 'Warranty',
      type: FieldType.select,
      required: false,
      options: _WARRANTY_OPTIONS,
    );
  }

  // --- Templates ---
  
  static final FormTemplate _electronicsTemplate = FormTemplate(
    name: 'Electronics & Gadgets',
    fields: [
      _createConditionField(),
      _createBrandField('e.g., Apple, Samsung, Dell, HP'),
      _createModelField('e.g., iPhone 15 Pro, Galaxy S23'),
      _createWarrantyField(),
      FormFieldModel(
        name: 'storage',
        label: 'Storage Capacity',
        type: FieldType.select,
        required: true,
        options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
        appliesTo: ['Mobile Phones', 'Tablets & Accessories'],
      ),
      FormFieldModel(
        name: 'ram',
        label: 'RAM',
        type: FieldType.select,
        required: true,
        options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
        appliesTo: ['Mobile Phones', 'Laptops', 'Desktop Computers', 'Tablets & Accessories'],
      ),
       FormFieldModel(
        name: 'processor',
        label: 'Processor',
        type: FieldType.text,
        required: true,
        placeholder: 'e.g., Intel Core i5 12th Gen',
        appliesTo: ['Laptops', 'Desktop Computers'],
      ),
    ],
  );

  static final FormTemplate _vehiclesTemplate = FormTemplate(
    name: 'Vehicles',
    fields: [
      _createConditionField(),
      _createBrandField('e.g., Toyota, Honda, Yamaha'),
      _createModelField('e.g., Corolla, Shine'),
      FormFieldModel(
        name: 'year',
        label: 'Manufacture Year',
        type: FieldType.number,
        required: true,
        placeholder: 'e.g., 2023',
      ),
      FormFieldModel(
        name: 'mileage',
        label: 'Mileage (km)',
        type: FieldType.number,
        required: true,
        placeholder: 'e.g., 25000',
      ),
       FormFieldModel(
        name: 'transmission',
        label: 'Transmission',
        type: FieldType.select,
        required: true,
        options: ['Automatic', 'Manual', 'Semi-Automatic'],
        appliesTo: ['Cars', 'Vans', 'Trucks', 'Buses'],
      ),
       FormFieldModel(
        name: 'fuel',
        label: 'Fuel Type',
        type: FieldType.select,
        required: true,
        options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
      ),
    ],
  );
  
  static final FormTemplate _propertyTemplate = FormTemplate(
      name: 'Property', 
      fields: [
          FormFieldModel(
              name: 'type',
              label: 'Property Type',
              type: FieldType.select,
              required: true,
              options: ['House', 'Apartment', 'Land', 'Office Space', 'Shop'],
          ),
          FormFieldModel(
              name: 'area',
              label: 'Area / Size',
              type: FieldType.text,
              required: true,
              placeholder: 'e.g., 4 Ana, 1200 sq ft',
          ),
          FormFieldModel(
              name: 'bedrooms',
              label: 'Bedrooms',
              type: FieldType.number,
              required: false,
              appliesTo: ['Houses', 'Apartments'],
          ),
           FormFieldModel(
              name: 'bathrooms',
              label: 'Bathrooms',
              type: FieldType.number,
              required: false,
              appliesTo: ['Houses', 'Apartments'],
          ),
           FormFieldModel(
              name: 'floor',
              label: 'Floor',
              type: FieldType.text,
              required: false,
              placeholder: 'e.g., 5th Floor',
              appliesTo: ['Apartments', 'Office Space'],
          ),
      ]
  );
  
  static final FormTemplate _generalTemplate = FormTemplate(
      name: 'General',
      fields: [
          _createConditionField(),
      ]
  );

  static final Map<String, FormTemplate> _templates = {
    'electronics': _electronicsTemplate,
    'vehicles': _vehiclesTemplate,
    'property': _propertyTemplate,
    'general': _generalTemplate,
  };

  /// Get applicable fields for a specific category and subcategory
  List<FormFieldModel> getApplicableFields(String categoryName, String subcategoryName) {
    final templateName = _categoryTemplateMap[categoryName] ?? 'general';
    final template = _templates[templateName] ?? _generalTemplate;
    
    return template.fields.where((field) => field.isApplicable(subcategoryName)).toList();
  }
}

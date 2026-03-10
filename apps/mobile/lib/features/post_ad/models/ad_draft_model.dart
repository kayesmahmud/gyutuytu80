import 'dart:convert';

class AdDraft {
  final String id;
  final String title;
  final String description;
  final String price;
  final int? categoryId;
  final int? subcategoryId;
  final int? provinceId;
  final int? districtId;
  final int? municipalityId;
  final int? areaId;
  final bool isNegotiable;
  final Map<String, dynamic> customFields;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AdDraft({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    this.categoryId,
    this.subcategoryId,
    this.provinceId,
    this.districtId,
    this.municipalityId,
    this.areaId,
    required this.isNegotiable,
    required this.customFields,
    required this.createdAt,
    required this.updatedAt,
  });

  AdDraft copyWith({
    String? id,
    String? title,
    String? description,
    String? price,
    int? categoryId,
    int? subcategoryId,
    int? provinceId,
    int? districtId,
    int? municipalityId,
    int? areaId,
    bool? isNegotiable,
    Map<String, dynamic>? customFields,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AdDraft(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      price: price ?? this.price,
      categoryId: categoryId ?? this.categoryId,
      subcategoryId: subcategoryId ?? this.subcategoryId,
      provinceId: provinceId ?? this.provinceId,
      districtId: districtId ?? this.districtId,
      municipalityId: municipalityId ?? this.municipalityId,
      areaId: areaId ?? this.areaId,
      isNegotiable: isNegotiable ?? this.isNegotiable,
      customFields: customFields ?? this.customFields,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory AdDraft.fromMap(Map<String, dynamic> map) {
    return AdDraft(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      price: map['price'] as String? ?? '',
      categoryId: map['categoryId'] as int?,
      subcategoryId: map['subcategoryId'] as int?,
      provinceId: map['provinceId'] as int?,
      districtId: map['districtId'] as int?,
      municipalityId: map['municipalityId'] as int?,
      areaId: map['areaId'] as int?,
      isNegotiable: map['isNegotiable'] as bool? ?? false,
      customFields: (map['customFields'] as Map<String, dynamic>?) ?? {},
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'price': price,
      'categoryId': categoryId,
      'subcategoryId': subcategoryId,
      'provinceId': provinceId,
      'districtId': districtId,
      'municipalityId': municipalityId,
      'areaId': areaId,
      'isNegotiable': isNegotiable,
      'customFields': customFields,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory AdDraft.fromJson(String str) =>
      AdDraft.fromMap(json.decode(str) as Map<String, dynamic>);
  String toJson() => json.encode(toMap());

  /// Display name: title if non-empty, else "Untitled Draft"
  String get displayName =>
      title.trim().isNotEmpty ? title.trim() : 'Untitled Draft';

  bool get hasContent =>
      title.trim().isNotEmpty ||
      description.trim().isNotEmpty ||
      price.trim().isNotEmpty ||
      categoryId != null;
}

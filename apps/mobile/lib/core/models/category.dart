/// Category models - mirrors @thulobazaar/types Category interfaces

class Category {
  final int id;
  final String name;
  final String? nameNe;
  final String slug;
  final String? icon;
  final int? parentId;
  final bool isActive;
  final int sortOrder;

  Category({
    required this.id,
    required this.name,
    this.nameNe,
    required this.slug,
    this.icon,
    this.parentId,
    required this.isActive,
    required this.sortOrder,
  });

  /// Returns the localized name based on locale
  String localizedName(String locale) =>
      locale == 'ne' && nameNe != null && nameNe!.isNotEmpty ? nameNe! : name;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      nameNe: json['nameNe'] as String? ?? json['name_ne'] as String?,
      slug: json['slug'] as String? ?? '',
      icon: json['icon'] as String?,
      parentId: json['parentId'] as int? ?? json['parent_id'] as int?,
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
      sortOrder: json['sortOrder'] as int? ?? json['sort_order'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'nameNe': nameNe,
      'slug': slug,
      'icon': icon,
      'parentId': parentId,
      'isActive': isActive,
      'sortOrder': sortOrder,
    };
  }

  /// Check if this is a parent category (no parentId)
  bool get isParent => parentId == null;

  Category copyWith({
    int? id,
    String? name,
    String? nameNe,
    String? slug,
    String? icon,
    int? parentId,
    bool? isActive,
    int? sortOrder,
  }) {
    return Category(
      id: id ?? this.id,
      name: name ?? this.name,
      nameNe: nameNe ?? this.nameNe,
      slug: slug ?? this.slug,
      icon: icon ?? this.icon,
      parentId: parentId ?? this.parentId,
      isActive: isActive ?? this.isActive,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }
}

/// Category with nested subcategories
class CategoryWithSubcategories extends Category {
  final List<Category> subcategories;

  CategoryWithSubcategories({
    required super.id,
    required super.name,
    super.nameNe,
    required super.slug,
    super.icon,
    super.parentId,
    required super.isActive,
    required super.sortOrder,
    required this.subcategories,
  });

  factory CategoryWithSubcategories.fromJson(Map<String, dynamic> json) {
    final category = Category.fromJson(json);

    // Parse subcategories - could be under different keys
    List<Category> subs = [];
    final subsData = json['subcategories'] ?? json['other_categories'] ?? json['children'];
    if (subsData != null && subsData is List) {
      subs = subsData.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
    }

    return CategoryWithSubcategories(
      id: category.id,
      name: category.name,
      nameNe: category.nameNe,
      slug: category.slug,
      icon: category.icon,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      subcategories: subs,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['subcategories'] = subcategories.map((e) => e.toJson()).toList();
    return json;
  }

  /// Check if this category has subcategories
  bool get hasSubcategories => subcategories.isNotEmpty;
}

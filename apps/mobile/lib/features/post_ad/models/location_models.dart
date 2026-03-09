class LocationHierarchyBase {
  final int id;
  final String name;
  final String? nameNe;
  final String slug;
  final String type;
  final int? parentId;

  LocationHierarchyBase({
    required this.id,
    required this.name,
    this.nameNe,
    required this.slug,
    required this.type,
    this.parentId,
  });

  String localizedName(String locale) =>
      locale == 'ne' && nameNe != null && nameNe!.isNotEmpty ? nameNe! : name;

  factory LocationHierarchyBase.fromJson(Map<String, dynamic> json) {
    return LocationHierarchyBase(
      id: json['id'],
      name: json['name'],
      nameNe: json['nameNe'] as String? ?? json['name_ne'] as String?,
      slug: json['slug'] ?? '',
      type: json['type'],
      parentId: json['parent_id'],
    );
  }
}

class LocationArea extends LocationHierarchyBase {
  LocationArea({
    required super.id,
    required super.name,
    super.nameNe,
    required super.slug,
    required super.type,
    super.parentId,
  });

  factory LocationArea.fromJson(Map<String, dynamic> json) {
    return LocationArea(
      id: json['id'],
      name: json['name'],
      nameNe: json['nameNe'] as String? ?? json['name_ne'] as String?,
      slug: json['slug'] ?? '',
      type: json['type'],
      parentId: json['parent_id'],
    );
  }
}

class LocationMunicipality extends LocationHierarchyBase {
  final List<LocationArea> areas;

  LocationMunicipality({
    required super.id,
    required super.name,
    super.nameNe,
    required super.slug,
    required super.type,
    super.parentId,
    this.areas = const [],
  });

  factory LocationMunicipality.fromJson(Map<String, dynamic> json) {
    var rawChildren = json['areas'] as List? ?? json['children'] as List? ?? [];
    var areas = rawChildren
        .map((e) => LocationArea.fromJson(e))
        .toList();

    return LocationMunicipality(
      id: json['id'],
      name: json['name'],
      nameNe: json['nameNe'] as String? ?? json['name_ne'] as String?,
      slug: json['slug'] ?? '',
      type: json['type'],
      parentId: json['parent_id'],
      areas: areas,
    );
  }
}

class LocationDistrict extends LocationHierarchyBase {
  final List<LocationMunicipality> municipalities;

  LocationDistrict({
    required super.id,
    required super.name,
    super.nameNe,
    required super.slug,
    required super.type,
    super.parentId,
    this.municipalities = const [],
  });

  factory LocationDistrict.fromJson(Map<String, dynamic> json) {
    var rawChildren = json['municipalities'] as List? ?? json['children'] as List? ?? [];
    var muncs = rawChildren
        .map((e) => LocationMunicipality.fromJson(e))
        .toList();

    return LocationDistrict(
      id: json['id'],
      name: json['name'],
      nameNe: json['nameNe'] as String? ?? json['name_ne'] as String?,
      slug: json['slug'] ?? '',
      type: json['type'],
      parentId: json['parent_id'],
      municipalities: muncs,
    );
  }
}

class LocationProvince extends LocationHierarchyBase {
  final List<LocationDistrict> districts;

  LocationProvince({
    required super.id,
    required super.name,
    super.nameNe,
    required super.slug,
    required super.type,
    super.parentId,
    this.districts = const [],
  });

  factory LocationProvince.fromJson(Map<String, dynamic> json) {
    var rawChildren = json['districts'] as List? ?? json['children'] as List? ?? [];
    var dists = rawChildren
        .map((e) => LocationDistrict.fromJson(e))
        .toList();

    return LocationProvince(
      id: json['id'],
      name: json['name'],
      nameNe: json['nameNe'] as String? ?? json['name_ne'] as String?,
      slug: json['slug'] ?? '',
      type: json['type'],
      parentId: json['parent_id'],
      districts: dists,
    );
  }
}

/// Location models - mirrors @thulobazaar/types Location interfaces

enum LocationType { province, district, municipality, area }

/// Base Location model
class Location {
  final int id;
  final String name;
  final String slug;
  final LocationType type;
  final int? parentId;
  final double? latitude;
  final double? longitude;
  final bool isActive;

  Location({
    required this.id,
    required this.name,
    required this.slug,
    required this.type,
    this.parentId,
    this.latitude,
    this.longitude,
    required this.isActive,
  });

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      type: _parseLocationType(json['type']),
      parentId: json['parentId'] as int? ?? json['parent_id'] as int?,
      latitude: _parseDoubleNullable(json['latitude']),
      longitude: _parseDoubleNullable(json['longitude']),
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'type': type.name,
      'parentId': parentId,
      'latitude': latitude,
      'longitude': longitude,
      'isActive': isActive,
    };
  }
}

/// Location with hierarchy (children)
class LocationHierarchy extends Location {
  final List<LocationHierarchy>? children;
  final String? parentName;

  LocationHierarchy({
    required super.id,
    required super.name,
    required super.slug,
    required super.type,
    super.parentId,
    super.latitude,
    super.longitude,
    required super.isActive,
    this.children,
    this.parentName,
  });

  factory LocationHierarchy.fromJson(Map<String, dynamic> json) {
    final location = Location.fromJson(json);

    List<LocationHierarchy>? childrenList;
    final childrenData = json['children'] ?? json['locations'];
    if (childrenData != null && childrenData is List) {
      childrenList = childrenData
          .map((e) => LocationHierarchy.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return LocationHierarchy(
      id: location.id,
      name: location.name,
      slug: location.slug,
      type: location.type,
      parentId: location.parentId,
      latitude: location.latitude,
      longitude: location.longitude,
      isActive: location.isActive,
      children: childrenList,
      parentName: json['parentName'] as String? ?? json['parent_name'] as String?,
    );
  }

  bool get hasChildren => children != null && children!.isNotEmpty;
}

/// Area model (for detailed location)
class Area {
  final int id;
  final String name;
  final int? listingCount;
  final bool isPopular;

  Area({
    required this.id,
    required this.name,
    this.listingCount,
    this.isPopular = false,
  });

  factory Area.fromJson(Map<String, dynamic> json) {
    return Area(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      listingCount: json['listing_count'] as int? ?? json['listingCount'] as int?,
      isPopular: json['is_popular'] as bool? ?? json['isPopular'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'listing_count': listingCount,
      'is_popular': isPopular,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Area && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Municipality model
class Municipality {
  final int id;
  final String name;
  final String type;
  final int areaCount;
  final List<Area>? areas;

  Municipality({
    required this.id,
    required this.name,
    required this.type,
    required this.areaCount,
    this.areas,
  });

  factory Municipality.fromJson(Map<String, dynamic> json) {
    List<Area>? areasList;
    final areasData = json['areas'];
    if (areasData != null && areasData is List) {
      areasList = areasData.map((e) => Area.fromJson(e as Map<String, dynamic>)).toList();
    }

    return Municipality(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'municipality',
      areaCount: json['area_count'] as int? ?? json['areaCount'] as int? ?? 0,
      areas: areasList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'area_count': areaCount,
      'areas': areas?.map((e) => e.toJson()).toList(),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Municipality && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// District model
class District {
  final int id;
  final String name;
  final int areaCount;
  final List<Municipality> municipalities;

  District({
    required this.id,
    required this.name,
    required this.areaCount,
    required this.municipalities,
  });

  factory District.fromJson(Map<String, dynamic> json) {
    List<Municipality> muns = [];
    final munsData = json['municipalities'];
    if (munsData != null && munsData is List) {
      muns = munsData.map((e) => Municipality.fromJson(e as Map<String, dynamic>)).toList();
    }

    return District(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      areaCount: json['area_count'] as int? ?? json['areaCount'] as int? ?? 0,
      municipalities: muns,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'area_count': areaCount,
      'municipalities': municipalities.map((e) => e.toJson()).toList(),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is District && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Province model
class Province {
  final int id;
  final String name;
  final List<District>? districts;

  Province({
    required this.id,
    required this.name,
    this.districts,
  });

  factory Province.fromJson(Map<String, dynamic> json) {
    List<District>? districtsList;
    final districtsData = json['districts'];
    if (districtsData != null && districtsData is List) {
      districtsList = districtsData.map((e) => District.fromJson(e as Map<String, dynamic>)).toList();
    }

    return Province(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      districts: districtsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'districts': districts?.map((e) => e.toJson()).toList(),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Province && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Areas Hierarchy Response
class AreasHierarchyResponse {
  final int provinceId;
  final List<District> districts;

  AreasHierarchyResponse({
    required this.provinceId,
    required this.districts,
  });

  factory AreasHierarchyResponse.fromJson(Map<String, dynamic> json) {
    List<District> districtsList = [];
    final districtsData = json['districts'];
    if (districtsData != null && districtsData is List) {
      districtsList = districtsData.map((e) => District.fromJson(e as Map<String, dynamic>)).toList();
    }

    return AreasHierarchyResponse(
      provinceId: json['province_id'] as int? ?? json['provinceId'] as int? ?? 0,
      districts: districtsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'province_id': provinceId,
      'districts': districts.map((e) => e.toJson()).toList(),
    };
  }
}

// Helper functions
LocationType _parseLocationType(dynamic value) {
  if (value == null) return LocationType.area;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'province':
      return LocationType.province;
    case 'district':
      return LocationType.district;
    case 'municipality':
      return LocationType.municipality;
    default:
      return LocationType.area;
  }
}

double? _parseDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value.toString());
}

/// One entry of the keyword→category dictionary used for post-ad
/// title suggestions. Mirrors @thulobazaar/types CategoryKeyword.
class CategoryKeyword {
  final String keyword;
  final int categoryId;
  final int? subcategoryId;

  const CategoryKeyword({
    required this.keyword,
    required this.categoryId,
    this.subcategoryId,
  });

  factory CategoryKeyword.fromJson(Map<String, dynamic> json) {
    return CategoryKeyword(
      keyword: json['keyword'] as String? ?? '',
      categoryId: json['categoryId'] as int? ?? 0,
      subcategoryId: json['subcategoryId'] as int?,
    );
  }
}

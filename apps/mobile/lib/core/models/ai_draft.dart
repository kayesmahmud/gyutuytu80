/// AI autofill draft from photos (POST /api/ads/ai-draft).
/// Every field is a suggestion the user can edit; null = AI could not judge.
/// [sellable] false → photos show no listable item (drives a warning, never a block).
class AiDraft {
  final String? title;
  final String? description;
  final int? categoryId;
  final int? subcategoryId;

  /// Canonical condition: 'Brand New' | 'Used' (server maps everything else).
  final String? condition;
  final String? brand;
  final String? model;
  final int? priceEstimate;
  final bool sellable;

  /// Why the photos can't make a listing ('selfie' | 'screenshot' | 'unclear'
  /// | 'other') — only set when [sellable] is false.
  final String? unsellableReason;
  final double confidence;

  const AiDraft({
    this.title,
    this.description,
    this.categoryId,
    this.subcategoryId,
    this.condition,
    this.brand,
    this.model,
    this.priceEstimate,
    required this.sellable,
    this.unsellableReason,
    required this.confidence,
  });

  factory AiDraft.fromMap(Map<String, dynamic> json) {
    final attrsRaw = json['attributes'];
    final attrs = attrsRaw is Map<String, dynamic>
        ? attrsRaw
        : const <String, dynamic>{};
    return AiDraft(
      title: json['title'] as String?,
      description: json['description'] as String?,
      categoryId: (json['categoryId'] as num?)?.toInt(),
      subcategoryId: (json['subcategoryId'] as num?)?.toInt(),
      condition: attrs['condition'] as String?,
      brand: attrs['brand'] as String?,
      model: attrs['model'] as String?,
      priceEstimate: (json['priceEstimate'] as num?)?.toInt(),
      sellable: json['sellable'] == true,
      unsellableReason: json['unsellableReason'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
    );
  }
}

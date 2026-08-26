import '../models/category_keyword.dart';

/// Keyword→category matcher for post-ad title suggestions.
/// Contract (mirrored by apps/web/src/lib/categorySuggest.ts — keep in sync):
/// - lowercase, punctuation → spaces, word-boundary phrase match
/// - longest matching keyword wins
/// - \p{M} must stay in the keep-class or Devanagari vowel signs get stripped
final RegExp _nonWord = RegExp(r'[^\p{L}\p{M}\p{N}\s]', unicode: true);
final RegExp _spaces = RegExp(r'\s+');

String normalizeTitle(String text) {
  return text
      .toLowerCase()
      .replaceAll(_nonWord, ' ')
      .replaceAll(_spaces, ' ')
      .trim();
}

CategoryKeyword? suggestCategory(String title, List<CategoryKeyword> keywords) {
  final norm = normalizeTitle(title);
  if (norm.length < 3) return null;
  final normalized = ' $norm ';

  CategoryKeyword? best;
  for (final entry in keywords) {
    if (normalized.contains(' ${entry.keyword} ') &&
        (best == null || entry.keyword.length > best.keyword.length)) {
      best = entry;
    }
  }
  return best;
}

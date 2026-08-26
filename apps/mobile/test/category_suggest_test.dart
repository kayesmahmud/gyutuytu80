import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/models/category_keyword.dart';
import 'package:mobile/core/utils/category_suggest.dart';

// Mirrors apps/web/src/__tests__/unit/categorySuggest.test.ts — keep in sync.
const keywords = [
  CategoryKeyword(keyword: 'redmi', categoryId: 1, subcategoryId: 101),
  CategoryKeyword(keyword: 'iphone', categoryId: 1, subcategoryId: 101),
  CategoryKeyword(keyword: 'apartment', categoryId: 5, subcategoryId: 502),
  CategoryKeyword(
    keyword: 'apartment for rent',
    categoryId: 5,
    subcategoryId: 503,
  ),
  CategoryKeyword(keyword: 'ropani', categoryId: 5, subcategoryId: 501),
  CategoryKeyword(keyword: 'कुखुरा', categoryId: 6, subcategoryId: 602),
  CategoryKeyword(keyword: 'cat', categoryId: 6, subcategoryId: 601),
];

void main() {
  group('normalizeTitle', () {
    test('lowercases and turns punctuation into spaces', () {
      expect(normalizeTitle('iPhone-15, Pro!! (256GB)'), 'iphone 15 pro 256gb');
    });

    test('preserves Devanagari vowel signs', () {
      expect(normalizeTitle('कुखुरा बिक्रीमा'), 'कुखुरा बिक्रीमा');
    });
  });

  group('suggestCategory', () {
    test('matches a brand keyword anywhere in the title', () {
      final s = suggestCategory('Redmi Note 12 Pro fresh condition', keywords);
      expect(s?.categoryId, 1);
      expect(s?.subcategoryId, 101);
    });

    test('prefers the longest matching keyword', () {
      final s = suggestCategory(
        '2BHK apartment for rent in Baneshwor',
        keywords,
      );
      expect(s?.subcategoryId, 503);
    });

    test('matches only at word boundaries', () {
      expect(suggestCategory('Categorized storage boxes', keywords), isNull);
    });

    test('matches Devanagari keywords', () {
      final s = suggestCategory('लोकल कुखुरा बिक्रीमा', keywords);
      expect(s?.subcategoryId, 602);
    });

    test('matches short keywords once 3 chars are typed', () {
      expect(suggestCategory('cat', keywords)?.subcategoryId, 601);
    });

    test('returns null for input under 3 normalized chars', () {
      expect(suggestCategory('ca', keywords), isNull);
    });

    test('returns null when nothing matches', () {
      expect(suggestCategory('random gibberish title here', keywords), isNull);
    });
  });
}

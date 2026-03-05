import 'package:shared_preferences/shared_preferences.dart';

class SearchHistoryService {
  static const _key = 'recent_searches';
  static const _maxItems = 10;

  static Future<List<String>> getRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_key) ?? [];
  }

  static Future<void> addSearch(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    final searches = prefs.getStringList(_key) ?? [];
    searches.remove(trimmed);
    searches.insert(0, trimmed);
    if (searches.length > _maxItems) searches.removeLast();
    await prefs.setStringList(_key, searches);
  }

  static Future<void> removeSearch(String query) async {
    final prefs = await SharedPreferences.getInstance();
    final searches = prefs.getStringList(_key) ?? [];
    searches.remove(query);
    await prefs.setStringList(_key, searches);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

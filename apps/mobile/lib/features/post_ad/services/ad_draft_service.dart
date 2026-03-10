import 'dart:convert';
import 'dart:developer';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/features/post_ad/models/ad_draft_model.dart';

class AdDraftService {
  AdDraftService._();

  static const _key = 'thulobazaar_ad_drafts';
  static const _maxDrafts = 10;

  static String generateId() =>
      'draft_${DateTime.now().millisecondsSinceEpoch}';

  static Future<List<AdDraft>> loadDrafts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString(_key);
      if (stored == null) return [];

      final list = json.decode(stored) as List<dynamic>;
      final drafts = list
          .map((item) => AdDraft.fromMap(item as Map<String, dynamic>))
          .toList();

      // Most recently updated first
      drafts.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      return drafts;
    } catch (e) {
      log('AdDraftService: error loading drafts: $e', name: 'AdDraftService');
      return [];
    }
  }

  static Future<void> saveDraft(AdDraft draft) async {
    try {
      final drafts = await loadDrafts();
      final existingIndex = drafts.indexWhere((d) => d.id == draft.id);

      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.insert(0, draft);
      }

      // Trim to max, keeping most recent
      final trimmed = drafts.length > _maxDrafts
          ? drafts.sublist(0, _maxDrafts)
          : drafts;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _key,
        json.encode(trimmed.map((d) => d.toMap()).toList()),
      );
    } catch (e) {
      log('AdDraftService: error saving draft: $e', name: 'AdDraftService');
    }
  }

  static Future<void> deleteDraft(String id) async {
    try {
      final drafts = await loadDrafts();
      final updated = drafts.where((d) => d.id != id).toList();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _key,
        json.encode(updated.map((d) => d.toMap()).toList()),
      );
    } catch (e) {
      log('AdDraftService: error deleting draft: $e', name: 'AdDraftService');
    }
  }
}

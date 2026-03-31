// Client-side profanity detection for instant feedback.
// Server also censors as a safety net — this is for UX blocking only.

class ProfanityCheckResult {
  final bool hasProfanity;
  final List<String> detectedWords;

  const ProfanityCheckResult({
    required this.hasProfanity,
    required this.detectedWords,
  });
}

// ─── Nepali (Romanized) ───────────────────────────────────────
const _nepaliWords = <String>[
  'muji', 'mujhi', 'muzi', 'muzhi',
  'lado', 'laado',
  'puti', 'puthi', 'putti',
  'randi', 'raandi', 'rundi',
  'chikne', 'chikney', 'chikni',
  'machikne', 'machikney', 'maachikne',
  'bhalu', 'bhaalu',
  'chak', 'chaak',
  'gede', 'gedey',
  'bhadwa', 'bhadua', 'bhaduwa',
  'boksi', 'bokshi',
  'gandu', 'gaandu',
  'haramkhor',
  'khatey', 'khate',
  'sali', 'saali',
  'sala', 'saala',
  'chutiya', 'chutia', 'chuttiya',
  'madarchod', 'maadarchod',
  'bhosdi', 'bhosdike',
  'gand', 'gaand',
  'tatto', 'taatto',
  'phokcha', 'fokcha',
  'kukurko chora',
  'sungurni', 'sungurko',
  'hijada', 'hijra', 'hijda',
  'bhenchod',
  'chhada', 'chada',
  'haram', 'harami',
  'randiko',
  'jatha', 'jathi', 'jaatha', 'jaathi',
];

// ─── Hindi (Romanized) ───────────────────────────────────────
const _hindiWords = <String>[
  'bhenchod', 'behenchod', 'behen chod', 'bhen chod', 'bc',
  'madarchod', 'maadarchod', 'maderchod', 'mc',
  'chutiya', 'chutia', 'chootiya', 'choot',
  'bhosdi', 'bhosdike', 'bhosadike', 'bhosda',
  'gaand', 'gand', 'gandu', 'gaandu',
  'lund', 'lauda', 'lawda', 'lawde',
  'randi', 'raand', 'raandi',
  'harami', 'haramzada', 'haramzaadi', 'haramkhor',
  'chinal', 'chinaal',
  'kutiya', 'kuttiya', 'kutti',
  'suar', 'suwar', 'saala', 'saali',
  'tatti',
  'jhant', 'jhaant', 'jhandu',
  'chodu', 'chodna', 'chod',
  'gandmasti',
  'bhosdiwala', 'bhosdiwale',
  'lodu', 'laudu',
  'chakka', 'hijra', 'hijda',
  'kamina', 'kameena', 'kameeni',
  'nalayak', 'nikamma',
  'ullu',
  'gadha', 'gadhe',
  'kutta', 'kutte', 'kutton',
  'hagna', 'haggu',
  'chutiyapa', 'chutiyapan',
  'bakchod', 'bakchodi',
  'bhadwa', 'bhadwe',
  'dalla', 'dallal',
  'rand', 'rakhail',
  'jhantu', 'phuddi', 'phuddu',
  'tharki', 'chapri',
];

// ─── Nepali + Hindi (Devanagari) ─────────────────────────────
const _devanagariWords = <String>[
  // Nepali
  'मुजी', 'मुजि', 'लाडो', 'पुती', 'पुति',
  'रण्डी', 'रन्डी', 'चिक्ने', 'चिक्नी', 'माचिक्ने',
  'भालु', 'चाक', 'गेडे', 'भडुवा', 'बोक्सी',
  'गाण्डु', 'हरामखोर', 'खते', 'खाटे',
  'साली', 'साला', 'चुतिया', 'मादरचोद',
  'भोस्डी', 'गान्ड', 'टट्टो', 'फोक्चा',
  'हिजडा', 'छाडा', 'हरामी', 'भेनचोद',
  'सुँगुर्नी', 'रण्डीको', 'जाठा', 'जाठी',
  // Hindi
  'बहनचोद', 'बेहनचोद',
  'मदरचोद',
  'चूतिया', 'चूत',
  'भोसड़ी', 'भोसड़ीके', 'भोसडा',
  'गांड',
  'लंड', 'लौड़ा', 'लौडा', 'लौड़े',
  'रांड', 'रंडी',
  'हरामज़ादा', 'हरामज़ादी',
  'चिनाल',
  'कुतिया', 'कुत्ती',
  'सुअर', 'टट्टी',
  'झांट', 'झंडू',
  'चोदू', 'चोदना',
  'भोसड़ीवाला',
  'लोडू', 'लौडू',
  'चक्का', 'हिजड़ा',
  'कमीना', 'कमीनी',
  'नालायक', 'निकम्मा',
  'उल्लू',
  'गधा', 'गधे',
  'कुत्ता', 'कुत्ते',
  'चूतियापा', 'चूतियापन',
  'बकचोद', 'बकचोदी',
  'भड़वा', 'भड़वे',
  'दल्ला', 'दल्लाल',
  'रखैल',
  'झंटू', 'फुद्दी', 'फुद्दू',
  'ठरकी', 'छपरी',
];

// ─── English ─────────────────────────────────────────────────
const _englishWords = <String>[
  'fuck', 'fucker', 'fucking', 'fucked', 'motherfucker', 'motherfucking',
  'shit', 'shitty', 'bullshit', 'shitting',
  'bitch', 'bitches', 'bitchy',
  'asshole', 'arsehole',
  'dickhead',
  'cocksucker',
  'cunt', 'cunts',
  'bastard', 'bastards',
  'whore', 'slut', 'slutty',
  'piss', 'pissed', 'pissing',
  'wanker', 'wank',
  'twat', 'tosser',
  'nigger', 'nigga',
  'faggot', 'fag',
  'retard', 'retarded',
];

// O(1) lookup set — built once
final Set<String> _allWordsSet = <String>{
  ..._nepaliWords.map((w) => w.toLowerCase()),
  ..._hindiWords.map((w) => w.toLowerCase()),
  ..._englishWords.map((w) => w.toLowerCase()),
};

/// Check if text contains profanity.
/// Returns result with detected words list.
ProfanityCheckResult checkProfanity(String text) {
  final trimmed = text.trim();
  if (trimmed.isEmpty) {
    return const ProfanityCheckResult(hasProfanity: false, detectedWords: []);
  }

  final detected = <String>{};

  // Check Roman script words (split by common separators)
  final words = trimmed.toLowerCase().split(RegExp(r'[\s,.!?;:\x27"()\[\]{}<>]+'));
  for (final word in words) {
    final cleaned = word.replaceAll(RegExp(r'[._-]'), '');
    if (_allWordsSet.contains(cleaned) || _allWordsSet.contains(word)) {
      detected.add(word);
    }
  }

  // Check Devanagari substrings
  for (final pattern in _devanagariWords) {
    if (trimmed.contains(pattern)) {
      detected.add(pattern);
    }
  }

  return ProfanityCheckResult(
    hasProfanity: detected.isNotEmpty,
    detectedWords: detected.toList(),
  );
}

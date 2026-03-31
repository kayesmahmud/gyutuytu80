/**
 * Client-side profanity detection for instant feedback.
 * This is a lightweight check — the server also censors as a safety net.
 */

// ─── Nepali (Romanized) ───────────────────────────────────────
const NEPALI_WORDS = [
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
  'randi ko chora', 'kukurko chora',
  'sungurni', 'sungur ko', 'sungurko',
  'hijada', 'hijra', 'hijda',
  'bhenchod',
  'chhada', 'chada',
  'haram', 'harami',
  'randiko',
  'jatha', 'jathi', 'jaatha', 'jaathi',
];

// ─── Hindi (Romanized) ───────────────────────────────────────
const HINDI_WORDS = [
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
  'tatti', 'tattti',
  'jhant', 'jhaant', 'jhandu',
  'chodu', 'chodna', 'chod',
  'gandmasti',
  'bhosdiwala', 'bhosdiwale',
  'lodu', 'laudu',
  'chakka', 'hijra', 'hijda',
  'kamina', 'kameena', 'kameeni',
  'nalayak', 'nikamma',
  'ullu', 'ullu ka pattha',
  'gadha', 'gadhe',
  'kutta', 'kutte', 'kutton',
  'hagna', 'haggu',
  'chutiyapa', 'chutiyapan',
  'bakchod', 'bakchodi',
  'bhadwa', 'bhadwe',
  'dalla', 'dallal',
  'rand', 'rakhail',
  'jhantu', 'phuddi', 'phuddu',
  'tharki', 'chapri', 'chappal chor',
];

// ─── Nepali + Hindi (Devanagari) ─────────────────────────────
const DEVANAGARI_WORDS = [
  // Nepali Devanagari
  'मुजी', 'मुजि', 'लाडो', 'पुती', 'पुति',
  'रण्डी', 'रन्डी', 'चिक्ने', 'चिक्नी', 'माचिक्ने',
  'भालु', 'चाक', 'गेडे', 'भडुवा', 'बोक्सी',
  'गाण्डु', 'हरामखोर', 'खते', 'खाटे',
  'साली', 'साला', 'चुतिया', 'मादरचोद',
  'भोस्डी', 'गान्ड', 'टट्टो', 'फोक्चा',
  'हिजडा', 'छाडा', 'हरामी', 'भेनचोद',
  'सुँगुर्नी', 'रण्डीको', 'जाठा', 'जाठी',
  // Hindi Devanagari
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
  'उल्लू', 'उल्लू का पट्ठा',
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
const ENGLISH_WORDS = [
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

// Build a Set for O(1) lookups on simple word matches
const ALL_WORDS_SET = new Set([
  ...NEPALI_WORDS.map((w) => w.toLowerCase()),
  ...HINDI_WORDS.map((w) => w.toLowerCase()),
  ...ENGLISH_WORDS.map((w) => w.toLowerCase()),
]);

// Devanagari needs substring matching (no word boundaries in Devanagari)
const DEVANAGARI_PATTERNS = DEVANAGARI_WORDS;

/**
 * Check if text contains profanity. Returns detected words.
 * Checks both word-boundary matches (Roman) and substring matches (Devanagari).
 */
export function checkProfanity(text: string): { hasProfanity: boolean; detectedWords: string[] } {
  if (!text?.trim()) return { hasProfanity: false, detectedWords: [] };

  const detected: string[] = [];

  // Check Roman script words (split by common separators)
  const words = text.toLowerCase().split(/[\s,.!?;:'"()\[\]{}<>]+/);
  for (const word of words) {
    // Also strip common leetspeak separators within word
    const cleaned = word.replace(/[._-]/g, '');
    if (ALL_WORDS_SET.has(cleaned) || ALL_WORDS_SET.has(word)) {
      detected.push(word);
    }
  }

  // Check Devanagari substrings
  for (const pattern of DEVANAGARI_PATTERNS) {
    if (text.includes(pattern)) {
      detected.push(pattern);
    }
  }

  const unique = [...new Set(detected)];
  return { hasProfanity: unique.length > 0, detectedWords: unique };
}

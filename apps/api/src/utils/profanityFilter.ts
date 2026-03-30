/**
 * Profanity Filter — English + Nepali (Romanized & Devanagari)
 *
 * Two modes:
 * 1. `containsProfanity(text)` → boolean (for client-side pre-check via API)
 * 2. `censorProfanity(text)` → censored string (server-side safety net)
 */

// ─── Word Lists ───────────────────────────────────────────────

/**
 * Nepali profane words in Romanized script.
 * Includes common spelling variations.
 */
const NEPALI_PROFANE_WORDS: string[] = [
  // Core Nepali slurs
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
  // Additional Nepali
  'kukur ko chora', 'kukurko chora',
  'sungurni', 'sungur ko', 'sungurko',
  'hijada', 'hijra', 'hijda',
  'bhen chod', 'bhenchod',
  'keti patthi',
  'chhada', 'chada',
  'haram', 'harami',
  'kukhuri', 'randiko',
];

/**
 * Nepali profane words in Devanagari script.
 */
const NEPALI_DEVANAGARI_PROFANE: string[] = [
  'मुजी', 'मुजि',
  'लाडो',
  'पुती', 'पुति',
  'रण्डी', 'रन्डी',
  'चिक्ने', 'चिक्नी',
  'माचिक्ने',
  'भालु',
  'चाक',
  'गेडे',
  'भडुवा',
  'बोक्सी',
  'गाण्डु',
  'हरामखोर',
  'खते', 'खाटे',
  'साली',
  'साला',
  'चुतिया',
  'मादरचोद',
  'भोस्डी',
  'गान्ड',
  'टट्टो',
  'फोक्चा',
  // Additional Nepali Devanagari
  'हिजडा', 'छाडा', 'हरामी',
  'भेनचोद', 'सुँगुर्नी', 'रण्डीको',
];

/**
 * Hindi profane words in Romanized script.
 * Many overlap with Nepali — these are Hindi-specific additions.
 */
const HINDI_PROFANE_WORDS: string[] = [
  // Major Hindi slurs (romanized with spelling variations)
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
  'pataka', 'item',
  'jhantu', 'phuddi', 'phuddu',
  'tharki', 'chapri', 'chappal chor',
];

/**
 * Hindi profane words in Devanagari script.
 */
const HINDI_DEVANAGARI_PROFANE: string[] = [
  'बहनचोद', 'बेहनचोद', 'भेनचोद',
  'मादरचोद', 'मदरचोद',
  'चूतिया', 'चुतिया', 'चूत',
  'भोसड़ी', 'भोसड़ीके', 'भोसडा',
  'गांड', 'गाण्डू', 'गान्डु',
  'लंड', 'लौड़ा', 'लौडा', 'लौड़े',
  'रांड', 'रण्डी', 'रंडी',
  'हरामी', 'हरामज़ादा', 'हरामज़ादी',
  'चिनाल',
  'कुतिया', 'कुत्ती',
  'सुअर', 'साला', 'साली',
  'टट्टी',
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

/**
 * English profane words — common set covering major slurs.
 */
const ENGLISH_PROFANE_WORDS: string[] = [
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

// ─── Build Patterns ───────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a regex pattern that handles common letter substitutions.
 * e.g., 'a' can be '@', '4'; 'i' can be '1', '!'; etc.
 */
function buildFlexiblePattern(word: string): string {
  const charMap: Record<string, string> = {
    a: '[a@4àáâãäå]',
    e: '[e3èéêë]',
    i: '[i1!ìíîï]',
    o: '[o0òóôõö]',
    u: '[uùúûü]',
    s: '[s$5]',
    l: '[l1|]',
  };

  return word
    .split('')
    .map((ch) => {
      const lower = ch.toLowerCase();
      return charMap[lower] || escapeRegex(ch);
    })
    .join('[\\s._-]*'); // Allow separators between chars (e.g., f.u.c.k)
}

// Build combined regex (compiled once at module load)
const allRomanWords = [
  ...NEPALI_PROFANE_WORDS,
  ...HINDI_PROFANE_WORDS,
  ...ENGLISH_PROFANE_WORDS,
];

const allDevanagariWords = [
  ...NEPALI_DEVANAGARI_PROFANE,
  ...HINDI_DEVANAGARI_PROFANE,
];

const romanPatterns = allRomanWords.map(buildFlexiblePattern);
const devanagariPatterns = allDevanagariWords.map(escapeRegex);
const allPatterns = [...romanPatterns, ...devanagariPatterns].join('|');

// Word-boundary aware regex for detection
const PROFANITY_DETECT_REGEX = new RegExp(
  `(?:^|[\\s,.!?;:'"()\\[\\]{}<>])(${allPatterns})(?=[\\s,.!?;:'"()\\[\\]{}<>]|$)`,
  'gi'
);

// Regex for censoring (slightly looser to catch edge cases)
const PROFANITY_CENSOR_REGEX = new RegExp(
  `(?:^|\\b|\\s)(${allPatterns})(?:\\b|\\s|$)`,
  'gi'
);

// ─── Public API ───────────────────────────────────────────────

/**
 * Check if text contains profanity.
 * Used for client-side pre-validation via API.
 */
export function containsProfanity(text: string): boolean {
  PROFANITY_DETECT_REGEX.lastIndex = 0;
  return PROFANITY_DETECT_REGEX.test(text);
}

/**
 * Get list of detected profane words in the text.
 */
export function getDetectedWords(text: string): string[] {
  PROFANITY_DETECT_REGEX.lastIndex = 0;
  const matches: string[] = [];
  let match;
  while ((match = PROFANITY_DETECT_REGEX.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  return [...new Set(matches)];
}

/**
 * Replace profane words with asterisks.
 * Server-side safety net — censors even if client check is bypassed.
 */
export function censorProfanity(text: string): string {
  return text.replace(PROFANITY_CENSOR_REGEX, (fullMatch, word) => {
    const idx = fullMatch.indexOf(word);
    const leading = fullMatch.slice(0, idx);
    const trailing = fullMatch.slice(idx + word.length);
    const masked = '*'.repeat(word.length);
    return `${leading}${masked}${trailing}`;
  });
}

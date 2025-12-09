/**
 * CONTENT MODERATION SYSTEM
 * Filters inappropriate content for middle school environment
 * Uses word-boundary matching to avoid false positives
 * Pre-compiled regex for performance
 */

/**
 * Words that must be blocked - uses word boundary matching
 * These are unambiguous bad words that won't cause false positives
 */
const BLOCKED_WORDS = [
  // Profanity (unambiguous)
  'fuck', 'fucker', 'fucking', 'fucked', 'fck', 'fuk', 'fuq', 'phuck',
  'shit', 'shitty', 'bullshit', 'shite',
  'asshole', 'arsehole', 'asswipe',
  'bitch', 'bitches', 'bitchy', 'biatch', 'biotch',
  'bastard', 'bastards',
  'cunt', 'cunts',
  'damn', 'dammit', 'goddamn', 'goddamnit',
  'piss', 'pissed', 'pissing',
  'crap', 'crappy',
  'dick', 'dicks', 'dickhead',
  'cock', 'cocks', 'cocksucker',
  'pussy', 'pussies',
  'whore', 'whores',
  'slut', 'sluts', 'slutty',

  // Racial/ethnic slurs
  'nigga', 'niggas', 'nigger', 'niggers',
  'chink', 'chinks',
  'gook', 'gooks',
  'spic', 'spics', 'spick',
  'wetback', 'wetbacks',
  'beaner', 'beaners',
  'kike', 'kikes',
  'towelhead', 'raghead',

  // Homophobic/transphobic slurs
  'fag', 'fags', 'faggot', 'faggots',
  'dyke', 'dykes',
  'tranny', 'trannies',
  'lesbo', 'lesbos',

  // Gang identifiers
  'bloods', 'crips', 'suwoop',
  'gangbanger', 'gangbangers',
  'ms13', 'surenos', 'nortenos',
  'latin kings',

  // Drug terms (unambiguous)
  'cocaine', 'heroin', 'meth', 'methamphetamine',
  'marijuana', 'weed', 'stoner',
  'crackhead', 'pothead', 'tweaker',
  'xanax', 'percocet', 'oxycontin',

  // Sexual content (explicit)
  'porn', 'porno', 'pornography',
  'xxx', 'sexting',
  'blowjob', 'handjob', 'rimjob',
  'dildo', 'vibrator',
  'masturbate', 'masturbation', 'jerkoff', 'wank',
  'orgasm', 'orgasms',
  'erection', 'boner', 'boners',
  'boobs', 'titties', 'tits',
  'penis', 'penises', 'vagina', 'vaginas',
  'cumshot', 'creampie',
  'nude', 'nudes', 'naked',
  'horny',

  // Violence (explicit)
  'suicide', 'suicidal',
  'kms', 'kys',
  'murder', 'murderer',
  'rapist', 'rape', 'raping', 'raped',
  'molest', 'molester', 'pedophile', 'pedo',

  // Hate symbols/groups
  'nazi', 'nazis', 'hitler',
  'kkk', 'klan',
  'heil',

  // Ableist slurs
  'retard', 'retarded', 'retards',
  'spaz', 'spastic'
];

/**
 * Pre-compiled regex for efficient matching
 * Uses word boundaries (\b) to avoid matching substrings
 */
const BLOCKED_WORDS_REGEX = new RegExp(
  '\\b(' + BLOCKED_WORDS.join('|') + ')\\b',
  'i'
);

/**
 * Patterns that should be blocked even as substrings (leetspeak variants)
 * These are deliberate obfuscations that won't appear in normal words
 */
const BLOCKED_LEETSPEAK = [
  'f[u\\*@]ck', 'sh[i1!]t', 'b[i1!]tch', 'd[i1!]ck', 'c[o0]ck',
  'n[i1!]gg', 'f[a4@]g', 'p[e3]n[i1!]s', 'c[u\\*]nt', 'a55',
  'wh[o0]re', 'p[u\\*]ssy', 'b[o0]{2}b', 't[i1!]t', 'pr[o0]n'
];

/**
 * Pre-compiled leetspeak regex
 */
const BLOCKED_LEETSPEAK_REGEX = new RegExp(
  '(' + BLOCKED_LEETSPEAK.join('|') + ')',
  'i'
);

/**
 * Check if text contains inappropriate content
 * @param {string} text - Text to check
 * @returns {boolean} True if text is clean, false if it contains bad content
 */
export function isContentAppropriate(text) {
  if (!text || typeof text !== 'string') return true;

  const lowerText = text.toLowerCase();

  // Check word-boundary matched blocked words
  if (BLOCKED_WORDS_REGEX.test(lowerText)) {
    return false;
  }

  // Check leetspeak patterns (substring matching is OK for these)
  if (BLOCKED_LEETSPEAK_REGEX.test(lowerText)) {
    return false;
  }

  // Check for number substitutions in the original text
  // Only normalize if the text contains suspicious number patterns
  if (/[0-9@$]/.test(text)) {
    const normalized = lowerText
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/8/g, 'b')
      .replace(/@/g, 'a')
      .replace(/\$/g, 's');

    if (BLOCKED_WORDS_REGEX.test(normalized)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize text input - removes or replaces inappropriate content
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';

  // First, trim and limit length
  let sanitized = text.trim().substring(0, 50);

  // Remove any HTML/script tags to prevent XSS
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\\/g, '&#92;');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate and clean team/player name
 * @param {string} name - Name to validate
 * @returns {{isValid: boolean, cleaned: string, error: string|null}}
 */
export function validateName(name) {
  const cleaned = sanitizeInput(name);

  if (!cleaned || cleaned.length === 0) {
    return { isValid: false, cleaned: '', error: 'Name cannot be empty' };
  }

  if (cleaned.length < 2) {
    return { isValid: false, cleaned, error: 'Name must be at least 2 characters' };
  }

  if (!isContentAppropriate(cleaned)) {
    return { isValid: false, cleaned: '', error: 'Please choose an appropriate name' };
  }

  // Allow letters (including international), numbers, spaces, and basic punctuation
  // \p{L} matches any Unicode letter (José, François, 李, etc.)
  const validPattern = /^[\p{L}\p{N}\s\-_.!?]+$/u;
  if (!validPattern.test(name.trim())) {
    return { isValid: false, cleaned: cleaned.replace(/[^\p{L}\p{N}\s\-_.!?]/gu, ''), error: 'Name contains invalid characters' };
  }

  return { isValid: true, cleaned, error: null };
}

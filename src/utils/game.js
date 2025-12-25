/**
 * GAME UTILITIES
 * Game-specific helper functions for claims, roles, and player display
 */

import { loadClaimsDatabase, loadFilteredClaims } from '../data/claimsLoader';
import { SUBJECT_HINTS } from '../data/constants';
import { shuffleArray } from './generic';
import { logger } from './logger';

/**
 * Select claims based on difficulty, grade level, and optional subject filter
 * GUARANTEES no duplicate claims within a session
 * For solo players: prioritizes unseen claims until all have been seen
 *
 * NOW ASYNC: Claims database is lazy-loaded for code-splitting (375KB saved from main bundle)
 *
 * @param {string} difficulty - 'easy' | 'medium' | 'hard' | 'mixed'
 * @param {number} count - Number of claims to select
 * @param {Array<string>} subjects - Optional array of subjects to include (empty = all)
 * @param {Array<string>} previouslySeenIds - Claim IDs the player has already seen (for solo mode)
 * @param {Array<Object>} additionalClaims - Extra claims to add to the pool (e.g., student-contributed)
 * @param {Object} classSettings - Optional class settings { gradeLevel, classSeenIds }
 * @returns {Promise<Array>} Selected claims (unique, no repeats, prioritizing unseen)
 */
export async function selectClaimsByDifficulty(difficulty, count, subjects = [], previouslySeenIds = [], additionalClaims = [], classSettings = null) {
  // Use loadFilteredClaims if gradeLevel is specified, otherwise load full database
  let basePool;
  if (classSettings?.gradeLevel) {
    basePool = await loadFilteredClaims({
      gradeLevel: classSettings.gradeLevel,
      subject: subjects?.length === 1 ? subjects[0] : null
    });
  } else {
    const CLAIMS_DATABASE = await loadClaimsDatabase();
    basePool = [...CLAIMS_DATABASE];
  }

  // Combine with any additional claims (e.g., student-contributed)
  const combinedPool = [...basePool, ...additionalClaims];

  // Filter by subjects if specified (and not already filtered by single subject)
  let pool = combinedPool;
  if (subjects && subjects.length > 0 && (!classSettings?.gradeLevel || subjects.length !== 1)) {
    pool = combinedPool.filter(c => subjects.includes(c.subject));
  }

  // Combine individual player seen IDs with class-level seen IDs for group play
  const allSeenIds = new Set([
    ...previouslySeenIds,
    ...(classSettings?.classSeenIds || [])
  ]);

  // Track used claim IDs to prevent any duplicates within this game
  const usedIds = new Set();
  const selectedClaims = [];

  // Helper to select unique claims, prioritizing unseen
  const selectUnique = (sourcePool, maxCount, preferUnseen = true) => {
    // Split source into unseen and seen
    const unseen = preferUnseen ? sourcePool.filter(c => !allSeenIds.has(c.id)) : [];
    const seen = preferUnseen ? sourcePool.filter(c => allSeenIds.has(c.id)) : sourcePool;

    const shuffledUnseen = shuffleArray([...unseen]);
    const shuffledSeen = shuffleArray([...seen]);

    // Prioritize unseen claims, then fill with seen if needed
    const combined = [...shuffledUnseen, ...shuffledSeen];

    const result = [];
    for (const claim of combined) {
      if (result.length >= maxCount) break;
      if (!usedIds.has(claim.id)) {
        usedIds.add(claim.id);
        result.push(claim);
      }
    }
    return result;
  };

  if (difficulty === 'mixed') {
    // Progressive: distribute claims across difficulties
    const easyCount = Math.ceil(count * 0.3);
    const medCount = Math.ceil(count * 0.4);
    const hardCount = count - easyCount - medCount;

    const easyPool = pool.filter(c => c.difficulty === 'easy');
    const medPool = pool.filter(c => c.difficulty === 'medium');
    const hardPool = pool.filter(c => c.difficulty === 'hard');

    const easy = selectUnique(easyPool, easyCount);
    const med = selectUnique(medPool, medCount);
    const hard = selectUnique(hardPool, hardCount);

    // Order: easy first, then medium, then hard
    selectedClaims.push(...easy, ...med, ...hard);

    // If we didn't get enough claims, fill from remaining pool
    if (selectedClaims.length < count) {
      const remaining = pool.filter(c => !usedIds.has(c.id));
      const additional = selectUnique(remaining, count - selectedClaims.length);
      selectedClaims.push(...additional);
    }
  } else {
    // Single difficulty mode
    const filtered = pool.filter(c => c.difficulty === difficulty);
    const selected = selectUnique(filtered, count);
    selectedClaims.push(...selected);

    // If we didn't get enough claims of this difficulty, fill from others
    if (selectedClaims.length < count) {
      const remaining = pool.filter(c => !usedIds.has(c.id));
      const additional = selectUnique(remaining, count - selectedClaims.length);
      selectedClaims.push(...additional);
    }
  }

  // CRITICAL: If subject filter resulted in too few claims, fall back to full database
  // This prevents the game from breaking mid-way when there aren't enough claims
  if (selectedClaims.length < count && subjects && subjects.length > 0) {
    logger.warn(`Only ${selectedClaims.length} claims found for subjects [${subjects.join(', ')}], falling back to full database`);
    const CLAIMS_DATABASE_FALLBACK = await loadClaimsDatabase();
    const fullPool = [...CLAIMS_DATABASE_FALLBACK, ...additionalClaims].filter(c => !usedIds.has(c.id));
    const additional = selectUnique(fullPool, count - selectedClaims.length, false);
    selectedClaims.push(...additional);
  }

  // Final safety check: ensure absolutely no duplicates
  const uniqueClaims = [];
  const finalSeenIds = new Set();
  for (const claim of selectedClaims) {
    if (!finalSeenIds.has(claim.id)) {
      finalSeenIds.add(claim.id);
      uniqueClaims.push(claim);
    }
  }

  return uniqueClaims.slice(0, count);
}

/**
 * Get count of unseen claims available for a player
 * NOW ASYNC: Claims database is lazy-loaded
 * @param {Array<string>} previouslySeenIds - Claim IDs the player has already seen
 * @param {Array<string>} subjects - Optional array of subjects to filter by
 * @param {Array<Object>} additionalClaims - Extra claims to include (e.g., student-contributed)
 * @returns {Promise<Object>} { total, unseen, percentSeen }
 */
export async function getUnseenClaimStats(previouslySeenIds = [], subjects = [], additionalClaims = []) {
  // Combine base database with any additional claims
  const CLAIMS_DATABASE = await loadClaimsDatabase();
  const combinedPool = [...CLAIMS_DATABASE, ...additionalClaims];

  let pool = combinedPool;
  if (subjects && subjects.length > 0) {
    pool = combinedPool.filter(c => subjects.includes(c.subject));
  }

  const seenSet = new Set(previouslySeenIds);
  const unseen = pool.filter(c => !seenSet.has(c.id)).length;

  return {
    total: pool.length,
    unseen,
    seen: pool.length - unseen,
    percentSeen: pool.length > 0 ? Math.round(((pool.length - unseen) / pool.length) * 100) : 0
  };
}

/**
 * Format player display name
 * @param {string} firstName - First name
 * @param {string} lastInitial - Last initial
 * @returns {string} Formatted name (e.g., "John D.")
 */
export function formatPlayerName(firstName, lastInitial) {
  const cleanFirst = (firstName || '').trim();
  const cleanLast = (lastInitial || '').trim().charAt(0).toUpperCase();
  if (!cleanFirst) return 'Anonymous';
  return cleanLast ? `${cleanFirst} ${cleanLast}.` : cleanFirst;
}

/**
 * Get hint content for a claim
 * @param {Object} claim - The claim object
 * @param {string} hintType - Type of hint requested
 * @returns {string} Hint content
 */
export function getHintContent(claim, hintType) {
  switch(hintType) {
    case 'source-hint':
      if (claim.source === 'student-contributed') {
        return `✨ This claim was submitted by ${claim.contributor || 'a classmate'}`;
      }
      return claim.source === 'ai-generated'
        ? '🤖 This claim was generated by AI'
        : '📚 This claim comes from expert sources';
    case 'error-hint':
      if (claim.source === 'expert-sourced') {
        return "✅ This claim doesn't contain typical AI errors";
      }
      if (claim.source === 'student-contributed' && claim.errorPattern) {
        return `🎯 Look for: ${claim.errorPattern}`;
      }
      if (claim.source === 'student-contributed') {
        return "🔍 Think critically - what might be wrong here?";
      }
      return `🎯 Look for: ${claim.errorPattern}`;
    case 'subject-hint':
      return SUBJECT_HINTS[claim.subject] || 'Think critically about this subject area!';
    default:
      return 'No hint available.';
  }
}

/**
 * Game Utilities Tests
 * Tests for game-specific helper functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  selectClaimsByDifficulty,
  formatPlayerName,
  getHintContent,
  getUnseenClaimStats
} from '../game';
import * as claimsLoader from '../../data/claimsLoader';

// Mock the claims loader
vi.mock('../../data/claimsLoader', () => ({
  loadClaimsDatabase: vi.fn(),
  loadFilteredClaims: vi.fn()
}));

describe('game utilities', () => {
  // Sample claims for testing
  const mockClaims = [
    { id: '1', difficulty: 'easy', subject: 'Biology', answer: 'TRUE', gradeLevel: 'middle' },
    { id: '2', difficulty: 'easy', subject: 'Physics', answer: 'FALSE', gradeLevel: 'middle' },
    { id: '3', difficulty: 'easy', subject: 'Biology', answer: 'TRUE', gradeLevel: 'middle' },
    { id: '4', difficulty: 'medium', subject: 'Biology', answer: 'MIXED', gradeLevel: 'middle' },
    { id: '5', difficulty: 'medium', subject: 'Physics', answer: 'TRUE', gradeLevel: 'middle' },
    { id: '6', difficulty: 'medium', subject: 'Chemistry', answer: 'FALSE', gradeLevel: 'high' },
    { id: '7', difficulty: 'hard', subject: 'Biology', answer: 'TRUE', gradeLevel: 'high' },
    { id: '8', difficulty: 'hard', subject: 'Physics', answer: 'FALSE', gradeLevel: 'high' },
    { id: '9', difficulty: 'hard', subject: 'Chemistry', answer: 'MIXED', gradeLevel: 'high' },
    { id: '10', difficulty: 'easy', subject: 'History', answer: 'TRUE', gradeLevel: 'elementary' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    claimsLoader.loadClaimsDatabase.mockResolvedValue([...mockClaims]);
    claimsLoader.loadFilteredClaims.mockResolvedValue([...mockClaims.filter(c => c.gradeLevel === 'middle')]);
  });

  describe('selectClaimsByDifficulty', () => {
    describe('basic selection', () => {
      it('selects correct number of claims', async () => {
        const claims = await selectClaimsByDifficulty('easy', 3);
        expect(claims).toHaveLength(3);
      });

      it('selects easy claims when difficulty is easy', async () => {
        const claims = await selectClaimsByDifficulty('easy', 2);
        expect(claims).toHaveLength(2);
        claims.forEach(claim => {
          expect(claim.difficulty).toBe('easy');
        });
      });

      it('selects medium claims when difficulty is medium', async () => {
        const claims = await selectClaimsByDifficulty('medium', 2);
        expect(claims).toHaveLength(2);
        claims.forEach(claim => {
          expect(claim.difficulty).toBe('medium');
        });
      });

      it('selects hard claims when difficulty is hard', async () => {
        const claims = await selectClaimsByDifficulty('hard', 2);
        expect(claims).toHaveLength(2);
        claims.forEach(claim => {
          expect(claim.difficulty).toBe('hard');
        });
      });

      it('returns no duplicate claims', async () => {
        const claims = await selectClaimsByDifficulty('easy', 3);
        const ids = claims.map(c => c.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids.length).toBe(uniqueIds.length);
      });
    });

    describe('mixed difficulty', () => {
      it('distributes claims across difficulties in mixed mode', async () => {
        const claims = await selectClaimsByDifficulty('mixed', 10);

        const easy = claims.filter(c => c.difficulty === 'easy');
        const medium = claims.filter(c => c.difficulty === 'medium');
        const hard = claims.filter(c => c.difficulty === 'hard');

        // Mixed mode should have distribution: ~30% easy, ~40% medium, ~30% hard
        expect(easy.length).toBeGreaterThan(0);
        expect(medium.length).toBeGreaterThan(0);
        expect(hard.length).toBeGreaterThan(0);
      });

      it('orders mixed claims as easy, medium, then hard', async () => {
        const claims = await selectClaimsByDifficulty('mixed', 6);

        // Find indices of each difficulty
        let lastEasyIndex = -1;
        let lastMediumIndex = -1;

        claims.forEach((claim, index) => {
          if (claim.difficulty === 'easy') lastEasyIndex = index;
          if (claim.difficulty === 'medium') lastMediumIndex = index;
        });

        // Easy claims should come before medium (if both exist)
        if (lastEasyIndex >= 0 && lastMediumIndex >= 0) {
          expect(lastEasyIndex).toBeLessThan(lastMediumIndex);
        }
      });
    });

    describe('subject filtering', () => {
      it('filters by single subject', async () => {
        const claims = await selectClaimsByDifficulty('easy', 2, ['Biology']);
        expect(claims).toHaveLength(2);
        claims.forEach(claim => {
          expect(claim.subject).toBe('Biology');
        });
      });

      it('filters by multiple subjects', async () => {
        const claims = await selectClaimsByDifficulty('easy', 2, ['Biology', 'Physics']);
        expect(claims).toHaveLength(2);
        claims.forEach(claim => {
          expect(['Biology', 'Physics']).toContain(claim.subject);
        });
      });

      it('returns empty array when no subjects match', async () => {
        claimsLoader.loadClaimsDatabase.mockResolvedValue([]);
        const claims = await selectClaimsByDifficulty('easy', 5, ['NonexistentSubject']);
        expect(claims).toHaveLength(0);
      });

      it('falls back to full database if subject filter yields too few claims', async () => {
        // Mock filtered result with only 1 Biology claim
        const biologyClaims = mockClaims.filter(c => c.subject === 'Biology');
        claimsLoader.loadClaimsDatabase.mockResolvedValueOnce(biologyClaims);

        const claims = await selectClaimsByDifficulty('easy', 5, ['Biology']);
        // Should fall back and use full database
        expect(claims.length).toBeGreaterThan(0);
      });
    });

    describe('unseen claims prioritization', () => {
      it('prioritizes unseen claims over seen claims', async () => {
        const previouslySeenIds = ['1', '2', '3'];
        const claims = await selectClaimsByDifficulty('easy', 3, [], previouslySeenIds);

        // First claims should be unseen if possible
        const unseenClaims = claims.filter(c => !previouslySeenIds.includes(c.id));
        expect(unseenClaims.length).toBeGreaterThan(0);
      });

      it('still returns seen claims when all are seen', async () => {
        const allIds = mockClaims.map(c => c.id);
        const claims = await selectClaimsByDifficulty('easy', 2, [], allIds);
        expect(claims).toHaveLength(2);
      });

      it('combines individual and class seen IDs', async () => {
        const individualSeenIds = ['1', '2'];
        const classSettings = {
          gradeLevel: 'middle',
          classSeenIds: ['3', '4']
        };

        const claims = await selectClaimsByDifficulty('easy', 3, [], individualSeenIds, [], classSettings);

        // Should avoid IDs 1, 2, 3, 4 if possible
        const avoidedIds = ['1', '2', '3', '4'];
        const unseenClaims = claims.filter(c => !avoidedIds.includes(c.id));
        expect(unseenClaims.length).toBeGreaterThan(0);
      });
    });

    describe('additional claims', () => {
      it('includes student-contributed claims in pool', async () => {
        const additionalClaims = [
          { id: 'student-1', difficulty: 'easy', subject: 'Biology', source: 'student-contributed' }
        ];

        const claims = await selectClaimsByDifficulty('easy', 1, [], [], additionalClaims);
        expect(claims).toHaveLength(1);
      });

      it('mixes additional claims with base pool', async () => {
        const additionalClaims = [
          { id: 'student-1', difficulty: 'medium', subject: 'Biology', source: 'student-contributed' },
          { id: 'student-2', difficulty: 'medium', subject: 'Physics', source: 'student-contributed' }
        ];

        const claims = await selectClaimsByDifficulty('medium', 3, [], [], additionalClaims);
        expect(claims).toHaveLength(3);
      });
    });

    describe('grade level filtering', () => {
      it('uses loadFilteredClaims when gradeLevel is specified', async () => {
        const classSettings = { gradeLevel: 'middle' };
        await selectClaimsByDifficulty('easy', 2, [], [], [], classSettings);

        expect(claimsLoader.loadFilteredClaims).toHaveBeenCalledWith({
          gradeLevel: 'middle',
          subject: null
        });
      });

      it('uses loadFilteredClaims with single subject', async () => {
        const classSettings = { gradeLevel: 'high' };
        await selectClaimsByDifficulty('hard', 2, ['Physics'], [], [], classSettings);

        expect(claimsLoader.loadFilteredClaims).toHaveBeenCalledWith({
          gradeLevel: 'high',
          subject: 'Physics'
        });
      });

      it('uses loadClaimsDatabase when no gradeLevel', async () => {
        await selectClaimsByDifficulty('easy', 2);

        expect(claimsLoader.loadClaimsDatabase).toHaveBeenCalled();
        expect(claimsLoader.loadFilteredClaims).not.toHaveBeenCalled();
      });
    });

    describe('fallback behavior', () => {
      it('fills from other difficulties if not enough claims of requested difficulty', async () => {
        // Mock only 1 hard claim available
        const limitedClaims = [...mockClaims.filter(c => c.difficulty !== 'hard'), mockClaims[7]];
        claimsLoader.loadClaimsDatabase.mockResolvedValue(limitedClaims);

        const claims = await selectClaimsByDifficulty('hard', 3);
        // Should get 1 hard + 2 from other difficulties
        expect(claims).toHaveLength(3);
      });

      it('handles empty claims database gracefully', async () => {
        claimsLoader.loadClaimsDatabase.mockResolvedValue([]);
        const claims = await selectClaimsByDifficulty('easy', 5);
        expect(claims).toHaveLength(0);
      });
    });

    describe('uniqueness guarantees', () => {
      it('never returns duplicate claim IDs within same call', async () => {
        const claims = await selectClaimsByDifficulty('mixed', 10);
        const ids = claims.map(c => c.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids).toEqual(uniqueIds);
      });

      it('enforces uniqueness even with additional claims', async () => {
        const additionalClaims = [
          { id: '1', difficulty: 'easy', subject: 'Biology' } // Duplicate ID
        ];

        const claims = await selectClaimsByDifficulty('easy', 3, [], [], additionalClaims);
        const ids = claims.map(c => c.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids).toEqual(uniqueIds);
      });
    });
  });

  describe('formatPlayerName', () => {
    it('formats name with first and last initial', () => {
      expect(formatPlayerName('John', 'D')).toBe('John D.');
    });

    it('formats name with only first name', () => {
      expect(formatPlayerName('John', '')).toBe('John');
    });

    it('returns Anonymous for empty first name', () => {
      expect(formatPlayerName('', 'D')).toBe('Anonymous');
    });

    it('returns Anonymous for null first name', () => {
      expect(formatPlayerName(null, 'D')).toBe('Anonymous');
    });

    it('returns Anonymous for undefined first name', () => {
      expect(formatPlayerName(undefined, 'D')).toBe('Anonymous');
    });

    it('capitalizes last initial', () => {
      expect(formatPlayerName('John', 'd')).toBe('John D.');
    });

    it('takes only first character of last name', () => {
      expect(formatPlayerName('John', 'Doe')).toBe('John D.');
    });

    it('trims whitespace from names', () => {
      expect(formatPlayerName('  John  ', '  D  ')).toBe('John D.');
    });

    it('handles null last initial', () => {
      expect(formatPlayerName('John', null)).toBe('John');
    });

    it('handles undefined last initial', () => {
      expect(formatPlayerName('John', undefined)).toBe('John');
    });

    it('handles special characters in first name', () => {
      expect(formatPlayerName("O'Brien", 'S')).toBe("O'Brien S.");
    });

    it('handles hyphenated first names', () => {
      expect(formatPlayerName('Mary-Jane', 'W')).toBe('Mary-Jane W.');
    });

    it('handles single character first name', () => {
      expect(formatPlayerName('J', 'D')).toBe('J D.');
    });

    it('handles emojis in names', () => {
      expect(formatPlayerName('Alex 🎮', 'T')).toBe('Alex 🎮 T.');
    });
  });

  describe('getHintContent', () => {
    describe('source hints', () => {
      it('returns student-contributed hint with contributor name', () => {
        const claim = {
          source: 'student-contributed',
          contributor: 'Alice'
        };
        expect(getHintContent(claim, 'source-hint')).toBe('✨ This claim was submitted by Alice');
      });

      it('returns student-contributed hint without contributor name', () => {
        const claim = { source: 'student-contributed' };
        expect(getHintContent(claim, 'source-hint')).toBe('✨ This claim was submitted by a classmate');
      });

      it('returns AI-generated hint', () => {
        const claim = { source: 'ai-generated' };
        expect(getHintContent(claim, 'source-hint')).toBe('🤖 This claim was generated by AI');
      });

      it('returns expert-sourced hint', () => {
        const claim = { source: 'expert-sourced' };
        expect(getHintContent(claim, 'source-hint')).toBe('📚 This claim comes from expert sources');
      });

      it('defaults to expert hint for unknown source', () => {
        const claim = { source: 'unknown' };
        expect(getHintContent(claim, 'source-hint')).toBe('📚 This claim comes from expert sources');
      });
    });

    describe('error hints', () => {
      it('returns no-error hint for expert-sourced claims', () => {
        const claim = { source: 'expert-sourced' };
        expect(getHintContent(claim, 'error-hint')).toBe("✅ This claim doesn't contain typical AI errors");
      });

      it('returns specific error pattern for student-contributed claims', () => {
        const claim = {
          source: 'student-contributed',
          errorPattern: 'Overgeneralization'
        };
        expect(getHintContent(claim, 'error-hint')).toBe('🎯 Look for: Overgeneralization');
      });

      it('returns generic hint for student claims without error pattern', () => {
        const claim = { source: 'student-contributed' };
        expect(getHintContent(claim, 'error-hint')).toBe('🔍 Think critically - what might be wrong here?');
      });

      it('returns error pattern for AI-generated claims', () => {
        const claim = {
          source: 'ai-generated',
          errorPattern: 'Confident specificity'
        };
        expect(getHintContent(claim, 'error-hint')).toBe('🎯 Look for: Confident specificity');
      });
    });

    describe('subject hints', () => {
      it('returns subject-specific hint when available', () => {
        const claim = { subject: 'Biology' };
        const hint = getHintContent(claim, 'subject-hint');
        expect(hint).toBeTruthy();
        expect(hint.length).toBeGreaterThan(0);
      });

      it('returns default hint for unknown subject', () => {
        const claim = { subject: 'UnknownSubject' };
        expect(getHintContent(claim, 'subject-hint')).toBe('Think critically about this subject area!');
      });
    });

    describe('unknown hint type', () => {
      it('returns default message for unknown hint type', () => {
        const claim = { source: 'expert-sourced' };
        expect(getHintContent(claim, 'unknown-hint')).toBe('No hint available.');
      });
    });
  });

  describe('getUnseenClaimStats', () => {
    it('calculates total and unseen counts correctly', async () => {
      const seenIds = ['1', '2', '3'];
      const stats = await getUnseenClaimStats(seenIds);

      expect(stats.total).toBe(mockClaims.length);
      expect(stats.unseen).toBe(mockClaims.length - 3);
      expect(stats.seen).toBe(3);
    });

    it('calculates percent seen correctly', async () => {
      const seenIds = ['1', '2', '3', '4', '5']; // 5 out of 10 = 50%
      const stats = await getUnseenClaimStats(seenIds);

      expect(stats.percentSeen).toBe(50);
    });

    it('handles no seen claims', async () => {
      const stats = await getUnseenClaimStats([]);

      expect(stats.total).toBe(mockClaims.length);
      expect(stats.unseen).toBe(mockClaims.length);
      expect(stats.seen).toBe(0);
      expect(stats.percentSeen).toBe(0);
    });

    it('handles all claims seen', async () => {
      const allIds = mockClaims.map(c => c.id);
      const stats = await getUnseenClaimStats(allIds);

      expect(stats.unseen).toBe(0);
      expect(stats.seen).toBe(mockClaims.length);
      expect(stats.percentSeen).toBe(100);
    });

    it('filters by subjects when provided', async () => {
      const biologyClaims = mockClaims.filter(c => c.subject === 'Biology');
      const seenIds = ['1'];
      const stats = await getUnseenClaimStats(seenIds, ['Biology']);

      expect(stats.total).toBe(biologyClaims.length);
    });

    it('includes additional claims in count', async () => {
      const additionalClaims = [
        { id: 'student-1', subject: 'Biology' },
        { id: 'student-2', subject: 'Physics' }
      ];

      const stats = await getUnseenClaimStats([], [], additionalClaims);
      expect(stats.total).toBe(mockClaims.length + 2);
    });

    it('handles empty claims database', async () => {
      claimsLoader.loadClaimsDatabase.mockResolvedValue([]);
      const stats = await getUnseenClaimStats([]);

      expect(stats.total).toBe(0);
      expect(stats.unseen).toBe(0);
      expect(stats.percentSeen).toBe(0);
    });

    it('rounds percentSeen to nearest integer', async () => {
      claimsLoader.loadClaimsDatabase.mockResolvedValue([
        { id: '1', subject: 'Test' },
        { id: '2', subject: 'Test' },
        { id: '3', subject: 'Test' }
      ]);

      const stats = await getUnseenClaimStats(['1']); // 1/3 = 33.33...%
      expect(Number.isInteger(stats.percentSeen)).toBe(true);
    });

    it('ignores duplicate seen IDs', async () => {
      const duplicateSeenIds = ['1', '1', '2', '2', '3'];
      const stats = await getUnseenClaimStats(duplicateSeenIds);

      expect(stats.seen).toBe(3); // Should count unique IDs only
    });
  });
});

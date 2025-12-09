/**
 * Claims Database Tests
 */

import { describe, it, expect } from 'vitest';
import { CLAIMS_DATABASE, AI_ERROR_PATTERNS, validateClaimsDatabase } from './claims';

describe('CLAIMS_DATABASE', () => {
  it('has at least 30 claims', () => {
    expect(CLAIMS_DATABASE.length).toBeGreaterThanOrEqual(30);
  });

  it('has claims for all difficulties', () => {
    const difficulties = new Set(CLAIMS_DATABASE.map(c => c.difficulty));
    expect(difficulties.has('easy')).toBe(true);
    expect(difficulties.has('medium')).toBe(true);
    expect(difficulties.has('hard')).toBe(true);
  });

  it('has both AI-generated and expert-sourced claims', () => {
    const sources = new Set(CLAIMS_DATABASE.map(c => c.source));
    expect(sources.has('ai-generated')).toBe(true);
    expect(sources.has('expert-sourced')).toBe(true);
  });

  it('has all three answer types', () => {
    const answers = new Set(CLAIMS_DATABASE.map(c => c.answer));
    expect(answers.has('TRUE')).toBe(true);
    expect(answers.has('FALSE')).toBe(true);
    expect(answers.has('MIXED')).toBe(true);
  });

  it('all claims have required fields', () => {
    CLAIMS_DATABASE.forEach((claim, index) => {
      expect(claim.id, `Claim ${index} missing id`).toBeDefined();
      expect(claim.text, `Claim ${index} missing text`).toBeDefined();
      expect(claim.answer, `Claim ${index} missing answer`).toBeDefined();
      expect(claim.source, `Claim ${index} missing source`).toBeDefined();
      expect(claim.explanation, `Claim ${index} missing explanation`).toBeDefined();
      expect(claim.subject, `Claim ${index} missing subject`).toBeDefined();
      expect(claim.difficulty, `Claim ${index} missing difficulty`).toBeDefined();
    });
  });

  it('all claims have valid answer values', () => {
    const validAnswers = ['TRUE', 'FALSE', 'MIXED'];
    CLAIMS_DATABASE.forEach((claim) => {
      expect(validAnswers).toContain(claim.answer);
    });
  });

  it('all claims have valid source values', () => {
    const validSources = ['ai-generated', 'expert-sourced'];
    CLAIMS_DATABASE.forEach((claim) => {
      expect(validSources).toContain(claim.source);
    });
  });

  it('all claims have valid difficulty values', () => {
    const validDifficulties = ['easy', 'medium', 'hard'];
    CLAIMS_DATABASE.forEach((claim) => {
      expect(validDifficulties).toContain(claim.difficulty);
    });
  });

  it('AI-generated claims have error patterns', () => {
    const aiClaims = CLAIMS_DATABASE.filter(c => c.source === 'ai-generated');
    aiClaims.forEach((claim) => {
      expect(claim.errorPattern, `AI claim ${claim.id} missing errorPattern`).toBeDefined();
    });
  });

  it('has no duplicate IDs', () => {
    const ids = CLAIMS_DATABASE.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('claim texts are reasonable length', () => {
    CLAIMS_DATABASE.forEach((claim) => {
      expect(claim.text.length, `Claim ${claim.id} text too short`).toBeGreaterThan(20);
      expect(claim.text.length, `Claim ${claim.id} text too long`).toBeLessThan(500);
    });
  });

  it('explanations are reasonable length', () => {
    CLAIMS_DATABASE.forEach((claim) => {
      expect(claim.explanation.length, `Claim ${claim.id} explanation too short`).toBeGreaterThan(20);
    });
  });
});

describe('AI_ERROR_PATTERNS', () => {
  it('has at least 4 error patterns', () => {
    expect(AI_ERROR_PATTERNS.length).toBeGreaterThanOrEqual(4);
  });

  it('all patterns have required fields', () => {
    AI_ERROR_PATTERNS.forEach((pattern, index) => {
      expect(pattern.name, `Pattern ${index} missing name`).toBeDefined();
      expect(pattern.description, `Pattern ${index} missing description`).toBeDefined();
      expect(pattern.example, `Pattern ${index} missing example`).toBeDefined();
    });
  });
});

describe('validateClaimsDatabase', () => {
  it('validates the built-in database', () => {
    const result = validateClaimsDatabase();
    expect(result.valid).toBe(true);
    expect(result.duplicates).toHaveLength(0);
    expect(result.invalidClaims).toHaveLength(0);
  });
});

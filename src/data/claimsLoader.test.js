import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to reset module state between tests
let claimsLoaderModule;

describe('claimsLoader', () => {
  beforeEach(async () => {
    // Reset module cache for fresh state each test
    vi.resetModules();
    claimsLoaderModule = await import('./claimsLoader');
  });

  describe('areClaimsLoaded', () => {
    it('returns false initially', () => {
      expect(claimsLoaderModule.areClaimsLoaded()).toBe(false);
    });
  });

  describe('getClaimsCount', () => {
    it('returns null when claims not loaded', () => {
      expect(claimsLoaderModule.getClaimsCount()).toBeNull();
    });
  });

  describe('loadClaimsDatabase', () => {
    it('loads claims and caches them', async () => {
      const claims = await claimsLoaderModule.loadClaimsDatabase();
      expect(Array.isArray(claims)).toBe(true);
      expect(claims.length).toBeGreaterThan(0);
      expect(claimsLoaderModule.areClaimsLoaded()).toBe(true);
    });

    it('returns cached claims on second call', async () => {
      const first = await claimsLoaderModule.loadClaimsDatabase();
      const second = await claimsLoaderModule.loadClaimsDatabase();
      expect(first).toBe(second); // Same reference
    });

    it('getClaimsCount returns number after loading', async () => {
      await claimsLoaderModule.loadClaimsDatabase();
      const count = claimsLoaderModule.getClaimsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('preloadClaims', () => {
    it('does not throw', () => {
      expect(() => claimsLoaderModule.preloadClaims()).not.toThrow();
    });
  });
});

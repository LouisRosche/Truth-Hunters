/**
 * Leaderboard Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { aggregatePlayerScores, getTopPlayers } from './leaderboardUtils';

describe('aggregatePlayerScores', () => {
  it('aggregates scores for a single player across multiple games', () => {
    const records = [
      { score: 10, players: [{ firstName: 'Alice', lastInitial: 'B' }] },
      { score: 15, players: [{ firstName: 'Alice', lastInitial: 'B' }] }
    ];
    const result = aggregatePlayerScores(records);
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Alice B.');
    expect(result[0].totalScore).toBe(25);
    expect(result[0].gamesPlayed).toBe(2);
    expect(result[0].bestScore).toBe(15);
    expect(result[0].avgScore).toBe(13);
  });

  it('handles multiple players on same team', () => {
    const records = [
      {
        score: 20,
        players: [
          { firstName: 'Alice', lastInitial: 'B' },
          { firstName: 'Charlie', lastInitial: 'D' }
        ]
      }
    ];
    const result = aggregatePlayerScores(records);
    expect(result).toHaveLength(2);
    // Both players share the team's score
    expect(result[0].totalScore).toBe(20);
    expect(result[1].totalScore).toBe(20);
  });

  it('sorts by best score descending', () => {
    const records = [
      { score: 5, players: [{ firstName: 'Low', lastInitial: 'S' }] },
      { score: 25, players: [{ firstName: 'High', lastInitial: 'S' }] }
    ];
    const result = aggregatePlayerScores(records);
    expect(result[0].displayName).toBe('High S.');
    expect(result[1].displayName).toBe('Low S.');
  });

  it('handles records without players', () => {
    const records = [
      { score: 10 },
      { score: 15, players: [{ firstName: 'Alice', lastInitial: 'B' }] }
    ];
    const result = aggregatePlayerScores(records);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for no records', () => {
    expect(aggregatePlayerScores([])).toEqual([]);
  });

  it('handles case-insensitive player matching', () => {
    const records = [
      { score: 10, players: [{ firstName: 'Alice', lastInitial: 'B' }] },
      { score: 15, players: [{ firstName: 'alice', lastInitial: 'b' }] }
    ];
    const result = aggregatePlayerScores(records);
    expect(result).toHaveLength(1);
    expect(result[0].totalScore).toBe(25);
  });

  it('handles negative scores', () => {
    const records = [
      { score: -5, players: [{ firstName: 'Bad', lastInitial: 'L' }] }
    ];
    const result = aggregatePlayerScores(records);
    expect(result[0].totalScore).toBe(-5);
    expect(result[0].bestScore).toBe(-5);
  });
});

describe('getTopPlayers', () => {
  const records = [
    { score: 30, players: [{ firstName: 'A', lastInitial: '1' }] },
    { score: 20, players: [{ firstName: 'B', lastInitial: '2' }] },
    { score: 10, players: [{ firstName: 'C', lastInitial: '3' }] }
  ];

  it('returns top N players', () => {
    const result = getTopPlayers(records, 2);
    expect(result).toHaveLength(2);
    expect(result[0].displayName).toBe('A 1.');
  });

  it('defaults to top 10', () => {
    const result = getTopPlayers(records);
    expect(result).toHaveLength(3); // Only 3 exist
  });

  it('handles empty records', () => {
    expect(getTopPlayers([])).toEqual([]);
  });
});

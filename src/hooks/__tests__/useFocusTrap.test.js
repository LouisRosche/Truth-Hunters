/**
 * useFocusTrap Hook Tests
 * Tests focus trapping for accessibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
  it('returns a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toHaveProperty('current');
  });

  it('can be activated and deactivated', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useFocusTrap(active),
      { initialProps: { active: false } }
    );

    expect(result.current).toHaveProperty('current');

    // Rerender with active true
    rerender({ active: true });
    expect(result.current).toHaveProperty('current');

    // Rerender with active false again
    rerender({ active: false });
    expect(result.current).toHaveProperty('current');
  });
});

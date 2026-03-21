/**
 * LoadingSkeleton Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingSkeleton } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders claim skeleton by default', () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThanOrEqual(3);
  });

  it('renders claim skeleton with type="claim"', () => {
    const { container } = render(<LoadingSkeleton type="claim" />);
    // Claim has subject badge + 3 text lines = 4 skeleton elements
    expect(container.querySelectorAll('.skeleton')).toHaveLength(4);
  });

  it('renders stats skeleton with 4 stat cards', () => {
    const { container } = render(<LoadingSkeleton type="stats" />);
    // 4 cards × 2 skeletons each = 8
    expect(container.querySelectorAll('.skeleton')).toHaveLength(8);
  });

  it('renders generic skeleton for unknown type', () => {
    const { container } = render(<LoadingSkeleton type="generic" />);
    expect(container.querySelectorAll('.skeleton')).toHaveLength(1);
  });
});

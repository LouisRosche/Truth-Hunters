/**
 * Button Component Tests
 * Tests the reusable button component with variants and double-click protection
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(<Button><span>Icon</span> Text</Button>);
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('onClick Behavior', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Click Me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('prevents double-clicks within the debounce window', async () => {
      vi.useFakeTimers();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} preventDoubleClickMs={500}>Click Me</Button>);

      const button = screen.getByRole('button');

      // First click should work
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Immediate second click should be prevented
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1); // Still just 1

      // After debounce period, click should work again
      vi.advanceTimersByTime(600);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('allows undefined onClick handler without crashing', () => {
      render(<Button>No Handler</Button>);
      const button = screen.getByRole('button');

      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Button disabled>Click Me</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('sets aria-disabled attribute', () => {
      render(<Button disabled>Click Me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies opacity styling when disabled', () => {
      render(<Button disabled>Click Me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ opacity: 0.5 });
    });

    it('applies not-allowed cursor when disabled', () => {
      render(<Button disabled>Click Me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ cursor: 'not-allowed' });
    });
  });

  describe('Variant Styling', () => {
    it('applies primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ background: 'var(--accent-cyan)' });
    });

    it('applies secondary variant styling', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: 'transparent',
        border: '2px solid var(--accent-cyan)'
      });
    });

    it('applies danger variant styling', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: 'var(--accent-rose)'
      });
      // Check color separately to be more flexible with rendering
      const styles = window.getComputedStyle(button);
      expect(styles.background).toContain('var(--accent-rose)');
    });
  });

  describe('Size Options', () => {
    it('applies medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        padding: '0.875rem 1.5rem',
        fontSize: '1rem',
        minHeight: '44px'
      });
    });

    it('applies small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        minHeight: '44px'
      });
    });

    it('applies large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        padding: '1rem 2rem',
        fontSize: '1.125rem',
        minHeight: '48px'
      });
    });
  });

  describe('Full Width', () => {
    it('applies full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ width: '100%' });
    });

    it('does not apply full width by default', () => {
      render(<Button>Normal</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ width: 'auto' });
    });
  });

  describe('Accessibility', () => {
    it('applies aria-label when provided', () => {
      render(<Button ariaLabel="Submit form">→</Button>);
      const button = screen.getByRole('button', { name: 'Submit form' });
      expect(button).toBeInTheDocument();
    });

    it('uses children as accessible name when no aria-label', () => {
      render(<Button>Click Here</Button>);
      const button = screen.getByRole('button', { name: /Click Here/i });
      expect(button).toBeInTheDocument();
    });

    it('applies mono className for consistent typography', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mono');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('works with complex children (icons + text)', () => {
      render(
        <Button>
          <span role="img" aria-label="rocket">🚀</span>
          Launch
        </Button>
      );
      expect(screen.getByRole('img', { name: 'rocket' })).toBeInTheDocument();
      expect(screen.getByText('Launch')).toBeInTheDocument();
    });

    it('allows custom preventDoubleClickMs timing', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} preventDoubleClickMs={1000}>Click Me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button); // Should be prevented

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Minimum Touch Target Size (Accessibility)', () => {
    it('meets minimum 44px touch target for small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ minHeight: '44px' });
    });

    it('meets minimum 44px touch target for medium size', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ minHeight: '44px' });
    });

    it('exceeds minimum touch target for large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ minHeight: '48px' });
    });
  });
});

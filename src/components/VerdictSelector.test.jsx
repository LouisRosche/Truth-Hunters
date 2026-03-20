/**
 * VerdictSelector Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerdictSelector } from './VerdictSelector';

describe('VerdictSelector', () => {
  const defaultProps = {
    value: null,
    onChange: vi.fn()
  };

  it('renders three verdict options', () => {
    render(<VerdictSelector {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });

  it('renders TRUE, MIXED, and FALSE labels', () => {
    render(<VerdictSelector {...defaultProps} />);
    expect(screen.getByText('TRUE')).toBeInTheDocument();
    expect(screen.getByText('MIXED')).toBeInTheDocument();
    expect(screen.getByText('FALSE')).toBeInTheDocument();
  });

  it('has radiogroup role with accessible label', () => {
    render(<VerdictSelector {...defaultProps} />);
    expect(screen.getByRole('radiogroup', { name: /verdict/i })).toBeInTheDocument();
  });

  describe('Selection', () => {
    it('marks selected verdict as checked', () => {
      render(<VerdictSelector {...defaultProps} value="TRUE" />);
      const radios = screen.getAllByRole('radio');
      // TRUE is first
      expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('marks non-selected verdicts as unchecked', () => {
      render(<VerdictSelector {...defaultProps} value="TRUE" />);
      const radios = screen.getAllByRole('radio');
      // FALSE is third
      expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });

    it('calls onChange when a verdict is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VerdictSelector {...defaultProps} onChange={onChange} />);
      const radios = screen.getAllByRole('radio');
      await user.click(radios[2]); // FALSE
      expect(onChange).toHaveBeenCalledWith('FALSE');
    });
  });

  describe('Keyboard navigation', () => {
    it('navigates to next option with ArrowRight', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VerdictSelector value="TRUE" onChange={onChange} />);
      const radios = screen.getAllByRole('radio');
      radios[0].focus(); // TRUE
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('MIXED');
    });

    it('wraps around from FALSE to TRUE with ArrowRight', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VerdictSelector value="FALSE" onChange={onChange} />);
      const radios = screen.getAllByRole('radio');
      radios[2].focus(); // FALSE
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('TRUE');
    });
  });

  describe('Disabled state', () => {
    it('disables all radio buttons when disabled', () => {
      render(<VerdictSelector {...defaultProps} disabled={true} />);
      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });
  });

  describe('MIXED explainer', () => {
    it('shows "What\'s this?" button on MIXED option', () => {
      render(<VerdictSelector {...defaultProps} />);
      expect(screen.getByRole('button', { name: /what does mixed mean/i })).toBeInTheDocument();
    });

    it('toggles explainer panel on click', async () => {
      const user = userEvent.setup();
      render(<VerdictSelector {...defaultProps} />);
      const helpBtn = screen.getByRole('button', { name: /what does mixed mean/i });
      await user.click(helpBtn);
      expect(screen.getByText(/has some truth to it/i)).toBeInTheDocument();
    });

    it('closes explainer panel with close button', async () => {
      const user = userEvent.setup();
      render(<VerdictSelector {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /what does mixed mean/i }));
      expect(screen.getByText(/has some truth to it/i)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /close help/i }));
      expect(screen.queryByText(/has some truth to it/i)).not.toBeInTheDocument();
    });
  });
});

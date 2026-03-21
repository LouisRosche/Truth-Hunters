/**
 * ConfidenceSelector Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfidenceSelector } from './ConfidenceSelector';

describe('ConfidenceSelector', () => {
  const defaultProps = {
    value: 1,
    onChange: vi.fn()
  };

  it('renders three confidence options', () => {
    render(<ConfidenceSelector {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });

  it('has radiogroup role with accessible label', () => {
    render(<ConfidenceSelector {...defaultProps} />);
    expect(screen.getByRole('radiogroup', { name: /confidence level/i })).toBeInTheDocument();
  });

  it('displays labels for each level', () => {
    render(<ConfidenceSelector {...defaultProps} />);
    expect(screen.getByText('Not sure')).toBeInTheDocument();
    expect(screen.getByText('Pretty sure')).toBeInTheDocument();
    expect(screen.getByText('Certain!')).toBeInTheDocument();
  });

  it('displays risk/reward info for each level', () => {
    render(<ConfidenceSelector {...defaultProps} />);
    expect(screen.getByText(/Right \+1 · Wrong -1/)).toBeInTheDocument();
    expect(screen.getByText(/Right \+3 · Wrong -3/)).toBeInTheDocument();
    expect(screen.getByText(/Right \+5 · Wrong -6/)).toBeInTheDocument();
  });

  describe('Selection', () => {
    it('marks selected level as checked', () => {
      render(<ConfidenceSelector {...defaultProps} value={2} />);
      const radios = screen.getAllByRole('radio');
      expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    });

    it('calls onChange when a level is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ConfidenceSelector {...defaultProps} onChange={onChange} />);
      await user.click(screen.getByText('Certain!'));
      expect(onChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Keyboard navigation', () => {
    it('moves to next level with ArrowRight', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ConfidenceSelector value={1} onChange={onChange} />);
      const radio = screen.getAllByRole('radio')[0];
      radio.focus();
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('clamps at max level 3 with ArrowRight', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ConfidenceSelector value={3} onChange={onChange} />);
      const radio = screen.getAllByRole('radio')[2];
      radio.focus();
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith(3);
    });

    it('clamps at min level 1 with ArrowLeft', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ConfidenceSelector value={1} onChange={onChange} />);
      const radio = screen.getAllByRole('radio')[0];
      radio.focus();
      await user.keyboard('{ArrowLeft}');
      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Disabled state', () => {
    it('disables all radio buttons when disabled', () => {
      render(<ConfidenceSelector {...defaultProps} disabled={true} />);
      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });
  });
});

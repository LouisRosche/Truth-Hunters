/**
 * VotingSection Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VotingSection } from './VotingSection';

// Mock child components to isolate VotingSection logic
vi.mock('./VerdictSelector', () => ({
  VerdictSelector: ({ value, onChange }) => (
    <div data-testid="verdict-selector" data-value={value}>
      <button onClick={() => onChange('TRUE')}>Select TRUE</button>
    </div>
  )
}));

vi.mock('./ConfidenceSelector', () => ({
  ConfidenceSelector: ({ value, onChange }) => (
    <div data-testid="confidence-selector" data-value={value}>
      <button onClick={() => onChange(3)}>Select High</button>
    </div>
  )
}));

describe('VotingSection', () => {
  const defaultProps = {
    verdict: null,
    onVerdictChange: vi.fn(),
    confidence: 1,
    onConfidenceChange: vi.fn(),
    reasoning: '',
    onReasoningChange: vi.fn(),
    usedHints: [],
    hintCostTotal: 0,
    onHintRequest: vi.fn(),
    onSubmit: vi.fn(),
    teamAvatar: null,
    disabled: false
  };

  it('renders VerdictSelector and ConfidenceSelector', () => {
    render(<VotingSection {...defaultProps} />);
    expect(screen.getByTestId('verdict-selector')).toBeInTheDocument();
    expect(screen.getByTestId('confidence-selector')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<VotingSection {...defaultProps} />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('disables submit when no verdict selected', () => {
    render(<VotingSection {...defaultProps} verdict={null} />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('enables submit when verdict is selected', () => {
    render(<VotingSection {...defaultProps} verdict="TRUE" />);
    expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled();
  });

  it('calls onSubmit when submit button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<VotingSection {...defaultProps} verdict="TRUE" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows team avatar emoji on submit button', () => {
    render(<VotingSection {...defaultProps} verdict="TRUE" teamAvatar={{ emoji: '🦉', name: 'Owls' }} />);
    expect(screen.getByRole('button', { name: /submit/i })).toHaveTextContent('🦉');
  });

  describe('Reasoning', () => {
    it('shows "Add reasoning" button by default', () => {
      render(<VotingSection {...defaultProps} />);
      expect(screen.getByText(/add reasoning/i)).toBeInTheDocument();
    });

    it('shows textarea when "Add reasoning" is clicked', async () => {
      const user = userEvent.setup();
      render(<VotingSection {...defaultProps} />);
      await user.click(screen.getByText(/add reasoning/i));
      expect(screen.getByPlaceholderText(/why/i)).toBeInTheDocument();
    });

    it('calls onReasoningChange when typing in textarea', async () => {
      const user = userEvent.setup();
      const onReasoningChange = vi.fn();
      render(<VotingSection {...defaultProps} onReasoningChange={onReasoningChange} />);
      await user.click(screen.getByText(/add reasoning/i));
      await user.type(screen.getByPlaceholderText(/why/i), 'a');
      expect(onReasoningChange).toHaveBeenCalled();
    });

    it('hides textarea when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<VotingSection {...defaultProps} />);
      await user.click(screen.getByText(/add reasoning/i));
      expect(screen.getByPlaceholderText(/why/i)).toBeInTheDocument();
      // Click the × close button
      await user.click(screen.getByText('×'));
      expect(screen.queryByPlaceholderText(/why/i)).not.toBeInTheDocument();
    });
  });

  describe('Hints', () => {
    it('renders hint buttons', () => {
      render(<VotingSection {...defaultProps} />);
      // HINT_TYPES has at least 2 hints (source-hint, error-hint)
      const buttons = screen.getAllByRole('button');
      // Should have hint buttons plus submit and reasoning toggle
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });

    it('disables used hint buttons', () => {
      render(<VotingSection {...defaultProps} usedHints={['source-hint']} />);
      const hintButtons = screen.getAllByRole('button').filter(
        (btn) => btn.title && btn.title.includes('Source Check')
      );
      expect(hintButtons[0]).toBeDisabled();
    });

    it('shows hint cost total when hints are used', () => {
      render(<VotingSection {...defaultProps} hintCostTotal={5} />);
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('does not show hint cost when no hints used', () => {
      render(<VotingSection {...defaultProps} hintCostTotal={0} />);
      expect(screen.queryByText(/-\d+/)).not.toBeInTheDocument();
    });

    it('calls onHintRequest when hint button is clicked', async () => {
      const user = userEvent.setup();
      const onHintRequest = vi.fn();
      render(<VotingSection {...defaultProps} onHintRequest={onHintRequest} />);
      // Click first non-disabled hint button (has a title with cost info)
      const hintButtons = screen.getAllByRole('button').filter(
        (btn) => btn.title && btn.title.includes('-')
      );
      await user.click(hintButtons[0]);
      expect(onHintRequest).toHaveBeenCalled();
    });
  });
});

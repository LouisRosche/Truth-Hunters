/**
 * ClaimCard Component Tests
 * Tests the claim display component with and without answer reveal
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClaimCard } from './ClaimCard';

describe('ClaimCard', () => {
  const mockClaim = {
    id: 'test-claim-1',
    text: 'The Earth revolves around the Sun.',
    subject: 'Astronomy',
    difficulty: 'easy',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is a fundamental fact of our solar system confirmed by centuries of observation.'
  };

  describe('Basic Rendering', () => {
    it('renders claim text correctly', () => {
      render(<ClaimCard claim={mockClaim} />);
      expect(screen.getByText(/The Earth revolves around the Sun/i)).toBeInTheDocument();
    });

    it('displays subject badge', () => {
      render(<ClaimCard claim={mockClaim} />);
      expect(screen.getByText('Astronomy')).toBeInTheDocument();
    });

    it('does not show answer by default', () => {
      render(<ClaimCard claim={mockClaim} />);
      expect(screen.queryByText('TRUE')).not.toBeInTheDocument();
      expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
    });
  });

  describe('Answer Reveal', () => {
    it('shows answer when showAnswer is true', () => {
      render(<ClaimCard claim={mockClaim} showAnswer={true} />);
      expect(screen.getByText('TRUE')).toBeInTheDocument();
    });

    it('displays explanation when answer is revealed', () => {
      render(<ClaimCard claim={mockClaim} showAnswer={true} />);
      expect(screen.getByText(/fundamental fact of our solar system/i)).toBeInTheDocument();
    });

    it('shows expert-sourced indicator when answer revealed', () => {
      render(<ClaimCard claim={mockClaim} showAnswer={true} />);
      expect(screen.getByText(/Expert-Sourced/i)).toBeInTheDocument();
    });
  });

  describe('Source Indicators', () => {
    it('displays AI-generated indicator for AI claims', () => {
      const aiClaim = {
        ...mockClaim,
        source: 'ai-generated',
        errorPattern: 'Confident Specificity'
      };
      render(<ClaimCard claim={aiClaim} showAnswer={true} />);
      expect(screen.getByText(/AI-Generated/i)).toBeInTheDocument();
    });

    it('shows error pattern for AI-generated claims', () => {
      const aiClaim = {
        ...mockClaim,
        source: 'ai-generated',
        errorPattern: 'Myth Perpetuation',
        answer: 'FALSE'
      };
      render(<ClaimCard claim={aiClaim} showAnswer={true} />);
      expect(screen.getByText(/Error: Myth Perpetuation/i)).toBeInTheDocument();
    });

    it('displays student-contributed indicator', () => {
      const studentClaim = {
        ...mockClaim,
        source: 'student-contributed',
        contributor: 'Maya'
      };
      render(<ClaimCard claim={studentClaim} showAnswer={true} />);
      expect(screen.getByText(/By Maya/i)).toBeInTheDocument();
    });

    it('shows generic "Classmate" when no contributor specified', () => {
      const studentClaim = {
        ...mockClaim,
        source: 'student-contributed'
      };
      render(<ClaimCard claim={studentClaim} showAnswer={true} />);
      expect(screen.getByText(/By Classmate/i)).toBeInTheDocument();
    });
  });

  describe('Answer Types', () => {
    it('displays FALSE answer correctly', () => {
      const falseClaim = { ...mockClaim, answer: 'FALSE' };
      render(<ClaimCard claim={falseClaim} showAnswer={true} />);
      expect(screen.getByText('FALSE')).toBeInTheDocument();
    });

    it('displays MIXED answer correctly', () => {
      const mixedClaim = { ...mockClaim, answer: 'MIXED' };
      render(<ClaimCard claim={mixedClaim} showAnswer={true} />);
      expect(screen.getByText('MIXED')).toBeInTheDocument();
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies claim-text class for presentation mode scaling', () => {
      render(<ClaimCard claim={mockClaim} />);
      const blockquote = screen.getByText(/The Earth revolves around the Sun/i).closest('blockquote');
      expect(blockquote).toHaveClass('claim-text');
    });

    it('applies animate-in class for animations', () => {
      const { container } = render(<ClaimCard claim={mockClaim} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('animate-in');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing explanation gracefully', () => {
      const claimNoExplanation = { ...mockClaim, explanation: '' };
      render(<ClaimCard claim={claimNoExplanation} showAnswer={true} />);
      // Should render without crashing
      expect(screen.getByText('TRUE')).toBeInTheDocument();
    });

    it('handles very long claim text', () => {
      const longClaim = {
        ...mockClaim,
        text: 'This is a very long claim that goes on and on and on and should still render properly without breaking the layout or causing any rendering issues even when it contains many many words and complex sentences.'
      };
      render(<ClaimCard claim={longClaim} />);
      expect(screen.getByText(/This is a very long claim/i)).toBeInTheDocument();
    });

    it('handles special characters in claim text', () => {
      const specialClaim = {
        ...mockClaim,
        text: 'Claims with "quotes", \'apostrophes\', & ampersands, <brackets>, and émojis 🔍 work fine.'
      };
      render(<ClaimCard claim={specialClaim} />);
      expect(screen.getByText(/quotes.*apostrophes/i)).toBeInTheDocument();
    });
  });
});

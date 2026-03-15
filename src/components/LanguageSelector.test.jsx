/**
 * LanguageSelector Component Tests
 * Tests the language switcher component in both compact and full modes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from './LanguageSelector';

// Mock react-i18next
const mockChangeLanguage = vi.fn();
const mockI18n = {
  language: 'en',
  changeLanguage: mockChangeLanguage
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n
  })
}));

// Mock i18n config
vi.mock('../i18n/config', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' }
  ]
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = 'en';
  });

  describe('Compact Mode', () => {
    it('renders as a dropdown select', () => {
      render(<LanguageSelector compact={true} />);

      const select = screen.getByRole('combobox', { name: /select language/i });
      expect(select).toBeInTheDocument();
    });

    it('displays all supported languages as options', () => {
      render(<LanguageSelector compact={true} />);

      expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument();
    });

    it('shows current language as selected', () => {
      mockI18n.language = 'es';
      render(<LanguageSelector compact={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('es');
    });

    it('calls changeLanguage when option is selected', () => {
      render(<LanguageSelector compact={true} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'es' } });

      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });

    it('has minimum 36px height for touch targets', () => {
      render(<LanguageSelector compact={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveStyle({ minHeight: '36px' });
    });

    it('has accessible label', () => {
      render(<LanguageSelector compact={true} />);

      expect(screen.getByLabelText(/select language/i)).toBeInTheDocument();
    });
  });

  describe('Full Mode', () => {
    it('renders language buttons instead of dropdown', () => {
      render(<LanguageSelector compact={false} />);

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /English/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();
    });

    it('displays label "Language / Idioma"', () => {
      render(<LanguageSelector />);

      expect(screen.getByText('Language / Idioma')).toBeInTheDocument();
    });

    it('shows native names on buttons', () => {
      render(<LanguageSelector />);

      // Both native names should appear on buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('English');
      expect(buttons[1]).toHaveTextContent('Español');
    });

    it('shows English names as subtitles', () => {
      render(<LanguageSelector />);

      // Both languages should show their English names
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('English');
      expect(buttons[1]).toHaveTextContent('Spanish');
    });

    it('highlights active language button', () => {
      mockI18n.language = 'en';
      render(<LanguageSelector />);

      const englishButton = screen.getByRole('button', { name: /English/i });
      expect(englishButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not highlight inactive language buttons', () => {
      mockI18n.language = 'en';
      render(<LanguageSelector />);

      const spanishButton = screen.getByRole('button', { name: /Español/i });
      expect(spanishButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls changeLanguage when button is clicked', () => {
      render(<LanguageSelector />);

      const spanishButton = screen.getByRole('button', { name: /Español/i });
      fireEvent.click(spanishButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });

    it('handles language codes with region specifiers', () => {
      mockI18n.language = 'en-US';
      render(<LanguageSelector />);

      // Should still highlight English button even with region code
      const englishButton = screen.getByRole('button', { name: /English/i });
      expect(englishButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('displays contribution message', () => {
      render(<LanguageSelector />);

      expect(screen.getByText(/More languages coming soon!/)).toBeInTheDocument();
      expect(screen.getByText(/Want to contribute a translation?/)).toBeInTheDocument();
    });

    it('includes link to contribution guide', () => {
      render(<LanguageSelector />);

      const link = screen.getByRole('link', { name: /See our contribution guide/i });
      expect(link).toHaveAttribute('href', 'https://github.com/LouisRosche/Truth-Hunters/blob/main/CONTRIBUTING.md');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Default Behavior', () => {
    it('renders in full mode by default when compact prop is not provided', () => {
      render(<LanguageSelector />);

      // Should show buttons, not dropdown
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.getByText('Language / Idioma')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('compact mode has proper aria-label', () => {
      render(<LanguageSelector compact={true} />);

      expect(screen.getByLabelText('Select language')).toBeInTheDocument();
    });

    it('full mode buttons have aria-pressed state', () => {
      render(<LanguageSelector />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });
  });

  describe('Styling', () => {
    it('compact mode applies mono class', () => {
      render(<LanguageSelector compact={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('mono');
    });

    it('full mode buttons apply mono class', () => {
      render(<LanguageSelector />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('mono');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing language code gracefully', () => {
      mockI18n.language = '';
      render(<LanguageSelector />);

      // Should render without crashing
      expect(screen.getByText('Language / Idioma')).toBeInTheDocument();
    });

    it('handles undefined language code', () => {
      mockI18n.language = undefined;
      render(<LanguageSelector compact={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });
});

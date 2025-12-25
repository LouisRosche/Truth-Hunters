/**
 * LANGUAGE SELECTOR COMPONENT
 * Allows users to switch between supported languages
 */

import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { SUPPORTED_LANGUAGES } from '../i18n/config';

export function LanguageSelector({ compact = false }) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  if (compact) {
    // Compact dropdown version for header
    return (
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        aria-label="Select language"
        className="mono"
        style={{
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          minHeight: '36px'
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    );
  }

  // Full button list version for settings
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label
        className="mono"
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '0.25rem'
        }}
      >
        Language / Idioma
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = i18n.language === lang.code ||
                          i18n.language.startsWith(lang.code);

          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="mono"
              aria-pressed={isActive}
              style={{
                padding: '0.75rem 1.25rem',
                background: isActive
                  ? 'var(--accent-cyan)'
                  : 'var(--bg-elevated)',
                border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border)'}`,
                borderRadius: '8px',
                color: isActive ? 'var(--bg-deep)' : 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {lang.nativeName}
              <span style={{
                display: 'block',
                fontSize: '0.75rem',
                opacity: 0.8,
                marginTop: '0.125rem'
              }}>
                {lang.name}
              </span>
            </button>
          );
        })}
      </div>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: '0.5rem'
      }}>
        More languages coming soon! Want to contribute a translation?{' '}
        <a
          href="https://github.com/LouisRosche/TruthDetector/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-cyan)' }}
        >
          See our contribution guide
        </a>
      </p>
    </div>
  );
}


LanguageSelector.propTypes = {
  compact: PropTypes.bool
};

LanguageSelector.defaultProps = {
  compact: false
};

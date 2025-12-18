/**
 * XSS PROTECTION UTILITIES
 * Provides defense-in-depth sanitization using DOMPurify
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Strips all HTML tags and returns plain text only
 * @param {string} dirty - Potentially unsafe HTML
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Safe plain text
 */
export function sanitizeUserContent(dirty, maxLength = 1000) {
  if (!dirty || typeof dirty !== 'string') return '';

  // Configure DOMPurify for maximum security
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content, strip all markup
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  });

  // Trim and enforce length limit
  return clean.trim().substring(0, maxLength);
}

/**
 * Sanitize student-contributed claim text
 * Extra strict sanitization for user-generated educational content
 * @param {string} claimText - Student's claim submission
 * @returns {string} Sanitized claim text
 */
export function sanitizeClaimText(claimText) {
  if (!claimText || typeof claimText !== 'string') return '';

  // Strip all HTML/script content
  let clean = sanitizeUserContent(claimText, 500);

  // Additional cleaning: remove excessive whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  // Remove any remaining control characters
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(/[\x00-\x1F\x7F]/g, '');

  return clean;
}

/**
 * Sanitize short text inputs (names, labels)
 * @param {string} text - Short text input
 * @param {number} maxLength - Max length (default: 50)
 * @returns {string} Sanitized text
 */
export function sanitizeShortText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') return '';

  let clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });

  // HTML entity encode special characters for additional safety
  clean = clean
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return clean.trim().substring(0, maxLength);
}

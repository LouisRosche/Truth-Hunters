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


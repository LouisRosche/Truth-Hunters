/**
 * Tests for XSS protection / sanitization utilities
 */

import { describe, it, expect } from 'vitest';
import { sanitizeUserContent } from '../sanitize.js';

// ---------------------------------------------------------------------------
// sanitizeUserContent
// ---------------------------------------------------------------------------
describe('sanitizeUserContent', () => {
  // --- Normal text passthrough ---
  it('returns plain text unchanged', () => {
    expect(sanitizeUserContent('Hello world')).toBe('Hello world');
  });

  it('preserves unicode characters', () => {
    const text = 'Bonjour le monde! \u00e9\u00e8\u00ea \u00fc\u00f6\u00e4 \u2603';
    expect(sanitizeUserContent(text)).toBe(text);
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeUserContent('  spaced  ')).toBe('spaced');
  });

  // --- XSS prevention: script tags ---
  it('strips basic <script> tags', () => {
    const result = sanitizeUserContent('<script>alert("xss")</script>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('</script');
  });

  it('strips script tags with attributes', () => {
    const result = sanitizeUserContent('<script type="text/javascript">document.cookie</script>');
    expect(result).not.toContain('<script');
  });

  it('strips script tags with mixed case', () => {
    const result = sanitizeUserContent('<ScRiPt>alert(1)</sCrIpT>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('<ScRiPt');
  });

  it('strips script tags with extra whitespace', () => {
    const result = sanitizeUserContent('<script   >alert(1)</script  >');
    expect(result).not.toContain('<script');
  });

  // --- XSS prevention: event handlers ---
  it('strips img tag with onerror handler', () => {
    const result = sanitizeUserContent('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<img');
  });

  it('strips div with onmouseover handler', () => {
    const result = sanitizeUserContent('<div onmouseover="alert(1)">hover</div>');
    expect(result).not.toContain('onmouseover');
    expect(result).not.toContain('<div');
    expect(result).toContain('hover');
  });

  it('strips body onload handler', () => {
    const result = sanitizeUserContent('<body onload="alert(1)">content</body>');
    expect(result).not.toContain('onload');
    expect(result).not.toContain('<body');
  });

  it('strips svg onload handler', () => {
    const result = sanitizeUserContent('<svg onload="alert(1)">');
    expect(result).not.toContain('<svg');
    expect(result).not.toContain('onload');
  });

  // --- XSS prevention: nested / tricky HTML ---
  it('strips nested HTML tags but preserves inner text', () => {
    const result = sanitizeUserContent('<div><p><b>bold text</b></p></div>');
    expect(result).toBe('bold text');
  });

  it('strips anchor tags but preserves link text', () => {
    const result = sanitizeUserContent('<a href="javascript:alert(1)">click me</a>');
    expect(result).not.toContain('<a');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('click me');
  });

  it('strips iframe tags', () => {
    const result = sanitizeUserContent('<iframe src="https://evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('evil.com');
  });

  it('handles data URI attack vector', () => {
    const result = sanitizeUserContent('<a href="data:text/html,<script>alert(1)</script>">xss</a>');
    expect(result).not.toContain('data:');
    expect(result).not.toContain('<script');
  });

  it('strips style tags', () => {
    const result = sanitizeUserContent('<style>body{background:url("javascript:alert(1)")}</style>text');
    expect(result).not.toContain('<style');
    expect(result).not.toContain('javascript:');
  });

  it('strips object and embed tags', () => {
    const result = sanitizeUserContent('<object data="evil.swf"></object><embed src="evil.swf">');
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
  });

  it('strips form tags', () => {
    const result = sanitizeUserContent('<form action="https://evil.com"><input type="text"></form>');
    expect(result).not.toContain('<form');
    expect(result).not.toContain('<input');
  });

  // --- Length limits ---
  it('enforces default max length of 1000', () => {
    const longText = 'a'.repeat(1500);
    expect(sanitizeUserContent(longText)).toHaveLength(1000);
  });

  it('enforces custom max length', () => {
    const text = 'a'.repeat(100);
    expect(sanitizeUserContent(text, 50)).toHaveLength(50);
  });

  it('does not truncate text shorter than maxLength', () => {
    expect(sanitizeUserContent('short', 1000)).toBe('short');
  });

  // --- Empty / null / non-string inputs ---
  it('returns empty string for null', () => {
    expect(sanitizeUserContent(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeUserContent(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(sanitizeUserContent('')).toBe('');
  });

  it('returns empty string for a number', () => {
    expect(sanitizeUserContent(42)).toBe('');
  });

  it('returns empty string for an array', () => {
    expect(sanitizeUserContent(['<script>'])).toBe('');
  });

  it('returns empty string for an object', () => {
    expect(sanitizeUserContent({ text: 'hi' })).toBe('');
  });

  it('returns empty string for boolean true', () => {
    expect(sanitizeUserContent(true)).toBe('');
  });

  it('returns empty string for boolean false', () => {
    expect(sanitizeUserContent(false)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// DOMPurify interaction - verify tags are actually stripped
// ---------------------------------------------------------------------------
describe('DOMPurify interaction', () => {
  it('sanitizeUserContent strips ALL HTML tags (ALLOWED_TAGS is empty)', () => {
    const html = '<div class="x"><p>text</p><span>more</span></div>';
    const result = sanitizeUserContent(html);
    expect(result).toBe('textmore');
  });

  it('sanitizeUserContent strips ALL attributes', () => {
    const html = '<p id="test" class="foo" style="color:red">styled</p>';
    const result = sanitizeUserContent(html);
    expect(result).toBe('styled');
    expect(result).not.toContain('id=');
    expect(result).not.toContain('class=');
    expect(result).not.toContain('style=');
  });

  it('keeps text content when KEEP_CONTENT is true', () => {
    const html = '<b>keep</b> <i>this</i> <u>text</u>';
    const result = sanitizeUserContent(html);
    expect(result).toContain('keep');
    expect(result).toContain('this');
    expect(result).toContain('text');
  });

  it('handles deeply nested malicious HTML', () => {
    const nested = '<div><div><div><script>alert(1)</script>safe</div></div></div>';
    const result = sanitizeUserContent(nested);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('safe');
  });

  it('handles HTML entities in input', () => {
    const result = sanitizeUserContent('&amp; &lt; &gt;');
    expect(result).toBeTruthy();
  });

  it('handles malformed / unclosed tags', () => {
    const result = sanitizeUserContent('<div>unclosed<p>also unclosed');
    expect(result).not.toContain('<div');
    expect(result).not.toContain('<p');
    expect(result).toContain('unclosed');
  });

  it('handles tags with encoded characters attempting bypass', () => {
    const result = sanitizeUserContent('&#60;script&#62;alert(1)&#60;/script&#62;');
    expect(result).not.toContain('<script');
  });

  it('strips meta tags', () => {
    const result = sanitizeUserContent('<meta http-equiv="refresh" content="0;url=evil.com">safe');
    expect(result).not.toContain('<meta');
    expect(result).toContain('safe');
  });

  it('strips link tags', () => {
    const result = sanitizeUserContent('<link rel="stylesheet" href="evil.css">safe');
    expect(result).not.toContain('<link');
    expect(result).toContain('safe');
  });

  it('strips base tags', () => {
    const result = sanitizeUserContent('<base href="https://evil.com">safe');
    expect(result).not.toContain('<base');
    expect(result).toContain('safe');
  });
});

// ---------------------------------------------------------------------------
// Additional edge cases
// ---------------------------------------------------------------------------
describe('Edge cases', () => {
  it('handles very long strings with embedded XSS', () => {
    const prefix = 'a'.repeat(900);
    const payload = '<script>alert(1)</script>';
    const result = sanitizeUserContent(prefix + payload);
    expect(result).not.toContain('<script');
    expect(result.length).toBeLessThanOrEqual(1000);
  });

  it('sanitizeUserContent handles string with only HTML tags and no text', () => {
    const result = sanitizeUserContent('<div><span><br></span></div>');
    expect(result.trim()).toBe('');
  });

  it('handles zero-length maxLength', () => {
    expect(sanitizeUserContent('hello', 0)).toBe('');
  });

  it('sanitizeUserContent handles multiline text', () => {
    const result = sanitizeUserContent('line1\nline2\nline3');
    expect(result).toContain('line1');
    expect(result).toContain('line3');
  });
});

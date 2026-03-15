/**
 * Tests for XSS protection / sanitization utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { sanitizeUserContent, sanitizeClaimText, sanitizeShortText } from '../sanitize.js';

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
// sanitizeClaimText
// ---------------------------------------------------------------------------
describe('sanitizeClaimText', () => {
  // --- Normal passthrough ---
  it('returns clean text unchanged', () => {
    expect(sanitizeClaimText('The earth is round.')).toBe('The earth is round.');
  });

  // --- Whitespace normalization ---
  it('collapses multiple spaces into one', () => {
    expect(sanitizeClaimText('too   many    spaces')).toBe('too many spaces');
  });

  it('normalizes tabs to a single space', () => {
    expect(sanitizeClaimText('tab\there')).toBe('tab here');
  });

  it('normalizes newlines to a single space', () => {
    expect(sanitizeClaimText('line\none\ntwo')).toBe('line one two');
  });

  it('normalizes mixed whitespace (spaces, tabs, newlines)', () => {
    expect(sanitizeClaimText('  mixed \t\n  spaces  ')).toBe('mixed spaces');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeClaimText('   trimmed   ')).toBe('trimmed');
  });

  // --- Control character removal ---
  it('removes null bytes', () => {
    expect(sanitizeClaimText('null\x00byte')).toBe('nullbyte');
  });

  it('removes bell character', () => {
    expect(sanitizeClaimText('bell\x07char')).toBe('bellchar');
  });

  it('removes backspace character', () => {
    expect(sanitizeClaimText('back\x08space')).toBe('backspace');
  });

  it('removes escape character', () => {
    expect(sanitizeClaimText('esc\x1Bape')).toBe('escape');
  });

  it('removes DEL character (0x7F)', () => {
    expect(sanitizeClaimText('del\x7Fete')).toBe('delete');
  });

  it('removes multiple control characters scattered in text', () => {
    const input = '\x00start\x01\x02middle\x1Fend\x7F';
    const result = sanitizeClaimText(input);
    expect(result).toBe('startmiddleend');
  });

  // --- Length limits (inherits 500 from implementation) ---
  it('enforces max length of 500', () => {
    const longText = 'a'.repeat(600);
    const result = sanitizeClaimText(longText);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  // --- HTML / XSS stripping (inherited from sanitizeUserContent) ---
  it('strips script tags from claim text', () => {
    const result = sanitizeClaimText('<script>alert("xss")</script>Real claim');
    expect(result).not.toContain('<script');
    expect(result).toContain('Real claim');
  });

  it('strips HTML tags but keeps text content', () => {
    const result = sanitizeClaimText('<b>bold</b> and <i>italic</i>');
    expect(result).toBe('bold and italic');
  });

  // --- Empty / null / non-string inputs ---
  it('returns empty string for null', () => {
    expect(sanitizeClaimText(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeClaimText(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(sanitizeClaimText('')).toBe('');
  });

  it('returns empty string for a number', () => {
    expect(sanitizeClaimText(123)).toBe('');
  });

  it('returns empty string for an array', () => {
    expect(sanitizeClaimText([1, 2, 3])).toBe('');
  });

  it('returns empty string for an object', () => {
    expect(sanitizeClaimText({ claim: 'test' })).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeShortText
// ---------------------------------------------------------------------------
describe('sanitizeShortText', () => {
  // --- Normal passthrough ---
  it('returns clean short text unchanged', () => {
    expect(sanitizeShortText('Alice')).toBe('Alice');
  });

  // --- HTML entity encoding ---
  it('encodes less-than signs', () => {
    const result = sanitizeShortText('a < b');
    expect(result).toContain('&lt;');
    expect(result).not.toContain('<');
  });

  it('encodes greater-than signs', () => {
    const result = sanitizeShortText('a > b');
    expect(result).toContain('&gt;');
    expect(result).not.toContain('>');
  });

  it('encodes double quotes', () => {
    const result = sanitizeShortText('say "hello"');
    expect(result).toContain('&quot;');
  });

  it('encodes single quotes', () => {
    const result = sanitizeShortText("it's fine");
    expect(result).toContain('&#39;');
  });

  it('encodes multiple special characters in one string', () => {
    const result = sanitizeShortText('<"test">');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
  });

  // --- Length limits ---
  it('enforces default max length of 50', () => {
    const longText = 'a'.repeat(100);
    expect(sanitizeShortText(longText)).toHaveLength(50);
  });

  it('enforces custom max length', () => {
    const text = 'a'.repeat(30);
    expect(sanitizeShortText(text, 10)).toHaveLength(10);
  });

  it('does not truncate text shorter than maxLength', () => {
    expect(sanitizeShortText('Bob', 50)).toBe('Bob');
  });

  // --- XSS stripping ---
  it('strips script tags', () => {
    const result = sanitizeShortText('<script>alert(1)</script>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('script>');
  });

  it('strips img tags with event handlers', () => {
    const result = sanitizeShortText('<img onerror=alert(1)>');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<img');
  });

  // --- Special characters ---
  it('handles ampersand in text', () => {
    const result = sanitizeShortText('Tom & Jerry');
    // ampersand should pass through (DOMPurify may or may not encode it,
    // but the result must be safe)
    expect(result).toBeTruthy();
    expect(result).not.toContain('<');
  });

  it('trims whitespace', () => {
    expect(sanitizeShortText('  padded  ')).toBe('padded');
  });

  // --- Empty / null / non-string inputs ---
  it('returns empty string for null', () => {
    expect(sanitizeShortText(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeShortText(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(sanitizeShortText('')).toBe('');
  });

  it('returns empty string for a number', () => {
    expect(sanitizeShortText(99)).toBe('');
  });

  it('returns empty string for an array', () => {
    expect(sanitizeShortText(['hi'])).toBe('');
  });

  it('returns empty string for boolean', () => {
    expect(sanitizeShortText(true)).toBe('');
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
    // DOMPurify decodes entities; they should come out as safe text
    expect(result).toBeTruthy();
  });

  it('handles malformed / unclosed tags', () => {
    const result = sanitizeUserContent('<div>unclosed<p>also unclosed');
    expect(result).not.toContain('<div');
    expect(result).not.toContain('<p');
    expect(result).toContain('unclosed');
  });

  it('handles tags with encoded characters attempting bypass', () => {
    // Attempt to bypass with HTML-encoded script
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

  it('sanitizeClaimText handles whitespace-only string', () => {
    expect(sanitizeClaimText('   \t\n   ')).toBe('');
  });

  it('sanitizeShortText encodes entities and then truncates', () => {
    // Each < becomes &lt; (4 chars), so 20 angle brackets = 80 entity chars
    const input = '<'.repeat(20);
    const result = sanitizeShortText(input, 50);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('sanitizeUserContent handles string with only HTML tags and no text', () => {
    const result = sanitizeUserContent('<div><span><br></span></div>');
    expect(result.trim()).toBe('');
  });

  it('sanitizeClaimText handles string of only control characters', () => {
    expect(sanitizeClaimText('\x00\x01\x02\x03')).toBe('');
  });

  it('all functions handle zero-length maxLength', () => {
    expect(sanitizeUserContent('hello', 0)).toBe('');
    expect(sanitizeShortText('hello', 0)).toBe('');
  });

  it('sanitizeUserContent handles multiline text', () => {
    const result = sanitizeUserContent('line1\nline2\nline3');
    expect(result).toContain('line1');
    expect(result).toContain('line3');
  });

  it('sanitizeClaimText collapses multiline to single line', () => {
    const result = sanitizeClaimText('line1\nline2\nline3');
    expect(result).toBe('line1 line2 line3');
  });
});

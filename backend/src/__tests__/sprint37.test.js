/**
 * Sprint 37 — T-286: Iterative sanitization tests (nested XSS bypass fix).
 *
 * Verifies that sanitizeHtml() runs tag-stripping in a loop until output
 * stabilizes, preventing nested/obfuscated HTML tags from reassembling
 * into valid XSS payloads after a single pass.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../middleware/sanitize.js';

describe('T-286 — sanitizeHtml iterative stripping', () => {
  // ---- Nested XSS bypass patterns ----

  it('strips nested script tags that reassemble after single pass', () => {
    // <<script>script>alert(1)<</script>/script>
    // After 1 pass: <script>alert(1)</script>  ← XSS!
    // After 2 passes: alert(1)  ← safe
    expect(sanitizeHtml('<<script>script>alert(1)<</script>/script>')).toBe('alert(1)');
  });

  it('strips nested img/onerror tags', () => {
    // <<b>img src=x onerror=alert(1)> → after 1 pass: <img src=x onerror=alert(1)>
    expect(sanitizeHtml('<<b>img src=x onerror=alert(1)>')).toBe('');
  });

  it('strips triple-nested div tags', () => {
    // <<<div>div>div>content</div> → layers peel off until clean
    expect(sanitizeHtml('<<<div>div>div>content</div>')).toBe('content');
  });

  it('strips mixed nested patterns', () => {
    expect(sanitizeHtml('<<script>script><<b>img src=x>')).toBe('');
  });

  it('strips deep nesting (4+ levels)', () => {
    expect(sanitizeHtml('<<<<script>script>script>script>x')).toBe('x');
  });

  it('strips nested self-closing tags', () => {
    expect(sanitizeHtml('<<br/>br/>')).toBe('');
  });

  it('strips nested iframe tags', () => {
    expect(sanitizeHtml('<<b>iframe src="https://evil.com"></iframe>')).toBe('');
  });

  it('strips nested svg/onload', () => {
    expect(sanitizeHtml('<<div>svg/onload=alert(1)>')).toBe('');
  });

  it('strips alternating nested tags', () => {
    // <<a>script>alert(1)<</a>/script>
    expect(sanitizeHtml('<<a>script>alert(1)<</a>/script>')).toBe('alert(1)');
  });

  // ---- Regression: existing single-level stripping still works ----

  it('still strips single-level script tags', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('still strips single-level img tags', () => {
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('still strips HTML comments', () => {
    expect(sanitizeHtml('Hello <!-- secret --> World')).toBe('Hello  World');
  });

  it('still strips bold/italic tags', () => {
    expect(sanitizeHtml('Hello <b>world</b>')).toBe('Hello world');
  });

  // ---- Preservation: legitimate content unchanged ----

  it('preserves legitimate angle brackets (5 < 10)', () => {
    expect(sanitizeHtml('5 < 10')).toBe('5 < 10');
  });

  it('preserves legitimate angle brackets (A > B)', () => {
    expect(sanitizeHtml('A > B')).toBe('A > B');
  });

  it('preserves clean text unchanged', () => {
    expect(sanitizeHtml('Hello world')).toBe('Hello world');
  });

  it('preserves Unicode and emoji', () => {
    expect(sanitizeHtml('東京 🗼 café')).toBe('東京 🗼 café');
  });

  it('preserves empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('returns non-string input unchanged', () => {
    expect(sanitizeHtml(42)).toBe(42);
    expect(sanitizeHtml(null)).toBe(null);
  });

  // ---- Edge cases ----

  it('handles extremely nested patterns without infinite loop', () => {
    // 10+ levels of nesting — should hit the MAX_ITERATIONS cap safely
    const deep = '<'.repeat(12) + 'script' + '>'.repeat(1) + 'x';
    const result = sanitizeHtml(deep);
    // Should not contain any valid HTML tags
    expect(result).not.toMatch(/<\/?[a-zA-Z][^>]*\/?>/);
  });

  it('handles nested comments', () => {
    expect(sanitizeHtml('<!-- <<script>script> -->')).toBe('');
  });

  it('strips nested tags inside attribute-like contexts', () => {
    // <<div>a href="evil">click<</div>/a>
    expect(sanitizeHtml('<<div>a href="evil">click<</div>/a>')).toBe('click');
  });
});

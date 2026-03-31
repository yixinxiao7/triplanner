/**
 * Server-side HTML sanitization middleware (T-272).
 *
 * Strips HTML/XML tags from user-provided text fields as a defense-in-depth
 * measure against stored XSS. Preserves Unicode, emoji, and legitimate
 * special characters. Does NOT HTML-encode output — stored values remain
 * plain text.
 *
 * T-296 (Sprint 39): Added post-loop cleanup to strip residual angle bracket
 * fragments left behind by triple-nested (3+ level) XSS patterns. After the
 * iterative tag-stripping loop stabilizes, orphan `<` characters that look
 * like incomplete tag starts (e.g., `<script` without closing `>`) and empty
 * angle bracket pairs (`<>`) are removed. Legitimate uses like `5 < 10` are
 * preserved (the `<` is followed by a space, not a letter/slash).
 *
 * Usage (T-278: sanitize BEFORE validate so all-HTML required fields are rejected):
 *   import { sanitizeFields } from '../middleware/sanitize.js';
 *
 *   router.post('/',
 *     sanitizeFields({ name: 'string', destinations: 'array', notes: 'string' }),
 *     validate(schema),
 *     handler
 *   );
 */

/**
 * Strip HTML/XML tags from a string while preserving text content.
 *
 * Uses an iterative loop that runs the tag-stripping regex until the output
 * stabilizes — preventing nested/obfuscated XSS bypasses where inner tags
 * reassemble into valid HTML after a single pass (e.g., `<<script>script>`
 * becoming `<script>`). Capped at 10 iterations as a safety limit.
 *
 * Uses a regex that matches tags starting with `<` followed by a letter or `/`,
 * which avoids stripping legitimate angle-bracket usage like `5 < 10`.
 * Also strips HTML comments (`<!-- ... -->`).
 *
 * T-296 (Sprint 39): After the iterative loop, a post-loop cleanup pass strips
 * residual angle bracket fragments that the tag regex cannot match because they
 * are incomplete (no closing `>`). This handles triple-nested (3+ level) patterns
 * like `<<<b>b>` which leave orphan `<` characters after the loop stabilizes.
 *
 * @param {string} input - The raw user input string
 * @returns {string} The sanitized string with HTML tags removed
 */
export function sanitizeHtml(input) {
  if (typeof input !== 'string') return input;

  const MAX_ITERATIONS = 10;
  let result = input;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const previous = result;

    result = result
      // Strip HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Strip HTML/XML tags (opening, closing, self-closing)
      // Matches <tag ...>, </tag>, <tag/>, <tag ... />, but NOT `< 10` or `5 > 3`
      .replace(/<\/?[a-zA-Z][^>]*\/?>/g, '');

    // Output stabilized — no more tags to strip
    if (result === previous) break;
  }

  // T-296: Post-loop cleanup — strip residual angle bracket fragments.
  // After the iterative loop, the only `<` characters remaining are either:
  //   (a) Legitimate: `5 < 10` (space after `<`, not a letter/slash)
  //   (b) Fragments:  `<script` or `<b` (incomplete tag start, no closing `>`)
  //   (c) Trailing:   lone `<` at end of string (from fully-consumed nested tags)
  // We strip (b) by removing `<` when followed by a letter or `/`,
  // (c) by removing trailing `<`, and empty `<>` pairs from fully-consumed tags.
  result = result
    .replace(/<(?=[a-zA-Z/])/g, '')
    .replace(/<>/g, '')
    .replace(/<$/g, '');

  return result;
}

/**
 * Middleware factory that sanitizes specified fields on req.body.
 *
 * @param {Object} fieldConfig - Map of field names to their type.
 *   - 'string': sanitize the field as a plain string
 *   - 'array': sanitize each string element in the array
 *
 * @returns {Function} Express middleware
 *
 * @example
 *   sanitizeFields({ name: 'string', destinations: 'array' })
 */
export function sanitizeFields(fieldConfig) {
  return (req, _res, next) => {
    if (!req.body) return next();

    for (const [field, type] of Object.entries(fieldConfig)) {
      const value = req.body[field];

      // Skip undefined/null — let validation handle missing fields
      if (value === undefined || value === null) continue;

      if (type === 'string' && typeof value === 'string') {
        req.body[field] = sanitizeHtml(value);
      } else if (type === 'array' && Array.isArray(value)) {
        req.body[field] = value.map((item) =>
          typeof item === 'string' ? sanitizeHtml(item) : item,
        );
      }
    }

    next();
  };
}

/**
 * Server-side HTML sanitization middleware (T-272).
 *
 * Strips HTML/XML tags from user-provided text fields as a defense-in-depth
 * measure against stored XSS. Preserves Unicode, emoji, and legitimate
 * special characters. Does NOT HTML-encode output — stored values remain
 * plain text.
 *
 * Usage:
 *   import { sanitizeFields } from '../middleware/sanitize.js';
 *
 *   router.post('/',
 *     validate(schema),
 *     sanitizeFields({ name: 'string', destinations: 'array', notes: 'string' }),
 *     handler
 *   );
 */

/**
 * Strip HTML/XML tags from a string while preserving text content.
 *
 * Uses a regex that matches tags starting with `<` followed by a letter or `/`,
 * which avoids stripping legitimate angle-bracket usage like `5 < 10`.
 * Also strips HTML comments (`<!-- ... -->`).
 *
 * @param {string} input - The raw user input string
 * @returns {string} The sanitized string with HTML tags removed
 */
export function sanitizeHtml(input) {
  if (typeof input !== 'string') return input;

  return input
    // Strip HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Strip HTML/XML tags (opening, closing, self-closing)
    // Matches <tag ...>, </tag>, <tag/>, <tag ... />, but NOT `< 10` or `5 > 3`
    .replace(/<\/?[a-zA-Z][^>]*\/?>/g, '');
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

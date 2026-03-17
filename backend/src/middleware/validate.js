/**
 * Validation middleware factory.
 * Returns a middleware that validates req.body fields and responds with
 * field-level error messages matching the API contract shape.
 *
 * Schema field options:
 *   required      {boolean}  - field must be present and non-empty
 *   type          {string}   - 'string' | 'email' | 'array' | 'isoDate' | 'isoTime' | 'dateString'
 *   minLength     {number}   - minimum string length
 *   maxLength     {number}   - maximum string length
 *   minItems      {number}   - minimum array length
 *   maxItems      {number}   - maximum array length
 *   itemMinLength {number}   - minimum length for each string item in an array
 *   itemMaxLength {number}   - maximum length for each string item in an array
 *   enum          {Array}    - allowed string values
 *   nullable      {boolean}  - allows null value (skips other checks when null)
 *   trim          {boolean}  - trim string before checks (default true for strings)
 *   custom        {Function} - (value, body) => string | null  (return error message or null)
 *   messages      {Object}   - override default error messages per rule
 *                              Supports: required, type, minLength, maxLength, minItems,
 *                                        maxItems, itemMinLength, itemMaxLength, enum
 */
export function validate(schema) {
  return (req, res, next) => {
    const fieldErrors = {};

    for (const [field, rules] of Object.entries(schema)) {
      let value = req.body[field];

      // Trim strings by default
      if (typeof value === 'string' && rules.trim !== false) {
        value = value.trim();
        req.body[field] = value;
      }

      // Handle nullable fields — if explicitly null and nullable allowed, skip checks
      if (value === null && rules.nullable) {
        continue;
      }

      // Required check
      if (rules.required) {
        // For array type: a non-empty string is not "missing" — it will be split in the type check.
        // Only flag as missing if: undefined, null, empty string, or an explicitly empty array.
        const missing =
          value === undefined ||
          value === null ||
          value === '' ||
          (rules.type === 'array' && Array.isArray(value) && value.length === 0);
        if (missing) {
          fieldErrors[field] = rules.messages?.required || `${field} is required`;
          continue;
        }
      }

      // Skip remaining checks if value is absent (optional field not provided)
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // ---- Type checks ----

      if (rules.type === 'string' || rules.type === 'email') {
        if (typeof value !== 'string') {
          fieldErrors[field] = rules.messages?.type || `${field} must be a string`;
          continue;
        }
      }

      if (rules.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors[field] = rules.messages?.type || `A valid email address is required`;
          continue;
        }
      }

      if (rules.type === 'array') {
        if (!Array.isArray(value)) {
          // Accept comma-separated string — split, trim, filter empty
          if (typeof value === 'string') {
            req.body[field] = value.split(',').map((s) => s.trim()).filter(Boolean);
            value = req.body[field];
          } else {
            fieldErrors[field] = rules.messages?.type || `${field} must be an array`;
            continue;
          }
        } else {
          // Filter out empty/whitespace-only strings from arrays
          req.body[field] = value.map((v) => (typeof v === 'string' ? v.trim() : v)).filter((v) => v !== '' && v !== null && v !== undefined);
          value = req.body[field];
        }
      }

      if (rules.type === 'isoDate') {
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          fieldErrors[field] = rules.messages?.type || `${field} must be a valid ISO 8601 datetime`;
          continue;
        }
      }

      // isoDateWithOffset — like isoDate but requires an explicit UTC offset or Z suffix.
      // Naive strings without a timezone (e.g. "2026-08-07T06:50:00") are rejected with a
      // descriptive error. This is enforced on flight departure_at / arrival_at to prevent
      // the UTC double-conversion bug (FB-131 / T-240).
      if (rules.type === 'isoDateWithOffset') {
        const hasOffset = typeof value === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(value);
        const isValidDate = typeof value === 'string' && !isNaN(Date.parse(value));
        if (!isValidDate) {
          fieldErrors[field] = rules.messages?.type ||
            `${field} must be a valid ISO 8601 datetime string with timezone offset (e.g., 2026-08-07T06:50:00-04:00)`;
          continue;
        }
        if (!hasOffset) {
          fieldErrors[field] = rules.messages?.offset ||
            `${field} must be an ISO 8601 datetime string with timezone offset (e.g., 2026-08-07T06:50:00-04:00)`;
          continue;
        }
      }

      if (rules.type === 'dateString') {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
          fieldErrors[field] = rules.messages?.type || `${field} must be a valid date in YYYY-MM-DD format`;
          continue;
        }
      }

      if (rules.type === 'isoTime') {
        if (typeof value !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
          fieldErrors[field] = rules.messages?.type || `${field} must be a valid time in HH:MM or HH:MM:SS format`;
          continue;
        }
      }

      // ---- Enum check ----
      if (rules.enum) {
        if (!rules.enum.includes(value)) {
          fieldErrors[field] = rules.messages?.enum || `${field} must be one of: ${rules.enum.join(', ')}`;
          continue;
        }
      }

      // ---- String length checks ----
      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          fieldErrors[field] = rules.messages?.minLength || `${field} must be at least ${rules.minLength} characters`;
          continue;
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          fieldErrors[field] = rules.messages?.maxLength || `${field} must be at most ${rules.maxLength} characters`;
          continue;
        }
      }

      // ---- Array length checks ----
      if (Array.isArray(value)) {
        if (rules.minItems !== undefined && value.length < rules.minItems) {
          fieldErrors[field] = rules.messages?.minItems || `${field} must have at least ${rules.minItems} item(s)`;
          continue;
        }
        if (rules.maxItems !== undefined && value.length > rules.maxItems) {
          fieldErrors[field] = rules.messages?.maxItems || `${field} must have at most ${rules.maxItems} items`;
          continue;
        }

        // ---- Per-item string length checks (T-186) ----
        // Validates every string element in the array against itemMinLength / itemMaxLength.
        // Reports the first offending item found. Non-string items are skipped.
        if (rules.itemMinLength !== undefined) {
          const offender = value.find((item) => typeof item === 'string' && item.length < rules.itemMinLength);
          if (offender !== undefined) {
            fieldErrors[field] = rules.messages?.itemMinLength ||
              `Each ${field} item must be at least ${rules.itemMinLength} character(s)`;
            continue;
          }
        }
        if (rules.itemMaxLength !== undefined) {
          const offender = value.find((item) => typeof item === 'string' && item.length > rules.itemMaxLength);
          if (offender !== undefined) {
            fieldErrors[field] = rules.messages?.itemMaxLength ||
              `Each ${field} item must be at most ${rules.itemMaxLength} characters`;
            continue;
          }
        }
      }

      // ---- Custom validation ----
      if (rules.custom) {
        const customError = rules.custom(value, req.body);
        if (customError) {
          fieldErrors[field] = customError;
          // Do NOT continue — allow other fields to be checked
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields: fieldErrors,
        },
      });
    }

    next();
  };
}

export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      }

      if (value !== undefined && rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} must be a valid email`);
      }

      if (value !== undefined && rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      if (value !== undefined && rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: { message: errors.join(', '), code: 'VALIDATION_ERROR' },
      });
    }

    next();
  };
}

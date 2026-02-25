/**
 * UUID v4 validation middleware for route path parameters.
 *
 * Usage as router.param() handler (recommended):
 *   router.param('id', uuidParamHandler)
 *   router.param('tripId', uuidParamHandler)
 *
 * This follows router.param callback signature: (req, res, next, value)
 * The middleware runs before any route handler that matches the param name.
 *
 * When the param value is NOT a valid UUID v4, responds immediately with:
 *   HTTP 400 { error: { message: "Invalid ID format", code: "VALIDATION_ERROR" } }
 *
 * Valid UUIDs pass through without modification.
 */

// UUID v4 pattern: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx (case-insensitive)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * router.param() handler that validates the param value is a UUID v4.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @param {string} value - the path param value
 */
export function uuidParamHandler(req, res, next, value) {
  if (!UUID_REGEX.test(value)) {
    return res.status(400).json({
      error: {
        message: 'Invalid ID format',
        code: 'VALIDATION_ERROR',
      },
    });
  }
  next();
}

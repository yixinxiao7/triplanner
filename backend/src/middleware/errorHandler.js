export function errorHandler(err, req, res, next) {
  // Log the stack trace server-side but never expose it in the response
  console.error('[ErrorHandler]', err.stack || err.message);

  // Handle JSON parse errors from express.json() body parser (B-012 / T-027)
  // express.json() throws a SyntaxError with type='entity.parse.failed' on malformed bodies
  if (
    err.type === 'entity.parse.failed' ||
    (err instanceof SyntaxError && err.status === 400 && 'body' in err)
  ) {
    return res.status(400).json({
      error: {
        message: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
      },
    });
  }

  const status = err.status || 500;

  // Never leak internal error details to the client
  const message =
    status === 500
      ? 'An unexpected error occurred'
      : err.message || 'An error occurred';

  const response = {
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
    },
  };

  // Include field-level errors when present (e.g., from validation)
  if (err.fields) {
    response.error.fields = err.fields;
  }

  res.status(status).json(response);
}

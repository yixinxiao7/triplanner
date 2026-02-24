export function errorHandler(err, req, res, next) {
  // Log the stack trace server-side but never expose it in the response
  console.error('[ErrorHandler]', err.stack || err.message);

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

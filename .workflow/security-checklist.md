# Security Checklist

QA Engineer must verify all applicable items before any task moves to Done. Backend Engineer should self-check during development.

---

## Authentication & Authorization

- [ ] All API endpoints require appropriate authentication (token, session, API key)
- [ ] Role-based access control is enforced where applicable
- [ ] Auth tokens have appropriate expiration and refresh mechanisms
- [ ] Password hashing uses bcrypt, scrypt, or argon2 (never plain text or MD5/SHA)
- [ ] Failed login attempts are rate-limited

## Input Validation & Injection Prevention

- [ ] All user inputs are validated on both client and server side
- [ ] SQL queries use parameterized statements or query builder (no string concatenation)
- [ ] NoSQL queries are protected against injection (e.g., MongoDB operator injection)
- [ ] File uploads are validated for type, size, and content
- [ ] HTML output is sanitized to prevent XSS

## API Security

- [ ] CORS is configured to allow only expected origins
- [ ] Rate limiting is applied to public-facing endpoints
- [ ] API responses do not leak internal error details or stack traces
- [ ] Sensitive data is never passed in URL query parameters
- [ ] HTTP headers include security defaults (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security)

## Data Protection

- [ ] Sensitive data at rest is encrypted
- [ ] Database credentials and API keys are stored in environment variables, not in code
- [ ] Logs do not contain PII, passwords, or tokens
- [ ] Backups are configured and tested for the database

## Infrastructure

- [ ] HTTPS is enforced on all environments (staging + production)
- [ ] Dependencies are checked for known vulnerabilities (npm audit, pip audit, etc.)
- [ ] Default/sample credentials have been removed
- [ ] Error pages do not reveal server technology or version info

## PDF Itinerary Import (T-332)

These items cover the Gemini-backed PDF import feature: the parse endpoint
(`POST /api/v1/ai/import/parse`) and the atomic commit endpoint
(`POST /api/v1/trips/import`).

- [x] Both import endpoints require authentication. `routes/ai.js` and
      `routes/import.js` each call `router.use(authenticate)`; unauthenticated
      requests get 401. Verified: `aiImport.test.js` and `tripsImport.test.js`
      both assert 401 without a token.
- [x] Uploaded file type is enforced server-side. `routes/ai.js` multer
      `fileFilter` accepts only `application/pdf`; anything else returns 400
      `INVALID_FILE_TYPE`. A client-side guard in `ImportPdfModal.jsx` mirrors
      this but is not relied upon. Verified: `aiImport.test.js` (non-PDF → 400)
      and E2E Test 8 (client guard blocks before any request).
- [x] Upload size is enforced server-side. multer `limits.fileSize = 10MB`;
      oversize uploads return 400 `FILE_TOO_LARGE`. Verified: `aiImport.test.js`
      (>10MB → 400).
- [x] No PDF is ever persisted to disk. `routes/ai.js` uses
      `multer.memoryStorage()`; the buffer is base64-encoded, sent to Gemini,
      and discarded when the request ends. No `diskStorage`, no temp file, no
      filesystem write anywhere in the import path.
- [x] Gemini / external-service errors never leak to the client.
      `geminiService.js` catches every failure (API error, 429 exhaustion,
      malformed output) and throws a generic
      `{ status: 502, code: 'EXTERNAL_SERVICE_ERROR', message: 'Could not read
      the itinerary. Please try again.' }`. Raw errors are only `console.error`-ed
      server-side. Verified: `geminiService.test.js` (429-exhaustion / non-429 /
      malformed all → generic 502) and `aiImport.test.js` (502 body carries only
      the generic message, no stack trace).
- [x] Parsed strings are sanitized on commit (defense-in-depth XSS). The model
      output is untrusted input, so `routes/import.js` runs `sanitizeHtml` over
      every user-visible string field of the trip and each child (flights, stays,
      activities, land_travels) BEFORE validation — same `sanitize.js` strategy
      as the per-resource POST routes (T-272 / T-278). Enum fields (stay
      `category`, land-travel `mode`) are upper-cased then validated against a
      fixed allow-list.
- [x] The whole payload is re-validated server-side on commit. `routes/import.js`
      reuses each resource's existing validation schema per array element and
      returns `VALIDATION_ERROR` with indexed field paths; the parse step is never
      trusted to have produced valid data.
- [x] Atomic commit prevents partial-write artifacts. `importModel.importTrip`
      inserts the trip and all children in one `db.transaction`; any failure rolls
      back so no orphan trip is left behind. Verified: `importModel.unit.test.js`
      (failing child insert → whole transaction rejects, no re-query) and
      `tripsImport.test.js` (invalid child → 400, `importTrip` never called).
- [x] Ownership is enforced on commit. The trip is inserted with
      `user_id = req.user.id`; children inherit the new `trip_id`. A user cannot
      import a trip on behalf of another account. Verified: `tripsImport.test.js`
      asserts the committed `userId` is the authenticated user.

---

*This checklist is maintained by the QA Engineer and Manager Agent. Update it when new security concerns emerge.*

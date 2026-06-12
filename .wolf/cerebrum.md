# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-06-02

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** triplanner
- **Description:** A multi-agent AI development workspace for building web and mobile applications. Specialized Claude Code agents collaborate through structured workflows to plan, build, test, and deploy — autonomously.
- **Backend is ESM** (`"type":"module"`). Port any CommonJS reference to `import`/`export`, never `require`.
- **Vitest runs with NODE_ENV=test, but `knexfile.js` has no `test` env.** `config/database.js` calls `knex(knexConfig[NODE_ENV])` at module load → crashes on import. Existing route tests avoid this by mocking the model modules (e.g. `vi.mock('../models/tripModel.js', ...)`), which short-circuits the `database.js` import. If a route under test transitively imports many models (e.g. the import route pulls in all resource route schemas), mock `../config/database.js` directly: `vi.mock('../config/database.js', () => ({ default: { transaction: vi.fn(), raw: vi.fn((s)=>s) } }))`. `raw` must exist because `tripModel.js` calls `db.raw(...)` at load for TRIP_COLUMNS.
- **Test HTTP pattern:** tests spin up a raw `http.createServer(app)` on port 0 and use the node `http` client (see trips.test.js `request()` helper). For multipart uploads, build the body manually with a boundary (see aiImport.test.js `uploadFile()`).
- **Reusable validation:** `middleware/validate.js` exports `validateFields(schema, body)` (returns a fieldErrors map, mutates body) in addition to the `validate(schema)` middleware. The PDF-import route reuses it per array element to produce indexed error paths like `flights[0].departure_at`. Per-resource schemas are exported from their route files (`flightValidationSchema`, `stayValidationSchema`, `activityValidationSchema`, `createLandTravelSchema`, and `tripCreateSchema` from trips.js).
- **`isoDateWithOffset` validator rejects naive datetimes** (no `Z`/`±HH:MM`) — flights use it for departure_at/arrival_at. Stays use plain `isoDate`. This is the highest-error-rate field for AI-parsed itineraries.
- **`npm run migrate:make` emits a CommonJS stub** (`exports.up = ...`), but the backend is ESM and all existing migrations use `export async function up/down`. Always rewrite the generated stub to ESM. Also rename the timestamped file (`YYYYMMDDHHMMSS_name.js`) to the project's `YYYYMMDD_NNN_name.js` convention.
- **Prod auth requires same-site domains (bug-046):** The refresh-cookie architecture only works when frontend and backend share a registrable domain (triplanner.yixinx.com + api.triplanner.yixinx.com). WebKit/iOS blocks third-party cookies, so a cross-site backend (onrender.com) silently breaks Google sign-in and session persistence on Safari/iPhone while desktop Chrome works. Any new environment must give the backend a subdomain of the frontend's site; VITE_API_URL must never point at a cross-site URL.
- **Google Calendar export (T-343):** Incremental OAuth — calendar scope requested only on export, NOT at sign-in. Initiation must be an authenticated XHR returning the consent URL (browser redirects can't carry the Bearer token); a 10-min signed JWT (`purpose: 'gcal_connect'`, carries trip_id) is the OAuth `state` so the unauthenticated callback can identify the user. Tokens live on `users` (refresh token only overwritten when Google returns one — refreshes omit it). `trips.google_calendar_id` enables wipe-and-recreate re-export. `googleCalendarService.js` deliberately does NOT import calendarModel/db so its unit tests need no mocks. Adding an import to userModel breaks every test that mocks it with an explicit factory — 6 files needed `saveGoogleCalendarTokens` etc. added.
- **Google Sign-In (backend):** `config/passport.js` registers the GoogleStrategy as an import side effect, only when `GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET` are set (`isGoogleOAuthConfigured()`). The verify fn `verifyGoogleProfile` is exported separately so it can be unit-tested by mocking userModel — no live Google needed. The two routes live INSIDE `routes/auth.js` to reuse its private helpers (`signAccessToken`, `setRefreshCookie`, `generateRawToken`/`hashToken`/`createRefreshToken`). The callback sets the refresh cookie and redirects to FRONTEND_URL (no access token in URL); the frontend's existing silent-refresh picks up the session.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

- [2026-06-05] PDF-import Gemini prompt (geminiService.js): keep extraction guidance as
  general RULES with multi-region examples (Tokyo/New York/Delhi), not examples copied from
  one vendor's PDF. A guard test asserts multiple IANA zones appear, to prevent locale
  overfitting (the prompt briefly drifted India-specific while fixing prose-flight extraction
  for india_trip.pdf). Stay de-duplication is enforced deterministically in code
  (consolidateStays) rather than trusting the prompt, since model output is non-deterministic.

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

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

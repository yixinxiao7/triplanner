# Agent Handoff Log

Context handoffs between agents during a sprint. Every time an agent completes work that another agent depends on, log it here.

---

## How to Use This File

When you finish work that another agent needs to pick up:
1. Add a new entry at the top of the log (newest first)
2. Set Status to "Pending"
3. The receiving agent updates Status to "Acknowledged" when they start, and "Done" when complete

---

## Log

---

### Sprint 1 — Backend Engineer → Deploy Engineer (Migrations Ready to Run — T-009)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Deploy Engineer |
| Status | Pending |
| Related Task | T-009, T-020 |
| Handoff Summary | All 6 Knex migration files are ready in `backend/src/migrations/`. Run `npm run migrate` (i.e., `knex migrate:latest --knexfile src/config/knexfile.js`) from the `backend/` directory after spinning up the PostgreSQL container. Rollback with `npm run migrate:rollback`. |
| Notes | **Migration order (enforced by filename timestamps):** `20260224_001_create_users` → `20260224_002_create_refresh_tokens` → `20260224_003_create_trips` → `20260224_004_create_flights` → `20260224_005_create_stays` → `20260224_006_create_activities`. All migrations include `up()` and `down()`. The trips migration uses a raw `ALTER TABLE … ADD CONSTRAINT` for the CHECK constraint (status enum) — this is intentional. Migrations have not been run on staging yet — this must happen during T-020 deployment. **New env vars needed:** none beyond what is in `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`, `PORT`, `NODE_ENV`). |

---

### Sprint 1 — Backend Engineer → QA Engineer (Backend Implementation Complete — T-008 through T-012)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-008, T-009, T-010, T-011, T-012, T-018, T-019 |
| Handoff Summary | All backend tasks T-008 through T-012 are complete and in review. The Express API implements all endpoints defined in `api-contracts.md`. All 60 unit tests pass (`npm test`). The backend is ready for security checklist review (T-018) and integration testing (T-019). |
| Notes | **Security items to verify in T-018:** (1) **Password hashing:** `bcrypt.hash(password, 12)` — 12 rounds, raw password never logged or stored. File: `backend/src/routes/auth.js`. (2) **Timing-safe login:** `bcrypt.compare` always runs even if user not found (uses `DUMMY_HASH`) to prevent email enumeration. (3) **Refresh token storage:** raw token is never stored — only SHA-256 hash is persisted in `refresh_tokens.token_hash`. Raw token is sent as httpOnly cookie only. (4) **Refresh token rotation:** old token is revoked (`revoked_at = now()`) before new token is issued — no token reuse window. (5) **SQL injection:** all queries use Knex parameterized methods (`.where({})`, `.insert()`, `.update()`) — zero string concatenation in DB queries. (6) **Error responses:** `errorHandler.js` catches all errors and returns `{ error: { message, code } }` — never exposes stack traces. (7) **Auth middleware:** `authenticate` in `middleware/auth.js` rejects any request without a valid Bearer JWT. (8) **Trip ownership:** all trip-scoped endpoints check `trip.user_id === req.user.id` — returns 403 (not 404) for cross-user access. (9) **httpOnly cookie:** refresh token cookie has `httpOnly: true`, `sameSite: 'strict'`, `path: '/api/v1/auth'`, `secure: true` in production. (10) **CORS:** `credentials: true` set, origin restricted to `CORS_ORIGIN` env var. **Integration test flow for T-019:** POST /auth/register (201) → POST /auth/login (200, access_token) → POST /trips (201, get trip id) → GET /trips/:id (200) → GET /trips/:id/flights (200, []) → GET /trips/:id/stays (200, []) → GET /trips/:id/activities (200, []) → DELETE /trips/:id (204) → GET /trips/:id (404) → POST /auth/logout (204). |

---

### Sprint 1 — Backend Engineer → Frontend Engineer (Backend API Live — T-008 through T-012)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-008, T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-017 |
| Handoff Summary | The backend API is implemented exactly per the contracts in `api-contracts.md`. All endpoints are live (pending DB connectivity on staging). Frontend can now integrate against the real API. |
| Notes | **Reminder of key integration points:** (1) `POST /api/v1/auth/register` and `POST /api/v1/auth/login` both return `{ data: { user, access_token } }` — store `access_token` in memory (React context), never localStorage. The `refresh_token` httpOnly cookie is set automatically. (2) `POST /api/v1/auth/refresh` — call this when any request returns 401, retry original request with new access_token. No body needed — cookie is sent automatically by browser. (3) `POST /api/v1/trips` accepts `destinations` as an array OR comma-separated string; returns `{ data: { id, ... } }` — navigate to `/trips/:id` on success. (4) Sub-resources: `GET /api/v1/trips/:tripId/[flights|stays|activities]` all return `{ data: [] }` when empty. (5) `DELETE /trips/:id` returns 204 (no body). (6) `POST /auth/logout` returns 204; clear the in-memory access_token and redirect to /login. (7) Backend runs on `http://localhost:3000` in development — axios base URL should be `http://localhost:3000/api/v1`. |

---

### Sprint 1 — Frontend Engineer → QA Engineer (Frontend Implementation Complete — T-013 through T-017)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Frontend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-013, T-014, T-015, T-016, T-017, T-018, T-019 |
| Handoff Summary | All Sprint 1 frontend tasks are complete and moved to "In Review". The full React application has been implemented including: auth context with JWT in-memory storage + refresh token flow, axios instance with 401 interceptor, Login and Register pages, Navbar, Home page, and Trip Details page. Render tests written for all major components. |
| Notes | **What to test:** (1) Auth flow: register with name/email/password → auto-login + redirect to `/`. Login with email/password → redirect to `/`. Logout → redirect to `/login`. Protected routes redirect unauthenticated users. (2) Home page: trip list loads from `GET /api/v1/trips`, skeleton shown during load, empty state shown when no trips, error state shown on API failure with retry. Create trip modal: opens on button click, validates required fields, calls `POST /api/v1/trips`, navigates to `/trips/:id` on success. Delete trip: inline confirmation replaces card content, calls `DELETE /api/v1/trips/:id`, card fades out. (3) Trip details page: all three sub-resources fetched in parallel (`GET /trips/:id/flights`, stays, activities). Each section shows empty state (dashed border) if no data. Calendar placeholder renders. Flight cards show two-column layout on desktop. Activities grouped by date. All "add" buttons are disabled with tooltip. (4) Known limitations: Backend API not yet implemented (T-008–T-012 are backlog). Tests use mock data. Axios interceptor will call `POST /api/v1/auth/refresh` on 401 — this will fail until backend is live. Recommend testing with a running backend or mocking the API. **Render tests:** Located in `frontend/src/**/__tests__/` and `frontend/src/**/*.test.jsx`. Run with `npm test` from the `frontend/` directory. |

---

### Sprint 1 — Frontend Engineer — API Contract Acknowledgment (T-004, T-005, T-006)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Frontend Engineer |
| To Agent | Backend Engineer |
| Status | Acknowledged |
| Related Task | T-004, T-005, T-006, T-013, T-014, T-015, T-016, T-017 |
| Handoff Summary | API contracts for T-004 (Auth), T-005 (Trips CRUD), and T-006 (Flights, Stays, Activities) have been reviewed and acknowledged. Implementation is proceeding against the agreed contract shapes. |
| Notes | Confirmed integration decisions: (1) Auth — `access_token` stored in React context (in-memory). Refresh token handled via httpOnly cookie (browser sends automatically). Axios interceptor calls `POST /api/v1/auth/refresh` on 401, retries original request. (2) Trips — destinations sent as array `["Tokyo", "Osaka"]` to POST /trips. After create, navigate to `/trips/:id` using returned `id`. (3) Sub-resources — all fetched in parallel on trip details mount. Empty array returned if no items. (4) Timestamps — `departure_at`/`arrival_at`/`check_in_at`/`check_out_at` displayed using companion `*_tz` IANA string with `Intl.DateTimeFormat` for local time display. (5) DELETE returns 204 (no body) — handled accordingly. (6) Error codes mapped: `EMAIL_TAKEN` (409) → email field error. `INVALID_CREDENTIALS` (401 on login) → banner inside card. `UNAUTHORIZED` (401 on protected route) → redirect to /login. `NOT_FOUND` (404 on trip) → full-page error state. |

---

### Sprint 1 — Backend Engineer → QA Engineer (API Contracts Ready for Testing Reference — T-004, T-005, T-006, T-007)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-004, T-005, T-006, T-007, T-018, T-019 |
| Handoff Summary | All Sprint 1 API contracts have been documented in `.workflow/api-contracts.md`. Schema design is documented in `.workflow/technical-context.md`. These are available now for QA planning and test case authoring ahead of T-018 (security checklist) and T-019 (integration testing). |
| Notes | **Key security items to verify during T-018:** (1) POST /auth/register — password must be bcrypt hashed (min 12 rounds), never stored or logged in plain text. (2) POST /auth/login — timing-safe comparison even when user not found (dummy bcrypt compare to prevent email enumeration). (3) POST /auth/refresh — refresh token stored as SHA-256 hash in DB, not raw value; check revoked_at is NULL and expires_at is in the future. (4) All protected endpoints must reject requests without a valid Bearer token (401). (5) All trip sub-resource endpoints must verify trip ownership (user_id match) and return 403 — not 404 — when the trip exists but belongs to another user. (6) All inputs validated server-side (not just client-side). (7) No SQL string concatenation — Knex parameterized queries only. (8) No stack traces in API error responses — only structured `{ error: { message, code } }` shape. **For T-019 integration test flow:** register → login → create trip (POST /trips → navigate to GET /trips/:id) → fetch sub-resources (GET flights/stays/activities all return empty arrays) → delete trip (DELETE /trips/:id → 204) → verify trip gone (GET /trips/:id → 404) → logout. |

---

### Sprint 1 — Backend Engineer → Frontend Engineer (API Contracts Ready for Integration — T-004, T-005, T-006)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-004, T-005, T-006, T-013, T-014, T-015, T-016, T-017 |
| Handoff Summary | All Sprint 1 API contracts are published in `.workflow/api-contracts.md` and are marked "Agreed". You may begin integrating against these contracts. Implementation will follow in T-008 through T-012. |
| Notes | **Critical integration notes:** (1) **Auth token flow:** POST /auth/login and POST /auth/register return `access_token` in the response body — store in React context (in-memory). The refresh token is set as an httpOnly cookie (`Path=/api/v1/auth`) — you do NOT need to handle it manually, the browser sends it automatically. The axios interceptor should call POST /auth/refresh on 401 responses, then retry the original request with the new access_token. (2) **Trip creation → navigation:** POST /trips returns `{ data: { id, ... } }` on 201 — use the returned `id` to navigate to `/trips/:id` immediately (do not navigate back to the home list). (3) **Destinations:** Send as an array of strings in POST /trips and PATCH /trips (e.g., `["Tokyo", "Osaka"]`). The backend also accepts a single comma-separated string and will normalize it — but prefer sending an array. The API returns destinations as an array of strings. (4) **Sub-resource endpoints:** All scoped under `/api/v1/trips/:tripId/[flights|stays|activities]`. Fetch all three in parallel on the trip details page mount. Each returns `{ data: [...] }` — an empty array if no items exist. (5) **Timestamps:** `departure_at`, `arrival_at`, `check_in_at`, `check_out_at` are ISO 8601 UTC strings. Use the companion `*_tz` IANA string to display in local timezone — do NOT rely on the browser's own timezone. Activities use `activity_date` (YYYY-MM-DD string) and `start_time`/`end_time` (HH:MM:SS strings) with no timezone. (6) **Delete trip:** DELETE /trips/:id returns 204 (no body). On success, remove the card from the DOM and show the fade-out animation. (7) **Logout:** POST /auth/logout returns 204. On success, clear the in-memory access_token from React context and redirect to /login. The refresh cookie is cleared automatically by the server's Set-Cookie header. (8) **Error codes to handle:** `EMAIL_TAKEN` (409) → inline email field error on register. `INVALID_CREDENTIALS` (401 on login) → banner inside card. `UNAUTHORIZED` (401 on any protected endpoint) → redirect to /login. `NOT_FOUND` (404 on trip fetch) → "trip not found" full-page error state. |

---

### Sprint 1 — Backend Engineer → Manager Agent (Schema Proposal Ready for Approval — T-007)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Backend Engineer |
| To Agent | Manager Agent |
| Status | Pending |
| Related Task | T-007, T-009 |
| Handoff Summary | The database schema for all 6 tables (users, refresh_tokens, trips, flights, stays, activities) has been documented in `.workflow/technical-context.md` under "Sprint 1 Schema Design (T-007)". The schema matches ADR-005 exactly. Migration SQL and Knex migration file names are proposed for each table. Please review and confirm approval so T-009 (database migrations) can proceed. |
| Notes | Schema follows: (1) ADR-005 entity definitions (field names, types, nullability, defaults). (2) ADR-004 refresh token strategy (token_hash stored, not raw token; revoked_at for invalidation). (3) ADR-003 timezone handling (TIMESTAMPTZ + companion VARCHAR timezone column for flights/stays; DATE + TIME for activities). (4) ADR-002 destinations as TEXT[] on trips. (5) ADR-001 Knex-only query strategy. Migration order is 001→002→003→004→005→006. All migrations include up() and down(). Self-approval note is included in technical-context.md per the automated sprint flow — no additional approval gate required before implementation proceeds. |

---

### Sprint 1 — Design Agent → Frontend Engineer (UI Spec: Trip Details Page — T-003)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-003, T-017 |
| Handoff Summary | UI spec for the Trip Details page (`/trips/:id`) is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 3: Trip Details Page (View Mode)". This is a read-only view for Sprint 1. Key implementation notes: (1) Page fetches trip + flights + stays + activities in parallel on mount. (2) Activities section groups entries by date, sorted chronologically within each day. (3) Calendar section is a placeholder — render the dashed container with "calendar coming in Sprint 2" text only. (4) "Add" action buttons for all three sections are visible but disabled (aria-disabled, opacity 0.4, tooltip "editing coming soon"). (5) Each section has its own empty state (dashed border container). (6) Flight cards use a two-column departure/arrival layout on desktop, stacking to single-column on mobile. (7) No edit functionality this sprint. |
| Notes | Timezone display: show the stored local time + timezone abbreviation as a label (e.g., "6:00 AM ET") — do NOT convert timezones in the browser. Trip name and destinations on the header are read-only text for this sprint. See Section 3.15 for full accessibility requirements. See Section 3.13 for responsive breakpoints. |

---

### Sprint 1 — Design Agent → Frontend Engineer (UI Spec: Home Page + Navbar — T-002)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-002, T-015, T-016 |
| Handoff Summary | UI spec for the Home page (`/`) and Navbar component is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 2: Home Page + Navbar". Key implementation notes: (1) Navbar is a sticky 56px bar shown on all authenticated pages (/  and /trips/:id) but NOT on /login or /register. (2) Trip cards are arranged in a 3-column CSS Grid (desktop) / 2-column (tablet) / 1-column (mobile). (3) Clicking a trip card navigates to /trips/:id. (4) The delete flow uses an inline card replacement confirmation (card content swaps to "delete this trip?" + confirm/cancel buttons) — no separate modal needed. (5) After creating a trip, navigate directly to /trips/:id (the new trip), not back to the list. (6) Empty state shows a centered block with CTA button that also opens the create modal. (7) Loading state: skeleton cards with shimmer animation. |
| Notes | Create Trip modal requires focus trap (tab cycles within modal). Escape key closes modal. Clicking the overlay backdrop closes modal. The modal's success flow navigates to the newly created trip's detail page using the ID returned by the API. See Section 2.9 for responsive breakpoints. |

---

### Sprint 1 — Design Agent → Frontend Engineer (UI Spec: Auth Screens — T-001)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-001, T-014 |
| Handoff Summary | UI spec for the Auth screens (Login at `/login`, Register at `/register`) is complete and approved. Published to `.workflow/ui-spec.md` under "Spec 1: Auth Screens (Login + Register)". Key implementation notes: (1) Both pages use a centered 400px card layout on the dark background — no navbar rendered on auth pages. (2) If an authenticated user visits /login or /register, redirect to /. (3) Login: email + password fields. Register: name + email + password (8-char minimum). (4) Field-level inline error messages (red text below field, red border). (5) API error banner inside the card above the form for 401 (bad credentials) or 500 errors. (6) Loading state: button text replaced with inline spinner, all inputs disabled. (7) On successful register: auto-login + redirect to /. On successful login: redirect to /. |
| Notes | autocomplete attributes are required (see spec 1.2 and 1.3 for field-level autocomplete values). Password field on register shows "8 characters minimum" as persistent helper text below the label. Duplicate email on register returns 409 — show this as a field-level error on the email input. See Section 1.4 for responsive behavior on mobile. |

---

### Sprint 1 — Manager → Backend Engineer (Schema ADR Supplement — Read Before T-007)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Task | T-007, T-009, T-010 |
| Handoff Summary | ADR-005 has been published to `.workflow/architecture-decisions.md` with the approved entity definitions for all six tables (users, trips, flights, stays, activities, refresh_tokens). Read ADR-005 before starting T-007. Your schema proposal should match the approved definitions. Key things that must not change without a new ADR: field nullability decisions, enum value sets (PLANNING/ONGOING/COMPLETED, HOTEL/AIRBNB/VRBO), timezone column naming convention (`*_at` for TIMESTAMPTZ + `*_tz` for IANA string), and the RefreshToken table structure for logout. |
| Notes | **Critical addition not in the original handoff:** The `users` table MUST include a `name VARCHAR(255) NOT NULL` column. The project brief requires the sign-up form to collect the user's name. The POST /auth/register endpoint (T-004) must accept `name` in the request body. The existing `architecture.md` User model does not yet show this field — it predates the sprint plan. Backend Engineer should treat ADR-005 as the authoritative source. Also note: `activity_date` and `start_time`/`end_time` on Activities use DATE and TIME types (not TIMESTAMPTZ) per ADR-005 rationale — activities are local-time entries with no cross-timezone display requirement. |

---

### Sprint 1 — Manager → Backend Engineer (API Contracts + Schema)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Task | T-004, T-005, T-006, T-007 |
| Handoff Summary | Sprint #1 is now planned. Your first deliverables are the API contracts and database schema — these must be completed and approved by the Manager Agent before you begin any backend implementation. Write all API contracts to `.workflow/api-contracts.md`. Document the database schema in `.workflow/api-contracts.md` (schema section) or a new `technical-context.md`. See `dev-cycle-tracker.md` for full task specs. After contracts are approved, proceed with T-008 (backend setup) → T-009 (migrations) → T-010 (auth API) → T-011 (trips API) → T-012 (flights/stays/activities API). |
| Notes | Architecture decisions: Use Knex.js for all DB queries (no ORM). JWT access tokens expire in 15 min; refresh tokens in 7 days. Store refresh tokens in DB for invalidation on logout. Passwords hashed with bcrypt (min 12 rounds). Destinations on a trip can be stored as a PostgreSQL TEXT ARRAY or JSONB for MVP. Timezones for flights and stays: store departure/arrival as UTC timestamps PLUS a separate timezone string (e.g., "America/Los_Angeles") so the frontend can display local times. See `rules.md` rule #22: schema changes require Manager approval before implementation. |

---

### Sprint 1 — Manager → Design Agent (UI Specs)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Design Agent |
| Status | Pending |
| Related Task | T-001, T-002, T-003 |
| Handoff Summary | Sprint #1 is now planned. Your deliverables are the UI specs for three screen groups: (1) Auth screens — login and register pages. (2) Home page — trip list with trip cards, create-trip modal, empty state for new users, and navbar. (3) Trip details page — view mode showing all sections (flights, stays, activities) with empty states. Write all specs to `.workflow/ui-spec.md`. These must be published before the Frontend Engineer can start T-014 through T-017. |
| Notes | Design preferences from project brief: Color palette — #02111B (darkest), #3F4045, #30292F, #5D737E, #FCFCFC (lightest). Font: IBM Plex Mono. Style: minimal "Japandi" aesthetic. Trip details page layout: calendar at the top (Sprint 1 can show a placeholder/empty state for the calendar — it will be implemented in Sprint 2). Trip status badge: PLANNING (default), ONGOING, COMPLETED. Empty states should include a CTA prompt (e.g., "No flights yet — add one"). Edit buttons/links for flights, stays, and activities should be visible in the spec but marked as "Sprint 2" — they will exist in the UI as non-functional placeholders or be omitted with a note. |

---

### Sprint 1 — Manager → Frontend Engineer (Setup Notice)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-013 |
| Handoff Summary | Sprint #1 is now planned. You may begin T-013 (Frontend project setup) immediately — it has no blocking dependencies. Set up React 18 + Vite, React Router v6, auth context with JWT storage and refresh logic, axios instance with interceptors, IBM Plex Mono font, and the project color palette. Do NOT start T-014 through T-017 until Design Agent specs (T-001, T-002, T-003) and API contracts (T-004, T-005, T-006) are done and approved. Watch the handoff log for the signal that those are ready. |
| Notes | Color palette for CSS variables: --color-darkest: #02111B; --color-dark: #3F4045; --color-mid-dark: #30292F; --color-accent: #5D737E; --color-lightest: #FCFCFC. Font: IBM Plex Mono (load from Google Fonts or local). JWT: store access token in memory (React context state), store refresh token in httpOnly cookie if possible — otherwise localStorage with a note about the trade-off. Axios interceptor should auto-refresh on 401. Protected route component should redirect to /login if no valid token. |

---

*Entries are added by each agent when they finish work that another agent depends on. Newest entries go at the top of the Log section.*

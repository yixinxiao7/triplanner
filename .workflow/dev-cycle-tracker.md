# Dev Cycle Tracker

Task board for all engineering work. Managed by the Manager Agent.

---

## How to Use This File

Each task is a row in the table below. Agents update their assigned tasks as they progress through the workflow.

**Status Flow:** Backlog → In Progress → In Review → Integration Check → Done

**Special Statuses:** Blocked (waiting on a dependency)

---

## Task Fields

| Field | Description |
|-------|-------------|
| ID | Unique task identifier (e.g., T-001) |
| Task | Short description of the work |
| Type | Feature, Bug Fix, Refactor, Infrastructure, Documentation, Code Review, Migration, Hotfix, Spike |
| Assigned To | Which agent owns this task |
| Status | Current status in the workflow |
| Priority | P0 (Critical), P1 (High), P2 (Medium), P3 (Low) |
| Complexity | S, M, L, XL |
| Sprint | Which sprint this task belongs to |
| Blocked By | Task ID(s) that must complete before this task can start |
| Test Plan | Expected behavior and acceptance criteria for QA |
| Feedback Source | Link to feedback-log.md entry that spawned this task |
| Notes | Additional context |

---

## Sprint 1 Tasks

### Phase 1 — Design Specs (no dependencies, start immediately)

| ID | Task | Type | Assigned To | Status | Priority | Complexity | Sprint | Blocked By | Test Plan |
|----|------|------|-------------|--------|----------|------------|--------|------------|-----------|
| T-001 | Design spec: Auth screens (login page, register page, error states, redirect flows) | Feature | Design Agent | Done | P1 | S | 1 | — | UI spec reviewed by Manager Agent. Covers: login form (email + password), register form (name + email + password), inline error messages, loading states, and redirect on success. Published to `.workflow/ui-spec.md`. |
| T-002 | Design spec: Home page (trip list cards, create-trip modal, empty state for new users, navbar) | Feature | Design Agent | Done | P1 | M | 1 | — | UI spec reviewed by Manager Agent. Covers: trip card layout (name, destinations, timeline, status badge), create-trip modal fields (trip name, destinations), empty state CTA for new users, and navbar layout. Published to `.workflow/ui-spec.md`. |
| T-003 | Design spec: Trip details page (view mode — calendar placeholder, flights section, stays section, activities section, all empty states) | Feature | Design Agent | Done | P1 | M | 1 | — | UI spec reviewed by Manager Agent. Covers: page layout with calendar at top (placeholder for Sprint 2), flights section with flight cards, stays section with stay cards, activities section with day-grouped hourly layout, and all empty states with CTA prompts. Published to `.workflow/ui-spec.md`. |

---

### Phase 2 — API Contracts & Schema (no dependencies, start immediately in parallel with Design)

| ID | Task | Type | Assigned To | Status | Priority | Complexity | Sprint | Blocked By | Test Plan |
|----|------|------|-------------|--------|----------|------------|--------|------------|-----------|
| T-004 | API contracts: Auth endpoints (POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout) | Documentation | Backend Engineer | Integration Check | P0 | S | 1 | — | Contract reviewed by Manager Agent. Covers request body shape, success response shape (JWT access + refresh tokens), error codes (400, 401, 409), and token expiry. Published to `.workflow/api-contracts.md`. **[Manager Approved 2026-02-24]** Contract matches implementation exactly. |
| T-005 | API contracts: Trips CRUD endpoints (GET /trips, POST /trips, GET /trips/:id, PATCH /trips/:id, DELETE /trips/:id) | Documentation | Backend Engineer | Integration Check | P0 | S | 1 | — | Contract reviewed by Manager Agent. Covers trip resource shape (id, user_id, name, destinations, status, created_at, updated_at), pagination on list, auth requirement, and all error codes. Published to `.workflow/api-contracts.md`. **[Manager Approved 2026-02-24]** Contract matches implementation exactly. |
| T-006 | API contracts: Flights, Stays, and Activities endpoints (full CRUD for each, nested under /trips/:id) | Documentation | Backend Engineer | Integration Check | P0 | M | 1 | — | Contract reviewed by Manager Agent. Covers flight resource (flight_number, airline, departure/arrival airport + datetime + timezone), stay resource (category, name, address, check-in/out datetime + timezone), activity resource (name, location, date, start_time, end_time), and all CRUD operations. Published to `.workflow/api-contracts.md`. **[Manager Approved 2026-02-24]** Contract matches implementation exactly. Timezone convention (`*_at` + `*_tz`) correctly implemented. |
| T-007 | Database schema design: Define all tables — users, trips, flights, stays, activities (fields, types, FK relationships, indexes) | Documentation | Backend Engineer | Integration Check | P0 | M | 1 | — | Schema reviewed and approved by Manager Agent. All FK constraints defined, enum types listed, timestamp fields included, indexes on user_id and trip_id FKs. Documented in `.workflow/api-contracts.md` schema section and `technical-context.md`. **[Manager Approved 2026-02-24]** All 6 migration files present with correct up/down. Composite index on (trip_id, activity_date) is a good addition. |

---

### Phase 3a — Backend Implementation (starts after API contracts + schema are approved)

| ID | Task | Type | Assigned To | Status | Priority | Complexity | Sprint | Blocked By | Test Plan |
|----|------|------|-------------|--------|----------|------------|--------|------------|-----------|
| T-008 | Backend project setup: Initialize Express app, Knex config, PostgreSQL connection, JWT middleware, folder structure, `.env.example`, error handler | Infrastructure | Backend Engineer | Integration Check | P0 | M | 1 | — | `npm install` succeeds, `npm run dev` starts server on port 3000, DB connection test succeeds, health check endpoint `GET /api/v1/health` returns `{ "status": "ok" }`. **[Manager Approved 2026-02-24]** Clean project structure. All dependencies present. `.env.example` covers all required vars. Helmet + CORS configured correctly. |
| T-009 | Database migrations: Create all tables (users, trips, flights, stays, activities) with rollbacks | Migration | Backend Engineer | Integration Check | P0 | M | 1 | T-007, T-008 | `knex migrate:latest` completes without error. All tables exist with correct columns and constraints. `knex migrate:rollback` cleanly removes all tables. No data loss on re-migrate. **[Manager Approved 2026-02-24]** All 6 migrations present with up/down. FK CASCADE deletes correct. CHECK constraints on enums. Indexes on FK columns + composite index on (trip_id, activity_date). |
| T-010 | Backend: Auth API — register (hash password, create user), login (compare hash, issue JWT), refresh token, logout (invalidate refresh token) | Feature | Backend Engineer | Integration Check | P0 | M | 1 | T-004, T-009 | Happy path: register creates user, login returns access + refresh tokens. Error paths: duplicate email returns 409, wrong password returns 401, missing fields return 400. Passwords stored as bcrypt hashes. JWT validates correctly on protected routes. **[Manager Approved 2026-02-24]** bcrypt 12 rounds ✅. Timing-safe comparison with DUMMY_HASH ✅. Refresh token stored as SHA-256 hash only ✅. Token rotation on refresh ✅. httpOnly SameSite=strict cookie ✅. Safe error messages (no stack traces) ✅. ⚠️ **QA Flag (T-018):** `express-rate-limit` is installed but NOT applied to /auth/login or /auth/register. QA must verify rate limiting is added or explicitly accepted as known staging risk. |
| T-011 | Backend: Trips API — list user's trips, create trip, get single trip, update trip status, delete trip (user-scoped, auth required) | Feature | Backend Engineer | Integration Check | P1 | M | 1 | T-005, T-009 | Happy path: all CRUD operations return correct shapes. Auth: unauthenticated requests return 401. Authorization: user can only access own trips (403 otherwise). Create returns 201, delete returns 204, non-existent trip returns 404. **[Manager Approved 2026-02-24]** Ownership check returns 403 (not 404) ✅. Pagination with default limit 20 ✅. PATCH validates at least one updatable field ✅. All routes behind authenticate middleware ✅. Tests cover auth + ownership error paths ✅. |
| T-012 | Backend: Flights, Stays, Activities API — full CRUD for each resource, scoped to trip_id, auth required | Feature | Backend Engineer | Integration Check | P1 | L | 1 | T-006, T-009 | Happy path: create, list, update, delete for flights/stays/activities all work. Timezone fields stored and returned correctly (store UTC + timezone string). Invalid trip_id returns 404. Unauthorized access returns 401/403. Input validation on all fields. **[Manager Approved 2026-02-24]** Trip ownership checked on every sub-resource operation ✅. Temporal ordering (arrival > departure, check_out > check_in, end_time > start_time) validated ✅. mergeParams used correctly for nested router ✅. Optional fields (address, location) handled ✅. Correct ordering on list queries ✅. |

---

### Phase 3b — Frontend Implementation (starts after Design specs + API contracts are approved)

| ID | Task | Type | Assigned To | Status | Priority | Complexity | Sprint | Blocked By | Test Plan |
|----|------|------|-------------|--------|----------|------------|--------|------------|-----------|
| T-013 | Frontend project setup: Initialize React 18 + Vite, React Router v6, auth context (JWT storage + refresh logic), axios instance with interceptors, IBM Plex Mono font, base color palette, folder structure | Infrastructure | Frontend Engineer | Integration Check | P0 | M | 1 | — | `npm run dev` starts on port 5173. Router renders placeholder routes for `/login`, `/register`, `/`, `/trips/:id`. Auth context exposes `user`, `login()`, `logout()`. Protected route redirects unauthenticated users to `/login`. **[Manager Approved 2026-02-24]** Access token in-memory (useRef, not localStorage) ✅. Axios interceptor with 401 retry + request queue during refresh ✅. ProtectedRoute guards all authenticated pages ✅. IBM Plex Mono + CSS design tokens correctly configured ✅. Vite proxy to :3000 configured ✅. ⚠️ Note: api.js interceptor logic (retry queue) has no dedicated unit test — integration tests (T-019) will cover this. |
| T-014 | Frontend: Auth pages — login page, register page, form validation, JWT token handling, redirect on success, error message display, loading states | Feature | Frontend Engineer | Integration Check | P0 | M | 1 | T-001, T-004, T-013 | Register form: name + email + password fields, submits to API, shows validation errors inline, redirects to home on success. Login form: email + password, submits to API, stores JWT, redirects to home. Logout clears token and redirects to login. Protected routes redirect unauthenticated users. **[Manager Approved 2026-02-24]** Field-level error display ✅. API error banner (401/500) ✅. 409 email taken → email field error ✅. 8-char password hint text ✅. Loading spinner during submit ✅. Redirect if already authenticated ✅. Tests (LoginPage.test.jsx, RegisterPage.test.jsx) present ✅. |
| T-015 | Frontend: Navbar component — home link, authenticated user's name display, logout button, responsive layout | Feature | Frontend Engineer | Integration Check | P1 | S | 1 | T-002, T-013 | Navbar renders on all authenticated pages. "Home" link navigates to `/`. Username is displayed. Logout button calls logout handler and redirects to `/login`. Navbar not shown on auth pages (login/register). **[Manager Approved 2026-02-24]** Sticky 56px bar ✅. Username truncated at 20 chars ✅. Best-effort logout (calls API then clears token regardless) ✅. Hidden on mobile <768px per spec ✅. Tests (Navbar.test.jsx) present ✅. |
| T-016 | Frontend: Home page — fetch and display trip list, trip cards (name, destinations, timeline, status badge), create-trip modal (name + destinations input, submit), delete trip with confirmation, empty state for new users | Feature | Frontend Engineer | In Review | P1 | M | 1 | T-002, T-005, T-013 | Trip list loads from API on mount. Each card shows name, destination(s), date range, and status badge. Clicking card navigates to `/trips/:id`. Create modal opens on button click, submits to API, refreshes list. Delete shows confirmation, calls API, removes card. Empty state shown when no trips exist. **[Tests Added 2026-02-24]** ✅ `src/__tests__/HomePage.test.jsx` added: covers trip list renders from API, skeleton loading, empty state, create modal open, create modal submit + navigation, delete confirmation replaces card, delete API call removes card from DOM, toast shown on delete API error, retry on load error. ✅ `src/__tests__/useTrips.test.js` added: covers fetchTrips happy path (returns trips array), fetchTrips error path (sets error state + fallback message), createTrip happy path (returns new trip object, sends correct destinations array), createTrip error path (throws), deleteTrip removes entry from local trips list. All API calls mocked. **128 tests passing.** |
| T-017 | Frontend: Trip details page — display trip name + destinations, flights section (flight cards or empty state), stays section (stay cards or empty state), activities section (day-grouped hourly list or empty state), calendar placeholder at top | Feature | Frontend Engineer | In Review | P1 | L | 1 | T-003, T-006, T-013 | Page fetches trip + all sub-resources on mount. Flights section: renders each flight card with all fields, shows empty state if none. Stays section: renders each stay card with category/name/address/dates, shows empty state if none. Activities section: groups activities by date, shows them in chronological order within each day, empty state if none. Calendar area shows placeholder message ("Calendar coming in Sprint 2"). Navigation back to home works. **[Tests Added 2026-02-24]** ✅ `src/__tests__/TripDetailsPage.test.jsx` added: covers flight cards render with airline/flight_number/from_location/to_location, stay cards render with category badge/name/address/check-in-out dates, activities grouped by activity_date and sorted by start_time within each day, calendar placeholder text shown ("calendar coming in sprint 2"), skeleton loading per section (.skeleton elements > 0), error state per section with "try again" retry button, multiple independent section errors, retry button calls correct refetch function, back navigation link (/), trip 404 shows full-page "trip not found." error state. ✅ `src/__tests__/useTripDetails.test.js` added: covers parallel fetch of trip + flights + stays + activities on mount, trip 404 prevents sub-resource fetches (tripError.type='not_found'), trip 500 sets network error type, each sub-resource has independent error state, refetchFlights/refetchStays/refetchActivities only call their respective API endpoint, each refetch updates data and clears error, refetch error state on retry failure, empty tripId guard. **128 tests passing.** |

---

### Phase 4 — QA, Deploy, Monitor (sequential after all implementation tasks)

| ID | Task | Type | Assigned To | Status | Priority | Complexity | Sprint | Blocked By | Test Plan |
|----|------|------|-------------|--------|----------|------------|--------|------------|-----------|
| T-018 | QA: Security checklist + code review audit (JWT validation, password hashing, SQL injection prevention, no hardcoded secrets, env vars, input validation) | Code Review | QA Engineer | Backlog | P0 | M | 1 | T-010, T-011, T-012, T-014, T-015, T-016, T-017 | All items in `.workflow/security-checklist.md` are verified. Passwords use bcrypt (min 12 rounds). JWT secret is in `.env`. No SQL string concatenation. All inputs validated server-side. API errors return structured JSON without stack traces. Results logged in `.workflow/qa-build-log.md`. |
| T-019 | QA: Integration testing — full end-to-end flow (register → login → create trip → view trip details → delete trip → logout) | Feature | QA Engineer | Backlog | P0 | M | 1 | T-018 | All API integrations verified: auth flow works end-to-end, trips CRUD works, trip details page loads real data, delete removes trip from list. No broken network requests. Frontend and backend agree on all data shapes. Results logged in `.workflow/qa-build-log.md` with status Pass/Fail per flow. |
| T-020 | Deploy: Staging deployment — Docker Compose setup (backend + PostgreSQL), Vite production build (frontend), environment configuration for staging | Infrastructure | Deploy Engineer | Backlog | P1 | M | 1 | T-019 | Backend containerized and running. PostgreSQL running with migrations applied. Frontend built and served. Both accessible at staging URLs. No build errors. `.env.example` covers all required vars. Deployment steps documented. |
| T-021 | Monitor: Staging health check — API health endpoint, DB connectivity, auth smoke test, no error spikes in logs | Infrastructure | Monitor Agent | Backlog | P1 | S | 1 | T-020 | `GET /api/v1/health` returns 200. DB connection verified. Register + login smoke test passes. No unhandled errors in application logs. Results logged in `.workflow/qa-build-log.md`. |
| T-022 | User Agent: Feature walkthrough — full new-user flow (register, create trip, view details) and returning-user flow (login, view existing trip), submit structured feedback | Documentation | User Agent | Backlog | P1 | M | 1 | T-021 | User completes both flows without errors. Feedback submitted to `.workflow/feedback-log.md` covering: UX observations, any bugs found, missing functionality, and overall assessment. All feedback entries have severity and category set. |

---

## Backlog (Sprint 2 Candidates)

| ID | Task | Type | Priority | Complexity | Notes |
|----|------|------|----------|------------|-------|
| B-001 | Edit page: Flights — add, edit, delete flight entries with form validation and timezone handling | Feature | P1 | M | Depends on T-012 (flights API). Core user flow for data entry. |
| B-002 | Edit page: Stays — add, edit, delete stay entries with category selector, address field, check-in/out pickers | Feature | P1 | M | Depends on T-012 (stays API). Core user flow for data entry. |
| B-003 | Edit page: Activities — add multiple activities with date/time pickers, "+" to add row, delete row, save/cancel routing | Feature | P1 | L | Depends on T-012 (activities API). Most complex edit flow per project brief. |
| B-004 | Calendar component: Interactive calendar integrated with flights, stays, and activities data | Feature | P2 | XL | Requires B-001, B-002, B-003 to be complete so data exists. Consider a library (e.g., FullCalendar, react-big-calendar). |
| B-005 | Trip status auto-calculation: Automatically set ONGOING/COMPLETED based on trip dates | Feature | P2 | S | Simple backend logic based on flight dates or manually set date range. |
| B-006 | Trip date range: Allow users to set explicit start/end dates on a trip (separate from flight dates) | Feature | P2 | S | Improves status badge and calendar accuracy. |
| B-007 | Destinations as structured data: Multi-destination add/remove UI on trip creation and trip details | Feature | P3 | M | Sprint 1 treats destinations as a text field; Sprint 2 can make it structured. |
| B-008 | Production deployment: Deploy to production hosting (frontend static, backend containerized) | Infrastructure | P1 | M | After staging is stable and user feedback is reviewed. |

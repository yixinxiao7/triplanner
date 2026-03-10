## Sprint 17 Feedback Triage (Manager Agent — 2026-03-08)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| — | — | — | **No new entries** | T-177 (User Agent Sprint 17 walkthrough) did not execute before sprint close — T-176 (Monitor) and T-177 (User Agent) carry over to Sprint 18. Sprint 17 User Agent feedback will be submitted during Sprint 18 after T-177 completes. All Sprint 16 feedback (FB-106, FB-107, FB-108) was fully resolved in Sprint 17 (T-170). |

*No "New" status entries to triage. Sprint 17 ended with T-176 and T-177 in Backlog — these are the first tasks of Sprint 18.*

---

## Sprint 16 Feedback Triage (Manager Agent — 2026-03-08)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| — | — | — | **No new entries (entering sprint)** | All Sprint 15 feedback (FB-096, FB-097, FB-098) resolved in Sprint 15. No new User Agent or Monitor Agent feedback had been submitted — T-152 and T-159/T-160 pipeline carry-overs resolved during Sprint 16. |
| FB-099 | Positive | — | **Acknowledged** | Trip with no events correctly shows "No dates yet" on home page — T-164 empty state confirmed. |
| FB-100 | Positive | — | **Acknowledged** | Mixed-event trip computes correct date range (same month) — T-163 LEAST/GREATEST SQL correct. |
| FB-101 | Positive | — | **Acknowledged** | Cross-year date range computed and formatted correctly — formatDateRange cross-year case verified. |
| FB-102 | Positive | — | **Acknowledged** | GET /trips list includes start_date/end_date on every trip; NULLs sorted last — T-163 list endpoint correct. |
| FB-103 | Positive | — | **Acknowledged** | Test suites exceed expected pass counts (278 backend, 420 frontend) — healthy regression coverage. |
| FB-104 | Positive | — | **Acknowledged** | Sprint 15 fixes verified clean in regression: title, favicon, land travel chips all correct. |
| FB-105 | Positive | — | **Acknowledged** | Auth and validation safeguards working as expected; SQL injection handled safely. |
| FB-106 | UX Issue | Minor | **Tasked → T-170** | `.datesNotSet` double-muted opacity (~25% effective) may be illegible. Fix: remove `opacity: 0.5` from `.datesNotSet`, rely solely on `var(--text-muted)`. Sprint 17, P2. |
| FB-107 | UX Issue | Minor | **Tasked → T-170** | Dead code: `formatTripDateRange` unused, non-spec behavior, 5 tests for non-conforming output. Remove function and tests. Bundled with FB-106 in T-170. Sprint 17, P2. |
| FB-108 | Suggestion | — | **Acknowledged → T-170** | Stale comment in formatDate.js line 8. Update to reflect all event types. Bundled with T-170 code cleanup. Sprint 17, P3. |

---

## Sprint 16 User Agent Feedback — T-152 / T-160 / T-169 (User Agent — 2026-03-08)

*Submitted by User Agent after comprehensive walkthrough of Sprint 12+13+14+15 features (T-152), Sprint 15 specific features (T-160), and Sprint 16 trip date range feature (T-169). Monitor Agent confirmed staging healthy before testing began.*

---

### FB-099 — T-169 — Trip with no events shows "No dates yet" on card

| Field | Value |
|-------|-------|
| Feedback | Trip with no events correctly shows "No dates yet" on home page trip card |
| Sprint | 16 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-164, T-169 |

**Details:** Created "Empty Trip T-169" (no flights, stays, activities, or land travels) via `POST /api/v1/trips`. `GET /api/v1/trips/:id` returned `start_date: null, end_date: null` as expected. `TripCard.jsx` renders `<span class="datesNotSet">No dates yet</span>` for null date ranges. The "No dates yet" label is styled with muted secondary text, consistent with the UI spec's empty-state pattern. The old "dates not set" text string (from a prior spec version) is correctly absent.

---

### FB-100 — T-169 — Mixed-event trip computes correct date range (same month)

| Field | Value |
|-------|-------|
| Feedback | Trip with flight + stay + activity returns correct computed start_date and end_date |
| Sprint | 16 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-163, T-169 |

**Details:** Created "Trip With Events T-169" with: flight departure `2026-05-01`, flight arrival `2026-05-02`; stay check-in `2026-05-02`, check-out `2026-05-12`; activity date `2026-05-07`. `GET /api/v1/trips/:id` returned `start_date: "2026-05-01"` (flight departure, global min) and `end_date: "2026-05-12"` (stay check-out, global max). Backend SQL LEAST/GREATEST subquery correctly spans all event types. `formatDateRange("2026-05-01", "2026-05-12")` would render as "May 1 – 12, 2026" (same-month abbreviated format per spec).

---

### FB-101 — T-169 — Cross-year date range computed and formatted correctly

| Field | Value |
|-------|-------|
| Feedback | Cross-year trip (Dec 2025 → Jan 2026) shows full format with both years |
| Sprint | 16 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-163, T-164, T-169 |

**Details:** Created "Cross Year Trip T-169" with flight departure `2025-12-28` and hotel check-out `2026-01-10`. `GET /api/v1/trips/:id` returned `start_date: "2025-12-28"`, `end_date: "2026-01-10"`. `formatDateRange("2025-12-28", "2026-01-10")` returns `"Dec 28, 2025 – Jan 10, 2026"` (cross-year full format with both years shown). Status auto-computed as "COMPLETED" since end_date is in the past relative to 2026-03-08 — correct T-030 behavior.

---

### FB-102 — T-169 — GET /trips list includes start_date/end_date on every trip

| Field | Value |
|-------|-------|
| Feedback | List endpoint returns start_date and end_date fields on each trip object |
| Sprint | 16 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-163, T-169 |

**Details:** `GET /api/v1/trips` (list) returns `start_date` and `end_date` on every trip object in the `data` array, for both trips with events (populated dates) and trips without events (`null`). Pagination metadata is present alongside the new fields. Sorting by `sort_by=start_date&sort_order=asc` correctly places NULL-date trips last (NULLS LAST behavior verified live on staging).

---

### FB-103 — T-169 — Test suites exceed expected pass counts

| Field | Value |
|-------|-------|
| Feedback | Backend 278 tests pass (expected 271+); Frontend 420 tests pass (expected 416+) |
| Sprint | 16 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-163, T-164, T-165, T-169 |

**Details:** Full test suites run cleanly with no failures: backend 278/278 (7 above minimum threshold), frontend 420/420 (4 above minimum). Sprint 16 test additions (sprint16.test.js for T-163, formatDate.test.js T-164 cases, TripCard.test.jsx T-164 cases) all pass. All prior sprint tests (regression) continue to pass.

---

### FB-104 — T-152/T-160 — Sprint 15 fixes verified (title, favicon, land travel chips)

| Field | Value |
|-------|-------|
| Feedback | Browser title "triplanner", favicon, and land travel chip locations all confirmed working (Sprint 15 regression clean) |
| Sprint | 16 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-154, T-155, T-152, T-160 |

**Details:** (1) `frontend/dist/index.html` contains `<title>triplanner</title>` and `<link rel="icon" type="image/png" href="/favicon.png" />` — T-154 fix confirmed in production build. (2) `TripCalendar.jsx` T-155 fix verified in code: pick-up chip uses `lt.from_location` (departure day), drop-off chip uses `lt.to_location` (arrival day). This corrects the prior bug where both chips showed `to_location`. Sprint 15 regression is clean.

---

### FB-105 — T-169 — Auth and validation safeguards working as expected

| Field | Value |
|-------|-------|
| Feedback | Auth error handling and input validation return correct HTTP status codes and field-level messages |
| Sprint | 16 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-169 |

**Details:** Verified on staging: (1) Invalid JWT → 401 `{"code":"UNAUTHORIZED"}`; (2) Missing Authorization header → 401 `{"code":"UNAUTHORIZED"}`; (3) Empty email on register → 400 with `fields.email: "Email is required"`; (4) Password < 8 chars → 400 with `fields.password: "Password must be at least 8 characters"`; (5) Invalid `sort_by` param → 400 with `fields.sort_by: "Sort field must be one of: name, created_at, start_date"`; (6) SQL injection in search (`'; DROP TABLE trips; --`) returns empty result set safely (no 500, no data leak).

---

### FB-106 — T-164 — "No dates yet" text may be too dim (double-muted opacity)

| Field | Value |
|-------|-------|
| Feedback | `.datesNotSet` CSS class applies `opacity: 0.5` on top of `var(--text-muted)` which is already `rgba(252,252,252,0.5)` — effective ~25% opacity may be below readable threshold |
| Sprint | 16 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked → T-170 |
| Related Task | T-164 |

**Details:** Steps to reproduce: (1) View a home page trip card with no events; (2) "No dates yet" label is rendered with `.datesNotSet` CSS class. Expected: "No dates yet" is visually present and legible in muted secondary text (per spec: "muted secondary color"). Actual: `.datesNotSet` sets `color: var(--text-muted)` (which is `rgba(252,252,252,0.5)`) AND `opacity: 0.5`, compounding to ~25% effective opacity of white against `#02111B` background. This is below typical WCAG AA contrast minimums for body text and may be unreadable in practice. The parent `.timeline` row is already `color: var(--text-muted)`, so the color on `.datesNotSet` is redundant — only the opacity stacks. Suggested fix: remove the `opacity: 0.5` line from `.datesNotSet` and rely solely on `var(--text-muted)` for the muted look.

---

### FB-107 — T-164 — Dead code: `formatTripDateRange` function diverges from spec

| Field | Value |
|-------|-------|
| Feedback | `formatTripDateRange` in formatDate.js is unused by TripCard and implements different formatting than the spec (no same-month abbreviation) |
| Sprint | 16 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked → T-170 |
| Related Task | T-164 |

**Details:** `formatDate.js` exports two similar functions: `formatDateRange` (Sprint 16, used by TripCard, correct — same-month abbreviated: "Aug 7 – 14, 2026") and `formatTripDateRange` (legacy, not imported by any production component, does NOT implement same-month abbreviation — produces "Aug 7 – Aug 14, 2026" instead). The divergence means `formatTripDateRange` does not conform to the current UI spec. While it doesn't cause a user-facing bug today (TripCard correctly uses `formatDateRange`), the dead function: (a) has 5 tests that pass but test non-spec behavior; (b) could be picked up by a future engineer thinking it's the authoritative formatter; (c) adds maintenance burden. Suggested fix: remove `formatTripDateRange` and its tests, keeping only `formatDateRange`.

---

### FB-108 — Suggestion — Stale comment in formatDate.js

| Field | Value |
|-------|-------|
| Feedback | File-level comment on line 8 of formatDate.js still says "derive date range from flight dates" — now inaccurate |
| Sprint | 16 |
| Category | UX Issue |
| Severity | Minor |
| Status | Acknowledged → T-170 (bundled) |
| Related Task | T-163, T-164 |

**Details:** `formatDate.js` line 8 reads: `"Trip cards: derive date range from flight dates."` This was accurate before Sprint 16, but T-163 now computes the date range from ALL event types: flights, stays, activities, and land travels (via SQL MIN/MAX across all four tables). The stale comment is a documentation inaccuracy that could mislead future engineers. Suggested fix: update to `"Trip cards: derive date range from the earliest and latest dates across all event types (flights, stays, activities, land travels)."` This is cosmetic only; no functional impact.

---

## Production Deployment Feedback Triage (Project Owner — 2026-03-09)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-109 | Feature Gap | Major | **New** | Knexfile production config needs SSL + free-tier pool sizing for AWS RDS |
| FB-110 | Bug | Critical | **New** | Cookie SameSite must be `none` in production for cross-origin Render deploy — auth completely broken without this |
| FB-111 | Feature Gap | Major | **New** | Create render.yaml blueprint + step-by-step production deploy guide for project owner |

*Three entries for production deployment on Render (free tier) + AWS RDS (free tier). Manager should prioritize FB-110 (Critical) first.*

---

### FB-109 — Production deployment: Knexfile SSL + connection pool for RDS

| Field | Value |
|-------|-------|
| Feedback | Knexfile production config needs SSL enabled and pool sizing adjusted for AWS RDS free tier |
| Sprint | — |
| Category | Feature Gap |
| Severity | Major |
| Status | New |
| Related Task | — |

**Details:** The current `backend/src/config/knexfile.js` production config uses a plain `connection: process.env.DATABASE_URL` string, which will fail to connect to AWS RDS because RDS requires SSL by default. Additionally, the pool config (`min: 2, max: 10`) is too aggressive for a free-tier RDS instance that may sleep.

**Required changes (Backend Engineer):**
1. In `knexfile.js`, change the production `connection` from:
   ```js
   connection: process.env.DATABASE_URL
   ```
   to:
   ```js
   connection: {
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false }
   }
   ```
2. Change the production `pool` from `{ min: 2, max: 10 }` to `{ min: 0, max: 5 }` — `min: 0` allows the pool to fully drain when the free-tier instance sleeps, and `max: 5` avoids exceeding RDS free-tier connection limits.

---

### FB-110 — Production deployment: Cookie SameSite fix for cross-origin Render

| Field | Value |
|-------|-------|
| Feedback | Cookie SameSite must be `none` in production for cross-origin Render deployment — auth completely broken without this |
| Sprint | — |
| Category | Bug |
| Severity | Critical |
| Status | New |
| Related Task | — |

**Details:** On Render free tier, the frontend static site and backend web service will be on different subdomains (e.g., `triplanner-frontend.onrender.com` and `triplanner-backend.onrender.com`). The current `backend/src/routes/auth.js` sets `sameSite: 'strict'` on refresh token cookies in both `setRefreshCookie` (line ~80) and `clearRefreshCookie` (line ~90). With `sameSite: 'strict'`, the browser will **never** send the refresh token cookie on cross-origin requests, which means token refresh will silently fail and users will be logged out constantly.

**Required changes (Backend Engineer):**
1. In `setRefreshCookie` (~line 80): change `sameSite: 'strict'` to `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'`
2. In `clearRefreshCookie` (~line 90): change `sameSite: 'strict'` to `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'`

Both locations must be updated — if only one is changed, cookie clearing on logout will fail in production. The `secure: true` flag (already present for production) is required when `sameSite: 'none'`, so the existing config is compatible.

---

### FB-111 — Production deployment: Create render.yaml + project owner setup guide

| Field | Value |
|-------|-------|
| Feedback | Create render.yaml infrastructure-as-code blueprint and a step-by-step production deployment guide for the project owner |
| Sprint | — |
| Category | Feature Gap |
| Severity | Major |
| Status | New |
| Related Task | — |

**Details:** The project needs a `render.yaml` at the repository root so Render can auto-detect the service configuration, plus a human-readable guide for the manual steps that agents cannot perform (AWS console, Render dashboard, etc.).

**Required changes (Deploy Engineer) — render.yaml:**
Create `render.yaml` at project root with:
1. **Backend web service** — type: web, runtime: node, plan: free, region: **ohio** (US East), rootDir: `backend`, buildCommand: `npm install && npx knex migrate:latest`, startCommand: `npm start`, envVars: `DATABASE_URL` (from Render env group or manual), `NODE_ENV: production`, `JWT_SECRET` (generate), `CORS_ORIGIN` (frontend URL).
2. **Frontend static site** — type: web, plan: static/free, region: **ohio** (US East), rootDir: `frontend`, buildCommand: `npm install && npm run build`, publishDir: `dist`, routes: rewrite rule `/*` → `/index.html` (SPA support), envVar: `VITE_API_URL` (backend URL).

**Required changes (Manager Agent) — production-deploy-guide.md:**
Write a step-by-step guide at `.workflow/production-deploy-guide.md` covering:
1. **Create AWS RDS PostgreSQL instance** — region **us-east-1 (N. Virginia)**, engine PostgreSQL 15+, instance class `db.t3.micro` (free tier eligible), 20 GB storage, public access enabled, create a security group allowing inbound on port 5432, set master username/password, set initial database name (e.g., `triplanner`).
2. **Get the RDS endpoint and construct DATABASE_URL** — format: `postgresql://<user>:<password>@<endpoint>:5432/<dbname>?sslmode=require`
3. **Connect GitHub repo to Render** — sign in to Render, connect GitHub, select the triplanner repo, Render will auto-detect `render.yaml`. Select **Ohio** region when prompted.
4. **Set environment variables in Render dashboard** — `DATABASE_URL` (from step 2), `JWT_SECRET` (generate a random 64-char string), `CORS_ORIGIN` (the frontend Render URL), `NODE_ENV=production`, `VITE_API_URL` (the backend Render URL, set on the frontend static site).
5. **Run migrations via Render Shell** — open the backend service Shell in Render dashboard, run `npx knex migrate:latest` to initialize the database schema.

---


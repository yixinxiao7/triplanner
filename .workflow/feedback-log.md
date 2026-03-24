# Feedback Log

Structured feedback from the User Agent and Monitor Agent after each test cycle. Triaged by the Manager Agent.

---

## Log Fields

| Field | Description |
|-------|-------------|
| Feedback | Short description of the observation |
| Sprint | Sprint number |
| Category | Bug, UX Issue, Feature Gap, Positive, Performance, Security, Monitor Alert |
| Severity | Critical, Major, Minor, Suggestion |
| Status | New, Acknowledged, Tasked, Resolved, Won't Fix |
| Details | Full description of the issue or observation |
| Related Task | Task ID from dev-cycle-tracker.md (if applicable) |

---


---

## Monitor Alert — Sprint #26 — 2026-03-11T14:20:00Z

| Field | Value |
|-------|-------|
| **Category** | Monitor Alert |
| **Severity** | Major |
| **Sprint** | 26 |
| **Status** | Tasked |
| **Related Task** | T-228 |
| **Tasked As** | T-228 (Sprint 27 — primary CORS fix: ecosystem.config.cjs + ESM dotenv refactor) |

**Feedback:** Staging CORS runtime mismatch — backend serves wrong `Access-Control-Allow-Origin` header; all browser-initiated API calls from staging frontend will be CORS-blocked.

**Details:**

The staging backend (`https://localhost:3001`) is serving `Access-Control-Allow-Origin: http://localhost:5173` instead of the expected `https://localhost:4173`. This causes all browser-initiated API calls from the staging frontend (`https://localhost:4173`) to be rejected by browser CORS policy.

**Root Cause:** ESM module hoisting in `backend/src/index.js`.

In ESM, `import` statements are statically hoisted and resolved before the module body executes. `import app from './app.js'` is evaluated first — before the subsequent `dotenv.config({ path: '.env.staging' })` call. When `app.js` executes `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' })`, `process.env.CORS_ORIGIN` is still `undefined` (dotenv hasn't run yet). The cors middleware captures `'http://localhost:5173'` as its fixed origin.

`PORT=3001` is unaffected because it lives in the pm2 `ecosystem.config.cjs` env block (set by pm2 before node launches). `CORS_ORIGIN` is not in that block — it is only in `.env.staging`.

**Confirmed via live header check:**
```
$ curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"
Access-Control-Allow-Origin: http://localhost:5173   ← wrong
```

**Impact:**
- All browser-initiated API calls from staging frontend (`https://localhost:4173`) will be CORS-blocked
- Login, trip creation, and all authenticated flows will fail in the browser on staging
- Direct curl and Playwright tests are unaffected (no browser CORS enforcement)
- Deploy Verified = **No** for Sprint 26 staging

**Required Fix (Option A — fastest, no code change):**
Add `CORS_ORIGIN: 'https://localhost:4173'` to the `triplanner-backend` env block in `infra/ecosystem.config.cjs`:
```js
env: {
  NODE_ENV: 'staging',
  PORT: 3001,
  CORS_ORIGIN: 'https://localhost:4173',  // ← add this
},
```
Then: `pm2 restart triplanner-backend`
Then: re-run health check to confirm `Access-Control-Allow-Origin: https://localhost:4173`

**Required Fix (Option B — code fix for long-term robustness):**
Refactor `backend/src/index.js` to load dotenv before importing `app.js` (requires dynamic import since ESM hoists static imports).

**Secondary Issue (Minor):**
`backend/src/config/knexfile.js` `staging` environment block is missing `seeds: { directory: seedsDir }`. Running `NODE_ENV=staging npm run seed` fails with ENOENT. Workaround: run `NODE_ENV=development npm run seed`. Should be fixed for reliability.

**Files involved:**
- `infra/ecosystem.config.cjs` — missing `CORS_ORIGIN` in backend env block (primary fix)
- `backend/src/index.js` — ESM dotenv hoisting root cause (secondary fix for robustness)
- `backend/src/config/knexfile.js` — missing seeds config in staging block (minor fix)

---

## Monitor Alert — Sprint #22 — 2026-03-10T21:25:00Z

| Field | Value |
|-------|-------|
| **Category** | Monitor Alert |
| **Severity** | Critical |
| **Sprint** | 22 |
| **Status** | Resolved |
| **Related Task** | T-200 |

**Feedback:** Staging Vite proxy ECONNREFUSED — browser-based API calls fail; 3/4 Playwright E2E tests fail.

**Details:**

The `triplanner-frontend` pm2 process runs `npm run preview` without the environment variables required for staging (`BACKEND_PORT=3001`, `BACKEND_SSL=true`). Vite's dev proxy defaults to `http://localhost:3000`. The staging backend runs on `https://localhost:3001`. Every browser-initiated API call (register, login, trips, etc.) results in:

```
[vite] http proxy error: /api/v1/auth/register — AggregateError [ECONNREFUSED]
[vite] http proxy error: /api/v1/auth/refresh — AggregateError [ECONNREFUSED]
```

**Impact:**
- All 3 user-flow Playwright tests fail (Tests 1, 2, 3 — register → redirect to "/" timeout)
- User Agent (T-201) CANNOT proceed — staging is not usable for browser testing
- Direct API calls (curl) work correctly; only browser flows are broken

**Required Fix:**
1. Update `infra/ecosystem.config.cjs` to include the `triplanner-frontend` app with:
   ```
   env: { BACKEND_PORT: '3001', BACKEND_SSL: 'true' }
   ```
   OR add `preview.proxy` to `frontend/vite.config.js` for the staging environment.
2. Restart pm2 frontend process with the corrected env.
3. Rerun `npx playwright test` — expect 4/4 PASS.

**Files involved:**
- `infra/ecosystem.config.cjs` — missing frontend app definition (primary fix)
- `frontend/vite.config.js` — `preview.proxy` not configured (alternative fix)

---

### FB-112 — Production hosting decision lost — re-submit from Sprint 17

| Field | Value |
|-------|-------|
| Feedback | Production hosting decision (Render + AWS RDS) was made in Sprint 17 (FB-109, FB-110, FB-111) but never triaged into sprint tasks; B-022 incorrectly blocked for 8 sprints |
| Sprint | 25 |
| Category | Feature Gap |
| Severity | Critical |
| Status | Tasked |
| Related Task | B-022 |
| Tasked As | T-220, T-221, T-222, T-223, T-224, T-225 (Sprint 26) |

**Description:** The project owner made a clear production hosting decision during Sprint 17, recorded as FB-109, FB-110, and FB-111 in the feedback log (now archived to `feedback-log-before-sprint-18.md`). The Manager Agent failed to triage these entries into actionable T-xxx tasks during the Sprint 17→18 closeout. Once the feedback log was archived, the decision was lost, and every subsequent sprint has incorrectly listed B-022 as "pending project owner decision."

**The decision (re-stated):**

- **Frontend:** Render free tier — static site, region: Ohio
- **Backend:** Render free tier — web service, runtime: node, region: Ohio
- **Database:** AWS RDS free tier — us-east-1 (N. Virginia), engine: PostgreSQL 15+, instance class: db.t3.micro

**Three critical implementation requirements:**

1. **Knexfile production config (from FB-109):** Add SSL configuration and free-tier connection pool sizing for AWS RDS to `backend/knexfile.js`. AWS RDS requires `ssl: { rejectUnauthorized: false }` (or proper CA cert). Free-tier pool size should be conservative (max 5 connections for db.t3.micro).

2. **Cookie SameSite fix (from FB-110):** Set cookie `SameSite` to `none` and `Secure` to `true` in production. On Render free tier, frontend and backend will be on different subdomains (e.g., `triplanner-frontend.onrender.com` and `triplanner-backend.onrender.com`), making this a cross-origin deployment. Without `SameSite=none`, refresh token cookies will not be sent, and auth will be completely broken.

3. **render.yaml blueprint + deploy guide (from FB-111):** Create `render.yaml` infrastructure-as-code file defining both services (frontend static site + backend web service, both Ohio region, free plan). Create a production deploy guide covering: Render service setup, AWS RDS instance creation, environment variable configuration, database migration, DNS/domain setup, and post-deploy verification checklist.

**Manager Triage (Sprint 25 → Sprint 26):** Tasks T-220 through T-225 created. B-022 is no longer listed as "pending project owner decision" — it is blocked on engineering work (T-220/T-221/T-222) that must complete before T-224 (production deploy) can run.

---

## Monitor Alert — Sprint #25 — 2026-03-10T23:10:00Z

| Field | Value |
|-------|-------|
| **Category** | Monitor Alert |
| **Severity** | Major |
| **Sprint** | 25 |
| **Status** | Tasked |
| **Related Task** | T-216 |
| **Tasked As** | T-218 (immediate Playwright rerun), T-226 (engineering fix — Sprint 26) |

**Feedback:** Playwright E2E Tests 1/4 PASS — Registration rate limiter exhausted during health check; browser-based user flows blocked.

**Details:**

During the T-216 Sprint 25 health check, all API endpoint checks, config consistency checks, and regression checks passed. However, `npx playwright test` produced **1/4 PASS** (Tests 1, 2, 3 FAIL; Test 4 PASS).

**Failure mode:** All three failing tests call `registerNewUser()` and wait for `page.waitForURL('/')` after submitting the registration form. The Playwright error-context snapshot shows the register page displays:

```
alert: "too many registration attempts. please try again in 56 minutes."
button: "please wait…" [disabled]
```

**Root cause:** The Monitor Agent's health check included a `POST /api/v1/auth/register` curl call to obtain a Bearer token for testing protected endpoints. This consumed rate limit quota for the `localhost` IP. When Playwright subsequently attempted browser-based registration (3 tests × register attempt = 3 registration requests), the rate limiter blocked all of them with HTTP 429.

**Confirmed NOT a regression:**
- Vite proxy correctly routes to `https://localhost:3001` (BACKEND_PORT=3001, BACKEND_SSL=true confirmed in ecosystem.config.cjs and in running process env)
- No ECONNREFUSED errors appeared in frontend pm2 logs during the Playwright run
- Direct API registration via curl succeeds (HTTP 201)
- Test 4 (rate limit lockout) passes, confirming the application correctly enforces limits

**Structural issue:** The Monitor Agent health check protocol (register a user via curl to obtain a token for API testing) consumes rate limit quota before Playwright runs. If Playwright is run immediately after, the combined registration count hits the rate limit window.

**Recommended fixes (in priority order):**
1. **Immediate (unblock T-217):** Deploy Engineer restart backend (`pm2 restart triplanner-backend`) to clear in-memory rate limit state → re-run `npx playwright test` → expect 4/4 PASS.
2. **Process fix:** Monitor Agent should use `POST /api/v1/auth/login` (with an existing test account) rather than `POST /api/v1/auth/register` to obtain a Bearer token during health checks.
3. **Engineering fix (future sprint):** Add a higher rate limit (or whitelist) for `127.0.0.1`/`::1` when `NODE_ENV=staging`, or use a persistent seeded test user for E2E/monitor testing.

**Files involved:**
- `infra/ecosystem.config.cjs` — rate limit state held in pm2 process memory; restart clears it
- Backend rate limiter middleware (registration endpoint)

**Action required:** Deploy Engineer to restart `triplanner-backend` (`pm2 restart triplanner-backend`) and re-run `npx playwright test` before handing off to User Agent (T-217).

---


### FB-112 — Production hosting decision lost — re-submit from Sprint 17 (DUPLICATE — see first entry above)

| Field | Value |
|-------|-------|
| Feedback | Duplicate of FB-112 above — Production hosting decision (Render + AWS RDS) |
| Sprint | 25 |
| Category | Feature Gap |
| Severity | Critical |
| Status | Tasked |
| Related Task | B-022 |
| Tasked As | T-220, T-221, T-222, T-223, T-224, T-225 (Sprint 26) — see primary FB-112 entry above |

**Manager Triage:** Duplicate entry. Dispositioned identically to primary FB-112 entry above. Tasks T-220–T-225 created for Sprint 26.

---

## Sprint 35 — User Agent Feedback (T-277)

**Date:** 2026-03-23
**Tested by:** User Agent
**Environment:** Staging (PM2) — Backend https://localhost:3001, Frontend http://localhost:4173
**Scope:** T-272 (server-side XSS sanitization), T-273 (calendar "+x more" click-to-expand), regression checks

---

### FB-171 — XSS sanitization works correctly on trip name (script tags stripped, text preserved)

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with `name: "<script>alert(1)</script>"` correctly returns `name: "alert(1)"` — script tags stripped, text content preserved |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST /api/v1/trips with `name: "<script>alert(1)</script>"`. Expected: tags stripped. Actual: `"alert(1)"` — correct.

---

### FB-172 — XSS sanitization works on destinations array (array elements sanitized individually)

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with `destinations: ["<b>Tokyo</b>", "<img src=x onerror=alert(1)>"]` correctly returns `["Tokyo", ""]` |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST with HTML in destinations array. Expected: tags stripped per element. Actual: `["Tokyo", ""]` — correct per API contract.

---

### FB-173 — Unicode and emoji preservation confirmed

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with `name: "東京旅行 🗼"` and `destinations: ["東京", "大阪"]` returned values unchanged |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST with Japanese text and emoji. Expected: preserved exactly. Actual: preserved — correct.

---

### FB-174 — Special characters (ampersands, quotes, apostrophes) preserved correctly

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with `name: "Tom & Jerry's \"Excellent\" Trip"` returned unchanged |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST with ampersands, quotes, apostrophes. Expected: preserved. Actual: preserved — correct.

---

### FB-175 — Nested/obfuscated XSS stripped correctly (div+script, javascript: href)

| Field | Value |
|-------|-------|
| Feedback | `<div><script>alert(1)</script></div>` → `"alert(1)"`, `<a href="javascript:alert(1)">click</a>` → `"click"` |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST with nested tags and javascript: hrefs. Expected: all HTML stripped, text content preserved. Actual: correct.

---

### FB-176 — Notes field sanitization works (iframe stripped)

| Field | Value |
|-------|-------|
| Feedback | PATCH /api/v1/trips/:id with `notes: "<iframe src=evil.com></iframe> My notes"` returned `notes: " My notes"` — iframe stripped, text preserved |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** PATCH trip with iframe in notes. Expected: iframe stripped. Actual: `" My notes"` with leading space — correct (space was between the tags and the text content).

---

### FB-177 — XSS sanitization works on all sub-resource fields (flights, stays, activities, land-travel)

| Field | Value |
|-------|-------|
| Feedback | All 4 sub-resource types correctly strip HTML from sanitized fields: flights (airline, from_location, to_location, flight_number), stays (name, address), activities (name, location), land-travel (provider, from_location, to_location) |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST to each sub-resource endpoint with `<script>`, `<b>`, `<img onerror>`, `<a href=javascript:>` payloads. Expected: all HTML stripped. Actual: all HTML stripped correctly across all 4 sub-resource types.

---

### FB-178 — SVG XSS sanitization allows empty name via PATCH

| Field | Value |
|-------|-------|
| Feedback | PATCH /api/v1/trips/:id with `name: "<svg onload=alert(1)>"` sanitizes to empty string `""` — name becomes blank. Sanitization is correct (XSS blocked), but the resulting empty name bypasses the "name is required" validation on PATCH. |
| Sprint | 35 |
| Category | Bug |
| Severity | Minor |
| Status | Acknowledged |
| Tasked As | B-035 (Backlog — post-sanitization validation for required fields) |

**Steps:** PATCH trip with `{"name": "<svg onload=alert(1)>"}`. Expected: XSS stripped (correct), but ideally a 400 validation error since the sanitized result is empty. Actual: 200 OK, name stored as `""`. The trip now has an empty name.

**Note:** This is a defense-in-depth edge case. The sanitization itself works correctly — the XSS is blocked. The issue is that post-sanitization validation doesn't re-check required field constraints. Low risk since it requires a malicious input pattern.

---

### FB-179 — Angle brackets in non-tag context correctly preserved

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with `name: "5 < 10 & 10 > 5"` returned unchanged |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST with mathematical angle brackets. Expected: preserved (not valid HTML tags). Actual: `"5 < 10 & 10 > 5"` — correct.

---

### FB-180 — Auth register name field sanitized

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/auth/register with `name: "<script>alert(1)</script>"` returns `name: "alert(1)"` — sanitization applied to auth endpoint |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

---

### FB-181 — Validation errors return proper 400 status (empty inputs)

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with empty name and destinations returns 400 VALIDATION_ERROR with field-level messages |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Steps:** POST with `{"name":"","destinations":[],"start_date":"","end_date":"","timezone":""}`. Expected: 400 validation error. Actual: 400 with `"name": "Trip name is required", "destinations": "At least one destination is required"` — correct.

---

### FB-182 — Auth enforcement working (missing token, invalid token, cross-user access)

| Field | Value |
|-------|-------|
| Feedback | Missing auth token returns 401 UNAUTHORIZED, invalid token returns 401, accessing another user's trip returns 403 FORBIDDEN |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

---

### FB-183 — SQL injection attempt safely handled

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with `name: "Robert'); DROP TABLE trips;--"` stored and returned literally — parameterized queries prevent injection |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

---

### FB-184 — Long string validation works (5000 chars rejected)

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with 5000-character name returns 400 VALIDATION_ERROR: "name must be at most 255 characters" |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

---

### FB-185 — Calendar "+x more" click-to-expand implementation looks solid (code review)

| Field | Value |
|-------|-------|
| Feedback | TripCalendar.jsx implements the +x more click-to-expand per Spec 29: semantic `<button>` with aria-expanded/aria-haspopup/aria-label, role="dialog" popover, dismiss on click-outside/Escape/month-nav/resize, focus management (first pill focused on open, trigger refocused on Escape), 150ms ease animation, mobile responsive via min(280px, calc(100vw-32px)) |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Details:** Reviewed TripCalendar.jsx lines 317-876 and TripCalendar.module.css lines 300-399. All Spec 29 requirements implemented: trigger is a `<button>` (not `<span>`), popover rendered outside grid to avoid overflow:hidden clipping, above/below placement based on cell row position, scrollbar styling, header with day label + separator + event count, event pills reuse the same pill component. Keyboard accessibility: Escape closes and restores focus. Animation: 150ms ease opacity transition per design principles. CSS follows Japandi design language with var(--surface), var(--border-subtle), var(--font-mono), 11px uppercase labels.

---

### FB-186 — Frontend tests pass with zero regressions (510/510)

| Field | Value |
|-------|-------|
| Feedback | All 510 frontend tests pass (501 existing + 9 new T-273 calendar overflow tests) |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

**Details:** Tests cover: 29.A (overflow trigger renders as button with correct aria), 29.B (click opens popover with role=dialog), 29.C (correct day label and event count), 29.D (pill click scrolls to section), 29.E (click outside closes), 29.F (Escape closes), 29.H (month nav closes), 29.I (Enter on trigger opens), 29.K (no trigger when ≤3 events). One minor React act() warning in test 29.I — non-blocking.

---

### FB-187 — Backend tests pass with zero regressions (446/446)

| Field | Value |
|-------|-------|
| Feedback | All 446 backend tests pass (410 existing + 36 new T-272 sanitization tests) |
| Sprint | 35 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |

---

### FB-188 — Frontend title shows "Plant Guardians" instead of "Triplanner"

| Field | Value |
|-------|-------|
| Feedback | The frontend index.html `<title>` tag shows "Plant Guardians" instead of "Triplanner" |
| Sprint | 35 |
| Category | Bug |
| Severity | Minor |
| Status | Tasked |
| Tasked As | T-279 (Sprint 36 — fix page title and font references) |

**Steps:** Visit http://localhost:4173 and check the page title. Expected: "Triplanner" or similar. Actual: "Plant Guardians". Also loads Google Fonts for "DM Sans" and "Playfair Display" instead of "IBM Plex Mono" per design context.

**Note:** This appears to be a long-standing issue, not a Sprint 35 regression. Flagging for awareness.

---

### FB-189 — Show checkout time for stays on calendar view

| Field | Value |
|-------|-------|
| Feedback | Stay events on the calendar should display the checkout time on the end date |
| Sprint | 35 |
| Category | UX Issue |
| Severity | Minor |
| Status | New |
| Related Task | — |

**Description:** Currently, stay events on the calendar view span from check-in to check-out date but do not display the checkout time on the final day. Similar to how FLIGHT end days show "Arrives {time}" and LAND_TRAVEL end days show "Arrives/Drop-off {time}", the STAY end day should display the checkout time (e.g., "Checkout 11:00a"). This gives users a clear view of when they need to leave their accommodation without having to click into the stay details. The implementation should follow the existing pattern used for FLIGHT and LAND_TRAVEL end-day labels in both the desktop calendar grid (`renderEventPill`) and the mobile day list (`MobileDayList`).

---

### FB-190 — Add dark/light mode toggle button in navbar

| Field | Value |
|-------|-------|
| Feedback | Add a theme toggle button in the navbar to switch between dark mode and light mode |
| Sprint | 35 |
| Category | Feature Gap |
| Severity | Suggestion |
| Status | New |
| Related Task | — |

**Description:** Add a toggle button in the navbar, positioned on the right side to the left of the user name. The button should switch between dark mode and light mode. Dark mode should be the default. The toggle should persist the user's preference (e.g., via `localStorage`) so it survives page reloads. This will require: (1) a theme context/provider that manages the current theme state and exposes a toggle function, (2) CSS variables or a class-based approach (e.g., `data-theme="light"` on `<html>`) to swap the color palette, (3) a light mode palette that complements the existing dark Japandi aesthetic — muted warm tones, keeping the same design principles (no gradients, no shadows, borders only), (4) the toggle button itself with an appropriate icon (e.g., sun/moon) styled consistently with the existing navbar elements. The current dark palette (`#02111B` bg, `#30292F` surface, `#3F4045` surface-alt, `#5D737E` accent, `#FCFCFC` text) should remain the default. The light palette should invert appropriately while maintaining the calm, minimal Japandi feel.

---


### FB-189 — Show checkout time for stays on calendar view

| Field | Value |
|-------|-------|
| Feedback | Stay events on the calendar should display the checkout time on the end date |
| Sprint | 35 |
| Category | UX Issue |
| Severity | Minor |
| Status | New |
| Related Task | — |

**Description:** Currently, stay events on the calendar view span from check-in to check-out date but do not display the checkout time on the final day. Similar to how FLIGHT end days show "Arrives {time}" and LAND_TRAVEL end days show "Arrives/Drop-off {time}", the STAY end day should display the checkout time (e.g., "Checkout 11:00a"). This gives users a clear view of when they need to leave their accommodation without having to click into the stay details. The implementation should follow the existing pattern used for FLIGHT and LAND_TRAVEL end-day labels in both the desktop calendar grid (`renderEventPill`) and the mobile day list (`MobileDayList`).

---
### FB-190 — Add dark/light mode toggle button in navbar

| Field | Value |
|-------|-------|
| Feedback | Add a theme toggle button in the navbar to switch between dark mode and light mode |
| Sprint | 35 |
| Category | Feature Gap |
| Severity | Suggestion |
| Status | New |
| Related Task | — |

**Description:** Add a toggle button in the navbar, positioned on the right side to the left of the user name. The button should switch between dark mode and light mode. Dark mode should be the default. The toggle should persist the user's preference (e.g., via `localStorage`) so it survives page reloads. This will require: (1) a theme context/provider that manages the current theme state and exposes a toggle function, (2) CSS variables or a class-based approach (e.g., `data-theme="light"` on `<html>`) to swap the color palette, (3) a light mode palette that complements the existing dark Japandi aesthetic — muted warm tones, keeping the same design principles (no gradients, no shadows, borders only), (4) the toggle button itself with an appropriate icon (e.g., sun/moon) styled consistently with the existing navbar elements. The current dark palette (`#02111B` bg, `#30292F` surface, `#3F4045` surface-alt, `#5D737E` accent, `#FCFCFC` text) should remain the default. The light palette should invert appropriately while maintaining the calm, minimal Japandi feel.

---

### FB-189 — Show checkout time for stays on calendar view

| Field | Value |
|-------|-------|
| Feedback | Stay events on the calendar should display the checkout time on the end date |
| Sprint | 35 |
| Category | UX Issue |
| Severity | Minor |
| Status | New |
| Related Task | — |

**Description:** Currently, stay events on the calendar view span from check-in to check-out date but do not display the checkout time on the final day. Similar to how FLIGHT end days show "Arrives {time}" and LAND_TRAVEL end days show "Arrives/Drop-off {time}", the STAY end day should display the checkout time (e.g., "Checkout 11:00a"). This gives users a clear view of when they need to leave their accommodation without having to click into the stay details. The implementation should follow the existing pattern used for FLIGHT and LAND_TRAVEL end-day labels in both the desktop calendar grid (`renderEventPill`) and the mobile day list (`MobileDayList`).

---
### FB-190 — Add dark/light mode toggle button in navbar

| Field | Value |
|-------|-------|
| Feedback | Add a theme toggle button in the navbar to switch between dark mode and light mode |
| Sprint | 35 |
| Category | Feature Gap |
| Severity | Suggestion |
| Status | New |
| Related Task | — |

**Description:** Add a toggle button in the navbar, positioned on the right side to the left of the user name. The button should switch between dark mode and light mode. Dark mode should be the default. The toggle should persist the user's preference (e.g., via `localStorage`) so it survives page reloads. This will require: (1) a theme context/provider that manages the current theme state and exposes a toggle function, (2) CSS variables or a class-based approach (e.g., `data-theme="light"` on `<html>`) to swap the color palette, (3) a light mode palette that complements the existing dark Japandi aesthetic — muted warm tones, keeping the same design principles (no gradients, no shadows, borders only), (4) the toggle button itself with an appropriate icon (e.g., sun/moon) styled consistently with the existing navbar elements. The current dark palette (`#02111B` bg, `#30292F` surface, `#3F4045` surface-alt, `#5D737E` accent, `#FCFCFC` text) should remain the default. The light palette should invert appropriately while maintaining the calm, minimal Japandi feel.

---
### FB-189 — Show checkout time for stays on calendar view

| Field | Value |
|-------|-------|
| Feedback | Stay events on the calendar should display the checkout time on the end date |
| Sprint | 35 |
| Category | UX Issue |
| Severity | Minor |
| Status | New |
| Related Task | — |

**Description:** Currently, stay events on the calendar view span from check-in to check-out date but do not display the checkout time on the final day. Similar to how FLIGHT end days show "Arrives {time}" and LAND_TRAVEL end days show "Arrives/Drop-off {time}", the STAY end day should display the checkout time (e.g., "Checkout 11:00a"). This gives users a clear view of when they need to leave their accommodation without having to click into the stay details. The implementation should follow the existing pattern used for FLIGHT and LAND_TRAVEL end-day labels in both the desktop calendar grid (`renderEventPill`) and the mobile day list (`MobileDayList`).

---
### FB-190 — Add dark/light mode toggle button in navbar

| Field | Value |
|-------|-------|
| Feedback | Add a theme toggle button in the navbar to switch between dark mode and light mode |
| Sprint | 35 |
| Category | Feature Gap |
| Severity | Suggestion |
| Status | New |
| Related Task | — |

**Description:** Add a toggle button in the navbar, positioned on the right side to the left of the user name. The button should switch between dark mode and light mode. Dark mode should be the default. The toggle should persist the user's preference (e.g., via `localStorage`) so it survives page reloads. This will require: (1) a theme context/provider that manages the current theme state and exposes a toggle function, (2) CSS variables or a class-based approach (e.g., `data-theme="light"` on `<html>`) to swap the color palette, (3) a light mode palette that complements the existing dark Japandi aesthetic — muted warm tones, keeping the same design principles (no gradients, no shadows, borders only), (4) the toggle button itself with an appropriate icon (e.g., sun/moon) styled consistently with the existing navbar elements. The current dark palette (`#02111B` bg, `#30292F` surface, `#3F4045` surface-alt, `#5D737E` accent, `#FCFCFC` text) should remain the default. The light palette should invert appropriately while maintaining the calm, minimal Japandi feel.

---

## Sprint #36 User Agent Feedback — 2026-03-24

### FB-191 — Nested/obfuscated XSS bypass in sanitizer

| Field | Value |
|-------|-------|
| Feedback | Nested HTML tags bypass the sanitizer, resulting in stored XSS payload |
| Sprint | 36 |
| Category | Security |
| Severity | Major |
| Status | Tasked |
| Related Task | T-278 / T-272 |
| Tasked As | T-286 (Sprint 37 — fix nested XSS bypass with iterative sanitization) |

**Description:** `POST /api/v1/trips` with `name: "<<script>script>alert(1)<</script>/script>"` — the sanitizer strips the outer tags in one pass, but the remaining text reassembles into `<script>alert(1)</script>`, which is stored in the database. Expected: after sanitization, no valid HTML tags remain. Actual: the stored value is `<script>alert(1)</script>`. While React's JSX auto-escaping prevents client-side exploitation, this violates the defense-in-depth contract (T-272) which states all HTML tags should be stripped from stored values. Fix: run the sanitizer in a loop until no tags remain, or use a proper HTML parser instead of a single-pass regex strip.

**Steps to reproduce:**
1. `POST /api/v1/trips` with body `{"name":"<<script>script>alert(1)<</script>/script>","start_date":"2026-04-01","end_date":"2026-04-10","destinations":["Tokyo"]}`
2. Observe the response: `"name":"<script>alert(1)</script>"`
3. The stored name contains a full `<script>` tag

---

### FB-192 — Post-sanitization validation correctly rejects all-HTML required fields

| Field | Value |
|-------|-------|
| Feedback | T-278 working as designed — all-HTML trip names are rejected with 400 |
| Sprint | 36 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-278 |

**Description:** `POST /api/v1/trips` with `name: "<svg onload=alert(1)>"` correctly returns `400 VALIDATION_ERROR` with `{"fields":{"name":"Trip name is required"}}`. The sanitizer strips the tag to empty string, and the post-sanitization validation catches it. `PATCH /api/v1/trips/:id` with `name: "<svg onload=alert(1)>"` also correctly returns `400 VALIDATION_ERROR` with `{"fields":{"name":"name must be at least 1 characters"}}`. Non-required fields (notes) correctly accept empty-after-sanitization values. Register with all-HTML name also returns `400 VALIDATION_ERROR` with `"Name is required"`.

---

### FB-193 — Page title and font branding fix confirmed

| Field | Value |
|-------|-------|
| Feedback | T-279 working as designed — page title is "triplanner", IBM Plex Mono is the only font loaded |
| Sprint | 36 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-279 |

**Description:** `<title>triplanner</title>` confirmed in both the source `index.html` and the served build output. `<meta name="description">` correctly references trip planning, not "Plant Guardians". CSS imports `IBM Plex Mono` from Google Fonts. No references to "DM Sans" or "Playfair Display" found in the built CSS or HTML. Theme color `#02111B` correctly set.

---

### FB-194 — XSS sanitization working across all models

| Field | Value |
|-------|-------|
| Feedback | HTML tags stripped from flights, stays, activities — sanitization defense-in-depth working |
| Sprint | 36 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-272 |

**Description:** Tested XSS sanitization across multiple models:
- **Flights:** `airline: "<img src=x>"` sanitized to empty, correctly rejected with 400 (required field). `flight_number: "<script>alert(1)</script>"` sanitized to `"alert(1)"` — text preserved, tags stripped.
- **Stays:** `name: "<div onmouseover=alert(1)>Hotel</div>"` stored as `"Hotel"` — tags stripped, text preserved.
- **Activities:** `location: "<script>alert(1)</script>"` stored as `"alert(1)"`. `name: "<marquee>Bad Activity</marquee>"` stored as `"Bad Activity"`.
- **Notes (non-required):** `notes: "<b>Some bold notes</b>"` stored as `"Some bold notes"` — tags stripped, no validation error.

---

### FB-195 — Auth edge cases handled correctly

| Field | Value |
|-------|-------|
| Feedback | Authentication and registration validation is solid |
| Sprint | 36 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | — |

**Description:** All auth edge cases return appropriate errors:
- No token: `401 UNAUTHORIZED` — "Authentication required"
- Invalid token: `401 UNAUTHORIZED` — "Invalid or expired token"
- Wrong password: `401 INVALID_CREDENTIALS` — "Incorrect email or password"
- Empty email: `400 VALIDATION_ERROR` — "Email is required"
- Empty password: `400 VALIDATION_ERROR` — "Password is required"
- Duplicate email: `409 EMAIL_TAKEN` — "An account with this email already exists"
- All-HTML name on register: `400 VALIDATION_ERROR` — "Name is required" (post-sanitization)

---

### FB-196 — Input validation edge cases handled well

| Field | Value |
|-------|-------|
| Feedback | Long strings, type mismatches, special characters all validated correctly |
| Sprint | 36 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | — |

**Description:** Edge case validation is solid:
- Long name (1000 chars): `400 VALIDATION_ERROR` — "name must be at most 255 characters"
- Number where string expected: `400 VALIDATION_ERROR` — "name must be a string"
- Whitespace-only name: `400 VALIDATION_ERROR` — "Trip name is required"
- Missing required fields: rejected with appropriate messages
- SQL injection `"Tokyo; DROP TABLE trips;--"`: stored as literal string (parameterized queries working)
- Emoji and special chars: `"Trip with émojis 🗼 & spëcial chars"` stored and returned correctly

---

### FB-197 — CRUD operations working end-to-end

| Field | Value |
|-------|-------|
| Feedback | Full trip lifecycle (create, read, list, update, delete) works correctly |
| Sprint | 36 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | — |

**Description:** Complete CRUD regression check passed:
- `POST /api/v1/trips`: creates trip, returns full object with UUID, timestamps, PLANNING status
- `GET /api/v1/trips`: lists trips with pagination (`page`, `limit`, `total`)
- `GET /api/v1/trips/:id`: returns single trip with all fields
- `PATCH /api/v1/trips/:id`: updates fields, returns updated object with new `updated_at`
- `DELETE /api/v1/trips/:id`: returns empty response (success)
- Sub-resources: flights, stays, activities create/list/get all work correctly
- Not found: nonexistent trip (valid UUID) returns `404 NOT_FOUND`; malformed UUID returns `400 VALIDATION_ERROR`

---

### FB-198 — Calendar "+x more" click-to-expand implementation confirmed

| Field | Value |
|-------|-------|
| Feedback | Calendar overflow popover code (T-273) is properly implemented |
| Sprint | 36 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-273 |

**Description:** Code review of `TripCalendar.jsx` confirms the "+x more" click-to-expand feature (T-273) is properly implemented: `expandedDay` state tracks open popover, click-outside/Escape/resize handlers close it, dynamic positioning (above/below), `aria-expanded` for accessibility, popover rendered outside grid to avoid clipping, all events listed with count header.

---

### FB-199 — Activity notes field silently dropped

| Field | Value |
|-------|-------|
| Feedback | Activity notes sent in POST request but not returned in response |
| Sprint | 36 |
| Category | Bug |
| Severity | Minor |
| Status | Acknowledged |
| Related Task | — |

**Description:** `POST /api/v1/trips/:id/activities` with `notes: "Visit note"` — response includes `name`, `location`, `activity_date`, `start_time`, `end_time`, `created_at`, `updated_at` but no `notes` field. Either the activity schema doesn't support notes (field silently ignored), or it's stored but not serialized in the response. Worth documenting or fixing for consistency since trips and other models support notes.

---

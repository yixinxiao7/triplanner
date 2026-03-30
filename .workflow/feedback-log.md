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

## User Agent — Sprint #39 Staging Walkthrough (T-304) — 2026-03-30

> **Scope:** Sprint 39 delivers trip notes/description field (B-030) and triple-nested XSS sanitizer hardening (B-037). Testing performed on staging environment at `https://localhost:3001` (backend) and `https://localhost:4173` (frontend). Monitor Agent confirmed Deploy Verified = Yes (T-303).

---

### FB-224 — Trip notes: create trip with notes works correctly

| Field | Value |
|-------|-------|
| Feedback | POST /api/v1/trips with `notes` field creates trip and returns notes in response |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-299 |
| Details | Created a trip with `{"name":"Tokyo Adventure","destinations":"Tokyo, Osaka","start_date":"2026-08-07","end_date":"2026-08-21","notes":"Pack light, remember passport. Book Narita Express."}`. Response: 201 with `notes` field correctly populated. The `notes` field is also correctly returned as `null` when omitted from POST body. |

---

### FB-225 — Trip notes: GET endpoints return notes field

| Field | Value |
|-------|-------|
| Feedback | Both GET /api/v1/trips and GET /api/v1/trips/:id include `notes` field in response |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-299 |
| Details | GET list endpoint returns `notes` in every trip object. GET detail endpoint returns `notes`. Trips without notes return `notes: null`. Consistent with API contract. |

---

### FB-226 — Trip notes: PATCH update and clear work correctly

| Field | Value |
|-------|-------|
| Feedback | PATCH /api/v1/trips/:id correctly updates, clears (null), and normalizes (empty string → null) notes |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-299 |
| Details | Tested: (1) PATCH with new notes text → 200 with updated notes, `updated_at` changed. (2) PATCH with `notes: null` → 200 with `notes: null`. (3) PATCH with `notes: ""` → 200 with `notes: null` (empty string normalized to null). All three behaviors match API contract. |

---

### FB-227 — XSS sanitization on notes field works correctly

| Field | Value |
|-------|-------|
| Feedback | Script tags, event handlers, and HTML tags are properly stripped from notes |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-296, T-299 |
| Details | Tested: (1) `<script>alert("xss")</script>normal text` → stored as `alert("xss")normal text` (tags stripped). (2) `<img src=x onerror=alert(1)>test` → stored as `test` (full tag removed). (3) SQL injection `Robert'); DROP TABLE trips;--` → stored verbatim (parameterized queries protect). All sanitization working as expected. |

---

### FB-228 — Triple-nested XSS fix verified (T-296)

| Field | Value |
|-------|-------|
| Feedback | Triple-nested XSS patterns `<<<script>script>script>` produce clean output with no residual fragments |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-296 |
| Details | Sent `<<<script>script>script>alert(1)<<<\/script>\/script>\/script>` via PATCH notes. Result: `alert(1)` — all nested script tags and residual angle bracket fragments completely stripped. This resolves the FB-221/B-037 issue from Sprint 38. |

---

### FB-229 — Legitimate angle brackets preserved in notes

| Field | Value |
|-------|-------|
| Feedback | Math expressions and comparison operators with angle brackets are not stripped by sanitizer |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-296 |
| Details | Sent `Budget should be < 5000 EUR and > 3000 EUR. Math: 3 < 5.` via PATCH notes. Result: exact same string returned — no false positives. Sanitizer correctly distinguishes HTML tags from legitimate angle bracket usage. |

---

### FB-230 — Notes character limit enforced at 5000 (backend + frontend consistent)

| Field | Value |
|-------|-------|
| Feedback | Backend rejects notes > 5000 chars; frontend maxLength set to 5000; boundary values work correctly |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-298, T-299, T-300 |
| Details | Tested boundary: 2000 chars ✅ accepted, 2001 chars ✅ accepted, 4999 chars ✅ accepted, 5000 chars ✅ accepted, 5001 chars ✅ rejected (400 VALIDATION_ERROR: "Notes must not exceed 5000 characters"). Frontend textarea has `maxLength={5000}` with char counter. Backend and frontend limits are consistent at 5000 per Sprint 39 T-298 contract update (increased from Sprint 7's 2000). |

---

### FB-231 — Notes type validation rejects non-string types

| Field | Value |
|-------|-------|
| Feedback | Sending number, boolean, or array as notes returns proper 400 validation error |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-299 |
| Details | Tested: `{"notes":12345}` → 400 "notes must be a string". `{"notes":true}` → 400 "notes must be a string". `{"notes":["a","b"]}` → 400 "notes must be a string". All return proper VALIDATION_ERROR with clear field-level messages. |

---

### FB-232 — Auth protection working on notes endpoint

| Field | Value |
|-------|-------|
| Feedback | PATCH trips without token or with invalid token returns proper 401 |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-299 |
| Details | No auth header → 401 "Authentication required". Invalid token → 401 "Invalid or expired token". Regression check: auth protection is intact. |

---

### FB-233 — Unicode, emoji, and multi-line notes preserved correctly

| Field | Value |
|-------|-------|
| Feedback | Notes with international characters, emoji, and newlines stored and retrieved without data loss |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-299 |
| Details | Tested: `Café ☕ résumé naïve 日本語 🇯🇵 中文 العربية` → returned exactly as sent. Multi-line notes with `\n` characters → preserved as-is. No encoding issues. |

---

### FB-234 — Frontend TripNotesSection component well-implemented

| Field | Value |
|-------|-------|
| Feedback | Notes component implements all required states: view, edit, empty, loading, saving, error |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-300 |
| Details | Code review of TripNotesSection.jsx confirms: (1) View mode shows notes text as clickable to edit, (2) Empty state shows italic placeholder "Add notes about this trip…", (3) Edit mode has textarea with char counter (current/5000), Save/Cancel buttons, (4) Keyboard: Escape cancels, Ctrl/Cmd+Enter saves, (5) Loading skeleton state, (6) "NOTES — SAVED" feedback shown for 1.5s after save, (7) Error state with role="alert", (8) Skip API call if notes unchanged (optimization), (9) Focus management: textarea auto-focuses on edit, focus returns to pencil on save/cancel. Well-architected. |

---

### FB-235 — Frontend notes styling follows Japandi design system

| Field | Value |
|-------|-------|
| Feedback | CSS module uses correct design tokens, 150ms transitions, 2px/4px radius, responsive breakpoints |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-300 |
| Details | TripNotesSection.module.css review: IBM Plex Mono font, var(--surface-alt) textarea background, 1px border-subtle borders, 150ms ease transitions, prefers-reduced-motion support, responsive breakpoints at 767px and 359px (stacks buttons vertically on very small screens). Focus-visible outlines with 2px accent border. Consistent with established design system. |

---

### FB-236 — Regression check: existing trip CRUD still works

| Field | Value |
|-------|-------|
| Feedback | Trip create, read, update, delete all work correctly; notes field coexists without regressions |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-304 |
| Details | Tested: (1) PATCH trip name and destinations → 200, fields updated, notes preserved. (2) GET trips list → pagination works, notes included. (3) DELETE trip → 204. (4) Health endpoint → 200 `{"status":"ok"}`. (5) Frontend serving at https://localhost:4173 → 200. No regressions detected. |

---

### FB-237 — API contract documentation inconsistency: old Sprint 7/8/20 sections still say max 2000

| Field | Value |
|-------|-------|
| Feedback | Sprint 39 T-298 correctly documents the 2000→5000 increase, but earlier Sprint 7/8/20 contract sections still reference "max 2000" |
| Sprint | 39 |
| Category | UX Issue |
| Severity | Minor |
| Status | New |
| Related Task | T-298 |
| Details | The Sprint 39 contract section in api-contracts.md correctly documents the limit increase to 5000. However, the original Sprint 7 section still says "The API enforces a 2000-character maximum" and Sprint 8/20 sections reference "Max length 2000". While the Sprint 39 section takes precedence and the implementation is correct at 5000, anyone reading the older sections could be confused. Suggestion: add a deprecation note or update the older sections to reference the Sprint 39 change. Not blocking — the authoritative section is correct. |

---

### FB-238 — Notes section correctly placed in TripDetailsPage layout

| Field | Value |
|-------|-------|
| Feedback | TripNotesSection is positioned after trip title/destinations and before calendar, matching UI spec |
| Sprint | 39 |
| Category | Positive |
| Severity | — |
| Status | New |
| Related Task | T-300 |
| Details | Code review of TripDetailsPage.jsx confirms TripNotesSection is rendered after the trip header (title, destinations, status, edit/delete controls) and before the calendar component, matching the ui-spec placement: "below the trip title and destinations row and above the calendar component." Props correctly passed: tripId, initialNotes from trip.notes, onSaveSuccess triggers full data reload, isLoading from parent loading state. |

---

## User Agent — Sprint #38 Production Walkthrough (T-295) — 2026-03-24

> **Note:** Sprint 38 is a deploy-only sprint. T-293 deployed all Sprint 35+36+37 code to production via Render (PR #8 merged to main). T-294 Monitor Agent verified staging health (Deploy Verified = Yes). This walkthrough was performed on the staging environment at `http://localhost:3001` (backend) and `frontend/dist/` (frontend build). Production URLs: `https://triplanner-backend-sp61.onrender.com` and `https://triplanner.yixinx.com`.

---

### FB-209 — Health endpoint working correctly on staging

| Field | Value |
|-------|-------|
| **Feedback** | GET /api/v1/health returns `{"status":"ok"}` |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** `curl http://localhost:3001/api/v1/health` returns `{"status":"ok"}` with HTTP 200. Database connectivity confirmed.

---

### FB-210 — Page title "triplanner" and IBM Plex Mono font confirmed in build

| Field | Value |
|-------|-------|
| **Feedback** | Frontend build contains `<title>triplanner</title>` and IBM Plex Mono font references |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** `frontend/dist/index.html` contains `<title>triplanner</title>`. CSS build file references `IBM+Plex+Mono` via Google Fonts import and uses `IBM Plex Mono, monospace` as the font-family throughout the application. Both Sprint 35 deliverables confirmed.

---

### FB-211 — Auth flow working correctly (register, login, validation, refresh)

| Field | Value |
|-------|-------|
| **Feedback** | Full auth flow works: register, login, token refresh, validation errors, error codes |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Tested the following auth scenarios, all working correctly:
1. POST /api/v1/auth/register — creates user, returns access_token (201) ✅
2. POST /api/v1/auth/register — duplicate email returns 409 with `EMAIL_TAKEN` code ✅
3. POST /api/v1/auth/register — empty email returns 400 with field-level error ✅
4. POST /api/v1/auth/register — missing all fields returns 400 with all field errors ✅
5. POST /api/v1/auth/login — valid credentials return access_token (200) ✅
6. POST /api/v1/auth/login — wrong password returns 401 `INVALID_CREDENTIALS` ✅
7. POST /api/v1/auth/login — non-existent email returns 401 `INVALID_CREDENTIALS` (no user enumeration) ✅
8. POST /api/v1/auth/refresh — returns new access_token (200) ✅
9. Rate limiting on auth endpoints — returns 429 after rapid requests ✅

---

### FB-212 — Simple XSS sanitization confirmed on all resource types

| Field | Value |
|-------|-------|
| **Feedback** | Simple `<script>` and `<img onerror>` tags stripped from trips, flights, activities, destinations |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Tested XSS payloads across multiple endpoints:
1. Trip name: `<script>alert(1)</script>My Trip` → stored as `alert(1)My Trip` ✅
2. Flight airline: `<img src=x onerror=alert(1)>ANA` → stored as `ANA` ✅
3. Flight from_location: `<script>alert(1)</script>SFO` → stored as `alert(1)SFO` ✅
4. Activity name: `<img src=x onerror=alert(1)>Visit Temple` → stored as `Visit Temple` ✅
5. Destinations array: `["<script>alert(1)</script>Tokyo"]` → stored as `["alert(1)Tokyo"]` ✅

---

### FB-213 — Nested XSS sanitization confirmed (Sprint 37 fix verified)

| Field | Value |
|-------|-------|
| **Feedback** | Two-level nested XSS patterns stripped correctly via iterative sanitization |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** `<<script>script>alert(1)<</script>/script>My Trip` → stored as `alert(1)My Trip`. Tags fully stripped, text content preserved. Iterative sanitization confirmed working.

---

### FB-214 — Post-sanitization validation correctly rejects all-HTML required fields

| Field | Value |
|-------|-------|
| **Feedback** | Fields containing only HTML tags (no text content) are rejected with 400 after sanitization |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Tested post-sanitization validation:
1. `<b></b><i></i>` → sanitized to empty → 400 "Trip name is required" ✅
2. `<script></script>` → sanitized to empty → 400 "Trip name is required" ✅

---

### FB-215 — Trip CRUD working correctly

| Field | Value |
|-------|-------|
| **Feedback** | Create, read, list, update, delete trips all working with correct status codes |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:**
1. POST /api/v1/trips — creates trip with 201 ✅
2. GET /api/v1/trips/:id — returns trip data ✅
3. GET /api/v1/trips — lists all user trips ✅
4. PATCH /api/v1/trips/:id — updates name, returns 200 ✅
5. DELETE /api/v1/trips/:id — returns 204 ✅
6. GET deleted trip — returns 404 ✅
7. Input validation: empty destinations → 400, long name (500 chars) → 400 ✅
8. Non-existent trip → 404, invalid UUID → 400 ✅

---

### FB-216 — Sub-resource CRUD working (flights, stays, activities)

| Field | Value |
|-------|-------|
| **Feedback** | Create and list flights, stays, and activities all working correctly |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:**
1. POST /api/v1/trips/:id/flights — creates flight with correct fields (201) ✅
2. POST /api/v1/trips/:id/stays — creates stay with category, address, timezones (201) ✅
3. POST /api/v1/trips/:id/activities — creates activity with date/time (201) ✅
4. GET /api/v1/trips/:id/flights — lists flights ✅
5. Calendar endpoint returns aggregated events from all sub-resources ✅

---

### FB-217 — Calendar endpoint returns events correctly

| Field | Value |
|-------|-------|
| **Feedback** | GET /api/v1/trips/:id/calendar returns structured events from flights, stays, and activities |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Calendar endpoint aggregates events with correct structure: `id`, `type`, `title`, `start_date`, `end_date`, `start_time`, `end_time`, `timezone`, `source_id`. After creating 1 flight + 1 stay + 2 activities, calendar returns 5 events (stay spans multiple days). Timezone handling preserved.

---

### FB-218 — Calendar "+x more" click-to-expand implemented in frontend

| Field | Value |
|-------|-------|
| **Feedback** | Frontend TripCalendar component implements "+x more" overflow trigger with accessible popover |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Code review of `TripCalendar.jsx` confirms:
1. Overflow trigger button renders `+{overflow} more` text ✅
2. Click opens a popover dialog with all events for that day ✅
3. Popover has ARIA attributes (`role="dialog"`, `aria-label`, `aria-expanded`, `aria-haspopup`) ✅
4. Escape key closes popover, click-outside closes popover ✅
5. Popover positions above or below cell based on available space ✅
6. Month navigation closes any open popover ✅

---

### FB-219 — Security: SQL injection safely handled

| Field | Value |
|-------|-------|
| **Feedback** | SQL injection payloads stored as literal strings, database integrity preserved |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Sent `'; DROP TABLE trips; --` as trip name. It was stored as a literal string. Subsequent trip list queries returned all trips correctly — the trips table was not affected. Parameterized queries (Knex) prevent SQL injection.

---

### FB-220 — Security: Auth endpoints enforce proper access control

| Field | Value |
|-------|-------|
| **Feedback** | Unauthenticated and invalid-token requests correctly rejected |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:**
1. No Authorization header → 401 "Authentication required" ✅
2. Invalid token → 401 "Invalid or expired token" ✅
3. Expired token → 401 (token expired after 15 min, subsequent requests rejected) ✅
4. Malformed JSON body → 400 "Invalid JSON in request body" ✅

---

### FB-221 — Minor: Deeply nested XSS leaves residual angle bracket fragments

| Field | Value |
|-------|-------|
| **Feedback** | Triple-nested XSS pattern leaves non-executable but messy angle bracket fragments in stored data |
| **Sprint** | 38 |
| **Category** | Security |
| **Severity** | Minor |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Input: `<<<script>>script>script>alert(1)<<<//script>>/script>/script>Test`. Stored as: `<<>script>script>alert(1)<<<//script>>/script>/script>Test`. The iterative sanitizer strips valid `<script>` tags but the triple-nested pattern with extra angle brackets leaves residual fragments. These fragments are **not executable HTML** (malformed, would not run in a browser), and React escapes all output by default, so this is not exploitable. However, the stored data looks messy and contains angle brackets that ideally should be cleaned. **Mitigated by:** React's JSX escaping prevents any XSS execution on the frontend. **Suggestion:** Consider a more aggressive sanitization loop or strip all angle brackets from non-exempt fields.

---

### FB-222 — Cross-user trip access test blocked by rate limiter

| Field | Value |
|-------|-------|
| **Feedback** | Could not verify cross-user authorization (403) because auth rate limiter blocked new user registration |
| **Sprint** | 38 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Status** | Acknowledged |
| **Related Task** | T-295 |

**Details:** Attempted to register a second user to test cross-user trip access (should return 403). Registration was blocked by rate limiter (429 "Too many registration attempts"). The rate limiter window appears aggressive for testing scenarios. Cross-user authorization is covered by unit tests (backend tests verify 403 on wrong ownership), but could not be verified end-to-end in this session. **Note:** Rate limiting itself is working correctly — this is a testing friction issue, not a bug.

---

### FB-223 — Production deployment completed (FB-207 resolved)

| Field | Value |
|-------|-------|
| **Feedback** | Sprint 38 primary objective met — code deployed to production via Render, PR #8 merged to main |
| **Sprint** | 38 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-293 |

**Details:** Per Deploy Engineer handoff, PR #8 was merged to main and Render auto-deployed. 13/13 production smoke tests passed. This resolves FB-207 (Major Feature Gap from Sprint 37) — production deployment is no longer pending. Production URLs: `https://triplanner-backend-sp61.onrender.com` (backend), `https://triplanner.yixinx.com` (frontend).

---

## User Agent — Sprint #37 Staging Walkthrough (T-292) — 2026-03-24

> **Note:** T-290 (production deploy) and T-291 (production health check) have not yet completed. Production has not been deployed. Following Sprint 36 precedent (T-285), this walkthrough was performed on the Monitor-verified staging environment (T-289 Deploy Verified = Yes, Staging). Results below reflect staging testing at `https://localhost:3001` (backend) and `https://localhost:4173` (frontend).

---

### FB-200 — Nested XSS bypass fully fixed on all endpoints (Sprint 37 primary deliverable)

| Field | Value |
|-------|-------|
| **Feedback** | Nested/obfuscated XSS bypass (FB-191) is fully fixed across all models |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-286 |

**Details:** Tested the Sprint 37 primary fix (T-286) — iterative sanitization of nested HTML tags — across all resource types:

1. **Trips:** `<<script>script>alert(1)<</script>/script>` → stored as `"alert(1)"` (tags fully stripped, text content preserved). ✅
2. **Trips:** `<<<<script>script>script>script>evil` → stored as `"evil"` (4-level nesting fully stripped). ✅
3. **Trips:** `<<img>img src=x onerror=alert(3)>` → sanitized to empty string → rejected by post-sanitization validation (400 VALIDATION_ERROR). ✅
4. **Flights (PATCH):** `<<script>script>Evil Airlines<</script>/script>` → stored as `"Evil Airlines"`. ✅
5. **Flights (PATCH):** `<<b>b>Bold<<br>br />Airlines</b>` → stored as `"BoldAirlines"`. ✅
6. **Stays:** `<<script>script>Hacked Hotel<</script>/script>` → stored as `"Hacked Hotel"`. ✅
7. **Activities:** `<<div>div>Hacked Activity</div>` in name + `<<a>a href=evil>Click Me</a>` in location → stored as `"Hacked Activity"` and `"Click Me"`. ✅
8. **Land travel:** Nested XSS in `from_location`, `to_location`, `provider` — all fully stripped. ✅
9. **Destinations array:** `["<<script>script>alert(1)<</script>/script>"]` → stored as `["alert(1)"]`. ✅

**Expected:** Nested/obfuscated HTML tags fully stripped after iterative sanitization. No valid HTML tags remain in stored values.
**Actual:** Matches expected. All nested patterns across all 5 models are fully sanitized. The iterative loop works correctly.

---

### FB-201 — Legitimate angle brackets and special characters preserved after sanitization

| Field | Value |
|-------|-------|
| **Feedback** | Non-tag angle brackets, Unicode, emoji, and special characters all preserved correctly |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-286 |

**Details:** Verified that the iterative sanitizer does not over-strip legitimate content:

1. `"Budget 5 < 10k USD"` → stored as `"Budget 5 < 10k USD"` ✅ (angle brackets in non-tag context preserved)
2. `"東京旅行 🗼 café"` → stored as `"東京旅行 🗼 café"` ✅ (Unicode + emoji preserved)
3. `"Tom & Jerry's \"Excellent\" Trip"` → stored as `"Tom & Jerry's \"Excellent\" Trip"` ✅ (ampersands, quotes preserved)
4. Destinations array with Japanese characters: `["東京","大阪"]` → preserved ✅

**Expected:** Legitimate text content with angle brackets, Unicode, emoji, and special characters preserved.
**Actual:** Matches expected. No false positives from the sanitizer.

---

### FB-202 — Post-sanitization validation correctly rejects all-HTML required fields

| Field | Value |
|-------|-------|
| **Feedback** | Post-sanitization validation (Sprint 36 T-278) still works correctly with Sprint 37 iterative sanitizer |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-286, T-278 |

**Details:** Tested that fields which become empty after sanitization are properly rejected:

1. `name: "<<img>img src=x onerror=alert(3)>"` → sanitized to `""` → 400 VALIDATION_ERROR with `"Trip name is required"` ✅
2. `name: ""` → 400 VALIDATION_ERROR ✅
3. Missing required fields `{}` → 400 VALIDATION_ERROR with both `name` and `destinations` errors ✅

**Expected:** All-HTML required fields rejected with 400 after sanitization strips them to empty.
**Actual:** Matches expected. Post-sanitization validation (T-278) and iterative sanitization (T-286) work together correctly.

---

### FB-203 — CRUD flows working correctly across all resource types

| Field | Value |
|-------|-------|
| **Feedback** | Full CRUD operations for trips, flights, stays, activities, and land travel all working correctly |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-292 |

**Details:** Regression test of core CRUD flows:

1. **Trips:** POST (201), GET list, GET single, PATCH, DELETE (204) — all correct response shapes and status codes ✅
2. **Flights:** POST with full fields (flight_number, airline, airports, datetimes, timezones), GET list — correct ✅
3. **Stays:** POST with category/name/address/check-in-out — correct ✅
4. **Activities:** POST with name/location/date/times — correct, times returned as HH:MM:SS format ✅
5. **Land travel:** POST with mode/provider/locations/dates/times — correct ✅
6. **Calendar aggregation:** GET `/trips/:id/calendar` returns events from flights, stays, activities with correct types and titles ✅
7. **Search/filter:** `?search=Japan` returns only matching trips ✅
8. **Delete:** Returns 204 with no body ✅

---

### FB-204 — Auth and authorization working correctly

| Field | Value |
|-------|-------|
| **Feedback** | Authentication enforcement, token validation, and rate limiting all working correctly |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-292 |

**Details:**

1. **Registration:** POST `/auth/register` creates user and returns access_token ✅
2. **No auth token:** Protected endpoints return 401 `"Authentication required"` ✅
3. **Invalid token:** `Bearer invalidtoken123` returns 401 `"Invalid or expired token"` ✅
4. **Rate limiting (register):** 5 requests per 60 minutes — triggered correctly with `"Too many registration attempts"` ✅
5. **Rate limiting (login):** 10 requests per 15 minutes — triggered correctly ✅
6. **Invalid trip ID format:** Returns 400 `"Invalid ID format"` (not 500) ✅

---

### FB-205 — Input validation rejects long inputs and invalid enums

| Field | Value |
|-------|-------|
| **Feedback** | Server-side validation correctly rejects oversized inputs and invalid enum values |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-292 |

**Details:**

1. **Very long trip name (1000 chars):** Rejected with validation error ✅
2. **Invalid status enum (`"ACTIVE"`):** Rejected with `"Status must be one of: PLANNING, ONGOING, COMPLETED"` ✅
3. **SQL injection attempt (`"Robert'; DROP TABLE trips;--"`):** Stored as literal string — parameterized queries prevent injection ✅

---

### FB-206 — Page title and font branding confirmed on staging

| Field | Value |
|-------|-------|
| **Feedback** | Frontend serves correct page title "triplanner" and includes IBM Plex Mono font |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-292 |

**Details:**

1. `<title>triplanner</title>` present in served HTML ✅
2. IBM Plex Mono font referenced in CSS bundle (`index-CFSmeAES.css`) ✅
3. Frontend build output exists at `frontend/dist/` with all expected assets (JS, CSS, favicon) ✅
4. Code-split chunks present: ActivitiesEditPage, FlightsEditPage, LandTravelEditPage, StaysEditPage ✅

---

### FB-207 — Production deployment not yet completed (T-290/T-291 still Backlog)

| Field | Value |
|-------|-------|
| **Feedback** | Production deployment has not been executed — T-290 and T-291 remain in Backlog status |
| **Sprint** | 37 |
| **Category** | Feature Gap |
| **Severity** | Major |
| **Status** | Tasked |
| **Tasked As** | T-293, T-294, T-295 (Sprint 38 — production deploy + health check + user verification) |
| **Related Task** | T-290, T-291 |

**Details:** Sprint 37 scope includes production deployment (T-290) and production health check (T-291) as Phase 3. Both tasks remain in Backlog status in `dev-cycle-tracker.md`. T-289 (staging health check) completed successfully and unblocked T-290, but T-290 has not been executed.

**Steps to reproduce:** Check `dev-cycle-tracker.md` — T-290 status is "Backlog", T-291 status is "Backlog".
**Expected:** Production should be deployed and verified by this point in the sprint.
**Actual:** Only staging has been deployed and verified. User Agent tested on staging per Sprint 36 precedent.

**Impact:** Sprint 35+36+37 features are NOT live on production. The primary Sprint 37 goal of "deploy all Sprint 35+36 changes to production" is incomplete.

---

### FB-208 — Health endpoint confirms database connectivity

| Field | Value |
|-------|-------|
| **Feedback** | GET /api/v1/health returns {"status":"ok"} immediately — fast response, database connected |
| **Sprint** | 37 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |
| **Related Task** | T-292 |

**Details:** Health endpoint responds instantly with `{"status":"ok"}`. No delays, no errors. Confirms backend is running and database is connected on staging.

---

*User Agent Sprint #37 — T-292 — 2026-03-24*

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

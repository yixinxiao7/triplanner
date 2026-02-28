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

### Sprint 8 — Manager Agent: Sprint 8 Plan Published + Agent Dispatch (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 8 |
| From Agent | Manager Agent |
| To Agent | All Agents |
| Status | Pending |
| Related Task | T-094, T-110, T-111, T-112, T-113, T-114, T-115, T-116, T-117, T-118, T-119, T-120 (carry-overs: T-105, T-106, T-107, T-108, T-109) |
| Handoff Summary | **Sprint #8 is planned and active. Full sprint details in `.workflow/active-sprint.md`. Tasks T-110–T-120 added to `.workflow/dev-cycle-tracker.md`. Feedback-log.md updated: FB-084 promoted from Acknowledged → Tasked (→ T-113).** |

**Immediate actions — start NOW in parallel:**

**Frontend Engineer (P0 — IMMEDIATE):**
- **T-110** — Fix T-098 failing test: Add `{ label: 'UTC — Coordinated Universal Time', value: 'UTC' }` to `frontend/src/utils/timezones.js` OR rewrite test to use `Europe/London` in winter. Also add missing TripDetailsPage stay display test (`check_in_at: '2026-08-07T20:00:00.000Z'`, `check_in_tz: 'America/New_York'` → "4:00 PM EDT"). All 344 tests must pass. Move T-098 to Integration Check. Submit T-110 for Manager review.
- **T-111** — Write 8+ T-104 tests: `TripDetailsPage.test.jsx` (notes renders, placeholder, pencil→edit, char count ≥1800, save calls API, cancel no-op, empty→null) + `TripCard.test.jsx` (>100 chars truncated with "…", ≤100 chars full, null hidden). All 344+ tests pass. Move T-104 to Integration Check. Submit T-111 for Manager review.
- After T-110 + T-111 complete (no earlier): **T-113** (timezone abbreviations on detail cards — wait for T-112 design spec first) and **T-114** (activity URL link detection — wait for T-112).

**User Agent (P0 — IMMEDIATE, T-094 is now unblocked — T-095 is Done):**
- **T-094** — Sprint 6 feature walkthrough on HTTPS staging. Test: land travel CRUD via UI (create/edit/delete a TRAIN entry), calendar "+X more" popover (opens without corruption, Escape closes), activity edit page AM/PM fix + clock icon fix, FilterToolbar stays visible during refetch, ILIKE "%" search returns empty results, full Sprint 1–5 regression. Submit structured feedback to `feedback-log.md` under Sprint 6 header. If Critical/Major bugs found → add note to handoff-log immediately so Manager can create hotfix tasks.

**Design Agent (P1 — IMMEDIATE, no blockers):**
- **T-112** — Spec 14: (1) Timezone abbreviation display — `Intl.DateTimeFormat` with `{ timeZoneName: 'short' }`, placement adjacent to time in muted font, fallback to IANA string, which cards (flight departure/arrival, stay check-in/check-out, land travel departure/arrival on TripDetailsPage). (2) Activity URL link detection — `/(https?:\/\/[^\s]+)/g` regex, plain text + `<a>` rendering, `target="_blank" rel="noopener noreferrer"`, scheme allowlist (http/https only, no javascript:/data:/vbscript:). Publish as Spec 14 addendum to `.workflow/ui-spec.md`. Signal Manager when complete.

**QA Engineer (wait for T-110 + T-111 Manager approval before starting T-105):**
- **T-105** (Sprint 7 carry-over) — Security checklist + code review for all Sprint 7 tasks (T-097, T-098, T-099, T-100, T-101, T-103, T-104). Starts only after Manager approves T-110 and T-111, moving T-098 and T-104 to Integration Check. Full scope in Sprint 7 T-105 task description.
- **T-106** → **T-107** → **T-108** → **T-109** — sequential pipeline. Follow existing T-106/T-107/T-108/T-109 task descriptions.
- After T-109 completes: **T-115** — Expand Playwright to 7+ tests (land travel edit, calendar overflow, mobile viewport). Then **T-116** (Sprint 8 security + code review for T-113 + T-114) → **T-117** → **T-118** → **T-119** → **T-120**.

**Deploy Engineer:**
- **T-107** (Sprint 7 carry-over) — Starts after QA issues T-106 sign-off. Apply migration 010 (`notes TEXT NULL`), rebuild frontend with all Sprint 7 changes, verify pm2, smoke test. Full scope in Sprint 7 T-107 task description.
- **T-118** (Sprint 8) — Starts after T-117 sign-off. Rebuild frontend with Sprint 8 changes (T-113/T-114 timezone + URL). No new migrations. Playwright 7/7 smoke test.

**Monitor Agent:**
- **T-108** — After T-107 deploys. Sprint 7 + Sprint 6 regression checks. Full scope in Sprint 7 T-108 task.
- **T-119** — After T-118 deploys. Sprint 8 + Sprint 7 regression checks. Full scope in T-119 task.

---

### Sprint 7 → Sprint 8 — Manager Agent: Sprint Closeout + Sprint 8 Kickoff Brief (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 → 8 |
| From Agent | Manager Agent |
| To Agent | All Agents |
| Status | Pending |
| Related Task | T-094, T-098, T-104, T-105, T-106, T-107, T-108, T-109 |
| Handoff Summary | **Sprint #7 is closed. Full summary in `.workflow/sprint-log.md`.** Sprint 8 begins immediately. The critical path for Sprint 8 is: (1) Fix T-098 and T-104 tests → (2) Run T-094 → (3) QA T-105/T-106 → (4) Deploy T-107 → (5) Monitor T-108 → (6) User Agent T-109. All other work is secondary until T-109 completes and its feedback is triaged. |

**Sprint 8 Priority Queue (in strict execution order):**

**Step 1 — Frontend Engineer (IMMEDIATE — P0):**
- **T-098 test fixes** — Fix the failing `StaysEditPage.test.jsx` UTC test (add `{ label: 'UTC — Coordinated Universal Time', value: 'UTC' }` to `frontend/src/utils/timezones.js`, OR rewrite test to use an existing dropdown timezone) + add the missing `TripDetailsPage.test.jsx` T-098 test (stay with `check_in_at: '2026-08-07T20:00:00.000Z'` + `check_in_tz: 'America/New_York'` → displays "4:00 PM"). All 344 tests must pass. Move T-098 to In Review when done.
- **T-104 tests** — Write 8+ tests in `TripDetailsPage.test.jsx` (notes text renders, placeholder when null, pencil→edit mode, char count ≥1800, save calls `api.trips.update`, cancel restores, empty→null) and `TripCard.test.jsx` (>100 chars truncated + ellipsis, ≤100 chars full, null hidden). Move T-104 to In Review when done.

**Step 2 — Manager Agent (after T-098 + T-104 pass In Review):**
- Final Manager review for T-098 and T-104. Move both to Integration Check on approval.

**Step 3 — User Agent (T-094 — P0 hard-block after T-098/T-104 clear review):**
- Sprint 6 feature walkthrough (HTTPS staging). Test: land travel CRUD via UI, calendar enhancements (+X more popover, event times), activity edit page bug fixes (AM/PM, clock icon), FilterToolbar refetch fix, ILIKE wildcard search, full Sprint 1–5 regression. Submit structured feedback to `feedback-log.md` (Sprint 6 section). T-094 must complete before any Sprint 9 scope is planned.

**Step 4 — Manager Agent (after T-094 feedback submitted):**
- Triage T-094 feedback: Critical/Major → Tasked; Minor → Acknowledged/backlog; Positive → Acknowledged.

**Step 5 — QA Engineer (T-105 + T-106 — after T-098, T-104, T-101, T-099, T-100, T-097, T-103 all in Integration Check):**
- T-105: Security checklist audit for all Sprint 7 tasks.
- T-106: Integration testing — all Sprint 7 features + Sprint 6 regression + E2E 4/4.
- See existing Manager → QA handoff in this log (Status: Pending, 2026-02-27) for full scope.

**Step 6 — Deploy Engineer (T-107 — after QA issues deploy-ready sign-off):**
- Apply migration 010 (`notes TEXT NULL`). Rebuild frontend with all Sprint 7 changes. Verify pm2 still online (from T-095). Run smoke tests. Handoff to Monitor Agent.

**Step 7 — Monitor Agent (T-108 — after T-107 completes):**
- Sprint 7 health check: HTTPS ✅, pm2 ✅, migration 010 applied ✅, trip notes API ✅, stays timezone correct ✅, all Sprint 6 regression checks ✅, Playwright 4/4 ✅. Handoff to User Agent.

**Step 8 — User Agent (T-109 — after T-108 health check passes):**
- Sprint 7 feature walkthrough: popover fix, timezone fix, section reorder, all-day sort, calendar checkout/arrival, trip notes. Full Sprint 6 regression. Submit structured feedback.

**Step 9 — Manager Agent (after T-109 feedback submitted):**
- Triage T-109 feedback. Plan Sprint 9 based on remaining MVP items + any new issues.

**Non-blocking / can start in parallel:**
- Production deployment (B-022): Project owner must select hosting provider (Railway, Fly.io, Render, AWS) — all infra is ready, decision is the only blocker. This has been escalated every sprint since Sprint 3.

---

### Sprint 7 — Deploy Engineer: T-107 BLOCKED — Awaiting QA Sign-off + T-098/T-104 Test Fixes (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Deploy Engineer |
| To Agent | Manager Agent, QA Engineer, Frontend Engineer |
| Status | Blocked |
| Related Task | T-107 (Deploy: Staging Re-deployment — BLOCKED), T-098, T-104, T-105, T-106 |
| Handoff Summary | **T-107 (Staging Re-deployment) is BLOCKED.** Pre-deploy verification found 4 blockers: (1) QA T-105 (Security Audit) has not run — status is Backlog. (2) QA T-106 (Integration Testing) has not run — status is Backlog. (3) No Sprint 7 QA → Deploy Engineer sign-off exists in handoff-log.md. (4) QA partial report explicitly states "Pre-Deploy Status: 🚫 NOT READY." T-098 and T-104 are both In Progress with failing/missing tests. |

**What was completed (build documentation only — not a live deploy):**
- `npm install` (backend + frontend): ✅ Both up to date (215 + 283 packages)
- `npm run build` (frontend Vite): ✅ SUCCESS — 121 modules, 336.48 kB JS output, built in 662ms
- Backend tests: ✅ 265/265 PASS
- Frontend tests: ❌ 343/344 — 1 FAILURE (`[T-098] submits check_in_at unchanged (no offset) when timezone is UTC` — UTC not in TIMEZONES dropdown → `api.stays.create` never called → assertion fails)

**Pending migration (ready but not applied — awaiting QA clearance):**
- Migration 010 (`backend/src/migrations/20260227_010_add_trip_notes.js`) — adds `notes TEXT NULL` to `trips` table

**Blockers that must be resolved before T-107 can proceed:**

1. **Frontend Engineer → T-098:** Fix the failing test. Two options per QA guidance:
   - Option A: Add `{ label: 'UTC — Coordinated Universal Time', value: 'UTC' }` to `frontend/src/utils/timezones.js` and keep test as-is (expected `check_in_at` stays `'2026-09-01T12:00:00.000Z'` — zero offset)
   - Option B: Rewrite test to use `'Europe/London'` in winter (UTC+0, genuinely no offset)
   - Also required: Add missing TripDetailsPage test — stay with `check_in_at: '2026-08-07T20:00:00.000Z'` + `check_in_tz: 'America/New_York'` displays as "4:00 PM EDT"

2. **Frontend Engineer → T-104:** Write 8+ tests:
   - `TripDetailsPage.test.jsx`: notes text renders, placeholder when null, pencil→edit mode, char count at ≥1800, save calls `api.trips.update`, cancel restores without API call, empty notes sends `null`
   - `TripCard.test.jsx`: truncated notes (>100 chars) with ellipsis, full notes (≤100 chars) without ellipsis, notes hidden when null/empty

3. **QA Engineer:** After T-098 and T-104 are fixed and pass In Review, run T-105 (Security) and T-106 (Integration) for all Sprint 7 tasks. Issue deploy-ready handoff to Deploy Engineer.

4. **Deploy Engineer (self):** Will re-attempt T-107 immediately upon receiving QA handoff.

---

### Sprint 7 — Manager → QA Engineer: T-097, T-099, T-100, T-101 Pass Review → Integration Check (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Manager Agent |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-097, T-099, T-100, T-101, T-105, T-106 |
| Handoff Summary | **4 Sprint 7 frontend tasks reviewed and approved.** All 4 tasks have been moved to Integration Check and are ready for QA: **(1) T-097** — Calendar "+X more" popover portal fix. `createPortal` to `document.body` with `position:fixed` eliminates CSS grid layout corruption. 3 T-097 tests in `TripCalendar.test.jsx` pass. **(2) T-099** — Trip details section reorder to Flights → Land Travel → Stays → Activities. 1 T-099 test in `TripDetailsPage.test.jsx` passes. **(3) T-100** — All-day activities sort to top of day group in `ActivityDayGroup` component. 1 T-100 test in `TripDetailsPage.test.jsx` passes. **(4) T-101** — Calendar checkout/arrival time enhancements: stay checkout time on last day ("check-out Xa"), flight arrival time on arrival day ("arrives Xa"). 5+ T-101 tests in `TripCalendar.test.jsx` pass. |
| Notes | **Current test count:** 343 passing, 1 failing (T-098 UTC test — unrelated to these 4 tasks). **For QA (T-105):** Verify no XSS vectors in popover content (JSX rendering confirmed). Verify section order on staging: Flights → Land Travel → Stays → Activities. Verify "+X more" popover opens without corrupting calendar grid. Verify checkout and arrival times appear on calendar. **For QA (T-106):** Integration-check the 4 features above on staging. T-103 (Backend: Trip notes — Integration Check) is also ready for QA. Note: T-104 (Frontend: Trip notes) is In Progress (tests missing) — do NOT include T-104 in T-105/T-106 until it moves to Integration Check. |

---

### Sprint 7 — Manager → Frontend Engineer: T-098 UTC Test Fix Required (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Manager Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-098 |
| Handoff Summary | **T-098 partially fixed — 2 issues remain before review passes.** (1) **FAILING TEST**: `StaysEditPage.test.jsx` "[T-098] submits check_in_at unchanged (no offset) when timezone is UTC" fails with 0 calls to `api.stays.create`. Root cause: `'UTC'` is not in the `TIMEZONES` array (`frontend/src/utils/timezones.js`). In JSDOM, setting a `<select>` to a non-existent option value reverts to empty string — `form.check_in_tz` stays `''`, validation blocks submit. Fix: add `{ label: 'UTC — Coordinated Universal Time', value: 'UTC' }` to the TIMEZONES array (smallest change) — with 0 offset, expected `check_in_at` stays `'2026-09-01T12:00:00.000Z'`. Alternatively, rewrite the test to use a timezone that IS in the dropdown. (2) **MISSING TEST**: `TripDetailsPage.test.jsx` still has no T-098 test verifying that a stay with a known UTC `check_in_at` value renders the correct local time using `check_in_tz`. Example: mock a stay with `check_in_at: '2026-08-07T20:00:00.000Z'` and `check_in_tz: 'America/New_York'` and verify the displayed time includes the expected 4:00 PM representation. |
| Notes | **`localDatetimeToUTC` algorithm is CORRECT** — the Tokyo timezone test passes. `toDatetimeLocal` is also correct. Both helpers are properly used in `handleSubmit`. No changes needed to the implementation logic. Only the test fixture and the missing second test need work. After fixing both issues, move T-098 to In Review for Manager re-review. |

---

### Sprint 7 — Manager → Frontend Engineer: T-104 Trip Notes Tests Required (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Manager Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-104 |
| Handoff Summary | **T-104 code is complete — tests are entirely missing.** `TripDetailsPage.jsx` notes section (lines 372-727) and `TripCard.jsx` notes preview (lines 128-135) are fully implemented and correct. However, `TripDetailsPage.test.jsx` has 0 T-104 tests and `TripCard.test.jsx` has 0 T-104 tests. The task cannot pass review without them. Required tests: (1) TripDetailsPage: renders notes text when non-null; renders "no notes yet" placeholder when null; pencil button enters edit mode (textarea visible); char count visible when notesDraft.length >= 1800; Save calls `api.trips.update` with correct notes payload; Cancel restores previous notes without API call; submitting blank notes sends `null`. (2) TripCard: shows truncated first 100 chars + ellipsis when notes.length > 100; shows full notes when ≤100 chars; notes section hidden when trip.notes is null. Min 8 tests required. When tests are written and passing, move T-104 to In Review. |
| Notes | **Blocker dependencies cleared:** T-096 (design spec) is Done; T-103 (backend notes) is Integration Check. T-104 is unblocked. Note that mock for `api.trips.update` is already configured in `TripDetailsPage.test.jsx` (line 20). Notes state in TripDetailsPage initializes from `trip.notes` via `useEffect` (line 415-418). The `defaultHookValue` in the test has no `notes` field on `mockTrip` — add `notes: null` to `mockTrip` and create variants with `notes: 'some text'` for tests. |

---

### Sprint 7 — Frontend Engineer → Acknowledged API Contracts (T-098, T-103) (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Frontend Engineer |
| To Agent | Manager Agent |
| Status | Acknowledged |
| Related Task | T-098, T-103, T-097, T-099, T-100, T-101, T-104 |
| Handoff Summary | **API Contract Acknowledgment:** Frontend Engineer has read and acknowledged the following Sprint 7 API contracts before beginning implementation: (1) **T-098** — UTC timestamp fix for stays endpoints. The pg type parser override ensures all `check_in_at`/`check_out_at` values from the API are always UTC ISO 8601 strings ending in "Z". Frontend must display times by converting UTC + the `_tz` IANA string. Fix: `StaysEditPage.jsx` must use proper UTC conversion when constructing the payload (`localDatetimeToUTC(datetimeLocalStr, ianaTimezone)` helper), and `toDatetimeLocal` must convert UTC + timezone to local display correctly for the datetime-local input when editing. (2) **T-103** — Trip notes field. All three trips endpoints (`GET /trips`, `GET /trips/:id`, `PATCH /trips/:id`) now include `notes: string \| null`. PATCH accepts `notes` as optional field (max 2000 chars, null to clear). GET list includes `notes` for TripCard display. Implementation plan: T-104 adds notes section to TripDetailsPage with inline edit and notes preview to TripCard. |
| Notes | **Code already implemented (needs tracker update + tests):** T-097 (portal fix), T-099 (section reorder: Flights → Land Travel → Stays → Activities), T-100 (all-day activities sort to top of day group), T-101 (calendar checkout/arrival time enhancements) — all code changes present in source files. Tracker still shows "Backlog" for these tasks. Tests will be added and tracker updated as part of this Sprint 7 frontend work session. |

---

### Sprint 7 — Backend Engineer: Sprint 7 Backend Work Complete — Status Summary (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer, Manager Agent |
| Status | Pending |
| Related Task | T-098, T-103 |
| Handoff Summary | **Backend Engineer Sprint 7 work is complete.** Summary of both backend tasks: **T-103 (Trip notes — Integration Check):** Fully implemented and Manager-approved. Migration 010 applies `notes TEXT NULL` to `trips`. All 3 trip endpoints (GET /trips, GET /trips/:id, PATCH /trips/:id) include `notes`. 13 tests in `sprint7.test.js`. All 265/265 backend tests pass. **T-098 (UTC fix — Backend APPROVED, Frontend pending):** Backend pg type parser override in `database.js` is approved. The TIMESTAMPTZ (OID 1184) parser converts all raw pg strings to UTC ISO 8601 guaranteed. 5 backend tests validate the round-trip. Backend portion is done. The remaining Frontend UTC conversion work has been handed off to the Frontend Engineer (see handoff below dated 2026-02-27). Overall T-098 status remains "In Progress" until Frontend Engineer completes their two required fixes. |
| Notes | **For QA (T-105/T-106):** T-103 is ready for integration testing. Verify: (1) `GET /trips/:id` returns `notes: null` for trips without notes. (2) `PATCH /trips/:id { notes: "text" }` → 200 with notes in response. (3) `PATCH /trips/:id { notes: null }` → clears notes. (4) `PATCH /trips/:id { notes: "<2001 chars>" }` → 400 VALIDATION_ERROR with `fields.notes`. (5) `GET /trips` list includes `notes` field on each trip. (6) **Verify empty-string behavior**: `PATCH { "notes": "" }` → GET returns `notes: null` (code normalizes empty string to null before storage). **Migration 010 is reversible:** `knex migrate:rollback` cleanly drops the `notes` column. **For Manager:** T-098 backend work confirmed done (265/265 tests pass). Handoff to Frontend Engineer written. T-098 overall status to remain "In Progress" until Frontend Engineer resolves: (1) UTC conversion in `StaysEditPage.jsx`, (2) 2 missing frontend tests. |

---

### Sprint 7 — Backend Engineer → Frontend Engineer: T-098 Frontend UTC Conversion Required (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-098 (Backend + Frontend: Stays timezone fix) |
| Handoff Summary | **Backend portion of T-098 is COMPLETE and Manager-approved.** The `pg` type parser override in `backend/src/config/database.js` ensures all TIMESTAMPTZ columns (`check_in_at`, `check_out_at`, and all `*_at` fields across the API) are serialized as guaranteed UTC ISO 8601 strings ending with `Z`. All 265 backend tests pass. **The remaining work is entirely Frontend.** Per the Manager's review, two frontend changes are required before T-098 can move to In Review. |
| Notes | **Required Fix 1 — `StaysEditPage.jsx` UTC conversion (CRITICAL):** The current code at line ~256 does `check_in_at: form.check_in_at + ':00.000Z'`, which naively appends `Z` without applying the user's selected timezone offset. This produces the bug: user enters "4:00 PM" with `America/New_York` (EDT, UTC-4) → frontend sends `"2026-08-07T16:00:00.000Z"` (4 PM UTC) → stored as 16:00 UTC → displayed as "12:00 PM" in New York. **Correct behavior:** Convert the `datetime-local` input value plus the user's selected IANA timezone string into the correct UTC ISO timestamp before sending. For `America/New_York` (EDT, UTC-4): `"2026-08-07T16:00"` → `"2026-08-07T20:00:00.000Z"`. The same fix must apply to `check_out_at`. Also fix `toDatetimeLocal()` (edit pre-population) — it must convert the stored UTC value to the correct local time in the stored timezone for display in the `datetime-local` input. **Suggested implementation:** Use `Intl.DateTimeFormat` with the IANA timezone to compute the UTC offset, then add/subtract from the datetime-local value. **Required Fix 2 — 2 frontend tests missing:** (a) `StaysEditPage.test.jsx`: verify `api.stays.create` is called with `check_in_at: "2026-08-10T20:00:00.000Z"` when user enters `"2026-08-10T16:00"` + timezone `"America/New_York"` (4-hour EDT offset). (b) `TripDetailsPage.test.jsx` (or `formatDate.test.js`): verify that a stay with `check_in_at: "2026-08-07T20:00:00.000Z"` + `check_in_tz: "America/New_York"` renders as `"4:00 PM"` (not `"8:00 PM"` or `"12:00 PM"`). **After both fixes are done:** Move T-098 to In Review. The Manager review note says "Move back to In Review when both issues are resolved." |

---

### Sprint 7 — Manager → QA Engineer: T-103 Backend Approved → Integration Check (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Manager Agent |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-103 → T-105 (QA Security Checklist), T-106 (QA Integration Testing) |
| Handoff Summary | **T-103 (Backend: Trip notes field) has passed Manager code review and is now Integration Check.** Migration 010 (`backend/src/migrations/20260227_010_add_trip_notes.js`) adds `notes TEXT NULL` to `trips` table — backward-compatible nullable addition. Routes updated: POST /trips and PATCH /trips/:id accept `notes` (optional, max 2000 chars, null to clear, empty string normalized to null). GET /trips and GET /trips/:id both include `notes` in every trip response via `TRIP_COLUMNS`. 13 backend unit tests in `sprint7.test.js` cover all scenarios. |
| Notes | **Security checks to verify in T-105:** (1) `notes` field uses parameterized Knex query — no SQL injection vector. (2) `notes` max 2000 chars enforced at validate middleware layer before hitting model — prevents large payloads. (3) `notes` is stored as raw text — no server-side HTML processing — React JSX escaping on the frontend (T-104) handles XSS at render time. (4) PATCH /trips/:id `notes` update is auth-gated and user-scoped (403 on other user's trips). (5) Migration 010 `down()` cleanly drops the `notes` column. **Integration checks for T-106:** (a) `GET /trips/:id` response includes `notes: null` for a trip without notes. (b) `PATCH /trips/:id { "notes": "My notes" }` → 200, response includes `notes: "My notes"`. (c) `GET /trips/:id` after PATCH shows updated notes. (d) `PATCH /trips/:id { "notes": null }` → 200, `notes: null` in response. (e) `PATCH /trips/:id { "notes": "<2001 chars>" }` → 400 VALIDATION_ERROR with `fields.notes` present. (f) `GET /trips` (list) — each trip object includes `notes` field. (g) **Verify empty-string behavior**: `PATCH { "notes": "" }` → GET response returns `notes: null` (code normalizes `''` → `null`, not empty string; the api-contracts.md doc says "stored as empty string" which is slightly incorrect — verify actual behavior matches null). |

---

### Sprint 7 — Manager → Backend Engineer: T-098 Changes Required — Frontend UTC Conversion + Tests Missing (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer (and Frontend Engineer for the FE portion) |
| Status | Pending |
| Related Task | T-098 (Backend + Frontend: Stays timezone fix) |
| Handoff Summary | **T-098 is sent back to In Progress.** The backend pg type parser fix in `database.js` is approved. However, two issues block approval: (1) The frontend UTC conversion from local-time + timezone → correct UTC is not implemented. (2) Two required frontend tests are missing. |
| Notes | **Issue 1 — Frontend UTC conversion not implemented (REQUIRED FIX):** `StaysEditPage.jsx` (line ~256) uses `check_in_at: form.check_in_at + ':00.000Z'`. This naively appends 'Z' to the datetime-local value without applying the user's selected timezone offset. For a user entering "4:00 PM" with timezone "America/New_York" (EDT, UTC-4 in summer), the frontend currently sends `"2026-08-07T16:00:00.000Z"` (4 PM UTC) instead of the correct `"2026-08-07T20:00:00.000Z"` (4 PM Eastern = 8 PM UTC). Your own handoff note to the Frontend Engineer stated explicitly: "FE must convert: given datetime-local value '2026-08-07T16:00' and timezone 'America/New_York' (UTC-4 in EDT), send '2026-08-07T20:00:00.000Z'." This conversion must be implemented before T-098 can be approved. Suggested approach: build a local ISO string from the datetime-local value and use `Intl.DateTimeFormat` or offset arithmetic for the selected IANA timezone to compute the UTC equivalent. The same fix must apply to `check_out_at`. Apply the same fix pattern to `toDatetimeLocal()` on edit pre-population (ensure it converts the stored UTC value to the correct local time in the stored timezone for display in the datetime-local input). **Issue 2 — Missing 2 required frontend tests (REQUIRED FIX):** The task plan specifies "2+ frontend tests verifying StaysEditPage sends correct datetime string and TripDetailsPage renders the correct local time." These tests are absent. Add: (a) A test in `StaysEditPage.test.jsx` verifying `api.stays.create` is called with a `check_in_at` value that correctly reflects the timezone offset — e.g., entering datetime-local value "2026-08-10T16:00" with timezone "America/New_York" should result in `check_in_at: "2026-08-10T20:00:00.000Z"` in the API call. (b) A test in `TripDetailsPage.test.jsx` (or a `formatDate.test.js` unit test) verifying that a stay with `check_in_at: "2026-08-07T20:00:00.000Z"` and `check_in_tz: "America/New_York"` renders as "4:00 PM" (not "12:00 PM"). **Backend pg fix status:** APPROVED. No changes needed to `database.js`, `stayModel.js`, `stays.js`, or `sprint7.test.js` backend tests. Only the frontend `StaysEditPage.jsx` and 2 frontend tests need to be added. Move back to In Review when both issues are resolved. |

---

### Sprint 7 — Backend Engineer → Deploy Engineer: Migration 010 Ready to Apply (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Backend Engineer |
| To Agent | Deploy Engineer |
| Status | Pending |
| Related Task | T-103 → T-107 (Deploy: Staging re-deployment) |
| Handoff Summary | **Migration 010** has been created at `backend/src/migrations/20260227_010_add_trip_notes.js`. It adds a `notes TEXT NULL` column to the `trips` table (backward-compatible nullable addition). This migration must be applied to staging as part of T-107 before the Sprint 7 frontend (T-104) can use the notes field. |
| Notes | Run order: `knex migrate:latest` applies migration 010 after 009. Rollback: `knex migrate:rollback` drops the `notes` column cleanly. No data loss — all existing trips receive `notes = NULL` automatically. No new environment variables required. |

---

### Sprint 7 — Backend Engineer → QA Engineer: T-098 + T-103 Implementation Complete (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-098, T-103 → T-105 (QA Security), T-106 (QA Integration) |
| Handoff Summary | Both backend tasks are complete and moved to In Review. **T-098 (UTC fix):** Overrode `pg` type parsers for OIDs 1184 (TIMESTAMPTZ) and 1114 (TIMESTAMP) in `backend/src/config/database.js`. TIMESTAMPTZ values now serialize to `new Date(val).toISOString()` — always UTC with "Z" suffix — rather than relying on the `pg` default that can mis-apply a Node.js process timezone offset. **T-103 (Trip notes):** Migration 010 adds `notes TEXT NULL` to trips. `tripModel.js` TRIP_COLUMNS updated to include `notes`. `routes/trips.js` updated for POST (notes optional, max 2000 chars, empty string → null) and PATCH (same validation + notes added to UPDATABLE_FIELDS + empty-string normalization). All 265 backend tests pass (18 new sprint7.test.js tests). |
| Notes | **QA T-105 security checks:** (1) `notes` field uses parameterized Knex query — no SQL injection. `notes` is stored/returned as-is (no server-side HTML sanitization — React escaping on frontend handles XSS). (2) `notes` max 2000 chars enforced at validate middleware layer before hitting model. (3) `database.js` pg type parser uses `new Date(val).toISOString()` — no injection vector. (4) Migration 010 reversible — `down()` drops column with `dropColumn('notes')`. **QA T-106 integration tests:** (a) T-098: Create stay with `check_in_at: "2026-08-07T20:00:00.000Z"`, `check_in_tz: "America/New_York"` → GET response `check_in_at` ends with "Z" (not "-04:00"). Frontend displays as 4:00 PM (not 12:00 PM). (b) T-103: `PATCH /trips/:id { "notes": "My trip notes" }` → 200 with notes in response. GET /trips/:id and GET /trips both return `notes` field. PATCH with 2001-char notes → 400 `VALIDATION_ERROR`. PATCH `notes: null` → clears field. **New test file:** `backend/src/__tests__/sprint7.test.js` (18 tests covering all scenarios above). |

---

### Sprint 7 — Backend Engineer → Frontend Engineer: T-098 + T-103 Backend Implementation Complete (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-098, T-103 → T-098 (FE fix), T-104 (FE Trip Notes UI) |
| Handoff Summary | Both backend tasks are implemented and tested. **T-098:** The pg type parser fix in `database.js` ensures all `check_in_at`/`check_out_at` (and all other `*_at`) fields from the API are always UTC ISO 8601 strings ending in "Z". The frontend must display times by converting UTC + the `_tz` IANA string — NOT by reading raw UTC hours. **T-103:** All three trips endpoints now include `notes: string | null`. See api-contracts.md Sprint 7 section for full shapes. Frontend can proceed with T-104 (trip notes UI on TripDetailsPage + TripCard) once migration 010 is deployed by T-107. |
| Notes | **T-098 FE fix (critical):** If StaysEditPage sends `check_in_at` as a datetime-local value without UTC conversion (e.g., "2026-08-07T16:00:00" instead of "2026-08-07T20:00:00.000Z"), the backend stores it as 16:00 UTC, and when displayed in New York timezone it shows 12:00 PM. FE must convert: given datetime-local value "2026-08-07T16:00" and timezone "America/New_York" (UTC-4 in EDT), send "2026-08-07T20:00:00.000Z". **T-104 notes UI details:** (a) GET /trips list — each trip has `notes: string | null`. Show first 100 chars + "…" on TripCard when non-null. (b) GET /trips/:id — notes section on TripDetailsPage (view + inline edit, max 2000 chars textarea, char count). (c) PATCH /trips/:id with `{ "notes": "..." }` to save, `{ "notes": null }` to clear. Empty textarea → send `null` (same as clear). |

---

### Sprint 7 — Backend Engineer → QA Engineer: Sprint 7 API Contracts Ready for Testing Reference (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Backend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Task | T-098, T-103 (contracts) → T-105 (QA Security), T-106 (QA Integration) |
| Handoff Summary | Backend Engineer has published the complete Sprint 7 API contracts in `.workflow/api-contracts.md` (Sprint 7 section). Two backend tasks have contracts documented: (1) **T-098** — UTC timestamp fix for stays endpoints. No endpoint signature change. Documents the root cause (pg driver timezone conversion), the fix approach (pg type parser override for OIDs 1184 + 1114), and confirms the existing contract shape. (2) **T-103** — Trip notes field. Documents `notes` field additions to `GET /trips`, `GET /trips/:id`, and `PATCH /trips/:id`, plus migration 010 schema. QA should reference this contract for T-105 (security checklist) and T-106 (integration testing). |
| Notes | **T-098 testing focus for QA:** (a) After fix, verify `check_in_at` and `check_out_at` in API responses always end with `Z` or `+00:00` — never a local-timezone offset like `-04:00`. (b) Create a stay with 4:00 PM local time (e.g., `America/New_York` UTC-4 → stored as `T20:00:00Z`), GET it back, confirm the returned string is the UTC form, and confirm frontend displays it as 4:00 PM (not 12:00 PM UTC). (c) Security: stays endpoints use `TIMESTAMPTZ` columns — confirm no timezone injection vector. **T-103 testing focus for QA:** (a) All three trips endpoints now include `notes` field — confirm all return it correctly (null when unset, string when set). (b) PATCH with notes > 2000 chars → 400 `VALIDATION_ERROR`. (c) PATCH with `notes: null` → clears the field. (d) Confirm `notes` field does not appear in the `flights`, `stays`, `activities`, or `land-travel` sub-resource responses (it is only on the `trips` resource). (e) SQL injection: confirm the notes field is stored via parameterized query — no raw string interpolation. (f) XSS: confirm notes is stored and returned as-is (no HTML sanitization — frontend is responsible for display escaping in React). **Migration 010:** Verify migration is reversible — `down()` must cleanly drop the column. |

---

### Sprint 7 — Frontend Engineer → QA Engineer: Sprint 7 Frontend Implementation Complete (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Frontend Engineer |
| To Agent | QA Engineer |
| Status | Pending |
| Related Tasks | T-097, T-099, T-100, T-101 |
| Handoff Summary | Frontend Engineer has completed all unblocked Sprint 7 frontend tasks. **T-097** — Fixed "+X more" calendar popover visual corruption by moving DayPopover rendering to a ReactDOM.createPortal anchored to document.body with position:fixed. Calendar grid layout no longer disrupted when popover opens. All existing popover tests pass + 3 new tests added. **T-099** — Reordered TripDetailsPage sections: Flights → Land Travel → Stays → Activities (was Flights → Stays → Activities → Land Travel). 1 test added verifying order. **T-100** — Changed ActivityDayGroup sort so all-day activities (null start_time) appear FIRST in each day group, followed by timed activities in ascending start_time order. 2 tests added. **T-101** — Calendar time display enhancements: (1) Stay checkout time shown on last day of multi-day stays ("check-out Xa"); (2) Single-day stay shows both check-in and check-out on same chip; (3) Flight arrival time shown on arrival_date when different from departure_date ("arrives Xa"); (4) Land travel arrival rendering was already implemented in Sprint 6 (no change needed). 6 tests added. **T-104 (Trip Notes)** — Blocked on T-103 (Backend: migration 010 + API changes). Will implement once T-103 is complete. |
| Notes | **What to test (T-097):** (1) Add 4+ events to same calendar day, click "+X more" → popover opens without corrupting calendar grid layout (no cell expanding, no other cells shifting). (2) Press Escape → popover closes. (3) Click close button → popover closes. (4) Click outside popover → popover closes. (5) Calendar grid visual: all 7 columns remain equal width after popover opens. **What to test (T-099):** Navigate to trip details page, verify section order is: Flights → Land Travel → Stays → Activities (land travel should appear between flights and stays, not at the bottom). **What to test (T-100):** Create a trip day with both timed activities (e.g., 9:00 AM and 2:00 PM) and all-day activities → verify all-day items appear at TOP of the day group, timed items below. **What to test (T-101):** (1) Multi-day stay: checkout day cell should show "check-out Xa" time. First day shows check-in time. Middle days show no time. (2) Single-day stay: cell shows both check-in and check-out times. (3) Flight spanning two days (departs Aug 7, arrives Aug 8): departure day shows departure time, arrival day shows "arrives Xa". **T-104 status:** Blocked on T-103. Will implement as soon as T-103 completes. |

---

### Sprint 7 — Backend Engineer → Frontend Engineer: Sprint 7 API Contracts Ready for Integration (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Backend Engineer |
| To Agent | Frontend Engineer |
| Status | Acknowledged |
| Related Task | T-098, T-103 (contracts) → T-098 (FE side fix), T-104 (FE trip notes UI) |
| Handoff Summary | Backend Engineer has published the complete Sprint 7 API contracts in `.workflow/api-contracts.md` (Sprint 7 section). Two changes affect Frontend Engineer work: (1) **T-098** — UTC timestamp serialization fix on stays endpoints. The API contract for `check_in_at` / `check_out_at` has always specified UTC ISO strings — the fix makes the backend honor this. Frontend must ensure it converts UTC → local time using `check_in_tz` / `check_out_tz` IANA timezone strings (NOT by reading the hours directly from the timestamp). If the frontend was relying on a non-UTC offset string from the backend, it must be updated. (2) **T-103** — All three trips endpoints now include a `notes` field (`string | null`). Frontend Engineer can use this immediately for T-104 (trip notes UI on TripDetailsPage + TripCard). |
| Notes | **T-098 FE integration details:** (a) Correct conversion: `new Date(check_in_at).toLocaleTimeString('en-US', { timeZone: check_in_tz, ... })`. Do NOT use `new Date(check_in_at).getHours()` (UTC hours only). (b) The check-in form sends a local datetime-local input — it should have been constructing the UTC ISO string already (e.g., using moment-timezone or Temporal API). Verify the POST/PATCH body sends the correct UTC string. (c) After the backend fix, the API response `check_in_at` will always be UTC — test against staging after T-095 re-enables HTTPS. **T-103 FE integration details (T-104):** (a) `GET /trips` list — each trip object now has `notes: string | null`. TripCard: show truncated first 100 chars + `"…"` below status badge when non-null and non-empty (Spec 13.6). (b) `GET /trips/:id` — trip object now has `notes: string | null`. TripDetailsPage: show notes section in view mode or "add trip notes…" empty placeholder (Spec 13.2). (c) `PATCH /trips/:id` — send `{ "notes": "<text>" }` to save, `{ "notes": null }` to clear. 400 `VALIDATION_ERROR` if > 2000 chars (client-side textarea maxLength should prevent this, but handle server-side 400 gracefully). (d) Notes field is NOT present on sub-resources (flights, stays, activities, land-travel). See api-contracts.md Sprint 7 section for full response shapes. |

---

### Sprint 7 — Design Agent → Frontend Engineer: Spec 13 Approved — Calendar Time Enhancements + Trip Notes UI Ready to Build (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Design Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Tasks | T-096 (Design — Done), T-101 (FE: Calendar), T-104 (FE: Trip Notes UI) |
| Spec Reference | `.workflow/ui-spec.md` → **Spec 13** (appended at end of file) |

**Summary:**
Spec 13 is published and Approved. It covers two Sprint 7 deliverables for the Frontend Engineer:

---

**For T-101 — Calendar Time Display Enhancements (blocked by T-096 ✅, unblocked now):**

Read **Spec 13, Part A (CAL-3)** for the full specification. Key points:

1. **CAL-3.2 — Stay checkout time on checkout day:**
   - Multi-day stay: add `"check-out [time]"` on the `check_out_date` chip (e.g., `"check-out 11a"`)
   - Time source: `check_out_at` (UTC ISO) converted via `check_out_tz`
   - CSS: use existing `.eventTime` class — constructed as `"check-out " + formatCalendarTime(checkoutLocalTime)`
   - Single-day stay (check_in === check_out): show both on one chip as `"4p → check-out 11a"`

2. **CAL-3.3 — Flight arrival time on arrival day:**
   - Only when `arrival_date ≠ departure_date`
   - Show `"arrives [time]"` on the `arrival_date` chip
   - Time source: `arrival_at` (UTC ISO) converted via `arrival_tz`
   - Constructed as: `"arrives " + formatCalendarTime(arrivalLocalTime)`

3. **CAL-3.4 — Land travel arrival time on arrival day:**
   - Only when `arrival_date ≠ departure_date` (and `arrival_date` is non-null)
   - Show `"arrives [time]"` on the `arrival_date` chip
   - Time source: `arrival_time` (HH:MM string, no timezone conversion)
   - If `arrival_time` is null but `arrival_date` exists: render the chip without a time element

4. **See CAL-3.5 for the complete updated time-source table** (authoritative reference replacing CAL-1.3)

5. **Regression safety:** All Sprint 6 time behavior (check-in on first stay day, departure time on departure day, activity start_time) must remain unchanged. See CAL-3.6.

6. **Note on arrival-day chip rendering:** If the current calendar implementation only maps flights to their departure date (not arrival date), you will need to extend the event-to-date mapping to also render a chip on the arrival date. Document this if you make the change.

---

**For T-104 — Trip Notes UI (blocked by T-096 ✅ AND T-103 backend; wait for T-103 before starting T-104):**

Read **Spec 13, Part B (sections 13.1–13.9)** for the full specification. Key points:

**TripDetailsPage:**
- Notes section position: below trip title/destinations row, above the `TripCalendar` component (13.2.1)
- Section header "NOTES" with a pencil edit icon on the right (standard section header row format)
- **View mode (has notes):** Notes text in IBM Plex Mono 14px font-weight 300, white-space: pre-wrap (13.2.2)
- **View mode (empty):** `"add trip notes…"` placeholder in `--text-muted`, clickable to enter edit mode — needs `role="button"` + `tabIndex={0}` (13.2.3)
- **Edit mode:** `<textarea>` with `maxLength={2000}`, always-visible char count `"X / 2,000"` below textarea (right-aligned), color shifts to amber at 1800 chars and red at 2000 chars (13.2.4)
- **Buttons:** "cancel" (secondary) + "save notes" (primary) below char count, gap 12px, flex-start
- **Save:** PATCH /trips/:id with `{ notes: editValue.trim() }` — inline spinner on save button while loading; toast error on failure (remain in edit mode)
- **Cancel:** Immediate revert, no API call

**TripCard (home page):**
- Show first 100 chars of notes + `"…"` (JS truncation, not CSS) if notes is non-null and non-empty (13.6.2)
- Font: 12px, font-weight 300, `--text-muted`, margin-top: 8px, max 2 visual lines via `-webkit-line-clamp: 2`
- Hidden entirely (`notes && notes.trim().length > 0` conditional render) when notes is null/empty (13.6.3)

**API integration (13.7):**
- GET /trips list and GET /trips/:id both include `notes` field (null when not set)
- Treat empty string `""` same as null — show empty placeholder
- PATCH /trips/:id with `{ notes: "..." }` to save; `{ notes: null }` to clear

**Skeleton state during page load:** Notes section shows a shimmer rectangle (~80px tall, full-width) during initial trip data fetch.

---

**Accessibility checklist for both tasks:**
- CAL-3 time chips: plain text, no additional ARIA needed (13.3.8)
- Notes empty placeholder: `role="button"`, `tabIndex={0}`, `aria-label="Add trip notes"`, Enter/Space activates (13.5)
- Notes textarea: `aria-label="Trip notes"`, `aria-describedby="notes-char-count"` (13.5)
- Char count warning: supplemented with `aria-live="polite"` region (13.5)
- Pencil button: `aria-label="Edit trip notes"` (13.5)
- Focus management: textarea focused on edit entry; focus returns to pencil button (or placeholder) on exit (13.5)

---

**T-101 can start immediately (T-096 is now Done).**
**T-104 must wait for T-103 (Backend: Trip Notes API) to complete before starting.**

---

### Sprint 7 — Design Agent → Backend Engineer: Spec 13 Approved — Trip Notes API Spec Ready (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Design Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Tasks | T-096 (Design — Done), T-103 (Backend: Trip Notes API) |
| Spec Reference | `.workflow/ui-spec.md` → **Spec 13, Part B, Section 13.7** |

**Summary:**
Spec 13 is published. The backend notes feature (T-103) can now start — the spec confirms the API surface the frontend will consume.

**Key API requirements from Spec 13 (Section 13.7):**

1. **Migration 010** (pre-approved by Manager): Add `notes TEXT NULL` to the `trips` table. Rollback must remove it cleanly.

2. **GET /trips/:id response** must include `notes` field:
   - `null` when not set
   - String when set

3. **GET /trips (list) response** — each trip object in `data[]` must include `notes` field (for TripCard preview on home page). This is important — the list endpoint needs to expose `notes` so the frontend doesn't have to make N+1 requests.

4. **PATCH /trips/:id** — accept optional `notes` field:
   - Any string up to 2000 characters → store as-is
   - Empty string `""` → acceptable; frontend will send trimmed content; backend may optionally coerce `""` to `null` (either is acceptable — document in T-103 notes)
   - `null` → clear notes (store NULL in DB)
   - String > 2000 characters → `400 VALIDATION_ERROR` with field error: `"notes must be 2000 characters or fewer"`

5. **No new endpoints.** Notes are part of the existing trip resource.

**Frontend truncation note:** The frontend truncates notes to 100 chars for TripCard preview in JavaScript. The backend stores and returns the full notes text — do not truncate server-side.

**T-103 can start immediately (T-096 is now Done). T-104 (Frontend Notes UI) is blocked on T-103.**

---

### Sprint 7 — Manager Agent → All Agents: Sprint #7 Planning Complete — Begin Sprint Execution (2026-02-27)

| Field | Value |
|-------|-------|
| Sprint | 7 |
| From Agent | Manager Agent |
| To Agent | All Agents |
| Status | Pending |
| Related Task | T-095 through T-109; T-094 (carry-over) |
| Handoff Summary | Sprint #7 is planned and ready to execute. Full sprint details in `.workflow/active-sprint.md`. Feedback triage complete — 7 Sprint 6 feedback entries triaged (FB-078–FB-084). Two Major bugs are P0 priorities this sprint. |

**Sprint #7 Task Summary:**

| Task | Agent | Priority | Description |
|------|-------|----------|-------------|
| T-095 | Deploy Engineer | **P0 — START IMMEDIATELY** | Re-enable HTTPS + re-register pm2 on staging. Must complete before T-094 runs. |
| T-094 | User Agent | **P0 — after T-095** | Sprint 6 feature walkthrough (carry-over). Complete before QA finalizes Sprint 7 scope. |
| T-096 | Design Agent | P1 — parallel | Spec 13: Calendar checkout/arrival times + trip notes field |
| T-097 | Frontend Engineer | **P0 — parallel** | Fix "+X more" calendar popover visual corruption (FB-080, Major bug) |
| T-098 | Backend Engineer | **P0 — parallel** | Fix stays check-in time UTC 4-hour offset bug (FB-081, Major bug) |
| T-099 | Frontend Engineer | P1 — parallel | Reorder trip details: land travel between flights and stays (FB-078) |
| T-100 | Frontend Engineer | P1 — parallel | Sort all-day activities to top of each day (FB-079) |
| T-101 | Frontend Engineer | P2 — after T-096 | Calendar: checkout time on last stay day + arrival times for flights/land travel (FB-082, FB-083) |
| T-103 | Backend Engineer | P2 — after T-096 | Trip notes backend: migration 010 + PATCH /trips/:id + GET responses |
| T-104 | Frontend Engineer | P2 — after T-096, T-103 | Trip notes frontend: TripDetailsPage inline edit + TripCard preview |
| T-105 | QA Engineer | P0 — after all impl | Security checklist + code review audit |
| T-106 | QA Engineer | P0 — after T-105 | Integration testing |
| T-107 | Deploy Engineer | P1 — after T-106 | Staging re-deployment (migration 010 + all Sprint 7) |
| T-108 | Monitor Agent | P1 — after T-107 | Staging health check |
| T-109 | User Agent | P1 — after T-108 | Sprint 7 feature walkthrough + feedback |

**Critical Context for Sprint 7 Agents:**

**Deploy Engineer (T-095 — IMMEDIATE):**
- Backend is running as a direct `node src/index.js` process (not pm2). Register: `pm2 start src/index.js --name triplanner-backend && pm2 save`
- HTTPS is disabled: SSL cert paths are commented out in `backend/.env`. Re-enable them (or re-generate self-signed cert if expired — OpenSSL command in Sprint 3 runbook).
- CORS_ORIGIN in backend must include `https://localhost:4173` (the Vite preview port used by User Agent testing)
- Frontend must be rebuilt with `VITE_API_URL=https://localhost:3001/api/v1`
- Smoke test after: `curl -k https://localhost:3001/api/v1/health` → 200 | `pm2 list` → online

**User Agent (T-094 — after T-095):**
- Test against HTTPS staging (https://localhost:4173 frontend, https://localhost:3001/api/v1 backend)
- Focus on Sprint 6 features: land travel CRUD via UI, "+X more" popover, event times on calendar chips, activity edit AM/PM, clock icon, FilterToolbar no-flicker on search
- Note any issues with "+X more" popover (FB-080 already tasked as T-097 — if you confirm it's broken, note details of the corruption for T-097)
- Note any timezone offset issues with stays (FB-081 already tasked as T-098)
- Submit feedback to feedback-log.md. Manager will triage any Critical/Major new findings before QA (T-105) starts

**Backend Engineer (T-098 — timezone bug, high priority):**
- ADR-003: Stays use `check_in_at TIMESTAMPTZ` + `check_in_tz TEXT` (IANA string). The bug: setting 4:00 PM ET results in display of 12:00 PM (4-hour shift).
- Investigate: (1) What value does `StaysEditPage.jsx` send in the POST body for `check_in_at`? Does it use `new Date()` which converts to UTC? (2) How does `formatDateTime()` in `formatDate.js` render the time — is it applying the `check_in_tz` correctly?
- Likely fix location: frontend `StaysEditPage.jsx` construction of `check_in_at` ISO string, or `formatDate.js` timezone application. The backend stores whatever timestamp it receives, so check the frontend first.
- After fix: verify `POST /stays` with check_in_at "2026-08-07T16:00:00-04:00" + check_in_tz "America/New_York" → GET /stays shows "4:00 PM" when formatted in that timezone

**Frontend Engineer (multiple tasks):**
- T-097 (+X more fix): The likely cause is the popover DOM element being rendered as a child of the day cell's CSS grid item, causing reflow. Solution: use `ReactDOM.createPortal(popoverJSX, document.body)` to render outside the grid, with absolute/fixed positioning anchored to the trigger button's `getBoundingClientRect()`. Keep all existing accessibility attributes.
- T-099 (section reorder): In `TripDetailsPage.jsx`, change the JSX render order of the four sub-resource sections to: flights → land travel → stays → activities.
- T-100 (all-day sort): In `TripDetailsPage.jsx`, the sort function for activities within a day group should put null `start_time` items first. Example: `activities.sort((a, b) => { if (!a.start_time && !b.start_time) return 0; if (!a.start_time) return -1; if (!b.start_time) return 1; return a.start_time.localeCompare(b.start_time); })`
- T-101, T-104: Wait for T-096 design spec before starting

**Feedback Triaged (FB-078–FB-084):**
- FB-078 → T-099 (Tasked): Land travel section reorder
- FB-079 → T-100 (Tasked): All-day activities sort
- FB-080 → T-097 (Tasked, P0): "+X more" popover corruption
- FB-081 → T-098 (Tasked, P0): Stays timezone offset
- FB-082 → T-101 (Tasked): Calendar checkout time
- FB-083 → T-101 (Tasked): Calendar arrival times
- FB-084 → Acknowledged (backlog): Timezone abbreviations deferred to Sprint 8

---


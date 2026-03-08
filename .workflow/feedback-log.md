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

## Sprint 15 Feedback Triage (Manager Agent — 2026-03-07)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-096 | UX Issue | Minor | **Resolved — T-154 Done** | Frontend: update `<title>` in `frontend/index.html` to "triplanner"; add favicon `<link>` tag. Both are trivial `<head>` fixes with no backend or logic changes. P3, Sprint 15. |
| FB-097 | UX Issue | Minor | **Resolved — T-154 Done** | Combined with FB-096 — same file, same task. P3, Sprint 15. |
| FB-098 | Bug | Major | **Resolved — T-155 Done** | Frontend: fix calendar land travel pick-up/drop-off chip location rendering. Pick-up day chip must render the **origin** (pick-up location); drop-off day chip must render the **destination** (drop-off location). Currently both chips incorrectly render the destination. Root cause is likely in `DayCell` and `DayPopover.getEventTime` — the `_isArrival` flag path needs to select the correct location field. P1, Sprint 15. |

---

## Sprint 13 Feedback Triage (Manager Agent — 2026-03-07)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-089 | Monitor Alert | Major | **Tasked → T-134 (T-131 re-execution)** | Deploy Engineer must use `pm2 start infra/ecosystem.config.cjs` from project root. Backend must serve on `https://localhost:3001`. P0, Sprint 13. Carried from Sprint 12. |
| FB-090 | Monitor Alert | Minor | **Tasked → T-139** | Backend Engineer to fix `api-contracts.md` — change `/land-travels` to `/land-travel` (singular). Documentation-only fix. P3, Sprint 13. |
| FB-091 | Feature Gap | Minor | **Tasked → T-137** | Frontend Engineer to rework DayPopover: use `position: absolute` (document-anchored) so popover stays open and in place on scroll. Reverts T-126 scroll-close approach. P2, Sprint 13. |
| FB-092 | Feature Gap | Minor | **Tasked → T-138** | Frontend Engineer to add "pick-up Xp" and "drop-off Xp" time chips for rental car entries on calendar (pick-up day and drop-off day respectively), matching stay check-in/check-out chip format. P2, Sprint 13. |
| FB-093 | Monitor Alert | Major | **Tasked → T-145** | JWT_SECRET in backend/.env.staging is the publicly-known placeholder value. Deploy Engineer must rotate before any external staging access. P1, Sprint 14. |
| FB-094 | Feature Gap | Minor | **Tasked → T-147** | Add a "Today" button to calendar navigation so user can jump back to current month. Frontend fix. P2, Sprint 14. |
| FB-095 | Bug | Major | **Tasked → T-146** | Calendar does not default to first event's month — still shows current month (March) even when first event is in May. T-128 implementation likely not included in deployed build, or bug in date-parsing. Must investigate and fix on staging. P1, Sprint 14. |

---

## Sprint 13 → Sprint 14 Feedback Triage (Manager Agent — 2026-03-07)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-093 | Monitor Alert | Major | **Tasked → T-145** | Deploy Engineer: rotate JWT_SECRET in `backend/.env.staging` (`openssl rand -hex 32`), restart pm2. P1, Sprint 14. Must complete before any external staging access. |
| FB-094 | Feature Gap | Minor | **Tasked → T-147** | Frontend Engineer: add "Today" button to TripCalendar navigation header. Clicking it sets `currentMonth` to the current date's month/year. P2, Sprint 14. |
| FB-095 | Bug | Major | **Tasked → T-146** | Frontend Engineer: investigate and fix T-128 regression — calendar still opens on current month even when first event is in a future month. Root cause likely in deployed build not including T-128, or a date-parsing edge case. Reproduce on staging, compare TripCalendar.jsx implementation against `getInitialMonth()` logic in source. P1, Sprint 14. |
| FB-096 | UX Issue | Minor | **Tasked → T-154** | Frontend Engineer: update `<title>` in `frontend/index.html` from "App" to "triplanner"; add `<link rel="icon" type="image/png" href="/favicon.png">` to `<head>`. P3, Sprint 15. |
| FB-097 | UX Issue | Minor | **Tasked → T-154** | Combined with FB-096 — both are `frontend/index.html` `<head>` changes with no logic or test requirements. P3, Sprint 15. |
| FB-098 | Bug | Major | **Tasked → T-155** | Frontend Engineer: fix calendar land travel chip location display — pick-up chip must show origin location (pick-up location), drop-off chip must show destination location (drop-off location). P1, Sprint 15. |

---

## Sprint 13 Monitor Agent Alerts

---

### FB-093 — Monitor Alert: Staging JWT_SECRET Is a Placeholder Value

| Field | Value |
|-------|-------|
| Feedback | backend/.env.staging JWT_SECRET is the default placeholder — tokens can be forged |
| Sprint | 13 |
| Category | Monitor Alert |
| Severity | Major |
| Status | Tasked → T-145 |
| Related Task | T-143 (health check that surfaced this), T-142 (staging deploy) |

**Detected by:** Monitor Agent — T-143 Post-Deploy Health Check — 2026-03-07T16:00:00Z

**Description:** During Sprint 13 post-deploy health check (T-143), the Monitor Agent read `backend/.env.staging` and found:

```
JWT_SECRET=CHANGE-ME-generate-with-openssl-rand-hex-32
```

This is the publicly documented placeholder value from the project template. Because this value is known, any party aware of the placeholder can forge valid JWT access tokens for the staging backend, bypassing authentication entirely. Auth endpoints (register/login) are responding correctly but the tokens they issue are signed with an insecure secret.

**Impact:**
- An attacker who knows the placeholder secret can craft arbitrary JWT tokens and authenticate as any user on staging.
- If this secret is accidentally used in production (copy-paste of .env.staging), all production tokens are compromised.
- No data confidentiality in staging — all accounts and trip data accessible without valid credentials.

**Required action:**
1. Generate a secure secret: `openssl rand -hex 32`
2. Replace `JWT_SECRET` in `backend/.env.staging` with the generated value
3. Restart the backend: `npx pm2 restart triplanner-backend`
4. Invalidate all current staging tokens (restart suffices since token signatures will no longer validate)

**This does not block staging testing** (all health checks passed), but must be resolved before any external user or third party accesses the staging environment.

---

### FB-094 — Feature Gap: Add "Today" button to calendar view

| Field | Value |
|-------|-------|
| Feedback | Calendar view needs a "Today" button to jump back to the current month |
| Sprint | 13 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked → T-147 |
| Related Task | T-128, T-147 |

**Description:** The calendar on the trip detail page currently defaults to the month of the first scheduled event (implemented in T-128, Sprint 12). If there are no planned events, it defaults to the current month. This behavior is correct. However, once the user navigates away from the current month (e.g., browsing future trip events), there is no quick way to return to the current month. Add a "Today" button to the calendar navigation that, when clicked, immediately navigates the calendar view to the current month. This button should be visible at all times in the calendar header/navigation area, consistent with the existing month navigation arrows.

**Requested by:** Project owner (manual feedback)

---

### FB-095 — Bug: Calendar does not default to first event's month (T-128 broken)

| Field | Value |
|-------|-------|
| Feedback | Calendar still defaults to current month instead of first event's month |
| Sprint | 13 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-146 |
| Related Task | T-128, T-146 |

**Description:** T-128 (Sprint 12) was supposed to make the calendar default to the month of the trip's first scheduled event. This is not working. Reproduction: open a trip with events only in May 2026 (e.g., Memorial Day trip) — the calendar defaults to March 2026 (the current month) instead of May 2026. The user must manually click the forward arrow twice to reach their events. The T-128 implementation is either not applying or has a bug in how it determines the first event's month. This needs to be investigated and fixed — the calendar should open on May 2026 when the first event is in May.

**Requested by:** Project owner (manual testing — confirmed broken)

---

### FB-096 — Browser tab title shows "App" instead of "triplanner"

| Field | Value |
|-------|-------|
| Feedback | Browser tab title displays "App" instead of "triplanner" |
| Sprint | 15 |
| Category | UX Issue |
| Severity | Minor |
| Status | Resolved — T-154 Done (2026-03-07) |
| Related Task | T-154 |

**Description:** The browser tab title currently shows "App" (likely the default Vite/React template title). It should display "triplanner" to match the product name. This is a simple fix — update the `<title>` tag in `frontend/index.html` (or equivalent) from "App" to "triplanner".

**Requested by:** Project owner

---

### FB-097 — Favicon not displayed in browser tab

| Field | Value |
|-------|-------|
| Feedback | Browser tab shows default icon — favicon.png exists but is not linked |
| Sprint | 15 |
| Category | UX Issue |
| Severity | Minor |
| Status | Resolved — T-154 Done (2026-03-07) |
| Related Task | T-154 |

**Description:** A favicon file exists at `frontend/public/favicon.png` but the browser tab displays the default browser icon instead of it. The `<link rel="icon">` tag is likely missing from `frontend/index.html`. Add `<link rel="icon" type="image/png" href="/favicon.png">` to the `<head>` section of `frontend/index.html` so the favicon appears in the browser tab.

**Requested by:** Project owner

---

### FB-098 — Calendar land travel chips show wrong location for pick-up vs drop-off

| Field | Value |
|-------|-------|
| Feedback | Pick-up and drop-off calendar chips both show drop-off destination instead of showing origin/destination respectively |
| Sprint | 15 |
| Category | Bug |
| Severity | Major |
| Status | Resolved — T-155 Done (2026-03-07) |
| Related Task | T-138, T-155 |

**Description:** On the calendar view, land travel entries (e.g., rental cars) display location chips on both the pick-up day and the drop-off day. Currently, both chips show the drop-off destination location, which is incorrect and confusing. The expected behavior is:

- **Pick-up day chip:** Should display the pick-up/origin location (where the user collects the car)
- **Drop-off day chip:** Should display the drop-off/destination location (where the user returns the car)

For example, if a rental car is picked up at "LAX Airport" and dropped off at "SFO Airport", the pick-up day should show "pick-up — LAX Airport" and the drop-off day should show "drop-off — SFO Airport". Currently both days show "SFO Airport". The frontend calendar chip rendering logic needs to differentiate between the origin and destination fields when generating pick-up vs drop-off chips.

**Requested by:** Project owner

---

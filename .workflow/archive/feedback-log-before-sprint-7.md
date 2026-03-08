## Sprint 5 Feedback

*Populated by User Agent (T-080) — 2026-02-26. All tests run against staging over HTTPS: Backend https://localhost:3001/api/v1, Frontend https://localhost:4173. Tokens obtained via fresh registration. 35+ API test scenarios executed.*

---

### FB-057 — T-072: Search by name and destination works correctly (case-insensitive, partial match)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-072 |

**What was tested:** 6 search scenarios via GET /api/v1/trips?search=<term>:
1. `?search=Tokyo` — Returns 2 trips: "Japan Adventure 2026" (Tokyo in destinations) and "Tokyo to Sydney" (Tokyo in name) ✅
2. `?search=Bali` — Returns 1 trip: "Southeast Asia" (Bali in destinations) ✅
3. `?search=tokyo` (lowercase) — Returns same 2 trips as uppercase search — case-insensitive ILIKE works correctly ✅
4. `?search=zzznomatch` — Returns `{ data: [], pagination: { total: 0 } }` — 200 OK, not error ✅
5. `?search=%20%20%20` (whitespace only) — Returns all 5 trips (whitespace trimmed, treated as no filter) ✅
6. `?search=Sing` (partial) — Returns 1 trip: "Southeast Asia" (Singapore in destinations) — partial match works ✅

All search scenarios produce correct results per the API contract.

---

### FB-058 — T-072: Status filter correctly uses computed trip status (PLANNING, ONGOING, COMPLETED)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-072 |

**What was tested:** Status filter with 5 trips spanning all three computed statuses:
- `?status=PLANNING` → Returns 3 trips (Japan Adventure 2026, Korea Trip, Tokyo to Sydney) — correctly includes no-dates trip as PLANNING ✅
- `?status=ONGOING` → Returns 1 trip (Southeast Asia — dates span today 2026-02-26) ✅
- `?status=COMPLETED` → Returns 1 trip (Europe Tour — dates in past) ✅
- `?status=INVALID` → 400 `VALIDATION_ERROR` with `"Status filter must be one of: PLANNING, ONGOING, COMPLETED"` ✅
- `?status=planning` (lowercase) → 400 `VALIDATION_ERROR` — correctly requires uppercase ✅

**Details:** The pagination.total correctly reflects the filtered count (e.g., PLANNING returns total=3, not total=5). Status computation is accurate: future trips are PLANNING, date-spanning trips are ONGOING, past trips are COMPLETED, no-date trips default to PLANNING.

---

### FB-059 — T-072: Sort by name, start_date, and created_at all work correctly with proper NULL handling

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-072 |

**What was tested:** 8 sort scenarios:
1. `?sort_by=name&sort_order=asc` → Europe Tour, Japan Adventure 2026, Korea Trip, Southeast Asia, Tokyo to Sydney — alphabetical A-Z ✅
2. `?sort_by=name&sort_order=desc` → Reversed order — Z-A ✅
3. `?sort_by=start_date&sort_order=asc` → Europe Tour (2025-06-01), Southeast Asia (2026-02-20), Japan (2026-08-07), Tokyo to Sydney (2026-12-01), Korea Trip (null) — NULLS LAST ✅
4. `?sort_by=start_date&sort_order=desc` → Tokyo to Sydney (2026-12-01), Japan (2026-08-07), Southeast Asia (2026-02-20), Europe Tour (2025-06-01), Korea Trip (null) — NULLS LAST in DESC too ✅
5. `?sort_by=created_at&sort_order=asc` → Oldest first ✅
6. `?sort_by=created_at&sort_order=desc` → Newest first ✅
7. No params → Same order as created_at desc — backward compatible ✅
8. Invalid sort_by/sort_order → 400 with proper error messages ✅

**Details:** NULLS LAST behavior is correctly applied in both ASC and DESC directions for start_date sort. Name sort is case-insensitive (uses LOWER(name) in ORDER BY). Default sort (no params) preserves Sprint 1-4 behavior exactly.

---

### FB-060 — T-072: Combined search + filter + sort parameters compose correctly

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-072 |

**What was tested:** 7 combined parameter scenarios:
1. `?search=Tokyo&status=PLANNING` → 2 trips (both Tokyo matches are PLANNING) ✅
2. `?search=Tokyo&sort_by=name&sort_order=asc` → Japan Adventure 2026, Tokyo to Sydney (alphabetical) ✅
3. `?search=a&status=PLANNING&sort_by=name&sort_order=asc` → Japan Adventure 2026, Korea Trip (both have 'a', both PLANNING, sorted) ✅
4. `?status=PLANNING&sort_by=start_date&sort_order=asc` → Japan, Tokyo to Sydney, Korea Trip (NULLS LAST) ✅
5. `?status=PLANNING&page=1&limit=2` → 2 trips, pagination.total=3 ✅
6. `?status=PLANNING&page=2&limit=2` → 1 trip, pagination.total=3 ✅
7. `?search=Tokyo&status=COMPLETED` → Empty result `{ data: [], total: 0 }` (no Tokyo trips are COMPLETED) ✅

Pagination correctly reflects filtered count, not total trips in database. All parameters compose seamlessly.

---

### FB-061 — T-072: SQL injection and XSS prevention in search parameter

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-072 |

**What was tested:** 5 attack vector scenarios:
1. `?search=';DROP TABLE trips;--` → 200 OK, empty results — SQL injection treated as literal string ✅
2. `?search=' UNION SELECT * FROM users--` → 200 OK, empty results — UNION injection treated as literal ✅
3. `?search=<script>alert(1)</script>` → 200 OK, empty results — XSS payload treated as literal ✅
4. Very long search string (500 characters) → 200 OK, empty results — handled gracefully ✅
5. No auth / invalid auth on search endpoint → 401 `UNAUTHORIZED` ✅

**Details:** All queries use Knex parameterized bindings (`?` placeholders). The search string is treated as a literal value, never interpolated into SQL. Confirmed by code review: line 145-148 of tripModel.js uses `whereRaw('name ILIKE ?', [searchTerm])` — the `?` ensures parameterization.

---

### FB-062 — T-072: ILIKE wildcard characters (%, _) in search are not escaped — minor inconsistency

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Security |
| Severity | Minor |
| Status | Acknowledged |
| Related Task | T-072 |

**Steps to reproduce:**
```
GET /api/v1/trips?search=%25 (URL-encoded %)
```

**Expected:** Return trips where the name or destination literally contains the character `%`. Or return 0 results since no trip name/destination contains `%`.

**Actual:** Returns ALL trips (total=5). The `%` character is an ILIKE wildcard, and since the search term `%` is wrapped in `%...%`, the final ILIKE pattern becomes `%%%` which matches any string.

**Details:** In `backend/src/models/tripModel.js` line 145, the search term is constructed as `` `%${search.trim()}%` `` without escaping ILIKE wildcard characters (`%` and `_`). Similarly, `_` acts as a single-character wildcard. This is NOT a SQL injection vulnerability (queries are parameterized), but it means:
1. Searching for `%` returns all trips (matches everything)
2. Searching for `_` matches any single character in trip names
3. A user could craft patterns like `%admin%` to probe for data (though results are user-scoped, so this has no cross-user impact)

**Recommendation:** Escape `%` and `_` characters before constructing the ILIKE pattern: `search.trim().replace(/%/g, '\\%').replace(/_/g, '\\_')`. Low priority since results are always user-scoped and this has no security impact beyond the user's own data.

---

### FB-063 — T-072: Validation error response includes all invalid fields in a single response

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-072 |

**What was tested:** `GET /api/v1/trips?sort_by=invalid&sort_order=invalid&status=invalid` with valid auth token.

**Result:** HTTP 400 with response:
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "status": "Status filter must be one of: PLANNING, ONGOING, COMPLETED",
      "sort_by": "Sort field must be one of: name, created_at, start_date",
      "sort_order": "Sort order must be one of: asc, desc"
    }
  }
}
```

All three invalid fields reported in a single response. Error messages are descriptive and list valid options. Response shape matches API contract exactly. The `search` parameter is correctly never included in validation errors (any string is valid).

---

### FB-064 — T-073: FilterToolbar component fully implements Spec 11 with correct debounce, accessibility, and responsiveness

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-073 |

**What was reviewed (code review):** `FilterToolbar.jsx` + `FilterToolbar.module.css`

**Spec 11 compliance verified:**
- **11.1 Layout:** flex container, gap 12px, flex-wrap for responsive, margin-bottom 24px ✅
- **11.2 Search Input:** 40px height, surface-alt background, 300ms debounce via `setTimeout`/`clearTimeout`, magnifying glass SVG icon (aria-hidden), clear button (X) visible only when input has text, `aria-label="Search trips by name or destination"`, `aria-describedby="search-hint"` with screen-reader-only hint text, `type="search"`, Escape key clears via `handleKeyDown`, immediate clear (no debounce) when emptied ✅
- **11.3 Status Filter:** Native `<select>` with 4 options (all statuses, planning, ongoing, completed), width 180px, appearance:none with custom SVG chevron, `aria-label="Filter by status"` ✅
- **11.4 Sort Selector:** Native `<select>` with 6 combined options (newest first, oldest first, name A-Z, name Z-A, soonest trip first, latest trip first), width 220px, `aria-label="Sort trips"` ✅
- **11.5 Clear Filters:** Visible only when `hasActiveFilters` is true, text "clear filters" (lowercase), 11px font, muted color, hover accent + underline, `aria-label="Clear all filters and sorting"`, returns focus to search input after clearing ✅
- **11.12 Responsive:** 3 breakpoints (>1023px default, 768-1023px reduced widths, <768px full-width stacked) ✅
- **11.13 Accessibility:** `role="search"`, `aria-label="Filter trips"` on toolbar container, all interactive elements have aria-labels, search hint for screen readers ✅
- **Cleanup:** Debounce timeout cleaned up on unmount via useEffect return ✅

---

### FB-065 — T-073: EmptySearchResults component implements Spec 11.7.3 with dynamic subtext

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-073 |

**What was reviewed (code review):** `EmptySearchResults.jsx` + `EmptySearchResults.module.css`

**Spec 11.7.3 compliance verified:**
- Centered layout with padding-top/bottom 60px ✅
- Search-with-question-mark SVG icon, 40px, accent color at 30% opacity ✅
- Heading "no trips found" — 16px, font-weight 400 ✅
- Dynamic subtext logic covers all 4 cases: search+status, search only, status only, fallback ✅
- Search term truncated at 30 characters with Unicode ellipsis (…) ✅
- Smart quotes around search term (Unicode " ") ✅
- "clear filters" secondary button with correct styling (transparent bg, accent border, hover effect) ✅
- Status label converted to lowercase (e.g., "no planning trips") ✅

---

### FB-066 — T-073: HomePage correctly integrates toolbar, URL param sync, result count, and all 6 states

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-073 |

**What was reviewed (code review):** `HomePage.jsx`

**Spec 11 integration verified:**
- **URL param sync (Spec 11.6):** `useSearchParams` reads/writes URL params. Default values omitted from URL (clean URLs). Invalid params silently ignored via `parseUrlParams()`. Uses `{ replace: true }` to avoid polluting browser history ✅
- **Result count (Spec 11.7.2):** "showing X trip(s)" text shown only when search or status filter is active. Correct singular/plural handling ("showing 1 trip" vs "showing 3 trips"). Uses `aria-live="polite"` and `role="status"` for screen readers ✅
- **Loading state (Spec 11.7.4):** Trip grid fades to 50% opacity with 200ms transition during refetch (Option A implementation per spec preference) ✅
- **Empty database state (Spec 2.4):** "no trips yet" with CTA button, toolbar NOT shown ✅
- **Empty search results (Spec 11.7.3):** EmptySearchResults component shown, toolbar remains visible ✅
- **Error state (Spec 11.7.5):** Error block with "try again" button retries with current filter params (not default) ✅
- **Initial load (Spec 11.7.6):** Skeleton cards shown, toolbar not visible until data loads ✅
- **Stale request prevention:** `requestIdRef` counter in useTrips hook ensures stale responses are discarded ✅
- **hasTripsBefore tracking:** Correctly distinguishes "zero trips in DB" from "no search results" using separate state variable ✅

---

### FB-067 — T-073: Filter toolbar briefly disappears during API refetch (toolbar flicker on slow connections)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-073 |

**Observation (code review):** In `HomePage.jsx` line 162:
```javascript
const showToolbar = initialLoadDone && !isLoading && (hasTripsBefore || trips.length > 0);
```

The `!isLoading` condition causes the toolbar to unmount during API refetch (when changing search, status, or sort). Per Spec 11.7.4: *"The toolbar controls remain interactive (user can change filters while loading)"*. With fast localhost API calls this is imperceptible, but on slower connections (production, mobile, etc.) the toolbar would visibly flash/disappear and reappear.

**Expected (per Spec 11.7.4):** Toolbar stays visible and interactive during refetch. Only the trip grid area shows a loading indicator.

**Recommended fix:** Remove `!isLoading` from the `showToolbar` condition:
```javascript
const showToolbar = initialLoadDone && (hasTripsBefore || trips.length > 0);
```
This keeps toolbar visible during refetch while still hiding it during initial page load (`initialLoadDone` is false until first fetch completes).

---

### FB-068 — T-074: React Router v7 future flags correctly applied in main.jsx and all test files

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-074 |

**What was verified (code review):** `main.jsx` line 10:
```jsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

Both `v7_startTransition` and `v7_relativeSplatPath` flags are set. All 296 frontend tests pass with zero React Router deprecation warnings. The migration is purely configurational — no behavioral changes, no routing logic modified. All 9 MemoryRouter instances in test files also have the future flags applied (per QA verification in handoff-log).

---

### FB-069 — T-075: Playwright E2E framework operational with 4/4 tests passing (9.0s)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-075 |

**What was tested:** `npx playwright test` from project root.

**Results:**
```
  ✓ Test 1: Core user flow — register, create trip, view details, delete, logout (1.6s)
  ✓ Test 2: Sub-resource CRUD — create trip, add flight, add stay, verify on details page (1.6s)
  ✓ Test 3: Search, filter, sort — create trips, search, filter by status, sort by name, clear filters (4.0s)
  ✓ Test 4: Rate limit lockout — rapid wrong-password login triggers 429 banner and disables submit (569ms)
  4 passed (9.0s)
```

All 4 E2E tests pass against the staging environment. Test 3 specifically validates the Sprint 5 search/filter/sort functionality end-to-end through the browser. The tests use Chromium with HTTPS (ignoreHTTPSErrors for self-signed cert).

---

### FB-070 — All 496 tests pass (196 backend + 296 frontend + 4 E2E) with zero regressions

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-072, T-073, T-074, T-075 |

**What was tested:** Full test suites for backend, frontend, and E2E:
- Backend: `npx vitest run` → 196/196 tests pass across 10 test files (784ms) ✅
- Frontend: `npx vitest run` → 296/296 tests pass across 21 test files (3.40s) ✅
- E2E: `npx playwright test` → 4/4 tests pass (9.0s) ✅
- Total: 496 tests, zero failures, zero regressions

Sprint 5 added 68 new tests (28 backend Sprint 5 tests + 36 frontend search/filter/sort tests + 4 E2E). Zero React Router deprecation warnings in frontend test output.

---

### FB-071 — Full Sprint 1-4 regression passes over HTTPS — all core features operational

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-080 |

**What was tested:** Complete end-to-end regression of all Sprint 1-4 features over HTTPS with fresh user:

**Auth flow:**
- Register → 201 with user object + access token ✅
- Refresh (invalid cookie) → 401 INVALID_REFRESH_TOKEN ✅
- Logout → 204 ✅

**Trip CRUD:**
- Create with destinations + dates → 201, auto-computed PLANNING status ✅
- Get → 200 ✅
- Patch → 200 ✅
- List with pagination → 200, correct total ✅
- Delete → 204, subsequent GET → 404 ✅

**Sub-resource CRUD:**
- Create flight (8 fields) → 201 ✅
- List flights → 200 ✅
- Create stay (HOTEL) → 201 ✅
- Create timed activity → 201 ✅
- Create all-day activity (null times) → 201 ✅

**Validation & Security:**
- UUID validation → 400 ✅
- No auth → 401 ✅
- Invalid JSON → 400 ✅
- Empty body → 400 with field errors ✅
- Cross-user GET → 403 FORBIDDEN ✅
- Cross-user DELETE → 403 FORBIDDEN ✅
- Other user's trip list → empty (no data leakage) ✅

**Frontend SPA & Infrastructure:**
- All SPA routes (/, /login, /trips/:id, /nonexistent) → 200 ✅
- TLS handshake successful ✅
- Security headers present (CSP, HSTS, X-Content-Type-Options, X-Frame-Options) ✅

---

### FB-072 — Frontend build output correct with proper asset hashing

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Positive |
| Severity | — |
| Status | Acknowledged |
| Related Task | T-078 |

**What was verified:** `frontend/dist/` directory exists with:
- `index.html` (388 bytes) ✅
- `assets/` directory with hashed JS and CSS bundles ✅
- Frontend serving correctly at https://localhost:4173 ✅
- All routes return 200 (SPA client-side routing) ✅

---

*End of Sprint 5 User Agent feedback. Testing completed 2026-02-26. Total entries: 16 (FB-057 through FB-072). Issues: 2 (1 minor security, 1 minor UX). Positives: 14. Highest severity: Minor. Overall impression: Excellent sprint — search/filter/sort works flawlessly end-to-end, E2E test coverage established, React Router migration clean.*

---

## Project Owner Feedback (Post-Sprint 5)

### FB-073 — Feature request: Land travel sub-resource (rental cars, buses, trains, etc.)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Feature Request |
| Severity | — |
| Status | Tasked |
| Related Task | T-086 (backend), T-087 (edit page), T-088 (trip details display) |

**Description:** Users should be able to add land travel to their trip schedule, similar to how flights and stays work today. Examples include rental car reservations, bus tickets, train rides, rideshares, and ferries. Each entry should capture at minimum: travel type/mode, origin, destination, date(s), and optional time. This would appear as a new section on the Trip Details page alongside Flights, Stays, and Activities.

**Requested by:** Project owner (manual testing feedback)

**Sprint 6 Triage (2026-02-27):** Tasked. Full sub-resource implementation: T-081 (design spec), T-086 (backend: schema migration 009 + API), T-087 (frontend: edit page), T-088 (frontend: trip details display + calendar integration).

---

### FB-074 — Feature request: Clickable "+X more" overflow on calendar days

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Feature Request |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-089 |

**Description:** When a calendar day has too many events, it shows "+X more" but clicking it does nothing. Users should be able to click the "+X more" label to see a popover or expanded view listing all events for that day.

**Requested by:** Project owner (manual testing feedback)

**Sprint 6 Triage (2026-02-27):** Tasked. Included in T-089 (calendar enhancements: "+X more" clickable day overflow popover + event times display).

---

### FB-075 — Feature request: Show times for events on the calendar

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Feature Request |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-089 |

**Description:** Calendar events currently don't display their associated times. Stays should show check-in and check-out times. Activities should show start and end times. Flights should show departure and arrival times. This gives users a quick at-a-glance schedule without needing to click into each event.

**Requested by:** Project owner (manual testing feedback)

**Sprint 6 Triage (2026-02-27):** Tasked. Included in T-089 (calendar enhancements: event time display for flights/stays/activities/land travel + "+X more" popover).

---

### FB-076 — Bug: AM/PM text cut off in activity start/end time columns

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Bug |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-083 |

**Description:** On the activity edit page, the "AM" and "PM" portion of the start and end time columns is cut off / not fully visible. The column width or layout needs to be adjusted so the full time string (including AM/PM) is readable.

**Requested by:** Project owner (manual testing feedback)

**Sprint 6 Triage (2026-02-27):** Tasked. Bundled with FB-077 into T-083 (frontend bug fixes: activity edit page time column layout + icon color).

---

### FB-077 — Bug: Clock icon in activity time columns is black instead of white

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Category | Bug |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-083 |

**Description:** On the activity edit page, the clock icon in the start and end time input columns is black. Against the dark background this makes it nearly invisible. The icon color should be white for proper contrast and readability.

**Requested by:** Project owner (manual testing feedback)

**Sprint 6 Triage (2026-02-27):** Tasked. Bundled with FB-076 into T-083 (frontend bug fixes: activity edit page time column layout + icon color).

---

## Sprint 6 Feedback

*Sprint 6 ran 2026-02-27. User Agent testing (T-094) was not completed before sprint closeout — the automated orchestrator triggered closeout while T-094 was still in Backlog status. No Sprint 6 User Agent feedback entries exist. T-094 is carried to Sprint 7 and must run before Sprint 7 planning finalizes scope.*

*Pre-sprint project owner feedback (FB-073–FB-077) was submitted post-Sprint 5 and triaged to "Tasked" at Sprint 6 planning. All five items were implemented this sprint (T-081/T-086/T-087/T-088 for land travel, T-089 for calendar enhancements, T-083 for bug fixes). No items remain New.*

**Sprint 6 Feedback Triage Summary (Manager Agent — 2026-02-27):**

| FB Entry | Category | Severity | Sprint 6 Disposition | Notes |
|----------|----------|----------|---------------------|-------|
| FB-073 | Feature Request | — | Tasked (already) → Implemented ✅ | Land travel sub-resource: T-081 + T-086 + T-087 + T-088 all Done |
| FB-074 | Feature Request | Minor | Tasked (already) → Implemented ✅ | Clickable "+X more" calendar overflow: T-089 Done |
| FB-075 | Feature Request | Minor | Tasked (already) → Implemented ✅ | Event times on calendar: T-089 Done |
| FB-076 | Bug | Minor | Tasked (already) → Implemented ✅ | AM/PM cutoff on activity edit page: T-083 Done |
| FB-077 | Bug | Minor | Tasked (already) → Implemented ✅ | Clock icon color on activity edit page: T-083 Done |

**No new Sprint 6 feedback entries. T-094 (User Agent) must complete at the start of Sprint 7.**

---

**Sprint 7 Triage — Sprint 6 Project Owner Feedback (Manager Agent — 2026-02-27):**

| FB Entry | Category | Severity | Sprint 7 Disposition | Task |
|----------|----------|----------|---------------------|------|
| FB-078 | UX Issue | Minor | Tasked | T-099 — Reorder land travel between flights and stays |
| FB-079 | UX Issue | Minor | Tasked | T-100 — Sort all-day activities to top of each day |
| FB-080 | Bug | **Major** | Tasked (P0) | T-097 — Fix "+X more" calendar popover visual corruption |
| FB-081 | Bug | **Major** | Tasked (P0) | T-098 — Fix stays check-in time UTC conversion offset bug |
| FB-082 | Feature Gap | Minor | Tasked | T-101 — Calendar checkout time on last stay day |
| FB-083 | Feature Gap | Minor | Tasked | T-101 — Calendar arrival times on arrival day for flights/land travel |
| FB-084 | Feature Gap | Minor | Acknowledged (backlog) | Timezone abbreviation display — deferred to Sprint 8 |

---

### FB-078 — UX Issue: Land travel section should appear between flights and stays

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-099 |

**Description:** On the trip details page, the land travel section should be positioned between the flights section and the stays section. Currently the ordering does not reflect the logical travel flow (fly → drive/train → check in).

**Requested by:** Project owner (manual testing feedback)

**Sprint 7 Triage (2026-02-27):** Tasked → T-099 (Frontend: reorder trip details sections — move land travel between flights and stays).

---

### FB-079 — UX Issue: All-day activities should appear at the top of each day

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-100 |

**Description:** In the activities view, all-day events should always render at the top of their respective day, above any time-specific activities. Currently they do not sort to the top.

**Requested by:** Project owner (manual testing feedback)

**Sprint 7 Triage (2026-02-27):** Tasked → T-100 (Frontend: sort all-day activities to top of each day in activities section).

---

### FB-080 — Bug: Clicking "+X more" breaks the calendar day view

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Category | Bug |
| Severity | Major |
| Status | Tasked |
| Related Task | T-089, T-097 |

**Description:** When clicking the "+X more" button on a calendar day that has overflow events, the expanded view for that day becomes visually broken/corrupted. See attached screenshot — the day cell layout is malformed after clicking the overflow indicator.

**Requested by:** Project owner (manual testing feedback)

**Sprint 7 Triage (2026-02-27):** Tasked → T-097 (Frontend: fix "+X more" calendar popover visual corruption bug). Major priority — calendar overflow popover is a user-visible regression from Sprint 6 T-089 delivery.

---

### FB-081 — Bug: Stays check-in time saved incorrectly (timezone offset issue)

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Category | Bug |
| Severity | Major |
| Status | Tasked |
| Related Task | T-098 |

**Description:** When saving a stay with a check-in time, the time is shifted incorrectly. For example, setting check-in to 4:00 PM ET results in it being saved/displayed as 12:00 PM. This is a 4-hour offset, suggesting the time is being converted from ET to UTC (or vice versa) when it should be stored and displayed as local time.

**Requested by:** Project owner (manual testing feedback)

**Sprint 7 Triage (2026-02-27):** Tasked → T-098 (Backend + Frontend: investigate and fix stays check-in/checkout time UTC conversion bug). Major priority — affects correctness of stay time display for all users.

---

### FB-082 — Feature Gap: Calendar should show checkout time on last day of stay

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-101 |

**Description:** Currently only the check-in time is displayed on the calendar for stays. The checkout time should also be shown on the last day of the stay, so users can see both when they arrive and when they must leave.

**Requested by:** Project owner (manual testing feedback)

**Sprint 7 Triage (2026-02-27):** Tasked → T-101 (Frontend: calendar time display enhancements — checkout time on last stay day + arrival times on arrival day for flights/land travel). Bundled with FB-083 into one task.

---

### FB-083 — Feature Gap: Calendar should show departure and arrival times for travel

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked |
| Related Task | T-101 |

**Description:** Flights and land travel entries on the calendar should display their departure time (on the departure day) and arrival time (on the arrival day). Currently these times are not visible on the calendar view.

**Requested by:** Project owner (manual testing feedback)

**Sprint 7 Triage (2026-02-27):** Tasked → T-101 (Frontend: calendar time display enhancements — checkout time on last stay day + arrival times on arrival day for flights/land travel). Bundled with FB-082 into one task.

---

### FB-084 — Feature Gap: Show timezone for calendar event timestamps

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Acknowledged |
| Related Task | — |

**Description:** All timestamps shown on the calendar (check-in/checkout times for stays, departure/arrival times for flights and land travel) should display the timezone abbreviation (e.g., "4:00 PM ET", "10:30 AM PST") so users know which timezone each event refers to.

**Requested by:** Project owner (manual testing feedback)

**Sprint 7 Triage (2026-02-27):** Acknowledged — deferred to backlog. Timezone abbreviation display (converting IANA timezone strings like "America/New_York" to "ET") is complex and browser-dependent. The existing compact time display on calendar chips is already small; adding a timezone label risks crowding. Deferred pending the timezone bug fix (FB-081 / T-098) and calendar display enhancements (T-101). Revisit in Sprint 8.

---


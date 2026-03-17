# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #30 — 2026-03-16

**Sprint Goal:** Fix two Critical bugs from Sprint 29 feedback — trip status change not persisting (FB-130) and flight timezone double-conversion display error (FB-131) — and add Land Travel support in TripCalendar (FB-129, Major Feature Gap). These are the highest-priority items blocking a correct, complete user experience. Production deployment (T-224/T-225) carries over — project owner action remains required for the 5th consecutive sprint.

**Context:** Sprint 29 achieved Deploy Verified = Yes (4/4 Playwright, all health checks pass). The application is staging-verified and MVP feature-complete at the code level. However, three issues in the feedback log (FB-129, FB-130, FB-131) reveal real correctness bugs and a missing calendar integration that prevent the app from being fully functional. Sprint 30 fixes these before any further production push.

**Feedback Triage (Sprint 29 → Sprint 30):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| FB-130 (trip status not saving) | Bug | Critical | **Tasked → T-238 + T-239** | Full-stack investigation and fix for trip status persistence |
| FB-131 (flight timezone shift ~4h) | Bug | Critical | **Tasked → T-240 + T-241** | Trace and fix timezone double-conversion in flight add/display pipeline |
| FB-129 (land travel not in calendar) | Feature Gap | Major | **Tasked → T-242 + T-243** | Backend: add LAND_TRAVEL events to calendar API; Frontend: render in TripCalendar |
| FB-131–FB-135 (T-237 positives) | Positive | — | Acknowledged | Playwright fix, core flow, COALESCE regression, validation — all clean |

---

## In Scope

### Phase 1 — Critical Bug: Trip Status Persistence (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-238** — Backend Engineer: Investigate and fix trip status persistence (FB-130 — backend side)

  **Root Cause Investigation:** Audit `backend/src/models/tripModel.js` `updateTrip()` function to confirm whether the `status` field is included in the allowed update columns. Also audit `backend/src/routes/trips.js` PATCH handler and Joi validation schema — confirm `status` is in the allowed PATCH fields and that the value is passed through to the model. If the backend is already correct, note that clearly so the frontend engineer can focus on T-239.

  **Acceptance criteria:**
  1. `PATCH /api/v1/trips/:id` with `{"status": "ONGOING"}` → 200, response body contains `"status": "ONGOING"`
  2. `GET /api/v1/trips/:id` after status PATCH → confirms persisted value
  3. All three transitions verified: PLANNING→ONGOING, ONGOING→COMPLETED, COMPLETED→PLANNING
  4. Existing backend tests pass; add 2-3 new tests specifically covering status PATCH round-trip
  5. Log fix in handoff-log.md; set status In Review

  **Files to audit:** `backend/src/models/tripModel.js`, `backend/src/routes/trips.js`, `backend/src/middleware/validate.js` (trip schema)

---

- [ ] **T-239** — Frontend Engineer: Investigate and fix TripStatusSelector status change (FB-130 — frontend side) ← **Can start in parallel with T-238**

  **Root Cause Investigation:** Audit `TripStatusSelector.jsx` (or equivalent component) — confirm the `onChange` handler constructs a PATCH request body with `{"status": <new_value>}` and that the API call is made correctly. Check that the response updates local React state so the UI reflects the persisted value. Also check `useTripDetails.js` or equivalent hook — confirm the status field is read from the API response and surfaced to the component.

  **Acceptance criteria:**
  1. Selecting a new status in the UI sends `PATCH /api/v1/trips/:id` with `{"status": <value>}` in the request body
  2. After save, the status selector reflects the new value (not reverting)
  3. On page reload, the updated status is shown (confirming it was persisted by backend)
  4. Add/update frontend unit tests for TripStatusSelector covering the PATCH call + state update
  5. Log fix in handoff-log.md

  **Files to audit:** `frontend/src/components/TripStatusSelector.jsx` (or similar), `frontend/src/hooks/useTripDetails.js`, `frontend/src/api.js`

---

### Phase 2 — Critical Bug: Flight Timezone Display (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-240** — Backend Engineer: Investigate and fix flight timezone storage/response (FB-131 — backend side) ← **Can start in parallel with T-238/T-239**

  **Root Cause Investigation:** The symptom is flight times shifted by ~4 hours (UTC-4/UTC-5 offset). Audit the full backend flight lifecycle:
  1. `POST /api/v1/trips/:id/flights` — what does the route/model do with `departure_at`/`arrival_at`? Is it stored as-is (ISO string) or converted?
  2. `backend/src/models/flightModel.js` `createFlight()` — does Knex/PostgreSQL apply any timezone conversion when inserting a TIMESTAMPTZ value? If the input is already a local ISO string (e.g., `2026-08-07T06:50:00`), PostgreSQL may interpret it as UTC.
  3. `GET /api/v1/trips/:id/flights` — does the model or route apply any conversion before returning? Is `departure_at` returned as UTC ISO or with offset?

  **Fix:** If PostgreSQL is converting the user's local time to UTC on storage (stripping the timezone), ensure the input includes the timezone offset (`2026-08-07T06:50:00-04:00`) OR switch to storing as plain TEXT to preserve user-entered values. Update API contract comment if the storage behavior changes.

  **Acceptance criteria:**
  1. `POST /api/v1/trips/:id/flights` with `departure_at: "2026-08-07T06:50:00-04:00"` → `GET /flights` returns the value such that formatting on the frontend produces `6:50 AM ET` (not `2:50 AM ET`)
  2. Existing flight backend tests pass; add a test verifying departure_at round-trip preserves the time value
  3. Log fix in handoff-log.md

  **Files to audit:** `backend/src/models/flightModel.js`, `backend/src/routes/flights.js`, `backend/src/db/migrations/*_flights*`

---

- [ ] **T-241** — Frontend Engineer: Investigate and fix flight timezone display in flight card (FB-131 — frontend side) ← **Can start in parallel; coordinate with T-240**

  **Root Cause Investigation:** Audit `frontend/src/utils/formatDate.js` — specifically the function(s) used to display flight departure/arrival times on the TripDetailsPage flight card. Check:
  1. Is the function converting the `departure_at` ISO string from UTC to local using `Intl.DateTimeFormat` with the `departure_tz` timezone? If so, that's correct.
  2. Is the frontend also calling `new Date(departure_at)` which will auto-apply the local machine timezone offset, causing double-conversion if `departure_at` was already adjusted?
  3. In the flight form (`FlightForm.jsx` or equivalent), is the user-entered local time being converted to UTC before being sent to the API? If so, the backend receives UTC and must return UTC — the frontend then correctly converts back. Or is the user-entered value sent as-is?

  **Fix:** Ensure exactly one timezone conversion happens in the full pipeline (either backend handles it or frontend handles it, not both). The simplest correct pattern: user enters local time → sent to backend as local ISO string with timezone offset → stored as TIMESTAMPTZ (PostgreSQL stores UTC internally) → returned as UTC ISO string → frontend converts UTC+departure_tz → displays local time.

  **Acceptance criteria:**
  1. Entering `6:50 AM ET` in the flight form → flight card on TripDetailsPage displays `6:50 AM ET` (or timezone-appropriate equivalent)
  2. Existing formatDate unit tests pass; add a test for the specific input/output pair (UTC input + ET timezone → correct local time display)
  3. Log fix in handoff-log.md

  **Files to audit:** `frontend/src/utils/formatDate.js`, `frontend/src/components/FlightCard.jsx` (or similar), `frontend/src/components/FlightForm.jsx` (or similar)

---

### Phase 3 — Major Feature Gap: Land Travel in TripCalendar (P1 — after Phase 1/2 fixes or in parallel)

- [ ] **T-242** — Backend Engineer: Add LAND_TRAVEL events to GET /api/v1/trips/:id/calendar (FB-129) ← **NO BLOCKERS — can start immediately**

  **Context:** The calendar endpoint (`calendarModel.js`) currently returns events for FLIGHT, STAY, and ACTIVITY types. Land travel entries (trains, buses, rental car trips) exist in the `land_travels` table but are not included in the calendar response. This task adds LAND_TRAVEL to the calendar event array.

  **Implementation:**
  1. In `calendarModel.js` `getCalendarEvents()`, add a query joining `land_travels` and formatting results into the events array with:
     - `type: "LAND_TRAVEL"`
     - `title`: e.g., `"{mode} — {from_location} → {to_location}"` (use actual field names from land_travels schema)
     - `start`: departure datetime
     - `end`: arrival datetime (or departure if no arrival stored)
     - `date`: date of departure
  2. Update `api-contracts.md` `GET /api/v1/trips/:id/calendar` section to document the LAND_TRAVEL event shape
  3. Add backend tests for the new event type (empty land travels → no events, 1 land travel → 1 LAND_TRAVEL event)

  **Acceptance criteria:**
  1. `GET /api/v1/trips/:id/calendar` with a land travel entry → returns events array including a `type: "LAND_TRAVEL"` entry with title, start, end, date
  2. All existing calendar tests still pass; 3+ new tests added for LAND_TRAVEL event type
  3. `api-contracts.md` updated with LAND_TRAVEL event shape
  4. Log fix in handoff-log.md; set In Review

  **Files:** `backend/src/models/calendarModel.js`, `backend/src/__tests__/calendar*`, `.workflow/api-contracts.md`

---

- [ ] **T-243** — Frontend Engineer: Render land travel events in TripCalendar (FB-129) ← Blocked by T-242

  **Context:** `TripCalendar.jsx` renders event pills per day. It currently handles FLIGHT, STAY, ACTIVITY types. This task adds LAND_TRAVEL rendering with departure/arrival time visible on the pill.

  **Implementation:**
  1. In `TripCalendar.jsx`, add a branch for `type === "LAND_TRAVEL"` events — render a pill with:
     - A distinct color/style consistent with Japandi aesthetic (muted, differentiated from flights)
     - Show departure time and arrival time directly on the pill (e.g., `"Train 10:00–14:30"`)
  2. Add click-to-scroll behavior: clicking a land travel pill scrolls to `#land-travels-section` on TripDetailsPage (matching the existing pattern for other event types)
  3. Add unit tests: LAND_TRAVEL event renders with correct text, click triggers scroll to land-travels-section

  **Acceptance criteria:**
  1. A trip with land travel entries shows LAND_TRAVEL pills on TripCalendar with departure/arrival times visible
  2. Clicking a LAND_TRAVEL pill scrolls to the land travels section
  3. No regressions on FLIGHT, STAY, ACTIVITY pill rendering
  4. Tests added for the new LAND_TRAVEL rendering path
  5. Log fix in handoff-log.md; set In Review

  **Files:** `frontend/src/components/TripCalendar.jsx`, `frontend/src/__tests__/TripCalendar.test.jsx`

---

### Phase 4 — QA, Deploy, Monitor, User Agent (sequential after all fixes)

- [ ] **T-244** — QA Engineer: Security checklist + code review (Sprint 30) ← Blocked by T-239, T-241, T-243 (all implementation tasks)

  **Scope:**
  - Security checklist (all items from `.workflow/security-checklist.md`)
  - Code review: T-238 (backend status fix), T-239 (frontend status fix), T-240 (backend timezone fix), T-241 (frontend timezone fix), T-242 (calendar LAND_TRAVEL backend), T-243 (TripCalendar LAND_TRAVEL frontend)
  - Verify all backend + frontend tests pass
  - Specific regression checks: status PATCH round-trip, flight time display, land travel calendar events
  - Log results in `qa-build-log.md` Sprint 30 section

---

- [ ] **T-245** — QA Engineer: Integration testing (Sprint 30) ← Blocked by T-244

  **Test scenarios (minimum):**
  1. Trip status PLANNING → ONGOING: PATCH → GET confirms ONGOING
  2. Trip status ONGOING → COMPLETED: PATCH → GET confirms COMPLETED
  3. Flight add with local time → detail view shows correct time (no ~4h shift)
  4. Land travel add → GET /calendar includes LAND_TRAVEL event with correct title
  5. TripCalendar renders LAND_TRAVEL pill with departure/arrival times
  6. Regression: T-229 COALESCE (PATCH dates → correct dates returned)
  7. Regression: T-235 Playwright 4/4 still pass after new changes

---

- [ ] **T-246** — Deploy Engineer: Sprint 30 staging re-deployment ← Blocked by T-245

  - Rebuild frontend (npm run build)
  - pm2 reload both services
  - Verify `GET /api/v1/health` → 200
  - Log in `qa-build-log.md`

---

- [ ] **T-247** — Monitor Agent: Sprint 30 staging health check ← Blocked by T-246

  Full health check protocol:
  - GET `/api/v1/health` → 200 ✅
  - CORS header → `Access-Control-Allow-Origin: https://localhost:4173` ✅
  - Login with `test@triplanner.local` → 200 + access token ✅
  - GET `/api/v1/trips` → 200 ✅
  - `PATCH /api/v1/trips/:id` with `{"status":"ONGOING"}` → 200, status persisted ✅
  - `POST /api/v1/trips/:id/flights` with local time, `GET /flights` → time consistent ✅
  - GET `/api/v1/trips/:id/calendar` with land travel → LAND_TRAVEL event present ✅
  - `npx playwright test` → 4/4 PASS ✅
  - Log results in `qa-build-log.md` Sprint 30 section
  - If all pass: mark **Deploy Verified = Yes**, handoff to User Agent (T-248)

---

- [ ] **T-248** — User Agent: Sprint 30 feature walkthrough ← Blocked by T-247

  **Scope:** Verify all three Sprint 30 fixes end-to-end from a user perspective:
  1. **Trip status flow:** Change trip status PLANNING→ONGOING→COMPLETED, reload page — confirm each status persists
  2. **Flight timezone:** Add a flight with `6:50 AM ET` departure, navigate to trip details — confirm flight card displays `6:50 AM` (not `2:50 AM`)
  3. **Land travel in calendar:** Add a land travel entry, view TripCalendar — confirm land travel pill appears with departure/arrival times, clicking scrolls to land travels section
  4. **Regressions:** Confirm COALESCE date fix (T-229), CORS, existing Playwright 4/4 all still passing
  5. Submit structured feedback to `feedback-log.md` under "Sprint 30 User Agent Feedback"

---

### Phase 5 — Production Deployment (P1 — project owner gate — parallel with all phases)

> ⚠️ **PROJECT OWNER ACTION REQUIRED (FIFTH ESCALATION):**
> T-224 has been blocked for five consecutive sprints (Sprints 25, 26, 27, 28, 29). All engineering work is 100% complete. The project owner must take the following human-only actions:
> 1. **AWS:** Create an RDS PostgreSQL 15 instance (db.t3.micro, us-east-1, free tier) and provide the connection string
> 2. **Render:** Apply the `render.yaml` Blueprint to provision frontend (static site) and backend (web service), both in Ohio region, free plan
>
> Documents ready: `render.yaml`, `docs/production-deploy-guide.md`, `backend/knexfile.js` (SSL + pool), `backend/src/app.js` (SameSite=None cookie for production). No agent can provision external cloud infrastructure.

- [ ] **T-224** — Deploy Engineer: Production deployment to Render + AWS RDS ← Blocked on project owner
- [ ] **T-225** — Monitor Agent: Post-production health check ← Blocked by T-224

---

## Out of Scope

- **New features beyond Sprint 30 scope** — Focus is on correctness (status bug + timezone bug) and the land travel calendar gap. No additional features until Sprint 30 is complete and staged.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **FB-121 (stay category case normalization)** — Minor UX; backlog.
- **MFA, home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Fix trip status persistence; fix flight timezone storage; add LAND_TRAVEL to calendar API | T-238, T-240, T-242 |
| Frontend Engineer | Fix TripStatusSelector status change; fix flight timezone display; render LAND_TRAVEL in TripCalendar | T-239, T-241, T-243 |
| QA Engineer | Security checklist + code review; integration testing | T-244, T-245 |
| Deploy Engineer | Sprint 30 staging re-deployment; production deployment (if T-224 unblocked) | T-246, T-224 |
| Monitor Agent | Sprint 30 staging health check; post-production check (if T-224 done) | T-247, T-225 |
| User Agent | Sprint 30 feature walkthrough — status, timezone, land travel calendar | T-248 |
| Design Agent | No tasks this sprint (existing specs accurate) | — |
| Manager | Code review + triage T-248 feedback → Sprint 31 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
Phase 1 + 2 (IMMEDIATE — NO BLOCKERS — can run in parallel):
T-238 (Backend: trip status fix)   T-239 (Frontend: TripStatusSelector fix)
T-240 (Backend: timezone fix)      T-241 (Frontend: flight display fix)
T-242 (Backend: LAND_TRAVEL calendar)
    |
T-243 (Frontend: LAND_TRAVEL TripCalendar) ← requires T-242
    |
T-244 (QA: Security checklist + code review — all implementation done)
    |
T-245 (QA: Integration testing)
    |
T-246 (Deploy: Staging re-deployment)
    |
T-247 (Monitor: Health check → Deploy Verified = Yes)
    |
T-248 (User Agent: Sprint 30 walkthrough)
    |
Manager: Triage feedback → Sprint 31 plan

Phase 5 (PROJECT OWNER GATE — parallel with all phases — 5th escalation):
[Project owner provides AWS RDS + Render credentials]
    |
T-224 (Deploy: Production deployment)
    |
T-225 (Monitor: Post-production health check)
```

---

## Definition of Done

*How do we know Sprint #30 is complete?*

- [ ] T-238: Backend status PATCH verified — `{"status":"ONGOING"}` persists and returns correctly
- [ ] T-239: TripStatusSelector fix verified — UI sends PATCH, reflects persisted value on reload
- [ ] T-240: Flight departure_at/arrival_at storage audit complete — root cause identified and fixed
- [ ] T-241: Flight card display shows correct local time (no ~4h UTC shift)
- [ ] T-242: `GET /api/v1/trips/:id/calendar` includes LAND_TRAVEL events; api-contracts.md updated
- [ ] T-243: TripCalendar renders LAND_TRAVEL pills with departure/arrival times + click-to-scroll
- [ ] T-244: QA security checklist PASS; all backend + frontend tests passing
- [ ] T-245: All 7+ integration test scenarios PASS including status + timezone + land travel
- [ ] T-246: Staging re-deployed; both services online
- [ ] T-247: Monitor confirms Deploy Verified = Yes; Playwright 4/4 still passing
- [ ] T-248: User Agent confirms status, timezone, and land travel calendar all working end-to-end
- [ ] T-248 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 30 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 31 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #30)

By end of Sprint #30, the following must be verifiable:

- [ ] **Status bug resolved** — Trip status transitions persist correctly through the full PATCH → GET lifecycle
- [ ] **Timezone bug resolved** — Flight times display the user-entered local time without UTC offset shift
- [ ] **Land travel in calendar** — Land travel events appear as TripCalendar pills with time info and correct scroll-link
- [ ] **Regression-free** — T-229 COALESCE, CORS, Playwright 4/4 all still PASS
- [ ] **User Agent sign-off** — T-248 confirms all three fixes working end-to-end from user perspective

---

## Blockers

- **T-224/T-225 are blocked on the project owner.** This is the **fifth consecutive sprint** this escalation has been raised. AWS RDS + Render account provisioning is required before production deployment can proceed. All application code, `render.yaml`, and `docs/production-deploy-guide.md` are complete and production-ready. **No agent can resolve this — it requires a human action.**
- No blockers on the engineering track. T-238, T-239, T-240, T-241, T-242 can all begin immediately in parallel.

---

*Sprint #29 archived to `.workflow/sprint-log.md` on 2026-03-16. Sprint #30 plan written by Manager Agent 2026-03-16.*

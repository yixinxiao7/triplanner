# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #28 — 2026-03-11

**Sprint Goal:** (1) Fix the Major trip date bug (FB-113/T-229) — `tripModel.js` always returns computed sub-resource dates and silently discards user-provided `start_date`/`end_date`, making the "Set dates" UI on TripDetailsPage non-functional. This is the sole P0 engineering task. (2) Carry T-224/T-225 (production deployment) forward with a clear project owner escalation — all engineering is complete and this is the only remaining MVP milestone. (3) Update `ui-spec.md` to reflect the TripCalendar self-contained fetch pattern (FB-122 — spec accuracy cleanup, P3).

**Context:** Sprint 27 shipped the T-228 CORS staging fix (both Fix A and Fix B), and the User Agent (T-219) finally completed its walkthrough after four consecutive carry-overs. Staging is healthy: 363/363 backend, 486/486 frontend, 0 vulnerabilities, CORS confirmed, 4/4 Playwright E2E. The User Agent found 1 Major bug (FB-113) and 9 positive findings. The application is feature-complete (per MVP scope) except for this date bug and the pending production deployment (project owner gate).

**Feedback Triage (Sprint 27 → Sprint 28):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| FB-113 (trip dates silently ignored) | Bug | Major | **Tasked → T-229** | `tripModel.js` TRIP_COLUMNS SQL uses LEAST/GREATEST subqueries that always override user-stored dates. COALESCE fix required. |
| FB-114 (TripCalendar positive) | Positive | — | Acknowledged | TripCalendar fully verified. |
| FB-115 (CORS fix verified) | Positive | — | Acknowledged | T-228 Fix A + Fix B confirmed live. |
| FB-116 (print button) | Positive | — | Acknowledged | Print button verified present and functional. |
| FB-117 (status filter tabs) | Positive | — | Acknowledged | StatusFilterTabs filtering verified at API level. |
| FB-118 (trip notes) | Positive | — | Acknowledged | Notes save/clear/auth verified. |
| FB-119 (destination validation) | Positive | — | Acknowledged | 400 structured error verified, no stack traces. |
| FB-120 (rate limiting) | Positive | — | Acknowledged | Login rate limiter verified 10-attempt lockout. |
| FB-121 (stay category case-sensitive) | UX Issue | Minor | Acknowledged (backlog) | Stay category requires uppercase enum. Minor friction. |
| FB-122 (TripCalendar own API call) | UX Issue | Minor | Acknowledged (backlog — T-230 spec update) | ui-spec.md states "no additional API calls" but implementation makes a dedicated calendar fetch. Spec to be updated. |

---

## In Scope

### Phase 1 — Bug Fix (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-229** — Backend Engineer: Fix `tripModel.js` TRIP_COLUMNS COALESCE for user-provided start_date/end_date ← **NO DEPENDENCIES — START IMMEDIATELY**

  **Root Cause:** `backend/src/models/tripModel.js` defines `TRIP_COLUMNS` using a `db.raw(...)` SELECT that computes `start_date` via `LEAST()` subqueries over flights/stays/activities/land_travels and `end_date` via `GREATEST()` subqueries. Migration 007 (`20260225_007_add_trip_date_range.js`) added stored `start_date`/`end_date` columns to the `trips` table, and `db('trips').update({...})` writes the user values correctly — but the TRIP_COLUMNS SELECT never reads back the stored value. It always returns the computed aggregate, which is `null` when no sub-resources exist.

  **Fix:** Change the TRIP_COLUMNS `db.raw(...)` to:
  ```sql
  COALESCE(trips.start_date, <computed LEAST(...)>) AS start_date,
  COALESCE(trips.end_date, <computed GREATEST(...)>) AS end_date
  ```
  So user-stored values take precedence, falling back to computed sub-resource aggregates when user value is null.

  **Required tests (new or updated):**
  1. PATCH `/api/v1/trips/:id` with `start_date`/`end_date` on a trip with NO sub-resources → response returns the user-provided dates (not null)
  2. PATCH `/api/v1/trips/:id` with `start_date`/`end_date` on a trip WITH sub-resources (where computed dates differ from user values) → response returns user-provided dates (not sub-resource aggregates)
  3. Trip with `start_date = null` in DB AND sub-resources → computed aggregate returned (fallback)
  4. All 363+ existing tests must continue to pass

  **Files:** `backend/src/models/tripModel.js` (TRIP_COLUMNS raw SQL), `backend/src/__tests__/trips.test.js` (new test cases)

  - Log fix in `qa-build-log.md` Sprint 28 section
  - Handoff to QA Engineer (T-231) when complete

---

### Phase 2 — Spec/Documentation Update (P3 — no dependencies, can run in parallel)

- [ ] **T-230** — Design Agent: Update `ui-spec.md` TripCalendar section to remove the "no additional API calls" statement and document the self-contained `GET /api/v1/trips/:id/calendar` fetch pattern

  **Change:** Remove or update the statement in the TripCalendar spec that reads "It uses data already fetched by the `useTripDetails` hook — no additional API calls." Replace with a note explaining that `TripCalendar.jsx` makes its own calendar endpoint fetch because the `/calendar` endpoint returns optimally shaped event data (with `start_date`/`end_date`/`start_time`/`end_time` per event) that avoids client-side reshaping.

  **Files:** `.workflow/ui-spec.md` (TripCalendar / Spec 12 section)

---

### Phase 3 — QA + Deploy + Monitor (sequential after T-229)

- [ ] **T-231** — QA Engineer: Integration check and security checklist for T-229 ← Blocked by T-229

  - Run `npm test --run` in `backend/` — all 363+ tests (including new T-229 tests) must pass
  - Run `npm test --run` in `frontend/` — all 486 tests must pass
  - Run `npm audit` in backend/ and frontend/ — 0 critical/high vulnerabilities
  - Read `backend/src/models/tripModel.js` TRIP_COLUMNS: confirm COALESCE on both `start_date` and `end_date`
  - Security checklist: no new endpoints, no schema changes, no hardcoded secrets, no SQL injection surface
  - Log results in `qa-build-log.md` Sprint 28 section
  - Handoff to Deploy Engineer (T-232)

- [ ] **T-232** — Deploy Engineer: Staging re-deploy with Sprint 28 changes ← Blocked by T-231

  - `pm2 restart triplanner-backend` (no frontend code changes needed for T-229)
  - Smoke test: `GET /api/v1/health` → 200 ✅
  - Manual PATCH smoke test: `PATCH /api/v1/trips/:id` with `{"start_date":"2026-09-01","end_date":"2026-09-30"}` on a trip with no sub-resources → response includes correct dates
  - CORS header check: `curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"` → `Access-Control-Allow-Origin: https://localhost:4173`
  - Log results in `qa-build-log.md` Sprint 28 section
  - Handoff to Monitor Agent (T-233)

- [ ] **T-233** — Monitor Agent: Staging health check ← Blocked by T-232

  Full health check protocol:
  - GET `/api/v1/health` → 200 ✅
  - CORS header → `https://localhost:4173` ✅
  - Login with `test@triplanner.local` → 200 + access token ✅
  - GET `/api/v1/trips` → 200 ✅
  - GET `/api/v1/trips/:id/calendar` → 200 ✅
  - Playwright `npx playwright test` → 4/4 PASS ✅
  - **Sprint 28 specific check:** PATCH `/api/v1/trips/:id` with `{"start_date":"2026-09-01","end_date":"2026-09-30"}` on a trip with no sub-resources → response `start_date: "2026-09-01"`, `end_date: "2026-09-30"` ✅
  - Log results in `qa-build-log.md` Sprint 28 section
  - Handoff to User Agent (T-234)

---

### Phase 4 — User Agent Verification (P0 — after T-233)

- [ ] **T-234** — User Agent: Sprint 28 feature verification ← Blocked by T-233

  **Primary scope (FB-113 fix):**
  1. Create a trip with no sub-resources
  2. PATCH the trip: `{"start_date":"2026-09-01","end_date":"2026-09-30"}` → verify response shows `start_date: "2026-09-01"`, `end_date: "2026-09-30"` (not null)
  3. Add a flight (departure before 2026-09-01) and a stay (checkout after 2026-09-30) → PATCH with same dates → verify user dates returned (not overridden by sub-resource computed dates)
  4. Verify trip cards on Home page show the user-set dates correctly

  **Regression (calendar):**
  5. TripCalendar still renders on TripDetailsPage with correct events (no regression from tripModel.js query change)
  6. Calendar empty state shown for trips with no sub-resources

  **Regression (general):**
  7. StatusFilterTabs still filter correctly
  8. Trip notes still save/clear correctly

  - Submit structured feedback to `feedback-log.md` under **"Sprint 28 User Agent Feedback"**
  - All feedback entries must have Category, Severity, and Status: New

---

### Phase 5 — Production Deployment (P1 — project owner gate — parallel with all phases)

> ⚠️ **PROJECT OWNER ACTION REQUIRED (THIRD ESCALATION):**
> T-224 has been blocked for three consecutive sprints. The project owner must:
> 1. Provide **AWS account access** to create an RDS PostgreSQL 15 instance (db.t3.micro, us-east-1, free tier)
> 2. Provide **Render account access** to apply the `render.yaml` Blueprint (or create services manually)
>
> All code, configuration (`render.yaml`, knexfile SSL, cookie SameSite), and documentation (`docs/production-deploy-guide.md`) are complete. Production deployment is the only remaining MVP milestone. This requires a human action — no agent can provision external cloud infrastructure.

- [ ] **T-224** — Deploy Engineer: Production deployment to Render + AWS RDS ← Blocked on project owner

  Follow `docs/production-deploy-guide.md` step by step.

- [ ] **T-225** — Monitor Agent: Post-production health check ← Blocked by T-224

---

## Out of Scope

- **New features** — No new feature work until the trip date bug is fixed and production is deployed.
- **Stay category normalization (FB-121)** — Minor UX issue; stays in backlog. Frontend form sends correct uppercase values; this only affects direct API consumers.
- **MFA, home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.
- **B-020 (Redis rate limiting), B-024 (per-account rate limiting)** — Backlog; in-memory store sufficient at current scale.
- **knexfile staging seeds config** — Minor workaround exists; not Sprint 28.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Trip date COALESCE fix | T-229 |
| Design Agent | ui-spec.md TripCalendar section update | T-230 |
| QA Engineer | Integration check for T-229 | T-231 |
| Deploy Engineer | Staging re-deploy + production deploy (if unblocked) | T-232, T-224 |
| Monitor Agent | Staging health check + production health check (if unblocked) | T-233, T-225 |
| User Agent | FB-113 fix verification + regression | T-234 |
| Manager | Code review (T-229); T-234 feedback triage | Reviews |

---

## Dependency Chain (Critical Path)

```
Phase 1 (IMMEDIATE — NO BLOCKERS):
T-229 (Backend: tripModel.js COALESCE fix for start_date/end_date)
    |
T-231 (QA: Integration check + security checklist)
    |
T-232 (Deploy: Staging re-deploy)
    |
T-233 (Monitor: Staging health check + FB-113 verification)
    |
T-234 (User Agent: Trip date fix verification + regression)
    |
Manager: Triage T-234 feedback → Sprint 29 plan

Phase 2 (PARALLEL — NO BLOCKERS):
T-230 (Design Agent: ui-spec.md TripCalendar update — standalone doc change)

Phase 5 (PROJECT OWNER GATE — parallel with all phases):
[Project owner provides AWS RDS + Render credentials]
    |
T-224 (Deploy: Production deployment)
    |
T-225 (Monitor: Post-production health check)
```

---

## Definition of Done

*How do we know Sprint #28 is complete?*

- [ ] T-229: COALESCE fix implemented — PATCH trips with start_date/end_date on a trip with no sub-resources → user values returned in response (not null)
- [ ] T-229: PATCH trips with sub-resources and explicit user dates → user dates returned (not overridden by computed aggregates)
- [ ] T-229: All 363+ existing backend tests pass + new date tests pass
- [ ] T-230: ui-spec.md TripCalendar section updated — "no additional API calls" statement removed/corrected
- [ ] T-231: QA integration check passes (tests + audit + config review)
- [ ] T-232: Staging re-deployed and smoke tests pass
- [ ] T-233: Monitor confirms staging healthy; FB-113 fix verified via PATCH smoke test; Playwright 4/4 PASS
- [ ] T-234: User Agent confirms trip date "Set dates" UI works end-to-end; structured feedback submitted
- [ ] T-234 feedback triaged by Manager (all entries Tasked, Acknowledged, or Won't Fix)
- [ ] T-224: Production deployed to Render + AWS RDS *(conditional on project owner providing access)*
- [ ] T-225: Post-production health check complete *(conditional on T-224)*
- [ ] Sprint 28 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 29 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #28)

By end of Sprint #28, the following must be verifiable:

- [ ] **T-229 Done** — `PATCH /api/v1/trips/:id` with `start_date`/`end_date` returns the user-provided values; "Set dates" UI on TripDetailsPage is functional end-to-end
- [ ] **T-230 Done** — ui-spec.md TripCalendar section accurately reflects the implemented fetch pattern
- [ ] **T-234 Done** — User Agent confirms the trip date fix works in a real browser flow on staging; all regressions pass
- [ ] **T-224 Done** *(project owner dependent)* — Application is live in production; AWS RDS connected; migrations run
- [ ] **T-225 Done** *(project owner dependent)* — Monitor confirms production health; SameSite=None cookie verified

---

## Blockers

- **T-224/T-225 are blocked on the project owner.** This is the third consecutive sprint this escalation has been raised. AWS RDS + Render account provisioning is required. All application code, `render.yaml`, and `docs/production-deploy-guide.md` are complete and production-ready.
- No blockers on the engineering track (T-229 through T-234). Work can begin immediately.

---

*Sprint #27 archived to `.workflow/sprint-log.md` on 2026-03-11. Sprint #28 plan written by Manager Agent 2026-03-11.*

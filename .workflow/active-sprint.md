# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #2 — 2026-02-25 to 2026-03-09

**Sprint Goal**: Deliver the core editing experience for trip sub-resources — users can add, edit, and delete flights, stays, and activities via dedicated edit pages. Introduce trip date range support (start/end dates), trip status auto-calculation (ONGOING/COMPLETED), and the integrated calendar view at the top of the trip details page. Ship Sprint 1 bug fixes (UUID validation, activity_date format, rate limiting) as P0 pre-requisites.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 1 — Design Specs (start immediately)
- [ ] T-023 — Design spec: Flights edit page
- [ ] T-024 — Design spec: Stays edit page
- [ ] T-025 — Design spec: Activities edit page (multi-row form)
- [ ] T-026 — Design spec: Calendar component + trip date range UI

### Phase 2 — Backend Fixes & Contract Updates (start immediately, parallel to Design)
- [ ] T-027 — Backend bug fixes: UUID validation + activity_date format + JSON error code (P0 — B-009, B-010, B-012)
- [ ] T-028 — Backend security: express-rate-limit on auth routes (P0 — B-011)
- [ ] T-029 — Backend: Trip date range — schema migration + API update (B-006) *(Manager pre-approved schema change 2026-02-25)*

### Phase 3a — Backend Enhancements (after Phase 2 T-029 done)
- [ ] T-030 — Backend: Trip status auto-calculation based on dates (B-005)

### Phase 3b — Frontend Edit Pages (after Phase 1 Design specs + T-027 backend fixes done)
- [ ] T-031 — Frontend: Flights edit page (add/edit/delete flights)
- [ ] T-032 — Frontend: Stays edit page (add/edit/delete stays)
- [ ] T-033 — Frontend: Activities edit page (multi-row, add/delete rows, batch save)
- [ ] T-034 — Frontend: Trip date range UI (date pickers in trip details + updated trip cards)

### Phase 4 — Calendar (after all edit pages + trip date range done) *(P2 stretch — may carry to Sprint 3 if capacity insufficient)*
- [ ] T-035 — Frontend: Calendar component integrated with flights/stays/activities

### Phase 5 — QA, Deploy, Monitor (sequential after all implementation tasks)
- [ ] T-036 — QA: Security checklist + code review audit
- [ ] T-037 — QA: Integration testing (full edit flow end-to-end)
- [ ] T-038 — Deploy: Staging re-deployment (new migration + rebuilt frontend)
- [ ] T-039 — Monitor: Staging health check
- [ ] T-040 — User Agent: Feature walkthrough + feedback

---

## Out of Scope

*These items are explicitly deferred to Sprint #3 or later. Do not start them this sprint.*

- **Multi-destination structured UI (B-007)** — Sprint 3+. Destinations are stored as a text array; structured add/remove UI is deferred.
- **Production deployment (B-008)** — Sprint 3+. Requires HTTPS, pm2/Docker, and full edit-flow stability first.
- **HTTPS configuration (B-014)** — Sprint 3+. Required before production but not blocking staging work.
- **pm2 process management for staging (B-013)** — Sprint 3+. Low priority infrastructure improvement.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), schema change pre-approval, code review, unblock agents | Review T-023–T-035 specs + implementations; approve before FE tasks start |
| Design Agent | UI specs for all three edit page types + calendar + trip date range | T-023, T-024, T-025, T-026 |
| Backend Engineer | Bug fixes (P0), rate limiting (P0), trip date range migration + API, status auto-calc | T-027, T-028, T-029, T-030 |
| Frontend Engineer | All four edit pages + trip date range UI + calendar component | T-031, T-032, T-033, T-034, T-035 |
| QA Engineer | Security checklist for all new features, integration testing end-to-end edit flows | T-036, T-037 |
| Deploy Engineer | Apply new DB migration, rebuild + redeploy frontend and backend | T-038 |
| Monitor Agent | Health checks (Sprint 1 regression + new Sprint 2 checks) | T-039 |
| User Agent | Full walkthrough of edit flows, date range, calendar; submit structured feedback | T-040 |

---

## Dependency Chain (Critical Path)

```
T-023 (Design: Flights Edit)      ──────────────────────┐
T-024 (Design: Stays Edit)        ──────────────────────┤
T-025 (Design: Activities Edit)   ──────────────────────┤
T-026 (Design: Calendar + Dates)  ──────────────────────┤
                                                         ↓
T-027 (BE Bug Fixes: UUID/date/JSON) ────────────────────┤
T-028 (BE Security: Rate Limit)   ───────────────────────┤
T-029 (BE: Trip Date Range Schema) ──────────────────────┤
                                                         ↓
T-030 (BE: Status Auto-calc) ← T-029 ──────────────────┤
                                                         ↓
T-031 (FE: Flights Edit)  ← T-023, T-027 ──────────────┤
T-032 (FE: Stays Edit)    ← T-024, T-027 ──────────────┤
T-033 (FE: Activities Edit) ← T-025, T-027 ────────────┤
T-034 (FE: Trip Date Range UI) ← T-026, T-029 ─────────┤
                                                         ↓
T-035 (FE: Calendar) ← T-026, T-031–T-034 ─────────────┤
                                                         ↓
                              T-036 (QA: Security + Code Review)
                                                         ↓
                              T-037 (QA: Integration Tests)
                                                         ↓
                              T-038 (Deploy: Staging Re-deploy)
                                                         ↓
                              T-039 (Monitor: Health Check)
                                                         ↓
                              T-040 (User Agent: Testing)
```

---

## Schema Change Pre-Approval

**Approved by Manager Agent — 2026-02-25**

As part of Sprint 2 planning, the following schema change is pre-approved for T-029:

- **Change:** Add `start_date DATE NULL` and `end_date DATE NULL` to the `trips` table.
- **Rationale:** Required to display trip timeline on trip cards, enable status auto-calculation (ONGOING/COMPLETED), and populate the calendar component with an authoritative date range.
- **Migration:** New Knex migration file (e.g., `20260225_007_add_trip_date_range.js`) with `up()` adding both columns and `down()` dropping them. Both columns default to NULL — existing trips unaffected.
- **API Impact:** `POST /trips`, `PATCH /trips/:id`, `GET /trips`, `GET /trips/:id` — all must be updated to include `start_date` and `end_date` in request/response shapes. Backend Engineer must update `api-contracts.md` before implementation.

Backend Engineer should document the full updated API contract in `.workflow/api-contracts.md` before writing any code (Rule #11 + #22).

---

## Definition of Done

*How do we know Sprint #2 is complete?*

- [ ] Design Agent has published UI specs for all four Sprint 2 design tasks (T-023–T-026) to `.workflow/ui-spec.md`
- [ ] Manager Agent has reviewed and approved the design specs before frontend work starts
- [ ] Backend Engineer has updated API contracts in `.workflow/api-contracts.md` for T-029 before implementation
- [ ] All Phase 2 backend bug fixes (T-027, T-028) are verified by QA to actually fix the reported issues (UUID → 400, activity_date → YYYY-MM-DD, rate limit → 429)
- [ ] All Phase 3 tasks (T-029–T-034) are marked Done in dev-cycle-tracker.md
- [ ] Frontend edit pages (T-031, T-032, T-033) each have unit tests covering: render, form submit, edit existing, delete, cancel routing
- [ ] T-034 (trip date range UI) has unit tests for card display and PATCH integration
- [ ] T-035 (calendar) — if complete: unit tests for event rendering and navigation. If not complete: carried to Sprint 3, placeholder remains.
- [ ] All task dependencies (Blocked By) are resolved before moving tasks to In Progress
- [ ] Manager Agent has completed code review for all implementation tasks
- [ ] QA Engineer has completed security checklist (T-036) and integration testing (T-037)
- [ ] QA Engineer has logged all results in `.workflow/qa-build-log.md`
- [ ] Deploy Engineer has applied T-029 migration and redeployed to staging (T-038)
- [ ] Monitor Agent has verified staging health (T-039) — all Sprint 1 checks pass + all Sprint 2 new checks pass
- [ ] User Agent has tested all new edit flows and submitted feedback to `.workflow/feedback-log.md` (T-040)
- [ ] Manager Agent has triaged all Sprint 2 feedback entries (New → Tasked/Acknowledged/Won't Fix)
- [ ] Sprint summary added to `.workflow/sprint-log.md`

---

## Success Criteria (from Project Brief — Sprint 2 Additions)

By the end of Sprint #2, the following must be verifiable on staging (in addition to all Sprint 1 criteria):

- [ ] A user can navigate to the flights edit page and add a new flight — the flight appears on the trip details page with correct timezone display
- [ ] A user can add, edit, and delete stays — changes persist and appear correctly on trip details
- [ ] A user can add multiple activities via the activities edit page, click "+", and have them all saved and grouped by date on the trip details page
- [ ] A user can cancel any edit page and be returned to trip details with no data changed
- [ ] A user can set a start and end date on a trip — the date range appears on the home page trip card
- [ ] Invalid UUID path parameters return HTTP 400 (not 500) — no PostgreSQL error codes leak to the client
- [ ] The `/auth/login` endpoint throttles after 10 rapid requests and returns HTTP 429
- [ ] The `activity_date` field in API responses is a YYYY-MM-DD string (not an ISO timestamp)
- [ ] *(Stretch)* The calendar component shows all flights, stays, and activities on their correct dates

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

*None currently. All Phase 1 and Phase 2 tasks are unblocked and ready to start.*

---

*Previous sprint (Sprint #1) archived to `.workflow/sprint-log.md` on 2026-02-24. Sprint #2 begins 2026-02-25.*

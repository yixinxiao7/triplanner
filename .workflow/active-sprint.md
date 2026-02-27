# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #6 — 2026-02-27 to 2026-03-12

**Sprint Goal**: Deliver the land travel sub-resource (rental cars, buses, trains, rideshares, ferries) as a full new section on the trip details page with a dedicated edit experience. Enhance the calendar with event time display and a clickable "+X more" day overflow popover. Fix two project-owner-reported activity edit page bugs (AM/PM cutoff, clock icon color). Close spec compliance gap on the FilterToolbar refetch flicker. Ship the ILIKE wildcard search escaping fix.

**Context:** Sprint 5 delivered search/filter/sort, E2E testing, and React Router v7 migration — all verified perfect by the User Agent (14/16 positives, 2 minor issues). The application has 496 tests (196 backend + 296 frontend + 4 E2E), full HTTPS, comprehensive accessibility, and 5 consecutive zero-rework-cycle sprints. Sprint 6 is a feature expansion sprint driven entirely by project owner feedback: adding land travel fills a gap in the trip-planning hub (users currently have no way to record ground transportation), and the calendar enhancements address the most common usability requests from manual testing.

**Manager Pre-Approved Schema Change:** Adding `land_travels` table (migration 009). Columns: `id` UUID PK, `trip_id` UUID FK (CASCADE DELETE), `mode` TEXT NOT NULL (RENTAL_CAR|BUS|TRAIN|RIDESHARE|FERRY|OTHER), `provider` TEXT NULL, `from_location` TEXT NOT NULL, `to_location` TEXT NOT NULL, `departure_date` DATE NOT NULL, `departure_time` TIME NULL, `arrival_date` DATE NULL, `arrival_time` TIME NULL, `confirmation_number` TEXT NULL, `notes` TEXT NULL, `created_at` TIMESTAMPTZ DEFAULT NOW(), `updated_at` TIMESTAMPTZ DEFAULT NOW(). Index on `trip_id`. Pre-approved to allow T-086 to proceed immediately after T-081 design spec is reviewed.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 1 — Design Specs (start immediately)
- [ ] T-081 — Design spec: Land travel section (trip details display + edit page) — Spec 12
- [ ] T-082 — Design spec addendum: Calendar enhancements (event times + "+X more" popover)

### Phase 2 — Quick Bug Fixes (start immediately, parallel with Design)
- [ ] T-083 — Frontend: Fix activity edit page bugs (AM/PM cutoff + clock icon color) ← no blockers
- [ ] T-084 — Frontend: Fix FilterToolbar refetch flicker (remove !isLoading from showToolbar) ← no blockers
- [ ] T-085 — Backend: Escape ILIKE wildcard chars in search parameter ← no blockers

### Phase 3 — Backend: Land Travel (starts after T-081 design spec approved)
- [ ] T-086 — Backend: Land travel API contract + migration 009 + full CRUD ← T-081

### Phase 4 — Frontend: Land Travel + Calendar (depends on Design + Backend)
- [ ] T-087 — Frontend: Land travel edit page ← T-081, T-086
- [ ] T-088 — Frontend: Land travel section on trip details + calendar data integration ← T-081, T-086
- [ ] T-089 — Frontend: Calendar enhancements (event times + "+X more" popover) ← T-082, T-088

### Phase 5 — QA, Deploy, Monitor, User (sequential after all implementation)
- [ ] T-090 — QA: Security checklist + code review audit ← T-083, T-084, T-085, T-086, T-087, T-088, T-089
- [ ] T-091 — QA: Integration testing ← T-090
- [ ] T-092 — Deploy: Staging re-deployment (migration 009) ← T-091
- [ ] T-093 — Monitor: Staging health check ← T-092
- [ ] T-094 — User Agent: Feature walkthrough + feedback ← T-093

---

## Out of Scope

*These items are explicitly deferred. Do not start them this sprint.*

- **B-022 — Production deployment to hosting provider** — Still blocked on the project owner selecting a hosting provider (Railway, Fly.io, Render, AWS), configuring DNS, approving budget, and provisioning production PostgreSQL. **Escalated to project owner since Sprint 3.** All deployment preparation is complete. The application is fully deployment-ready.
- **B-030 — Trip notes/description field** — Useful enhancement. Deferred to Sprint 7 to keep Sprint 6 scope focused on land travel and calendar enhancements.
- **B-031 — Activity location links (clickable URLs)** — Minor enhancement. Deferred to Sprint 7+.
- **B-032 — Trip export/print** — Useful enhancement. Deferred to Sprint 7+.
- **B-020 — Rate limiting persistence (Redis)** — In-memory rate limiting acceptable for current single-instance deployment. Deferred until production architecture defined.
- **B-024 — Per-account rate limiting** — Enhancement. Depends on B-020. Deferred.
- **B-021 — Dev dependency esbuild vulnerability** — No production impact. Monitor for upstream fix.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), code review all implementation tasks, approve schema, triage feedback | Review T-081–T-089 specs + implementations; approve before downstream tasks start |
| Design Agent | Land travel UI spec + calendar enhancement spec | T-081, T-082 |
| Backend Engineer | ILIKE wildcard fix + land travel API + migration 009 | T-085, T-086 |
| Frontend Engineer | Activity bugs, toolbar fix, land travel edit + display, calendar enhancements | T-083, T-084, T-087, T-088, T-089 |
| QA Engineer | Security checklist + integration testing | T-090, T-091 |
| Deploy Engineer | Staging re-deployment (migration 009 + all Sprint 6 changes) | T-092 |
| Monitor Agent | Health checks (Sprint 5 regression + Sprint 6 features) | T-093 |
| User Agent | Test land travel, calendar, bug fixes, Sprint 5 regression, feedback | T-094 |

---

## Dependency Chain (Critical Path)

```
T-081 (Design: Land Travel Spec)  ──────────────────────────────────┐
T-082 (Design: Calendar Spec)     ───────────────────────────────┐  │  (parallel)
T-083 (FE: Activity Edit Bugs)    ──────────────────────────────── ─┤  (parallel, no blockers)
T-084 (FE: Toolbar Flicker Fix)   ──────────────────────────────── ─┤  (parallel, no blockers)
T-085 (BE: ILIKE Escape Fix)      ──────────────────────────────── ─┤  (parallel, no blockers)
                                                                     │
                       T-086 (BE: Land Travel API) ← T-081 ─────────┤
                                                                     │
                       T-087 (FE: Land Travel Edit) ← T-081, T-086  │
                       T-088 (FE: Land Travel Display) ← T-081, T-086─┤
                                                                     │
                       T-089 (FE: Calendar Enhancements) ← T-082, T-088
                                                                     │
                       T-090 (QA: Security + Code Review) ← all above
                                                                     ↓
                       T-091 (QA: Integration Tests)
                                                                     ↓
                       T-092 (Deploy: Staging Re-deploy w/ migration 009)
                                                                     ↓
                       T-093 (Monitor: Health Check)
                                                                     ↓
                       T-094 (User Agent: Testing)
```

**Note on parallelism:** Phases 1 (Design) and 2 (Bug Fixes) all start simultaneously. T-085 (ILIKE fix) starts immediately with no blockers. T-086 (land travel backend) must wait for T-081 (design spec) to be reviewed and approved. T-087 and T-088 (frontend) must wait for both T-081 and T-086. T-089 (calendar) must wait for T-082 (design spec) and T-088 (to have land travel data structure established). Critical path: T-081 → T-086 → T-088 → T-089 → T-090 → T-091 → T-092 → T-093 → T-094.

---

## Sprint 5 Feedback Triage Summary

*Triaged by Manager Agent on 2026-02-27 as part of Sprint 6 planning.*

| FB Entry | Category | Severity | Sprint 6 Disposition | Task |
|----------|----------|----------|---------------------|------|
| FB-057 | Positive | — | Acknowledged | — |
| FB-058 | Positive | — | Acknowledged | — |
| FB-059 | Positive | — | Acknowledged | — |
| FB-060 | Positive | — | Acknowledged | — |
| FB-061 | Positive | — | Acknowledged | — |
| FB-062 | Security | Minor | **Tasked → T-085** | ILIKE wildcard escaping |
| FB-063 | Positive | — | Acknowledged | — |
| FB-064 | Positive | — | Acknowledged | — |
| FB-065 | Positive | — | Acknowledged | — |
| FB-066 | Positive | — | Acknowledged | — |
| FB-067 | UX Issue | Minor | **Tasked → T-084** | FilterToolbar refetch flicker (was B-034) |
| FB-068 | Positive | — | Acknowledged | — |
| FB-069 | Positive | — | Acknowledged | — |
| FB-070 | Positive | — | Acknowledged | — |
| FB-071 | Positive | — | Acknowledged | — |
| FB-072 | Positive | — | Acknowledged | — |
| FB-073 | Feature Request | — | **Tasked → T-081, T-086, T-087, T-088** | Land travel sub-resource |
| FB-074 | Feature Request | Minor | **Tasked → T-089** | Clickable "+X more" calendar overflow |
| FB-075 | Feature Request | Minor | **Tasked → T-089** | Event times on calendar |
| FB-076 | Bug | Minor | **Tasked → T-083** | AM/PM cutoff in activity edit page |
| FB-077 | Bug | Minor | **Tasked → T-083** | Clock icon color in activity edit page |

**Summary:** 14 positives (all Acknowledged). 5 new issues/requests from project owner feedback (FB-073–FB-077) — all Tasked. 2 carried-over items from Sprint 5 user agent testing (FB-062 → T-085, FB-067 → T-084). Total Sprint 6 tasks: 14 (T-081–T-094). No items declined (Won't Fix). The land travel feature (FB-073) is the largest work item and drives the critical path. All feedback-driven tasks are addressed this sprint.

---

## Definition of Done

*How do we know Sprint #6 is complete?*

- [ ] Design Agent has published land travel Spec 12 to `.workflow/ui-spec.md` (T-081) — reviewed and approved by Manager before T-086 starts
- [ ] Design Agent has published calendar enhancement spec addendum (T-082) — reviewed and approved by Manager before T-089 starts
- [ ] Backend Engineer has published land travel API contract to `.workflow/api-contracts.md` before implementation (T-086)
- [ ] Migration 009 creates `land_travels` table with correct schema and rollback works (T-086)
- [ ] POST /api/v1/trips/:id/land-travel creates land travel entry with all fields → 201 (T-086)
- [ ] GET /api/v1/trips/:id/land-travel lists entries sorted by departure_date asc → 200 (T-086)
- [ ] PATCH /api/v1/trips/:id/land-travel/:ltId updates entry → 200 (T-086)
- [ ] DELETE /api/v1/trips/:id/land-travel/:ltId → 204 (T-086)
- [ ] Cross-user access to land travel entries → 403 (T-086)
- [ ] Frontend land travel edit page renders form, user can add/edit/delete entries, save persists (T-087)
- [ ] Land travel section on trip details page shows entries and passes data to calendar (T-088)
- [ ] Calendar event chips display times for flights/stays/activities/land travel (T-089)
- [ ] "+X more" calendar overflow is a clickable button that opens a popover with all events for that day (T-089)
- [ ] Activity edit page AM/PM fully visible in time columns (T-083, FB-076 resolved)
- [ ] Activity edit page clock icon is white/light colored (T-083, FB-077 resolved)
- [ ] FilterToolbar stays visible during API refetch (T-084, FB-067/B-034 resolved)
- [ ] GET /trips?search=% returns 0 results, not all trips (T-085, FB-062/B-033 resolved)
- [ ] All task dependencies (Blocked By) are resolved before moving tasks to In Progress
- [ ] Manager Agent has completed code review for all implementation tasks
- [ ] QA Engineer has completed security checklist (T-090) and integration testing (T-091)
- [ ] QA Engineer has logged all results in `.workflow/qa-build-log.md`
- [ ] Deploy Engineer has redeployed to staging with migration 009 and all Sprint 6 changes (T-092)
- [ ] Monitor Agent has verified staging health — all Sprint 5 checks pass + Sprint 6 checks pass (T-093)
- [ ] User Agent has tested all changes and submitted feedback to `.workflow/feedback-log.md` (T-094)
- [ ] Manager Agent has triaged all Sprint 6 feedback entries (New → Tasked/Acknowledged/Won't Fix)
- [ ] Sprint summary added to `.workflow/sprint-log.md`

---

## Success Criteria (Sprint 6)

By the end of Sprint #6, the following must be verifiable on staging (in addition to all Sprint 1–5 criteria):

- [ ] User can navigate to `/trips/:id/land-travel/edit`, add a rental car entry (mode=RENTAL_CAR, from=SFO, to=Los Angeles, departure_date=2026-08-07), save → entry appears in land travel section on trip details
- [ ] Land travel entry appears on the calendar on departure_date with distinct color
- [ ] POST /api/v1/trips/:id/land-travel with invalid mode → 400 VALIDATION_ERROR
- [ ] Cross-user GET /api/v1/trips/:id/land-travel → 403 FORBIDDEN
- [ ] Calendar flight event chip shows departure time (e.g., "9a")
- [ ] Calendar activity event chip shows start time (e.g., "2p")
- [ ] Calendar day with 4+ events shows "+X more" button; clicking reveals popover with all events
- [ ] Pressing Escape closes the "+X more" popover
- [ ] Activity edit page: AM/PM suffix fully visible without truncation
- [ ] Activity edit page: clock icon visible (white/light colored) against dark background
- [ ] Home page: FilterToolbar does NOT disappear when search term is typed (no flicker)
- [ ] GET /api/v1/trips?search=% returns empty results (not all trips)
- [ ] All 496+ existing tests pass (no regressions)
- [ ] All Sprint 1–5 features still work over HTTPS (full regression)

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

- **B-022 (Production Deployment):** Deferred to Sprint 7+ pending project owner decision on hosting provider. All deployment preparation complete since Sprint 3. This is NOT a Sprint 6 blocker — staging continues to be the target environment.
- **Docker availability:** Sprint 6 does not add Docker complexity. No new blockers from Docker unavailability.

*No implementation blockers. Phase 1 (Design), Phase 2 (Bug Fixes), and T-085 are all unblocked and ready to start immediately.*

---

*Previous sprint (Sprint #5) archived to `.workflow/sprint-log.md` on 2026-02-27. Sprint #6 begins 2026-02-27.*

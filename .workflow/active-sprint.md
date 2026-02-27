# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #7 — 2026-02-27 to 2026-03-12

**Sprint Goal:** Fix two Major bugs from Sprint 6 feedback ("+X more" calendar popover visual corruption, stays check-in time UTC offset bug). Complete the Sprint 6 User Agent testing cycle (T-094 carry-over). Deliver five UX improvements (land travel section ordering, all-day activity sort, calendar checkout/arrival time display). Ship the trip notes/description feature as the first backlog enhancement from the project brief.

**Context:** Sprint 6 delivered the land travel sub-resource, calendar time display, and "+X more" overflow popover — all verified by Monitor Agent (16/16 health checks). However, two Major bugs were reported by the project owner: the "+X more" popover corrupts the calendar day layout (FB-080), and stays check-in times are shifted by ~4 hours due to a UTC conversion issue (FB-081). These are the Sprint 7 P0 priorities. Staging is currently running HTTP (not HTTPS) with the backend as a direct node process — T-095 re-enables HTTPS and pm2 before any testing runs. T-094 (User Agent carry-over from Sprint 6) must complete and its feedback triaged before the QA phase begins.

**Manager Pre-Approved Schema Change:** Adding `notes TEXT NULL` column to the `trips` table (migration 010). Backward-compatible nullable addition. Pre-approved to allow T-103 (backend) to proceed immediately after T-096 design spec is reviewed.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 0 — Infrastructure (start immediately, no blockers)
- [ ] T-095 — Deploy/Infra: Re-enable HTTPS + re-register backend under pm2 ← no blockers

### Phase 1 — User Agent Testing (Sprint 6 carry-over, blocked by T-095)
- [ ] T-094 — User Agent: Sprint 6 feature walkthrough (land travel, calendar, bug fixes, regression) ← T-095

### Phase 2 — Design Spec (parallel with Phase 0 + Phase 1, no blockers)
- [ ] T-096 — Design spec: Calendar checkout/arrival time display + trip notes field (Spec 13 addendum) ← no blockers

### Phase 3 — Bug Fixes (parallel, no blockers)
- [ ] T-097 — Frontend: Fix "+X more" calendar popover visual corruption (FB-080) ← no blockers
- [ ] T-098 — Backend + Frontend: Fix stays check-in/checkout time UTC offset bug (FB-081) ← no blockers
- [ ] T-099 — Frontend: Reorder trip details sections — land travel between flights and stays (FB-078) ← no blockers
- [ ] T-100 — Frontend: Sort all-day activities to top of each day (FB-079) ← no blockers

### Phase 4 — Calendar Enhancements (blocked by T-096 design spec)
- [ ] T-101 — Frontend: Calendar checkout/arrival time display (FB-082, FB-083) ← T-096

### Phase 5 — Trip Notes Feature (blocked by T-096 design spec + T-103 backend)
- [ ] T-103 — Backend: Trip notes field — migration 010 + PATCH /trips/:id + GET responses ← T-096
- [ ] T-104 — Frontend: Trip notes field — TripDetailsPage inline edit + TripCard preview ← T-096, T-103

### Phase 6 — QA, Deploy, Monitor, User (sequential after all implementation)
- [ ] T-105 — QA: Security checklist + code review audit ← T-097, T-098, T-099, T-100, T-101, T-103, T-104
- [ ] T-106 — QA: Integration testing ← T-105
- [ ] T-107 — Deploy: Staging re-deployment (migration 010 + all Sprint 7 changes) ← T-106
- [ ] T-108 — Monitor: Staging health check ← T-107
- [ ] T-109 — User Agent: Sprint 7 feature walkthrough + feedback ← T-108

---

## Out of Scope

*These items are explicitly deferred. Do not start them this sprint.*

- **B-022 — Production deployment to hosting provider** — Blocked on project owner selecting a hosting provider (Railway, Fly.io, Render, AWS). All deployment preparation complete since Sprint 3. Escalated since Sprint 3. Not a Sprint 7 blocker.
- **FB-084 / Timezone abbreviations on calendar** — Deferred to Sprint 8. Complex IANA → abbreviation conversion; calendar chips are already space-constrained. Depends on timezone bug fix (T-098) completing first.
- **B-031 — Activity location links (clickable URLs)** — Minor enhancement. Deferred to Sprint 8+.
- **B-032 — Trip export/print** — Useful enhancement. Deferred to Sprint 8+.
- **B-020 — Rate limiting persistence (Redis)** — In-memory acceptable for current single-instance deployment. Deferred until production architecture defined.
- **B-024 — Per-account rate limiting** — Enhancement. Depends on B-020. Deferred.
- **B-021 — Dev dependency esbuild vulnerability** — No production impact. Monitor for upstream fix.
- **E2E test expansion** — Additional Playwright tests for land travel edit flows, mobile viewport. Deferred to Sprint 8 after major bugs are fixed.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), code review all implementation tasks, triage T-094 feedback | Review T-095–T-104; approve before downstream tasks start |
| Deploy Engineer | Re-enable HTTPS + pm2 (critical first action), staging re-deployment | T-095, T-107 |
| User Agent | Sprint 6 feature walkthrough (carry-over), Sprint 7 walkthrough | T-094, T-109 |
| Design Agent | Calendar checkout/arrival spec + trip notes spec | T-096 |
| Frontend Engineer | Two Major bug fixes + UX fixes + calendar + notes UI | T-097, T-099, T-100, T-101, T-104 |
| Backend Engineer | Timezone investigation + fix + trip notes backend | T-098, T-103 |
| QA Engineer | Security checklist + integration testing | T-105, T-106 |
| Monitor Agent | Staging health check | T-108 |

---

## Dependency Chain (Critical Path)

```
T-095 (Deploy: HTTPS + pm2 re-enable)  ← IMMEDIATE START — unblocks T-094
        │
        └→ T-094 (User Agent: Sprint 6 carry-over)

T-096 (Design: Calendar + Notes spec) ← PARALLEL — unblocks T-101, T-103, T-104

T-097 (FE: +X more popover fix)       ← PARALLEL — no blockers
T-098 (BE+FE: Stays timezone fix)     ← PARALLEL — no blockers
T-099 (FE: Section reorder)           ← PARALLEL — no blockers
T-100 (FE: All-day sort to top)       ← PARALLEL — no blockers

T-101 (FE: Calendar checkout/arrival) ← T-096
T-103 (BE: Trip notes backend)        ← T-096
T-104 (FE: Trip notes frontend)       ← T-096, T-103

T-105 (QA: Security + code review)   ← T-097, T-098, T-099, T-100, T-101, T-103, T-104
        │
        └→ T-106 (QA: Integration testing)
                │
                └→ T-107 (Deploy: Staging re-deploy + migration 010)
                        │
                        └→ T-108 (Monitor: Health check)
                                │
                                └→ T-109 (User Agent: Sprint 7 walkthrough)
```

**Critical path:** T-095 → T-094 (longest carry-over) | T-096 → T-103 → T-104 → T-105 → T-106 → T-107 → T-108 → T-109.

**Note on T-094 and Sprint 7 planning:** T-094 feedback may surface additional issues. If T-094 finds Critical or Major bugs not already addressed in Sprint 7, Manager will create hotfix tasks (H-XXX) and insert them before T-105. Minor or Suggestion items from T-094 will be added to backlog for Sprint 8.

---

## Sprint 6 Feedback Triage Summary

*Triaged by Manager Agent on 2026-02-27 as part of Sprint 7 planning.*

| FB Entry | Category | Severity | Sprint 7 Disposition | Task |
|----------|----------|----------|---------------------|------|
| FB-078 | UX Issue | Minor | **Tasked → T-099** | Land travel between flights and stays |
| FB-079 | UX Issue | Minor | **Tasked → T-100** | All-day activities sort to top of day |
| FB-080 | Bug | **Major** | **Tasked → T-097 (P0)** | "+X more" calendar popover visual corruption |
| FB-081 | Bug | **Major** | **Tasked → T-098 (P0)** | Stays check-in time UTC offset 4-hour shift |
| FB-082 | Feature Gap | Minor | **Tasked → T-101** | Calendar checkout time on last stay day |
| FB-083 | Feature Gap | Minor | **Tasked → T-101** | Calendar arrival times on arrival day (flights/land travel) |
| FB-084 | Feature Gap | Minor | **Acknowledged (backlog)** | Timezone abbreviation display — deferred to Sprint 8 |

**Summary:** 2 Major bugs requiring immediate P0 attention (FB-080, FB-081). 4 minor UX/feature items tasked (FB-078, FB-079, FB-082, FB-083). 1 item deferred to backlog (FB-084). No items declined (Won't Fix). All feedback is addressed.

---

## Definition of Done

*How do we know Sprint #7 is complete?*

- [ ] HTTPS re-enabled and backend running under pm2 on staging (T-095)
- [ ] User Agent has completed Sprint 6 feature walkthrough and submitted feedback (T-094)
- [ ] T-094 feedback triaged by Manager Agent (New → Tasked/Acknowledged/Won't Fix)
- [ ] Design Agent has published Spec 13 addendum (calendar times + trip notes) (T-096)
- [ ] "+X more" calendar popover opens without corrupting calendar day cell layout (T-097)
- [ ] Stays check-in time displays the correct local time without UTC offset shift (T-098)
- [ ] Trip details page section order: Flights → Land Travel → Stays → Activities (T-099)
- [ ] All-day activities render at the top of each day group in activities section (T-100)
- [ ] Calendar stay chips show checkout time on checkout day (T-101)
- [ ] Calendar flight/land travel chips show arrival time on arrival day (T-101)
- [ ] Migration 010 adds `notes TEXT NULL` to trips table with rollback (T-103)
- [ ] PATCH /trips/:id accepts and stores `notes` field (max 2000 chars) (T-103)
- [ ] GET /trips/:id and GET /trips list both include `notes` field (T-103)
- [ ] TripDetailsPage shows notes text with inline edit and char count (T-104)
- [ ] TripCard shows truncated notes (first 100 chars) if non-empty (T-104)
- [ ] All task dependencies (Blocked By) resolved before moving to In Progress
- [ ] Manager Agent has completed code review for all implementation tasks
- [ ] QA Engineer has completed security checklist (T-105) and integration testing (T-106)
- [ ] QA Engineer has logged results in `.workflow/qa-build-log.md`
- [ ] Deploy Engineer has redeployed staging with migration 010 and all Sprint 7 changes (T-107)
- [ ] Monitor Agent has verified staging health — all Sprint 6 checks pass + Sprint 7 checks (T-108)
- [ ] User Agent has tested Sprint 7 features and submitted feedback (T-109)
- [ ] Manager Agent has triaged all Sprint 7 feedback entries
- [ ] Sprint summary added to `.workflow/sprint-log.md`

---

## Success Criteria (Sprint 7)

By the end of Sprint #7, the following must be verifiable on staging (in addition to all Sprint 1–6 criteria):

- [ ] Click "+X more" on a calendar day with overflow events → popover opens, calendar grid layout unchanged (no corruption)
- [ ] Create a stay with check-in time 4:00 PM, save → displayed as "4:00 PM" (not "12:00 PM" or any other UTC-shifted time)
- [ ] Trip details page section order: flights section header appears first, then land travel, then stays, then activities
- [ ] Activities section: a day with mixed all-day and timed activities → all-day items appear above timed items
- [ ] Calendar: stay chip on checkout_date shows checkout time formatted as "check-out HH:MMa/p"
- [ ] Calendar: flight chip on arrival_date (when different from departure_date) shows arrival time formatted as "arrives HH:MMa/p"
- [ ] Calendar: land travel chip on arrival_date (when different from departure_date) shows arrival time
- [ ] PATCH /trips/:id with `{"notes":"My Tokyo trip notes"}` → GET /trips/:id returns `"notes":"My Tokyo trip notes"`
- [ ] TripDetailsPage shows notes text; clicking edit → textarea opens; saving → updated text displayed
- [ ] TripCard on home page shows "My Tokyo trip notes" (truncated at 100 chars with "…")
- [ ] PATCH /trips/:id with notes > 2000 chars → 400 VALIDATION_ERROR
- [ ] All 583+ existing tests pass (no regressions from Sprint 7 changes)
- [ ] Playwright E2E: 4/4 tests pass against HTTPS staging

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

- **HTTPS Disabled (from Sprint 6 deployment):** T-095 must run immediately at sprint start. Backend was deployed over HTTP (port 3000) in Sprint 6. HTTPS must be re-enabled before T-094 User Agent testing and before T-107 staging re-deployment.
- **pm2 Not Running (from Sprint 6 deployment):** Backend is running as direct `node src/index.js` process. pm2 must be re-registered in T-095 for crash recovery.
- **B-022 (Production Deployment):** Deferred to Sprint 8+ pending project owner decision on hosting provider. This is NOT a Sprint 7 blocker.

---

*Previous sprint (Sprint #6) archived to `.workflow/sprint-log.md` on 2026-02-27. Sprint #7 begins 2026-02-27.*

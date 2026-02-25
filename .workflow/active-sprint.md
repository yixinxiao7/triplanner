# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #3 — 2026-02-25 to 2026-03-11

**Sprint Goal**: Harden the MVP for production readiness and polish UX based on Sprint 2 feedback. Deliver HTTPS on staging with secure cookies, pm2 process management, multi-destination add/remove UI, optional activity times (timeless "all day" activities), explicit 429 rate limit error handling, and production deployment preparation (Docker Compose + CI/CD configs). Strengthen test coverage on edit pages.

**Context:** The MVP is feature-complete after Sprint 2 (all 7 core features from the project brief are implemented and verified on staging). Sprint 3 shifts focus from feature delivery to production readiness, UX polish, and code quality.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 1 — Design Specs (start immediately)
- [ ] T-041 — Design spec: Multi-destination add/remove UI (B-007)
- [ ] T-042 — Design spec: Optional activity times UX + 429 error message UX (B-015, B-016)

### Phase 2 — Backend + Infrastructure (start immediately, parallel to Design)
- [ ] T-043 — Backend: Make activity start_time/end_time optional (B-016)
- [ ] T-044 — Backend + Infra: HTTPS configuration for staging (B-014)

### Phase 3 — Frontend (after Design specs + Backend changes)
- [ ] T-045 — Frontend: 429 rate limit error handling (B-015) ← T-042
- [ ] T-046 — Frontend: Multi-destination add/remove UI (B-007) ← T-041
- [ ] T-047 — Frontend: Optional activity times UI (B-016 frontend) ← T-042, T-043
- [ ] T-048 — Frontend: Consolidate date formatting + TripCard test gap (B-017) *(no blockers)*
- [ ] T-049 — Frontend: Edit page test hardening ← T-045, T-046, T-047

### Phase 4 — Infrastructure (after HTTPS configured)
- [ ] T-050 — Infra: pm2 process management for staging (B-013) ← T-044
- [ ] T-051 — Infra: Production deployment preparation — Dockerfiles, Docker Compose, CI/CD, runbook (B-008 prep) ← T-044

### Phase 5 — QA, Deploy, Monitor, User (sequential after all implementation)
- [ ] T-052 — QA: Security checklist + code review audit
- [ ] T-053 — QA: Integration testing
- [ ] T-054 — Deploy: Staging re-deployment
- [ ] T-055 — Monitor: Staging health check
- [ ] T-056 — User Agent: Feature walkthrough + feedback

---

## Out of Scope

*These items are explicitly deferred to Sprint #4 or later. Do not start them this sprint.*

- **Actual production deployment to hosting provider (B-022)** — Sprint 4. Sprint 3 prepares Docker configs, CI/CD, and runbook. Actual deployment requires hosting provider selection + DNS + production database setup.
- **Rate limiting persistence (B-020)** — Sprint 4+. In-memory store is acceptable for staging and initial production. Redis-backed store needed only for multi-process/multi-instance production scaling.
- **CreateTripModal triggerRef focus fix (B-018)** — Sprint 4+. P3 cosmetic accessibility issue.
- **Axios 401 retry queue unit test (B-019)** — Sprint 4+. Integration-covered, low risk.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), code review, schema change approval (if T-043 migration needed), unblock agents | Review T-041–T-051 specs + implementations; approve before downstream tasks start |
| Design Agent | UI specs for multi-destination UI + optional activity times UX + 429 error UX | T-041, T-042 |
| Backend Engineer | Make activity times optional (API contract + validation + possible migration) | T-043 |
| Frontend Engineer | 429 handling, multi-destination UI, optional times UI, date formatting refactor, edit page test hardening | T-045, T-046, T-047, T-048, T-049 |
| Deploy Engineer | HTTPS configuration, pm2 setup, production deployment preparation (Docker + CI/CD) | T-044, T-050, T-051 |
| QA Engineer | Security checklist for HTTPS + new features, integration testing | T-052, T-053 |
| Monitor Agent | Health checks (Sprint 2 regression + new Sprint 3 HTTPS + feature checks) | T-055 |
| User Agent | Full walkthrough of multi-destination, optional times, 429 handling, HTTPS; regression testing | T-056 |

---

## Dependency Chain (Critical Path)

```
T-041 (Design: Multi-Destination UI)  ──────────────────────┐
T-042 (Design: Optional Times + 429)  ──────────────────────┤
                                                              │
T-043 (BE: Optional Activity Times)  ───────────────────────┤  (parallel)
T-044 (Infra: HTTPS Config)  ──────────────────────────────┤  (parallel)
                                                              ↓
T-045 (FE: 429 Error Handling)      ← T-042 ───────────────┤
T-046 (FE: Multi-Destination UI)    ← T-041 ───────────────┤
T-047 (FE: Optional Activity Times) ← T-042, T-043 ────────┤
T-048 (FE: Date Formatting Refactor)  (no blocker) ────────┤
                                                              ↓
T-049 (FE: Edit Page Test Hardening) ← T-045, T-046, T-047 ┤
                                                              ↓
T-050 (Infra: pm2)     ← T-044 ────────────────────────────┤
T-051 (Infra: Docker/CI Prep) ← T-044 ─────────────────────┤
                                                              ↓
                              T-052 (QA: Security + Code Review)
                                                              ↓
                              T-053 (QA: Integration Tests)
                                                              ↓
                              T-054 (Deploy: Staging Re-deploy)
                                                              ↓
                              T-055 (Monitor: Health Check)
                                                              ↓
                              T-056 (User Agent: Testing)
```

---

## Schema Change Pre-Approval (Conditional)

**Conditionally approved by Manager Agent — 2026-02-25**

If T-043 requires a schema migration to change `start_time` and `end_time` column nullability on the `activities` table:

- **Change:** ALTER `start_time TIME NOT NULL` and `end_time TIME NOT NULL` to `start_time TIME NULL` and `end_time TIME NULL` on the `activities` table.
- **Rationale:** Required to support "all day" / timeless activities where users don't want to specify specific times (e.g., "Free Day", "Explore the city"). Feedback item FB-023.
- **Migration:** New Knex migration file (e.g., `20260225_008_make_activity_times_optional.js`) with `up()` altering columns to nullable and `down()` setting them back to NOT NULL (with a default of '00:00:00' for any existing NULL values on rollback).
- **API Impact:** POST/PATCH `/trips/:id/activities` — `start_time` and `end_time` become optional. Validation: if one is provided, the other is also required. Both null = "all day" activity.

Backend Engineer must update `api-contracts.md` before implementation (Rule #11 + #22).

---

## Definition of Done

*How do we know Sprint #3 is complete?*

- [ ] Design Agent has published UI specs for T-041 and T-042 to `.workflow/ui-spec.md`
- [ ] Manager Agent has reviewed and approved the design specs before frontend work starts
- [ ] Backend Engineer has updated API contracts in `.workflow/api-contracts.md` for T-043 before implementation
- [ ] Activity start_time/end_time are optional — API accepts null times and returns them correctly (T-043)
- [ ] HTTPS is operational on staging — backend and frontend serve over HTTPS, refresh token cookie has `secure: true` (T-044)
- [ ] Frontend shows explicit "too many attempts" message on 429 (not generic error) (T-045)
- [ ] Multi-destination add/remove UI works on CreateTripModal and TripDetailsPage (T-046)
- [ ] Timeless activities ("All day") display correctly on trip details and calendar (T-047)
- [ ] TripCard date formatting consolidated to shared utility, test gap filled (T-048)
- [ ] Edit page tests expanded to cover form submission, validation, edit, delete, cancel (T-049)
- [ ] pm2 manages backend process with auto-restart on crash (T-050)
- [ ] Docker Compose + CI/CD configs committed to infra/ directory with deployment runbook (T-051)
- [ ] All task dependencies (Blocked By) are resolved before moving tasks to In Progress
- [ ] Manager Agent has completed code review for all implementation tasks
- [ ] QA Engineer has completed security checklist (T-052) and integration testing (T-053)
- [ ] QA Engineer has logged all results in `.workflow/qa-build-log.md`
- [ ] Deploy Engineer has applied migrations and redeployed to staging over HTTPS (T-054)
- [ ] Monitor Agent has verified staging health — all Sprint 2 checks pass + all Sprint 3 new checks pass (T-055)
- [ ] User Agent has tested all new features and submitted feedback to `.workflow/feedback-log.md` (T-056)
- [ ] Manager Agent has triaged all Sprint 3 feedback entries (New → Tasked/Acknowledged/Won't Fix)
- [ ] Sprint summary added to `.workflow/sprint-log.md`

---

## Success Criteria (from Project Brief — Sprint 3 Additions)

By the end of Sprint #3, the following must be verifiable on staging (in addition to all Sprint 1 + Sprint 2 criteria):

- [ ] Staging serves over HTTPS — `https://localhost:...` loads without mixed-content warnings
- [ ] Refresh token cookie has `Secure` flag set
- [ ] Backend process runs under pm2 and auto-restarts after a crash
- [ ] A user can add multiple destinations via chip/tag input when creating a trip — all destinations appear on the trip details page
- [ ] A user can edit destinations on the trip details page (add/remove) and save via PATCH
- [ ] A user can create a "Free Day" activity with no start_time or end_time — it appears with an "All day" indicator on trip details
- [ ] A user who triggers the rate limit on login sees "Too many attempts. Please wait X minutes." (not a generic error)
- [ ] Docker Compose config exists in `infra/` and can build the full stack (backend + PostgreSQL + frontend)
- [ ] CI/CD pipeline config exists in `infra/` (GitHub Actions) for test + build
- [ ] TripCard date formatting uses the shared utility (no duplicate logic)
- [ ] Edit page tests cover form submission, validation, edit, delete, and cancel workflows

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

*None currently. All Phase 1 and Phase 2 tasks are unblocked and ready to start.*

---

*Previous sprint (Sprint #2) archived to `.workflow/sprint-log.md` on 2026-02-25. Sprint #3 begins 2026-02-25.*

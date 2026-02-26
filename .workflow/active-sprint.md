# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #5 — 2026-02-25 to 2026-03-11

**Sprint Goal**: Enhance the home page with trip search, filter, and sort capabilities so users can quickly find trips as their collection grows. Establish end-to-end test coverage with Playwright for production deployment confidence. Address React Router v7 deprecation warnings.

**Context:** The MVP has been feature-complete since Sprint 2, production-hardened in Sprint 3, and polished to zero issues in Sprint 4. Sprint 4 was the cleanest sprint in project history: 13/13 positive feedback entries, zero bugs. The application has 428 tests (168 backend + 260 frontend), full HTTPS, comprehensive accessibility compliance, and all tech debt from Sprints 1–4 resolved. Sprint 5 is the first "enhancement" sprint — it adds user-facing functionality beyond the original MVP scope. The primary deferred item (B-022 production deployment) remains blocked on the project owner selecting a hosting provider.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 1 — Design Specs (start immediately)
- [ ] T-071 — Design spec: Home page search bar, status filter, sort controls, empty search state

### Phase 2 — Backend (start immediately, parallel with Design)
- [ ] T-072 — Backend: API contract + implementation for GET /trips query params (?search, ?status, ?sort_by, ?sort_order)

### Phase 3 — Frontend (T-073 waits on T-071 + T-072; T-074 starts immediately)
- [ ] T-073 — Frontend: Home page search/filter/sort UI ← T-071, T-072
- [ ] T-074 — Frontend: React Router v7 future flag migration (no blockers)

### Phase 4 — E2E Testing (after implementation)
- [ ] T-075 — E2E: Install Playwright + write critical user flow tests ← T-072, T-073, T-074

### Phase 5 — QA, Deploy, Monitor, User (sequential after all implementation)
- [ ] T-076 — QA: Security checklist + code review audit ← T-072, T-073, T-074, T-075
- [ ] T-077 — QA: Integration testing ← T-076
- [ ] T-078 — Deploy: Staging re-deployment ← T-077
- [ ] T-079 — Monitor: Staging health check ← T-078
- [ ] T-080 — User Agent: Feature walkthrough + feedback ← T-079

---

## Out of Scope

*These items are explicitly deferred. Do not start them this sprint.*

- **B-022 — Production deployment to hosting provider** — Still blocked on the project owner selecting a hosting provider (Railway, Fly.io, Render, AWS), configuring DNS, approving budget, and provisioning production PostgreSQL. **Escalated to project owner since Sprint 3.** All deployment preparation is complete. The application is deployment-ready.
- **B-020 — Rate limiting persistence (Redis)** — In-memory rate limiting is acceptable for staging and initial single-instance production. Redis-backed store only needed for multi-process scaling. Deferred until production architecture is defined.
- **B-024 — Per-account rate limiting** — IP-based rate limiting is standard. Per-account limiting is an enhancement for shared-IP environments. Depends on B-020 infrastructure.
- **B-021 — Dev dependency esbuild vulnerability** — No production impact. Monitor for upstream fix.
- **B-030 — Trip notes/description field** — Useful enhancement deferred to Sprint 6. Added to backlog.
- **B-032 — Trip export/print** — Useful enhancement deferred to Sprint 6. Added to backlog.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), code review all implementation tasks, triage feedback | Review T-071–T-075 specs + implementations; approve before downstream tasks start |
| Design Agent | Search/filter/sort UI spec for home page | T-071 |
| Backend Engineer | Trip search/filter/sort API (contract + implementation) | T-072 |
| Frontend Engineer | Search/filter/sort UI + React Router migration | T-073, T-074 |
| QA Engineer | E2E test setup with Playwright + security checklist + integration testing | T-075, T-076, T-077 |
| Deploy Engineer | Staging re-deployment with all Sprint 5 changes | T-078 |
| Monitor Agent | Health checks (Sprint 4 regression + Sprint 5 changes) | T-079 |
| User Agent | Test search/filter/sort, E2E validation, Sprint 4 regression, feedback | T-080 |

---

## Dependency Chain (Critical Path)

```
T-071 (Design: Search/Filter/Sort UI)  ──────────────────────┐
                                                               │
T-072 (BE: Search/Filter/Sort API)     ──────────────────────┤  (parallel)
                                                               │
T-074 (FE: React Router Migration)     ──────────────────────┤  (parallel, independent)
                                                               ↓
T-073 (FE: Search/Filter/Sort UI)      ← T-071, T-072 ──────┤
                                                               ↓
                            T-075 (E2E: Playwright Tests)     ← T-072, T-073, T-074
                                                               ↓
                            T-076 (QA: Security + Code Review)
                                                               ↓
                            T-077 (QA: Integration Tests)
                                                               ↓
                            T-078 (Deploy: Staging Re-deploy)
                                                               ↓
                            T-079 (Monitor: Health Check)
                                                               ↓
                            T-080 (User Agent: Testing)
```

**Note on parallelism:** Phase 1 (Design), Phase 2 (Backend), and T-074 (React Router migration) can all start simultaneously. T-073 (search UI) must wait for both T-071 (design spec) and T-072 (backend API) to be complete. T-075 (E2E) waits for all implementation tasks. This sprint has moderate parallelism — the critical path runs through T-071/T-072 → T-073 → T-075 → QA → Deploy → Monitor → User.

---

## Sprint 4 Feedback Triage Summary

*Triaged by Manager Agent on 2026-02-25 as part of Sprint 5 planning.*

| FB Entry | Category | Severity | Sprint 5 Disposition | Task |
|----------|----------|----------|---------------------|------|
| FB-044 | Positive | — | Acknowledged | — |
| FB-045 | Positive | — | Acknowledged | — |
| FB-046 | Positive | — | Acknowledged | — |
| FB-047 | Positive | — | Acknowledged | — |
| FB-048 | Positive | — | Acknowledged | — |
| FB-049 | Positive | — | Acknowledged | — |
| FB-050 | Positive | — | Acknowledged | — |
| FB-051 | Positive | — | Acknowledged | — |
| FB-052 | Positive | — | Acknowledged | — |
| FB-053 | Positive | — | Acknowledged | — |
| FB-054 | Positive | — | Acknowledged | — |
| FB-055 | Positive | — | Acknowledged | — |
| FB-056 | Positive | — | Acknowledged | — |

**Summary:** All 13 Sprint 4 feedback entries are positive findings — zero issues, zero bugs, zero suggestions. This is the first sprint in the project's history with zero issues found by the User Agent. No new tasks needed from Sprint 4 feedback. Sprint 5 tasks are driven by enhancement priorities (trip search/filter/sort) and production readiness (E2E testing, React Router migration).

---

## Definition of Done

*How do we know Sprint #5 is complete?*

- [ ] Design Agent has published search/filter/sort UI spec to `.workflow/ui-spec.md` (T-071)
- [ ] Manager Agent has reviewed and approved the design spec before T-073 starts
- [ ] Backend Engineer has updated API contracts for GET /trips query params before implementation (T-072)
- [ ] GET /trips?search=<text> returns trips matching name or destinations (case-insensitive partial match) (T-072)
- [ ] GET /trips?status=<PLANNING|ONGOING|COMPLETED> filters by computed trip status (T-072)
- [ ] GET /trips?sort_by=<name|created_at|start_date>&sort_order=<asc|desc> sorts correctly (T-072)
- [ ] Combined search + filter + sort params work together (T-072)
- [ ] Frontend home page renders search bar, status filter, and sort controls per design spec (T-073)
- [ ] Search input is debounced (300ms) and triggers API calls with query params (T-073)
- [ ] Empty search results show proper empty state with "clear filters" action (T-073)
- [ ] React Router v7 future flags added — no deprecation warnings in test output (T-074)
- [ ] Playwright installed and ≥4 E2E tests pass against staging (T-075)
- [ ] All task dependencies (Blocked By) are resolved before moving tasks to In Progress
- [ ] Manager Agent has completed code review for all implementation tasks
- [ ] QA Engineer has completed security checklist (T-076) and integration testing (T-077)
- [ ] QA Engineer has logged all results in `.workflow/qa-build-log.md`
- [ ] Deploy Engineer has redeployed to staging with all Sprint 5 changes (T-078)
- [ ] Monitor Agent has verified staging health — all Sprint 4 checks pass + Sprint 5 checks pass (T-079)
- [ ] User Agent has tested all changes and submitted feedback to `.workflow/feedback-log.md` (T-080)
- [ ] Manager Agent has triaged all Sprint 5 feedback entries (New → Tasked/Acknowledged/Won't Fix)
- [ ] Sprint summary added to `.workflow/sprint-log.md`

---

## Success Criteria (Sprint 5)

By the end of Sprint #5, the following must be verifiable on staging (in addition to all Sprint 1 + Sprint 2 + Sprint 3 + Sprint 4 criteria):

- [ ] GET /trips?search=Tokyo returns only trips with "Tokyo" in name or destinations
- [ ] GET /trips?status=PLANNING returns only trips with computed PLANNING status
- [ ] GET /trips?sort_by=name&sort_order=asc returns trips sorted alphabetically
- [ ] GET /trips?search=Tokyo&status=PLANNING&sort_by=name combined params work
- [ ] Home page search bar renders, user types, results filter dynamically
- [ ] Home page status filter dropdown filters trip cards
- [ ] Home page sort controls change trip card order
- [ ] Empty search results show "no trips match" message with clear filters action
- [ ] React Router v7 future flags enabled — no deprecation warnings in test output
- [ ] Playwright is installed and ≥4 E2E test scenarios pass against staging
- [ ] All 428+ existing unit tests pass (no regressions)
- [ ] All Sprint 1+2+3+4 features still work over HTTPS (full regression)

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

- **B-022 (Production Deployment):** Deferred to Sprint 6+ pending project owner decision on hosting provider. All deployment preparation complete since Sprint 3. This is NOT a Sprint 5 blocker.
- **Docker availability:** Playwright E2E tests (T-075) run directly against the staging environment (HTTPS localhost), not in Docker. Docker unavailability does not block Sprint 5.

*No implementation blockers. Phase 1 (Design), Phase 2 (Backend), and T-074 are all unblocked and ready to start immediately.*

---

*Previous sprint (Sprint #4) archived to `.workflow/sprint-log.md` on 2026-02-25. Sprint #5 begins 2026-02-25.*

# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #4 — 2026-02-25 to 2026-03-11

**Sprint Goal**: Polish UX, harden accessibility, improve code quality, and validate infrastructure. Address all Sprint 3 feedback items (accessibility gaps, rate limit UX, destination dedup, code deduplication) and resolve long-standing tech debt (focus management, test coverage, Docker validation).

**Context:** The MVP has been feature-complete since Sprint 2 and production-hardened in Sprint 3 (HTTPS, pm2, Docker configs, CI/CD). Sprint 4 is a "polish and harden" sprint — no new features, only quality improvements based on user feedback and code review observations. After Sprint 4, the application will be in its highest-quality state, ready for production deployment once the project owner selects a hosting provider.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 1 — Design Spec Addendum (start immediately)
- [ ] T-057 — Design spec addendum: Rate limit lockout submit button UX (B-025, FB-033)

### Phase 2 — Backend (start immediately, parallel with Design)
- [ ] T-058 — Backend: Destination deduplication — case-insensitive dedup on POST/PATCH /trips (B-023, FB-028)

### Phase 3 — Frontend (T-059 waits on T-057; others start immediately)
- [ ] T-059 — Frontend: Disable submit button during rate limit lockout (B-025) ← T-057
- [ ] T-060 — Frontend: Extract parseRetryAfterMinutes to shared utility (B-026, FB-034)
- [ ] T-061 — Frontend: Fix ARIA role mismatch in DestinationChipInput (B-027, FB-035)
- [ ] T-062 — Frontend: Fix missing aria-describedby target IDs (B-028, FB-036)
- [ ] T-063 — Frontend: CreateTripModal triggerRef focus-return-to-trigger (B-018)
- [ ] T-064 — Frontend: Axios 401 retry queue dedicated unit test (B-019)

### Phase 4 — Infrastructure (start immediately, parallel with Frontend)
- [ ] T-065 — Infra: Docker build validation + nginx.conf hardening (QA WARN items from Sprint 3)

### Phase 5 — QA, Deploy, Monitor, User (sequential after all implementation)
- [ ] T-066 — QA: Security checklist + code review audit
- [ ] T-067 — QA: Integration testing
- [ ] T-068 — Deploy: Staging re-deployment
- [ ] T-069 — Monitor: Staging health check
- [ ] T-070 — User Agent: Feature walkthrough + feedback

---

## Out of Scope

*These items are explicitly deferred. Do not start them this sprint.*

- **B-022 — Production deployment to hosting provider** — Requires human decision: hosting provider selection (Railway, Fly.io, Render, AWS), DNS configuration, budget approval, and production PostgreSQL provisioning. **Escalated to project owner.** All deployment preparation (Docker Compose, CI/CD pipeline, deployment runbook) was completed in Sprint 3 (T-051) — we are "deployment-ready" pending infrastructure decisions.
- **B-020 — Rate limiting persistence (Redis)** — In-memory rate limiting store is acceptable for staging and initial production. Redis-backed store needed only for multi-process/multi-instance production scaling. Deferred until production architecture is defined.
- **B-024 — Per-account rate limiting** — Deferred to Sprint 5+. IP-based rate limiting is standard; per-account limiting is an enhancement for shared-IP environments. Lower priority than current UX/accessibility fixes.
- **B-021 — Dev dependency esbuild vulnerability** — No production impact. Monitor for upstream fix.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), code review all implementation tasks, triage feedback | Review T-057–T-065 specs + implementations; approve before downstream tasks start |
| Design Agent | Spec addendum for rate limit lockout button UX | T-057 |
| Backend Engineer | Destination deduplication (API contract update + implementation) | T-058 |
| Frontend Engineer | Accessibility fixes, UX polish, code quality improvements, test coverage | T-059, T-060, T-061, T-062, T-063, T-064 |
| Deploy Engineer | Docker build validation, nginx hardening, staging re-deployment | T-065, T-068 |
| QA Engineer | Security checklist for Sprint 4 changes, integration testing | T-066, T-067 |
| Monitor Agent | Health checks (Sprint 3 regression + Sprint 4 changes) | T-069 |
| User Agent | Test destination dedup, verify accessibility fixes, Sprint 3 regression, feedback | T-070 |

---

## Dependency Chain (Critical Path)

```
T-057 (Design: Rate Limit Lockout UX)  ───────────────────────┐
                                                                │
T-058 (BE: Destination Dedup)       ───────────────────────────┤  (parallel)
                                                                │
T-065 (Infra: Docker Validation + nginx) ──────────────────────┤  (parallel)
                                                                ↓
T-059 (FE: Submit Lockout)            ← T-057 ────────────────┤
T-060 (FE: parseRetryAfterMinutes)    (no blocker) ───────────┤
T-061 (FE: ARIA Role Fix)            (no blocker) ────────────┤
T-062 (FE: aria-describedby Fix)     (no blocker) ────────────┤
T-063 (FE: CreateTripModal Focus)    (no blocker) ────────────┤
T-064 (FE: Axios 401 Retry Test)    (no blocker) ────────────┤
                                                                ↓
                             T-066 (QA: Security + Code Review)
                                                                ↓
                             T-067 (QA: Integration Tests)
                                                                ↓
                             T-068 (Deploy: Staging Re-deploy)
                                                                ↓
                             T-069 (Monitor: Health Check)
                                                                ↓
                             T-070 (User Agent: Testing)
```

**Note on parallelism:** Phase 1 (Design), Phase 2 (Backend), and Phase 4 (Infrastructure) can all start simultaneously. Most Phase 3 Frontend tasks are also unblocked and can start immediately — only T-059 must wait for T-057 (design spec before frontend work, per Rule #12). This sprint has high parallelism potential.

---

## Sprint 3 Feedback Triage Summary

*Triaged by Manager Agent on 2026-02-25 as part of Sprint 4 planning.*

| FB Entry | Category | Severity | Sprint 4 Disposition | Task |
|----------|----------|----------|---------------------|------|
| FB-025 | Positive | — | Acknowledged | — |
| FB-026 | Positive | — | Acknowledged | — |
| FB-027 | Positive | — | Acknowledged | — |
| FB-028 | UX Issue | Minor | **Tasked → T-058** | Destination dedup |
| FB-029 | Positive | — | Acknowledged | — |
| FB-030 | Positive | — | Acknowledged | — |
| FB-031 | Positive | — | Acknowledged | — |
| FB-032 | UX Issue | Minor | Acknowledged (backlog B-024) | Per-account rate limiting — deferred |
| FB-033 | UX Issue | Minor | **Tasked → T-057/T-059** | Submit lockout during rate limit |
| FB-034 | Suggestion | — | **Tasked → T-060** | parseRetryAfterMinutes extraction |
| FB-035 | Suggestion | — | **Tasked → T-061** | ARIA role fix |
| FB-036 | UX Issue | Minor | **Tasked → T-062** | aria-describedby targets |
| FB-037 | Positive | — | Acknowledged | — |
| FB-038 | Positive | — | Acknowledged | — |
| FB-039 | Positive | — | Acknowledged | — |
| FB-040 | Positive | — | Acknowledged | — |
| FB-041 | Positive | — | Acknowledged | — |
| FB-042 | Positive | — | Acknowledged | — |
| FB-043 | Positive | — | Acknowledged | — |

**Summary:** 5 feedback items promoted to Sprint 4 tasks (FB-028, FB-033, FB-034, FB-035, FB-036). 1 item deferred to backlog (FB-032). 13 positive findings acknowledged. Additionally, 3 long-standing tech debt items from Sprint 1–2 are addressed this sprint: B-018 (triggerRef focus → T-063), B-019 (axios retry test → T-064), and QA WARN items (Docker/nginx → T-065).

---

## Definition of Done

*How do we know Sprint #4 is complete?*

- [ ] Design Agent has published rate limit lockout button UX addendum to `.workflow/ui-spec.md` (T-057)
- [ ] Manager Agent has reviewed and approved the design spec addendum before T-059 starts
- [ ] Backend Engineer has updated API contracts for destination dedup before implementation (T-058)
- [ ] Backend destination deduplication works: duplicate destinations (case-insensitive) are removed on POST/PATCH /trips (T-058)
- [ ] Frontend submit button is disabled during rate limit lockout with aria-disabled (T-059)
- [ ] parseRetryAfterMinutes is extracted to shared utility, no duplication in LoginPage/RegisterPage (T-060)
- [ ] DestinationChipInput uses correct ARIA role hierarchy (T-061)
- [ ] aria-describedby target IDs exist in DOM for DestinationChipInput and RegisterPage (T-062)
- [ ] CreateTripModal returns focus to trigger button on close (T-063)
- [ ] Axios 401 retry queue has dedicated unit tests (≥5 tests covering happy + error paths) (T-064)
- [ ] Docker images build successfully (if Docker available) and nginx.conf is hardened with server_tokens off + CSP (T-065)
- [ ] All task dependencies (Blocked By) are resolved before moving tasks to In Progress
- [ ] Manager Agent has completed code review for all implementation tasks
- [ ] QA Engineer has completed security checklist (T-066) and integration testing (T-067)
- [ ] QA Engineer has logged all results in `.workflow/qa-build-log.md`
- [ ] Deploy Engineer has redeployed to staging with all Sprint 4 changes (T-068)
- [ ] Monitor Agent has verified staging health — all Sprint 3 checks pass + Sprint 4 checks pass (T-069)
- [ ] User Agent has tested all changes and submitted feedback to `.workflow/feedback-log.md` (T-070)
- [ ] Manager Agent has triaged all Sprint 4 feedback entries (New → Tasked/Acknowledged/Won't Fix)
- [ ] Sprint summary added to `.workflow/sprint-log.md`

---

## Success Criteria (Sprint 4)

By the end of Sprint #4, the following must be verifiable on staging (in addition to all Sprint 1 + Sprint 2 + Sprint 3 criteria):

- [ ] POST /trips with `["Tokyo","Tokyo","tokyo"]` returns deduped destinations `["Tokyo"]`
- [ ] PATCH /trips/:id with duplicate destinations returns deduped array
- [ ] LoginPage and RegisterPage disable submit button when rate limit (429) is active, re-enable when countdown reaches 0
- [ ] DestinationChipInput has correct ARIA role hierarchy (no role="option" without role="listbox")
- [ ] Password hint text in RegisterPage has `id="password-hint"` matching `aria-describedby`
- [ ] Destination chip input hint has `id="dest-chip-hint"` matching `aria-describedby`
- [ ] CreateTripModal close returns focus to the "Create Trip" trigger button
- [ ] parseRetryAfterMinutes lives in a single shared utility file (not duplicated)
- [ ] Axios 401 interceptor has ≥5 dedicated unit tests
- [ ] nginx.conf includes `server_tokens off;` and `Content-Security-Policy` header
- [ ] All 379+ existing tests pass (no regressions)
- [ ] All Sprint 1+2+3 features still work over HTTPS (full regression)

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

- **B-022 (Production Deployment):** Deferred to Sprint 5+ pending project owner decision on hosting provider. All deployment preparation is complete (Docker Compose, CI/CD pipeline, deployment runbook from Sprint 3). This is NOT a Sprint 4 blocker — Sprint 4 focuses on quality/polish.
- **Docker availability:** T-065 may be limited if Docker is not available on the staging machine (same limitation as Sprint 3). If Docker is unavailable, the task will validate configs syntactically and harden nginx.conf, documenting Docker build validation as deferred.

*No implementation blockers. All Phase 1, Phase 2, and Phase 4 tasks are unblocked and ready to start. Most Phase 3 tasks are also unblocked (only T-059 depends on T-057).*

---

*Previous sprint (Sprint #3) archived to `.workflow/sprint-log.md` on 2026-02-25. Sprint #4 begins 2026-02-25.*

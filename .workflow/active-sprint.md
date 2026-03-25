# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #38 — 2026-03-24

**Sprint Goal:** Deploy all Sprint 35+36+37 changes to production and verify production health. This is a deploy-only sprint — no new features, no refactoring. Production deployment has been pending since Sprint 35 and must be completed now.

**Context:** Sprint 37 successfully fixed the nested XSS bypass (T-286) and verified it on staging (T-289 Deploy Verified = Yes, Staging). The staging environment has been fully verified across three consecutive sprints (35, 36, 37). Production deployment (T-290, T-291) did not execute in Sprint 37 and carries over. FB-207 (Major Feature Gap) flagged this as the top priority.

**Feedback Triage (Sprint 37 → Sprint 38):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-207 | Feature Gap | Major | **Tasked** → T-293 + T-294 + T-295 this sprint — deploy to production |
| FB-200–FB-206, FB-208 | Positive | — | **Acknowledged** — all confirmations |

**One Major feature gap to address.** Sprint 38 is entirely focused on production deployment and verification.

---

## In Scope

### Phase 1 — Production Deployment (start immediately)

- [ ] **T-293** — Deploy Engineer: Deploy to production (Render)

  **Context:** T-290 (Sprint 37 carry-over) was never executed. Staging is fully verified (T-289 Deploy Verified = Yes). All Sprint 35+36+37 code is ready to ship: XSS sanitization (simple + nested), post-sanitization validation, calendar "+x more" click-to-expand, page title "triplanner", IBM Plex Mono font. Supersedes T-290 (Sprint 37) and T-283 (Sprint 36).

  **Execute:**
  1. Merge feature branch to main via PR
  2. Render auto-deploys from main — verify deployment completes
  3. Smoke test production endpoints:
     - Health endpoint returns `{"status":"ok"}`
     - Frontend loads with correct page title "triplanner"
     - Auth register/login flow works
     - XSS sanitization (simple + nested patterns) strips tags on production
     - Post-sanitization validation rejects all-HTML required fields
     - Calendar endpoint returns events
  4. Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - PR merged to main
  - Render deployment successful
  - Production endpoints responding
  - XSS sanitization (simple + nested) confirmed on production
  - Post-sanitization validation confirmed on production
  - Page title "triplanner" confirmed on production

  **Blocked By:** None

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 2 — Production Verification (sequential after Phase 1)

- [ ] **T-294** — Monitor Agent: Production health check ← Blocked by T-293

  **Scope:**
  - Full production health check protocol
  - Verify nested XSS bypass is fixed on production
  - Verify post-sanitization validation on production
  - Verify page title "triplanner" on production
  - Deploy Verified = Yes (Production)

  **Acceptance criteria:**
  - All production endpoints healthy
  - Nested XSS bypass confirmed fixed on production
  - Post-sanitization validation confirmed on production
  - Page title "triplanner" confirmed
  - Deploy Verified = Yes (Production)

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-295** — User Agent: Production walkthrough ← Blocked by T-294

  **Scope:**
  - Test nested XSS bypass fix on production
  - Test post-sanitization validation on production
  - Verify page title and fonts on production
  - Test calendar "+x more" click-to-expand on production
  - Regression check: CRUD flows, calendar, auth, search/filter/sort
  - Submit feedback to `feedback-log.md`

  **Acceptance criteria:**
  - All Sprint 35+36+37 features verified on production
  - No Critical or Major regressions
  - Feedback submitted

  **Files:** `feedback-log.md`, `handoff-log.md`

---

## Out of Scope

- **New features** — No new feature work this sprint. Deploy-only.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-030 (trip notes/description field)** — Backlog.
- **B-032 (trip export/print)** — Deferred.
- **B-036 (activity notes field)** — Backlog; minor, not blocking.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Deploy Engineer | Production deployment (Render) | T-293 |
| Monitor Agent | Production health check | T-294 |
| User Agent | Production walkthrough | T-295 |
| Manager | Triage T-295 feedback, Sprint 39 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-293 (Deploy: Production) → T-294 (Monitor: Production) → T-295 (User Agent: Production)
```

**Critical path:** T-293 → T-294 → T-295

---

## Definition of Done

*How do we know Sprint #38 is complete?*

- [ ] T-293: Production deployed via Render, all smoke tests pass
- [ ] T-294: Monitor production health check — Deploy Verified = Yes (Production)
- [ ] T-295: User Agent production walkthrough — no Critical or Major regressions; feedback submitted
- [ ] T-295 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 38 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 39 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #38)

By end of Sprint #38, the following must be verifiable:

- [ ] **All Sprint 35+36+37 features live on production** — XSS sanitization (simple + nested), post-sanitization validation, calendar "+x more", page title "triplanner", IBM Plex Mono font
- [ ] **Production verified** — Deploy Verified = Yes (Production) confirmed by Monitor Agent
- [ ] **User Agent verified on production** — no Critical or Major issues
- [ ] **Production deployment debt cleared** — no more carry-over deploy tasks

---

## Blockers

- **No blockers on T-293.** Staging is verified. Production deploy can start immediately.
- **T-294 blocked by T-293.** Monitor needs production deployed first.
- **T-295 blocked by T-294.** User Agent needs production health-checked first.

---

*Sprint #37 archived to `.workflow/sprint-log.md` on 2026-03-24. Sprint #38 plan written by Manager Agent 2026-03-24.*

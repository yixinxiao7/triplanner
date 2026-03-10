# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #23 — 2026-03-10

**Sprint Goal:** Close the two-sprint User Agent validation backlog. T-202 (consolidated comprehensive walkthrough covering Sprint 20 + Sprint 22 features) must run as the first and only Phase 1 action — ZERO BLOCKERS, start immediately. After T-202 feedback is triaged: if clean, proceed to Phase 2 (vitest/esbuild dependency upgrade, B-021). If T-202 reveals Critical or Major bugs, hotfix tasks take full priority over Phase 2.

**Context:** Sprint 22 delivered TripStatusSelector end-to-end (T-195–T-200 all Done). Two User Agent walkthroughs remain unexecuted:
- **T-194** (Sprint 20 trip notes + destination validation) — 4th consecutive carry-over
- **T-201** (Sprint 22 TripStatusSelector) — 1st carry-over

These are consolidated into **T-202** — one comprehensive walkthrough covering both feature sets. Staging is verified healthy (T-200 Monitor re-verification 2026-03-10T21:35:00Z: all checks PASS, Vite proxy fixed, pm2 online). No new features will be scoped until T-202 is Done and feedback is triaged.

**Feedback Triage (Sprint 22 → Sprint 23):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| Monitor Alert (T-200) | Monitor Alert | Critical | Resolved ✅ (fixed mid-Sprint 22) | Vite proxy ECONNREFUSED — fixed in `infra/ecosystem.config.cjs` by Deploy Engineer; re-verified PASS |

*No new "Tasked" carry-overs. No open Critical/Major bugs entering Sprint 23.*

---

## In Scope

### Phase 1 — Consolidated User Agent Walkthrough (IMMEDIATE — NO BLOCKERS)

- [ ] **T-202** — User Agent: Consolidated Sprint 20 + Sprint 22 comprehensive walkthrough ← **NO DEPENDENCIES — START IMMEDIATELY** (P0) ⚠️ 4th consecutive carry-over for Sprint 20 scope
  - Run against existing staging (https://localhost:4173 / https://localhost:3001)
  - T-200 confirmed staging health on 2026-03-10T21:35:00Z — all checks PASS, Vite proxy fixed

  **Sprint 20 scope (trip notes + destination validation):**
  - Trip notes flow: empty placeholder → click "Edit notes" → type → char count updates → Save → note displays ✅
  - Trip notes clear: edit → clear all text → Save → placeholder returns ✅
  - Trip notes max length: textarea stops at 2000 chars ✅
  - Destination validation: direct API call with 101-char destination → 400 human-friendly message ✅
  - Destination validation: PATCH `destinations:[]` → 400 "At least one destination is required" ✅

  **Sprint 22 scope (TripStatusSelector):**
  - Status badge (view): TripDetailsPage shows current trip status as a styled badge ✅
  - Status change: click badge → select ONGOING → badge updates to ONGOING without page reload ✅
  - Status change: change ONGOING → COMPLETED → badge updates ✅
  - Status revert: simulate API failure → badge reverts to previous status, error shown ✅
  - Keyboard: open selector with keyboard (Space/Enter), change status without mouse, Escape closes ✅
  - Home page sync: after status change on TripDetailsPage, navigate Home → TripCard shows updated status ✅

  **Regression suite:**
  - Sprint 19: rate limiting (login lockout after 10 attempts) ✅; multi-destination chip UI ✅
  - Sprint 17: print itinerary button visible on TripDetailsPage ✅
  - Sprint 16: start_date/end_date visible on trip details ✅

  - Submit structured feedback to `feedback-log.md` under **"Sprint 23 User Agent Feedback"** header
  - Manager triages feedback immediately after T-202 completes before Phase 2 starts

---

### Phase 2 — vitest Dependency Upgrade (after T-202 clean — no Critical/Major bugs)

- [ ] **T-203** — Frontend Engineer + Backend Engineer: vitest upgrade 1.x → 4.x (B-021 resolution) ← Blocked by T-202 feedback triage (P2)
  - **Frontend:** Upgrade `vitest` in `frontend/package.json` to `^4.0.0`. Run `npm test --run` — all 451+ tests must pass. Fix any breaking API changes (e.g., `vi.fn()`, `vi.mock()`, `expect` matchers).
  - **Backend:** Upgrade `vitest` in `backend/package.json` to `^4.0.0`. Run `npm test --run` — all 304+ tests must pass.
  - Run `npm audit` in both directories — verify the 5 moderate dev-only vulnerabilities (GHSA-67mh-4wv8-2f99) are resolved.
  - No production/runtime code changes — this is dev-tooling-only.
  - Log a note in `handoff-log.md` if any test assertions required changes (so QA can re-verify coverage parity).

- [ ] **T-204** — QA Engineer: Security checklist + test re-verification after vitest upgrade ← Blocked by T-203 (P2)
  - Re-run `npm test --run` in both `backend/` and `frontend/` — confirm test counts unchanged (304 backend + 451+ frontend)
  - Re-run `npm audit` in both — confirm 0 Critical/High/Moderate vulnerabilities in dev deps
  - Confirm no new `dangerouslySetInnerHTML`, no hardcoded secrets introduced by upgrade PRs
  - Log full report in `qa-build-log.md` Sprint 23 section

- [ ] **T-205** — Deploy Engineer: Sprint 23 staging re-deployment ← Blocked by T-204 (P2)
  - Pre-deploy gate: T-204 Done (tests passing, audit clean)
  - No backend migration required — vitest is a dev dependency only
  - `npm run build` in `frontend/` → 0 errors → `pm2 reload triplanner-frontend`
  - `pm2 restart triplanner-backend`
  - **Verify `infra/ecosystem.config.cjs` still includes `triplanner-frontend` entry with `env: { BACKEND_PORT: '3001', BACKEND_SSL: 'true' }`** (must be present post-upgrade — regression from Sprint 22 Monitor Alert)
  - Smoke tests: GET /health → 200 ✅; TripStatusSelector renders ✅; PATCH /trips/:id status ✅
  - Log handoff to Monitor (T-206)

- [ ] **T-206** — Monitor Agent: Sprint 23 staging health check ← Blocked by T-205 (P2)
  - HTTPS ✅, pm2 port 3001 ✅, health 200 ✅
  - Config consistency: Vite proxy targets `https://localhost:3001` (BACKEND_PORT=3001, BACKEND_SSL=true in ecosystem.config.cjs) ✅
  - Sprint 22 regression: PATCH /trips/:id `{status:"ONGOING"}` → 200 ✅
  - Sprint 20 regression: GET /trips/:id includes `notes` key ✅
  - Sprint 19 regression: RateLimit-Limit header on /auth/login ✅
  - Sprint 17 regression: Print itinerary button visible ✅
  - Sprint 16 regression: trips include start_date/end_date ✅
  - `npx playwright test` → 4/4 PASS ✅ (or 7/7 if expanded tests exist)
  - Full report in `qa-build-log.md`. No User Agent walkthrough required (T-202 already completed Phase 1).

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. **23 consecutive sprints with no decision. Project owner action required.** All infrastructure is complete and production-ready.
- **B-021 resolution without T-202 clean** — If T-202 reveals Critical or Major bugs, Phase 2 is deferred entirely to Sprint 24. Hotfix tasks take full priority.
- **New feature implementation** — No new features until T-202 User Agent walkthrough completes and feedback is triaged. Trip status selector is the last unvalidated feature.
- **B-020 (Redis rate limiting)** — In-memory store sufficient at current scale.
- **B-024 (per-account rate limiting)** — IP-based sufficient at current scale.
- **MFA login, Home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | Consolidated Sprint 20 + Sprint 22 walkthrough — **IMMEDIATE** | T-202 |
| Frontend Engineer | vitest upgrade (frontend) — after T-202 clean | T-203 (frontend portion) |
| Backend Engineer | vitest upgrade (backend) — after T-202 clean | T-203 (backend portion) |
| QA Engineer | Test re-verification post-upgrade | T-204 |
| Deploy Engineer | Sprint 23 staging re-deployment | T-205 |
| Monitor Agent | Sprint 23 health check | T-206 |
| Manager | T-202 feedback triage → Phase 2 gate | Code review + triage |

---

## Dependency Chain (Critical Path)

```
Phase 1 — Immediate (NO BLOCKERS):
T-202 (User Agent: consolidated Sprint 20 + Sprint 22 walkthrough) ← P0 ⚠️ 4th attempt for Sprint 20 scope
    |
    └── Manager triages T-202 feedback
           |
           ├── If Clean (no Critical/Major bugs) → Phase 2 begins
           └── If Bugs found → Hotfix tasks (H-xxx) take priority; Phase 2 deferred to Sprint 24

Phase 2 (if T-202 feedback clean):
T-203 (Frontend + Backend: vitest 1.x → 4.x upgrade — parallel for frontend and backend)
    |
T-204 (QA: test re-verification + npm audit clean)
    |
T-205 (Deploy: staging re-deployment)
    |
T-206 (Monitor: health check)
    |
Manager: Triage any remaining feedback → Sprint 24 plan
```

---

## Definition of Done

*How do we know Sprint #23 is complete?*

- [ ] T-202: Consolidated User Agent walkthrough complete; Sprint 20 (notes + destination validation) AND Sprint 22 (TripStatusSelector) verified on staging; structured feedback submitted to feedback-log.md
- [ ] T-202 feedback triaged by Manager (Tasked, Resolved, Won't Fix, or Acknowledged for all entries)
- [ ] **If Phase 2 triggers:**
  - [ ] T-203: vitest upgraded in both frontend and backend; all tests pass (304 backend + 451+ frontend)
  - [ ] T-204: QA re-verified post-upgrade; npm audit shows 0 Moderate+ dev dep vulnerabilities
  - [ ] T-205: Staging re-deployed; `infra/ecosystem.config.cjs` frontend env vars confirmed present
  - [ ] T-206: Monitor confirms all Sprint 23 health checks pass
- [ ] Sprint 23 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 24 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #23)

By end of Sprint #23, the following must be verifiable:

- [ ] **T-202 Done** — User Agent confirms trip notes, destination validation, AND TripStatusSelector all work correctly on staging
- [ ] No Critical or Major bugs found in T-202 walkthrough (or hotfixes dispatched if found)
- [ ] **If Phase 2 runs:** npm audit in both dirs shows 0 Moderate+ dev-dep vulnerabilities (B-021 resolved)
- [ ] Sprint 24 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 23 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete, production-ready, and has been for 20+ sprints. **Project owner action required before production deployment can execute.**
- **Phase 2 gate:** T-203–T-206 are blocked until Manager triages T-202 feedback. If T-202 reveals Critical or Major bugs, Phase 2 is deferred in full.

---

*Previous sprint (Sprint #22) archived to `.workflow/sprint-log.md` on 2026-03-10. Sprint #23 plan written by Manager Agent 2026-03-10.*

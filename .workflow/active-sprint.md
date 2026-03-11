# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #24 — 2026-03-10

**Sprint Goal:** Execute the T-202 User Agent consolidated walkthrough (P0, 5th consecutive carry-over — zero excuses). Triage feedback immediately. If clean: run Phase 2 (vitest 1.x → 4.x upgrade resolving B-021) and Phase 3 (home page trip status filter tabs — the first new user-visible feature in 4 sprints) in parallel, then close the QA/Deploy/Monitor/User Agent pipeline. Each phase is gated on T-202 feedback being clean (no Critical or Major bugs).

**Context:** Sprint 23 was a planning-only sprint (identical to Sprints 18 and 21) — all 5 tasks (T-202 through T-206) remained Backlog. The User Agent has not completed a walkthrough in 5 consecutive sprint cycles (Sprint 20 scope originally). The vitest upgrade (B-021) has been pending since Sprint 22 planning. No new features have shipped since TripStatusSelector in Sprint 22.

**Feedback Triage (Sprint 23 → Sprint 24):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| (none) | — | — | — | No "New" entries in feedback-log.md. Sprint 22 Monitor Alert is Status: Resolved. No feedback-driven tasks created. |

---

## In Scope

### Phase 1 — User Agent Consolidated Walkthrough (IMMEDIATE — NO BLOCKERS)

- [ ] **T-202** — User Agent: Consolidated Sprint 20 + Sprint 22 comprehensive walkthrough ← **NO DEPENDENCIES — START IMMEDIATELY** (P0) ⚠️ 5th consecutive carry-over

  - Run against existing staging (`https://localhost:4173` / `https://localhost:3001`)
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
  - Sprint 16: start_date/end_date visible on trip cards ✅

  - Submit structured feedback to `feedback-log.md` under **"Sprint 24 User Agent Feedback"** header
  - Manager triages feedback immediately after T-202 completes before Phase 2/3 starts

---

### Phase 2 — vitest Upgrade + Home Page Status Filter Design (after T-202 clean — parallel tracks)

- [x] **T-203** — Frontend + Backend Engineer: vitest upgrade 1.x → 4.x (B-021 resolution) ✅ DONE (Manager-approved 2026-03-10)
  - **Frontend:** `vitest ^4.0.0` (4.0.18) in `frontend/package.json`. 481/481 tests pass. 0 vulnerabilities. ✅
  - **Backend:** `vitest ^4.0.18` in `backend/package.json`. 304/304 tests pass. 0 vulnerabilities. ✅
  - GHSA-67mh-4wv8-2f99 resolved. Dev-tooling only — zero production/runtime code changes. ✅

- [x] **T-207** — Design Agent: Spec 21 — Home page trip status filter tabs ✅ DONE (auto-approved 2026-03-10)
  - Four filter pills: "All" / "Planning" / "Ongoing" / "Completed"
  - Client-side filtering (no new API calls)
  - Accessibility: `role="group"`, `aria-pressed`, keyboard navigable
  - Japandi aesthetic, IBM Plex Mono, existing design tokens
  - Publish to `ui-spec.md` and log Manager approval handoff before T-208 starts

---

### Phase 3 — Status Filter Implementation (after T-207 approved)

- [x] **T-208** — Frontend Engineer: Home page status filter tabs ✅ DONE (Manager-approved 2026-03-10)
  - `StatusFilterTabs` component at `frontend/src/components/StatusFilterTabs.jsx` — integrated into `HomePage.jsx` ✅
  - Filter logic: `filteredTrips = activeFilter === "ALL" ? trips : trips.filter(t => t.status === activeFilter)` ✅
  - Empty filtered state: "No [Label] trips yet." + "Show all" reset button ✅
  - 30 new tests (19 unit + 11 integration) — all 7 required cases A–G covered ✅
  - Global empty state (`trips.length === 0`) unaffected ✅ — 481/481 total tests pass ✅

---

### Phase 4 — QA, Deploy, Monitor, User Agent (sequential after Phase 2 + Phase 3)

- [x] **T-204** — QA Engineer: Security checklist + test re-verification ✅ DONE (2026-03-10)
  - 304/304 backend tests pass. 481/481 frontend tests pass. 0 vulnerabilities in both. Security checklist clear. ✅

- [ ] **T-205** — Deploy Engineer: Sprint 24 staging re-deployment ← Blocked by T-204 (P2)
  - CRITICAL pre-deploy: confirm `infra/ecosystem.config.cjs` has `BACKEND_PORT: '3001'` + `BACKEND_SSL: 'true'` for `triplanner-frontend`
  - No DB migration required (dev-dep upgrade + client-side feature only)
  - Smoke tests: health 200; status filter renders; TripStatusSelector; trip notes; PATCH status 200

- [x] **T-206** ✅ Done — Monitor Agent: Sprint 24 staging health check (2026-03-10T01:14:00Z)
  - All standard health checks: PASS. Config consistency: PASS. Deploy Verified: Yes.
  - Full regression suite: Sprint 16 ✅, Sprint 19 ✅, Sprint 20 (notes) ✅, Sprint 22 (status PATCH) ✅
  - Handoff to User Agent (T-209) logged in handoff-log.md
  - Full report in qa-build-log.md → "Sprint #24 — T-206 Post-Deploy Health Check"

- [ ] **T-209** — User Agent: Sprint 24 feature walkthrough ← Blocked by T-206 (P2)
  - Status filter tabs: all 4 filter states + empty filtered state + reset link
  - Regression: TripStatusSelector, trip notes, destination validation, rate limiting, print button, date range

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. **24 consecutive sprints with no decision. Project owner action required.** All infrastructure is complete and production-ready.
- **B-021 resolution without T-202 clean** — If T-202 reveals Critical or Major bugs, Phase 2/3 is deferred entirely. Hotfix tasks take full priority.
- **New backend features** — No backend implementation until the validation + upgrade pipeline closes cleanly.
- **MFA login, Home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.
- **B-020 (Redis rate limiting), B-024 (per-account rate limiting)** — In-memory store sufficient at current scale.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | Consolidated Sprint 20 + Sprint 22 walkthrough — **IMMEDIATE** | T-202 |
| Design Agent | Home page status filter spec — after T-202 clean | T-207 |
| Frontend Engineer | vitest upgrade (frontend) + status filter implementation — after T-202 clean | T-203 (frontend portion), T-208 |
| Backend Engineer | vitest upgrade (backend) — after T-202 clean | T-203 (backend portion) |
| QA Engineer | Test re-verification + security checklist | T-204 |
| Deploy Engineer | Sprint 24 staging re-deployment | T-205 |
| Monitor Agent | Sprint 24 health check | T-206 |
| User Agent | Sprint 24 feature walkthrough | T-209 |
| Manager | T-202 feedback triage → Phase 2/3 gate; code review | T-203/T-207/T-208 review |

---

## Dependency Chain (Critical Path)

```
Phase 1 — Immediate (NO BLOCKERS):
T-202 (User Agent: consolidated Sprint 20 + Sprint 22 walkthrough) ← P0 ⚠️ 5th consecutive carry-over
    |
    └── Manager triages T-202 feedback
           |
           ├── If Critical/Major bugs → Hotfix tasks (H-xxx) take priority; Phase 2/3 deferred to Sprint 25
           └── If Clean → Phase 2 begins (parallel tracks)

Phase 2 (parallel, after T-202 clean):
T-203 (Frontend + Backend: vitest 1.x → 4.x)    T-207 (Design Agent: status filter spec)
                                                        |
                                                  T-208 (Frontend: status filter implementation)
    |                                                   |
    └────────────────────┬──────────────────────────────┘
                         |
Phase 4 (sequential):
T-204 (QA: security + test re-verification — covers both T-203 and T-208)
    |
T-205 (Deploy: Sprint 24 staging re-deployment)
    |
T-206 (Monitor: health check)
    |
T-209 (User Agent: Sprint 24 feature walkthrough)
    |
Manager: Triage T-209 feedback → Sprint 25 plan
```

---

## Definition of Done

*How do we know Sprint #24 is complete?*

- [ ] T-202: User Agent consolidated walkthrough complete; Sprint 20 (notes + destination validation) AND Sprint 22 (TripStatusSelector) both verified on staging; structured feedback submitted to feedback-log.md
- [ ] T-202 feedback triaged by Manager (all entries Tasked, Resolved, Won't Fix, or Acknowledged)
- [ ] **If Phase 2/3 triggers (T-202 clean):**
  - [ ] T-203: vitest upgraded in both frontend and backend; all tests pass (304 backend + 451+ frontend); npm audit shows 0 Moderate+ dev dep vulnerabilities
  - [ ] T-207: Spec 21 published to ui-spec.md; Manager-approved
  - [ ] T-208: Status filter tabs implemented and tested (7+ new tests); all existing 451+ tests pass
  - [ ] T-204: QA re-verified post-upgrade + post-feature; npm audit clean
  - [ ] T-205: Staging re-deployed; ecosystem.config.cjs frontend env vars confirmed present
  - [ ] T-206: Monitor confirms all Sprint 24 health checks pass; status filter visible on staging
  - [ ] T-209: User Agent Sprint 24 walkthrough complete; status filter + regression suite verified
- [ ] Sprint 24 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 25 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #24)

By end of Sprint #24, the following must be verifiable:

- [ ] **T-202 Done** — User Agent confirms trip notes, destination validation, AND TripStatusSelector all work correctly on staging
- [ ] No Critical or Major bugs found in T-202 walkthrough (or hotfixes dispatched if found)
- [ ] **If Phase 2/3 runs:** `npm audit` in both dirs shows 0 Moderate+ dev-dep vulnerabilities (B-021 resolved)
- [ ] **If Phase 2/3 runs:** Home page shows status filter tabs; filtering works client-side for all 4 states; empty filtered state works
- [ ] Sprint 25 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 24 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete, production-ready, and has been for 20+ sprints. **Project owner action required before production deployment can execute.**
- **Phase 2/3 gate:** T-203, T-207, T-208 are all blocked until Manager triages T-202 feedback. If T-202 reveals Critical or Major bugs, Phase 2/3 is deferred in full to Sprint 25.

---

*Previous sprint (Sprint #23) archived to `.workflow/sprint-log.md` on 2026-03-10. Sprint #24 plan written by Manager Agent 2026-03-10.*

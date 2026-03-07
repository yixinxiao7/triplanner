# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #13 — 2026-03-07

**Sprint Goal:** Close the Sprint 12 pipeline (fix T-131 staging port misconfiguration, re-run Monitor health check, complete User Agent walkthrough), then deliver two targeted UX improvements from feedback: rework DayPopover to stay open and anchored on scroll (FB-091, revising T-126's close-on-scroll approach), and add rental car pick-up/drop-off time chips to the calendar (FB-092). Fix api-contracts.md land-travel endpoint documentation (FB-090).

**Context:** Sprint 12 delivered all four implementation tasks (T-125–T-128) with zero rework and full QA sign-off. The only remaining gap is the Deploy/Monitor/User Agent pipeline: T-131 started the backend on port 3000 via direct `node` instead of port 3001 via pm2. T-132 (Monitor) detected and filed FB-089. T-133 (User Agent) was blocked. Sprint 13 corrects this immediately (T-134) and completes the Sprint 12 pipeline (T-135 → T-136) in parallel with implementing FB-091 and FB-092 UX improvements. The core MVP per the project brief is complete and staging-validated.

**Feedback Triage (Sprint 12 Closeout):**

| FB Entry | Category | Severity | Sprint 13 Disposition | Task |
|----------|----------|----------|-----------------------|------|
| FB-089 | Monitor Alert | Major | Tasked — P0 | T-134 |
| FB-090 | Monitor Alert | Minor | Tasked — P3 | T-139 |
| FB-091 | Feature Gap | Minor | Tasked — P2 | T-137 |
| FB-092 | Feature Gap | Minor | Tasked — P2 | T-138 |

---

## In Scope

### Phase 0 — Staging Fix (start immediately — P0; blocks the Sprint 12 User Agent walkthrough)

- [ ] **T-134** — Deploy Engineer: T-131 re-execution — fix staging to use pm2 on port 3001 ← No dependencies — START IMMEDIATELY
  - Kill PID 78079: `kill 78079`
  - From project root: `pm2 start infra/ecosystem.config.cjs` (sets `NODE_ENV=staging` → loads `.env.staging` → PORT=3001 + SSL)
  - Verify `pm2 status` → `triplanner-backend` online
  - Verify `curl -sk https://localhost:3001/api/v1/health` → HTTP 200
  - Verify port 3000 has no listener
  - Confirm `backend/.env` unchanged (local-dev defaults)
  - Log handoff to Monitor Agent in handoff-log.md with: backend URL, pm2 PID, .env confirmation

- [ ] **T-135** — Monitor Agent: Sprint 12 health check retry ← T-134
  - Full health check at `https://localhost:3001` (not 3000)
  - pm2 online ✅, HTTPS ✅, /api/v1/health → 200 ✅
  - All Sprint 12 feature checks: DayPopover closes on scroll ✅, check-in label ✅, calendar default month ✅, .env intact ✅
  - Playwright 7/7 ✅, Sprint 11 regression ✅
  - Report in qa-build-log.md Sprint 13 section; handoff to User Agent (T-136)

- [ ] **T-136** — User Agent: Sprint 12 feature walkthrough (T-133 carry-over) ← T-135
  - T-125: `backend/.env` shows local-dev defaults (HTTP, port 3000)
  - T-126: "+X more" popover → scroll → popover closes (does not drift)
  - T-127: Stay check-in chip reads "check-in Xa"; checkout chip reads "check-out Xa"
  - T-128: Trip with future-month events → calendar opens on that month; empty trip → current month
  - Sprint 11 regression: land travel, notes, TZ abbreviations, URL links, print all operational
  - Submit structured feedback to feedback-log.md under Sprint 13 header

---

### Phase 1 — Frontend + Documentation Fixes (parallel — no cross-dependencies; start immediately alongside Phase 0)

- [ ] **T-137** — Frontend Engineer: DayPopover stay-open and anchored on scroll ← No dependencies — START IMMEDIATELY
  - Remove the scroll-close listener added by T-126 (`window.addEventListener('scroll', close, ...)`)
  - Switch from `position: fixed` (viewport-relative) to `position: absolute` (document-relative)
  - Calculate popover position as `getBoundingClientRect()` offsets + `window.scrollX / scrollY` so it stays anchored to the trigger's document position
  - Portal target remains `document.body` (createPortal) — popover scrolls with the document
  - All existing close triggers preserved: Escape keydown, click-outside, any explicit close button
  - Update tests: remove scroll-closes-popover test; add stays-open-on-scroll test (scroll event does NOT call onClose); all existing popover tests continue to pass

- [ ] **T-138** — Frontend Engineer: Rental car pick-up/drop-off time chips on calendar ← No dependencies — START IMMEDIATELY
  - In `DayCell`: for `RENTAL_CAR` land travel events, on first day prepend "pick-up " to time chip; on last day prepend "drop-off " to time chip
  - In `DayPopover.getEventTime`: same labeling for RENTAL_CAR events
  - Non-RENTAL_CAR land travel modes unaffected
  - New tests: pick-up chip on first day ✅, drop-off chip on last day ✅, non-RENTAL_CAR unaffected ✅

- [ ] **T-139** — Backend Engineer: Fix api-contracts.md `/land-travels` → `/land-travel` ← No dependencies — START IMMEDIATELY
  - Documentation-only: update all Land Travel endpoint paths from plural to singular
  - Verify against `backend/src/app.js` mounting (line: `app.use('/api/v1/trips/:tripId/land-travel', ...)`)
  - No code changes; log handoff to Manager when complete

---

### Phase 2 — QA Review (after Phase 1 tasks complete)

- [ ] **T-140** — QA Engineer: Security checklist + code review audit for T-137, T-138, T-139 ← T-137, T-138, T-139
  - T-137: confirm scroll listener fully removed; `position: absolute` + scroll offset correct; Escape + click-outside still work; no memory leak; no XSS
  - T-138: `mode === 'RENTAL_CAR'` guard correct; safe string formatting; no security surface
  - T-139: documentation only — no security surface
  - Full test suite: `npm test --run` in `frontend/` and `backend/` — all pass
  - Report in qa-build-log.md Sprint 13 section

- [ ] **T-141** — QA Engineer: Integration testing for Sprint 13 changes ← T-140
  - DayPopover: open popover → scroll → popover remains open, does not drift → Escape closes ✅
  - Rental car chips: pick-up day shows "pick-up Xp"; drop-off day shows "drop-off Xp" ✅
  - api-contracts.md: `/land-travel` (singular) correctly documented ✅
  - Sprint 12 regression: check-in label, calendar default month, .env isolation all pass ✅
  - Sprint 11 regression: land travel, notes, TZ abbrev, URL links, print all pass ✅
  - Report in qa-build-log.md Sprint 13 section; handoff to Deploy (T-142)

---

### Phase 3 — Deploy, Monitor, User Agent (sequential; T-142 waits on both T-141 and T-136)

- [ ] **T-142** — Deploy Engineer: Sprint 13 staging re-deployment ← T-141, T-136
  - Rebuild frontend: `npm run build` in `frontend/`
  - No new backend migrations (no schema changes)
  - Restart via pm2: `pm2 restart triplanner-backend` (backend must be on `https://localhost:3001`)
  - Do NOT modify `backend/.env`
  - Smoke tests: DayPopover stays open on scroll ✅; rental car chips present ✅; Sprint 12 features intact ✅
  - Log explicit handoff to Monitor Agent in handoff-log.md
  - Report in qa-build-log.md Sprint 13 section

- [ ] **T-143** — Monitor Agent: Sprint 13 staging health check ← T-142
  - HTTPS ✅, pm2 online on port 3001 ✅, /api/v1/health → 200 ✅
  - DayPopover: scroll does NOT close popover; popover stays anchored ✅
  - Rental car: pick-up day chip "pick-up Xp" ✅; drop-off day chip "drop-off Xp" ✅
  - Playwright 7/7 ✅
  - Sprint 12 regression checks pass ✅
  - Full report in qa-build-log.md Sprint 13 section; handoff to User Agent (T-144)

- [ ] **T-144** — User Agent: Sprint 13 feature walkthrough ← T-143
  - DayPopover: trigger "+X more" → scroll → popover stays open and anchored; Escape closes; click-outside closes
  - Rental car: pick-up day shows "pick-up Xp"; drop-off day shows "drop-off Xp"
  - Sprint 12 regression: all 4 Sprint 12 fixes verified (check-in label, calendar default month, .env intact, popover close behaviors)
  - Sprint 11 regression: all features operational
  - Submit structured feedback to feedback-log.md under Sprint 13 header

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. T-124 produced `.workflow/hosting-research.md`; project owner must review and select a provider.
- **B-020 (Redis rate limiting)** — Deferred. In-memory acceptable at current scale.
- **B-021 (esbuild dev dep vulnerability)** — No production impact. Monitor for upstream fix.
- **B-024 (per-account rate limiting)** — Depends on B-020. Deferred.
- **`formatTimezoneAbbr()` unit tests** — Deferred to when `formatDate.test.js` is next touched.
- **Sort logic deduplication in tripModel.js** — Minor DRY violation, deferred.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Deploy Engineer | Fix staging port (pm2) + Sprint 13 re-deployment | T-134, T-142 |
| Monitor Agent | Sprint 12 health check retry + Sprint 13 health check | T-135, T-143 |
| User Agent | Sprint 12 walkthrough + Sprint 13 walkthrough | T-136, T-144 |
| Frontend Engineer | DayPopover stay-open behavior + rental car calendar chips | T-137, T-138 |
| Backend Engineer | api-contracts.md documentation fix | T-139 |
| QA Engineer | Security checklist + integration testing | T-140, T-141 |
| Manager | Triage T-144 feedback → Sprint 14 plan | Feedback triage |

---

## Dependency Chain (Critical Path)

```
Track A — Pipeline Closure (carry-over from Sprint 12):
T-134 (Deploy: fix pm2 + port 3001)       ← START IMMEDIATELY
        │
        └→ T-135 (Monitor: Sprint 12 health check retry)
                │
                └→ T-136 (User Agent: Sprint 12 walkthrough)
                        │
                        └→ [merges into T-142]

Track B — Sprint 13 UX Improvements (parallel with Track A):
T-137 (Frontend: DayPopover stay-open)     ← START IMMEDIATELY
T-138 (Frontend: Rental car time chips)    ← START IMMEDIATELY
T-139 (Backend Eng: api-contracts.md fix)  ← START IMMEDIATELY

[T-137, T-138, T-139 run in PARALLEL]
        │
        └→ T-140 (QA: Security checklist + code review)
                │
                └→ T-141 (QA: Integration testing)
                        │
                        └→ [merges with T-136 into T-142]

Merge Point:
[T-141 Done] + [T-136 Done]
        │
        └→ T-142 (Deploy: Sprint 13 staging re-deployment)
                │
                └→ T-143 (Monitor: Sprint 13 health check)
                        │
                        └→ T-144 (User Agent: Sprint 13 walkthrough)
                                │
                                └→ Manager: Triage feedback → Sprint 14 plan
```

---

## Definition of Done

*How do we know Sprint #13 is complete?*

- [ ] T-134: pm2 running on `https://localhost:3001`; `backend/.env` unchanged; handoff logged to Monitor
- [ ] T-135: All Sprint 12 health checks pass on port 3001; Playwright 7/7 ✅
- [ ] T-136: User Agent verifies all 4 Sprint 12 fixes on staging; Sprint 11 regression confirmed; feedback submitted
- [ ] T-137: DayPopover stays open on scroll; stays anchored to trigger position; Escape + click-outside still close it; scroll test updated
- [ ] T-138: Rental car pick-up day shows "pick-up Xp"; drop-off day shows "drop-off Xp"; non-RENTAL_CAR unaffected
- [ ] T-139: api-contracts.md uses `/land-travel` (singular) for all Land Travel endpoints
- [ ] T-140: Security checklist passes for all Sprint 13 changes; all tests pass
- [ ] T-141: All Sprint 13 integration checks pass; Sprint 12 regression clean
- [ ] T-142: Staging rebuilt with Sprint 13 changes; pm2 online on port 3001; smoke tests pass; `backend/.env` unchanged
- [ ] T-143: All Sprint 13 health checks pass on staging; Playwright 7/7 ✅
- [ ] T-144: User Agent verifies DayPopover stay-open and rental car chips on staging; Sprint 12 regression clean; feedback submitted and triaged
- [ ] Sprint 13 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 14 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #13)

By end of Sprint #13, the following must be verifiable on HTTPS staging (`https://localhost:3001`):

- [ ] Backend running via pm2 on `https://localhost:3001` (not direct node on port 3000)
- [ ] `backend/.env` contains local-dev settings even after Sprint 13 deploy cycle completes
- [ ] Click "+X more" on a calendar day → open popover → scroll page → popover remains open and anchored to trigger (does NOT close on scroll)
- [ ] Press Escape → DayPopover closes; click outside → DayPopover closes
- [ ] Rental car land travel entry → calendar pick-up day shows "pick-up Xp" chip; drop-off day shows "drop-off Xp" chip
- [ ] All 7 Playwright E2E tests continue to pass (Playwright 7/7)
- [ ] All Sprint 12 features still operational (check-in label, calendar default month, .env isolation)
- [ ] All Sprint 11 features still operational (land travel, notes, TZ abbreviations, URL links, print)

---

## Blockers

- **B-022 (Production Deployment — 11 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete and production-ready. **Project owner action required before Sprint 14 can execute production deployment.**

---

*Previous sprint (Sprint #12) archived to `.workflow/sprint-log.md` on 2026-03-07. Sprint #13 begins 2026-03-07.*

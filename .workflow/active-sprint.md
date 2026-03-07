# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #12 — 2026-03-06

**Sprint Goal:** Ship four targeted UX/infrastructure fixes surfaced by project owner feedback during Sprint 11's pipeline closure (FB-085 through FB-088): isolate staging environment config from local dev (`.env.staging`), fix DayPopover scroll anchoring, add missing "check-in" label to calendar check-in chips, and default the calendar to the month of the first planned event. Close the sprint's QA/deploy/monitor/user-agent cycle cleanly.

**Context:** Sprint 11 successfully closed the six-sprint-deep pipeline validation backlog. All four User Agent walkthroughs (T-094 Sprint 6, T-109 Sprint 7, T-120 Sprint 8, T-123 Sprint 10) completed with no Critical or Major bugs found. All Integration Check tasks (T-097 through T-104, T-113, T-114) are now Done. The core MVP per the project brief is complete and staging-validated. Sprint 12 is a focused polish sprint — 4 fixes, no new features, clean QA cycle. T-124 (hosting research) produced `.workflow/hosting-research.md` — project owner should review and make a production hosting decision before Sprint 13.

**Feedback Triage (Sprint 11 Closeout):** All four "New" entries triaged.

| FB Entry | Category | Severity | Sprint 12 Disposition | Task |
|----------|----------|----------|-----------------------|------|
| FB-085 | UX Issue | Major | Tasked | T-125 |
| FB-086 | UX Issue | Minor | Tasked | T-126 |
| FB-087 | UX Issue | Minor | Tasked | T-127 |
| FB-088 | Feature Gap | Minor | Tasked | T-128 |

---

## In Scope

### Phase 1 — Infrastructure Fix + Frontend Polish (start in parallel — no cross-dependencies)

- [ ] **T-125** — Deploy Engineer: Fix .env staging isolation ← No dependencies — START IMMEDIATELY
  - Create `backend/.env.staging` as authoritative staging config (HTTPS, port 3001, secure cookies, staging CORS origin)
  - Create `backend/.env.staging.example` template committed to repo
  - Update all deploy phase scripts to source `.env.staging` instead of overwriting `.env`
  - Update Deploy Engineer agent prompt (`.agents/deploy-engineer.md`) to enforce `.env.staging` usage
  - Add `backend/.env.staging` to `.gitignore` (secrets must not be committed)
  - Restore `backend/.env` to local-dev defaults (HTTP, port 3000, `secure: false`, localhost CORS)
  - Acceptance: `npm run dev` starts correctly without manual `.env` restoration after a deploy cycle

- [ ] **T-126** — Frontend Engineer: Fix DayPopover scroll anchoring ← No dependencies — START IMMEDIATELY
  - Current `position: fixed` popover drifts from trigger button on page scroll (FB-086)
  - Preferred fix: close popover on scroll (`window.addEventListener('scroll', close, { capture: true })`)
  - Escape-to-close and trigger focus-restoration must be preserved
  - New unit test: scroll event closes the popover; all existing popover tests continue to pass

- [ ] **T-127** — Frontend Engineer: Add "check-in" label to calendar check-in chip ← No dependencies — START IMMEDIATELY
  - Check-out day already shows "check-out Xa" — check-in day must now show "check-in Xa" for consistency (FB-087)
  - Example: "check-in 4p" on check-in date, "check-out 11a" on checkout date
  - Update any snapshot/unit tests for calendar event chip rendering

- [ ] **T-128** — Frontend Engineer: Calendar defaults to month of first planned event ← No dependencies — START IMMEDIATELY
  - Collect all event dates: flights (`departure_at`), stays (`check_in_at`), activities (`activity_date`)
  - Initialize `currentMonth` state to the earliest event's month/year
  - Fallback: if no events exist, use current month (existing behavior)
  - Month navigation (prev/next) must continue to work correctly
  - Tests: earliest-event-month scenario ✅, no-events fallback ✅

### Phase 2 — QA Review (after all Phase 1 tasks complete)

- [ ] **T-129** — QA Engineer: Security checklist + code review audit for T-125, T-126, T-127, T-128 ← T-125, T-126, T-127, T-128
  - T-125: `.env.staging` in `.gitignore`, no secrets committed, deploy scripts correct
  - T-126: Scroll listener cleaned up on unmount (no memory leak), no new XSS vectors
  - T-127: Pure render change, no security surface
  - T-128: Safe date extraction from API data, graceful fallback on malformed dates
  - Full test suite: `npm test --run` in `frontend/` and `backend/` — all tests pass
  - Report in qa-build-log.md Sprint 12 section

- [ ] **T-130** — QA Engineer: Integration testing for Sprint 12 changes ← T-129
  - Verify `backend/.env` unchanged after simulating deploy cycle
  - Verify `npm run dev` starts correctly post-deploy
  - DayPopover scroll: open popover → scroll → popover closes/stays anchored (does not drift)
  - Check-in label: stay check-in day shows "check-in Xa"; checkout day shows "check-out Xa"
  - Calendar default: trip with August events → calendar opens on August (not March)
  - Full Sprint 11 regression: land travel, notes, TZ abbreviations, URL links, print all operational
  - Report in qa-build-log.md Sprint 12 section; handoff to Deploy

### Phase 3 — Deploy, Monitor, User Agent (sequential)

- [ ] **T-131** — Deploy Engineer: Sprint 12 staging re-deployment ← T-130
  - Rebuild frontend with T-126/T-127/T-128 changes
  - Apply T-125 env fix (`.env.staging` in use; `backend/.env` restored to local-dev defaults)
  - No new backend migrations (no schema changes in Sprint 12)
  - Verify pm2 online; smoke tests: (a) calendar default month correct, (b) popover closes on scroll, (c) check-in label present, (d) `backend/.env` unchanged post-deploy
  - Deployment report in qa-build-log.md Sprint 12 section

- [ ] **T-132** — Monitor Agent: Sprint 12 staging health check ← T-131
  - HTTPS ✅, pm2 online ✅, GET /api/v1/health → 200 ✅
  - Calendar default month: trip with future events → calendar opens on correct month ✅
  - DayPopover scroll: popover closes on scroll ✅
  - Check-in label: "check-in Xa" visible on check-in day ✅
  - `npx playwright test` → 7/7 PASS ✅
  - Sprint 11 regression checks from T-119 still pass ✅
  - Full report in qa-build-log.md; handoff to User Agent (T-133)

- [ ] **T-133** — User Agent: Sprint 12 feature walkthrough ← T-132
  - T-125 (.env fix): Confirm `backend/.env` shows local dev settings (HTTP, port 3000), not staging settings
  - T-126 (DayPopover scroll): Trigger "+X more", scroll page → popover closes (does not drift away from trigger)
  - T-127 (check-in label): Stay check-in day shows "check-in Xa"; checkout day shows "check-out Xa"
  - T-128 (calendar default): Trip with future-month events → calendar opens on that month; empty trip → current month
  - Sprint 11 regression: all previously validated features operational
  - Submit structured feedback to `feedback-log.md` under Sprint 12 header

---

## Out of Scope

- **New MVP features** — Core MVP per project brief is complete and staging-validated. No new feature work this sprint.
- **Production deployment (B-022)** — Pending project owner hosting decision. T-124 produced `.workflow/hosting-research.md`; project owner must review and select a provider before Sprint 13 can execute production deploy.
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
| Deploy Engineer | .env staging isolation fix + staging re-deployment | T-125, T-131 |
| Frontend Engineer | DayPopover scroll fix, check-in label, calendar default month | T-126, T-127, T-128 |
| QA Engineer | Security checklist + integration testing | T-129, T-130 |
| Monitor Agent | Sprint 12 staging health check | T-132 |
| User Agent | Sprint 12 feature walkthrough | T-133 |
| Backend Engineer | On standby (no backend changes this sprint) | — |
| Manager | Triage T-133 feedback → Sprint 13 plan | Feedback triage |

---

## Dependency Chain (Critical Path)

```
T-125 (Deploy: .env fix)        ← START IMMEDIATELY (no dependencies)
T-126 (Frontend: popover scroll) ← START IMMEDIATELY (no dependencies)
T-127 (Frontend: check-in label) ← START IMMEDIATELY (no dependencies)
T-128 (Frontend: calendar month) ← START IMMEDIATELY (no dependencies)

[T-125, T-126, T-127, T-128 run in PARALLEL]

All four Phase 1 tasks Done
        │
        └→ T-129 (QA: Security checklist + code review)
                │
                └→ T-130 (QA: Integration testing)
                        │
                        └→ T-131 (Deploy: Sprint 12 staging re-deployment)
                                │
                                └→ T-132 (Monitor: Sprint 12 health check)
                                        │
                                        └→ T-133 (User Agent: Sprint 12 walkthrough)
                                                │
                                                └→ Manager: Triage feedback → Sprint 13 plan
```

---

## Definition of Done

*How do we know Sprint #12 is complete?*

- [ ] T-125: `backend/.env.staging` in use; `backend/.env` unchanged post-deploy; `npm run dev` works without manual restoration
- [ ] T-126: DayPopover closes (or stays anchored) on page scroll; Escape still closes; focus restored to trigger
- [ ] T-127: Calendar check-in chip reads "check-in Xa"; check-out chip reads "check-out Xa"
- [ ] T-128: Calendar defaults to earliest event month; falls back to current month if no events; month navigation works
- [ ] T-129: Security checklist passes for all Sprint 12 changes; all tests pass (`backend/` + `frontend/`)
- [ ] T-130: All 6 integration checks pass; Sprint 11 regression clean
- [ ] T-131: Staging rebuilt with Sprint 12 changes; smoke tests pass; `backend/.env` unchanged post-deploy
- [ ] T-132: All Sprint 12 health checks pass on staging; Playwright 7/7 ✅
- [ ] T-133: User Agent verifies all 4 fixes on HTTPS staging; Sprint 11 regression confirmed clean; feedback submitted and triaged
- [ ] Sprint 12 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 13 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #12)

By end of Sprint #12, the following must be verifiable on HTTPS staging:

- [ ] `backend/.env` contains local-dev settings (HTTP, port 3000) even after a staging deploy cycle was completed
- [ ] `backend/.env.staging` exists and contains staging settings; `backend/.env.staging.example` committed to repo
- [ ] Click "+X more" on a calendar day → open popover → scroll page → popover closes (does not drift) (T-126)
- [ ] Stay check-in calendar chip: "check-in 4p" (or equivalent); stay checkout chip: "check-out 11a" (or equivalent) (T-127)
- [ ] Trip with events in August 2026 → calendar opens on August 2026, not current month (T-128)
- [ ] Trip with no events → calendar falls back to current month (T-128)
- [ ] All 7 Playwright E2E tests continue to pass (Playwright 7/7)
- [ ] All Sprint 11 features (land travel, notes, TZ abbreviations, URL links, print) still operational

---

## Blockers

*Active blockers at Sprint 12 start.*

- **B-022 (Production Deployment — 10 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure (Docker Compose, nginx, HTTPS, CI/CD, deploy runbook) is complete. T-124 has produced a concrete recommendation. **Project owner action required before Sprint 13 can execute production deployment.**

---

*Previous sprint (Sprint #11) archived to `.workflow/sprint-log.md` on 2026-03-06. Sprint #12 begins 2026-03-06.*

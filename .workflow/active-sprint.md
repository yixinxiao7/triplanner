# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #14 — 2026-03-07

**Sprint Goal:** Fix the T-128 calendar first-event-month regression on staging (FB-095), add a "Today" button to the calendar (FB-094), rotate the staging JWT_SECRET placeholder (FB-093/security), and complete the long-overdue User Agent walkthrough that covers Sprint 12 + Sprint 13 + Sprint 14 features.

**Context:** Sprint 13 delivered all three implementation tasks (T-137, T-138, T-139) with zero rework and a clean deploy/monitor cycle. However, two User Agent walkthroughs (T-136 and T-144) never ran, and two feedback items were submitted by the project owner via manual testing (FB-094 "Today" button, FB-095 calendar default month bug). The calendar bug (FB-095) is a P1 regression — T-128 was approved in Sprint 12 but the calendar is not defaulting to the first event month on staging. The most likely cause is an async data-loading race condition where `getInitialMonth()` fires before the API response arrives. Sprint 14 fixes this, adds the "Today" button, rotates the JWT secret, and finally closes the User Agent pipeline.

**Feedback Triage (Sprint 13 Closeout):**

| FB Entry | Category | Severity | Sprint 14 Disposition | Task |
|----------|----------|----------|-----------------------|------|
| FB-093 | Monitor Alert | Major | Tasked — P1 | T-145 |
| FB-094 | Feature Gap | Minor | Tasked — P2 | T-147 |
| FB-095 | Bug | Major | Tasked — P1 | T-146 |

---

## In Scope

### Phase 0 — Security Fix (start immediately — P1; no dependencies)

- [ ] **T-145** — Deploy Engineer: Rotate JWT_SECRET in `backend/.env.staging` ← No dependencies — START IMMEDIATELY
  - `openssl rand -hex 32` → replace `JWT_SECRET` in `backend/.env.staging`
  - Do NOT commit `.env.staging` to git (already in `.gitignore`)
  - `pm2 restart triplanner-backend` to invalidate existing staging tokens
  - Verify `curl -sk https://localhost:3001/api/v1/health` → 200
  - Verify auth register → 201 with access token
  - Verify `backend/.env` unchanged
  - Log handoff to Manager in handoff-log.md (do NOT include the secret value)

---

### Phase 1 — Frontend Bug Fix + Feature (parallel — no cross-dependencies; start immediately alongside Phase 0)

- [ ] **T-146** — Frontend Engineer: Fix calendar first-event-month bug (FB-095) ← No dependencies — START IMMEDIATELY
  - Root cause investigation: `getInitialMonth()` likely fires before async API data arrives (TripCalendar receives empty arrays at first render)
  - Likely fix: add a `useEffect` that watches `[flights, stays, activities, landTravel]` props — when data first becomes non-empty, call `getInitialMonth()` and update `currentMonth` state, but only if the user has not manually navigated (track with a `hasNavigated` ref initialized to `false`, set to `true` on any prev/next click)
  - Preserve all T-128 static tests — the `getInitialMonth()` function itself is correct; only the initialization timing needs fixing
  - New tests: async-load scenario (empty → data arrives → calendar updates), no-reset when user navigated before data arrives

- [ ] **T-147** — Frontend Engineer: Add "Today" button to TripCalendar navigation (FB-094) ← No dependencies — START IMMEDIATELY
  - Add "Today" button to calendar header alongside existing prev/next arrows
  - On click: `setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))`
  - Minimal Japandi styling consistent with existing navigation buttons
  - `aria-label="Go to current month"`
  - 4 new tests: clicking Today returns to current month ✅, visible in past month ✅, visible in future month ✅, prev/next still works after clicking Today ✅

---

### Phase 2 — QA Review (after Phase 1 tasks complete; also verifies T-145 security result)

- [ ] **T-148** — QA Engineer: Security checklist + code review audit for T-145, T-146, T-147 ← T-145, T-146, T-147
  - T-145: confirm `backend/.env.staging` JWT_SECRET is not the placeholder value (read file, check value ≠ `CHANGE-ME-generate-with-openssl-rand-hex-32`)
  - T-146: async `useEffect` dependency array correct; `hasNavigated` ref logic correct; no memory leak; date parsing uses same safe patterns as T-128 (`isNaN` guards, local-time for dates, UTC for timestamps)
  - T-147: pure render + state, no security surface; `aria-label` present; no XSS
  - **NEW QA checklist item (add permanently):** `[x] No placeholder values remain in backend/.env.staging (JWT_SECRET is a real 32-byte hex secret)`
  - Full test suite: `npm test --run` in both `frontend/` and `backend/` — all pass
  - Report in qa-build-log.md Sprint 14 section

- [ ] **T-149** — QA Engineer: Integration testing for Sprint 14 changes ← T-148
  - Calendar default month: trip with future-month events → opens on that month; async load works; user-navigated-before-load does not reset month
  - "Today" button: navigate to future month → click Today → returns to current month; also works from past month
  - Sprint 13 regression: DayPopover stays open on scroll; rental car chips correct
  - Sprint 12 regression: check-in label, .env isolation
  - Sprint 11 regression: all features pass
  - Report in qa-build-log.md Sprint 14 section; handoff to Deploy (T-150)

---

### Phase 3 — Deploy, Monitor, User Agent (sequential; T-150 waits on T-149 AND T-145)

- [ ] **T-150** — Deploy Engineer: Sprint 14 staging re-deployment ← T-149, T-145
  - Rebuild frontend: `npm run build` in `frontend/`
  - No new backend migrations (no schema changes)
  - `pm2 restart triplanner-backend` — backend must be on `https://localhost:3001` with rotated JWT_SECRET
  - Do NOT modify `backend/.env`
  - Smoke tests: (a) future-month trip → calendar opens on correct month; (b) "Today" button visible; (c) click Today → current month; (d) Sprint 13 features intact
  - Log handoff to Monitor Agent in handoff-log.md
  - Report in qa-build-log.md Sprint 14 section

- [ ] **T-151** — Monitor Agent: Sprint 14 staging health check ← T-150
  - HTTPS ✅, pm2 online port 3001 ✅, /api/v1/health → 200 ✅
  - Calendar first-event-month: trip with future events → correct month ✅
  - "Today" button: visible ✅; clicking returns to current month ✅
  - JWT_SECRET: `backend/.env.staging` is not the placeholder ✅
  - `npx playwright test` → 7/7 PASS ✅
  - Sprint 13 + Sprint 12 regression checks pass ✅
  - Full report in qa-build-log.md Sprint 14 section; handoff to User Agent (T-152)

- [ ] **T-152** — User Agent: Sprint 14 comprehensive feature walkthrough ← T-151
  - **Calendar first-event-month (T-146):** Open trip with May events → calendar opens on May (not March). Navigate away and back. Open empty trip → current month.
  - **"Today" button (T-147):** Navigate to future month → "Today" button visible → click → returns to March 2026. Works from past month too.
  - **DayPopover stay-open (T-137, carry-over from T-144):** "+X more" → open → scroll → popover stays open and does not drift. Escape closes. Click-outside closes.
  - **Rental car chips (T-138, carry-over):** Pick-up day "pick-up Xp"; drop-off day "drop-off Xp".
  - **Sprint 12 regression (carry-over from T-136, 5th):** `.env` isolation ✅; check-in chip "check-in Xa" ✅; check-out "check-out Xa" ✅. (Note: DayPopover scroll = STAY OPEN per T-137 — NOT close-on-scroll.)
  - **Sprint 11 regression:** Land travel CRUD, notes, timezone abbreviations, URL links, print all operational.
  - Submit structured feedback to `feedback-log.md` under Sprint 14 header.
  - **This task closes T-136 (5th carry-over) and T-144 carry-over scope.**

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. T-124 produced `.workflow/hosting-research.md`; project owner must review and select a provider. 13 consecutive sprints with no decision. **Project owner action required.**
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
| Deploy Engineer | JWT_SECRET rotation + Sprint 14 staging re-deployment | T-145, T-150 |
| Frontend Engineer | Calendar default-month async fix + "Today" button | T-146, T-147 |
| QA Engineer | Security checklist + integration testing | T-148, T-149 |
| Monitor Agent | Sprint 14 health check | T-151 |
| User Agent | Comprehensive Sprint 12+13+14 walkthrough | T-152 |
| Manager | Triage T-152 feedback → Sprint 15 plan | Feedback triage |

---

## Dependency Chain (Critical Path)

```
Track A — Security (start immediately):
T-145 (Deploy: rotate JWT_SECRET)           ← START IMMEDIATELY
        │
        └→ [merges into T-150]

Track B — Frontend Fixes (parallel with Track A):
T-146 (Frontend: calendar async fix)        ← START IMMEDIATELY
T-147 (Frontend: "Today" button)            ← START IMMEDIATELY

[T-146, T-147 run in PARALLEL]
        │
        └→ T-148 (QA: Security checklist + code review)
                │
                └→ T-149 (QA: Integration testing)
                        │
                        └→ [merges with T-145 into T-150]

Merge Point:
[T-149 Done] + [T-145 Done]
        │
        └→ T-150 (Deploy: Sprint 14 staging re-deployment)
                │
                └→ T-151 (Monitor: Sprint 14 health check)
                        │
                        └→ T-152 (User Agent: comprehensive walkthrough)
                                │
                                └→ Manager: Triage feedback → Sprint 15 plan
```

---

## Definition of Done

*How do we know Sprint #14 is complete?*

- [ ] T-145: `backend/.env.staging` JWT_SECRET is a real 32-byte hex value; auth still works; `backend/.env` unchanged; pm2 restarted; handoff logged
- [ ] T-146: Calendar opens on first-event month even when data loads asynchronously; user navigation not overridden; all T-128 tests still pass; new async-load test passes
- [ ] T-147: "Today" button visible in calendar header; clicking it returns to current month; 4 new tests pass; all existing calendar tests pass
- [ ] T-148: Security checklist passes (including new placeholder-value check for .env.staging); all tests pass; T-145 JWT_SECRET rotation verified
- [ ] T-149: All Sprint 14 integration checks pass; Sprint 13 + Sprint 12 regression clean
- [ ] T-150: Frontend rebuilt; staging on https://localhost:3001 via pm2; smoke tests pass; `backend/.env` unchanged
- [ ] T-151: All Sprint 14 health checks pass; Playwright 7/7 ✅; JWT_SECRET confirmed rotated
- [ ] T-152: User Agent verifies calendar fix, "Today" button, DayPopover stay-open, rental car chips, Sprint 12 regression, Sprint 11 regression; feedback submitted and triaged
- [ ] T-136 and T-144 scope confirmed closed via T-152
- [ ] Sprint 14 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 15 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #14)

By end of Sprint #14, the following must be verifiable on HTTPS staging (`https://localhost:3001`):

- [ ] `backend/.env.staging` JWT_SECRET is a real secret (not the placeholder string)
- [ ] `backend/.env` contains local-dev settings (HTTP, port 3000, `secure: false`)
- [ ] Open a trip with all events in May 2026 → calendar opens on May 2026 (not March 2026)
- [ ] Open a trip with no events → calendar opens on current month (March 2026)
- [ ] "Today" button visible in TripCalendar header at all times
- [ ] Click "Today" from any month → calendar returns to current month (March 2026)
- [ ] All 7 Playwright E2E tests continue to pass (Playwright 7/7)
- [ ] All Sprint 13 features still operational (DayPopover stays open on scroll, rental car chips)
- [ ] All Sprint 12 features still operational (check-in label, .env isolation)
- [ ] All Sprint 11 features still operational (land travel, notes, TZ abbreviations, URL links, print)

---

## Blockers

- **B-022 (Production Deployment — 13 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete and production-ready. **Project owner action required before production deployment can execute.**

---

*Previous sprint (Sprint #13) archived to `.workflow/sprint-log.md` on 2026-03-07. Sprint #14 begins 2026-03-07.*

# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #33 — 2026-03-20

**Sprint Goal:** Fix the two Major calendar rendering bugs (FB-133/FB-134 — LAND_TRAVEL and FLIGHT events not spanning multiple days) and finally complete production verification (T-225 post-production health check + T-256 production walkthrough), which have been carried over since Sprint 30.

**Context:** Sprint 32 completed its staging pipeline cleanly — T-258 (stay category normalization) shipped, T-257 (API docs) updated, and User Agent walkthrough (T-262) returned 8 positive findings with zero issues. However, T-225 (post-production health check) and T-256 (production walkthrough) were not executed for the third consecutive sprint. Two Major bugs were identified: LAND_TRAVEL and FLIGHT calendar events render on a single day instead of spanning their full date range like STAY events do. These are frontend-only fixes in TripCalendar.jsx — the backend already returns all necessary date fields.

**Feedback Triage (Sprint 32 → Sprint 33):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-133 | Bug | Major | **Tasked → T-264** — Multi-day LAND_TRAVEL + FLIGHT calendar spanning |
| FB-134 | Bug | Major | **Tasked → T-264** — Same fix as FB-133 (combined task) |
| FB-135 | Feature Gap | Minor | **Acknowledged** — "+x more" click-to-scroll; backlog for future sprint |
| FB-136–FB-143 | Positive | — | **Acknowledged** — All positive confirmations |

---

## In Scope

### Phase 0 — Post-Production Verification (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-225** — Monitor Agent: Post-production health check ← **CARRY-OVER FROM SPRINT 30/31/32 — ZERO BLOCKERS — EXECUTE NOW**

  **Context:** Production is live at `https://triplanner.yixinx.com` (frontend) and `https://triplanner-backend-sp61.onrender.com` (backend). This task has been unblocked since Sprint 31 but has not been executed for three consecutive sprints. It MUST run now.

  **Execute the full production health check protocol:**
  1. `GET https://triplanner-backend-sp61.onrender.com/api/v1/health` → expect `{"status":"ok"}` 200
  2. CORS header → expect `Access-Control-Allow-Origin: https://triplanner.yixinx.com`
  3. Auth register with a new test user → 201
  4. Auth login → 200 with `access_token`
  5. `GET /api/v1/trips` → 200 (authenticated)
  6. `POST /api/v1/trips` + `GET /api/v1/trips/:id` → 201/200
  7. PATCH trip status → verify persisted on re-GET
  8. `GET /api/v1/trips/:id/calendar` → 200 with events array
  9. Verify no CORS errors, no 5xx in response
  10. Log full results in `qa-build-log.md` Sprint 33 section
  11. If all pass: set **Deploy Verified = Yes (Production)** in `qa-build-log.md`, update T-225 → Done in `dev-cycle-tracker.md`, log handoff to User Agent (T-256) in `handoff-log.md`

  **Acceptance criteria:**
  - All production API endpoints return expected status codes
  - Auth flow (register → login → authenticated request) works on production
  - CORS configured correctly for custom domain
  - Deploy Verified = Yes (Production) confirmed in qa-build-log.md

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-256** — User Agent: Production walkthrough on `https://triplanner.yixinx.com` ← Blocked by T-225

  **Scope:** Test the live production app as a real user would. This is the first User Agent walkthrough on production. Same scope as Sprint 32 plan — see Sprint 32 archived plan for full details.

  1. New user flow: Register → home page
  2. Trip creation: Create trip, add flight + stay + activity + land travel
  3. Verify all entries display correctly
  4. TripCalendar: all event types present on correct days
  5. Status change: PLANNING → ONGOING, reload, confirm persisted
  6. Mobile viewport check (375px)
  7. Notes + destinations functional
  8. Delete trip, confirm removed
  9. Logout, confirm redirect
  10. Submit structured feedback to `feedback-log.md`

  **Acceptance criteria:**
  - Full new-user flow works end-to-end on production
  - All event types display correctly in TripCalendar
  - No Critical or Major issues found on production
  - Structured feedback submitted to feedback-log.md

  **Files:** `feedback-log.md`, `handoff-log.md`

---

### Phase 1 — Design + Implementation (parallel with Phase 0)

- [ ] **T-263** — Design Agent: UI spec for multi-day event spanning in TripCalendar (FB-133, FB-134) ← No blockers

  **Context:** Currently STAY events span multiple days on the calendar (rendered as multi-day bars), but FLIGHT and LAND_TRAVEL events render on a single day only. The Design Agent must specify how multi-day FLIGHT and LAND_TRAVEL events should appear on the calendar.

  **Deliverables:**
  1. Add a section to `ui-spec.md` describing multi-day event rendering for FLIGHT and LAND_TRAVEL types:
     - How multi-day events span across calendar day cells (same as STAY pattern, or different?)
     - How arrival time is displayed on the arrival day (e.g., "Arrives 3:45 PM", "Drop-off 2:00 PM")
     - Visual treatment: color, pill style, text truncation for spanning events
     - Mobile view behavior for multi-day FLIGHT and LAND_TRAVEL
  2. Keep consistent with existing Japandi aesthetic (muted tones, IBM Plex Mono, no gradients)
  3. Reference existing STAY multi-day rendering as the baseline pattern

  **Acceptance criteria:**
  - UI spec section in `ui-spec.md` covers desktop and mobile multi-day rendering
  - Arrival time display format specified
  - Consistent with existing calendar design language

  **Files:** `.workflow/ui-spec.md`

---

- [ ] **T-264** — Frontend Engineer: Multi-day event spanning for FLIGHT and LAND_TRAVEL in TripCalendar (FB-133, FB-134) ← Blocked by T-263

  **Context:** Two Major calendar rendering bugs. FLIGHT and LAND_TRAVEL events currently render on a single day. They should span from departure date to arrival date, matching the multi-day rendering pattern used by STAY events. The backend already returns all necessary date fields (`departure_date`/`arrival_date` for land travel; `departure_at`/`arrival_at` timestamps for flights).

  **Implementation:**
  1. In `TripCalendar.jsx` (or related calendar rendering logic), update the event placement algorithm to:
     - For FLIGHT events: span from the date portion of `departure_at` to the date portion of `arrival_at`
     - For LAND_TRAVEL events: span from `departure_date` to `arrival_date`
  2. On the arrival day, display the arrival time (e.g., "Arrives 3:45 PM" for flights, "Arrives 10:30 AM" or "Drop-off 2:00 PM" for land travel)
  3. Follow the UI spec from T-263 for visual treatment
  4. Add frontend unit tests:
     - (a) FLIGHT event spanning 2 days renders on both days
     - (b) LAND_TRAVEL event spanning 3 days renders on all 3 days
     - (c) Arrival time displayed on arrival day
     - (d) Single-day FLIGHT (departure and arrival same day) still renders correctly
  5. All 496+ existing frontend tests must pass
  6. Log in handoff-log.md; set In Review

  **Acceptance criteria:**
  1. Multi-day FLIGHT events span from departure date to arrival date on calendar
  2. Multi-day LAND_TRAVEL events span from departure date to arrival date on calendar
  3. Arrival time displayed on arrival day for both event types
  4. Single-day events (same departure/arrival date) still render correctly
  5. 4+ new tests; 496+ existing tests still pass
  6. Mobile view works correctly for spanning events

  **Files:** `frontend/src/components/TripCalendar.jsx`, `frontend/src/components/TripCalendar.module.css`, frontend test files

---

### Phase 2 — QA, Deploy, Monitor, User Agent (sequential after Phase 1)

- [ ] **T-265** — QA Engineer: Security checklist + integration testing for Sprint 33 ← Blocked by T-264

  **Scope:**
  - Security checklist for T-264 (multi-day event rendering): no XSS vectors in time display rendering; no data leaks
  - Code review: T-264 implementation follows UI spec from T-263
  - Verify all frontend tests pass (496+ base + T-264 new tests)
  - Integration check: Create trip with multi-day flight → calendar shows event spanning correct days; create trip with multi-day land travel → same; single-day events unaffected
  - Verify all backend tests still pass (410/410)
  - Log results in `qa-build-log.md` Sprint 33 section

  **Acceptance criteria:**
  - Security checklist PASS
  - All tests pass (410 backend + 496+ frontend + 4 Playwright)
  - Integration scenarios verified

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`

---

- [ ] **T-266** — Deploy Engineer: Sprint 33 staging deployment ← Blocked by T-265

  - Rebuild frontend (`npm run build` in frontend/) — T-264 is a frontend change
  - `pm2 restart triplanner-frontend` (or appropriate restart command)
  - Verify frontend loads at `https://localhost:4173`
  - Smoke test: Navigate to trip with multi-day flight → calendar shows spanning event
  - Log in `qa-build-log.md`

---

- [ ] **T-267** — Monitor Agent: Sprint 33 staging health check ← Blocked by T-266

  Full health check protocol:
  - GET `/api/v1/health` → 200
  - CORS header → `Access-Control-Allow-Origin: https://localhost:4173`
  - Auth login with `test@triplanner.local` → 200
  - Sprint 33 smoke: Create trip with multi-day flight → GET /calendar → FLIGHT event has different start_date and end_date
  - Sprint 32 regressions: POST /stays with lowercase category → 201; trip status persistence; all 4 event types in calendar
  - `npx playwright test` → 4/4 PASS
  - Log results in `qa-build-log.md` Sprint 33 section
  - If all pass: mark **Deploy Verified = Yes (Staging)**, handoff to User Agent (T-268)

---

- [ ] **T-268** — User Agent: Sprint 33 staging feature walkthrough ← Blocked by T-267

  **Scope:**
  1. **Multi-day FLIGHT rendering (FB-134/T-264):** Create a trip with an overnight flight (departure date ≠ arrival date). Verify calendar shows the flight spanning both days. Verify arrival time displayed on arrival day.
  2. **Multi-day LAND_TRAVEL rendering (FB-133/T-264):** Create a trip with a multi-day rental car or train. Verify calendar shows the event spanning all days. Verify drop-off/arrival time on last day.
  3. **Single-day events:** Verify single-day flights and land travel still render correctly (no regression).
  4. **Sprint 32 regressions:** Stay category normalization, status persistence, all 4 event types in calendar.
  5. Submit structured feedback to `feedback-log.md` under "Sprint 33 User Agent Feedback — T-268 Staging Walkthrough".

---

## Out of Scope

- **T-225/T-256 production feedback-driven changes** — If production walkthrough reveals issues, those will be triaged into Sprint 34 (unless Critical, which triggers a hotfix).
- **FB-135 ("+x more" click-to-scroll)** — Minor feature gap, backlog for a future sprint.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-032 (trip export/print)** — Deferred.
- **New major features** — App is in production; focus remains stabilization and polish.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Monitor Agent | Post-production health check (P0 carry-over); staging health check | T-225, T-267 |
| User Agent | Production walkthrough; staging walkthrough | T-256, T-268 |
| Design Agent | UI spec for multi-day calendar event rendering | T-263 |
| Frontend Engineer | Multi-day FLIGHT + LAND_TRAVEL calendar spanning | T-264 |
| QA Engineer | Security checklist + integration check for T-264 | T-265 |
| Deploy Engineer | Staging deployment with T-264 frontend change | T-266 |
| Backend Engineer | No tasks this sprint (no backend changes needed) | — |
| Manager | Triage T-256 feedback; code review T-264; Sprint 34 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
Phase 0 (IMMEDIATE — NO BLOCKERS):
T-225 (Monitor: Post-production health check)
    |
T-256 (User Agent: Production walkthrough)
    |
Manager: Triage T-256 feedback (if Critical/Major → hotfix takes priority)

Phase 1 (parallel with Phase 0 — no blockers on T-263):
T-263 (Design: UI spec for multi-day calendar events) ← no blockers
    |
T-264 (Frontend: Multi-day event spanning implementation)
    |
T-265 (QA: Security checklist + integration check)
    |
T-266 (Deploy: Staging deployment)
    |
T-267 (Monitor: Staging health check → Deploy Verified = Yes)
    |
T-268 (User Agent: Sprint 33 staging walkthrough)
    |
Manager: Triage feedback → Sprint 34 plan
```

---

## Definition of Done

*How do we know Sprint #33 is complete?*

- [ ] T-225: Monitor Agent post-production health check complete — Deploy Verified = Yes (Production)
- [ ] T-256: User Agent production walkthrough complete — no Critical or Major issues; feedback submitted
- [ ] T-256 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] T-263: UI spec for multi-day event rendering written in ui-spec.md
- [ ] T-264: Multi-day FLIGHT and LAND_TRAVEL calendar rendering implemented; 4+ new tests; 496+ existing tests pass
- [ ] T-265: QA security checklist PASS; all tests passing
- [ ] T-266: Staging re-deployed with T-264 change; frontend rebuilt and serving
- [ ] T-267: Monitor confirms Deploy Verified = Yes (Staging); Playwright 4/4 still passing
- [ ] T-268: User Agent staging walkthrough complete; feedback submitted
- [ ] T-268 feedback triaged by Manager
- [ ] Sprint 33 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 34 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #33)

By end of Sprint #33, the following must be verifiable:

- [ ] **Production verified** — T-225 confirms all production API endpoints healthy; CORS correct for custom domain
- [ ] **Production user walkthrough clean** — T-256 confirms full user flow works on `https://triplanner.yixinx.com`
- [ ] **Multi-day calendar events fixed** — FLIGHT and LAND_TRAVEL events span their full date range on the calendar, matching STAY rendering pattern
- [ ] **Arrival times displayed** — Calendar shows arrival time on the arrival day for flights and land travel
- [ ] **Staging regression-free** — Sprint 32 features (stay category normalization, status persistence, all 4 event types) all still passing

---

## Blockers

- **No blockers on T-225.** Production is live. Monitor Agent must execute T-225 immediately. This is the fourth sprint carrying this task — no further delays.
- **T-256 blocked by T-225.** User Agent production walkthrough cannot start until Monitor Agent confirms production is healthy.
- **T-264 blocked by T-263.** Frontend implementation cannot start without UI spec (per rules.md).
- **T-265 blocked by T-264.** QA cannot run until multi-day rendering implementation is complete.

---

*Sprint #32 archived to `.workflow/sprint-log.md` on 2026-03-20. Sprint #33 plan written by Manager Agent 2026-03-20.*

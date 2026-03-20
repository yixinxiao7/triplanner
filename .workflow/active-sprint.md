# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #31 — 2026-03-17

**Sprint Goal:** Close the Sprint 30 User Agent verification cycle (T-248), then ship two targeted backlog improvements: fix the missing `.mobileEventLandTravel` mobile styling in TripCalendar and fix the `knexfile.js` staging seeds configuration gap. Full QA → Deploy → Monitor → User Agent pipeline to follow. Production deployment carries over (sixth escalation — project owner action required).

**Context:** Sprint 30 delivered all three Sprint 30 commitments (trip status persistence, flight timezone fix, LAND_TRAVEL calendar). Staging is verified healthy (Deploy Verified = Yes, 402/402 backend, 495/495 frontend, 4/4 Playwright). The sole carry-over is T-248 (User Agent Sprint 30 walkthrough) which has zero blockers and must run immediately. No Critical or Major bugs are known entering Sprint 31. The two backlog items being promoted (mobile LAND_TRAVEL styling, knexfile seeds) are both Minor and do not block the T-248 cycle.

**Feedback Triage (Sprint 30 → Sprint 31):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| (No new 'New' entries in feedback-log.md) | — | — | — | All prior entries triaged. T-248 Sprint 30 User Agent feedback will surface in Sprint 31. |
| Monitor note: `.mobileEventLandTravel` CSS missing | Minor | Minor | **Tasked → T-249** | Mobile LAND_TRAVEL rows functional but unstyled in TripCalendar |
| Monitor note: knexfile.js staging seeds | Minor | Minor | **Tasked → T-250** | `seeds: { directory: seedsDir }` missing from staging block; workaround works |

---

## In Scope

### Phase 0 — User Agent Sprint 30 Walkthrough (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-248** — User Agent: Sprint 30 feature walkthrough ← **CARRY-OVER FROM SPRINT 30 — ZERO BLOCKERS**

  **Scope:** Verify all three Sprint 30 fixes end-to-end from a user perspective:
  1. **Trip status flow:** Change trip status PLANNING → ONGOING → COMPLETED using TripStatusSelector on TripDetailsPage. After each change, reload the page and confirm the new status is displayed (not reverting). Navigate to Home — confirm TripCard reflects updated status.
  2. **Flight timezone:** Add a flight with a departure time (e.g., `6:50 AM ET`). Navigate to trip details. Confirm flight card displays the correct local time (not shifted ~4 hours). Add a second flight and confirm both times display correctly.
  3. **Land travel in calendar:** Add a land travel entry to a trip. Open TripCalendar — confirm a LAND_TRAVEL pill appears on the correct day with departure and arrival times visible. Click the pill — confirm page scrolls to the land travels section.
  4. **Regressions:** Confirm T-229 COALESCE date fix (PATCH dates → correct dates returned), CORS health check, Playwright 4/4 still passing, trip notes, destination chips all still functional.
  5. Submit structured feedback to `feedback-log.md` under "Sprint 31 User Agent Feedback — T-248 Sprint 30 Verification".

  **Acceptance criteria:**
  - All 3 Sprint 30 features verified working from user perspective
  - No Critical or Major regressions found
  - Structured feedback submitted to feedback-log.md
  - Handoff to Manager logged in handoff-log.md

  **Files:** feedback-log.md, handoff-log.md

---

### Phase 1 — Minor Backlog Fixes (P2 — parallel with Phase 0 or after T-248 triage confirms no Critical/Major bugs)

- [ ] **T-249** — Frontend Engineer: Add `.mobileEventLandTravel` CSS styling to TripCalendar.module.css (Sprint 30 Monitor note)

  **Context:** The Manager approved T-243 with a noted minor gap — `.mobileEventLandTravel` is referenced in the TripCalendar component but the CSS class does not exist in `TripCalendar.module.css`. On desktop, LAND_TRAVEL pills render with the correct `.eventPillLandTravel` class. On mobile (MobileDayList), LAND_TRAVEL rows render functionally but without a color accent, appearing unstyled compared to FLIGHT, STAY, and ACTIVITY rows.

  **Implementation:**
  1. In `frontend/src/components/TripCalendar.module.css`, add a `.mobileEventLandTravel` class with the same muted, Japandi-appropriate color treatment used for the desktop LAND_TRAVEL pill (`.eventPillLandTravel`). Reference the existing mobile event classes (`.mobileEventFlight`, `.mobileEventStay`, etc.) for layout consistency.
  2. Confirm the class is applied in `TripCalendar.jsx` `MobileDayList` at the LAND_TRAVEL branch.
  3. Add 1 unit test: LAND_TRAVEL event in `MobileDayList` renders with `mobileEventLandTravel` class.

  **Acceptance criteria:**
  1. On mobile (375px viewport), LAND_TRAVEL rows in MobileDayList display with a distinct muted color consistent with Japandi palette and other mobile event type rows
  2. No regressions on FLIGHT, STAY, ACTIVITY mobile rows
  3. 1+ new test confirming the CSS class is applied; 495+ existing tests still pass
  4. Log in handoff-log.md; set In Review

  **Files:** `frontend/src/components/TripCalendar.module.css`, `frontend/src/components/TripCalendar.jsx`, `frontend/src/__tests__/TripCalendar.test.jsx`

---

- [ ] **T-250** — Backend Engineer: Fix knexfile.js staging seeds configuration gap (Sprint 26 Monitor note)

  **Context:** The Monitor Agent (Sprint 26) noted that `backend/src/config/knexfile.js` staging environment block is missing `seeds: { directory: seedsDir }`. Running `NODE_ENV=staging npm run seed` fails with ENOENT because the staging block has no seeds directory configured. The development block has `seeds: { directory: seedsDir }` and works correctly via the current workaround (`NODE_ENV=development npm run seed`).

  **Implementation:**
  1. In `backend/src/config/knexfile.js`, add `seeds: { directory: seedsDir }` to the `staging` environment block, matching the pattern used in the `development` block.
  2. Confirm `seedsDir` is already computed at the top of the file (it is — shared across environments).
  3. Add 1 unit test: staging knex config object includes `seeds.directory` equal to `seedsDir`.
  4. Verify `NODE_ENV=staging npm run seed` would resolve correctly (no ENOENT on seeds directory).

  **Acceptance criteria:**
  1. `knexfile.staging.seeds.directory === seedsDir` in the exported config object
  2. 1+ new test covering the staging seeds config path
  3. All 402+ existing backend tests still pass
  4. Log in handoff-log.md; set In Review

  **Files:** `backend/src/config/knexfile.js`, backend test file

---

### Phase 2 — QA, Deploy, Monitor, User Agent (sequential after Phase 1 complete and T-248 feedback triaged)

- [ ] **T-251** — QA Engineer: Security checklist + code review (Sprint 31) ← Blocked by T-249, T-250

  **Scope:**
  - Security checklist (all items from `.workflow/security-checklist.md`)
  - Code review: T-249 (mobileEventLandTravel CSS) and T-250 (knexfile seeds fix)
  - Verify all backend + frontend tests pass (402+ backend, 495+ frontend)
  - Regression check: TripCalendar LAND_TRAVEL desktop pills unaffected by CSS addition; staging seeds config does not affect production or development blocks
  - Log results in `qa-build-log.md` Sprint 31 section

---

- [ ] **T-252** — QA Engineer: Integration testing (Sprint 31) ← Blocked by T-251

  **Test scenarios (minimum):**
  1. `knexfile.js` staging block has `seeds.directory` = correct path
  2. `TripCalendar` mobile LAND_TRAVEL row renders with `.mobileEventLandTravel` class
  3. Desktop LAND_TRAVEL pill still renders correctly (no regression from CSS change)
  4. Regression: T-238 status PATCH round-trip still PASS
  5. Regression: T-242 GET /calendar returns LAND_TRAVEL events
  6. Regression: Playwright 4/4 still pass after build with new CSS

---

- [ ] **T-253** — Deploy Engineer: Sprint 31 staging re-deployment ← Blocked by T-252

  - Rebuild frontend (`npm run build`) — picks up T-249 CSS change
  - pm2 reload both services
  - Verify `GET /api/v1/health` → 200
  - Smoke test: mobile viewport shows LAND_TRAVEL row with color accent (visual check)
  - Log in `qa-build-log.md`

---

- [ ] **T-254** — Monitor Agent: Sprint 31 staging health check ← Blocked by T-253

  Full health check protocol:
  - GET `/api/v1/health` → 200 ✅
  - CORS header → `Access-Control-Allow-Origin: https://localhost:4173` ✅
  - Auth login with `test@triplanner.local` → 200 ✅
  - GET `/api/v1/trips` → 200 ✅
  - Sprint 30 regression: PATCH trip status → persisted ✅
  - Sprint 30 regression: GET /calendar → LAND_TRAVEL event present ✅
  - `npx playwright test` → 4/4 PASS ✅
  - Log results in `qa-build-log.md` Sprint 31 section
  - If all pass: mark **Deploy Verified = Yes**, handoff to User Agent (T-255)

---

- [ ] **T-255** — User Agent: Sprint 31 feature walkthrough ← Blocked by T-254

  **Scope:**
  1. **Mobile LAND_TRAVEL styling (T-249):** On a mobile-width viewport, add a land travel entry to a trip, open TripCalendar — confirm LAND_TRAVEL row in MobileDayList has a visible color accent distinct from the unstyled state.
  2. **Regressions:** Confirm Sprint 30 features (status persistence, flight timezone, desktop LAND_TRAVEL pills) all still working.
  3. Submit structured feedback to `feedback-log.md` under "Sprint 31 User Agent Feedback — T-255".

---

### Phase 3 — Production Deployment ✅ COMPLETE

> **Production is live at `https://triplanner.yixinx.com`** (deployed 2026-03-20 by project owner).
> - Frontend: `https://triplanner.yixinx.com` (Render static site, custom domain)
> - Backend: `https://triplanner-backend-sp61.onrender.com` (Render web service)

- [x] **T-224** — Deploy Engineer: Production deployment to Render + AWS RDS ✅ Deployed by project owner
- [ ] **T-225** — Monitor Agent: Post-production health check ← Ready to run

---

## Out of Scope

- **New features** — Focus is on closing T-248 and shipping two minor backlog improvements. No new features until Sprint 31 pipeline completes and T-248 feedback is triaged.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **FB-121 (stay category case normalization)** — Minor UX; backlog.
- **MFA, home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | Sprint 30 walkthrough (T-248, P0 carry-over) | T-248, T-255 |
| Frontend Engineer | Add `.mobileEventLandTravel` mobile styling | T-249 |
| Backend Engineer | Fix knexfile.js staging seeds config | T-250 |
| QA Engineer | Security checklist + integration testing | T-251, T-252 |
| Deploy Engineer | Sprint 31 staging re-deployment; production (if T-224 unblocked) | T-253, T-224 |
| Monitor Agent | Sprint 31 staging health check; post-production (if T-224 done) | T-254, T-225 |
| Design Agent | No tasks this sprint (all fixes are minor non-visual) | — |
| Manager | Triage T-248 feedback → approve T-249/T-250; code review; Sprint 32 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
Phase 0 (IMMEDIATE — NO BLOCKERS):
T-248 (User Agent: Sprint 30 walkthrough)
    |
Manager: Triage T-248 feedback (if Critical/Major → hotfix takes priority)

Phase 1 (parallel with T-248 or immediately after clean triage):
T-249 (Frontend: mobileEventLandTravel CSS)
T-250 (Backend: knexfile seeds fix)
    |
T-251 (QA: Security checklist + code review — all T-249/T-250 done)
    |
T-252 (QA: Integration testing)
    |
T-253 (Deploy: Staging re-deployment)
    |
T-254 (Monitor: Health check → Deploy Verified = Yes)
    |
T-255 (User Agent: Sprint 31 walkthrough)
    |
Manager: Triage feedback → Sprint 32 plan

Phase 3 (PROJECT OWNER GATE — parallel with all phases — 6th escalation):
[Project owner provides AWS RDS + Render credentials]
    |
T-224 (Deploy: Production deployment)
    |
T-225 (Monitor: Post-production health check)
```

---

## Definition of Done

*How do we know Sprint #31 is complete?*

- [ ] T-248: User Agent Sprint 30 walkthrough complete — all 3 Sprint 30 fixes verified end-to-end from user perspective
- [ ] T-248 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] T-249: `.mobileEventLandTravel` CSS added; mobile LAND_TRAVEL row styled; 1+ new test; no regressions
- [ ] T-250: `knexfile.js` staging seeds config fixed; 1+ new test; no regressions
- [ ] T-251: QA security checklist PASS; all backend + frontend tests passing
- [ ] T-252: All integration scenarios PASS
- [ ] T-253: Staging re-deployed; both services online
- [ ] T-254: Monitor confirms Deploy Verified = Yes; Playwright 4/4 still passing
- [ ] T-255: User Agent confirms mobile LAND_TRAVEL styling and Sprint 30 regressions clean
- [ ] T-255 feedback triaged by Manager
- [ ] Sprint 31 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 32 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #31)

By end of Sprint #31, the following must be verifiable:

- [ ] **T-248 sign-off** — User Agent confirms all Sprint 30 fixes working from user perspective — no Critical or Major regressions
- [ ] **Mobile LAND_TRAVEL styling live** — LAND_TRAVEL rows in MobileDayList have consistent color accent on mobile viewports
- [ ] **Knexfile seeds config fixed** — `NODE_ENV=staging npm run seed` resolves without ENOENT (seeds directory present)
- [ ] **Regression-free** — Sprint 30 features (status, timezone, LAND_TRAVEL desktop) all still passing
- [ ] **Deploy Verified = Yes** — T-254 confirms all health checks passing after Sprint 31 deploy

---

## Blockers

- **T-224 is DONE** — Production deployed by project owner at `https://triplanner.yixinx.com` (2026-03-20). T-225 (post-production health check) is now unblocked and ready to run.
- **T-249 and T-250 should not start until T-248 feedback is triaged.** If T-248 reveals a Critical or Major bug, hotfix tasks (H-XXX) take P0 priority over all other Sprint 31 work.
- No blockers on T-248 itself. Staging is verified healthy. User Agent must start immediately.

---

*Sprint #30 archived to `.workflow/sprint-log.md` on 2026-03-17. Sprint #31 plan written by Manager Agent 2026-03-17.*

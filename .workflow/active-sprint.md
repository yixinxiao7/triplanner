# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #22 — 2026-03-10

**Sprint Goal:** Execute the full Sprint 21 carry-over pipeline. Close T-194 (User Agent Sprint 20 walkthrough — P0, 2nd carry-over, zero blockers) and T-195 (Design: Spec 20 trip status selector) in parallel immediately. Then deliver the trip status selector (T-196): an inline status badge on TripDetailsPage that lets users change PLANNING → ONGOING → COMPLETED without a page reload. Complete the full QA → Deploy → Monitor → User Agent pipeline (T-197 through T-201).

**Context:** Sprint 21 was a planning-only sprint (0/8 tasks executed — identical to Sprint 18). All 8 tasks carry forward unchanged. Staging is verified healthy from T-193 (Sprint 20 Monitor). No new migrations are required — the `status` column on `trips` has existed since Sprint 1. T-194 has zero blockers and must start immediately. No new feature scope is added this sprint — the carry-over pipeline must close first. Test baseline: 304/304 backend | 429/429 frontend.

**Feedback Triage (Sprint 21 → Sprint 22):**

*No new Sprint 20 or Sprint 21 feedback — T-194 User Agent walkthrough did not run in either sprint. No new "Tasked" entries to carry forward.*

| FB Entry | Category | Severity | Disposition | Description |
|----------|----------|----------|-------------|-------------|
| (none) | — | — | — | No new Sprint 20 or Sprint 21 feedback — T-194 User Agent did not run in Sprints 20 or 21 |

---

## In Scope

### Phase 1 — User Agent Carry-Over + Design Spec (parallel, NO BLOCKERS — start immediately)

- [ ] **T-194** — User Agent: Sprint 20 feature walkthrough ← **NO DEPENDENCIES — START IMMEDIATELY** (P0) ⚠️ 2nd carry-over
  - Run against existing staging (https://localhost:3001 / https://localhost:4173) — T-193 confirmed staging is healthy
  - Trip notes flow: empty placeholder → click "Edit notes" → type → char count updates → Save → note displays ✅
  - Trip notes clear: edit → clear all text → Save → placeholder returns ✅
  - Trip notes max length: textarea stops at 2000 chars ✅
  - Destination validation (T-186): direct API call with 101-char destination → 400 human-friendly message ✅
  - Destination validation (T-186): PATCH `destinations:[]` → 400 "At least one destination is required" ✅
  - Sprint 19 regression: rate limiting, multi-destination chip UI, trip card truncation all functional ✅
  - Sprint 17 regression: print button visible ✅
  - Submit structured feedback to `feedback-log.md` under **"Sprint 22 User Agent Feedback"** header
  - Manager triages feedback immediately after T-194 completes before T-196 starts

- [ ] **T-195** — Design Agent: Trip status selector spec (Spec 20) ← **NO DEPENDENCIES — START IMMEDIATELY** (P2) ⚠️ 2nd carry-over
  - Publish to `ui-spec.md` as Spec 20
  - **Location:** TripDetailsPage — trip header area, inline with or immediately below the trip name. Status is prominent but not dominant.
  - **Display (view mode):** A styled badge/chip showing the current status (PLANNING | ONGOING | COMPLETED). Use distinct muted colors consistent with the Japandi palette.
  - **Interaction:** Clicking the status badge opens a compact dropdown/select (or segmented control) with the three status options. Selecting a new status immediately calls PATCH /api/v1/trips/:id `{ status: "ONGOING" }` (optimistic update or loading state acceptable). On success, badge updates to new status. On failure, revert with generic error.
  - **Accessibility:** `aria-label="Trip status"` on the control. Selected option announced via `aria-selected` or equivalent. Keyboard navigable (Space/Enter to open, arrow keys to navigate, Escape to close).
  - **Styling:** Japandi aesthetic — IBM Plex Mono, palette colors. PLANNING = neutral, ONGOING = slightly warm/active, COMPLETED = muted/faded.
  - **TripCard sync:** After status change on TripDetailsPage, the Home page TripCard should reflect the new status on next load (standard re-fetch; no real-time sync required).
  - Log Manager approval handoff in `handoff-log.md` before T-196 begins

---

### Phase 2 — Frontend Status Selector (after T-195 approved + T-194 feedback triaged)

- [ ] **T-196** — Frontend Engineer: Trip status selector component ← Blocked by T-195 (P2) ⚠️ 2nd carry-over
  - New component: `frontend/src/components/TripStatusSelector.jsx`
  - Integrate into `TripDetailsPage.jsx` in the trip header area (below trip name, above destinations)
  - **Props:** `tripId`, `initialStatus`, `onStatusChange` callback
  - **States:** view (badge), loading (brief spinner or opacity change), error (generic toast/message, revert to previous status)
  - Status options: `PLANNING`, `ONGOING`, `COMPLETED` (enum matches backend `trip_status` type)
  - On status change: call `api.trips.update(tripId, { status: newStatus })`. On success: call `onStatusChange(newStatus)`. On error: revert.
  - Keyboard: dropdown/select must be keyboard-navigable; Escape closes without change
  - Accessibility per Spec 20: `aria-label="Trip status"`, selected state indicated
  - Tests (in `TripStatusSelector.test.jsx`):
    - (A) Renders current status badge in view mode
    - (B) All three status options accessible in the selector
    - (C) Selecting a new status calls `api.trips.update` with correct payload
    - (D) On successful save, `onStatusChange` is called with new status
    - (E) On API failure, status reverts to previous value
    - (F) Keyboard navigation: can select status without mouse
    - (G) Loading state shown while API call in flight
  - All 429+ existing frontend tests must pass

---

### Phase 3 — QA Review (after T-196 complete)

- [ ] **T-197** — QA Engineer: Security checklist + code review for Sprint 22 ← Blocked by T-196 (P1)
  - **T-196 security:** Status value sent to API validated against enum — no arbitrary string injection ✅
  - **T-196 security:** No `dangerouslySetInnerHTML` — status badge rendered as text ✅
  - **T-196 security:** Error message generic — no API response details leaked to UI ✅
  - Run `npm test --run` in `backend/` (304+ base — no new backend tests expected)
  - Run `npm test --run` in `frontend/` (429+ base + T-196 new tests)
  - Run `npm audit` — flag any new Critical/High findings
  - Full report in qa-build-log.md Sprint 22 section

- [ ] **T-198** — QA Engineer: Integration testing for Sprint 22 ← Blocked by T-197 (P1)
  - TripDetailsPage: status badge renders with correct initial status ✅
  - TripDetailsPage: changing status → PATCH /api/v1/trips/:id called with `{ status: "ONGOING" }` ✅
  - TripDetailsPage: after status change, badge updates to new status ✅
  - TripDetailsPage: invalid status (direct API call with `status: "INVALID"`) → 400 VALIDATION_ERROR ✅
  - Home page: after status change on TripDetailsPage, navigate to Home → TripCard shows updated status ✅
  - Sprint 20 regression: notes feature functional (edit/save/clear) ✅
  - Sprint 19 regression: rate limit headers on /auth/login ✅
  - Sprint 17 regression: Print button visible ✅
  - Sprint 16 regression: start_date/end_date on trips ✅
  - Full report in qa-build-log.md. Handoff to Deploy (T-199).

---

### Phase 4 — Deploy, Monitor, User Agent (sequential after Phase 3)

- [ ] **T-199** — Deploy Engineer: Sprint 22 staging re-deployment ← Blocked by T-198 (P1)
  - Pre-deploy gate: T-198 Done
  - No new migrations required (status column exists from Sprint 1)
  - `npm run build` in `frontend/` → 0 errors → `pm2 reload triplanner-frontend`
  - `pm2 restart triplanner-backend` → verify online
  - Smoke tests: GET /health → 200 ✅; TripDetailsPage renders status badge ✅; PATCH /trips/:id with `{status:"COMPLETED"}` → 200 ✅; Sprint 20 notes feature ✅; Sprint 19 rate limit regression ✅; Sprint 17 print regression ✅
  - Log handoff to Monitor (T-200) in handoff-log.md

- [ ] **T-200** — Monitor Agent: Sprint 22 staging health check ← Blocked by T-199 (P1)
  - HTTPS ✅, pm2 port 3001 ✅, health 200 ✅
  - Sprint 22: PATCH /trips/:id with `{status:"ONGOING"}` → 200, status updated ✅
  - Sprint 22: TripDetailsPage includes `TripStatusSelector` component visible ✅
  - Sprint 20 regression: GET /trips/:id includes `notes` key ✅
  - Sprint 19 regression: RateLimit-Limit header on /auth/login ✅
  - Sprint 17 regression: Print itinerary button visible ✅
  - Sprint 16 regression: trips include start_date/end_date ✅
  - `npx playwright test` → 7/7 PASS ✅
  - Full report in qa-build-log.md. Handoff to User Agent (T-201).

- [ ] **T-201** — User Agent: Sprint 22 feature walkthrough ← Blocked by T-200 (P2)
  - Status selector — view: TripDetailsPage shows current trip status as a styled badge ✅
  - Status selector — change: click badge → select ONGOING → status updates to ONGOING ✅
  - Status selector — change: change ONGOING → COMPLETED → status updates ✅
  - Status selector — keyboard: open selector with keyboard, change status without mouse ✅
  - Status selector — Home page sync: after changing status, go to Home → TripCard reflects new status ✅
  - Sprint 20 regression: notes feature (edit/save/clear) ✅
  - Sprint 19 regression: multi-destination chip, rate limiting ✅
  - Sprint 17 regression: print button ✅
  - Submit structured feedback to `feedback-log.md` under **"Sprint 23 User Agent Feedback"** header

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. **22 consecutive sprints with no decision. Project owner action required.** All infrastructure is complete and production-ready.
- **B-021 (esbuild dev dep vulnerability)** — No production impact. Monitor for upstream vitest patch.
- **B-024 (per-account rate limiting)** — IP-based sufficient at current scale.
- **Redis for rate limiting** — In-memory store sufficient at current scale.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.
- **Backend changes for status** — PATCH /api/v1/trips/:id already supports `status` field per Sprint 1 API contract. No migration or model changes needed.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | Sprint 20 carry-over walkthrough (immediate, no blockers — **2nd attempt**) | T-194 |
| Design Agent | Trip status selector spec (Spec 20) | T-195 |
| Frontend Engineer | TripStatusSelector component | T-196 |
| QA Engineer | Security checklist + integration testing | T-197, T-198 |
| Deploy Engineer | Sprint 22 staging re-deployment | T-199 |
| Monitor Agent | Sprint 22 staging health check | T-200 |
| User Agent | Sprint 22 feature walkthrough | T-201 |
| Manager | T-194 feedback triage → T-196 gate | Code review + triage |

---

## Dependency Chain (Critical Path)

```
Phase 1 — Parallel (start immediately, no blockers):
T-194 (User Agent: Sprint 20 carry-over walkthrough on existing staging) ← P0 ⚠️ 2nd attempt
    |
    └── Manager triages T-194 feedback (confirms no blockers for T-196)

T-195 (Design: Spec 20 — trip status selector) ← P2 ⚠️ 2nd attempt
    |
    └── Manager approves Spec 20

Phase 2 (after T-195 approved + T-194 feedback clean):
T-196 (Frontend: TripStatusSelector component)
    |
Phase 3:
T-197 (QA: security checklist + code review)
    |
T-198 (QA: integration testing)
    |
Phase 4:
T-199 (Deploy: frontend rebuild + pm2 reload)
    |
T-200 (Monitor: health check)
    |
T-201 (User Agent: Sprint 22 walkthrough)
    |
Manager: Triage feedback → Sprint 23 plan
```

---

## Definition of Done

*How do we know Sprint #22 is complete?*

- [ ] T-194: User Agent Sprint 20 walkthrough complete; trip notes + destination validation verified; structured feedback submitted to feedback-log.md
- [ ] T-195: Spec 20 published to ui-spec.md; Manager-approved; T-196 unblocked
- [ ] T-196: TripStatusSelector live on TripDetailsPage; view/change/revert/loading/error states working per Spec 20; keyboard accessible; all 429+ frontend tests pass
- [ ] T-197: QA security checklist passed for Sprint 22 changes; no new Critical/High audit findings
- [ ] T-198: QA integration testing passed; status CRUD verified; regressions clean
- [ ] T-199: Frontend rebuilt and re-deployed; smoke tests pass
- [ ] T-200: Monitor confirms all Sprint 22 health checks pass; Playwright 7/7 PASS
- [ ] T-201: User Agent verifies status selector on staging; structured feedback submitted
- [ ] All feedback from T-194 and T-201 triaged by Manager (Tasked, Won't Fix, or Acknowledged)
- [ ] Sprint 22 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 23 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #22)

By end of Sprint #22, the following must be verifiable on staging:

- [ ] **T-194 Done** — User Agent confirms trip notes and destination validation work correctly on the existing Sprint 20 staging deployment
- [ ] **T-196 Done** — Trip details page shows a status badge; clicking it allows status change; new status persists across page reload; Home page TripCard reflects updated status
- [ ] Sprint 22 staging deploy (T-199) completed successfully
- [ ] No Critical or Major bugs found in T-194 or T-201 walkthrough
- [ ] Sprint 23 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 22 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete, production-ready, and has been for 19 sprints. **Project owner action required before production deployment can execute.**

---

*Previous sprint (Sprint #21) archived to `.workflow/sprint-log.md` on 2026-03-10. Sprint #22 plan written by Manager Agent 2026-03-10.*

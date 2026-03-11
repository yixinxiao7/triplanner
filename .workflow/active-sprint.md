# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #25 — 2026-03-10

**Sprint Goal:** Execute the T-210 User Agent mega-walkthrough (P0 — consolidates T-202 Sprint 20/22 scope + T-209 Sprint 24 scope — 6th consecutive carry-over for the Sprint 20/22 content). Triage feedback immediately. If clean: design and implement the Trip Details page calendar integration (Spec 22 → T-211/T-212 → T-213 → T-214 → T-215 → T-216 → T-217), replacing the placeholder that has existed since Sprint 1. Calendar is the top remaining MVP feature.

**Context:** Sprint 24 successfully shipped vitest 4.x upgrade (B-021 resolved) and the home page status filter tabs (StatusFilterTabs component, 481 frontend tests). Staging is healthy and verified by Monitor Agent (T-206, 2026-03-10T01:14:00Z). The User Agent walkthrough has not run for 6 consecutive sprints. T-210 must execute immediately at sprint start — all other phases are gated on it.

**Feedback Triage (Sprint 24 → Sprint 25):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| (none) | — | — | — | No "New" entries in feedback-log.md. T-202 and T-209 did not run — no User Agent feedback submitted. Sprint 22 Monitor Alert is Status: Resolved. No feedback-driven tasks created. |

---

## In Scope

### Phase 1 — User Agent Mega-Walkthrough (IMMEDIATE — NO BLOCKERS)

- [ ] **T-210** — User Agent: Consolidated Sprint 20 + Sprint 22 + Sprint 24 comprehensive walkthrough ← **NO DEPENDENCIES — START IMMEDIATELY** (P0) ⚠️ 6th consecutive carry-over for Sprint 20/22 scope

  - Run against existing staging (`https://localhost:4173` / `https://localhost:3001`)
  - T-206 confirmed staging health on 2026-03-10T01:14:00Z — all checks PASS

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

  **Sprint 24 scope (StatusFilterTabs):**
  - Four filter pills visible on home page: All / Planning / Ongoing / Completed
  - "Planning" pill → only PLANNING trip cards shown
  - "Ongoing" pill → only ONGOING trip cards shown
  - "Completed" pill → only COMPLETED trip cards shown
  - "All" pill → all trips shown
  - Filter to a status with 0 matches → "No [status] trips yet." + "Show all" reset link functional
  - "Show all" resets filter to "All", all trip cards return

  **Regression suite:**
  - Sprint 19: rate limiting (login lockout after 10 attempts) ✅; multi-destination chip UI ✅
  - Sprint 17: print itinerary button visible on TripDetailsPage ✅
  - Sprint 16: start_date/end_date visible on trip cards ✅

  - Submit structured feedback to `feedback-log.md` under **"Sprint 25 User Agent Feedback"** header
  - Manager triages feedback immediately after T-210 completes before Phase 2 starts

---

### Phase 2 — Calendar Integration Design + API (after T-210 clean — parallel tracks)

- [ ] **T-211** — Design Agent: Spec 22 — Trip Details page calendar integration

  Publish to `ui-spec.md` under "Sprint 25 Specs". Must cover:
  - **Location:** Top of TripDetailsPage, replacing the current placeholder ("Calendar coming in Sprint 2")
  - **Calendar type:** Month/week view showing flights, stays, and activities overlaid by date
  - **Event rendering:** Flights shown as travel blocks (departure → arrival day); stays shown as multi-day spans; activities shown as single-day time blocks
  - **Color coding:** Each type (flight / stay / activity) uses a distinct design-token color
  - **Interaction:** Events are read-only in calendar (editing still done via section forms below); clicking an event scrolls to its section on the page
  - **Empty state:** When no data in any section, calendar shows "Add flights, stays, or activities to see them here"
  - **Responsive:** Calendar adapts to narrow viewports (single-column day list on mobile)
  - **Accessibility:** `role="grid"`, keyboard navigation through cells, `aria-label` per event
  - **Styling:** Japandi minimal, IBM Plex Mono, existing design tokens only — no hardcoded hex
  - Log Manager approval handoff in `handoff-log.md` before T-212 begins

- [ ] **T-212** — Backend Engineer: Calendar data aggregation endpoint (parallel with T-211)

  Add `GET /api/v1/trips/:id/calendar` — returns a unified timeline merging flights, stays, and activities for the trip, normalized to a common event shape:
  ```json
  {
    "events": [
      {
        "id": "flight-uuid",
        "type": "FLIGHT",
        "title": "DL12345 — SFO → LAX",
        "start_date": "2026-08-07",
        "end_date": "2026-08-07",
        "start_time": "06:00",
        "end_time": "08:00",
        "timezone": "America/New_York",
        "source_id": "original-flight-uuid"
      },
      ...
    ]
  }
  ```
  - Scoped to trip ownership (auth required, 403 on wrong user, 404 on unknown trip)
  - Ordered by start_date ASC, start_time ASC
  - Events spanning multiple days (stays) produce a single entry with start_date ≠ end_date
  - Publish contract to `api-contracts.md` under Sprint 25; Manager must approve before T-213 begins
  - Write unit tests covering: happy path (all 3 event types), empty trip (empty events array), auth enforcement (401), ownership (403), trip not found (404)

---

### Phase 3 — Calendar Frontend Implementation (after T-211 approved + T-212 Done)

- [ ] **T-213** — Frontend Engineer: Calendar component on TripDetailsPage

  Implement per Spec 22:
  - Create `frontend/src/components/TripCalendar.jsx` (+ `.module.css`)
  - Call `GET /api/v1/trips/:id/calendar` using existing `api` axios instance
  - Render a month/week grid with events color-coded by type (FLIGHT / STAY / ACTIVITY)
  - Replace the placeholder in `TripDetailsPage.jsx` with `<TripCalendar tripId={tripId} />`
  - Loading skeleton while fetching; error state with retry; empty state per spec
  - Clicking an event dispatches a scroll to the corresponding section (flights / stays / activities)
  - All styling via CSS custom properties only — no hardcoded hex
  - Accessibility: `role="grid"`, `aria-label` on events, keyboard nav through calendar cells
  - Tests (minimum 10 new tests): calendar renders events from API; each event type renders with correct label; empty state shown when no events; loading skeleton shown while fetching; error state shown on API failure; retry works; clicking event triggers scroll; keyboard nav (ArrowLeft/ArrowRight/ArrowUp/ArrowDown)
  - All 481+ existing frontend tests must pass

---

### Phase 4 — QA, Deploy, Monitor, User Agent (sequential after Phase 2 + Phase 3)

- [ ] **T-214** — QA Engineer: Security checklist + test re-verification
  - Re-run `npm test --run` in `backend/` — confirm 304+ tests pass (new calendar endpoint tests included)
  - Re-run `npm test --run` in `frontend/` — confirm 481+ tests pass (new T-213 tests included)
  - Re-run `npm audit` in both — confirm 0 Moderate+ vulnerabilities
  - Verify calendar endpoint: auth enforced (401), ownership enforced (403), input validation
  - No new `dangerouslySetInnerHTML`, no hardcoded secrets
  - Full report in `qa-build-log.md` Sprint 25 section

- [ ] **T-215** — Deploy Engineer: Sprint 25 staging re-deployment ← Blocked by T-214
  - `npm run build` in `frontend/` → 0 errors → `pm2 reload triplanner-frontend`
  - `pm2 restart triplanner-backend`
  - Confirm `infra/ecosystem.config.cjs` `BACKEND_PORT: '3001'` + `BACKEND_SSL: 'true'` (mandatory regression check)
  - DB migration: if T-212 requires schema changes, run `knex migrate:latest`; otherwise confirm no migration needed
  - Smoke tests: GET /health → 200; GET /calendar → 200 (with auth); TripDetailsPage loads without placeholder; StatusFilterTabs still visible
  - Full report in `qa-build-log.md`; handoff to Monitor (T-216)

- [ ] **T-216** — Monitor Agent: Sprint 25 health check ← Blocked by T-215
  - Standard health checks: HTTPS, pm2, health 200, DB connectivity
  - Sprint 25: TripDetailsPage renders calendar component (not placeholder) ✅
  - Sprint 25: GET /api/v1/trips/:id/calendar → 200 with events array
  - Sprint 24 regression: StatusFilterTabs visible on home page ✅
  - Sprint 22 regression: PATCH /trips/:id status → 200 ✅
  - Sprint 20 regression: notes key present ✅
  - Sprint 19: RateLimit-Limit header ✅
  - Sprint 17: print button ✅
  - Sprint 16: start_date/end_date ✅
  - `npx playwright test` → 4/4 PASS
  - Full report in `qa-build-log.md`; handoff to User Agent (T-217)

- [ ] **T-217** — User Agent: Sprint 25 feature walkthrough ← Blocked by T-216
  - Calendar component: verify flights, stays, and activities render on calendar at top of TripDetailsPage
  - Calendar empty state: trip with no sub-resources → empty state message shown (not placeholder)
  - Calendar event types: each type (FLIGHT/STAY/ACTIVITY) visually distinct
  - Calendar → section scroll: click an event → page scrolls to corresponding section
  - Regression: StatusFilterTabs, TripStatusSelector, trip notes, destination validation, rate limiting, print button, date range
  - Submit structured feedback to `feedback-log.md` under "Sprint 25 User Agent Feedback"

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. **25 consecutive sprints without decision. Project owner action required.** All infrastructure is complete and production-ready.
- **Calendar edit mode** — Calendar events are read-only in Sprint 25. Editing remains via section forms.
- **MFA login, Home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.
- **B-020 (Redis rate limiting), B-024 (per-account rate limiting)** — In-memory store sufficient at current scale.
- **Phase 2/3 if T-210 has Critical or Major bugs** — If T-210 reveals Critical/Major issues, hotfix tasks take full priority; T-211–T-217 deferred to Sprint 26.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | Consolidated mega-walkthrough — **IMMEDIATE** | T-210 |
| Design Agent | Trip Details calendar spec — after T-210 clean | T-211 |
| Backend Engineer | Calendar data aggregation API endpoint — after T-210 clean (parallel with T-211) | T-212 |
| Frontend Engineer | Calendar component implementation — after T-211 approved + T-212 Done | T-213 |
| QA Engineer | Full test re-verification + security checklist | T-214 |
| Deploy Engineer | Sprint 25 staging re-deployment | T-215 |
| Monitor Agent | Sprint 25 health check | T-216 |
| User Agent | Sprint 25 feature walkthrough | T-217 |
| Manager | T-210 feedback triage → Phase 2 gate; API contract review (T-212); code reviews | T-211/T-212/T-213 review |

---

## Dependency Chain (Critical Path)

```
Phase 1 — Immediate (NO BLOCKERS):
T-210 (User Agent: mega-walkthrough — Sprint 20 + Sprint 22 + Sprint 24 scope) ← P0 ⚠️ 6th consecutive carry-over
    |
    └── Manager triages T-210 feedback
           |
           ├── If Critical/Major bugs → Hotfix tasks (H-xxx) take priority; Phase 2/3 deferred to Sprint 26
           └── If Clean → Phase 2 begins (parallel tracks)

Phase 2 (parallel, after T-210 clean):
T-211 (Design: Spec 22 — calendar)     T-212 (Backend: calendar API endpoint)
          |                                        |
      Manager approves T-211             Manager approves API contract
          |                                        |
          └──────────────┬─────────────────────────┘
                         |
Phase 3 (after T-211 + T-212 both approved):
T-213 (Frontend: TripCalendar component)
    |
Phase 4 (sequential):
T-214 (QA: security + test re-verification)
    |
T-215 (Deploy: Sprint 25 staging re-deployment)
    |
T-216 (Monitor: health check)
    |
T-217 (User Agent: Sprint 25 feature walkthrough)
    |
Manager: Triage T-217 feedback → Sprint 26 plan
```

---

## Definition of Done

*How do we know Sprint #25 is complete?*

- [ ] T-210: User Agent mega-walkthrough complete; Sprint 20 (notes + destination validation) AND Sprint 22 (TripStatusSelector) AND Sprint 24 (StatusFilterTabs) all verified on staging; structured feedback submitted to feedback-log.md
- [ ] T-210 feedback triaged by Manager (all entries Tasked, Resolved, Won't Fix, or Acknowledged)
- [ ] **If Phase 2/3 triggers (T-210 clean):**
  - [ ] T-211: Spec 22 published to ui-spec.md; Manager-approved
  - [ ] T-212: Calendar API endpoint implemented; contract published to api-contracts.md; Manager-approved; unit tests written
  - [ ] T-213: TripCalendar component implemented; placeholder replaced; 10+ new tests; all 481+ existing tests pass
  - [ ] T-214: QA re-verified post-calendar; npm audit clean (both dirs)
  - [ ] T-215: Staging re-deployed; ecosystem.config.cjs frontend env vars confirmed; calendar endpoint reachable
  - [ ] T-216: Monitor confirms all Sprint 25 health checks pass; calendar renders on staging (not placeholder)
  - [ ] T-217: User Agent Sprint 25 walkthrough complete; calendar + regression suite verified
- [ ] Sprint 25 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 26 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #25)

By end of Sprint #25, the following must be verifiable:

- [ ] **T-210 Done** — User Agent confirms trip notes, destination validation, TripStatusSelector, AND StatusFilterTabs all work correctly on staging
- [ ] No Critical or Major bugs found in T-210 walkthrough (or hotfixes dispatched if found)
- [ ] **If Phase 2/3 runs:** TripDetailsPage shows a live calendar component (not a placeholder) populated with flights, stays, and activities
- [ ] **If Phase 2/3 runs:** GET /api/v1/trips/:id/calendar returns correct unified event timeline
- [ ] Sprint 26 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 25 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete, production-ready, and has been for 21+ sprints. **Project owner action required before production deployment can execute.**
- **Phase 2/3 gate:** T-211, T-212, T-213 are all blocked until Manager triages T-210 feedback. If T-210 reveals Critical or Major bugs, Phase 2/3 is deferred in full to Sprint 26.

---

*Previous sprint (Sprint #24) archived to `.workflow/sprint-log.md` on 2026-03-10. Sprint #25 plan written by Manager Agent 2026-03-10.*

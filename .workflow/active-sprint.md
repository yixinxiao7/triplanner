# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #16 — 2026-03-08

**Sprint Goal:** Close the long-overdue User Agent and Monitor pipeline (T-159, T-152, T-160 — 7th carry-over of T-152, circuit-breaker active). Deliver the first post-MVP feature: trip date range display on home page trip cards, fulfilling the project brief's "timeline of the trip" requirement that has been deferred since Sprint 1 (B-006). Complete the full QA → Deploy → Monitor → User Agent cycle for the new feature.

**Context:** Sprint 15 delivered all implementation tasks (T-153–T-158) cleanly: browser title/favicon fixed (T-154), calendar land travel chip locations fixed (T-155), formatTimezoneAbbr() tests added (T-153), QA passed (T-156, T-157), and staging deployed (T-158, pm2 PID 9274, HTTPS port 3001). However, T-152 (User Agent comprehensive walkthrough — 7th carry-over), T-159 (Monitor Sprint 15 health check), and T-160 (User Agent Sprint 15 walkthrough) did not run. The circuit-breaker threshold has been reached for T-152 — this is the final acceptable carry-over before project owner escalation halts Sprint 17 scoping.

**Feedback Triage (Sprint 16 — Manager Agent 2026-03-08):**

| FB Entry | Category | Severity | Status | Disposition |
|----------|----------|----------|--------|-------------|
| FB-096 | UX Issue | Minor | Resolved | T-154 Done — browser title "triplanner" |
| FB-097 | UX Issue | Minor | Resolved | T-154 Done — favicon linked |
| FB-098 | Bug | Major | Resolved | T-155 Done — calendar land travel chip locations fixed |
| — | — | — | — | No new feedback. T-152/T-160 User Agent walkthroughs not yet run. |

---

## In Scope

### Phase 0 — Pipeline Carry-overs (P0 — run immediately — highest priority)

- [ ] **T-159** — Monitor Agent: Sprint 15 staging health check ← **ZERO BLOCKERS — START IMMEDIATELY** (P0)
  - Staging is live: `https://localhost:3001`, pm2 PID 9274 (verified T-158 Done 2026-03-07)
  - Verify: HTTPS ✅, pm2 online ✅, health 200 ✅, title "triplanner" ✅, favicon ✅
  - Verify: Calendar land travel chips — pick-up shows from_location, drop-off shows to_location ✅
  - Playwright 7/7 ✅, Sprint 14 + Sprint 13 regression pass ✅
  - Full report in qa-build-log.md Sprint 15 section. Handoff to User Agent (T-160).

- [ ] **T-152** — User Agent: Comprehensive Sprint 12+13+14+15 walkthrough ← **P0 HARD-BLOCK — 8th carry-over — CIRCUIT-BREAKER ACTIVE — MUST EXECUTE**
  - Staging is live: `https://localhost:3001`, pm2 PID 9274
  - **Can run in parallel with T-159** — zero blockers, staging is healthy
  - Scope: (1) Browser title "triplanner" + favicon (T-154); (2) Land travel chip location fix (T-155); (3) Calendar first-event-month (T-146); (4) "Today" button (T-147); (5) DayPopover stay-open (T-137); (6) Rental car chips (T-138); (7) Sprint 12 regression; (8) Sprint 11 regression
  - Submit structured feedback to `feedback-log.md` under Sprint 16 header
  - **If T-152 does not run in Sprint 16, Manager must halt Sprint 17 scoping and escalate to project owner.**

- [ ] **T-160** — User Agent: Sprint 15 feature walkthrough ← Blocked by T-159 (P2)
  - Verify T-154 (title, favicon), T-155 (land travel chip locations), T-138 regression, T-146 regression, T-137 regression, Sprint 11 regression
  - Submit structured feedback to `feedback-log.md` under Sprint 16 header

---

### Phase 1 — Design Spec + API Contract (parallel with Phase 0 — no cross-dependencies)

- [ ] **T-161** — Design Agent: Spec 16 — Trip date range display on home page cards ← NO DEPENDENCIES — START IMMEDIATELY (P1)
  - Date range format: "May 1 – 15, 2026" (same year abbreviated) / "Dec 28, 2025 – Jan 3, 2026" (cross-year full)
  - Empty state: "No dates yet" in muted secondary text when trip has no events
  - Source: backend-computed `start_date` + `end_date` fields (YYYY-MM-DD); frontend formats for display
  - Placement: below existing trip card content (destinations + status badge), new line, secondary/muted color
  - Publish to `ui-spec.md` as Spec 16

- [ ] **T-162** — Backend Engineer: API contract for trip date range ← NO DEPENDENCIES — START IMMEDIATELY (P1)
  - Document in `api-contracts.md` Sprint 16 section before T-163 begins
  - Fields: `start_date: string | null` (YYYY-MM-DD, MIN of all event dates), `end_date: string | null` (YYYY-MM-DD, MAX of all event dates)
  - Endpoints affected: `GET /trips` (per-trip object) and `GET /trips/:id`
  - No new endpoints; no schema migration; computed on read via SQL MIN/MAX subquery
  - Manager must approve before T-163 begins

---

### Phase 2 — Implementation (after T-161 + T-162 approved)

- [ ] **T-163** — Backend Engineer: Implement computed trip date range ← Blocked by T-162 (P1)
  - SQL subquery across flights (departure_at, arrival_at), stays (check_in_at, check_out_at), activities (activity_date), land_travels (departure_date, arrival_date)
  - DATE() cast to YYYY-MM-DD; null when no events
  - Add to both GET /trips (list) and GET /trips/:id (single trip)
  - No schema migration required
  - Tests: (A) no events → null/null; (B) flights only → correct; (C) mixed events → correct overall min/max; (D) list endpoint includes fields; (E) existing tests pass
  - All 266+ backend tests must pass

- [ ] **T-164** — Frontend Engineer: Display trip date range on home page trip cards ← Blocked by T-161, T-163 (P1)
  - Add `formatDateRange(startDate, endDate)` utility to `formatDate.js` (same-year abbreviation, cross-year full, null handling)
  - Render in `TripCard.jsx`: date range below existing content in muted secondary text
  - Tests: (A) start + end same year; (B) cross-year; (C) both null → "No dates yet"; (D) only start_date; (E) existing TripCard tests pass
  - All 410+ frontend tests must pass

---

### Phase 3 — QA Review (after T-163 + T-164 complete)

- [ ] **T-165** — QA Engineer: Security checklist + code review for Sprint 16 ← Blocked by T-163, T-164
  - T-163: Confirm parameterized Knex queries (no raw SQL with user input); null returns safely; no authorization gap
  - T-164: Confirm `formatDateRange()` output is React text node (no dangerouslySetInnerHTML); null guard present; CSS tokens not hardcoded hex
  - Run full test suites: backend (271+ expected), frontend (416+ expected)

- [ ] **T-166** — QA Engineer: Integration testing for Sprint 16 ← Blocked by T-165
  - Scenario 1: Trip with no events → `start_date: null`, `end_date: null`, card shows "No dates yet"
  - Scenario 2: Trip with only flights → `start_date` = flight departure date, `end_date` = arrival date
  - Scenario 3: Trip with mixed events → correct overall min/max across all event types
  - Scenario 4: GET /trips list includes `start_date`/`end_date` per entry
  - Sprint 15 + 14 + 13 regression pass
  - Handoff to Deploy (T-167) in handoff-log.md

---

### Phase 4 — Deploy, Monitor, User Agent (sequential after Phase 3)

- [ ] **T-167** — Deploy Engineer: Sprint 16 staging re-deployment ← Blocked by T-166
  - No migrations (schema unchanged — computed read only)
  - `pm2 restart triplanner-backend`, rebuild frontend `npm run build` in `frontend/`
  - Smoke tests: health ✅; trip date range populated via API ✅; home page card shows date range ✅; "No dates yet" on empty trip ✅; Sprint 15 features operational ✅
  - Do NOT modify `backend/.env` or `backend/.env.staging`
  - Log handoff to Monitor (T-168) in handoff-log.md

- [ ] **T-168** — Monitor Agent: Sprint 16 staging health check ← Blocked by T-167
  - HTTPS ✅, pm2 port 3001 ✅, health 200 ✅
  - Trip date range: GET /trips includes start_date/end_date ✅; trip with flight → dates populated correctly ✅
  - Sprint 15 regression (title, favicon, land travel chips) ✅; Sprint 14 regression ✅
  - Playwright 7/7 ✅
  - Handoff to User Agent (T-169) in handoff-log.md

- [ ] **T-169** — User Agent: Sprint 16 feature walkthrough ← Blocked by T-168 (P2)
  - Trip with events (flight + stay + activity) → card shows correct date range
  - Trip with no events → card shows "No dates yet"
  - Same-year and cross-year date range format verification
  - Sprint 15 + 14 + 13 + 11 regression clean
  - Submit structured feedback to `feedback-log.md` under Sprint 17 header

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. T-124 produced `.workflow/hosting-research.md`; project owner must review and select a provider. **16 consecutive sprints with no decision. Project owner action required.**
- **B-020 (Redis rate limiting)** — Deferred. In-memory acceptable at current scale.
- **B-021 (esbuild dev dep vulnerability)** — No production impact. Monitor for upstream fix.
- **B-024 (per-account rate limiting)** — Depends on B-020. Deferred.
- **B-032 (trip export/print)** — Deferred to Sprint 17 after date range feature ships.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Monitor Agent | Sprint 15 health check **(P0 — run immediately, zero blockers)** | T-159 |
| User Agent | Comprehensive Sprint 12+13+14+15 walkthrough **(P0 — run immediately, circuit-breaker active)** | T-152 |
| User Agent | Sprint 15 feature walkthrough (after T-159) | T-160 |
| Design Agent | Trip date range UI spec | T-161 |
| Backend Engineer | API contract for trip date range (then implementation) | T-162, T-163 |
| Frontend Engineer | Display trip date range on home page cards | T-164 |
| QA Engineer | Security checklist + integration testing for Sprint 16 | T-165, T-166 |
| Deploy Engineer | Sprint 16 staging re-deployment | T-167 |
| Monitor Agent | Sprint 16 staging health check | T-168 |
| User Agent | Sprint 16 feature walkthrough | T-169 |
| Manager | Triage T-152 + T-160 + T-169 feedback → Sprint 17 plan | Feedback triage |

---

## Dependency Chain (Critical Path)

```
Track A — Pipeline Carry-overs (start immediately — P0):
T-159 (Monitor: Sprint 15 health check) ──> T-160 (User Agent: Sprint 15 walkthrough)
T-152 (User Agent: Sprint 12+13+14+15 comprehensive walkthrough) [parallel with T-159]
           |
           └-> Manager: Triage feedback → inform Sprint 17

Track B — New Feature (start immediately — parallel with Track A):
T-161 (Design: date range spec) ─┐
T-162 (Backend: API contract)    ─┤
                                  ├-> T-163 (Backend: implement date range)
                                  │         |
                                  └-> T-164 (Frontend: display date range) [blocked by T-163 + T-161]
                                              |
                                          T-165 (QA: security + review)
                                              |
                                          T-166 (QA: integration)
                                              |
                                          T-167 (Deploy)
                                              |
                                          T-168 (Monitor: Sprint 16 health)
                                              |
                                          T-169 (User Agent: Sprint 16 walkthrough)
                                              |
                                     Manager: Triage feedback → Sprint 17 plan
```

---

## Definition of Done

*How do we know Sprint #16 is complete?*

- [ ] T-159: Monitor Agent verifies all Sprint 15 health checks on staging; full report in qa-build-log.md
- [ ] T-152: User Agent walks through all Sprint 12+13+14+15 features on staging; structured feedback in feedback-log.md; T-136 + T-144 carry-over scope formally closed
- [ ] T-160: User Agent verifies Sprint 15 bug fixes; structured feedback in feedback-log.md
- [ ] T-161: Design spec for trip date range published to ui-spec.md as Spec 16; Manager-approved
- [ ] T-162: API contract for `start_date`/`end_date` published to api-contracts.md; Manager-approved
- [ ] T-163: Backend computes and returns `start_date`/`end_date` on GET /trips and GET /trips/:id; all tests pass
- [ ] T-164: Home page trip cards display formatted date range or "No dates yet"; all tests pass
- [ ] T-165: QA security checklist passed for Sprint 16 changes
- [ ] T-166: QA integration testing passed; Sprint 15 regression clean
- [ ] T-167: Frontend rebuilt and deployed to staging; pm2 restarted; smoke tests pass
- [ ] T-168: Monitor confirms all Sprint 16 health checks pass
- [ ] T-169: User Agent verifies trip date range feature; structured feedback in feedback-log.md
- [ ] All feedback from T-152, T-160, T-169 triaged by Manager (Tasked, Won't Fix, or Acknowledged)
- [ ] Sprint 16 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 17 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #16)

By end of Sprint #16, the following must be verifiable:

- [ ] **T-152 has executed** — User Agent has walked through all Sprint 12–15 features on `https://localhost:3001` and submitted structured feedback. **CIRCUIT-BREAKER: if T-152 does not run in Sprint 16, Manager halts Sprint 17 scoping and escalates to project owner.**
- [ ] **T-159 is Done** — Monitor has verified Sprint 15 health on staging
- [ ] **T-163 is Done** — `GET /trips` and `GET /trips/:id` return `start_date`/`end_date` for all trips
- [ ] **T-164 is Done** — Home page trip cards show date range ("May 1 – 15, 2026" or "No dates yet")
- [ ] Sprint 16 staging deploy (T-167) completed successfully
- [ ] No Critical or Major bugs left unaddressed from T-152/T-160/T-169 feedback
- [ ] Sprint 17 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 16 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete and production-ready. **Project owner action required before production deployment can execute.**
- **T-152 Circuit-Breaker (8th carry-over):** T-152 must execute in Sprint 16. If it does not, the Manager Agent will halt Sprint 17 scoping and escalate to the project owner. Silent carry-over is no longer acceptable.

---

*Previous sprint (Sprint #15) archived to `.workflow/sprint-log.md` on 2026-03-07. Sprint #16 plan written by Manager Agent 2026-03-08.*

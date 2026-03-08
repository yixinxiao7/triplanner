# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #15 — 2026-03-07

**Sprint Goal:** Close the 6th consecutive User Agent walkthrough carry-over (T-152). Fix three project-owner-reported bugs: browser tab title showing "App" (FB-096), missing favicon link (FB-097), and calendar land travel chips showing wrong location (FB-098). Ship a QA → Deploy → Monitor → User Agent pipeline for the new fixes. Optional: add formatTimezoneAbbr() unit tests (T-153, P3).

**Context:** Sprint 14 delivered all 7 implementation and infrastructure tasks (T-145–T-151) with zero rework and a fully healthy staging environment (HTTPS port 3001, pm2 PID 94787, Playwright 7/7 PASS, Deploy Verified: Yes). Three new feedback items (FB-096, FB-097, FB-098) were filed by the project owner and triaged this sprint — two are trivial UX fixes (browser title, favicon) and one is a Major bug (calendar land travel chip showing wrong location). T-152 (User Agent comprehensive walkthrough) carries in as the P0 hard-block for the 6th consecutive sprint.

**Feedback Triage (Sprint 15 — Manager Agent 2026-03-07):**

| FB Entry | Category | Severity | Status | Disposition |
|----------|----------|----------|--------|-------------|
| FB-093 | Monitor Alert | Major | Resolved | T-145 Done — JWT_SECRET rotated |
| FB-094 | Feature Gap | Minor | Resolved | T-147 Done — "Today" button added |
| FB-095 | Bug | Major | Resolved | T-146 Done — Calendar first-event-month fixed |
| FB-096 | UX Issue | Minor | **Tasked → T-154** | Frontend: fix browser tab title to "triplanner" — P3 |
| FB-097 | UX Issue | Minor | **Tasked → T-154** | Frontend: add favicon link tag — combined with FB-096 — P3 |
| FB-098 | Bug | Major | **Tasked → T-155** | Frontend: fix calendar land travel chip location (pick-up shows origin, drop-off shows destination) — P1 |

---

## In Scope

### Phase 0 — User Agent Walkthrough (P0 — start immediately — zero blockers)

- [ ] **T-152** — User Agent: Comprehensive Sprint 12+13+14 feature walkthrough ← **P0 HARD-BLOCK — START IMMEDIATELY — CIRCUIT-BREAKER APPLIES**
  - Staging is verified healthy: `https://localhost:3001`, pm2 PID 94787, T-151 health check Done 2026-03-07
  - **Calendar first-event-month fix (T-146):** Open a trip with events only in May 2026. Verify the calendar opens on May 2026, not March 2026. Navigate forward/back — verify manual navigation is preserved. Open a trip with no events — verify calendar falls back to current month (March 2026).
  - **"Today" button (T-147):** Navigate to a future month. Verify a "Today" button is visible in the calendar header. Click it — verify calendar returns to March 2026. Repeat from a past month.
  - **DayPopover stay-open (T-137, carry-over from T-144):** Trigger "+X more" overflow on a calendar day. Open the popover. Scroll the page — verify popover remains open and does NOT close or drift. Press Escape — closes. Click outside — closes.
  - **Rental car chips (T-138, carry-over from T-144):** Create a rental car land travel entry with pick-up and drop-off times. Verify pick-up day shows "pick-up Xp"; drop-off day shows "drop-off Xp".
  - **Sprint 12 regression (carry-over from T-136):** `backend/.env` shows local-dev settings (not staging) ✅; check-in chip reads "check-in Xa" ✅; check-out chip reads "check-out Xa" ✅. Note: DayPopover scroll behavior is stay-open (T-137), NOT close-on-scroll (T-126 was reversed).
  - **Sprint 11 regression:** Land travel CRUD, trip notes, timezone abbreviations, URL links, print — all operational.
  - Submit structured feedback to `feedback-log.md` under a Sprint 15 header.
  - **This task formally closes T-136 (6th carry-over) and T-144 carry-over scope.**

---

### Phase 1 — Frontend Bug Fixes (parallel with Phase 0 — start immediately)

- [ ] **T-154** — Frontend Engineer: Fix browser tab title + favicon ← NO DEPENDENCIES — START IMMEDIATELY (P3)
  - Update `frontend/index.html`:
    1. Change `<title>App</title>` → `<title>triplanner</title>`
    2. Add `<link rel="icon" type="image/png" href="/favicon.png">` to `<head>` (`frontend/public/favicon.png` already exists)
  - No component changes, no logic changes, no new tests (static HTML only).
  - Verify via `npm run build` + `npm run preview`: tab shows "triplanner" and favicon icon.

- [ ] **T-155** — Frontend Engineer: Fix calendar land travel chip location display ← NO DEPENDENCIES — START IMMEDIATELY (P1)
  - Both pick-up and drop-off chips currently show the destination (`to_location`). Fix:
    - **Pick-up day chip**: display `from_location` (origin)
    - **Drop-off day chip**: display `to_location` (destination)
  - Root cause: in `buildEventsMap`, land travel departure-day events need `_location = lt.from_location`; arrival-day events need `_location = lt.to_location`. Use `_location` in `DayCell` and `DayPopover.getEventTime` for land travel rendering.
  - T-138 RENTAL_CAR label prefixes ("pick-up", "drop-off") must remain correct — only the location text changes.
  - 4 new tests required: (A) pick-up day shows from_location; (B) drop-off day shows to_location; (C) same-day rental shows from_location only; (D) RENTAL_CAR prefixes still present.
  - All 400+ existing tests must pass.

- [ ] **T-153** — Frontend Engineer: Add `formatTimezoneAbbr()` unit tests ← NO DEPENDENCIES — may start immediately (P3)
  - Deferred since Sprint 7. Add to `frontend/src/utils/formatDate.test.js`:
    1. `America/New_York` in August → `"EDT"` (or ICU equivalent)
    2. `Asia/Tokyo` → `"JST"` (or `"GMT+9"`)
    3. `Europe/Paris` in summer → `"CEST"` (or `"GMT+2"`)
    4. Invalid/null timezone → graceful fallback (no throw, returns a string)
  - No production code changes — tests only. All 400+ existing tests must still pass.

---

### Phase 2 — QA Review (after T-154 + T-155 complete)

- [ ] **T-156** — QA Engineer: Security checklist + code review for T-154, T-155 ← Blocked by T-154, T-155
  - T-154: static HTML change — no script injection, no CSP implications; favicon href is root-relative to existing file.
  - T-155: confirm `_location` field sourced from DB record fields (not unsanitized user input echoed into innerHTML); React renders as text node; `dangerouslySetInnerHTML` not used; T-138 RENTAL_CAR logic preserved.
  - Run full test suite: `backend/` (266+) and `frontend/` (404+).

- [ ] **T-157** — QA Engineer: Integration testing for Sprint 15 ← Blocked by T-156
  - Browser title: `<title>triplanner</title>` in index.html ✅; favicon `<link>` present ✅.
  - Calendar land travel chips: from_location on pick-up day, to_location on drop-off day ✅.
  - RENTAL_CAR "pick-up"/"drop-off" label prefixes still correct ✅.
  - Sprint 14 regression: calendar first-event-month (T-146), "Today" button (T-147) ✅.
  - Sprint 13 regression: DayPopover stay-open (T-137), rental car time chips (T-138) ✅.
  - Sprint 11 regression: land travel CRUD, notes, timezone abbreviations, URL links, print ✅.

---

### Phase 3 — Deploy, Monitor, User Agent (sequential after Phase 2)

- [ ] **T-158** — Deploy Engineer: Sprint 15 staging re-deployment ← Blocked by T-157
  - Rebuild frontend with T-154/T-155 changes.
  - No new migrations (no schema changes in Sprint 15).
  - Restart pm2 — backend must remain on `https://localhost:3001`.
  - Smoke tests: (a) tab title "triplanner"; (b) favicon visible; (c) land travel pick-up/drop-off chips show correct locations; (d) Sprint 14 features operational.

- [ ] **T-159** — Monitor Agent: Sprint 15 staging health check ← Blocked by T-158
  - HTTPS ✅, pm2 port 3001 ✅, health 200 ✅.
  - Browser title "triplanner" ✅, favicon link present ✅.
  - Land travel chip locations correct ✅.
  - Playwright 7/7 ✅.
  - Sprint 14 + Sprint 13 regression pass ✅.

- [ ] **T-160** — User Agent: Sprint 15 feature walkthrough ← Blocked by T-159 (P2)
  - Verify browser tab title "triplanner", favicon visible.
  - Verify land travel pick-up/drop-off chips show correct locations.
  - Verify RENTAL_CAR label prefixes still correct (T-138 regression).
  - Sprint 14 regression: calendar first-event-month, "Today" button.
  - Sprint 13 regression: DayPopover stay-open, rental car time chips.
  - Sprint 11 regression: land travel CRUD, notes, timezone abbreviations, URL links, print.
  - Submit structured feedback under Sprint 16 header.

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. T-124 produced `.workflow/hosting-research.md`; project owner must review and select a provider. **15 consecutive sprints with no decision. Project owner action required.**
- **B-020 (Redis rate limiting)** — Deferred. In-memory acceptable at current scale.
- **B-021 (esbuild dev dep vulnerability)** — No production impact. Monitor for upstream fix.
- **B-024 (per-account rate limiting)** — Depends on B-020. Deferred.
- **New features** — No new feature work this sprint. New features begin in Sprint 16 after T-152 and T-160 feedback is triaged.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | Comprehensive Sprint 12+13+14 walkthrough **(P0 — run immediately, no blockers)** | T-152 |
| Frontend Engineer | Fix browser title + favicon (P3), fix land travel chip location (P1), formatTimezoneAbbr() tests (P3) | T-154, T-155, T-153 |
| QA Engineer | Security checklist + integration testing for Sprint 15 fixes | T-156, T-157 |
| Deploy Engineer | Sprint 15 staging re-deployment (after QA clears) | T-158 |
| Monitor Agent | Sprint 15 staging health check | T-159 |
| User Agent | Sprint 15 feature walkthrough (after Monitor) | T-160 |
| Manager | Triage T-152 + T-160 feedback → Sprint 16 plan | Feedback triage |
| Backend Engineer | Standby — no backend tasks this sprint | — |

---

## Dependency Chain (Critical Path)

```
Track A — User Agent Sprint 12+13+14 (start immediately — P0):
T-152 (User Agent: comprehensive walkthrough)
        |
        └-> Manager: Triage feedback → Sprint 16 plan

Track B — Sprint 15 Bug Fixes (start immediately — parallel with Track A):
T-154 (Frontend: title + favicon)  ─┐
T-155 (Frontend: land travel chips) ─┤
T-153 (Frontend: tz abbr tests, P3) ─┤
                                     ├-> T-156 (QA: security+review) -> T-157 (QA: integration)
                                                                              |
                                                                          T-158 (Deploy)
                                                                              |
                                                                          T-159 (Monitor)
                                                                              |
                                                                          T-160 (User Agent: Sprint 15 walkthrough)
                                                                              |
                                                                     Manager: Triage feedback → Sprint 16 plan
```

---

## Definition of Done

*How do we know Sprint #15 is complete?*

- [ ] T-152: User Agent verifies calendar first-event-month fix (T-146), "Today" button (T-147), DayPopover stay-open (T-137), rental car chips (T-138), Sprint 12 regression, Sprint 11 regression; structured feedback submitted to feedback-log.md
- [ ] T-136 and T-144 carry-over scope confirmed closed via T-152
- [ ] T-154: Browser tab title shows "triplanner"; favicon linked in index.html
- [ ] T-155: Calendar land travel chips show from_location on pick-up day, to_location on drop-off day; 4 new tests pass
- [ ] T-153: formatTimezoneAbbr() unit tests added and passing (optional — P3)
- [ ] T-156: QA security checklist passed
- [ ] T-157: QA integration tests passed
- [ ] T-158: Frontend rebuilt and deployed to staging
- [ ] T-159: Monitor confirms all Sprint 15 health checks pass
- [ ] T-160: User Agent verifies Sprint 15 fixes; structured feedback submitted
- [ ] All feedback triaged by Manager (Tasked, Won't Fix, or Acknowledged)
- [ ] Sprint 15 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 16 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #15)

By end of Sprint #15, the following must be verifiable:

- [ ] T-152 has executed — User Agent has walked through all features on `https://localhost:3001` — **circuit-breaker: if this does not happen, Manager escalates to project owner and halts Sprint 16 planning**
- [ ] T-155 is Done — calendar land travel chips show correct locations (pick-up = origin, drop-off = destination)
- [ ] T-154 is Done — browser tab shows "triplanner" and favicon icon
- [ ] Sprint 15 staging deploy (T-158) completed successfully
- [ ] Structured feedback from T-152 and T-160 is in `feedback-log.md` and triaged by Manager
- [ ] No Critical or Major bugs left unaddressed (hotfixes created immediately if found)
- [ ] Sprint 16 plan is written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 15 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete and production-ready. **Project owner action required before production deployment can execute.**
- **T-152 carry-over circuit-breaker:** T-152 has now carried over 6 consecutive sprints. If T-152 fails to run in Sprint 15, the Manager Agent must escalate to the project owner and halt sprint planning until the User Agent pipeline is unblocked. Silent carry-over is no longer acceptable.

---

*Previous sprint (Sprint #14) archived to `.workflow/sprint-log.md` on 2026-03-07. Sprint #15 revised plan written by Manager Agent 2026-03-07 after triaging FB-096, FB-097, FB-098.*

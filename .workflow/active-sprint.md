# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #17 — 2026-03-08

**Sprint Goal:** Apply three code-quality improvements from Sprint 16 feedback (T-170: fix double-muted opacity on "No dates yet" text, remove dead `formatTripDateRange` function, update stale comment). Deliver the long-deferred trip print/export feature (B-032): a "Print itinerary" button on the trip details page that triggers a browser print dialog with a clean, printer-friendly layout. Complete the full QA → Deploy → Monitor → User Agent pipeline.

**Context:** Sprint 16 delivered all 12 tasks cleanly — trip date range display on home page cards is live, and T-152 circuit-breaker was finally resolved after 8 consecutive carry-overs. The Sprint 16 User Agent walkthrough (T-169) found no Critical or Major issues — only three Minor code-quality items now bundled into T-170. The MVP feature set (auth, trips CRUD, flights/stays/activities with edit, land travel, calendar, date ranges) is complete. Sprint 17 is a polish + deferred-feature sprint with a light implementation scope.

**Feedback Triage (Sprint 16 → Sprint 17 — Manager Agent 2026-03-08):**

| FB Entry | Category | Severity | Status | Disposition |
|----------|----------|----------|--------|-------------|
| FB-099 | Positive | — | Acknowledged | Trip with no events shows "No dates yet" — T-164 empty state confirmed |
| FB-100 | Positive | — | Acknowledged | Mixed-event trip date range (same month) correct — T-163 SQL correct |
| FB-101 | Positive | — | Acknowledged | Cross-year date range computed and formatted correctly |
| FB-102 | Positive | — | Acknowledged | GET /trips list includes start_date/end_date; NULLs sorted last |
| FB-103 | Positive | — | Acknowledged | Test suites exceed thresholds (278 backend, 420 frontend) |
| FB-104 | Positive | — | Acknowledged | Sprint 15 regression clean (title, favicon, land travel chips) |
| FB-105 | Positive | — | Acknowledged | Auth and validation safeguards working as expected |
| FB-106 | UX Issue | Minor | **Tasked → T-170** | `.datesNotSet` double-muted opacity (~25% effective) — remove `opacity: 0.5` |
| FB-107 | UX Issue | Minor | **Tasked → T-170** | `formatTripDateRange` dead code with non-spec behavior — remove + 5 dead tests |
| FB-108 | Suggestion | — | **Acknowledged → T-170** | Stale comment in formatDate.js line 8 — update to reflect all event types |

---

## In Scope

### Phase 1 — Code Cleanup + Design Spec (parallel, no dependencies — start immediately)

- [ ] **T-170** — Frontend Engineer: Code cleanup from Sprint 16 feedback ← **NO DEPENDENCIES — START IMMEDIATELY** (P2)
  - **FB-106:** Remove `opacity: 0.5` from `.datesNotSet` in `TripCard.module.css`. Also remove duplicate definition at line 159 (hardcoded rgba — dead code, overridden by line 211). Only `color: var(--text-muted)` should remain on `.datesNotSet`.
  - **FB-107:** Remove `formatTripDateRange` export from `formatDate.js`. Remove its 5 associated tests from `formatDate.test.js`. Verify `formatDateRange` (spec-compliant) remains intact.
  - **FB-108:** Update file-level comment on `formatDate.js` line 8 from "derive date range from flight dates" to "derive date range from the earliest and latest dates across all event types (flights, stays, activities, land travels)."
  - **Test plan:** All 415+ frontend tests pass (5 fewer after dead test removal). `formatDateRange` still exported and passing.

- [ ] **T-171** — Design Agent: Spec 17 — Trip print/export view ← **NO DEPENDENCIES — START IMMEDIATELY** (P2)
  - Trigger: "Print itinerary" `<button>` on trip details page header, `onClick={() => window.print()}`
  - Print layout: single-column, linear, black on white; hide navbar/calendar/interactive controls
  - Section ordering: trip name + destinations + date range → Flights → Stays → Activities (day-grouped) → Land Travel
  - Empty section rule: omit entirely if section has no events (no empty-state CTAs in print)
  - Page break: `page-break-inside: avoid` on individual event cards
  - Typography: IBM Plex Mono at 12pt minimum; print units preferred
  - Colors: `#000` text on `#fff` background in print; no CSS custom properties that may not resolve in print
  - Implementation approach: CSS `@media print` in `frontend/src/styles/print.css` imported in TripDetailsPage
  - Publish to `ui-spec.md` as Spec 17. Manager must approve before T-172 begins.

---

### Phase 2 — Implementation (after T-171 approved)

- [ ] **T-172** — Frontend Engineer: Implement trip print/export view ← Blocked by T-171 (P2)
  - Add "Print itinerary" button to trip details page header with `aria-label="Print itinerary"`
  - Create `frontend/src/styles/print.css` with `@media print` rules:
    - Hide: navbar, calendar widget, all edit/add/delete buttons, print button itself, toasts/overlays
    - Override: background → white, text → black, font-size → 12pt
    - `page-break-inside: avoid` on each event card
    - Omit empty sections (either CSS `.has-items` guard or `display: none` on empty state elements)
  - Import `print.css` in `TripDetailsPage.jsx` (or globally in `main.jsx`)
  - No new API endpoints; no schema changes
  - Tests: (A) button renders on TripDetailsPage; (B) click calls `window.print()`; (C) aria-label correct; (D) existing TripDetailsPage tests still pass
  - All 415+ existing frontend tests (after T-170 cleanup) must pass

---

### Phase 3 — QA Review (after T-170 + T-172 complete)

- [ ] **T-173** — QA Engineer: Security checklist + code review for Sprint 17 ← Blocked by T-170, T-172 (P1)
  - T-170: `.datesNotSet` no opacity stacking; `formatTripDateRange` absent; comment updated; 415+ tests pass
  - T-172: `window.print()` call safe; no dangerouslySetInnerHTML; aria-label present; no hardcoded colors in print.css; no sensitive data in button attributes
  - Run full test suites: frontend (415+), backend (278+ — no backend changes)
  - Run `npm audit` — flag any new Critical/High findings

- [ ] **T-174** — QA Engineer: Integration testing for Sprint 17 ← Blocked by T-173 (P1)
  - Print button visible on trip details page ✅
  - Print button has correct aria-label ✅
  - "No dates yet" is legible (opacity fix from T-170 working) ✅
  - Home page date ranges still correct (formatTripDateRange removal did not affect formatDateRange) ✅
  - Sprint 16 regression: date ranges, "No dates yet" ✅
  - Sprint 15 regression: title, favicon, land travel chip locations ✅
  - Sprint 14 + Sprint 13 + Sprint 11 regression ✅
  - Handoff to Deploy (T-175)

---

### Phase 4 — Deploy, Monitor, User Agent (sequential after Phase 3)

- [ ] **T-175** — Deploy Engineer: Sprint 17 staging re-deployment ← Blocked by T-174 (P1)
  - **Backend:** No migrations, no backend changes. Verify pm2 `triplanner-backend` still online (port 3001). No restart needed unless backend was stopped.
  - **Frontend:** `npm run build` in `frontend/`. Confirm 0 errors. Confirm `print.css` included in built assets.
  - Smoke tests: health ✅; home page date ranges unaffected ✅; trip details "Print itinerary" button visible ✅; Sprint 15 features (title/favicon) operational ✅
  - Do NOT modify `backend/.env` or `backend/.env.staging`
  - Handoff to Monitor (T-176)

- [ ] **T-176** — Monitor Agent: Sprint 17 staging health check ← Blocked by T-175 (P1)
  - HTTPS ✅, pm2 port 3001 ✅, health 200 ✅
  - "Print itinerary" button present on trip details page ✅
  - "No dates yet" opacity fix visible (legible muted text) ✅
  - Sprint 16 regression (date ranges) ✅; Sprint 15 regression (title/favicon) ✅
  - Playwright 7/7 ✅
  - Handoff to User Agent (T-177)

- [ ] **T-177** — User Agent: Sprint 17 feature walkthrough ← Blocked by T-176 (P2)
  - "Print itinerary" button visible on trip details page ✅
  - Clicking button opens browser print dialog ✅
  - Button has correct aria-label ✅
  - "No dates yet" text is legible (not over-dimmed) after opacity fix ✅
  - Home page date ranges still correct (formatTripDateRange removal regression check) ✅
  - Sprint 16 + Sprint 15 + Sprint 14 + Sprint 13 + Sprint 11 regression ✅
  - Submit structured feedback to `feedback-log.md` under Sprint 18 header

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. `.workflow/hosting-research.md` (T-124) awaits review. **17 consecutive sprints with no decision. Project owner action required.**
- **B-020 (Redis rate limiting)** — Deferred. In-memory acceptable at current scale.
- **B-021 (esbuild dev dep vulnerability)** — No production impact. Monitor for upstream fix.
- **B-024 (per-account rate limiting)** — Depends on B-020. Deferred.
- **B-007 (multi-destination structured UI)** — Deferred to Sprint 18+. Destinations currently stored as TEXT ARRAY; UI is comma-separated display.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Frontend Engineer | Code cleanup (opacity fix, dead code removal, stale comment) | T-170 |
| Design Agent | Trip print/export UI spec | T-171 |
| Frontend Engineer | Implement trip print/export view | T-172 |
| QA Engineer | Security checklist + integration testing | T-173, T-174 |
| Deploy Engineer | Sprint 17 staging re-deployment | T-175 |
| Monitor Agent | Sprint 17 staging health check | T-176 |
| User Agent | Sprint 17 feature walkthrough + feedback | T-177 |
| Manager | Triage T-177 feedback → Sprint 18 plan | Feedback triage |

---

## Dependency Chain (Critical Path)

```
Track A — Code Cleanup (start immediately, no dependencies):
T-170 (Frontend: code cleanup — opacity fix, dead code removal, stale comment)
         |
         └─┐
           ├-> T-173 (QA: security + review)
           |
Track B — New Feature (start Design immediately; impl after spec approved):
T-171 (Design: print/export spec) --> T-172 (Frontend: print/export impl)
                                               |
                                               └─┘
                                               |
                                           T-173 (QA: security + review)
                                               |
                                           T-174 (QA: integration)
                                               |
                                           T-175 (Deploy)
                                               |
                                           T-176 (Monitor: Sprint 17 health)
                                               |
                                           T-177 (User Agent: Sprint 17 walkthrough)
                                               |
                                    Manager: Triage feedback → Sprint 18 plan
```

---

## Definition of Done

*How do we know Sprint #17 is complete?*

- [ ] T-170: `.datesNotSet` CSS has no `opacity: 0.5`; `formatTripDateRange` removed from formatDate.js + its 5 tests; stale comment updated; 415+ frontend tests pass
- [ ] T-171: Design spec for trip print/export published to ui-spec.md as Spec 17; Manager-approved
- [ ] T-172: "Print itinerary" button on trip details page calls `window.print()`; print.css @media print rules suppress nav/calendar/buttons; 418+ frontend tests pass
- [ ] T-173: QA security checklist passed for Sprint 17 changes; no new Critical/High audit findings
- [ ] T-174: QA integration testing passed; Sprint 16 + Sprint 15 + prior regression clean
- [ ] T-175: Frontend rebuilt and deployed to staging; smoke tests pass
- [ ] T-176: Monitor confirms all Sprint 17 health checks pass
- [ ] T-177: User Agent verifies print button and opacity fix on staging; structured feedback in feedback-log.md
- [ ] All feedback from T-177 triaged by Manager (Tasked, Won't Fix, or Acknowledged)
- [ ] Sprint 17 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 18 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #17)

By end of Sprint #17, the following must be verifiable on staging:

- [ ] **T-170 Done** — "No dates yet" text on home page cards is legible (not double-dimmed); `formatTripDateRange` is absent from codebase
- [ ] **T-172 Done** — "Print itinerary" button visible on trip details page; clicking opens browser print dialog
- [ ] Sprint 17 staging deploy (T-175) completed successfully
- [ ] No Critical or Major bugs found by User Agent in T-177 walkthrough
- [ ] Sprint 18 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 17 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete and production-ready. **Project owner action required before production deployment can execute.**

---

*Previous sprint (Sprint #16) archived to `.workflow/sprint-log.md` on 2026-03-08. Sprint #17 plan written by Manager Agent 2026-03-08.*

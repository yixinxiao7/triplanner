# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #41 — 2026-03-30

**Sprint Goal:** Implement trip export/print feature (B-032) — allow users to generate a printable itinerary view of their trip details page. This is a high-value MVP enhancement for detail-oriented travelers who want offline reference during travel.

**Context:** Sprint 40 closed cleanly with all 7 tasks Done, production verified, and zero Critical/Major issues. The MVP core is complete and stable (1041 tests, production verified). Sprint 41 adds the first post-MVP quality-of-life feature: trip export/print (B-032, P2). This was deferred since Sprint 3 and is the highest-priority remaining backlog feature that directly serves the target user persona — travelers who "like to plan every day out" and want a printable itinerary.

**Feedback Triage (Sprint 40 → Sprint 41):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-239–FB-248, FB-250–FB-251 | Positive | — | **Acknowledged** — all confirmations, no action needed |
| FB-249 | UX Issue | Minor | **Acknowledged** — PM2 restart counter accumulation, backlog (operational) |

**No Critical or Major bugs. Sprint 41 is a feature sprint.**

---

## In Scope

### Phase 1 — Design + API Contract (start immediately, parallel)

- [ ] **T-312** — Design Agent: UI spec for trip export/print feature (B-032)

  **Context:** Users want to print their itinerary for offline reference during travel. Design a printable itinerary view of the trip details page — flights, stays, activities, and calendar overview.

  **Execute:**
  1. Design a print-optimized layout for the trip details page (CSS print stylesheet approach)
  2. Define the print view structure: trip header, calendar summary, flights table, stays table, activities grouped by day
  3. Specify a "Print / Export" button placement on the trip details page
  4. Cover both browser print dialog (Cmd+P / Ctrl+P) and a dedicated print button
  5. Ensure the design follows Japandi aesthetic — clean, minimal, monospace typography, no dark background in print

  **Acceptance criteria:**
  - UI spec published in ui-spec.md with print layout details
  - Print view covers all trip sections (flights, stays, activities, calendar overview)
  - Both desktop print and dedicated button specified
  - Print-specific styles defined (no dark bg, border-only separators, IBM Plex Mono)

  **Blocked By:** None

  **Files:** `.workflow/ui-spec.md`

---

- [ ] **T-313** — Backend Engineer: API contract for trip export endpoint (B-032)

  **Context:** The frontend needs a single API call to get all trip data needed for print view. Evaluate whether the existing GET /trips/:id endpoint returns sufficient data (flights, stays, activities) or if a dedicated export endpoint is needed.

  **Execute:**
  1. Review current GET /trips/:id response — does it include flights, stays, and activities?
  2. If yes, document that the existing endpoint is sufficient for print view (no new endpoint needed)
  3. If no, design a GET /trips/:id/export endpoint that returns the full trip with all sub-resources
  4. Update api-contracts.md with the decision and any new endpoint spec

  **Acceptance criteria:**
  - API contract documented in api-contracts.md
  - Decision recorded: existing endpoint sufficient OR new export endpoint specified
  - Response shape defined for print view consumption

  **Blocked By:** None

  **Files:** `.workflow/api-contracts.md`

---

### Phase 2 — Implementation (after Phase 1)

- [ ] **T-314** — Backend Engineer: Implement export endpoint if needed ← Blocked by T-313

  **Context:** If T-313 determines a new endpoint is needed, implement it. If existing endpoints are sufficient, mark this task as N/A and move to Done.

  **Execute:**
  1. If new endpoint needed: implement GET /trips/:id/export with full trip data
  2. If existing endpoint sufficient: no code changes, add a note to api-contracts.md
  3. Add tests for any new endpoint

  **Acceptance criteria:**
  - Endpoint implemented and tested (if needed), OR task marked N/A with justification
  - Tests pass

  **Blocked By:** T-313

  **Files:** `backend/src/`

---

- [ ] **T-315** — Frontend Engineer: Implement trip print view ← Blocked by T-312, T-313

  **Execute:**
  1. Add a "Print" button to the trip details page per UI spec
  2. Create CSS print stylesheet (`@media print`) for the trip details page
  3. Print view: trip header, calendar summary, flights table, stays table, activities by day
  4. Hide navigation, buttons, and interactive elements in print view
  5. Use light background, border separators, IBM Plex Mono for print
  6. Trigger browser print dialog on button click (`window.print()`)
  7. Add tests for print button rendering and print stylesheet class application

  **Acceptance criteria:**
  - Print button visible on trip details page
  - Print view renders all trip sections in clean, readable format
  - Dark theme elements hidden/inverted for print
  - Navigation and interactive elements hidden in print
  - Tests added and passing

  **Blocked By:** T-312, T-313

  **Files:** `frontend/src/`

---

### Phase 3 — QA + Verify (sequential)

- [ ] **T-316** — QA Engineer: Integration testing for Sprint 41 ← Blocked by T-314, T-315

  **Scope:**
  - Verify print button renders on trip details page
  - Verify print stylesheet applies correctly (inspect @media print rules)
  - Verify all trip sections appear in print view
  - Verify dark theme elements are properly inverted/hidden for print
  - Full test suite pass (backend + frontend)
  - Security checklist
  - Regression check on existing trip details page functionality

  **Acceptance criteria:**
  - All tests pass
  - Security checklist pass
  - Print view verified
  - No regressions on trip details page

  **Blocked By:** T-314, T-315

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-317** — Deploy Engineer: Staging deployment ← Blocked by T-316

  **Execute:**
  1. Rebuild frontend and backend from current branch
  2. Run full test suite — zero regressions required
  3. Deploy to staging (PM2)
  4. Run staging smoke tests

  **Acceptance criteria:**
  - Staging deployed with Sprint 41 code
  - All smoke tests pass

  **Blocked By:** T-316

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-318** — Monitor Agent: Staging health check ← Blocked by T-317

  **Scope:**
  - Full staging health check protocol
  - Verify print feature accessible on staging
  - Deploy Verified = Yes (Staging)

  **Acceptance criteria:**
  - All health checks pass
  - Deploy Verified = Yes (Staging)

  **Blocked By:** T-317

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-319** — User Agent: Staging walkthrough ← Blocked by T-318

  **Scope:**
  - Test print button on trip details page
  - Test print view with populated trip (flights, stays, activities)
  - Test print view with empty trip (no flights/stays/activities)
  - Test print view with partial data (some sections populated)
  - Regression check: existing CRUD, calendar, auth
  - Submit feedback to feedback-log.md

  **Acceptance criteria:**
  - Print feature verified on staging
  - No Critical or Major regressions
  - Feedback submitted

  **Blocked By:** T-318

  **Files:** `.workflow/feedback-log.md`

---

## Out of Scope

- **Production deployment** — Sprint 41 delivers to staging. Production push in Sprint 42 after user verification.
- **PDF export** — Print via browser print dialog only. Native PDF generation is a future enhancement.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog; depends on B-020.
- **B-031 (activity location links)** — Backlog; P3.
- **B-036 (activity notes field)** — Backlog; minor.
- **FB-190 (dark/light mode toggle)** — Suggestion; requires theme system architecture.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Print view UI spec | T-312 |
| Backend Engineer | Export API contract + implementation | T-313, T-314 |
| Frontend Engineer | Print view UI implementation | T-315 |
| QA Engineer | Integration testing | T-316 |
| Deploy Engineer | Staging deployment | T-317 |
| Monitor Agent | Staging health check | T-318 |
| User Agent | Staging walkthrough | T-319 |
| Manager | Code review, triage T-319 feedback, Sprint 42 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-312 (Design: print spec) ──────────────────────────┐
T-313 (Backend: API contract) → T-314 (Backend: impl) ┤
                                                       ├─→ T-315 (Frontend: print UI) → T-316 (QA) → T-317 (Deploy) → T-318 (Monitor) → T-319 (User)
```

**Critical path:** T-312 + T-313 → T-315 → T-316 → T-317 → T-318 → T-319

---

## Definition of Done

*How do we know Sprint #41 is complete?*

- [ ] T-312: Print view spec published in ui-spec.md
- [ ] T-313: API contract decision documented in api-contracts.md
- [ ] T-314: Export endpoint implemented (or N/A if existing endpoints sufficient)
- [ ] T-315: Print view implemented with button, CSS print stylesheet, all sections, tests pass
- [ ] T-316: QA integration check pass, security checklist pass
- [ ] T-317: Staging deployed with Sprint 41 code
- [ ] T-318: Monitor staging health check — Deploy Verified = Yes (Staging)
- [ ] T-319: User Agent staging walkthrough — no Critical or Major regressions; feedback submitted
- [ ] T-319 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 41 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 42 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #41)

By end of Sprint #41, the following must be verifiable:

- [ ] **Print button on trip details page** — visible and functional
- [ ] **Print view renders all sections** — flights, stays, activities grouped by day, calendar summary
- [ ] **Print-friendly styling** — light background, clean typography, no interactive elements
- [ ] **Staging verified** — Deploy Verified = Yes (Staging) confirmed by Monitor Agent
- [ ] **User Agent verified on staging** — no Critical or Major issues
- [ ] **Test baseline maintained or grown** — zero regressions

---

## Blockers

- **No blockers on T-312, T-313.** Both can start immediately in parallel.
- **T-314 blocked by T-313.** Backend implementation depends on API contract decision.
- **T-315 blocked by T-312 + T-313.** Frontend needs both design spec and API contract.
- **T-316–T-319 sequential** as per standard pipeline.

---

*Sprint #40 archived to `.workflow/sprint-log.md` on 2026-03-30. Sprint #41 plan written by Manager Agent 2026-03-30.*

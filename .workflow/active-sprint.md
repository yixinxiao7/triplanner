# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #35 — 2026-03-23

**Sprint Goal:** Harden security with server-side input sanitization (FB-163) and improve calendar UX with clickable "+x more" overflow indicators (FB-135). Both are backlog items from prior sprints — no new features, focused on defense-in-depth and polish.

**Context:** Sprint 34 completed the production deployment and verification pipeline. Production is live, healthy, and verified with zero Critical or Major issues. The MVP is feature-complete. Sprint 35 shifts to hardening and polish: fixing the two longest-standing minor backlog items (FB-163 server-side XSS sanitization, FB-135 calendar overflow click-to-expand).

**Feedback Triage (Sprint 34 → Sprint 35):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-156–FB-162 | Positive | — | **Acknowledged** — 7 positive confirmations of production health |
| FB-163 | Security | Minor | **Acknowledged** — Backlog. Server-side XSS sanitization (defense-in-depth). Tasked as T-272 this sprint. |
| FB-164–FB-169 | Positive | — | **Acknowledged** — 6 positive confirmations |
| FB-170 | Suggestion | Suggestion | **Acknowledged** — SSR for landing pages, remains in backlog |

**No Critical or Major issues to address.** Sprint 35 pulls two Minor backlog items forward for polish.

---

## In Scope

### Phase 1 — Design Specs (no blockers — start immediately)

- [ ] **T-271** — Design Agent: UI spec for calendar "+x more" click-to-expand behavior (FB-135)

  **Context:** When a calendar day has more events than can fit, a "+x more" indicator is shown but is not interactive. Users should be able to click it to see all events for that day.

  **Deliver:**
  1. Add to `ui-spec.md` a new spec section describing the click-to-expand interaction for "+x more" indicators
  2. Define: click target area, expanded state (dropdown/popover/inline expand), dismiss behavior, mobile behavior, animation (150ms ease per design principles), accessibility (focus management, Escape to close)
  3. Ensure consistency with existing calendar pill styling and Japandi design language

  **Acceptance criteria:**
  - UI spec published in `ui-spec.md` with click-to-expand interaction fully defined
  - Desktop and mobile behaviors specified
  - Accessibility requirements documented

  **Files:** `ui-spec.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 2 — Implementation (parallel — after Phase 1 for frontend, immediate for backend)

- [ ] **T-272** — Backend Engineer: Server-side input sanitization for all user-provided text fields (FB-163)

  **Context:** FB-163 identified that XSS payloads (e.g. `<script>alert(1)</script>`) are stored in the database without sanitization. While React's JSX auto-escaping prevents exploitation in the current frontend, defense-in-depth requires sanitizing inputs server-side to protect against future non-React consumers (email templates, PDF exports, admin dashboards).

  **Execute:**
  1. Add an HTML sanitization utility (e.g. strip HTML tags from text fields, or use a library like `sanitize-html` or `xss`)
  2. Apply sanitization to all user-provided text fields across all models: trip name, trip notes, destinations, flight airline/flight_number/from_location/to_location, stay name/address, activity name/location, land travel departure_location/arrival_location
  3. Sanitization should strip HTML tags but preserve Unicode, emoji, and special characters (ampersands, quotes, etc.)
  4. Add backend tests for sanitization (XSS payloads stripped, Unicode preserved, empty strings handled)
  5. Do NOT sanitize fields that are not user-provided (IDs, timestamps, enums)

  **Acceptance criteria:**
  - All user-provided text fields sanitized before database insertion
  - XSS payloads (`<script>`, `<img onerror>`, etc.) stripped from stored data
  - Unicode, emoji, and legitimate special characters preserved
  - Backend tests cover sanitization for each model
  - No regressions in existing 410 backend tests

  **Blocked By:** None — can start immediately

  **Files:** Backend model files, validation middleware, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-273** — Frontend Engineer: Calendar "+x more" click-to-expand (FB-135) ← Blocked by T-271

  **Context:** The TripCalendar component shows "+x more" when a day has more events than fit in the cell, but clicking it does nothing. Implement the interaction defined in T-271's UI spec.

  **Execute:**
  1. Implement click handler on "+x more" indicator in `TripCalendar.jsx`
  2. On click, show expanded view (popover/dropdown/inline — per T-271 spec) listing all events for that day
  3. Dismiss on click outside, Escape key, or clicking another day
  4. Mobile: adapt per T-271 spec (likely inline expand or bottom sheet)
  5. Add frontend tests for the new interaction
  6. Ensure animation follows design principles (150ms ease)

  **Acceptance criteria:**
  - "+x more" is clickable and expands to show all events for that day
  - Expanded view matches T-271 spec styling
  - Dismiss behavior works (click outside, Escape, click another day)
  - Mobile responsive
  - Accessible (focus management, keyboard navigation)
  - Frontend tests cover expand/collapse/dismiss
  - No regressions in existing 501 frontend tests

  **Blocked By:** T-271

  **Files:** `frontend/src/components/TripCalendar.jsx`, tests, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 3 — QA + Deploy + Verify (sequential after Phase 2)

- [ ] **T-274** — QA Engineer: Security checklist + integration testing ← Blocked by T-272, T-273

  **Scope:**
  - Verify XSS sanitization works on all endpoints (attempt to store `<script>` tags, verify stripped)
  - Verify Unicode/emoji preservation after sanitization
  - Verify "+x more" calendar interaction works correctly
  - Run full test suite (backend + frontend + Playwright)
  - Security checklist PASS
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - All tests pass (backend + frontend + Playwright)
  - XSS sanitization verified on all user-facing text fields
  - Security checklist PASS
  - No regressions

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`

---

- [ ] **T-275** — Deploy Engineer: Sprint 35 staging deployment ← Blocked by T-274

  **Scope:**
  - Rebuild frontend and backend with latest changes
  - Deploy to staging (local Docker Compose)
  - Smoke test all endpoints
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - Staging deployed with Sprint 35 changes
  - Frontend and backend running
  - Smoke tests pass

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-276** — Monitor Agent: Staging health check ← Blocked by T-275

  **Scope:**
  - Full staging health check protocol
  - Verify XSS sanitization on staging (attempt to store `<script>` in trip name, verify stripped in response)
  - Playwright E2E tests (expect 4/4 PASS)
  - Deploy Verified = Yes (Staging)

  **Acceptance criteria:**
  - All staging endpoints healthy
  - XSS sanitization confirmed on staging
  - Playwright 4/4 PASS
  - Deploy Verified = Yes (Staging)

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-277** — User Agent: Sprint 35 staging walkthrough ← Blocked by T-276

  **Scope:**
  - Test XSS sanitization: create trip with `<script>` in name, verify tag stripped
  - Test "+x more" calendar click-to-expand: create enough events to trigger overflow, click "+x more", verify expanded view
  - Regression check: CRUD flows, calendar, auth
  - Submit feedback to `feedback-log.md`

  **Acceptance criteria:**
  - XSS sanitization verified from user perspective
  - Calendar "+x more" interaction works correctly
  - No Critical or Major regressions
  - Feedback submitted

  **Files:** `feedback-log.md`, `handoff-log.md`

---

## Out of Scope

- **Production deployment** — Sprint 35 changes will deploy to staging only. Production deploy in Sprint 36 after staging verification.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-032 (trip export/print)** — Deferred.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority for productivity tool.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | UI spec for calendar overflow click-to-expand | T-271 |
| Backend Engineer | Server-side XSS input sanitization | T-272 |
| Frontend Engineer | Calendar "+x more" click-to-expand interaction | T-273 |
| QA Engineer | Security checklist + integration testing | T-274 |
| Deploy Engineer | Staging deployment | T-275 |
| Monitor Agent | Staging health check | T-276 |
| User Agent | Staging walkthrough — verify sanitization + calendar UX | T-277 |
| Manager | Code review, triage T-277 feedback, Sprint 36 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-271 (Design: "+x more" click-to-expand spec)
    |
    T-273 (Frontend: implement "+x more" interaction)
        |
        T-274 (QA: security + integration) ← also depends on T-272
            |
            T-275 (Deploy: staging)
                |
                T-276 (Monitor: staging health check)
                    |
                    T-277 (User Agent: staging walkthrough)

T-272 (Backend: XSS sanitization) ← NO BLOCKERS, parallel with T-271/T-273
    |
    T-274 (QA: also blocked by T-272)
```

**Critical path:** T-271 → T-273 → T-274 → T-275 → T-276 → T-277
**Parallel work:** T-272 (backend) runs in parallel with T-271 + T-273 (design + frontend)

---

## Definition of Done

*How do we know Sprint #35 is complete?*

- [ ] T-271: UI spec for "+x more" click-to-expand published
- [ ] T-272: Server-side XSS sanitization implemented and tested
- [ ] T-273: Calendar "+x more" click-to-expand implemented and tested
- [ ] T-274: QA security checklist PASS, all tests pass, XSS sanitization verified
- [ ] T-275: Staging deployed with Sprint 35 changes
- [ ] T-276: Monitor staging health check — Deploy Verified = Yes (Staging)
- [ ] T-277: User Agent staging walkthrough — no Critical or Major issues; feedback submitted
- [ ] T-277 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 35 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 36 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #35)

By end of Sprint #35, the following must be verifiable:

- [ ] **XSS payloads stripped server-side** — Storing `<script>alert(1)</script>` in any text field results in the script tag being stripped from the stored/returned value
- [ ] **Unicode and emoji preserved** — `東京旅行 🗼` stored and returned correctly after sanitization
- [ ] **Calendar "+x more" is interactive** — Clicking the overflow indicator shows all events for that day
- [ ] **All tests pass** — Backend + frontend + Playwright, zero regressions
- [ ] **Staging verified** — Deploy Verified = Yes (Staging) confirmed

---

## Blockers

- **No blockers on T-271 or T-272.** Design and backend work can start immediately in parallel.
- **T-273 blocked by T-271.** Frontend needs the UI spec before implementing the interaction.
- **T-274 blocked by T-272 and T-273.** QA needs both backend and frontend changes complete.
- **T-275 → T-276 → T-277** — Sequential staging pipeline, standard flow.

---

*Sprint #34 archived to `.workflow/sprint-log.md` on 2026-03-23. Sprint #35 plan written by Manager Agent 2026-03-23.*

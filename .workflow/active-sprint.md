# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #40 — 2026-03-30

**Sprint Goal:** Deploy Sprint 39 trip notes feature to production, fix API contract docs drift (B-039/FB-237), and implement stay checkout time display on calendar (FB-189/B-040). Sprint 40 is a production deploy + one targeted UX enhancement.

**Context:** Sprint 39 successfully delivered trip notes (B-030) and triple-nested XSS fix (B-037) to staging. Deploy Verified = Yes (Staging). Zero Critical/Major issues. Sprint 40 promotes this to production, fixes the API docs inconsistency flagged in FB-237, and adds the calendar checkout time display (FB-189) — a long-standing Minor UX improvement from Sprint 35 that improves calendar information density.

**Feedback Triage (Sprint 39 → Sprint 40):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-224–FB-236, FB-238 | Positive | — | **Acknowledged** — all confirmations, no action needed |
| FB-237 | UX Issue | Minor | **Acknowledged** → B-039 (docs fix, bundled into T-306 this sprint) |
| FB-189 | UX Issue | Minor | **Acknowledged** → B-040 (calendar enhancement, tasked as T-307–T-310) |
| FB-190 | Feature Gap | Suggestion | **Acknowledged** — dark/light mode toggle, backlog for future sprint |

**No Critical or Major bugs. Sprint 40 combines production deploy with one UX enhancement.**

---

## In Scope

### Phase 1 — Production Deploy + Verify (start immediately)

- [ ] **T-305** — Deploy Engineer: Production deployment of Sprint 39 code

  **Context:** Sprint 39 staging is verified (T-303 Deploy Verified = Yes). Push to production.

  **Execute:**
  1. Rebuild backend and frontend from current branch
  2. Run full test suite (1036+ tests) — zero regressions required
  3. Deploy to production (PM2)
  4. No new migrations needed (notes column exists since Sprint 7)
  5. Run production smoke tests: trip notes CRUD, sanitizer, auth, existing features

  **Acceptance criteria:**
  - Production deployed with Sprint 39 code
  - All smoke tests pass
  - Trip notes CRUD works on production
  - Triple-nested XSS fix verified on production

  **Blocked By:** None

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-306** — Backend Engineer: Fix API contract docs drift (FB-237/B-039)

  **Context:** FB-237 flagged that Sprint 7/8/20 contract sections in api-contracts.md still reference "max 2000" for notes when Sprint 39 T-298 updated the limit to 5000. Fix all historical references.

  **Execute:**
  1. Search api-contracts.md for all references to notes "max 2000" or "2000 characters"
  2. Update to "max 5000" or add "[Updated Sprint 39: limit increased to 5000]" annotations
  3. Ensure no contradictory limits remain in the document

  **Acceptance criteria:**
  - All notes character limit references in api-contracts.md are consistent (5000)
  - No contradictory documentation remains
  - Reviewed by Manager

  **Blocked By:** None

  **Files:** `.workflow/api-contracts.md`

---

### Phase 2 — Calendar Enhancement: Stay Checkout Time (after Phase 1 starts)

- [ ] **T-307** — Design Agent: UI spec for stay checkout time on calendar (FB-189/B-040)

  **Context:** FB-189 requests that stay events on the calendar display checkout time on the end date, matching how flights show "Arrives {time}" and land travel shows "Arrives/Drop-off {time}". Needs a spec update.

  **Execute:**
  1. Update calendar spec in ui-spec.md to add checkout time display for STAY end days
  2. Define label format (e.g., "Checkout 11:00a") consistent with existing FLIGHT and LAND_TRAVEL patterns
  3. Cover both desktop calendar grid and mobile day list

  **Acceptance criteria:**
  - UI spec updated with stay checkout time display on calendar end days
  - Label format consistent with existing event type patterns
  - Both desktop and mobile views covered

  **Blocked By:** None

  **Files:** `.workflow/ui-spec.md`

---

- [ ] **T-308** — Frontend Engineer: Implement stay checkout time on calendar ← Blocked by T-307

  **Execute:**
  1. Update `renderEventPill` (desktop calendar grid) to show checkout time on STAY end days
  2. Update `MobileDayList` to show checkout time on STAY end days
  3. Follow the existing pattern used for FLIGHT ("Arrives {time}") and LAND_TRAVEL ("Arrives/Drop-off {time}")
  4. Add tests for the new checkout time display

  **Acceptance criteria:**
  - STAY end days show "Checkout {time}" on desktop calendar
  - STAY end days show "Checkout {time}" on mobile day list
  - Existing FLIGHT and LAND_TRAVEL end-day labels unaffected
  - Tests added and passing

  **Blocked By:** T-307

  **Files:** `frontend/src/`

---

### Phase 3 — QA + Production Verify (sequential)

- [ ] **T-309** — QA Engineer: Integration testing for Sprint 40 ← Blocked by T-305, T-306, T-308

  **Scope:**
  - Verify production deployment health (T-305)
  - Verify API contract docs consistency (T-306)
  - Verify stay checkout time on calendar — desktop and mobile (T-308)
  - Full test suite pass (backend + frontend)
  - Security checklist
  - Regression check on existing calendar event types

  **Acceptance criteria:**
  - All tests pass
  - Security checklist pass
  - Stay checkout time verified on calendar
  - No regressions on FLIGHT or LAND_TRAVEL end-day labels

  **Blocked By:** T-305, T-306, T-308

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-310** — Monitor Agent: Production health check ← Blocked by T-309

  **Scope:**
  - Full production health check protocol
  - Verify trip notes feature on production (Sprint 39 code)
  - Verify stay checkout time on calendar
  - Deploy Verified = Yes (Production)

  **Acceptance criteria:**
  - All health checks pass
  - Deploy Verified = Yes (Production)

  **Blocked By:** T-309

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-311** — User Agent: Production walkthrough ← Blocked by T-310

  **Scope:**
  - Test trip notes on production: add, edit, clear, character limit
  - Test stay checkout time on calendar (desktop + mobile)
  - Regression check: existing CRUD, calendar, auth
  - Submit feedback to feedback-log.md

  **Acceptance criteria:**
  - Trip notes feature verified on production
  - Stay checkout time verified on calendar
  - No Critical or Major regressions
  - Feedback submitted

  **Blocked By:** T-310

  **Files:** `.workflow/feedback-log.md`

---

## Out of Scope

- **FB-190 (dark/light mode toggle)** — Suggestion; requires theme system architecture. Backlog for a future sprint.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog; depends on B-020.
- **B-032 (trip export/print)** — Deferred.
- **B-036 (activity notes field)** — Backlog; minor.
- **B-038 (rate limiter testing friction)** — Backlog; not a bug.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Stay checkout time spec | T-307 |
| Backend Engineer | API contract docs fix | T-306 |
| Frontend Engineer | Stay checkout time UI | T-308 |
| QA Engineer | Integration testing | T-309 |
| Deploy Engineer | Production deployment | T-305 |
| Monitor Agent | Production health check | T-310 |
| User Agent | Production walkthrough | T-311 |
| Manager | Code review, triage T-311 feedback, Sprint 41 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-305 (Deploy: production) ──────────────────────────────────────────┐
T-306 (Backend: API docs fix) ───────────────────────────────────────┤
T-307 (Design: checkout time spec) → T-308 (Frontend: checkout UI) ──┤
                                                                      ├─→ T-309 (QA) → T-310 (Monitor) → T-311 (User)
```

**Critical path:** T-307 → T-308 → T-309 → T-310 → T-311

---

## Definition of Done

*How do we know Sprint #40 is complete?*

- [ ] T-305: Production deployed with Sprint 39 code, smoke tests pass
- [ ] T-306: API contract docs consistent (all notes references say max 5000)
- [ ] T-307: Stay checkout time spec published in ui-spec.md
- [ ] T-308: Stay checkout time implemented on desktop + mobile calendar, tests pass
- [ ] T-309: QA integration check pass, security checklist pass
- [ ] T-310: Monitor production health check — Deploy Verified = Yes (Production)
- [ ] T-311: User Agent production walkthrough — no Critical or Major regressions; feedback submitted
- [ ] T-311 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 40 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 41 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #40)

By end of Sprint #40, the following must be verifiable:

- [ ] **Trip notes live on production** — Sprint 39 code deployed and verified
- [ ] **Stay checkout time on calendar** — end-day STAY events show checkout time
- [ ] **API docs consistent** — no contradictory character limits in api-contracts.md
- [ ] **Production verified** — Deploy Verified = Yes (Production) confirmed by Monitor Agent
- [ ] **User Agent verified on production** — no Critical or Major issues
- [ ] **Test baseline maintained or grown** — zero regressions

---

## Blockers

- **No blockers on T-305, T-306, T-307.** All three can start immediately in parallel.
- **T-308 blocked by T-307.** Frontend needs checkout time spec first.
- **T-309 blocked by T-305 + T-306 + T-308.** QA needs production deployed and calendar feature complete.
- **T-310–T-311 sequential** as per standard pipeline.

---

*Sprint #39 archived to `.workflow/sprint-log.md` on 2026-03-30. Sprint #40 plan written by Manager Agent 2026-03-30.*

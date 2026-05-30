# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #43 — 2026-05-30

**Sprint Goal:** Pay down long-pending security debt and ship a high-value feature for the core persona. Two tracks:
1. **Dependency security hardening** — resolve the production-runtime npm audit advisories on the `express`/`body-parser`/`qs` chain (plus the `vite`/`ws` dev-tooling advisories). QA has flagged these for several sprints as needing a dedicated maintenance task.
2. **Activity notes (B-036)** — add a `notes` field to activities so detail-oriented travelers can attach reservation numbers, confirmation codes, dress codes, and context to each activity. The field is currently silently dropped — there is no `notes` column on the `activities` table, so a client-sent `notes` value never persists or returns.

**Context:** Sprint 42 closed cleanly — all 9 tasks Done, 1059/1059 tests, the print feature live on production, activity location links shipped and secured. Of 13 feedback entries (FB-263–FB-275), zero were Critical/Major bugs or feature gaps — all triaged to Acknowledged. With no critical feedback to address, Sprint 43 is driven by the two pieces of concrete technical debt above. Staging-only this sprint: Track 2 introduces a schema migration, so production promotion is deferred to Sprint 44 after staging verification.

**Feedback Triage (Sprint 42 → Sprint 43):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-263, FB-264, FB-268, FB-272, FB-273, FB-274 | Positive | — | **Acknowledged** — confirm correct B-031 implementation, validation, rate-limiting, a11y, print. |
| FB-265, FB-266, FB-267, FB-269, FB-270, FB-271 | Security | — | **Acknowledged** — all confirm defenses hold. |
| FB-275 | UX Issue | Suggestion | **Acknowledged** — trailing-punctuation-in-href; documented §34.2 tradeoff. Backlog for a future polish sprint. |

**No Critical or Major bugs or feature gaps from Sprint 42. Sprint 43 = security debt + B-036.**

**Manager schema approval:** Migration 011 (add nullable `notes` text column, max 2000 chars, to `activities`) is **pre-approved** in this plan. Backend Engineer must record it as an ADR in-task (rules.md #4).

---

## In Scope

### Phase 1 — Dependency Security Hardening (independent track, start immediately)

- [ ] **T-329** — Backend Engineer: Resolve production-runtime npm audit advisories

  **Context:** QA has flagged for several sprints that the `express`/`body-parser`/`qs` chain (production runtime) carries npm audit advisories (BE 6, FE 5 incl. `vite`/`ws` dev-tooling). This is the dedicated maintenance task to clear them.

  **Execute:**
  1. Run `npm audit` in `backend/` and `frontend/`; document the current advisories.
  2. Run `npm audit fix`; bump `express` (and its transitive `body-parser`/`qs`) to a patched version.
  3. Run the full test suite — zero regressions required.
  4. Verify the express bump does not break auth, CORS, rate-limiting, or error-handler middleware.
  5. Record the dependency bump as an ADR in `architecture-decisions.md`.

  **Acceptance criteria:**
  - Production-runtime advisories resolved (or explicitly documented as unfixable without a breaking change).
  - Full suite green (1059+ tests, 0 regressions).
  - Express bump verified against auth/CORS/rate-limit/error middleware.
  - ADR recorded.

  **Do NOT** bump a major version that breaks the API surface without flagging to Manager first.

  **Blocked By:** None

  **Files:** `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`, `.workflow/architecture-decisions.md`, `.workflow/qa-build-log.md`

---

### Phase 2 — Design + Backend for Activity Notes (B-036, parallel with Phase 1)

- [ ] **T-330** — Design Agent: UI spec for activity notes field (B-036)

  **Context:** Detail-oriented travelers want to attach context to activities (reservation #, confirmation code, dress code, "bring passport"). Design how a notes field appears in the activity edit form and on the Trip Details page + print view.

  **Execute:**
  1. Specify a multi-line notes textarea in the activity edit form (placeholder, max 2000 chars, optional char counter).
  2. Specify notes display under each activity on the Trip Details page (only when present).
  3. Specify print-view rendering (readable plain text).
  4. Apply Japandi conventions: 11px uppercase label, 2px radius, muted accent, generous spacing.
  5. Handle empty state and long-text overflow.

  **Acceptance criteria:**
  - UI spec published in `ui-spec.md`.
  - Edit-form input, Trip Details display, print behavior, and styling defined.
  - Empty + long-text handling specified.

  **Blocked By:** None

  **Files:** `.workflow/ui-spec.md`

---

- [ ] **T-331** — Backend Engineer: Activity notes — schema + API + implementation (B-036)

  **Context:** The `activities` table has no `notes` column; a client-sent `notes` value is silently dropped. Add the column and wire it through the API.

  **Execute:**
  1. Create migration 011 — add nullable `notes` text column (max 2000 chars) to `activities`, with up/down.
  2. Add `notes` to `activityValidationSchema` (nullable string, maxLength 2000).
  3. Add `notes` to `activitySanitizeConfig` and the PATCH sanitize fields (`sanitizeHtml` strips tags on write).
  4. Add `notes` to the POST insert, the `UPDATABLE` array, and the returned activity shape.
  5. Update `api-contracts.md` (T-006 activities section).
  6. Record the schema change as an ADR (rules.md #4) — Manager pre-approved in the plan.
  7. Add backend tests (round-trip, sanitize, max-length, null/omitted).

  **Acceptance criteria:**
  - `notes` round-trips through POST/PATCH/GET.
  - HTML stripped on write; `> 2000` chars → 400; null/omitted handled gracefully.
  - Migration 011 applies and rolls back cleanly.
  - API contract + ADR updated; backend tests added and passing.

  **Blocked By:** None

  **Files:** `backend/src/migrations/`, `backend/src/routes/activities.js`, `backend/src/middleware/sanitize.js` (if needed), backend tests, `.workflow/api-contracts.md`, `.workflow/architecture-decisions.md`

---

### Phase 3 — Frontend Implementation (after Phase 2)

- [ ] **T-332** — Frontend Engineer: Implement activity notes UI (B-036) ← Blocked by T-330, T-331

  **Execute:**
  1. Add a notes textarea to the activity edit form; include `notes` in the save payload.
  2. Render notes under each activity on the Trip Details page, only when non-empty.
  3. Render notes in the print view as readable text.
  4. Render notes as escaped text — no `dangerouslySetInnerHTML` (defense-in-depth alongside backend strip).
  5. Add unit/render tests (notes present/absent, long text, HTML payload renders inert).

  **Acceptance criteria:**
  - Notes persist via the edit form and display correctly on Trip Details + print.
  - HTML/script payload renders inert (no XSS).
  - Full FE suite green.

  **Blocked By:** T-330, T-331

  **Files:** `frontend/src/`

---

### Phase 4 — QA + Verify (sequential)

- [ ] **T-333** — QA Engineer: Integration testing + security checklist ← Blocked by T-329, T-331, T-332

  **Scope:**
  - T-329: confirm production-runtime advisories resolved; `npm audit` re-scan; 0 regressions.
  - B-036: notes round-trip end-to-end; HTML-sanitized on write, rendered inert on read; `> 2000` chars → 400.
  - Migration 011 applies and rolls back cleanly on a test DB.
  - Full test suite (backend + frontend), config consistency, security checklist.
  - Regression on activity CRUD + calendar.

  **Acceptance criteria:** All tests pass; security checklist pass; notes verified; advisories cleared; no regressions.

  **Blocked By:** T-329, T-331, T-332

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-334** — Deploy Engineer: Staging deployment incl. migration 011 ← Blocked by T-333

  **Execute:**
  1. Rebuild frontend and backend; run full suite (0 regressions).
  2. **Run migration 011 on the staging DB** (`npm run migrate`).
  3. Deploy to staging via PM2 (HTTPS be:3001 / fe:4173).
  4. Run smoke tests incl. notes round-trip.

  **Acceptance criteria:** Staging deployed with Sprint 43 code; migration 011 applied; all smoke tests pass; production untouched. Any infra/config change includes an ADR in-task.

  **Blocked By:** T-333

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-335** — Monitor Agent: Staging health check ← Blocked by T-334

  **Scope:** Full staging health protocol; confirm migration 011 applied (`migrate:status` 11/11, 0 pending); verify notes round-trips on staging; record **Deploy Verified = Yes (Staging)**.

  **Acceptance criteria:** All health checks pass; migration confirmed; Deploy Verified = Yes (Staging).

  **Blocked By:** T-334

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-336** — User Agent: Staging walkthrough ← Blocked by T-335

  **Scope:**
  - Test activity notes via the edit form (add/edit/clear), long notes, HTML/script payload (must render inert).
  - Test print view shows notes correctly.
  - Regression: activity CRUD, calendar, auth.
  - Submit feedback to `feedback-log.md`.

  **Acceptance criteria:** Notes feature verified on staging; no Critical or Major regressions; feedback submitted.

  **Blocked By:** T-335

  **Files:** `.workflow/feedback-log.md`

---

## Out of Scope

- **Production deployment of Sprint 43** — staging-only this sprint because Track 2 ships a schema migration; promote to production in Sprint 44 after staging verification.
- **Notes on flights / stays** — activities only this sprint.
- **B-020 (Redis rate limiter)** — backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — backlog; depends on B-020.
- **B-033 (ILIKE wildcard escaping)** — backlog; P3, no security impact (user-scoped).
- **FB-275 (trailing-punctuation trim on URLs)** — backlog; documented §34.2 tradeoff.
- **FB-190 (dark/light mode toggle)** — Suggestion; requires theme system architecture.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Dependency hardening + activity notes schema/API | T-329, T-331 |
| Design Agent | Activity notes UI spec | T-330 |
| Frontend Engineer | Activity notes UI | T-332 |
| QA Engineer | Integration testing + security checklist | T-333 |
| Deploy Engineer | Staging deployment (incl. migration 011) | T-334 |
| Monitor Agent | Staging health check | T-335 |
| User Agent | Staging walkthrough | T-336 |
| Manager | Code review, schema/ADR approval, triage T-336 feedback, Sprint 44 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-329 (Backend: dependency hardening) ──────────────────────────────────┐
T-330 (Design: notes spec) ──┐                                          │
T-331 (Backend: notes schema/API) ──┴─→ T-332 (Frontend: notes UI) ─────┴─→ T-333 (QA) → T-334 (Deploy: staging + migration 011) → T-335 (Monitor) → T-336 (User)
```

**Critical path:** (T-330 + T-331) → T-332 → T-333 → T-334 → T-335 → T-336
**Parallel track:** T-329 runs independently and must complete before T-333 (QA verifies the advisory fix alongside B-036).

---

## Definition of Done

*How do we know Sprint #43 is complete?*

- [ ] T-329: Production-runtime npm audit advisories resolved (or documented), ADR recorded, 0 regressions
- [ ] T-330: Activity notes spec published in `ui-spec.md`
- [ ] T-331: Migration 011 created; notes wired through API; contract + ADR updated; backend tests pass
- [ ] T-332: Notes UI implemented (edit form + Trip Details + print) with tests passing
- [ ] T-333: QA integration check pass; security checklist pass; advisories verified cleared
- [ ] T-334: Staging deployed; migration 011 applied; smoke tests pass
- [ ] T-335: Monitor staging health check — Deploy Verified = Yes (Staging); migration confirmed
- [ ] T-336: User Agent staging walkthrough — no Critical/Major regressions; feedback submitted
- [ ] T-336 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 43 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 44 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #43)

By end of Sprint #43, the following must be verifiable:

- [ ] **Dependency advisories cleared** — production-runtime `express`/`body-parser`/`qs` advisories resolved; `npm audit` re-scan confirms
- [ ] **Activity notes persist** — a note added in the edit form round-trips through POST/PATCH/GET and displays on Trip Details
- [ ] **Notes are safe** — HTML/script in a note is stripped on write and rendered inert; no XSS
- [ ] **Notes validation** — `> 2000` chars rejected with 400
- [ ] **Migration 011 clean** — applies and rolls back without data loss
- [ ] **Staging verified** — Deploy Verified = Yes (Staging) confirmed by Monitor Agent
- [ ] **User Agent verified on staging** — no Critical or Major issues
- [ ] **Test baseline maintained or grown** — zero regressions

---

## Blockers

- **No blockers on T-329, T-330, T-331.** All can start immediately in parallel.
- **T-332 blocked by T-330 + T-331.** Frontend needs both the notes spec and the API contract.
- **T-333 blocked by T-329, T-331, T-332.** QA verifies the dependency fix and the full notes feature together.
- **T-334–T-336 sequential** per the standard pipeline.

---

*Sprint #42 archived to `.workflow/sprint-log.md` on 2026-05-30. Sprint #43 plan written by Manager Agent 2026-05-30.*

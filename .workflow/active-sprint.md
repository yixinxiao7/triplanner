# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #39 — 2026-03-24

**Sprint Goal:** Add trip notes/description field (B-030) and improve sanitizer robustness for deeply nested XSS (B-037). Production is stable — Sprint 39 returns to feature development with one targeted security hardening task.

**Context:** Sprint 38 successfully deployed all Sprint 35+36+37 code to production. Production is verified healthy (Deploy Verified = Yes). No Critical or Major bugs. Two minor backlog items created (B-037 triple-nested XSS residual, B-038 rate limiter testing friction). Sprint 39 delivers the next MVP enhancement: trip notes/description field (B-030, long-deferred backlog item from Sprint 5). This is a vertical slice — design spec → API contract → backend → frontend → QA → deploy → monitor → user walkthrough.

**Feedback Triage (Sprint 38 → Sprint 39):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-209–FB-220, FB-223 | Positive | — | **Acknowledged** — all confirmations, no action needed |
| FB-221 | Security | Minor | **Acknowledged** → B-037 (backlog, bundled into T-296 this sprint for hardening) |
| FB-222 | UX Issue | Minor | **Acknowledged** → B-038 (backlog, not this sprint) |

**No Critical or Major bugs. Sprint 39 is feature-driven.**

---

## In Scope

### Phase 1 — Design Spec + API Contract (start immediately, in parallel)

- [ ] **T-296** — Backend Engineer: Harden sanitizer for triple-nested XSS (FB-221/B-037)

  **Context:** FB-221 reported that triple-level nested XSS (`<<<script>script>script>`) leaves residual angle bracket fragments in stored data. Not exploitable (React escapes output), but stored data looks messy. Current iterative sanitizer handles double-nesting but residual fragments appear at 3+ levels.

  **Execute:**
  1. Increase sanitization loop max passes or add post-loop cleanup for residual angle brackets
  2. Add test cases for 3-level and 4-level nested XSS patterns
  3. Ensure no false positives on legitimate content with angle brackets (math expressions like `3 < 5`)
  4. Run full backend test suite — zero regressions

  **Acceptance criteria:**
  - Triple-nested XSS patterns produce clean output (no residual fragments)
  - Legitimate angle bracket content preserved
  - All existing sanitizer tests still pass
  - New test cases added for 3+ level nesting

  **Blocked By:** None

  **Files:** `backend/src/middleware/`, `backend/src/__tests__/`, `dev-cycle-tracker.md`

---

- [ ] **T-297** — Design Agent: Design spec for trip notes/description field (B-030)

  **Context:** B-030 has been in the backlog since Sprint 5. Users want to store freeform notes (restaurant links, packing lists, travel tips) alongside trip details. This needs a UI spec before implementation.

  **Execute:**
  1. Add trip notes section to trip details page spec in `ui-spec.md`
  2. Define: placement on trip details page (below calendar, above flights), text area dimensions, character limit, empty state, edit inline vs. separate page
  3. Follow existing design conventions: Japandi aesthetic, IBM Plex Mono, dark mode palette, 4px grid

  **Acceptance criteria:**
  - UI spec for trip notes section published in `ui-spec.md`
  - Covers: layout, typography, empty state, edit behavior, character limit display
  - Reviewed by Manager

  **Blocked By:** None

  **Files:** `.workflow/ui-spec.md`

---

- [ ] **T-298** — Backend Engineer: API contract for trip notes field (B-030)

  **Context:** Add a `notes` field to the trip resource. Freeform text, optional, with a reasonable character limit.

  **Execute:**
  1. Update API contract in `api-contracts.md`: add `notes` (string, optional, max 5000 chars) to trip resource shape
  2. Update PATCH /trips/:id to accept `notes` field
  3. Define validation rules (max length, sanitization applies)

  **Acceptance criteria:**
  - API contract updated with `notes` field on trip resource
  - PATCH endpoint contract includes `notes` as updatable field
  - Max length and validation rules documented
  - Reviewed by Manager

  **Blocked By:** None

  **Files:** `.workflow/api-contracts.md`

---

### Phase 2 — Implementation (after specs approved)

- [ ] **T-299** — Backend Engineer: Implement trip notes field ← Blocked by T-298

  **Execute:**
  1. Create migration to add `notes` column (text, nullable) to trips table
  2. Update trip model to include `notes` in create/update/get operations
  3. Add validation (max 5000 chars, sanitize HTML)
  4. Update trip CRUD tests
  5. Run full test suite — zero regressions

  **Acceptance criteria:**
  - Migration adds `notes` column
  - GET /trips/:id returns `notes` field
  - PATCH /trips/:id accepts and persists `notes`
  - POST /trips creates trip with optional `notes`
  - XSS sanitization applies to `notes`
  - All tests pass

  **Blocked By:** T-298

  **Files:** `backend/src/`, `backend/migrations/`

---

- [ ] **T-300** — Frontend Engineer: Implement trip notes UI ← Blocked by T-297, T-299

  **Execute:**
  1. Add notes section to trip details page per UI spec (T-297)
  2. Inline editing: click to edit, auto-save on blur or Ctrl+Enter
  3. Character count display (current / 5000 max)
  4. Empty state with placeholder text
  5. Add tests for notes section

  **Acceptance criteria:**
  - Notes section renders on trip details page
  - Inline edit with save/cancel
  - Character limit enforced client-side
  - Empty state shown when no notes
  - Tests added and passing

  **Blocked By:** T-297, T-299

  **Files:** `frontend/src/`

---

### Phase 3 — QA + Deploy + Verify (sequential)

- [ ] **T-301** — QA Engineer: Integration testing for Sprint 39 ← Blocked by T-296, T-300

  **Scope:**
  - Verify trip notes CRUD (create, read, update, clear)
  - Verify XSS sanitization on notes field
  - Verify triple-nested XSS fix (T-296)
  - Full test suite pass (backend + frontend)
  - Security checklist
  - Config consistency check

  **Acceptance criteria:**
  - All tests pass
  - Security checklist pass
  - Trip notes integration verified
  - Triple-nested XSS residual fragments eliminated

  **Blocked By:** T-296, T-300

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-302** — Deploy Engineer: Staging deployment ← Blocked by T-301

  **Scope:**
  - Rebuild backend and frontend
  - Run migrations (add notes column)
  - Deploy to staging (PM2)
  - Smoke test trip notes + sanitizer fix

  **Acceptance criteria:**
  - Staging deployed with migration applied
  - Trip notes CRUD works on staging
  - Sanitizer fix verified on staging

  **Blocked By:** T-301

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-303** — Monitor Agent: Staging health check ← Blocked by T-302

  **Scope:**
  - Full staging health check protocol
  - Verify trip notes field in API responses
  - Verify triple-nested XSS fix
  - Deploy Verified = Yes (Staging)

  **Acceptance criteria:**
  - All health checks pass
  - Deploy Verified = Yes (Staging)

  **Blocked By:** T-302

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-304** — User Agent: Staging walkthrough ← Blocked by T-303

  **Scope:**
  - Test trip notes: add, edit, clear, character limit
  - Test XSS sanitization on notes
  - Regression check: existing CRUD, calendar, auth
  - Submit feedback to feedback-log.md

  **Acceptance criteria:**
  - Trip notes feature verified
  - No Critical or Major regressions
  - Feedback submitted

  **Blocked By:** T-303

  **Files:** `.workflow/feedback-log.md`

---

## Out of Scope

- **Production deployment** — Sprint 39 delivers to staging only. Production deploy in Sprint 40 after staging verification.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-032 (trip export/print)** — Deferred.
- **B-036 (activity notes field)** — Backlog; minor, not blocking.
- **B-038 (rate limiter testing friction)** — Backlog; not a bug.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Trip notes UI spec | T-297 |
| Backend Engineer | Sanitizer hardening + trip notes API + implementation | T-296, T-298, T-299 |
| Frontend Engineer | Trip notes UI | T-300 |
| QA Engineer | Integration testing | T-301 |
| Deploy Engineer | Staging deployment | T-302 |
| Monitor Agent | Staging health check | T-303 |
| User Agent | Staging walkthrough | T-304 |
| Manager | Code review, triage T-304 feedback, Sprint 40 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-296 (Backend: sanitizer hardening) ──────────────────────────────────────┐
T-297 (Design: trip notes spec) ─────────────────────────────────────┐     │
T-298 (Backend: trip notes API contract) → T-299 (Backend: impl) ──┤     │
                                                                     ├─→ T-301 (QA) → T-302 (Deploy) → T-303 (Monitor) → T-304 (User)
                                                  T-300 (Frontend) ──┘
                                                  ↑ Blocked by T-297 + T-299
```

**Critical path:** T-298 → T-299 → T-300 → T-301 → T-302 → T-303 → T-304

---

## Definition of Done

*How do we know Sprint #39 is complete?*

- [ ] T-296: Triple-nested XSS residual fragments eliminated, tests added
- [ ] T-297: Trip notes UI spec published in ui-spec.md
- [ ] T-298: Trip notes API contract published in api-contracts.md
- [ ] T-299: Trip notes backend implemented with migration, tests pass
- [ ] T-300: Trip notes frontend implemented per UI spec, tests pass
- [ ] T-301: QA integration check pass, security checklist pass
- [ ] T-302: Staging deployed with trip notes migration
- [ ] T-303: Monitor staging health check — Deploy Verified = Yes (Staging)
- [ ] T-304: User Agent staging walkthrough — no Critical or Major regressions; feedback submitted
- [ ] T-304 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 39 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 40 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #39)

By end of Sprint #39, the following must be verifiable:

- [ ] **Trip notes feature working on staging** — users can add, edit, and clear freeform notes on any trip
- [ ] **Triple-nested XSS fix verified** — no residual angle bracket fragments in stored data
- [ ] **Staging verified** — Deploy Verified = Yes (Staging) confirmed by Monitor Agent
- [ ] **User Agent verified on staging** — no Critical or Major issues
- [ ] **Test baseline maintained or grown** — zero regressions

---

## Blockers

- **No blockers on T-296, T-297, T-298.** All three can start immediately in parallel.
- **T-299 blocked by T-298.** Backend implementation needs API contract approved first.
- **T-300 blocked by T-297 + T-299.** Frontend needs both UI spec and backend API ready.
- **T-301 blocked by T-296 + T-300.** QA needs both the sanitizer fix and notes feature complete.
- **T-302–T-304 sequential** as per standard pipeline.

---

*Sprint #38 archived to `.workflow/sprint-log.md` on 2026-03-24. Sprint #39 plan written by Manager Agent 2026-03-24.*

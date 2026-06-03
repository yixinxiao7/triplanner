# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #44 — 2026-06-03

**Sprint Goal:** **Promote Sprint 43 to production.** Sprint 43 delivered activity notes (B-036, migration 011) and dependency security hardening, verified clean on staging but held back from production because the work introduces a schema migration. Sprint 44's primary objective is to ship that value to users: run migration 011 on the production DB, deploy the Sprint 43 backend+frontend to production, and verify end-to-end. Bundled with the promotion are two small maintenance items flagged during Sprint 43: the `vitest` dev-tooling advisory bump and the FB-290 contract-copy alignment.

**Context:** Sprint 43 closed cleanly — all 8 tasks Done, 1076/1076 tests, two-layer XSS defense on the new notes field, production-runtime advisories cleared to 0. Of 15 User Agent feedback entries (FB-276–FB-290), **zero were Critical/Major bugs or feature gaps** — 11 Positive, 3 Security-confirming, 1 cosmetic Suggestion (FB-290). With no critical feedback, Sprint 44 is driven by the deferred production promotion plus two pieces of concrete tech debt.

**Manager schema approval (rules.md #4):** Migration 011 (`activities.notes TEXT NULL`, max 2000 chars) was created and ADR'd (ADR-007) in Sprint 43 and verified reversible + applied on staging (11/11). **Running migration 011 on the production DB is pre-approved in this plan.** No new schema changes this sprint.

**Feedback Triage (Sprint 43 → Sprint 44):**

| Entry(ies) | Category | Severity | Disposition |
|------------|----------|----------|-------------|
| FB-276, FB-277, FB-278, FB-280, FB-281, FB-283, FB-284, FB-285, FB-287, FB-288, FB-289 | Positive | — | **Acknowledged** — confirm B-036 correctness, validation, unicode, Spec 35 conformance, print, regression-clean. |
| FB-279, FB-282, FB-286 | Security | — | **Acknowledged** — HTML strip on write, SQLi inert, auth + no cross-tenant leak all confirmed. |
| FB-290 | UX Issue | Suggestion | **Tasked (T-339)** — cosmetic doc-vs-impl 400-copy mismatch; trivial api-contracts.md alignment. |

**No Critical or Major bugs or feature gaps from Sprint 43.** Plus two carried tech-debt items from Sprint 43 CR notes: `vitest` advisory (T-340) and FB-290 copy fix (T-339).

---

## In Scope

### Phase 1 — Maintenance Fixes (independent, start immediately in parallel)

- [ ] **T-339** — Backend Engineer: FB-290 — align notes over-limit error copy with the contract

  **Context:** `api-contracts.md` documents the 400 body as `fields.notes: "Notes must be 2000 characters or fewer"`, but the live API returns `"Notes must not exceed 2000 characters"`. Cosmetic doc-vs-implementation drift; no user-facing impact.

  **Execute:**
  1. Pick one canonical string (prefer the implemented `"Notes must not exceed 2000 characters"` to avoid touching validated code paths) and make `api-contracts.md` match it exactly.
  2. If you instead change the implementation string, update the corresponding backend test assertion and re-run the suite.
  3. Grep for any other notes-validation copy references and align them.

  **Acceptance criteria:**
  - `api-contracts.md` notes over-limit example matches the live API string exactly.
  - No contradictory copy remains; if code changed, tests updated and green.

  **Blocked By:** None

  **Files:** `.workflow/api-contracts.md` (and, only if you change the string, `backend/src/routes/activities.js` or validation schema + tests)

---

- [ ] **T-340** — Backend Engineer: Bump `vitest` to ≥4.1.0 (GHSA-5xrq-8626-4rwp)

  **Context:** A `vitest` dev-tooling advisory (GHSA-5xrq-8626-4rwp) surfaced on the 2026-06-02 QA re-scan in both `backend/` and `frontend/`. Non-blocking (dev-only devDependency, reachable only via `vitest --ui`, absent from deployed artifacts) but flagged for a Sprint 44 maintenance task.

  **Execute:**
  1. Bump `vitest` to `≥4.1.0` (a minor bump within major v4 — low regression risk) in both `backend/` and `frontend/`.
  2. Run the full test suites in both apps — zero regressions required.
  3. Re-run `npm audit` in both apps; confirm the advisory is cleared and production-runtime chain remains 0 vulns.
  4. Record the bump as an ADR in `architecture-decisions.md`.

  **Acceptance criteria:**
  - `vitest` advisory cleared in both apps; production-runtime `npm audit` remains 0.
  - Full suites green (1076+ tests), zero regressions.
  - ADR recorded.

  **Do NOT** bump a major version or any other dependency that touches the deployed artifact without flagging to Manager first.

  **Blocked By:** None

  **Files:** `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`, `.workflow/architecture-decisions.md`, `.workflow/qa-build-log.md`

---

### Phase 2 — QA Gate (after Phase 1)

- [ ] **T-341** — QA Engineer: Integration testing + security checklist for Sprint 44 ← Blocked by T-339, T-340

  **Scope:**
  - Full test suite (backend + frontend) — confirm 1076+ green after the `vitest` bump, 0 regressions.
  - `npm audit` re-scan both apps — confirm `vitest` advisory cleared and production-runtime chain still 0 vulns.
  - Confirm FB-290 copy alignment (contract == live string); no contradictory copy.
  - **Production-readiness pre-check of the Sprint 43 code** that is about to be promoted: re-confirm B-036 notes round-trip, two-layer XSS defense, max-length validation, and that migration 011 is reversible.
  - Config consistency (PORT/SSL/CORS/docker) and security checklist.
  - Regression on activity CRUD + calendar.

  **Acceptance criteria:** All tests pass; security checklist pass; advisory cleared; FB-290 verified; Sprint 43 code cleared for production promotion.

  **Blocked By:** T-339, T-340

  **Files:** `.workflow/qa-build-log.md`

---

### Phase 3 — Production Deployment (after QA)

- [ ] **T-337** — Deploy Engineer: Production deployment of Sprint 43 (notes B-036 + dependency hardening) incl. migration 011 ← Blocked by T-341

  **Context:** Sprint 43 was staging-only because of migration 011. This task promotes the verified Sprint 43 build to production.

  **Execute:**
  1. Rebuild frontend and backend; run full suite (0 regressions).
  2. **Run migration 011 on the PRODUCTION DB** (`npm run migrate`) — verify `migrate:status` 11/11, 0 pending; confirm `activities.notes = text` nullable via information_schema.
  3. Deploy to production via PM2 (HTTPS be:3002 / fe:4174).
  4. Run production smoke tests incl. notes round-trip (create/HTML-strip/>2000→400/PATCH clear→null) and a standard CRUD/auth pass.
  5. Confirm staging remains healthy and that the deployed bundle hash matches the QA-verified artifact.

  **Acceptance criteria:** Production running Sprint 43 code; migration 011 applied on prod (11/11, 0 pending); all smoke tests pass; staging untouched/healthy. Any infra/config change must include an ADR in-task (rules.md #4).

  **Blocked By:** T-341

  **Files:** `.workflow/qa-build-log.md`

---

### Phase 4 — Verify (sequential)

- [ ] **T-338** — Monitor Agent: Production health check ← Blocked by T-337

  **Scope:** Full production health protocol (health, auth, key endpoints, no 5xx, PM2 stability, config consistency). Confirm migration 011 applied on production (`migrate:status` 11/11, 0 pending). Verify the activity notes feature round-trips on production. Record **Deploy Verified = Yes (Production)**.

  **Acceptance criteria:** All health checks pass; migration 011 confirmed on prod; notes verified live; Deploy Verified = Yes (Production).

  **Blocked By:** T-337

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-342** — User Agent: Production walkthrough ← Blocked by T-338

  **Scope:**
  - Test activity notes on production via the edit form (add/edit/clear), long notes, HTML/script payload (must render inert), print view shows notes.
  - Regression: activity CRUD, calendar, flights, stays, land-travel, auth.
  - Submit structured feedback to `feedback-log.md`.

  **Acceptance criteria:** Notes feature verified on production; no Critical or Major regressions; feedback submitted.

  **Blocked By:** T-338

  **Files:** `.workflow/feedback-log.md`

---

## Out of Scope

- **New features** — Sprint 44 is a promotion + maintenance sprint; no net-new product features. The MVP (auth, trips, flights, stays, activities, calendar, print, location links, notes) is complete.
- **New schema changes** — migration 011 is the only migration, already created in Sprint 43; no new migrations this sprint.
- **FB-189/B-041 (STAY checkout time on calendar end-day pills)** — Minor UX, backlog for a future polish sprint.
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
| Backend Engineer | FB-290 doc fix + `vitest` advisory bump | T-339, T-340 |
| QA Engineer | Integration + security; production-readiness pre-check | T-341 |
| Deploy Engineer | Production deployment incl. migration 011 on prod DB | T-337 |
| Monitor Agent | Production health check | T-338 |
| User Agent | Production walkthrough | T-342 |
| Design Agent | — (no UI work this sprint) | — |
| Frontend Engineer | — (no FE changes; T-339 is doc-only, T-340 dev-only) | — |
| Manager | Code review, ADR approval, triage T-342 feedback, Sprint 45 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-339 (Backend: FB-290 doc fix) ──┐
T-340 (Backend: vitest bump) ─────┴─→ T-341 (QA) → T-337 (Deploy: production + migration 011) → T-338 (Monitor) → T-342 (User)
```

**Critical path:** (T-339 + T-340) → T-341 → T-337 → T-338 → T-342
**Both Phase 1 tasks run in parallel and must complete before the QA gate (T-341).**

---

## Definition of Done

*How do we know Sprint #44 is complete?*

- [ ] T-339: api-contracts.md notes over-limit copy matches the live API string; tests green if code changed
- [ ] T-340: `vitest` bumped ≥4.1.0 in both apps; advisory cleared; ADR recorded; 0 regressions
- [ ] T-341: QA integration check pass; security checklist pass; advisory verified; Sprint 43 code cleared for prod
- [ ] T-337: Production deployed with Sprint 43 code; migration 011 applied on prod (11/11, 0 pending); smoke tests pass; staging untouched
- [ ] T-338: Monitor production health check — Deploy Verified = Yes (Production); migration confirmed
- [ ] T-342: User Agent production walkthrough — no Critical/Major regressions; feedback submitted
- [ ] T-342 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 44 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 45 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #44)

By end of Sprint #44, the following must be verifiable:

- [ ] **Activity notes live on production** — a note added in the edit form round-trips through POST/PATCH/GET and displays on Trip Details + print on production
- [ ] **Migration 011 on production** — applied cleanly (11/11, 0 pending); `activities.notes = text` nullable confirmed
- [ ] **Notes safe on production** — HTML/script stripped on write and rendered inert; >2000 chars → 400
- [ ] **Dependency advisories clear** — production-runtime `npm audit` 0 vulns; `vitest` advisory cleared
- [ ] **Contract copy aligned** — FB-290 resolved; no doc-vs-impl mismatch
- [ ] **Production verified** — Deploy Verified = Yes (Production) confirmed by Monitor Agent
- [ ] **User Agent verified on production** — no Critical or Major issues
- [ ] **Test baseline maintained or grown** — zero regressions (1076+ tests)

---

## Blockers

- **No blockers on T-339, T-340.** Both can start immediately in parallel.
- **T-341 blocked by T-339 + T-340.** QA verifies both maintenance fixes and re-confirms production-readiness together.
- **T-337 blocked by T-341.** Production promotion must not proceed until QA clears the build.
- **T-338, T-342 sequential** per the standard pipeline (rules.md #15: deploy not *complete* until Monitor verifies).

---

*Sprint #43 archived to `.workflow/sprint-log.md` on 2026-06-03. Sprint #44 plan written by Manager Agent 2026-06-03.*

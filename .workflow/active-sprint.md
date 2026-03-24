# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #36 — 2026-03-23

**Sprint Goal:** Deploy Sprint 35 hardening changes (XSS sanitization + calendar click-to-expand) to production, fix the long-standing page title/font branding bug (FB-188), and add post-sanitization validation for required fields (FB-178). Small, focused sprint — production deployment + two quick fixes + full verification pipeline.

**Context:** Sprint 35 completed successfully on staging: server-side XSS sanitization (T-272) and calendar "+x more" click-to-expand (T-273) are verified and ready for production. Two minor bugs were found: FB-188 (wrong page title "Plant Guardians" + wrong fonts) and FB-178 (post-sanitization empty name allowed). Both are quick fixes that should ship alongside the production deployment.

**Feedback Triage (Sprint 35 → Sprint 36):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-171–FB-177 | Positive | — | **Acknowledged** — XSS sanitization confirmed |
| FB-178 | Bug | Minor | **Acknowledged** → B-035 (Backlog). Promoted to T-278 this sprint — quick fix, ships with production deploy. |
| FB-179–FB-187 | Positive | — | **Acknowledged** — all confirmations |
| FB-188 | Bug | Minor | **Tasked** → T-279 this sprint — fix page title and font references |

**No Critical or Major issues to address.** Sprint 36 focuses on production deployment of Sprint 35 work + two minor bug fixes.

---

## In Scope

### Phase 1 — Bug Fixes (parallel — start immediately)

- [ ] **T-278** — Backend Engineer: Post-sanitization validation for required fields (FB-178)

  **Context:** FB-178 identified that `PATCH /api/v1/trips/:id` with `name: "<svg onload=alert(1)>"` sanitizes to `""` but stores the empty string because validation runs before sanitization. The fix is to either: (a) swap middleware order to sanitize → validate, or (b) add a post-sanitization check that rejects empty required fields.

  **Execute:**
  1. Adjust middleware ordering so that sanitization runs BEFORE validation on all endpoints, OR add a post-sanitization validation step
  2. Ensure that if a required field (e.g., trip name) becomes empty after sanitization, a 400 VALIDATION_ERROR is returned
  3. Add backend tests: PATCH trip name with all-HTML input → expect 400; POST trip with all-HTML name → expect 400
  4. Verify no regressions in existing 446 backend tests

  **Acceptance criteria:**
  - All-HTML required fields rejected with 400 after sanitization
  - Non-required fields (e.g., notes) can still be empty after sanitization
  - Backend tests cover the new behavior
  - No regressions

  **Blocked By:** None

  **Files:** Backend middleware/sanitize.js, route files, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-279** — Frontend Engineer: Fix page title and font references (FB-188)

  **Context:** FB-188 identified that `frontend/index.html` has `<title>Plant Guardians</title>` instead of "Triplanner", and loads Google Fonts for "DM Sans" and "Playfair Display" instead of "IBM Plex Mono" per the design context. This is a long-standing branding issue.

  **Execute:**
  1. Update `frontend/index.html` `<title>` to "Triplanner"
  2. Remove any Google Fonts `<link>` tags for "DM Sans" and "Playfair Display"
  3. Ensure IBM Plex Mono is the only font loaded (verify it's already imported via CSS or add the correct Google Fonts link)
  4. Update `<meta name="description">` if it references "Plant Guardians"
  5. Check for any favicon or manifest references that need updating
  6. Add or update frontend tests if applicable

  **Acceptance criteria:**
  - Page title shows "Triplanner"
  - Only IBM Plex Mono font loaded
  - No references to "Plant Guardians", "DM Sans", or "Playfair Display" in index.html
  - No regressions in existing 510 frontend tests

  **Blocked By:** None

  **Files:** `frontend/index.html`, possibly `frontend/src/index.css`, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 2 — QA + Deploy Staging (sequential after Phase 1)

- [ ] **T-280** — QA Engineer: Integration testing for Sprint 36 fixes ← Blocked by T-278, T-279

  **Scope:**
  - Verify post-sanitization validation: all-HTML required fields return 400
  - Verify page title and font corrections
  - Run full test suite (backend + frontend + Playwright)
  - Security checklist PASS
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - All tests pass (backend + frontend + Playwright)
  - Post-sanitization validation verified
  - Page branding verified
  - Security checklist PASS
  - No regressions

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`

---

- [ ] **T-281** — Deploy Engineer: Sprint 36 staging deployment ← Blocked by T-280

  **Scope:**
  - Rebuild frontend and backend with Sprint 36 changes
  - Deploy to staging (PM2)
  - Smoke test all endpoints including post-sanitization validation
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - Staging deployed with Sprint 36 changes
  - Frontend shows "Triplanner" title
  - All smoke tests pass
  - Post-sanitization validation confirmed on staging

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-282** — Monitor Agent: Staging health check ← Blocked by T-281

  **Scope:**
  - Full staging health check protocol
  - Verify page title is "Triplanner"
  - Verify post-sanitization validation (all-HTML name → 400)
  - Playwright E2E tests (expect 4/4 PASS)
  - Deploy Verified = Yes (Staging)

  **Acceptance criteria:**
  - All staging endpoints healthy
  - Page title verified
  - Post-sanitization validation confirmed
  - Playwright 4/4 PASS
  - Deploy Verified = Yes (Staging)

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 3 — Production Deployment + Verification (sequential after Phase 2)

- [ ] **T-283** — Deploy Engineer: Deploy to production (Render) ← Blocked by T-282

  **Scope:**
  - Merge feature branch to main via PR
  - Render auto-deploys from main
  - Verify production deployment completes
  - Smoke test production endpoints
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - PR merged to main
  - Render deployment successful
  - Production endpoints responding
  - XSS sanitization confirmed on production
  - Page title shows "Triplanner" on production

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-284** — Monitor Agent: Production health check ← Blocked by T-283

  **Scope:**
  - Full production health check protocol
  - Verify XSS sanitization on production
  - Verify post-sanitization validation on production
  - Verify page title on production
  - Deploy Verified = Yes (Production)

  **Acceptance criteria:**
  - All production endpoints healthy
  - XSS sanitization confirmed on production
  - Post-sanitization validation confirmed
  - Page title "Triplanner" confirmed
  - Deploy Verified = Yes (Production)

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-285** — User Agent: Production walkthrough ← Blocked by T-284

  **Scope:**
  - Test XSS sanitization on production
  - Test post-sanitization validation (all-HTML name → 400)
  - Verify page title and fonts
  - Test calendar "+x more" click-to-expand on production
  - Regression check: CRUD flows, calendar, auth
  - Submit feedback to `feedback-log.md`

  **Acceptance criteria:**
  - All Sprint 35+36 features verified on production
  - No Critical or Major regressions
  - Feedback submitted

  **Files:** `feedback-log.md`, `handoff-log.md`

---

## Out of Scope

- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-032 (trip export/print)** — Deferred.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority for productivity tool.
- **B-030 (trip notes/description field)** — Backlog; not prioritized this sprint.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Post-sanitization validation fix | T-278 |
| Frontend Engineer | Page title and font branding fix | T-279 |
| QA Engineer | Integration testing + security checklist | T-280 |
| Deploy Engineer | Staging deploy + production deploy | T-281, T-283 |
| Monitor Agent | Staging + production health checks | T-282, T-284 |
| User Agent | Production walkthrough | T-285 |
| Manager | Code review, triage T-285 feedback, Sprint 37 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-278 (Backend: post-sanitization validation) ──┐
                                                 ├── T-280 (QA) → T-281 (Deploy Staging) → T-282 (Monitor Staging)
T-279 (Frontend: page title/font fix) ──────────┘                                              |
                                                                                    T-283 (Deploy Production)
                                                                                                |
                                                                                    T-284 (Monitor Production)
                                                                                                |
                                                                                    T-285 (User Agent Production)
```

**Critical path:** T-278/T-279 (parallel) → T-280 → T-281 → T-282 → T-283 → T-284 → T-285

---

## Definition of Done

*How do we know Sprint #36 is complete?*

- [ ] T-278: Post-sanitization validation implemented and tested
- [ ] T-279: Page title and font references fixed
- [ ] T-280: QA security checklist PASS, all tests pass
- [ ] T-281: Staging deployed with Sprint 36 changes
- [ ] T-282: Monitor staging health check — Deploy Verified = Yes (Staging)
- [ ] T-283: Production deployed via Render
- [ ] T-284: Monitor production health check — Deploy Verified = Yes (Production)
- [ ] T-285: User Agent production walkthrough — no Critical or Major issues; feedback submitted
- [ ] T-285 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 36 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 37 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #36)

By end of Sprint #36, the following must be verifiable:

- [ ] **XSS sanitization live on production** — Sprint 35's server-side sanitization deployed and verified on production
- [ ] **Calendar "+x more" live on production** — Sprint 35's click-to-expand deployed and verified on production
- [ ] **Post-sanitization validation works** — All-HTML required fields (e.g., trip name `<script>alert(1)</script>`) return 400 VALIDATION_ERROR
- [ ] **Page title is "Triplanner"** — Not "Plant Guardians". IBM Plex Mono is the only font loaded.
- [ ] **All tests pass** — Backend + frontend + Playwright, zero regressions
- [ ] **Production verified** — Deploy Verified = Yes (Production) confirmed

---

## Blockers

- **No blockers on T-278 or T-279.** Both bug fixes can start immediately in parallel.
- **T-280 blocked by T-278 and T-279.** QA needs both fixes complete.
- **T-281 → T-282** — Sequential staging pipeline.
- **T-283 blocked by T-282.** Production deploy requires staging verification.
- **T-283 → T-284 → T-285** — Sequential production pipeline.

---

*Sprint #35 archived to `.workflow/sprint-log.md` on 2026-03-23. Sprint #36 plan written by Manager Agent 2026-03-23.*

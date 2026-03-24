# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #37 — 2026-03-24

**Sprint Goal:** Fix the nested XSS sanitization bypass (FB-191), deploy all Sprint 35+36 changes to production, and verify production health. Small, focused sprint — one security fix + production deployment + full verification pipeline.

**Context:** Sprint 36 completed staging verification successfully but held production deployment because FB-191 identified a nested/obfuscated XSS bypass in the single-pass regex sanitizer. The fix (T-286) must land before T-283 (production deploy) can proceed. T-283 and T-284 carry over from Sprint 36.

**Feedback Triage (Sprint 36 → Sprint 37):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-191 | Security | Major | **Tasked** → T-286 this sprint — fix nested XSS bypass |
| FB-192–FB-198 | Positive | — | **Acknowledged** — all confirmations |
| FB-199 | Bug | Minor | **Acknowledged** → B-036 (Backlog — activity notes field silently dropped) |

**One Major security issue to address.** Sprint 37 focuses on fixing the XSS bypass, then deploying everything to production.

---

## In Scope

### Phase 1 — Security Fix (start immediately)

- [ ] **T-286** — Backend Engineer: Fix nested/obfuscated XSS bypass in sanitizer (FB-191)

  **Context:** FB-191 identified that `<<script>script>alert(1)<</script>/script>` bypasses the single-pass regex sanitizer, reassembling into `<script>alert(1)</script>` after one strip pass. This violates the defense-in-depth contract (T-272).

  **Execute:**
  1. Modify `sanitizeHtml()` in `backend/src/middleware/sanitize.js` to run the tag-stripping regex in a loop until the output stabilizes (no more tags found), OR replace with a proper HTML parser (e.g., sanitize-html library)
  2. Add backend tests for nested tag patterns: `<<script>script>`, `<<b>img src=x>`, `<<<div>div>div>`, and other multi-level nesting
  3. Verify that legitimate text containing angle brackets (e.g., `"5 < 10"`, `"A > B"`) is preserved correctly
  4. Run full backend test suite — expect 471+ tests pass with zero regressions

  **Acceptance criteria:**
  - Nested/obfuscated HTML tags fully stripped after iterative sanitization
  - No valid HTML tags remain in stored values after sanitization
  - Legitimate angle bracket text preserved
  - Backend tests cover nested bypass patterns
  - No regressions in existing tests

  **Blocked By:** None

  **Files:** `backend/src/middleware/sanitize.js`, backend test files, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 2 — QA + Deploy Staging (sequential after Phase 1)

- [ ] **T-287** — QA Engineer: Integration testing for Sprint 37 XSS fix ← Blocked by T-286

  **Scope:**
  - Verify nested XSS bypass is fixed: `<<script>script>` patterns fully stripped
  - Run full test suite (backend + frontend + Playwright)
  - Security checklist PASS
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - All tests pass (backend + frontend + Playwright)
  - Nested XSS bypass verified fixed
  - Security checklist PASS
  - No regressions

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`

---

- [ ] **T-288** — Deploy Engineer: Sprint 37 staging deployment ← Blocked by T-287

  **Scope:**
  - Rebuild backend with Sprint 37 XSS fix
  - Deploy to staging (PM2)
  - Smoke test: verify nested XSS patterns are fully stripped
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - Staging deployed with Sprint 37 fix
  - Nested XSS bypass confirmed fixed on staging
  - All smoke tests pass

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-289** — Monitor Agent: Staging health check ← Blocked by T-288

  **Scope:**
  - Full staging health check protocol
  - Verify nested XSS bypass is fixed on staging
  - Playwright E2E tests (expect 4/4 PASS)
  - Deploy Verified = Yes (Staging)

  **Acceptance criteria:**
  - All staging endpoints healthy
  - Nested XSS bypass confirmed fixed
  - Playwright 4/4 PASS
  - Deploy Verified = Yes (Staging)

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 3 — Production Deployment + Verification (sequential after Phase 2)

- [ ] **T-290** — Deploy Engineer: Deploy to production (Render) ← Blocked by T-289

  **Scope:**
  - Merge feature branch to main via PR
  - Render auto-deploys from main
  - Verify production deployment completes
  - Smoke test production endpoints
  - Verify XSS sanitization (simple + nested patterns) on production
  - Verify page title "triplanner" on production
  - Log results in `qa-build-log.md`

  **Acceptance criteria:**
  - PR merged to main
  - Render deployment successful
  - Production endpoints responding
  - XSS sanitization (simple + nested) confirmed on production
  - Page title "triplanner" confirmed on production
  - Post-sanitization validation confirmed on production

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-291** — Monitor Agent: Production health check ← Blocked by T-290

  **Scope:**
  - Full production health check protocol
  - Verify nested XSS bypass is fixed on production
  - Verify post-sanitization validation on production
  - Verify page title on production
  - Deploy Verified = Yes (Production)

  **Acceptance criteria:**
  - All production endpoints healthy
  - Nested XSS bypass confirmed fixed on production
  - Post-sanitization validation confirmed
  - Page title "triplanner" confirmed
  - Deploy Verified = Yes (Production)

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-292** — User Agent: Production walkthrough ← Blocked by T-291

  **Scope:**
  - Test nested XSS bypass fix on production
  - Test post-sanitization validation on production
  - Verify page title and fonts on production
  - Test calendar "+x more" click-to-expand on production
  - Regression check: CRUD flows, calendar, auth
  - Submit feedback to `feedback-log.md`

  **Acceptance criteria:**
  - All Sprint 35+36+37 features verified on production
  - No Critical or Major regressions
  - Feedback submitted

  **Files:** `feedback-log.md`, `handoff-log.md`

---

## Out of Scope

- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-032 (trip export/print)** — Deferred.
- **B-036 (activity notes field)** — Backlog; minor, not blocking.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority for productivity tool.
- **B-030 (trip notes/description field)** — Backlog; not prioritized this sprint.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Fix nested XSS sanitization bypass | T-286 |
| QA Engineer | Integration testing + security checklist | T-287 |
| Deploy Engineer | Staging deploy + production deploy | T-288, T-290 |
| Monitor Agent | Staging + production health checks | T-289, T-291 |
| User Agent | Production walkthrough | T-292 |
| Manager | Code review, triage T-292 feedback, Sprint 38 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-286 (Backend: fix nested XSS) → T-287 (QA) → T-288 (Deploy Staging) → T-289 (Monitor Staging)
                                                                                    |
                                                                          T-290 (Deploy Production)
                                                                                    |
                                                                          T-291 (Monitor Production)
                                                                                    |
                                                                          T-292 (User Agent Production)
```

**Critical path:** T-286 → T-287 → T-288 → T-289 → T-290 → T-291 → T-292

---

## Definition of Done

*How do we know Sprint #37 is complete?*

- [ ] T-286: Nested XSS bypass fixed with iterative sanitization, tests added
- [ ] T-287: QA security checklist PASS, all tests pass
- [ ] T-288: Staging deployed with Sprint 37 fix
- [ ] T-289: Monitor staging health check — Deploy Verified = Yes (Staging)
- [ ] T-290: Production deployed via Render
- [ ] T-291: Monitor production health check — Deploy Verified = Yes (Production)
- [ ] T-292: User Agent production walkthrough — no Critical or Major issues; feedback submitted
- [ ] T-292 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 37 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 38 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #37)

By end of Sprint #37, the following must be verifiable:

- [ ] **Nested XSS bypass fixed** — `<<script>script>alert(1)<</script>/script>` and similar patterns fully stripped, no valid HTML tags in stored values
- [ ] **All Sprint 35+36 features live on production** — XSS sanitization, post-sanitization validation, calendar "+x more", page title "triplanner"
- [ ] **All tests pass** — Backend + frontend + Playwright, zero regressions
- [ ] **Production verified** — Deploy Verified = Yes (Production) confirmed

---

## Blockers

- **No blockers on T-286.** The XSS fix can start immediately.
- **T-287 blocked by T-286.** QA needs the fix complete.
- **T-288 → T-289** — Sequential staging pipeline.
- **T-290 blocked by T-289.** Production deploy requires staging verification.
- **T-290 → T-291 → T-292** — Sequential production pipeline.

---

*Sprint #36 archived to `.workflow/sprint-log.md` on 2026-03-24. Sprint #37 plan written by Manager Agent 2026-03-24.*

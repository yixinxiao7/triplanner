# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #42 — 2026-03-30

**Sprint Goal:** Promote Sprint 41 print feature to production and implement activity location links (B-031) — detect URLs in activity locations and render them as clickable links for improved usability.

**Context:** Sprint 41 closed cleanly with all 8 tasks Done, staging verified, and zero bugs. The print feature (PrintCalendarSummary, Spec 33) is ready for production deployment. Sprint 42 combines the production push with a small but high-value UX enhancement: clickable activity location links (B-031, P3, S complexity). This serves the target user persona who frequently pastes Google Maps links or addresses into activity locations.

**Feedback Triage (Sprint 41 → Sprint 42):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-252–FB-262 | Positive | — | **Acknowledged** — all 11 entries confirm print feature implementation. No action needed. |

**No Critical or Major bugs. Sprint 42 combines production deployment + small feature.**

---

## In Scope

### Phase 1 — Production Deployment of Sprint 41 (start immediately)

- [ ] **T-320** — Deploy Engineer: Production deployment of Sprint 41 code

  **Context:** Sprint 41 print feature was staged and verified. Promote to production.

  **Execute:**
  1. Rebuild frontend and backend from current branch
  2. Run full test suite — zero regressions required (1047+ tests)
  3. Deploy to production (PM2)
  4. Run production smoke tests

  **Acceptance criteria:**
  - Production deployed with Sprint 41 + any Sprint 42 code
  - All smoke tests pass
  - Frontend and backend online

  **Blocked By:** None

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-321** — Monitor Agent: Production health check

  **Scope:**
  - Full production health check protocol
  - Verify print feature accessible on production
  - Deploy Verified = Yes (Production)

  **Acceptance criteria:**
  - All health checks pass
  - Deploy Verified = Yes (Production)

  **Blocked By:** T-320

  **Files:** `.workflow/qa-build-log.md`

---

### Phase 2 — Design + API Contract for Activity Location Links (parallel with Phase 1)

- [ ] **T-322** — Design Agent: UI spec for activity location links (B-031)

  **Context:** Users paste Google Maps links or addresses into activity locations. Design how URLs in activity location fields should be detected and rendered as clickable links on the trip details page and print view.

  **Execute:**
  1. Define URL detection pattern (http/https URLs in location text)
  2. Specify how links render in the activity location field on trip details page (inline clickable link, opens in new tab)
  3. Specify how links render in print view (show URL text, not clickable)
  4. Define styling: link color (#5D737E accent), underline on hover, truncation for long URLs
  5. Handle mixed text + URL (e.g., "Senso-ji Temple https://maps.google.com/...")

  **Acceptance criteria:**
  - UI spec published in ui-spec.md
  - Link detection, rendering, print behavior, and styling defined
  - Mixed content (text + URL) handling specified

  **Blocked By:** None

  **Files:** `.workflow/ui-spec.md`

---

- [ ] **T-323** — Backend Engineer: API contract review for activity location links (B-031)

  **Context:** Activity locations are stored as plain text. Verify no backend changes are needed — URL detection and rendering is a frontend-only concern. Document the decision in api-contracts.md.

  **Execute:**
  1. Confirm activity location field is plain text (no HTML, no special processing needed)
  2. Confirm no backend changes needed — URL detection is purely frontend
  3. Document decision in api-contracts.md

  **Acceptance criteria:**
  - API contract documented: no backend changes needed for B-031
  - Decision recorded in api-contracts.md

  **Blocked By:** None

  **Files:** `.workflow/api-contracts.md`

---

### Phase 3 — Implementation (after Phase 2)

- [ ] **T-324** — Frontend Engineer: Implement activity location links ← Blocked by T-322, T-323

  **Execute:**
  1. Create a LinkifyText utility component that detects URLs in plain text and renders them as `<a>` tags
  2. Apply LinkifyText to activity location display on trip details page
  3. Links open in new tab (`target="_blank" rel="noopener noreferrer"`)
  4. Style links per UI spec (accent color, hover underline)
  5. In print view: show URL as text (no interactive link styling)
  6. Handle edge cases: multiple URLs, URL at start/end, no URLs (passthrough)
  7. Add tests for LinkifyText component and integration

  **Acceptance criteria:**
  - URLs in activity locations are clickable on trip details page
  - Links open in new tab with security attributes
  - Print view shows URL text without interactive styling
  - Mixed text + URL renders correctly
  - Tests added and passing

  **Blocked By:** T-322, T-323

  **Files:** `frontend/src/`

---

### Phase 4 — QA + Verify (sequential)

- [ ] **T-325** — QA Engineer: Integration testing for Sprint 42 ← Blocked by T-324

  **Scope:**
  - Verify activity location links render correctly on trip details page
  - Verify links open in new tab with proper security attributes
  - Verify print view shows URL text without interactive styling
  - Verify production deployment health (print feature + location links)
  - Full test suite pass (backend + frontend)
  - Security checklist (XSS prevention in URL rendering — no javascript: or data: URLs)
  - Regression check on existing activity CRUD and trip details page

  **Acceptance criteria:**
  - All tests pass
  - Security checklist pass
  - Location links verified
  - No regressions

  **Blocked By:** T-324

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-326** — Deploy Engineer: Staging deployment ← Blocked by T-325

  **Execute:**
  1. Rebuild frontend and backend from current branch
  2. Run full test suite — zero regressions required
  3. Deploy to staging (PM2)
  4. Run staging smoke tests

  **Acceptance criteria:**
  - Staging deployed with Sprint 42 code (location links)
  - All smoke tests pass

  **Blocked By:** T-325

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-327** — Monitor Agent: Staging health check ← Blocked by T-326

  **Scope:**
  - Full staging health check protocol
  - Verify location links feature accessible on staging
  - Deploy Verified = Yes (Staging)

  **Acceptance criteria:**
  - All health checks pass
  - Deploy Verified = Yes (Staging)

  **Blocked By:** T-326

  **Files:** `.workflow/qa-build-log.md`

---

- [ ] **T-328** — User Agent: Staging walkthrough ← Blocked by T-327

  **Scope:**
  - Test activity location links with various URL formats (Google Maps, plain https, no URL)
  - Test mixed content (text + URL)
  - Test print view shows URL text correctly
  - Verify production print feature works end-to-end
  - Regression check: existing CRUD, calendar, auth, print
  - Submit feedback to feedback-log.md

  **Acceptance criteria:**
  - Location links feature verified on staging
  - Production print feature verified
  - No Critical or Major regressions
  - Feedback submitted

  **Blocked By:** T-327

  **Files:** `.workflow/feedback-log.md`

---

## Out of Scope

- **PDF export** — Print via browser print dialog only. Native PDF generation is a future enhancement.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog; depends on B-020.
- **B-036 (activity notes field)** — Backlog; minor.
- **FB-190 (dark/light mode toggle)** — Suggestion; requires theme system architecture.
- **FB-170 (SSR for landing pages)** — Suggestion; low priority.
- **B-033 (ILIKE wildcard escaping)** — Backlog; P3, no security impact (user-scoped).

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Location links UI spec | T-322 |
| Backend Engineer | API contract review (location links) | T-323 |
| Frontend Engineer | Location links implementation | T-324 |
| QA Engineer | Integration testing | T-325 |
| Deploy Engineer | Production deployment + staging deployment | T-320, T-326 |
| Monitor Agent | Production + staging health checks | T-321, T-327 |
| User Agent | Staging walkthrough | T-328 |
| Manager | Code review, triage T-328 feedback, Sprint 43 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-320 (Deploy: production) → T-321 (Monitor: production health) ─────────────────┐
T-322 (Design: location links spec) ─────────────────────────────────────────────┐ │
T-323 (Backend: API contract review) ────────────────────────────────────────────┤ │
                                                                                  ├─→ T-324 (Frontend: location links) → T-325 (QA) → T-326 (Deploy: staging) → T-327 (Monitor: staging) → T-328 (User)
```

**Critical path:** T-322 + T-323 → T-324 → T-325 → T-326 → T-327 → T-328
**Parallel track:** T-320 → T-321 (production deployment runs independently)

---

## Definition of Done

*How do we know Sprint #42 is complete?*

- [ ] T-320: Production deployed with Sprint 41 print feature
- [ ] T-321: Monitor production health check — Deploy Verified = Yes (Production)
- [ ] T-322: Location links spec published in ui-spec.md
- [ ] T-323: API contract decision documented in api-contracts.md
- [ ] T-324: Location links implemented with tests passing
- [ ] T-325: QA integration check pass, security checklist pass
- [ ] T-326: Staging deployed with Sprint 42 code
- [ ] T-327: Monitor staging health check — Deploy Verified = Yes (Staging)
- [ ] T-328: User Agent staging walkthrough — no Critical or Major regressions; feedback submitted
- [ ] T-328 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] Sprint 42 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 43 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #42)

By end of Sprint #42, the following must be verifiable:

- [ ] **Print feature live on production** — Deploy Verified = Yes (Production)
- [ ] **Activity location links clickable** — URLs in activity locations open in new tab
- [ ] **Print view handles links correctly** — URL text shown, not interactive
- [ ] **Security: no XSS via URL injection** — javascript: and data: URLs blocked
- [ ] **Staging verified** — Deploy Verified = Yes (Staging) confirmed by Monitor Agent
- [ ] **User Agent verified on staging** — no Critical or Major issues
- [ ] **Test baseline maintained or grown** — zero regressions

---

## Blockers

- **No blockers on T-320, T-322, T-323.** All can start immediately in parallel.
- **T-321 blocked by T-320.** Production health check depends on production deployment.
- **T-324 blocked by T-322 + T-323.** Frontend needs both design spec and API contract.
- **T-325–T-328 sequential** as per standard pipeline.

---

*Sprint #41 archived to `.workflow/sprint-log.md` on 2026-03-30. Sprint #42 plan written by Manager Agent 2026-03-30.*

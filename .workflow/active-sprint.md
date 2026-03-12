# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #29 — 2026-03-12

**Sprint Goal:** Achieve a clean Deploy Verified = Yes status on staging by fixing the Playwright E2E Test 2 locator bug (FB-124/T-235) — the sole remaining QA gate blocking full staging verification. Once the locator is fixed and the Monitor Agent confirms 4/4 Playwright, staging will be fully verified and the application will be in a production-ready state pending project owner action on T-224 (AWS RDS + Render provisioning, 4th escalation).

**Context:** Sprint 28 delivered the T-229 trip date COALESCE fix cleanly — User Agent confirmed all three scenarios pass and zero regressions exist. The application is MVP feature-complete. The only open engineering item is a test-code locator bug in `e2e/critical-flows.spec.js` (not an application bug) that prevents `npx playwright test` from reaching 4/4. This was introduced in Sprint 27 when TripCalendar began rendering airport codes in additional DOM elements, making the pre-existing `getByText('SFO')` locator ambiguous. All other health checks pass cleanly.

**Feedback Triage (Sprint 28 → Sprint 29):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| Monitor Alert Sprint #28 (Playwright locator) | Monitor Alert | Major | **Tasked → T-235** | `getByText('SFO')` resolves to 3 elements — TripCalendar adds airport codes to pills and MobileDayList. Test-code fix needed. |
| FB-123 (T-229 COALESCE fix working) | Positive | — | Acknowledged | Trip date "Set dates" UI fully functional end-to-end. |
| FB-124 (Playwright locator bug) | Bug | Major | **Tasked → T-235** | Same root cause as Monitor Alert. Test 2 fails; application is correct. |
| FB-125 (Calendar endpoint regression-free) | Positive | — | Acknowledged | GET /api/v1/trips/:id/calendar returns correct events after tripModel.js change. |
| FB-126 (Validation + security edge cases) | Positive | — | Acknowledged | All date validation + security edge cases pass. |
| FB-127 (StatusFilterTabs + notes regression-free) | Positive | — | Acknowledged | Status filtering and notes unaffected by COALESCE change. |
| FB-128 (Rate limiter triggered during testing) | UX Issue | Minor | Acknowledged (B-020 backlog) | In-memory store resets on restart; Redis-backed limiter on backlog. |

---

## In Scope

### Phase 1 — Playwright Locator Fix (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-235** — QA Engineer: Fix `e2e/critical-flows.spec.js` Playwright Test 2 locator (FB-124) ← **NO DEPENDENCIES — START IMMEDIATELY**

  **Root Cause:** Sprint 27 TripCalendar feature renders flight `arrival_airport` ('SFO') and `departure_airport` ('JFK') in multiple DOM elements:
  1. `<span>` inside flight calendar event pill (TripCalendar)
  2. `<span>` inside MobileDayList event title (TripCalendar)
  3. `<div class="_airportCode_...">SFO</div>` (flight card in flights section)

  The pre-existing `page.getByText('SFO')` locator at `e2e/critical-flows.spec.js:202` was written before TripCalendar and now resolves to 3 elements, triggering Playwright strict mode violation.

  **Fix (test-code only — no app changes):**
  ```js
  // Before (ambiguous):
  await expect(page.getByText('JFK')).toBeVisible();
  await expect(page.getByText('SFO')).toBeVisible();

  // After (scoped to flight card airport code element):
  await expect(page.locator('[class*="_airportCode_"]').filter({ hasText: 'JFK' }).first()).toBeVisible();
  await expect(page.locator('[class*="_airportCode_"]').filter({ hasText: 'SFO' }).first()).toBeVisible();
  ```
  Alternative: if `data-testid="airport-code"` is available on the airport code div in the flight card, use that instead.

  **Acceptance criteria:**
  1. `npx playwright test` from project root → **4/4 PASS** (no failures)
  2. No changes to any application source files (`frontend/`, `backend/`, `shared/`)
  3. Log fix and test results in `qa-build-log.md` Sprint 29 section
  4. Handoff to Monitor Agent (T-236)

  **Files:** `e2e/critical-flows.spec.js` lines 201–202 only

---

### Phase 2 — Monitor Health Check (after T-235)

- [ ] **T-236** — Monitor Agent: Full staging health check post-Playwright fix ← Blocked by T-235

  Full health check protocol:
  - GET `/api/v1/health` → 200 ✅
  - CORS header → `Access-Control-Allow-Origin: https://localhost:4173` ✅
  - Login with `test@triplanner.local` → 200 + access token ✅
  - GET `/api/v1/trips` → 200 ✅
  - GET `/api/v1/trips/:id/calendar` → 200 ✅
  - **`npx playwright test` → 4/4 PASS** ← required for Deploy Verified = Yes
  - Regression: PATCH `/api/v1/trips/:id` with `{"start_date":"2026-09-01","end_date":"2026-09-30"}` → user values returned (T-229 check)
  - Log results in `qa-build-log.md` Sprint 29 section
  - If 4/4 PASS: mark **Deploy Verified = Yes**, handoff to User Agent (T-237)
  - If still failing: escalate to Manager before proceeding

---

### Phase 3 — User Agent Final Verification (after T-236, if Deploy Verified = Yes)

- [ ] **T-237** — User Agent: Sprint 29 quick regression verification ← Blocked by T-236

  **Scope:** Confirm no visible application regressions from the Playwright test-code change (which touches no app code). Quick pass only.
  1. Login with test account → home page shows trips ✅
  2. Navigate to a trip with a flight → confirm flight card shows airport codes (JFK, SFO) correctly in the flights section ✅
  3. Confirm TripCalendar renders the flight event as a calendar pill ✅
  4. Confirm "Set dates" UI still works (PATCH trip with start_date/end_date → correct dates returned) ✅
  5. Submit structured feedback to `feedback-log.md` under **"Sprint 29 User Agent Feedback"**

---

### Phase 4 — Production Deployment (P1 — project owner gate — parallel with all phases)

> ⚠️ **PROJECT OWNER ACTION REQUIRED (FOURTH ESCALATION):**
> T-224 has been blocked for four consecutive sprints (Sprints 25, 26, 27, 28). All engineering work is 100% complete. The project owner must take the following human-only actions:
> 1. **AWS:** Create an RDS PostgreSQL 15 instance (db.t3.micro, us-east-1, free tier) and provide the connection string
> 2. **Render:** Apply the `render.yaml` Blueprint to provision frontend (static site) and backend (web service), both in Ohio region, free plan
>
> Documents ready: `render.yaml`, `docs/production-deploy-guide.md`, `backend/knexfile.js` (SSL + pool), `backend/src/app.js` (SameSite=None cookie for production). No agent can provision external cloud infrastructure.

- [ ] **T-224** — Deploy Engineer: Production deployment to Render + AWS RDS ← Blocked on project owner
  - Follow `docs/production-deploy-guide.md` step by step
  - Run migrations against AWS RDS on first deploy
  - Verify: `GET https://<render-backend>.onrender.com/api/v1/health` → 200

- [ ] **T-225** — Monitor Agent: Post-production health check ← Blocked by T-224
  - Full health check on production URLs (Render frontend + backend)
  - Confirm `SameSite=None; Secure` cookie is sent correctly in cross-origin flow
  - Confirm CORS header set to Render frontend URL

---

## Out of Scope

- **New features** — Application is MVP feature-complete; no new feature work until production is deployed and stable.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store is sufficient for current staging scale. Prioritize after production deployment.
- **B-024 (per-account rate limiting)** — Backlog.
- **FB-121 (stay category case normalization)** — Minor UX; external API consumers only. Backlog.
- **knexfile staging seeds config** — Workaround exists (`NODE_ENV=development`). Not this sprint.
- **MFA, home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| QA Engineer | Fix Playwright E2E locator bug | T-235 |
| Monitor Agent | Staging health check (after Playwright fix); production health check (if T-224 unblocked) | T-236, T-225 |
| User Agent | Quick regression verification after Playwright fix | T-237 |
| Deploy Engineer | Production deployment (if project owner unblocks T-224) | T-224 |
| Manager | Triage T-237 feedback; Sprint 29 closeout | Reviews |
| Backend Engineer | No tasks this sprint (application complete) | — |
| Design Agent | No tasks this sprint (specs accurate) | — |
| Frontend Engineer | No tasks this sprint (available to assist QA if locator requires component context) | — |

---

## Dependency Chain (Critical Path)

```
Phase 1 (IMMEDIATE — NO BLOCKERS):
T-235 (QA: Fix Playwright locator in e2e/critical-flows.spec.js lines 201–202)
    |
T-236 (Monitor: Staging health check → 4/4 Playwright → Deploy Verified = Yes)
    |
T-237 (User Agent: Quick regression verification)
    |
Manager: Triage feedback → Sprint 30 plan (or project closeout if production deployed)

Phase 4 (PROJECT OWNER GATE — parallel with all phases):
[Project owner provides AWS RDS + Render credentials — 4th escalation]
    |
T-224 (Deploy: Production deployment)
    |
T-225 (Monitor: Post-production health check)
```

---

## Definition of Done

*How do we know Sprint #29 is complete?*

- [ ] T-235: `e2e/critical-flows.spec.js` lines 201–202 updated with scoped locators — no application code changed
- [ ] T-235: `npx playwright test` → 4/4 PASS (verified by QA Engineer before handoff)
- [ ] T-236: Monitor Agent confirms Deploy Verified = Yes (4/4 Playwright confirmed independently)
- [ ] T-237: User Agent confirms no regressions — structured feedback submitted
- [ ] T-237 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] T-224: Production deployed to Render + AWS RDS *(conditional on project owner providing access)*
- [ ] T-225: Post-production health check complete *(conditional on T-224)*
- [ ] Sprint 29 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 30 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #29)

By end of Sprint #29, the following must be verifiable:

- [ ] **T-235 Done** — `npx playwright test` reaches 4/4 PASS with scoped locators; test fix is test-code only (no app changes)
- [ ] **T-236 Done** — Staging Deploy Verified = Yes; Monitor Agent confirms full health check passing
- [ ] **T-237 Done** — User Agent quick regression pass confirms application correct; feedback submitted and triaged
- [ ] **T-224 Done** *(project owner dependent)* — Application live in production; AWS RDS connected; migrations run
- [ ] **T-225 Done** *(project owner dependent)* — Monitor confirms production health; SameSite=None cookie verified across origins

---

## Blockers

- **T-224/T-225 are blocked on the project owner.** This is the **fourth consecutive sprint** this escalation has been raised. AWS RDS + Render account provisioning is required before production deployment can proceed. All application code, `render.yaml`, and `docs/production-deploy-guide.md` are complete and production-ready. **No agent can resolve this — it requires a human action.**
- No blockers on the engineering track. T-235 can begin immediately.

---

*Sprint #28 archived to `.workflow/sprint-log.md` on 2026-03-12. Sprint #29 plan written by Manager Agent 2026-03-12.*

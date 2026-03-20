# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #32 — 2026-03-20

**Sprint Goal:** Verify the live production deployment with a full health check and user walkthrough, then ship two small but meaningful improvements: API documentation updates (calendar endpoint shape note + curl workaround) and stay category case normalization so the API accepts lowercase input. The app is now live in production — Sprint 32's primary mandate is confirming it works end-to-end for real users and closing the post-production verification loop.

**Context:** Sprint 31 delivered all commitments — mobile LAND_TRAVEL styling, knexfile seeds fix, full QA pipeline, and a clean User Agent sign-off with zero Critical or Major findings. Production is live at `https://triplanner.yixinx.com` (deployed 2026-03-20 by project owner). The only carry-over is T-225 (post-production health check), which is unblocked and must execute immediately. Two minor feedback items from Sprint 31 (FB-131 curl workaround, FB-132 calendar API shape note) are addressed via documentation update T-257. Stay category case normalization (FB-121, tracked since Sprint 19) is promoted from backlog as a minor UX improvement worth shipping now that the production pipeline is stable.

**Feedback Triage (Sprint 31 → Sprint 32):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-123 through FB-130 | Positive | — | Acknowledged — all positive confirmations of Sprint 30/31 fixes |
| FB-131 | Bug | Minor | **Acknowledged → Tasked T-257** — `curl -d` INVALID_JSON; docs-only fix (add `--http1.1` note to api-contracts.md) |
| FB-132 | UX Issue | Minor | **Acknowledged → Tasked T-257** — Calendar response shape note added to api-contracts.md |

---

## In Scope

### Phase 0 — Post-Production Verification (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-225** — Monitor Agent: Post-production health check ← **CARRY-OVER FROM SPRINT 30/31 — ZERO BLOCKERS — EXECUTE NOW**

  **Context:** T-224 (production deployment) was completed on 2026-03-20 by the project owner. Production is live at `https://triplanner.yixinx.com` (frontend) and `https://triplanner-backend-sp61.onrender.com` (backend). T-225 has been waiting since Sprint 30 and must run now.

  **Execute the full production health check protocol:**
  1. `GET https://triplanner-backend-sp61.onrender.com/api/v1/health` → expect `{"status":"ok"}` 200
  2. CORS header → expect `Access-Control-Allow-Origin: https://triplanner.yixinx.com`
  3. Auth register with a new test user → 201
  4. Auth login → 200 with `access_token`
  5. `GET /api/v1/trips` → 200 (authenticated)
  6. `POST /api/v1/trips` + `GET /api/v1/trips/:id` → 201/200
  7. PATCH trip status → verify persisted on re-GET
  8. `GET /api/v1/trips/:id/calendar` → 200 with events array
  9. Verify no CORS errors, no 5xx in response
  10. Log full results in `qa-build-log.md` Sprint 32 section
  11. If all pass: set **Deploy Verified = Yes (Production)** in `qa-build-log.md`, update T-225 → Done in `dev-cycle-tracker.md`, log handoff to User Agent (T-256) in `handoff-log.md`

  **Acceptance criteria:**
  - All production API endpoints return expected status codes
  - Auth flow (register → login → authenticated request) works on production
  - CORS configured correctly for custom domain
  - Deploy Verified = Yes (Production) confirmed in qa-build-log.md

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-256** — User Agent: Production walkthrough on `https://triplanner.yixinx.com` ← Blocked by T-225

  **Scope:** Test the live production app as a real user would. This is the first User Agent walkthrough on production.

  1. **New user flow:** Register a new account on `https://triplanner.yixinx.com/register`. Confirm redirect to home page.
  2. **Trip creation:** Create a new trip. Add a flight (with timezone-offset departure time). Add a stay. Add an activity. Add a land travel entry.
  3. **Trip details:** Confirm all entries display correctly — flight times in local timezone, stay dates, activity in day-grouped view, LAND_TRAVEL pill in calendar.
  4. **Calendar:** Open TripCalendar — confirm all event types (FLIGHT, STAY, ACTIVITY, LAND_TRAVEL) appear on correct days.
  5. **Status change:** Change trip status PLANNING → ONGOING. Reload page — confirm status persisted.
  6. **Mobile:** Check at mobile viewport (375px) — confirm LAND_TRAVEL rows have color accent; general responsiveness check.
  7. **Notes + destinations:** Confirm trip notes and destination chips work on production.
  8. **Delete:** Delete the test trip. Confirm removed from home page list.
  9. **Logout:** Confirm clean logout, redirect to login.
  10. Submit structured feedback to `feedback-log.md` under "Sprint 32 User Agent Feedback — T-256 Production Walkthrough".

  **Acceptance criteria:**
  - Full new-user flow works end-to-end on production
  - All event types display correctly in TripCalendar
  - No Critical or Major issues found on production
  - Structured feedback submitted to feedback-log.md

  **Files:** `feedback-log.md`, `handoff-log.md`

---

### Phase 1 — Documentation & Minor Improvements (P2 — parallel with Phase 0 or after T-225 clean)

- [ ] **T-257** — Backend Engineer: Update `api-contracts.md` with Sprint 31 documentation gaps ← No blockers (parallel with T-225/T-256)

  **Context:** Two minor documentation gaps identified by User Agent in Sprint 31:
  - **FB-132:** `GET /api/v1/trips/:id/calendar` returns `{ data: { trip_id, events: [...] } }` — inconsistent with other list endpoints that return `{ data: [...] }`. Intentional design (includes trip_id context). Needs an explicit note in api-contracts.md.
  - **FB-131:** `curl -d '...'` returns INVALID_JSON on HTTPS POST endpoints (possible HTTP/2 body framing). Workaround: `curl --http1.1`. API documentation examples should use `--http1.1` flag.

  **Implementation:**
  1. In `api-contracts.md`, locate the `GET /trips/:id/calendar` endpoint section. Add a **Note** callout:
     > "Note: This endpoint returns a wrapped object `{ trip_id, events: [] }` rather than a flat array. Access events via `response.data.events`. This differs from other sub-resource list endpoints which return `{ data: [] }` directly."
  2. In `api-contracts.md`, locate or create an "API Usage Notes" or "curl Examples" section. Add:
     > "HTTPS + curl: If using curl against HTTPS endpoints, add `--http1.1` to avoid HTTP/2 body framing issues: `curl --http1.1 -sk ...`. The application is not affected — this is a developer tooling note only."
  3. No code changes. Documentation only.
  4. Set T-257 → Done after updating api-contracts.md. Log in handoff-log.md.

  **Acceptance criteria:**
  1. `api-contracts.md` calendar section has the wrapped-object note
  2. `api-contracts.md` has the `--http1.1` curl note
  3. No code changes — documentation only
  4. Log in handoff-log.md

  **Files:** `.workflow/api-contracts.md`

---

- [ ] **T-258** — Backend Engineer: Stay category case normalization ← No blockers (parallel with T-225/T-256)

  **Context (FB-121, tracked since Sprint 19):** The `stays` table `category` column enforces a PostgreSQL CHECK constraint requiring uppercase values (`HOTEL`, `AIRBNB`, `VRBO`). The API currently returns a 400 VALIDATION_ERROR if the caller sends lowercase (e.g., `"hotel"` instead of `"HOTEL"`). This is minor friction for API consumers. The frontend always sends uppercase, so there is no user-visible bug — only developer ergonomics.

  **Implementation:**
  1. In the stays validation middleware (or route handler), normalize `category` to uppercase before validation: `if (body.category) body.category = body.category.toUpperCase();`
  2. This normalization should happen before the enum check so `"hotel"` → `"HOTEL"` passes cleanly.
  3. Add 2 unit tests: (a) `POST /stays` with `category: "hotel"` (lowercase) → 201, stored as `"HOTEL"`; (b) `POST /stays` with `category: "airbnb"` → 201, stored as `"AIRBNB"`. Existing uppercase tests must still pass.
  4. All 406+ existing backend tests must pass.
  5. Log in handoff-log.md; set In Review.

  **Acceptance criteria:**
  1. `POST /stays` with lowercase category input → 201 (no 400 error); stored value uppercase in DB
  2. All 3 category values (`hotel`/`airbnb`/`vrbo` and their uppercase forms) normalize correctly
  3. 2+ new tests; 406+ existing tests still pass
  4. No frontend changes needed (frontend already sends uppercase)

  **Files:** `backend/src/middleware/validate.js` (or stays route handler), backend test file

---

### Phase 2 — QA, Deploy, Monitor (sequential after Phase 1 complete and T-225/T-256 feedback triaged)

- [ ] **T-259** — QA Engineer: Security checklist + integration testing for Sprint 32 ← Blocked by T-258

  **Scope:**
  - Security checklist for T-258 (stay category normalization): no SQL injection vector introduced; input normalization happens before validation (correct order); no secrets in code
  - Code review: T-257 (docs update — verify note is accurate, no misleading statements)
  - Verify all backend tests pass (406+ base + T-258 new tests)
  - Integration check: POST /stays with lowercase category → 201; uppercase still → 201; invalid category (`"motel"`) → 400
  - Log results in `qa-build-log.md` Sprint 32 section

---

- [ ] **T-260** — Deploy Engineer: Sprint 32 staging re-deployment ← Blocked by T-259

  - `pm2 restart triplanner-backend` (T-258 backend change — no frontend rebuild needed)
  - Verify `GET /api/v1/health` → 200
  - Smoke test: `POST /stays` with `category: "hotel"` (lowercase) → 201
  - Log in `qa-build-log.md`

---

- [ ] **T-261** — Monitor Agent: Sprint 32 staging health check ← Blocked by T-260

  Full health check protocol:
  - GET `/api/v1/health` → 200 ✅
  - CORS header → `Access-Control-Allow-Origin: https://localhost:4173` ✅
  - Auth login with `test@triplanner.local` → 200 ✅
  - Sprint 32 smoke: `POST /stays` with lowercase `"hotel"` → 201 ✅
  - Sprint 31 regressions: PATCH trip status → persisted; GET /calendar → LAND_TRAVEL present ✅
  - `npx playwright test` → 4/4 PASS ✅
  - Log results in `qa-build-log.md` Sprint 32 section
  - If all pass: mark **Deploy Verified = Yes (Staging)**, handoff to User Agent (T-262)

---

- [ ] **T-262** — User Agent: Sprint 32 staging feature walkthrough ← Blocked by T-261

  **Scope:**
  1. **Stay category normalization (T-258):** Add a stay with `category: "hotel"` (lowercase) via API — confirm 201 and stored as `"HOTEL"`. Verify TripDetailsPage displays the stay correctly.
  2. **Regressions:** Confirm Sprint 31 features (mobile LAND_TRAVEL styling, status persistence, flight timezone, calendar) all still working on staging.
  3. Submit structured feedback to `feedback-log.md` under "Sprint 32 User Agent Feedback — T-262 Staging Walkthrough".

---

## Out of Scope

- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-032 (trip export/print)** — Deferred; no user demand signal yet.
- **New major features** — App is in production; focus is stabilization and minor polish.
- **MFA, home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Monitor Agent | Post-production health check (P0 carry-over); staging health check | T-225, T-261 |
| User Agent | Production walkthrough (first production test); staging walkthrough | T-256, T-262 |
| Backend Engineer | API docs update; stay category normalization | T-257, T-258 |
| QA Engineer | Security checklist + integration check for T-258 | T-259 |
| Deploy Engineer | Staging re-deployment with T-258 backend change | T-260 |
| Frontend Engineer | No tasks this sprint (no frontend changes needed) | — |
| Design Agent | No tasks this sprint (no new UI components or screens) | — |
| Manager | Triage T-256 feedback; code review T-258; Sprint 33 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
Phase 0 (IMMEDIATE — NO BLOCKERS):
T-225 (Monitor: Post-production health check)
    |
T-256 (User Agent: Production walkthrough)
    |
Manager: Triage T-256 feedback (if Critical/Major → hotfix takes priority over all else)

Phase 1 (parallel with Phase 0 — no blockers):
T-257 (Backend: api-contracts.md documentation update) ← parallel, no blockers
T-258 (Backend: stay category case normalization)      ← parallel, no blockers
    |
T-259 (QA: Security checklist + integration check — T-258 done)
    |
T-260 (Deploy: Staging re-deployment)
    |
T-261 (Monitor: Staging health check → Deploy Verified = Yes)
    |
T-262 (User Agent: Sprint 32 staging walkthrough)
    |
Manager: Triage feedback → Sprint 33 plan
```

---

## Definition of Done

*How do we know Sprint #32 is complete?*

- [ ] T-225: Monitor Agent post-production health check complete — Deploy Verified = Yes (Production)
- [ ] T-256: User Agent production walkthrough complete — no Critical or Major issues found; feedback submitted
- [ ] T-256 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] T-257: api-contracts.md updated with calendar endpoint note and curl --http1.1 workaround
- [ ] T-258: Stay category normalization implemented; 2+ new tests; 406+ existing tests pass
- [ ] T-259: QA security checklist PASS; all backend tests passing
- [ ] T-260: Staging re-deployed with T-258 change; both services online
- [ ] T-261: Monitor confirms Deploy Verified = Yes (Staging); Playwright 4/4 still passing
- [ ] T-262: User Agent staging walkthrough complete; feedback submitted
- [ ] T-262 feedback triaged by Manager
- [ ] Sprint 32 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 33 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #32)

By end of Sprint #32, the following must be verifiable:

- [ ] **Production verified** — T-225 confirms all production API endpoints healthy; CORS correct for custom domain
- [ ] **Production user walkthrough clean** — T-256 confirms full user flow works on `https://triplanner.yixinx.com` with no Critical or Major issues
- [ ] **API docs complete** — `api-contracts.md` includes calendar response shape note and curl workaround
- [ ] **Stay category DX improved** — Lowercase category input accepted without 400 error
- [ ] **Staging regression-free** — Sprint 31 features (mobile LAND_TRAVEL, status persistence, flight timezone) all still passing after T-258 deploy

---

## Blockers

- **No blockers on T-225.** Production is live. Monitor Agent must execute T-225 immediately.
- **T-256 blocked by T-225.** User Agent production walkthrough cannot start until Monitor Agent confirms production is healthy.
- **T-258 should not start if T-256 reveals a Critical or Major production bug.** Hotfix takes priority over all Sprint 32 work.
- **T-259 blocked by T-258.** QA cannot run until stay normalization implementation is complete.

---

*Sprint #31 archived to `.workflow/sprint-log.md` on 2026-03-20. Sprint #32 plan written by Manager Agent 2026-03-20.*

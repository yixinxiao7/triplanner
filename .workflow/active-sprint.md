# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #34 — 2026-03-20

**Sprint Goal:** Deploy Sprint 33's multi-day calendar fix to production, then finally complete production verification (T-225 post-production health check + T-256 production walkthrough) which have been carried over since Sprint 30.

**Context:** Sprint 33 completed its staging pipeline cleanly — T-264 (multi-day FLIGHT and LAND_TRAVEL calendar spanning) shipped to staging with zero bugs and 12/12 positive feedback entries. However, T-225 (post-production health check) and T-256 (production walkthrough) were not executed for the 5th and 4th consecutive sprints. Production is live at `https://triplanner.yixinx.com` but is running an older version without the Sprint 33 calendar fix. This sprint deploys the fix to production and runs the long-overdue production verification pipeline.

**Feedback Triage (Sprint 33 → Sprint 34):**

| Entry | Category | Severity | Disposition |
|-------|----------|----------|-------------|
| FB-144–FB-155 | Positive | — | **Acknowledged** — All 12 entries are positive confirmations of T-264, regressions, and test suites |

**No new tasks created from feedback.** Sprint 33 produced zero bugs, zero UX issues, zero feature gaps.

---

## In Scope

### Phase 0 — Production Deployment (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-269** — Deploy Engineer: Deploy Sprint 33 frontend changes to production (Render)

  **Context:** The multi-day calendar fix (T-264) is deployed to staging but not production. Production at `https://triplanner.yixinx.com` is running an older frontend build.

  **Execute:**
  1. Rebuild frontend with production environment variables (`npm run build` in `frontend/`)
  2. Deploy to Render (push to production branch or trigger Render deploy via CLI/dashboard)
  3. Verify frontend loads at `https://triplanner.yixinx.com`
  4. Smoke test: Navigate to a trip with a multi-day flight → verify calendar shows spanning event
  5. Log results in `qa-build-log.md` Sprint 34 section

  **Acceptance criteria:**
  - Frontend deployed to production on Render
  - Multi-day calendar fix live on production
  - No build errors
  - Production URL loads correctly with new assets

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

### Phase 1 — Post-Production Verification (P0 — sequential after Phase 0)

- [ ] **T-225** — Monitor Agent: Post-production health check ← **CARRY-OVER FROM SPRINT 30/31/32/33 — 5TH CARRY-OVER — EXECUTE IMMEDIATELY AFTER T-269**

  **Context:** Production is live at `https://triplanner.yixinx.com` (frontend) and `https://triplanner-backend-sp61.onrender.com` (backend). This task has been unblocked since Sprint 31 but has not been executed for five consecutive sprints. It MUST run now.

  **Execute the full production health check protocol:**
  1. `GET https://triplanner-backend-sp61.onrender.com/api/v1/health` → expect `{"status":"ok"}` 200
  2. CORS header → expect `Access-Control-Allow-Origin: https://triplanner.yixinx.com`
  3. Auth register with a new test user → 201
  4. Auth login → 200 with `access_token`
  5. `GET /api/v1/trips` → 200 (authenticated)
  6. `POST /api/v1/trips` + `GET /api/v1/trips/:id` → 201/200
  7. PATCH trip status → verify persisted on re-GET
  8. Add multi-day flight → `GET /api/v1/trips/:id/calendar` → verify FLIGHT event has `start_date ≠ end_date`
  9. Verify no CORS errors, no 5xx in response
  10. Log full results in `qa-build-log.md` Sprint 34 section
  11. If all pass: set **Deploy Verified = Yes (Production)** in `qa-build-log.md`, update T-225 → Done in `dev-cycle-tracker.md`, log handoff to User Agent (T-256) in `handoff-log.md`

  **Acceptance criteria:**
  - All production API endpoints return expected status codes
  - Auth flow (register → login → authenticated request) works on production
  - CORS configured correctly for custom domain
  - Multi-day calendar events verified on production
  - Deploy Verified = Yes (Production) confirmed in qa-build-log.md

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`, `handoff-log.md`

---

- [ ] **T-256** — User Agent: Production walkthrough on `https://triplanner.yixinx.com` ← Blocked by T-225

  **Context:** This is the first User Agent walkthrough on production. Same scope as originally planned in Sprint 30. **CARRY-OVER FROM SPRINT 30/31/32/33 — 4TH CARRY-OVER.**

  **Execute:**
  1. New user flow: Register → home page
  2. Trip creation: Create trip, add flight (multi-day) + stay + activity + land travel (multi-day)
  3. Verify all entries display correctly
  4. TripCalendar: all event types present on correct days, multi-day events span correctly
  5. Status change: PLANNING → ONGOING, reload, confirm persisted
  6. Mobile viewport check (375px)
  7. Notes + destinations functional
  8. Delete trip, confirm removed
  9. Logout, confirm redirect
  10. Submit structured feedback to `feedback-log.md`

  **Acceptance criteria:**
  - Full new-user flow works end-to-end on production
  - All event types display correctly in TripCalendar, including multi-day spanning
  - No Critical or Major issues found on production
  - Structured feedback submitted to feedback-log.md

  **Files:** `feedback-log.md`, `handoff-log.md`

---

### Phase 2 — Production QA (sequential after Phase 0)

- [ ] **T-270** — QA Engineer: Production smoke test + security verification ← Blocked by T-269

  **Scope:**
  - Verify HTTPS is enforced on production
  - Verify CORS headers correct for `https://triplanner.yixinx.com`
  - Verify cookie `SameSite=None` and `Secure=true` on production (cross-origin deployment)
  - Verify no sensitive data in API error responses
  - Verify auth token handling works correctly on production
  - Log results in `qa-build-log.md` Sprint 34 section

  **Acceptance criteria:**
  - Production HTTPS verified
  - CORS correct for custom domain
  - Cookies configured for cross-origin deployment
  - Security checklist PASS for production environment

  **Files:** `qa-build-log.md`, `dev-cycle-tracker.md`

---

## Out of Scope

- **New feature development** — Sprint 34 is exclusively focused on production deployment and verification. No new features.
- **FB-135 ("+x more" click-to-scroll)** — Minor feature gap, backlog for a future sprint.
- **B-020 (Redis rate limiter)** — Backlog; in-memory store sufficient for current scale.
- **B-024 (per-account rate limiting)** — Backlog.
- **B-032 (trip export/print)** — Deferred.
- **Staging pipeline changes** — Staging is stable; no staging work this sprint.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Deploy Engineer | Production deployment of Sprint 33 frontend changes | T-269 |
| Monitor Agent | Post-production health check (P0, 5th carry-over) | T-225 |
| User Agent | Production walkthrough (P0, 4th carry-over) | T-256 |
| QA Engineer | Production security verification | T-270 |
| Design Agent | No tasks this sprint | — |
| Frontend Engineer | No tasks this sprint (no new features) | — |
| Backend Engineer | No tasks this sprint (no backend changes needed) | — |
| Manager | Triage T-256 feedback; Sprint 35 plan | Reviews |

---

## Dependency Chain (Critical Path)

```
T-269 (Deploy: Production deployment of Sprint 33 changes)
    |
    ├── T-225 (Monitor: Post-production health check) ← 5th carry-over
    |       |
    |       T-256 (User Agent: Production walkthrough) ← 4th carry-over
    |               |
    |               Manager: Triage T-256 feedback
    |
    └── T-270 (QA: Production security verification) ← parallel with T-225
```

---

## Definition of Done

*How do we know Sprint #34 is complete?*

- [ ] T-269: Frontend deployed to production with Sprint 33 multi-day calendar fix
- [ ] T-225: Monitor Agent post-production health check complete — Deploy Verified = Yes (Production)
- [ ] T-256: User Agent production walkthrough complete — no Critical or Major issues; feedback submitted
- [ ] T-256 feedback triaged by Manager (all entries Acknowledged or Tasked)
- [ ] T-270: QA production security verification complete — security checklist PASS
- [ ] Sprint 34 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 35 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #34)

By end of Sprint #34, the following must be verifiable:

- [ ] **Production deployed with latest code** — T-269 confirms frontend at `https://triplanner.yixinx.com` includes the multi-day calendar fix
- [ ] **Production verified** — T-225 confirms all production API endpoints healthy; CORS correct; multi-day events work
- [ ] **Production user walkthrough clean** — T-256 confirms full user flow works on production with zero Critical or Major issues
- [ ] **Production security verified** — T-270 confirms HTTPS, CORS, cookies, and auth are correctly configured for production

---

## Blockers

- **No blockers on T-269.** Production infrastructure is already set up on Render. Deploy Engineer should push the latest build.
- **T-225 blocked by T-269.** Health check must run against the updated production deployment.
- **T-256 blocked by T-225.** User Agent production walkthrough cannot start until Monitor confirms production is healthy.
- **T-270 blocked by T-269.** QA can run in parallel with T-225 after T-269 completes.

---

*Sprint #33 archived to `.workflow/sprint-log.md` on 2026-03-20. Sprint #34 plan written by Manager Agent 2026-03-20.*

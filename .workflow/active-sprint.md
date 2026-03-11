# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #27 — 2026-03-11

**Sprint Goal:** (1) Fix the Major CORS staging bug (T-228) that is blocking all browser-initiated API calls on staging — this is the gate for User Agent testing and any subsequent browser-based verification. (2) Complete the User Agent walkthrough (T-219) that has now carried over for four consecutive sprints — this must not slip again. (3) Carry T-224 (production deployment) and T-225 (post-production health check) forward — escalate to project owner for AWS RDS + Render account provisioning, which is the sole remaining blocker for the production launch.

**Context:** Sprint 26 shipped all three production deployment engineering pre-requisites (knexfile SSL config, cookie SameSite fix, render.yaml + deploy guide), the Monitor Agent process fix, and a clean staging re-deploy. All engineering is production-ready. However, two gates remain: (a) the CORS staging bug (Monitor Alert Sprint #26 — ESM dotenv hoisting causes wrong `Access-Control-Allow-Origin` header in staging) must be fixed before User Agent browser testing can proceed; (b) the project owner must provision AWS RDS + Render accounts for T-224 to execute. Test baseline entering Sprint 27: 355/355 backend | 486/486 frontend.

**Feedback Triage (Sprint 26 → Sprint 27):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| Monitor Alert Sprint #26 (CORS mismatch) | Monitor Alert | Major | **Tasked → T-228** | Staging backend serves wrong `Access-Control-Allow-Origin` header (ESM dotenv hoisting root cause). Blocks all browser-based API calls. |
| Monitor Alert Sprint #26 (secondary: knexfile staging seeds) | Monitor Alert | Minor | **Acknowledged (backlog)** | Staging knexfile missing seeds directory config — `NODE_ENV=staging npm run seed` fails. Workaround exists. No Sprint 27 task. |

---

## In Scope

### Phase 1 — CORS Staging Fix (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-228** — Backend Engineer + Deploy Engineer: Fix CORS staging mismatch — ESM dotenv hoisting root cause ← **NO DEPENDENCIES — START IMMEDIATELY**

  **Root Cause:** In `backend/src/index.js`, the static `import app from './app.js'` is hoisted before `dotenv.config({ path: '.env.staging' })` runs. When `app.js` executes `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' })`, `CORS_ORIGIN` is still `undefined`, so the fallback `'http://localhost:5173'` is captured as the fixed origin.

  **Fix A — Immediate (no code change, Deploy Engineer):**
  - Add `CORS_ORIGIN: 'https://localhost:4173'` to the `triplanner-backend` env block in `infra/ecosystem.config.cjs`
  - `pm2 restart triplanner-backend`
  - Verify: `curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"` → `Access-Control-Allow-Origin: https://localhost:4173`

  **Fix B — Permanent (code fix, Backend Engineer):**
  - Refactor `backend/src/index.js` to use a dynamic `import()` for `app.js` so dotenv loads before the app module executes. Alternatively, move dotenv config into `app.js` as the first statement before any middleware.
  - Re-run `npm test --run` in `backend/` — confirm all 355+ tests pass
  - Unit test or integration test asserting the CORS header is correctly set from env

  **Both A and B must be implemented.** Fix A unblocks User Agent testing immediately; Fix B prevents recurrence.

  - Log handoff to User Agent (T-219) in handoff-log.md once Fix A is deployed and CORS verified
  - Full report in `qa-build-log.md` Sprint 27 section

---

### Phase 2 — User Agent Walkthrough (P0 — after T-228)

- [ ] **T-219** — User Agent: Sprint 25/26 feature walkthrough (carry-over from Sprint 25 T-217) ← Blocked by T-228

  **Calendar verification (Sprint 25 feature — primary scope):**
  - TripDetailsPage shows live TripCalendar component at top of page (not the old "Calendar coming in Sprint 2" placeholder)
  - Flights, stays, and activities render on the calendar grid with correct dates
  - Each event type is visually distinct — FLIGHT / STAY / ACTIVITY color-coded pills
  - Clicking an event scrolls to the corresponding section on the page
  - Trip with no sub-resources shows empty state message (not placeholder)

  **Regression suite:**
  - StatusFilterTabs: All / Planning / Ongoing / Completed pills filter correctly; filter with 0 matches → empty state + "Show all" reset link
  - TripStatusSelector: badge shows current status; click → update in place; keyboard nav (Space/Enter/Arrows/Escape); Home page reflects status change
  - Trip notes: empty placeholder → edit → char count → save → displays; clear → placeholder returns
  - Destination validation: 101-char destination → 400 human-friendly error (not raw stack trace)
  - Rate limiting: login lockout after 10 attempts
  - Print button visible on TripDetailsPage (Sprint 17)
  - start_date/end_date visible on trip cards (Sprint 16)

  - Submit structured feedback to `feedback-log.md` under **"Sprint 27 User Agent Feedback"**
  - All feedback entries must have Category, Severity, and Status: New

---

### Phase 3 — Production Deployment (P1 — project owner gate + T-228)

> ⚠️ **PROJECT OWNER ACTION REQUIRED:** T-224 is blocked on the project owner providing:
> 1. **AWS account access** to create an RDS PostgreSQL 15 instance (db.t3.micro, us-east-1, free tier)
> 2. **Render account access** to apply the `render.yaml` Blueprint (or manual service creation)
> All application code, configuration, and the deploy guide (`docs/production-deploy-guide.md`) are complete. The Deploy Engineer can execute T-224 as soon as credentials are provided.

- [ ] **T-224** — Deploy Engineer: Production deployment to Render + AWS RDS ← Blocked on project owner (AWS + Render access)

  Follow `docs/production-deploy-guide.md` (T-222 output):
  1. Create AWS RDS PostgreSQL 15 instance (db.t3.micro, us-east-1, free tier, public access for Render)
  2. Set up Render services (frontend static site + backend web service, both Ohio region, free plan) using `render.yaml`
  3. Configure all environment variables (DATABASE_URL pointing to RDS endpoint, JWT_SECRET generated, NODE_ENV=production, FRONTEND_URL, CORS_ORIGIN)
  4. Run database migrations: `knex migrate:latest` against production RDS
  5. Trigger Render deploy — confirm frontend and backend online
  6. Smoke tests: GET /api/v1/health → 200; POST /auth/register → 201; frontend loads at Render URL
  - Log production URLs in handoff-log.md; handoff to Monitor Agent (T-225)
  - Full report in `qa-build-log.md` Sprint 27 section

- [ ] **T-225** — Monitor Agent: Post-production health check ← Blocked by T-224

  - GET https://[backend-render-url]/api/v1/health → 200 `{"status":"ok"}`
  - Frontend loads at https://[frontend-render-url] — no JS errors in browser console
  - Registration: POST /auth/register → 201
  - Login: POST /auth/login → 200
  - Trips: GET /api/v1/trips → 200 (with auth)
  - Calendar: GET /api/v1/trips/:id/calendar → 200 (with auth)
  - HTTPS enforced
  - Cookie: `SameSite=None; Secure` in Set-Cookie response header for refresh token
  - Full report in `qa-build-log.md` Sprint 27 section

---

## Out of Scope

- **Calendar edit mode** — Calendar is read-only; editing remains via section forms below the calendar.
- **MFA login, Home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.
- **B-020 (Redis rate limiting), B-024 (per-account rate limiting)** — In-memory store sufficient at current scale.
- **knexfile.js staging seeds config fix** — Minor, acknowledged; workaround exists (use `NODE_ENV=development npm run seed`). Not Sprint 27.
- **New features** — No new feature work this sprint. Stabilize and ship production first.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | CORS ESM dotenv fix (Fix B) | T-228 |
| Deploy Engineer | CORS pm2 ecosystem fix (Fix A) + production deploy | T-228, T-224 |
| User Agent | Sprint 25/26 feature walkthrough (calendar + regression) | T-219 |
| Monitor Agent | Post-production health check | T-225 |
| Manager | T-228 code review; T-219 feedback triage; T-224 deploy gate review | Reviews |
| QA Engineer | Add CORS header check to staging QA protocol (post-sprint improvement) | — |

---

## Dependency Chain (Critical Path)

```
Phase 1 (IMMEDIATE — NO BLOCKERS):
T-228 (Backend + Deploy: Fix CORS staging — Fix A + Fix B)
    |
Phase 2:
T-219 (User Agent: TripCalendar + regression walkthrough)
    |
Manager triages T-219 feedback

Phase 3 (PROJECT OWNER GATE — parallel with Phase 1/2):
[Project owner provides AWS RDS + Render credentials]
    |
T-224 (Deploy: Production deployment to Render + AWS RDS)
    |
T-225 (Monitor: Post-production health check)
    |
Manager: Triage T-219 + T-225 feedback → Sprint 28 plan
```

---

## Definition of Done

*How do we know Sprint #27 is complete?*

- [ ] T-228: Fix A deployed — `curl -sk -I https://localhost:3001/api/v1/health -H "Origin: https://localhost:4173"` → `Access-Control-Allow-Origin: https://localhost:4173`
- [ ] T-228: Fix B implemented — ESM dotenv hoisting refactored in `backend/src/index.js`; all 355+ backend tests pass
- [ ] T-219: User Agent TripCalendar walkthrough complete; all regression checks pass; structured feedback submitted to feedback-log.md
- [ ] T-219 feedback triaged by Manager (all entries Tasked, Acknowledged, or Won't Fix)
- [ ] T-224: Production deployed to Render + AWS RDS; smoke tests pass; production URLs logged in handoff-log.md *(conditional on project owner providing access)*
- [ ] T-225: Post-production health check complete; all 8 production checks pass; SameSite=None cookie verified *(conditional on T-224)*
- [ ] Sprint 27 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 28 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #27)

By end of Sprint #27, the following must be verifiable:

- [ ] **T-228 Done** — Staging backend returns `Access-Control-Allow-Origin: https://localhost:4173` on OPTIONS/GET requests from staging frontend origin; browser-based API calls no longer CORS-blocked
- [ ] **T-219 Done** — User Agent confirms TripCalendar renders correctly on staging; all Sprint 16/17/25 regression checks pass; structured feedback submitted
- [ ] **T-224 Done** *(project owner dependent)* — Application is live in production at Render URLs; AWS RDS connected; migrations run
- [ ] **T-225 Done** *(project owner dependent)* — Monitor confirms: health 200, HTTPS, auth working, calendar endpoint working, SameSite=none cookie confirmed
- [ ] **B-022 Resolved** *(project owner dependent)* — Production deployment shipped after 26+ sprint deferral

---

## Blockers

- **T-228 is the gate for T-219.** User Agent browser testing cannot reliably proceed until the CORS mismatch is fixed and staging is confirmed working in a browser context.
- **T-224 / T-225 are blocked on the project owner.** The project owner must provide AWS account access (to create RDS instance) and Render account access (to apply render.yaml Blueprint or create services manually). All code, config, and documentation are complete. Once access is provided, T-224 can execute immediately.

---

*Previous sprint (Sprint #26) archived to `.workflow/sprint-log.md` on 2026-03-11. Sprint #27 plan written by Manager Agent 2026-03-11.*

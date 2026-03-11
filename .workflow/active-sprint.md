# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #26 — 2026-03-10

**Sprint Goal:** (1) Close out Sprint 25 carry-overs — restart backend to clear rate limiter, confirm Playwright 4/4, run User Agent calendar walkthrough. (2) Ship production deployment — implement the three engineering pre-requisites (knexfile SSL config, cookie SameSite fix, render.yaml + deploy guide), then deploy to Render + AWS RDS and verify. (3) Fix the Monitor Agent health check process to prevent rate limiter exhaustion from recurring.

**Context:** Sprint 25 shipped the TripCalendar component (the top remaining MVP feature, placeholder since Sprint 1). The calendar is live on staging with 340/340 backend + 486/486 frontend tests passing. Two carry-overs from Sprint 25: T-216 (Playwright 1/4 — process issue, not code regression) and T-217 (User Agent walkthrough never ran). Additionally, FB-112 recovered the lost production hosting decision from Sprint 17 — Render (frontend + backend) + AWS RDS — and tasked all three engineering pre-requisites. Production deploy has been deferred 25+ sprints; Sprint 26 is the production launch sprint.

**Feedback Triage (Sprint 25 → Sprint 26):**

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| FB-112 | Feature Gap | Critical | **Tasked → T-220, T-221, T-222, T-223, T-224, T-225** | Production hosting decision (Render + AWS RDS, Sprint 17) recovered and tasked. 3 engineering pre-reqs + QA + deploy + monitor phases created. |
| Monitor Alert (Sprint #25) | Monitor Alert | Major | **Tasked → T-218, T-226** | Playwright 1/4 PASS — rate limiter exhaustion from Monitor Agent curl registration. T-218 clears immediate blocker; T-226 fixes the process long-term. |

---

## In Scope

### Phase 1 — Resolve T-216 Carry-Over + User Agent Walkthrough (P0 — NO BLOCKERS — START IMMEDIATELY)

- [ ] **T-218** — Deploy Engineer: Restart `triplanner-backend` to clear in-memory rate limiter, re-run Playwright → 4/4 PASS ← **NO DEPENDENCIES — START IMMEDIATELY**

  - `pm2 restart triplanner-backend`
  - `npx playwright test` immediately after restart — expect 4/4 PASS
  - Update qa-build-log.md T-216 section with rerun results
  - Log handoff to User Agent (T-219) in handoff-log.md

- [ ] **T-219** — User Agent: Sprint 25/26 feature walkthrough ← Blocked by T-218

  **Calendar verification (Sprint 25 feature):**
  - TripDetailsPage shows live TripCalendar component at top of page (not the old "Calendar coming in Sprint 2" placeholder)
  - Flights, stays, and activities render on the calendar grid
  - Each event type visually distinct — FLIGHT / STAY / ACTIVITY color-coded pills
  - Clicking an event scrolls to the corresponding section on the page (flights / stays / activities)
  - Trip with no sub-resources shows empty state message (not placeholder)

  **Regression suite:**
  - StatusFilterTabs: All / Planning / Ongoing / Completed pills; filter with 0 matches → empty state + "Show all" reset link
  - TripStatusSelector: badge shows current status; click → update in place; keyboard nav (Space/Enter/Arrows/Escape); Home page sync after change
  - Trip notes: empty placeholder → edit → char count → save → displays; clear → placeholder returns
  - Destination validation: 101-char destination → 400 human-friendly error
  - Rate limiting: login lockout after 10 attempts; multi-destination chip UI
  - Print button visible on TripDetailsPage (Sprint 17)
  - start_date/end_date visible on trip cards (Sprint 16)

  - Submit structured feedback to `feedback-log.md` under **"Sprint 26 User Agent Feedback"**

---

### Phase 2 — Production Deployment Engineering Pre-Requisites (P1 — parallel tracks)

- [ ] **T-220** — Backend Engineer: `backend/knexfile.js` production config — SSL + connection pool for AWS RDS

  - Add `production` config block reading `process.env.DATABASE_URL`
  - `ssl: { rejectUnauthorized: false }` (AWS RDS self-signed cert)
  - `pool: { min: 1, max: 5 }` (conservative for db.t3.micro)
  - No schema changes, no migrations
  - Unit test or integration assertion covering ssl and pool config
  - Log change notes in handoff-log.md

- [ ] **T-221** — Backend Engineer: Cookie `SameSite=none` + `Secure=true` in production (parallel with T-220)

  - Set `sameSite: 'none'` and `secure: true` on refresh token cookie when `NODE_ENV === 'production'`
  - Keep `sameSite: 'strict'` for development and staging
  - Frontend (`triplanner-frontend.onrender.com`) and backend (`triplanner-backend.onrender.com`) are cross-origin on Render — this fix is required for auth to work in production
  - Unit/integration test asserting production cookie config values
  - Log change notes in handoff-log.md

- [ ] **T-222** — Deploy Engineer: `render.yaml` blueprint + production deploy guide ← Blocked by T-220, T-221

  **render.yaml** (project root) must define:
  - Frontend: static site, buildCommand: `cd frontend && npm install && npm run build`, publishDir: `frontend/dist`, region: ohio, plan: free, envVar: `VITE_API_URL` pointing to backend service URL
  - Backend: web service, runtime: node, buildCommand: `npm install`, startCommand: `node src/server.js`, region: ohio, plan: free, envVars: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
  - No hardcoded secret values — all sensitive envVars as references/sync values

  **docs/production-deploy-guide.md** must cover:
  1. Render account setup + connecting repo
  2. AWS RDS free-tier instance (PostgreSQL 15+, db.t3.micro, us-east-1, public access for Render)
  3. Environment variable configuration in Render dashboard
  4. Database migration: `knex migrate:latest` against RDS DATABASE_URL
  5. Deploy trigger and confirm frontend/backend online
  6. Post-deploy verification checklist (health, register, login, trips, calendar)

  - Log handoff to QA (T-223) in handoff-log.md

---

### Phase 3 — Pre-Production QA + Production Deploy + Monitor (sequential)

- [ ] **T-223** — QA Engineer: Pre-production security + configuration review ← Blocked by T-220, T-221, T-222

  - Verify T-220: knexfile.js production block has `ssl.rejectUnauthorized=false`, `pool.max=5`
  - Verify T-221: production cookie config has `sameSite='none'`, `secure=true`; staging/dev unchanged
  - Verify render.yaml: no hardcoded secrets (all as env var references)
  - Review `docs/production-deploy-guide.md`: migration step present, env var setup documented, post-deploy checklist included
  - Re-run `npm test --run` in `backend/` — confirm 340+ tests pass
  - Re-run `npm audit` — confirm 0 vulnerabilities
  - Full report in `qa-build-log.md` Sprint 26 section
  - Log handoff to Deploy Engineer (T-224) in handoff-log.md

- [ ] **T-224** — Deploy Engineer: Production deployment to Render + AWS RDS ← Blocked by T-223

  Follow `docs/production-deploy-guide.md`:
  1. Create AWS RDS PostgreSQL 15 instance (db.t3.micro, us-east-1, free tier)
  2. Set up Render services using render.yaml
  3. Configure all environment variables (DATABASE_URL, JWT_SECRET, NODE_ENV=production, FRONTEND_URL)
  4. Run `knex migrate:latest` against production RDS
  5. Trigger Render deploy — confirm frontend + backend online
  6. Smoke tests: GET /health → 200; POST /auth/register → 201; frontend loads at Render URL
  - Log production URLs in handoff-log.md; handoff to Monitor Agent (T-225)
  - Full report in `qa-build-log.md`

- [ ] **T-225** — Monitor Agent: Post-production health check ← Blocked by T-224

  - GET https://[backend-render-url]/api/v1/health → 200 `{"status":"ok"}`
  - Frontend loads at https://[frontend-render-url] — no JS errors
  - Registration: POST /auth/register → 201
  - Login: POST /auth/login → 200
  - Trips: GET /api/v1/trips → 200 (with auth)
  - Calendar: GET /api/v1/trips/:id/calendar → 200 (with auth)
  - HTTPS enforced
  - Cookie: `SameSite=none; Secure` in Set-Cookie response header
  - Full report in `qa-build-log.md` Sprint 26 section

---

### Phase 4 — Monitor Agent Process Fix (P2 — parallel with Phase 2/3)

- [ ] **T-226** — Backend Engineer: Monitor Agent health check process fix ← No blockers

  - Create a seed script (`backend/seeds/test_user.js` or migration) that inserts a persistent staging test user (e.g., `test@triplanner.local` / `TestPass123!`)
  - Update `.agents/monitor-agent.md` to document that health checks must use `POST /api/v1/auth/login` with the seeded test account to obtain a token — NOT `POST /api/v1/auth/register`
  - Unit test: seed script creates user; login with seeded credentials returns 200
  - This prevents the rate limiter exhaustion pattern (Sprint 22, Sprint 25) from recurring

---

## Out of Scope

- **Calendar edit mode** — Calendar is read-only; editing remains via section forms below the calendar.
- **MFA login, Home page summary calendar, auto-generated itinerary** — Explicitly out of scope per project brief.
- **B-020 (Redis rate limiting), B-024 (per-account rate limiting)** — In-memory store sufficient at current scale.
- **Custom domain setup** — Optional step in production deploy guide; not required for Sprint 26 success criteria.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Deploy Engineer | Playwright rerun (carry-over resolution) + render.yaml + production deploy | T-218, T-222, T-224 |
| User Agent | Sprint 25/26 calendar + regression walkthrough | T-219 |
| Backend Engineer | knexfile SSL config + cookie SameSite fix + Monitor process fix | T-220, T-221, T-226 |
| QA Engineer | Pre-production security + configuration review | T-223 |
| Monitor Agent | Post-production health check | T-225 |
| Manager | T-219 feedback triage; T-220/T-221/T-222 code reviews; T-224 deploy gate review | Reviews |

---

## Dependency Chain (Critical Path)

```
Phase 1 — Immediate (NO BLOCKERS):
T-218 (Deploy: restart backend → Playwright 4/4)
    |
T-219 (User Agent: calendar + regression walkthrough)
    |
Manager triages T-219 feedback

Phase 2 (parallel, no blockers except T-222):
T-220 (Backend: knexfile SSL + pool)     T-221 (Backend: cookie SameSite fix)     T-226 (Backend: Monitor process fix — independent)
          |                                          |
          └──────────────────┬───────────────────────┘
                             |
T-222 (Deploy: render.yaml + deploy guide)
    |
Phase 3 (sequential):
T-223 (QA: pre-production review)
    |
T-224 (Deploy: production deploy to Render + RDS)
    |
T-225 (Monitor: post-production health check)
    |
Manager: Triage T-219 + T-225 feedback → Sprint 27 plan
```

---

## Definition of Done

*How do we know Sprint #26 is complete?*

- [ ] T-218: Backend restarted; `npx playwright test` → 4/4 PASS; qa-build-log.md updated
- [ ] T-219: User Agent calendar walkthrough complete; all regression checks pass; structured feedback submitted to feedback-log.md
- [ ] T-219 feedback triaged by Manager (all entries Tasked, Acknowledged, or Won't Fix)
- [ ] T-220: knexfile.js production config with SSL + pool — Manager-approved
- [ ] T-221: Cookie SameSite=none + Secure=true in production — Manager-approved
- [ ] T-222: render.yaml published to project root; `docs/production-deploy-guide.md` written; no hardcoded secrets
- [ ] T-223: Pre-production QA PASS; 340+ backend tests; 0 vulnerabilities; security checklist complete
- [ ] T-224: Production deployed to Render + AWS RDS; smoke tests pass; production URLs logged
- [ ] T-225: Post-production health check complete; all 8 production checks pass; cookie SameSite verified
- [ ] T-226: Monitor Agent process fix implemented; `.agents/monitor-agent.md` updated
- [ ] Sprint 26 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 27 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #26)

By end of Sprint #26, the following must be verifiable:

- [ ] **T-219 Done** — User Agent confirms TripCalendar renders correctly on staging with full regression suite passing
- [ ] **T-224 Done** — Application is live in production at Render URLs; AWS RDS connected; migrations run
- [ ] **T-225 Done** — Monitor confirms: health 200, HTTPS, auth working, calendar endpoint working, SameSite=none cookie confirmed
- [ ] **B-022 Resolved** — Production deployment shipped after 25+ sprint deferral
- [ ] **T-226 Done** — Monitor Agent health check process fixed; no future Playwright rate limiter failures

---

## Blockers

- **T-219 gate:** T-218 must complete (backend restart + Playwright 4/4) before User Agent can run T-219.
- **T-222 gate:** T-220 and T-221 must both complete before render.yaml and deploy guide are written.
- **T-224 gate:** T-223 QA review must pass before production deployment executes.
- **AWS RDS credentials:** Deploy Engineer will need AWS account access to create the RDS instance. If project owner needs to provide AWS credentials, this must be noted in the T-224 handoff.

---

*Previous sprint (Sprint #25) archived to `.workflow/sprint-log.md` on 2026-03-10. Sprint #26 plan written by Manager Agent 2026-03-10.*

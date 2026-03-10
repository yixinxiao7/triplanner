# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #19 — 2026-03-09

**Sprint Goal:** Execute the full Sprint 18 plan that failed to run — close the Sprint 17 pipeline carry-overs (T-176 Monitor + T-177 User Agent), ship auth rate limiting (B-020, now 18 sprints deferred — non-negotiable P0), produce the multi-destination structured UI spec (T-179) and implementation (T-180), and complete the full QA → Deploy → Monitor → User Agent pipeline. Sprint 19 must break the planning-without-execution pattern that caused Sprint 18 to close with zero tasks completed.

**Context:** Sprint 18 was fully planned but never executed. All 10 tasks (T-176–T-185) remain in Backlog. The Sprint 17 staging deployment (T-175) is live and ready for Monitor verification. Auth rate limiting (`express-rate-limit` is already installed) has been an accepted security risk since Sprint 1 — 18 sprints is the absolute limit. Multi-destination chip UI (B-007) has its spec defined in the Sprint 18 task T-179; Sprint 19 delivers both the spec and the implementation.

**Feedback Triage (Sprint 18 → Sprint 19 — Manager Agent 2026-03-09):**

| FB Entry | Category | Severity | Status | Disposition |
|----------|----------|----------|--------|-------------|
| — | — | — | N/A | No Sprint 18 User Agent feedback — T-185 never reached (Sprint 18 did not execute). All Sprint 18 tasks carry forward to Sprint 19 unchanged. |

---

## In Scope

### Phase 0 — Pipeline Carry-over (HIGHEST PRIORITY — start before all other work)

*T-175 (Sprint 17 deploy) is live on staging. T-176 and T-177 simply need to run against it. These have been pending since Sprint 17.*

- [ ] **T-176** — Monitor Agent: Sprint 17 staging health check ← **NO DEPENDENCIES — START IMMEDIATELY** (P1)
  - HTTPS handshake + pm2 `triplanner-backend` online on port 3001
  - `GET /api/v1/health` → 200
  - **Sprint 17 verification:** "Print itinerary" button visible on trip details page ✅; "No dates yet" text legible (T-170 opacity fix) ✅
  - **Sprint 16 regression:** `GET /trips` returns `start_date`/`end_date`; empty trip → null dates ✅
  - **Sprint 15 regression:** title "triplanner", favicon, land travel chip locations ✅
  - **Sprint 14 regression:** calendar first-event-month, "Today" button ✅
  - `npx playwright test` → 7/7 PASS ✅
  - Log results in qa-build-log.md Sprint 17 section. Handoff to User Agent (T-177).

- [ ] **T-177** — User Agent: Sprint 17 feature walkthrough ← Blocked by T-176 (P2)
  - Print button visible on trip details page ✅
  - Clicking "Print itinerary" opens browser print dialog ✅
  - Button has `aria-label="Print itinerary"` ✅
  - "No dates yet" text is legible (not over-dimmed after opacity fix) ✅
  - Home page date ranges still correct (formatTripDateRange removal did not affect formatDateRange) ✅
  - Sprint 16 + Sprint 15 + Sprint 14 + Sprint 13 + Sprint 11 regression ✅
  - Submit structured feedback to `feedback-log.md` under Sprint 19 User Agent Feedback header

---

### Phase 1 — Backend Security Fix + Design Spec (parallel, no dependencies — start immediately)

- [x] **T-178** — Backend Engineer: Auth rate limiting (B-020) ← **DONE 2026-03-09** ✅
  - `express-rate-limit` is already installed (verified Sprint 1). No new dependencies needed.
  - Create `backend/src/middleware/rateLimiter.js` with two limiter instances:
    - **loginLimiter:** 10 attempts per IP per 15-minute window → 429 `{"code":"RATE_LIMITED","message":"Too many login attempts, please try again later."}`
    - **registerLimiter:** 5 attempts per IP per 60-minute window → 429 `{"code":"RATE_LIMITED","message":"Too many registration attempts, please try again later."}`
  - Both limiters: `standardHeaders: true, legacyHeaders: false`
  - Apply limiters to auth router in `backend/src/routes/auth.js` — before the route handler
  - Tests (add to `backend/src/__tests__/auth.test.js` or new `rateLimiter.test.js`):
    - (A) Login within limit → 200/401 (not rate limited)
    - (B) Login at attempt 11 in window → 429 `RATE_LIMITED`
    - (C) Register within limit → 201/409
    - (D) Register at attempt 6 in window → 429 `RATE_LIMITED`
    - (E) Non-auth route (GET /api/v1/trips) is NOT rate limited
  - All 278+ existing backend tests must continue to pass

- [ ] **T-179** — Design Agent: Multi-destination structured UI spec (B-007, Spec 18) ← **NO DEPENDENCIES — START IMMEDIATELY** (P2)
  - Destinations remain stored as TEXT ARRAY on the backend — no schema change
  - **Create trip modal:** Replace single text input with chip/tag multi-input. Enter or "+" adds a chip. × removes a chip. At least 1 destination required.
  - **Trip card (home page):** Destinations rendered as readable list (truncate at 3: "Paris, Rome, +1 more")
  - **Trip details page header:** Destination chips displayed inline (comma-separated or chip row)
  - **Edit destinations:** "Edit destinations" control (pencil icon or button near header). Opens inline or modal chip editor. On save: PATCH /api/v1/trips/:id with updated destinations array.
  - **Validation:** "Add at least one destination" when 0 chips on submit
  - **Accessibility:** Each × chip button has `aria-label="Remove [destination name]"`
  - **Styling:** Consistent with existing minimal Japandi aesthetic (IBM Plex Mono, #02111B palette)
  - Publish to `ui-spec.md` as Spec 18. Log handoff to Manager for approval before T-180 begins.

---

### Phase 2 — Frontend Implementation (after T-179 approved by Manager)

- [ ] **T-180** — Frontend Engineer: Multi-destination structured UI per Spec 18 ← Blocked by T-179 (P2)
  - **Create trip modal (`CreateTripModal.jsx`):** Replace destinations text input with chip input component. State: `destinations: string[]`. Add chip on Enter keypress or "+" button click. Remove chip on × click. Submit sends `destinations` as string array (existing API shape). Disable submit if `destinations.length === 0`. Validation message "Add at least one destination."
  - **Trip card (`TripCard.jsx`):** Display destinations as readable list. Truncate: if > 3, show first 3 + "+N more".
  - **Trip details page (`TripDetailsPage.jsx`):** Render destinations as chips in header. Add "Edit destinations" button (pencil icon). Clicking opens chip editor (can reuse chip input component). On save: call `api.trips.update(tripId, { destinations: [...] })` → PATCH. Reload trip data on success.
  - **No new API endpoints or schema changes** — destinations array is already the contract
  - **Tests:** Add to modal test, TripCard test, TripDetailsPage test:
    - Chip added on Enter keystroke
    - Chip removed on × click
    - Submit blocked with 0 chips (validation message present)
    - TripCard renders all destinations (or truncated form)
    - TripDetailsPage shows edit control; save calls PATCH with correct array
  - All 416+ existing frontend tests must pass

---

### Phase 3 — QA Review (after T-178 + T-180 complete)

- [ ] **T-181** — QA Engineer: Security checklist + code review for Sprint 19 ← Blocked by T-178, T-180 (P1)
  - **T-178 (rate limiting) security:**
    - Limiter uses IP as key (not user-supplied input) ✅
    - 429 response body uses `RATE_LIMITED` code — no stack trace, no internal details ✅
    - `standardHeaders: true` — rate limit headers present in response ✅
    - Non-auth endpoints unaffected ✅
  - **T-180 (destinations UI) security:**
    - Destination chip values rendered as React text nodes — no `dangerouslySetInnerHTML` ✅
    - PATCH request sends `destinations` as plain string array — no SQL injection vector (Knex parameterized) ✅
    - Destination names displayed safely — XSS check ✅
    - No hardcoded secrets introduced ✅
  - Run `npm test --run` in `backend/` (278+ base + new rate limiter tests)
  - Run `npm test --run` in `frontend/` (416+ base + new chip input tests)
  - Run `npm audit` — flag any new Critical/High findings
  - Full report in qa-build-log.md Sprint 19 section

- [ ] **T-182** — QA Engineer: Integration testing for Sprint 19 ← Blocked by T-181 (P1)
  - **Rate limiting:** Simulate 11 POST /auth/login requests → 10th returns 200/401, 11th returns 429 `RATE_LIMITED` ✅
  - **Rate limiting — register:** Simulate 6 POST /auth/register requests → 5th returns 201/409, 6th returns 429 ✅
  - **Destinations — create:** Open create modal → add 3 destination chips → submit → verify trip created with all 3 in array ✅
  - **Destinations — edit:** Open trip details → edit destinations → remove 1, add 1 → save → verify PATCH called correctly ✅
  - **Destinations — card:** Verify all trip card destination displays correct ✅
  - **Sprint 17 regression:** Print button still visible; "No dates yet" still legible after re-deploy ✅
  - **Sprint 16 + Sprint 15 + Sprint 14 regression** ✅
  - Full report in qa-build-log.md Sprint 19 section. Handoff to Deploy (T-183).

---

### Phase 4 — Deploy, Monitor, User Agent (sequential after Phase 3)

- [ ] **T-183** — Deploy Engineer: Sprint 19 staging re-deployment ← Blocked by T-182 (P1)
  - **Backend:** T-178 adds `rateLimiter.js` middleware — `pm2 restart triplanner-backend`. Verify online.
  - **Frontend:** `npm run build` in `frontend/`. Confirm 0 errors.
  - **Smoke tests:**
    - `GET /api/v1/health` → `{"status":"ok"}` ✅
    - POST /auth/login (valid creds) → 200 (rate limiter not triggered by single request) ✅
    - Trip details page: destinations chips visible in header ✅
    - "Print itinerary" button still visible (Sprint 17 regression) ✅
    - Home page date ranges unaffected (Sprint 16 regression) ✅
  - Do NOT modify `backend/.env` or `backend/.env.staging`
  - Log handoff to Monitor (T-184) in handoff-log.md. Full report in qa-build-log.md.

- [ ] **T-184** — Monitor Agent: Sprint 19 staging health check ← Blocked by T-183 (P1)
  - HTTPS ✅, pm2 port 3001 ✅, health 200 ✅
  - **Sprint 19 — Rate limiting:** 11 rapid POST /auth/login requests → first 10: 200/401, 11th: 429 ✅
  - **Sprint 19 — Destinations UI:** Trip details page shows destination chips; "Edit destinations" control visible ✅
  - **Sprint 17 regression:** "Print itinerary" button visible ✅; "No dates yet" legible ✅
  - **Sprint 16 regression:** start_date/end_date on trips ✅
  - **Sprint 15 regression:** title "triplanner", favicon ✅
  - `npx playwright test` → 7/7 PASS ✅
  - Full report in qa-build-log.md Sprint 19 section. Handoff to User Agent (T-185).

- [ ] **T-185** — User Agent: Sprint 19 feature walkthrough ← Blocked by T-184 (P2)
  - **Rate limiting:** Attempt 11 rapid logins with wrong password → verify 429 (or user-facing error message) on 11th attempt ✅
  - **Multi-destination — Create:** Create trip with 3 destination chips → verify all 3 appear on trip card ✅
  - **Multi-destination — Edit:** Edit destinations on trip details → remove 1, add 1 → save → verify header updates ✅
  - **Sprint 17 regression:** Print button visible, "No dates yet" legible ✅
  - **Sprint 16 + Sprint 15 + Sprint 14 + Sprint 13 + Sprint 11 regression** ✅
  - Submit structured feedback to `feedback-log.md` under Sprint 20 User Agent Feedback header

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. `.workflow/hosting-research.md` (T-124) awaits review. **19 consecutive sprints with no decision. Project owner action required.**
- **B-021 (esbuild dev dep vulnerability)** — No production impact. Monitor for upstream vitest patch.
- **B-024 (per-account rate limiting)** — Depends on B-020 completion. Defer to Sprint 20+ if needed.
- **Redis for rate limiting** — express-rate-limit in-memory store sufficient at current scale.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Monitor Agent | Complete Sprint 17 health check carry-over | T-176 (immediate) |
| User Agent | Complete Sprint 17 walkthrough carry-over | T-177 (after T-176) |
| Backend Engineer | Auth rate limiting (B-020 security fix — P0) | T-178 |
| Design Agent | Multi-destination structured UI spec (B-007) | T-179 |
| Frontend Engineer | Multi-destination structured UI implementation | T-180 |
| QA Engineer | Security checklist + integration testing | T-181, T-182 |
| Deploy Engineer | Sprint 19 staging re-deployment | T-183 |
| Monitor Agent | Sprint 19 staging health check | T-184 |
| User Agent | Sprint 19 feature walkthrough | T-185 |
| Manager | Triage T-185 feedback → Sprint 20 plan | Feedback triage |

---

## Dependency Chain (Critical Path)

```
Track A — Pipeline Carry-over (start immediately, highest priority):
T-176 (Monitor: Sprint 17 health check) → T-177 (User Agent: Sprint 17 walkthrough)
        [T-177 submits feedback under Sprint 19 header — triaged at sprint end]

Track B — Security Fix (start immediately, no blockers):
T-178 (Backend: auth rate limiting — B-020)
         |
         └─┐
           |
Track C — Design Spec (start immediately, no blockers):
T-179 (Design: multi-destination spec) → T-180 (Frontend: multi-destination impl)
                                                   |
                                                   └─┘
                                                   |
                                              T-181 (QA: security + review)
                                                   |
                                              T-182 (QA: integration)
                                                   |
                                              T-183 (Deploy)
                                                   |
                                              T-184 (Monitor: Sprint 19 health)
                                                   |
                                              T-185 (User Agent: Sprint 19 walkthrough)
                                                   |
                                         Manager: Triage feedback → Sprint 20 plan
```

---

## Definition of Done

*How do we know Sprint #19 is complete?*

- [ ] T-176: Monitor verifies Sprint 17 staging health — print button visible, opacity fix deployed, Playwright 7/7 PASS
- [ ] T-177: User Agent verifies Sprint 17 features on staging — print button functional, "No dates yet" legible, regressions clean; feedback submitted to feedback-log.md
- [ ] T-178: Auth rate limiting live — /auth/login returns 429 after 10 attempts in 15min window; /auth/register returns 429 after 5 in 60min window; all 278+ backend tests pass
- [ ] T-179: Spec 18 (multi-destination UI) published to ui-spec.md; Manager-approved
- [ ] T-180: Multi-destination chip input in create modal; destinations display on trip card; edit destinations on trip details page; all 416+ frontend tests pass
- [ ] T-181: QA security checklist passed for Sprint 19 changes; no new Critical/High audit findings
- [ ] T-182: QA integration testing passed; rate limiting verified; Sprint 17/16/15 regression clean
- [ ] T-183: Frontend + backend rebuilt and deployed to staging; smoke tests pass
- [ ] T-184: Monitor confirms all Sprint 19 health checks pass
- [ ] T-185: User Agent verifies rate limiting and multi-destination UI on staging; structured feedback submitted
- [ ] All feedback from T-185 triaged by Manager (Tasked, Won't Fix, or Acknowledged)
- [ ] Sprint 19 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 20 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #19)

By end of Sprint #19, the following must be verifiable on staging:

- [ ] **T-176/T-177 Done** — Sprint 17 pipeline complete; print button and opacity fix verified by Monitor and User Agent
- [ ] **T-178 Done** — Auth endpoints are rate limited; 429 returned after threshold; existing tests unbroken
- [ ] **T-180 Done** — Users can add multiple destinations via chip input in create modal and edit them from trip details
- [ ] Sprint 19 staging deploy (T-183) completed successfully
- [ ] No Critical or Major bugs found in T-185 walkthrough
- [ ] Sprint 20 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 19 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete and production-ready. **Project owner action required before production deployment can execute.**

---

*Previous sprint (Sprint #18) archived to `.workflow/sprint-log.md` on 2026-03-09. Sprint #19 plan written by Manager Agent 2026-03-09.*

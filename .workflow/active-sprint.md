# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #8 — 2026-02-27

**Sprint Goal:** Unblock the Sprint 7 QA pipeline by fixing two broken test files (T-110 fixes T-098's UTC fixture, T-111 writes the missing T-104 tests). Complete the long-overdue Sprint 6 User Agent walkthrough (T-094 — third consecutive carry-over). Close the full QA → Deploy → Monitor → User Agent cycle for all Sprint 7 integration-check tasks. Deliver two small but user-visible enhancements — timezone abbreviation display on flight/stay/land travel detail cards (FB-084, deferred from Sprint 7) and clickable activity location URLs (B-031). Expand Playwright E2E coverage to 7+ tests.

**Context:** Sprint 7 delivered five solid implementation tasks (T-097/T-099/T-100/T-101/T-103, all in Integration Check) but failed to close the QA pipeline because: (1) `StaysEditPage.test.jsx` had one failing test — `UTC` not in the TIMEZONES dropdown so the test fixture never called `api.stays.create`; (2) `TripDetailsPage.test.jsx` and `TripCard.test.jsx` had zero T-104 tests written despite complete code. The deploy gate correctly blocked T-107. Sprint 8 resolves these immediately (T-110, T-111), closes the full Sprint 7 pipeline, then adds a small focused batch of new features. Sprint scope is deliberately narrower than Sprint 7 to ensure the full pipeline closes cleanly within the sprint boundary.

**FB-084 Disposition:** Timezone abbreviation display was "Acknowledged" (deferred) since Sprint 6 feedback. T-098 timezone fix is now backend/frontend approved (code done, tests being fixed by T-110). FB-084 is promoted to **Tasked → T-113** in Sprint 8 — unblocked after T-098 implementation is QA-verified.

**Manager Pre-Approved Schema Change:** None new this sprint. Migration 010 (trip notes `TEXT NULL`) was pre-approved in Sprint 7 and will be applied in T-107.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 0 — Test Fixes (P0, start immediately, run in parallel)
- [ ] T-110 — Frontend Engineer: Fix T-098 failing UTC test + add missing TripDetailsPage stay display test ← **no blockers — start immediately**
- [ ] T-111 — Frontend Engineer: Write 8+ T-104 tests (TripDetailsPage notes + TripCard notes) ← **no blockers — start immediately**

### Phase 1 — User Agent Sprint 6 Carry-Over (P0 hard-block — unblocked by T-095 which is Done)
- [ ] T-094 — User Agent: Sprint 6 feature walkthrough (land travel, calendar, bug fixes, regression) ← **T-095 (Done) — start immediately**

### Phase 2 — Design Spec (parallel with Phase 0 + Phase 1, no blockers)
- [ ] T-112 — Design Agent: Spec 14 — timezone abbreviation display + activity URL link detection ← **no blockers — start immediately**

### Phase 3 — Manager Review Gate
*Manager reviews T-110 and T-111 submissions. On approval, T-098 and T-104 move to Integration Check, unblocking T-105.*

### Phase 4 — Sprint 7 QA Pipeline (sequential — starts after T-110 + T-111 pass Manager review)
- [ ] T-105 — QA: Security checklist + code review (all Sprint 7 tasks: T-097–T-104) ← T-110, T-111
- [ ] T-106 — QA: Integration testing (Sprint 7 features + Sprint 6 regression) ← T-105
- [ ] T-107 — Deploy: Staging re-deployment (migration 010 + all Sprint 7 frontend/backend changes) ← T-106
- [ ] T-108 — Monitor: Staging health check (Sprint 7 + Sprint 6 regression) ← T-107
- [ ] T-109 — User Agent: Sprint 7 feature walkthrough + feedback ← T-108

### Phase 5 — Sprint 8 New Feature Implementation (parallel with Phase 3-4, starts after T-112 approved)
- [ ] T-113 — Frontend Engineer: Timezone abbreviations on flight/stay/land travel detail cards (FB-084) ← T-112
- [ ] T-114 — Frontend Engineer: Activity location clickable URL detection (B-031) ← T-112

### Phase 6 — E2E Expansion (after T-109 Sprint 7 walkthrough)
- [ ] T-115 — QA Engineer: Expand Playwright coverage — land travel edit E2E + calendar overflow E2E + mobile viewport tests ← T-109

### Phase 7 — Sprint 8 QA Pipeline (sequential — after T-113 + T-114 pass Manager review + T-109 done)
- [ ] T-116 — QA: Security checklist + code review (Sprint 8 features: T-113, T-114, T-115) ← T-113, T-114, T-109
- [ ] T-117 — QA: Integration testing (Sprint 8 features + Sprint 7 regression) ← T-116
- [ ] T-118 — Deploy: Staging re-deployment (Sprint 8 frontend rebuild — no new migrations) ← T-117
- [ ] T-119 — Monitor: Staging health check (Sprint 8 + Sprint 7 regression) ← T-118
- [ ] T-120 — User Agent: Sprint 8 feature walkthrough + feedback ← T-119

---

## Out of Scope

*These items are explicitly deferred. Do not start them this sprint.*

- **B-022 — Production deployment to hosting provider** — Blocked on the project owner selecting a hosting provider (Railway, Fly.io, Render, AWS). All deployment preparation complete since Sprint 3. Escalated every sprint since Sprint 3. This requires a human decision — NOT a Sprint 8 engineering blocker.
- **B-032 — Trip export/print** — Useful enhancement, but a larger scope feature. Deferred to Sprint 9 to keep Sprint 8 focused on pipeline recovery.
- **B-020 — Rate limiting persistence (Redis)** — In-memory acceptable for current single-instance staging. Deferred until production architecture is decided.
- **B-024 — Per-account rate limiting** — Depends on B-020. Deferred.
- **B-021 — Dev dependency esbuild vulnerability GHSA-67mh-4wv8-2f99** — No production impact. Monitor for upstream fix.
- **Sort logic duplication in tripModel.js** — Minor DRY violation across status-filter code paths. Deferred.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), code review T-110/T-111 submissions → unblock T-105, code review T-113/T-114, triage T-094/T-109/T-120 feedback | T-110/T-111 review, T-112 approval, T-113/T-114 review |
| Frontend Engineer | Fix T-098 tests, write T-104 tests, implement timezone abbreviations, implement URL link detection | T-110, T-111, T-113, T-114 |
| Design Agent | Spec 14: timezone abbreviation display + activity URL link detection | T-112 |
| User Agent | Sprint 6 walkthrough (3rd carry-over — P0), Sprint 7 walkthrough, Sprint 8 walkthrough | T-094, T-109, T-120 |
| QA Engineer | Sprint 7 security + integration audit, Playwright expansion, Sprint 8 security + integration audit | T-105, T-106, T-115, T-116, T-117 |
| Deploy Engineer | Staging re-deployment ×2 (Sprint 7 pipeline + Sprint 8 features) | T-107, T-118 |
| Monitor Agent | Staging health check ×2 (Sprint 7 pipeline + Sprint 8 features) | T-108, T-119 |

---

## Dependency Chain (Critical Path)

```
T-110 (FE: Fix T-098 tests)              ← IMMEDIATE START — unblocks T-105
T-111 (FE: Write T-104 tests)           ← IMMEDIATE START — unblocks T-105
T-094 (User Agent: Sprint 6 carry-over) ← T-095 (Done) — IMMEDIATE START
T-112 (Design: Spec 14 TZ + URL links)  ← IMMEDIATE START — unblocks T-113, T-114

[After T-110 + T-111 pass Manager review → T-098 and T-104 move to Integration Check]

T-105 (QA: Security + code review)      ← T-110, T-111 (+ T-097, T-099, T-100, T-101, T-103 in Integration Check)
        │
        └→ T-106 (QA: Integration testing — Sprint 7)
                │
                └→ T-107 (Deploy: Staging — migration 010 + Sprint 7 changes)
                        │
                        └→ T-108 (Monitor: Health check — Sprint 7)
                                │
                                └→ T-109 (User Agent: Sprint 7 walkthrough)

T-113 (FE: Timezone abbreviations)      ← T-112
T-114 (FE: Activity URL links)          ← T-112

[After T-113 + T-114 pass Manager review AND T-109 done]

T-115 (QA: E2E Playwright expansion)    ← T-109

T-116 (QA: Security + code review)      ← T-113, T-114, T-109
        │
        └→ T-117 (QA: Integration testing — Sprint 8)
                │
                └→ T-118 (Deploy: Staging — Sprint 8 features, no migration)
                        │
                        └→ T-119 (Monitor: Health check — Sprint 8)
                                │
                                └→ T-120 (User Agent: Sprint 8 walkthrough)
```

**Critical path (Sprint 7 pipeline):** T-110 + T-111 → Manager review → T-105 → T-106 → T-107 → T-108 → T-109.

**Critical path (Sprint 8 features):** T-112 → T-113 + T-114 → Manager review → T-116 → T-117 → T-118 → T-119 → T-120.

**Note on T-094:** T-094 runs immediately (T-095 is Done). If T-094 finds Critical or Major bugs in Sprint 6 features, Manager creates hotfix tasks (H-XXX) before T-105 starts. Minor/Suggestion items go to backlog.

---

## Sprint 7 → Sprint 8 Feedback Triage

*Sprint 7 produced no feedback entries (User Agent T-094 and T-109 both did not run). Triage is limited to the FB-084 carry-over from Sprint 6.*

| FB Entry | Category | Severity | Sprint 8 Disposition | Task |
|----------|----------|----------|---------------------|------|
| (none) | — | — | — | No Sprint 7 User Agent or Monitor Agent feedback submitted before sprint closeout |
| FB-084 (Sprint 6) | Feature Gap | Minor | **Tasked → T-113** | Timezone abbreviation display on flight/stay/land travel cards — now unblocked after T-098 lands; scheduled for Sprint 8 |

---

## Definition of Done

*How do we know Sprint #8 is complete?*

**Sprint 7 Pipeline Closure:**
- [ ] T-098 frontend tests all pass — T-110 submitted and Manager-approved (T-098 moves to Integration Check)
- [ ] T-104 tests written (8+ tests) and passing — T-111 submitted and Manager-approved (T-104 moves to Integration Check)
- [ ] User Agent has completed Sprint 6 feature walkthrough and submitted structured feedback (T-094)
- [ ] T-094 feedback triaged by Manager Agent (New → Tasked/Acknowledged/Won't Fix)
- [ ] QA has run security checklist for all Sprint 7 tasks (T-105) and results logged in qa-build-log.md
- [ ] QA has run integration testing for all Sprint 7 tasks (T-106) and results logged in qa-build-log.md
- [ ] Deploy has applied migration 010 and redeployed staging with all Sprint 7 changes (T-107)
- [ ] Monitor has verified staging health with all Sprint 7 checks passing (T-108)
- [ ] User Agent has tested all Sprint 7 features and submitted structured feedback (T-109)
- [ ] T-109 feedback triaged by Manager Agent

**Sprint 8 New Features:**
- [ ] Design Agent has published Spec 14 addendum (timezone abbreviations + URL links) (T-112)
- [ ] Flight/stay/land travel detail cards show DST-aware timezone abbreviation (e.g., "EDT", "JST") (T-113)
- [ ] Activity location URLs detected and rendered as accessible `<a>` elements with `rel="noopener noreferrer"` (T-114)
- [ ] Playwright E2E expanded from 4 to 7+ tests: land travel edit + calendar overflow + mobile viewport (T-115)
- [ ] QA security + integration audit for Sprint 8 features completed and logged (T-116, T-117)
- [ ] Staging redeployed with Sprint 8 frontend changes (T-118)
- [ ] Monitor verifies Sprint 8 feature health on staging (T-119)
- [ ] User Agent tests Sprint 8 features and submits structured feedback (T-120)
- [ ] T-120 feedback triaged by Manager Agent
- [ ] Sprint 8 summary added to `.workflow/sprint-log.md`

---

## Success Criteria (Sprint 8)

By the end of Sprint #8, the following must be verifiable on staging (in addition to all Sprint 1–7 criteria):

*Sprint 7 pipeline closure:*
- [ ] All 344 frontend tests pass — including T-098 UTC timezone test and all 8 T-104 notes tests
- [ ] All Sprint 7 features verified on staging by User Agent (T-109): "+X more" popover portal fix, stays 4:00 PM → 4:00 PM (no UTC shift), Flights → Land Travel → Stays → Activities section order, all-day activities sort to top, calendar checkout/arrival times, trip notes display + edit + TripCard truncation
- [ ] Playwright 4/4 E2E pass against HTTPS staging (Sprint 7 baseline)

*Sprint 8 new features:*
- [ ] Create a flight: New York departure (America/New_York, August) → detail card shows "6:00 AM EDT"; Tokyo arrival (Asia/Tokyo) → detail card shows "9:00 AM JST"
- [ ] Create a stay in Paris (Europe/Paris, July) → check-in detail card shows "3:00 PM CEST"
- [ ] Create a land travel from London (Europe/London, January) → departure detail shows "10:00 AM GMT"
- [ ] Activity location "Lunch at https://www.yelp.com/biz/xyz" → "Lunch at " renders as plain text, "https://www.yelp.com/biz/xyz" renders as clickable `<a>` element with `target="_blank" rel="noopener noreferrer"`
- [ ] Activity location "javascript:alert(1)" → renders entirely as plain text (NOT a clickable link)
- [ ] Activity location "Golden Gate Park" (no URL) → renders as plain text (no spurious link)
- [ ] Playwright E2E: 7/7 tests pass — including land travel edit flow, calendar overflow popover, mobile viewport tests
- [ ] All 344+ existing tests pass with zero regressions from Sprint 8 changes

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

- **T-098 broken test (1 failing):** `StaysEditPage.test.jsx` test `[T-098] submits check_in_at unchanged (no offset) when timezone is UTC` fails because `UTC` is not in the TIMEZONES dropdown. T-110 resolves this immediately. No other action needed until T-110 submits for Manager review.
- **T-104 zero tests:** `TripDetailsPage.test.jsx` and `TripCard.test.jsx` have no T-104 notes tests despite complete working code. T-111 writes them. No other action needed until T-111 submits for Manager review.
- **T-094 carry-over (3rd consecutive sprint):** Sprint 6 features have never been User-Agent-tested. T-094 is the #1 priority for the User Agent — starts immediately (T-095 is Done). The QA pipeline (T-105+) must NOT start until T-098 and T-104 tests are fixed, but T-094 runs concurrently with the test fixes since it only requires T-095 (Done).
- **B-022 (Production Deployment):** Deferred to Sprint 9+ pending project owner decision on hosting provider. NOT a Sprint 8 engineering task.

---

*Previous sprint (Sprint #7) archived to `.workflow/sprint-log.md` on 2026-02-27. Sprint #8 begins 2026-02-27.*

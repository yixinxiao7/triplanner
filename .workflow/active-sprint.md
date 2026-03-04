# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #11 — 2026-03-04

**Sprint Goal:** Close the six-sprint-deep pipeline validation backlog — once and for all. Execute T-108 (Monitor Sprint 7 health check) and T-094 (User Agent Sprint 6 walkthrough — **6th consecutive carry-over**, P0 ABSOLUTE HARD-BLOCK) in parallel as the first action of the sprint, then proceed sequentially through T-109 → T-115 → T-116 (staging E2E only) → T-117 (staging E2E only) → T-118 → T-119 → T-120 → T-123 (Sprint 10 walkthrough). Triage all four feedback sets (T-094, T-109, T-120, T-123) and write Sprint 12 plan. In parallel, T-124 (Deploy Engineer hosting research spike) runs independently after T-108 confirms staging healthy.

**Context:** Sprint 10 closed on 2026-03-04 with only T-121 (Design: print spec) and T-122 (Frontend: print implementation) completing — a deviation from the pipeline-only mandate. The Pipeline-Only Rule was not upheld for the third consecutive sprint. T-094 has now carried over **six consecutive sprints** (Sprints 6–11), the longest validation gap in this project's history. Sprint 6, 7, 8, and 10 features have NEVER been tested by the User Agent. Staging is fully ready: T-122 is live (deployed by Deploy Engineer on 2026-03-04), pm2 online (PID 42784), all 10 migrations applied, HTTPS active at https://localhost:3001 (backend) and https://localhost:4173 (frontend). **T-108 and T-094 have zero remaining blockers — both start immediately.**

**Feedback Triage (Sprint 10 Closeout):** No "New" feedback entries existed in Sprint 10. No new entries were submitted during Sprint 10 (T-094, T-108, T-109, T-115, T-118, T-119, T-120 all did not execute). FB-084 is Resolved. All prior entries (FB-001–FB-084) remain as triaged in Sprint 9. See `feedback-log.md` Sprint 11 triage summary.

**Pipeline-Only Rule (ABSOLUTE — Zero Exceptions):** No new design, backend, or frontend implementation tasks may begin until T-120 AND T-123 (User Agent Sprint 10 walkthrough) both complete and all feedback is triaged. If T-094, T-109, T-120, or T-123 reveals a Critical or Major bug, Manager creates an H-XXX hotfix task immediately — that hotfix must reach Done (QA-cleared, deployed, Monitor-confirmed) before the next walkthrough can proceed. Minor/Suggestion items go to Sprint 12 backlog. T-124 (hosting research spike) is a documentation-only task that may run in parallel starting after T-108.

---

## In Scope

### Phase 0 — Immediate Parallel Start (both start NOW — fully unblocked)

- [ ] **T-108** — Monitor Agent: Sprint 7 + Sprint 10 staging health check ← **T-107 (Done 2026-02-28) — START IMMEDIATELY**
  - HTTPS handshake ✅, pm2 `triplanner-backend` online (PID 42784) ✅
  - Migration 010 applied (`notes` column in trips table) ✅
  - GET /trips/:id returns `notes` field ✅; PATCH /trips/:id notes round-trip ✅
  - Stays check-in time not UTC-shifted ✅
  - Trip details section order: Flights → Land Travel → Stays → Activities ✅
  - "+X more" calendar popover functional ✅
  - **T-122 verification:** Print button visible on TripDetailsPage trip header area ✅
  - Playwright 4/4 ✅
  - Full report in qa-build-log.md; handoff to User Agent (T-109)
  - **Promotes to Done:** T-097, T-098, T-099, T-100, T-101, T-103, T-104 (all currently Integration Check)

- [ ] **T-094** — User Agent: Sprint 6 feature walkthrough (6th consecutive carry-over) ← **T-095 (Done) — START IMMEDIATELY**
  - **ABSOLUTE HARD-BLOCK: Sprint 11 cannot advance past this task. Zero tolerance for another carry-over.**
  - Land travel CRUD: create, edit, delete entry (mode=TRAIN, from/to, dates); verify on trip details + calendar
  - Calendar event times: compact 12h chips (e.g., "9a", "2:30p") on calendar events
  - "+X more" popover: click on overflow day, verify popover opens without calendar corruption, Escape closes
  - Activity edit AM/PM: time selector renders without cutoff; clock icon white on dark background
  - FilterToolbar refetch: type and clear search, toolbar stays visible during loading
  - ILIKE search: search for "%" → empty results (not all trips)
  - Full Sprint 1–5 regression
  - Submit structured feedback to `feedback-log.md` under Sprint 11 / Sprint 6 header
  - **Any Critical or Major bug → Manager creates H-XXX hotfix task immediately before T-109 may proceed**

### Phase 1 — User Agent Sprint 7 Walkthrough (sequential — after T-108 + T-094 both complete)

- [ ] **T-109** — User Agent: Sprint 7 feature walkthrough ← T-108, T-094
  - "+X more" popover: add enough events to trigger overflow, click, verify no calendar day cell corruption, Escape closes
  - Stays timezone: create stay with check-in 4:00 PM → verify displayed as "4:00 PM" (not UTC-shifted)
  - Section order: Flights → Land Travel → Stays → Activities on trip details page
  - All-day activities: mixed day (all-day + timed) → all-day appear first in day group
  - Calendar checkout/arrival: stay shows "check-out Xa" on checkout day; flight shows "arrives Xa" on arrival day
  - Trip notes: add notes → displayed below destinations on details page; TripCard shows first 100 chars + "…" if > 100
  - Full Sprint 6 regression
  - Submit structured feedback to `feedback-log.md` under Sprint 11 / Sprint 7 header

### Phase 2 — E2E Expansion (sequential — after T-109 confirms staging clean)

- [ ] **T-115** — QA Engineer: Expand Playwright coverage from 4 → 7 tests ← T-109
  - New test 1: Land travel edit flow (create entry, verify on trip details page)
  - New test 2: Calendar "+X more" popover (open + Escape close + focus return to trigger button)
  - New test 3: Mobile viewport smoke test at 375×812 (core user flow + search/filter/sort)
  - All tests run against HTTPS staging with `ignoreHTTPSErrors: true`
  - `npx playwright test` → 7/7 PASS; report in qa-build-log.md

### Phase 3 — Sprint 8 QA Pipeline: Staging E2E (code review Done in Sprint 9 — only staging verification remains)

- [ ] **T-116** — QA: Sprint 8 staging E2E verification ← T-115
  - *(Code review complete: 18/18 security checks PASS, 266 backend + 366 frontend tests verified, npm audit 0 prod vulns)*
  - Run `npx playwright test` on HTTPS staging → 7/7 PASS confirmed
  - Verify T-115 new tests cover: land travel edit, "+X more" popover, mobile viewport
  - Confirm api-contracts.md notes field doc correction (`""` → `null`) is current
  - Update qa-build-log.md Sprint 11 section with staging E2E results

- [ ] **T-117** — QA: Sprint 8 staging integration check ← T-116
  - *(Code review complete: 18/18 integration contract checks PASS)*
  - On staging: verify timezone abbreviations visible (flight detail: "EDT" for America/New_York in summer, "JST"/"GMT+9" for Asia/Tokyo, "CEST"/"GMT+2" for Europe/Paris in summer)
  - On staging: verify activity with URL in location renders `<a>` hyperlink
  - Verify all Sprint 7 features still operational post-Sprint 8 rebuild (section order, notes, timezone fix, popover)
  - Playwright 7/7 confirmed via T-116
  - Update qa-build-log.md with full Sprint 8 integration results; handoff to Deploy (T-118)
  - **Promotes to Done after T-119:** T-113, T-114 (currently Integration Check)

- [ ] **T-118** — Deploy Engineer: Sprint 8 staging re-deployment ← T-117
  - Rebuild frontend with T-113/T-114 changes (timezone abbreviations, URL links) + T-115 new E2E tests in repo
  - No new migrations (no schema changes in Sprint 8)
  - Verify pm2 still online (from T-107 / T-122 deploy)
  - Smoke tests: (1) flight detail shows timezone abbreviation adjacent to time; (2) activity with URL shows `<a>` hyperlink; (3) `npx playwright test` → 7/7 PASS
  - Deployment report in qa-build-log.md Sprint 11 section

- [ ] **T-119** — Monitor Agent: Sprint 8 staging health check ← T-118
  - HTTPS handshake ✅, pm2 `triplanner-backend` online ✅
  - GET /trips/:id with flight — `departure_tz` field present ✅
  - Frontend SPA — flight detail card shows timezone abbreviation text ✅
  - Activity with URL in location — `<a>` element present in rendered output ✅
  - `npx playwright test` → 7/7 PASS ✅
  - All Sprint 6+7 regression checks from T-108 still pass ✅
  - Full report in qa-build-log.md Sprint 11 section; handoff to User Agent (T-120)

### Phase 4 — User Agent Sprint 8 Walkthrough + Full Feedback Triage

- [ ] **T-120** — User Agent: Sprint 8 feature walkthrough ← T-119
  - Timezone abbreviations: flight New York August departure → "EDT" (or equivalent); flight Tokyo arrival → "JST"/"GMT+9"; stay Paris summer → "CEST"/"GMT+2"
  - URL linkification: "Meet at https://maps.google.com" → URL is clickable `<a>`, opens new tab; "Meet at " plain text; plain location → no spurious `<a>`; "javascript:alert(1)" → plain text (NOT a link)
  - Playwright 7/7: all 7 E2E tests pass
  - Full Sprint 7 regression per T-109 test plan
  - Submit structured feedback to `feedback-log.md` under Sprint 11 / Sprint 8 header

### Phase 5 — User Agent Sprint 10 Walkthrough (new — validates T-122 print/export on staging)

- [ ] **T-123** — User Agent: Sprint 10 feature walkthrough ← T-120
  - Print button visible on TripDetailsPage (secondary style, printer SVG icon, aria-label="Print trip itinerary")
  - Click Print button → browser print dialog opens (window.print() invoked)
  - Print preview shows: trip name, destinations, date range, notes, all four sections (Flights, Land Travel, Stays, Activities)
  - Print preview hides: navbar, edit/add/delete buttons, calendar section
  - Print layout: single-column, black-on-white override of dark theme
  - IBM Plex Mono font retained in print
  - Full Sprint 8 regression per T-120 test plan
  - Submit structured feedback to `feedback-log.md` under Sprint 11 / Sprint 10 header

- [ ] **Manager: Triage T-094 + T-109 + T-120 + T-123 feedback immediately after each walkthrough completes**
  - Any Critical/Major bugs → create H-XXX hotfix tasks (P0 priority, block next walkthrough)
  - Minor/Suggestion → acknowledge and schedule for Sprint 12 backlog
  - All "New" entries must be moved to Tasked, Won't Fix, or Acknowledged before Sprint 12 plan is written

### Phase 6 — Hosting Research Spike (independent — runs in parallel after T-108 confirms staging)

- [ ] **T-124** — Deploy Engineer: Production hosting provider research spike (B-022) ← T-108
  - Research: Railway, Render, Fly.io, DigitalOcean App Platform (+ optionally Heroku, AWS Elastic Beanstalk)
  - For each: pricing, PostgreSQL support, HTTPS, Docker/Node.js/pm2 support, zero-downtime deploys, CI/CD, env vars, cold starts, ease of setup
  - Produce `.workflow/hosting-research.md` with comparison table + final recommendation (top pick + runner-up)
  - Recommendation must include: monthly cost estimate, setup effort (1–5 scale), migration path from local staging
  - Documentation only — no code changes, no deployments
  - Handoff to Manager in handoff-log.md after report published

---

## Out of Scope

- **All new backend/frontend implementation** — Sprint 11 is pipeline-only. T-123 and T-124 are the only new tasks, and both are documentation/validation tasks.
- **B-020 — Rate limiting persistence (Redis)** — Deferred. In-memory acceptable at current scale.
- **B-021 — Dev dependency esbuild vulnerability GHSA-67mh-4wv8-2f99** — No production impact. Monitor for upstream fix.
- **B-024 — Per-account rate limiting** — Depends on B-020. Deferred.
- **Sort logic duplication in tripModel.js** — Minor DRY violation. Deferred.
- **`formatTimezoneAbbr()` dedicated unit tests** — Deferred to when `formatDate.test.js` is next touched.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.
- **Any new Phase 5+ features** — Not to be scoped until Sprint 12, after the full pipeline closes and feedback is triaged.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Monitor Agent | Sprint 7 + T-122 health check (IMMEDIATE — no blockers), Sprint 8 health check | T-108, T-119 |
| User Agent | Sprint 6 walkthrough (IMMEDIATE — ABSOLUTE HARD-BLOCK), Sprint 7 walkthrough, Sprint 8 walkthrough, Sprint 10 walkthrough | T-094, T-109, T-120, T-123 |
| QA Engineer | Playwright E2E expansion (4→7 tests), Sprint 8 staging E2E verification | T-115, T-116, T-117 |
| Deploy Engineer | Sprint 8 frontend rebuild + staging re-deployment, hosting research spike | T-118, T-124 |
| Backend Engineer | On standby for hotfixes (H-XXX) if walkthroughs reveal Critical/Major backend bugs | BE-S11, H-XXX (if needed) |
| Manager | Triage feedback after each walkthrough; create H-XXX hotfixes if needed; write Sprint 12 plan | Feedback triage |

---

## Dependency Chain (Critical Path)

```
T-108 (Monitor: Sprint 7 + T-122 health check)  ← T-107 (Done 2026-02-28) — START IMMEDIATELY
T-094 (User Agent: Sprint 6 — 6th carry-over)   ← T-095 (Done)            — START IMMEDIATELY

[T-108 and T-094 run in PARALLEL — both fully unblocked]

T-108 Done + T-094 Done
        │
        ├→ T-124 (Deploy: Hosting research spike — documentation only, runs independently)
        │
        └→ T-109 (User Agent: Sprint 7 walkthrough)
                │
                └→ T-115 (QA/E2E: Playwright 4→7 tests)
                        │
                        └→ T-116 (QA: Sprint 8 staging E2E verification)
                                │
                                └→ T-117 (QA: Sprint 8 staging integration check)
                                        │
                                        └→ T-118 (Deploy: Sprint 8 frontend rebuild)
                                                │
                                                └→ T-119 (Monitor: Sprint 8 health check)
                                                        │
                                                        └→ T-120 (User Agent: Sprint 8 walkthrough)
                                                                │
                                                                └→ T-123 (User Agent: Sprint 10 walkthrough)
                                                                        │
                                                                        └→ Manager: Triage all feedback
                                                                                │
                                                                                └→ Sprint 12 plan
```

**Hotfix rule:** If T-094, T-109, T-120, or T-123 reveals a Critical or Major bug, Manager creates H-XXX immediately. Frontend/Backend Engineers are on standby. The hotfix must reach Done (QA-cleared, deployed to staging, Monitor-confirmed) before the next User Agent walkthrough can proceed.

**Integration Check → Done promotion:**
- T-097, T-098, T-099, T-100, T-101, T-103, T-104 → Done after T-108 Monitor confirms Sprint 7 staging health
- T-113, T-114 → Done after T-119 Monitor confirms Sprint 8 staging health

---

## Sprint 10 → Sprint 11 Feedback Triage

*No new Sprint 10 User Agent or Monitor Agent feedback entries were submitted. No entries carry "New" status into Sprint 11.*

| FB Entry | Category | Severity | Sprint 11 Disposition | Notes |
|----------|----------|----------|----------------------|-------|
| FB-084 | Feature Gap | Minor | **Resolved** (T-113 Done — awaiting T-119 staging deploy for final staging confirmation) | Timezone abbreviation display implemented, Manager-approved, QA-approved, Integration Check. T-118/T-119 will confirm on staging. |
| (Sprint 10 User/Monitor) | — | — | — | No Sprint 10 entries. T-094, T-109, T-120 will collect Sprint 6/7/8 feedback; T-123 will collect Sprint 10 feedback during Sprint 11. |

---

## Integration Check → Done Promotion

*The following tasks are implementation-complete and QA-cleared. They move to Done when staging deploy confirms them operational.*

| Task | Description | Promoted to Done when |
|------|-------------|----------------------|
| T-097 | Frontend: "+X more" calendar popover portal fix (createPortal to document.body) | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-098 | Backend + Frontend: Stays check-in/checkout UTC timezone fix | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-099 | Frontend: Trip details section reorder (Flights → Land Travel → Stays → Activities) | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-100 | Frontend: All-day activities sort to top of each activity day group | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-101 | Frontend: Calendar checkout/arrival time display enhancements | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-103 | Backend: Trip notes — migration 010, PATCH/GET, 13 tests | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-104 | Frontend: Trip notes UI (TripDetailsPage inline edit + TripCard preview) | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-113 | Frontend: Timezone abbreviation display on FlightCard + StayCard | T-119 Monitor confirms Sprint 8 staging ✅ |
| T-114 | Frontend: Activity location URL linkification (`<a>` for https://, plain text otherwise) | T-119 Monitor confirms Sprint 8 staging ✅ |

---

## Definition of Done

*How do we know Sprint #11 is complete?*

**Pipeline Closure — Sprint 7:**
- [ ] T-108: Monitor confirms all Sprint 7 + T-122 print button checks pass on staging
- [ ] T-094: User Agent Sprint 6 walkthrough complete — structured feedback submitted and triaged by Manager
- [ ] T-109: User Agent Sprint 7 walkthrough complete — structured feedback submitted and triaged by Manager
- [ ] T-097–T-104: All Sprint 7 Integration Check tasks promoted to Done (after T-108 Monitor confirms)

**Pipeline Closure — Sprint 8:**
- [ ] T-115: Playwright E2E expanded from 4 to 7 tests — all 7 passing on HTTPS staging
- [ ] T-116: Sprint 8 QA staging E2E — Playwright 7/7 confirmed; api-contracts.md notes doc current
- [ ] T-117: Sprint 8 integration check — TZ abbreviations and URL links confirmed on staging
- [ ] T-118: Deploy Sprint 8 — frontend rebuilt with Sprint 8 changes, smoke tests pass
- [ ] T-119: Monitor Sprint 8 — TZ abbreviations visible, URL links functional, Playwright 7/7, regression clean
- [ ] T-120: User Agent Sprint 8 walkthrough complete — structured feedback submitted and triaged by Manager
- [ ] T-113, T-114: Promoted to Done after T-119 Monitor confirms

**Pipeline Closure — Sprint 10:**
- [ ] T-123: User Agent Sprint 10 walkthrough (T-122 print) complete — structured feedback submitted and triaged by Manager

**Sprint Closeout:**
- [ ] All four feedback sets triaged (T-094, T-109, T-120, T-123) — all "New" entries moved to Tasked/Acknowledged/Won't Fix
- [ ] Any Critical/Major bugs resolved (H-XXX Done) before Sprint 12 plan is written
- [ ] Sprint 11 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 12 plan written in `.workflow/active-sprint.md`

**Hosting Research (independent deliverable):**
- [ ] T-124: `.workflow/hosting-research.md` published with provider comparison and recommendation

---

## Success Criteria (Sprint 11)

By end of Sprint #11, the following must be verifiable on staging (in addition to all Sprint 1–10 criteria):

**Sprint 7 features (verified on staging by T-109 User Agent):**
- [ ] "+X more" popover opens without calendar day cell layout corruption (portal fix T-097)
- [ ] Stays check-in time saved as 4:00 PM displays as "4:00 PM" — not shifted by UTC offset (T-098)
- [ ] Trip details page section order: Flights → Land Travel → Stays → Activities (T-099)
- [ ] All-day activities (no start_time) appear at top of their day group (T-100)
- [ ] Stay checkout time shows on checkout day in calendar (e.g., "check-out 11a") (T-101)
- [ ] Flight arrival time shows on arrival day in calendar (e.g., "arrives 8a") (T-101)
- [ ] Trip notes: freeform notes addable on trip details page, truncated on TripCard (T-103, T-104)
- [ ] Full Sprint 6 regression: land travel CRUD, ILIKE search, filter/sort all still operational

**Sprint 8 features (verified on staging by T-120 User Agent):**
- [ ] Flight departing New York (August) → detail card shows timezone abbreviation ("EDT" or equivalent) (T-113)
- [ ] Flight arriving Tokyo → detail card shows timezone abbreviation ("JST" or "GMT+9") (T-113)
- [ ] Stay in Paris (summer) → check-in detail card shows "CEST" or "GMT+2" (T-113)
- [ ] Activity location "Meet at https://maps.google.com" → "Meet at " plain text + clickable `<a>` link (T-114)
- [ ] Activity location "javascript:alert(1)" → renders as plain text, NOT a link (T-114)
- [ ] Activity with no URL in location → no spurious `<a>` elements (T-114)
- [ ] Playwright E2E: 7/7 tests pass (land travel edit, calendar overflow popover, mobile viewport) (T-115)

**Sprint 10 features (verified on staging by T-123 User Agent):**
- [ ] "Print" button visible on TripDetailsPage trip header area (secondary style, printer icon) (T-122)
- [ ] Clicking Print button opens browser print dialog (window.print() invoked) (T-122)
- [ ] Print preview shows all trip sections (Flights, Land Travel, Stays, Activities); hides navbar/buttons/calendar (T-122)
- [ ] Print layout is single-column, black-on-white; IBM Plex Mono retained (T-122)
- [ ] All 369 tests continue to pass with zero regressions

---

## Blockers

*Active blockers at Sprint 11 start.*

- **T-094 (6th consecutive carry-over — P0 CRITICAL ABSOLUTE HARD-BLOCK):** Sprint 6 through Sprint 10 features have NEVER been validated by the User Agent. This is the longest quality blindspot in the project's history — 10 features across 5 sprints with zero end-to-end validation. T-094 is fully unblocked (T-095 Done, T-107 Done, staging healthy, T-122 deployed). **Must complete this sprint. Zero tolerance. No new features of any kind until this pipeline closes.**
- **T-116/T-117 Staging E2E (Blocked by T-115):** Code review portions are Done (18/18 security + 18/18 integration checks PASS from Sprint 9). Only the Playwright 7/7 verification on staging remains. T-115 must run first.
- **B-022 (Production Deployment — 9 consecutive sprints):** Blocked on project owner selecting a hosting provider. All application infrastructure (Docker Compose, nginx, CI/CD, deploy runbook, HTTPS) is complete since Sprint 3. T-124 (Deploy Engineer research spike) is now formally scheduled to produce a concrete hosting recommendation for the project owner.

---

*Previous sprint (Sprint #10) archived to `.workflow/sprint-log.md` on 2026-03-04. Sprint #11 begins 2026-03-04.*

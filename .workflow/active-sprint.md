# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #10 — 2026-03-04

**Sprint Goal:** Close the five-sprint pipeline backlog once and for all. Execute T-094 (User Agent Sprint 6 walkthrough — 5th carry-over, ABSOLUTE HARD-BLOCK) and T-108 (Monitor Sprint 7 health check) immediately in parallel, then proceed sequentially through T-109 → T-115 → T-116 (staging E2E only) → T-117 (staging E2E only) → T-118 → T-119 → T-120. Triage all three feedback sets (T-094, T-109, T-120) and write Sprint 11 plan. **If and only if the full pipeline closes and no Critical/Major bugs are found, begin T-121 (Design: trip export/print spec).**

**Context:** Sprint 9 closed on 2026-03-03 with only T-107 (Deploy Sprint 7 staging — Done 2026-02-28), MGR-S9, and BE-S9 completing. T-116 and T-117 completed their code-review portions (18/18 security checks, 266/266 backend + 366/366 frontend tests verified) but remain Blocked on staging E2E — requiring T-115 (Playwright expansion) to run first. T-094 has now carried over for FIVE consecutive sprints (Sprints 6, 7, 8, 9, 10). Staging is fully ready: T-107 is Done, migration 010 applied, pm2 online (PID 92765), Sprint 7 frontend live. **T-108 and T-094 have zero remaining blockers — both start immediately.**

**Feedback Triage (Sprint 9 Closeout):** No new Sprint 9 User Agent or Monitor Agent entries were submitted. No entries carry "New" status into Sprint 10. FB-084 is Resolved (T-113 Done). See `feedback-log.md` Sprint 10 triage summary.

**Pipeline-Only Rule (Phases 0–4):** No new design, backend, or frontend implementation tasks may begin until T-120 (User Agent Sprint 8 walkthrough) completes and all feedback is triaged. If T-094, T-109, or T-120 reveals a Critical or Major bug, Manager creates a hotfix task (H-XXX) immediately and that hotfix takes P0 priority. Minor/Suggestion items go to Sprint 11 backlog. Phase 5 (T-121/T-122 trip export/print) is contingent on a clean pipeline closure with no open Critical/Major bugs.

---

## In Scope

### Phase 0 — Immediate Parallel Start (both start NOW — zero remaining blockers)

- [ ] **T-108** — Monitor Agent: Sprint 7 staging health check ← **T-107 (Done 2026-02-28) — START IMMEDIATELY**
  - HTTPS handshake ✅, pm2 `triplanner-backend` online ✅
  - Migration 010 applied (`notes` column in trips table) ✅
  - GET /trips/:id returns `notes` field ✅; PATCH /trips/:id notes round-trip ✅
  - Stays check-in time not UTC-shifted ✅
  - Trip details section order: Flights → Land Travel → Stays → Activities ✅
  - "+X more" calendar popover functional ✅
  - Playwright 4/4 ✅
  - Full report in qa-build-log.md; handoff to User Agent (T-109)

- [ ] **T-094** — User Agent: Sprint 6 feature walkthrough (5th consecutive carry-over) ← **T-095 (Done) — START IMMEDIATELY**
  - **ABSOLUTE HARD-BLOCK: Sprint 10 cannot advance past this task**
  - Land travel CRUD: create, edit, delete entry (mode=TRAIN, from/to, dates); verify on trip details + calendar
  - Calendar event times: verify compact 12h chips (e.g., "9a", "2:30p") on calendar events
  - "+X more" popover: click on overflow day, verify popover opens without calendar corruption, Escape closes
  - Activity edit AM/PM: verify time selector renders without cutoff; clock icon white-on-dark
  - FilterToolbar refetch: type and clear search, toolbar stays visible during loading
  - ILIKE search: search for "%" → empty results (not all trips)
  - Full Sprint 1–5 regression
  - Submit structured feedback to `feedback-log.md` under Sprint 10 / Sprint 6 header
  - **Any Critical or Major bug → Manager creates H-XXX hotfix task immediately before T-109 may proceed**

### Phase 1 — User Agent Sprint 7 Walkthrough (sequential — after T-108 + T-094 both complete)

- [ ] **T-109** — User Agent: Sprint 7 feature walkthrough ← T-108, T-094
  - "+X more" popover: add enough events to trigger overflow, click, verify no calendar day cell layout corruption, Escape closes
  - Stays timezone: create stay with check-in 4:00 PM → verify displayed as "4:00 PM" (not UTC-shifted)
  - Section order: Flights → Land Travel → Stays → Activities on trip details page
  - All-day activities: mixed day (all-day + timed) → all-day appear first in day group
  - Calendar checkout/arrival: stay shows "check-out Xa" on checkout day; flight shows "arrives Xa" on arrival day
  - Trip notes: add notes → displayed below destinations on details page; TripCard shows first 100 chars + "…" if >100
  - Full Sprint 6 regression
  - Submit structured feedback to `feedback-log.md` under Sprint 10 / Sprint 7 header

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
  - Update qa-build-log.md with staging E2E results

- [ ] **T-117** — QA: Sprint 8 staging integration check ← T-116
  - *(Code review complete: 18/18 integration contract checks PASS)*
  - On staging: verify timezone abbreviations visible (flight detail shows "EDT" for America/New_York in summer, "JST"/"GMT+9" for Asia/Tokyo, "CEST"/"GMT+2" for Europe/Paris in summer)
  - On staging: verify activity with URL in location renders `<a>` hyperlink
  - Verify all Sprint 7 features still operational post-Sprint 8 rebuild (section order, notes, timezone fix, popover)
  - Playwright 7/7 confirmed via T-116
  - Update qa-build-log.md with full Sprint 8 integration results; handoff to Deploy (T-118)

- [ ] **T-118** — Deploy Engineer: Sprint 8 staging re-deployment ← T-117
  - Rebuild frontend with T-113/T-114 changes (timezone abbreviations, URL links) + T-115 new E2E tests in repo
  - No new migrations (no schema changes in Sprint 8)
  - Verify pm2 still online (from T-107)
  - Smoke tests: (1) flight detail shows timezone abbreviation adjacent to time; (2) activity with URL shows `<a>` hyperlink; (3) `npx playwright test` → 7/7 PASS
  - Deployment report in qa-build-log.md

- [ ] **T-119** — Monitor Agent: Sprint 8 staging health check ← T-118
  - HTTPS handshake ✅, pm2 `triplanner-backend` online ✅
  - GET /trips/:id with flight — `departure_tz` field present ✅
  - Frontend SPA — flight detail card shows timezone abbreviation text ✅
  - Activity with URL in location — `<a>` element present in rendered output ✅
  - `npx playwright test` → 7/7 PASS ✅
  - All Sprint 6+7 regression checks from T-108 still pass ✅
  - Full report in qa-build-log.md; handoff to User Agent (T-120)

### Phase 4 — User Agent Sprint 8 Walkthrough + Feedback Triage (final pipeline phase)

- [ ] **T-120** — User Agent: Sprint 8 feature walkthrough ← T-119
  - Timezone abbreviations: flight New York August departure → "EDT" (or regional equivalent) shown on detail card
  - Timezone abbreviations: flight Tokyo arrival → "JST"/"GMT+9" shown on detail card
  - Timezone abbreviations: stay Paris (summer) check-in → "CEST"/"GMT+2" shown on detail card
  - URL linkification: activity "Meet at https://maps.google.com/place/XYZ" → URL is clickable `<a>`, opens new tab; "Meet at " is plain text
  - URL linkification: activity plain-text location → no spurious `<a>` elements
  - XSS prevention: activity "javascript:alert(1)" in location → renders as plain text, NOT a link
  - Playwright 7/7: confirm all 7 E2E tests pass
  - Full Sprint 7 regression per T-109 test plan
  - Submit structured feedback to `feedback-log.md` under Sprint 10 / Sprint 8 header

- [ ] **Manager: Triage T-094 + T-109 + T-120 feedback immediately after each walkthrough completes**
  - Any Critical/Major bugs → create H-XXX hotfix tasks (P0 priority, block Sprint 11 planning)
  - Minor/Suggestion → acknowledge and schedule for Sprint 11 backlog
  - All "New" entries must be moved to Tasked, Won't Fix, or Acknowledged before Sprint 11 plan is written

### Phase 5 — Post-Pipeline: New Feature Scoping (only after full pipeline closes and all feedback triaged)

- [ ] **T-121** — Design Agent: Design spec for trip export/print view (B-032) ← T-120
  - Spec 15: Print button placement on TripDetailsPage (top-right, secondary style)
  - Print layout: trip name, destinations, date range, notes, all four sections (Flights, Land Travel, Stays, Activities)
  - `@media print` CSS rules: hide navbar, edit/add/delete buttons, calendar section (interactive); show all trip data in single-column black-on-white
  - Flow: button click → `window.print()` (no PDF library required)
  - IBM Plex Mono font retained in print layout
  - Publish as Spec 15 to `.workflow/ui-spec.md`; Manager approves before T-122 begins

- [ ] **T-122** — Frontend Engineer: Trip print/export implementation ← T-121
  - Add "Print" button to TripDetailsPage (print icon, secondary style, trip header area)
  - onClick → `window.print()`
  - Create `frontend/src/styles/print.css` with `@media print` rules (hide navbar, buttons, calendar; override dark theme to white/black)
  - Import `print.css` in TripDetailsPage.jsx
  - Tests: Print button renders; clicking calls `window.print()` (mocked); all 366+ existing tests continue to pass

---

## Out of Scope

- **All new backend/frontend implementation** — phases 0–4 are pipeline-only; T-121/T-122 are contingent on pipeline closure
- **B-022 — Production deployment to hosting provider** — Blocked on project owner selecting a hosting provider (8 consecutive sprints). Not an engineering task. If no decision received after Sprint 10, Manager will schedule a Deploy Engineer research spike (T-123) in Sprint 11 to recommend provider options.
- **B-020 — Rate limiting persistence (Redis)** — Deferred. In-memory acceptable at current scale.
- **B-024 — Per-account rate limiting** — Depends on B-020. Deferred.
- **B-021 — Dev dependency esbuild vulnerability GHSA-67mh-4wv8-2f99** — No production impact. Monitor for upstream fix.
- **Sort logic duplication in tripModel.js** — Minor DRY violation. Deferred.
- **`formatTimezoneAbbr()` dedicated unit tests** — Acceptable integration coverage; deferred to when `formatDate.test.js` is next touched.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Monitor Agent | Sprint 7 health check (IMMEDIATE — no blockers) | T-108, T-119 |
| User Agent | Sprint 6 walkthrough (IMMEDIATE — ABSOLUTE HARD-BLOCK), Sprint 7 walkthrough, Sprint 8 walkthrough | T-094, T-109, T-120 |
| QA Engineer | Playwright E2E expansion (4→7 tests), Sprint 8 staging E2E verification | T-115, T-116, T-117 |
| Deploy Engineer | Sprint 8 frontend rebuild + staging re-deployment | T-118 |
| Manager | Triage feedback after each walkthrough; create H-XXX hotfixes if Critical/Major bugs; write Sprint 11 plan | Feedback triage |
| Design Agent | Trip export/print spec (Phase 5 only — after pipeline closes) | T-121 |
| Frontend Engineer | Trip print implementation (Phase 5 only — after T-121 approved) | T-122 |
| Backend Engineer | On standby for hotfixes (H-XXX) if walkthroughs reveal Critical/Major bugs | H-XXX (if needed) |

---

## Dependency Chain (Critical Path)

```
T-108 (Monitor: Sprint 7 health check)     ← T-107 (Done 2026-02-28) — START IMMEDIATELY
T-094 (User Agent: Sprint 6 — 5th carry-over) ← T-095 (Done)        — START IMMEDIATELY

[T-108 and T-094 run in PARALLEL — both fully unblocked]

T-108 Done + T-094 Done
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
                                                                └→ Manager: Triage all feedback
                                                                        │
                                                                        └→ T-121 (Design: print spec) [IF clean]
                                                                                │
                                                                                └→ T-122 (Frontend: print impl)
```

**Hotfix rule:** If T-094, T-109, or T-120 reveals a Critical or Major bug, Manager creates H-XXX immediately. Frontend/Backend Engineers are on standby. The hotfix must reach Done (QA-cleared, deployed to staging, Monitor-confirmed) before the next User Agent walkthrough (T-109/T-120) can proceed.

**Integration Check → Done promotion:** T-097, T-098, T-099, T-100, T-101, T-103, T-104 promote to Done after T-108 Monitor confirms Sprint 7 staging health. T-113, T-114 promote to Done after T-119 Monitor confirms Sprint 8 staging health.

---

## Sprint 9 → Sprint 10 Feedback Triage

*No new Sprint 9 User Agent or Monitor Agent feedback entries were submitted. No entries carry "New" status into Sprint 10.*

| FB Entry | Category | Severity | Sprint 10 Disposition | Notes |
|----------|----------|----------|----------------------|-------|
| FB-084 | Feature Gap | Minor | **Resolved** (T-113 Done — awaiting T-118 Deploy for full staging confirmation) | Timezone abbreviation display implemented, Manager-approved, Integration Check. T-118 Deploy will close this fully. |
| (Sprint 9 User/Monitor) | — | — | — | No Sprint 9 entries. T-094, T-109, T-120 will collect Sprint 6/7/8 feedback during Sprint 10. |

---

## Integration Check → Done Promotion

*The following tasks are implementation-complete and QA-cleared. They move to Done when staging deploy confirms them operational.*

| Task | Description | Promoted to Done when |
|------|-------------|----------------------|
| T-097 | Calendar "+X more" popover portal fix (no layout corruption) | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-098 | Stays UTC timezone fix (`localDatetimeToUTC` + pg type parser) | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-099 | Trip details section reorder (Flights → Land Travel → Stays → Activities) | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-100 | All-day activities sort to top of each day group | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-101 | Calendar checkout/arrival time display on last/arrival day | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-103 | Backend: Trip notes — migration 010, PATCH/GET, 13 tests | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-104 | Frontend: Trip notes UI (TripDetailsPage inline edit + TripCard preview) | T-108 Monitor confirms Sprint 7 staging ✅ |
| T-113 | Frontend: Timezone abbreviation display on FlightCard + StayCard | T-119 Monitor confirms Sprint 8 staging ✅ |
| T-114 | Frontend: Activity location URL linkification (`<a>` for https://, plain text otherwise) | T-119 Monitor confirms Sprint 8 staging ✅ |

---

## Definition of Done

*How do we know Sprint #10 is complete?*

**Pipeline Closure — Sprint 7:**
- [ ] T-108: Monitor confirms all Sprint 7 + Sprint 6 regression checks pass on staging
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

**Sprint Closeout:**
- [ ] All three feedback sets triaged (T-094, T-109, T-120) — all "New" entries moved to Tasked/Acknowledged/Won't Fix
- [ ] Any Critical/Major bugs resolved (H-XXX Done) before Sprint 11 plan is written
- [ ] Sprint 10 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 11 plan written in `.workflow/active-sprint.md`

**Optional (Phase 5 — only if pipeline closes cleanly):**
- [ ] T-121: Design spec Spec 15 (trip export/print) published and Manager-approved
- [ ] T-122: Frontend print implementation complete, 2+ tests pass, no regressions

---

## Success Criteria (Sprint 10)

By end of Sprint #10, the following must be verifiable on staging (in addition to all Sprint 1–9 criteria):

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
- [ ] All 366+ tests pass with zero regressions

---

## Blockers

*Active blockers at Sprint 10 start.*

- **T-094 (5th consecutive carry-over — P0 CRITICAL):** Sprint 6 features have never been User Agent-tested. Sprints 6, 7, and 8 features have all accumulated without User Agent validation — this is the single largest quality risk in the project. T-094 is fully unblocked (T-095 Done, T-107 Done, staging healthy). **Must complete this sprint — no exceptions. Zero tolerance for another carry-over.**
- **T-116/T-117 Staging E2E (Blocked by T-115):** Code review portions are Done (18/18 security + 18/18 integration checks PASS). Only the staging Playwright verification remains. T-115 must run first.
- **B-022 (Production Deployment — 8 consecutive sprints):** Blocked on project owner selecting a hosting provider. All application infrastructure (Docker Compose, nginx, CI/CD, deploy runbook) is complete since Sprint 3. **Escalated 8 consecutive sprints. Human decision required.** Deploy Engineer will research hosting options in Sprint 11 (T-123) if no decision is received after Sprint 10.

---

*Previous sprint (Sprint #9) archived to `.workflow/sprint-log.md` on 2026-03-03. Sprint #10 begins 2026-03-04.*

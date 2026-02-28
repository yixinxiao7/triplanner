# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #9 — 2026-02-27

**Sprint Goal:** Close the four-sprint pipeline backlog. Execute the three long-overdue User Agent walkthroughs (T-094 Sprint 6, T-109 Sprint 7, T-120 Sprint 8), two staging deploys (T-107 Sprint 7, T-118 Sprint 8), two Monitor health checks (T-108, T-119), Sprint 8 QA audit (T-116, T-117), and E2E expansion to 7 tests (T-115). Triage all feedback and write the Sprint 10 plan. **Zero new implementation tasks are added this sprint.**

**Context:** Sprint 8 completed all its implementation goals — 7 tasks Done (T-110, T-111, T-112, T-105, T-106, T-113, T-114), and 7 Sprint 7 implementation tasks cleared to Integration Check (T-097, T-098, T-099, T-100, T-101, T-103, T-104). Sprint 8 features T-113 and T-114 also reached Integration Check after Manager approval. However, the QA-cleared T-107 Deploy was never triggered, causing T-094 (Sprint 6), T-109 (Sprint 7), and T-120 (Sprint 8) to carry over for the fourth consecutive time. Sprint 9 is purely a catch-up sprint — the pipeline must close cleanly before Sprint 10 can introduce new features.

**Feedback Triage (Sprint 8 Closeout):** No new Sprint 8 User Agent or Monitor Agent entries were submitted. FB-084 is Resolved (T-113 Done). No feedback entries carry "New" status into Sprint 9. All prior entries remain at their triaged status (see feedback-log.md). Sprint 9 feedback will come exclusively from T-094, T-109, and T-120 walkthroughs once they execute.

**Pipeline-Only Rule:** No design, backend, frontend, or infrastructure implementation tasks may be added to Sprint 9. If T-094 or T-109 feedback reveals a Critical or Major bug, Manager creates a hotfix task (H-XXX) immediately. Minor/Suggestion items go to Sprint 10 backlog.

---

## In Scope

*All tasks below are carry-overs from Sprint 8. No new tasks are created this sprint. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 0 — Immediate Parallel Start (both start NOW — no remaining blockers)

- [x] **T-107** — Deploy Engineer: Sprint 7 staging re-deployment ← **T-106 (Done) — START IMMEDIATELY**
  - Apply migration 010 (notes TEXT NULL to trips table)
  - Rebuild frontend with Sprint 7 changes (T-097/T-098/T-099/T-100/T-101/T-104)
  - Verify pm2 `triplanner-backend` online (from T-095)
  - Smoke test all Sprint 7 features
- [x] **T-094** — User Agent: Sprint 6 feature walkthrough (4th consecutive carry-over) ← **T-095 (Done) — START IMMEDIATELY**
  - Sprint 6 features are deployed on staging (T-092/T-093 Done); HTTPS enabled (T-095 Done)
  - Test: land travel CRUD, calendar event times, "+X more" popover, activity AM/PM fix, FilterToolbar refetch fix, ILIKE search fix, Sprint 1–5 regression
  - Submit structured feedback to feedback-log.md

### Phase 1 — Monitor + User Agent Sprint 7 (sequential after Phase 0)

- [ ] **T-108** — Monitor Agent: Sprint 7 staging health check ← T-107
- [ ] **T-109** — User Agent: Sprint 7 feature walkthrough ← T-108, T-094

### Phase 2 — E2E Expansion (after T-109 confirms staging clean)

- [ ] **T-115** — QA Engineer: Expand Playwright coverage from 4 → 7 tests ← T-109
  - New tests: land travel edit flow, calendar "+X more" popover, mobile viewport (375×812)

### Phase 3 — Sprint 8 QA Pipeline (sequential)

- [ ] **T-116** — QA: Sprint 8 security checklist + code review (T-113 TZ abbreviations, T-114 URL links, T-115 E2E) ← T-115
  - Also: correct api-contracts.md notes field doc (`""` → `null` normalization)
- [ ] **T-117** — QA: Sprint 8 integration testing ← T-116
- [ ] **T-118** — Deploy: Sprint 8 staging re-deployment (frontend rebuild — no new migrations) ← T-117
- [ ] **T-119** — Monitor: Sprint 8 health check (TZ abbreviations, URL links, Playwright 7/7) ← T-118

### Phase 4 — User Agent Sprint 8 + Feedback Triage (final phase)

- [ ] **T-120** — User Agent: Sprint 8 feature walkthrough (TZ abbreviations, URL links, full regression) ← T-119
- [ ] **Manager: Triage T-094 + T-109 + T-120 feedback → write Sprint 10 plan**

---

## Out of Scope

*These items are explicitly deferred. Do not start them this sprint under any circumstances.*

- **All implementation features** — zero new backend, frontend, design, or infrastructure implementation tasks. Sprint 9 is pipeline-only.
- **B-022 — Production deployment to hosting provider** — Blocked on the project owner selecting a hosting provider. All infrastructure complete since Sprint 3. Escalated for 6 consecutive sprints. Not a Sprint 9 engineering task — requires a human decision.
- **B-032 — Trip export/print** — Deferred to Sprint 10. Useful feature but not needed to close the pipeline.
- **B-020 — Rate limiting persistence (Redis)** — Deferred. In-memory acceptable at current scale.
- **B-024 — Per-account rate limiting** — Depends on B-020. Deferred.
- **B-021 — Dev dependency esbuild vulnerability GHSA-67mh-4wv8-2f99** — No production impact. Monitor for upstream fix.
- **Sort logic duplication in tripModel.js** — Minor DRY violation. Deferred.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Triage T-094/T-109/T-120 feedback, create hotfix tasks if Critical/Major bugs found, write Sprint 10 plan | Feedback triage, Sprint 10 planning |
| Deploy Engineer | Sprint 7 staging deploy (IMMEDIATE), Sprint 8 frontend rebuild | T-107, T-118 |
| User Agent | Sprint 6 walkthrough (P0 IMMEDIATE), Sprint 7 walkthrough, Sprint 8 walkthrough | T-094, T-109, T-120 |
| Monitor Agent | Sprint 7 health check, Sprint 8 health check | T-108, T-119 |
| QA Engineer | Playwright E2E expansion (4→7 tests), Sprint 8 security + integration audit, api-contracts.md doc correction | T-115, T-116, T-117 |
| Frontend Engineer | No new tasks this sprint — on standby to fix hotfixes if T-094/T-109 finds Critical/Major bugs | H-XXX (if needed) |
| Backend Engineer | No new tasks this sprint — on standby for hotfixes | H-XXX (if needed) |
| Design Agent | No new tasks this sprint | — |

---

## Dependency Chain (Critical Path)

```
T-107 (Deploy: Sprint 7 staging)     ← T-106 (Done) — START IMMEDIATELY
T-094 (User Agent: Sprint 6 carry-over, 4th) ← T-095 (Done) — START IMMEDIATELY

[Both T-107 and T-094 run in PARALLEL — T-094 tests Sprint 6 features already on staging]

T-108 (Monitor: Sprint 7 health check)    ← T-107
        │
        └→ T-109 (User Agent: Sprint 7 walkthrough) ← T-108, T-094
                │
                └→ T-115 (E2E: Playwright 4→7 tests)
                        │
                        └→ T-116 (QA: Sprint 8 security + code review) ← T-115
                                │
                                └→ T-117 (QA: Sprint 8 integration testing)
                                        │
                                        └→ T-118 (Deploy: Sprint 8 frontend rebuild)
                                                │
                                                └→ T-119 (Monitor: Sprint 8 health check)
                                                        │
                                                        └→ T-120 (User Agent: Sprint 8 walkthrough)
                                                                │
                                                                └→ Manager: Triage feedback → Sprint 10 plan
```

**Critical path (Sprint 7 pipeline):** T-107 → T-108 → T-109.

**T-094 parallel path:** Starts immediately (independent of T-107); gates T-109 (Manager needs Sprint 6 feedback before Sprint 7 walkthrough is considered complete context).

**Critical path (Sprint 8 pipeline):** T-109 → T-115 → T-116 → T-117 → T-118 → T-119 → T-120.

**Hotfix rule:** If T-094 or T-109 reveals a Critical or Major bug, Manager creates H-XXX immediately. Frontend/Backend Engineers are on standby. The hotfix must be completed before T-109/T-120 can be marked Done.

---

## Sprint 8 → Sprint 9 Feedback Triage

*No new Sprint 8 User Agent or Monitor Agent feedback entries were submitted. All Sprint 8 feedback has been disposed of.*

| FB Entry | Category | Severity | Sprint 9 Disposition | Notes |
|----------|----------|----------|---------------------|-------|
| FB-084 | Feature Gap | Minor | **Resolved** (T-113 Done) | Timezone abbreviation display implemented and Manager-approved. Pending staging deploy via T-118 to fully close. |
| (Sprint 8 User/Monitor) | — | — | — | No Sprint 8 entries. T-094, T-109, T-120 will collect Sprint 6/7/8 feedback during Sprint 9. |

---

## Integration Check → Done Promotion

*The following tasks are in Integration Check (implementation complete, QA cleared via T-105/T-106). They move to Done when T-118 staging deploy confirms them operational on HTTPS staging.*

| Task | Description | Promoted to Done when |
|------|-------------|----------------------|
| T-097 | Calendar "+X more" popover portal fix | T-108 Monitor confirms staging ✅ |
| T-098 | Stays UTC timezone fix (localDatetimeToUTC + pg parser) | T-108 Monitor confirms staging ✅ |
| T-099 | Trip details section reorder (Flights → Land Travel → Stays → Activities) | T-108 Monitor confirms staging ✅ |
| T-100 | All-day activities sort to top of each day group | T-108 Monitor confirms staging ✅ |
| T-101 | Calendar checkout/arrival time display | T-108 Monitor confirms staging ✅ |
| T-103 | Backend: Trip notes — migration 010, PATCH/GET, 13 tests | T-108 Monitor confirms staging ✅ |
| T-104 | Frontend: Trip notes UI (TripDetailsPage + TripCard) | T-108 Monitor confirms staging ✅ |
| T-113 | Frontend: Timezone abbreviations on flight/stay detail cards | T-119 Monitor confirms Sprint 8 staging ✅ |
| T-114 | Frontend: Activity location URL linkification | T-119 Monitor confirms Sprint 8 staging ✅ |

---

## Definition of Done

*How do we know Sprint #9 is complete?*

**Sprint 7 Pipeline Closure:**
- [ ] T-107: Deploy completed — migration 010 applied, Sprint 7 frontend live on staging
- [ ] T-108: Monitor confirms all Sprint 7 + Sprint 6 regression checks pass on staging
- [ ] T-094: User Agent Sprint 6 walkthrough complete — structured feedback submitted to feedback-log.md
- [ ] T-094 feedback triaged by Manager (New → Tasked/Acknowledged/Won't Fix) — hotfixes created if Critical/Major
- [ ] T-109: User Agent Sprint 7 walkthrough complete — structured feedback submitted to feedback-log.md
- [ ] T-109 feedback triaged by Manager

**Sprint 8 Pipeline Closure:**
- [ ] T-115: Playwright E2E expanded from 4 to 7 tests — all 7 passing
- [ ] T-116: QA Sprint 8 security checklist complete — T-113/T-114 approved; api-contracts.md notes doc corrected
- [ ] T-117: QA Sprint 8 integration testing complete — 20+ checks passing; E2E 7/7
- [ ] T-118: Deploy Sprint 8 — frontend rebuilt with T-113/T-114, smoke tests pass
- [ ] T-119: Monitor Sprint 8 — TZ abbreviations visible, URL links functional, Playwright 7/7, regression clean
- [ ] T-120: User Agent Sprint 8 walkthrough complete — structured feedback submitted to feedback-log.md
- [ ] T-120 feedback triaged by Manager

**Sprint Closeout:**
- [ ] All Integration Check tasks (T-097–T-104, T-113, T-114) promoted to Done after staging confirmation
- [ ] Sprint 9 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 10 plan written in `.workflow/active-sprint.md` based on triaged feedback

---

## Success Criteria (Sprint 9)

By the end of Sprint #9, the following must be verifiable on staging (in addition to all Sprint 1–8 criteria):

**Sprint 7 features (verified on staging by T-109 User Agent):**
- [ ] "+X more" popover opens without calendar day cell layout corruption (portal fix)
- [ ] Stays check-in time saved as 4:00 PM displays as 4:00 PM — not shifted by UTC offset
- [ ] Trip details page section order: Flights → Land Travel → Stays → Activities
- [ ] All-day activities (no start_time) appear at top of their day group
- [ ] Stay checkout time shows on checkout day in calendar (e.g., "check-out 11a")
- [ ] Flight arrival time shows on arrival day in calendar (e.g., "arrives 8a")
- [ ] Trip notes: freeform notes addable on trip details page, truncated on TripCard
- [ ] Full Sprint 6 regression: land travel CRUD, ILIKE search, filter/sort all still operational

**Sprint 8 features (verified on staging by T-120 User Agent):**
- [ ] Flight departing New York (August) → detail card shows departure timezone abbreviation (e.g., "EDT")
- [ ] Flight arriving Tokyo → detail card shows arrival timezone abbreviation (e.g., "JST" or "GMT+9")
- [ ] Stay in Paris (summer) → check-in detail card shows "CEST" (or "GMT+2")
- [ ] Activity location "Meet at https://maps.google.com" → "Meet at " plain text + clickable `<a>` link
- [ ] Activity location "javascript:alert(1)" → renders as plain text (NOT a link)
- [ ] Activity with no URL in location → no spurious `<a>` elements rendered
- [ ] Playwright E2E: 7/7 tests pass (land travel edit, calendar overflow popover, mobile viewport)
- [ ] All 366+ tests pass with zero regressions

---

## Blockers

*Active blockers at Sprint 9 start.*

- **T-094 (4th consecutive carry-over):** Sprint 6 features (land travel, calendar enhancements, bug fixes) have never been User Agent-tested. This is the single most critical quality gap in the project — Sprints 6, 7, and 8 features have all accumulated without User Agent validation. T-094 is unblocked (T-095 Done, Sprint 6 staging live). **Must complete this sprint — no exceptions.**
- **B-022 (Production Deployment):** Deferred since Sprint 3 — blocked on the project owner selecting a hosting provider. All infrastructure (Docker Compose, CI/CD, Dockerfiles, nginx, deployment runbook) is complete. **Escalated for 6 consecutive sprints with no decision received.** This is a human decision, not a Sprint 9 engineering task. Manager will escalate again in Sprint 10 planning.

---

*Previous sprint (Sprint #8) archived to `.workflow/sprint-log.md` on 2026-02-27. Sprint #9 begins 2026-02-27.*

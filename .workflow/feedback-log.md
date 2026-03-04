# Feedback Log

Structured feedback from the User Agent and Monitor Agent after each test cycle. Triaged by the Manager Agent.

---

## Log Fields

| Field | Description |
|-------|-------------|
| Feedback | Short description of the observation |
| Sprint | Sprint number |
| Category | Bug, UX Issue, Feature Gap, Positive, Performance, Security, Monitor Alert |
| Severity | Critical, Major, Minor, Suggestion |
| Status | New, Acknowledged, Tasked, Resolved, Won't Fix |
| Details | Full description of the issue or observation |
| Related Task | Task ID from dev-cycle-tracker.md (if applicable) |

---

## Sprint 7 Feedback

*Sprint 7 ran 2026-02-27. No Sprint 7 User Agent or Monitor Agent feedback entries were submitted. T-094 (User Agent: Sprint 6 feature walkthrough carry-over) remained in Backlog — HTTPS infrastructure was re-enabled (T-095 Done) but the User Agent testing cycle did not execute before sprint closeout. T-109 (User Agent: Sprint 7 walkthrough) also did not run, as the QA → Deploy → Monitor pipeline was blocked by two unresolved frontend tasks: T-098 (1 failing test + 1 missing TripDetailsPage test) and T-104 (0 of 8 required tests written). Both T-094 and T-109 carry to Sprint 8. Sprint 8 must start with T-098/T-104 fixes → T-094 → QA → Deploy → Monitor → T-109.*

**Sprint 7 Feedback Triage Summary (Manager Agent — 2026-02-27):**

*No new Sprint 7 feedback entries exist. Nothing to triage.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| (none) | — | — | — | No Sprint 7 User Agent or Monitor Agent feedback submitted before sprint closeout. T-094 and T-109 did not run. |

*All Sprint 6 project-owner feedback (FB-078 through FB-084) was triaged during Sprint 7 planning. No entries remain "New." FB-078–FB-083 are "Tasked" (implemented or in-flight this sprint). FB-084 is "Acknowledged" (deferred to Sprint 8 pending T-098 timezone fix).*

---

## Sprint 8 Feedback

*Sprint 8 begins 2026-02-27. No new Sprint 7 feedback to triage. FB-084 (Sprint 6 carry-over, previously "Acknowledged") is now promoted to "Tasked" — implementation scheduled as T-113 in Sprint 8, unblocked after T-098 timezone fix.*

**Sprint 8 Feedback Triage Summary (Manager Agent — 2026-02-27):**

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-084 | Feature Gap | Minor | **Tasked → T-113** | Timezone abbreviation display on flight/stay/land travel detail cards. Deferred from Sprint 7 pending T-098 timezone fix. T-098 backend/frontend implementation is approved; Sprint 8 schedules the UX enhancement as T-113. Design spec T-112 covers the abbreviation extraction approach. |
| (Sprint 7 entries) | — | — | — | No Sprint 7 entries. T-094 and T-109 did not run. Feedback for Sprint 6 and Sprint 7 features will be collected in Sprint 8 via T-094 and T-109 respectively. |

*Entries added below as User Agent and Monitor Agent submit Sprint 8 feedback.*

---

**Sprint 8 Closeout Triage Summary (Manager Agent — 2026-02-27):**

*No new Sprint 8 User Agent or Monitor Agent feedback entries were submitted. T-094 (User Agent: Sprint 6 carry-over, 4th consecutive sprint) remained in Backlog — the deploy/monitor/user pipeline (T-107, T-108, T-109) was never reached despite QA clearing (T-105, T-106 Done). T-120 (User Agent: Sprint 8 walkthrough) also did not run. No T-109 or T-120 feedback entries exist.*

*FB-084 (the only Sprint 8 feedback item) was already "Tasked → T-113" at sprint start. T-113 is now Done (Manager-approved, Integration Check). Status updated to Resolved below.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-084 | Feature Gap | Minor | **Resolved → T-113 Done** | Timezone abbreviation display implemented for FlightCard (departure + arrival) and StayCard (check-in + check-out). `formatTimezoneAbbr()` utility added to `formatDate.js`. All 366 tests pass. Awaiting staging deploy (T-118) to fully close. |
| (Sprint 8 User Agent) | — | — | — | No Sprint 8 entries. T-094, T-109, T-120 did not run. Feedback for Sprint 6, Sprint 7, and Sprint 8 features will be collected in Sprint 9. |

*Sprint 9 must collect feedback from three consecutive missed User Agent cycles (Sprints 6, 7, 8). T-094 is a P0 hard-block for Sprint 9 — no new implementation is scoped until T-094 completes and its feedback is triaged.*

---

## Sprint 9 Feedback

*Sprint 9 begins 2026-02-27. No new Sprint 8 User Agent or Monitor Agent feedback entries were submitted — T-094, T-109, and T-120 all remained in Backlog when Sprint 8 closed. FB-084 (the sole Sprint 8 feedback item) was already Resolved via T-113. No entries carry "New" status into Sprint 9.*

*Sprint 9 is a pipeline-closure sprint. All new feedback will originate from three walkthroughs that must complete this sprint: T-094 (Sprint 6 features — land travel, calendar enhancements, bug fixes), T-109 (Sprint 7 features — popover portal fix, stays timezone, section order, all-day sort, calendar checkout/arrival, trip notes), and T-120 (Sprint 8 features — timezone abbreviations, URL linkification). Manager will triage all three feedback sets before Sprint 10 planning begins.*

**Sprint 9 Feedback Triage Summary (Manager Agent — 2026-02-27):**

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| (none — Sprint 8) | — | — | — | No Sprint 8 User/Monitor entries. All prior entries triaged. Awaiting T-094, T-109, T-120 feedback submissions this sprint. |

*Entries will be added here as User Agent submits Sprint 6, Sprint 7, and Sprint 8 feedback during T-094, T-109, and T-120 respectively.*

---

**Sprint 9 Closeout Triage Summary (Manager Agent — 2026-03-03):**

*Sprint 9 closed without any User Agent or Monitor Agent feedback submissions. For the fifth consecutive sprint, T-094 (User Agent: Sprint 6 walkthrough) remained in Backlog. T-108, T-109, T-115, T-116 (staging portion), T-117 (staging portion), T-118, T-119, and T-120 also did not execute. The only pipeline task that completed was T-107 (Deploy: Sprint 7 staging re-deployment — Done 2026-02-28). T-116 and T-117 completed their code-review portions (18/18 security checks, 266+366 tests pass) but remain Blocked on the staging E2E phase, which requires T-115 (Playwright expansion) to run first.*

*No feedback entries carry "New" status out of Sprint 9. All prior entries remain as triaged in Sprint 8 (FB-084: Resolved). Sprint 10 must close the pipeline before any new features are planned — T-094 is now a P0 CRITICAL hard-block for the fifth consecutive sprint.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| (none — Sprint 9) | — | — | — | No Sprint 9 User/Monitor entries. T-094, T-108, T-109, T-115, T-118, T-119, T-120 all did not run. T-116/T-117 code review portions completed (Blocked on staging E2E). All feedback for Sprint 6, 7, and 8 features deferred to Sprint 10 via T-094, T-109, T-120. |

*Sprint 10 must collect feedback from FIVE consecutive missed User Agent cycles (Sprints 6, 7, 8, 9 targets all remained unexecuted). T-094 is a P0 absolute hard-block — Sprint 10 cannot advance past T-094 under any circumstances. Pipeline order: T-108 → T-094 done? → T-109 → T-115 → T-116 (staging) → T-117 (staging) → T-118 → T-119 → T-120 → Manager triage → Sprint 11 plan.*

---

## Sprint 10 Feedback

*Sprint 10 begins 2026-03-04. No new feedback entries carry "New" status into Sprint 10. The most recent feedback item, FB-084, was Resolved in Sprint 8 via T-113. No User Agent or Monitor Agent feedback has been submitted for Sprint 6, Sprint 7, or Sprint 8 features — T-094, T-109, and T-120 all remained in Backlog through Sprints 6–9. Sprint 10 is the sixth consecutive sprint where closing the User Agent pipeline is the primary objective.*

*Sprint 10 will collect feedback from three long-overdue walkthroughs: T-094 (Sprint 6 features — land travel CRUD, calendar enhancements, activity AM/PM fix, FilterToolbar refetch fix, ILIKE search), T-109 (Sprint 7 features — popover portal fix, stays UTC timezone fix, section reorder, all-day activity sort, calendar checkout/arrival times, trip notes), and T-120 (Sprint 8 features — timezone abbreviations on flight/stay cards, URL linkification in activity location). Manager will triage each feedback set immediately after submission and create hotfix tasks (H-XXX) if any Critical or Major bugs are found.*

**Sprint 10 Feedback Triage Summary (Manager Agent — 2026-03-04):**

*No "New" entries carry into Sprint 10. All prior entries (FB-001 through FB-084) were triaged in previous sprints. FB-084 is Resolved (T-113 Done, Integration Check — awaiting T-118 staging deploy for final closure). Awaiting T-094, T-109, T-120 feedback submissions this sprint.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| (none — carry-in) | — | — | — | No entries carry "New" status into Sprint 10. All prior entries triaged. FB-084 Resolved via T-113 (pending T-118 staging confirmation). Awaiting T-094, T-109, T-120 submissions this sprint. |

*Entries will be added here as User Agent submits Sprint 6, Sprint 7, and Sprint 8 feedback during T-094, T-109, and T-120 respectively.*

---

**Sprint 10 Closeout Triage Summary (Manager Agent — 2026-03-04):**

*Sprint 10 closed without any User Agent or Monitor Agent feedback submissions. For the sixth consecutive sprint, T-094 (User Agent: Sprint 6 walkthrough) remained in Backlog. T-108, T-109, T-115, T-118, T-119, and T-120 also did not execute. T-116 and T-117 remain Blocked on the staging E2E phase (code-review portions completed in Sprint 9 — 18/18 security checks, 266/266 backend + 366/366 frontend tests verified).*

*The two tasks that did complete this sprint — T-121 (Design spec: trip export/print, Spec 15) and T-122 (Frontend: trip print implementation, 369/369 tests pass, QA-approved) — were Phase 5 contingent features that ran despite the Pipeline-Only Rule not being satisfied. This is a deviation from the sprint plan. The pipeline remains open and is now in its seventh sprint of attempted closure.*

*No feedback entries carry "New" status out of Sprint 10. All prior entries (FB-001 through FB-084) remain triaged as in previous sprints. FB-084 is Resolved (T-113 Done — awaiting T-118 staging deploy for final confirmation). Sprint 11 must close the pipeline as its absolute first priority — T-094 is a P0 CRITICAL hard-block for the sixth consecutive sprint.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| (none — Sprint 10) | — | — | — | No Sprint 10 User/Monitor entries. T-094, T-108, T-109, T-115, T-118, T-119, T-120 all did not run. T-116/T-117 remain Blocked on staging E2E. T-121/T-122 (trip print feature) completed this sprint and will also need future User Agent testing. All feedback for Sprint 6, 7, 8, and 10 features deferred to Sprint 11. |

*Sprint 11 must collect feedback from SIX consecutive missed User Agent cycles (Sprints 6–10 targets all remained unexecuted). T-094 is a P0 absolute hard-block — Sprint 11 cannot advance past T-094 under any circumstances. Pipeline order: T-108 + T-094 (parallel) → T-109 → T-115 → T-116 (staging E2E) → T-117 (staging E2E) → T-118 → T-119 → T-120 → Manager triage → new T-12X (User Agent Sprint 10 walkthrough for T-122 print feature) → Sprint 12 plan.*

---

## Sprint 11 Feedback

*Sprint 11 begins 2026-03-04. No "New" feedback entries carry into Sprint 11. All prior entries (FB-001 through FB-084) were triaged in previous sprints. FB-084 is Resolved (T-113 Done, T-122 Done and deployed). No User Agent or Monitor Agent feedback has been submitted for Sprint 6, 7, 8, or 10 features — T-094, T-109, T-120, and the new T-123 (Sprint 10 walkthrough) have never run. This is the seventh consecutive sprint where the pipeline has not fully closed.*

*Sprint 11 will collect feedback from four long-overdue walkthroughs: T-094 (Sprint 6 features — land travel CRUD, calendar enhancements, activity AM/PM fix, FilterToolbar refetch, ILIKE search), T-109 (Sprint 7 features — popover portal fix, stays UTC timezone fix, section reorder, all-day sort, calendar checkout/arrival times, trip notes), T-120 (Sprint 8 features — timezone abbreviations on flight/stay cards, URL linkification in activity location), and T-123 (Sprint 10 features — trip print/export via window.print()). Manager will triage each feedback set immediately after submission and create hotfix tasks (H-XXX) if any Critical or Major bugs are found.*

**Sprint 11 Feedback Triage Summary (Manager Agent — 2026-03-04):**

*No "New" entries carry into Sprint 11. All prior entries (FB-001 through FB-084) triaged in previous sprints. FB-084 Resolved (T-113 Done). Awaiting T-094, T-109, T-120, and T-123 feedback submissions this sprint.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| (none — carry-in) | — | — | — | No entries carry "New" status into Sprint 11. All prior entries triaged. FB-084 Resolved. Awaiting T-094, T-109, T-120, T-123 submissions this sprint. |

*Entries will be added here as User Agent submits Sprint 6, Sprint 7, Sprint 8, and Sprint 10 feedback during T-094, T-109, T-120, and T-123 respectively.*

---

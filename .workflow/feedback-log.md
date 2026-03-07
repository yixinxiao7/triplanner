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

**Sprint 11 → Sprint 12 Feedback Triage (Manager Agent — 2026-03-06):**

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-085 | UX Issue | Major | **Tasked → T-125** | Deploy Engineer must use `.env.staging` instead of overwriting `.env`. P1, Sprint 12. |
| FB-086 | UX Issue | Minor | **Tasked → T-126** | DayPopover must stay anchored to trigger on scroll. Frontend fix, P2, Sprint 12. |
| FB-087 | UX Issue | Minor | **Tasked → T-127** | Add "check-in" label to calendar check-in time chip for consistency with "check-out". Frontend fix, P2, Sprint 12. |
| FB-088 | Feature Gap | Minor | **Tasked → T-128** | Calendar should open on the month of the first planned event, not current month. Frontend fix, P2, Sprint 12. |

---

### FB-085 — UX Issue: Deploy phase overwrites .env, breaking local dev

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | UX Issue |
| Severity | Major |
| Status | Tasked → T-125 |
| Related Task | T-125 |

**Description:** The Deploy Engineer agent modifies `backend/.env` to staging settings (HTTPS, port 3001, secure cookies, staging CORS origin) during the deploy phase, but never restores it afterward. This leaves `.env` in staging mode after the sprint completes, which breaks `npm run dev` for the project owner — the frontend proxy can't connect because it expects HTTP on port 3000 by default.

**Recommended fix:** Use a separate `backend/.env.staging` file for staging deployments instead of overwriting `backend/.env`. The deploy phase and staging-related agents should read from `.env.staging`, while `.env` remains untouched for local development. The Deploy Engineer prompt and the deploy phase script should be updated to reference `.env.staging` instead of mutating `.env`.

**Requested by:** Project owner (manual testing feedback)

---

### FB-086 — UX Issue: DayPopover detaches from trigger on page scroll

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked → T-126 |
| Related Task | T-126 |

**Description:** When clicking "+X more" on a calendar day, the DayPopover dropdown detaches from its trigger button on page scroll. The popover is rendered with `position: fixed` via `createPortal` to `document.body`, so it stays at the original viewport coordinates while the page content scrolls. Expected behavior: the dropdown should stay anchored relative to the trigger button.

**Requested by:** Project owner (manual testing feedback)

---

### FB-087 — UX Issue: Calendar check-in time missing "check-in" label

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked → T-127 |
| Related Task | T-127 |

**Description:** On the calendar view, the check-out date explicitly displays a "check-out" label, but the check-in date does not have a corresponding "check-in" label. For consistency, the check-in time should explicitly say "check-in" the same way "check-out" is written out on the check-out date.

**Requested by:** Project owner (manual testing feedback)

---

### FB-088 — Feature Gap: Calendar should default to month of first planned event

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked → T-128 |
| Related Task | T-128 |

**Description:** When opening the trip details page, the calendar currently defaults to the current month. Instead, it should default to the month of the trip's first planned event (flight, transport, activity, stay, etc.) so the user immediately sees relevant content. If no events have been planned yet, it should fall back to the current month.

**Requested by:** Project owner (manual feedback)

---

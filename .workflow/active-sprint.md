# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #1 — 2026-02-24 to 2026-03-09

**Sprint Goal**: Deliver a working authenticated trip management foundation — users can register, log in, create trips, view trip details (flights, stays, activities in read-only mode), delete trips, and navigate the app.

---

## In Scope

*All tasks below are in `dev-cycle-tracker.md`. Dependency order is enforced — no task starts before its Blocked By items are Done.*

### Phase 1 — Design Specs (start immediately)
- [ ] T-001 — Design spec: Auth screens (login, register)
- [ ] T-002 — Design spec: Home page (trip list, create-trip modal, empty state, navbar)
- [ ] T-003 — Design spec: Trip details page (view mode, all sections, empty states)

### Phase 2 — API Contracts & Schema (start immediately, parallel to Design)
- [ ] T-004 — API contracts: Auth endpoints
- [ ] T-005 — API contracts: Trips CRUD endpoints
- [ ] T-006 — API contracts: Flights, Stays, Activities endpoints
- [ ] T-007 — Database schema design (all tables)

### Phase 3a — Backend Implementation (after Phase 2 approved)
- [ ] T-008 — Backend project setup
- [ ] T-009 — Database migrations
- [ ] T-010 — Backend: Auth API
- [ ] T-011 — Backend: Trips API
- [ ] T-012 — Backend: Flights, Stays, Activities API

### Phase 3b — Frontend Implementation (after Phase 1 + Phase 2 approved)
- [ ] T-013 — Frontend project setup
- [ ] T-014 — Frontend: Auth pages
- [ ] T-015 — Frontend: Navbar component
- [ ] T-016 — Frontend: Home page
- [ ] T-017 — Frontend: Trip details page (view mode)

### Phase 4 — QA, Deploy, Monitor (after Phase 3a + 3b complete)
- [ ] T-018 — QA: Security checklist + code review audit
- [ ] T-019 — QA: Integration testing
- [ ] T-020 — Deploy: Staging deployment
- [ ] T-021 — Monitor: Staging health check
- [ ] T-022 — User Agent: Feature walkthrough + feedback

---

## Out of Scope

*These items are explicitly deferred to Sprint #2 or later. Do not start them this sprint.*

- **Edit pages for flights, stays, activities** — Sprint #2 (B-001, B-002, B-003). Trip details page in Sprint 1 is view-only with empty states and CTA placeholder buttons.
- **Calendar component** — Sprint #2 (B-004). A placeholder message ("Calendar coming soon") is acceptable in Sprint 1.
- **Trip status auto-calculation** — Sprint #2 (B-005). Status is manually set (defaults to PLANNING on create).
- **Multi-destination structured UI** — Sprint #2 (B-007). Destinations stored as a text/JSON field for now.
- **Production deployment** — Sprint #2 (B-008). This sprint targets staging only.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Manager | Sprint planning (done), code review, approve API contracts + schema, unblock agents | Review all T-00x docs; approve before T-008–T-017 start |
| Design Agent | Write UI specs for all three screen groups | T-001, T-002, T-003 |
| Backend Engineer | Define schema + API contracts, then implement all backend APIs | T-004 through T-012 |
| Frontend Engineer | Set up frontend, build auth pages, home page, trip details page | T-013 through T-017 |
| QA Engineer | Security checklist, code review audit, integration testing | T-018, T-019 |
| Deploy Engineer | Containerize backend, build frontend, deploy to staging | T-020 |
| Monitor Agent | Post-deploy health checks and error monitoring on staging | T-021 |
| User Agent | Full walkthrough of both user flows (new user + returning user), submit feedback | T-022 |

---

## Dependency Chain (Critical Path)

```
T-001 (Design: Auth)         ──────────────────────────────────┐
T-002 (Design: Home)         ──────────────────────────────────┤
T-003 (Design: Trip Details) ──────────────────────────────────┤
                                                                ↓
T-004 (API: Auth)            ──────────────────── T-010 (BE: Auth API)
T-005 (API: Trips)           ──────────────────── T-011 (BE: Trips API)       ──┐
T-006 (API: Flights/Stays)   ──────────────────── T-012 (BE: Flights/Stays)   ──┤
T-007 (DB Schema)            ──┐                                                 ↓
T-008 (BE Setup)             ──┴── T-009 (Migrations) ────────── (All BE tasks) ─┤
                                                                                  ↓
T-013 (FE Setup)             ──┬── T-014 (FE: Auth)                              │
                               ├── T-015 (FE: Navbar)                            │
                               ├── T-016 (FE: Home)                              │
                               └── T-017 (FE: Trip Details)                      │
                                                                                  ↓
                                                               T-018 (QA: Security + Review)
                                                                                  ↓
                                                               T-019 (QA: Integration Tests)
                                                                                  ↓
                                                               T-020 (Deploy: Staging)
                                                                                  ↓
                                                               T-021 (Monitor: Health Check)
                                                                                  ↓
                                                               T-022 (User Agent: Testing)
```

---

## Definition of Done

*How do we know Sprint #1 is complete?*

- [ ] Design Agent has published UI specs for all frontend tasks (T-001, T-002, T-003) to `.workflow/ui-spec.md`
- [ ] Backend Engineer has documented all API contracts (T-004, T-005, T-006) in `.workflow/api-contracts.md` and schema in technical context before implementation begins
- [ ] Manager Agent has reviewed and approved API contracts and schema before backend implementation starts (T-008 onward)
- [ ] All Phase 3 tasks (T-008 through T-017) are marked Done in dev-cycle-tracker.md
- [ ] All task dependencies (Blocked By) are resolved before moving tasks to In Progress
- [ ] Manager Agent has completed code review for all implementation tasks
- [ ] QA Engineer has completed security checklist (T-018) and integration testing (T-019)
- [ ] QA Engineer has logged all results in `.workflow/qa-build-log.md`
- [ ] Deploy Engineer has deployed to staging (T-020)
- [ ] Monitor Agent has verified staging health (T-021) and logged in `.workflow/qa-build-log.md`
- [ ] User Agent has tested both user flows and submitted feedback to `.workflow/feedback-log.md` (T-022)
- [ ] Manager Agent has triaged all feedback entries (Acknowledged → Tasked or Won't Fix)
- [ ] Sprint summary added to `.workflow/sprint-log.md`

---

## Success Criteria (from Project Brief)

By the end of Sprint #1, the following must be verifiable on staging:

- [ ] A new user can register an account and log in
- [ ] A logged-in user can create a trip with a name and destinations
- [ ] The home page shows all trips belonging to the user
- [ ] Clicking a trip navigates to the trip details page
- [ ] The trip details page shows flights, stays, and activities sections (with empty states)
- [ ] A user can delete a trip
- [ ] User data persists across sessions (JWT re-auth works)
- [ ] User can sign out

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

*None currently. Phase 1 and Phase 2 tasks are unblocked and ready to start.*

---

*Archive previous sprint content to sprint-log.md at sprint closeout. This is Sprint #1 — no previous content to archive.*

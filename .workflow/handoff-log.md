# Agent Handoff Log

Context handoffs between agents during a sprint. Every time an agent completes work that another agent depends on, log it here.

---

## How to Use This File

When you finish work that another agent needs to pick up:
1. Add a new entry at the top of the log (newest first)
2. Set Status to "Pending"
3. The receiving agent updates Status to "Acknowledged" when they start, and "Done" when complete

---

## Log

---

### Sprint 1 — Manager → Backend Engineer (Schema ADR Supplement — Read Before T-007)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Task | T-007, T-009, T-010 |
| Handoff Summary | ADR-005 has been published to `.workflow/architecture-decisions.md` with the approved entity definitions for all six tables (users, trips, flights, stays, activities, refresh_tokens). Read ADR-005 before starting T-007. Your schema proposal should match the approved definitions. Key things that must not change without a new ADR: field nullability decisions, enum value sets (PLANNING/ONGOING/COMPLETED, HOTEL/AIRBNB/VRBO), timezone column naming convention (`*_at` for TIMESTAMPTZ + `*_tz` for IANA string), and the RefreshToken table structure for logout. |
| Notes | **Critical addition not in the original handoff:** The `users` table MUST include a `name VARCHAR(255) NOT NULL` column. The project brief requires the sign-up form to collect the user's name. The POST /auth/register endpoint (T-004) must accept `name` in the request body. The existing `architecture.md` User model does not yet show this field — it predates the sprint plan. Backend Engineer should treat ADR-005 as the authoritative source. Also note: `activity_date` and `start_time`/`end_time` on Activities use DATE and TIME types (not TIMESTAMPTZ) per ADR-005 rationale — activities are local-time entries with no cross-timezone display requirement. |

---

### Sprint 1 — Manager → Backend Engineer (API Contracts + Schema)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Backend Engineer |
| Status | Pending |
| Related Task | T-004, T-005, T-006, T-007 |
| Handoff Summary | Sprint #1 is now planned. Your first deliverables are the API contracts and database schema — these must be completed and approved by the Manager Agent before you begin any backend implementation. Write all API contracts to `.workflow/api-contracts.md`. Document the database schema in `.workflow/api-contracts.md` (schema section) or a new `technical-context.md`. See `dev-cycle-tracker.md` for full task specs. After contracts are approved, proceed with T-008 (backend setup) → T-009 (migrations) → T-010 (auth API) → T-011 (trips API) → T-012 (flights/stays/activities API). |
| Notes | Architecture decisions: Use Knex.js for all DB queries (no ORM). JWT access tokens expire in 15 min; refresh tokens in 7 days. Store refresh tokens in DB for invalidation on logout. Passwords hashed with bcrypt (min 12 rounds). Destinations on a trip can be stored as a PostgreSQL TEXT ARRAY or JSONB for MVP. Timezones for flights and stays: store departure/arrival as UTC timestamps PLUS a separate timezone string (e.g., "America/Los_Angeles") so the frontend can display local times. See `rules.md` rule #22: schema changes require Manager approval before implementation. |

---

### Sprint 1 — Manager → Design Agent (UI Specs)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Design Agent |
| Status | Pending |
| Related Task | T-001, T-002, T-003 |
| Handoff Summary | Sprint #1 is now planned. Your deliverables are the UI specs for three screen groups: (1) Auth screens — login and register pages. (2) Home page — trip list with trip cards, create-trip modal, empty state for new users, and navbar. (3) Trip details page — view mode showing all sections (flights, stays, activities) with empty states. Write all specs to `.workflow/ui-spec.md`. These must be published before the Frontend Engineer can start T-014 through T-017. |
| Notes | Design preferences from project brief: Color palette — #02111B (darkest), #3F4045, #30292F, #5D737E, #FCFCFC (lightest). Font: IBM Plex Mono. Style: minimal "Japandi" aesthetic. Trip details page layout: calendar at the top (Sprint 1 can show a placeholder/empty state for the calendar — it will be implemented in Sprint 2). Trip status badge: PLANNING (default), ONGOING, COMPLETED. Empty states should include a CTA prompt (e.g., "No flights yet — add one"). Edit buttons/links for flights, stays, and activities should be visible in the spec but marked as "Sprint 2" — they will exist in the UI as non-functional placeholders or be omitted with a note. |

---

### Sprint 1 — Manager → Frontend Engineer (Setup Notice)

| Field | Value |
|-------|-------|
| Sprint | 1 |
| From Agent | Manager Agent |
| To Agent | Frontend Engineer |
| Status | Pending |
| Related Task | T-013 |
| Handoff Summary | Sprint #1 is now planned. You may begin T-013 (Frontend project setup) immediately — it has no blocking dependencies. Set up React 18 + Vite, React Router v6, auth context with JWT storage and refresh logic, axios instance with interceptors, IBM Plex Mono font, and the project color palette. Do NOT start T-014 through T-017 until Design Agent specs (T-001, T-002, T-003) and API contracts (T-004, T-005, T-006) are done and approved. Watch the handoff log for the signal that those are ready. |
| Notes | Color palette for CSS variables: --color-darkest: #02111B; --color-dark: #3F4045; --color-mid-dark: #30292F; --color-accent: #5D737E; --color-lightest: #FCFCFC. Font: IBM Plex Mono (load from Google Fonts or local). JWT: store access token in memory (React context state), store refresh token in httpOnly cookie if possible — otherwise localStorage with a note about the trade-off. Axios interceptor should auto-refresh on 401. Protected route component should redirect to /login if no valid token. |

---

*Entries are added by each agent when they finish work that another agent depends on. Newest entries go at the top of the Log section.*

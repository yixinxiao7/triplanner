# Sprint Log

Summary of each completed development cycle. Written by the Manager Agent at the end of each sprint.

---

## Template

### Sprint #N — [Start Date] to [End Date]

**Goal:** [What this sprint aimed to accomplish]

**Completed:**
- [List of completed tasks/features]

**Carried Over:**
- [Tasks that didn't finish, moved to next sprint]

**Key Decisions:**
- [Any ADRs created this sprint]

**Feedback Summary:**
- [High-level summary of User Agent and Monitor Agent feedback]

**Retrospective Notes:**
- What went well:
- What could improve:
- Action items for next sprint:

---

## Sprints

### Sprint #1 — 2026-02-24 to 2026-02-24

**Goal:** Deliver a working authenticated trip management foundation — users can register, log in, create trips, view trip details (flights, stays, activities in read-only mode), delete trips, and navigate the app.

**Goal Met:** ✅ YES — All 8 sprint success criteria verified on staging by the User Agent and Monitor Agent.

---

**Tasks Completed (22/22):**

| ID | Description | Status |
|----|-------------|--------|
| T-001 | Design spec: Auth screens (login, register) | ✅ Done |
| T-002 | Design spec: Home page (trip list, create-trip modal, empty state, navbar) | ✅ Done |
| T-003 | Design spec: Trip details page (view mode, all sections, empty states) | ✅ Done |
| T-004 | API contracts: Auth endpoints | ✅ Done |
| T-005 | API contracts: Trips CRUD endpoints | ✅ Done |
| T-006 | API contracts: Flights, Stays, Activities endpoints | ✅ Done |
| T-007 | Database schema design (all 6 tables) | ✅ Done |
| T-008 | Backend project setup (Express, Knex, JWT middleware, folder structure) | ✅ Done |
| T-009 | Database migrations (6 tables, FK constraints, indexes, rollbacks) | ✅ Done |
| T-010 | Backend: Auth API (register, login, refresh token, logout) | ✅ Done |
| T-011 | Backend: Trips API (full CRUD, user-scoped, ownership enforcement) | ✅ Done |
| T-012 | Backend: Flights, Stays, Activities API (full CRUD, trip-scoped) | ✅ Done |
| T-013 | Frontend project setup (React 18 + Vite, auth context, axios interceptors, IBM Plex Mono) | ✅ Done |
| T-014 | Frontend: Auth pages (login + register with all validation states) | ✅ Done |
| T-015 | Frontend: Navbar component (sticky, responsive, best-effort logout) | ✅ Done |
| T-016 | Frontend: Home page (trip grid, create modal, inline delete confirmation) | ✅ Done |
| T-017 | Frontend: Trip details page (view mode, all sections with empty/loading/error states) | ✅ Done |
| T-018 | QA: Security checklist + code review audit (19/19 items verified) | ✅ Done |
| T-019 | QA: Integration testing (60 backend + 128 frontend unit tests passing) | ✅ Done |
| T-020 | Deploy: Staging deployment (local processes, port 3001 backend, 4173 frontend) | ✅ Done |
| T-021 | Monitor: Staging health check (18/18 health checks passed) | ✅ Done |
| T-022 | User Agent: Feature walkthrough + structured feedback (10 entries submitted) | ✅ Done |

**Tasks Carried Over:** None. All 22 Sprint 1 tasks completed and verified Done.

---

**Key Decisions (ADRs Created This Sprint):**
- **ADR-001:** Knex.js for all DB queries (no ORM) — enforced via code review
- **ADR-002:** Destinations stored as PostgreSQL TEXT ARRAY on the trips table
- **ADR-003:** Timezone handling for flights/stays — TIMESTAMPTZ columns (`*_at`) + companion IANA timezone string (`*_tz`); activities use DATE + TIME (local, no timezone conversion needed)
- **ADR-004:** Refresh token strategy — SHA-256 hash stored in DB, raw token sent as httpOnly SameSite=Strict cookie only; token rotation on every refresh
- **ADR-005:** Authoritative entity definitions for all 6 tables (field names, types, nullability, enum value sets)

---

**Feedback Summary (from User Agent T-022, 2026-02-24):**

*4 issues found, 6 positive findings.*

| Entry | Category | Severity | Disposition | Description |
|-------|----------|----------|-------------|-------------|
| FB-001 | Bug | Major | **Tasked → B-009** | Invalid UUID path param returns HTTP 500 with raw PostgreSQL error code `22P02` leaking to client |
| FB-002 | Bug | Major | **Tasked → B-010** | `activity_date` returned as full ISO 8601 timestamp instead of YYYY-MM-DD per API contract |
| FB-003 | Security | Major | **Tasked → B-011** | No rate limiting on `/auth/login` or `/auth/register`; brute-force login possible |
| FB-004 | Bug | Minor | Acknowledged (backlog → B-012) | Malformed JSON body returns misleading `INTERNAL_ERROR` code instead of `INVALID_JSON` |
| FB-005 | Positive | — | Acknowledged | All happy-path user flows work correctly end-to-end |
| FB-006 | Positive | — | Acknowledged | Input validation is comprehensive and correct across all endpoints |
| FB-007 | Positive | — | Acknowledged | Cross-user access protection (403 enforcement) is correct |
| FB-008 | Positive | — | Acknowledged | Auth middleware correctly rejects all invalid token scenarios |
| FB-009 | Positive | — | Acknowledged | Frontend components fully implement all UI states per spec |
| FB-010 | Positive | — | Acknowledged | Frontend SPA routing and production build output are clean |

---

**What Went Well:**
- Perfect delivery: 22/22 tasks completed in a single sprint with zero rework cycles
- All implementation tasks passed Manager code review on the first attempt — no tasks were sent back for revisions
- Strong test coverage: 60 backend unit tests + 128 frontend unit tests covering happy paths, error paths, and validation edge cases
- Security posture is production-grade: bcrypt 12 rounds, SHA-256 refresh token hash, token rotation, httpOnly SameSite=Strict cookie, timing-safe login, parameterized Knex queries, no XSS vectors, no stack traces in error responses, CORS restricted
- API contract compliance was exact — User Agent confirmed all response shapes and HTTP status codes matched `api-contracts.md` (except the pre-existing `activity_date` serialization bug)
- Frontend components implement all 4 UI states (loading skeleton, empty state, error state, success) for every section, with full ARIA accessibility attributes
- The multi-agent orchestration (Design → Contracts → Backend + Frontend in parallel → QA → Deploy → Monitor → User) ran cleanly with well-structured handoffs

**What Could Improve:**
- Rate limiting (`express-rate-limit`) was installed but not wired up — it should be treated as a P1 implementation requirement, not an accepted risk deferred to the next sprint
- The PostgreSQL DATE → JavaScript Date serialization issue (`activity_date` returning as ISO timestamp) was not caught by unit tests — backend tests should include response shape assertions specifically on date-typed fields
- UUID path parameter edge cases were not tested in backend unit tests — coverage for malformed path params (non-UUID strings) would have caught the `22P02` leak before staging
- Staging infrastructure relied on manual local processes without pm2 — a crash would require manual restart with no alerting or automatic recovery
- Docker was unavailable on the staging machine, preventing the planned Docker Compose setup; staging used Homebrew PostgreSQL + `node src/index.js` directly

---

**Technical Debt Noted (Carried Forward to Sprint 2+):**
- ⚠️ Rate limiting not applied to auth endpoints — brute-force login possible (FB-003, Sprint 2 P1)
- ⚠️ `activity_date` API serialization mismatch — returns ISO timestamp, not YYYY-MM-DD (FB-002, Sprint 2 P1)
- ⚠️ Invalid UUID path param leaks raw PostgreSQL error code `22P02` — returns 500 instead of 400 (FB-001, Sprint 2 P1)
- `CreateTripModal` `triggerRef` focus-return-to-trigger not attached to trigger element — modal close does not restore focus (P3 cosmetic)
- Axios 401 retry queue has no dedicated unit test — integration-covered only, no isolation test
- Dev dependency esbuild vulnerability GHSA-67mh-4wv8-2f99 — no production build impact, monitor for fix
- HTTPS not configured on local staging — refresh token cookie is `secure: false` in staging; required before any production deployment
- Staging processes not managed by pm2 — no automatic restart on crash or machine reboot

---

**Next Sprint Focus (Sprint 2 Recommendations):**

*Priority order: critical bug fixes from Sprint 1 → remaining MVP core features → enhancements.*

**P0 — Sprint 2 Must-Have (Critical Bug Fixes from Feedback):**
1. **B-009** — Fix invalid UUID path param → HTTP 500: add UUID validation middleware returning clean HTTP 400
2. **B-010** — Fix `activity_date` API serialization: cast PostgreSQL DATE to YYYY-MM-DD string before response
3. **B-011** — Wire up `express-rate-limit` on `/api/v1/auth/*` routes (10 req / 15 min per IP, HTTP 429)

**P1 — Core MVP Features (Primary Sprint 2 Work):**
4. **B-001** — Edit page: Flights (add, edit, delete flight entries with form validation and timezone handling)
5. **B-002** — Edit page: Stays (add, edit, delete stay entries with category selector, address field, check-in/out pickers)
6. **B-003** — Edit page: Activities (add multiple activities with date/time pickers, "+" row, save/cancel routing)
7. **B-006** — Trip date range: allow users to set explicit start/end dates (prerequisite for calendar and status calculation)

**P2 — Enhancements (if capacity allows):**
8. **B-004** — Calendar component (requires B-001, B-002, B-003 complete so real data exists)
9. **B-005** — Trip status auto-calculation (ONGOING/COMPLETED based on trip dates)

**Deferred to Sprint 3+:**
- B-007: Destinations as structured multi-destination add/remove UI
- B-008: Production deployment (after staging is stable and edit flows are complete)
- B-012: Malformed JSON returns misleading `INTERNAL_ERROR` code (Minor, low priority)

---

*Add new sprint summaries above this line, newest first.*

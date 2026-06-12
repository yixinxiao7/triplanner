# Architecture Decisions

Log of key technical decisions made during development. Any decision that affects the tech stack, patterns, or conventions must be recorded here.

---

## How to Log a Decision

Use the ADR (Architecture Decision Record) template below. Number decisions sequentially.

---

## Template

### ADR-[NNN]: [Decision Title]

**Date:** YYYY-MM-DD
**Sprint:** #N
**Status:** Proposed / Accepted / Deprecated / Superseded by ADR-[NNN]
**Decided By:** [Agent name]
**Approved By:** Manager Agent

**Context:** What is the issue or situation that requires a decision?

**Decision:** What was decided?

**Alternatives Considered:**
1. [Alternative A] — why it was rejected
2. [Alternative B] — why it was rejected

**Consequences:** What are the implications of this decision?

---

## Decisions

---

### ADR-008: Dependency Security Hardening — Patch-Version Bumps (Sprint 43, T-329)

**Date:** 2026-05-30
**Sprint:** #43
**Status:** Accepted
**Decided By:** Backend Engineer
**Approved By:** Manager Agent (Sprint 43 plan, T-329)

**Context:** QA flagged for several sprints that the production-runtime dependency chain carried open npm audit advisories. At Sprint 43 start: **backend** had 6 advisories — `qs` (moderate DoS, 6.11.1–6.15.1) pulled in transitively by `body-parser`/`express` (the production runtime path), plus dev-tooling `lodash`/`postcss`/`vite`. **frontend** had 5 advisories — `axios` (multiple prototype-pollution / SSRF / MITM advisories — production runtime) plus dev-tooling `vite`/`ws`/`postcss`/`follow-redirects`.

**Decision:** Resolve all advisories with **non-breaking, in-range `npm audit fix`** (no `--force`, no major-version bumps). Resulting versions:
- **Backend:** `express` 4.22.1 → **4.22.2**, `body-parser` 1.20.4 → **1.20.5**, `qs` 6.14.2 → **6.15.2**. Re-audit: **0 vulnerabilities.**
- **Frontend:** `axios` 1.13.5 → **1.16.1** (+ `follow-redirects` → 1.16.0), `vite` 6.4.1 → **6.4.2** (+ `postcss` → 8.5.15), `ws` → 8.21.0. Re-audit: **0 vulnerabilities.**

All bumps stayed within the existing major version, so no API surface changed. Verified post-bump: backend auth/CORS/rate-limit/error-handler middleware all green; full backend suite **523/523**, frontend suite **536/536** (1059/1059 combined, the established baseline) — **zero regressions**.

**Alternatives Considered:**
1. **Bump express to 5.x / axios to a new major** — rejected: unnecessary; the moderate/high advisories are all fixed within the current major. A major bump risks breaking the API surface (express 5 changes routing/middleware semantics) and was explicitly out of scope per the T-329 directive ("do NOT bump a major version that breaks the API surface without flagging to Manager first").
2. **Leave dev-tooling advisories (vite/ws/postcss) open** — rejected: `npm audit fix` cleared them in the same non-breaking pass at no extra cost, so there was no reason to defer them.
3. **Pin exact versions / add overrides** — rejected: the `^` caret ranges already in `package.json` accept the patched versions; `audit fix` updated the lockfiles. No manual override needed.

**Consequences:** Production-runtime advisories on `express`/`body-parser`/`qs` (backend) and `axios` (frontend) are cleared, plus all dev-tooling advisories. `package-lock.json` (both apps) updated. No code changes were required — purely dependency metadata. QA (T-333) should re-run `npm audit` to confirm 0 vulnerabilities. Staging-only this sprint; production promotion deferred to Sprint 44 with the rest of Sprint 43.

---

### ADR-007: Activity `notes` Field — Nullable TEXT Column (Sprint 43, T-331 / B-036)

**Date:** 2026-05-30
**Sprint:** #43
**Status:** Accepted
**Decided By:** Backend Engineer
**Approved By:** Manager Agent (pre-approved in Sprint 43 plan, `active-sprint.md` §"Manager schema approval")

**Context:** Detail-oriented travelers (the core persona) want to attach freeform context to an activity — reservation numbers, confirmation codes, dress codes, "bring passport". The `activities` table had no `notes` column, so a client-sent `notes` value was silently dropped (never persisted, never returned). Feedback item B-036.

**Decision:** Add a single nullable `notes TEXT` column to `activities` via **migration 011** (`20260530_011_add_activity_notes.js`), mirroring the established `trips.notes` pattern (migration 010, Sprint 7). Length is capped at **2000 chars at the API validation layer** (validate middleware), not the DB — the column is unbounded `TEXT NULL`. HTML tags are stripped on write by the existing `sanitizeHtml` middleware (added to the POST `sanitizeFields` config and the PATCH pre-validate strip list). Empty string normalizes to `null`. The field round-trips through POST / GET / GET:id / PATCH and is included in the model's `SELECT`, insert, and `UPDATABLE` set.

**Alternatives Considered:**
1. **VARCHAR(2000) with a DB-level length constraint** — rejected: inconsistent with the existing `trips.notes` (`TEXT NULL`) convention and with `land_travels.notes`. Enforcing length at the validation layer keeps the cap adjustable without a migration (precedent: trips notes cap was raised 2000→5000 in Sprint 39 with no DDL).
2. **A separate `activity_notes` table (1:1)** — rejected: over-engineered for a single optional text field; adds a join with no benefit. A column is the right altitude.
3. **Cap at 5000 chars to match `trips.notes`** — rejected: an activity note is a short annotation (confirmation code, dress code), not a trip-level description. The Manager pre-approved 2000 for activities; the design spec (T-330) also specifies a 2000-char max.

**Consequences:** Backward-compatible — existing activity rows get `notes = NULL`; no existing query is impacted (`notes` is simply added to the `SELECT`). Pure `ALTER TABLE ADD COLUMN` on a nullable `TEXT` — zero-downtime on PostgreSQL (no table rewrite). Migration verified to apply **and** roll back cleanly on the dev DB. Defense-in-depth on XSS: backend strips tags on write; the frontend (T-332) additionally renders notes as escaped text. **Staging-only this sprint** — Deploy (T-334) runs migration 011 on staging; production promotion deferred to Sprint 44.

---

### ADR-006: Staging PM2 Config Carries Explicit TLS Env (HTTPS Reproducibility)

**Date:** 2026-05-30
**Sprint:** #42
**Status:** Accepted
**Decided By:** Deploy Engineer (T-326)
**Approved By:** Manager Agent (CR-42 Pass #2)

**Context:** During the Sprint 42 staging deploy (T-326), the Deploy Engineer found that the staging block of `infra/ecosystem.config.cjs` omitted TLS environment variables. The running staging backend only served HTTPS because SSL config had been injected out-of-band on a prior manual start; a clean `pm2 start infra/ecosystem.config.cjs` would have brought the backend up **HTTP-only**, silently violating the "HTTPS enforced on all environments" item in `security-checklist.md` and breaking the `CORS_ORIGIN=https://localhost:4173` contract. This is a shared-infrastructure config change and per rules.md #4 must be recorded as an ADR (logged retroactively by Manager at review time — see process note below).

**Decision:** The staging backend block in `infra/ecosystem.config.cjs` now carries explicit TLS env, mirroring `ecosystem.production.config.cjs`:
- `COOKIE_SECURE: 'true'`
- `SSL_KEY_PATH: '../infra/certs/localhost-key.pem'`
- `SSL_CERT_PATH: '../infra/certs/localhost.pem'`

A clean `pm2 start` now reproduces the HTTPS staging contract deterministically. Staging deploys are driven by the new `infra/scripts/deploy-staging.sh` (parallels `deploy-production.sh`; ports 3001/4173, HTTPS smoke tests). These paths reference cert **files** on disk — no secrets are embedded in the config; application secrets (DB URL, JWT) remain in `backend/.env`.

**Alternatives Considered:**
1. **Leave staging HTTP-only, terminate TLS at a proxy** — diverges from production (which terminates TLS in-process), reducing prod/staging parity and weakening the value of staging as a pre-prod mirror. Rejected.
2. **Keep injecting SSL out-of-band per deploy** — non-reproducible; the exact drift that caused this. Any clean restart would regress to HTTP. Rejected.

**Consequences:** Staging and production now share the same in-process TLS model and config shape. Self-signed certs must exist at `infra/certs/` (the deploy script generates them if missing). Any future change to environment TLS handling must update both ecosystem configs together. **Process note:** this ADR was logged by the Manager during code review because the Deploy Engineer made the config change without an accompanying ADR (rules.md #4 requires the changing agent to log shared-config/infra changes at change time). Future infra/config changes must be ADR'd by the originating agent in the same task, not retroactively.

---

### ADR-005: Core Data Model — Entity Definitions and Field Decisions

**Date:** 2026-02-24
**Sprint:** #1
**Status:** Accepted
**Decided By:** Manager Agent
**Approved By:** Manager Agent

**Context:** Sprint #1 requires five core entities: users, trips, flights, stays, and activities — plus a refresh token store for JWT invalidation. The Backend Engineer must implement all migrations in T-009 based on these definitions. Several field decisions needed to be made upfront (enums, nullable fields, timezone fields, activity time representation) to ensure consistent implementation and avoid mid-sprint schema changes.

**Decision:** The canonical entity definitions for Sprint #1 are as follows. The Backend Engineer finalizes exact Knex migration syntax in T-007, but these definitions are the approved schema target:

```
User
├── id                UUID, PK (gen_random_uuid())
├── name              VARCHAR(255), NOT NULL           ← required by project brief (signup form asks for name)
├── email             VARCHAR(255), UNIQUE, NOT NULL
├── password_hash     TEXT, NOT NULL
├── created_at        TIMESTAMPTZ, NOT NULL, default now()
└── updated_at        TIMESTAMPTZ, NOT NULL, default now()

Trip
├── id                UUID, PK
├── user_id           UUID, FK → users.id, ON DELETE CASCADE
├── name              VARCHAR(255), NOT NULL
├── destinations      TEXT[], NOT NULL, default '{}'   ← per ADR-002 (TEXT[] not join table)
├── status            VARCHAR(20), NOT NULL, default 'PLANNING'
│                     CHECK status IN ('PLANNING', 'ONGOING', 'COMPLETED')
├── created_at        TIMESTAMPTZ, NOT NULL, default now()
└── updated_at        TIMESTAMPTZ, NOT NULL, default now()

Flight
├── id                UUID, PK
├── trip_id           UUID, FK → trips.id, ON DELETE CASCADE
├── flight_number     VARCHAR(20), NOT NULL
├── airline           VARCHAR(255), NOT NULL
├── from_location     VARCHAR(255), NOT NULL
├── to_location       VARCHAR(255), NOT NULL
├── departure_at      TIMESTAMPTZ, NOT NULL             ← per ADR-003 (UTC timestamp)
├── departure_tz      VARCHAR(50), NOT NULL             ← per ADR-003 (IANA timezone string)
├── arrival_at        TIMESTAMPTZ, NOT NULL             ← per ADR-003 (UTC timestamp)
├── arrival_tz        VARCHAR(50), NOT NULL             ← per ADR-003 (IANA timezone string)
├── created_at        TIMESTAMPTZ, NOT NULL, default now()
└── updated_at        TIMESTAMPTZ, NOT NULL, default now()

Stay
├── id                UUID, PK
├── trip_id           UUID, FK → trips.id, ON DELETE CASCADE
├── category          VARCHAR(20), NOT NULL
│                     CHECK category IN ('HOTEL', 'AIRBNB', 'VRBO')
├── name              VARCHAR(255), NOT NULL
├── address           TEXT, NULLABLE                   ← nullable: users may not know address yet
├── check_in_at       TIMESTAMPTZ, NOT NULL             ← per ADR-003
├── check_in_tz       VARCHAR(50), NOT NULL             ← per ADR-003
├── check_out_at      TIMESTAMPTZ, NOT NULL             ← per ADR-003
├── check_out_tz      VARCHAR(50), NOT NULL             ← per ADR-003
├── created_at        TIMESTAMPTZ, NOT NULL, default now()
└── updated_at        TIMESTAMPTZ, NOT NULL, default now()

Activity
├── id                UUID, PK
├── trip_id           UUID, FK → trips.id, ON DELETE CASCADE
├── name              VARCHAR(255), NOT NULL
├── location          TEXT, NULLABLE
├── activity_date     DATE, NOT NULL                   ← date only (no timezone; local to destination)
├── start_time        TIME, NOT NULL                   ← local time, no timezone needed (see rationale below)
├── end_time          TIME, NOT NULL
├── created_at        TIMESTAMPTZ, NOT NULL, default now()
└── updated_at        TIMESTAMPTZ, NOT NULL, default now()

RefreshToken
├── id                UUID, PK
├── user_id           UUID, FK → users.id, ON DELETE CASCADE
├── token_hash        TEXT, NOT NULL                   ← store hash of token, not raw value
├── expires_at        TIMESTAMPTZ, NOT NULL
├── revoked_at        TIMESTAMPTZ, NULLABLE            ← null = active; non-null = revoked (logout)
└── created_at        TIMESTAMPTZ, NOT NULL, default now()
```

**Key Indexes:**
- `trips(user_id)` — user trips list query
- `flights(trip_id)` — trip detail query
- `stays(trip_id)` — trip detail query
- `activities(trip_id)` — trip detail query
- `activities(trip_id, activity_date)` — day-grouped itinerary display
- `refresh_tokens(user_id)` — token lookup on refresh
- `refresh_tokens(token_hash)` — token validation (UNIQUE)

**Alternatives Considered:**
1. **Timezone on Activity times** — Activities are local-to-destination time entries (e.g., "go to fisherman's wharf 9am–2pm"). Users enter and read them as local times. Unlike flights, there's no need to display them in a different timezone simultaneously. Using DATE + TIME without TIMESTAMPTZ avoids confusion. If multi-timezone day-planning is needed later, a migration can add a timezone column.
2. **ENUM type for status/category** — PostgreSQL native ENUM types are harder to migrate (cannot easily add values). Using VARCHAR + CHECK constraint is more flexible for future status additions without a schema migration that requires dropping/re-creating the type.
3. **Soft deletes** — Not required for MVP. Hard deletes (ON DELETE CASCADE) are used for all child records. This simplifies queries and is appropriate for user-controlled data.

**Consequences:**
- Backend Engineer must include `name` in the POST /auth/register request body (T-004, T-010)
- Frontend Engineer must include a "name" field in the registration form (T-001, T-014)
- Activity times display as-entered (no timezone conversion needed in Sprint 1)
- All child tables cascade-delete when a trip is deleted (supports Feature 7 in project brief: delete trips)
- RefreshToken table enables server-side logout invalidation per ADR-004

---

### ADR-004: Refresh Token Storage Strategy

**Date:** 2026-02-24
**Sprint:** #1
**Status:** Accepted
**Decided By:** Manager Agent
**Approved By:** Manager Agent

**Context:** JWT refresh tokens need to be stored on the client side. The two common options are httpOnly cookies and localStorage. This affects both security posture and implementation complexity.

**Decision:** Store the refresh token in an httpOnly, Secure, SameSite=Strict cookie. Store the access token in React component state (in-memory). The access token is never written to localStorage or sessionStorage. An axios interceptor calls the refresh endpoint automatically when the access token expires (401 response), transparently re-acquiring a new access token.

**Alternatives Considered:**
1. **localStorage for refresh token** — convenient but vulnerable to XSS attacks; any script on the page can read it. Rejected for security reasons.
2. **sessionStorage for access token** — survives page reloads within a tab but still accessible via JS. Rejected; in-memory is safer.
3. **Both tokens in httpOnly cookies** — eliminates XSS risk entirely but complicates CSRF protection. Deferred as a Sprint 2 security hardening option.

**Consequences:** The backend must set `Set-Cookie` headers for refresh tokens with the appropriate flags. The frontend axios interceptor must handle 401 → refresh → retry transparently. Token persistence across page reloads requires the refresh cookie to work on app mount.

---

### ADR-003: Timezone Handling for Flights and Stays

**Date:** 2026-02-24
**Sprint:** #1
**Status:** Accepted
**Decided By:** Manager Agent
**Approved By:** Manager Agent

**Context:** Flights and hotel stays have departure/arrival and check-in/check-out times that are timezone-sensitive. The project brief explicitly requires showing local timezone times (e.g., "departs 6am ET, lands 8am PT"). We need a strategy that stores the data correctly and allows accurate display.

**Decision:** Store all datetime values as UTC timestamps in PostgreSQL (`TIMESTAMPTZ`). Additionally, store the associated IANA timezone string (e.g., `"America/New_York"`, `"America/Los_Angeles"`) as a separate `VARCHAR` column alongside each datetime. The frontend uses these timezone strings with the browser's `Intl.DateTimeFormat` API (or a library like `date-fns-tz`) to display times in the correct local timezone.

**Alternatives Considered:**
1. **Store times in local time only** — loses the ability to compare across timezones and breaks timeline ordering. Rejected.
2. **Store only UTC, derive timezone from location** — requires geocoding the airport/address, adds complexity and an external API dependency. Rejected for MVP.
3. **Store as ISO 8601 with UTC offset** — offsets change with DST, making stored offsets potentially inaccurate for future dates. Rejected; IANA timezone names handle DST correctly.

**Consequences:** DB schema needs two columns per datetime field (e.g., `departure_at TIMESTAMPTZ`, `departure_timezone VARCHAR(50)`). Frontend must format times using the stored timezone, not the user's browser timezone. Input forms must allow users to specify both the time and the timezone.

---

### ADR-002: Destinations Field on Trip

**Date:** 2026-02-24
**Sprint:** #1
**Status:** Accepted
**Decided By:** Manager Agent
**Approved By:** Manager Agent

**Context:** The project brief allows a trip to have one or more destinations (e.g., a trip to "Tokyo and Osaka"). We need a storage strategy. Options include a separate `destinations` table, a PostgreSQL array column, or a JSONB column.

**Decision:** For Sprint 1, store destinations as a PostgreSQL `TEXT[]` (text array) column on the `trips` table. The create-trip form accepts a comma-separated or multi-input list of destination names. This avoids a join for a simple read and is sufficient for MVP.

**Alternatives Considered:**
1. **Separate `destinations` table** — normalized, but requires a join on every trip read and adds complexity for a simple list of strings. Deferred to a later sprint if destinations gain more structure (e.g., coordinates, country codes).
2. **JSONB array** — more flexible but overkill for an array of strings with no nested fields. TEXT[] is simpler and more readable.

**Consequences:** Destination data cannot be queried or indexed efficiently per-destination in Sprint 1. If Sprint 2 or later needs "find trips by destination," a migration to a join table will be required. Backend Engineer should document this in `technical-context.md`.

---

### ADR-001: Database Query Strategy — Knex.js (No ORM)

**Date:** 2026-02-24
**Sprint:** #1
**Status:** Accepted
**Decided By:** Manager Agent
**Approved By:** Manager Agent

**Context:** The project requires a database access layer. Options range from raw `pg` queries, a query builder (Knex), or a full ORM (Prisma, Sequelize, TypeORM).

**Decision:** Use Knex.js as the sole database interface — both for query building and for running migrations. No ORM. All queries must be explicit, visible, and written using Knex's chainable API (`.select()`, `.where()`, `.insert()`, etc.). No raw string SQL except where Knex's API is insufficient, in which case use `knex.raw()` with parameterized bindings only.

**Alternatives Considered:**
1. **Prisma ORM** — great DX and type safety, but hides SQL logic behind generated code and makes queries harder to audit. Contradicts the architecture constraint "no ORM magic." Rejected.
2. **Raw `pg` queries** — maximum visibility but verbose, error-prone, and harder to maintain migrations. Knex provides migrations + query builder in one package. Rejected.
3. **Sequelize** — heavy ORM with the same "hidden SQL" problem as Prisma. Rejected.

**Consequences:** All Backend Engineer code must use Knex. No `require('pg')` directly in application code. Queries are auditable and explicit. Migrations are managed via `knex migrate:latest` / `knex migrate:rollback`. Every migration must include both `up` and `down` functions per rules.md rule #20.

---

*Add new ADRs above this line, newest first.*

## ADR — Google Calendar Export via googleapis + incremental OAuth (T-343, 2026-06-11)

**Decision:** Export trips to Google Calendar through the official `googleapis` Node client (new backend dependency), using incremental authorization: the `https://www.googleapis.com/auth/calendar` scope is requested only when the user clicks Export — never during sign-in. Tokens are stored on `users` (access/refresh/expiry, migration 013); `trips.google_calendar_id` tracks the dedicated per-trip calendar so re-exports wipe-and-recreate instead of duplicating events.

**Alternatives considered:** (a) .ics file download — no OAuth/verification burden but a 2-step UX; user explicitly chose API export. (b) Inserting into the user's primary calendar with per-event dedup bookkeeping — rejected in favor of a dedicated calendar per trip (clean re-export, single delete to remove a trip).

**Consequences:** Same Google OAuth client as Sign-In, new redirect URI (`GOOGLE_CALENDAR_CALLBACK_URL`) must be authorized in Google Cloud Console; production use beyond test users requires Google app verification for the calendar scope. Endpoints degrade to 503 `GOOGLE_CALENDAR_UNAVAILABLE` when unconfigured (mirrors the Sign-In pattern). OAuth `state` is a 10-minute signed JWT (`purpose: 'gcal_connect'`) because the initiation must be an authenticated XHR while the callback arrives as an unauthenticated browser redirect.

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

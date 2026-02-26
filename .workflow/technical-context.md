# Technical Context

A living reference for all technical decisions and infrastructure details. Agents should consult this before making any architectural or tooling choices.

---

## Tech Stack

See `architecture.md` in the project root for the authoritative tech stack table.

---

## Database Migrations

All schema changes must be tracked here. Before deploying any migration, verify it has been tested on staging first.

**Rules for the Backend Engineer:**
- Every schema change must have a corresponding entry here before the task is marked Done
- Migrations must be reversible where possible — always write a rollback
- Never run a migration on Production without first verifying on Staging
- Add a note in the Handoff Log when a migration is ready for the Deploy Engineer

**Migration Log:**

| # | Sprint | Description | Type | File | Status |
|---|--------|-------------|------|------|--------|
| 001 | 1 | Create `users` table | Create Table | `20260224_001_create_users.js` | ✅ Applied on Staging (2026-02-24, T-020) |
| 002 | 1 | Create `refresh_tokens` table | Create Table | `20260224_002_create_refresh_tokens.js` | ✅ Applied on Staging (2026-02-24, T-020) |
| 003 | 1 | Create `trips` table | Create Table | `20260224_003_create_trips.js` | ✅ Applied on Staging (2026-02-24, T-020) |
| 004 | 1 | Create `flights` table | Create Table | `20260224_004_create_flights.js` | ✅ Applied on Staging (2026-02-24, T-020) |
| 005 | 1 | Create `stays` table | Create Table | `20260224_005_create_stays.js` | ✅ Applied on Staging (2026-02-24, T-020) |
| 006 | 1 | Create `activities` table | Create Table | `20260224_006_create_activities.js` | ✅ Applied on Staging (2026-02-24, T-020) |
| 007 | 2 | Add `start_date` + `end_date` to `trips` table | Alter Table | `20260225_007_add_trip_date_range.js` | ✅ Applied on Staging (2026-02-25, T-038) |
| 008 | 3 | Make `start_time` + `end_time` nullable on `activities` | Alter Table | `20260225_008_make_activity_times_optional.js` | ✅ Implemented — awaiting staging deploy (T-054) |

---

## Sprint 1 Schema Design (T-007)

**Status: Approved by Manager Agent** (per ADR-005, 2026-02-24; confirmed in handoff-log.md "Schema ADR Supplement")

This section documents the proposed schema for all six tables to be created in Sprint 1. The Backend Engineer should implement these exactly as described using Knex migration files in `backend/src/migrations/`.

---

### Migration 001 — `users` table

**File:** `backend/src/migrations/20260224_001_create_users.js`

**up():**
```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255)  NOT NULL,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
```

**down():**
```sql
DROP TABLE IF EXISTS users;
```

**Notes:**
- `name` is NOT NULL — required by sign-up form per project brief and ADR-005.
- `email` has a UNIQUE constraint enforced at DB level (also caught in application layer for 409 response).
- `password_hash` stores bcrypt hash (min 12 rounds). Never store or log the raw password.
- No index on `email` beyond the UNIQUE constraint (which creates an implicit B-tree index).

---

### Migration 002 — `refresh_tokens` table

**File:** `backend/src/migrations/20260224_002_create_refresh_tokens.js`

**up():**
```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens(user_id);
```

**down():**
```sql
DROP TABLE IF EXISTS refresh_tokens;
```

**Notes:**
- `token_hash` stores a SHA-256 hash of the opaque refresh token string — never store the raw token.
- `revoked_at NULL` = token is active. `revoked_at IS NOT NULL` = token has been invalidated (logout or rotation).
- The UNIQUE constraint on `token_hash` creates an implicit index — no separate index needed for token lookups.
- `user_id` index supports "get all tokens for a user" queries (e.g., for invalidating all sessions).

---

### Migration 003 — `trips` table

**File:** `backend/src/migrations/20260224_003_create_trips.js`

**up():**
```sql
CREATE TABLE trips (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  destinations TEXT[]       NOT NULL DEFAULT '{}',
  status       VARCHAR(20)  NOT NULL DEFAULT 'PLANNING'
               CONSTRAINT trips_status_check CHECK (status IN ('PLANNING', 'ONGOING', 'COMPLETED')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX trips_user_id_idx ON trips(user_id);
```

**down():**
```sql
DROP TABLE IF EXISTS trips;
```

**Notes:**
- `destinations TEXT[]` stores an array of destination name strings. Per ADR-002, this is a PostgreSQL TEXT array column (not a join table).
- `status` uses VARCHAR + CHECK constraint (not a native ENUM type) per ADR-005 for migration flexibility.
- `ON DELETE CASCADE` on `user_id` — if a user is deleted, all their trips are deleted too.
- `trips_user_id_idx` supports the `GET /api/v1/trips` list query (filter by user_id).

---

### Migration 004 — `flights` table

**File:** `backend/src/migrations/20260224_004_create_flights.js`

**up():**
```sql
CREATE TABLE flights (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  flight_number  VARCHAR(20)  NOT NULL,
  airline        VARCHAR(255) NOT NULL,
  from_location  VARCHAR(255) NOT NULL,
  to_location    VARCHAR(255) NOT NULL,
  departure_at   TIMESTAMPTZ  NOT NULL,
  departure_tz   VARCHAR(50)  NOT NULL,
  arrival_at     TIMESTAMPTZ  NOT NULL,
  arrival_tz     VARCHAR(50)  NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX flights_trip_id_idx ON flights(trip_id);
```

**down():**
```sql
DROP TABLE IF EXISTS flights;
```

**Notes:**
- `departure_at` / `arrival_at` are stored as TIMESTAMPTZ (UTC). Per ADR-003, the companion `*_tz` columns store the IANA timezone string (e.g., `"America/New_York"`) so the frontend can display local times.
- `from_location` / `to_location` accept any string (typically IATA airport codes like "JFK" but not enforced).
- `ON DELETE CASCADE` — flights are deleted when their parent trip is deleted.

---

### Migration 005 — `stays` table

**File:** `backend/src/migrations/20260224_005_create_stays.js`

**up():**
```sql
CREATE TABLE stays (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category      VARCHAR(20)  NOT NULL
                CONSTRAINT stays_category_check CHECK (category IN ('HOTEL', 'AIRBNB', 'VRBO')),
  name          VARCHAR(255) NOT NULL,
  address       TEXT         NULL,
  check_in_at   TIMESTAMPTZ  NOT NULL,
  check_in_tz   VARCHAR(50)  NOT NULL,
  check_out_at  TIMESTAMPTZ  NOT NULL,
  check_out_tz  VARCHAR(50)  NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX stays_trip_id_idx ON stays(trip_id);
```

**down():**
```sql
DROP TABLE IF EXISTS stays;
```

**Notes:**
- `address` is nullable — users may not know the address yet.
- `category` uses VARCHAR + CHECK constraint (not native ENUM) per ADR-005.
- `check_in_tz` / `check_out_tz` can differ from each other (e.g., crossing timezones), so both are stored.

---

### Migration 006 — `activities` table

**File:** `backend/src/migrations/20260224_006_create_activities.js`

**up():**
```sql
CREATE TABLE activities (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  location       TEXT         NULL,
  activity_date  DATE         NOT NULL,
  start_time     TIME         NOT NULL,
  end_time       TIME         NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX activities_trip_id_idx ON activities(trip_id);
CREATE INDEX activities_trip_id_date_idx ON activities(trip_id, activity_date);
```

**down():**
```sql
DROP TABLE IF EXISTS activities;
```

**Notes:**
- `activity_date DATE` and `start_time TIME` / `end_time TIME` are stored without timezone per ADR-005 rationale: activities are local-to-destination entries (e.g., "9am museum visit") and don't require cross-timezone display.
- `location` is nullable.
- Compound index on `(trip_id, activity_date)` supports the day-grouped itinerary display query efficiently.

---

### Migration Order and Dependencies

Migrations **must** be applied in this order due to foreign key dependencies:

```
001_create_users
  └── 002_create_refresh_tokens (FK: user_id → users)
  └── 003_create_trips (FK: user_id → users)
        └── 004_create_flights (FK: trip_id → trips)
        └── 005_create_stays (FK: trip_id → trips)
        └── 006_create_activities (FK: trip_id → trips)
```

Rollback order is the reverse:
```
006 → 005 → 004 → 003 → 002 → 001
```

Knex handles this ordering automatically via migration file timestamps — file naming convention ensures correct order.

---

### Manager Approval Note

*Per the automated sprint flow: Schema design in T-007 follows ADR-005 (approved by Manager Agent on 2026-02-24) and the "Schema ADR Supplement" handoff in handoff-log.md. The schema proposal above matches the ADR-005 entity definitions exactly. This schema is **approved** for implementation in T-009. No further approval gate is required before the Backend Engineer proceeds with migration files.*

---

## Third-Party Services & APIs

External services integrated into the app. Agents should not add new services without logging a decision in Architecture Decisions.

| Service | Purpose | Docs Link |
|---------|---------|-----------|
| PostgreSQL | Primary relational database | https://www.postgresql.org/docs/ |
| Knex.js | Query builder and migration runner | https://knexjs.org/ |
| jsonwebtoken | JWT signing and verification (access tokens) | https://github.com/auth0/node-jsonwebtoken |
| bcrypt | Password hashing (min 12 rounds) | https://github.com/kelektiv/node.bcrypt.js |
| crypto (Node built-in) | SHA-256 hashing of refresh tokens before DB storage | Node.js built-in |

---

---

## Sprint 2 Schema Changes (T-029)

**Proposed by:** Backend Engineer — 2026-02-25
**Pre-Approved by:** Manager Agent — 2026-02-25 (see `active-sprint.md` Schema Change Pre-Approval section)

### Migration 007 — Add `start_date` + `end_date` to `trips` table

**File:** `backend/src/migrations/20260225_007_add_trip_date_range.js`

**Motivation:** Required to support trip date range display on home page trip cards (T-034), trip status auto-calculation (T-030), and the calendar component date context (T-035). Part of feedback item B-006 (Sprint 1 → Sprint 2).

**up():**
```sql
ALTER TABLE trips
  ADD COLUMN start_date DATE NULL,
  ADD COLUMN end_date   DATE NULL;
```

**down():**
```sql
ALTER TABLE trips
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date;
```

**Notes:**
- Both columns are `DATE NULL` — no default value, no `NOT NULL` constraint. Existing rows keep `NULL` for both fields and the app handles null gracefully everywhere.
- `DATE` type (not `TIMESTAMPTZ`) — trip dates are calendar-level concepts (which day the trip starts/ends), not precise datetimes. No timezone column companion needed.
- No new indexes — date filtering is always user-scoped, relying on the existing `trips_user_id_idx`. Adding a date index is premature optimization.
- The `trips_status_check` constraint and all other `trips` columns are unaffected.
- API contract updates documented in `.workflow/api-contracts.md` (T-029 section).

**Migration order note:** This migration (`007`) must run after all six Sprint 1 migrations (`001`–`006`). Knex handles ordering by filename prefix timestamp — `20260225_` is after all `20260224_` files.

**Rollback verification:** Running `down()` should drop both columns cleanly on a table that has `start_date` and `end_date`. The `IF EXISTS` guards against double-rollback errors.

**Deploy note:** A handoff to the Deploy Engineer will be logged when T-029 implementation is complete and the migration file is committed. The migration must be applied on staging before the rebuilt frontend goes live (trip cards will call `trip.start_date` which would be `undefined` without the column).

### Manager Approval Note

*Schema change pre-approved by Manager Agent on 2026-02-25 as part of Sprint 2 planning. Documented in `active-sprint.md` under "Schema Change Pre-Approval". No additional approval gate required before Backend Engineer creates the migration file in T-029 implementation phase.*

---

## Sprint 3 Schema Changes (T-043)

**Proposed by:** Backend Engineer — 2026-02-25
**Pre-Approved by:** Manager Agent — 2026-02-25 (see `active-sprint.md` Schema Change Pre-Approval section — conditional approval for this exact change)

### Migration 008 — Make `start_time` and `end_time` nullable on `activities` table

**File:** `backend/src/migrations/20260225_008_make_activity_times_optional.js`

**Motivation:** Required to support "all day" / timeless activities where users don't want to specify specific times (e.g., "Free Day", "Explore the city"). Part of feedback item FB-023 (Sprint 2) → B-016 → T-043.

**up():**
```sql
ALTER TABLE activities
  ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE activities
  ALTER COLUMN end_time DROP NOT NULL;
```

**down():**
```sql
-- Set any NULL values to a safe default before re-adding NOT NULL constraint
UPDATE activities SET start_time = '00:00:00' WHERE start_time IS NULL;
UPDATE activities SET end_time = '00:00:00' WHERE end_time IS NULL;

ALTER TABLE activities
  ALTER COLUMN start_time SET NOT NULL;

ALTER TABLE activities
  ALTER COLUMN end_time SET NOT NULL;
```

**Notes:**
- Only changes nullability — no column type change, no new columns, no index changes.
- Existing activities (all currently have non-null times) are completely unaffected by the `up()` migration.
- The `down()` rollback handles any NULL values inserted after `up()` by defaulting them to `'00:00:00'` before re-adding the NOT NULL constraint. This is a lossy rollback (timeless activities become midnight-to-midnight), which is acceptable since rollback is a recovery scenario.
- The existing composite index `activities_trip_id_date_idx ON (trip_id, activity_date)` continues to work correctly — it does not include time columns.
- The existing index `activities_trip_id_idx` is also unaffected.
- No new indexes needed — the NULLS LAST ordering is applied at query time via ORDER BY, not via index.
- API contract updates documented in `.workflow/api-contracts.md` (T-043 section).
- **Migration must run BEFORE the updated backend code is deployed**, since the new validation allows null times and the INSERT/UPDATE queries will send NULL values.

**Migration order note:** This migration (`008`) must run after migration `007` (Sprint 2). Knex handles ordering by filename prefix timestamp.

### Manager Approval Note

*Schema change pre-approved by Manager Agent on 2026-02-25 as part of Sprint 3 planning. Documented in `active-sprint.md` under "Schema Change Pre-Approval (Conditional)" — this is the exact change described there. The migration file name matches the convention (`20260225_008_make_activity_times_optional.js`). No additional approval gate required before Backend Engineer creates the migration file in T-043 implementation phase.*

### Migration Log Update

| # | Sprint | Description | Type | File | Status |
|---|--------|-------------|------|------|--------|
| 008 | 3 | Make `start_time` + `end_time` nullable on `activities` table | Alter Table | `20260225_008_make_activity_times_optional.js` | ✅ Applied on Staging (2026-02-25, T-054) |

---

## Sprint 5 — No Schema Changes Required (T-072)

**Confirmed by:** Backend Engineer — 2026-02-25

Sprint 5 task T-072 (trip search, filter, and sort) adds query parameter support to the existing `GET /api/v1/trips` endpoint. This requires **no database schema changes**:

- **Search** uses `ILIKE` on the existing `name VARCHAR(255)` column and `array_to_string(destinations, ',') ILIKE` on the existing `destinations TEXT[]` column
- **Status filter** uses the existing computed status logic (`computeTripStatus()` from T-030) applied post-query — no stored status changes
- **Sort** uses the existing columns: `name`, `created_at`, `start_date` (added in migration 007, Sprint 2)
- **No new indexes** are needed at the current scale — all queries are user-scoped via the existing `trips_user_id_idx` index

No migration file is needed for Sprint 5. The migration log remains at 8 entries (001–008).

---

*This document is maintained by the Manager Agent and Backend Engineer. Update it whenever the stack or conventions change.*

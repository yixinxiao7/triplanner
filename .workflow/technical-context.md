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
| 009 | 6 | Create `land_travels` table | Create Table | `20260227_009_create_land_travels.js` | ✅ Implemented (2026-02-27, T-086). Awaiting staging deploy by Deploy Engineer (T-092). |
| 010 | 7 | Add `notes TEXT NULL` to `trips` table | Alter Table | `20260227_010_add_trip_notes.js` | ✅ Implemented (2026-02-27, T-103). **Manager Code Review APPROVED** — Integration Check. Awaiting staging deploy by Deploy Engineer (T-107). |
| — | 8 | *(No new migrations this sprint)* | — | — | Sprint 8 features (T-113 timezone abbreviations, T-114 activity URL links) are frontend-only. Existing schema (001–010) is sufficient. Migration 010 is the only pending deploy (T-107). Confirmed by Backend Engineer 2026-02-27. |
| — | 9–24 | *(No new migrations Sprints 9–24)* | — | — | Schema-stable. All 10 migrations applied on staging. |
| — | 25 | *(No new migrations this sprint)* | — | — | Sprint 25 `GET /api/v1/trips/:id/calendar` (T-212) is a read-only aggregation over existing `flights`, `stays`, `activities` tables. No DDL changes required. Confirmed by Backend Engineer 2026-03-10. **[Auto-approved — no schema change]** |
| — | 26 | *(No new migrations this sprint)* | — | — | Sprint 26 tasks (T-220 knexfile SSL config, T-221 cookie SameSite fix, T-226 seed script) require no DDL changes. T-226 seeds the existing `users` table — no new columns or tables. Confirmed by Backend Engineer 2026-03-11. **[Auto-approved — no schema change]** |

---

### Sprint 26 — No Schema Changes

**Date:** 2026-03-11
**Confirmed by:** Backend Engineer
**Tasks:** T-220, T-221, T-226

**Reason:** All three Sprint 26 backend tasks are configuration, cookie-attribute, and seed-data changes. No DDL is required.

**T-220 — knexfile.js Production SSL Config:**
- Modifies `backend/knexfile.js` (or `backend/src/config/knexfile.js`) production config block only
- Adds `ssl: { rejectUnauthorized: false }` for AWS RDS self-signed certificate compatibility
- Changes pool from `{ min: 2, max: 10 }` to `{ min: 1, max: 5 }` (right-sized for `db.t3.micro`)
- **No schema change. No migration. No `knex migrate:latest` required.**

**T-221 — Cookie SameSite=None + Secure in Production:**
- Modifies `backend/src/routes/auth.js` helper functions `setRefreshCookie` and `clearRefreshCookie`
- Guards `SameSite=None; Secure` behind `NODE_ENV === 'production'`
- Keeps `SameSite=Strict` for development and staging
- **No schema change. No migration.**

**T-226 — Monitor Agent Seed Script:**
- Creates `backend/src/seeds/test_user.js`
- Inserts a persistent test user: `test@triplanner.local` / `TestPass123!` into the existing `users` table
- Seed is idempotent (upsert pattern — safe to re-run)
- No new columns or tables. The `users` table (migration 001) already has all required columns (`id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`)
- **No schema change. No migration.**

**Manager Approval Note:** No schema changes across all Sprint 26 backend tasks → no Manager handoff required for DDL approval. This note is for the Deploy Engineer's reference: **do not run `knex migrate:latest` for Sprint 26** — the migration log remains at 10 applied migrations (001–010). The seed script (`test_user.js`) may be run against staging via `knex seed:run` as part of T-226 if the Deploy Engineer chooses to seed staging; it is not required for production.

---

### Sprint 25 — No Schema Changes

**Date:** 2026-03-10
**Confirmed by:** Backend Engineer
**Task:** T-212

**Reason:** The new `GET /api/v1/trips/:id/calendar` endpoint is a **read-only aggregation** over three existing tables:

- `flights` — uses existing `departure_at`, `departure_tz`, `arrival_at`, `arrival_tz`, `flight_number`, `airline`, `from_location`, `to_location` columns
- `stays` — uses existing `check_in_at`, `check_in_tz`, `check_out_at`, `check_out_tz`, `name` columns
- `activities` — uses existing `activity_date`, `start_time`, `end_time`, `name` columns (already formatted as YYYY-MM-DD via `TO_CHAR` in `activityModel.js`)

No new tables, columns, or indexes are required. The endpoint merges and sorts results in the application layer. The migration log remains at **10 applied migrations (001–010)**. No `knex migrate:latest` is needed for Sprint 25.

**Manager Approval Note:** No schema change → no Manager handoff required. This note is for the Deploy Engineer's reference: **do not run `knex migrate:latest` for Sprint 25** unless another agent has added a new migration in the interim.

---

### Sprint 8 — No Schema Changes

**Date:** 2026-02-27
**Confirmed by:** Backend Engineer
**Reason:** Sprint 8 introduces two frontend-only features:
- **T-113 (Timezone abbreviations):** Uses existing `*_at` (UTC timestamp) and `*_tz` (IANA timezone string) columns already present in `flights`, `stays`, and `land_travels` tables. No column additions required.
- **T-114 (Activity URL link detection):** Uses the existing `location TEXT NULL` column in `activities`. URL parsing and linkification are purely a frontend rendering concern. No column additions required.

The only pending schema action this sprint is **applying migration 010** (`notes TEXT NULL` on `trips`) as part of T-107. This was implemented and approved in Sprint 7.

---

### Migration 010 — Add `notes` to `trips` table

**Sprint:** 7
**Task:** T-103
**Status:** ✅ Implemented (2026-02-27) — **Manager Code Review APPROVED** (in Integration Check). Pre-Approved by Manager in Sprint 7 planning (2026-02-27). Migration file: `backend/src/migrations/20260227_010_add_trip_notes.js`. 265/265 backend tests pass. Awaiting staging deploy by Deploy Engineer (T-107).

**Rationale:** Adds the trip notes freeform description field to the `trips` table. This is the first "rich trip metadata" field beyond `name` and `destinations`. The column is `TEXT NULL` — nullable, backward-compatible with all existing trip rows (which will have `notes = NULL` after the migration). No existing queries are impacted; the `notes` column is simply included in `SELECT *` going forward. Length enforcement (max 2000 chars) is applied at the API validation layer only.

**File:** `backend/src/migrations/20260227_010_add_notes_to_trips.js`

**up():**
```sql
ALTER TABLE trips ADD COLUMN notes TEXT NULL;
```

**down():**
```sql
ALTER TABLE trips DROP COLUMN IF EXISTS notes;
```

**Notes:**
- `TEXT NULL` — no DB-level length constraint. Max 2000 chars enforced in API validation middleware (route handler PATCH /trips/:id).
- `IF EXISTS` guard in `down()` makes rollback safe to run even if the column was never created.
- No index needed — notes are not queried or filtered server-side; they are returned as part of the trip resource.
- `updated_at` is not affected by this migration — application layer sets it on every PATCH.
- This is a pure `ALTER TABLE ADD COLUMN` — zero downtime on PostgreSQL (no table rewrite for nullable TEXT column).

**Manager Approval Note:** Schema was explicitly pre-approved by the Manager Agent in `active-sprint.md` Sprint 7 planning section (2026-02-27). Backend Engineer may proceed with implementation as soon as T-096 (Design Spec) is complete. No additional Manager handoff required before implementation.

**Deploy Engineer Note:** When T-106 (QA Integration Testing) is complete and T-107 (Staging Re-deploy) begins, migration 010 must be applied to the staging database before the backend is restarted. See handoff-log.md for the Deploy Engineer handoff entry.

---

### Migration 009 — `land_travels` table

**Sprint:** 6
**Task:** T-086
**Status:** ✅ Implemented (2026-02-27) — **Pre-Approved by Manager** (explicitly approved in `active-sprint.md`, Sprint 6 planning, 2026-02-27). Awaiting staging deployment by Deploy Engineer (T-092).

**Rationale:** Adds a new `land_travels` sub-resource table to track ground transportation (rental cars, buses, trains, rideshares, ferries, etc.) associated with a trip. This is a net-new table with no impact on existing tables or data. Schema pre-approved so T-086 can begin implementation immediately after T-081 design spec review.

**File:** `backend/src/migrations/20260227_009_create_land_travels.js`

**up():**
```sql
CREATE TABLE land_travels (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  mode                TEXT        NOT NULL CHECK (mode IN ('RENTAL_CAR','BUS','TRAIN','RIDESHARE','FERRY','OTHER')),
  provider            TEXT        NULL,
  from_location       TEXT        NOT NULL,
  to_location         TEXT        NOT NULL,
  departure_date      DATE        NOT NULL,
  departure_time      TIME        NULL,
  arrival_date        DATE        NULL,
  arrival_time        TIME        NULL,
  confirmation_number TEXT        NULL,
  notes               TEXT        NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX land_travels_trip_id_idx ON land_travels(trip_id);
```

**down():**
```sql
DROP TABLE IF EXISTS land_travels;
```

**Notes:**
- `CHECK (mode IN (...))` enforces the enum at the DB level. Adding a new mode value in the future will require an `ALTER TABLE` to widen the constraint.
- `ON DELETE CASCADE` on `trip_id` ensures land travel entries are automatically removed when their parent trip is deleted — consistent with the cascade pattern used on `flights`, `stays`, and `activities`.
- `arrival_time` may be stored even when `arrival_date` is NULL at the DB level; cross-field validation is enforced entirely at the application layer for simplicity.
- `TEXT` (unbounded) for `from_location`, `to_location`, and `notes` — length limits are enforced in the API validation layer (500 chars, 500 chars, 2000 chars respectively).
- Index on `trip_id` supports the common query pattern `SELECT * FROM land_travels WHERE trip_id = $1 ORDER BY departure_date ASC`.
- No trigger for `updated_at` — application layer must explicitly set `updated_at = NOW()` in every PATCH handler (consistent with existing sub-resource tables).

**Manager Approval Note:** Schema was explicitly pre-approved by the Manager Agent in `active-sprint.md` Sprint 6 planning section (2026-02-27) with the following note: *"Pre-approved to allow T-086 to proceed immediately after T-081 design spec is reviewed."* No additional Manager handoff needed before implementation.

**Deploy Engineer Note:** When T-091 (QA Integration Testing) is complete and T-092 (Staging Re-deploy) begins, migration 009 must be applied to the staging database before the backend is restarted. See handoff-log.md for the Deploy Engineer handoff entry.

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

---

## Sprint 10 — No Schema Changes Required

**Date:** 2026-03-04
**Confirmed by:** Backend Engineer

Sprint 10 is a pipeline-closure sprint with no new backend or frontend implementation tasks (except for T-122, the trip print feature, which is frontend-only). No schema changes are required.

### Sprint 10 Task Analysis

| Task | Schema Impact |
|------|--------------|
| T-094 (User Agent: Sprint 6 walkthrough) | None — user testing only |
| T-108 (Monitor: Sprint 7 health check) | None — monitor scope |
| T-109 (User Agent: Sprint 7 walkthrough) | None — user testing only |
| T-115 (QA: Playwright E2E expansion 4→7) | None — test authoring only |
| T-116 (QA: Sprint 8 staging E2E) | None — QA audit only |
| T-117 (QA: Sprint 8 staging integration check) | None — QA testing only |
| T-118 (Deploy: Sprint 8 frontend rebuild) | None — deploy scope; no new migrations |
| T-119 (Monitor: Sprint 8 health check) | None — monitor scope |
| T-120 (User Agent: Sprint 8 walkthrough) | None — user testing only |
| T-121 (Design: trip export/print spec) | None — design spec only |
| T-122 (Frontend: trip print implementation) | None — `window.print()` is frontend-only; no new columns, no new tables, no API routes. UI spec Spec 15 confirms: "No backend changes required." |
| H-XXX (Hotfix, if triggered by T-094/T-109/T-120) | TBD — if any hotfix requires a schema change, it will be proposed here and logged for Manager approval before implementation. No hotfix tasks currently exist (2026-03-04). |

### Current Schema State (Sprint 10 Start — 2026-03-04)

**All 10 migrations applied on staging (confirmed by T-107 Deploy, 2026-02-28):**

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001 | 1 | Create `users` table | ✅ Applied on Staging |
| 002 | 1 | Create `refresh_tokens` table | ✅ Applied on Staging |
| 003 | 1 | Create `trips` table | ✅ Applied on Staging |
| 004 | 1 | Create `flights` table | ✅ Applied on Staging |
| 005 | 1 | Create `stays` table | ✅ Applied on Staging |
| 006 | 1 | Create `activities` table | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time` + `end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging (T-107, 2026-02-28) |
| — | 8–10 | *(No new migrations)* | Sprints 8, 9, 10 are all schema-stable |

The schema is complete and current for all features through Sprint 10. No pending migrations. The migration log remains at 10 entries (001–010).

---

---

## Sprint 14 — No Schema Changes Required

**Date:** 2026-03-07
**Confirmed by:** Backend Engineer

Sprint 14 is a focused regression-fix sprint with no backend implementation tasks assigned to the Backend Engineer. All in-scope tasks are frontend component changes (T-146, T-147) or a deploy/security operation (T-145). No schema changes are required.

### Sprint 14 Task Analysis

| Task | Agent | Schema Impact |
|------|-------|--------------|
| T-145 | Deploy Engineer | JWT_SECRET rotation in `backend/.env.staging` — environment variable change only. No tables, no columns, no migration. |
| T-146 | Frontend Engineer | Calendar async fix — adds `useEffect` + `hasNavigated` ref inside `TripCalendar.jsx`. Pure frontend component change. All required data fields (`departure_at`, `check_in_at`, `activity_date`, `departure_date`) already exist in the current schema. |
| T-147 | Frontend Engineer | "Today" button — adds a button to `TripCalendar.jsx` header. Pure render + state change. No new data requirements. |
| T-148 | QA Engineer | Security checklist + code review audit — QA scope only. No schema work. |
| T-149 | QA Engineer | Integration testing — QA scope only. No schema work. |
| T-150 | Deploy Engineer | Sprint 14 staging re-deployment — explicitly confirms "No new backend migrations." |
| T-151 | Monitor Agent | Sprint 14 health check — monitor scope only. No schema work. |
| T-152 | User Agent | Comprehensive walkthrough — user testing scope only. No schema work. |

### Current Schema State (Sprint 14 — 2026-03-07)

**All 10 migrations applied on staging:**

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001 | 1 | Create `users` table | ✅ Applied on Staging |
| 002 | 1 | Create `refresh_tokens` table | ✅ Applied on Staging |
| 003 | 1 | Create `trips` table | ✅ Applied on Staging |
| 004 | 1 | Create `flights` table | ✅ Applied on Staging |
| 005 | 1 | Create `stays` table | ✅ Applied on Staging |
| 006 | 1 | Create `activities` table | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging (T-107, 2026-02-28) |
| — | 8–14 | *(No new migrations)* | Sprints 8–14 are all schema-stable |

**Total migrations on staging: 10 (001–010). All applied. None pending. The migration log remains at 10 entries for Sprint 14.**

---

*This document is maintained by the Manager Agent and Backend Engineer. Update it whenever the stack or conventions change.*

---

## Sprint 20 — Schema Analysis + T-188 Notes (2026-03-10)

**Confirmed by:** Backend Engineer
**Date:** 2026-03-10

### T-188: No New Migration Required

The active-sprint.md for Sprint 20 references "migration 010_add_notes_to_trips.js". However, a thorough review of the migration log confirms that **migration 010 (Add `notes TEXT NULL` to `trips`) was already created and applied in Sprint 7** (T-107, 2026-02-28).

**Evidence from technical-context.md (Sprint 14 entry):**
> `010 | 7 | Add notes TEXT NULL to trips | ✅ Applied on Staging (T-107, 2026-02-28)`

**Evidence from api-contracts.md (Sprint 19 endpoint inventory):**
> `PATCH /api/v1/trips/:id — notes updatable (Sprint 7); "" → null (Sprint 9)`

**Conclusion:** The `notes TEXT NULL` column already exists on the `trips` table on staging. No DDL migration is needed for Sprint 20.

### T-188 Actual Scope (Sprint 20)

Sprint 20's T-188 work is **validation and response-shape formalization only**:

1. **POST /api/v1/trips Joi schema:** Add `notes: Joi.string().max(2000).allow(null, '').optional()` — enforces the 2000-char cap at the API layer (previously no max was validated).
2. **PATCH /api/v1/trips/:id Joi schema:** Add the same `notes` rule (previously no max was validated; `''` → `null` normalization existed since Sprint 9 but max was not enforced).
3. **GET /trips list and GET /trips/:id model queries:** Confirm `notes` is included in `SELECT` output (it should be, but must be verified in the Knex model code).
4. **POST /trips model insert:** Confirm `notes` is included in the Knex insert query (may have been omitted when the column was added but the POST contract was not updated).

### Manager Approval (Schema Change)

**Schema change:** None — no new migration.
**Approval required:** Not applicable (validation-only changes do not require Manager schema approval per workflow rules).
**Auto-approved:** T-188 may proceed to implementation. No blocking approval needed.

### Current Schema State (Sprint 20 — 2026-03-10)

All 10 migrations applied on staging. Schema is stable and unchanged from Sprint 14.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001 | 1 | Create `users` table | ✅ Applied on Staging |
| 002 | 1 | Create `refresh_tokens` table | ✅ Applied on Staging |
| 003 | 1 | Create `trips` table | ✅ Applied on Staging |
| 004 | 1 | Create `flights` table | ✅ Applied on Staging |
| 005 | 1 | Create `stays` table | ✅ Applied on Staging |
| 006 | 1 | Create `activities` table | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging |
| — | 8–20 | *(No new migrations)* | Schema-stable through Sprint 20 |

**Total migrations on staging: 10 (001–010). All applied. None pending for Sprint 20.**

---

### Sprint 31 — No Schema Changes

**Date:** 2026-03-20
**Confirmed by:** Backend Engineer
**Task:** T-250

**Reason:** Sprint #31's sole backend task (T-250) is a configuration fix to `backend/src/config/knexfile.js`. Specifically, it adds `seeds: { directory: seedsDir }` to the `staging` environment block to resolve an `ENOENT` error when running `NODE_ENV=staging npm run seed`. No DDL is required.

**T-250 — knexfile.js Staging Seeds Config:**
- Modifies `backend/src/config/knexfile.js` staging block only — adds `seeds: { directory: seedsDir }`
- `seedsDir` is already defined at the top of the file (shared with development block) — no new path computation needed
- Does not touch the `development` or `production` blocks
- Does not introduce any new tables, columns, indexes, or constraints
- **No schema change. No migration. No `knex migrate:latest` required.**

**Manager Approval Note:** No schema changes for Sprint 31 → no Manager handoff required for DDL approval. This note is for the Deploy Engineer's reference: **do not run `knex migrate:latest` for Sprint 31** — the migration log remains at 10 applied migrations (001–010). The staging seeds fix allows `NODE_ENV=staging npm run seed` to resolve correctly; however, whether to re-seed staging is at the Deploy Engineer's discretion (the test user seed is idempotent and safe to re-run).

**[Auto-approved — no schema change]**

---

### Sprint 35 — No Schema Changes

**Date:** 2026-03-23
**Confirmed by:** Backend Engineer
**Task:** T-272

**Reason:** Sprint 35's backend task (T-272) adds server-side HTML sanitization to all user-provided text fields. This is an application-layer change only — a sanitization utility function applied in validation/middleware before database insertion. No new tables, columns, indexes, or constraints are required. The existing schema (migrations 001–010) is fully sufficient.

**T-272 — Server-Side Input Sanitization:**
- Adds a new utility function (`sanitizeHtml`) that strips HTML tags from text input
- Applies sanitization to 17 text fields across 6 models (User, Trip, Flight, Stay, Activity, Land Travel)
- Sanitization runs after validation, before model insertion — no route handler changes needed for data flow
- May add a new npm dependency (`sanitize-html` or `xss` library) — no DDL impact
- **No schema change. No migration. No `knex migrate:latest` required.**

**Manager Approval Note:** No schema changes for Sprint 35 → no Manager handoff required for DDL approval. This note is for the Deploy Engineer's reference: **do not run `knex migrate:latest` for Sprint 35** — the migration log remains at 10 applied migrations (001–010). The new `sanitize-html` (or equivalent) npm dependency will need to be installed (`npm install`) during the staging build.

**[Auto-approved — no schema change]**

---

### Sprint 36 — No Schema Changes

**Date:** 2026-03-24
**Confirmed by:** Backend Engineer
**Task:** T-278

**Reason:** Sprint 36's backend task (T-278) is a middleware ordering fix — swapping sanitization to run before validation so that required fields stripped to empty strings by HTML sanitization are properly rejected. This is purely an application-layer change to middleware execution order. No new tables, columns, indexes, or constraints are required. The existing schema (migrations 001–010) is fully sufficient.

**T-278 — Post-Sanitization Validation (Middleware Reorder):**
- Changes middleware order from `validate → sanitize` to `sanitize → validate` on all write endpoints
- No new utilities, no new dependencies, no new routes
- **No schema change. No migration. No `knex migrate:latest` required.**

**Manager Approval Note:** No schema changes for Sprint 36 → no Manager handoff required for DDL approval. This note is for the Deploy Engineer's reference: **do not run `knex migrate:latest` for Sprint 36** — the migration log remains at 10 applied migrations (001–010).

**[Auto-approved — no schema change]**

---

*Sprint 20 schema analysis by Backend Engineer 2026-03-10. T-188 is validation-layer-only — no migration. T-186 is validation-layer-only — no migration. Schema remains stable at 10 migrations.*

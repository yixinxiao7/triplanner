# API Contracts

Shared API specifications that the Backend Engineer publishes and the Frontend Engineer consumes. Must be defined before implementation begins each sprint.

---

## Rules

1. Backend Engineer must document all new/changed endpoints here **before** writing implementation code
2. Frontend Engineer must acknowledge the contract in handoff-log.md **before** starting UI integration
3. Any contract changes mid-sprint require a handoff-log.md entry and Manager approval
4. All contracts must follow the conventions defined in `architecture.md`

---

## Global Conventions

- **Base URL:** `/api/v1/`
- **Auth:** Bearer token in `Authorization: Bearer <access_token>` header
- **Success shape:** `{ "data": <payload> }`
- **Error shape:** `{ "error": { "message": "<string>", "code": "<string>" } }`
- **Pagination (list endpoints):** `?page=1&limit=20` → `{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100 } }`
- **Timestamps:** All `*_at` fields returned as ISO 8601 UTC strings (e.g., `"2026-08-07T10:00:00.000Z"`)
- **UUIDs:** All `id` fields are UUID v4 strings

---

## Sprint 1 Contracts

---

## T-004 — Auth Endpoints

### POST /api/v1/auth/register

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-004 |
| Status | Agreed |
| Auth Required | No (public) |

**Description:** Create a new user account. On success, issues a JWT access token in the response body and sets a refresh token as an httpOnly cookie.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Field Validation Rules:**
| Field | Rules |
|-------|-------|
| `name` | Required. String. Trimmed. Min length 1 after trim. Max length 255. |
| `email` | Required. String. Must be valid email format (RFC 5322). Lowercased before storage. Max length 255. |
| `password` | Required. String. Minimum 8 characters. Max length 128. |

**Response (Success — 201 Created):**
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "created_at": "2026-02-24T12:00:00.000Z"
    },
    "access_token": "<JWT_ACCESS_TOKEN>"
  }
}
```

**Response Headers (on success):**
```
Set-Cookie: refresh_token=<OPAQUE_TOKEN>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

- `access_token`: Short-lived JWT, expires in 15 minutes. Frontend stores in-memory (React context). Do NOT store in localStorage.
- `refresh_token` cookie: Opaque token, expires in 7 days. HttpOnly prevents JS access. Path scoped to `/api/v1/auth` so it is only sent to auth endpoints.

**Response (Error — 400 Bad Request — Validation failure):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "name": "Name is required",
      "email": "A valid email address is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

**Response (Error — 409 Conflict — Email already registered):**
```json
{
  "error": {
    "message": "An account with this email already exists",
    "code": "EMAIL_TAKEN"
  }
}
```

**Response (Error — 500 Internal Server Error):**
```json
{
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  }
}
```

**Notes:**
- Password is hashed with bcrypt (min 12 rounds) before storage. The raw password is never logged or stored.
- The `fields` object in 400 response only includes keys for fields that failed validation — not all fields.
- Frontend should map `EMAIL_TAKEN` → inline error on the email field ("an account with this email already exists.").

---

### POST /api/v1/auth/login

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-004 |
| Status | Agreed |
| Auth Required | No (public) |

**Description:** Authenticate an existing user. On success, issues a JWT access token in the response body and sets a refresh token as an httpOnly cookie.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Field Validation Rules:**
| Field | Rules |
|-------|-------|
| `email` | Required. Must be a non-empty string. |
| `password` | Required. Must be a non-empty string. |

**Response (Success — 200 OK):**
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "created_at": "2026-02-24T12:00:00.000Z"
    },
    "access_token": "<JWT_ACCESS_TOKEN>"
  }
}
```

**Response Headers (on success):**
```
Set-Cookie: refresh_token=<OPAQUE_TOKEN>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

**Response (Error — 400 Bad Request — Missing fields):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "email": "Email is required",
      "password": "Password is required"
    }
  }
}
```

**Response (Error — 401 Unauthorized — Invalid credentials):**
```json
{
  "error": {
    "message": "Incorrect email or password",
    "code": "INVALID_CREDENTIALS"
  }
}
```

**Response (Error — 500 Internal Server Error):**
```json
{
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  }
}
```

**Notes:**
- Return the same 401 `INVALID_CREDENTIALS` error whether the email doesn't exist or the password is wrong (avoids email enumeration).
- Timing attack mitigation: always run bcrypt compare even if the user is not found (compare against a dummy hash).
- Frontend should display 401 as a non-field banner: "incorrect email or password."

---

### POST /api/v1/auth/refresh

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-004 |
| Status | Agreed |
| Auth Required | No (uses httpOnly refresh token cookie) |

**Description:** Exchange a valid refresh token (sent automatically via httpOnly cookie) for a new access token. Rotates the refresh token (old token is revoked, new token is issued).

**Request Body:** None (empty body)

**Request Cookie (sent automatically by browser):**
```
Cookie: refresh_token=<OPAQUE_TOKEN>
```

**Response (Success — 200 OK):**
```json
{
  "data": {
    "access_token": "<NEW_JWT_ACCESS_TOKEN>"
  }
}
```

**Response Headers (on success):**
```
Set-Cookie: refresh_token=<NEW_OPAQUE_TOKEN>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

**Response (Error — 401 Unauthorized — No token, expired, or revoked):**
```json
{
  "error": {
    "message": "Invalid or expired refresh token",
    "code": "INVALID_REFRESH_TOKEN"
  }
}
```

**Notes:**
- On 401, the frontend auth context must redirect the user to `/login`.
- Refresh token rotation: the old token_hash is marked `revoked_at = now()` in the `refresh_tokens` table. A new token is issued with a fresh 7-day expiry.
- The axios interceptor on the frontend calls this endpoint automatically when any API request returns 401, then retries the original request with the new access token.
- If the refresh cookie is missing or the token hash is not found in DB, return 401.

---

### POST /api/v1/auth/logout

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-004 |
| Status | Agreed |
| Auth Required | Yes (Bearer token in Authorization header) |

**Description:** Revoke the current refresh token. The access token is short-lived and will expire naturally. Clears the refresh token cookie.

**Request Body:** None (empty body)

**Request Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
Cookie: refresh_token=<OPAQUE_TOKEN>
```

**Response (Success — 204 No Content):**
```
(empty body)
```

**Response Headers (on success):**
```
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

**Response (Error — 401 Unauthorized):**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**Notes:**
- The backend marks `revoked_at = now()` on the matching `refresh_tokens` row.
- If no valid refresh cookie is found, still return 204 (idempotent logout — the user is effectively already logged out).
- Frontend must clear the in-memory access token from React context after calling this endpoint.

---

## T-005 — Trips CRUD Endpoints

### GET /api/v1/trips

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-005 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** List all trips belonging to the authenticated user. Results are ordered by `created_at` descending (newest first).

**Request Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Results per page (max 100) |

**Response (Success — 200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Japan 2026",
      "destinations": ["Tokyo", "Osaka", "Kyoto"],
      "status": "PLANNING",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

**Response (Error — 401 Unauthorized):**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**Notes:**
- Only trips belonging to the authenticated user (`user_id = req.user.id`) are returned — never other users' trips.
- `destinations` is returned as a JSON array of strings.
- `status` is one of: `"PLANNING"`, `"ONGOING"`, `"COMPLETED"`. Defaults to `"PLANNING"` on creation.
- Sprint 1 frontend renders all trips without client-side pagination (assumes manageable count). Pagination contract is defined here for future use.

---

### POST /api/v1/trips

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-005 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Create a new trip for the authenticated user. Status defaults to `PLANNING`.

**Request Body:**
```json
{
  "name": "string",
  "destinations": ["string"]
}
```

**Field Validation Rules:**
| Field | Rules |
|-------|-------|
| `name` | Required. String. Trimmed. Min length 1 after trim. Max length 255. |
| `destinations` | Required. Array of strings. Min 1 element. Each element: non-empty string after trim. Max 50 destinations. Also accepts a single comma-separated string — the backend splits on commas and trims whitespace. |

**Response (Success — 201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "PLANNING",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T12:00:00.000Z"
  }
}
```

**Response (Error — 400 Bad Request — Validation failure):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "name": "Trip name is required",
      "destinations": "At least one destination is required"
    }
  }
}
```

**Response (Error — 401 Unauthorized):**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**Notes:**
- The create-trip modal on the frontend sends `destinations` as a comma-separated string (e.g., `"Tokyo, Osaka, Kyoto"`). The backend normalizes this to an array.
- After successful creation, frontend navigates directly to `/trips/:id` using the returned `id`.

---

### GET /api/v1/trips/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-005 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Retrieve a single trip by ID. Returns the trip resource only (flights/stays/activities are fetched via their own endpoints).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Trip ID |

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "PLANNING",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T12:00:00.000Z"
  }
}
```

**Response (Error — 401 Unauthorized):**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**Response (Error — 403 Forbidden — Trip belongs to another user):**
```json
{
  "error": {
    "message": "You do not have access to this trip",
    "code": "FORBIDDEN"
  }
}
```

**Response (Error — 404 Not Found):**
```json
{
  "error": {
    "message": "Trip not found",
    "code": "NOT_FOUND"
  }
}
```

---

### PATCH /api/v1/trips/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-005 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Partially update a trip. All fields are optional — only provided fields are updated.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Trip ID |

**Request Body (all fields optional):**
```json
{
  "name": "string",
  "destinations": ["string"],
  "status": "PLANNING | ONGOING | COMPLETED"
}
```

**Field Validation Rules (applied only to provided fields):**
| Field | Rules |
|-------|-------|
| `name` | String. Trimmed. Min length 1 after trim. Max length 255. |
| `destinations` | Array of strings. Min 1 element. Each element: non-empty string after trim. |
| `status` | Must be one of: `"PLANNING"`, `"ONGOING"`, `"COMPLETED"`. |

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026 Updated",
    "destinations": ["Tokyo", "Osaka"],
    "status": "ONGOING",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T13:00:00.000Z"
  }
}
```

**Response (Error — 400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "status": "Status must be one of: PLANNING, ONGOING, COMPLETED"
    }
  }
}
```

**Response (Error — 401 Unauthorized):**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**Response (Error — 403 Forbidden):**
```json
{
  "error": {
    "message": "You do not have access to this trip",
    "code": "FORBIDDEN"
  }
}
```

**Response (Error — 404 Not Found):**
```json
{
  "error": {
    "message": "Trip not found",
    "code": "NOT_FOUND"
  }
}
```

**Notes:**
- `updated_at` is set to `now()` on every successful PATCH.
- If no recognized fields are provided, return 400 with code `NO_UPDATABLE_FIELDS`.

---

### DELETE /api/v1/trips/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-005 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Permanently delete a trip and all its associated flights, stays, and activities (cascaded at the database level).

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Trip ID |

**Request Body:** None

**Response (Success — 204 No Content):**
```
(empty body)
```

**Response (Error — 401 Unauthorized):**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**Response (Error — 403 Forbidden):**
```json
{
  "error": {
    "message": "You do not have access to this trip",
    "code": "FORBIDDEN"
  }
}
```

**Response (Error — 404 Not Found):**
```json
{
  "error": {
    "message": "Trip not found",
    "code": "NOT_FOUND"
  }
}
```

**Notes:**
- All child records (flights, stays, activities) are deleted via `ON DELETE CASCADE` at the database level — no explicit child deletion needed in application code.
- This action is irreversible. No soft delete.

---

## T-006 — Flights, Stays, and Activities Endpoints

All sub-resource endpoints follow the same ownership rules:
1. Check that `trip_id` exists in the database → 404 if not
2. Check that the trip's `user_id` matches the authenticated user → 403 if not
3. Then proceed with the requested operation on the sub-resource

---

### Flights

#### GET /api/v1/trips/:tripId/flights

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** List all flights for a trip, ordered by `departure_at` ascending.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `tripId` | UUID | Parent trip ID |

**Response (Success — 200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "trip_id": "550e8400-e29b-41d4-a716-446655440001",
      "flight_number": "AA100",
      "airline": "American Airlines",
      "from_location": "JFK",
      "to_location": "LAX",
      "departure_at": "2026-08-07T10:00:00.000Z",
      "departure_tz": "America/New_York",
      "arrival_at": "2026-08-07T16:00:00.000Z",
      "arrival_tz": "America/Los_Angeles",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    }
  ]
}
```

**Notes:**
- No pagination on sub-resource list endpoints (Sprint 1). Trips are not expected to have hundreds of flights.
- `departure_at` and `arrival_at` are stored as UTC (TIMESTAMPTZ) and returned as ISO 8601 UTC strings.
- `departure_tz` and `arrival_tz` are IANA timezone strings (e.g., `"America/New_York"`).
- Frontend uses the `*_tz` field alongside `Intl.DateTimeFormat` to display times in the correct local timezone.

---

#### POST /api/v1/trips/:tripId/flights

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Add a new flight to a trip.

**Request Body:**
```json
{
  "flight_number": "string",
  "airline": "string",
  "from_location": "string",
  "to_location": "string",
  "departure_at": "ISO 8601 UTC string",
  "departure_tz": "IANA timezone string",
  "arrival_at": "ISO 8601 UTC string",
  "arrival_tz": "IANA timezone string"
}
```

**Field Validation Rules:**
| Field | Rules |
|-------|-------|
| `flight_number` | Required. String. Trimmed. Min 1 char. Max 20 chars. |
| `airline` | Required. String. Trimmed. Min 1 char. Max 255 chars. |
| `from_location` | Required. String. Trimmed. Min 1 char. Max 255 chars. Typically an IATA airport code (e.g., "JFK") but any string is accepted. |
| `to_location` | Required. String. Trimmed. Min 1 char. Max 255 chars. |
| `departure_at` | Required. Valid ISO 8601 UTC datetime string. Must be a valid date. |
| `departure_tz` | Required. Non-empty string. Max 50 chars. Should be a valid IANA timezone (e.g., "America/New_York"). Backend validates format but not exhaustive IANA list in Sprint 1. |
| `arrival_at` | Required. Valid ISO 8601 UTC datetime string. Must be after `departure_at`. |
| `arrival_tz` | Required. Non-empty string. Max 50 chars. |

**Response (Success — 201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "trip_id": "550e8400-e29b-41d4-a716-446655440001",
    "flight_number": "AA100",
    "airline": "American Airlines",
    "from_location": "JFK",
    "to_location": "LAX",
    "departure_at": "2026-08-07T10:00:00.000Z",
    "departure_tz": "America/New_York",
    "arrival_at": "2026-08-07T16:00:00.000Z",
    "arrival_tz": "America/Los_Angeles",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T12:00:00.000Z"
  }
}
```

**Response (Error — 400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "flight_number": "Flight number is required",
      "arrival_at": "Arrival time must be after departure time"
    }
  }
}
```

**Response (Error — 401 / 403 / 404):** Same shapes as trips endpoints above.

---

#### GET /api/v1/trips/:tripId/flights/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Retrieve a single flight by ID.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `tripId` | UUID | Parent trip ID |
| `id` | UUID | Flight ID |

**Response (Success — 200 OK):** Same shape as a single element from the list response.

**Response (Error — 404 Not Found — Flight not found or doesn't belong to this trip):**
```json
{
  "error": {
    "message": "Flight not found",
    "code": "NOT_FOUND"
  }
}
```

---

#### PATCH /api/v1/trips/:tripId/flights/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Partially update a flight. All fields optional.

**Request Body (all fields optional — same fields as POST, all optional):**
```json
{
  "flight_number": "string",
  "airline": "string",
  "from_location": "string",
  "to_location": "string",
  "departure_at": "ISO 8601 UTC string",
  "departure_tz": "IANA timezone string",
  "arrival_at": "ISO 8601 UTC string",
  "arrival_tz": "IANA timezone string"
}
```

**Response (Success — 200 OK):** Full updated flight object (same shape as single GET).

**Response (Error — 400 / 401 / 403 / 404):** Same shapes as above.

**Notes:**
- If `departure_at` or `arrival_at` is updated, the backend re-validates that `arrival_at > departure_at` using the merged (updated + existing) values.

---

#### DELETE /api/v1/trips/:tripId/flights/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Permanently delete a flight.

**Response (Success — 204 No Content):** Empty body.

**Response (Error — 401 / 403 / 404):** Same shapes as above.

---

### Stays

#### GET /api/v1/trips/:tripId/stays

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** List all stays for a trip, ordered by `check_in_at` ascending.

**Response (Success — 200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "trip_id": "550e8400-e29b-41d4-a716-446655440001",
      "category": "HOTEL",
      "name": "Hyatt Regency San Francisco",
      "address": "5 Embarcadero Center, San Francisco, CA 94111",
      "check_in_at": "2026-08-07T20:00:00.000Z",
      "check_in_tz": "America/Los_Angeles",
      "check_out_at": "2026-08-09T15:00:00.000Z",
      "check_out_tz": "America/Los_Angeles",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    }
  ]
}
```

**Notes:**
- `address` is nullable — will be `null` if not provided.
- `category` is one of: `"HOTEL"`, `"AIRBNB"`, `"VRBO"`.
- `check_in_tz` and `check_out_tz` are IANA timezone strings.

---

#### POST /api/v1/trips/:tripId/stays

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Add a new stay to a trip.

**Request Body:**
```json
{
  "category": "HOTEL | AIRBNB | VRBO",
  "name": "string",
  "address": "string | null",
  "check_in_at": "ISO 8601 UTC string",
  "check_in_tz": "IANA timezone string",
  "check_out_at": "ISO 8601 UTC string",
  "check_out_tz": "IANA timezone string"
}
```

**Field Validation Rules:**
| Field | Rules |
|-------|-------|
| `category` | Required. Must be one of: `"HOTEL"`, `"AIRBNB"`, `"VRBO"`. |
| `name` | Required. String. Trimmed. Min 1 char. Max 255 chars. |
| `address` | Optional. String or null. Max 500 chars. |
| `check_in_at` | Required. Valid ISO 8601 UTC datetime string. |
| `check_in_tz` | Required. Non-empty string. Max 50 chars. |
| `check_out_at` | Required. Valid ISO 8601 UTC datetime string. Must be after `check_in_at`. |
| `check_out_tz` | Required. Non-empty string. Max 50 chars. |

**Response (Success — 201 Created):** Full stay object (same shape as list element).

**Response (Error — 400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "category": "Category must be one of: HOTEL, AIRBNB, VRBO",
      "check_out_at": "Check-out time must be after check-in time"
    }
  }
}
```

**Response (Error — 401 / 403 / 404):** Same shapes as trips endpoints.

---

#### GET /api/v1/trips/:tripId/stays/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Retrieve a single stay by ID.

**Response (Success — 200 OK):** Full stay object (same shape as list element).

**Response (Error — 404 Not Found):**
```json
{
  "error": {
    "message": "Stay not found",
    "code": "NOT_FOUND"
  }
}
```

---

#### PATCH /api/v1/trips/:tripId/stays/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Partially update a stay. All fields optional.

**Request Body (all fields optional):**
```json
{
  "category": "HOTEL | AIRBNB | VRBO",
  "name": "string",
  "address": "string | null",
  "check_in_at": "ISO 8601 UTC string",
  "check_in_tz": "IANA timezone string",
  "check_out_at": "ISO 8601 UTC string",
  "check_out_tz": "IANA timezone string"
}
```

**Response (Success — 200 OK):** Full updated stay object.

**Response (Error — 400 / 401 / 403 / 404):** Same shapes as above.

---

#### DELETE /api/v1/trips/:tripId/stays/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Permanently delete a stay.

**Response (Success — 204 No Content):** Empty body.

**Response (Error — 401 / 403 / 404):** Same shapes as above.

---

### Activities

#### GET /api/v1/trips/:tripId/activities

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** List all activities for a trip, ordered by `activity_date` ascending, then `start_time` ascending, then `name` ascending.

**Response (Success — 200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "trip_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Fisherman's Wharf",
      "location": "Fisherman's Wharf, San Francisco, CA",
      "activity_date": "2026-08-08",
      "start_time": "09:00:00",
      "end_time": "14:00:00",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    }
  ]
}
```

**Notes:**
- `location` is nullable — will be `null` if not provided.
- `activity_date` is returned as an ISO 8601 date string (`YYYY-MM-DD`).
- `start_time` and `end_time` are returned as 24-hour `HH:MM:SS` strings. Frontend formats these for display.
- No timezone fields — activities are local-time entries per ADR-005.
- The frontend groups activities by `activity_date` for display and sorts by `start_time` within each group.

---

#### POST /api/v1/trips/:tripId/activities

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Add a new activity to a trip.

**Request Body:**
```json
{
  "name": "string",
  "location": "string | null",
  "activity_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM"
}
```

**Field Validation Rules:**
| Field | Rules |
|-------|-------|
| `name` | Required. String. Trimmed. Min 1 char. Max 255 chars. |
| `location` | Optional. String or null. Max 500 chars. |
| `activity_date` | Required. String in `YYYY-MM-DD` format. Must be a valid calendar date. |
| `start_time` | Required. String in `HH:MM` or `HH:MM:SS` format (24-hour). |
| `end_time` | Required. String in `HH:MM` or `HH:MM:SS` format (24-hour). Must be after `start_time`. |

**Response (Success — 201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "trip_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Fisherman's Wharf",
    "location": "Fisherman's Wharf, San Francisco, CA",
    "activity_date": "2026-08-08",
    "start_time": "09:00:00",
    "end_time": "14:00:00",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T12:00:00.000Z"
  }
}
```

**Response (Error — 400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "activity_date": "Activity date must be a valid date in YYYY-MM-DD format",
      "end_time": "End time must be after start time"
    }
  }
}
```

**Response (Error — 401 / 403 / 404):** Same shapes as above.

---

#### GET /api/v1/trips/:tripId/activities/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Retrieve a single activity by ID.

**Response (Success — 200 OK):** Full activity object (same shape as list element).

**Response (Error — 404 Not Found):**
```json
{
  "error": {
    "message": "Activity not found",
    "code": "NOT_FOUND"
  }
}
```

---

#### PATCH /api/v1/trips/:tripId/activities/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Partially update an activity. All fields optional.

**Request Body (all fields optional):**
```json
{
  "name": "string",
  "location": "string | null",
  "activity_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM"
}
```

**Response (Success — 200 OK):** Full updated activity object.

**Response (Error — 400 / 401 / 403 / 404):** Same shapes as above.

---

#### DELETE /api/v1/trips/:tripId/activities/:id

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-006 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Description:** Permanently delete an activity.

**Response (Success — 204 No Content):** Empty body.

**Response (Error — 401 / 403 / 404):** Same shapes as above.

---

## Health Check

### GET /api/v1/health

| Field | Value |
|-------|-------|
| Sprint | 1 |
| Task | T-008 |
| Status | Agreed |
| Auth Required | No (public) |

**Description:** Liveness check endpoint. Returns server status. Used by Monitor Agent and load balancers.

**Response (Success — 200 OK):**
```json
{
  "status": "ok"
}
```

**Notes:**
- This is the only endpoint that does NOT wrap its response in `{ "data": ... }` — it uses the simpler `{ "status": "ok" }` shape for compatibility with standard health check tools.
- Does not check database connectivity (liveness only). DB connectivity is checked separately.

---

## T-007 — Database Schema Summary

*Canonical schema per ADR-005. Full migration details in `.workflow/technical-context.md`.*

### Entity Overview

| Table | PK | FK | Key Fields |
|-------|----|----|-----------|
| `users` | UUID | — | name, email (unique), password_hash |
| `refresh_tokens` | UUID | user_id → users | token_hash (unique), expires_at, revoked_at |
| `trips` | UUID | user_id → users | name, destinations (TEXT[]), status |
| `flights` | UUID | trip_id → trips | flight_number, airline, from_location, to_location, departure_at+tz, arrival_at+tz |
| `stays` | UUID | trip_id → trips | category, name, address (nullable), check_in_at+tz, check_out_at+tz |
| `activities` | UUID | trip_id → trips | name, location (nullable), activity_date (DATE), start_time (TIME), end_time (TIME) |

### Foreign Key Cascade Rules

| Relationship | On Delete |
|-------------|-----------|
| refresh_tokens.user_id → users.id | CASCADE |
| trips.user_id → users.id | CASCADE |
| flights.trip_id → trips.id | CASCADE |
| stays.trip_id → trips.id | CASCADE |
| activities.trip_id → trips.id | CASCADE |

### Required Indexes

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `trips_user_id_idx` | trips | user_id | List user's trips |
| `flights_trip_id_idx` | flights | trip_id | Trip detail page |
| `stays_trip_id_idx` | stays | trip_id | Trip detail page |
| `activities_trip_id_idx` | activities | trip_id | Trip detail page |
| `activities_trip_id_date_idx` | activities | (trip_id, activity_date) | Day-grouped itinerary |
| `refresh_tokens_user_id_idx` | refresh_tokens | user_id | Token lookup on refresh |
| `refresh_tokens_token_hash_idx` | refresh_tokens | token_hash | UNIQUE — token validation |

### Enum/Constraint Values

| Table.Column | Allowed Values | Default |
|-------------|---------------|---------|
| `trips.status` | `'PLANNING'`, `'ONGOING'`, `'COMPLETED'` | `'PLANNING'` |
| `stays.category` | `'HOTEL'`, `'AIRBNB'`, `'VRBO'` | — (required) |

*All enums implemented as `VARCHAR` + `CHECK` constraint (not PostgreSQL native ENUM types) per ADR-005 for migration flexibility.*

### Timezone Column Convention

For flights and stays, every datetime column has a companion timezone column:
- `departure_at TIMESTAMPTZ` → `departure_tz VARCHAR(50)` (IANA, e.g., `"America/New_York"`)
- `arrival_at TIMESTAMPTZ` → `arrival_tz VARCHAR(50)`
- `check_in_at TIMESTAMPTZ` → `check_in_tz VARCHAR(50)`
- `check_out_at TIMESTAMPTZ` → `check_out_tz VARCHAR(50)`

Activities use `DATE` + `TIME` (no timezone) — local-time entries per ADR-005.

---

*This file is maintained by the Backend Engineer. All Sprint 1 contracts above are marked Agreed and are approved for implementation.*

---

## Sprint 2 Contracts

---

## T-027 — Bug Fix Contract Updates

These are not new endpoints but **behavioral changes** to existing endpoints. All Sprint 1 contracts remain in effect; the sections below document the corrected/updated behavior. Any implementation that conflicts with Sprint 1 contracts should prefer these Sprint 2 updates.

---

### Global: UUID Path Parameter Validation (B-009)

**Status:** Agreed — Sprint 2 / T-027

**Change:** A new validation middleware (`validateUUID`) is applied to **all route segments that accept a UUID** path parameter: `:id` on `/trips`, `:tripId` on sub-resource routes, and `:id` on sub-resource item routes. The middleware runs **before** any database query.

**Affected path params:**
- `/api/v1/trips/:id` (GET, PATCH, DELETE)
- `/api/v1/trips/:tripId/flights` (GET, POST)
- `/api/v1/trips/:tripId/flights/:id` (GET, PATCH, DELETE)
- `/api/v1/trips/:tripId/stays` (GET, POST)
- `/api/v1/trips/:tripId/stays/:id` (GET, PATCH, DELETE)
- `/api/v1/trips/:tripId/activities` (GET, POST)
- `/api/v1/trips/:tripId/activities/:id` (GET, PATCH, DELETE)

**Validation rule:** The value must match the UUID v4 format regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

**Response (Error — 400 Bad Request — Non-UUID path param):**
```json
{
  "error": {
    "message": "Invalid ID format",
    "code": "VALIDATION_ERROR"
  }
}
```

**Notes:**
- Previously, non-UUID strings (e.g., `GET /api/v1/trips/not-a-valid-uuid`) propagated to the database and caused a PostgreSQL `22P02` error, which leaked as a 500 `INTERNAL_ERROR`. This is now caught at the middleware layer and returned as a 400 before any DB query executes.
- Valid UUID strings continue to pass through normally — no regression on existing flows.
- The middleware is a single reusable function (`validateUUID(paramName)`) applied via `router.param()` or inline on each route.

---

### Global: Malformed JSON Body (B-012)

**Status:** Agreed — Sprint 2 / T-027

**Change:** When Express's `express.json()` body parser encounters a malformed JSON body, the error handler now returns a structured 400 response with a distinct `INVALID_JSON` error code instead of the previous `INTERNAL_ERROR` fallthrough.

**Response (Error — 400 Bad Request — Invalid JSON body):**
```json
{
  "error": {
    "message": "Invalid JSON in request body",
    "code": "INVALID_JSON"
  }
}
```

**Notes:**
- The error handler middleware catches `SyntaxError` thrown by `express.json()` and maps it to this response.
- Applies to all endpoints that accept a request body (POST, PATCH).
- No change to any success response shapes.

---

### Activities: `activity_date` Field Format (B-010)

**Status:** Agreed — Sprint 2 / T-027

**Change:** The `activity_date` field in **all activities responses** is now guaranteed to be a `YYYY-MM-DD` string. Previously, PostgreSQL returned this as an ISO 8601 timestamp (e.g., `"2026-08-08T04:00:00.000Z"`), which was incorrect.

**Correct format (Sprint 2+):**
```json
{
  "activity_date": "2026-08-08"
}
```

**Incorrect format (Sprint 1 bug — no longer acceptable):**
```json
{
  "activity_date": "2026-08-08T04:00:00.000Z"
}
```

**Affected endpoints:**
- `POST /api/v1/trips/:tripId/activities` → 201 response
- `GET /api/v1/trips/:tripId/activities` → 200 response (all items)
- `GET /api/v1/trips/:tripId/activities/:id` → 200 response
- `PATCH /api/v1/trips/:tripId/activities/:id` → 200 response

**Implementation:** The activities model must cast the `activity_date` DATE column to a `YYYY-MM-DD` string in all query results (e.g., Knex `raw("TO_CHAR(activity_date, 'YYYY-MM-DD') as activity_date")`).

**No change to request body validation** — input is already expected to be `YYYY-MM-DD`.

---

## T-028 — Auth Rate Limiting

**Status:** Agreed — Sprint 2 / T-028

**Change:** `express-rate-limit` middleware is applied to **all routes under `/api/v1/auth/*`**. The middleware was installed in Sprint 1 but never wired up. This corrects that omission (B-011).

### Rate Limit Configuration

| Route | Window | Max Requests per IP | Notes |
|-------|--------|---------------------|-------|
| `POST /api/v1/auth/login` | 15 minutes | 10 | Strict — brute-force protection |
| `POST /api/v1/auth/register` | 15 minutes | 20 | Looser — account creation spam protection |
| All other `/api/v1/auth/*` (refresh, logout) | 15 minutes | 30 | Generous — normal session management |

**Response (Error — 429 Too Many Requests — Rate limit exceeded):**
```json
{
  "error": {
    "message": "Too many requests, please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**Response Headers (on 429):**
```
Retry-After: <seconds until window resets>
X-RateLimit-Limit: <max requests>
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <Unix timestamp when window resets>
```

**Notes:**
- Rate limit is **per IP address** (using `req.ip`). The `trustProxy` setting must be correct for this to work behind a reverse proxy.
- The rate limit counter resets after the sliding window expires.
- Normal login/register flows (under the threshold) are completely unaffected.
- The `Retry-After` header tells the client how long to wait before retrying.
- If `express-rate-limit` is configured with `standardHeaders: true` and `legacyHeaders: false`, the standard `RateLimit-*` headers are sent instead of `X-RateLimit-*`.
- The existing success and error responses for login/register are unchanged — only the 429 case is new.

---

## T-029 — Trip Date Range API Updates

**Status:** Agreed — Sprint 2 / T-029
**Schema Change:** Pre-approved by Manager Agent 2026-02-25 (see active-sprint.md Schema Change Pre-Approval section).

**Summary of Changes:**
- New columns `start_date DATE NULL` and `end_date DATE NULL` added to the `trips` table via migration `20260225_007_add_trip_date_range.js`
- All four trips endpoints are updated to include `start_date` and `end_date` in their request/response shapes
- Both fields are optional and nullable; existing trips are unaffected (fields return `null`)

---

### GET /api/v1/trips — Updated Response (Sprint 2)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Task | T-029 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `start_date` and `end_date` added to each trip object in the response |

**Response (Success — 200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Japan 2026",
      "destinations": ["Tokyo", "Osaka", "Kyoto"],
      "status": "PLANNING",
      "start_date": "2026-08-07",
      "end_date": "2026-08-14",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

**Notes:**
- `start_date` and `end_date` are returned as `"YYYY-MM-DD"` strings when set, or `null` when not set.
- Trips without dates set return `"start_date": null, "end_date": null`.
- All other query parameters and error responses remain unchanged from Sprint 1.

---

### POST /api/v1/trips — Updated Request + Response (Sprint 2)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Task | T-029 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `start_date` and `end_date` added as optional request body fields; included in response |

**Request Body:**
```json
{
  "name": "string",
  "destinations": ["string"],
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}
```

**Field Validation Rules (Sprint 2 additions):**
| Field | Rules |
|-------|-------|
| `start_date` | Optional. String in `YYYY-MM-DD` format. Must be a valid calendar date if provided. |
| `end_date` | Optional. String in `YYYY-MM-DD` format. Must be a valid calendar date if provided. If both `start_date` and `end_date` are provided, `end_date` must be on or after `start_date`. |

**Validation error when `end_date` is before `start_date`:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "end_date": "End date must be on or after start date"
    }
  }
}
```

**Response (Success — 201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-14",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T12:00:00.000Z"
  }
}
```

**Notes:**
- If `start_date` / `end_date` are not provided on creation, they are stored as `NULL` and returned as `null`.
- All Sprint 1 validation rules for `name` and `destinations` are unchanged.
- All Sprint 1 error responses (400 validation, 401) are unchanged.

---

### GET /api/v1/trips/:id — Updated Response (Sprint 2)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Task | T-029 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `start_date` and `end_date` added to the trip object in the response |

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-14",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T12:00:00.000Z"
  }
}
```

**Notes:**
- `start_date` and `end_date` are `"YYYY-MM-DD"` strings or `null`.
- All Sprint 1 error responses (401, 403, 404) are unchanged.

---

### PATCH /api/v1/trips/:id — Updated Request + Response (Sprint 2)

| Field | Value |
|-------|-------|
| Sprint | 2 |
| Task | T-029 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `start_date` and `end_date` added as optional updatable fields |

**Request Body (all fields optional — Sprint 2 additions highlighted):**
```json
{
  "name": "string",
  "destinations": ["string"],
  "status": "PLANNING | ONGOING | COMPLETED",
  "start_date": "YYYY-MM-DD | null",
  "end_date": "YYYY-MM-DD | null"
}
```

**Field Validation Rules (Sprint 2 additions):**
| Field | Rules |
|-------|-------|
| `start_date` | Optional. String in `YYYY-MM-DD` format, or explicitly `null` to clear. Must be a valid calendar date if a string. |
| `end_date` | Optional. String in `YYYY-MM-DD` format, or explicitly `null` to clear. If both `start_date` and `end_date` are provided (non-null), `end_date` must be on or after `start_date`. Cross-field validation uses the merged value (the new value if provided, otherwise the existing DB value). |

**Clearing dates (set to null):**
```json
{
  "start_date": null,
  "end_date": null
}
```
This explicitly removes the date range from the trip. Response will return `"start_date": null, "end_date": null`.

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-14",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T13:00:00.000Z"
  }
}
```

**Notes:**
- `start_date` and `end_date` are now recognized updatable fields. The Sprint 1 rule "if no recognized fields are provided, return 400 `NO_UPDATABLE_FIELDS`" still applies — but `start_date` and `end_date` count as recognized fields.
- PATCH with only `start_date` (no `end_date`) is valid — it updates only that field.
- PATCH with only `end_date` (no `start_date`) is valid — cross-field validation uses the existing `start_date` from the DB.
- All Sprint 1 error responses (400 validation, 401, 403, 404) are unchanged.

---

## T-030 — Trip Status Auto-Calculation

**Status:** Agreed — Sprint 2 / T-030
**Blocked by:** T-029 (requires `start_date` / `end_date` columns to exist)

**Summary:** Trip `status` is **computed at read time** in `GET /api/v1/trips` and `GET /api/v1/trips/:id` responses based on the trip's `start_date`, `end_date`, and the current server date. The stored `status` column remains as a manual override fallback (used when dates are not set).

### Status Auto-Calculation Rules

The following logic is applied when building each trip object in the response. "Today" is the current UTC date (`YYYY-MM-DD`).

| Condition | Computed Status | Priority |
|-----------|----------------|----------|
| `end_date` is set AND `end_date` < today | `"COMPLETED"` | Highest |
| `start_date` is set AND `end_date` is set AND `start_date` <= today <= `end_date` | `"ONGOING"` | Second |
| `start_date` is set AND `start_date` > today (trip in the future) | `"PLANNING"` | Third |
| `start_date` is null OR (`start_date` is not set / only one date is set) | Use stored `status` value | Fallback |

**Additional rules:**
- The stored `status` column in the database is NOT updated by auto-calculation — only the API response value is computed dynamically.
- A manual `PATCH /trips/:id` with `status` still works and updates the stored value. If dates are not set, the stored status is what the GET response reflects.
- If `end_date` is set but `start_date` is null, the end_date alone does not trigger auto-calculation — fall back to stored status.

### Affected Endpoints

**GET /api/v1/trips** and **GET /api/v1/trips/:id** — the `status` field in the response is the **computed** status (not necessarily what is stored in the DB).

**Example — trip in progress:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka"],
    "status": "ONGOING",
    "start_date": "2026-02-20",
    "end_date": "2026-02-28",
    "created_at": "2026-02-10T12:00:00.000Z",
    "updated_at": "2026-02-10T12:00:00.000Z"
  }
}
```
*(Today is 2026-02-25, which is between start_date and end_date → ONGOING)*

**Example — completed trip:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Paris 2025",
    "destinations": ["Paris"],
    "status": "COMPLETED",
    "start_date": "2025-11-01",
    "end_date": "2025-11-07",
    "created_at": "2025-10-01T12:00:00.000Z",
    "updated_at": "2025-10-01T12:00:00.000Z"
  }
}
```
*(end_date is in the past → COMPLETED)*

**Example — trip with no dates (fallback to stored status):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Someday Trip",
    "destinations": ["Bali"],
    "status": "PLANNING",
    "start_date": null,
    "end_date": null,
    "created_at": "2026-01-01T12:00:00.000Z",
    "updated_at": "2026-01-01T12:00:00.000Z"
  }
}
```
*(No dates → stored status "PLANNING" used as-is)*

**Notes:**
- Auto-calculation is a **read-time transform** applied in the trips model layer (`backend/src/models/trips.js`). No stored value is mutated.
- `PATCH /api/v1/trips/:id` with `status` still accepts and stores any of: `"PLANNING"`, `"ONGOING"`, `"COMPLETED"`. This serves as an override when dates are not set.
- The PATCH endpoint does **not** auto-calculate before saving — it saves what was sent. The auto-calculation only applies on GET.
- All PATCH error responses and PATCH request/response shapes remain as documented in Sprint 1 (plus T-029 date field additions).

---

## T-027 / T-028 — Schema Summary (No DB Changes)

T-027 (bug fixes) and T-028 (rate limiting) require **no database schema changes**. They are purely application-layer changes:
- T-027: Express middleware additions (UUID validation, JSON error handler) + Knex query cast for `activity_date`
- T-028: `express-rate-limit` middleware wired into the auth router

---

## Sprint 2 — Database Schema Changes (T-029)

**Migration:** `20260225_007_add_trip_date_range.js`

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
- Both columns default to `NULL`. No existing rows are affected.
- No new indexes needed — date range queries are expected to be infrequent and always scoped by `user_id` (already indexed).
- This migration is pre-approved by Manager Agent (2026-02-25) per `active-sprint.md` Schema Change Pre-Approval section.

---

*Sprint 2 contracts above are marked Agreed and approved for implementation once the Backend Engineer's implementation phase begins. Frontend Engineer and QA Engineer should reference these contracts for integration and testing.*

---

## Sprint 3 Contracts

---

## T-043 — Optional Activity Times (start_time / end_time Nullable)

**Status:** Agreed — Sprint 3 / T-043
**Schema Change:** Pre-approved by Manager Agent 2026-02-25 (see `active-sprint.md` Schema Change Pre-Approval section).
**Feedback Source:** FB-023 (Sprint 2 — users can't create timeless "all day" activities).

**Summary of Changes:**
- Database migration makes `start_time` and `end_time` columns nullable on the `activities` table
- POST and PATCH validation is updated: both fields are optional; linked rule (both null OR both provided)
- GET responses return `null` for timeless activities' `start_time` and `end_time`
- List ordering updated: timeless activities sort after timed activities within the same date group (NULLS LAST)

---

### POST /api/v1/trips/:tripId/activities — Updated (Sprint 3)

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Task | T-043 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `start_time` and `end_time` changed from required to optional (nullable). Linked validation added. |

**Description:** Add a new activity to a trip. Activities can now be "all day" (timeless) by omitting both `start_time` and `end_time`.

**Request Body:**
```json
{
  "name": "string",
  "location": "string | null",
  "activity_date": "YYYY-MM-DD",
  "start_time": "HH:MM | HH:MM:SS | null",
  "end_time": "HH:MM | HH:MM:SS | null"
}
```

**Field Validation Rules (Sprint 3 updates):**
| Field | Rules |
|-------|-------|
| `name` | Required. String. Trimmed. Min 1 char. Max 255 chars. *(Unchanged)* |
| `location` | Optional. String or null. Max 500 chars. *(Unchanged)* |
| `activity_date` | Required. String in `YYYY-MM-DD` format. Must be a valid calendar date. *(Unchanged)* |
| `start_time` | **Optional (was Required).** String in `HH:MM` or `HH:MM:SS` format (24-hour), or `null`/omitted. **Linked rule:** if `start_time` is provided (non-null), `end_time` must also be provided (non-null). |
| `end_time` | **Optional (was Required).** String in `HH:MM` or `HH:MM:SS` format (24-hour), or `null`/omitted. **Linked rule:** if `end_time` is provided (non-null), `start_time` must also be provided (non-null). If both provided, `end_time` must be after `start_time`. |

**Linked Validation Rule (new):**
- **Both null/omitted** → valid ("all day" activity). Activity is stored with `start_time = NULL, end_time = NULL`.
- **Both provided** → valid (timed activity). Standard `end_time > start_time` validation applies.
- **Only one provided** → invalid. Return 400 validation error.

**Response (Success — 201 Created — Timed activity):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "trip_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Fisherman's Wharf",
    "location": "Fisherman's Wharf, San Francisco, CA",
    "activity_date": "2026-08-08",
    "start_time": "09:00:00",
    "end_time": "14:00:00",
    "created_at": "2026-02-25T12:00:00.000Z",
    "updated_at": "2026-02-25T12:00:00.000Z"
  }
}
```

**Response (Success — 201 Created — Timeless "all day" activity):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440031",
    "trip_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Free Day — Explore the City",
    "location": null,
    "activity_date": "2026-08-09",
    "start_time": null,
    "end_time": null,
    "created_at": "2026-02-25T12:00:00.000Z",
    "updated_at": "2026-02-25T12:00:00.000Z"
  }
}
```

**Response (Error — 400 Bad Request — Only one time provided):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "end_time": "Both start time and end time are required, or omit both for an all-day activity"
    }
  }
}
```
*Note: The error is placed on the missing field. If `start_time` is provided but `end_time` is missing, the error goes on `end_time`. If `end_time` is provided but `start_time` is missing, the error goes on `start_time`.*

**Response (Error — 400 Bad Request — end_time before start_time):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "end_time": "End time must be after start time"
    }
  }
}
```
*(Unchanged from Sprint 1 — still applies when both times are provided.)*

**Response (Error — 400 / 401 / 403 / 404):** All other error shapes unchanged from Sprint 1.

**Notes:**
- `start_time` and `end_time` are returned as `"HH:MM:SS"` strings when set, or `null` when the activity is timeless.
- The frontend sends `start_time: null, end_time: null` (or omits both) when the "All day" checkbox is checked.
- All Sprint 1 error response shapes (401, 403, 404) are unchanged.
- `activity_date` remains required — every activity must have a date, even if it has no specific time.

---

### GET /api/v1/trips/:tripId/activities — Updated Ordering (Sprint 3)

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Task | T-043 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | Ordering updated to sort timeless activities after timed activities within same date. Response includes null-valued start_time/end_time. |

**Description:** List all activities for a trip. Timeless ("all day") activities are sorted after timed activities within the same date group.

**Updated Ordering:**
```
ORDER BY activity_date ASC, start_time ASC NULLS LAST, name ASC
```

**Ordering rationale:**
1. Primary: `activity_date` ascending (earliest dates first) — unchanged
2. Secondary: `start_time` ascending with **NULLS LAST** — timed activities appear before timeless activities within the same date. Among timed activities, earlier start times come first.
3. Tertiary: `name` ascending — alphabetical tiebreaker for activities with the same start_time (or among multiple timeless activities on the same date).

**Response (Success — 200 OK — mixed timed and timeless activities):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "trip_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Fisherman's Wharf",
      "location": "Fisherman's Wharf, San Francisco, CA",
      "activity_date": "2026-08-08",
      "start_time": "09:00:00",
      "end_time": "14:00:00",
      "created_at": "2026-02-25T12:00:00.000Z",
      "updated_at": "2026-02-25T12:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440032",
      "trip_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Golden Gate Bridge Visit",
      "location": "Golden Gate Bridge, San Francisco",
      "activity_date": "2026-08-08",
      "start_time": "15:00:00",
      "end_time": "17:00:00",
      "created_at": "2026-02-25T12:00:00.000Z",
      "updated_at": "2026-02-25T12:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440031",
      "trip_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Free Day — Explore the City",
      "location": null,
      "activity_date": "2026-08-08",
      "start_time": null,
      "end_time": null,
      "created_at": "2026-02-25T12:00:00.000Z",
      "updated_at": "2026-02-25T12:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440033",
      "trip_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Museum Visit",
      "location": "National Museum, Osaka",
      "activity_date": "2026-08-09",
      "start_time": null,
      "end_time": null,
      "created_at": "2026-02-25T12:00:00.000Z",
      "updated_at": "2026-02-25T12:00:00.000Z"
    }
  ]
}
```

*(In the example above, "2026-08-08" has two timed activities sorted by start_time, followed by one timeless activity. "2026-08-09" has one timeless activity.)*

**Notes:**
- All other GET behavior (auth, ownership check, error responses) unchanged from Sprint 1.
- Frontend groups activities by `activity_date` and now checks for `null` start_time/end_time to display the "All day" badge.

---

### GET /api/v1/trips/:tripId/activities/:id — Updated Response (Sprint 3)

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Task | T-043 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `start_time` and `end_time` may now be `null` in the response |

**Response (Success — 200 OK — Timeless activity):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440031",
    "trip_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Free Day — Explore the City",
    "location": null,
    "activity_date": "2026-08-09",
    "start_time": null,
    "end_time": null,
    "created_at": "2026-02-25T12:00:00.000Z",
    "updated_at": "2026-02-25T12:00:00.000Z"
  }
}
```

**Notes:**
- For timed activities, response shape is identical to Sprint 1.
- All error responses (401, 403, 404) unchanged.

---

### PATCH /api/v1/trips/:tripId/activities/:id — Updated (Sprint 3)

| Field | Value |
|-------|-------|
| Sprint | 3 |
| Task | T-043 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `start_time` and `end_time` can be explicitly set to `null`. Linked validation uses merged values. |

**Description:** Partially update an activity. `start_time` and `end_time` can now be set to `null` to convert a timed activity to an "all day" activity, or set to time strings to convert an "all day" activity to a timed one.

**Request Body (all fields optional — Sprint 3 updates highlighted):**
```json
{
  "name": "string",
  "location": "string | null",
  "activity_date": "YYYY-MM-DD",
  "start_time": "HH:MM | HH:MM:SS | null",
  "end_time": "HH:MM | HH:MM:SS | null"
}
```

**Field Validation Rules (Sprint 3 updates):**
| Field | Rules |
|-------|-------|
| `name` | Optional. String. Trimmed. Min 1 char. Max 255 chars. *(Unchanged)* |
| `location` | Optional. String or null. Max 500 chars. *(Unchanged)* |
| `activity_date` | Optional. String in `YYYY-MM-DD` format. *(Unchanged)* |
| `start_time` | **Optional. String in `HH:MM` or `HH:MM:SS` format, or explicitly `null` to clear.** |
| `end_time` | **Optional. String in `HH:MM` or `HH:MM:SS` format, or explicitly `null` to clear.** |

**Linked Validation on PATCH (using merged values):**

When `start_time` or `end_time` is included in the PATCH body, the backend merges the new value with the existing DB value to determine the final state:

- `mergedStart = req.body.start_time !== undefined ? req.body.start_time : existing.start_time`
- `mergedEnd = req.body.end_time !== undefined ? req.body.end_time : existing.end_time`

Then the linked rule is applied on the merged values:
- **Both merged values are null** → valid (converting to "all day" activity)
- **Both merged values are non-null** → valid (timed activity). `mergedEnd > mergedStart` required.
- **One is null, one is non-null** → invalid. Return 400 validation error.

**Converting a timed activity to "all day":**
```json
{
  "start_time": null,
  "end_time": null
}
```
Both must be explicitly set to `null` in the same request to avoid the linked validation error.

**Converting an "all day" activity to timed:**
```json
{
  "start_time": "09:00",
  "end_time": "14:00"
}
```
Both must be provided in the same request.

**Response (Error — 400 Bad Request — Mismatched times after merge):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "start_time": "Both start time and end time are required, or set both to null for an all-day activity"
    }
  }
}
```
*Example trigger: PATCH with `{ "start_time": "09:00" }` on an activity that has `end_time = null`. The merged state is `start_time = "09:00", end_time = null` — mismatched.*

**Response (Error — 400 Bad Request — end_time before start_time):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "end_time": "End time must be after start time"
    }
  }
}
```
*(Unchanged — still applies when both merged times are non-null.)*

**Response (Success — 200 OK):** Full updated activity object (same shape as GET, with `start_time`/`end_time` either as time strings or `null`).

**Notes:**
- To change only the `start_time` or `end_time` of a timed activity: send the updated field alone. The backend merges with the existing value and validates accordingly.
- PATCH with `{ "start_time": null }` alone on a timed activity (which has `end_time` set) will fail because the merged state is `start_time = null, end_time = "14:00:00"` — mismatched. Send `{ "start_time": null, "end_time": null }` instead.
- All Sprint 1 error responses (401, 403, 404) are unchanged.
- The `NO_UPDATABLE_FIELDS` check still applies — `start_time` and `end_time` remain recognized updatable fields even when set to `null`.

---

### DELETE /api/v1/trips/:tripId/activities/:id — No Changes (Sprint 3)

No changes to the DELETE endpoint. Deleting a timeless activity works identically to deleting a timed activity.

---

## T-043 — Database Schema Change

**Migration:** `20260225_008_make_activity_times_optional.js`

**up():**
```sql
ALTER TABLE activities
  ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE activities
  ALTER COLUMN end_time DROP NOT NULL;
```

**down():**
```sql
-- Set any NULL values to '00:00:00' before re-adding NOT NULL constraint
UPDATE activities SET start_time = '00:00:00' WHERE start_time IS NULL;
UPDATE activities SET end_time = '00:00:00' WHERE end_time IS NULL;

ALTER TABLE activities
  ALTER COLUMN start_time SET NOT NULL;

ALTER TABLE activities
  ALTER COLUMN end_time SET NOT NULL;
```

**Notes:**
- The migration only changes nullability — no column type change, no new columns, no index changes.
- Existing activities (all with non-null times) are completely unaffected by the `up()` migration.
- The `down()` rollback must handle any NULL values that were inserted after `up()` by setting them to a default `'00:00:00'` before re-adding the NOT NULL constraint.
- The existing composite index `activities_trip_id_date_idx ON (trip_id, activity_date)` continues to work correctly with nullable time columns — no index changes needed.
- This migration is pre-approved by Manager Agent on 2026-02-25 per `active-sprint.md` Schema Change Pre-Approval section.

---

## Sprint 3 — No Backend Contract Changes Required for Other Tasks

The following Sprint 3 tasks require **no new or changed API contracts** from the Backend Engineer:

| Task | Reason |
|------|--------|
| T-045 (FE: 429 rate limit error handling) | Frontend-only. Backend already returns 429 with `RATE_LIMIT_EXCEEDED` code and `Retry-After` header (T-028, Sprint 2). No backend changes needed. |
| T-046 (FE: Multi-destination add/remove UI) | Frontend-only. Backend already accepts `destinations` as a string array on POST/PATCH trips (T-005, Sprint 1). No backend changes needed. |
| T-048 (FE: Date formatting consolidation) | Frontend-only refactor. No API changes. |
| T-049 (FE: Edit page test hardening) | Frontend test-only. No API changes. |
| T-044 (Infra: HTTPS configuration) | Infrastructure/Deploy Engineer scope. Backend cookie `secure` flag is already configurable via environment. |
| T-050 (Infra: pm2 process management) | Infrastructure/Deploy Engineer scope. No API changes. |
| T-051 (Infra: Docker/CI/CD preparation) | Infrastructure/Deploy Engineer scope. No API changes. |

---

*Sprint 3 contracts above are marked Agreed and approved for implementation. The T-043 contract documents the only backend API change this sprint. Frontend Engineer and QA Engineer should reference these contracts for integration and testing.*

---

## Sprint 4 Contracts

---

## T-058 — Destination Deduplication (Case-Insensitive)

**Status:** Agreed — Sprint 4 / T-058
**Feedback Source:** FB-028 (Sprint 3 — Backend accepts duplicate destinations without dedup), B-023

**Summary of Changes:**
- **POST /api/v1/trips** and **PATCH /api/v1/trips/:id** now deduplicate the `destinations` array using case-insensitive comparison before storing
- Deduplication preserves the original casing of the **first occurrence** of each destination
- The minimum 1 destination rule is enforced **after** deduplication (not before)
- No database schema changes — this is purely an application-layer normalization applied in the model functions before database insert/update
- All other validation rules (name, status, start_date, end_date) are unchanged

---

### POST /api/v1/trips — Updated Behavior (Sprint 4)

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Task | T-058 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `destinations` array is now deduplicated (case-insensitive) before storage. First occurrence's casing is preserved. |

**Description:** Create a new trip for the authenticated user. The `destinations` array is deduplicated using case-insensitive comparison — duplicate entries (e.g., `"Tokyo"` and `"tokyo"`) are collapsed to a single entry, preserving the casing of the first occurrence.

**Deduplication Rules:**

| Input | Output | Rationale |
|-------|--------|-----------|
| `["Tokyo", "Tokyo", "tokyo"]` | `["Tokyo"]` | Exact and case-variant duplicates removed; first occurrence `"Tokyo"` preserved |
| `["Paris", "paris", "PARIS"]` | `["Paris"]` | All three are duplicates (case-insensitive); first occurrence `"Paris"` preserved |
| `["Tokyo", "Osaka"]` | `["Tokyo", "Osaka"]` | No duplicates — unchanged |
| `["Tokyo", "Osaka", "tokyo", "osaka"]` | `["Tokyo", "Osaka"]` | Two pairs of duplicates; first occurrence of each preserved |
| `[" Tokyo ", "tokyo"]` | `["Tokyo"]` | Trimming happens before dedup; `" Tokyo "` trims to `"Tokyo"`, then dedup removes `"tokyo"` |
| `["Tokyo"]` | `["Tokyo"]` | Single element — no dedup needed |

**Deduplication Algorithm:**
1. Trim whitespace from each destination string (already done by existing validation middleware)
2. Filter out empty strings (already done by existing validation middleware)
3. Iterate through the trimmed array in order; for each element, compare its lowercased form against previously seen lowercased values
4. If the lowercased form has not been seen → keep the element (with its original casing) and record the lowercased form
5. If the lowercased form has been seen → skip the element (it's a duplicate)
6. The result is an array of unique destinations with original casing preserved, in the order of first appearance

**Post-Dedup Validation:**
- The minimum 1 destination rule is enforced **after** deduplication. If the input array contains only duplicates of one destination (e.g., `["Tokyo", "tokyo"]`), the result is `["Tokyo"]` (1 element) — this is valid.
- If the input array is empty or contains only empty strings after trim+filter (before dedup), the existing 400 validation error is returned as before.

**Updated Field Validation Rules (Sprint 4):**
| Field | Rules |
|-------|-------|
| `destinations` | Required. Array of strings (or comma-separated string). Each element trimmed. Empty strings filtered. **Case-insensitive deduplication applied (first occurrence preserved).** Min 1 element after dedup. Max 50 destinations after dedup. |

All other fields (`name`, `start_date`, `end_date`) — validation rules unchanged from Sprint 1 + Sprint 2.

**Request Body — unchanged shape:**
```json
{
  "name": "string",
  "destinations": ["string"],
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}
```

**Response (Success — 201 Created — with dedup applied):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-14",
    "created_at": "2026-02-25T12:00:00.000Z",
    "updated_at": "2026-02-25T12:00:00.000Z"
  }
}
```
*If the request sent `["Tokyo", "Osaka", "tokyo"]`, the response returns `["Tokyo", "Osaka"]` (deduped).*

**Response (Error — 400 Bad Request — Validation failure):** Unchanged from Sprint 1. The `"At least one destination is required"` error still applies if the array is empty after trim+filter (before dedup even runs).

**All other error responses (401, 500):** Unchanged from Sprint 1.

**Notes:**
- Deduplication is a **silent normalization** — no error or warning is returned to the client when duplicates are removed. The response simply contains the deduped array.
- The frontend DestinationChipInput component (added in Sprint 3, T-046) already performs client-side case-insensitive duplicate prevention. This backend dedup is a **defense-in-depth** measure that ensures data integrity regardless of which client sends the request.
- The dedup logic is applied in the model layer (`tripModel.js`) before database insert, keeping route handlers clean.
- Comma-separated string inputs are still accepted: `"Tokyo, Osaka, tokyo"` → split → `["Tokyo", "Osaka", "tokyo"]` → dedup → `["Tokyo", "Osaka"]`.

---

### PATCH /api/v1/trips/:id — Updated Behavior (Sprint 4)

| Field | Value |
|-------|-------|
| Sprint | 4 |
| Task | T-058 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 1 | `destinations` array (when provided) is now deduplicated (case-insensitive) before storage. First occurrence's casing is preserved. |

**Description:** Partially update a trip. When `destinations` is included in the PATCH body, the array is deduplicated using the same case-insensitive algorithm as POST before being stored.

**Updated Field Validation Rules (Sprint 4 — applies only when `destinations` is provided):**
| Field | Rules |
|-------|-------|
| `destinations` | Optional. Array of strings (or comma-separated string). Each element trimmed. Empty strings filtered. **Case-insensitive deduplication applied (first occurrence preserved).** Min 1 element after dedup. |

All other fields (`name`, `status`, `start_date`, `end_date`) — validation rules unchanged from Sprint 1 + Sprint 2.

**Request Body — unchanged shape (all fields optional):**
```json
{
  "name": "string",
  "destinations": ["string"],
  "status": "PLANNING | ONGOING | COMPLETED",
  "start_date": "YYYY-MM-DD | null",
  "end_date": "YYYY-MM-DD | null"
}
```

**Response (Success — 200 OK — with dedup applied):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-14",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-25T13:00:00.000Z"
  }
}
```
*If the PATCH sent `{ "destinations": ["Tokyo", "tokyo", "TOKYO"] }`, the response returns `["Tokyo"]` (deduped, first occurrence preserved).*

**All error responses (400, 401, 403, 404):** Unchanged from Sprint 1 + Sprint 2.

**Notes:**
- PATCH with `destinations` omitted does not trigger dedup — existing destinations in the DB are not retroactively deduped. Only new values sent via PATCH are deduped before storage.
- The `NO_UPDATABLE_FIELDS` check is unaffected — `destinations` remains a recognized updatable field.
- The same dedup algorithm (lowercase comparison, first-occurrence preservation) is used in both POST and PATCH for consistency.

---

### Implementation Location

**No new files.** Deduplication logic is added to the existing model layer:

| File | Function | Change |
|------|----------|--------|
| `backend/src/models/tripModel.js` | `createTrip()` | Apply dedup to `data.destinations` before insert |
| `backend/src/models/tripModel.js` | `updateTrip()` | Apply dedup to `updates.destinations` (when present) before update |

A shared helper function (e.g., `deduplicateDestinations(destinations)`) should be defined once and used in both locations. This function:
1. Takes an array of trimmed strings
2. Returns a new array with case-insensitive duplicates removed
3. Preserves original casing of the first occurrence
4. Preserves original order of first occurrences

**Example implementation sketch (for test reference, not prescriptive):**
```javascript
function deduplicateDestinations(destinations) {
  const seen = new Set();
  return destinations.filter(dest => {
    const lower = dest.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}
```

---

### T-058 — No Database Schema Changes Required

T-058 (destination deduplication) requires **no database schema changes**. The `destinations TEXT[]` column type and constraints are unchanged. Deduplication is purely an application-layer normalization applied in the model functions before the database insert/update query. No migration file is needed.

---

## Sprint 4 — No Backend Contract Changes Required for Other Tasks

The following Sprint 4 tasks require **no new or changed API contracts** from the Backend Engineer:

| Task | Reason |
|------|--------|
| T-057 (Design: Rate limit lockout UX) | Design spec only. No backend changes. |
| T-059 (FE: Disable submit during lockout) | Frontend-only. Backend 429 behavior (T-028, Sprint 2) unchanged. |
| T-060 (FE: parseRetryAfterMinutes extraction) | Frontend-only refactor. No API changes. |
| T-061 (FE: ARIA role fix) | Frontend-only accessibility fix. No API changes. |
| T-062 (FE: aria-describedby fix) | Frontend-only accessibility fix. No API changes. |
| T-063 (FE: CreateTripModal focus return) | Frontend-only UX fix. No API changes. |
| T-064 (FE: Axios 401 retry test) | Frontend test-only. No API changes. |
| T-065 (Infra: Docker validation + nginx) | Infrastructure/Deploy Engineer scope. No API changes. |

---

*Sprint 4 contracts above are marked Agreed and approved for implementation. The T-058 contract documents the only backend API change this sprint. Frontend Engineer and QA Engineer should reference this contract for integration and testing.*

---

## Sprint 5 Contracts

---

## T-072 — Trip Search, Filter, and Sort (GET /trips Query Parameters)

**Status:** Agreed — Sprint 5 / T-072
**Schema Change:** None required. No new tables or columns. All changes are query-layer only.

**Summary of Changes:**
- The existing `GET /api/v1/trips` endpoint gains four new optional query parameters: `search`, `status`, `sort_by`, and `sort_order`
- All four parameters are optional and composable — they work together when multiple are provided
- Omitting all parameters preserves the existing behavior exactly (sort by `created_at` desc, no filtering)
- No changes to POST, GET /:id, PATCH, or DELETE trip endpoints
- Status filtering uses the **computed** status (from `computeTripStatus()` in T-030), not the stored status column

---

### GET /api/v1/trips — Updated with Search, Filter & Sort (Sprint 5)

| Field | Value |
|-------|-------|
| Sprint | 5 |
| Task | T-072 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |
| Change from Sprint 4 | Four new optional query parameters: `search`, `status`, `sort_by`, `sort_order` |

**Description:** List all trips belonging to the authenticated user, with optional search, filter, and sort capabilities. All query parameters are optional and composable. When no search/filter/sort params are provided, the endpoint behaves identically to the Sprint 1–4 implementation (all trips, sorted by `created_at` descending).

**Request Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed). Unchanged from Sprint 1. |
| `limit` | integer | 20 | Results per page (max 100). Unchanged from Sprint 1. |
| `search` | string | (none) | **New.** Case-insensitive partial match on trip `name` OR any element of `destinations` array. Trimmed. Whitespace-only or empty string treated as "no search" (same as omitting). |
| `status` | string | (none) | **New.** Filter by **computed** trip status. Must be one of: `PLANNING`, `ONGOING`, `COMPLETED`. Invalid values return 400. Omitting returns trips of all statuses. |
| `sort_by` | string | `created_at` | **New.** Sort field. Must be one of: `name`, `created_at`, `start_date`. Invalid values return 400. |
| `sort_order` | string | `desc` | **New.** Sort direction. Must be one of: `asc`, `desc`. Invalid values return 400. |

---

#### Search Behavior (`?search=`)

The `search` parameter performs a **case-insensitive partial match** (SQL `ILIKE`) on:
1. The trip's `name` column
2. Any element of the trip's `destinations` TEXT[] array

**Implementation approach:**
- Use Knex's `whereRaw` with parameterized queries to search both fields
- Name search: `name ILIKE ?` with `%${search}%` as the parameter
- Destinations search: Use PostgreSQL's `array_to_string()` function to convert the array to a searchable string, then `ILIKE` against it: `array_to_string(destinations, ',') ILIKE ?`
- Combine with `OR`: match if name matches OR any destination matches
- **All queries MUST be parameterized** — never concatenate user input into SQL

**Examples:**
- `?search=Tokyo` → Returns trips where name contains "tokyo" (case-insensitive) OR any destination contains "tokyo"
- `?search=japan` → Returns trips named "Japan 2026" or with "Japan" in destinations
- `?search=` → (empty) Treated as no search filter (returns all trips, same as omitting)
- `?search=%20%20` → (whitespace only) Treated as no search filter after trimming

---

#### Status Filter Behavior (`?status=`)

The `status` parameter filters trips by their **computed status** (T-030 auto-calculation based on `start_date`/`end_date` vs. current date). Because status is computed at read time (not stored), filtering must happen **after** the `computeTripStatus()` transform is applied.

**Implementation approach (post-query filtering):**
1. Fetch all trips matching the user + search criteria from the database
2. Apply `computeTripStatus()` to each trip (as currently done in `listTripsByUser`)
3. Filter the results where `trip.status === statusParam`
4. Apply pagination to the **filtered** result set
5. Return the `total` count as the number of **filtered** trips (not total in DB)

**Why post-query filtering:**
The computed status depends on the current date relative to `start_date`/`end_date`. A trip with `end_date = '2026-02-24'` has `status = 'COMPLETED'` today but `status = 'PLANNING'` yesterday. This runtime calculation cannot be expressed as a simple SQL WHERE clause without duplicating the `computeTripStatus()` logic in SQL. Post-query filtering is acceptable for the expected data volume (a single user's trips — typically <100 trips).

**Performance note:**
For status filtering, we must fetch ALL matching trips (ignoring pagination temporarily), apply status computation, filter, then paginate. This means the DB query fetches more rows than the page limit when status filter is active. This is acceptable for the current scale. If a user has 10,000+ trips, this approach should be revisited with a SQL-level optimization (e.g., a DB function or materialized status column).

**Valid values:**
- `PLANNING` — trips with computed status PLANNING
- `ONGOING` — trips with computed status ONGOING
- `COMPLETED` — trips with computed status COMPLETED

**Invalid status value:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "status": "Status filter must be one of: PLANNING, ONGOING, COMPLETED"
    }
  }
}
```

---

#### Sort Behavior (`?sort_by=` and `?sort_order=`)

The `sort_by` and `sort_order` parameters control the ordering of results.

**Valid `sort_by` values and their SQL column mapping:**

| `sort_by` value | SQL Column | Notes |
|-----------------|-----------|-------|
| `name` | `name` | Alphabetical sort on trip name. Case-insensitive (use `LOWER(name)` in ORDER BY for consistent behavior). |
| `created_at` | `created_at` | Sort by creation timestamp. This is the default (matches Sprint 1–4 behavior). |
| `start_date` | `start_date` | Sort by trip start date. Trips with `NULL` start_date sort last when ascending (`NULLS LAST`) and last when descending (`NULLS LAST`). |

**Valid `sort_order` values:**
- `asc` — ascending (A→Z, oldest→newest, soonest→latest)
- `desc` — descending (Z→A, newest→oldest, latest→soonest)

**Default sort:** `sort_by=created_at`, `sort_order=desc` (matches Sprint 1–4 behavior exactly).

**NULLS handling for `start_date` sort:**
- `sort_by=start_date&sort_order=asc` → Trips with dates first (soonest date first), trips with `NULL start_date` at the end (`NULLS LAST`)
- `sort_by=start_date&sort_order=desc` → Trips with dates first (latest date first), trips with `NULL start_date` at the end (`NULLS LAST`)
- Rationale: Users want to see trips with dates before dateless trips, regardless of sort direction. `NULLS LAST` in both directions achieves this.

**Invalid sort_by value:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "sort_by": "Sort field must be one of: name, created_at, start_date"
    }
  }
}
```

**Invalid sort_order value:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "sort_order": "Sort order must be one of: asc, desc"
    }
  }
}
```

---

#### Composed Query Parameters (All Combined)

All four new parameters compose together. When multiple are provided:
1. **Search** narrows the candidate set (name or destination match)
2. **Status** further filters by computed status
3. **Sort** orders the filtered results
4. **Pagination** pages over the final sorted, filtered result set

**Example — combined query:**
```
GET /api/v1/trips?search=Tokyo&status=PLANNING&sort_by=name&sort_order=asc&page=1&limit=20
```
This returns:
- Only trips where the name or a destination contains "Tokyo" (case-insensitive)
- AND the computed status is "PLANNING"
- Sorted alphabetically by name (A→Z)
- Page 1, up to 20 results

---

#### Response (Success — 200 OK — with filters)

The response shape is **unchanged** from Sprint 1–4. The `data` array contains the filtered, sorted, paginated trips. The `pagination` object reflects the **filtered** total (not the total trips in the database).

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Japan 2026",
      "destinations": ["Tokyo", "Osaka", "Kyoto"],
      "status": "PLANNING",
      "start_date": "2026-08-07",
      "end_date": "2026-08-14",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

**Key change in `pagination.total`:** When filters are active, `total` reflects the count of trips matching ALL active filters (search + status), not the total trips owned by the user. This is required for the frontend to correctly render pagination and "showing X trips" indicators.

---

#### Response (Success — 200 OK — no results)

When filters produce zero results:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

This is NOT an error. An empty result set with status 200 is the correct response when no trips match the filters.

---

#### Response (Error — 400 Bad Request — Invalid query parameters)

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "status": "Status filter must be one of: PLANNING, ONGOING, COMPLETED",
      "sort_by": "Sort field must be one of: name, created_at, start_date",
      "sort_order": "Sort order must be one of: asc, desc"
    }
  }
}
```

**Notes:**
- Only fields with invalid values are included in `fields`
- The `search` parameter is never invalid (any string is accepted; empty/whitespace is silently ignored)
- `page` and `limit` are coerced (NaN → default, out-of-range → clamped) rather than rejected, matching Sprint 1 behavior

---

#### Response (Error — 401 Unauthorized)

```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

Unchanged from Sprint 1.

---

#### Implementation Notes for Backend Engineer

1. **Query parameter validation** should be the first step in the route handler, before any database queries. Validate `status`, `sort_by`, and `sort_order` against their whitelists. Return 400 immediately if invalid.

2. **Search query construction** must use Knex parameterized queries:
   ```javascript
   // Example approach (Knex)
   if (search) {
     query.where(function() {
       this.whereRaw('name ILIKE ?', [`%${search}%`])
           .orWhereRaw("array_to_string(destinations, ',') ILIKE ?", [`%${search}%`]);
     });
   }
   ```
   **Never** concatenate the search string into SQL. The `%` wildcards are part of the parameter value, not the query template.

3. **Status filtering must happen post-query** because status is computed at read time. The model function should:
   - Fetch all rows matching user_id + search (no LIMIT/OFFSET when status filter is active)
   - Apply `computeTripStatus()` to each row
   - Filter by status
   - Slice for pagination
   - Return both the paginated slice and the filtered total count

4. **Sort implementation:**
   - `name` sort: Use `LOWER(name)` in ORDER BY for case-insensitive alphabetical sorting
   - `created_at` sort: Direct column sort (existing behavior)
   - `start_date` sort: Use `NULLS LAST` to push trips without dates to the end in both asc and desc directions
   - Sort is applied at the SQL level (before status post-filtering) for efficiency

5. **When status filter is NOT active:** Pagination can be applied at the SQL level (LIMIT/OFFSET) as currently done — no need to fetch all rows.

6. **When status filter IS active:** Must fetch all matching rows (user_id + search), apply computeTripStatus, filter by status, then manually paginate in JavaScript. This is a necessary trade-off for computed status.

---

#### Frontend Integration Notes

The Frontend Engineer (T-073) should reference the UI spec (Spec 11 in ui-spec.md) for the visual design. Key API integration points:

1. **Search debounce:** The frontend debounces search input by 300ms before calling the API. The `search` param should be trimmed before sending; empty/whitespace-only strings should be omitted from the query.

2. **Status filter:** Sends `?status=PLANNING|ONGOING|COMPLETED` on change. When "all statuses" is selected, omit the `status` param entirely (don't send `?status=`).

3. **Sort:** The frontend combines `sort_by` and `sort_order` into a single dropdown (e.g., "newest first" = `sort_by=created_at&sort_order=desc`). Both params are sent to the API.

4. **Pagination:** The `pagination.total` now reflects filtered count. Use this for "showing X trips" indicator and pagination controls.

5. **Default behavior:** When no filters are active, omit all new params — the API defaults to `created_at desc` with no search/status filter, matching Sprint 1–4 behavior exactly.

6. **URL sync:** Filter state is stored in browser URL params (via `replaceState`) per Spec 11.6. On page load, read URL params and initialize the API call with them.

---

### T-072 — No Database Schema Changes Required

T-072 (trip search, filter, and sort) requires **no database schema changes**. The existing `trips` table structure (with `name VARCHAR(255)`, `destinations TEXT[]`, `status VARCHAR(20)`, `start_date DATE NULL`, `end_date DATE NULL`, `created_at TIMESTAMPTZ`) already supports all the query functionality. No migration file is needed. No new indexes are needed at the current scale (all queries are user-scoped via the existing `trips_user_id_idx` index).

---

## Sprint 5 — No Backend Contract Changes Required for Other Tasks

The following Sprint 5 tasks require **no new or changed API contracts** from the Backend Engineer:

| Task | Reason |
|------|--------|
| T-071 (Design: Search/Filter/Sort UI) | Design spec only. No backend changes. |
| T-073 (FE: Search/Filter/Sort UI) | Frontend-only. Consumes the T-072 API contract documented above. |
| T-074 (FE: React Router v7 future flags) | Frontend-only refactor. No API changes. |
| T-075 (E2E: Playwright tests) | Test setup only. No API changes. |
| T-076 (QA: Security checklist) | QA review only. No API changes. |
| T-077 (QA: Integration testing) | QA testing only. No API changes. |
| T-078 (Deploy: Staging re-deployment) | Deploy scope. No API changes. |
| T-079 (Monitor: Health check) | Monitor scope. No API changes. |
| T-080 (User Agent: Walkthrough) | User testing only. No API changes. |

---

*Sprint 5 contracts above are marked Agreed and approved for implementation. The T-072 contract documents the only backend API change this sprint. The GET /trips endpoint gains search, filter, and sort query parameters — all other endpoints are unchanged. Frontend Engineer and QA Engineer should reference this contract for integration and testing.*

---

## Sprint 6 Contracts

---

## T-085 — ILIKE Wildcard Escaping Fix (GET /api/v1/trips — search behavior correction)

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Task | T-085 |
| Status | Agreed |
| Auth Required | Bearer token |
| Feedback Source | FB-062 |

**Description:** Bug fix to the existing `GET /api/v1/trips?search=<term>` endpoint documented in T-072. The search parameter is used in a PostgreSQL `ILIKE` query, but special SQL wildcard characters in the user's search string (`%`, `_`, `\`) were not being escaped. As a result, `search=%` matched all trips (because `%` is the SQL wildcard for "any sequence of characters"), and `search=_` matched any single-character trip name, both leaking data the user did not intend to search for.

**Change:** Before interpolating the search string into the ILIKE pattern, the backend must escape:
- `\` → `\\` (backslash, must be escaped first to avoid double-escaping)
- `%` → `\%`
- `_` → `\_`

The ESCAPE clause must be used in the ILIKE expression: `name ILIKE ? ESCAPE '\'`

**No endpoint signature change.** Route, method, query parameters, response shape, auth, and error codes are identical to the T-072 contract. Only the internal query behavior changes.

**Before (Sprint 5 behavior):**
```sql
-- search=% matched all rows (% is SQL wildcard)
name ILIKE '%' || search || '%'
-- equivalent to ILIKE '%%%' → matches everything
```

**After (Sprint 6 corrected behavior):**
```sql
-- search=% is escaped to \%, treated as a literal percent sign
-- escape function applied before interpolation
escaped_search = search
  .replace(/\\/g, '\\\\')  -- escape backslash first
  .replace(/%/g, '\\%')    -- escape percent
  .replace(/_/g, '\\_')    -- escape underscore

name ILIKE '%' || escaped_search || '%' ESCAPE '\'
-- search=% → ILIKE '%\%%' ESCAPE '\' → matches literal '%' in name
-- search=_ → ILIKE '%\_%' ESCAPE '\' → matches literal '_' in name
```

**Verified behavioral changes:**

| Search Term | Sprint 5 Result | Sprint 6 Result (Correct) |
|-------------|----------------|--------------------------|
| `%` | All trips (wildcard matches everything) | 0 trips (or only trips with `%` in name/destinations) |
| `_` | All trips with a single-character name | Only trips containing literal `_` |
| `Paris` | Trips containing "Paris" | Trips containing "Paris" (unchanged — no special chars) |
| `100%` | Trips containing "100" followed by anything | Trips containing literal "100%" |
| `New_York` | Trips with names matching "New" + any single char + "York" | Trips containing literal "New_York" |

**Applies to both search targets:**
- `name ILIKE '%<escaped_search>%' ESCAPE '\'`
- `array_to_string(destinations, ',') ILIKE '%<escaped_search>%' ESCAPE '\'`

**No schema changes required.**

---

## T-086 — Land Travel CRUD Endpoints

| Field | Value |
|-------|-------|
| Sprint | 6 |
| Task | T-086 |
| Status | Agreed |
| Auth Required | Bearer token (all endpoints) |
| Schema Change | Migration 009 — Creates `land_travels` table (Manager Pre-Approved) |

**Description:** Full CRUD for a new `land_travels` sub-resource nested under trips. Land travel captures ground transportation entries (rental cars, buses, trains, rideshares, ferries, and other modes) for a trip. All endpoints require authentication and enforce trip ownership (the authenticated user must own the parent trip).

---

### Land Travel Object Shape

The canonical land travel resource object returned in all success responses:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "RENTAL_CAR",
  "provider": "Hertz",
  "from_location": "San Francisco",
  "to_location": "Los Angeles",
  "departure_date": "2026-08-07",
  "departure_time": "09:00:00",
  "arrival_date": "2026-08-07",
  "arrival_time": "14:30:00",
  "confirmation_number": "XYZ-123456",
  "notes": "Pick up at airport terminal 2. Return same location.",
  "created_at": "2026-08-01T10:00:00.000Z",
  "updated_at": "2026-08-01T10:00:00.000Z"
}
```

**Field Descriptions:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID string | No | Primary key, UUID v4 |
| `trip_id` | UUID string | No | Parent trip's ID |
| `mode` | string (enum) | No | One of: `RENTAL_CAR`, `BUS`, `TRAIN`, `RIDESHARE`, `FERRY`, `OTHER` |
| `provider` | string | Yes | Carrier/company name (e.g., `"Hertz"`, `"Amtrak"`, `"Uber"`). `null` if not set. |
| `from_location` | string | No | Origin location name (e.g., `"San Francisco"`, `"SFO Airport"`) |
| `to_location` | string | No | Destination location name |
| `departure_date` | string (`YYYY-MM-DD`) | No | Departure date in ISO 8601 date format |
| `departure_time` | string (`HH:MM:SS`) | Yes | Departure local time in 24h format. `null` if not set. |
| `arrival_date` | string (`YYYY-MM-DD`) | Yes | Arrival date in ISO 8601 date format. `null` if not set. |
| `arrival_time` | string (`HH:MM:SS`) | Yes | Arrival local time in 24h format. `null` if not set. |
| `confirmation_number` | string | Yes | Booking/confirmation code. `null` if not set. |
| `notes` | string | Yes | Free-text notes. `null` if not set. |
| `created_at` | ISO 8601 UTC string | No | Record creation timestamp |
| `updated_at` | ISO 8601 UTC string | No | Last update timestamp |

**Notes on time fields:**
- `departure_time` and `arrival_time` are stored as PostgreSQL `TIME` and returned as `HH:MM:SS` strings (24-hour format with seconds). E.g., `"09:00:00"`, `"14:30:00"`. The PostgreSQL `pg` driver returns `TIME` columns as `HH:MM:SS`; the backend normalises to this format via `TO_CHAR(departure_time, 'HH24:MI:SS')`.
- There are no timezone fields for land travel times — times are stored and returned as local (wall-clock) times, matching how the user entered them. The frontend renders them directly without timezone conversion.
- `arrival_time` is only meaningful if `arrival_date` is also set. The API enforces: if `arrival_time` is provided, `arrival_date` must also be provided (400 error otherwise).
- If `arrival_date` is provided, it must be greater than or equal to `departure_date`. (Same-day arrivals are valid.)

---

### GET /api/v1/trips/:tripId/land-travel

| Field | Value |
|-------|-------|
| Method | GET |
| Path | `/api/v1/trips/:tripId/land-travel` |
| Auth Required | Bearer token |
| Pagination | No (returns all entries for the trip) |

**Description:** Returns all land travel entries for a trip, sorted by `departure_date` ASC, then `departure_time` ASC NULLS LAST (entries without a departure time appear after timed entries on the same date).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tripId` | UUID | The parent trip's ID |

**Request Body:** None

**Response (Success — 200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "trip_id": "550e8400-e29b-41d4-a716-446655440000",
      "mode": "TRAIN",
      "provider": "Amtrak",
      "from_location": "San Francisco",
      "to_location": "Los Angeles",
      "departure_date": "2026-08-07",
      "departure_time": "09:00:00",
      "arrival_date": "2026-08-07",
      "arrival_time": "20:45:00",
      "confirmation_number": "AMTK-789012",
      "notes": null,
      "created_at": "2026-08-01T10:00:00.000Z",
      "updated_at": "2026-08-01T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "trip_id": "550e8400-e29b-41d4-a716-446655440000",
      "mode": "RENTAL_CAR",
      "provider": "Hertz",
      "from_location": "Los Angeles",
      "to_location": "San Diego",
      "departure_date": "2026-08-08",
      "departure_time": null,
      "arrival_date": null,
      "arrival_time": null,
      "confirmation_number": null,
      "notes": "Compact car, unlimited mileage",
      "created_at": "2026-08-01T10:05:00.000Z",
      "updated_at": "2026-08-01T10:05:00.000Z"
    }
  ]
}
```

**Empty list (no entries yet — 200 OK):**
```json
{
  "data": []
}
```

**Error Responses:**

| HTTP Status | Code | Condition |
|-------------|------|-----------|
| 400 | `VALIDATION_ERROR` | `tripId` is not a valid UUID v4 |
| 401 | `UNAUTHORIZED` | Missing or invalid/expired access token |
| 403 | `FORBIDDEN` | Authenticated user does not own the trip |
| 404 | `NOT_FOUND` | Trip with `tripId` does not exist |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Error shapes:**
```json
{ "error": { "message": "Invalid ID format", "code": "VALIDATION_ERROR" } }
{ "error": { "message": "Authentication required", "code": "UNAUTHORIZED" } }
{ "error": { "message": "You do not have access to this trip", "code": "FORBIDDEN" } }
{ "error": { "message": "Trip not found", "code": "NOT_FOUND" } }
```

---

### POST /api/v1/trips/:tripId/land-travel

| Field | Value |
|-------|-------|
| Method | POST |
| Path | `/api/v1/trips/:tripId/land-travel` |
| Auth Required | Bearer token |

**Description:** Creates a new land travel entry for the specified trip. Returns the created entry with its server-assigned `id`, `created_at`, and `updated_at`.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tripId` | UUID | The parent trip's ID |

**Request Body:**
```json
{
  "mode": "RENTAL_CAR",
  "provider": "Hertz",
  "from_location": "San Francisco",
  "to_location": "Los Angeles",
  "departure_date": "2026-08-07",
  "departure_time": "09:00:00",
  "arrival_date": "2026-08-07",
  "arrival_time": "14:30:00",
  "confirmation_number": "XYZ-123456",
  "notes": "Pick up at airport terminal 2."
}
```

**Field Validation Rules:**

| Field | Required | Type | Rules |
|-------|----------|------|-------|
| `mode` | Yes | string (enum) | Must be one of: `RENTAL_CAR`, `BUS`, `TRAIN`, `RIDESHARE`, `FERRY`, `OTHER`. Case-sensitive. |
| `provider` | No | string \| null | Optional. If provided: trimmed, max length 255. Send `null` or omit to leave empty. |
| `from_location` | Yes | string | Trimmed. Min length 1 after trim. Max length 500. |
| `to_location` | Yes | string | Trimmed. Min length 1 after trim. Max length 500. |
| `departure_date` | Yes | string (`YYYY-MM-DD`) | Required. Must be a valid calendar date in ISO 8601 format. |
| `departure_time` | No | string \| null | Optional. If provided: must match `HH:MM` or `HH:MM:SS` (24h format). Send `null` or omit to leave empty. |
| `arrival_date` | No | string \| null | Optional. If provided: must be a valid `YYYY-MM-DD` date >= `departure_date`. Send `null` or omit to leave empty. |
| `arrival_time` | No | string \| null | Optional. If provided: `arrival_date` must also be provided. Must match `HH:MM` or `HH:MM:SS`. If `arrival_date` == `departure_date`, `arrival_time` must be > `departure_time` (when both are provided). |
| `confirmation_number` | No | string \| null | Optional. Trimmed. Max length 255. |
| `notes` | No | string \| null | Optional. Max length 2000. |

**Cross-field validation rules:**
1. If `arrival_time` is provided, `arrival_date` must also be provided. (400 error: "arrival_date is required when arrival_time is provided")
2. If `arrival_date` is provided, it must be >= `departure_date`. (400 error: "arrival_date cannot be before departure_date")
3. If `arrival_date` == `departure_date` and both `departure_time` and `arrival_time` are provided, `arrival_time` must be > `departure_time`. (400 error: "arrival_time must be after departure_time on the same day")

**Response (Success — 201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "mode": "RENTAL_CAR",
    "provider": "Hertz",
    "from_location": "San Francisco",
    "to_location": "Los Angeles",
    "departure_date": "2026-08-07",
    "departure_time": "09:00:00",
    "arrival_date": "2026-08-07",
    "arrival_time": "14:30:00",
    "confirmation_number": "XYZ-123456",
    "notes": "Pick up at airport terminal 2.",
    "created_at": "2026-08-01T10:00:00.000Z",
    "updated_at": "2026-08-01T10:00:00.000Z"
  }
}
```

**Error Responses:**

| HTTP Status | Code | Condition |
|-------------|------|-----------|
| 400 | `VALIDATION_ERROR` | `tripId` is not a valid UUID v4 |
| 400 | `VALIDATION_ERROR` | Missing required field (`mode`, `from_location`, `to_location`, `departure_date`) |
| 400 | `VALIDATION_ERROR` | `mode` is not one of the allowed enum values |
| 400 | `VALIDATION_ERROR` | `departure_date` is not a valid `YYYY-MM-DD` date |
| 400 | `VALIDATION_ERROR` | `departure_time` / `arrival_time` is not a valid `HH:MM` or `HH:MM:SS` time |
| 400 | `VALIDATION_ERROR` | `arrival_time` provided without `arrival_date` |
| 400 | `VALIDATION_ERROR` | `arrival_date` before `departure_date` |
| 400 | `VALIDATION_ERROR` | `arrival_time` not after `departure_time` on same day |
| 401 | `UNAUTHORIZED` | Missing or invalid/expired access token |
| 403 | `FORBIDDEN` | Authenticated user does not own the trip |
| 404 | `NOT_FOUND` | Trip with `tripId` does not exist |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Validation error shape (field-level):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "mode": "mode must be one of: RENTAL_CAR, BUS, TRAIN, RIDESHARE, FERRY, OTHER",
      "departure_date": "departure_date is required"
    }
  }
}
```

---

### PATCH /api/v1/trips/:tripId/land-travel/:ltId

| Field | Value |
|-------|-------|
| Method | PATCH |
| Path | `/api/v1/trips/:tripId/land-travel/:ltId` |
| Auth Required | Bearer token |

**Description:** Partially updates an existing land travel entry. At least one updatable field must be provided. For cross-field validation (e.g., arrival before departure), the merged values (existing fields + incoming changes) are used for comparison — the client does not need to re-send unchanged fields.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tripId` | UUID | The parent trip's ID |
| `ltId` | UUID | The land travel entry's ID |

**Request Body:** One or more updatable fields:
```json
{
  "mode": "TRAIN",
  "provider": "Amtrak",
  "from_location": "San Francisco",
  "to_location": "Los Angeles",
  "departure_date": "2026-08-07",
  "departure_time": "10:00:00",
  "arrival_date": "2026-08-07",
  "arrival_time": "21:00:00",
  "confirmation_number": "AMTK-789012",
  "notes": "Quiet car reserved."
}
```

**Updatable Fields:** All fields from POST except `id`, `trip_id`, `created_at`, `updated_at` are updatable via PATCH. Fields not included in the request body are left unchanged.

**Field Validation Rules (same as POST, applied only to provided fields):**

| Field | Rules |
|-------|-------|
| `mode` | If provided: must be one of the valid enum values. |
| `provider` | If provided: string or `null`. Trimmed, max 255. |
| `from_location` | If provided: trimmed, min 1 char, max 500. |
| `to_location` | If provided: trimmed, min 1 char, max 500. |
| `departure_date` | If provided: valid `YYYY-MM-DD` date. |
| `departure_time` | If provided: valid `HH:MM` or `HH:MM:SS`, or `null`. |
| `arrival_date` | If provided: valid `YYYY-MM-DD` >= merged departure_date, or `null`. Setting to `null` also clears `arrival_time`. |
| `arrival_time` | If provided: valid `HH:MM` or `HH:MM:SS`, or `null`. Merged `arrival_date` must exist. |
| `confirmation_number` | If provided: string or `null`. Trimmed, max 255. |
| `notes` | If provided: string or `null`. Max 2000. |

**Cross-field validation (using merged existing + incoming values):**
1. If merged `arrival_time` is non-null, merged `arrival_date` must be non-null.
2. If merged `arrival_date` is non-null, merged `arrival_date` >= merged `departure_date`.
3. If merged `arrival_date` == merged `departure_date` and both times are non-null, merged `arrival_time` > merged `departure_time`.

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "mode": "TRAIN",
    "provider": "Amtrak",
    "from_location": "San Francisco",
    "to_location": "Los Angeles",
    "departure_date": "2026-08-07",
    "departure_time": "10:00:00",
    "arrival_date": "2026-08-07",
    "arrival_time": "21:00:00",
    "confirmation_number": "AMTK-789012",
    "notes": "Quiet car reserved.",
    "created_at": "2026-08-01T10:00:00.000Z",
    "updated_at": "2026-08-02T08:30:00.000Z"
  }
}
```

**Error Responses:**

| HTTP Status | Code | Condition |
|-------------|------|-----------|
| 400 | `VALIDATION_ERROR` | `tripId` or `ltId` is not a valid UUID v4 |
| 400 | `VALIDATION_ERROR` | No updatable fields provided in request body |
| 400 | `VALIDATION_ERROR` | Any field fails its validation rule (type, format, enum, cross-field) |
| 401 | `UNAUTHORIZED` | Missing or invalid/expired access token |
| 403 | `FORBIDDEN` | Authenticated user does not own the trip |
| 404 | `NOT_FOUND` | Trip with `tripId` does not exist |
| 404 | `NOT_FOUND` | Land travel entry with `ltId` does not exist under this trip |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### DELETE /api/v1/trips/:tripId/land-travel/:ltId

| Field | Value |
|-------|-------|
| Method | DELETE |
| Path | `/api/v1/trips/:tripId/land-travel/:ltId` |
| Auth Required | Bearer token |

**Description:** Permanently deletes a land travel entry. Returns 204 No Content on success.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tripId` | UUID | The parent trip's ID |
| `ltId` | UUID | The land travel entry's ID |

**Request Body:** None

**Response (Success — 204 No Content):** Empty body.

**Error Responses:**

| HTTP Status | Code | Condition |
|-------------|------|-----------|
| 400 | `VALIDATION_ERROR` | `tripId` or `ltId` is not a valid UUID v4 |
| 401 | `UNAUTHORIZED` | Missing or invalid/expired access token |
| 403 | `FORBIDDEN` | Authenticated user does not own the trip |
| 404 | `NOT_FOUND` | Trip with `tripId` does not exist |
| 404 | `NOT_FOUND` | Land travel entry with `ltId` does not exist under this trip |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### T-086 — Migration 009: Create `land_travels` Table

**Manager Pre-Approved:** Schema approved in Sprint 6 planning (2026-02-27). Backend Engineer may implement migration 009 immediately following the design spec review (T-081 is Done).

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
- `CHECK` constraint on `mode` enforces the enum at the DB level.
- `ON DELETE CASCADE` on `trip_id` ensures all land travel entries are automatically deleted when the parent trip is deleted.
- `arrival_time` allowed even when `arrival_date` is NULL at the DB level — cross-field validation is enforced at the application layer (API routes) to keep the migration simple and reversible.
- `TEXT` used for `from_location`, `to_location`, `notes` (no hard length cap at DB level); length limits enforced at application layer.
- Index on `trip_id` for performant per-trip queries.
- `updated_at` is not automatically maintained by a trigger; the application layer must set it explicitly on every PATCH.

---

### T-086 — Test Plan

Minimum tests required:

**Happy paths:**
- `GET /trips/:id/land-travel` with no entries → 200, `data: []`
- `GET /trips/:id/land-travel` with multiple entries → 200, sorted by departure_date ASC, departure_time NULLS LAST
- `POST /trips/:id/land-travel` with all fields → 201, returns full object with server-assigned id + timestamps
- `POST /trips/:id/land-travel` with only required fields (mode, from_location, to_location, departure_date) → 201, nullable fields are null
- `PATCH /trips/:id/land-travel/:ltId` with one field → 200, only that field changes, updated_at updated
- `PATCH /trips/:id/land-travel/:ltId` with mode change → 200, mode updated
- `DELETE /trips/:id/land-travel/:ltId` → 204, subsequent GET no longer includes that entry

**Error paths:**
- `POST` with invalid mode (e.g., `"BIKE"`) → 400 `VALIDATION_ERROR`
- `POST` with missing `from_location` → 400 `VALIDATION_ERROR`
- `POST` with `arrival_date` before `departure_date` → 400 `VALIDATION_ERROR`
- `POST` with `arrival_time` but no `arrival_date` → 400 `VALIDATION_ERROR`
- `GET/POST/PATCH/DELETE` with non-UUID `tripId` → 400 `VALIDATION_ERROR`
- `GET/POST/PATCH/DELETE` without auth token → 401 `UNAUTHORIZED`
- `GET/POST/PATCH/DELETE` with valid token but different user's trip → 403 `FORBIDDEN`
- `GET/POST` with non-existent `tripId` → 404 `NOT_FOUND`
- `PATCH/DELETE` with non-existent `ltId` → 404 `NOT_FOUND`

---

## Sprint 6 — No Backend Contract Changes Required for Other Tasks

The following Sprint 6 tasks require **no new or changed API contracts** from the Backend Engineer:

| Task | Reason |
|------|--------|
| T-081 (Design: Land Travel Spec) | Design spec only. Unblocks T-086. |
| T-082 (Design: Calendar Enhancements) | Design spec only. No backend changes. |
| T-083 (FE: Activity Edit Bugs) | Frontend-only bug fix. No API changes. |
| T-084 (FE: FilterToolbar Flicker Fix) | Frontend-only bug fix. No API changes. |
| T-087 (FE: Land Travel Edit Page) | Frontend-only. Consumes T-086 API contract. |
| T-088 (FE: Land Travel Section + Calendar Integration) | Frontend-only. Consumes T-086 API contract. |
| T-089 (FE: Calendar Enhancements) | Frontend-only. Uses existing sub-resource data. |
| T-090 (QA: Security Checklist) | QA review only. |
| T-091 (QA: Integration Testing) | QA testing only. |
| T-092 (Deploy: Staging Re-deploy) | Deploy scope. |
| T-093 (Monitor: Health Check) | Monitor scope. |
| T-094 (User Agent: Walkthrough) | User testing only. |

---

*Sprint 6 contracts above are marked Agreed and approved for implementation. Two backend changes this sprint: (1) T-085 escapes ILIKE wildcard characters in the search parameter of GET /trips — no endpoint signature change, behavior-only fix. (2) T-086 introduces the full land travel sub-resource with four new endpoints nested under /trips/:tripId/land-travel, backed by migration 009 (pre-approved). Frontend Engineer and QA Engineer should reference this contract for integration and testing.*

---

## Sprint 7 Contracts

**Sprint 7 — 2026-02-27**

Backend Engineer scope this sprint:

| Task | Contract Summary |
|------|-----------------|
| T-098 | Bug fix — stays `check_in_at` / `check_out_at` UTC serialization. No endpoint signature changes. Clarification note added to stays contracts. |
| T-103 | Feature — trip notes field. Migration 010 adds `notes TEXT NULL` to `trips`. `GET /trips`, `GET /trips/:id`, and `PATCH /trips/:id` all updated to include `notes`. |

No new endpoints are introduced in Sprint 7. All changes are additive (notes field) or correctness fixes (UTC serialization).

---

### T-098 — Stays UTC Timestamp Serialization Fix (FB-081)

**Sprint:** 7
**Task:** T-098
**Status:** Agreed
**Type:** Bug Fix — no endpoint signature change

#### Root Cause

The `check_in_at` and `check_out_at` columns on the `stays` table are `TIMESTAMPTZ` (timestamp with time zone) in PostgreSQL. The Node.js `pg` driver, by default, parses `TIMESTAMPTZ` values using the Node.js process local timezone before handing the JS `Date` object back to Knex. When that `Date` is serialized to JSON (via `JSON.stringify`), it emits a local-timezone ISO string — **not UTC** — unless the process is running in UTC.

On staging, the server process runs in a timezone that differs from UTC (e.g., `America/New_York` = UTC−4 during EDT). A stay with check-in at 4:00 PM local time is stored correctly as `2026-08-07T20:00:00.000Z` in the DB, but when returned it becomes `2026-08-07T16:00:00-04:00` — which clients may mis-interpret as 4 PM UTC, shifting the displayed time by 4 hours.

#### Fix Approach (Implementation Reference Only — No Contract Shape Change)

The fix is **applied at the `pg` driver level** before Knex processes the result. PostgreSQL type OID 1184 (`TIMESTAMPTZ`) and 1114 (`TIMESTAMP`) must be overridden to return the raw string from the database driver without automatic JS Date conversion:

```js
// In backend/src/config/database.js (or a separate pg-types setup file)
import pg from 'pg';

// Override TIMESTAMPTZ (1184) parsing — return raw UTC string from PostgreSQL
pg.types.setTypeParser(1184, (val) => val);
// Override TIMESTAMP (1114) parsing — return raw string (no tz conversion)
pg.types.setTypeParser(1114, (val) => val);
```

PostgreSQL always returns `TIMESTAMPTZ` in UTC ISO 8601 format when no client timezone is set (i.e., `SET TIME ZONE 'UTC'` is the default session). With this override, the raw string passes through unchanged and is serialized by `JSON.stringify` as-is.

**No application-layer changes required to routes or models.** The contract shape below was already the intended shape — this fix makes the implementation honor the contract.

#### Confirmed Contract (No Change to Shape)

All stays endpoints return `check_in_at` and `check_out_at` as **ISO 8601 UTC strings**. This was the original Sprint 1 contract; T-098 makes it correct in practice.

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "trip_id": "550e8400-e29b-41d4-a716-446655440001",
    "category": "HOTEL",
    "name": "Hyatt Regency San Francisco",
    "address": "5 Embarcadero Center, San Francisco, CA 94111",
    "check_in_at": "2026-08-07T20:00:00.000Z",
    "check_in_tz": "America/Los_Angeles",
    "check_out_at": "2026-08-09T15:00:00.000Z",
    "check_out_tz": "America/Los_Angeles",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T12:00:00.000Z"
  }
}
```

**`check_in_at`:** UTC ISO 8601 timestamp of check-in moment. Displayed in local time by converting with `check_in_tz`.
**`check_out_at`:** UTC ISO 8601 timestamp of checkout moment. Displayed in local time by converting with `check_out_tz`.

#### Frontend Integration Note (T-098)

The Frontend Engineer must ensure that when displaying `check_in_at` / `check_out_at`, the local time is derived by converting the UTC string using the accompanying `_tz` field:

```js
// Correct — uses IANA timezone to convert UTC → local display time
const localTime = new Date(check_in_at).toLocaleTimeString('en-US', {
  timeZone: check_in_tz,
  hour: 'numeric',
  minute: '2-digit',
});

// WRONG — do not display UTC hours directly as if they were local
const wrongTime = new Date(check_in_at).getHours(); // UTC hours only
```

If the frontend was previously relying on the incorrectly-serialized local timestamp string from the backend, it must be updated to use proper UTC → local conversion via the `_tz` field.

#### Test Plan — T-098

**Happy path:**
- Create a stay with `check_in_at: "2026-08-07T20:00:00.000Z"` (`check_in_tz: "America/Los_Angeles"`) → GET stay returns `"check_in_at": "2026-08-07T20:00:00.000Z"` (UTC, not shifted)
- The displayed local time from converting this with `America/Los_Angeles` = 4:00 PM — must match what was entered
- Create a stay in a UTC+9 timezone (e.g., `check_in_at: "2026-08-07T03:00:00.000Z"`, `check_in_tz: "Asia/Tokyo"`) → local time = 12:00 PM JST

**Error path (regression):**
- After fix: confirm `check_in_at` string in API response ends with `Z` (UTC) or includes explicit `+00:00` offset — never a non-UTC offset like `-04:00` or `-05:00`

---

### T-103 — Trip Notes Field

**Sprint:** 7
**Task:** T-103
**Status:** Agreed
**Schema Change:** Migration 010 — adds `notes TEXT NULL` to `trips` table (Manager Pre-Approved 2026-02-27)
**Auth Required:** Bearer token (all endpoints below)

#### Overview

The `notes` field is a freeform text field on the trip resource. It is stored as `TEXT NULL` in the database (nullable, no DB-level length cap). The API enforces a 2000-character maximum. All existing trip endpoints (`GET /trips`, `GET /trips/:id`, `PATCH /trips/:id`) are updated to include the `notes` field.

No new endpoints are introduced.

---

#### Migration 010 — Add `notes` to `trips` Table

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
- Nullable addition — fully backward-compatible. Existing trips get `notes = NULL` automatically.
- No DB-level length constraint — max length enforced at the API validation layer (2000 chars).
- `updated_at` is NOT touched by this migration — the column already exists and is managed by the application layer.

---

#### Updated: GET /api/v1/trips (List)

| Field | Value |
|-------|-------|
| Sprint | 7 (extends Sprint 1 T-005) |
| Task | T-103 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Change:** The `notes` field is now included in every trip object in the list response. Existing query parameters (`?search`, `?status`, `?sort_by`, `?sort_order`, `?page`, `?limit`) are unchanged.

**Response (Success — 200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Japan 2026",
      "destinations": ["Tokyo", "Osaka", "Kyoto"],
      "status": "PLANNING",
      "start_date": "2026-08-07",
      "end_date": "2026-08-21",
      "notes": "We fly into Narita on August 7th...",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

**`notes` field:**
- Type: `string | null`
- `null` when no notes have been set
- Non-null string (up to 2000 chars) when notes exist
- Empty string `""` is treated as `null` at the display layer (frontend) — the API may return `""` or `null` when notes are cleared; frontend treats both as "no notes"

**All error responses are unchanged from Sprint 1.**

---

#### Updated: GET /api/v1/trips/:id

| Field | Value |
|-------|-------|
| Sprint | 7 (extends Sprint 1 T-005) |
| Task | T-103 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Change:** The `notes` field is now included in the single-trip response.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Trip ID |

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-21",
    "notes": "We fly into Narita on August 7th and spend 10 days exploring Tokyo, Kyoto, and Osaka.",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T13:00:00.000Z"
  }
}
```

**`notes` field:**
- Type: `string | null`
- `null` when no notes exist
- Non-null string (up to 2000 chars) when notes have been saved

**All error responses are unchanged from Sprint 1 (401, 403, 404).**

---

#### Updated: PATCH /api/v1/trips/:id

| Field | Value |
|-------|-------|
| Sprint | 7 (extends Sprint 1 T-005) |
| Task | T-103 |
| Status | Agreed |
| Auth Required | Yes (Bearer token) |

**Change:** `notes` is now an accepted field in the PATCH request body.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Trip ID |

**Request Body (all fields optional — PATCH semantics):**
```json
{
  "name": "string",
  "destinations": ["string"],
  "status": "PLANNING | ONGOING | COMPLETED",
  "notes": "string | null"
}
```

**Field Validation Rules (applied only to provided fields):**
| Field | Rules |
|-------|-------|
| `name` | String. Trimmed. Min length 1 after trim. Max length 255. |
| `destinations` | Array of strings. Min 1 element. Each element: non-empty string after trim. |
| `status` | Must be one of: `"PLANNING"`, `"ONGOING"`, `"COMPLETED"`. |
| `notes` | String or null. If string: max length 2000 characters (after no trimming — whitespace is preserved). If null: clears the notes field. Empty string `""` is accepted and stored as-is (equivalent to null at the display layer). |

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-21",
    "notes": "My updated notes.",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-27T09:00:00.000Z"
  }
}
```

**Response (Error — 400 Bad Request — notes exceeds max length):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "notes": "Notes must not exceed 2000 characters"
    }
  }
}
```

**Response (Error — 400 Bad Request — notes is not a string or null):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "notes": "Notes must be a string or null"
    }
  }
}
```

**All other error responses are unchanged from Sprint 1 (400 NO_UPDATABLE_FIELDS, 401, 403, 404).**

**Notes:**
- Sending `{ "notes": null }` explicitly clears the notes field (sets DB column to NULL).
- Sending `{ "notes": "" }` stores an empty string in the DB (treated as "no notes" in the frontend display layer).
- `notes` participates in the existing `NO_UPDATABLE_FIELDS` check — if the ONLY field sent is `notes`, it is a valid update (not a `NO_UPDATABLE_FIELDS` error) because `notes` is now an accepted updatable field.
- `updated_at` is bumped on every successful PATCH that includes `notes`.

---

#### Test Plan — T-103

**Happy paths:**
- `GET /trips` with no notes → each trip has `"notes": null`
- `GET /trips` after notes are set → trip includes `"notes": "text"`
- `GET /trips/:id` with no notes → `"notes": null` in response
- `GET /trips/:id` after `PATCH` sets notes → `"notes": "text"` in response
- `PATCH /trips/:id` with `{ "notes": "My Tokyo trip notes" }` → 200, response includes `"notes": "My Tokyo trip notes"`
- `PATCH /trips/:id` with `{ "notes": null }` → 200, response includes `"notes": null`
- `PATCH /trips/:id` with `{ "notes": "" }` → 200, response includes `"notes": ""`
- `PATCH /trips/:id` with exactly 2000 characters → 200 (boundary: accepted)
- `PATCH /trips/:id` with `notes` as only field → 200 (not a NO_UPDATABLE_FIELDS error)
- `PATCH /trips/:id` combining `notes` with `name` → 200, both fields updated

**Error paths:**
- `PATCH /trips/:id` with notes > 2000 characters → 400 `VALIDATION_ERROR`, `fields.notes` present
- `PATCH /trips/:id` with `{ "notes": 12345 }` (number, not string/null) → 400 `VALIDATION_ERROR`
- `PATCH /trips/:id` with `{ "notes": ["array"] }` → 400 `VALIDATION_ERROR`
- `PATCH /trips/:id` with notes field without auth → 401 `UNAUTHORIZED`
- `PATCH /trips/:id` with notes field on another user's trip → 403 `FORBIDDEN`
- `PATCH /trips/:id` on non-existent trip → 404 `NOT_FOUND`

---

## Sprint 7 — No Backend Contract Changes Required for Other Tasks

The following Sprint 7 tasks require **no new or changed API contracts** from the Backend Engineer:

| Task | Reason |
|------|--------|
| T-094 (User Agent: Sprint 6 carry-over) | User testing only. No API changes. |
| T-095 (Deploy: HTTPS + pm2 re-enable) | Infrastructure only. No API changes. |
| T-096 (Design: Calendar + Notes spec) | Design spec only. Unblocks T-103. |
| T-097 (FE: +X more popover fix) | Frontend-only visual bug fix. No API changes. |
| T-099 (FE: Section reorder) | Frontend-only layout change. No API changes. |
| T-100 (FE: All-day sort to top) | Frontend-only sort change. No API changes. |
| T-101 (FE: Calendar checkout/arrival time display) | Frontend-only calendar chip enhancement. Uses existing sub-resource data already returned by API. |
| T-104 (FE: Trip notes frontend) | Frontend-only. Consumes T-103 updated API contracts above. |
| T-105 (QA: Security checklist) | QA review only. |
| T-106 (QA: Integration testing) | QA testing only. |
| T-107 (Deploy: Staging re-deploy) | Deploy scope. Migration 010 must be applied. |
| T-108 (Monitor: Health check) | Monitor scope. |
| T-109 (User Agent: Sprint 7 walkthrough) | User testing only. |

---

*Sprint 7 contracts above are Agreed and pre-approved for implementation. Two backend changes this sprint: (1) T-098 fixes the UTC timestamp serialization bug in stays endpoints — no API signature change, implementation-only fix at the pg driver level. (2) T-103 adds the `notes` field to all three trips endpoints (GET list, GET single, PATCH) backed by migration 010 (pre-approved by Manager). The `notes` field is nullable, max 2000 chars, and follows PATCH semantics (optional field). Frontend Engineer and QA Engineer should reference this contract for integration and testing.*

---

## Sprint 8 Contracts

**Backend Engineer Contract Review — Sprint 8 (2026-02-27)**

After reviewing the full Sprint 8 scope in `active-sprint.md` and all assigned tasks in `dev-cycle-tracker.md`, the Backend Engineer has determined that **Sprint 8 requires no new or changed API endpoints**. Both new features (T-113 and T-114) are purely frontend rendering enhancements that consume existing API fields already documented and agreed in prior sprints.

No schema migrations are planned this sprint. Migration 010 (`notes TEXT NULL`) was shipped in Sprint 7 (T-103) and awaits staging deployment via T-107.

---

### Sprint 8 — No New Backend Contracts Required

The following Sprint 8 tasks require **no new or changed API contracts** from the Backend Engineer:

| Task | Reason |
|------|--------|
| T-110 (FE: Fix T-098 UTC test) | Test fix only. No API changes. |
| T-111 (FE: Write T-104 notes tests) | Test authoring only. No API changes. |
| T-112 (Design: Spec 14 — TZ abbreviations + URL links) | Design spec only. Unblocks T-113, T-114. No API changes. |
| T-113 (FE: Timezone abbreviations on detail cards) | Frontend-only rendering enhancement. Uses existing `*_at` + `*_tz` fields already returned by Flights, Stays, and Land Travels APIs. See field reference below. |
| T-114 (FE: Activity location clickable URL) | Frontend-only rendering enhancement. Uses existing `location` field already returned by Activities API. See field reference below. |
| T-105 (QA: Sprint 7 security checklist) | QA audit only. No API changes. |
| T-106 (QA: Sprint 7 integration testing) | QA testing only. No API changes. |
| T-107 (Deploy: Staging re-deploy Sprint 7) | Deploy scope. Migration 010 must be applied. No new migrations. |
| T-108 (Monitor: Sprint 7 health check) | Monitor scope. No API changes. |
| T-109 (User Agent: Sprint 7 walkthrough) | User testing only. No API changes. |
| T-094 (User Agent: Sprint 6 carry-over walkthrough) | User testing only. No API changes. |
| T-115 (QA: Playwright E2E expansion) | Test authoring only. No API changes. |
| T-116 (QA: Sprint 8 security + code review) | QA audit only. No API changes. |
| T-117 (QA: Sprint 8 integration testing) | QA testing only. No API changes. |
| T-118 (Deploy: Staging re-deploy Sprint 8) | Deploy scope only. No new migrations. |
| T-119 (Monitor: Sprint 8 health check) | Monitor scope. No API changes. |
| T-120 (User Agent: Sprint 8 walkthrough) | User testing only. No API changes. |

---

### Existing API Fields Reference for Sprint 8 Frontend Features

The following is a summary of **existing, already-implemented API fields** that T-113 and T-114 will consume. These are not new — they were agreed in Sprints 1 and 6 respectively. This reference is provided as a convenience so the Frontend Engineer does not need to search prior contract sections.

---

#### T-113 — Timezone Abbreviation Display: Existing Fields Used

**Purpose:** The Frontend Engineer will use `Intl.DateTimeFormat` with `{ timeZoneName: 'short' }` to derive a DST-aware timezone abbreviation (e.g., `"EDT"`, `"JST"`, `"CEST"`) from each card's UTC timestamp + IANA timezone string pair. No backend changes are required.

##### Flights (existing, Sprint 1 — T-006)

Endpoint: `GET /api/v1/trips/:tripId/flights` and `GET /api/v1/trips/:tripId/flights/:id`

Relevant fields already returned:

| Field | Type | Description |
|-------|------|-------------|
| `departure_at` | ISO 8601 UTC string | Departure datetime in UTC. Example: `"2026-08-07T10:00:00.000Z"` |
| `departure_tz` | IANA timezone string | Departure timezone. Example: `"America/New_York"` |
| `arrival_at` | ISO 8601 UTC string | Arrival datetime in UTC. Example: `"2026-08-08T00:00:00.000Z"` |
| `arrival_tz` | IANA timezone string | Arrival timezone. Example: `"Asia/Tokyo"` |

**Frontend usage for T-113:**
```
// Derive "EDT" from departure_at + departure_tz:
const abbr = new Intl.DateTimeFormat('en-US', {
  timeZone: departure_tz,
  timeZoneName: 'short'
}).formatToParts(new Date(departure_at))
  .find(p => p.type === 'timeZoneName')?.value ?? departure_tz;
// Result: "EDT" (America/New_York, August) or "EST" (January)
```

Fallback: if `Intl.DateTimeFormat` throws (unsupported timezone), display the IANA string (`departure_tz`) in muted text.

##### Stays (existing, Sprint 1 — T-006; bug-fixed UTC serialization in Sprint 7 — T-098)

Endpoint: `GET /api/v1/trips/:tripId/stays` and `GET /api/v1/trips/:tripId/stays/:id`

Relevant fields already returned:

| Field | Type | Description |
|-------|------|-------------|
| `check_in_at` | ISO 8601 UTC string | Check-in datetime in UTC. Example: `"2026-08-07T20:00:00.000Z"` |
| `check_in_tz` | IANA timezone string | Check-in timezone. Example: `"America/New_York"` |
| `check_out_at` | ISO 8601 UTC string | Check-out datetime in UTC. Example: `"2026-08-14T20:00:00.000Z"` |
| `check_out_tz` | IANA timezone string | Check-out timezone. Example: `"America/New_York"` |

**Important:** T-098 (Sprint 7) fixed the UTC serialization bug — `check_in_at` and `check_out_at` are now returned as correct UTC ISO strings (no unwanted UTC offset applied on read). This fix is a prerequisite for T-113 timezone abbreviation accuracy on stay cards.

##### Land Travels (existing, Sprint 6 — T-086)

Endpoint: `GET /api/v1/trips/:tripId/land-travel` and `GET /api/v1/trips/:tripId/land-travel/:id`

Relevant fields already returned:

| Field | Type | Description |
|-------|------|-------------|
| `departure_at` | ISO 8601 UTC string | Departure datetime in UTC. Example: `"2026-01-15T10:00:00.000Z"` |
| `departure_tz` | IANA timezone string | Departure timezone. Example: `"Europe/London"` |
| `arrival_at` | ISO 8601 UTC string | Arrival datetime in UTC. Example: `"2026-01-15T13:30:00.000Z"` |
| `arrival_tz` | IANA timezone string | Arrival timezone. Example: `"Europe/Paris"` |

**Frontend usage for T-113:** Same `Intl.DateTimeFormat` pattern as flights above. `"Europe/London"` in January → `"GMT"`. `"Europe/Paris"` in July → `"CEST"`.

---

#### T-114 — Activity Location Clickable URL: Existing Field Used

**Purpose:** The Frontend Engineer will parse the `location` string using a URL-detection regex and render detected http/https URLs as `<a>` elements with `target="_blank" rel="noopener noreferrer"`. Non-http/https schemes (e.g., `javascript:`, `data:`, `vbscript:`) must never be rendered as links. No backend changes are required — validation and sanitization happens entirely at the frontend rendering layer.

##### Activities (existing, Sprint 1 — T-006)

Endpoint: `GET /api/v1/trips/:tripId/activities` and `GET /api/v1/trips/:tripId/activities/:id`

Relevant field already returned:

| Field | Type | Description |
|-------|------|-------------|
| `location` | string \| null | Optional freeform location string. May contain plain text, an address, a URL, or a combination. Example: `"Lunch at https://www.yelp.com/biz/xyz"`, `"Golden Gate Park"`, `null` |

**Frontend rendering contract for T-114:**

| Input | Expected Render |
|-------|----------------|
| `null` or `""` | Render nothing (no location row) |
| `"Golden Gate Park"` | Plain text only — no `<a>` element |
| `"https://www.yelp.com/biz/xyz"` | Single `<a href="https://..." target="_blank" rel="noopener noreferrer">` |
| `"Lunch at https://www.yelp.com/biz/xyz"` | `"Lunch at "` as plain text + URL as `<a>` |
| `"javascript:alert(1)"` | Plain text only — scheme is not http/https, do NOT linkify |
| `"data:text/html,<h1>XSS</h1>"` | Plain text only — scheme not allowed |
| Multiple URLs in one string | Each http/https URL becomes its own `<a>` element; text segments remain plain |

**Regex pattern (reference only — Frontend Engineer implements):**
```
/(https?:\/\/[^\s]+)/g
```

**Security note:** The backend stores and returns `location` verbatim — no server-side URL validation is applied on this field (it is optional, freeform text). XSS protection relies on React's default escaping (do NOT use `dangerouslySetInnerHTML`). The Frontend Engineer must split the string into text/url tokens and render each as a React element, never as raw HTML.

---

### Sprint 8 — Confirmed: No Schema Changes

Per the Manager pre-approval note in `active-sprint.md`:

> **Manager Pre-Approved Schema Change:** None new this sprint. Migration 010 (trip notes `TEXT NULL`) was pre-approved in Sprint 7 and will be applied in T-107.

The Backend Engineer confirms no new database migrations are required for Sprint 8. The existing schema (migrations 001–010) fully supports both new frontend features:
- T-113 timezone abbreviations use existing `*_at` (UTC timestamp) and `*_tz` (IANA string) columns already present in `flights`, `stays`, and `land_travels`
- T-114 activity URL links use the existing `location TEXT NULL` column in `activities`

*Sprint 8 contract review complete — 2026-02-27. Backend Engineer: no implementation work this sprint. All Sprint 8 features are frontend-only. Existing API contracts (Sprint 1 and Sprint 6) are Agreed and sufficient. Frontend Engineer and QA Engineer should reference this section alongside the original Sprint 1 T-006 and Sprint 6 land travels contracts for integration and testing.*

---

## Sprint 9 Contracts

**Backend Engineer Contract Review — Sprint 9 (2026-02-27)**

Sprint 9 is a **pipeline-only sprint** per `active-sprint.md`. There are zero new backend implementation tasks. The Backend Engineer is on standby for hotfixes (H-XXX) only, which will be scoped here if T-094, T-109, or T-120 User Agent walkthroughs surface Critical or Major bugs. No hotfixes have been created at sprint start.

This section serves two purposes:
1. **Confirm** no new or changed endpoints are needed for any Sprint 9 task
2. **Correct** a documentation error in the Sprint 7 T-103 `notes` field contract (flagged by T-116 QA audit)

---

### Sprint 9 — No New API Endpoints

All Sprint 9 tasks are pipeline work (deploys, health checks, QA audits, E2E test expansion, User Agent walkthroughs). No task requires a new or changed API endpoint:

| Task | Reason — No API Contract Change |
|------|--------------------------------|
| T-094 (User Agent: Sprint 6 walkthrough) | User testing only. No API changes. |
| T-107 (Deploy: Sprint 7 staging re-deploy) | Deploy scope. Applies existing migration 010. No new API changes. |
| T-108 (Monitor: Sprint 7 health check) | Monitor scope. No API changes. |
| T-109 (User Agent: Sprint 7 walkthrough) | User testing only. No API changes. |
| T-115 (QA: Playwright E2E expansion 4→7) | Test authoring only. Tests existing endpoints. No API changes. |
| T-116 (QA: Sprint 8 security + code review) | QA audit only. Flagged the `notes` field documentation error — corrected below. |
| T-117 (QA: Sprint 8 integration testing) | QA testing only. No API changes. |
| T-118 (Deploy: Sprint 8 frontend rebuild) | Deploy scope only. No new migrations. No API changes. |
| T-119 (Monitor: Sprint 8 health check) | Monitor scope. No API changes. |
| T-120 (User Agent: Sprint 8 walkthrough) | User testing only. No API changes. |
| H-XXX (Hotfix, if needed) | If created: will be scoped here at that time. Not currently needed. |

---

### Sprint 9 — Documentation Correction: `notes` Field `""` → `null` Normalization

**Flagged by:** T-116 (QA: Sprint 8 security + code review)
**Correction date:** 2026-02-27
**Contract sections affected:** `PATCH /api/v1/trips/:id` (T-103, Sprint 7), `GET /api/v1/trips` (T-103, Sprint 7)

#### What Was Wrong

The Sprint 7 T-103 contract contained three documentation statements that incorrectly described how empty-string (`""`) notes values are handled:

1. **`GET /api/v1/trips` — `notes` field note (line ~3453):**
   > "Empty string `""` is treated as `null` at the display layer (frontend) — the API may return `""` or `null` when notes are cleared; frontend treats both as 'no notes'"

2. **`PATCH /api/v1/trips/:id` — Field Validation Table (line ~3534):**
   > "Empty string `""` is accepted and stored as-is (equivalent to null at the display layer)."

3. **`PATCH /api/v1/trips/:id` — Notes section (line ~3584):**
   > "Sending `{ "notes": "" }` stores an empty string in the DB (treated as 'no notes' in the frontend display layer)."

**The problem:** These statements described `""` normalization as a **frontend display concern** and implied the API might store `""` in the database. This is incorrect. The normalization belongs at the **API layer** — the backend must normalize `""` to `null` before writing to the database and must never return `""` from the GET endpoints.

#### Corrected Behavior (Authoritative from Sprint 9 Forward)

**Rule:** The API normalizes empty string (`""`) to `null` at the input boundary. The database column `notes TEXT NULL` only ever holds `null` or a non-empty string. The API response only ever returns `null` or a non-empty string for the `notes` field. The frontend does **not** need to treat `""` and `null` as equivalent — the API guarantees `notes` is always `null | non-empty string`.

---

#### Corrected: `PATCH /api/v1/trips/:id` — `notes` Field Validation Rule

**Replaces** the Sprint 7 T-103 field validation table entry for `notes`.

| Field | Rules |
|-------|-------|
| `notes` | String or null. If string: max length 2000 characters (whitespace preserved — no trimming). If string is empty (`""`): **normalized to `null` at the API layer — stored as NULL in the database**. If null: clears the notes field (sets DB column to NULL). |

**Corrected behavior table:**

| Request value | API action | DB stored | Response value |
|---------------|-----------|-----------|----------------|
| `"My notes text"` | Store as-is | `"My notes text"` | `"My notes text"` |
| `""` (empty string) | Normalize to null | `NULL` | `null` |
| `null` | Clear field | `NULL` | `null` |
| *(field omitted)* | No change | *(unchanged)* | *(current value)* |

**Corrected Notes section (replaces Sprint 7 bullets):**
- Sending `{ "notes": null }` explicitly clears the notes field (sets DB column to NULL). Response returns `"notes": null`.
- Sending `{ "notes": "" }` is **normalized by the API to null** — stored as NULL in DB, response returns `"notes": null`. The frontend does not need special-case handling for `""`.
- Sending `{ "notes": "text" }` stores the non-empty string. Response returns `"notes": "text"`.
- `notes` participates in the existing `NO_UPDATABLE_FIELDS` check — if the ONLY field sent is `notes`, it is a valid update (not a `NO_UPDATABLE_FIELDS` error) because `notes` is an accepted updatable field.
- `updated_at` is bumped on every successful PATCH that includes `notes` (including `""` → null normalization).

---

#### Corrected: `GET /api/v1/trips` and `GET /api/v1/trips/:id` — `notes` Field Contract

**Replaces** the Sprint 7 T-103 `notes` field description in both GET endpoints.

**`notes` field (all GET trip endpoints):**
- Type: `string | null`
- `null` when no notes have been set, or when notes were cleared (including via `""` input)
- Non-null, non-empty string (1–2000 chars) when notes exist
- The API **never** returns `""` for the `notes` field — only `null` or a non-empty string

**Frontend integration note:** Frontend components rendering `notes` should check `if (notes)` (falsy check) — both `null` and an empty string (which the API now guarantees won't appear) are handled correctly this way. No special `notes === ""` branch is needed.

---

#### Corrected: Test Plan Entries for T-103

The following test plan entries from Sprint 7 T-103 are **amended** (additions in bold):

**Happy paths (corrected):**
- `PATCH /trips/:id` with `{ "notes": "My Tokyo trip notes" }` → 200, response includes `"notes": "My Tokyo trip notes"`
- `PATCH /trips/:id` with `{ "notes": null }` → 200, response includes `"notes": null`
- ~~`PATCH /trips/:id` with `{ "notes": "" }` → 200, response includes `"notes": ""`~~ **CORRECTED:** `PATCH /trips/:id` with `{ "notes": "" }` → 200, **response includes `"notes": null`** (empty string normalized to null at API layer)
- `GET /trips` after notes are cleared via `""` → `"notes": null` in response *(not `""`)* **[NEW]**
- `GET /trips/:id` after notes cleared via `""` → `"notes": null` *(not `""`)* **[NEW]**

**Invariant (must always hold):**
- The API never returns `"notes": ""` — only `null` or a non-empty string

---

#### Migration Impact

No migration changes required. The `notes TEXT NULL` column (migration 010) already allows NULL, which is the normalized storage value for both `null` and `""` inputs. The normalization is applied at the application validation layer in `backend/src/models/tripModel.js` (or the route handler), not at the DB schema level.

---

### Sprint 9 — No Schema Changes

No new database migrations are introduced in Sprint 9. The outstanding pending migration is still migration 010 (`notes TEXT NULL`) from Sprint 7, which will be applied by the Deploy Engineer as part of T-107.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 010 | 7 | Add `notes TEXT NULL` to `trips` | Pending staging deploy (T-107) — pre-approved |
| — | 9 | *(No new migrations)* | Sprint 9 is pipeline-only |

---

*Sprint 9 contract review complete — 2026-02-27. Backend Engineer: no new endpoints or schema changes this sprint. One documentation correction applied to the Sprint 7 T-103 `notes` field contract: empty string `""` is now documented as API-layer normalized to `null` (not a frontend display concern). This correction has no impact on already-deployed behavior since migration 010 has not yet reached staging — T-107 will apply it fresh with the correct normalization semantics. Frontend Engineer: update your `notes` handling to rely on the API guarantee (never returns `""`). QA Engineer: update T-103 test plan line for `{ "notes": "" }` — expect `"notes": null` in response, not `"notes": ""`.*

---

## Sprint 10 Contracts

**Date:** 2026-03-04
**Reviewed by:** Backend Engineer
**Sprint Goal:** Pipeline closure — execute T-094/T-108 → T-109 → T-115 → T-116 → T-117 → T-118 → T-119 → T-120 → feedback triage → Sprint 11 plan. Phase 5 (T-121/T-122 trip export/print) contingent on clean pipeline closure.

---

### Sprint 10 — No New API Endpoints

All Sprint 10 tasks are either pipeline work (User Agent walkthroughs, QA E2E verification, Monitor health checks, staging deploy) or a purely frontend feature (trip print/export). No new or changed API endpoints are needed this sprint.

| Task | Reason — No API Contract Change |
|------|--------------------------------|
| T-094 (User Agent: Sprint 6 walkthrough — 5th carry-over) | User testing only. No API changes. |
| T-108 (Monitor: Sprint 7 health check) | Monitor scope. No API changes. |
| T-109 (User Agent: Sprint 7 walkthrough) | User testing only. No API changes. |
| T-115 (QA: Playwright E2E expansion 4→7 tests) | Test authoring only. Tests existing endpoints. No API changes. |
| T-116 (QA: Sprint 8 staging E2E verification) | QA audit only. Existing contracts in use. No API changes. |
| T-117 (QA: Sprint 8 staging integration check) | QA testing only. No API changes. |
| T-118 (Deploy: Sprint 8 frontend rebuild + staging re-deploy) | Deploy scope only. No new migrations. No API changes. |
| T-119 (Monitor: Sprint 8 health check) | Monitor scope. No API changes. |
| T-120 (User Agent: Sprint 8 walkthrough) | User testing only. No API changes. |
| T-121 (Design: trip export/print spec — Phase 5, contingent) | Design spec authoring only. UI spec Spec 15 explicitly confirms: "No backend changes required." No API changes. |
| T-122 (Frontend: trip print implementation — Phase 5, contingent) | `window.print()` invocation — 100% frontend-only. UI spec Spec 15 confirms: "No new routes. No new API calls. No migration." No API changes. |

---

### Sprint 10 — Trip Export/Print Feature (T-121/T-122): Backend Confirmation

**Feature:** "Print trip itinerary" — adds a Print button to TripDetailsPage that calls `window.print()`. The browser's native print dialog renders all trip data from the already-loaded page state using `@media print` CSS rules.

**Backend impact:** **Zero.** This feature requires no new API endpoints, no changes to existing endpoints, no schema migrations, and no backend code changes of any kind.

**Rationale:** All data needed for the print view (trip name, destinations, date range, notes, flights, land travels, stays, activities) is already fetched by the existing TripDetailsPage data-loading hooks. `window.print()` captures the current DOM — no additional server requests are made at print time.

**Authoritative reference:** UI spec Spec 15, Section 15.12 (Files to Create/Modify): "No backend changes required."

---

### Sprint 10 — Existing Contracts Remain Authoritative

All contracts from Sprints 1–9 remain in force and unchanged. The following table summarises the current authoritative state of all endpoint groups:

| Sprint | Endpoint Group | Contract Status | Key Notes |
|--------|---------------|----------------|-----------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Search/filter/sort added Sprint 5. `notes` field added Sprint 7 (migration 010 ✅ on staging). `notes` is always `null \| non-empty string` — never `""` (Sprint 9 correction). |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` field added Sprint 7. |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` updatable field added Sprint 7. `""` input normalized to `null` at API layer (Sprint 9 correction). |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | `departure_tz` + `arrival_tz` fields present and returned (used by T-113 timezone abbreviation display). |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | `check_in_tz` + `check_out_tz` fields present and returned (used by T-113 timezone abbreviation display). |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | `location TEXT NULL` field present (used by T-114 URL linkification). `start_time` + `end_time` nullable since Sprint 3 (migration 008). |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |

**Schema state on staging (as of T-107 deployment, 2026-02-28):** All 10 migrations applied (001–010). Database is current. No pending migrations for Sprint 10.

---

### Sprint 10 — Hotfix Standby Protocol

**Trigger:** If User Agent walkthroughs T-094, T-109, or T-120 reveal a **Critical or Major bug**, the Manager Agent will immediately create an H-XXX hotfix task. The Backend Engineer is on standby to respond.

**Backend Engineer hotfix protocol:**
1. Read the H-XXX task definition created by Manager in `dev-cycle-tracker.md`
2. If the hotfix requires a **new or changed endpoint:** document the new/changed contract here (under a `Sprint 10 — Hotfix H-XXX` subsection) before writing any code
3. If the hotfix requires a **schema change:** propose the migration in `technical-context.md` and log a handoff to Manager for approval before implementing
4. If the hotfix requires **only code changes to existing endpoints** (no schema, no contract change): implement immediately and log the fix in `handoff-log.md`
5. All hotfix implementations must include tests, pass the security checklist, and be logged to `handoff-log.md` for QA and Deploy

**Current status (Sprint 10 start — 2026-03-04):** No H-XXX tasks exist. All three walkthroughs (T-094, T-109, T-120) are pending. Backend Engineer is monitoring.

---

### Sprint 10 — No Schema Changes

No new database migrations are introduced in Sprint 10. The schema is current and complete for all Sprint 10 features.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging (2026-02-28, T-107) |
| — | 8 | *(No new migrations)* | Sprint 8 features (timezone abbreviations, URL links) are frontend-only |
| — | 9 | *(No new migrations)* | Sprint 9 is pipeline-only |
| — | 10 | *(No new migrations)* | Sprint 10 is pipeline-only + frontend-only print (T-122) |

The `land_travels` table (migration 009, Sprint 6) is confirmed applied on staging (T-107 deployment report, 2026-02-28). All 10 migrations (001–010) are applied and current.

---

*Sprint 10 contract review complete — 2026-03-04. Backend Engineer: no new endpoints or schema changes this sprint. Trip print/export (T-121/T-122) is confirmed frontend-only with zero backend impact. All existing contracts (Sprints 1–9) remain authoritative and unchanged. Backend Engineer on hotfix standby — if H-XXX tasks are created by Manager following T-094/T-109/T-120 walkthroughs, contract updates will be documented here immediately before any implementation begins.*

---

## Sprint 11 Contracts

**Date:** 2026-03-04
**Reviewed by:** Backend Engineer (BE-S11)
**Sprint Goal:** Pipeline closure — execute the full validation backlog: T-108 (Monitor Sprint 7+T-122 health) → T-094 (User Agent Sprint 6 walkthrough — 6th carry-over, P0 HARD-BLOCK) → T-109 (Sprint 7 walkthrough) → T-115 (Playwright 4→7) → T-116/T-117 (Sprint 8 QA staging E2E) → T-118 (Sprint 8 deploy) → T-119 (Monitor Sprint 8 health) → T-120 (Sprint 8 walkthrough) → T-123 (Sprint 10 walkthrough) → feedback triage → Sprint 12 plan. T-124 (Deploy hosting research) runs in parallel after T-108. **No new implementation tasks this sprint.**

---

### Sprint 11 — No New API Endpoints

Sprint 11 is an absolute pipeline-closure sprint. The Pipeline-Only Rule prohibits all new backend (and frontend) implementation until T-120 AND T-123 both complete and all feedback is triaged. No new or changed API endpoints are needed this sprint.

| Task | Agent | Reason — No API Contract Change |
|------|-------|--------------------------------|
| T-108 | Monitor Agent | Health check only. No API changes. |
| T-094 | User Agent | Sprint 6 feature walkthrough. User testing only. No API changes. |
| T-109 | User Agent | Sprint 7 feature walkthrough. User testing only. No API changes. |
| T-115 | QA Engineer | Playwright E2E test expansion (4→7 tests). Test authoring only. Exercises existing endpoints. No API changes. |
| T-116 | QA Engineer | Sprint 8 staging E2E verification. QA audit only. No API changes. |
| T-117 | QA Engineer | Sprint 8 staging integration check. QA testing only. No API changes. |
| T-118 | Deploy Engineer | Sprint 8 frontend rebuild + staging re-deploy. Deploy scope only. No new migrations. No API changes. |
| T-119 | Monitor Agent | Sprint 8 staging health check. Monitor scope. No API changes. |
| T-120 | User Agent | Sprint 8 feature walkthrough. User testing only. No API changes. |
| T-123 | User Agent | Sprint 10 feature walkthrough (print/export). T-122 confirmed frontend-only in Sprint 10 — zero backend impact. No API changes. |
| T-124 | Deploy Engineer | Hosting provider research spike. Documentation only — no code changes, no deployments, no API changes. |
| BE-S11 | Backend Engineer | Test suite verification + hotfix standby. No new endpoints or schema changes unless H-XXX tasks are triggered. |

---

### Sprint 11 — Existing Contracts Remain Authoritative

All contracts from Sprints 1–10 remain in force and unchanged. The complete authoritative state of all endpoint groups:

| Sprint | Endpoint Group | Contract Status | Key Notes |
|--------|---------------|----------------|-----------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Search/filter/sort added Sprint 5. `notes` field added Sprint 7 (migration 010 ✅). `notes` is always `null \| non-empty string` — never `""` (Sprint 9 correction). |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` field present; returns `null` if unset. |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` updatable; `""` input normalized to `null` at API layer (Sprint 9 correction). |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | `departure_tz` + `arrival_tz` fields present; used by T-113 timezone abbreviation display. |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | `check_in_tz` + `check_out_tz` fields present; used by T-113 timezone abbreviation display. |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | `location TEXT NULL` present (T-114 URL linkification). `start_time`/`end_time` nullable since Sprint 3 (migration 008). `ORDER BY activity_date ASC, start_time ASC NULLS LAST, name ASC`. |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |

**Schema state on staging (as of T-107 deployment, 2026-02-28 + T-122 deployment, 2026-03-04):** All 10 migrations applied (001–010). Database is current. No pending migrations for Sprint 11.

**Sprint 9 correction still in force:** `notes` field on trips resource is always returned as `null` (when unset) or a non-empty string. It is **never** returned as `""`. Any PATCH with `notes: ""` normalizes to `null` at the API validation layer. This is documented in the Sprint 9 contracts section and remains the authoritative behaviour.

---

### Sprint 11 — No Schema Changes

No new database migrations are introduced in Sprint 11. The schema is current and complete for all implemented features through Sprint 10.

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
| — | 8 | *(No new migrations)* | Sprint 8 features are frontend-only |
| — | 9 | *(No new migrations)* | Sprint 9 is pipeline-only |
| — | 10 | *(No new migrations)* | Sprint 10 is pipeline-only + frontend-only print (T-122) |
| — | **11** | *(No new migrations)* | **Sprint 11 is pipeline-only. Schema is complete and current.** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

---

### Sprint 11 — Hotfix Standby Protocol

**Trigger:** If User Agent walkthroughs T-094, T-109, T-120, or T-123 reveal a **Critical or Major backend bug**, the Manager Agent will immediately create an H-XXX hotfix task. The Backend Engineer is on standby to respond.

**Hotfix classification (backend relevance):**

| Severity | Examples | Backend Engineer Action |
|----------|----------|------------------------|
| **Critical** | Data loss, auth bypass, crash on core endpoint, incorrect data returned | Respond immediately. Document contract change (if any) here first, then implement. |
| **Major** | Wrong response shape, missing field, validation gap causing data corruption | Respond within the same sprint phase. Document contract change (if any) here first, then implement. |
| **Minor / Suggestion** | UI text, minor display quirk, non-data-impacting UX issue | Log to Sprint 12 backlog. No Backend Engineer action this sprint. |

**Backend Engineer hotfix protocol (Sprint 11):**
1. Read the H-XXX task definition created by Manager in `dev-cycle-tracker.md`
2. If the hotfix requires a **new or changed endpoint:** document the new/changed contract here under a `Sprint 11 — Hotfix H-XXX` subsection **before** writing any code
3. If the hotfix requires a **schema change:** propose the migration in `technical-context.md`, log a handoff to Manager for approval, wait for approval note before implementing
4. If the hotfix requires **only code changes to existing endpoints** (no schema, no contract change): implement immediately, self-check against `security-checklist.md`, write tests, log the fix in `handoff-log.md` for QA and Deploy
5. Commit message must reference the H-XXX task ID

**Current status (Sprint 11 start — 2026-03-04):** No H-XXX tasks exist. T-094, T-109, T-120, and T-123 walkthroughs are all pending. Backend Engineer is monitoring.

---

### Sprint 11 — API Contract Documentation Correction Audit

As part of BE-S11, the Backend Engineer has reviewed all existing contract documentation for correctness. **No corrections are needed** beyond those already applied in Sprint 9 (the `notes: "" → null` normalization note). All endpoint descriptions, field types, validation rules, and response shapes in Sprints 1–10 remain accurate and match the deployed implementation.

**Specific items verified:**
- Sprint 9 correction (`notes` empty string → `null`) is clearly documented in the Sprint 9 section and the Sprint 10 summary table. ✅
- `departure_tz` / `arrival_tz` fields are documented on flight contracts (Sprint 1 section) and confirmed present in staging responses. ✅
- `check_in_tz` / `check_out_tz` fields are documented on stays contracts and confirmed present in staging responses. ✅
- `location TEXT NULL` on activities is documented; URL linkification is frontend-only (T-114) — no API contract change needed. ✅
- `notes TEXT NULL` on trips is documented across Sprint 7, Sprint 9, and Sprint 10 sections. ✅
- `land_travels` CRUD contracts (Sprint 6 section) match the deployed implementation. ✅
- All error response shapes follow the `{ "error": { "message": "...", "code": "..." } }` convention. ✅
- All success response shapes follow the `{ "data": <payload> }` convention. ✅
- Pagination shape (`{ "data": [...], "pagination": { "page", "limit", "total" } }`) is consistent across all list endpoints. ✅

---

*Sprint 11 contract review complete — 2026-03-04. Backend Engineer (BE-S11): no new endpoints or schema changes this sprint. Sprint 11 is an absolute pipeline-closure sprint — all features through Sprint 10 are implemented, QA-approved, and deployed on staging. The Backend Engineer is on hotfix standby only. If H-XXX tasks are created by Manager following T-094, T-109, T-120, or T-123 walkthroughs, contract updates will be documented here immediately under a `Sprint 11 — Hotfix H-XXX` subsection before any implementation begins. All existing contracts (Sprints 1–10) remain authoritative and unchanged.*

---

## Sprint 12 Contracts

**Date:** 2026-03-06
**Reviewed by:** Backend Engineer
**Sprint Goal:** Four targeted UX/infrastructure fixes (FB-085–FB-088): `.env` staging isolation (T-125), DayPopover scroll anchoring (T-126), check-in chip label (T-127), calendar default month (T-128). No new features. Clean QA/deploy/monitor/user-agent cycle.

---

### Sprint 12 — No New API Endpoints

Sprint 12 contains zero backend changes. All four in-scope tasks are either purely frontend component fixes (T-126, T-127, T-128) or a deploy/infrastructure fix (T-125 — `.env` file isolation). No new or changed API endpoints are required.

| Task | Agent | Reason — No API Contract Change |
|------|-------|--------------------------------|
| T-125 | Deploy Engineer | `.env` staging isolation — file system / deploy script change only. No route, model, or response shape changes. |
| T-126 | Frontend Engineer | DayPopover scroll-close fix — `window.addEventListener` in a React `useEffect`. Pure frontend component change. No API calls added or modified. |
| T-127 | Frontend Engineer | Check-in chip label — prepend `"check-in "` to the time string in the calendar chip builder. Pure render change. No API calls added or modified. |
| T-128 | Frontend Engineer | Calendar default month — compute earliest event date from already-loaded `flights`, `stays`, and `activities` arrays (data already in-memory from existing API calls). No new API calls; no changes to existing endpoints. |

---

### Sprint 12 — Existing Contracts Remain Authoritative

All contracts from Sprints 1–11 remain in force and unchanged. The complete authoritative state of all endpoint groups:

| Sprint | Endpoint Group | Contract Status | Key Notes |
|--------|---------------|----------------|-----------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Search/filter/sort added Sprint 5. `notes` field added Sprint 7 (migration 010 ✅). `notes` is always `null \| non-empty string` — never `""` (Sprint 9 correction). |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` field present; returns `null` if unset. |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` updatable; `""` input normalized to `null` at API layer (Sprint 9 correction). |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | `departure_tz` + `arrival_tz` fields present; used by T-113 timezone abbreviation display. Also used by T-128 (calendar default month) — `departure_at` is read client-side from in-memory state. |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | `check_in_tz` + `check_out_tz` fields present. `check_in_at` (ISO 8601 UTC) used by T-128 (calendar default month) — parsed client-side from in-memory state. |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | `location TEXT NULL` present (T-114). `start_time`/`end_time` nullable since Sprint 3. `activity_date` (YYYY-MM-DD string) used by T-128 (calendar default month) — parsed client-side as local date. |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |

**Schema state on staging (as of T-118/T-122 deployment, 2026-03-04):** All 10 migrations applied (001–010). Database is fully current. No pending migrations.

**Fields consumed by Sprint 12 frontend changes (T-128 — calendar default month):** No new fields. T-128 reads three existing fields from already-loaded in-memory state:
- `flights[].departure_at` — ISO 8601 UTC timestamp; already returned by `GET /api/v1/trips/:id/flights`
- `stays[].check_in_at` — ISO 8601 UTC timestamp; already returned by `GET /api/v1/trips/:id/stays`
- `activities[].activity_date` — YYYY-MM-DD date string; already returned by `GET /api/v1/trips/:id/activities`

No additional fetches, no new query parameters, no response shape changes.

---

### Sprint 12 — No Schema Changes

No new database migrations are introduced in Sprint 12. The schema is complete and current for all implemented features.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–006 | 1 | Core tables (users, refresh_tokens, trips, flights, stays, activities) | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging (T-107, 2026-02-28) |
| — | 8 | *(No new migrations)* | Sprint 8 features are frontend-only |
| — | 9 | *(No new migrations)* | Sprint 9 is pipeline-only |
| — | 10 | *(No new migrations)* | Sprint 10 is pipeline-only + frontend-only print |
| — | 11 | *(No new migrations)* | Sprint 11 is pipeline-only |
| — | **12** | *(No new migrations)* | **Sprint 12 is polish/UX-only. All four tasks are frontend or deploy-config changes. No schema work.** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

---

### Sprint 12 — Hotfix Standby Protocol

**Trigger:** If User Agent walkthrough T-133 reveals a **Critical or Major backend bug**, the Manager Agent will create an H-XXX hotfix task. The Backend Engineer is on standby to respond.

| Severity | Backend Engineer Action |
|----------|------------------------|
| **Critical** | Respond immediately. Document contract change (if any) here under `Sprint 12 — Hotfix H-XXX` first, then implement. |
| **Major** | Respond within the same sprint phase. Document contract change (if any) here first, then implement. |
| **Minor / Suggestion** | Log to Sprint 13 backlog. No Backend Engineer action this sprint. |

**Current status (Sprint 12 start — 2026-03-06):** No H-XXX tasks exist. T-133 walkthrough is pending. Backend Engineer is monitoring. Sprint 11 closed with zero Critical or Major bugs — no outstanding hotfix debt.

---

*Sprint 12 contract review complete — 2026-03-06. Backend Engineer: no new endpoints or schema changes this sprint. Sprint 12 is a focused polish sprint — all four tasks (T-125 deploy config, T-126/T-127/T-128 frontend component fixes) have zero backend impact. T-128 (calendar default month) reads `departure_at`, `check_in_at`, and `activity_date` from already-fetched in-memory data — no new API calls needed. All existing contracts (Sprints 1–11) remain authoritative and unchanged. Backend Engineer on hotfix standby only.*

---

## Sprint 13 — API Contracts

**Date:** 2026-03-07
**Backend Engineer task:** T-139 — Documentation-only fix: correct Land Travel endpoint paths from plural (`/land-travels`) to singular (`/land-travel`) throughout this file.

### T-139 — Land Travel Path Correction (Documentation Only)

**Problem (FB-090):** All Land Travel endpoint rows in the sprint contract summary tables incorrectly used the plural path `/land-travels`. The actual backend route is mounted at the singular path `/land-travel` (confirmed in `backend/src/app.js` line 43: `app.use('/api/v1/trips/:tripId/land-travel', landTravelRoutes)`). The detailed Sprint 6 endpoint specs (Section "Sprint 6 — Land Travel") were already correct; only the consolidated summary tables were wrong.

**Fix applied (T-139):** All occurrences of `/land-travels` corrected to `/land-travel` in this file. No code, schema, or behaviour changes — documentation only.

**Corrected endpoint paths (authoritative — match backend/src/app.js mount):**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/trips/:tripId/land-travel` | Bearer token | List all land travel entries for a trip |
| POST | `/api/v1/trips/:tripId/land-travel` | Bearer token | Create a new land travel entry |
| GET | `/api/v1/trips/:tripId/land-travel/:ltId` | Bearer token | Get a single land travel entry |
| PATCH | `/api/v1/trips/:tripId/land-travel/:ltId` | Bearer token | Update a land travel entry |
| DELETE | `/api/v1/trips/:tripId/land-travel/:ltId` | Bearer token | Delete a land travel entry |

Full request/response schemas and error cases remain as documented in the Sprint 6 section above. No changes to request bodies, response shapes, auth requirements, or error codes.

### Sprint 13 — No Schema Changes

No new database migrations are introduced in Sprint 13. The schema is complete and current.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–010 | 1–10 | All previously applied migrations | ✅ Applied on Staging |
| — | **13** | *(No new migrations)* | **Sprint 13 is pipeline closure + UX polish + documentation fix. Zero schema work.** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

### Sprint 13 — Hotfix Standby Protocol

**Trigger:** If User Agent walkthroughs T-136 or T-144 reveal a **Critical or Major backend bug**, the Manager Agent will create an H-XXX hotfix task. The Backend Engineer is on standby to respond.

| Severity | Backend Engineer Action |
|----------|------------------------|
| **Critical** | Respond immediately. Document contract change (if any) here under `Sprint 13 — Hotfix H-XXX` first, then implement. |
| **Major** | Respond within the same sprint phase. Document contract change (if any) here first, then implement. |
| **Minor / Suggestion** | Log to Sprint 14 backlog. No Backend Engineer action this sprint. |

**Current status (Sprint 13 start — 2026-03-07):** No H-XXX tasks exist. Backend Engineer is monitoring. Sprint 12 closed with zero Critical or Major bugs — no outstanding hotfix debt.

---

*Sprint 13 contract review complete — 2026-03-07 (T-139). Backend Engineer: no new endpoints or schema changes this sprint. T-139 corrects documentation-only error in Land Travel path (plural → singular) in all summary tables. All existing endpoint contracts (Sprints 1–12) remain authoritative and unchanged. Backend Engineer on hotfix standby only.*

---

## Sprint 14 — API Contracts

**Date:** 2026-03-07
**Reviewed by:** Backend Engineer
**Sprint Goal:** Fix T-128 calendar first-event-month regression (FB-095), add "Today" button to calendar (FB-094), rotate staging JWT_SECRET (FB-093), and complete User Agent comprehensive walkthrough covering Sprints 12–14.

---

### Sprint 14 — No New API Endpoints

Sprint 14 contains zero backend API changes. All in-scope tasks are either purely frontend component changes (T-146, T-147) or a deploy/infrastructure operation (T-145 — JWT_SECRET rotation). The Design Agent's UI spec for this sprint (Specs 21 and 22) explicitly states: *"No new components, no CSS variables, no API changes, no backend changes."* The T-150 deploy task also explicitly notes: *"No new backend migrations (no schema changes)."*

| Task | Agent | Reason — No API Contract Change |
|------|-------|--------------------------------|
| T-145 | Deploy Engineer | JWT_SECRET rotation in `backend/.env.staging` — environment variable change only. No route, model, middleware, or response shape changes. Auth endpoints continue to work identically after the secret is rotated (tokens issued before the rotation are invalidated by design). |
| T-146 | Frontend Engineer | Calendar async first-event-month fix — adds a `useEffect` watching loaded data props and a `hasNavigated` ref inside `TripCalendar.jsx`. All data (`flights`, `stays`, `activities`, `landTravel`) is already fetched from existing endpoints and held in-memory. No new API calls, no new query parameters, no response shape changes. |
| T-147 | Frontend Engineer | "Today" button in TripCalendar header — pure render + state change inside `TripCalendar.jsx`. Calls `setCurrentMonth()` with a computed date value. No API calls of any kind. |

---

### Sprint 14 — Existing Contracts Remain Authoritative

All contracts from Sprints 1–13 remain in force and unchanged. The complete authoritative state of all endpoint groups:

| Sprint | Endpoint Group | Contract Status | Key Notes |
|--------|---------------|----------------|-----------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/health` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Search/filter/sort added Sprint 5. `notes` field added Sprint 7. `notes` is always `null \| non-empty string` (Sprint 9 correction). |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | Destinations deduped case-insensitively (Sprint 4). |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` field present; returns `null` if unset. |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` updatable; `""` normalized to `null` (Sprint 9). |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | `departure_tz` + `arrival_tz` present. `departure_at` read client-side for calendar. |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | `check_in_tz` + `check_out_tz` present. `check_in_at` read client-side for calendar. |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | `activity_date` (YYYY-MM-DD) read client-side for calendar. `start_time`/`end_time` nullable since Sprint 3. |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Singular path confirmed (T-139 Sprint 13 fix). |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |

**Schema state on staging:** All 10 migrations applied (001–010). Database is fully current. No pending migrations for Sprint 14.

**Fields consumed by Sprint 14 frontend changes:** No new fields. T-146 and T-147 operate purely on data already fetched and held in-memory by `useTripDetails.js` from existing endpoints:
- `flights[].departure_at` — already returned by `GET /api/v1/trips/:id/flights`
- `stays[].check_in_at` — already returned by `GET /api/v1/trips/:id/stays`
- `activities[].activity_date` — already returned by `GET /api/v1/trips/:id/activities`
- `landTravel[].departure_date` — already returned by `GET /api/v1/trips/:id/land-travel`

No additional fetches, no new query parameters, no response shape changes.

---

### Sprint 14 — No Schema Changes

No new database migrations are introduced in Sprint 14.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–006 | 1 | Core tables (users, refresh_tokens, trips, flights, stays, activities) | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging (T-107, 2026-02-28) |
| — | 8–13 | *(No new migrations)* | Sprints 8–13 are all schema-stable |
| — | **14** | *(No new migrations)* | **Sprint 14 is frontend-only + security rotation. Zero schema work.** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

---

### Sprint 14 — Hotfix Standby Protocol

**Trigger:** If User Agent walkthrough T-152 reveals a **Critical or Major backend bug**, the Manager Agent will create an H-XXX hotfix task. The Backend Engineer is on standby to respond.

| Severity | Backend Engineer Action |
|----------|------------------------|
| **Critical** | Respond immediately. Document contract change (if any) here under `Sprint 14 — Hotfix H-XXX` first, then implement. |
| **Major** | Respond within the same sprint phase. Document contract change (if any) here first, then implement. |
| **Minor / Suggestion** | Log to Sprint 15 backlog. No Backend Engineer action this sprint. |

**Current status (Sprint 14 start — 2026-03-07):** No H-XXX tasks exist. T-152 User Agent walkthrough is pending. Backend Engineer is monitoring. Sprint 13 closed with zero Critical or Major bugs — no outstanding hotfix debt.

---

*Sprint 14 contract review complete — 2026-03-07. Backend Engineer: no new endpoints or schema changes this sprint. Sprint 14 is a focused regression-fix sprint — T-146 (calendar async timing) and T-147 ("Today" button) are purely frontend component changes that consume data already fetched from existing endpoints. T-145 (JWT_SECRET rotation) is a deploy/security operation with no API surface impact. All existing contracts (Sprints 1–13) remain authoritative and unchanged. Backend Engineer on hotfix standby for T-152 User Agent walkthrough only.*

---

## Sprint 15 Contracts

**Date:** 2026-03-07
**Reviewed by:** Backend Engineer
**Sprint Goal:** Fix browser tab title + favicon (FB-096, FB-097 → T-154), fix calendar land travel chip location display (FB-098 → T-155), add `formatTimezoneAbbr()` unit tests (T-153), and complete User Agent comprehensive walkthroughs (T-152, T-160).

---

### Sprint 15 — No New API Endpoints

Sprint 15 contains zero backend API changes. All in-scope tasks are purely frontend bug fixes or test additions. The active-sprint.md explicitly states: *"Backend Engineer | Standby — no backend tasks this sprint"* and *"No new migrations (no schema changes in Sprint 15)."*

| Task | Agent | Reason — No API Contract Change |
|------|-------|--------------------------------|
| T-154 | Frontend Engineer | Browser title + favicon fix — static HTML change only (`frontend/index.html`). Updates `<title>` text and adds a `<link rel="icon">` tag. No API calls, no data fetching, no component changes. |
| T-155 | Frontend Engineer | Calendar land travel chip location fix — corrects the `_location` field assignment in `buildEventsMap`. The fix reads `from_location` (pick-up) and `to_location` (drop-off) from the land travel records already returned by `GET /api/v1/trips/:id/land-travel`. Both fields are present in all land travel responses since Sprint 6. No new API calls, no new query parameters, no request or response shape changes. |
| T-153 | Frontend Engineer | `formatTimezoneAbbr()` unit tests — test-only task. No production code changes. No API calls. |
| T-152 / T-160 | User Agent | Comprehensive feature walkthroughs — read-only browsing of existing staging app. No API changes. |

---

### Sprint 15 — Field Reference for T-155 (Land Travel Chip Location Fix)

The T-155 bug fix relies entirely on fields **already present** in the existing land travel response shape (established Sprint 6, confirmed applied on staging). No backend changes are needed. This section documents the specific fields the Frontend Engineer must reference when implementing the fix.

**Endpoint:** `GET /api/v1/trips/:tripId/land-travel` (and `GET /api/v1/trips/:tripId/land-travel/:lid`)

**Fields consumed by T-155:**

| Field | Type | Present Since | Usage in T-155 Fix |
|-------|------|--------------|-------------------|
| `from_location` | `string \| null` | Sprint 6 | Displayed on **pick-up / departure day** chip (`_isArrival = false`) |
| `to_location` | `string \| null` | Sprint 6 | Displayed on **drop-off / arrival day** chip (`_isArrival = true`) |

**Correct chip → field mapping (per Design Agent Spec 23):**

| Calendar Day | `_isArrival` | Field to Display | Example |
|---|---|---|---|
| Departure / pick-up day | `false` | `from_location` | `"LAX Airport"` |
| Arrival / drop-off day | `true` | `to_location` | `"SFO Airport"` |
| Same-day travel (departure = arrival) | `false` (pick-up only) | `from_location` | `"LAX Airport"` |

**Null/empty handling:** If `from_location` or `to_location` is `null` or `""`, omit the ` · ` separator — never render the string `"null"` or `"undefined"` to the user.

**No response shape change:** The backend already returns `from_location` and `to_location` on every land travel object. T-155 is a frontend-only fix — it corrects which field is read by `buildEventsMap` when constructing the `_location` property on calendar event objects.

---

### Sprint 15 — Existing Contracts Remain Authoritative

All contracts from Sprints 1–14 remain in force and unchanged. The complete authoritative state of all endpoint groups:

| Sprint | Endpoint Group | Contract Status | Key Notes |
|--------|---------------|----------------|-----------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/health` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Search/filter/sort added Sprint 5. `notes` field added Sprint 7. `notes` is always `null \| non-empty string` (Sprint 9 correction). |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | Destinations deduped case-insensitively (Sprint 4). |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` field present; returns `null` if unset. |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` updatable; `""` normalized to `null` (Sprint 9). |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | `departure_tz` + `arrival_tz` present. `departure_at` read client-side for calendar. |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | `check_in_tz` + `check_out_tz` present. `check_in_at` read client-side for calendar. |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | `activity_date` (YYYY-MM-DD) read client-side for calendar. `start_time`/`end_time` nullable since Sprint 3. |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Singular path confirmed (T-139 Sprint 13 fix). `from_location` + `to_location` consumed by T-155 fix. |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |

**Schema state on staging:** All 10 migrations applied (001–010). Database is fully current. No pending migrations for Sprint 15.

**Fields consumed by Sprint 15 frontend changes:** T-155 reads `from_location` and `to_location` from land travel records already returned by `GET /api/v1/trips/:id/land-travel`. No new fields, no new fetches, no query parameter changes.

---

### Sprint 15 — No Schema Changes

No new database migrations are introduced in Sprint 15.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–006 | 1 | Core tables (users, refresh_tokens, trips, flights, stays, activities) | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging (T-107, 2026-02-28) |
| — | 8–14 | *(No new migrations)* | Sprints 8–14 are all schema-stable |
| — | **15** | *(No new migrations)* | **Sprint 15 is frontend bug fixes only. Zero schema work.** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

---

### Sprint 15 — Hotfix Standby Protocol

**Trigger:** If User Agent walkthroughs (T-152 or T-160) reveal a **Critical or Major backend bug**, the Manager Agent will create an H-XXX hotfix task. The Backend Engineer is on standby.

| Severity | Backend Engineer Action |
|----------|------------------------|
| **Critical** | Respond immediately. Document contract change (if any) here under `Sprint 15 — Hotfix H-XXX` first, then implement. |
| **Major** | Respond within the same sprint phase. Document contract change (if any) here first, then implement. |
| **Minor / Suggestion** | Log to Sprint 16 backlog. No Backend Engineer action this sprint. |

**Current status (Sprint 15 start — 2026-03-07):** No H-XXX tasks exist. T-152 User Agent walkthrough is pending (6th carry-over — circuit-breaker applies). Backend Engineer is monitoring. Sprint 14 closed with zero Critical or Major bugs — no outstanding hotfix debt.

---

*Sprint 15 contract review complete — 2026-03-07. Backend Engineer: no new endpoints or schema changes this sprint. Sprint 15 is a focused frontend bug-fix sprint — T-154 (browser title + favicon) is a static HTML change, T-155 (land travel chip location) is a frontend-only fix consuming `from_location`/`to_location` fields already present in existing land travel API responses since Sprint 6, and T-153 (formatTimezoneAbbr unit tests) adds tests with zero production code changes. All existing contracts (Sprints 1–14) remain authoritative and unchanged. Backend Engineer on hotfix standby for T-152 and T-160 User Agent walkthroughs only.*

---

## Sprint 16 Contracts

---

### T-162 — Trip Date Range (Computed `start_date` / `end_date`)

**Sprint:** 16
**Task:** T-162
**Status:** Agreed (Manager auto-approved per automated sprint cycle — 2026-03-08)
**Author:** Backend Engineer
**Date:** 2026-03-08

---

#### Overview

This sprint adds event-derived `start_date` and `end_date` fields to the trip response objects returned by `GET /api/v1/trips` and `GET /api/v1/trips/:id`. These values are computed on read via SQL `MIN()`/`MAX()` subqueries across all event tables (flights, stays, activities, land_travels). They are **not stored in the trips table** — no schema migration is required.

**No new endpoints are introduced. Only the trip response shape changes.**

---

#### Naming Clarification

The trips table already contains `start_date` and `end_date` columns (added in Sprint 2, Migration 007) which represent user-set scheduled dates for the trip. Sprint 16 **replaces** these stored values in the API response with event-derived computed values. The stored trips-table columns (`start_date`, `end_date`) remain in the database for backward-compatible query support (e.g., `sort_by=start_date` continues to use the stored column for ordering), but the **response fields** now reflect event-computed min/max dates.

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `start_date` | Computed — MIN across all event dates | `string \| null` | Earliest event date in YYYY-MM-DD format. `null` if the trip has no events. |
| `end_date` | Computed — MAX across all event dates | `string \| null` | Latest event date in YYYY-MM-DD format. `null` if the trip has no events. |

**Event tables and date columns included in the MIN/MAX computation:**

| Table | Date Columns Used |
|-------|------------------|
| `flights` | `DATE(departure_at)`, `DATE(arrival_at)` |
| `stays` | `DATE(check_in_at)`, `DATE(check_out_at)` |
| `activities` | `activity_date` (already YYYY-MM-DD) |
| `land_travels` | `departure_date`, `arrival_date` (already YYYY-MM-DD) |

All timestamps (`departure_at`, `arrival_at`, `check_in_at`, `check_out_at`) must be cast via `DATE()` to extract the date portion before MIN/MAX comparison.

---

#### Updated: GET /api/v1/trips

| Field | Value |
|-------|-------|
| Method | GET |
| Path | `/api/v1/trips` |
| Sprint | 16 (extends Sprint 5 T-072, Sprint 7 T-103) |
| Task | T-162 / T-163 |
| Status | Agreed |
| Auth Required | Yes (Bearer token in `Authorization: Bearer <token>` header) |

**Change from previous sprint:** The `start_date` and `end_date` fields in each trip object in the `data` array are now event-computed (MIN/MAX across all event tables) rather than the stored trips-table values. All other fields, query parameters, pagination behavior, and error responses remain unchanged.

**Request:**
- All existing query parameters unchanged: `?page`, `?limit`, `?search`, `?status`, `?sort_by`, `?sort_order`
- No new query parameters

**Response (Success — 200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Japan 2026",
      "destinations": ["Tokyo", "Osaka", "Kyoto"],
      "status": "PLANNING",
      "start_date": "2026-08-07",
      "end_date": "2026-08-21",
      "notes": "We fly into Narita on August 7th...",
      "created_at": "2026-02-24T12:00:00.000Z",
      "updated_at": "2026-02-24T12:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Weekend Getaway",
      "destinations": ["Portland"],
      "status": "PLANNING",
      "start_date": null,
      "end_date": null,
      "notes": null,
      "created_at": "2026-02-25T09:00:00.000Z",
      "updated_at": "2026-02-25T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2
  }
}
```

**`start_date` / `end_date` field contract:**

| Field | Type | Value when events exist | Value when NO events exist |
|-------|------|------------------------|---------------------------|
| `start_date` | `string \| null` | YYYY-MM-DD string — MIN date across all event tables | `null` |
| `end_date` | `string \| null` | YYYY-MM-DD string — MAX date across all event tables | `null` |

- Both fields are always present in every trip object (never omitted from the response)
- Both are `null` together when a trip has no events; never partially null (if any event exists, both fields have values)
- Format is always `YYYY-MM-DD` (e.g., `"2026-08-07"`) — never ISO 8601 timestamp
- The frontend is responsible for formatting this date string for display (e.g., "Aug 7 – 21, 2026")

**Error responses:** Unchanged from Sprint 5 (400 for invalid query params, 401 for missing/invalid token).

---

#### Updated: GET /api/v1/trips/:id

| Field | Value |
|-------|-------|
| Method | GET |
| Path | `/api/v1/trips/:id` |
| Sprint | 16 (extends Sprint 1 T-005, Sprint 7 T-103) |
| Task | T-162 / T-163 |
| Status | Agreed |
| Auth Required | Yes (Bearer token in `Authorization: Bearer <token>` header) |

**Change from previous sprint:** The `start_date` and `end_date` fields in the single-trip response are now event-computed (MIN/MAX across all event tables) rather than the stored trips-table values. All other fields and error responses remain unchanged.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID (v4) | Trip ID |

**Response (Success — 200 OK — trip with events):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "PLANNING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-21",
    "notes": "We fly into Narita on August 7th and spend 10 days exploring Tokyo, Kyoto, and Osaka.",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-02-24T13:00:00.000Z"
  }
}
```

**Response (Success — 200 OK — trip with NO events):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Weekend Getaway",
    "destinations": ["Portland"],
    "status": "PLANNING",
    "start_date": null,
    "end_date": null,
    "notes": null,
    "created_at": "2026-02-25T09:00:00.000Z",
    "updated_at": "2026-02-25T09:00:00.000Z"
  }
}
```

**`start_date` / `end_date` field contract:** Same as `GET /api/v1/trips` above — event-computed, YYYY-MM-DD or `null`, always both present, always both null or both non-null.

**Error responses (unchanged from Sprint 1):**

| HTTP Status | Code | Condition |
|-------------|------|-----------|
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 403 | `FORBIDDEN` | Authenticated user does not own this trip |
| 404 | `NOT_FOUND` | Trip ID does not exist |

```json
{ "error": { "message": "Trip not found", "code": "NOT_FOUND" } }
```

---

#### SQL Implementation Guidance (for T-163)

The following subquery pattern computes the min/max event dates for a single trip. This should be used in both the list and single-trip model functions. **All queries must be parameterized — never concatenate trip IDs.**

```sql
-- Computed start_date: MIN across all event date columns
SELECT
  LEAST(
    (SELECT MIN(DATE(departure_at)) FROM flights WHERE trip_id = t.id),
    (SELECT MIN(DATE(arrival_at))   FROM flights WHERE trip_id = t.id),
    (SELECT MIN(DATE(check_in_at))  FROM stays   WHERE trip_id = t.id),
    (SELECT MIN(DATE(check_out_at)) FROM stays   WHERE trip_id = t.id),
    (SELECT MIN(activity_date)      FROM activities WHERE trip_id = t.id),
    (SELECT MIN(departure_date)     FROM land_travels WHERE trip_id = t.id),
    (SELECT MIN(arrival_date)       FROM land_travels WHERE trip_id = t.id)
  ) AS start_date,

-- Computed end_date: MAX across all event date columns
  GREATEST(
    (SELECT MAX(DATE(departure_at)) FROM flights WHERE trip_id = t.id),
    (SELECT MAX(DATE(arrival_at))   FROM flights WHERE trip_id = t.id),
    (SELECT MAX(DATE(check_in_at))  FROM stays   WHERE trip_id = t.id),
    (SELECT MAX(DATE(check_out_at)) FROM stays   WHERE trip_id = t.id),
    (SELECT MAX(activity_date)      FROM activities WHERE trip_id = t.id),
    (SELECT MAX(departure_date)     FROM land_travels WHERE trip_id = t.id),
    (SELECT MAX(arrival_date)       FROM land_travels WHERE trip_id = t.id)
  ) AS end_date
FROM trips t
WHERE t.id = ?  -- parameterized
```

PostgreSQL `LEAST()`/`GREATEST()` ignore `NULL` values by default when mixed with non-null values. If ALL inputs are `NULL` (i.e., no events exist), both functions return `NULL`. This is the correct behavior — `null` in the response signals "no events".

For the list endpoint (`GET /api/v1/trips`), wrap these subqueries as lateral expressions or add them as computed columns in the main `SELECT` for each trip row.

---

#### Schema State — Sprint 16

No schema migrations are introduced in Sprint 16. The computed date range fields are derived at read time. All 10 existing migrations (001–010) remain the complete and authoritative schema.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–006 | 1 | Core tables (users, refresh_tokens, trips, flights, stays, activities) | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging |
| — | 8–15 | *(No new migrations)* | Sprints 8–15 schema-stable |
| — | **16** | *(No new migrations)* | **Sprint 16: computed read only — zero schema work** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

---

#### Test Cases Required (for T-163 implementation)

| ID | Scenario | Expected `start_date` | Expected `end_date` |
|----|----------|-----------------------|---------------------|
| A | Trip with no events | `null` | `null` |
| B | Trip with flights only (departure 2026-08-07, arrival 2026-08-21) | `"2026-08-07"` | `"2026-08-21"` |
| C | Trip with mixed events (flight departs 2026-08-07, stay checks out 2026-08-25, activity on 2026-08-10) | `"2026-08-07"` | `"2026-08-25"` |
| D | GET /trips list endpoint includes both fields on every trip object | Present on all trips | Present on all trips |
| E | All 266+ existing backend tests still pass | — | — |

---

*Sprint 16 contract published by Backend Engineer 2026-03-08. Manager auto-approved per automated sprint cycle. T-163 implementation may proceed. T-164 (Frontend) may proceed in parallel — frontend reads `start_date` and `end_date` from the trip object exactly as documented above.*

---

## Sprint 17 Contracts

---

### Sprint 17 — No New API Endpoints

**Sprint:** 17
**Date:** 2026-03-08
**Author:** Backend Engineer
**Status:** Confirmed — No new contracts required

---

#### Summary

Sprint 17 is a **frontend-only** sprint. All work (T-170, T-172) is confined to the React/CSS layer. No new backend endpoints are introduced, and no schema changes are required.

| Task | Scope | Backend Impact |
|------|-------|---------------|
| T-170 | Frontend code cleanup (opacity fix, dead code removal, stale comment) | None |
| T-171 | Design Agent: print/export UI spec | None |
| T-172 | Frontend: implement trip print/export via CSS `@media print` + `window.print()` | None — print view consumes existing trip data already loaded in TripDetailsPage |

The print/export feature (T-172) renders the data already returned by existing endpoints — **no new API calls are needed**. The `TripDetailsPage` already fetches the trip, flights, stays, activities, and land travels at load time; the print stylesheet simply reformats the DOM at print time.

---

#### Existing Contracts Remain Authoritative

All previously agreed contracts from Sprints 1–16 are unchanged and remain the definitive interface. Key contracts the Frontend Engineer should reference for T-172 print rendering:

| Endpoint | Sprint | Purpose |
|----------|--------|---------|
| `GET /api/v1/trips/:id` | 1, updated 16 | Trip name, destinations, `start_date`, `end_date` for print header |
| `GET /api/v1/trips/:id/flights` | 1 | Flight cards for print Flights section |
| `GET /api/v1/trips/:id/stays` | 1 | Stay cards for print Stays section |
| `GET /api/v1/trips/:id/activities` | 1 | Activity cards for print Activities section (day-grouped) |
| `GET /api/v1/trips/:id/land-travels` | 6 | Land travel cards for print Land Travel section |

No fields are added, removed, or renamed. The print view reads the same response shapes defined in Sprints 1 and 6.

---

#### Schema State — Sprint 17

No schema migrations are introduced in Sprint 17. The complete migration history remains:

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–006 | 1 | Core tables (users, refresh_tokens, trips, flights, stays, activities) | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging |
| — | 8–16 | *(No new migrations)* | Sprints 8–16 schema-stable |
| — | **17** | *(No new migrations)* | **Sprint 17: frontend-only — zero schema work** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

---

#### Hotfix Standby Protocol

No backend changes are planned for Sprint 17. If a hotfix is required mid-sprint (e.g., a regression discovered during QA), the Backend Engineer will:
1. Open a new contract entry in this file with the affected endpoint and change description
2. Log a handoff to Manager for approval before implementing
3. Flag the hotfix in `handoff-log.md` and `dev-cycle-tracker.md` as a new task

No hotfix is anticipated. Backend is at 278/278 tests passing and no regressions have been reported.

---

*Sprint 17 contract review published by Backend Engineer 2026-03-08. No new endpoints. No schema changes. All Sprint 1–16 contracts remain in force. Frontend Engineer may proceed with T-172 using existing data already loaded in TripDetailsPage. QA: backend test suite target remains 278+ (no backend changes expected).*

---

## Sprint 18 Contracts

Sprint 18 was fully planned but never executed. All tasks carried forward to Sprint 19 unchanged. No Sprint 18 contracts were published.

---

## Sprint 19 Contracts

---

### T-178 — Auth Rate Limiting (B-020)

**Sprint:** 19
**Date:** 2026-03-09
**Author:** Backend Engineer
**Status:** Agreed — Auto-approved per automated sprint cycle (P0 security fix, 18 sprints deferred)
**Scope:** Behavior change on two existing public auth endpoints. No new endpoints. No request/response shape changes. New 429 error case added to both.

---

#### Summary

Sprint 19 adds IP-based rate limiting middleware to the two public auth endpoints. This is a **behavior-only change** — the request and success response shapes are identical to the Sprint 1 contracts. The only addition is a new `429 Too Many Requests` error response that each endpoint can now return when the per-IP threshold is exceeded.

| Endpoint | Middleware | Limit | Window | 429 Response |
|----------|-----------|-------|--------|-------------|
| `POST /api/v1/auth/login` | `loginLimiter` | 10 requests per IP | 15 minutes | `RATE_LIMITED` |
| `POST /api/v1/auth/register` | `registerLimiter` | 5 requests per IP | 60 minutes | `RATE_LIMITED` |

All other auth endpoints (`POST /auth/refresh`, `POST /auth/logout`) and all trip/flight/stay/activity/land-travel endpoints are **not** rate limited by this change.

---

#### Updated: POST /api/v1/auth/login

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 19) |
| Task | T-004 (updated T-178) |
| Status | Agreed |
| Auth Required | No (public) |

**Change from Sprint 1:** A new `429 Too Many Requests` error response is now possible when the per-IP login attempt threshold is exceeded. All other request/response shapes are unchanged.

**Rate Limit Parameters:**
| Parameter | Value |
|-----------|-------|
| Key | Client IP address |
| Max requests | 10 |
| Window | 15 minutes |
| Headers | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (standard headers, RFC 6585) |
| Legacy headers | Disabled (`legacyHeaders: false`) |

**New Error Response (429 Too Many Requests — Rate limit exceeded):**
```json
{
  "error": {
    "message": "Too many login attempts, please try again later.",
    "code": "RATE_LIMITED"
  }
}
```

**Response Headers (on 429):**
```
RateLimit-Limit: 10
RateLimit-Remaining: 0
RateLimit-Reset: <Unix timestamp when window resets>
```

**All other request/response shapes:** Unchanged from Sprint 1 contract (`POST /api/v1/auth/login` section above). Request body, 200 success, 400 validation, 401 invalid credentials, 500 server error are all identical.

**Frontend Notes:**
- The frontend does not need to make any API shape changes for rate limiting.
- On receiving a 429, the frontend should display a non-field error banner: "Too many login attempts, please try again later."
- The `RATE_LIMITED` code distinguishes this error from `INVALID_CREDENTIALS` (401) — the frontend can use this to display a more specific message.

---

#### Updated: POST /api/v1/auth/register

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 19) |
| Task | T-004 (updated T-178) |
| Status | Agreed |
| Auth Required | No (public) |

**Change from Sprint 1:** A new `429 Too Many Requests` error response is now possible when the per-IP registration attempt threshold is exceeded. All other request/response shapes are unchanged.

**Rate Limit Parameters:**
| Parameter | Value |
|-----------|-------|
| Key | Client IP address |
| Max requests | 5 |
| Window | 60 minutes |
| Headers | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (standard headers, RFC 6585) |
| Legacy headers | Disabled (`legacyHeaders: false`) |

**New Error Response (429 Too Many Requests — Rate limit exceeded):**
```json
{
  "error": {
    "message": "Too many registration attempts, please try again later.",
    "code": "RATE_LIMITED"
  }
}
```

**Response Headers (on 429):**
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: <Unix timestamp when window resets>
```

**All other request/response shapes:** Unchanged from Sprint 1 contract (`POST /api/v1/auth/register` section above). Request body, 201 success, 400 validation, 409 email taken, 500 server error are all identical.

**Frontend Notes:**
- On receiving a 429, the frontend should display a non-field error banner: "Too many registration attempts, please try again later."
- The `RATE_LIMITED` code distinguishes this from `EMAIL_TAKEN` (409) and `VALIDATION_ERROR` (400).

---

#### T-178 — Implementation Notes

**Middleware location:** `backend/src/middleware/rateLimiter.js`

```
loginLimiter:
  windowMs: 15 * 60 * 1000   (15 minutes)
  max: 10
  standardHeaders: true
  legacyHeaders: false
  message: { error: { message: "Too many login attempts, please try again later.", code: "RATE_LIMITED" } }

registerLimiter:
  windowMs: 60 * 60 * 1000   (60 minutes)
  max: 5
  standardHeaders: true
  legacyHeaders: false
  message: { error: { message: "Too many registration attempts, please try again later.", code: "RATE_LIMITED" } }
```

**Application point:** Both limiters are applied in `backend/src/routes/auth.js`, attached to their respective route handlers **before** the handler function. No other routes are affected.

**Store:** In-memory (default `express-rate-limit` MemoryStore). Sufficient at current single-process staging scale. Redis store deferred to Sprint 20+ per B-024.

**Test cases (T-178):**
| Case | Description | Expected |
|------|-------------|---------|
| A | POST /auth/login — attempts 1–10 in window | 200 (valid creds) or 401 (wrong creds) — not rate limited |
| B | POST /auth/login — attempt 11 in same window | 429 `RATE_LIMITED` |
| C | POST /auth/register — attempts 1–5 in window | 201 (new user) or 409 (email taken) — not rate limited |
| D | POST /auth/register — attempt 6 in same window | 429 `RATE_LIMITED` |
| E | GET /api/v1/trips (non-auth route) — any number of requests | 200 or 401 — never 429 from rate limiter |

---

### T-180 — Multi-Destination Structured UI

**Sprint:** 19
**Date:** 2026-03-09
**Author:** Backend Engineer
**Status:** Confirmed — No new backend contracts required

---

#### Summary

T-180 is a **frontend-only** implementation task. The backend already supports the destinations array on all relevant trip endpoints. No new API endpoints are introduced, and no schema changes are required.

The frontend chip input component will send `destinations` as a string array — exactly the same shape the backend has accepted since Sprint 1 (POST and PATCH trips endpoints).

| Task | Scope | Backend Impact |
|------|-------|---------------|
| T-179 | Design Agent: Multi-destination chip UI spec | None |
| T-180 | Frontend: Chip input in create modal, trip card display, trip details editor | None — uses existing POST and PATCH trips endpoints |

---

#### Existing Contracts the Frontend Engineer Must Reference for T-180

| Endpoint | Sprint | Relevant Field | Notes |
|----------|--------|----------------|-------|
| `POST /api/v1/trips` | 1, updated 4 | `destinations: string[]` | Chip input sends array. Min 1 element. Case-insensitive dedup applied server-side. |
| `PATCH /api/v1/trips/:id` | 1, updated 2, 4, 7 | `destinations: string[]` | Edit destinations sends updated array. Same dedup rules. |
| `GET /api/v1/trips` | 1, updated 8 (search/filter) | `destinations: string[]` | Trip card renders this array. |
| `GET /api/v1/trips/:id` | 1, updated 16 | `destinations: string[]` | Trip details header renders this array. |

The `destinations` field is always returned as a `string[]` (never null — a trip must have at least one destination). The frontend chip editor reads and writes this field unchanged.

**No new validation rules are introduced.** Existing server-side rules apply:
- Min 1 element required
- Each element trimmed, empty strings filtered
- Case-insensitive deduplication (first occurrence casing preserved)
- Max 50 destinations

---

#### Schema State — Sprint 19

No schema migrations are introduced in Sprint 19. The complete migration history remains:

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–006 | 1 | Core tables (users, refresh_tokens, trips, flights, stays, activities) | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging |
| — | 8–19 | *(No new migrations)* | Sprints 8–19 schema-stable |

**Total migrations on staging: 10 (001–010). All applied. None pending for Sprint 19.**

---

#### Complete Endpoint Inventory — Sprint 19 (Unchanged from Sprint 17)

All previously agreed contracts from Sprints 1–17 remain in force unchanged.

| Sprint | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | **+Sprint 19: 429 RATE_LIMITED after 5 req/60min per IP** |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | **+Sprint 19: 429 RATE_LIMITED after 10 req/15min per IP** |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | No rate limit applied |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | No rate limit applied |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Not rate limited |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | `destinations` dedup (Sprint 4) |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` updatable (Sprint 7); `""` → `null` (Sprint 9) |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | Nullable start/end time (Sprint 3) |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Linked time validation (Sprint 3) |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travels` | ✅ Agreed, Applied on Staging | — |
| 6 | `POST /api/v1/trips/:id/land-travels` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travels/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `PATCH /api/v1/trips/:id/land-travels/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `DELETE /api/v1/trips/:id/land-travels/:lid` | ✅ Agreed, Applied on Staging | — |

---

*Sprint 19 contracts published by Backend Engineer 2026-03-09. T-178 adds 429 RATE_LIMITED behavior to POST /auth/login (10/15min) and POST /auth/register (5/60min). T-180 is frontend-only — no new endpoints or schema changes. All Sprint 1–17 contracts remain in force. Frontend Engineer may proceed with T-180 using existing PATCH /api/v1/trips/:id contract. QA: backend test suite target is 278+ base + 5 new rate limiter tests = 283+ total.*

---

## Sprint 20 Contracts — 2026-03-10

**Tasks:** T-186 (Joi destination validation tightening), T-188 (Trip notes field validation + response contract)
**Author:** Backend Engineer
**Date:** 2026-03-10
**Status:** Agreed (published for Frontend Engineer and QA reference)

---

### T-186 — Destination Validation Tightening

**Summary:** Two Joi validation gaps from Sprint 19 are closed: (A) destination items now enforce a 100-character maximum, (B) the PATCH empty-destinations error message is standardized to match POST's human-friendly wording.

No new endpoints. No schema changes. Changes are validation-layer only.

---

#### Updated: POST /api/v1/trips — destinations field

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 20) |
| Task | T-001 (updated T-186) |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Change from Sprint 1 / Sprint 19:** `destinations` array items now have a **100-character maximum per item**. Requests containing any destination string longer than 100 characters are rejected with `400 VALIDATION_ERROR`.

**destinations validation rule (updated):**
```
destinations:
  Joi.array()
    .items(Joi.string().min(1).max(100))   ← NEW: .max(100) added
    .min(1)
    .required()
```

**New error case — 400 Validation Error (destination item too long):**
```json
{
  "error": {
    "message": "\"destinations[0]\" length must be less than or equal to 100 characters long",
    "code": "VALIDATION_ERROR"
  }
}
```
*Note: Joi's default message format is used. The index `[0]` reflects whichever item failed.*

**All other request/response shapes:** Unchanged from the Sprint 1 contract.

---

#### Updated: PATCH /api/v1/trips/:id — destinations field

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 20) |
| Task | T-001 (updated T-186) |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Changes from Sprint 1 / Sprint 19:**
1. `destinations` array items now have a **100-character maximum per item** (same as POST above).
2. When `destinations: []` (empty array) is sent, the error message is now standardized to **"At least one destination is required"** — matching the POST endpoint's human-friendly error.

**destinations validation rule (updated):**
```
destinations:
  Joi.array()
    .items(Joi.string().min(1).max(100))   ← NEW: .max(100) added
    .min(1)
    .messages({ 'array.min': 'At least one destination is required' })   ← NEW: friendly message
    .optional()
```

**Error case — 400 Validation Error (destination item too long):**
```json
{
  "error": {
    "message": "\"destinations[0]\" length must be less than or equal to 100 characters long",
    "code": "VALIDATION_ERROR"
  }
}
```

**Error case — 400 Validation Error (empty destinations array) [UPDATED]:**
```json
{
  "error": {
    "message": "At least one destination is required",
    "code": "VALIDATION_ERROR"
  }
}
```
*Previously: Joi's raw message `"destinations" must contain at least 1 items`. Now standardized to match POST.*

**All other request/response shapes:** Unchanged from the Sprint 1 contract.

---

#### T-186 Test Matrix

| Case | Method | Input | Expected |
|------|--------|-------|---------|
| A | POST /api/v1/trips | destinations: ["X".repeat(101)] | 400 VALIDATION_ERROR |
| B | PATCH /api/v1/trips/:id | destinations: ["X".repeat(101)] | 400 VALIDATION_ERROR |
| C | PATCH /api/v1/trips/:id | destinations: [] | 400, message = "At least one destination is required" |
| D | POST /api/v1/trips | destinations: ["X".repeat(100)] | 201 Created (happy path) |
| E | PATCH /api/v1/trips/:id | destinations: ["X".repeat(100)] | 200 OK (happy path) |

---

### T-188 — Trip Notes Field Contract (Formalized)

**Summary:** The `notes TEXT NULL` column on the `trips` table was added in Sprint 7 (migration 010, applied on staging). Sprint 20 formalizes: (1) explicit max-2000-character Joi validation on POST and PATCH, (2) `notes` is confirmed as part of all trip response shapes (POST 201, GET list, GET detail), (3) empty string normalization to `null`.

**Schema status:** No new migration required. Column `notes TEXT NULL` already exists (migration 010, applied Sprint 7).

---

#### Updated: POST /api/v1/trips — notes field added

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 20) |
| Task | T-001 (updated T-188) |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Request Body (updated — notes field added):**

```json
{
  "name": "string, required, min 1, max 200",
  "destinations": ["string, min 1, max 100 each — see T-186"],
  "status": "PLANNING | ONGOING | COMPLETED (optional, defaults to PLANNING)",
  "start_date": "ISO 8601 date string YYYY-MM-DD (optional, nullable)",
  "end_date": "ISO 8601 date string YYYY-MM-DD (optional, nullable)",
  "notes": "string | null (optional, max 2000 chars, '' normalized to null)"
}
```

**notes validation rule:**
```
notes:
  Joi.string()
    .max(2000)
    .allow(null, '')
    .optional()
    .default(null)
```
*If `notes` is omitted or `null` or `""`, it is stored and returned as `null`.*

**Success Response — 201 Created (updated — notes field now explicitly included):**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "destinations": ["string"],
    "status": "PLANNING | ONGOING | COMPLETED",
    "start_date": "YYYY-MM-DD | null",
    "end_date": "YYYY-MM-DD | null",
    "notes": "string | null",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

**New error case — 400 Validation Error (notes too long):**
```json
{
  "error": {
    "message": "\"notes\" length must be less than or equal to 2000 characters long",
    "code": "VALIDATION_ERROR"
  }
}
```

**All other request/response shapes:** Unchanged from Sprint 1 contract.

---

#### Updated: PATCH /api/v1/trips/:id — notes field

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 20) |
| Task | T-001 (updated T-188) |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**notes validation rule (updated — max 2000 now explicitly enforced):**
```
notes:
  Joi.string()
    .max(2000)
    .allow(null, '')
    .optional()
```
*Previously: no explicit max. Sprint 20 adds `.max(2000)` to enforce the 2000-char limit at the API layer.*
*`""` is normalized to `null` before storage (behavior from Sprint 9, unchanged).*

**Request Body (any combination of fields, all optional):**
```json
{
  "name": "string (optional, min 1, max 200)",
  "destinations": ["string (optional, each item min 1, max 100 — see T-186)"],
  "status": "PLANNING | ONGOING | COMPLETED (optional)",
  "start_date": "YYYY-MM-DD | null (optional)",
  "end_date": "YYYY-MM-DD | null (optional)",
  "notes": "string | null (optional, max 2000 chars, '' normalized to null)"
}
```

**Success Response — 200 OK (updated — notes field explicitly included):**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "destinations": ["string"],
    "status": "PLANNING | ONGOING | COMPLETED",
    "start_date": "YYYY-MM-DD | null",
    "end_date": "YYYY-MM-DD | null",
    "notes": "string | null",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

**notes-specific error case — 400 Validation Error (notes too long):**
```json
{
  "error": {
    "message": "\"notes\" length must be less than or equal to 2000 characters long",
    "code": "VALIDATION_ERROR"
  }
}
```

**All other request/response shapes and error cases:** Unchanged from Sprint 1 / Sprint 7 / Sprint 9 contracts.

---

#### Updated: GET /api/v1/trips — notes field in list response

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 20) |
| Task | T-001 (updated T-188) |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Change:** `notes: string | null` is now **explicitly documented** as part of each trip object in the list response. The field has existed in the database since Sprint 7; this formalizes its presence in the response contract.

**Success Response — 200 OK:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "destinations": ["string"],
      "status": "PLANNING | ONGOING | COMPLETED",
      "start_date": "YYYY-MM-DD | null",
      "end_date": "YYYY-MM-DD | null",
      "notes": "string | null",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

**All other request/response shapes:** Unchanged from Sprint 1 / Sprint 8 (search/filter) contracts.

---

#### Updated: GET /api/v1/trips/:id — notes field in detail response

| Field | Value |
|-------|-------|
| Sprint | 1 (updated Sprint 20) |
| Task | T-001 (updated T-188) |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Change:** `notes: string | null` is now **explicitly documented** as part of the trip detail response.

**Success Response — 200 OK:**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "destinations": ["string"],
    "status": "PLANNING | ONGOING | COMPLETED",
    "start_date": "YYYY-MM-DD | null",
    "end_date": "YYYY-MM-DD | null",
    "notes": "string | null",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

**All other request/response shapes:** Unchanged from Sprint 1 contract.

---

#### T-188 Test Matrix

| Case | Method | Input | Expected |
|------|--------|-------|---------|
| A | POST /api/v1/trips | notes: "Hello world" | 201, response includes notes: "Hello world" |
| B | PATCH /api/v1/trips/:id | notes: "Updated note" | 200, response includes notes: "Updated note" |
| C | PATCH /api/v1/trips/:id | notes: null | 200, response includes notes: null |
| D | PATCH /api/v1/trips/:id | notes: "" | 200, response includes notes: null (normalized) |
| E | GET /api/v1/trips/:id | — | 200, response includes notes field (string or null) |
| F | GET /api/v1/trips | — | 200, each trip object includes notes field |
| G | POST /api/v1/trips | notes omitted | 201, response includes notes: null |
| H | POST /api/v1/trips | notes: "x".repeat(2001) | 400 VALIDATION_ERROR |
| I | PATCH /api/v1/trips/:id | notes: "x".repeat(2001) | 400 VALIDATION_ERROR |

---

### Sprint 20 — Schema State

**No new migration required for Sprint 20.**

The `notes TEXT NULL` column was added in Sprint 7 (migration 010, applied on staging). Sprint 20 adds validation and formalizes the API contract — no DDL changes.

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
| — | 8–20 | *(No new migrations through Sprint 20)* | Schema-stable |

**Total migrations on staging: 10 (001–010). All applied. None pending for Sprint 20.**

---

### Sprint 20 — Updated Endpoint Inventory

All Sprint 1–19 contracts remain in force unchanged, with the following Sprint 20 updates:

| Sprint | Endpoint | Sprint 20 Change |
|--------|----------|-----------------|
| 1 (updated 20) | `POST /api/v1/trips` | destinations `.max(100)` per item (T-186); notes `.max(2000)` validation + explicitly in response (T-188) |
| 1 (updated 20) | `PATCH /api/v1/trips/:id` | destinations `.max(100)` per item + friendly empty-array message (T-186); notes `.max(2000)` validation + explicitly in response (T-188) |
| 1 (updated 20) | `GET /api/v1/trips` | notes field explicitly documented in response (T-188) |
| 1 (updated 20) | `GET /api/v1/trips/:id` | notes field explicitly documented in response (T-188) |

All other endpoints unchanged.

---

*Sprint 20 contracts published by Backend Engineer 2026-03-10. T-186: validation-layer-only changes to destinations (max 100 chars per item, friendly PATCH empty-array message). T-188: formalized notes field contract — no new migration (column exists since Sprint 7), adds max-2000 Joi validation and confirms notes inclusion in all trip response shapes. Frontend Engineer may proceed with T-189 (TripNotesSection) using PATCH /api/v1/trips/:id contract above. QA test matrix: 287+ base + T-186 tests (5 cases) + T-188 tests (9 cases) = 301+ total.*

---

## Sprint 21 — API Contracts

**Date:** 2026-03-10
**Reviewed by:** Backend Engineer
**Outcome:** Sprint 21 was a planning-only sprint — zero tasks executed. All tasks carry to Sprint 22. No contract review action required.

---

*Sprint 21 was planning-only (0/8 tasks executed). No API contract changes.*

---

## Sprint 22 — API Contracts

**Date:** 2026-03-10
**Reviewed by:** Backend Engineer
**Sprint Goal:** Close the Sprint 21 carry-over pipeline. Deliver the trip status selector (T-196): an inline status badge on TripDetailsPage that lets users change PLANNING → ONGOING → COMPLETED without a page reload. Complete the full QA → Deploy → Monitor → User Agent pipeline (T-197 through T-201).

---

### Sprint 22 — No New API Endpoints

Sprint 22 introduces **zero new backend endpoints and zero schema changes**. The sole new frontend feature — the `TripStatusSelector` component (T-196) — operates exclusively against the existing `PATCH /api/v1/trips/:id` endpoint, which has supported the `status` field since Sprint 1.

The `active-sprint.md` Sprint 22 Out-of-Scope note is authoritative: *"Backend changes for status — PATCH /api/v1/trips/:id already supports `status` field per Sprint 1 API contract. No migration or model changes needed."*

| Task | Agent | API Impact |
|------|-------|------------|
| T-194 | User Agent | Sprint 20 walkthrough — no API changes. Tests existing endpoints. |
| T-195 | Design Agent | Spec 20 UI spec — no API changes. Documents frontend component behaviour only. |
| T-196 | Frontend Engineer | `TripStatusSelector.jsx` — calls existing `PATCH /api/v1/trips/:id` with `{ "status": "..." }`. **No new endpoint; no contract change.** |
| T-197 | QA Engineer | Security checklist + code review — no API changes. |
| T-198 | QA Engineer | Integration testing — exercises existing endpoints. |
| T-199 | Deploy Engineer | Frontend rebuild + pm2 reload — no API changes. |
| T-200 | Monitor Agent | Staging health check — no API changes. |
| T-201 | User Agent | Sprint 22 feature walkthrough — no API changes. |

---

### Sprint 22 — Status Field on PATCH /api/v1/trips/:id (Reference for T-196)

This section is a **focused reference** for the Frontend Engineer implementing T-196 (`TripStatusSelector.jsx`). The full contract is documented in the Sprint 1 section and updated through Sprint 20. No changes are made here — this is a convenience excerpt.

#### Endpoint

| Field | Value |
|-------|-------|
| Method | `PATCH` |
| Path | `/api/v1/trips/:id` |
| Auth Required | Yes — Bearer token (`Authorization: Bearer <access_token>`) |
| Sprint introduced | 1 (T-005) |
| Last updated | Sprint 20 (T-186, T-188) |
| Contract status | ✅ Agreed, Applied on Staging |

#### Request Body (status-only update — the T-196 use case)

Only the `status` field needs to be sent. All PATCH fields are optional; only provided fields are updated.

```json
{
  "status": "ONGOING"
}
```

**Valid `status` values:**

| Value | Meaning |
|-------|---------|
| `"PLANNING"` | Trip is in the planning phase (default for new trips) |
| `"ONGOING"` | Trip is currently in progress |
| `"COMPLETED"` | Trip has been completed |

Any other string value (e.g., `"INVALID"`, `""`, `null`, an integer) will return `400 VALIDATION_ERROR`.

#### Success Response — 200 OK

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "destinations": ["string"],
    "status": "ONGOING",
    "start_date": "YYYY-MM-DD | null",
    "end_date": "YYYY-MM-DD | null",
    "notes": "string | null",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

The `status` field in the response reflects the **computed** status (based on `start_date`/`end_date` vs. current date per T-030 logic). When dates are not set, the stored status value is returned as-is. After a successful PATCH with an explicit `status`, the response will reflect the newly stored value.

#### Error Responses

**400 Bad Request — Invalid status value:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "status": "Status must be one of: PLANNING, ONGOING, COMPLETED"
    }
  }
}
```

**400 Bad Request — No updatable fields provided:**
```json
{
  "error": {
    "message": "No updatable fields provided",
    "code": "NO_UPDATABLE_FIELDS"
  }
}
```
*(Not triggered by T-196 since status is always provided, but documented for completeness.)*

**401 Unauthorized — Missing or expired token:**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**403 Forbidden — Trip belongs to a different user:**
```json
{
  "error": {
    "message": "You do not have access to this trip",
    "code": "FORBIDDEN"
  }
}
```

**404 Not Found — Trip ID does not exist:**
```json
{
  "error": {
    "message": "Trip not found",
    "code": "NOT_FOUND"
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  }
}
```

#### T-196 Integration Notes

- **Client-side validation:** The Frontend MUST validate that `status` is one of `"PLANNING"`, `"ONGOING"`, `"COMPLETED"` before sending the PATCH request. Since the UI presents only those three hardcoded options, this is inherently guaranteed. No user-typed string reaches the API.
- **Optimistic update:** Per Spec 20, the badge should optimistically update to the new status before the API call resolves. On error (any non-200 response), revert to the previous status and display the generic error toast.
- **Same-status no-op:** If the user selects the status that is already active, the Frontend should NOT send a PATCH request (close dropdown silently). This is a UI-only optimisation — the API would accept it, but there is no need to make the round-trip.
- **Auth token:** Use the existing auth token from the app's auth context. If the request returns 401, follow the standard token refresh flow already in place.

#### T-196 — QA Test Matrix (Backend-relevant cases)

| Case | Method | Input | Expected |
|------|--------|-------|----------|
| A | PATCH /api/v1/trips/:id | `{ "status": "ONGOING" }` (valid, different from current) | 200, response includes `"status": "ONGOING"` |
| B | PATCH /api/v1/trips/:id | `{ "status": "COMPLETED" }` | 200, response includes `"status": "COMPLETED"` |
| C | PATCH /api/v1/trips/:id | `{ "status": "PLANNING" }` | 200, response includes `"status": "PLANNING"` |
| D | PATCH /api/v1/trips/:id | `{ "status": "INVALID" }` (direct API call) | 400, `VALIDATION_ERROR`, `fields.status` present |
| E | PATCH /api/v1/trips/:id | `{ "status": "" }` (direct API call) | 400, `VALIDATION_ERROR` |
| F | PATCH /api/v1/trips/:id | `{ "status": "ONGOING" }` (no auth header) | 401, `UNAUTHORIZED` |
| G | PATCH /api/v1/trips/:id | `{ "status": "ONGOING" }` (another user's trip) | 403, `FORBIDDEN` |
| H | PATCH /api/v1/trips/:id | `{ "status": "ONGOING" }` (non-existent trip ID) | 404, `NOT_FOUND` |

*Cases A–C are the normal flow exercised by T-196. Cases D–H are regression/security cases for T-198 integration testing.*

---

### Sprint 22 — No Schema Changes

No new database migrations are introduced in Sprint 22. The `status` column (`VARCHAR(20)`) on the `trips` table has existed since migration 003 (Sprint 1). No DDL changes are required.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001 | 1 | Create `users` table | ✅ Applied on Staging |
| 002 | 1 | Create `refresh_tokens` table | ✅ Applied on Staging |
| 003 | 1 | Create `trips` table (includes `status VARCHAR(20) DEFAULT 'PLANNING'`) | ✅ Applied on Staging |
| 004 | 1 | Create `flights` table | ✅ Applied on Staging |
| 005 | 1 | Create `stays` table | ✅ Applied on Staging |
| 006 | 1 | Create `activities` table | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging |
| — | 8–22 | *(No new migrations through Sprint 22)* | Schema-stable |

**Total migrations on staging: 10 (001–010). All applied. None pending for Sprint 22.**

---

### Sprint 22 — Existing Contracts Remain Authoritative

All contracts from Sprints 1–20 remain in force unchanged. The complete authoritative state of all endpoint groups:

| Sprint | Endpoint Group | Contract Status | Key Notes |
|--------|---------------|----------------|-----------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | Rate limiting added Sprint 19 (T-183). |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | — |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | — |
| 1 (updated 20) | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Search/filter/sort added Sprint 5. `notes` field added Sprint 7. `notes` is always `null \| non-empty string` (Sprint 9 correction). `status` filter by computed status (Sprint 5). |
| 1 (updated 20) | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | `destinations` item max 100 chars (T-186 Sprint 20). `notes` max 2000 chars (T-188 Sprint 20). |
| 1 (updated 20) | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | `notes` field present; returns `null` if unset. |
| 1 (updated 20) | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | **`status` accepts `PLANNING \| ONGOING \| COMPLETED` (Sprint 1, unchanged).** `notes` updatable (Sprint 7); `""` → `null` (Sprint 9). `destinations` item max 100 chars + friendly empty-array message (Sprint 20). |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | `departure_tz` + `arrival_tz` fields present. |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | `check_in_tz` + `check_out_tz` fields present. |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | `location TEXT NULL` present. `start_time`/`end_time` nullable (Sprint 3). |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | — |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Path corrected from `/land-travels` to `/land-travel` (T-139, Sprint 13). |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | — |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | — |

---

*Sprint 22 contracts published by Backend Engineer 2026-03-10. No new endpoints or schema changes. Sprint 22 is a frontend-feature-only sprint — `TripStatusSelector` (T-196) calls the existing `PATCH /api/v1/trips/:id` endpoint with `{ "status": "..." }`, which has accepted the `status` field since Sprint 1. The focused reference above (§ "Status Field on PATCH /api/v1/trips/:id") gives the Frontend Engineer everything needed for T-196 implementation. Test baseline: 304/304 backend | 429/429 frontend. No new backend tests expected — the status path is already covered by the existing trip PATCH test suite.*

---

## Sprint 24 — API Contracts

**Date:** 2026-03-10
**Published by:** Backend Engineer
**Sprint Goal:** Execute T-202 (User Agent consolidated walkthrough), upgrade vitest 1.x → 4.x (T-203), and implement the home page status filter tabs (T-208, frontend-only, client-side).

---

### Sprint 24 — No New API Endpoints

Sprint 24 introduces **zero new backend endpoints and zero schema changes**. The backend's sole engineering task is a **dev-tooling upgrade** (T-203): bumping `vitest` from `^1.x` to `^4.0.0` in `backend/package.json`. This is a test-runner change with no effect on runtime behaviour, API surface, or the database layer.

The new frontend feature — `StatusFilterTabs` (T-208) — filters trips **client-side only**. The Design Agent's Spec 21 explicitly specifies "no new API calls." The existing `GET /api/v1/trips` response already returns the `status` field (`"PLANNING" | "ONGOING" | "COMPLETED"`) on every trip object, giving the frontend everything it needs to filter locally without any backend changes.

| Task | Agent | API Impact |
|------|-------|------------|
| T-202 | User Agent | Consolidated walkthrough — no API changes. Exercises existing staging endpoints. |
| T-203 (backend) | Backend Engineer | `vitest` upgrade 1.x → 4.x in `backend/package.json`. **Dev-tooling only. Zero production or runtime changes.** |
| T-203 (frontend) | Frontend Engineer | `vitest` upgrade 1.x → 4.x in `frontend/package.json`. Dev-tooling only. |
| T-207 | Design Agent | Spec 21 — status filter tabs. UI spec only, no API changes. |
| T-208 | Frontend Engineer | `StatusFilterTabs` component — client-side filtering of existing trip data. **No new API calls.** Reads `status` from existing `GET /api/v1/trips` response. |
| T-204 | QA Engineer | Security checklist + test re-verification. Exercises existing endpoints. |
| T-205 | Deploy Engineer | Staging re-deployment. No migration required. |
| T-206 | Monitor Agent | Staging health check. No API changes. |
| T-209 | User Agent | Sprint 24 feature walkthrough. No API changes. |

---

### Sprint 24 — Status Field on GET /api/v1/trips (Reference for T-208)

This is a **focused reference** for the Frontend Engineer implementing `StatusFilterTabs` (T-208). No changes are made to this endpoint — this excerpt confirms the existing data shape supports client-side filtering without modification.

#### Endpoint

| Field | Value |
|-------|-------|
| Method | `GET` |
| Path | `/api/v1/trips` |
| Auth Required | Yes — Bearer token (`Authorization: Bearer <access_token>`) |
| Sprint introduced | 1 (T-005) |
| Last updated | Sprint 20 (T-186, T-188) |
| Contract status | ✅ Agreed, Applied on Staging |

#### Query Parameters (unchanged from prior sprints)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Pagination page number |
| `limit` | integer | `20` | Results per page (max 100) |
| `status` | string | — | Optional server-side pre-filter: `PLANNING \| ONGOING \| COMPLETED`. (Not used by T-208 — T-208 fetches all trips then filters client-side.) |
| `sort` | string | `created_at_desc` | Sort order. See Sprint 5 contract for full sort options. |
| `search` | string | — | Optional substring match on trip `name`. |

#### Success Response — 200 OK

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "destinations": ["string"],
      "status": "PLANNING",
      "start_date": "YYYY-MM-DD | null",
      "end_date": "YYYY-MM-DD | null",
      "notes": "string | null",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

**Key field for T-208:** The `status` field is always present and is one of `"PLANNING"`, `"ONGOING"`, or `"COMPLETED"`. The `StatusFilterTabs` component filters `trips` locally using:

```js
filteredTrips = activeFilter === "ALL" ? trips : trips.filter(t => t.status === activeFilter)
```

**No API call is made when the active filter changes.** All trip data is already in memory from the initial `GET /api/v1/trips` fetch on `HomePage` mount.

#### T-208 Integration Notes

- **No pagination concern for MVP:** The home page fetches the first page (default limit 20). Client-side filtering applies only to the trips in memory. If a user has more than 20 trips, filtered counts may not reflect totals accurately — this is accepted behaviour at current scale and matches prior sprint decisions.
- **Stale data after status change:** If a user navigates from `TripDetailsPage` (where they changed a trip's status via `PATCH /api/v1/trips/:id`) back to `HomePage`, the existing home page refetch-on-mount behaviour ensures the trip list is fresh. No new synchronisation mechanism is required.
- **Empty filtered state:** When `filteredTrips.length === 0` AND `trips.length > 0`, show `"No [Label] trips yet."` with a `"Show all"` reset link. Do NOT modify the global empty state (shown when `trips.length === 0`). The global empty state is a backend-independent UI concern.

---

### Sprint 24 — No Schema Changes

No database migrations are introduced in Sprint 24. The migration set remains at 10 applied migrations (001–010), identical to Sprint 22.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001 | 1 | Create `users` table | ✅ Applied on Staging |
| 002 | 1 | Create `refresh_tokens` table | ✅ Applied on Staging |
| 003 | 1 | Create `trips` table (includes `status VARCHAR(20) DEFAULT 'PLANNING'`) | ✅ Applied on Staging |
| 004 | 1 | Create `flights` table | ✅ Applied on Staging |
| 005 | 1 | Create `stays` table | ✅ Applied on Staging |
| 006 | 1 | Create `activities` table | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging |
| — | 8–24 | *(No new migrations through Sprint 24)* | Schema-stable |

**Total migrations on staging: 10 (001–010). All applied. None pending for Sprint 24. Deploy Engineer: no `knex migrate:latest` run required.**

---

### Sprint 24 — All Existing Contracts Remain Authoritative

All contracts from Sprints 1–22 remain in force unchanged. Full authoritative endpoint table is in the Sprint 22 section above. No endpoint signatures, request shapes, response shapes, auth requirements, or error codes have changed in Sprint 24.

---

*Sprint 24 contracts published by Backend Engineer 2026-03-10. No new endpoints or schema changes. T-203 (backend) is a dev-tooling-only vitest upgrade — zero API surface impact. T-208 is a client-side-only filter using data already returned by the existing `GET /api/v1/trips` endpoint. Test baseline entering Sprint 24: 304/304 backend | 451/451 frontend. After T-203 completes, all 304+ backend tests must pass under vitest 4.x.*

---

## Sprint 25 — API Contracts

**Sprint Goal:** Calendar data aggregation endpoint (T-212) — `GET /api/v1/trips/:id/calendar` returns a unified timeline merging flights, stays, and activities for a trip, normalized to a common event shape for the `TripCalendar` component.

**Published by:** Backend Engineer
**Date:** 2026-03-10
**Status:** ✅ Draft — Pending Manager Approval

---

## T-212 — Calendar Data Aggregation Endpoint

### GET /api/v1/trips/:id/calendar

| Field | Value |
|-------|-------|
| Sprint | 25 |
| Task | T-212 |
| Status | Draft — Pending Manager Approval |
| Auth Required | Yes — Bearer token (`Authorization: Bearer <access_token>`) |

**Description:** Returns a unified, chronologically ordered timeline of all calendar events for a given trip. Events are aggregated from three source tables — `flights`, `stays`, and `activities` — and normalized to a common event shape. This is a **read-only** endpoint; all editing still happens via the existing resource-specific CRUD endpoints. No query parameters are accepted; all events for the trip are returned in a single response (no pagination — trips are expected to have a manageable number of sub-resources).

---

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID v4 string | The trip ID to fetch calendar events for |

**Request Body:** None (GET request)

**Query Parameters:** None

---

**Event Shape:**

Each element in the `events` array conforms to the following shape:

```json
{
  "id": "string",
  "type": "FLIGHT | STAY | ACTIVITY",
  "title": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "start_time": "HH:MM | null",
  "end_time": "HH:MM | null",
  "timezone": "IANA timezone string | null",
  "source_id": "UUID v4 string"
}
```

**Field definitions:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | string | No | Composite ID: `"{type_lowercase}-{source_id}"` (e.g., `"flight-550e8400-..."`, `"stay-550e8400-..."`, `"activity-550e8400-..."`). Stable and unique within the response. |
| `type` | enum | No | One of: `FLIGHT`, `STAY`, `ACTIVITY` |
| `title` | string | No | Human-readable label for display on the calendar. See derivation rules per type below. |
| `start_date` | string | No | Event start date in `YYYY-MM-DD` format, expressed in the event's local timezone. |
| `end_date` | string | No | Event end date in `YYYY-MM-DD` format, expressed in the event's local timezone. Equal to `start_date` for single-day events (flights, activities). May differ from `start_date` for multi-day stays. |
| `start_time` | string | Yes | Local start time in `HH:MM` (24-hour) format. `null` for all-day activities (when `start_time` is not set on the activity). |
| `end_time` | string | Yes | Local end time in `HH:MM` (24-hour) format. `null` for all-day activities (when `end_time` is not set on the activity). |
| `timezone` | string | Yes | IANA timezone string (e.g., `"America/New_York"`). `null` for activities, which have no timezone column. |
| `source_id` | string | No | The original UUID of the source record (`flight.id`, `stay.id`, or `activity.id`). Used by the frontend to build deep-link scroll targets. |

---

**Event Derivation Rules by Type:**

#### FLIGHT events (sourced from `flights` table)

| Calendar field | Derived from |
|----------------|-------------|
| `id` | `"flight-" + flight.id` |
| `type` | `"FLIGHT"` |
| `title` | `"{airline} {flight_number} — {from_location} → {to_location}"` |
| `start_date` | Local calendar date of `departure_at` in `departure_tz` (YYYY-MM-DD) |
| `end_date` | Local calendar date of `arrival_at` in `arrival_tz` (YYYY-MM-DD) |
| `start_time` | Local time of `departure_at` in `departure_tz` (HH:MM, 24-hour) |
| `end_time` | Local time of `arrival_at` in `arrival_tz` (HH:MM, 24-hour) |
| `timezone` | `departure_tz` |
| `source_id` | `flight.id` |

*Note: `start_date` and `end_date` may differ for overnight flights (e.g., departure 23:00 → arrival 06:00 next day).*

#### STAY events (sourced from `stays` table)

| Calendar field | Derived from |
|----------------|-------------|
| `id` | `"stay-" + stay.id` |
| `type` | `"STAY"` |
| `title` | `stay.name` |
| `start_date` | Local calendar date of `check_in_at` in `check_in_tz` (YYYY-MM-DD) |
| `end_date` | Local calendar date of `check_out_at` in `check_out_tz` (YYYY-MM-DD) |
| `start_time` | Local time of `check_in_at` in `check_in_tz` (HH:MM, 24-hour) |
| `end_time` | Local time of `check_out_at` in `check_out_tz` (HH:MM, 24-hour) |
| `timezone` | `check_in_tz` |
| `source_id` | `stay.id` |

*Note: `end_date` will typically differ from `start_date` for multi-night stays. Frontend renders these as multi-day spans on the calendar grid.*

#### ACTIVITY events (sourced from `activities` table)

| Calendar field | Derived from |
|----------------|-------------|
| `id` | `"activity-" + activity.id` |
| `type` | `"ACTIVITY"` |
| `title` | `activity.name` |
| `start_date` | `activity.activity_date` (already stored as YYYY-MM-DD) |
| `end_date` | `activity.activity_date` (same day — activities are always single-day) |
| `start_time` | `activity.start_time` — `null` if not set (all-day activity) |
| `end_time` | `activity.end_time` — `null` if not set (all-day activity) |
| `timezone` | `null` — activities have no timezone column in the DB |
| `source_id` | `activity.id` |

---

**Ordering:**

Events in the `events` array are ordered by:
1. `start_date` ASC (chronological by local start date)
2. `start_time` ASC NULLS LAST (timed events before all-day events on the same date)
3. `type` ASC as tiebreaker (`ACTIVITY` < `FLIGHT` < `STAY` — alphabetical, deterministic)

---

**Response (Success — 200 OK):**

```json
{
  "data": {
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "events": [
      {
        "id": "flight-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "type": "FLIGHT",
        "title": "Delta DL12345 — SFO → LAX",
        "start_date": "2026-08-07",
        "end_date": "2026-08-07",
        "start_time": "06:00",
        "end_time": "08:30",
        "timezone": "America/Los_Angeles",
        "source_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      },
      {
        "id": "stay-b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "type": "STAY",
        "title": "Grand Hyatt LA",
        "start_date": "2026-08-07",
        "end_date": "2026-08-10",
        "start_time": "15:00",
        "end_time": "11:00",
        "timezone": "America/Los_Angeles",
        "source_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
      },
      {
        "id": "activity-c3d4e5f6-a7b8-9012-cdef-123456789012",
        "type": "ACTIVITY",
        "title": "Getty Museum Visit",
        "start_date": "2026-08-08",
        "end_date": "2026-08-08",
        "start_time": "10:00",
        "end_time": "13:00",
        "timezone": null,
        "source_id": "c3d4e5f6-a7b8-9012-cdef-123456789012"
      },
      {
        "id": "activity-d4e5f6a7-b8c9-0123-defa-234567890123",
        "type": "ACTIVITY",
        "title": "Free afternoon",
        "start_date": "2026-08-09",
        "end_date": "2026-08-09",
        "start_time": null,
        "end_time": null,
        "timezone": null,
        "source_id": "d4e5f6a7-b8c9-0123-defa-234567890123"
      }
    ]
  }
}
```

**Empty trip (no sub-resources):**

```json
{
  "data": {
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "events": []
  }
}
```

---

**Error Responses:**

| HTTP Status | Code | Message | Condition |
|-------------|------|---------|-----------|
| `401 Unauthorized` | `UNAUTHORIZED` | `"Authentication required."` | No `Authorization` header, or token is missing, expired, or malformed. |
| `403 Forbidden` | `FORBIDDEN` | `"You do not have access to this trip."` | Trip exists but belongs to a different user. |
| `404 Not Found` | `NOT_FOUND` | `"Trip not found."` | No trip with the given `:id` exists in the database. |
| `400 Bad Request` | `VALIDATION_ERROR` | `"Invalid trip ID format."` | The `:id` path parameter is not a valid UUID v4. |
| `500 Internal Server Error` | `INTERNAL_ERROR` | `"An unexpected error occurred."` | Unhandled server error (database failure, etc.). Stack trace never exposed. |

**Error response shape (all errors):**
```json
{
  "error": {
    "message": "<human-readable message>",
    "code": "<ERROR_CODE>"
  }
}
```

---

**Auth Enforcement Detail:**

1. Middleware `authenticate` runs first — validates the Bearer token. Returns `401` if invalid.
2. Route handler fetches the trip by `:id`. If not found → `404`.
3. Ownership check: `trip.user_id !== req.user.id` → `403`.
4. Only after passing ownership check does the handler query flights, stays, and activities.

This mirrors the auth pattern used by all existing sub-resource endpoints (T-012).

---

**Implementation Notes (for Backend Engineer — not part of the public contract):**

- Query flights, stays, and activities in parallel (`Promise.all`) for performance.
- Derive `start_date`, `end_date`, `start_time`, `end_time` from UTC timestamps + IANA timezone strings in JavaScript (using `Intl.DateTimeFormat` with `timeZone` option), **not** in SQL. This keeps the DB layer thin and avoids PostgreSQL timezone casting complexity.
- Activities already return `activity_date` as `YYYY-MM-DD` via `TO_CHAR` in `activityModel.js` — use that directly without further transformation.
- Sort the merged array in JavaScript after fetching (sort by `start_date` → `start_time` NULLS LAST → `type`).
- Route file: `backend/src/routes/calendar.js`. Register under trips router as a sub-path: `GET /api/v1/trips/:id/calendar`.
- Model file: `backend/src/models/calendarModel.js` — contains the aggregation logic, keeping route handler thin.
- No new schema required — pure read aggregation over existing tables.

---

### Sprint 25 — No Schema Changes Required

**Conclusion:** `GET /api/v1/trips/:id/calendar` is a **read-only aggregation** endpoint over the existing `flights`, `stays`, and `activities` tables. No new columns, tables, or indexes are required.

The migration log remains at **10 applied migrations (001–010)**. No `knex migrate:latest` is needed for Sprint 25. Deploy Engineer: no migration step required.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–010 | 1–7 | (existing migrations — see technical-context.md) | ✅ Applied |
| — | 8–25 | *(No new migrations through Sprint 25)* | Schema-stable |

**Total migrations on staging: 10 (001–010). All applied. None pending for Sprint 25.**

---

### Sprint 25 — Endpoint Inventory Update

All contracts from Sprints 1–24 remain in force unchanged. Sprint 25 adds one new endpoint:

| Sprint | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| 25 (new) | `GET /api/v1/trips/:id/calendar` | Draft — Pending Manager Approval | New calendar aggregation endpoint (T-212). Read-only. Auth + ownership enforced. |

All other endpoints remain unchanged. Full authoritative endpoint table is in the Sprint 22 section above.

---

*Sprint 25 contracts published by Backend Engineer 2026-03-10. One new endpoint: `GET /api/v1/trips/:id/calendar` (T-212). No schema changes — pure read aggregation over existing tables. Test baseline entering Sprint 25: 304/304 backend | 481/481 frontend | 0 vulnerabilities. After T-212 implementation, backend test count must be 304+ (new calendar endpoint tests included).*

---

## Sprint 26 — API Contracts

**Date:** 2026-03-11
**Published by:** Backend Engineer
**Sprint Goal:** Production deployment hardening — knexfile SSL config (T-220), auth cookie SameSite fix for cross-origin production (T-221), and Monitor Agent health check process fix via seed script (T-226). No new API endpoints this sprint.

---

### Sprint 26 — No New API Endpoints

Sprint 26 introduces **zero new API endpoints and zero schema changes**. All three backend tasks are production configuration and infrastructure hardening. The only externally observable change is a **cookie attribute amendment** to the existing auth endpoints in the production environment (T-221).

| Task | Type | API Impact |
|------|------|------------|
| T-220 | Config change | `backend/knexfile.js` gets a production SSL block + conservative pool settings for AWS RDS. **Zero API surface change.** |
| T-221 | Behavioral amendment | Auth endpoints' `Set-Cookie` response header changes `SameSite` attribute from `Strict` to `None` (and enforces `Secure=true`) **in production only**. Dev/staging cookie behavior is unchanged. See contract amendment below. |
| T-226 | Infrastructure | Seed script creates a persistent test user (`test@triplanner.local`). No new endpoints. Uses existing `POST /api/v1/auth/login`. |

---

### T-221 — Cookie SameSite Amendment (Production Only)

**Sprint:** 26
**Task:** T-221
**Status:** Agreed
**Affects:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
**Auth Required:** As per each endpoint's existing contract (unchanged)

#### Summary

The frontend (`triplanner-frontend.onrender.com`) and backend (`triplanner-backend.onrender.com`) are cross-origin on Render. Browsers block `SameSite=Strict` cookies from being sent in cross-origin requests, which breaks authentication in production. T-221 fixes this by changing the `Set-Cookie` header on all auth endpoints to use `SameSite=None; Secure` when `NODE_ENV === 'production'`.

**This is the only change.** All request/response body shapes, status codes, error codes, and auth logic are unchanged.

---

#### Updated: Set-Cookie Header — Environment-Specific Behavior

The `refresh_token` cookie is set by `POST /auth/register`, `POST /auth/login`, and `POST /auth/refresh`. It is cleared by `POST /auth/logout`. The cookie attributes now vary by environment:

| Attribute | Development | Staging | Production |
|-----------|-------------|---------|------------|
| `HttpOnly` | `true` | `true` | `true` |
| `Secure` | `false` (or `true` if `COOKIE_SECURE=true`) | `false` (or `true` if `COOKIE_SECURE=true`) | `true` (always) |
| `SameSite` | `Strict` | `Strict` | `None` |
| `Path` | `/api/v1/auth` | `/api/v1/auth` | `/api/v1/auth` |
| `Max-Age` | `604800` (7 days) | `604800` (7 days) | `604800` (7 days) |

**Production `Set-Cookie` header (after T-221):**
```
Set-Cookie: refresh_token=<OPAQUE_TOKEN>; HttpOnly; Secure; SameSite=None; Path=/api/v1/auth; Max-Age=604800
```

**Development/Staging `Set-Cookie` header (unchanged):**
```
Set-Cookie: refresh_token=<OPAQUE_TOKEN>; HttpOnly; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800
```

**Logout clear-cookie header — Production:**
```
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=None; Path=/api/v1/auth; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

#### Implementation Rule

The production cookie config is gated **solely on `NODE_ENV === 'production'`**:

```js
function getRefreshCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction || process.env.COOKIE_SECURE === 'true',
    sameSite: isProduction ? 'none' : 'strict',
    path: '/api/v1/auth',
    maxAge: REFRESH_TOKEN_SECONDS * 1000,
  };
}
```

**Security note:** `SameSite=None` requires `Secure=true` (HTTPS-only). The browser will silently ignore or reject a `SameSite=None` cookie without `Secure`. Render enforces HTTPS on all services, so this is safe in production.

#### Affected Endpoints (Response Shape Unchanged)

All four auth endpoints are affected only in their `Set-Cookie` response header. No body, status code, or error shape changes:

| Endpoint | Cookie Action | Body Shape |
|----------|--------------|------------|
| `POST /api/v1/auth/register` | Sets `refresh_token` cookie | Unchanged from Sprint 1 |
| `POST /api/v1/auth/login` | Sets `refresh_token` cookie | Unchanged from Sprint 1 |
| `POST /api/v1/auth/refresh` | Rotates `refresh_token` cookie | Unchanged from Sprint 1 |
| `POST /api/v1/auth/logout` | Clears `refresh_token` cookie (Max-Age=0) | 204 No Content (unchanged) |

#### Test Plan — T-221

**Happy paths:**
- With `NODE_ENV=production`: `POST /auth/login` response `Set-Cookie` header includes `SameSite=None` and `Secure`
- With `NODE_ENV=production`: `POST /auth/register` response `Set-Cookie` header includes `SameSite=None` and `Secure`
- With `NODE_ENV=production`: `POST /auth/refresh` response `Set-Cookie` header includes `SameSite=None` and `Secure`
- With `NODE_ENV=production`: `POST /auth/logout` clear-cookie header includes `SameSite=None` and `Secure` with `Max-Age=0`
- With `NODE_ENV=development` (default): all four endpoints return `SameSite=Strict` (no `SameSite=None`, no bare `Secure`)
- With `NODE_ENV=staging` (or unset): same as development — `SameSite=Strict`

**Error paths:**
- Cookie attribute change does not affect any error response — 400, 401, 403, 404, 429 responses are unchanged

---

### T-220 — knexfile.js Production Config (Backend-Internal — No API Change)

**Sprint:** 26
**Task:** T-220
**Status:** Confirmed — No API contract change

This is a backend-internal configuration change. The production block in `backend/knexfile.js` gains:
- `ssl: { rejectUnauthorized: false }` — required for AWS RDS self-signed certificates
- `pool: { min: 1, max: 5 }` — conservative pool for a `db.t3.micro` free-tier instance (was `{ min: 2, max: 10 }`)

No endpoint signatures, request/response shapes, status codes, or error codes change. This change is invisible to all API consumers (Frontend Engineer, QA, Monitor Agent). It affects only the backend's database connection layer.

**No schema changes. No migrations. No Deploy Engineer migration action required.**

---

### T-226 — Monitor Agent Seed Script (Backend-Internal — No API Change)

**Sprint:** 26
**Task:** T-226
**Status:** Confirmed — No API contract change

A Knex seed script (`backend/src/seeds/test_user.js`) inserts a persistent staging test user:

| Field | Value |
|-------|-------|
| `email` | `test@triplanner.local` |
| `password` (plaintext) | `TestPass123!` |
| `name` | `Test User` |

The seed is idempotent — it uses an upsert (insert-or-ignore) so re-running it is safe. After seeding, the Monitor Agent and QA Engineer may use this account to obtain tokens via the **existing** `POST /api/v1/auth/login` endpoint — no new endpoint is introduced.

**Relevant existing endpoint for Monitor Agent reference:**

```
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "test@triplanner.local", "password": "TestPass123!" }
```

Expected response: `200 OK` with `access_token` in body and `refresh_token` in `Set-Cookie` header. Full contract is in the Sprint 1 section above.

**No schema changes. No migrations. The `users` table (migration 001) already has all required columns.**

---

### Sprint 26 — Schema State (Unchanged)

No new database migrations are introduced in Sprint 26.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–010 | 1–7 | Core tables, date ranges, nullable times, land travels, notes | ✅ Applied on Staging |
| — | 8–26 | *(No new migrations through Sprint 26)* | Schema-stable |

**Total migrations: 10 (001–010). All applied. No `knex migrate:latest` required for Sprint 26.**

---

### Sprint 26 — Complete Endpoint Inventory

All contracts from Sprints 1–25 remain in force unchanged. Sprint 26 adds no new endpoints. The one behavioral amendment (T-221 cookie `SameSite`) is documented above.

| Sprint | Endpoint | Status | Sprint 26 Notes |
|--------|----------|--------|-----------------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | **T-221: `Set-Cookie` uses `SameSite=None; Secure` in production** |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | **T-221: `Set-Cookie` uses `SameSite=None; Secure` in production**. Rate limiting unchanged (10 req/15min). |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | **T-221: `Set-Cookie` uses `SameSite=None; Secure` in production** |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | **T-221: Clear-cookie uses `SameSite=None; Secure` in production** |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 25 | `GET /api/v1/trips/:id/calendar` | ✅ Agreed, Applied on Staging | Unchanged |

---

*Sprint 26 contracts published by Backend Engineer 2026-03-11. No new endpoints. One behavioral amendment: T-221 changes the `Set-Cookie` cookie attributes on all four auth endpoints in the production environment only (`SameSite=None; Secure` instead of `SameSite=Strict`). This is required for cross-origin auth to work between `triplanner-frontend.onrender.com` and `triplanner-backend.onrender.com`. Dev/staging cookie behavior is unchanged. Test baseline entering Sprint 26: 340/340 backend | 486/486 frontend | 0 vulnerabilities.*

---

## Sprint 27 — API Contracts

**Date:** 2026-03-11
**Published by:** Backend Engineer
**Sprint Goal:** Fix the CORS staging bug caused by ESM dotenv hoisting in `backend/src/index.js` (T-228 Fix B). No new features, no new API endpoints, no schema changes.

---

### Sprint 27 — No New API Endpoints

Sprint 27 introduces **zero new API endpoints and zero schema changes**. The sole Backend Engineer task (T-228 Fix B) is a pure code refactor internal to `backend/src/index.js`. The existing API surface is entirely unchanged.

| Task | Type | API Impact |
|------|------|------------|
| T-228 Fix B | Code refactor (ESM dotenv hoisting) | **Zero API surface change.** `backend/src/index.js` is refactored so that `dotenv.config()` loads before `app.js` is evaluated, ensuring `process.env.CORS_ORIGIN` is populated when the CORS middleware initialises. All endpoint signatures, request/response shapes, status codes, error codes, and auth logic remain unchanged. |

---

### T-228 — CORS Staging Fix: Technical Detail (Backend-Internal — No API Change)

**Sprint:** 27
**Task:** T-228 (Fix B — permanent code fix)
**Status:** Confirmed — No API contract change
**Auth Required:** N/A (internal refactor)

#### Root Cause

In `backend/src/index.js`, the top-level static ESM `import app from './app.js'` is hoisted by the JavaScript engine before any statement in the module body executes — including `dotenv.config()`. As a result, when `app.js` runs `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' })`, `CORS_ORIGIN` is still `undefined`, and the fallback `'http://localhost:5173'` is permanently captured as the allowed origin.

In the staging environment the correct value is `'https://localhost:4173'`, so every browser-initiated API call from the staging frontend is rejected with a CORS error.

#### Fix B — Refactor Strategy

Two acceptable approaches (implementer chooses one):

**Option A — Dynamic import (preferred for ESM purity):**
Convert the static `import app from './app.js'` to a dynamic `import()` inside an `async` IIFE that runs *after* `dotenv.config()`:

```js
import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load env FIRST — before any module that reads process.env is imported
const nodeEnv = process.env.NODE_ENV;
const envFile = nodeEnv ? `.env.${nodeEnv}` : null;
if (envFile && existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

// Now safe to import app (CORS_ORIGIN is populated)
const { default: app } = await import('./app.js');

// ... rest of server startup
```

**Option B — Move dotenv into app.js (simpler, no dynamic import):**
Make `backend/src/app.js` the single source of truth for env loading. Add `dotenv.config()` as the very first statement in `app.js`, before any middleware or route imports. Remove the env loading block from `index.js`.

#### Observable Behavior Change (Staging Only)

After Fix B is applied and staging is restarted, requests from `https://localhost:4173` will receive:

```
Access-Control-Allow-Origin: https://localhost:4173
Access-Control-Allow-Credentials: true
```

instead of the current incorrect:

```
Access-Control-Allow-Origin: http://localhost:5173
```

This is a **bug fix restoring correct behavior**, not a contract change. All endpoints behave identically; only the CORS response header is corrected to match the already-documented `CORS_ORIGIN` environment variable.

#### New Test: CORS Origin from Environment Variable

A new backend test (added as part of T-228) must assert that:

- When `process.env.CORS_ORIGIN` is set, the CORS middleware reflects it in the `Access-Control-Allow-Origin` header
- When `process.env.CORS_ORIGIN` is unset, the fallback `'http://localhost:5173'` is used

This test covers the regression surface introduced by the hoisting bug.

**Test locations:**
- `backend/src/__tests__/cors.test.js` (new) — or added to an existing integration test suite

**No schema changes. No migrations. No Deploy Engineer migration action required.**

---

### Sprint 27 — Schema State (Unchanged)

No new database migrations are introduced in Sprint 27.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–010 | 1–7 | Core tables, date ranges, nullable times, land travels, notes | ✅ Applied on Staging |
| — | 8–27 | *(No new migrations through Sprint 27)* | Schema-stable |

**Total migrations: 10 (001–010). All applied. No `knex migrate:latest` required for Sprint 27.**

---

### Sprint 27 — Complete Endpoint Inventory

All contracts from Sprints 1–26 remain in force unchanged. Sprint 27 adds no new endpoints.

| Sprint | Endpoint | Status | Sprint 27 Notes |
|--------|----------|--------|-----------------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | Unchanged. T-228 fix: CORS header will now correctly reflect `CORS_ORIGIN` env var |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | Unchanged. Rate limiting (10 req/15min) unchanged. |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/health` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 25 | `GET /api/v1/trips/:id/calendar` | ✅ Agreed, Applied on Staging | Unchanged |

---

*Sprint 27 contracts published by Backend Engineer 2026-03-11. No new endpoints. No schema changes. T-228 Fix B is a pure internal code refactor to resolve ESM dotenv hoisting — the CORS middleware will correctly read `process.env.CORS_ORIGIN` once the fix is applied. All endpoint contracts remain in force from prior sprints. Test baseline entering Sprint 27: 355/355 backend | 486/486 frontend.*

---

## Sprint 28 Contracts

---

### T-229 — Trip Date COALESCE Fix (Behavior Correction for `start_date` / `end_date`)

| Field | Value |
|-------|-------|
| Sprint | 28 |
| Task | T-229 |
| Type | Bug Fix |
| Status | **Agreed** *(automated sprint — self-approved per sprint rules)* |
| Feedback Source | FB-113 |
| Schema Changes | **None** — query-only fix; no new migration required |
| New Endpoints | **None** |

---

#### Background — What Was Broken

The `TRIP_COLUMNS` SQL constant in `backend/src/models/tripModel.js` defined `start_date` and `end_date` as **pure computed aggregates** — always using `LEAST()` / `GREATEST()` subqueries over flights, stays, activities, and land_travels. Migration `20260225_007_add_trip_date_range.js` (Sprint 16 / T-163) added `start_date DATE NULL` and `end_date DATE NULL` stored columns to the `trips` table, and `PATCH /api/v1/trips/:id` correctly writes user-provided values into those columns — but **TRIP_COLUMNS never read them back**. The aggregate subquery always overrode the stored values.

**Symptom (FB-113):** A user calls `PATCH /api/v1/trips/:id` with `{"start_date": "2026-09-01", "end_date": "2026-09-30"}` on a trip with no sub-resources. The database `UPDATE` writes the dates correctly. But the response (and all subsequent GETs) returns `"start_date": null, "end_date": null` because LEAST/GREATEST over empty subqueries returns `NULL`. The "Set dates" UI on TripDetailsPage appears to silently discard the input.

---

#### The Fix

The TRIP_COLUMNS SQL is updated to use `COALESCE`:

```sql
-- start_date (COALESCE — user-stored value takes precedence)
TO_CHAR(
  COALESCE(
    trips.start_date,
    LEAST(
      (SELECT MIN(DATE(departure_at)) FROM flights      WHERE trip_id = trips.id),
      (SELECT MIN(DATE(arrival_at))   FROM flights      WHERE trip_id = trips.id),
      (SELECT MIN(DATE(check_in_at))  FROM stays        WHERE trip_id = trips.id),
      (SELECT MIN(DATE(check_out_at)) FROM stays        WHERE trip_id = trips.id),
      (SELECT MIN(activity_date)      FROM activities   WHERE trip_id = trips.id),
      (SELECT MIN(departure_date)     FROM land_travels WHERE trip_id = trips.id),
      (SELECT MIN(arrival_date)       FROM land_travels WHERE trip_id = trips.id)
    )
  ),
  'YYYY-MM-DD'
) AS start_date

-- end_date (COALESCE — user-stored value takes precedence)
TO_CHAR(
  COALESCE(
    trips.end_date,
    GREATEST(
      (SELECT MAX(DATE(departure_at)) FROM flights      WHERE trip_id = trips.id),
      (SELECT MAX(DATE(arrival_at))   FROM flights      WHERE trip_id = trips.id),
      (SELECT MAX(DATE(check_in_at))  FROM stays        WHERE trip_id = trips.id),
      (SELECT MAX(DATE(check_out_at)) FROM stays        WHERE trip_id = trips.id),
      (SELECT MAX(activity_date)      FROM activities   WHERE trip_id = trips.id),
      (SELECT MAX(departure_date)     FROM land_travels WHERE trip_id = trips.id),
      (SELECT MAX(arrival_date)       FROM land_travels WHERE trip_id = trips.id)
    )
  ),
  'YYYY-MM-DD'
) AS end_date
```

**Precedence rule (new canonical behavior):**
1. If `trips.start_date` (stored) is non-null → return it as `start_date`
2. Else → return the computed LEAST aggregate across sub-resources (or `null` if no sub-resources)

Same rule applies to `end_date` via GREATEST.

---

#### Affected Endpoints — Behavior Change

All four trip-returning endpoints share the `TRIP_COLUMNS` constant and are affected by this fix. **No signature changes** — method, path, query parameters, auth requirements, and response shape are identical to prior sprint contracts. Only the **semantic value** of `start_date` and `end_date` in responses changes.

| Endpoint | Affected | Behavior Before Fix | Behavior After Fix |
|----------|----------|--------------------|--------------------|
| `GET /api/v1/trips` | ✅ | `start_date`/`end_date` always computed from sub-resources; user-stored values silently ignored | User-stored values take precedence; sub-resource aggregate used as fallback |
| `POST /api/v1/trips` | ✅ | If `start_date`/`end_date` provided at creation but no sub-resources exist → response returns `null` | Response correctly returns user-provided values |
| `GET /api/v1/trips/:id` | ✅ | Same as GET list | Same as GET list |
| `PATCH /api/v1/trips/:id` | ✅ | User-provided `start_date`/`end_date` written to DB but overridden at read time → response returns `null` | Response correctly returns user-provided values |

---

#### Updated Date Semantics — All Trip Responses

All trip objects returned by the four affected endpoints now follow this logic for `start_date` and `end_date`:

| Scenario | `start_date` returned | `end_date` returned |
|----------|----------------------|---------------------|
| User set dates via PATCH, no sub-resources exist | User-stored value (e.g. `"2026-09-01"`) | User-stored value (e.g. `"2026-09-30"`) |
| User set dates via PATCH, sub-resources exist with different dates | User-stored value (takes precedence) | User-stored value (takes precedence) |
| User never set dates (`trips.start_date` is NULL), sub-resources exist | Computed LEAST across sub-resources | Computed GREATEST across sub-resources |
| User never set dates, no sub-resources exist | `null` | `null` |
| User explicitly cleared dates (`PATCH` with `start_date: null`) | `null` (sub-resource fallback applies if events exist) | `null` (sub-resource fallback applies if events exist) |

**Key distinction:** Setting `start_date: null` via PATCH is the only way to re-enable sub-resource fallback. While `trips.start_date` is non-null, it always wins.

---

#### PATCH /api/v1/trips/:id — Reference Contract (Sprint 28 Behavior)

This is a summary re-statement of the PATCH contract with the corrected behavior. The full contract is documented in Sprint 2 and Sprint 4 above; only the `start_date`/`end_date` return semantics change.

**Method:** `PATCH`
**Path:** `/api/v1/trips/:id`
**Auth:** Bearer token (required)

**Request Body (unchanged from prior sprints):**
```json
{
  "name": "string (optional)",
  "destinations": ["string array (optional)"],
  "status": "PLANNING | ONGOING | COMPLETED (optional)",
  "start_date": "YYYY-MM-DD | null (optional)",
  "end_date": "YYYY-MM-DD | null (optional)"
}
```

**Success Response — 200 OK (corrected behavior after T-229):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka"],
    "status": "PLANNING",
    "notes": null,
    "start_date": "2026-09-01",
    "end_date": "2026-09-30",
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-03-11T10:00:00.000Z"
  }
}
```

> **Sprint 28 guarantee:** If the request body includes `"start_date": "2026-09-01"`, the response will return `"start_date": "2026-09-01"` — even if the trip has zero sub-resources. This was not guaranteed before T-229.

**Error Responses (unchanged from Sprint 2/4 contracts):**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `end_date` before `start_date`, invalid date format, no updatable fields provided |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 403 | `FORBIDDEN` | Trip belongs to another user |
| 404 | `NOT_FOUND` | Trip ID does not exist |

---

#### Test Requirements (new tests for T-229)

The following tests must be written in `backend/src/__tests__/trips.test.js`:

1. **Happy path — no sub-resources:**
   - PATCH `/api/v1/trips/:id` with `{"start_date": "2026-09-01", "end_date": "2026-09-30"}` on a trip with no flights/stays/activities/land_travels
   - Assert response `data.start_date === "2026-09-01"` and `data.end_date === "2026-09-30"` (not null)

2. **Happy path — sub-resources present with different computed dates:**
   - Create a trip; add a flight with `departure_at` in November 2026
   - PATCH the trip with `{"start_date": "2026-09-01", "end_date": "2026-09-30"}`
   - Assert response returns `"2026-09-01"` / `"2026-09-30"` (user values win over computed November dates)

3. **Fallback to computed aggregate:**
   - Create a trip where `trips.start_date` is NULL (never set); add a flight with `departure_at = "2026-08-15"`
   - GET `/api/v1/trips/:id`
   - Assert response `data.start_date === "2026-08-15"` (computed fallback)

4. **All 363+ existing tests must continue to pass.** T-229 is a read-time behavior change only — no writes are affected. Existing tests should not break.

---

#### No Schema Changes (T-229)

T-229 requires **no database migration**. The `trips.start_date` and `trips.end_date` columns already exist (added in migration `20260225_007_add_trip_date_range.js`). The COALESCE fix only changes the SELECT query in TRIP_COLUMNS — no DDL changes. No handoff to Deploy Engineer for a migration is required.

---

### Sprint 28 — All-Endpoints Reference

All contracts from Sprints 1–27 remain in force unchanged. Sprint 28 adds no new endpoints and no schema changes.

| Sprint | Endpoint | Status | Sprint 28 Notes |
|--------|----------|--------|-----------------|
| 1 | `POST /api/v1/auth/register` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/auth/login` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/auth/refresh` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/auth/logout` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/health` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips` | ✅ Agreed, Applied on Staging | **T-229:** `start_date`/`end_date` now use COALESCE (user-stored → computed fallback). Response shape unchanged. |
| 1 | `POST /api/v1/trips` | ✅ Agreed, Applied on Staging | **T-229:** If `start_date`/`end_date` provided at creation, response now correctly reflects them. |
| 1 | `GET /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | **T-229:** `start_date`/`end_date` now use COALESCE (user-stored → computed fallback). Response shape unchanged. |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | **T-229 PRIMARY FIX:** User-provided `start_date`/`end_date` are now correctly returned in response. See corrected semantics above. |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Agreed, Applied on Staging | Unchanged |
| 25 | `GET /api/v1/trips/:id/calendar` | ✅ Agreed, Applied on Staging | Unchanged |

---

*Sprint 28 contracts published by Backend Engineer 2026-03-11. No new endpoints. No schema changes. T-229 is a pure SQL query correction (COALESCE on TRIP_COLUMNS) — the only API-observable change is that `start_date`/`end_date` in trip responses now correctly reflect user-stored values when present, rather than always returning computed sub-resource aggregates. Test baseline entering Sprint 28: 363/363 backend | 486/486 frontend.*

---

## Sprint 29 Contracts

**Sprint #29 — 2026-03-16**

**Backend Engineer API Contract Review: NO NEW CONTRACTS REQUIRED**

Sprint 29 is a single-task sprint scoped exclusively to a Playwright E2E test locator bug (T-235 — test-code fix only). The active sprint explicitly assigns the Backend Engineer no tasks: *"No tasks this sprint (application complete)."*

**Contract Status:** All contracts from Sprints 1–28 remain in force, unchanged, and applied on staging.

**New Endpoints:** None

**Changed Endpoints:** None

**Schema Changes:** None. No migrations required.

### Sprint 29 — Full Contract Registry (Status Check)

All endpoints listed below are `✅ Agreed, Applied on Staging`. No changes from Sprint 28.

| Sprint | Endpoint | Sprint 29 Status |
|--------|----------|-----------------|
| 1 | `POST /api/v1/auth/register` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/login` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/refresh` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/logout` | ✅ Unchanged |
| 1 | `GET /api/v1/health` | ✅ Unchanged |
| 1 | `GET /api/v1/trips` | ✅ Unchanged (T-229 COALESCE semantics from Sprint 28 in effect) |
| 1 | `POST /api/v1/trips` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id` | ✅ Unchanged (T-229 COALESCE semantics from Sprint 28 in effect) |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Unchanged (T-229 user-date fix from Sprint 28 in effect) |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Unchanged |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 25 | `GET /api/v1/trips/:id/calendar` | ✅ Unchanged |

### Sprint 29 — QA Reference: Key Endpoint Behaviors Under Test

The following endpoint behaviors are relevant to T-235 (Playwright locator fix) and T-236 (Monitor health check) for QA reference:

**`GET /api/v1/trips/:id/calendar`** — Sprint 25 contract, unchanged
- Returns a unified timeline of all trip sub-resources (flights, stays, activities, land-travel) sorted by `start_datetime` ascending
- Flight events include `departure_airport` and `arrival_airport` (e.g., `"JFK"`, `"SFO"`) in the event payload
- These airport codes are rendered in multiple DOM locations by the frontend (TripCalendar pill, MobileDayList, and flight card `_airportCode_` div) — this is the root cause of the T-235 Playwright strict-mode violation; the API shape is correct and unchanged

**`PATCH /api/v1/trips/:id`** — T-229 regression check (T-236 Monitor protocol)
- Request: `{ "start_date": "2026-09-01", "end_date": "2026-09-30" }` (Bearer auth required)
- Expected response: `{ "data": { ..., "start_date": "2026-09-01", "end_date": "2026-09-30", ... } }`
- User-provided dates must be returned exactly as supplied (COALESCE fix from Sprint 28 confirmed by User Agent FB-123/FB-125)

---

*Sprint 29 contracts reviewed by Backend Engineer 2026-03-16. No new endpoints. No schema changes. No migrations. Application is MVP feature-complete — all 30 endpoints from Sprints 1–25 remain in force and applied on staging. Test baseline entering Sprint 29: 363/363 backend | 486/486 frontend (from Sprint 28 closeout).*

---

## Sprint 30 Contracts

**Sprint #30 — 2026-03-17**
**Published by:** Backend Engineer
**Date:** 2026-03-17
**Status:** Agreed — Auto-approved per automated sprint cycle

**Summary of changes:**

| Task | Endpoint | Change |
|------|----------|--------|
| T-238 | `PATCH /api/v1/trips/:id` | Audit confirms `status` field is correctly plumbed. Root bug identified: `computeTripStatus()` overrides stored `status` when both dates are set. Fix clarifies expected response contract. |
| T-240 | `POST /api/v1/trips/:id/flights`, `PATCH /api/v1/trips/:id/flights/:fid`, `GET /api/v1/trips/:id/flights` | Clarify `departure_at`/`arrival_at` MUST include timezone offset in writes. GET returns UTC ISO strings. |
| T-242 | `GET /api/v1/trips/:id/calendar` | Add `LAND_TRAVEL` as a new event type. Updated event type enum and derivation rules. |

---

### T-238 — Trip Status Persistence: Audit Findings & Corrected Contract

**Sprint:** 30
**Task:** T-238
**Date:** 2026-03-17
**Author:** Backend Engineer
**Status:** Agreed (auto-approved)

---

#### Audit Findings

Files audited: `backend/src/models/tripModel.js`, `backend/src/routes/trips.js`

**Backend plumbing — CORRECT:**
- `status` is present in the PATCH Joi/validate schema with `enum: ['PLANNING', 'ONGOING', 'COMPLETED']`
- `status` is in the `UPDATABLE_FIELDS` array in the PATCH route handler
- `updateTrip()` passes `{ ...processedUpdates, updated_at: new Date() }` to Knex — `status` is included with no filtering

**Root cause of bug identified — `computeTripStatus()` override:**
After `updateTrip()` succeeds, `findTripById()` is called to re-fetch the updated record. `findTripById()` applies `computeTripStatus()` to the returned row. `computeTripStatus()` checks whether both `start_date` and `end_date` are non-null on the trip. If both are present, it **recomputes** `status` from the dates, **ignoring the value just written to the DB**.

This means:
- PATCH `{"status": "ONGOING"}` on a trip with future dates → DB stores `ONGOING` correctly → `findTripById()` returns `PLANNING` (computed from future dates) → response shows `PLANNING`, not `ONGOING`
- PATCH `{"status": "ONGOING"}` on a trip with NO dates → `computeTripStatus()` short-circuits (no dates) → response correctly shows `ONGOING`

The stored value in the DB is always correct. The bug is read-time: `computeTripStatus()` unconditionally overrides any manually-set status when dates are present.

**Fix direction (T-238 implementation):** When `status` is explicitly stored in the DB (i.e., the user has patched it), it should take precedence over the date-computed value. The simplest correct fix: apply `COALESCE`-style logic in `computeTripStatus()` — if the trip has a non-null stored `status` in the DB that was explicitly set, honor it. A practical implementation: store a `status_override` flag, OR simply revert `computeTripStatus()` to only auto-compute status when the status field has never been explicitly PATCHed (i.e., is still the default `PLANNING`).

The recommended minimal fix for Sprint 30: remove the auto-compute override in `computeTripStatus()` entirely. Status should always reflect the stored DB value. Date-based auto-compute was a Sprint 3 feature (T-030) but is now causing more harm than good since users explicitly control status through the UI. The frontend TripStatusSelector (T-239) is the primary mechanism for status changes — the auto-compute adds confusion.

---

#### Corrected: PATCH /api/v1/trips/:id (status field behavior)

| Field | Value |
|-------|-------|
| Method | PATCH |
| Path | `/api/v1/trips/:id` |
| Sprint | 1 (updated Sprint 30 — T-238 status fix) |
| Task | T-238 |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Change from previous sprint:** The `status` field, when included in a PATCH request, MUST be reflected as-is in the 200 response. The date-based auto-computation (`computeTripStatus()`) MUST NOT override a user-supplied status value.

**Corrected status field contract:**

| Scenario | Before fix (broken) | After fix (correct) |
|----------|--------------------|--------------------|
| PATCH `{"status":"ONGOING"}` on trip with future dates | Response returns `"PLANNING"` (computed from dates) | Response returns `"ONGOING"` (user-set value) |
| PATCH `{"status":"COMPLETED"}` on trip with future dates | Response returns `"PLANNING"` | Response returns `"COMPLETED"` |
| GET trip with future dates (no explicit PATCH to status) | Returns `"PLANNING"` (computed) | Returns stored `status` (no auto-compute) |

**All status values accepted by PATCH:**

| Value | Description |
|-------|-------------|
| `"PLANNING"` | Trip in planning phase |
| `"ONGOING"` | Trip currently in progress |
| `"COMPLETED"` | Trip completed |

**Request body (status-only PATCH):**
```json
{ "status": "ONGOING" }
```

**Response (Success — 200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Japan 2026",
    "destinations": ["Tokyo", "Osaka", "Kyoto"],
    "status": "ONGOING",
    "start_date": "2026-08-07",
    "end_date": "2026-08-21",
    "notes": null,
    "created_at": "2026-02-24T12:00:00.000Z",
    "updated_at": "2026-03-17T10:00:00.000Z"
  }
}
```

The `status` field in the response MUST equal the value sent in the PATCH request body.

**Error responses (unchanged):**

| HTTP Status | Code | Condition |
|-------------|------|-----------|
| 400 | `VALIDATION_ERROR` | `status` value not in `["PLANNING", "ONGOING", "COMPLETED"]` |
| 400 | `NO_UPDATABLE_FIELDS` | Request body contains no recognized fields |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 403 | `FORBIDDEN` | Trip belongs to another user |
| 404 | `NOT_FOUND` | Trip ID does not exist |

**Test cases required (T-238):**

| # | Scenario | Expected |
|---|----------|----------|
| 1 | PATCH `{"status":"ONGOING"}` on trip with future `start_date`/`end_date` → 200 | `data.status === "ONGOING"` |
| 2 | PATCH `{"status":"COMPLETED"}` on trip with future dates → GET same trip → 200 | `data.status === "COMPLETED"` |
| 3 | PATCH `{"status":"PLANNING"}` on trip → 200 | `data.status === "PLANNING"` |
| 4 | All three transitions verified: PLANNING→ONGOING, ONGOING→COMPLETED, COMPLETED→PLANNING | Each transition round-trips correctly |

**No schema changes.** `status` column already exists in `trips` table. Fix is purely in `tripModel.js` read-time computation logic.

---

### T-240 — Flight Timezone: Clarified departure_at / arrival_at Contract

**Sprint:** 30
**Task:** T-240
**Date:** 2026-03-17
**Author:** Backend Engineer
**Status:** Agreed (auto-approved)

---

#### Audit Findings

Files audited: `backend/src/models/flightModel.js`, `backend/src/models/calendarModel.js`, `backend/src/migrations/20260227_009_create_land_travels.js` (flights schema via prior migrations)

**Storage column type:** `departure_at` and `arrival_at` are stored as `TIMESTAMPTZ` (timestamp with timezone) in PostgreSQL.

**Root cause of timezone shift (FB-131):**
PostgreSQL's TIMESTAMPTZ stores all values internally as UTC. When the application receives an ISO 8601 string **without** a timezone offset (e.g., `"2026-08-07T06:50:00"`), PostgreSQL interprets it in the **database server's session timezone** (typically UTC for Node.js/Knex applications). A user entering `6:50 AM ET (UTC-4)` who sends `"2026-08-07T06:50:00"` (no offset) has that value stored as `2026-08-07T06:50:00Z` — four hours ahead of the intended time.

When `calendarModel.js` later converts the stored UTC value back using `departure_tz = "America/New_York"`, it produces `2:50 AM ET` — a ~4h shift matching FB-131.

**Correct pipeline:**
1. User enters `6:50 AM ET`
2. Frontend sends `"2026-08-07T06:50:00-04:00"` (ISO 8601 with UTC offset) to API
3. PostgreSQL converts to UTC: `"2026-08-07T10:50:00Z"` stored internally
4. `calendarModel.js` converts: UTC 10:50 + `"America/New_York"` → `6:50 AM ET` ✓
5. GET response returns UTC ISO string: `"2026-08-07T10:50:00.000Z"`

---

#### Clarified: POST /api/v1/trips/:id/flights (departure_at / arrival_at fields)

| Field | Value |
|-------|-------|
| Method | POST |
| Path | `/api/v1/trips/:id/flights` |
| Sprint | 1 (clarified Sprint 30 — T-240) |
| Task | T-240 |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Change from Sprint 1:** Explicit clarification that `departure_at` and `arrival_at` values sent in the request body MUST include a UTC offset (e.g., `"2026-08-07T06:50:00-04:00"`) or a `Z` suffix for UTC (`"2026-08-07T10:50:00Z"`). Sending a naive ISO string without offset (e.g., `"2026-08-07T06:50:00"`) will cause the timezone shift bug (FB-131). No request/response shape changes — this is a clarification of the expected value format.

**`departure_at` / `arrival_at` field contract:**

| Field | Required | Type | Format | Notes |
|-------|----------|------|--------|-------|
| `departure_at` | Yes | string | ISO 8601 with UTC offset | MUST include offset: `"2026-08-07T06:50:00-04:00"` or `"2026-08-07T10:50:00Z"`. Naive strings (no offset) are rejected with 400. |
| `arrival_at` | Yes | string | ISO 8601 with UTC offset | Same requirement as `departure_at`. Must be after `departure_at`. |
| `departure_tz` | Yes | string | IANA timezone name | e.g., `"America/New_York"`. Used for display conversion on GET. |
| `arrival_tz` | Yes | string | IANA timezone name | e.g., `"America/Los_Angeles"`. Used for display conversion on GET. |

**New validation error (400) added for naive datetime strings:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": {
      "departure_at": "departure_at must be an ISO 8601 datetime string with timezone offset (e.g., 2026-08-07T06:50:00-04:00)"
    }
  }
}
```

**GET /api/v1/trips/:id/flights — departure_at / arrival_at response format:**

`departure_at` and `arrival_at` in GET responses are returned as UTC ISO 8601 strings (what PostgreSQL returns from a TIMESTAMPTZ column), e.g.:
```json
{
  "departure_at": "2026-08-07T10:50:00.000Z",
  "arrival_at": "2026-08-07T14:35:00.000Z",
  "departure_tz": "America/New_York",
  "arrival_tz": "America/New_York"
}
```

The **frontend is responsible** for converting the UTC `departure_at` + `departure_tz` into local display time using `Intl.DateTimeFormat`. This matches the pattern used in `calendarModel.js`.

**Example round-trip (T-240 acceptance test):**

| Step | Value |
|------|-------|
| Frontend sends | `"departure_at": "2026-08-07T06:50:00-04:00"`, `"departure_tz": "America/New_York"` |
| PostgreSQL stores | `2026-08-07T10:50:00Z` (UTC internally) |
| GET returns | `"departure_at": "2026-08-07T10:50:00.000Z"` |
| Frontend displays | `new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date("2026-08-07T10:50:00.000Z"))` → `"6:50 AM"` ✓ |

This same contract applies to `PATCH /api/v1/trips/:id/flights/:fid` for any updates to `departure_at` or `arrival_at`.

**No schema changes.** Flights table columns are already TIMESTAMPTZ. Fix is in input validation (reject naive strings) and frontend datetime construction.

---

### T-242 — Calendar Endpoint: Add LAND_TRAVEL Event Type

**Sprint:** 30
**Task:** T-242
**Date:** 2026-03-17
**Author:** Backend Engineer
**Status:** Agreed (auto-approved)

---

#### Overview

`GET /api/v1/trips/:id/calendar` currently returns events for `FLIGHT`, `STAY`, and `ACTIVITY` types only. Land travel entries (trains, buses, rental cars, etc.) exist in the `land_travels` table but are not included. This task adds `LAND_TRAVEL` to the calendar event array.

**No new endpoint.** Only the response shape of the existing `GET /api/v1/trips/:id/calendar` endpoint changes.

---

#### Updated: GET /api/v1/trips/:id/calendar

| Field | Value |
|-------|-------|
| Method | GET |
| Path | `/api/v1/trips/:id/calendar` |
| Sprint | 25 (updated Sprint 30 — T-242) |
| Task | T-242 |
| Status | Agreed |
| Auth Required | Yes — Bearer token |

**Change from Sprint 25:** The `type` enum is extended from `"FLIGHT | STAY | ACTIVITY"` to `"FLIGHT | LAND_TRAVEL | STAY | ACTIVITY"`. A new derivation rule is added for `LAND_TRAVEL` events. All existing event shapes are unchanged.

**Updated event type field:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `type` | enum | No | One of: `FLIGHT`, `LAND_TRAVEL`, `STAY`, `ACTIVITY` *(updated — LAND_TRAVEL added)* |

**New: LAND_TRAVEL events (sourced from `land_travels` table)**

| Calendar field | Derived from | Notes |
|----------------|-------------|-------|
| `id` | `"land-travel-" + land_travel.id` | Composite ID — prefix matches pattern of other event types |
| `type` | `"LAND_TRAVEL"` | Literal string |
| `title` | `"{mode} — {from_location} → {to_location}"` | e.g., `"TRAIN — Tokyo → Osaka"`. Mode is the raw enum value (RENTAL_CAR, BUS, TRAIN, RIDESHARE, FERRY, OTHER) |
| `start_date` | `land_travel.departure_date` | Already stored as `DATE` (`YYYY-MM-DD`) — used directly, no conversion |
| `end_date` | `land_travel.arrival_date ?? land_travel.departure_date` | If `arrival_date` is null (same-day or unknown), falls back to `departure_date` |
| `start_time` | `land_travel.departure_time` normalized to `HH:MM`, or `null` | Normalize PostgreSQL `TIME` value (`HH:MM:SS`) by slicing to first 5 chars. `null` if departure_time is null. |
| `end_time` | `land_travel.arrival_time` normalized to `HH:MM`, or `null` | Same normalization as `start_time`. `null` if arrival_time is null. |
| `timezone` | `null` | Land travels do not have a timezone column — they use date/time columns directly |
| `source_id` | `land_travel.id` | Original UUID from `land_travels` table |

**Updated sort ordering (unchanged algorithm — LAND_TRAVEL included):**
1. `start_date` ASC
2. `start_time` ASC NULLS LAST
3. `type` ASC alphabetical tiebreaker: `ACTIVITY` < `FLIGHT` < `LAND_TRAVEL` < `STAY`

**Updated response example (with LAND_TRAVEL event):**

```json
{
  "data": {
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "events": [
      {
        "id": "flight-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "type": "FLIGHT",
        "title": "JAL JL7 — JFK → NRT",
        "start_date": "2026-08-07",
        "end_date": "2026-08-08",
        "start_time": "06:50",
        "end_time": "09:30",
        "timezone": "America/New_York",
        "source_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      },
      {
        "id": "land-travel-d4e5f6a7-b8c9-0123-def0-234567890123",
        "type": "LAND_TRAVEL",
        "title": "TRAIN — Tokyo → Osaka",
        "start_date": "2026-08-12",
        "end_date": "2026-08-12",
        "start_time": "10:00",
        "end_time": "12:30",
        "timezone": null,
        "source_id": "d4e5f6a7-b8c9-0123-def0-234567890123"
      },
      {
        "id": "stay-b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "type": "STAY",
        "title": "Park Hyatt Tokyo",
        "start_date": "2026-08-08",
        "end_date": "2026-08-15",
        "start_time": "15:00",
        "end_time": "11:00",
        "timezone": "Asia/Tokyo",
        "source_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
      }
    ]
  }
}
```

**Error responses (unchanged from Sprint 25):**

| HTTP Status | Code | Condition |
|-------------|------|-----------|
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 403 | `FORBIDDEN` | Trip belongs to another user |
| 404 | `NOT_FOUND` | Trip ID does not exist |

**Implementation note for `calendarModel.js`:**
Add a `land_travels` query to the existing `Promise.all()` in `getCalendarEvents()`, then map results through a new `landTravelToEvent()` transformer function. The query selects: `id`, `mode`, `from_location`, `to_location`, `departure_date`, `departure_time`, `arrival_date`, `arrival_time`.

```js
// Query to add to Promise.all:
db('land_travels')
  .where({ trip_id: tripId })
  .select('id', 'mode', 'from_location', 'to_location',
          'departure_date', 'departure_time', 'arrival_date', 'arrival_time')
```

`departure_date` and `arrival_date` are `DATE` columns — Knex returns them as JavaScript `Date` objects by default. Use `TO_CHAR(departure_date, 'YYYY-MM-DD')` in the query (same pattern as `activityModel.js` for `activity_date`) to ensure the value is a plain `YYYY-MM-DD` string, not a JS Date.

**Test cases required (T-242):**

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Trip with no land travels → GET calendar | No `LAND_TRAVEL` events in response |
| 2 | Trip with 1 land travel (with departure and arrival times) → GET calendar | 1 `LAND_TRAVEL` event with correct `title`, `start_date`, `end_date`, `start_time`, `end_time` |
| 3 | Trip with 1 land travel where `arrival_date` is null → GET calendar | `end_date` equals `start_date` (departure fallback) |
| 4 | Trip with 1 land travel where `departure_time` and `arrival_time` are null → GET calendar | `start_time` and `end_time` are `null` |
| 5 | Trip with mixed events (FLIGHT + LAND_TRAVEL + STAY + ACTIVITY) → GET calendar | All event types present, sorted correctly by start_date/start_time |
| 6 | All existing calendar tests (FLIGHT, STAY, ACTIVITY) still pass | No regressions |

**No schema changes.** `land_travels` table exists since Sprint 6 (migration 009). No new migrations required.

---

### Sprint 30 — Schema State (No Changes)

No database migrations are introduced in Sprint 30. All three Sprint 30 backend tasks (T-238, T-240, T-242) are code-only fixes — no DDL changes required.

| # | Sprint | Description | Status |
|---|--------|-------------|--------|
| 001–006 | 1 | Core tables (users, refresh_tokens, trips, flights, stays, activities) | ✅ Applied on Staging |
| 007 | 2 | Add `start_date` + `end_date` to `trips` | ✅ Applied on Staging |
| 008 | 3 | Make `start_time`/`end_time` nullable on `activities` | ✅ Applied on Staging |
| 009 | 6 | Create `land_travels` table | ✅ Applied on Staging |
| 010 | 7 | Add `notes TEXT NULL` to `trips` | ✅ Applied on Staging |
| — | 8–29 | *(No new migrations)* | Sprints 8–29 schema-stable |
| — | **30** | *(No new migrations)* | **Sprint 30: code fixes only — zero schema work** |

**Total migrations on staging: 10 (001–010). All applied. None pending.**

**Deploy Engineer: No migration step required for Sprint 30.**

---

### Sprint 30 — All-Endpoints Reference

| Sprint | Endpoint | Sprint 30 Status |
|--------|----------|-----------------|
| 1 | `POST /api/v1/auth/register` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/login` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/refresh` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/logout` | ✅ Unchanged |
| 1 | `GET /api/v1/health` | ✅ Unchanged |
| 1 | `GET /api/v1/trips` | ✅ Unchanged |
| 1 | `POST /api/v1/trips` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id` | ⚠️ **T-238 behavior fix** — `status` field now always reflects patched value; `computeTripStatus()` date-override removed |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/flights` | ⚠️ **T-240 clarification** — `departure_at`/`arrival_at` returned as UTC ISO strings; frontend converts to local using `*_tz` |
| 1 | `POST /api/v1/trips/:id/flights` | ⚠️ **T-240 clarification** — `departure_at`/`arrival_at` MUST include UTC offset; naive strings rejected with 400 |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ⚠️ **T-240 clarification** — same `departure_at`/`arrival_at` offset requirement as POST |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Unchanged |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 25 | `GET /api/v1/trips/:id/calendar` | ⚠️ **T-242 new event type** — `LAND_TRAVEL` added to event type enum and response |

---

*Sprint 30 contracts published by Backend Engineer 2026-03-17. Three changes: (1) T-238 — PATCH /trips/:id status behavior fix (computeTripStatus override removed, stored value always returned); (2) T-240 — Flight datetime fields clarified to require UTC offset in writes, return UTC ISO strings in reads; (3) T-242 — Calendar endpoint extended with LAND_TRAVEL event type from land_travels table. No schema changes. No migrations. Auto-approved per automated sprint cycle. Test baseline entering Sprint 30: 363/363 backend | 486/486 frontend.*

---

## Sprint 31 Contracts

**Sprint #31 — 2026-03-20**
**Published by:** Backend Engineer
**Date:** 2026-03-20
**Status:** Confirmed — No new or changed API contracts this sprint

---

### Overview

Sprint #31 backend task is **T-250: Fix `knexfile.js` staging seeds configuration gap**. This is a pure server-side configuration fix. No new API endpoints are introduced, no existing endpoint contracts change, and no DDL schema migrations are required.

| Task | Type | Contract Impact |
|------|------|----------------|
| T-250 | Config fix (`knexfile.js` staging seeds block) | ✅ None — internal config only, no API surface change |

---

### T-250 — knexfile.js Staging Seeds Config Fix

**Sprint:** 31
**Task:** T-250
**Date:** 2026-03-20
**Author:** Backend Engineer
**Status:** Confirmed — No API contract changes

#### Summary

The `staging` environment block in `backend/src/config/knexfile.js` is missing `seeds: { directory: seedsDir }`. This causes `NODE_ENV=staging npm run seed` to fail with `ENOENT` because Knex cannot locate the seeds directory. The `development` block has the correct `seeds` config and serves as the workaround today.

**Fix:** Add `seeds: { directory: seedsDir }` to the `staging` environment block in `knexfile.js`, matching the pattern already used in the `development` block. `seedsDir` is already defined at the top of the file and shared across environments.

#### API Impact

**None.** This fix affects only the Knex configuration used by CLI seed commands (`knex seed:run` / `npm run seed`). It has zero effect on:

- Any REST API endpoint (no routes added, changed, or removed)
- Request or response shapes
- Authentication behavior
- Database schema (no DDL — no new tables, columns, or indexes)
- The existing `development` or `production` knexfile blocks (those are not touched)

#### What Changes

| File | Change |
|------|--------|
| `backend/src/config/knexfile.js` | Add `seeds: { directory: seedsDir }` to the `staging` environment block |
| Backend test file | Add 1 unit test: staging config object includes `seeds.directory === seedsDir` |

#### Verification (QA reference)

| Check | Expected result |
|-------|----------------|
| `config.staging.seeds.directory` | Equals `seedsDir` (the path already computed at top of knexfile) |
| `config.development.seeds.directory` | Unchanged — still equals `seedsDir` |
| `config.production.seeds` | Unchanged — not modified by this fix |
| `NODE_ENV=staging npm run seed` | Resolves seeds directory without `ENOENT` |
| All 402+ existing backend tests | Still pass — no logic changed |

#### Schema Changes

None. Migration log remains at **10 applied migrations (001–010)**. No `knex migrate:latest` is required for Sprint 31.

---

### All Existing Contracts — Sprint 31 Status

All 30 endpoints defined across Sprints 1–30 remain in force and unchanged.

| Sprint | Endpoint | Sprint 31 Status |
|--------|----------|-----------------|
| 1 | `POST /api/v1/auth/register` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/login` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/refresh` | ✅ Unchanged |
| 1 | `POST /api/v1/auth/logout` | ✅ Unchanged |
| 1 | `GET /api/v1/trips` | ✅ Unchanged |
| 1 | `POST /api/v1/trips` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id` | ✅ Unchanged (T-238 fix applied in Sprint 30 — no further changes) |
| 1 | `DELETE /api/v1/trips/:id` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/flights` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/flights` | ✅ Unchanged (T-240 clarification applied in Sprint 30) |
| 1 | `GET /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/flights/:fid` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/stays` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/stays` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/stays/:sid` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/activities` | ✅ Unchanged |
| 1 | `POST /api/v1/trips/:id/activities` | ✅ Unchanged |
| 1 | `GET /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 1 | `PATCH /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 1 | `DELETE /api/v1/trips/:id/activities/:aid` | ✅ Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel` | ✅ Unchanged |
| 6 | `POST /api/v1/trips/:id/land-travel` | ✅ Unchanged |
| 6 | `GET /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 6 | `PATCH /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 6 | `DELETE /api/v1/trips/:id/land-travel/:lid` | ✅ Unchanged |
| 25 | `GET /api/v1/trips/:id/calendar` | ✅ Unchanged (T-242 LAND_TRAVEL integration complete in Sprint 30) |

---

*Sprint 31 contracts published by Backend Engineer 2026-03-20. No new endpoints. No contract changes. No schema migrations. T-250 is a pure knexfile.js config fix (staging seeds directory) with zero API surface impact. All 30 endpoints from Sprints 1–30 remain in force. Test baseline entering Sprint 31: 402/402 backend | 495/495 frontend | 4/4 Playwright.*

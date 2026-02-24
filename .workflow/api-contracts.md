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

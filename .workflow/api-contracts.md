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

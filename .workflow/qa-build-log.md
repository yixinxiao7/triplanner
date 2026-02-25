# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Log Fields

| Field | Description |
|-------|-------------|
| Test Run | Short description of what was tested |
| Sprint | Sprint number |
| Test Type | Unit Test, Integration Test, E2E Test, Post-Deploy Health Check, Security Scan, Performance Test |
| Result | Pass, Fail, Partial |
| Build Status | Success, Failed, Skipped |
| Environment | Local, Staging, Production |
| Deploy Verified | Yes / No (Monitor Agent confirms post-deploy health) |
| Tested By | Which agent ran the test |
| Error Summary | What went wrong (if applicable) |
| Related Tasks | Task IDs from dev-cycle-tracker.md |
| Notes | Additional context |

---

## Sprint 1 Entries

| Test Run | Test Type | Result | Build Status | Environment | Deploy Verified | Tested By | Error Summary |
|----------|-----------|--------|-------------|-------------|-----------------|-----------|---------------|
| Backend unit tests — 60 tests across all routes | Unit Test | Pass | Success | Local | No | QA Engineer | None |
| Frontend unit tests — 128 tests across all components/hooks | Unit Test | Pass | Success | Local | No | QA Engineer | None |
| Frontend ↔ Backend contract adherence (code review) | Integration Test | Pass | Success | Local | No | QA Engineer | None |
| Security checklist — all 19 applicable items | Security Scan | Pass | Success | Local | No | QA Engineer | 1 known accepted risk: rate limiting not applied (see notes) |
| npm audit — backend + frontend dependencies | Security Scan | Pass | Success | Local | No | QA Engineer | 5 moderate vulns in dev deps only (esbuild/vite/vitest) — no production impact |

---

## Sprint 1 — Detailed QA Report (2026-02-24)

**QA Engineer:** QA Agent
**Sprint:** 1
**Date:** 2026-02-24
**Tasks In Scope:** T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-017

---

### Test Run 1 — Backend Unit Tests

**Command:** `cd backend && npm test -- --run`
**Duration:** 493ms
**Result:** ✅ PASS — 60/60 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `auth.test.js` | 14 | ✅ PASS |
| `trips.test.js` | 16 | ✅ PASS |
| `flights.test.js` | 10 | ✅ PASS |
| `stays.test.js` | 8 | ✅ PASS |
| `activities.test.js` | 12 | ✅ PASS |

**Coverage verification (happy-path + error-path per endpoint):**

| Endpoint Group | Happy Path | Error Paths Covered |
|---------------|-----------|---------------------|
| POST /auth/register | ✅ 201 + access_token + user object | ✅ 409 EMAIL_TAKEN, 400 missing fields, 400 short password, 400 invalid email |
| POST /auth/login | ✅ 200 + access_token | ✅ 401 user not found, 401 wrong password, 400 missing fields |
| POST /auth/refresh | ✅ 200 new access_token | ✅ 401 no cookie, 401 token not in DB |
| POST /auth/logout | ✅ 204 | ✅ 401 no auth header |
| GET /trips | ✅ 200 list + pagination | ✅ 401 no token |
| POST /trips | ✅ 201 new trip | ✅ 400 validation error, 401 |
| GET /trips/:id | ✅ 200 trip | ✅ 404 not found, 403 wrong user, 401 |
| PATCH /trips/:id | ✅ 200 updated trip | ✅ 404, 403, 400 no updatable fields, 401 |
| DELETE /trips/:id | ✅ 204 | ✅ 404, 403, 401 |
| GET + POST + PATCH + DELETE /trips/:id/flights | ✅ all operations | ✅ 400, 401, 403, 404 per operation |
| GET + POST + PATCH + DELETE /trips/:id/stays | ✅ all operations | ✅ 400, 401, 403, 404 per operation |
| GET + POST + PATCH + DELETE /trips/:id/activities | ✅ all operations | ✅ 400, 401, 403, 404 per operation |

**Notes:** All models mocked with vitest `vi.mock`. No DB dependency in unit tests. 100% of tests pass.

---

### Test Run 2 — Frontend Unit Tests

**Command:** `cd frontend && npm test -- --run`
**Duration:** 2.04s
**Result:** ✅ PASS — 128/128 tests

| Test File | Tests | Result |
|-----------|-------|--------|
| `LoginPage.test.jsx` | 9 | ✅ PASS |
| `RegisterPage.test.jsx` | 8 | ✅ PASS |
| `Navbar.test.jsx` | 6 | ✅ PASS |
| `StatusBadge.test.jsx` | 4 | ✅ PASS |
| `TripCard.test.jsx` | 7 | ✅ PASS |
| `CreateTripModal.test.jsx` | 8 | ✅ PASS |
| `HomePage.test.jsx` | 14 | ✅ PASS |
| `useTrips.test.js` | 11 | ✅ PASS |
| `TripDetailsPage.test.jsx` | 31 | ✅ PASS |
| `useTripDetails.test.js` | 21 | ✅ PASS |
| `formatDate.test.js` | 9 | ✅ PASS |

**State coverage per component:**

| Component | Empty | Loading | Error | Success |
|-----------|-------|---------|-------|---------|
| LoginPage | N/A | ✅ | ✅ (401 banner, 500 banner) | ✅ |
| RegisterPage | N/A | ✅ | ✅ (field errors, 409, 500) | ✅ |
| Navbar | N/A | N/A | N/A | ✅ |
| HomePage | ✅ (empty state + CTA) | ✅ (skeleton cards) | ✅ (retry button) | ✅ (trip grid) |
| TripDetailsPage | ✅ (per-section dashed empty states) | ✅ (skeleton) | ✅ (per-section retry + 404 full-page) | ✅ (cards) |
| CreateTripModal | N/A | ✅ (spinner) | ✅ (validation) | ✅ (navigate to /trips/:id) |

**Warnings:** React Router v6 future-flag warnings in stderr during tests — expected, non-blocking (confirmed by Manager review notes on T-016 and T-017).

---

### Test Run 3 — Integration Contract Verification

**Method:** Code review of frontend API calls vs api-contracts.md
**Result:** ✅ PASS

**Auth flow integration:**
- ✅ POST /auth/register: `api.auth.register({name, email, password})` → consumes `{data: {user, access_token}}`
- ✅ POST /auth/login: `api.auth.login({email, password})` → consumes `{data: {user, access_token}}`
- ✅ Access token in-memory: stored in `accessTokenRef` (React useRef) — confirmed NOT in localStorage/sessionStorage
- ✅ Refresh cookie: `withCredentials: true` on axios instance — browser sends httpOnly cookie automatically
- ✅ 401 interceptor: catches 401, calls POST /auth/refresh, retries original request with new token
- ✅ Interceptor guards: skips retry loop for /auth/refresh and /auth/login requests
- ✅ 409 EMAIL_TAKEN → RegisterPage shows email field-level error (not banner)
- ✅ 401 INVALID_CREDENTIALS → LoginPage shows error banner above form (not field error)

**Trips flow integration:**
- ✅ GET /trips: uses `response.data.data` (array) to set trips state
- ✅ POST /trips: destinations form field (comma-string) converted to array before POST — confirmed in useTrips.createTrip
- ✅ After POST /trips: navigate to `/trips/${newTrip.id}` — uses returned `id` field
- ✅ DELETE /trips/:id: 204 (no body) handled correctly — no JSON parsing attempted
- ✅ 404 on GET /trips/:id: `tripError.type = 'not_found'` → full-page "trip not found." error state
- ⚠️ NOTE: 403 on GET /trips/:id treated as generic network error (type: 'network') — no redirect to home. Acceptable for Sprint 1 as users will only access their own trips.

**Sub-resources integration:**
- ✅ GET /trips/:tripId/flights, stays, activities — correct URL format confirmed in api.js
- ✅ All 3 sub-resources fetched in parallel via `Promise.allSettled()` in useTripDetails.fetchAll
- ✅ Each sub-resource has independent error state — one failure does not block others
- ✅ Empty array `[]` response correctly maps to empty state (not error)
- ✅ Activities grouped by `activity_date`, sorted by `start_time` (lexicographic HH:MM:SS — correct for this format)
- ✅ Timezone display: formatDate.js uses `Intl.DateTimeFormat` with `timeZone: tz` parameter

**UI spec adherence:**
- ✅ Calendar placeholder shows "calendar coming in sprint 2"
- ✅ "Add flight/stay/activity" buttons rendered but disabled (`disabled`, `aria-disabled="true"`)
- ✅ Navbar sticky 56px bar with TRIPLANNER brand + username (truncated 20 chars) + sign out button
- ✅ Home page: 3-column CSS Grid layout with skeleton loading, empty state CTA, inline delete confirmation
- ✅ Trip Details: per-section independent loading/error/empty/success states

---

### Test Run 4 — Security Scan

**Method:** Code review + grep analysis against security-checklist.md
**Result:** ✅ PASS WITH ONE KNOWN ACCEPTED RISK

#### Authentication & Authorization

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| All API endpoints require appropriate auth | ✅ PASS | `router.use(authenticate)` on all trip/flight/stay/activity routers. Auth endpoints: logout requires Bearer token; register/login/refresh are public by design. |
| Role-based access control enforced | ✅ PASS | `trip.user_id !== req.user.id` → 403 FORBIDDEN in trips.js, flights.js, stays.js, activities.js. Ownership checked on EVERY sub-resource operation. |
| Auth tokens: appropriate expiration + refresh | ✅ PASS | Access: 15m (`JWT_EXPIRES_IN`), Refresh: 7 days. Token rotation on refresh (old revoked, new issued via `revokeRefreshToken` + `createRefreshToken`). |
| Password hashing: bcrypt min 12 rounds | ✅ PASS | `bcrypt.hash(password, 12)` confirmed in routes/auth.js. Timing-safe login: `DUMMY_HASH` used for bcrypt.compare even when user not found (prevents email enumeration). |
| Failed login rate-limited | ⚠️ **KNOWN ACCEPTED RISK** | `express-rate-limit` installed in package.json but NOT applied to any route (grep confirms no `rateLimit` usage anywhere in backend/src). Pre-identified in T-010 Manager code review as known staging risk. Accepted for Sprint 1. **Recommendation: Apply rate limiting to /auth/login and /auth/register in Sprint 2.** |

#### Input Validation & Injection Prevention

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| All user inputs validated server-side | ✅ PASS | `validate()` middleware covers: required, type (string/email/array/isoDate/dateString/isoTime), minLength, maxLength, minItems, maxItems, enum, custom (temporal ordering for dates/times). Applied to every POST and PATCH endpoint. |
| SQL queries parameterized (no string concat) | ✅ PASS | All model files (userModel, tripModel, flightModel, stayModel, activityModel, refreshTokenModel) use Knex builder methods exclusively. `.where({})`, `.where(db.raw('LOWER(email)'), param)`, `.insert()`, `.update()`, `.returning()` — zero string concatenation confirmed by code review. |
| XSS prevention | ✅ PASS | Frontend uses React JSX auto-escaping for all user data. Confirmed by grep: no `dangerouslySetInnerHTML`, `innerHTML`, or `eval()` in any frontend source file. |

#### API Security

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| CORS configured correctly | ✅ PASS | `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true })` — restricted to specific origin, not wildcard. `credentials: true` required for httpOnly cookie transport. |
| Rate limiting on public endpoints | ⚠️ KNOWN RISK | See above — not applied. |
| Error responses don't leak internals | ✅ PASS | `errorHandler.js`: 500 status → generic "An unexpected error occurred" message. Stack trace logged server-side only. Error shape always `{error: {message, code}}`. Confirmed no stack traces in responses. |
| Sensitive data not in URL params | ✅ PASS | Auth tokens in `Authorization: Bearer` header and httpOnly cookies. No tokens in query strings or URL paths. |
| Security headers | ✅ PASS | `helmet()` applied in app.js. Sets: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, removes `X-Powered-By: Express`, sets HSTS in production. |

#### Data Protection

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| Sensitive data at rest protected | ✅ PASS | Passwords: bcrypt hashes only. `createUser()` returns `['id', 'name', 'email', 'created_at']` — password_hash excluded from all responses. Test in auth.test.js confirms `password_hash` is `undefined` in register response. |
| DB credentials/API keys in env vars | ✅ PASS | `.env` file is gitignored. `.env.example` has placeholder values only (e.g., `JWT_SECRET=change-me-to-a-random-string`). Grep of backend/src confirms no hardcoded secrets in any source file. |
| Refresh tokens stored as hash | ✅ PASS | `refreshTokenModel.js`: `crypto.createHash('sha256').update(rawToken).digest('hex')`. Raw token generated with `crypto.randomBytes(40)` — only hash persisted. Raw token sent via httpOnly cookie only. |
| Logs don't contain PII/passwords/tokens | ✅ PASS | No `console.log` in any route handler (grep confirmed). errorHandler.js logs `err.stack` (no user data). Access token never logged. |

#### Infrastructure

| Checklist Item | Status | Evidence |
|---------------|--------|---------|
| HTTPS enforced | ⚠️ PENDING T-020 | Not yet configured — staging deployment step. Refresh token cookie uses `secure: process.env.NODE_ENV === 'production'` — will be httpOnly+Secure in production. |
| Dependencies checked for vulnerabilities | ⚠️ DEV DEPS ONLY | Backend: 0 production vuln, 5 moderate in dev deps (vitest/vite/esbuild chain, GHSA-67mh-4wv8-2f99). Frontend: same 5 moderate in dev deps. Vulnerability only affects Vite dev server — no production build impact. |
| Default credentials removed | ✅ PASS | `.env.example` contains placeholders only. |
| Error pages don't reveal server tech | ✅ PASS | Helmet removes `X-Powered-By`. Structured JSON error responses only. |

**Security Scan Summary:**
- **P0 (Critical) issues:** 0
- **P1 (High) issues:** 0
- **P2 (Medium) issues:** 1 (rate limiting — KNOWN ACCEPTED RISK, pre-identified)
- **P3 (Low/Info) issues:** 2 (dev-dep vulns — no prod impact; HTTPS pending staging)

**Decision: Security scan PASSES for Sprint 1 staging deployment.**

---

### Test Run 5 — npm audit

**Commands:**
- `cd /Users/yixinxiao/CLAUDE/triplanner/backend && npm audit`
- `cd /Users/yixinxiao/CLAUDE/triplanner/frontend && npm audit`

**Backend results:**
- 5 moderate vulnerabilities, all in dev dependency chain: `vitest → @vitest/mocker → vite → vite-node → esbuild ≤0.24.2`
- GHSA-67mh-4wv8-2f99: "esbuild enables any website to send any requests to the development server"
- Impact: Affects Vite dev server only — not production build artifacts
- Production dependencies (`express`, `knex`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `helmet`, `express-rate-limit`, `dotenv`) — **0 vulnerabilities**

**Frontend results:**
- Same 5 moderate vulnerabilities in the dev dependency chain
- Same GHSA-67mh-4wv8-2f99 finding
- Production dependencies (`react`, `react-dom`, `react-router-dom`, `axios`) — **0 vulnerabilities**

**Fix:** `npm audit fix --force` would install vitest@4.x (breaking change). Defer to Sprint 2 dev dependency upgrade cycle.

**Decision: NOT blocking for staging. No production risk.**

---

## Sprint 1 — QA Final Verdict

| Category | Tests | Result |
|----------|-------|--------|
| Backend Unit Tests | 60/60 | ✅ PASS |
| Frontend Unit Tests | 128/128 | ✅ PASS |
| Integration Contract Verification | All endpoints | ✅ PASS |
| Security Checklist (19 items) | 17/19 pass, 2 accepted/deferred | ✅ PASS |
| Dependency Audit | Dev deps only | ✅ PASS (no prod risk) |

**Overall Sprint 1 QA Status: ✅ COMPLETE — CLEARED FOR DEPLOYMENT**

Tasks T-004 through T-017 are all verified and moved to Done.

**Accepted risks for Sprint 1 staging (not blocking):**
1. Rate limiting not applied to /auth/login + /auth/register (known from T-010 Manager review) — add in Sprint 2
2. Dev-only esbuild vulnerability (GHSA-67mh-4wv8-2f99) — no production impact
3. HTTPS: pending T-020 staging deployment configuration
4. `triggerRef` focus-return-to-trigger in CreateTripModal not implemented — cosmetic, P3

**Handoff to Deploy Engineer:** ✅ Deploy Engineer is cleared to proceed with T-020 (staging deployment).

---

*Add entries at the top (newest first) as tests are run and deployments are verified.*

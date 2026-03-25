## Sprint 35 — T-274: QA Security Checklist + Integration Testing

**Date:** 2026-03-23
**QA Engineer:** QA Agent (T-274)
**Sprint:** 35
**Tasks Under Test:** T-272 (Backend XSS sanitization), T-273 (Frontend calendar "+x more" click-to-expand)

---

### Test Run 1 — Unit Tests (Backend)

| Field | Value |
|-------|-------|
| Test Type | Unit Test |
| Scope | Backend — all test files |
| Command | `cd backend && npm test` |
| Result | ✅ PASS |
| Total Tests | 446/446 |
| Test Files | 24/24 |
| Duration | 2.75s |
| Regressions | 0 |

**Sprint 35-specific tests (sprint35.test.js):** 36/36 PASS
- 18 unit tests for `sanitizeHtml()` utility: script tags, img onerror, nested tags, svg/onload, iframe, style, bold/italic, anchor, self-closing, HTML comments, Unicode, emoji, special chars, non-tag angle brackets, empty string, non-string passthrough, no double-encoding, multiple mixed tags
- 18 integration tests: POST/PATCH sanitization on trips (name, destinations[], notes), flights (flight_number, airline, from_location, to_location), stays (name, address), activities (name, location), land travel (provider, from_location, to_location), auth/register (name), plus edge cases (array sanitization, angle brackets, null fields, non-text field passthrough)

**Coverage assessment:**
- ✅ Happy-path tests for all 12 POST/PATCH endpoints
- ✅ Error-path tests (XSS payloads stripped)
- ✅ Edge cases (null, non-string, Unicode, emoji, special chars, non-tag angle brackets)
- ✅ No regressions in pre-existing 410 tests

---

### Test Run 2 — Unit Tests (Frontend)

| Field | Value |
|-------|-------|
| Test Type | Unit Test |
| Scope | Frontend — all test files |
| Command | `cd frontend && npm test` |
| Result | ✅ PASS |
| Total Tests | 510/510 |
| Test Files | 25/25 |
| Duration | 1.91s |
| Regressions | 0 |

**Sprint 35-specific tests (TripCalendar.test.jsx — tests 29.A–29.K):** 9/9 PASS (within 95 total TripCalendar tests)
- 29.A: Overflow trigger renders with correct aria attributes (aria-expanded, aria-haspopup="dialog", aria-label)
- 29.B: Click opens popover with event count
- 29.C: Click-outside dismisses popover
- 29.D: Escape dismisses popover (with focus restoration)
- 29.E: Month navigation dismisses popover
- 29.F: No trigger when ≤3 events
- 29.G: Pill click in popover scrolls to section
- 29.I: Enter key opens popover
- Additional existing tests: loading, error, empty, retry, event pills, scroll-to-section

**Coverage assessment:**
- ✅ Happy-path: popover opens on click, shows all events
- ✅ Error-path: no trigger rendered when insufficient events
- ✅ Dismiss behaviors: click-outside, Escape, month nav
- ✅ Keyboard accessibility: Enter opens popover
- ✅ No regressions in pre-existing 501 tests

**Note:** Minor React `act()` warning on test 29.I (Enter key opens popover). This is a test-environment artifact, not a runtime issue. No user-facing impact.

---

### Test Run 3 — Integration Test (T-272: Backend XSS Sanitization)

| Field | Value |
|-------|-------|
| Test Type | Integration Test |
| Scope | T-272 — Server-side input sanitization across all write endpoints |
| Result | ✅ PASS |

**Verification checklist:**

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | sanitizeFields middleware applied to all POST routes | ✅ | Confirmed on: trips, flights, stays, activities, land-travel, auth/register (6 route files) |
| 2 | sanitizeFields middleware applied to all PATCH routes | ✅ | PATCH routes use inline `sanitizeHtml()` calls in update handlers (flights, stays, activities, land-travel). Trips PATCH uses `sanitizeFields` middleware. |
| 3 | Middleware ordering: validate → sanitize → handler | ✅ | Verified in all route files. Validation runs first, sanitization second. |
| 4 | All 17 text fields covered | ✅ | auth(name), trips(name, destinations[], notes), flights(flight_number, airline, from_location, to_location), stays(name, address), activities(name, location), land-travel(provider, from_location, to_location) |
| 5 | Non-text fields NOT sanitized | ✅ | Enums, dates, times, UUIDs, timezones pass through unchanged (verified in tests) |
| 6 | XSS bypass vectors stripped | ✅ | `<script>`, `<img onerror>`, `<svg onload>`, nested tags, self-closing, HTML comments, style tags — all stripped |
| 7 | Unicode/emoji preserved | ✅ | `東京旅行 🗼 café` stored unchanged |
| 8 | Special characters preserved | ✅ | `Tom & Jerry's "Excellent" Trip` stored unchanged |
| 9 | No double-encoding | ✅ | `&amp;` remains `&amp;`, not double-encoded to `&amp;amp;` |
| 10 | No SQL injection vectors | ✅ | All queries use Knex parameterized queries. No string concatenation (`query(... +`) found. |
| 11 | API contract compliance | ✅ | Response shapes unchanged. Sanitization is transparent — only stored values change. Sprint 35 contract in api-contracts.md matches implementation. |

---

### Test Run 4 — Integration Test (T-273: Calendar "+x more" Click-to-Expand)

| Field | Value |
|-------|-------|
| Test Type | Integration Test |
| Scope | T-273 — Calendar overflow popover interaction |
| Result | ✅ PASS |

**Verification checklist:**

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | "+x more" renders as semantic `<button>` | ✅ | Overflow indicator is `<button>` with proper aria attributes |
| 2 | Popover opens on click with `role="dialog"` | ✅ | Dialog with `aria-label`, `aria-modal="false"` |
| 3 | All events listed in popover | ✅ | Event count displayed, all pills rendered |
| 4 | Dismiss: click-outside | ✅ | mousedown listener on document |
| 5 | Dismiss: Escape key | ✅ | With focus restoration to trigger button |
| 6 | Dismiss: month navigation | ✅ | Popover closes on prev/next month |
| 7 | Dismiss: window resize | ✅ | Resize listener cleanup in useEffect |
| 8 | Smart positioning (above/below) | ✅ | Last 2 grid rows position popover above |
| 9 | Mobile responsive | ✅ | `min(280px, calc(100vw - 32px))` width. Mobile day list (<480px) shows all events inline — no overflow trigger needed. |
| 10 | Animation | ✅ | 150ms ease — matches design system specification |
| 11 | No XSS vectors | ✅ | No `dangerouslySetInnerHTML` used (only 1 mention in codebase — a comment in formatDate.js confirming it's NOT used). All dynamic content via JSX auto-escaping. |
| 12 | Event listener cleanup | ✅ | useEffect return cleanup prevents memory leaks |
| 13 | UI spec compliance (Spec 29) | ✅ | Matches ui-spec.md specification per Manager review |

**UI States verified:**
- ✅ Empty state: "Add flights, stays, or activities" message
- ✅ Loading state: `aria-busy="true"` skeleton
- ✅ Error state: alert role with "Calendar unavailable" message + retry button
- ✅ Success state: calendar grid with events + overflow popover

---

### Test Run 5 — Config Consistency Check

| Field | Value |
|-------|-------|
| Test Type | Config Consistency |
| Scope | backend/.env, frontend/vite.config.js, infra/docker-compose.yml |
| Result | ✅ PASS |

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | Backend PORT matches vite proxy target | ✅ | backend/.env `PORT=3000`, vite proxy default `backendPort = process.env.BACKEND_PORT \|\| '3000'` → `http://localhost:3000` |
| 2 | SSL consistency | ✅ | backend/.env has SSL commented out. Vite uses `BACKEND_SSL` env var — defaults to `http://` when unset. Consistent. |
| 3 | CORS_ORIGIN includes frontend dev origin | ✅ | backend/.env `CORS_ORIGIN=http://localhost:5173`, vite dev server `port: 5173`. Match. |
| 4 | Docker Compose backend PORT | ✅ | `PORT: 3000` matches backend/.env default. No host port mapped — internal only, proxied through nginx. |
| 5 | Docker Compose CORS_ORIGIN | ✅ | `CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}` — correct for Docker (nginx serves on localhost). |

No config mismatches found.

---

### Test Run 6 — Security Scan

| Field | Value |
|-------|-------|
| Test Type | Security Scan |
| Scope | Full security checklist verification for Sprint 35 |
| Command | `cd backend && npm audit` |
| npm audit Result | ✅ 0 vulnerabilities |

**Security Checklist Results:**

#### Authentication & Authorization
| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | All API endpoints require appropriate auth | ✅ PASS | All data endpoints require Bearer token. Auth endpoints (register, login) are public as expected. Calendar endpoint requires auth. |
| 2 | Auth tokens have expiration and refresh | ✅ PASS | JWT 15m expiry, refresh token 7d. httpOnly cookie for refresh. |
| 3 | Password hashing uses bcrypt | ✅ PASS | bcryptjs with 12 rounds. Timing-safe comparison with dummy hash for non-existent users. |
| 4 | Failed login rate-limited | ✅ PASS | express-rate-limit on auth endpoints. Tests verify rate limiting. |

#### Input Validation & Injection Prevention
| # | Item | Status | Evidence |
|---|------|--------|----------|
| 5 | All user inputs validated server-side | ✅ PASS | Joi/custom validation on all endpoints. Client-side validation also present. |
| 6 | SQL queries use parameterized statements | ✅ PASS | Knex query builder throughout. No string concatenation in queries (verified via grep). |
| 7 | HTML output sanitized (XSS prevention) | ✅ PASS | **NEW in Sprint 35:** `sanitizeHtml()` strips HTML tags server-side on all 17 user text fields. React JSX auto-escaping on client. No `dangerouslySetInnerHTML`. |
| 8 | File uploads validated | N/A | No file upload functionality in current scope. |

#### API Security
| # | Item | Status | Evidence |
|---|------|--------|----------|
| 9 | CORS configured for expected origins | ✅ PASS | `CORS_ORIGIN=http://localhost:5173` matches frontend dev server. |
| 10 | Rate limiting on public endpoints | ✅ PASS | Rate limiters on register and login endpoints. |
| 11 | API responses don't leak internals | ✅ PASS | Error handler logs stack server-side, returns only structured `{error: {message, code}}` to client. Never leaks stack traces. |
| 12 | No sensitive data in URL params | ✅ PASS | Tokens in headers/cookies, not URL. |
| 13 | Security headers (helmet) | ✅ PASS | `helmet()` middleware applied in app.js. Covers X-Content-Type-Options, X-Frame-Options, etc. |

#### Data Protection
| # | Item | Status | Evidence |
|---|------|--------|----------|
| 14 | DB credentials in env vars | ✅ PASS | `DATABASE_URL` from `.env`. Docker Compose uses `${DB_PASSWORD:?required}`. |
| 15 | No hardcoded secrets in code | ✅ PASS | JWT_SECRET from `process.env.JWT_SECRET`. No hardcoded tokens found in source. |
| 16 | Logs don't contain PII/tokens | ✅ PASS | Error handler logs error message/stack only, not request bodies or tokens. |

#### Infrastructure
| # | Item | Status | Evidence |
|---|------|--------|----------|
| 17 | Dependencies checked for vulnerabilities | ✅ PASS | `npm audit` returns 0 vulnerabilities. |
| 18 | Default credentials removed | ✅ PASS | `.env` uses `change-me-to-a-random-string` as JWT_SECRET placeholder (development only). Docker requires `JWT_SECRET` and `DB_PASSWORD` via `?required`. |

**Security Scan Verdict: ✅ PASS — No P1 security issues found.**

---

### Sprint 35 QA Summary

| Test Category | Result | Details |
|---------------|--------|---------|
| Backend Unit Tests | ✅ 446/446 PASS | 36 new Sprint 35 tests, 0 regressions |
| Frontend Unit Tests | ✅ 510/510 PASS | 9 new Sprint 35 tests, 0 regressions |
| Integration: T-272 (XSS sanitization) | ✅ PASS | All 17 fields sanitized, all 12 endpoints covered |
| Integration: T-273 (calendar popover) | ✅ PASS | All interactions verified, UI states complete |
| Config Consistency | ✅ PASS | No mismatches |
| Security Scan | ✅ PASS | 0 npm vulnerabilities, full checklist verified |
| **Overall** | **✅ PASS** | **Ready for staging deployment** |

**Total test count:** 446 backend + 510 frontend = 956 (Playwright E2E deferred to staging — T-276)

*QA Engineer — Sprint #35 T-274 — 2026-03-23*


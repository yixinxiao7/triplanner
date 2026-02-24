# Security Checklist

QA Engineer must verify all applicable items before any task moves to Done. Backend Engineer should self-check during development.

---

## Authentication & Authorization

- [ ] All API endpoints require appropriate authentication (token, session, API key)
- [ ] Role-based access control is enforced where applicable
- [ ] Auth tokens have appropriate expiration and refresh mechanisms
- [ ] Password hashing uses bcrypt, scrypt, or argon2 (never plain text or MD5/SHA)
- [ ] Failed login attempts are rate-limited

## Input Validation & Injection Prevention

- [ ] All user inputs are validated on both client and server side
- [ ] SQL queries use parameterized statements or query builder (no string concatenation)
- [ ] NoSQL queries are protected against injection (e.g., MongoDB operator injection)
- [ ] File uploads are validated for type, size, and content
- [ ] HTML output is sanitized to prevent XSS

## API Security

- [ ] CORS is configured to allow only expected origins
- [ ] Rate limiting is applied to public-facing endpoints
- [ ] API responses do not leak internal error details or stack traces
- [ ] Sensitive data is never passed in URL query parameters
- [ ] HTTP headers include security defaults (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security)

## Data Protection

- [ ] Sensitive data at rest is encrypted
- [ ] Database credentials and API keys are stored in environment variables, not in code
- [ ] Logs do not contain PII, passwords, or tokens
- [ ] Backups are configured and tested for the database

## Infrastructure

- [ ] HTTPS is enforced on all environments (staging + production)
- [ ] Dependencies are checked for known vulnerabilities (npm audit, pip audit, etc.)
- [ ] Default/sample credentials have been removed
- [ ] Error pages do not reveal server technology or version info

---

*This checklist is maintained by the QA Engineer and Manager Agent. Update it when new security concerns emerge.*

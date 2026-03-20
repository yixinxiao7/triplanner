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

[Endpoints will be defined here by the Backend Engineer before implementation begins]

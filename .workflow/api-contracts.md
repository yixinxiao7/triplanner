# API Contracts

Shared API specifications that the Backend Engineer publishes and the Frontend Engineer consumes. Must be defined before implementation begins each sprint.

---

## Rules

1. Backend Engineer must document all new/changed endpoints here **before** writing implementation code
2. Frontend Engineer must acknowledge the contract in handoff-log.md **before** starting UI integration
3. Any contract changes mid-sprint require a handoff-log.md entry and Manager approval
4. All contracts must follow the conventions defined in `architecture.md`

---

## Contract Template

```
### [METHOD] /api/v1/[path]

| Field | Value |
|-------|-------|
| Sprint | # |
| Status | Draft / Agreed / Implemented |
| Auth Required | Yes / No |

**Request:**
```json
{
  "field": "type"
}
```

**Response (Success — 200/201):**
```json
{
  "data": {}
}
```

**Response (Error — 4xx/5xx):**
```json
{
  "error": {
    "message": "Human-readable error",
    "code": "ERROR_CODE"
  }
}
```

**Notes:** Any edge cases, rate limits, or special behavior.
```

---

## Active Contracts

*Add API contracts here as the project evolves.*

---

*This section is maintained by the Backend Engineer and reviewed by the Manager Agent.*

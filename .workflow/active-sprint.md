# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #20 — 2026-03-10

**Sprint Goal:** Fix two minor backend validation gaps from Sprint 19 (FB-008: inconsistent PATCH error message; FB-009: missing max-length on destination items). Deliver the trip notes/description feature (B-030): a freeform notes field on the trip details page where users can store observations, reminders, and context for each trip. Complete the full QA → Deploy → Monitor → User Agent pipeline.

**Context:** Sprint 19 delivered all 10 tasks cleanly — auth rate limiting is live, multi-destination chip UI is deployed, and both pipeline carry-overs (T-176, T-177) are closed. The two Sprint 19 minor issues (FB-008, FB-009) are simple Joi schema tweaks combined into T-186. The primary new feature, trip notes (B-030), was first recommended in Sprint 6 and provides visible user-facing value without requiring complex new architecture. Backend adds a nullable `notes TEXT` column (migration 010); frontend adds a `TripNotesSection` component with inline edit/save/cancel behavior.

**Feedback Triage (Sprint 19 → Sprint 20 — Manager Agent 2026-03-10):**

| FB Entry | Category | Severity | Disposition | Description |
|----------|----------|----------|--------|-------------|
| FB-008 | UX Issue | Minor | **Tasked → T-186** | PATCH empty destinations returns raw Joi message; fix with `.messages()` override |
| FB-009 | Bug | Minor | **Tasked → T-186** | Backend accepts destination strings >100 chars; fix with `.items(Joi.string().max(100))` |
| FB-013 | Positive | — | **Acknowledged** | All 416/416 frontend + 287/287 backend tests passing — no action needed |

---

## In Scope

### Phase 1 — Backend Validation Fix + Design Spec (parallel, no blockers — start immediately)

- [ ] **T-186** — Backend Engineer: Fix Sprint 19 Joi destination validation gaps ← **NO DEPENDENCIES — START IMMEDIATELY** (P1)
  - In trip validation schema, update `destinations` array schema:
    - Add `.items(Joi.string().min(1).max(100))` — enforces 100-char cap per item (matches frontend `maxLength`)
    - Apply to both **POST** and **PATCH** /api/v1/trips validation schemas
  - On PATCH route destinations field: add `.messages({ 'array.min': 'At least one destination is required' })` so empty-array error matches POST's human-friendly message
  - Tests (add to existing trip test file or new file):
    - (A) POST with 101-char destination → 400 VALIDATION_ERROR
    - (B) PATCH with 101-char destination → 400 VALIDATION_ERROR
    - (C) PATCH with `destinations: []` → 400, message = "At least one destination is required"
    - (D) POST/PATCH with exactly 100-char destination → 201/200 (happy path)
  - All 287+ existing backend tests must continue to pass

- [ ] **T-187** — Design Agent: Trip notes/description field spec (Spec 19) ← **NO DEPENDENCIES — START IMMEDIATELY** (P2)
  - Publish to `ui-spec.md` as Spec 19
  - Section: "Trip notes" on TripDetailsPage — below destinations, above calendar; subtle separator
  - **View mode:** muted placeholder "Add notes about this trip…" when empty; note text when set; pencil icon button `aria-label="Edit trip notes"` always visible
  - **Edit mode:** `<textarea aria-label="Trip notes" maxLength={2000}>`, pre-filled with current notes (or empty). Character count "N / 2000" with `role="status"` linked via `aria-describedby`. Save + Cancel buttons.
  - **Save:** PATCH /api/v1/trips/:id with `{ notes: "..." }` → reload trip
  - **Cancel:** discard changes, return to view mode
  - Styling: Japandi aesthetic — IBM Plex Mono, existing palette, minimal visual weight
  - Accessibility: textarea labelled, char count announced live
  - Log Manager approval handoff in `handoff-log.md` before T-188/T-189 begin

---

### Phase 2 — Backend Notes Field (after Manager approves T-187)

- [ ] **T-188** — Backend Engineer: Trip notes field — migration 010 + API update ← Blocked by T-187 (P2)
  - Migration `010_add_notes_to_trips.js`: `ALTER TABLE trips ADD COLUMN notes TEXT;` — rollback: `DROP COLUMN notes`
  - Validation: add `notes: Joi.string().max(2000).allow(null, '').optional()` to POST and PATCH schemas
  - Model: include `notes` in insert/update Knex queries; return in GET /trips list and GET /trips/:id
  - Response: `notes: null` when unset (not `""`)
  - Update `api-contracts.md`: add `notes: string | null` to trip entity
  - Tests: POST with notes, PATCH notes, PATCH null clears, GET returns notes, POST without notes → null, POST notes >2000 → 400
  - All 287+ existing tests must pass

---

### Phase 3 — Frontend Notes UI (after T-187 + T-188 complete)

- [ ] **T-189** — Frontend Engineer: Trip notes UI — TripNotesSection component ← Blocked by T-187, T-188 (P2)
  - New component: `frontend/src/components/TripNotesSection.jsx`
  - Integrate into `TripDetailsPage.jsx` below destinations, above calendar
  - **View mode:** empty placeholder when `trip.notes` null/empty; note text when set; pencil button `aria-label="Edit trip notes"`
  - **Edit mode:** `<textarea aria-label="Trip notes" maxLength={2000}>`, character count `"N / 2000"` with `role="status"` + `aria-describedby`, Save + Cancel buttons
  - Save: `api.trips.update(tripId, { notes: editNotes.trim() || null })` → reload trip on success
  - Cancel: revert to view mode
  - Styling: consistent with Japandi aesthetic; separator line above section
  - Tests (in `TripNotesSection.test.jsx` or `TripDetailsPage.test.jsx`):
    - Renders placeholder when notes null
    - Renders note text in view mode
    - Clicking "Edit notes" → edit mode opens
    - Textarea pre-filled with current notes
    - Character count updates as user types
    - Save calls api.trips.update with correct notes value
    - Cancel returns to view mode without saving
    - Clearing text + saving → null sent to API
  - All 416+ existing frontend tests (plus T-186 new tests) must pass

---

### Phase 4 — QA Review (after T-186 + T-189 complete)

- [ ] **T-190** — QA Engineer: Security checklist + code review for Sprint 20 ← Blocked by T-186, T-189 (P1)
  - **T-186 security:** Joi `.max(100)` prevents oversized destination storage; error messages don't leak schema internals ✅
  - **T-188 security:** `notes` stored via parameterized Knex query (no SQL injection); max 2000 enforced at backend ✅
  - **T-189 security:** Notes displayed as React text node (no `dangerouslySetInnerHTML`); XSS safe ✅
  - Run `npm test --run` in `backend/` (287+ base + T-186/T-188 tests)
  - Run `npm test --run` in `frontend/` (416+ base + T-189 tests)
  - Run `npm audit` — flag any new Critical/High findings
  - Full report in qa-build-log.md Sprint 20 section

- [ ] **T-191** — QA Engineer: Integration testing for Sprint 20 ← Blocked by T-190 (P1)
  - POST with 101-char destination → 400 (T-186 fix) ✅
  - PATCH `destinations:[]` → 400, message = "At least one destination is required" (T-186 fix) ✅
  - POST /trips with notes → 201, notes in response ✅
  - PATCH /trips/:id notes update → 200 ✅
  - GET /trips/:id → notes field present ✅
  - TripDetailsPage: empty notes → placeholder ✅; edit mode → textarea ✅; save → view mode updated ✅
  - Sprint 19 regression: rate limit headers on /auth/login ✅
  - Sprint 17 regression: Print button visible ✅
  - Sprint 16 regression: start_date/end_date on trips ✅
  - Full report in qa-build-log.md. Handoff to Deploy (T-192).

---

### Phase 5 — Deploy, Monitor, User Agent (sequential after Phase 4)

- [ ] **T-192** — Deploy Engineer: Sprint 20 staging re-deployment ← Blocked by T-191 (P1)
  - Pre-deploy gate: T-191 Done
  - `npm run migrate` in `backend/` → migration 010 applied (verify `notes` column exists)
  - `pm2 restart triplanner-backend` → verify online
  - `npm run build` in `frontend/` → 0 errors → `pm2 reload triplanner-frontend`
  - Smoke tests: GET /health → 200 ✅; GET /trips/:id → includes `notes` field ✅; POST with 101-char destination → 400 ✅; TripDetailsPage notes section visible ✅; Sprint 19 rate limit regression ✅; Sprint 17 print regression ✅
  - Log handoff to Monitor (T-193) in handoff-log.md

- [ ] **T-193** — Monitor Agent: Sprint 20 staging health check ← Blocked by T-192 (P1)
  - HTTPS ✅, pm2 port 3001 ✅, health 200 ✅
  - Sprint 20: GET /trips/:id includes `notes` key ✅; POST 101-char destination → 400 ✅
  - Sprint 19 regression: RateLimit-Limit header on /auth/login ✅
  - Sprint 17 regression: Print itinerary button visible ✅
  - Sprint 16 regression: trips include start_date/end_date ✅
  - `npx playwright test` → 7/7 PASS ✅
  - Full report in qa-build-log.md. Handoff to User Agent (T-194).

- [ ] **T-194** — User Agent: Sprint 20 feature walkthrough ← Blocked by T-193 (P2)
  - Notes empty state: trip details shows placeholder "Add notes about this trip…" ✅
  - Notes edit: click pencil → textarea → type note → char count updates → Save → note displays ✅
  - Notes clear: edit → clear text → Save → placeholder returns ✅
  - Notes max length: textarea stops at 2000 chars ✅
  - Destination validation: direct API call with 101-char destination → 400 ✅
  - Destination validation: PATCH `destinations:[]` → 400 with human-friendly message ✅
  - Sprint 19 regression: rate limiting, multi-destination chip UI, trip card truncation ✅
  - Sprint 17 regression: print button ✅
  - Submit structured feedback to `feedback-log.md` under "Sprint 21 User Agent Feedback" header

---

## Out of Scope

- **Production deployment (B-022)** — Pending project owner hosting decision. **20 consecutive sprints with no decision. Project owner action required.** All infrastructure is complete and production-ready.
- **B-021 (esbuild dev dep vulnerability)** — No production impact. Monitor for upstream vitest patch.
- **B-024 (per-account rate limiting)** — B-020 resolved in Sprint 19; per-account deferral acceptable.
- **Redis for rate limiting** — In-memory store sufficient at current scale.
- **MFA login** — Explicitly out of scope per project brief.
- **Home page summary calendar** — Explicitly out of scope per project brief.
- **Auto-generated itinerary suggestions** — Explicitly out of scope per project brief.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Joi validation fixes (P1) + trip notes backend (P2) | T-186, T-188 |
| Design Agent | Trip notes/description field spec (Spec 19) | T-187 |
| Frontend Engineer | Trip notes UI component (TripNotesSection) | T-189 |
| QA Engineer | Security checklist + integration testing | T-190, T-191 |
| Deploy Engineer | Sprint 20 staging re-deployment + migration 010 | T-192 |
| Monitor Agent | Sprint 20 staging health check | T-193 |
| User Agent | Sprint 20 feature walkthrough | T-194 |
| Manager | Code review (T-186, T-188, T-189) → Sprint 21 plan | Code review |

---

## Dependency Chain (Critical Path)

```
Track A — Backend Validation Fix (start immediately, no blockers):
T-186 (Backend: Joi max(100) + .messages() on destinations)
    |
    └─────────────────────────────────────┐
                                          |
Track B — Design Spec (start immediately, no blockers):
T-187 (Design: trip notes spec, Spec 19)
    |
    ├──→ T-188 (Backend: migration 010 + notes API)
    |         |
    └──────────┤
               |
          T-189 (Frontend: TripNotesSection component)
               |
               └─────┤ (both T-186 and T-189 must be in Integration Check)
                     |
                T-190 (QA: security checklist + code review)
                     |
                T-191 (QA: integration testing)
                     |
                T-192 (Deploy: migration + rebuild)
                     |
                T-193 (Monitor: health check)
                     |
                T-194 (User Agent: feature walkthrough)
                     |
            Manager: Triage feedback → Sprint 21 plan
```

---

## Definition of Done

*How do we know Sprint #20 is complete?*

- [ ] T-186: POST and PATCH both reject destination items >100 chars with 400; PATCH empty destinations returns "At least one destination is required" (matches POST); all 287+ backend tests pass
- [ ] T-187: Spec 19 published to ui-spec.md; Manager-approved; backend and frontend can proceed
- [ ] T-188: Migration 010 applied; POST/PATCH/GET /trips include notes field; notes validation (max 2000) tested; all existing backend tests pass
- [ ] T-189: TripNotesSection component live on TripDetailsPage; empty placeholder, edit mode, char count, save/cancel all working per Spec 19; all 416+ frontend tests pass
- [ ] T-190: QA security checklist passed for Sprint 20 changes; no new Critical/High audit findings
- [ ] T-191: QA integration testing passed; notes CRUD verified; destination validation fix confirmed
- [ ] T-192: Migration 010 applied to staging; frontend + backend rebuilt and deployed; smoke tests pass
- [ ] T-193: Monitor confirms all Sprint 20 health checks pass; Playwright 7/7 PASS
- [ ] T-194: User Agent verifies trip notes and destination validation on staging; structured feedback submitted
- [ ] All feedback from T-194 triaged by Manager (Tasked, Won't Fix, or Acknowledged)
- [ ] Sprint 20 summary written in `.workflow/sprint-log.md`
- [ ] Sprint 21 plan written in `.workflow/active-sprint.md`

---

## Success Criteria (Sprint #20)

By end of Sprint #20, the following must be verifiable on staging:

- [ ] **T-186 Done** — Direct API calls with >100-char destination names are rejected with 400; PATCH empty destinations error message is human-friendly and consistent with POST
- [ ] **T-188 Done** — GET /api/v1/trips/:id returns `notes` field (null or string); POST/PATCH accept and persist notes
- [ ] **T-189 Done** — Trip details page shows notes section with edit-in-place; users can add, update, and clear notes
- [ ] Sprint 20 staging deploy (T-192) completed successfully with migration 010 applied
- [ ] No Critical or Major bugs found in T-194 walkthrough
- [ ] Sprint 21 plan written in `active-sprint.md`

---

## Blockers

- **B-022 (Production Deployment — 20 consecutive sprints):** Project owner must review `.workflow/hosting-research.md` (T-124 output) and select a hosting provider. All application infrastructure is complete, production-ready, and has been for 17 sprints. **Project owner action required before production deployment can execute.**

---

*Previous sprint (Sprint #19) archived to `.workflow/sprint-log.md` on 2026-03-10. Sprint #20 plan written by Manager Agent 2026-03-10.*

# Feedback Log

Structured feedback from the User Agent and Monitor Agent after each test cycle. Triaged by the Manager Agent.

---

## Log Fields

| Field | Description |
|-------|-------------|
| Feedback | Short description of the observation |
| Sprint | Sprint number |
| Category | Bug, UX Issue, Feature Gap, Positive, Performance, Security, Monitor Alert |
| Severity | Critical, Major, Minor, Suggestion |
| Status | New, Acknowledged, Tasked, Resolved, Won't Fix |
| Details | Full description of the issue or observation |
| Related Task | Task ID from dev-cycle-tracker.md (if applicable) |

---

## Sprint 11 Feedback

*Sprint 11 begins 2026-03-04. No "New" feedback entries carry into Sprint 11. All prior entries (FB-001 through FB-084) were triaged in previous sprints. FB-084 is Resolved (T-113 Done, T-122 Done and deployed). No User Agent or Monitor Agent feedback has been submitted for Sprint 6, 7, 8, or 10 features — T-094, T-109, T-120, and the new T-123 (Sprint 10 walkthrough) have never run. This is the seventh consecutive sprint where the pipeline has not fully closed.*

*Sprint 11 will collect feedback from four long-overdue walkthroughs: T-094 (Sprint 6 features — land travel CRUD, calendar enhancements, activity AM/PM fix, FilterToolbar refetch, ILIKE search), T-109 (Sprint 7 features — popover portal fix, stays UTC timezone fix, section reorder, all-day sort, calendar checkout/arrival times, trip notes), T-120 (Sprint 8 features — timezone abbreviations on flight/stay cards, URL linkification in activity location), and T-123 (Sprint 10 features — trip print/export via window.print()). Manager will triage each feedback set immediately after submission and create hotfix tasks (H-XXX) if any Critical or Major bugs are found.*

**Sprint 11 Feedback Triage Summary (Manager Agent — 2026-03-04):**

*No "New" entries carry into Sprint 11. All prior entries (FB-001 through FB-084) triaged in previous sprints. FB-084 Resolved (T-113 Done). Awaiting T-094, T-109, T-120, and T-123 feedback submissions this sprint.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| (none — carry-in) | — | — | — | No entries carry "New" status into Sprint 11. All prior entries triaged. FB-084 Resolved. Awaiting T-094, T-109, T-120, T-123 submissions this sprint. |

*Entries will be added here as User Agent submits Sprint 6, Sprint 7, Sprint 8, and Sprint 10 feedback during T-094, T-109, T-120, and T-123 respectively.*

---

**Sprint 11 → Sprint 12 Feedback Triage (Manager Agent — 2026-03-06):**

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-085 | UX Issue | Major | **Tasked → T-125** | Deploy Engineer must use `.env.staging` instead of overwriting `.env`. P1, Sprint 12. |
| FB-086 | UX Issue | Minor | **Tasked → T-126** | DayPopover must stay anchored to trigger on scroll. Frontend fix, P2, Sprint 12. |
| FB-087 | UX Issue | Minor | **Tasked → T-127** | Add "check-in" label to calendar check-in time chip for consistency with "check-out". Frontend fix, P2, Sprint 12. |
| FB-088 | Feature Gap | Minor | **Tasked → T-128** | Calendar should open on the month of the first planned event, not current month. Frontend fix, P2, Sprint 12. |

---

### FB-085 — UX Issue: Deploy phase overwrites .env, breaking local dev

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | UX Issue |
| Severity | Major |
| Status | Tasked → T-125 |
| Related Task | T-125 |

**Description:** The Deploy Engineer agent modifies `backend/.env` to staging settings (HTTPS, port 3001, secure cookies, staging CORS origin) during the deploy phase, but never restores it afterward. This leaves `.env` in staging mode after the sprint completes, which breaks `npm run dev` for the project owner — the frontend proxy can't connect because it expects HTTP on port 3000 by default.

**Recommended fix:** Use a separate `backend/.env.staging` file for staging deployments instead of overwriting `backend/.env`. The deploy phase and staging-related agents should read from `.env.staging`, while `.env` remains untouched for local development. The Deploy Engineer prompt and the deploy phase script should be updated to reference `.env.staging` instead of mutating `.env`.

**Requested by:** Project owner (manual testing feedback)

---

### FB-086 — UX Issue: DayPopover detaches from trigger on page scroll

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked → T-126 |
| Related Task | T-126 |

**Description:** When clicking "+X more" on a calendar day, the DayPopover dropdown detaches from its trigger button on page scroll. The popover is rendered with `position: fixed` via `createPortal` to `document.body`, so it stays at the original viewport coordinates while the page content scrolls. Expected behavior: the dropdown should stay anchored relative to the trigger button.

**Requested by:** Project owner (manual testing feedback)

---

### FB-087 — UX Issue: Calendar check-in time missing "check-in" label

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | UX Issue |
| Severity | Minor |
| Status | Tasked → T-127 |
| Related Task | T-127 |

**Description:** On the calendar view, the check-out date explicitly displays a "check-out" label, but the check-in date does not have a corresponding "check-in" label. For consistency, the check-in time should explicitly say "check-in" the same way "check-out" is written out on the check-out date.

**Requested by:** Project owner (manual testing feedback)

---

### FB-088 — Feature Gap: Calendar should default to month of first planned event

| Field | Value |
|-------|-------|
| Sprint | 11 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked → T-128 |
| Related Task | T-128 |

**Description:** When opening the trip details page, the calendar currently defaults to the current month. Instead, it should default to the month of the trip's first planned event (flight, transport, activity, stay, etc.) so the user immediately sees relevant content. If no events have been planned yet, it should fall back to the current month.

**Requested by:** Project owner (manual feedback)

---

## Sprint 12 Monitor Alerts — 2026-03-06

### FB-089 — Monitor Alert: Staging Backend Running on Wrong Port (PORT=3000, Expected PORT=3001)

| Field | Value |
|-------|-------|
| Sprint | 12 |
| Category | Monitor Alert |
| Severity | Major |
| Status | Tasked → Sprint 13 (T-131 re-execution required) |
| Related Task | T-131, T-132 |

**Description:** Sprint 12 post-deploy health check (T-132) found the staging backend running on `https://localhost:3000`, not `https://localhost:3001` as specified in `backend/.env.staging`. The backend is serving HTTPS (TLS certs loaded from `infra/certs/`), but `PORT=3000` was used instead of the staging-config value of `PORT=3001`. The Sprint 11 staging backend (pm2 PID 42784, `https://localhost:3001`) is no longer running — port 3001 has no listener.

**Evidence:**
- `lsof -i :3001` → empty (no listener)
- `lsof -i :3000` → PID 78079, `node src/index.js`, TCP \*:hbci (LISTEN)
- `curl -sk https://localhost:3000/api/v1/health -w "HTTP_STATUS:%{http_code}"` → `{"status":"ok"} HTTP_STATUS:200`
- `curl -sk https://localhost:3001/api/v1/health` → connection refused (curl exit 7, HTTP_STATUS:000)
- `pm2` binary not found in PATH — process management unverifiable
- No Deploy Engineer → Monitor Agent handoff found in handoff-log.md for T-131

**Impact:**
- Staging vite dev proxy (configured with `BACKEND_PORT=3001 BACKEND_SSL=true`) would target `https://localhost:3001` — a dead port. Dev-mode integration with staging backend broken.
- T-131 acceptance criteria not met: pm2 management not verified, staging config not correctly applied.
- T-133 (User Agent walkthrough) is BLOCKED — staging is not in the correct state for formal verification.

**Required Action:** Deploy Engineer must:
1. Stop the current backend process (PID 78079): `kill 78079`
2. Start backend via pm2 with staging config: `pm2 start infra/ecosystem.config.cjs` (from project root — this sets `NODE_ENV=staging`, which triggers `.env.staging` load with PORT=3001)
3. Verify pm2 online: `pm2 status` shows `triplanner-backend` as `online`
4. Confirm `curl -sk https://localhost:3001/api/v1/health` → 200
5. Log T-131 completion handoff to Monitor Agent so T-132 re-check can proceed
6. Do NOT touch `backend/.env` (T-131 AC)

---

### FB-090 — Monitor Alert: Pre-existing Route Documentation Inconsistency — /land-travel vs /land-travels

| Field | Value |
|-------|-------|
| Sprint | 12 |
| Category | Monitor Alert |
| Severity | Minor |
| Status | Acknowledged (backlog — documentation fix, no functional impact) |
| Related Task | T-132 |

**Description:** During T-132 health checks, Monitor Agent discovered that the land travel API route is mounted at `/api/v1/trips/:tripId/land-travel` (singular) in `backend/src/app.js`, but `api-contracts.md` documents it as `/land-travels` (plural). All 266 backend tests use the singular URL and pass. The frontend uses the singular URL (application works). This is a pre-existing documentation inconsistency from Sprint 6, not a Sprint 12 regression.

**Evidence:**
- `curl -sk https://localhost:3000/api/v1/trips/:id/land-travel` → HTTP 200 `{"data":[]}`
- `curl -sk https://localhost:3000/api/v1/trips/:id/land-travels` → HTTP 404 (Express HTML error)
- `backend/src/app.js` line 43: `app.use('/api/v1/trips/:tripId/land-travel', landTravelRoutes)`
- `backend/src/__tests__/sprint6.test.js` line 281: uses `/land-travel` (singular) throughout

**Impact:** No functional impact — application works correctly. Risk: future agents or external API consumers reading `api-contracts.md` may call the wrong URL. Should be corrected in api-contracts.md.

**Required Action:** Backend Engineer to correct `api-contracts.md` to document the endpoint as `/land-travel` (singular) in a future sprint. Low priority.

---

## Sprint 12 Feedback Triage Summary (Manager Agent — 2026-03-06)

*No User Agent feedback received (T-133 blocked by T-131 staging failure). Two Monitor Agent alerts triaged.*

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-089 | Monitor Alert | Major | **Tasked → Sprint 13 (T-131 re-execution)** | Deploy Engineer must use `pm2 start infra/ecosystem.config.cjs` from project root. Backend must run on `https://localhost:3001` (PORT=3001 from `.env.staging`). P0, Sprint 13. |
| FB-090 | Monitor Alert | Minor | **Acknowledged (backlog)** | Backend Engineer to fix `api-contracts.md` — change `/land-travels` to `/land-travel` (singular). No functional impact. Low priority. |
| FB-091 | Feature Gap | Minor | **Tasked → T-137** | DayPopover should not close on scroll; should remain open and anchored at original position until user explicitly closes it. Frontend fix, P2, Sprint 13. |
| FB-092 | Feature Gap | Minor | **Tasked → T-138** | Rental car calendar events should show "pick-up Xp" and "drop-off Xp" time labels, matching the stay check-in/check-out chip format. Frontend fix, P2, Sprint 13. |

---

### FB-091 — DayPopover: keep popover open and anchored on scroll

| Field | Value |
|-------|-------|
| Feedback | DayPopover closes on scroll — should stay open and anchored |
| Sprint | 12 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked → T-137 |
| Related Task | T-126, T-137 |

**Description:** When clicking "+X more" on a calendar day, the DayPopover opens correctly. However, as soon as the user scrolls the page, the popover disappears. The desired behavior is: (1) The popover should remain open until the user explicitly closes it (click outside, press Escape, or click the close button). Scrolling should NOT dismiss it. (2) The popover should stay anchored at the position where it was originally opened — it should NOT move or drift when the user scrolls up or down on the page. In other words, the popover should use `position: absolute` (anchored to the document) rather than `position: fixed` (anchored to the viewport), and scroll events should not trigger a close.

---

### FB-092 — Rental car calendar events: show pick-up and drop-off time labels

| Field | Value |
|-------|-------|
| Feedback | Rental car calendar events should display "pick-up" and "drop-off" time labels |
| Sprint | 12 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked → T-138 |
| Related Task | T-138 |

**Description:** Rental cars displayed on the calendar view do not clearly indicate pick-up and drop-off times. The desired behavior is to match the format used by stays (check-in/check-out chips). On the pick-up day, the calendar event should show a time chip reading "pick-up Xp" (e.g., "pick-up 5p" for a 5 PM pick-up on May 21st). On the drop-off day, the chip should read "drop-off Xp" (e.g., "drop-off 5p"). This makes it immediately obvious when the rental period starts and ends, consistent with how stays display "check-in 4p" and "check-out 11a".

---

## Sprint 13 Feedback Triage (Manager Agent — 2026-03-07)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-089 | Monitor Alert | Major | **Tasked → T-134 (T-131 re-execution)** | Deploy Engineer must use `pm2 start infra/ecosystem.config.cjs` from project root. Backend must serve on `https://localhost:3001`. P0, Sprint 13. Carried from Sprint 12. |
| FB-090 | Monitor Alert | Minor | **Tasked → T-139** | Backend Engineer to fix `api-contracts.md` — change `/land-travels` to `/land-travel` (singular). Documentation-only fix. P3, Sprint 13. |
| FB-091 | Feature Gap | Minor | **Tasked → T-137** | Frontend Engineer to rework DayPopover: use `position: absolute` (document-anchored) so popover stays open and in place on scroll. Reverts T-126 scroll-close approach. P2, Sprint 13. |
| FB-092 | Feature Gap | Minor | **Tasked → T-138** | Frontend Engineer to add "pick-up Xp" and "drop-off Xp" time chips for rental car entries on calendar (pick-up day and drop-off day respectively), matching stay check-in/check-out chip format. P2, Sprint 13. |
| FB-093 | Monitor Alert | Major | **Tasked → Sprint 14 (T-145)** | JWT_SECRET in backend/.env.staging is the publicly-known placeholder value. Deploy Engineer must rotate before any external staging access. P1, Sprint 14. |

---

## Sprint 13 Monitor Agent Alerts

---

### FB-093 — Monitor Alert: Staging JWT_SECRET Is a Placeholder Value

| Field | Value |
|-------|-------|
| Feedback | backend/.env.staging JWT_SECRET is the default placeholder — tokens can be forged |
| Sprint | 13 |
| Category | Monitor Alert |
| Severity | Major |
| Status | Tasked → Sprint 14 (T-145) |
| Related Task | T-143 (health check that surfaced this), T-142 (staging deploy) |

**Detected by:** Monitor Agent — T-143 Post-Deploy Health Check — 2026-03-07T16:00:00Z

**Description:** During Sprint 13 post-deploy health check (T-143), the Monitor Agent read `backend/.env.staging` and found:

```
JWT_SECRET=CHANGE-ME-generate-with-openssl-rand-hex-32
```

This is the publicly documented placeholder value from the project template. Because this value is known, any party aware of the placeholder can forge valid JWT access tokens for the staging backend, bypassing authentication entirely. Auth endpoints (register/login) are responding correctly but the tokens they issue are signed with an insecure secret.

**Impact:**
- An attacker who knows the placeholder secret can craft arbitrary JWT tokens and authenticate as any user on staging.
- If this secret is accidentally used in production (copy-paste of .env.staging), all production tokens are compromised.
- No data confidentiality in staging — all accounts and trip data accessible without valid credentials.

**Required action:**
1. Generate a secure secret: `openssl rand -hex 32`
2. Replace `JWT_SECRET` in `backend/.env.staging` with the generated value
3. Restart the backend: `npx pm2 restart triplanner-backend`
4. Invalidate all current staging tokens (restart suffices since token signatures will no longer validate)

**This does not block staging testing** (all health checks passed), but must be resolved before any external user or third party accesses the staging environment.

---

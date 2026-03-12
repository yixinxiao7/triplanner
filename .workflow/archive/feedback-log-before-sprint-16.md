## Sprint 15 Feedback Triage (Manager Agent — 2026-03-07)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-096 | UX Issue | Minor | **Resolved — T-154 Done** | Frontend: update `<title>` in `frontend/index.html` to "triplanner"; add favicon `<link>` tag. Both are trivial `<head>` fixes with no backend or logic changes. P3, Sprint 15. |
| FB-097 | UX Issue | Minor | **Resolved — T-154 Done** | Combined with FB-096 — same file, same task. P3, Sprint 15. |
| FB-098 | Bug | Major | **Resolved — T-155 Done** | Frontend: fix calendar land travel pick-up/drop-off chip location rendering. Pick-up day chip must render the **origin** (pick-up location); drop-off day chip must render the **destination** (drop-off location). Currently both chips incorrectly render the destination. Root cause is likely in `DayCell` and `DayPopover.getEventTime` — the `_isArrival` flag path needs to select the correct location field. P1, Sprint 15. |

---

## Sprint 13 Feedback Triage (Manager Agent — 2026-03-07)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-089 | Monitor Alert | Major | **Tasked → T-134 (T-131 re-execution)** | Deploy Engineer must use `pm2 start infra/ecosystem.config.cjs` from project root. Backend must serve on `https://localhost:3001`. P0, Sprint 13. Carried from Sprint 12. |
| FB-090 | Monitor Alert | Minor | **Tasked → T-139** | Backend Engineer to fix `api-contracts.md` — change `/land-travels` to `/land-travel` (singular). Documentation-only fix. P3, Sprint 13. |
| FB-091 | Feature Gap | Minor | **Tasked → T-137** | Frontend Engineer to rework DayPopover: use `position: absolute` (document-anchored) so popover stays open and in place on scroll. Reverts T-126 scroll-close approach. P2, Sprint 13. |
| FB-092 | Feature Gap | Minor | **Tasked → T-138** | Frontend Engineer to add "pick-up Xp" and "drop-off Xp" time chips for rental car entries on calendar (pick-up day and drop-off day respectively), matching stay check-in/check-out chip format. P2, Sprint 13. |
| FB-093 | Monitor Alert | Major | **Tasked → T-145** | JWT_SECRET in backend/.env.staging is the publicly-known placeholder value. Deploy Engineer must rotate before any external staging access. P1, Sprint 14. |
| FB-094 | Feature Gap | Minor | **Tasked → T-147** | Add a "Today" button to calendar navigation so user can jump back to current month. Frontend fix. P2, Sprint 14. |
| FB-095 | Bug | Major | **Tasked → T-146** | Calendar does not default to first event's month — still shows current month (March) even when first event is in May. T-128 implementation likely not included in deployed build, or bug in date-parsing. Must investigate and fix on staging. P1, Sprint 14. |

---

## Sprint 13 → Sprint 14 Feedback Triage (Manager Agent — 2026-03-07)

| FB Entry | Category | Severity | Disposition | Notes |
|----------|----------|----------|-------------|-------|
| FB-093 | Monitor Alert | Major | **Tasked → T-145** | Deploy Engineer: rotate JWT_SECRET in `backend/.env.staging` (`openssl rand -hex 32`), restart pm2. P1, Sprint 14. Must complete before any external staging access. |
| FB-094 | Feature Gap | Minor | **Tasked → T-147** | Frontend Engineer: add "Today" button to TripCalendar navigation header. Clicking it sets `currentMonth` to the current date's month/year. P2, Sprint 14. |
| FB-095 | Bug | Major | **Tasked → T-146** | Frontend Engineer: investigate and fix T-128 regression — calendar still opens on current month even when first event is in a future month. Root cause likely in deployed build not including T-128, or a date-parsing edge case. Reproduce on staging, compare TripCalendar.jsx implementation against `getInitialMonth()` logic in source. P1, Sprint 14. |
| FB-096 | UX Issue | Minor | **Tasked → T-154** | Frontend Engineer: update `<title>` in `frontend/index.html` from "App" to "triplanner"; add `<link rel="icon" type="image/png" href="/favicon.png">` to `<head>`. P3, Sprint 15. |
| FB-097 | UX Issue | Minor | **Tasked → T-154** | Combined with FB-096 — both are `frontend/index.html` `<head>` changes with no logic or test requirements. P3, Sprint 15. |
| FB-098 | Bug | Major | **Tasked → T-155** | Frontend Engineer: fix calendar land travel chip location display — pick-up chip must show origin location (pick-up location), drop-off chip must show destination location (drop-off location). P1, Sprint 15. |

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
| Status | Tasked → T-145 |
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

### FB-094 — Feature Gap: Add "Today" button to calendar view

| Field | Value |
|-------|-------|
| Feedback | Calendar view needs a "Today" button to jump back to the current month |
| Sprint | 13 |
| Category | Feature Gap |
| Severity | Minor |
| Status | Tasked → T-147 |
| Related Task | T-128, T-147 |

**Description:** The calendar on the trip detail page currently defaults to the month of the first scheduled event (implemented in T-128, Sprint 12). If there are no planned events, it defaults to the current month. This behavior is correct. However, once the user navigates away from the current month (e.g., browsing future trip events), there is no quick way to return to the current month. Add a "Today" button to the calendar navigation that, when clicked, immediately navigates the calendar view to the current month. This button should be visible at all times in the calendar header/navigation area, consistent with the existing month navigation arrows.

**Requested by:** Project owner (manual feedback)

---

### FB-095 — Bug: Calendar does not default to first event's month (T-128 broken)

| Field | Value |
|-------|-------|
| Feedback | Calendar still defaults to current month instead of first event's month |
| Sprint | 13 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-146 |
| Related Task | T-128, T-146 |

**Description:** T-128 (Sprint 12) was supposed to make the calendar default to the month of the trip's first scheduled event. This is not working. Reproduction: open a trip with events only in May 2026 (e.g., Memorial Day trip) — the calendar defaults to March 2026 (the current month) instead of May 2026. The user must manually click the forward arrow twice to reach their events. The T-128 implementation is either not applying or has a bug in how it determines the first event's month. This needs to be investigated and fixed — the calendar should open on May 2026 when the first event is in May.

**Requested by:** Project owner (manual testing — confirmed broken)

---

### FB-096 — Browser tab title shows "App" instead of "triplanner"

| Field | Value |
|-------|-------|
| Feedback | Browser tab title displays "App" instead of "triplanner" |
| Sprint | 15 |
| Category | UX Issue |
| Severity | Minor |
| Status | Resolved — T-154 Done (2026-03-07) |
| Related Task | T-154 |

**Description:** The browser tab title currently shows "App" (likely the default Vite/React template title). It should display "triplanner" to match the product name. This is a simple fix — update the `<title>` tag in `frontend/index.html` (or equivalent) from "App" to "triplanner".

**Requested by:** Project owner

---

### FB-097 — Favicon not displayed in browser tab

| Field | Value |
|-------|-------|
| Feedback | Browser tab shows default icon — favicon.png exists but is not linked |
| Sprint | 15 |
| Category | UX Issue |
| Severity | Minor |
| Status | Resolved — T-154 Done (2026-03-07) |
| Related Task | T-154 |

**Description:** A favicon file exists at `frontend/public/favicon.png` but the browser tab displays the default browser icon instead of it. The `<link rel="icon">` tag is likely missing from `frontend/index.html`. Add `<link rel="icon" type="image/png" href="/favicon.png">` to the `<head>` section of `frontend/index.html` so the favicon appears in the browser tab.

**Requested by:** Project owner

---

### FB-098 — Calendar land travel chips show wrong location for pick-up vs drop-off

| Field | Value |
|-------|-------|
| Feedback | Pick-up and drop-off calendar chips both show drop-off destination instead of showing origin/destination respectively |
| Sprint | 15 |
| Category | Bug |
| Severity | Major |
| Status | Resolved — T-155 Done (2026-03-07) |
| Related Task | T-138, T-155 |

**Description:** On the calendar view, land travel entries (e.g., rental cars) display location chips on both the pick-up day and the drop-off day. Currently, both chips show the drop-off destination location, which is incorrect and confusing. The expected behavior is:

- **Pick-up day chip:** Should display the pick-up/origin location (where the user collects the car)
- **Drop-off day chip:** Should display the drop-off/destination location (where the user returns the car)

For example, if a rental car is picked up at "LAX Airport" and dropped off at "SFO Airport", the pick-up day should show "pick-up — LAX Airport" and the drop-off day should show "drop-off — SFO Airport". Currently both days show "SFO Airport". The frontend calendar chip rendering logic needs to differentiate between the origin and destination fields when generating pick-up vs drop-off chips.

**Requested by:** Project owner

---

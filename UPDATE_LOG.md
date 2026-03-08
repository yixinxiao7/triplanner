# Update Log

## MVP2 — Sprints 6–15 (2026-03-08)

### New Features

- **Land Travel Management** — Full CRUD for land travel entries (rental cars, trains, buses, rideshares). New database table, REST API (`/api/trips/:id/land-travel`), and dedicated edit page with form validation. Supports origin/destination, departure/arrival times, and vehicle type selection.
- **Trip Notes** — Free-text notes field added to each trip for storing miscellaneous travel info (confirmation numbers, reminders, packing lists, etc.).
- **Trip Print/Export** — `@media print` stylesheet for clean, printer-friendly trip detail pages. Hides navigation and interactive elements, formats content for paper.
- **Calendar "Today" Button** — Jump back to the current month from any point in the calendar with a single click.

### Calendar Improvements

- **Smart Default Month** — Calendar now opens to the month of the trip's first scheduled event instead of always showing the current month. Falls back to current month if no events exist.
- **DayPopover Stay-Open** — The "+X more" day popover is now document-anchored (`position: absolute`) and stays open when scrolling the page. Closes on Escape or click-outside.
- **Rental Car Chips** — Pick-up and drop-off days display time chips (e.g., "pick-up 3p", "drop-off 11a") matching the stay check-in/check-out chip format.
- **Correct Location Display** — Pick-up day chips show the origin/pick-up location; drop-off day chips show the destination/drop-off location.
- **Stay Chips** — Check-in and check-out days display time chips ("check-in 3p", "check-out 11a").

### Bug Fixes

- **Stays UTC Offset** — Fixed timezone handling for stay check-in/check-out times that were off by the local UTC offset.
- **ILIKE Wildcard Escaping** — Fixed SQL injection vector in search queries by escaping `%` and `_` wildcards with PostgreSQL-compatible escape character.
- **Calendar First-Event-Month Regression** — Fixed bug where calendar ignored the first event's month and always showed the current month.
- **Land Travel Chip Location** — Fixed both pick-up and drop-off chips incorrectly showing the drop-off destination for all chips.
- **Same-Day Validation** — Added validation that arrival time must be after departure time for same-day land travel entries.

### UX Polish

- **Browser Tab Title** — Changed from generic "App" to "triplanner".
- **Favicon** — Linked `favicon.png` in the HTML head so the browser tab displays the app icon.

### Testing

- 1,400+ lines of new TripCalendar tests (DayPopover, rental car chips, today button, first-event-month, location display)
- 700+ lines of new TripDetailsPage tests (land travel integration, trip notes, print)
- 370+ lines of LandTravelEditPage tests (form validation, CRUD operations)
- 920+ lines of backend Sprint 6 integration tests (land travel API, wildcard escaping)
- 560+ lines of backend Sprint 7 integration tests (stays UTC fix, trip notes)
- `formatTimezoneAbbr()` unit tests for timezone abbreviation edge cases

### Infrastructure / Orchestrator

- BSD compatibility fixes across all orchestrator scripts (`sed -i ''`, `grep -E` instead of `grep -P`, `grep -c || true` pattern)
- Agent runner now uses `--dangerously-skip-permissions` to prevent agents from stalling on file-write prompts
- Closeout phase now writes the next sprint plan into `active-sprint.md` before completing (previously deferred to the next sprint's plan phase)
- Plan phase detects and skips if the previous closeout already wrote the plan
- Staging environment: HTTPS on port 3001, pm2 process management, JWT secret rotation

---

## MVP1 — Sprints 1–5

Core application foundation:
- Account management (sign up, log in, JWT auth with refresh tokens)
- Trip dashboard with destination, dates, and status (Planning / Ongoing / Completed)
- Trip details page with integrated calendar view
- Flights section with full CRUD and calendar integration
- Stays/accommodation section with full CRUD and calendar integration
- Activities section with day-by-day itinerary and calendar integration
- Inline editing with save/cancel workflows
- PostgreSQL database with Knex.js migrations
- Express REST API with input validation and error handling
- React 18 + Vite frontend with CSS modules
- Automated test suite (Vitest + React Testing Library)
- Docker and staging deployment infrastructure

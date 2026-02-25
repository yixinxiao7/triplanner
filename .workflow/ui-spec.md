# UI Spec

Design specifications and screen descriptions for the Frontend Engineer. Maintained by the Design Agent and reviewed by the Manager Agent.

---

## How This Page Works

Before the Frontend Engineer begins work on any UI task, the Design Agent must create a spec entry below describing the screen, components, and user flow. The Frontend Engineer should not start implementation until a spec exists and is marked "Approved" by the Manager.

---

## Design System Conventions

*Shared patterns that all screens must follow for visual consistency.*

| Element | Convention |
|---------|-----------|
| **Background (Primary)** | `#02111B` — darkest tone, used as the main page/app background |
| **Surface (Cards / Panels)** | `#30292F` — card backgrounds, modal backgrounds, section containers |
| **Surface Alt (Inputs / Hover)** | `#3F4045` — form inputs, secondary panels, hover states |
| **Accent (Interactive)** | `#5D737E` — buttons, links, focus rings, status highlights, borders |
| **Text (Primary)** | `#FCFCFC` — all primary body text, headings, labels |
| **Text (Muted)** | `rgba(252, 252, 252, 0.5)` — placeholder text, secondary labels, disabled text |
| **Font Family** | IBM Plex Mono (load from Google Fonts: `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600&display=swap')`) |
| **Font Weights** | 300 (light), 400 (regular), 500 (medium), 600 (semibold) |
| **Spacing Unit** | 8px base unit. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px |
| **Border Radius** | 2px (inputs, small elements), 4px (cards, buttons, modals) |
| **Border Style** | `1px solid rgba(93, 115, 126, 0.3)` (subtle) or `1px solid #5D737E` (active/focus) |
| **Button — Primary** | Background: `#5D737E`, text: `#FCFCFC`, font-weight: 500, padding: 10px 24px, border-radius: 2px, hover: `rgba(93,115,126,0.8)`, disabled: `rgba(93,115,126,0.4)` |
| **Button — Secondary** | Background: transparent, text: `#FCFCFC`, border: `1px solid rgba(93,115,126,0.5)`, padding: 10px 24px, border-radius: 2px, hover: `rgba(252,252,252,0.05)` |
| **Button — Danger** | Background: transparent, text: `rgba(252,252,252,0.7)`, border: `1px solid rgba(252,252,252,0.2)`, hover: background `rgba(220,50,50,0.15)`, text `#FCFCFC`, border `rgba(220,50,50,0.5)` |
| **Form Pattern** | Label above input. Label: font-size 11px, font-weight 500, letter-spacing 0.08em, uppercase, muted color. Input: full-width, bg `#3F4045`, border `1px solid rgba(93,115,126,0.3)`, focus border `#5D737E`, text `#FCFCFC`, padding 10px 14px, border-radius 2px, font IBM Plex Mono 14px |
| **Error Display** | Inline below field: 12px, `rgba(220,80,80,0.9)`, appears on blur or submit. Toast for non-field errors: appears bottom-right, auto-dismisses in 4s |
| **Loading State** | Skeleton screens (shimmer) for page-level content loads. Inline spinner (20px, accent color, 1s rotation) for button actions. Overlay spinner (40px centered) for modal submits |
| **Status Badges** | Pill shape: padding 3px 10px, border-radius 2px, font-size 10px, font-weight 600, letter-spacing 0.1em, uppercase. PLANNING: bg `rgba(93,115,126,0.2)`, text `#5D737E`. ONGOING: bg `rgba(100,180,100,0.15)`, text `rgba(100,200,100,0.9)`. COMPLETED: bg `rgba(252,252,252,0.1)`, text `rgba(252,252,252,0.5)` |
| **Section Headers** | Font-size 11px, font-weight 600, letter-spacing 0.12em, uppercase, muted color, with a 1px line extending to the right (flex + hr approach) |
| **Max Content Width** | 1120px, centered with `margin: 0 auto` and `padding: 0 32px` |
| **Transitions** | `transition: all 150ms ease` for hover/focus states. `transition: opacity 200ms ease` for show/hide |
| **Japandi Aesthetic** | Minimal decoration. No gradients, no shadows (use borders instead). Generous negative space. Muted tones. Every element has a purpose. |

---

## CSS Custom Properties Reference

```css
:root {
  --bg-primary: #02111B;
  --surface: #30292F;
  --surface-alt: #3F4045;
  --accent: #5D737E;
  --text-primary: #FCFCFC;
  --text-muted: rgba(252, 252, 252, 0.5);
  --border-subtle: rgba(93, 115, 126, 0.3);
  --border-accent: #5D737E;
  --font-mono: 'IBM Plex Mono', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;

  /* Border radius */
  --radius-sm: 2px;
  --radius-md: 4px;
}
```

---

## Screen Specs

---

### Spec 1: Auth Screens (Login + Register)

**Sprint:** #1
**Related Task:** T-001
**Status:** Approved

**Description:**
The Auth screens are the entry point for all users. They consist of two pages: a Login page (`/login`) and a Register page (`/register`). Both pages use a centered card layout on the dark background. The Login page asks for email and password. The Register page asks for name, email, and password. These screens are never shown to authenticated users — if a logged-in user visits `/login` or `/register`, they are immediately redirected to `/` (home). Auth pages do not render the Navbar.

---

#### 1.1 Page Layout — Both Auth Pages

- **Background:** Full viewport, `--bg-primary` (`#02111B`)
- **Card:** Centered horizontally and vertically (flexbox or absolute center). Width: 400px on desktop. Card background: `--surface` (`#30292F`). Border: `1px solid --border-subtle`. Border-radius: `var(--radius-md)` (4px). Padding: 40px 40px.
- **App Logo / Brand:** At the top of the card, before the title. Display: `TRIPLANNER` in IBM Plex Mono, font-size 13px, font-weight 600, letter-spacing 0.2em, uppercase, color `--accent`. Margin-bottom: 32px.
- **Page Title:** Below brand. Font-size 20px, font-weight 400, color `--text-primary`. Login page: "sign in". Register page: "create account".
- **Subtitle / Link:** Below the page title, 12px, muted color. Login: "don't have an account? [register →]" where the link navigates to `/register`. Register: "already have an account? [sign in →]" where the link navigates to `/login`. Link color: `--accent`, no underline by default, underline on hover.
- **Form:** Margin-top 32px from subtitle.
- **Submit Button:** Full-width primary button. Login: "sign in". Register: "create account". Margin-top: 24px from last field.
- **No navbar, no footer.**

---

#### 1.2 Login Page (`/login`)

**User Flow:**
1. User navigates to `/login` (direct URL or redirect from protected route)
2. User sees the centered auth card with "TRIPLANNER" branding, "sign in" title, and the form
3. User enters their email address in the email field
4. User enters their password in the password field
5. User clicks "sign in" button (or presses Enter)
6. System shows loading state (button text replaced with inline spinner)
7. On success: JWT tokens stored in app state/storage, user redirected to `/` (home)
8. On error: Inline error message shown (see error states below)

**Form Fields:**

| Field | Label | Type | Placeholder | Validation |
|-------|-------|------|-------------|------------|
| Email | EMAIL | email | your@email.com | Required. Must be valid email format. Validated on blur and on submit. |
| Password | PASSWORD | password | ••••••••••• | Required. Minimum 1 character (server validates strength). Validated on submit only. |

- Fields appear in order: Email → Password (top to bottom)
- Spacing between fields: 20px
- Tab order: Email → Password → Submit button

**Submit Button:** Full-width primary button labeled "sign in". On click: disable all inputs + button, show inline spinner in button replacing text.

**States:**
- **Default:** Form rendered, inputs empty, button enabled
- **Typing:** As user types, clear any existing field-level error for that field on first keystroke
- **Loading:** Button shows centered 16px spinner (white), button background opacity 0.7, all inputs disabled
- **Field Error (email):** Red text below email input: e.g., `"email is required"` or `"please enter a valid email"`. Input border turns `rgba(220,80,80,0.7)`.
- **Field Error (password):** Red text below password input: `"password is required"`. Input border turns `rgba(220,80,80,0.7)`.
- **API Error — Invalid credentials (401):** Show a non-field error banner INSIDE the card, above the form fields. Style: background `rgba(220,80,80,0.1)`, border `1px solid rgba(220,80,80,0.3)`, padding 12px 16px, border-radius 2px, font-size 13px, text: `"incorrect email or password."` Dismiss automatically on next submit attempt.
- **API Error — Network / 500:** Same banner style as above, text: `"something went wrong. please try again."`. Show for 5 seconds then auto-dismiss.
- **Success:** Button spinner resolves, page transitions to `/` with no flash.

**Accessibility:**
- `<form>` with `aria-label="Sign in form"`
- Each input has explicit `<label>` associated via `htmlFor`/`id`
- Error messages use `role="alert"` and `aria-live="polite"`
- Submit button disabled state has `aria-disabled="true"`
- Password field has `autocomplete="current-password"`
- Email field has `autocomplete="email"`
- Focus ring: `outline: 2px solid --accent; outline-offset: 2px` on all focusable elements

---

#### 1.3 Register Page (`/register`)

**User Flow:**
1. User navigates to `/register` (direct URL or via "register →" link from login)
2. User sees the centered auth card with "TRIPLANNER" branding, "create account" title, and the form
3. User fills in their name, email, and password
4. User clicks "create account" button (or presses Enter from last field)
5. System shows loading state
6. On success: Account created, user auto-logged in (JWT stored), redirected to `/`
7. On error: Inline error messages shown per field, or banner for server errors

**Form Fields:**

| Field | Label | Type | Placeholder | Validation |
|-------|-------|------|-------------|------------|
| Name | NAME | text | your name | Required. Min 1 character. Trimmed. Validated on blur and submit. |
| Email | EMAIL | email | your@email.com | Required. Must be valid email format. Validated on blur and submit. |
| Password | PASSWORD | password | ••••••••••• | Required. Minimum 8 characters. Validated on blur and submit. |

- Fields appear in order: Name → Email → Password (top to bottom)
- Spacing between fields: 20px
- Tab order: Name → Email → Password → Submit

**Submit Button:** Full-width primary button labeled "create account". On click: disable all inputs + button, show inline spinner.

**States:**
- **Default:** Form rendered, all inputs empty, button enabled
- **Typing:** Clear field-level error for that field on first keystroke after an error was shown
- **Loading:** Button shows centered 16px spinner, all inputs disabled
- **Field Error (name):** Red text below name input: `"name is required"`. Red border.
- **Field Error (email — empty):** `"email is required"`. Red border.
- **Field Error (email — invalid format):** `"please enter a valid email address"`. Red border.
- **Field Error (email — taken, 409):** `"an account with this email already exists."` Red border. This error appears after submit (server response).
- **Field Error (password — empty):** `"password is required"`. Red border.
- **Field Error (password — too short):** `"password must be at least 8 characters"`. Red border. Shown on blur if fewer than 8 chars entered.
- **API Error — Network / 500:** Banner above form: `"something went wrong. please try again."` Auto-dismisses after 5s.
- **Success:** Spinner resolves, redirects to `/`.

**Accessibility:**
- `<form>` with `aria-label="Create account form"`
- Each input has explicit `<label>` with `htmlFor`/`id`
- Error messages: `role="alert"`, `aria-live="polite"`
- Name field: `autocomplete="name"`
- Email field: `autocomplete="email"`
- Password field: `autocomplete="new-password"`
- `aria-describedby` on password input points to hint text if shown: `"8 characters minimum"` (displayed below the label in 11px muted text, always visible as helper)

---

#### 1.4 Responsive Behavior — Auth Screens

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥768px) | Card centered, 400px wide, full-height centered |
| Mobile (<768px) | Card is full-width minus 32px horizontal padding (16px each side). Card padding reduces to 24px. Vertical centering maintained. Top padding: 48px. Card fills most of screen but has breathing room at top. |

---

---

### Spec 2: Home Page + Navbar

**Sprint:** #1
**Related Task:** T-002
**Status:** Approved

**Description:**
The Home page (`/`) is the primary dashboard for authenticated users. It displays all trips belonging to the current user as a grid of cards. From here, the user can create a new trip (via a modal), click into a trip to view its details, or delete a trip. For new users with no trips, an empty state is shown with a CTA to create their first trip. The Navbar is a persistent element rendered on all authenticated pages (Home + Trip Details) but NOT on auth pages.

---

#### 2.1 Navbar Component

The Navbar is a fixed-height horizontal bar pinned to the top of the viewport on all authenticated pages.

**Layout:**
- **Position:** `position: sticky; top: 0; z-index: 100`
- **Height:** 56px
- **Background:** `--bg-primary` (`#02111B`)
- **Bottom border:** `1px solid --border-subtle`
- **Inner container:** Max-width 1120px, centered, horizontal padding 32px. Display flex, align-items center, justify-content space-between.

**Left side — Brand:**
- Text: `TRIPLANNER` in IBM Plex Mono, font-size 12px, font-weight 600, letter-spacing 0.2em, uppercase, color `--accent`
- This text is a link (wrapped in `<a>` or `<Link>`) that navigates to `/`
- No underline. Hover: opacity 0.8.

**Center — Navigation Links (optional, Sprint 1 has only one):**
- On desktop: nav links are visible in the center or left-of-center
- Sprint 1 has one nav link: "home" → navigates to `/`
- Link style: font-size 12px, font-weight 400, letter-spacing 0.08em, uppercase, color `--text-muted`. Active route: color `--text-primary`, with a 1px bottom underline in `--accent`.
- Hover: color `--text-primary`, transition 150ms.

**Right side — User + Logout:**
- Display: flex, align-items center, gap 16px
- **Username:** The authenticated user's name (from auth context). Font-size 12px, font-weight 400, color `--text-muted`. Truncate at 20 characters with `text-overflow: ellipsis`.
- **Logout button:** Secondary button style but smaller. Label: "sign out". Font-size 11px, font-weight 500, letter-spacing 0.06em, uppercase. Padding: 6px 14px. Border: `1px solid --border-subtle`. Color: `--text-muted`. Hover: border `--border-accent`, color `--text-primary`. On click: call logout handler (clear tokens, redirect to `/login`). No confirmation dialog needed.

**Mobile Navbar (<768px):**
- Height remains 56px
- Brand text stays on left
- Nav links (if more than one) collapse into a hamburger menu (Sprint 1 has only one link, so it can stay visible or be hidden — keep it hidden on mobile to simplify, show only brand + logout)
- On mobile: left = brand, right = logout button only (username hidden)

**Accessibility:**
- Wrap navbar in `<nav>` element with `aria-label="Main navigation"`
- Logout button: `aria-label="Sign out"` for clarity
- Active nav link: `aria-current="page"`

---

#### 2.2 Home Page Layout

**URL:** `/`
**Protected:** Yes (redirect unauthenticated users to `/login`)

**Page Structure (top to bottom):**
1. Navbar (56px, sticky)
2. Page header area (padding-top: 48px, padding-bottom: 32px)
3. Trip grid or empty state
4. No footer in Sprint 1

**Page Header:**
- Container: Max-width 1120px, centered, horizontal padding 32px
- Left: Page title "my trips" — font-size 24px, font-weight 400, color `--text-primary`, IBM Plex Mono
- Right: "new trip" button — primary button style. Label: `+ new trip`. Font-size 12px, font-weight 500, letter-spacing 0.06em. On click: open Create Trip modal.
- The header row is a flex container with justify-content: space-between, align-items: center.

**Trip Grid (when trips exist):**
- Container: Max-width 1120px, centered, horizontal padding 32px
- Layout: CSS Grid. Columns: `repeat(3, 1fr)` on desktop (≥1024px), `repeat(2, 1fr)` on tablet (768–1023px), `1fr` on mobile (<768px)
- Grid gap: 16px
- Each cell: one Trip Card (see 2.3)

---

#### 2.3 Trip Card Component

Each trip in the list is represented as a card with the following layout:

**Card Container:**
- Background: `--surface` (`#30292F`)
- Border: `1px solid --border-subtle`
- Border-radius: `var(--radius-md)` (4px)
- Padding: 20px 24px
- Cursor: pointer (entire card is clickable)
- Hover: border color changes to `--accent` (`#5D737E`), transition 150ms
- On click: navigate to `/trips/:id`

**Card Content Layout (top to bottom):**

1. **Card Top Row** — Flex, justify-content: space-between, align-items: flex-start. Margin-bottom: 12px.
   - Left: Status badge (see design system conventions for badge styles)
   - Right: Delete button — icon only (trash icon, 16px). Color: `--text-muted`. Hover: color `rgba(220,80,80,0.8)`. `aria-label="Delete trip"`. Clicking this does NOT navigate — stops event propagation and shows the delete confirmation dialog.

2. **Trip Name** — Font-size 16px, font-weight 500, color `--text-primary`. Margin-bottom: 8px. Truncate after 2 lines with `overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical`.

3. **Destinations** — Font-size 12px, font-weight 400, color `--text-muted`. Destinations shown as a comma-separated string, or with a location pin icon (🗺 or SVG) preceding it. Example: `Tokyo, Osaka, Kyoto`. Truncate after 1 line. Margin-bottom: 16px.

4. **Divider** — `1px solid --border-subtle`. Margin-bottom: 16px.

5. **Timeline Row** — Flex, align-items: center, gap: 8px. Font-size: 11px, font-weight: 400, color `--text-muted`.
   - A calendar icon (SVG, 12px) followed by the date range: `Aug 7, 2026 — Aug 14, 2026`
   - If no flights or explicit date range exists yet: show `"dates not set"` in muted text
   - Date format: `MMM D, YYYY`

**Card States:**
- **Normal:** As described above
- **Hover:** Border color accent, slight cursor change (pointer)
- **Deleting (after delete confirmed):** Card fades out (`opacity: 0`) over 300ms, then is removed from DOM and grid reflows
- **Loading initial data:** Show skeleton version (see skeleton spec below)

**Card Skeleton (loading state):**
- Same card dimensions
- Replace all text with gray shimmer bars:
  - Badge area: 60px × 16px shimmer pill
  - Trip name: 80% width × 16px shimmer bar
  - Destinations: 50% width × 12px shimmer bar
  - Divider: shown as normal
  - Timeline: 40% width × 11px shimmer bar
- Shimmer animation: `background: linear-gradient(90deg, #3F4045 25%, #4A4550 50%, #3F4045 75%)` with `background-size: 200% 100%` and `animation: shimmer 1.5s infinite`

---

#### 2.4 Empty State (New User / No Trips)

Shown when the trip list API returns an empty array.

**Layout:**
- Full width column below the page header
- Centered content within the container
- Padding-top: 80px

**Content (vertically and horizontally centered text block):**
- Icon: A simple SVG "map" or "compass" icon, 48px, color `--accent` with 40% opacity
- Heading: `"no trips yet"` — font-size 18px, font-weight 400, color `--text-primary`. Margin-top: 24px.
- Subtext: `"start planning your first adventure."` — font-size 13px, color `--text-muted`. Margin-top: 8px.
- CTA Button: `"+ plan your first trip"` — primary button style. Margin-top: 24px. On click: open Create Trip modal.

**Note:** The "new trip" button in the page header remains visible even in empty state, so there are two entry points to the create modal.

---

#### 2.5 Create Trip Modal

Triggered by clicking `+ new trip` or `+ plan your first trip`.

**Modal Container:**
- Overlay: `position: fixed; inset: 0; background: rgba(2, 17, 27, 0.85); z-index: 200; display: flex; align-items: center; justify-content: center`
- Click outside modal = close modal (no changes saved)
- Escape key = close modal (no changes saved)
- Modal card: Width 480px, max-width `calc(100vw - 32px)`. Background: `--surface`. Border: `1px solid --border-subtle`. Border-radius: 4px. Padding: 32px.

**Modal Header:**
- Title: `"new trip"` — font-size 16px, font-weight 500, color `--text-primary`. Float left.
- Close button: `×` icon, 20px, color `--text-muted`, positioned top-right of the modal (absolute or flex end). Hover: color `--text-primary`. `aria-label="Close modal"`. On click: close modal.

**Modal Form Fields:**

| Field | Label | Type | Placeholder | Validation |
|-------|-------|------|-------------|------------|
| Trip Name | TRIP NAME | text | e.g. California road trip | Required. Min 1 character after trim. |
| Destinations | DESTINATIONS | text (free-form) | e.g. San Francisco, Los Angeles | Required. Min 1 character after trim. Helper text below: "separate multiple destinations with commas" in 11px muted text |

- Spacing between fields: 20px
- Tab order: Trip Name → Destinations → Create button → Cancel button

**Modal Actions Row:**
- Flex container, justify-content: flex-end, gap: 12px. Margin-top: 24px.
- Left button: "cancel" — secondary button style. On click: close modal.
- Right button: "create trip" — primary button style. On click: submit form. While submitting: disable both buttons, show spinner in "create trip" button.

**Validation:**
- Trip Name: Required. Show `"trip name is required"` below the field, red text, if submitted empty.
- Destinations: Required. Show `"please enter at least one destination"` below field if submitted empty.
- Both fields validate on submit attempt.

**Success Flow:**
- After API returns 201 Created: Close modal, navigate to `/trips/:id` where `:id` is the new trip ID returned by the API. (Do NOT just refresh the home page — go directly to the new trip's detail page per user flow in project brief.)

**Error Flow:**
- API error (network or 500): Show error banner at top of modal: `"could not create trip. please try again."` Banner style: same as auth error banner.

**Modal Accessibility:**
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title element
- Focus trap: when modal opens, focus moves to first input (Trip Name). Tab cycles within modal. Shift+Tab from first element goes to last focusable element.
- On close: return focus to the button that opened the modal

---

#### 2.6 Delete Trip Confirmation

Triggered by clicking the trash icon on a trip card.

**Implementation:** Use a small inline confirmation pattern (not a modal) — the card itself transforms:
- After clicking the trash icon: the card content is replaced with a confirmation row:
  - Text: `"delete this trip?"` — font-size 13px, color `--text-primary`
  - Two buttons: "yes, delete" (danger button style) and "cancel" (secondary button style), 11px font-size
  - `"yes, delete"` on click: calls DELETE API, then animates card out
  - "cancel" on click: restores card to normal state

**Alternative (simpler):** A small popover/tooltip-style confirmation anchored to the trash icon button with the same two-button layout. This avoids disrupting the card content.

**Use the inline card replacement approach** for Sprint 1 (simpler DOM management).

**Error state:** If delete API fails, restore card to normal state and show a bottom-right toast: `"could not delete trip. please try again."` Toast style: bg `--surface`, border `1px solid --border-subtle`, font-size 12px, padding 12px 16px, border-radius 4px, text `--text-primary`. Auto-dismiss after 4 seconds.

**Accessibility:**
- Delete button has `aria-label="Delete trip: [trip name]"` for screen reader context
- Confirmation buttons are focusable within the card after activation

---

#### 2.7 Home Page Loading State

When the page first mounts and is fetching trips from the API:
- Show page header normally (title + "new trip" button)
- In the grid area: Show 3 skeleton cards in a row (desktop), 2 (tablet), 1 (mobile)
- Skeleton cards use shimmer animation (see 2.3 skeleton spec)
- Skeleton resolves to real cards or empty state once API responds

---

#### 2.8 Home Page Error State

If the trips list API fails (network error or 500):
- Show page header normally
- Below header: A centered error block (similar to empty state layout):
  - Icon: A simple exclamation or warning SVG, 32px, muted color
  - Text: `"could not load trips."` — 16px, primary text
  - Subtext: `"check your connection and try again."` — 13px, muted
  - Retry button: secondary button style, "try again". On click: re-fetch trips.

---

#### 2.9 Responsive Behavior — Home Page

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | 3-column trip grid. Navbar shows all elements. Page header full-width. |
| Tablet (768–1023px) | 2-column trip grid. Navbar: brand + logout visible, nav link visible. |
| Mobile (<768px) | 1-column trip grid (full-width cards). Navbar: brand + logout only. Page header: title and "new trip" button stack if needed (flex-wrap: wrap, gap: 12px). |

---

---

### Spec 3: Trip Details Page (View Mode)

**Sprint:** #1
**Related Task:** T-003
**Status:** Approved

**Description:**
The Trip Details page (`/trips/:id`) provides a read-only overview of a single trip. It shows the trip name, destinations, a calendar placeholder (Sprint 2 feature), and three data sections: Flights, Stays, and Activities. Each section shows the relevant data as cards (if data exists) or an empty state with a CTA placeholder for adding entries (the actual edit functionality is deferred to Sprint 2 — buttons are visible but non-functional/disabled in Sprint 1). Activities are grouped by date and displayed chronologically within each day. The page fetches the trip and all sub-resources on mount. The Navbar is shown on this page.

---

#### 3.1 Page Layout

**URL:** `/trips/:id`
**Protected:** Yes (redirect to `/login` if unauthenticated)

**Page Structure (top to bottom):**
1. Navbar (56px, sticky) — same component as Home page
2. Page Header (trip name + back link + destinations)
3. Calendar Placeholder section
4. Flights Section
5. Stays Section
6. Activities Section
7. No footer

**Outer Container:** Max-width 1120px, centered, horizontal padding 32px. Padding-top: 40px from top of content area (below navbar).

---

#### 3.2 Page Header (Trip Name + Back Navigation)

**Back Link Row:**
- Above the trip name: `"← my trips"` — font-size 11px, font-weight 400, color `--text-muted`, uppercase, letter-spacing 0.08em. This is a link to `/`. On hover: color `--text-primary`.
- Margin-bottom: 16px.

**Trip Name:**
- Font-size: 28px, font-weight: 400, color: `--text-primary`
- Displays the trip's `name` field
- Margin-bottom: 8px

**Destinations Row:**
- Font-size: 13px, font-weight: 400, color: `--text-muted`
- Destinations shown as a string: `"Tokyo · Osaka · Kyoto"` (dot-separated). If destinations is an array, join with ` · `. If destinations is a comma-separated string, replace commas with ` · `.
- Margin-bottom: 40px

**Page Header skeleton (loading state):**
- Back link: 80px × 11px shimmer bar
- Trip name: 200px × 28px shimmer bar
- Destinations: 150px × 13px shimmer bar

---

#### 3.3 Calendar Placeholder Section

**Position:** First section below the page header.

**Container:**
- Background: `--surface` (`#30292F`)
- Border: `1px solid --border-subtle`
- Border-radius: 4px
- Width: 100%
- Height: 200px (fixed height for the placeholder)
- Display: flex, align-items: center, justify-content: center, flex-direction: column
- Margin-bottom: 48px

**Content:**
- Icon: A simple calendar SVG icon, 32px, color `--accent` with 40% opacity
- Text: `"calendar coming in sprint 2"` — font-size 13px, font-weight 400, color `--text-muted`, letter-spacing 0.04em
- Subtext (smaller, below): `"flights, stays, and activities will appear here once the calendar is built."` — font-size 11px, color `rgba(252,252,252,0.3)`. Margin-top: 8px.

**No border on this section header.** The calendar is its own contained block, not using the section header pattern.

---

#### 3.4 Section Component Pattern

Each of the three data sections (Flights, Stays, Activities) follows the same structural pattern:

**Section Header Row:**
- Flex container, align-items: center, gap: 16px. Margin-bottom: 20px.
- Left: Section title — font-size 11px, font-weight: 600, letter-spacing: 0.12em, uppercase, color: `--text-muted`
- Center: A `<hr>` style line filling remaining space: `flex: 1; height: 1px; background: --border-subtle; border: none`
- Right: Action button — "add [item]" (e.g., "add flight", "add stay", "add activity"). Style: secondary button, font-size 11px, padding: 5px 12px. **In Sprint 1, this button is present but disabled** (`disabled` attribute). It is visually muted (opacity 0.4). A tooltip on hover says: `"editing coming soon"`. `aria-disabled="true"`. This sets up the UI contract for Sprint 2 without removing it.

**Section Container:** Margin-bottom: 48px before the next section.

---

#### 3.5 Flights Section

**Section Title:** "flights"
**Section Action Button:** "add flight" (disabled in Sprint 1)

**Flight Card:**

Each flight from the API is displayed as a card:

- **Card Container:** Background: `--surface`, border: `1px solid --border-subtle`, border-radius: 4px, padding: 20px 24px, margin-bottom: 12px.
- **Card Layout:** Two-column layout on desktop:
  - Left column (flex: 1): Departure info
  - Center (visual): Arrow or flight path indicator (optional: a subtle `→` in `--accent` color, centered)
  - Right column (flex: 1): Arrival info

**Left Column — Departure:**
- Airport code (e.g., `JFK`) — font-size: 20px, font-weight: 500, color: `--text-primary`
- City/airport name (if available, else the airport code alone is fine) — font-size: 11px, color: `--text-muted`, margin-top: 4px
- Departure datetime (local timezone): `Aug 7, 2026 · 6:00 AM ET` — font-size: 13px, color: `--text-primary`, margin-top: 8px. Format: `MMM D, YYYY · h:mm A tz`. Use the stored timezone string.

**Center — Airline + Flight Number:**
- Displayed in the center between departure and arrival columns
- Airline name: font-size 11px, color `--text-muted`, uppercase, letter-spacing 0.08em
- Flight number: font-size 12px, font-weight 500, color `--accent`. Margin-top: 4px.
- A subtle dividing arrow or line: `→` in `--accent` below the airline/flight number, font-size 16px

**Right Column — Arrival:**
- Same layout as departure: airport code (large), datetime (local timezone)
- Format: `Aug 7, 2026 · 8:00 AM PT` — note: different timezone from departure

**Card Footer (below the two-column row, separated by 1px line):**
- Margin-top: 16px, padding-top: 16px, border-top: `1px solid --border-subtle`
- Flex row with muted metadata:
  - `airline: [Airline Name]` — font-size 11px, color `--text-muted`. (If shown in center already, this can be omitted here)
  - Divider: `·`
  - `flight: [flight number]`
- This footer is optional if the center column already shows airline + flight number clearly.

**Flight Card — Compact layout on mobile:**
- Stack departure and arrival vertically (full-width column)
- Departure on top, arrival below, separated by a subtle arrow (`↓`)

**Multiple Flights:** Stacked vertically with 12px gap between cards.

---

#### 3.6 Flights Empty State

Shown when the flights API returns an empty array for this trip.

**Layout:** Within the flights section, replacing the cards:
- Background: `--surface`, border: `1px dashed rgba(93,115,126,0.3)` (dashed to indicate empty/placeholder), border-radius: 4px, padding: 32px, text-align: center.
- Icon: Plane SVG, 28px, color `--accent` with 30% opacity. Centered.
- Text: `"no flights added yet."` — font-size 13px, color `--text-muted`. Margin-top: 12px.
- Sub-CTA: `"add your flight details to see them here."` — font-size 11px, color `rgba(252,252,252,0.3)`. Margin-top: 4px.
- Note: The section's "add flight" button in the header is the action entry point (disabled in Sprint 1).

---

#### 3.7 Stays Section

**Section Title:** "stays"
**Section Action Button:** "add stay" (disabled in Sprint 1)

**Stay Card:**

Each stay from the API is displayed as a card:

- **Card Container:** Background: `--surface`, border: `1px solid --border-subtle`, border-radius: 4px, padding: 20px 24px, margin-bottom: 12px.
- **Card Layout (top to bottom):**

1. **Top Row:** Flex, justify-content: space-between, align-items: flex-start.
   - Left: Stay name — font-size: 15px, font-weight: 500, color: `--text-primary`. E.g., `"Hyatt Regency San Francisco"`
   - Right: Category badge (pill-style, similar to status badge): `HOTEL`, `AIRBNB`, or `VRBO`. Same pill style as status badges but use a neutral color: bg `rgba(93,115,126,0.2)`, text `#5D737E`.

2. **Address Row:** Margin-top: 8px.
   - Font-size: 12px, color: `--text-muted`
   - If address provided: show address text preceded by a location pin SVG (12px)
   - If address is null/empty: show `"address not provided"` in `rgba(252,252,252,0.3)` (even more muted)

3. **Dates Row:** Margin-top: 12px. Flex row, gap: 24px.
   - Check-in: Label `CHECK IN` (10px, font-weight 600, uppercase, muted) above date `Aug 7, 2026 · 4:00 PM` (13px, `--text-primary`)
   - Check-out: Label `CHECK OUT` above date `Aug 9, 2026 · 11:00 AM` (13px, `--text-primary`)
   - Both display in local timezone as stored.

**Multiple Stays:** Stacked vertically with 12px gap.

---

#### 3.8 Stays Empty State

Same dashed container pattern as Flights:
- Icon: A bed/house SVG, 28px, `--accent` at 30% opacity
- Text: `"no stays added yet."`
- Subtext: `"add your accommodation details to see them here."`

---

#### 3.9 Activities Section

**Section Title:** "activities"
**Section Action Button:** "add activities" (disabled in Sprint 1)

Activities are grouped by date and sorted chronologically within each day.

**Day Group:**
- **Day Header:** Margin-bottom: 12px. Flex row, align-items: center, gap: 12px.
  - Date: `"Friday, Aug 8, 2026"` — font-size: 12px, font-weight: 500, color: `--text-primary`, uppercase, letter-spacing: 0.08em
  - A thin `<hr>` line filling the rest of the row: `flex: 1; height: 1px; background: --border-subtle; border: none`
- **Activity List:** List of activity entries within this day, sorted by `start_time` ascending. Margin-bottom: 8px between activities within a day.
- **Day Group Margin:** 24px margin-bottom between day groups.

**Activity Entry:**

Each activity within a day:
- **Container:** Background: `--surface`, border: `1px solid --border-subtle`, border-radius: 4px, padding: 14px 20px.
- **Layout:** Flex row, align-items: center, gap: 16px.
  - **Time Column:** Fixed width ~80px. Display the time range: `9:00 AM` (start). Font-size: 12px, font-weight: 500, color: `--accent`. Below it: `→ 2:00 PM` (end time) in 11px, color `--text-muted`.
  - **Divider:** `1px solid --border-subtle` vertical line, height: 32px.
  - **Activity Details:** Flex: 1.
    - Activity name: font-size 13px, font-weight 500, color `--text-primary`. E.g., `"Fisherman's Wharf"`
    - Location (if provided): font-size 11px, color `--text-muted`, margin-top: 4px. Preceded by a location pin SVG (10px).
    - If no location: omit location row.

**Sorting logic note:** Activities within a day are sorted by `start_time` ascending. If two activities have the same start time, sort alphabetically by name.

**Multiple Day Groups:** Stacked vertically in chronological date order.

---

#### 3.10 Activities Empty State

Same dashed container pattern:
- Icon: A calendar/list SVG, 28px, `--accent` at 30% opacity
- Text: `"no activities planned yet."`
- Subtext: `"add your daily itinerary to see it here, grouped by day."`

---

#### 3.11 Full Page Loading State

When the page is fetching all data on mount (trip + flights + stays + activities — these can be parallel requests):

- **Page header skeleton:** As described in 3.2
- **Calendar placeholder:** Shown immediately (no data dependency)
- **Each section:** Shows a section header skeleton (shimmer for the title) + one placeholder content skeleton:
  - Flights: 1 skeleton flight card (full width, ~80px tall shimmer block)
  - Stays: 1 skeleton stay card (full width, ~80px tall shimmer block)
  - Activities: 1 skeleton day group with 2 skeleton activity entries

The page resolves each section independently as data arrives (don't block all sections waiting for the slowest request).

---

#### 3.12 Full Page Error State

If the trip fetch fails (trip not found, 404, or network error):

- Navbar still renders
- Below navbar: A centered error block (full height):
  - Heading: `"trip not found."` — font-size 20px, `--text-primary`. Or `"could not load trip."` for network errors.
  - Subtext: appropriate description.
  - "back to home" button: secondary button style, links to `/`.

If sub-resource fetches fail (flights/stays/activities individually), the section shows an error state instead of empty state:
- Icon: Warning SVG, 24px
- Text: `"could not load [flights/stays/activities]."` — 13px, muted
- Retry link: `"try again"` — small accent-colored link, on click: re-fetch that section independently.

---

#### 3.13 Responsive Behavior — Trip Details Page

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | Full layout as described. Flight cards: two-column departure/arrival. All sections full-width. |
| Tablet (768–1023px) | Same as desktop but slightly reduced padding. Flight cards may compress the center column. |
| Mobile (<768px) | Page padding: 16px horizontal. Flight cards: stacked layout (departure on top, arrival below, arrow between). Stay cards: full width, dates stack vertically. Activity entries: time column narrows to 60px. Section headers: action button wraps to new line or is hidden behind a compact icon. |

---

#### 3.14 Section Order & Spacing Summary

| Position | Element | Margin Below |
|----------|---------|-------------|
| 1 | Page Header (back link + title + destinations) | 40px |
| 2 | Calendar Placeholder block | 48px |
| 3 | Flights Section (header + cards/empty) | 48px |
| 4 | Stays Section (header + cards/empty) | 48px |
| 5 | Activities Section (header + cards/empty) | 64px |

---

#### 3.15 Accessibility — Trip Details Page

- Back link: `aria-label="Back to my trips"`
- All section headers: use `<h2>` semantically (styled with CSS to match spec, not semantic `<h2>` default styles)
- Each flight card: wrapped in `<article>` with `aria-label="Flight [flight number]: [from] to [to]"`
- Each stay card: wrapped in `<article>` with `aria-label="Stay: [name]"`
- Activity day groups: `<section>` with `aria-label="Activities for [date]"`
- Each activity entry: `<article>` with `aria-label="[name], [start time] to [end time]"`
- Empty states: `role="status"` on the container so screen readers announce them
- Disabled action buttons: `aria-disabled="true"`, `title="Editing coming in Sprint 2"` for tooltip
- All SVG icons: either `aria-hidden="true"` (decorative) or have `<title>` element for meaningful icons

---

---

## Sprint 2 Specs

---

### Spec 4: Flights Edit Page

**Sprint:** #2
**Related Task:** T-023
**Status:** Approved

**Description:**
The Flights Edit page (`/trips/:id/edit/flights`) lets authenticated users add new flights, edit existing flights, and delete flights for a given trip. It is reached by clicking the "Edit flights" link/button on the Trip Details page (the button that was disabled in Sprint 1). The page uses a list-then-form pattern: existing flights are shown as compact cards at the top with inline edit/delete controls, and a form section at the bottom allows adding a new flight or editing a selected one. All changes are saved incrementally (each save/delete calls the API immediately); the user returns to Trip Details via "Done editing."

---

#### 4.1 Page Layout

**URL:** `/trips/:id/edit/flights`
**Protected:** Yes (redirect to `/login` if unauthenticated)

**Page Structure (top to bottom):**
1. Navbar (56px, sticky) — same as all authenticated pages
2. Page header row (title + done button)
3. Existing flights section (list of cards, or empty state message)
4. Add/Edit flight form section
5. Page footer row (done button repeated for long pages)

**Outer Container:** Max-width 1120px, centered, horizontal padding 32px. Padding-top: 40px.

---

#### 4.2 Page Header Row

- **Layout:** Flex row, `justify-content: space-between`, `align-items: flex-start`
- **Left side (stacked vertically):**
  - Back link (above title): `"← back to trip"` — font-size 11px, font-weight 400, color `--text-muted`, uppercase, letter-spacing 0.08em. Links to `/trips/:id`. Hover: color `--text-primary`. Margin-bottom: 8px.
  - Page title: `"edit flights"` — font-size 24px, font-weight 400, color `--text-primary`, IBM Plex Mono
- **Right side:** "done editing" button — primary button style, font-size 12px. On click: navigate to `/trips/:id`. `aria-label="Done editing flights, return to trip details"`.

---

#### 4.3 Existing Flights List

**Section Header:** "your flights" — standard section header pattern (11px, uppercase, muted, extending line to the right). Margin-top: 40px, margin-bottom: 16px.

**When loading (initial fetch):**
- Show 1–2 skeleton cards in the list area (shimmer animation, ~72px tall each, full width)
- Form section remains visible below

**When no flights exist:**
- Show a dashed-border placeholder container instead of cards:
  - `border: 1px dashed rgba(93,115,126,0.3)`, padding: 24px, border-radius: 4px, text-align: center
  - Text: `"no flights added yet."` — 13px, `--text-muted`
  - Sub-text: `"use the form below to add your first flight."` — 11px, `rgba(252,252,252,0.3)`
- Margin-bottom: 32px

**If fetch fails:**
- Show error container: `"could not load flights."` (13px, muted) + `"try again"` link (accent color, on click: re-fetch)
- Form still shown below and usable

**When flights exist — Flight List Card (Compact View):**

Each flight is displayed as a compact card:
- **Card Container:** Background: `--surface`, border: `1px solid --border-subtle`, border-radius: 4px, padding: 16px 20px, margin-bottom: 10px. Transition: border-color 150ms.
- **Card Layout:** Flex row, align-items: center, gap: 16px.
  - **Flight info block (flex: 1):** Flex column, gap: 4px.
    - Top row (flex): Airline name (12px, muted) + `·` + Flight number (13px, font-weight 500, color `--accent`)
    - Bottom row (flex, gap: 8px): From location (12px, primary) → `→` (accent) → To location (12px, primary)
  - **Datetime info block (width: 220px, shrink: 0 on desktop):**
    - Departure: `"Aug 7 · 6:00 AM"` + timezone string (e.g., `ET`) — 12px, muted
    - Arrival: `"Aug 7 · 8:00 AM"` + timezone string — 12px, muted. Margin-top: 4px.
  - **Actions block (flex-shrink: 0, display: flex, gap: 12px, align-items: center):**
    - Edit (pencil) icon button: 16px SVG, color `--text-muted`. Hover: color `--accent`. `aria-label="Edit flight [flight_number]"`.
    - Delete (trash) icon button: 16px SVG, color `--text-muted`. Hover: color `rgba(220,80,80,0.8)`. `aria-label="Delete flight [flight_number]"`.

**Delete Confirmation (Inline):**
- When delete icon is clicked, the card content is replaced with a confirmation row:
  - Text: `"delete this flight?"` — 13px, `--text-primary`. Flex: 1.
  - Buttons (flex-shrink: 0): "yes, delete" (danger button style, 11px, padding: 5px 12px) + "cancel" (secondary button style, 11px)
  - `"yes, delete"` on click: Call `DELETE /trips/:id/flights/:flightId`. On success: card fades out (`opacity: 0`, `transition: opacity 300ms`), then removed from DOM. On API failure: restore card + show toast `"could not delete flight. please try again."` (bottom-right, auto-dismiss 4s).
  - `"cancel"` on click: restore original card content immediately.

---

#### 4.4 Add / Edit Flight Form Section

**Section Header Row:**
- **When in Add mode:** Section header label: `"add a flight"` (standard section header style)
- **When in Edit mode:** Section header label: `"editing flight"` + to the right of the line: a `"cancel edit"` link (12px, `--accent` color, no underline, underline on hover). On click: discard edit state, return form to blank Add mode (no API call).

**Form Container:** Background: `--surface`, border: `1px solid --border-subtle`, border-radius: 4px, padding: 24px. Margin-top: 8px (after section header).

**Field Grid:** On desktop (≥768px): 2-column CSS Grid (`grid-template-columns: 1fr 1fr`, gap: 20px 24px). On mobile (<768px): 1-column stack (gap: 20px).

**Field Layout (Row × Column):**

| Row | Column 1 | Column 2 |
|-----|----------|----------|
| 1 | FLIGHT NUMBER | AIRLINE |
| 2 | FROM | TO |
| 3 | DEPARTURE DATE & TIME | DEPARTURE TIMEZONE |
| 4 | ARRIVAL DATE & TIME | ARRIVAL TIMEZONE |

**Field Specifications:**

| Field | Label | Input Type | Placeholder | Required | Notes |
|-------|-------|-----------|-------------|----------|-------|
| flight_number | FLIGHT NUMBER | `text` | `e.g. DL1234` | Yes | Max 20 chars |
| airline | AIRLINE | `text` | `e.g. Delta Air Lines` | Yes | Max 100 chars |
| from_location | FROM | `text` | `e.g. New York (JFK)` | Yes | Max 100 chars |
| to_location | TO | `text` | `e.g. San Francisco (SFO)` | Yes | Max 100 chars |
| departure_at | DEPARTURE DATE & TIME | `datetime-local` | — | Yes | Input styled per design system |
| departure_tz | DEPARTURE TIMEZONE | `select` | — | Yes | Timezone dropdown (see 4.5) |
| arrival_at | ARRIVAL DATE & TIME | `datetime-local` | — | Yes | Must be after departure_at |
| arrival_tz | ARRIVAL TIMEZONE | `select` | — | Yes | Timezone dropdown (see 4.5) |

All fields follow the Form Pattern from the Design System (11px uppercase label above, full-width input, `--surface-alt` background, accent border on focus).

**Form Actions Row:** Flex, `justify-content: flex-end`, gap: 12px. Margin-top: 24px, padding-top: 16px, border-top: `1px solid --border-subtle`.
- **Add mode:** `"Save flight"` (primary button). While submitting: button shows inline spinner (16px), disabled.
- **Edit mode:** `"Save changes"` (primary button). While submitting: spinner, disabled.
- No "Cancel" button in the action row — cancel edit is via the `"cancel edit"` link in the section header.

**Client-Side Validation (triggered on submit attempt):**
- Empty required field: show `"[field name] is required"` below the field in 12px `rgba(220,80,80,0.9)`. Red border on input.
- `arrival_at` ≤ `departure_at`: show `"arrival must be after departure"` below the arrival_at field.
- Empty timezone select: show `"please select a timezone"` below the select.
- Error clears on first keystroke or change in that field.

**On Save Success (Add):**
- New flight card appears at the bottom of the existing flights list
- Newly added card gets a temporary accent-colored border (`border-color: --accent`) for 1.5s, then transitions back to `--border-subtle`
- Form fields all reset to empty/default values
- Focus moves to the first form field (flight_number)

**On Save Success (Edit):**
- The corresponding flight card in the list updates with new data
- Updated card gets the temporary accent border highlight (1.5s)
- Form resets to blank Add mode
- Section header returns to "add a flight"

**On Save Error (API failure):**
- Show error banner below the form actions: background `rgba(220,80,80,0.1)`, border `1px solid rgba(220,80,80,0.3)`, padding: 12px 16px, border-radius: 2px, 13px, text: `"could not save flight. please try again."`
- All form fields remain populated (do not clear user input)
- Button returns to normal state (not disabled)

**When Edit icon is clicked on a flight card:**
- Form section header changes to "editing flight" + "cancel edit" link
- All form fields are populated with the flight's existing data:
  - `departure_at`: convert ISO UTC string to `YYYY-MM-DDTHH:MM` format for datetime-local input (note: store the UTC offset-adjusted value so the displayed local time matches the timezone)
  - `departure_tz`, `arrival_tz`: pre-select the matching IANA timezone option
- Focus moves to the first form field (flight_number)
- The flight card being edited gets a subtle accent left border (`border-left: 3px solid --accent`) to indicate it is being edited

---

#### 4.5 Timezone Dropdown Component

Used in both departure and arrival timezone fields on flights, and check-in/out timezone fields on stays.

**Display:** A `<select>` element styled to match the standard input (same background, border, font, padding). On focus: `border-color: --accent`.

**Default Option:** `"Select timezone"` — value `""`, disabled, selected by default. Styled in `--text-muted`.

**Curated Timezone List (~28 options, ordered roughly West to East by UTC offset):**

| Display Label | IANA Identifier |
|---------------|-----------------|
| HST — Hawaii Time | `Pacific/Honolulu` |
| AKT — Alaska Time | `America/Anchorage` |
| PT — Pacific Time | `America/Los_Angeles` |
| PT — Pacific Time (Vancouver) | `America/Vancouver` |
| MT — Mountain Time | `America/Denver` |
| CT — Central Time | `America/Chicago` |
| ET — Eastern Time | `America/New_York` |
| ET — Eastern Time (Toronto) | `America/Toronto` |
| BRT — Brasília Time | `America/Sao_Paulo` |
| GMT/BST — London | `Europe/London` |
| CET — Central European | `Europe/Paris` |
| CET — Central European (Berlin) | `Europe/Berlin` |
| CET — Central European (Rome) | `Europe/Rome` |
| CET — Central European (Madrid) | `Europe/Madrid` |
| CET — Central European (Amsterdam) | `Europe/Amsterdam` |
| MSK — Moscow Standard Time | `Europe/Moscow` |
| GST — Gulf Standard Time | `Asia/Dubai` |
| IST — India Standard Time | `Asia/Kolkata` |
| ICT — Indochina Time | `Asia/Bangkok` |
| WIB — West Indonesia Time | `Asia/Jakarta` |
| SGT — Singapore Time | `Asia/Singapore` |
| CST — China Standard Time | `Asia/Shanghai` |
| KST — Korea Standard Time | `Asia/Seoul` |
| JST — Japan Standard Time | `Asia/Tokyo` |
| AEDT/AEST — Eastern Australia | `Australia/Sydney` |
| AEDT/AEST — Eastern Australia (Melbourne) | `Australia/Melbourne` |
| NZDT/NZST — New Zealand | `Pacific/Auckland` |

**Display format in the option:** `"PT — Pacific Time"` (abbreviated name first, then full description). The IANA identifier is the option's `value`.

Define this constant list in `frontend/src/utils/timezones.js` as an exported array of `{ label, value }` objects.

---

#### 4.6 Page Footer Row

Repeat the "done editing" button at the bottom of the page for convenience on longer pages:
- Same primary button style, same behavior (navigate to `/trips/:id`)
- Margin-top: 40px, padding-top: 24px, border-top: `1px solid --border-subtle`

---

#### 4.7 Responsive Behavior — Flights Edit Page

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥768px) | 2-column form grid. Flight cards full-width with datetime info block visible. |
| Mobile (<768px) | 1-column form stack. Flight cards: datetime info block hidden or stacked below. Actions (edit/delete) always visible. Page padding: 16px horizontal. |

On mobile, each flight card collapses to:
- Row 1: Airline + flight number (full width)
- Row 2: From → To (full width)
- Row 3: Departure datetime only (abbreviated)
- Row 4: Edit + Delete icon buttons (right-aligned)

---

#### 4.8 Accessibility — Flights Edit Page

- `<h1>` semantically for "edit flights" (styled per spec, removes default browser h1 styles)
- Back link: `aria-label="Back to trip details"`
- Form: `<form aria-label="Add flight form">` (changes to `aria-label="Edit flight form"` in edit mode)
- All inputs: explicit `<label>` with `htmlFor` matching input `id`
- Error messages: `role="alert"` + `aria-live="polite"`
- Edit icon buttons: `aria-label="Edit flight [flight_number]"` (e.g., "Edit flight DL1234")
- Delete icon buttons: `aria-label="Delete flight [flight_number]"`
- Focus management: when edit icon clicked → focus moves to `flight_number` input. After successful save → focus returns to the saved card's edit icon. After delete → focus moves to next card or section header.
- Timezone select: `<label>` explicitly associated

---

### Spec 5: Stays Edit Page

**Sprint:** #2
**Related Task:** T-024
**Status:** Approved

**Description:**
The Stays Edit page (`/trips/:id/edit/stays`) allows users to add, edit, and delete accommodation stays for a trip. It follows the exact same page skeleton as the Flights Edit page (list-then-form pattern) with the following differences: the form fields reflect stay data (category, name, address, check-in/out datetimes + timezones), and the list cards display stay-specific info (category badge, name, address, check-in/out dates).

---

#### 5.1 Page Layout

**URL:** `/trips/:id/edit/stays`
**Protected:** Yes

**Page Structure:** Identical to Flights Edit Page (Spec 4.1). Replace all "flight" references with "stay":
- Page title: `"edit stays"`
- Section header: `"your stays"` / `"add a stay"` / `"editing stay"`
- "Done editing" button: navigates to `/trips/:id`

---

#### 5.2 Existing Stays List

Identical pattern to Spec 4.3, but each card shows stay-specific information:

**Stay List Card (Compact View):**
- **Card Container:** Same style as flight card (surface, border, radius, padding: 16px 20px, margin-bottom: 10px)
- **Card Layout:** Flex row, align-items: center, gap: 16px

  - **Stay info block (flex: 1):** Flex column, gap: 4px.
    - Top row: Category badge (pill: HOTEL / AIRBNB / VRBO, same style as Trip Details stay cards — `rgba(93,115,126,0.2)` bg, `#5D737E` text, 10px, uppercase, padding: 2px 8px, border-radius: 2px)
    - Middle row: Stay name — 14px, font-weight 500, `--text-primary`
    - Bottom row: Address — 12px, `--text-muted`. If null/empty: `"address not provided"` in `rgba(252,252,252,0.3)`.
  - **Dates block (width: 260px, shrink: 0 on desktop):**
    - Check-in: Label `CHECK IN` (10px, uppercase, muted) followed by `"Aug 7 · 4:00 PM PT"` (12px, primary)
    - Check-out: Label `CHECK OUT` followed by `"Aug 9 · 11:00 AM PT"` (12px, primary). Margin-top: 6px.
  - **Actions block:** Edit (pencil) + Delete (trash) icon buttons — same style and behavior as flights

**Delete Confirmation:** Identical inline pattern to Spec 4.3. Toast on error: `"could not delete stay. please try again."`

**Empty State (No Stays):**
- Dashed border container, text: `"no stays added yet."`, sub-text: `"use the form below to add your first stay."`

**Loading / Error State:** Same pattern as Spec 4.3.

---

#### 5.3 Add / Edit Stay Form Section

**Field Grid:** Same 2-column grid on desktop, 1-column on mobile.

**Field Layout (Row × Column):**

| Row | Column 1 | Column 2 |
|-----|----------|----------|
| 1 | CATEGORY | NAME |
| 2 | ADDRESS (spans both columns on desktop, full-width) | |
| 3 | CHECK-IN DATE & TIME | CHECK-IN TIMEZONE |
| 4 | CHECK-OUT DATE & TIME | CHECK-OUT TIMEZONE |

For Row 2 (ADDRESS), use `grid-column: 1 / -1` so it spans the full width of the 2-column grid.

**Field Specifications:**

| Field | Label | Input Type | Placeholder | Required | Notes |
|-------|-------|-----------|-------------|----------|-------|
| category | CATEGORY | `select` | — | Yes | Values: HOTEL, AIRBNB, VRBO |
| name | NAME | `text` | `e.g. Hyatt Regency San Francisco` | Yes | Max 255 chars |
| address | ADDRESS | `text` | `e.g. 5 Embarcadero Center, San Francisco, CA` | No | Optional. Helper text below: `"leave blank if unknown"` (11px, muted) |
| check_in_at | CHECK-IN DATE & TIME | `datetime-local` | — | Yes | |
| check_in_tz | CHECK-IN TIMEZONE | `select` | — | Yes | Uses timezone dropdown (Spec 4.5) |
| check_out_at | CHECK-OUT DATE & TIME | `datetime-local` | — | Yes | Must be after check_in_at |
| check_out_tz | CHECK-OUT TIMEZONE | `select` | — | Yes | Uses timezone dropdown (Spec 4.5) |

**Category Select:**
- `<select>` styled same as timezone dropdown
- Default option: `"Select category"` — disabled, selected by default
- Options: `HOTEL`, `AIRBNB`, `VRBO`
- When editing: pre-select the current category

**Validation:**
- All required fields validate on submit
- `check_out_at` ≤ `check_in_at`: error `"check-out must be after check-in"` below check_out_at field
- Same error style and clearing behavior as Spec 4.4

**On Save Success / Error:** Same behavior as Spec 4.4, substituting "stay" for "flight" in all messages.

**When Edit icon is clicked on a stay card:**
- Form pre-populated with existing stay data (all fields)
- Category select pre-selects matching value
- Address field shows existing address or empty string
- Form section header changes to `"editing stay"` + `"cancel edit"` link
- The stay card being edited shows accent left border highlight

**Form Actions Row:** Same pattern — `"Save stay"` (add mode) / `"Save changes"` (edit mode), primary button with spinner on submit.

**API Error Banner:** `"could not save stay. please try again."`

---

#### 5.4 Responsive Behavior — Stays Edit Page

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥768px) | 2-column form grid. ADDRESS field spans both columns. Dates block visible in list cards. |
| Mobile (<768px) | 1-column form stack. Stay cards: dates block stacks below name/address. Category badge + name row visible at all sizes. Page padding: 16px. |

---

#### 5.5 Accessibility — Stays Edit Page

Same principles as Spec 4.8, substituting "stay" for "flight" in all aria-labels:
- `aria-label="Add stay form"` / `aria-label="Edit stay form"`
- `aria-label="Edit stay [stay name]"` / `aria-label="Delete stay [stay name]"`
- Category select: `<label htmlFor="category">CATEGORY</label>`
- Address: note helper text as `aria-describedby` pointing to helper text element

---

### Spec 6: Activities Edit Page

**Sprint:** #2
**Related Task:** T-025
**Status:** Approved

**Description:**
The Activities Edit page (`/trips/:id/edit/activities`) uses a row-based multi-entry form layout. Unlike the Flights and Stays edit pages (which save incrementally), activities are edited as a batch: all existing activities are shown as pre-populated editable rows, new rows are added with a "+" button, and rows can be deleted inline. The entire batch is committed at once with a "Save all" button. "Cancel" discards all pending changes and navigates back to trip details. This approach is suited to the typical use case of planning multiple activities at once (as demonstrated in the project brief user flow).

---

#### 6.1 Page Layout

**URL:** `/trips/:id/edit/activities`
**Protected:** Yes

**Page Structure (top to bottom):**
1. Navbar (56px, sticky)
2. Page header row (title + save/cancel actions)
3. Column headers row (labels for the row fields)
4. Activity rows (existing pre-populated + new empty rows)
5. "+" Add row button
6. Page footer row (save/cancel repeated)

**Outer Container:** Max-width 1120px, centered, horizontal padding 32px. Padding-top: 40px.

---

#### 6.2 Page Header Row

- **Layout:** Flex row, `justify-content: space-between`, `align-items: flex-start`
- **Left side:**
  - Back link: `"← back to trip"` (same style as other edit pages, links to `/trips/:id`)
  - Margin-bottom: 8px
  - Page title: `"edit activities"` — font-size 24px, font-weight 400, `--text-primary`
- **Right side — Action buttons (flex row, gap: 12px):**
  - `"Cancel"` — secondary button style, font-size 12px. On click: navigate to `/trips/:id` without any API calls. No confirmation dialog needed (data is not saved until "Save all").
  - `"Save all"` — primary button style, font-size 12px. On click: commit all changes (POST new rows, PATCH edited rows, DELETE removed rows), then navigate to `/trips/:id`. Shows spinner while in progress.

**Loading state for "Save all":** Both buttons disabled. "Save all" shows inline spinner. A status message below the header: `"saving activities..."` (13px, muted). On success: automatic navigation to `/trips/:id`.

**Save error:** If one or more API calls fail: show an error banner below the header row: `"some activities could not be saved. please review and try again."` The rows that failed remain in their error state (see row error state below). Rows that saved successfully are updated/removed from the form.

---

#### 6.3 Loading State (Initial Fetch)

When the page first mounts and is fetching existing activities:
- Show 3 skeleton rows in place of the activity rows (shimmer bars the full width of the row container, ~52px tall each)
- Column headers are shown immediately (not in skeleton)
- The "+" button is shown (disabled) during loading

---

#### 6.4 Column Header Row

A sticky header row above the activity rows that labels each column. Sticks below the Navbar when scrolling on long lists.

- **Container:** `position: sticky; top: 56px; z-index: 10; background: --bg-primary; padding: 12px 0; border-bottom: 1px solid --border-subtle; margin-bottom: 0`
- **Layout:** Flex row matching the activity row column widths (see 6.5)
- **Labels:** 10px, font-weight 600, uppercase, letter-spacing 0.1em, color `--text-muted`

Column labels and approximate widths:

| Column | Label | Width |
|--------|-------|-------|
| Date | DATE | 150px |
| Name | ACTIVITY NAME | flex: 2 (minimum 180px) |
| Location | LOCATION | flex: 1.5 (minimum 140px) |
| Start time | START | 110px |
| End time | END | 110px |
| Delete | — | 40px |

On mobile (<768px): columns collapse — see Spec 6.8 for mobile layout.

---

#### 6.5 Activity Row

Each activity (existing or new) is one row. Rows are rendered in order: existing activities first (sorted by activity_date ascending, then start_time ascending), then new rows appended at the end.

**Row Container:**
- **Normal state:** `border-bottom: 1px solid --border-subtle`, padding: 10px 0, display: flex, align-items: center, gap: 12px
- **Error state:** `background: rgba(220,80,80,0.05)`, `border-left: 3px solid rgba(220,80,80,0.6)`, padding-left: 9px
- **New row:** Subtle distinction — left border: `3px solid rgba(93,115,126,0.3)` (accent, low opacity) to indicate it is unsaved. On hover: `background: rgba(252,252,252,0.02)`.
- **Marked for deletion:** Crossed-out opacity (opacity: 0.4), strikethrough visual, row remains in DOM but flagged for deletion on Save. A "undo" link appears instead of delete icon: `"undo"` (12px, accent). Actually, for simplicity: deleted rows are **immediately removed from DOM** (no undo). See delete interaction below.

**Row Inputs (each field within a row):**

Each input within a row uses a compact input style:
- Background: transparent (inherits row background)
- Border: none by default. On focus: `border-bottom: 1px solid --accent` (underline-style focus, rather than full box border — gives a spreadsheet feel)
- Padding: 6px 8px
- Font: IBM Plex Mono, 13px, `--text-primary`
- Placeholder: `--text-muted`, font-size 13px

| Column | Input Type | Placeholder | Required | Notes |
|--------|-----------|-------------|----------|-------|
| activity_date | `date` | — | Yes | Format: `YYYY-MM-DD` |
| name | `text` | `Activity name` | Yes | flex: 2 column |
| location | `text` | `Location (optional)` | No | flex: 1.5 column |
| start_time | `time` | — | Yes | Format: `HH:MM` |
| end_time | `time` | `Optional` | No | |
| delete | icon button | — | — | Trash icon, 16px |

**Delete icon button (per row):**
- Color: `--text-muted`. Hover: `rgba(220,80,80,0.8)`. `aria-label="Remove this activity row"`.
- On click: **immediately remove the row from the DOM** (no API call yet — the delete will happen on "Save all"). For rows that correspond to an existing activity (have an ID), the ID is tracked in the component state as "to be deleted."
- For new (unsaved) rows: simply remove from the local state array.

**Row-level validation error:**
- If a row has a required field missing (name or activity_date): show a subtle red underline on the empty required field
- After attempting "Save all", unfilled required fields in any row highlight red
- Error message shown in a tooltip or below the row: `"name and date are required"`

---

#### 6.6 "+" Add Row Button

Positioned below the last activity row, above the page footer.

- **Appearance:** Full-width button-like area (or a compact button, left-aligned)
  - Style: `border: 1px dashed rgba(93,115,126,0.5)`, padding: 10px 16px, border-radius: 2px, text-align: left
  - Content: `"+ add activity"` — font-size 12px, font-weight 500, color `--text-muted`, letter-spacing 0.06em, uppercase
  - Hover: `border-color: --accent`, color `--text-primary`
- On click: Append a new empty row to the bottom of the activity rows list. Focus moves to the `activity_date` input of the new row.

---

#### 6.7 Empty State (No Existing Activities + No New Rows)

When the page loads with zero existing activities and no new rows have been added yet:
- Below the column headers: show a dashed empty state container:
  - Text: `"no activities planned yet."` (13px, muted)
  - Sub-text: `"click '+ add activity' below to start planning your itinerary."` (11px, dim)
  - Same dashed border style as other empty states
- The `"+ add activity"` button is still shown and functional

---

#### 6.8 Responsive Behavior — Activities Edit Page

**Desktop (≥768px):** Full row layout as described in 6.5. All columns visible side-by-side. Sticky column headers.

**Mobile (<768px):**

The side-by-side column layout does not fit on mobile. Instead, each activity row becomes a card-style stacked layout:

- Each row is a card: `background: --surface`, border: `1px solid --border-subtle`, border-radius: 4px, padding: 16px, margin-bottom: 8px
- Column headers row is hidden on mobile (labels are inline within each card instead)
- Card layout (stacked vertically):
  - Row 1: `activity_date` input (full width, labeled inline `DATE` above in 10px muted)
  - Row 2: `name` input (full width, labeled `ACTIVITY NAME`)
  - Row 3: `location` input (full width, labeled `LOCATION (optional)`)
  - Row 4: Flex row — `start_time` (flex: 1, labeled `START`) | `end_time` (flex: 1, labeled `END`)
  - Row 5: Delete icon button (right-aligned, trash icon)

- `"+ add activity"` button: full width, same dashed style
- Page padding: 16px horizontal
- Header actions: "Save all" and "Cancel" buttons stack if needed (flex-wrap: wrap)

---

#### 6.9 Save All Logic

When "Save all" is clicked:

1. Validate all rows client-side. If any row is missing `name` or `activity_date`: highlight errors, do NOT proceed with API calls, show `"please fix the errors above before saving."` banner.
2. If validation passes: disable "Save all" and "Cancel" buttons, show spinner on "Save all".
3. Execute API calls in parallel:
   - **New rows** (rows without an existing ID): `POST /trips/:id/activities` for each
   - **Edited rows** (rows with an existing ID where any field was changed): `PATCH /trips/:id/activities/:activityId` for each
   - **Deleted rows** (rows that were removed from the UI and have an existing ID): `DELETE /trips/:id/activities/:activityId` for each
4. Wait for all promises to settle (`Promise.allSettled`).
5. If all succeed: navigate to `/trips/:id`.
6. If any fail: show error banner (see 6.2 error state). Re-enable buttons. Rows that succeeded are removed from the "pending" state. Rows that failed keep their error state (subtle red border on the row).

---

#### 6.10 Accessibility — Activities Edit Page

- `<h1>` for page title "edit activities"
- Column headers row: use `role="rowheader"` pattern or a visible header row with associated `aria-label` on each input
- Each row: `role="group"` with `aria-label="Activity row [n]"` (or dynamically `"Activity: [name] on [date]"` for existing)
- Delete button: `aria-label="Remove activity [name]"` if name is filled, otherwise `"Remove empty activity row"`
- "Save all" button: `aria-label="Save all activity changes and return to trip"`. Disabled state: `aria-disabled="true"`.
- "Cancel" button: `aria-label="Cancel and return to trip without saving"`
- Error messages on rows: `role="alert"` for dynamically inserted errors
- Focus management: when new row added via "+", focus moves to `activity_date` input of the new row

---

### Spec 7: Calendar Component + Trip Date Range UI

**Sprint:** #2
**Related Task:** T-026
**Status:** Approved

**Priority Note:** This spec is P2 (stretch goal). It may carry to Sprint 3 if frontend capacity is insufficient after completing T-031–T-034. The Trip Details page calendar placeholder from Sprint 1 remains in place until T-035 is fully implemented.

This spec covers two distinct but related UI additions:
- **Part A — Trip Date Range UI:** Date range inputs in the Trip Details page header, trip card display updates on the Home page. This is P1 and should be implemented as T-034 regardless of calendar status.
- **Part B — Calendar Component:** The monthly calendar grid replacing the Sprint 1 placeholder. This is P2 and is T-035.

---

#### 7.1 Part A — Trip Date Range UI

##### 7.1.1 Trip Details Page Header — Date Range Section

**Location:** In the Trip Details page (`/trips/:id`) header section, below the destinations row and above the calendar/placeholder area.

**Appearance (dates not set — null state):**
- A row showing a calendar icon (12px, muted) followed by `"trip dates not set"` — font-size 12px, color `--text-muted`
- A small `"set dates"` link (12px, `--accent` color, no underline, underline on hover) to the right
- On click of `"set dates"`: expand to show the date inputs (see below)
- Margin-bottom: 24px

**Appearance (edit / input mode):**
- Container: `background: --surface`, border: `1px solid --border-subtle`, border-radius: 4px, padding: 16px 20px, margin-bottom: 24px
- Layout: Flex row, align-items: flex-end, gap: 16px, flex-wrap: wrap
- Left group: **TRIP START** label (10px, uppercase, muted) above a `<input type="date">` (styled per form pattern, width: 160px)
- Right group: **TRIP END** label above a `<input type="date">` (same style, width: 160px)
- Helper text below both inputs (shared): `"format: YYYY-MM-DD"` — 11px, `rgba(252,252,252,0.3)`. Only shown if needed.
- Action buttons (flex-end, gap: 8px, align-self: flex-end):
  - `"Save"` — primary button, font-size 12px, padding: 8px 20px. On click: call `PATCH /trips/:id` with `{ start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" }`. Shows inline spinner. On success: collapse to display mode.
  - `"Clear dates"` — secondary button (very small), font-size 11px. On click: call `PATCH /trips/:id` with `{ start_date: null, end_date: null }`. On success: return to null state display.
  - `"Cancel"` — a plain text link (12px, muted), appears only if opening from null state (not a full button). On click: collapse inputs back to null display without API call.

**Validation:**
- `start_date` required if either date is being set (cannot set only end_date)
- If `start_date` > `end_date`: show error `"end date must be on or after start date"` below the end date input, red border
- If only one date is filled: show `"both start and end dates are required"`

**Save Loading State:** "Save" button shows spinner (16px), all inputs and other buttons disabled.

**Save Error State:** Error text below the action buttons: `"could not save dates. please try again."` (12px, `rgba(220,80,80,0.9)`)

**Appearance (display mode — dates are set):**
- Container: Same surface card, but with read-only display instead of inputs
- Layout: Flex row, align-items: center, gap: 12px
- Calendar icon (12px, muted) + date range string: `"Aug 7, 2026 — Aug 14, 2026"` (format: `MMM D, YYYY — MMM D, YYYY`) — font-size 13px, color `--text-primary`
- `"Edit"` link to the right (12px, `--accent`). On click: switch to input mode with existing dates pre-filled.
- Margin-bottom: 24px

##### 7.1.2 Trip Card — Date Range Display (Home Page)

The Sprint 1 Trip Card already has a Timeline Row (section 2.3, item 5) that shows `"dates not set"` when no dates exist. In Sprint 2, this row is updated:

**When `start_date` and `end_date` are both set:**
- Display: `"Aug 7 – Aug 14, 2026"` (format: `MMM D – MMM D, YYYY` if same year and both dates fit; or `MMM D, YYYY – MMM D, YYYY` if spanning different years)
- Preceded by calendar icon SVG (12px, muted color)
- Font-size: 11px, color `--text-muted` (same as existing Timeline Row style)

**When only `start_date` is set (end_date null):**
- Display: `"From Aug 7, 2026"` — font-size 11px, `--text-muted`

**When both are null (unchanged from Sprint 1):**
- Display: `"dates not set"` — font-size 11px, `rgba(252,252,252,0.3)` (dimmer muted)

This update applies to the TripCard component on the Home page. The trip object now includes `start_date` and `end_date` fields from the API (Sprint 2 T-029 backend change).

---

#### 7.2 Part B — Calendar Component

##### 7.2.1 Overview

The Calendar component replaces the `"calendar coming in sprint 2"` placeholder at the top of the Trip Details page. It renders a monthly view calendar grid populated with events from the trip's flights, stays, and activities. It uses data already fetched by the `useTripDetails` hook — no additional API calls.

**Calendar colors (new CSS custom properties to add to `:root`):**
```css
--color-flight: #5D737E;   /* Same as --accent */
--color-stay: #3D8F82;     /* Teal — distinct from accent */
--color-activity: #C47A2E; /* Warm amber */
```

##### 7.2.2 Calendar Component Layout

**Container:**
- Background: `--surface`
- Border: `1px solid --border-subtle`
- Border-radius: 4px
- Padding: 0 (header/grid sections have their own padding)
- Width: 100%
- Margin-bottom: 48px (replacing the Sprint 1 placeholder margin)

**Calendar Header:**
- Height: 56px
- Padding: 0 20px
- Flex row, `align-items: center`, `justify-content: space-between`
- **Left:** `"← prev"` button — icon only (left chevron `‹`, 18px) or "← Prev" text link. Style: secondary small button (or plain icon button: 28px square, `--text-muted`, hover: `--text-primary`). `aria-label="Previous month"`.
- **Center:** Month + Year label: `"August 2026"` — font-size 14px, font-weight 500, color `--text-primary`, uppercase, letter-spacing 0.06em
- **Right:** `"next →"` button — icon only (right chevron `›`). `aria-label="Next month"`.
- Bottom border: `1px solid --border-subtle`

**Day-of-week Header Row:**
- 7 columns (one per day: Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- Height: 36px
- Each cell: centered text, font-size 10px, font-weight 600, uppercase, letter-spacing 0.08em, color `--text-muted`
- Background: `--bg-primary` (slightly recessed from the surface)
- Bottom border: `1px solid --border-subtle`

**Calendar Grid:**
- 7-column CSS Grid: `grid-template-columns: repeat(7, 1fr)`
- Rows: as many as needed for the month (typically 5 or 6 rows)
- Each cell (day): min-height 80px on desktop, 60px on mobile

**Day Cell:**
- Border-right: `1px solid --border-subtle` (vertical grid lines)
- Border-bottom: `1px solid --border-subtle` (horizontal grid lines)
- Rightmost column cells: no border-right
- Bottom row cells: no border-bottom
- Padding: 6px 8px
- **Date number:** Font-size 11px, font-weight 500, color `--text-muted`. Float top-left.
  - **Today:** Date number has a small `--accent`-colored circle background (16px circle, centered on the number, white text inside)
  - **Days outside current month:** Date number color: `rgba(252,252,252,0.15)` (very dim). Cell background: same as others (do not visually gray out entire cell — just dim the number).
- **Events area:** Below the date number, stacked vertically (up to 3 events visible per cell, then `+N more` indicator if overflow)

##### 7.2.3 Event Rendering

**Flights (single-day):**
- Rendered on the **local departure date** (derived from `departure_at` + `departure_tz`)
- Display: A compact chip/pill: height 18px, padding: 0 6px, border-radius: 2px, font-size 10px, font-weight 500, color `#FCFCFC`
- Background: `--color-flight` (`#5D737E`)
- Content: Airline abbreviation or flight number: `"DL1234"` (abbreviated to fit, max ~10 chars)
- Truncate with ellipsis if text overflows chip width

**Stays (multi-day span):**
- Rendered spanning from the **local check-in date** to the **local check-out date** (inclusive of both)
- Display approach: For each day in the span, render a full-width colored bar:
  - First day of span: rounded left edge (`border-radius: 2px 0 0 2px`), shows stay name text (abbreviated, 10px, `#FCFCFC`)
  - Middle days: no border radius, slightly lighter background for continuation (`opacity: 0.8`)
  - Last day of span: rounded right edge (`border-radius: 0 2px 2px 0`)
  - Background: `--color-stay` (`#3D8F82`)
  - Content on first day chip: Stay name (max ~12 chars before truncation)
- If a stay spans a week break (crosses Sunday → new row), the span visually breaks: last day of week gets right edge rounding, first day of next week gets left edge rounding with the stay name repeated.

**Activities (single-day):**
- Rendered on the **activity_date**
- Display: Same chip style as flights but with `--color-activity` (`#C47A2E`) background
- Content: Activity name (abbreviated, max ~12 chars)

**Event Priority / Stacking Order (within a cell, top to bottom):**
1. Flights (highest visual priority)
2. Stays (spans first if applicable)
3. Activities

**Overflow (`+N more`):**
- If a cell has more than 3 events (or 3 event lines including multi-day spans), show a `"+N more"` link at the bottom:
  - Font-size 10px, color `--accent`, clickable (P3 — can be a no-op for Sprint 2 implementation, or show a simple tooltip/popover listing all events)

##### 7.2.4 Calendar Navigation

**Initial Month:**
- Default to the current month (`new Date().getMonth()`)
- If the trip has `start_date` set: default to the month of `start_date` instead
- If the trip has no events and no start_date: default to current month

**Prev / Next:**
- "← prev" decrements the displayed month by 1
- "next →" increments the displayed month by 1
- Year changes automatically (Dec → Jan wraps to next year; Jan → Dec wraps to previous year)
- Navigation is client-side only (no API call — all events are already loaded from `useTripDetails`)

**Month Bounds:**
- No hard limits on navigation — user can freely navigate to past or future months
- Days outside the current month (padding cells at start/end of grid) show the day number dimmed. Events from those days are NOT shown in the adjacent month's cells — they would only appear in their own month.

##### 7.2.5 Empty State

When the trip has no flights, stays, or activities (or none in the current displayed month):
- Calendar grid still renders normally (full empty month grid)
- No events shown
- A subtle centered message below the grid (but inside the calendar container): `"no events this month"` — 11px, `rgba(252,252,252,0.3)`. Only shown if the trip has zero events total, not just zero in the current month.

##### 7.2.6 Loading State

The calendar receives events from the parent `useTripDetails` hook. While flights/stays/activities are loading:
- The calendar skeleton: show the calendar header + day-of-week headers normally
- The grid area: show a single shimmer overlay block (full height, `rgba(252,252,252,0.03)` + shimmer gradient)

If any sub-resource fetch fails (flights/stays/activities error), the calendar still renders with the available data — it shows partial events (e.g., flights and activities visible even if stays fetch failed).

##### 7.2.7 Library Recommendation

Implement the calendar as a **custom component** (no external calendar library) to maintain full visual control and avoid adding heavy dependencies. A custom monthly grid is straightforward: compute the first day of the month, the number of days, the starting day-of-week, and render a 7-column grid.

If the custom approach proves too complex during implementation, use `react-big-calendar` as a fallback and apply custom CSS to match the design system. Document the choice in `frontend/src/pages/TripDetailsPage.jsx` as a comment or in `.workflow/architecture-decisions.md`.

##### 7.2.8 Responsive Behavior — Calendar

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥768px) | Full monthly grid, min-height 80px per cell, event chips with text |
| Tablet (640–767px) | Same grid, min-height 70px per cell, event chips with abbreviated text |
| Mobile (<640px) | Compact grid: min-height 52px per cell, events shown as colored dots only (no text chips). Day number: 11px. Dot size: 6px circle below the number. Up to 3 dots per cell (one per event type, if multiple events on same day for same type: show 1 dot with a count). |

On mobile, the compact dot view:
- Flight dot: `--color-flight` circle (6px)
- Stay dot: `--color-stay` circle (6px)
- Activity dot: `--color-activity` circle (6px)
- Dots arranged in a row below the date number, gap: 3px

##### 7.2.9 Accessibility — Calendar Component

- Calendar container: `role="application"` or `role="grid"`, `aria-label="Trip calendar"`
- Prev/Next buttons: `aria-label="Previous month"` / `aria-label="Next month"`
- Month/year heading: `aria-live="polite"` so screen readers announce month changes
- Day cells: each cell has `aria-label="[Day name], [Month] [Date]"` (e.g., "Friday, August 8")
- Event chips: `aria-label="[type]: [name]"` (e.g., `aria-label="Flight: DL1234"`, `aria-label="Stay: Hyatt Regency"`, `aria-label="Activity: Fisherman's Wharf"`)
- Today cell: `aria-current="date"`
- Days outside current month: `aria-disabled="true"` on those cells

---

#### 7.3 Design System Addition — Event Colors

Add the following to the CSS Custom Properties reference in this document:

```css
/* Calendar event colors */
--color-flight: #5D737E;   /* Same as --accent for flights */
--color-stay: #3D8F82;     /* Teal for accommodation stays */
--color-activity: #C47A2E; /* Warm amber for activities */
```

Also update the `frontend/src/index.css` or `:root` block to include these new variables.

---

#### 7.4 Trip Details Page — Updated Section Order

With Part A (trip date range) and Part B (calendar) both implemented, the updated Trip Details page section order becomes:

| Position | Element | Margin Below |
|----------|---------|-------------|
| 1 | Page Header (back link + title + destinations) | 8px |
| 2 | Trip Date Range Section (date inputs or display) | 24px |
| 3 | Calendar Component (monthly grid) | 48px |
| 4 | Flights Section (header + cards/empty) | 48px |
| 5 | Stays Section (header + cards/empty) | 48px |
| 6 | Activities Section (header + cards/empty) | 64px |

Note: The Sprint 1 "Edit" buttons for flights, stays, and activities (previously `disabled` + `aria-disabled="true"`) should be **activated** in Sprint 2 — they become real navigation links routing to `/trips/:id/edit/flights`, `/trips/:id/edit/stays`, and `/trips/:id/edit/activities` respectively. Update their labels to `"edit flights"`, `"edit stays"`, `"edit activities"`.

---

## Sprint 2 Design Notes & Decisions

1. **List-then-form pattern (Flights + Stays):** The Flights and Stays edit pages use an incremental save model — each individual add/edit saves immediately to the API, and the user can continue modifying entries before clicking "Done editing." This reduces the risk of losing all changes on a network error compared to a batch-save approach.

2. **Batch-save pattern (Activities):** The Activities edit page batches all changes into a single "Save all" action. This matches the typical user mental model for activities planning (planning a day's itinerary at once) and avoids the overhead of per-row API calls as the user fills in a row.

3. **Timezone dropdown — curated list:** Rather than the full IANA timezone database (~600 entries), we use a curated ~28-entry list of the most commonly used travel timezones. This keeps the dropdown usable on mobile and avoids dependency on a timezone library. The list is defined in `frontend/src/utils/timezones.js`.

4. **`datetime-local` input pre-population:** When editing an existing flight or stay, the `departure_at` / `arrival_at` / `check_in_at` / `check_out_at` values are stored as UTC ISO strings in the API. To pre-populate a `datetime-local` input, the Frontend Engineer should format the value as `YYYY-MM-DDTHH:MM` using the stored UTC time directly (the stored value is the "wall clock" time in the local timezone). Do NOT apply any timezone conversion — the stored time already represents the local time at the departure/arrival location; just strip the timezone and seconds from the ISO string.

5. **Activity row form UX:** The row-based table layout for activities gives experienced users a spreadsheet-like feel that matches their mental model for itinerary building (as described in the project brief). Column widths are flexible, inputs are minimal-border (underline on focus only), reducing visual noise across many rows.

6. **Calendar implementation:** The calendar is specified as a custom component to maintain full visual control. However, given it is a P2 XL task, the Frontend Engineer should prioritize correctness and simplicity over pixel-perfection. If carried to Sprint 3, the placeholder remains. The `--color-flight`, `--color-stay`, `--color-activity` CSS variables are added now so the Frontend Engineer can use them in both the calendar and potentially in future legend/key UI.

7. **Edit buttons on Trip Details page (Sprint 1 → Sprint 2):** The "add flight" / "add stay" / "add activities" action buttons from Sprint 1's Section 3.4 were disabled placeholders. In Sprint 2, they become active navigation links. The Frontend Engineer should update their `disabled` attribute and `aria-disabled` to be removed, and wire them to the new edit page routes. Label updates: `"add flight"` → `"edit flights"`, `"add stay"` → `"edit stays"`, `"add activities"` → `"edit activities"`.

8. **Dark theme only (unchanged):** All new edit pages and the calendar use the same dark theme as Sprint 1 screens.

9. **No unsaved-changes prompt:** On the Flights/Stays edit pages, if a user clicks "Done editing" while a partially filled form is in the Add section, the form data is silently abandoned (no API call, no confirmation dialog). This is acceptable for Sprint 2 as the complexity of unsaved-changes detection is not warranted. The Activities edit page has an explicit "Cancel" button for this purpose.

---

*Sprint 2 specs above are all marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-02-25.*

---

## Sprint 1 Design Notes & Decisions

1. **Trip creation navigates to trip details:** Per user flow 1, step 6 in the project brief, after creating a trip the user is taken directly to the new trip's detail page — not back to the home page list.

2. **Edit buttons in Sprint 1:** The "add flight", "add stay", "add activities" buttons are visible in the UI but disabled. This is intentional — it communicates the intended UX without implying these features exist yet. The Frontend Engineer should render them with `disabled` attribute and `aria-disabled="true"`, with a tooltip indicating they are coming soon.

3. **Dark theme only:** Sprint 1 ships with only the dark theme (no light mode toggle). The entire app uses `--bg-primary: #02111B` as the base.

4. **No pagination on trip list:** Sprint 1 assumes a manageable number of trips. Implement with a simple array render, no virtual list or pagination needed.

5. **Destinations as text:** The destinations field is a free-text string or array for Sprint 1. Display as-is (comma → ` · ` replacement for visual polish).

6. **Timezone display:** Flights and stays store local times + timezone strings. The Frontend Engineer should display these using the stored timezone string as a label (e.g., `8:00 AM PT`) — do NOT attempt timezone conversion in the browser. Display the stored local time + abbreviation.

7. **JWT storage strategy:** Store access token in React context (in-memory). Store refresh token in localStorage for Sprint 1 with a note that httpOnly cookies would be more secure (Sprint 2 concern). The auth context handles token refresh transparently.

8. **No "edit trip name/destination" in Sprint 1:** The trip name and destinations on the details page are read-only in this sprint.

---

*This document is maintained by the Design Agent. All Sprint 1 specs above are marked Approved.*

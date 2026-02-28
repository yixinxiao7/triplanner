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

---

## Sprint 3 Specs

---

### Spec 8: Multi-Destination Add/Remove UI

**Sprint:** #3
**Related Task:** T-041
**Status:** Approved

**Description:**
This spec upgrades the destinations input throughout the app from a plain comma-separated text field to an interactive tag/chip-based input. It affects two components: (1) the **CreateTripModal** on the Home page, where users enter destinations when creating a new trip, and (2) the **TripDetailsPage** header, where destinations are displayed and can now be edited inline. The destinations array is the API's existing `destinations` field (string array). Minimum one destination is required at all times.

**Feedback source:** B-007 (backlog) — users need a clear, visual way to add multiple destinations rather than typing comma-separated text.

---

#### 8.1 DestinationChipInput Component (Shared)

Create a reusable component `DestinationChipInput` (in `frontend/src/components/DestinationChipInput.jsx`) used by both CreateTripModal and TripDetailsPage.

**Props:**
- `destinations` — `string[]` — current list of destination strings
- `onChange` — `(newDestinations: string[]) => void` — called on every add/remove
- `disabled` — `boolean` (default false) — disables all interactions
- `error` — `string | null` — error message to display below the input
- `placeholder` — `string` (default `"Add a destination..."`)
- `autoFocus` — `boolean` (default false)

**Component Layout:**
- **Outer container:** Background: `--surface-alt` (`#3F4045`), border: `1px solid var(--border-subtle)`, border-radius: 2px, padding: 8px 12px, min-height: 44px, display: flex, flex-wrap: wrap, align-items: center, gap: 8px. On focus-within: `border-color: var(--accent)`.
- **Chips area:** Flex-wrap row of destination chips (inline with the text input). Each chip represents one destination.
- **Text input (inline):** Sits after the last chip in the flex flow. No visible border (transparent background, no outline). Font: IBM Plex Mono, 13px, `--text-primary`. Placeholder: `--text-muted`. Flex: 1, min-width: 120px (ensures it doesn't get crushed by chips). The input grows with the available space.

**Chip Design:**
- **Container:** `display: inline-flex`, `align-items: center`, gap: 6px, background: `rgba(93, 115, 126, 0.2)`, border: `1px solid rgba(93, 115, 126, 0.4)`, border-radius: 2px, padding: 4px 8px 4px 10px, max-width: 200px.
- **Text:** font-size 12px, font-weight 500, color `--text-primary`, white-space: nowrap, overflow: hidden, text-overflow: ellipsis.
- **Remove button (×):** A small `×` icon/text, font-size 14px, font-weight 400, color `--text-muted`, cursor: pointer, line-height: 1, padding: 0 2px. Hover: color `rgba(220, 80, 80, 0.8)`. `aria-label="Remove [destination name]"`. On click: remove this destination from the array.
- **Hover state (chip):** `border-color: var(--accent)` (subtle highlight).

**Interaction — Adding a Destination:**
1. User types a destination name in the text input
2. User presses **Enter** or **comma (,)** to confirm
3. The typed text is trimmed of whitespace. If non-empty and not a duplicate (case-insensitive comparison), it is added to the `destinations` array as a new chip
4. The text input clears
5. If the typed text is empty or a duplicate, nothing happens (no error shown for duplicates — silent ignore)
6. Focus remains in the text input after adding

**Interaction — Removing a Destination:**
1. User clicks the `×` button on a chip
2. The destination is removed from the array
3. If this would leave zero destinations, the chip is removed and the `onChange` callback fires with an empty array. Validation is handled by the parent component (see 8.2 and 8.3).
4. Focus moves to the text input after removal

**Keyboard Support:**
- **Backspace** (when text input is empty): Remove the last chip in the list (most recently added). This is a common pattern in tag inputs for quick correction.
- **Enter**: Add the current text as a chip
- **Comma (,)**: Add the current text as a chip (comma is stripped, not included in destination name)
- **Escape**: Clear the text input (do not remove chips)
- **Tab**: Move focus out of the component (standard tab behavior)

**Accessibility:**
- Outer container: `role="group"`, `aria-label="Destinations"`
- Text input: `aria-label="Add destination"`, `aria-describedby` pointing to hint text and/or error message
- Each chip: `role="option"` within the group. Remove button has explicit `aria-label="Remove [destination]"`.
- Error message (if shown): `role="alert"`, `aria-live="polite"`, rendered below the outer container

**Error Display:**
- When `error` prop is set: show error text below the outer container. Style: 12px, `rgba(220, 80, 80, 0.9)`. Outer container border changes to `rgba(220, 80, 80, 0.7)`.

---

#### 8.2 CreateTripModal — Destinations Upgrade

**Current Implementation:** The CreateTripModal has a single text input for destinations with a "separate multiple destinations with commas" hint. This is replaced with the `DestinationChipInput` component.

**Changes:**

**Form State:**
- Change `destinations` from `string` to `string[]` (initially `[]`)
- Remove the "separate multiple destinations with commas" helper text

**Form Layout (updated fields):**

| Row | Field | Notes |
|-----|-------|-------|
| 1 | TRIP NAME | Unchanged — text input, required |
| 2 | DESTINATIONS | Replaced with `DestinationChipInput` |

**Destinations Field:**
- Label: `DESTINATIONS` — same 11px uppercase label style as all other fields (per Design System Form Pattern)
- Below label: `DestinationChipInput` component
- Placeholder: `"Type a destination and press Enter"`
- Below the chip input: Helper text: `"press enter or comma to add"` — 11px, `--text-muted`
- Minimum 1 destination required on submit

**Validation (on submit):**
- If `destinations.length === 0`: show error `"at least one destination is required"` below the chip input (via the `error` prop). Outer container border turns red.
- Trip name validation unchanged (required, non-empty)

**Submit Behavior:**
- Sends `destinations` as a string array to `POST /trips`: `{ name: "...", destinations: ["San Francisco", "Los Angeles"] }`
- This matches the existing API contract (backend already accepts array format)

**No other changes to the modal** — the modal title, layout, submit button, cancel button, loading state, error banner, and accessibility all remain the same as Spec 2.5.

---

#### 8.3 TripDetailsPage Header — Editable Destinations

**Current Implementation:** The TripDetailsPage header shows destinations as a static dot-separated string (e.g., "Tokyo · Osaka · Kyoto"). This is upgraded to support inline editing.

**Two Modes:**

##### 8.3.1 Display Mode (default)

**Layout:** Same position as current destinations row (below trip name, above date range section).

- **Container:** `display: flex`, `align-items: center`, `gap: 12px`, `flex-wrap: wrap`, margin-bottom: 8px (reduced from original 40px — the date range section now provides spacing below)
- **Destination chips (read-only):** Each destination rendered as a read-only chip. Same visual style as the editable chips in 8.1 **but without the `×` button**. Chips are purely display in this mode.
  - Background: `rgba(93, 115, 126, 0.15)` (slightly more transparent than editable chips)
  - Border: `1px solid rgba(93, 115, 126, 0.3)`
  - Text: 12px, font-weight 500, `--text-primary`
  - Padding: 4px 10px
  - No hover effect (not interactive)
- **"Edit" link:** After all chips, a small link: `"edit"` — font-size 11px, color `--accent`, no underline, underline on hover. `aria-label="Edit destinations"`.
- On click of "edit": switch to Edit Mode.

##### 8.3.2 Edit Mode

**Layout:** Replaces the display chips + edit link.

- **Container:** Background: `--surface`, border: `1px solid var(--border-subtle)`, border-radius: 4px, padding: 16px 20px, margin-bottom: 8px.
- **Label row:** `DESTINATIONS` — standard 11px uppercase label. Margin-bottom: 8px.
- **DestinationChipInput:** Rendered with current destinations pre-populated as chips. Full editing capability (add/remove).
- **Helper text below input:** `"press enter or comma to add · backspace to remove last"` — 11px, `--text-muted`. Margin-top: 4px.
- **Action buttons row:** Flex, justify-content: flex-end, gap: 8px, margin-top: 12px.
  - `"Save"` — primary button, font-size 12px, padding: 8px 20px. On click: validate (at least 1 destination), then call `PATCH /trips/:id` with `{ destinations: [...] }`.
  - `"Cancel"` — secondary button, font-size 12px. On click: discard edits, revert to Display Mode with original destinations. No API call.

**Validation:**
- On Save: if destinations array is empty, show error `"at least one destination is required"` below the chip input. Do not call API.
- On Save: if destinations haven't changed from original, skip API call, just switch to Display Mode.

**Save Loading State:**
- "Save" button shows inline spinner (16px), both buttons disabled.
- DestinationChipInput receives `disabled={true}`.

**Save Success:**
- Destinations updated in the parent trip state.
- Switch to Display Mode showing the new chips.
- All destination displays on the page reflect the new data immediately (destinations row, etc.).

**Save Error:**
- Error text below the action buttons: `"could not save destinations. please try again."` — 12px, `rgba(220, 80, 80, 0.9)`.
- Buttons re-enabled. Chip input remains in edit state with user's current input preserved.

**Accessibility (Edit Mode):**
- Container: `role="region"`, `aria-label="Edit trip destinations"`
- Focus moves to the text input within `DestinationChipInput` when entering edit mode
- "Save" button: `aria-label="Save destination changes"`
- "Cancel" button: `aria-label="Cancel destination editing"`

---

#### 8.4 TripDetailsPage Header — Updated Skeleton

When trip data is loading, the destinations row skeleton remains the same (150px × 13px shimmer bar). Edit capability is not shown during loading.

---

#### 8.5 Home Page TripCard — Destinations Display

**No changes required.** The TripCard on the Home page continues to show destinations as a dot-separated string using the existing `formatDestinations()` utility. The API returns destinations as a string array, and the formatter handles both arrays and comma-separated strings. The chip UI is only for the Trip Details page header and the Create Modal.

---

#### 8.6 Responsive Behavior — Multi-Destination UI

| Breakpoint | CreateTripModal | TripDetailsPage Destinations |
|------------|----------------|------------------------------|
| Desktop (≥768px) | Modal width 400px, chips wrap within container, text input has ample space | Chips in display mode wrap naturally, edit mode has full-width chip input |
| Mobile (<768px) | Modal stretches to full viewport width minus 32px padding, chip input container stretches to full width, chips wrap to multiple lines if many destinations | Chips wrap. Edit mode: container is full-width, action buttons stack if needed (flex-wrap: wrap) |

**Many destinations (edge case):** If a user adds 10+ destinations, the chip container grows vertically to accommodate wrapping chips. No horizontal scroll — always wrap. The modal or edit container grow to fit. For the CreateTripModal, consider a max-height of 200px on the chip container with `overflow-y: auto` to prevent the modal from growing excessively. Show a subtle scrollbar if overflow occurs.

---

#### 8.7 Accessibility — Multi-Destination UI (Summary)

- All interactive elements have explicit `aria-label` attributes
- Chip removal buttons are keyboard-accessible (focusable via Tab, activate via Enter/Space)
- `DestinationChipInput` announces additions and removals to screen readers via an `aria-live="polite"` region
- Error messages use `role="alert"` for immediate announcement
- Focus management: after adding a chip, focus stays in text input. After removing via `×`, focus moves to text input. After removing via Backspace, focus stays in text input.
- Color contrast: chip text `#FCFCFC` on `rgba(93, 115, 126, 0.2)` background meets WCAG AA for large text at this size. The border provides additional distinction.

---

---

### Spec 9: Optional Activity Times UX + 429 Rate Limit Error Message

**Sprint:** #3
**Related Task:** T-042
**Status:** Approved

**Description:**
This spec covers two distinct UX improvements:
- **Part A — Optional Activity Times (B-016):** Allow activities to have no start_time/end_time, displayed as "All day" events. Affects the Activities Edit page, Trip Details page activities section, and the Trip Calendar component.
- **Part B — 429 Rate Limit Error Message (B-015):** Show a specific, user-friendly error message when the backend returns HTTP 429 (rate limit exceeded) on login or register pages, distinct from generic errors.

**Feedback source:** FB-022 (Sprint 2 — frontend lacks explicit 429 message), FB-023 (Sprint 2 — activity start_time/end_time required, can't create timeless activities).

---

#### 9.1 Part A — Optional Activity Times UX

##### 9.1.1 ActivitiesEditPage — Optional Time Fields

**Current State:** The activities edit page (Spec 6) has `start_time` and `end_time` columns. Per Spec 6.5, `start_time` is `Required: Yes` and `end_time` is `Required: No`. However, the Sprint 3 backend change (T-043) makes both fields truly optional with a linked validation rule: both must be null/empty (timeless "all day" activity) OR both must be provided.

**Changes to Spec 6.5 Column Header Row:**

Update the column labels:

| Column | Label | Width | Change |
|--------|-------|-------|--------|
| Date | DATE | 150px | Unchanged |
| Name | ACTIVITY NAME | flex: 2 | Unchanged |
| Location | LOCATION | flex: 1.5 | Unchanged |
| Start time | START | 110px | **Now optional** |
| End time | END | 110px | **Now optional** |
| Delete | — | 40px | Unchanged |

**Updated column header label for START and END:**
- `START` and `END` labels get a small helper annotation: render them as `"START"` and `"END"` with no visual change to the header itself. The "optional" nature is communicated through the "All day" toggle (see below).

**"All day" Toggle (per row):**

Add an "All day" checkbox/toggle to each activity row, positioned **between the Location column and the Start column** (or as an overlay row element):

**Implementation approach (recommended — inline checkbox):**
- Add a new narrow column between LOCATION and START with label `ALL DAY` (width: 70px)
- Each row has a small checkbox: `<input type="checkbox">` styled as a minimal toggle
- **Checkbox unchecked (default for timed activities):** start_time and end_time inputs are visible and editable
- **Checkbox checked (timeless activity):** start_time and end_time inputs are visually replaced with a muted label `"all day"` (12px, `--text-muted`, centered in the combined START+END column space). The time inputs are hidden (not just disabled — hidden to reduce visual noise).

**Updated column layout:**

| Column | Label | Width |
|--------|-------|-------|
| Date | DATE | 150px |
| Name | ACTIVITY NAME | flex: 2 (min 160px) |
| Location | LOCATION | flex: 1.5 (min 120px) |
| All day | ALL DAY | 70px |
| Start time | START | 100px |
| End time | END | 100px |
| Delete | — | 40px |

**Checkbox Styling:**
- Custom checkbox appearance: 16px × 16px square, border: `1px solid var(--border-subtle)`, border-radius: 2px, background: transparent.
- Checked state: background: `var(--accent)`, border-color: `var(--accent)`, with a small white checkmark (SVG or CSS `::after` pseudo-element).
- Hover: `border-color: var(--accent)`.
- Focus: `outline: 2px solid var(--accent); outline-offset: 2px`.

**Behavior when "All day" is toggled ON:**
1. `start_time` and `end_time` values are cleared (set to `""`)
2. The time input cells show `"all day"` muted text instead of inputs
3. Focus remains on the checkbox

**Behavior when "All day" is toggled OFF:**
1. Time inputs re-appear (empty)
2. Focus moves to the `start_time` input
3. User can now enter times

**Pre-population for existing activities:**
- If an existing activity has `start_time: null` and `end_time: null`: the "All day" checkbox is checked, time inputs hidden
- If an existing activity has both times set: checkbox unchecked, time inputs populated

**Updated Validation (on "Save all"):**
- `name` and `activity_date` remain required for every row (unchanged)
- Time validation rule: if `start_time` is provided but `end_time` is not (or vice versa), show a row-level error: `"both start and end times are required, or check 'all day'"`. Row gets the error highlight (red left border, subtle red background).
- If "All day" is checked, no time validation needed — both times submit as null.
- If both times are provided: `end_time` must be ≥ `start_time`. Error: `"end time must be after start time"`.

**API Payload Changes:**
- When "All day" is checked: send `start_time: null, end_time: null` in POST/PATCH
- When times are provided: send as `"HH:MM:SS"` format (unchanged)
- The backend (T-043) validates the linked rule server-side as well

---

##### 9.1.2 TripDetailsPage — "All Day" Activity Display

**Current State:** Activities on the Trip Details page are grouped by date and show time ranges in the Time Column (Spec 3.9). Timeless activities need a different display.

**Changes to Activity Entry (Spec 3.9):**

For activities where `start_time` and `end_time` are both `null`:

**Time Column (80px wide):**
- Instead of showing `"9:00 AM → 2:00 PM"`, show an "All day" badge:
  - Badge: `display: inline-block`, background: `rgba(196, 122, 46, 0.15)` (amber-tinted, matching `--color-activity`), border: `1px solid rgba(196, 122, 46, 0.3)`, border-radius: 2px, padding: 2px 8px
  - Text: `"all day"` — font-size 10px, font-weight 600, uppercase, letter-spacing: 0.08em, color: `var(--color-activity)` (`#C47A2E`)

**Sorting within a day group:**
- Timeless ("all day") activities sort **after** timed activities within the same date group
- Among multiple timeless activities on the same date, sort alphabetically by name
- This matches the backend ordering rule (T-043): timeless activities have `NULLS LAST` ordering

**Activity Entry Layout (unchanged except time column):**
- The vertical divider, activity name, and location columns remain the same
- The `aria-label` for a timeless activity: `aria-label="[name], all day"` (instead of `"[name], [start] to [end]"`)

---

##### 9.1.3 TripCalendar — Timeless Activity Events

**Current State:** Activities are rendered as amber chips on their `activity_date` in the calendar (Spec 7.2.3). Timeless activities should be visually indistinguishable from timed activities in the calendar — they are rendered the same way.

**No visual change needed for calendar chips.** Timeless activities still appear on their `activity_date` as amber (`--color-activity`) chips with the activity name. The calendar does not show time information for any activity — it only shows the name chip. Therefore, timeless and timed activities look identical in the calendar view.

**Sorting within a cell:** Timed activities before timeless activities (if stacking order within the "Activities" group matters). In practice, since the calendar only shows up to 3 events per cell with "+N more" overflow, the ordering is: flights first, stays second, activities third (per Spec 7.2.3 stacking rules). Within the activities group, timed before timeless.

---

##### 9.1.4 Mobile Layout — Activities Edit Page Update

The mobile card layout for activity rows (Spec 6.8) is updated to include the "All day" toggle:

**Mobile card layout (stacked vertically):**
- Row 1: `activity_date` input (full width, labeled `DATE`)
- Row 2: `name` input (full width, labeled `ACTIVITY NAME`)
- Row 3: `location` input (full width, labeled `LOCATION (optional)`)
- **Row 4 (new):** "All day" checkbox with label `"ALL DAY"` — flex row, align-items: center, gap: 8px. Checkbox on left, label on right.
- Row 5: Flex row — `start_time` (flex: 1, labeled `START`) | `end_time` (flex: 1, labeled `END`). **Hidden if "All day" is checked** — replaced with `"all day"` muted text spanning the full width.
- Row 6: Delete icon button (right-aligned)

---

#### 9.2 Part B — 429 Rate Limit Error Message

##### 9.2.1 Login Page — 429 Error Handling

**Current State:** The LoginPage shows an error banner for API errors (Spec 1.2). HTTP 401 shows "incorrect email or password." Other errors show "something went wrong. please try again." HTTP 429 currently falls into the generic catch-all.

**Change:** Add an explicit 429 handler.

**When the login API returns HTTP 429:**

1. **Parse the `Retry-After` header** from the response. The backend sends `Retry-After: <seconds>` (integer). Convert seconds to minutes (round up). Example: `Retry-After: 840` → `14 minutes`.

2. **Show a rate limit banner** inside the auth card, in the same position as the existing API error banner (above the form fields). This banner uses a **distinct warning style** (not the red error style used for 401/500):
   - Background: `rgba(196, 122, 46, 0.1)` (warm amber tint, matching `--color-activity` palette — distinguishes from red error banners)
   - Border: `1px solid rgba(196, 122, 46, 0.3)`
   - Border-radius: 2px
   - Padding: 12px 16px
   - Icon (optional): A small clock/timer SVG (14px, `rgba(196, 122, 46, 0.8)`) on the left
   - Text: `"too many login attempts. please try again in X minutes."` — font-size 13px, color: `#FCFCFC`
   - The `X minutes` value is derived from the `Retry-After` header. If the header is missing or unparseable, default to `"a few minutes"`.

3. **Countdown behavior (optional but recommended):**
   - Start a client-side countdown timer from the `Retry-After` seconds
   - Update the banner text every 60 seconds: `"please try again in X minutes."` → `"please try again in (X-1) minutes."` → ... → `"please try again in 1 minute."` → `"you can try again now."`
   - When the countdown reaches 0: the banner text changes to `"you can try again now."` and auto-dismisses after 3 seconds. Submit button is re-enabled.

4. **Submit button behavior during rate limit:**
   - Button remains **enabled** (user can attempt again — the backend will return another 429 if the window hasn't expired)
   - The banner persists until: (a) the user successfully logs in, (b) the countdown expires, or (c) the user navigates away
   - Do NOT auto-dismiss on a timer like the generic error — the rate limit banner should persist to inform the user

5. **Banner does NOT auto-dismiss** (unlike the 500/network error banner which auto-dismisses after 5s). It stays visible until the rate limit window expires or the user navigates away.

6. **If user submits again while rate-limited:** The banner updates with a fresh `Retry-After` value from the new 429 response (the window may have shifted).

**Banner HTML structure:**
```
<div class="rateLimitBanner" role="alert" aria-live="polite">
  <svg class="clockIcon" aria-hidden="true">...</svg>
  <span>too many login attempts. please try again in 14 minutes.</span>
</div>
```

---

##### 9.2.2 Register Page — 429 Error Handling

**Same behavior as login page** (9.2.1), with the message text adjusted:
- Text: `"too many registration attempts. please try again in X minutes."`
- Same amber warning banner style
- Same countdown behavior
- Same submit button handling

---

##### 9.2.3 Axios Interceptor — 429 Detection

**Current State:** The axios interceptor in `frontend/src/utils/api.js` handles 401 responses (token refresh + retry queue). It does not have a specific 429 handler.

**Change:** The 429 response should NOT be intercepted/swallowed by the axios interceptor. Instead, it should be passed through to the calling code (the login/register page error handler) with the response status and headers intact. The page-level error handler then checks for `error.response.status === 429` and extracts `error.response.headers['retry-after']`.

**Implementation guidance for Frontend Engineer:**
- Do NOT add 429 handling to the axios interceptor — keep it at the page level
- The page-level `catch` block in the login/register `handleSubmit` should check:
  ```
  if (error.response?.status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after'], 10);
    // Show rate limit banner with retryAfter seconds
  } else if (error.response?.status === 401) {
    // Show "incorrect email or password"
  } else {
    // Show generic error
  }
  ```
- This keeps the 429 handling co-located with the UI that displays it, rather than in a global interceptor

---

##### 9.2.4 Rate Limit Banner — CSS Module

Create styles in the LoginPage and RegisterPage CSS modules (or a shared auth CSS module):

```css
.rateLimitBanner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(196, 122, 46, 0.1);
  border: 1px solid rgba(196, 122, 46, 0.3);
  border-radius: 2px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
}

.rateLimitBanner .clockIcon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  color: rgba(196, 122, 46, 0.8);
}
```

---

##### 9.2.5 Accessibility — 429 Error Handling

- Rate limit banner: `role="alert"`, `aria-live="polite"` — screen reader announces immediately
- Clock icon: `aria-hidden="true"` (decorative)
- Countdown updates: use `aria-live="polite"` on the text span so screen readers announce countdown changes (not `aria-live="assertive"` — too intrusive for periodic updates)
- Submit button: remains focusable and enabled during rate limit. Do NOT disable — users may want to retry. The banner message communicates the wait time.

---

##### 9.2.6 Responsive Behavior — 429 Banner

The rate limit banner uses the same responsive behavior as the existing error banner:
- On mobile (<768px): the auth card stretches to viewport width, and the banner stretches with it
- Text wraps naturally on narrow screens
- No layout changes needed

---

#### 9.3 Sprint 3 Design Notes & Decisions

1. **"All day" as a checkbox, not removal of time fields:** Using an explicit "All day" checkbox is clearer than simply making time fields optional with no indicator. It communicates intent: the user deliberately chose "all day" rather than forgetting to fill in times. This also prevents accidental timeless activities from users who skip the time fields.

2. **429 banner color distinct from error banner:** Using amber (matching the `--color-activity` palette) for the rate limit banner visually distinguishes it from the red error banners used for 401/500 errors. This signals "warning/wait" rather than "error/failure" — the user hasn't done anything wrong, they just need to wait.

3. **Countdown is optional but recommended:** The countdown timer improves UX by telling users exactly when they can retry. Without it, users are left guessing. However, if implementation complexity is too high, the static message "please try again in X minutes" is acceptable for Sprint 3.

4. **DestinationChipInput as a shared component:** Rather than implementing chip input logic separately in CreateTripModal and TripDetailsPage, a shared component reduces code duplication and ensures consistent UX. The component is stateless (controlled via props) so it's easy to test.

5. **No "Backspace to remove" in CreateTripModal:** Although the DestinationChipInput supports Backspace-to-remove-last-chip, this behavior applies in both locations. Consider whether this is desirable in the modal context. Decision: keep it — it's a standard tag input pattern and users familiar with email-style "To" fields will expect it.

6. **Calendar unchanged for timeless activities:** Since the calendar already shows activity names without time information, there's no visual difference between timed and timeless activities in the calendar view. No calendar spec changes are needed.

7. **Destinations chip max-width:** Chips have a 200px max-width to prevent excessively long destination names from breaking the layout. Longer names are truncated with ellipsis.

---

*Sprint 3 specs above are all marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-02-25.*

---

---

### Spec 10: Sprint 4 — UX Polish & Accessibility Hardening

**Sprint:** #4
**Related Tasks:** T-057, T-059, T-061, T-062, T-063
**Status:** Approved

**Description:**
Sprint 4 is a "polish and harden" sprint with no new features. This spec covers all UI-affecting changes: (1) disabling the submit button during rate limit lockout on auth pages, (2) fixing the ARIA role hierarchy mismatch in `DestinationChipInput`, (3) adding missing `aria-describedby` target IDs in `DestinationChipInput` and `RegisterPage`, and (4) implementing focus-return-to-trigger when `CreateTripModal` closes.

**Feedback sources:** FB-033 (submit button not disabled during lockout), FB-035 (ARIA role mismatch), FB-036 (missing aria-describedby targets), B-018 (triggerRef focus return).

**Note:** T-060 (parseRetryAfterMinutes utility extraction) and T-064 (axios 401 retry test) are pure code refactor/test tasks with no UI changes — they do not require design specs.

---

#### 10.1 Rate Limit Lockout — Disabled Submit Button (T-057 / T-059)

**Addendum to: Spec 9.2 (429 Rate Limit Error Message)**

**Problem:** When the 429 rate limit amber banner is active on LoginPage and RegisterPage, the submit button remains enabled. Users can click "sign in" or "create account" during the lockout, which triggers another API call that immediately returns 429 again. This wastes network requests and confuses users.

**Change Summary:** Disable the submit button while `rateLimitMinutes > 0`. Re-enable it when the countdown expires.

---

##### 10.1.1 LoginPage — Submit Button During Lockout

**Replaces Spec 9.2.1 Step 4** (which previously stated "Button remains **enabled**").

**New behavior when `rateLimitMinutes > 0`:**

1. **Button disabled state:**
   - The submit button changes from:
     ```
     disabled={isLoading}
     aria-disabled={isLoading}
     ```
     to:
     ```
     disabled={isLoading || rateLimitMinutes > 0}
     aria-disabled={isLoading || rateLimitMinutes > 0 ? 'true' : undefined}
     ```
   - This means the button is disabled during both loading AND rate limit lockout.

2. **Button text during lockout:**
   - When `rateLimitMinutes > 0` and `!isLoading`:
     - Button text changes from `"sign in"` to `"please wait…"`
     - The ellipsis (…) is a single unicode character `\u2026`, not three dots
   - When `isLoading`:
     - Button still shows the spinner (loading takes precedence over lockout text)
   - When neither loading nor rate-limited:
     - Button shows normal text `"sign in"`

3. **Button visual appearance during lockout:**
   - `cursor: not-allowed` — communicates the button is not interactive
   - `opacity: 0.4` — matches the Design System's disabled button opacity (`rgba(93,115,126,0.4)` maps to ~0.4 opacity on the accent background)
   - The button uses the existing primary button disabled style from the Design System Conventions: `background: rgba(93, 115, 126, 0.4)`, `color: var(--text-primary)`, `cursor: not-allowed`
   - No hover effect while disabled (hover styles should not apply)

4. **Button text logic (complete):**
   ```
   if (isLoading) → show spinner
   else if (rateLimitMinutes > 0) → "please wait…"
   else → "sign in"
   ```

5. **Re-enabling the button:**
   - When the existing countdown timer reaches 0 (i.e., `rateLimitMinutes` becomes `0` or `null`):
     - The button text reverts to `"sign in"`
     - The button becomes enabled again (`disabled={false}`)
     - `aria-disabled` is removed
     - The amber rate limit banner shows `"you can try again now."` (per existing Spec 9.2.1 step 3) and auto-dismisses after 3 seconds

6. **Edge case — user submits while lockout is active:**
   - Because the button has `disabled={true}`, the form's `onSubmit` will not fire
   - No API call is made
   - No additional error is shown (the amber banner already explains the situation)
   - If the user somehow bypasses the disabled state (e.g., programmatic form submit), the backend will return another 429 — the existing 429 handler refreshes the countdown

---

##### 10.1.2 RegisterPage — Submit Button During Lockout

**Same behavior as LoginPage** (10.1.1), with these text differences:

- Locked-out button text: `"please wait…"` (same as LoginPage)
- Normal button text: `"create account"` (unchanged)
- Loading state: spinner with `aria-label="Creating account"` (unchanged)

**Button text logic:**
```
if (isLoading) → show spinner
else if (rateLimitMinutes > 0) → "please wait…"
else → "create account"
```

All other behavior (disabled state, visual appearance, re-enabling, edge cases) is identical to 10.1.1.

---

##### 10.1.3 CSS Changes — Lockout Button State

No new CSS is required. The existing primary button disabled styles from the Design System Conventions already cover this:

```css
/* Already defined in the Design System Conventions */
.submitBtn:disabled {
  background: rgba(93, 115, 126, 0.4);
  cursor: not-allowed;
}

/* Ensure no hover effect when disabled */
.submitBtn:disabled:hover {
  background: rgba(93, 115, 126, 0.4); /* same as disabled, no change */
}
```

If the CSS module doesn't already include the `:disabled:hover` override, add it. The goal is that hovering over the disabled button produces no visual change.

---

##### 10.1.4 Accessibility — Submit Button During Lockout

- `aria-disabled="true"` is set on the button when rate-limited (already part of the disabled logic)
- Screen readers will announce the button as disabled
- The amber rate limit banner with `role="alert"` and `aria-live="polite"` already provides the reason for the disabled state — "too many login attempts. please try again in X minutes."
- When the countdown expires and the button re-enables, the banner text updates to `"you can try again now."` which is announced by the `aria-live` region, signaling to screen reader users that they can act again
- No additional `aria-label` change is needed on the button itself — `"please wait…"` as visible text is sufficient for screen readers

---

##### 10.1.5 Interaction Timeline (Full Scenario)

1. User enters wrong password, clicks "sign in" — standard error flow
2. User exceeds rate limit (e.g., 10 attempts in 15 minutes)
3. API returns HTTP 429 with `Retry-After: 840`
4. **Immediately:**
   - Amber banner appears: `"too many login attempts. please try again in 14 minutes."`
   - Submit button text changes to `"please wait…"`
   - Submit button becomes disabled with `cursor: not-allowed` and reduced opacity
   - All form inputs remain enabled (user can still correct their email/password in preparation)
5. **Every 60 seconds:** Banner countdown updates (14 → 13 → … → 1)
6. **When countdown reaches 0:**
   - Banner text: `"you can try again now."` (auto-dismiss after 3s)
   - Button text reverts to `"sign in"`
   - Button re-enables — user can click to submit again
7. User clicks "sign in" — normal submit flow resumes

---

##### 10.1.6 Responsive Behavior — Lockout Button

No special responsive changes needed. The submit button is already full-width on all breakpoints per Spec 1.1. The `"please wait…"` text fits within the button at all sizes. The amber banner wraps naturally on narrow screens per Spec 9.2.6.

---

---

#### 10.2 ARIA Role Hierarchy Fix — DestinationChipInput (T-061)

**Addendum to: Spec 8.1 (DestinationChipInput Component)**

**Problem:** The current implementation has `role="group"` on the outer container and `role="option"` on each chip. Per WAI-ARIA spec, `role="option"` requires an ancestor with `role="listbox"`. The current `role="group"` is not a valid owner for `role="option"`, which causes ARIA validation errors and can confuse screen readers.

**Analysis of the interaction pattern:** Destination chips are removable items in a collection — the user adds and removes them, but does not "select" them from a predefined list (which is what `role="listbox"` + `role="option"` models). The correct semantic is a group of list items, not a selection listbox.

**Change:** Switch from `role="option"` on chips to a semantically correct hierarchy.

---

##### 10.2.1 Updated ARIA Roles

**Outer container:**
- Keep `role="group"` (unchanged)
- Keep `aria-label="Destinations"` (unchanged)

**Individual chips:**
- Change from `role="option"` to **no explicit role** (remove the `role` attribute)
- Each chip is already an `<span>` containing text and a remove button — semantically it is a label + interactive button, which does not need a special ARIA role
- The remove button `<button>` within each chip already has `aria-label="Remove [destination]"`, which provides sufficient screen reader context

**Rationale:** Removing `role="option"` from chips eliminates the ARIA hierarchy violation. Since the chips are not selectable options (they are removable tags), `role="option"` was semantically incorrect. The `role="group"` on the container with `aria-label="Destinations"` groups the chips together. Each chip's remove button provides the interactive affordance.

---

##### 10.2.2 Alternative Considered (Rejected)

An alternative was to change the container to `role="listbox"` and keep `role="option"` on chips. This was rejected because:
- `role="listbox"` implies single/multi-selection from a list of choices
- Chips are not selectable — they are tags that can be removed
- A listbox expects keyboard navigation with arrow keys to move between options, which is not our interaction model
- Our keyboard model is: type → Enter to add, Backspace to remove last, Tab to leave

---

##### 10.2.3 Test Assertions Update

Existing DestinationChipInput tests that assert `role="option"` on chips must be updated to expect **no role attribute** on chip `<span>` elements. Verify:
- Container still has `role="group"`
- Container still has `aria-label="Destinations"`
- Each chip's remove button still has the correct `aria-label="Remove [destination name]"`
- Overall: no ARIA validation warnings when run through an accessibility checker

---

---

#### 10.3 Missing aria-describedby Target IDs (T-062)

**Addendum to: Spec 8.1 (DestinationChipInput) and Spec 1.3 (RegisterPage)**

**Problem:** Two `aria-describedby` references point to IDs that don't exist in the DOM:
1. `DestinationChipInput`: input has `aria-describedby="dest-chip-hint"` (when no error), but no element with `id="dest-chip-hint"` exists
2. `RegisterPage`: password input has `aria-describedby="password-hint"` (when no error), but no element with `id="password-hint"` exists

These broken references are silently ignored by browsers but mean screen readers never announce the hint text, which degrades the experience for visually impaired users.

---

##### 10.3.1 DestinationChipInput — Add Hint Element

**Add a hint text element** below the chip input container (inside the component, before the error message):

**HTML structure:**
```html
<div class="container" role="group" aria-label="Destinations">
  <!-- chips + text input -->
</div>
<span id="dest-chip-hint" class="chipHint">
  type a destination and press enter
</span>
<!-- error message (if any) rendered below hint -->
```

**Hint element styling:**
- `id="dest-chip-hint"` — matches the existing `aria-describedby` reference on the text input
- Text: `"type a destination and press enter"` — same text that was already used as the placeholder in some contexts
- Style: `font-size: 11px`, `color: var(--text-muted)`, `margin-top: 4px`, `letter-spacing: 0.02em`
- Always visible (not sr-only) — this serves as a visual hint for sighted users too

**aria-describedby logic on the text input (updated):**
```
aria-describedby={hasError ? 'dest-chip-error' : 'dest-chip-hint'}
```
- When no error: points to `dest-chip-hint` → screen reader announces "type a destination and press enter" after the input label
- When error: points to `dest-chip-error` → screen reader announces the error message instead

**Visibility rules:**
- The hint text is always rendered in the DOM (for `aria-describedby` to work)
- When an error is active, the hint is visually hidden (display: none or sr-only) and the error message is shown instead — but since `aria-describedby` already switches to the error ID, the hint's visibility doesn't matter for screen readers
- Simpler approach: keep the hint always visible. Error text appears below it. The `aria-describedby` switch ensures screen readers read the right thing.

**Recommended approach (simplest):** Keep hint always visible. Show error below it when present. This avoids toggling visibility.

---

##### 10.3.2 RegisterPage — Add Password Hint ID

**Change:** Add `id="password-hint"` to the existing "8 characters minimum" helper text in the password field's label.

**Current HTML (approximate):**
```html
<label htmlFor="password" className={styles.label}>
  PASSWORD
  <span className={styles.fieldHint}>8 characters minimum</span>
</label>
```

**Updated HTML:**
```html
<label htmlFor="password" className={styles.label}>
  PASSWORD
  <span id="password-hint" className={styles.fieldHint}>8 characters minimum</span>
</label>
```

**That's it.** The `<span>` already exists with the correct text and styling. Adding the `id` attribute is the only change needed to make the existing `aria-describedby="password-hint"` reference valid.

**aria-describedby logic on the password input (unchanged):**
```
aria-describedby={errors.password ? 'password-error' : 'password-hint'}
```
- When no error: points to `password-hint` → screen reader announces "8 characters minimum"
- When error: points to `password-error` → screen reader announces the validation error

**No visual changes.** No CSS changes. No layout changes.

---

##### 10.3.3 Verification Checklist

After implementation, verify:
- [ ] `document.getElementById('dest-chip-hint')` returns an element when DestinationChipInput is rendered
- [ ] `document.getElementById('password-hint')` returns an element when RegisterPage is rendered
- [ ] Screen reader (or accessibility tree inspector) correctly associates the hint text with the input when no error is present
- [ ] When an error is present, the error message is associated instead
- [ ] No duplicate IDs in the DOM (only one instance of each component renders at a time in normal flows)

---

---

#### 10.4 CreateTripModal — Focus Return to Trigger (T-063)

**Addendum to: Spec 2.5 (Create Trip Modal)**

**Problem:** Spec 2.5 states: "On close: return focus to the button that opened the modal." However, the current implementation defines `triggerRef` in CreateTripModal but never assigns it to the trigger button element. When the modal closes, focus is lost (goes to `<body>`), which is a WCAG 2.1 violation (Success Criterion 2.4.3 — Focus Order).

**Change Summary:** Pass a ref to the trigger button from HomePage and use it to return focus on modal close.

---

##### 10.4.1 Implementation Specification

**HomePage.jsx changes:**

1. Create a ref for the "new trip" button:
   ```
   const createTripBtnRef = useRef(null);
   ```

2. Attach the ref to the "new trip" button:
   ```html
   <button ref={createTripBtnRef} onClick={() => setShowModal(true)}>
     + new trip
   </button>
   ```

3. Also attach to the empty state CTA button (if different from the header button):
   ```html
   <button ref={createTripBtnRef} onClick={() => setShowModal(true)}>
     + plan your first trip
   </button>
   ```
   Note: if both the header "new trip" button and the empty state CTA exist simultaneously, only the header button needs the ref (the empty state CTA is the alternative when no trips exist, so only one is rendered at a time).

4. Pass the ref as a prop to CreateTripModal:
   ```html
   <CreateTripModal
     isOpen={showModal}
     onClose={() => setShowModal(false)}
     triggerRef={createTripBtnRef}
     ...
   />
   ```

**CreateTripModal.jsx changes:**

1. Accept `triggerRef` as a prop (it may already be declared — currently unused):
   ```
   function CreateTripModal({ isOpen, onClose, triggerRef, ... })
   ```

2. On modal close (all close paths), return focus to the trigger:
   - **Escape key handler:** After calling `onClose()`, call `triggerRef?.current?.focus()`
   - **Backdrop click handler:** After calling `onClose()`, call `triggerRef?.current?.focus()`
   - **Close button (×) click:** After calling `onClose()`, call `triggerRef?.current?.focus()`
   - **Cancel button click:** After calling `onClose()`, call `triggerRef?.current?.focus()`
   - **Successful creation:** The success flow navigates to `/trips/:id` via React Router. In this case, focus return is not needed because the page changes entirely — React Router will manage focus on the new page.

3. Recommended implementation pattern — centralize focus return:
   ```javascript
   const handleClose = useCallback(() => {
     onClose();
     // Use requestAnimationFrame to ensure the modal is unmounted
     // before moving focus, avoiding focus-trap conflicts
     requestAnimationFrame(() => {
       triggerRef?.current?.focus();
     });
   }, [onClose, triggerRef]);
   ```
   Then use `handleClose` for all close paths (Escape, backdrop, close button, cancel button).

4. For the successful creation path:
   ```javascript
   const handleSuccess = (newTripId) => {
     onClose();
     navigate(`/trips/${newTripId}`);
     // No focus return needed — page navigation handles focus
   };
   ```

---

##### 10.4.2 Focus Return Timing

The focus return must happen **after** the modal is fully unmounted from the DOM. If the modal uses a focus trap (which it should, per Spec 2.5), returning focus while the trap is still active will cause the focus to snap back into the modal.

**Recommended approach:**
- Use `requestAnimationFrame()` or `setTimeout(() => { ... }, 0)` to defer the focus call until after React has committed the DOM update that removes the modal.
- Alternatively, handle focus return in a `useEffect` that watches the `isOpen` prop transition from `true` to `false`.

**useEffect approach (alternative):**
```javascript
const prevOpenRef = useRef(false);
useEffect(() => {
  if (prevOpenRef.current && !isOpen) {
    // Modal just closed
    triggerRef?.current?.focus();
  }
  prevOpenRef.current = isOpen;
}, [isOpen, triggerRef]);
```

Either approach is acceptable. The Frontend Engineer should choose whichever integrates best with the existing modal open/close lifecycle.

---

##### 10.4.3 Accessibility Requirements

- **WCAG 2.1 SC 2.4.3 (Focus Order):** When a modal dialog closes, focus must return to the element that triggered the modal. This ensures keyboard users maintain their position in the page.
- **WCAG 2.1 SC 2.1.1 (Keyboard):** All modal close actions (Escape, backdrop, buttons) must return focus — not just the Cancel button.
- Focus return should be **silent** — no additional `aria-live` announcement is needed. The focus moving back to the trigger button is sufficient context.

---

##### 10.4.4 Test Assertions

Tests should verify:
1. **Open → Cancel → Focus:** Open modal, press Cancel, verify the "new trip" button has focus (`document.activeElement === createTripBtnRef.current`)
2. **Open → Escape → Focus:** Open modal, press Escape key, verify trigger button has focus
3. **Open → Backdrop click → Focus:** Open modal, click backdrop overlay, verify trigger button has focus
4. **Open → Close (×) → Focus:** Open modal, click × button, verify trigger button has focus
5. **Open → Create success → Navigation:** Open modal, submit successfully, verify navigation to `/trips/:id` (focus return not applicable — page changed)

---

---

#### 10.5 Sprint 4 Design Decisions & Notes

1. **"please wait…" vs. disabling without text change:** We chose to change the button text to "please wait…" during lockout rather than keeping "sign in" on a disabled button. This communicates **why** the button is disabled. A disabled "sign in" button with no text change could confuse users who don't notice the amber banner. The text change draws attention to the fact that they need to wait.

2. **Form inputs remain enabled during lockout:** Even though the submit button is disabled, the email and password inputs remain editable. This allows users to correct their credentials while waiting for the lockout to expire. There's no reason to prevent them from preparing their next attempt.

3. **ARIA role removal vs. replacement:** For the DestinationChipInput chip ARIA fix, we chose to remove `role="option"` entirely rather than replacing it with `role="listitem"` (which would require `role="list"` on the parent). The rationale is simplicity: the chips are already visually and semantically clear (text + remove button), and adding list semantics adds complexity without meaningful benefit. The `role="group"` + `aria-label="Destinations"` on the container provides sufficient grouping context.

4. **Hint text always visible:** For the `dest-chip-hint` element, we chose to keep it always visible rather than making it `sr-only`. The hint text "type a destination and press enter" is useful for sighted users too, especially those unfamiliar with chip/tag input patterns. This follows the principle of progressive disclosure — the hint helps first-time users without being intrusive.

5. **Focus return via requestAnimationFrame:** The `requestAnimationFrame` approach for focus return ensures the modal's focus trap has fully released before attempting to move focus. Without this deferral, the focus trap may intercept the focus change and snap it back into the (now closing) modal, creating a race condition.

6. **No spec needed for T-060 and T-064:** T-060 (extract parseRetryAfterMinutes to shared utility) is a pure refactor with zero UI changes — the function moves from two files to one shared file. T-064 (axios 401 retry queue tests) is a pure test addition. Neither task changes what the user sees or how they interact with the application.

---

*Sprint 4 specs above are all marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-02-25.*

---

---

### Spec 11: Home Page Search, Filter & Sort Controls

**Sprint:** #5
**Related Task:** T-071 (Design), T-073 (Frontend Implementation)
**Status:** Approved

**Description:**
The home page (`/`) is enhanced with a search/filter/sort toolbar that allows users to quickly find trips as their collection grows. The toolbar sits between the existing page header ("my trips" + "+ new trip" button) and the trip card grid. It provides three controls: a text search input (searches trip names and destinations), a status filter dropdown (ALL / PLANNING / ONGOING / COMPLETED), and a sort selector (by name, date created, or trip start date with ascending/descending direction). All three controls compose together — search + filter + sort are applied simultaneously via query parameters to the GET /trips API. When no trips match the active filters, a dedicated empty search results state is shown with a "clear filters" action. Filter state is synchronized with URL query parameters for bookmarkability.

This spec does NOT change the existing page header, trip card component, create trip modal, delete trip confirmation, or navbar. It only adds the filter toolbar and its associated behaviors.

---

#### 11.1 Filter Toolbar — Layout & Position

The filter toolbar is a new horizontal bar inserted between the page header and the trip grid.

**Page Structure (updated, top to bottom):**
1. Navbar (56px, sticky) — unchanged
2. Page header area (padding-top: 48px, padding-bottom: 32px) — unchanged ("my trips" + "+ new trip")
3. **Filter toolbar** (new) — search + status filter + sort controls
4. Trip grid or empty state (adjusted — see 11.7 for empty search state)

**Toolbar Container:**
- Max-width: 1120px, centered, horizontal padding 32px (same as page header and grid)
- Display: `flex`, `align-items: center`, `gap: 12px`
- Margin-bottom: 24px (space between toolbar and trip grid)
- `flex-wrap: wrap` — allows wrapping on narrow viewports

**Toolbar Children (left to right on desktop):**
1. Search input — takes available space (`flex: 1`, `min-width: 200px`)
2. Status filter dropdown — fixed width (`width: 180px`)
3. Sort selector — fixed width (`width: 220px`)

**Visibility Rule:**
- The toolbar is ALWAYS visible when the user has ≥1 trip (even if current filters produce zero results)
- The toolbar is NOT shown in the initial empty state (zero trips in database — the "no trips yet" empty state from Spec 2.4 still appears without the toolbar)
- The toolbar is NOT shown during the initial page loading skeleton state (it appears after trips are loaded and there is at least one trip)
- Rationale: Showing search/filter on a page with zero trips is confusing. Once the user has at least one trip, the toolbar appears and persists even when filtered results are empty.

---

#### 11.2 Search Input Component

A text input that searches across trip names and destination lists using the API's `?search=` parameter.

**Visual Design:**
- Container: `position: relative` (for icon positioning)
- Input: Full design system form pattern with modifications:
  - Background: `var(--surface-alt)` (`#3F4045`)
  - Border: `1px solid var(--border-subtle)`
  - Border-radius: `var(--radius-sm)` (2px)
  - Padding: `10px 14px 10px 38px` (left padding accommodates the search icon)
  - Font: IBM Plex Mono, 13px, font-weight 400
  - Color: `var(--text-primary)` (`#FCFCFC`)
  - Placeholder text: `"search trips..."` in `var(--text-muted)`
  - Height: 40px (explicit, to match dropdown heights)
  - `flex: 1`, `min-width: 200px`
  - Focus: border `var(--border-accent)` (`#5D737E`), outline none (border is sufficient)
  - Transition: `border-color 150ms ease`

**Search Icon (magnifying glass):**
- Position: `absolute`, left 12px, top 50%, `transform: translateY(-50%)`
- Size: 16px × 16px
- Color: `var(--text-muted)`
- SVG: Simple magnifying glass (circle + diagonal line)
- The icon is decorative — `aria-hidden="true"`

**Clear Button (X):**
- Position: `absolute`, right 10px, top 50%, `transform: translateY(-50%)`
- Visible ONLY when the input has text (non-empty value)
- Size: 16px × 16px clickable area (with 4px padding making tap target 24px)
- Icon: `×` symbol or thin X SVG, 12px
- Color: `var(--text-muted)`, hover: `var(--text-primary)`
- On click: clear the search input, immediately trigger an API call with empty search, return focus to the search input
- `aria-label="Clear search"`
- Transition: `opacity 150ms ease` (fade in/out when text appears/disappears)

**Debounce Behavior:**
- The search input is debounced with a **300ms** delay
- As the user types, a timer resets on each keystroke. After 300ms of inactivity, the API call is triggered with the current input value
- If the user clears the input (via the X button or selecting all + delete), the debounce fires immediately (no delay) to restore the full list
- While the debounced API call is in flight, no loading indicator is shown on the search input itself — the trip grid shows its loading state (see 11.6)

**Character Handling:**
- Search is case-insensitive (handled server-side via ILIKE)
- Leading/trailing whitespace is trimmed before sending to the API
- Empty string or whitespace-only input is treated as "no search filter" (omit `?search=` param)
- No minimum character requirement — even a single character triggers a search after debounce

---

#### 11.3 Status Filter Dropdown

A native `<select>` dropdown that filters trips by their computed status.

**Visual Design:**
- Element: `<select>` (native HTML select for reliability and accessibility)
- Width: 180px
- Height: 40px
- Background: `var(--surface-alt)` (`#3F4045`)
- Border: `1px solid var(--border-subtle)`
- Border-radius: `var(--radius-sm)` (2px)
- Padding: `10px 32px 10px 14px` (right padding for the dropdown chevron)
- Font: IBM Plex Mono, 13px, font-weight 400
- Color: `var(--text-primary)`
- Focus: border `var(--border-accent)`, outline none
- Transition: `border-color 150ms ease`
- Custom dropdown chevron: Use `appearance: none` and a CSS background-image SVG chevron (▾) on the right side, color `var(--text-muted)`, 10px
- On macOS/Windows, the native dropdown picker appears when clicking — this is intentional for accessibility

**Options:**

| Value | Label | API Param |
|-------|-------|-----------|
| `""` (empty string) | `all statuses` | Omit `?status=` param entirely |
| `"PLANNING"` | `planning` | `?status=PLANNING` |
| `"ONGOING"` | `ongoing` | `?status=ONGOING` |
| `"COMPLETED"` | `completed` | `?status=COMPLETED` |

- Default selected: `all statuses` (empty value)
- Labels are lowercase to match the Japandi/minimal aesthetic
- On change: immediately trigger an API call with the selected status (no debounce — selects are a discrete action)

**Label:**
- An `aria-label="Filter by status"` on the `<select>` element
- No visible label text — the first option ("all statuses") serves as the contextual label
- Rationale: Adding a visible "STATUS" label above or beside the dropdown would add visual clutter to the toolbar. The option text is self-explanatory.

---

#### 11.4 Sort Selector

A native `<select>` dropdown that controls the sort order of the trip list. It combines `sort_by` and `sort_order` into a single dropdown for simplicity.

**Visual Design:**
- Same styling as the status filter dropdown (11.3)
- Width: 220px
- Height: 40px
- All other visual properties identical to 11.3

**Options:**

| Value | Label | API Params |
|-------|-------|------------|
| `"created_at:desc"` | `newest first` | `?sort_by=created_at&sort_order=desc` |
| `"created_at:asc"` | `oldest first` | `?sort_by=created_at&sort_order=asc` |
| `"name:asc"` | `name A — Z` | `?sort_by=name&sort_order=asc` |
| `"name:desc"` | `name Z — A` | `?sort_by=name&sort_order=desc` |
| `"start_date:asc"` | `soonest trip first` | `?sort_by=start_date&sort_order=asc` |
| `"start_date:desc"` | `latest trip first` | `?sort_by=start_date&sort_order=desc` |

- Default selected: `newest first` (matches current behavior — `created_at desc`)
- Labels are lowercase, human-readable
- On change: immediately trigger an API call with the selected sort params (no debounce)
- The value format `"field:direction"` is a frontend convention for composing the two API params from a single select value

**Label:**
- `aria-label="Sort trips"` on the `<select>` element
- No visible label text (same rationale as status filter)

---

#### 11.5 Active Filter Indicator + Clear All

When any filter is active (search text is non-empty, status is not "all statuses", or sort is not the default "newest first"), show a subtle "clear filters" link/button below or at the end of the toolbar.

**Visual Design:**
- Position: At the right end of the toolbar (on desktop) or below the toolbar row (on mobile when wrapped)
- Element: `<button>` styled as a text link
- Text: `"clear filters"` (lowercase)
- Font: IBM Plex Mono, 11px, font-weight 400
- Color: `var(--text-muted)`
- Hover: color `var(--accent)`, text-decoration underline
- Transition: `color 150ms ease`
- `aria-label="Clear all filters and sort"`

**Visibility:**
- Hidden when all filters are at their default values (search empty, status = all, sort = newest first)
- Visible when ANY filter is non-default
- Transition: `opacity 150ms ease` on show/hide

**Behavior:**
- On click: Reset search input to empty, status dropdown to "all statuses", sort dropdown to "newest first"
- Trigger a single API call with no filter params (restoring the default view)
- Return focus to the search input after clearing

**Active Filter Count (optional enhancement):**
- If desired, display a small count badge next to "clear filters" showing how many filters are active (e.g., "clear filters (2)")
- Badge: inline, font-size 11px, color `var(--accent)`, within parentheses
- This is optional — the Frontend Engineer may omit this if it adds clutter

---

#### 11.6 URL Query Parameter Synchronization

Filter state is synced with the browser URL for bookmarkability and shareability.

**URL Format:**
```
/?search=tokyo&status=PLANNING&sort=name:asc
```

**Parameter Mapping:**

| URL Param | State | Default (omitted from URL) |
|-----------|-------|---------------------------|
| `search` | Search input text | Empty string |
| `status` | Status filter value | Empty (all statuses) |
| `sort` | Sort value (`field:direction`) | `created_at:desc` |

**Behavior:**
- On page load: Read URL query params and initialize the filter state from them. If params are present, apply them to the initial API call.
- On filter change: Update the URL using `useSearchParams` (React Router) or `history.replaceState`. Use `replaceState` (not `pushState`) to avoid polluting browser history with every keystroke.
- Default values are omitted from the URL to keep it clean. `/?` with no params = default view.
- If the URL contains invalid param values (e.g., `?status=INVALID`), silently ignore them and use defaults.

**Back/Forward Navigation:**
- If the user navigates away from the home page and comes back (via browser back), the URL params restore the filter state.
- This is handled naturally by reading URL params on mount.

---

#### 11.7 States

##### 11.7.1 Default State (No Filters Active)

- Toolbar visible with search input empty, status set to "all statuses", sort set to "newest first"
- Trip grid shows all trips in `created_at desc` order (same as current behavior)
- "clear filters" button is hidden
- This is identical to the current home page experience, plus the new toolbar

##### 11.7.2 Filtered State (Results Found)

- One or more filters are active
- Trip grid shows filtered/sorted results
- "clear filters" button is visible
- Result count: Display a subtle text below the toolbar, above the grid: `"showing X trip(s)"` where X is the number of results
  - Font: IBM Plex Mono, 11px, font-weight 400, color `var(--text-muted)`
  - Margin-bottom: 16px
  - This text is ONLY shown when filters are active (not in default state)
  - Singular/plural: "showing 1 trip" vs. "showing 3 trips"
  - When no filters are active, this line is hidden (the user can see all their trips — no need to count)

##### 11.7.3 Empty Search Results State

Shown when the API returns zero results for the active filter combination.

**Layout:**
- The toolbar remains visible and interactive (user can change filters)
- Below the toolbar, instead of the trip grid, show a centered empty state block:

**Content (vertically centered in available space):**
- Icon: A simple SVG search icon with a slash/cross through it, or a magnifying glass with a question mark. Size: 40px. Color: `var(--accent)` at 30% opacity.
- Heading: `"no trips found"` — font-size 16px, font-weight 400, color `var(--text-primary)`. Margin-top: 20px.
- Subtext: Dynamic based on active filters:
  - If search is active: `"no trips match "[search term]""` — font-size 13px, color `var(--text-muted)`. The search term is wrapped in quotes and truncated at 30 characters with ellipsis if longer.
  - If status filter is active (no search): `"no [status] trips"` — e.g., "no planning trips", "no completed trips"
  - If both search and status are active: `"no [status] trips match "[search term]""` — e.g., "no planning trips match "tokyo""
  - Fallback (sort only, shouldn't produce empty): `"no trips found"`
- Font-size 13px, color `var(--text-muted)`. Margin-top: 8px.
- CTA Button: `"clear filters"` — secondary button style. Margin-top: 20px. On click: same behavior as the toolbar "clear filters" (reset all, refetch).

**Note:** This empty state replaces the trip grid area ONLY. The page header ("my trips" + "+ new trip") remains visible. The user can still create a new trip while viewing empty search results.

**Important distinction:** This is different from the existing "no trips yet" empty state (Spec 2.4). That state appears when the user has ZERO trips in the database. The empty SEARCH results state appears when the user has trips but none match the current filters. They must never be confused:
- Zero trips in DB → Spec 2.4 empty state (no toolbar shown)
- Trips exist but filters match none → Spec 11.7.3 empty search results (toolbar shown)

##### 11.7.4 Loading State (Filter Change In Progress)

When a filter changes and an API call is in flight:
- The toolbar controls remain interactive (user can change filters while loading — each change cancels the previous request and starts a new one)
- The trip grid area shows a subtle loading indicator:
  - Option A (preferred): The trip cards fade to 50% opacity with `transition: opacity 200ms ease` while the new results load. When results arrive, cards snap back to full opacity with the new data. This is a lightweight "stale while revalidating" pattern.
  - Option B (alternative): Show 3 skeleton cards (reuse existing skeleton from Spec 2.7). Use this if Option A feels jarring when the number of cards changes significantly.
- The Frontend Engineer should choose Option A as the primary approach. Option B is the fallback if Option A introduces layout shift issues.
- Loading state should be brief (API calls are fast for the expected data volume). Do NOT show a full-page spinner.

##### 11.7.5 API Error State (Filter Fetch Failed)

If a filtered API call fails:
- The toolbar remains visible and interactive
- Below the toolbar, show the existing error block from Spec 2.8:
  - Warning icon, "could not load trips.", "check your connection and try again.", "try again" button
- The "try again" button retries the API call with the CURRENT filter state (not default)
- Previous trip cards are removed (do not show stale filtered data alongside an error)

##### 11.7.6 Initial Page Load (First Visit)

On first page load (no URL params):
1. Show page header immediately
2. Show loading skeleton (Spec 2.7) — toolbar is NOT shown yet
3. API returns trips:
   - If 0 trips: Show Spec 2.4 empty state ("no trips yet"), no toolbar
   - If ≥1 trip: Show toolbar (default state) + trip grid with results
4. If URL has filter params: Initialize toolbar state from params, fetch with those params, show toolbar + filtered results

---

#### 11.8 User Flow — Search

1. User lands on home page, sees their trips in the default grid with the new toolbar above
2. User clicks into the search input (focus ring appears)
3. User types "tokyo" — after each keystroke, the 300ms debounce timer resets
4. After 300ms of no typing, the API call fires: `GET /trips?search=tokyo`
5. Trip grid fades to 50% opacity briefly (loading state)
6. API returns filtered results — grid updates to show only trips matching "tokyo" in name or destinations
7. URL updates to `/?search=tokyo`
8. "showing 2 trips" text appears below the toolbar
9. "clear filters" link appears in the toolbar
10. User decides to narrow further — selects "planning" from the status dropdown
11. API call fires immediately: `GET /trips?search=tokyo&status=PLANNING`
12. Grid updates with combined filter results
13. URL updates to `/?search=tokyo&status=PLANNING`
14. "showing 1 trip" text updates
15. User clicks "clear filters" — all controls reset, full trip list restored, URL cleaned

---

#### 11.9 User Flow — Filter by Status

1. User clicks the status filter dropdown
2. Native select picker opens showing: all statuses, planning, ongoing, completed
3. User selects "completed"
4. Dropdown closes, API call fires immediately: `GET /trips?status=COMPLETED`
5. Grid updates to show only completed trips
6. URL updates to `/?status=COMPLETED`
7. "showing X trips" text appears
8. "clear filters" becomes visible
9. User selects "all statuses" — filter is removed, full list restored

---

#### 11.10 User Flow — Sort

1. User clicks the sort dropdown (currently showing "newest first")
2. User selects "name A — Z"
3. API call fires: `GET /trips?sort_by=name&sort_order=asc`
4. Trip grid re-renders with alphabetically sorted cards
5. URL updates to `/?sort=name:asc`
6. "clear filters" becomes visible (sort is non-default)
7. Note: Changing sort alone does NOT show the "showing X trips" count (sort doesn't reduce results). The count text only appears when search or status filter is active.

---

#### 11.11 Component Breakdown

| Component | Type | Description |
|-----------|------|-------------|
| `FilterToolbar` | Container | Flex row containing SearchInput, StatusFilter, SortSelector, and ClearFilters. Manages filter state and composes API query params. |
| `SearchInput` | Input | Debounced text input with magnifying glass icon and clear (X) button. |
| `StatusFilter` | Select | Native `<select>` for status filtering. |
| `SortSelector` | Select | Native `<select>` for sort field + direction. |
| `ClearFiltersButton` | Button | Text button to reset all filters. Conditionally visible. |
| `EmptySearchResults` | Presentational | Empty state shown when filters match zero trips. |
| `ResultCount` | Text | "showing X trip(s)" text, shown only when filters are active. |

**State Management:**
- Filter state should be managed in the HomePage component (or a custom `useFilteredTrips` hook)
- State shape:
  ```
  {
    search: string          // current search text
    status: string          // "" | "PLANNING" | "ONGOING" | "COMPLETED"
    sortBy: string          // "created_at" | "name" | "start_date"
    sortOrder: string       // "asc" | "desc"
  }
  ```
- The hook composes the API query params from this state and passes them to the `GET /trips` call
- The existing `useTrips` hook should be extended (or a new `useFilteredTrips` hook wraps it) to accept filter params

---

#### 11.12 Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Toolbar: single horizontal row. Search input takes flex space. Status filter 180px. Sort selector 220px. "clear filters" appears at the end of the row. Trip grid: 3 columns. |
| **Tablet (768–1023px)** | Toolbar: single horizontal row (still fits). Search input: `min-width: 200px`, may shrink. Status filter: 160px. Sort selector: 200px. "clear filters" wraps to second row if needed. Trip grid: 2 columns. |
| **Mobile (<768px)** | Toolbar: wraps to multiple rows via `flex-wrap: wrap`. Search input: `width: 100%` (full row). Status filter and sort selector: side by side on the second row, each `flex: 1`, `min-width: 0`. "clear filters": full width below, text-align left, margin-top 8px. Trip grid: 1 column. Gap between toolbar items: 8px (reduced from 12px for tighter mobile layout). |

**Mobile-specific adjustments:**
- Search input becomes full-width on its own row
- Status filter and sort selector share the second row equally
- The "showing X trips" count text sits below the toolbar, full-width, margin-top 12px
- All touch targets remain ≥40px height (already met by 40px input/select height)

---

#### 11.13 Accessibility

**Toolbar Container:**
- Wrap the toolbar in a `<div role="search" aria-label="Filter trips">` to semantically mark it as a search region
- This allows screen readers to announce "Filter trips, search" when entering the region

**Search Input:**
- `<input type="search">` (native search input type — provides clear button in some browsers, semantic)
- `aria-label="Search trips by name or destination"`
- `autocomplete="off"` (not an address or standard field)
- `aria-describedby` pointing to an `sr-only` hint: "results update as you type" (ID: `search-hint`)
- The sr-only hint: `<span id="search-hint" class="sr-only">results update as you type</span>`
- Clear button: `aria-label="Clear search"`, `type="button"`

**Status Filter:**
- `<select aria-label="Filter by status">`
- Each `<option>` has clear text labels

**Sort Selector:**
- `<select aria-label="Sort trips">`
- Each `<option>` has clear text labels

**Clear Filters Button:**
- `aria-label="Clear all filters and sorting"`
- `type="button"`

**Result Count (Live Region):**
- The "showing X trip(s)" text element should have `aria-live="polite"` and `role="status"`
- This announces result count changes to screen readers without interrupting the user
- Updates after each API response (debounced naturally by the search debounce + API latency)

**Empty Search Results:**
- The heading "no trips found" is announced to screen readers via the live region update
- The "clear filters" CTA button is focusable and has `aria-label="Clear all filters"`

**Keyboard Navigation:**
- Tab order within toolbar: Search input → Clear search (if visible) → Status filter → Sort selector → Clear filters button (if visible)
- Search input: Enter key does NOT submit a form (there is no form) — it's just a text input with debounce
- Escape key while in search input: clears the search text (same as clicking the X button)
- All dropdown selects are keyboard-navigable natively (arrow keys, space/enter to select)

**Focus Management:**
- On "clear filters" click: move focus to the search input
- On search clear (X click): move focus to the search input
- Tab focus ring: `outline: 2px solid var(--accent); outline-offset: 2px` on all toolbar controls (consistent with design system)

---

#### 11.14 Integration with Existing Components

**What Changes:**

| Component | Change |
|-----------|--------|
| `HomePage.jsx` | Add FilterToolbar between page header and trip grid. Manage filter state (or use a new hook). Pass filter params to trip fetch. Conditionally render EmptySearchResults vs. trip grid vs. Spec 2.4 empty state. |
| `useTrips.js` (or new `useFilteredTrips.js`) | Accept optional filter params (search, status, sortBy, sortOrder). Pass as query params to `GET /trips`. Return results. Handle cancellation of in-flight requests when filters change. |
| `HomePage.module.css` | Add styles for `.filterToolbar`, `.searchInput`, `.statusFilter`, `.sortSelector`, `.clearFilters`, `.resultCount`, `.emptySearchResults`. |

**What Does NOT Change:**

| Component | Unchanged |
|-----------|-----------|
| `TripCard.jsx` | No changes. Cards render the same regardless of how they were filtered. |
| `Navbar.jsx` | No changes. |
| `CreateTripModal` | No changes. After creating a trip, navigate to `/trips/:id` as before. |
| Delete confirmation | No changes. After deletion, the list refetches (with current filters applied). |

**Edge Case — Trip Created While Filters Active:**
- If the user has active filters and creates a new trip via the modal, they navigate away to `/trips/:id`. When they return to the home page (via back button or nav), the URL params restore the filter state.
- The new trip may or may not match the active filters — that's expected. If the user wants to see all trips, they click "clear filters."

**Edge Case — Trip Deleted While Filters Active:**
- After deleting a trip, the trip is removed from the current filtered view. The result count updates. If the deleted trip was the last matching trip, the empty search results state appears.

**Edge Case — API Returns Fewer Results Than Expected:**
- If the API returns 0 results for a filtered query but the user previously had results, show the empty search results state (11.7.3). Do not fall back to the "no trips yet" state (Spec 2.4) — that state is ONLY for users with zero trips in the database.
- The Frontend Engineer should use the `pagination.total` field from the API response: if `total === 0` AND filters are active, show empty search results. If `total === 0` AND no filters are active, show the Spec 2.4 empty state.

---

#### 11.15 Design Decisions & Notes

1. **Native `<select>` vs. custom dropdown:** We chose native `<select>` elements for the status filter and sort selector instead of custom dropdown components. Rationale: (a) Native selects are fully accessible out of the box — keyboard navigation, screen reader support, mobile pickers all work without custom ARIA. (b) They match the minimal Japandi aesthetic — no flashy custom dropdowns needed. (c) They can be styled sufficiently with CSS (`appearance: none` + custom chevron). (d) Custom dropdowns are a significant implementation effort with many accessibility pitfalls. The trade-off is less visual control over the dropdown picker itself, but the trigger element is fully styled.

2. **Combined sort selector vs. separate field + direction:** We combined sort field and direction into a single dropdown (e.g., "name A — Z" instead of separate "sort by: name" + "direction: ascending" controls). Rationale: (a) Reduces the number of controls from 4 to 3, keeping the toolbar compact. (b) Users think in terms of "newest first" not "created_at descending." (c) The combined approach is used by many popular apps (Gmail, Notion, Airbnb). (d) 6 options in a single dropdown is easily scannable.

3. **No filter chips/pills:** We chose not to show active filter chips below the toolbar (e.g., "[PLANNING ×] [Search: tokyo ×]"). Rationale: The toolbar itself shows the active state in each control. Filter chips would duplicate this information and add visual clutter. The "clear filters" button provides a single reset action. If users need to remove one specific filter, they can change that control directly.

4. **URL sync via replaceState:** We use `replaceState` (not `pushState`) to update the URL as filters change. This means pressing browser Back does not step through every filter change — it goes back to the previous page. This is intentional: filter changes are refinements, not navigation steps. Stepping back through every search keystroke would be frustrating.

5. **Search debounce 300ms:** This is the standard debounce interval used by most search-as-you-type implementations. It balances responsiveness (user sees results quickly) with efficiency (not hammering the API on every keystroke). Faster typists may trigger fewer API calls, slower typists see results sooner.

6. **No search results animation:** Trip cards do not animate in/out when search results change. The grid simply re-renders with the new set of cards. Adding enter/exit animations for filtered cards would add significant complexity with minimal UX benefit for this use case.

7. **"showing X trips" only when filtered:** The result count text is intentionally hidden in the default (unfiltered) view. When you can see all your trips, counting them adds no value. The count becomes useful when filters are active — it tells the user how many trips matched their query, providing feedback that the filter is working.

---

#### 11.16 CSS Class Reference

For the Frontend Engineer's reference, suggested CSS module class names:

```css
/* FilterToolbar container */
.filterToolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

/* Search input wrapper */
.searchWrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.searchIcon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.searchInput {
  width: 100%;
  height: 40px;
  padding: 10px 38px 10px 38px; /* right padding for clear btn */
  background: var(--surface-alt);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  transition: border-color 150ms ease;
}

.searchInput:focus {
  border-color: var(--border-accent);
  outline: none;
}

.searchInput::placeholder {
  color: var(--text-muted);
}

.clearSearch {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 150ms ease;
}

.clearSearch:hover {
  color: var(--text-primary);
}

/* Shared select styling */
.selectInput {
  height: 40px;
  padding: 10px 32px 10px 14px;
  background: var(--surface-alt);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron SVG */
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 10px;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.selectInput:focus {
  border-color: var(--border-accent);
  outline: none;
}

.statusFilter {
  width: 180px;
}

.sortSelector {
  width: 220px;
}

/* Clear filters */
.clearFilters {
  background: none;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  cursor: pointer;
  padding: 4px 0;
  transition: color 150ms ease;
}

.clearFilters:hover {
  color: var(--accent);
  text-decoration: underline;
}

/* Result count */
.resultCount {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
  margin-bottom: 16px;
}

/* Empty search results */
.emptySearchResults {
  text-align: center;
  padding-top: 64px;
  padding-bottom: 64px;
}

.emptySearchIcon {
  color: var(--accent);
  opacity: 0.3;
}

.emptySearchHeading {
  font-size: 16px;
  font-weight: 400;
  color: var(--text-primary);
  margin-top: 20px;
}

.emptySearchSubtext {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Mobile responsive */
@media (max-width: 767px) {
  .filterToolbar {
    gap: 8px;
  }

  .searchWrapper {
    width: 100%;
    min-width: 0;
    flex: none;
  }

  .statusFilter,
  .sortSelector {
    flex: 1;
    min-width: 0;
    width: auto;
  }

  .clearFilters {
    width: 100%;
    text-align: left;
    margin-top: 4px;
  }
}
```

*These are reference styles. The Frontend Engineer may adjust specifics to integrate with the existing CSS module patterns while maintaining the design intent.*

---

*Sprint 5 spec above is marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-02-25.*

---

## Sprint 6 Design Specifications

---

### Design System — Sprint 6 Additions

The following CSS custom property is added to the `:root` block for land travel event coloring:

```css
:root {
  /* ... existing variables ... */
  --color-flight:       #5D737E;   /* existing — muted steel blue */
  --color-stay:         #3D8F82;   /* existing — teal */
  --color-activity:     #C47A2E;   /* existing — amber */
  --color-land-travel:  #7B6B8E;   /* NEW Sprint 6 — muted purple */
}
```

The land travel color (`#7B6B8E`) is a muted purple selected to be perceptually distinct from the existing three event colors while remaining within the Japandi minimal palette. It reads clearly against both `--bg-primary` and `--surface` backgrounds with white text (`--text-primary`).

---

### Spec 12: Land Travel Sub-Resource

**Sprint:** #6
**Related Tasks:** T-081 (Design), T-087 (Frontend: Edit Page), T-088 (Frontend: Trip Details Display)
**Status:** Approved

**Description:**
Land travel is a new sub-resource (Sprint 6) that captures ground transportation: rental cars, buses, trains, rideshares, ferries, and other modes. This spec covers two related screens:
- **Part A (12A): Land Travel Section on Trip Details Page** — Read-only display of all land travel entries below the Activities section (implemented in T-088).
- **Part B (12B): Land Travel Edit Page** — `/trips/:id/land-travel/edit` for creating, editing, and deleting land travel entries (implemented in T-087).

The data model for a land travel entry (per the pre-approved schema): `id`, `trip_id`, `mode` (RENTAL_CAR | BUS | TRAIN | RIDESHARE | FERRY | OTHER), `provider` (optional), `from_location`, `to_location`, `departure_date` (YYYY-MM-DD), `departure_time` (HH:MM, optional), `arrival_date` (optional), `arrival_time` (HH:MM, optional), `confirmation_number` (optional), `notes` (optional).

---

### Part A — 12A: Land Travel Section on Trip Details Page

---

#### 12A.1 Section Position & Header

The Land Travel section appears on the Trip Details page (`/trips/:id`) **below the Activities section**, as the last sub-resource section before the page ends. It follows the exact same structural pattern as the Flights, Stays, and Activities sections.

**Page section order (updated for Sprint 6):**
1. Trip header (name, destinations, date range, edit icon)
2. TripCalendar component
3. Flights section
4. Stays section
5. Activities section
6. **Land Travel section** ← new

**Section Container:**
- Margin-top: 40px (from Activities section's last element)
- Same max-width and horizontal padding as other sections (1120px centered, 32px horizontal)

**Section Header Row:**
Follows the standard section header pattern used by Flights/Stays/Activities:
- Font-size: 11px, font-weight: 600, letter-spacing: 0.12em, uppercase, color: `--text-muted`
- Layout: `display: flex`, `align-items: center`, `gap: 16px`, margin-bottom: 16px
- Label: `"land travel"`
- Horizontal rule: `<hr>` or `flex: 1` div with `border-top: 1px solid var(--border-subtle)` extending to the right
- Right side (after the rule): `"edit"` link
  - Font-size: 12px, color: `--accent`, no underline by default, underline on hover
  - Navigates to `/trips/:id/land-travel/edit`
  - `aria-label="Edit land travel entries"`
  - Matches the exact visual style of the "edit" links on Flights, Stays, and Activities section headers

---

#### 12A.2 Empty State

When no land travel entries exist for the trip:

**Empty placeholder container:**
- `border: 1px dashed rgba(93,115,126,0.3)`, padding: 40px 24px, border-radius: 4px, text-align: center
- Margin-bottom: 32px

**Content (centered, stacked vertically, gap: 12px):**
1. Primary text: `"no land travel added yet."` — 13px, `--text-muted`, font-weight: 400
2. Secondary text: `"add rental cars, trains, buses, rideshares, ferries, and more."` — 11px, `rgba(252,252,252,0.3)`, margin-top: 4px
3. CTA button: `"+ add land travel"` — secondary button style, small size (padding: 7px 16px, font-size: 12px), margin-top: 16px. On click → navigates to `/trips/:id/land-travel/edit`.

---

#### 12A.3 Loading State

While the section is fetching entries (`GET /trips/:id/land-travel`):

- Show **2 skeleton card placeholders** stacked vertically
- Each skeleton: background `var(--surface)`, border `1px solid var(--border-subtle)`, border-radius: 4px, height: 84px, width: 100%, shimmer animation (left-to-right gradient sweep, same as existing skeleton patterns)
- Margin-bottom: 10px between skeleton cards

---

#### 12A.4 Error State

When the fetch fails:
- Error container: `"could not load land travel."` (13px, `--text-muted`) followed by `"try again"` as an inline link/button (accent color, 13px, cursor: pointer)
- On click: re-fetch via `GET /trips/:id/land-travel`
- Error container has the same visual treatment as the flight/stay/activity section error states

---

#### 12A.5 Land Travel Entry Cards

When entries exist, each entry is displayed as a card. Cards are sorted by `departure_date` ASC (matching the API's default sort order).

**Card Container:**
- Background: `var(--surface)` (`#30292F`)
- Border: `1px solid var(--border-subtle)`
- Border-radius: 4px
- Padding: 16px 20px
- Margin-bottom: 10px
- Display: flex, flex-direction: column, gap: 8px
- Transition: `border-color 150ms ease`

**Card Layout — rows from top to bottom:**

**Row 1 — Identity Row** (flex, align-items: center, gap: 12px, flex-wrap: wrap):

- **Mode Badge** (flex-shrink: 0):
  - Pill shape matching existing status badge style
  - Background: `rgba(123, 107, 142, 0.2)` (i.e., `--color-land-travel` at 20% opacity)
  - Text color: `var(--color-land-travel)` (`#7B6B8E`)
  - Font-size: 10px, font-weight: 600, letter-spacing: 0.1em, uppercase, padding: 3px 10px, border-radius: 2px
  - Display labels for each mode:
    | API Value | Display |
    |-----------|---------|
    | `RENTAL_CAR` | `rental car` |
    | `BUS` | `bus` |
    | `TRAIN` | `train` |
    | `RIDESHARE` | `rideshare` |
    | `FERRY` | `ferry` |
    | `OTHER` | `other` |

- **Provider** (flex: 1, 12px, `--text-muted`): Display if `provider` is not null/empty (e.g., `"Hertz"`, `"Amtrak"`, `"Uber"`). If absent, omit this element entirely — do NOT show "n/a" or a dash.

**Row 2 — Route Row** (flex, align-items: center, gap: 8px):
- `from_location` — 14px, font-weight: 500, `--text-primary`
- `→` arrow — 14px, `--accent`
- `to_location` — 14px, font-weight: 500, `--text-primary`

**Row 3 — Date/Time Row** (12px, `--text-muted`, flex, gap: 16px, flex-wrap: wrap):
- **Departure** (always present): Format as `"Depart: Mon Aug 7"` (short weekday + month day from `departure_date`). If `departure_time` is set, append `"· 9:00 AM"` (12h format with AM/PM). Full example: `"Depart: Mon Aug 7 · 9:00 AM"`.
- **Arrival** (only if `arrival_date` is set): Format as `"Arrive: Tue Aug 8"`. If `arrival_time` is set, append `"· 6:30 PM"`. Full example: `"Arrive: Tue Aug 8 · 6:30 PM"`.
- Departure and Arrival separated by a vertical bar `"·"` or line separator if both appear on the same row. On narrow viewports, they can wrap to separate lines.

**Row 4 — Details Row** (12px, `--text-muted`, flex, gap: 16px, flex-wrap: wrap):
- **Confirmation Number** (if present): `"Conf: "` label (10px, `rgba(252,252,252,0.3)`, letter-spacing: 0.04em) followed by the confirmation number value in IBM Plex Mono, 12px, `--text-muted`. Example: `"Conf: XYZ-123456"`.
- This row is **entirely omitted** if `confirmation_number` is null/empty.

**Row 5 — Notes Row** (conditional):
- Font-style: italic, 12px, `rgba(252,252,252,0.4)`, line-height: 1.5
- Displays `notes` text if present
- Max 2 lines, overflow: ellipsis (`-webkit-line-clamp: 2`, `display: -webkit-box`, `-webkit-box-orient: vertical`, `overflow: hidden`)
- Omitted entirely if `notes` is null/empty

---

#### 12A.6 Multiple Entries

When multiple land travel entries exist:
- All cards are stacked vertically, sorted by `departure_date` ASC (oldest first), then by `departure_time` ASC NULLS LAST (entries without times after those with times on the same date)
- No section sub-headers between entries (entries from different dates are not grouped — they are presented in a flat sorted list)
- Margin-bottom: 10px between cards; last card has no bottom margin before the next page section

---

#### 12A.7 Calendar Integration

The land travel section passes its data to `TripCalendar.jsx` for calendar display:
- `landTravels` array is passed as a prop alongside `flights`, `stays`, `activities`
- Calendar renders a land travel event chip on `departure_date` using `--color-land-travel` (`#7B6B8E`)
- If `arrival_date` is set and differs from `departure_date`, also render a landing/arrival chip on `arrival_date`
- Event label format: `"[mode label] to [to_location]"` (e.g., `"train to Los Angeles"`, `"rental car to Las Vegas"`)
- Land travel event time display follows the calendar enhancement spec (see Spec 12 Calendar Addendum)

---

#### 12A.8 Responsive Behavior — Trip Details Land Travel Section

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥768px) | Cards full-width. Route row and date/time row on single lines. Provider and mode badge on same row. |
| Mobile (<768px) | Cards full-width. All rows wrap as needed. Route arrow (`→`) stays inline. Provider may appear below mode badge if wrapping. Page padding: 16px horizontal. |

---

#### 12A.9 Accessibility — Trip Details Land Travel Section

- Section header: `<h2>` or equivalent landmark for "land travel" (styled per spec, removes browser default styles)
- Edit link: `aria-label="Edit land travel entries"`
- Empty state CTA button: `aria-label="Add land travel entries"`
- Error retry link/button: `role="button"` if implemented as `<a>`, or use `<button>` with matching styles
- Mode badges: plain text — no aria annotation needed (badge text is readable)
- Cards: each card as `<article>` or a `<div>` without special role — they are display-only (no interactions except the edit link which is in the section header)

---

### Part B — 12B: Land Travel Edit Page

---

#### 12B.1 Route & Navigation

**Route:** `/trips/:id/land-travel/edit`
- Registered in `App.jsx` behind `<ProtectedRoute>`
- Reached via the "edit" link in the Land Travel section header on Trip Details page
- Also reachable via the empty state CTA "add land travel" button

**Page background:** `--bg-primary` (`#02111B`), same as all other edit pages.

**Page Header Row** (flex, justify-content: space-between, align-items: flex-start, padding-top: 48px, padding-bottom: 32px, max-width: 1120px, 32px horizontal padding):
- **Left:** Back link `"← trip details"` (12px, `--accent`, no underline, underline on hover). Navigates to `/trips/:id`. `aria-label="Back to trip details"`.
- **Right:** Page title `"edit land travel"` (24px, font-weight: 400, `--text-primary`, IBM Plex Mono). No uppercase. No letter-spacing.

---

#### 12B.2 Page Structure (top to bottom)

1. Navbar (56px, sticky — unchanged)
2. Page header row (back link + title)
3. **Entries section** — existing entries rendered as editable row-cards (fetched on mount)
4. **Empty state placeholder** — shown when no entries exist yet, in place of entries section
5. **"+ add entry" button row** — always visible below entries (or below empty state)
6. **Action row** — "cancel" + "save" buttons
7. **Bottom "done editing" convenience button** — repeated at page bottom

---

#### 12B.3 Entries: Multi-Row Card Form

On page mount, fetch `GET /trips/:id/land-travel`. Each entry renders as an independent **editable card**. This follows the ActivitiesEditPage pattern — each row is a self-contained card with all fields labeled inline (not a table/header-row layout).

**Row Card Container:**
- Background: `var(--surface)` (`#30292F`)
- Border: `1px solid var(--border-subtle)`
- Border-radius: 4px
- Padding: 20px
- Margin-bottom: 12px
- Display: flex, flex-direction: column, gap: 16px
- `role="group"`, `aria-label="Land travel entry [n]"` (1-based index)

**Row Card Internal Layout:**
Within each row card, fields are arranged in a 2-column CSS grid on desktop:
- `display: grid`
- `grid-template-columns: 1fr 1fr`
- `gap: 12px 24px`
- On mobile (<768px): single column (`grid-template-columns: 1fr`)

**Field Grid Layout (per row card):**

| Grid Row | Column 1 | Column 2 |
|----------|----------|----------|
| 1 | MODE (select, required) | PROVIDER (text, optional) |
| 2 | FROM (text, required) | TO (text, required) |
| 3 | DEPARTURE DATE (date, required) | DEPARTURE TIME (time, optional) |
| 4 | ARRIVAL DATE (date, optional) | ARRIVAL TIME (time, optional) |
| 5 | CONFIRMATION # (text, optional) | *(Delete button area — see below)* |
| 6 | NOTES (textarea, optional) — **spans full 2 columns** | |

**Field Specifications:**

| Field | Label | Input Type | Required | Placeholder | Notes |
|-------|-------|-----------|----------|-------------|-------|
| `mode` | `MODE` | `<select>` | Yes | — | See options below |
| `provider` | `PROVIDER` | `text` | No | `e.g. Hertz, Amtrak, Uber` | Max 100 chars |
| `from_location` | `FROM` | `text` | Yes | `e.g. San Francisco (SFO)` | Max 100 chars |
| `to_location` | `TO` | `text` | Yes | `e.g. Los Angeles (LAX)` | Max 100 chars |
| `departure_date` | `DEPARTURE DATE` | `date` | Yes | — | `YYYY-MM-DD` internally |
| `departure_time` | `DEPARTURE TIME` | `time` | No | — | `HH:MM` internally |
| `arrival_date` | `ARRIVAL DATE` | `date` | No | — | Must be ≥ departure_date if set |
| `arrival_time` | `ARRIVAL TIME` | `time` | No | — | arrival_date must also be set if arrival_time is set |
| `confirmation_number` | `CONFIRMATION #` | `text` | No | `e.g. RES-12345` | Max 50 chars |
| `notes` | `NOTES` | `textarea` | No | `any additional notes...` | Max 500 chars, rows=2, resize: vertical |

All fields follow the **Form Pattern** from the Design System:
- Label: 11px, font-weight: 500, letter-spacing: 0.08em, uppercase, `--text-muted`, `margin-bottom: 6px`
- Input/select: full-width, background `#3F4045`, border `1px solid rgba(93,115,126,0.3)`, focus border `#5D737E`, text `#FCFCFC`, padding: 10px 14px, border-radius: 2px, font: IBM Plex Mono 14px
- Time/date inputs: same styling; on Chrome, the spinner/calendar icons should use `color-scheme: dark` to inherit the light text color

**MODE Select Options (in order):**
1. `"Select mode"` — value `""`, disabled, selected by default for new rows. Not shown for existing entries (they have a pre-selected mode).
2. `"Rental Car"` — value `RENTAL_CAR`
3. `"Bus"` — value `BUS`
4. `"Train"` — value `TRAIN`
5. `"Rideshare"` — value `RIDESHARE`
6. `"Ferry"` — value `FERRY`
7. `"Other"` — value `OTHER`

**Delete Button (per row card):**
- Position: Row 5, Column 2 area — bottom-right of the card, vertically aligned with the CONFIRMATION # field
- Alternatively: top-right corner of the card (absolute positioned within the card, top: 12px, right: 12px) — Frontend Engineer's choice based on what works better with the grid layout
- Icon: `×` (16px × 16px) or a small trash SVG icon
- Color: `--text-muted`, hover: `rgba(220,80,80,0.8)`
- Transition: `color 150ms ease`
- `aria-label="Remove land travel entry [n]"` (1-based index)
- **For new (unsaved) rows:** On click → immediately remove the card from form state. No confirmation required (no API call yet).
- **For existing entries (loaded from API):** On click → replace card content with inline delete confirmation (see 12B.6 below).

---

#### 12B.4 Empty State (No Entries)

When no land travel entries exist for the trip (fresh trip or all entries deleted before save):

**Empty Placeholder** (shown above the "+ add entry" button):
- `border: 1px dashed rgba(93,115,126,0.3)`, padding: 40px 24px, border-radius: 4px, text-align: center, margin-bottom: 16px
- Primary text: `"no land travel entries yet."` — 13px, `--text-muted`
- Secondary text: `"click + to add your first entry."` — 11px, `rgba(252,252,252,0.3)`, margin-top: 4px

---

#### 12B.5 "+ Add Entry" Button Row

Positioned below the entries (or below the empty state placeholder):

- Button: `<button>` styled as a link
- Text: `"+ add entry"`
- Font-size: 12px, color: `--accent`, background: transparent, border: none, cursor: pointer, padding: 8px 0
- No underline default, underline on hover
- `aria-label="Add a new land travel entry"`
- Transition: `color 150ms ease`

**On click:**
1. Append a new blank row card below all existing entries
2. The new row has no `id` (it is "new" — not yet saved to the API)
3. Scroll the new row into view (smooth scroll)
4. Focus the MODE `<select>` of the newly added row

---

#### 12B.6 Inline Delete Confirmation (Existing Entries Only)

When the delete button is clicked on a row card that corresponds to an existing entry (has an API `id`):

Replace the card's content with a confirmation row (maintain card background/border/padding):
- Layout: flex, align-items: center, gap: 12px, justify-content: space-between
- Text: `"delete this land travel entry?"` — 13px, `--text-primary`, flex: 1
- Buttons (flex-shrink: 0, flex, gap: 8px):
  - `"yes, delete"` — danger button style (padding: 6px 14px, font-size: 11px)
  - `"cancel"` — secondary button style (padding: 6px 14px, font-size: 11px)

**`"yes, delete"` behavior:**
- Call `DELETE /trips/:id/land-travel/:entryId`
- While waiting: show inline spinner (16px) in place of the "yes, delete" text, disable both buttons
- **On success:** Remove card from DOM with fade-out animation (`opacity 0 → 0`, `height 0`, `margin 0` over 300ms), then remove from React state.
- **On API failure:** Restore original card content (undo confirmation state) + show bottom-right toast: `"could not delete entry. please try again."` (auto-dismiss 4s)

**`"cancel"` behavior:**
- Immediately restore the original card content (all field values intact)

---

#### 12B.7 Save / Cancel Action Row

**Action Row container** (flex, justify-content: flex-end, gap: 12px, margin-top: 32px, padding-top: 20px, border-top: `1px solid var(--border-subtle)`):

**`"cancel"` button** (secondary button style):
- On click: navigate to `/trips/:id` immediately, without any API calls
- No confirmation required (consistent with other edit pages)

**`"save"` button** (primary button style):
- On click: trigger batch save (see 12B.8 below)
- While saving: replace button label with inline spinner (16px, white, 1s rotation), button disabled
- `aria-disabled="true"` during save (in addition to HTML `disabled`)

---

#### 12B.8 Batch Save Logic

Triggered when the user clicks "save":

**Step 1: Client-side validation (see 12B.9).**
- If any errors → do NOT call API. Highlight invalid fields. Scroll to the first invalid row.

**Step 2: Diff form state against loaded state.**
- New rows (no `id`): must POST
- Modified existing rows (any field changed): must PATCH
- Deleted existing rows (confirmed via inline delete): already deleted via individual DELETE calls — do not need to be included in batch save. The batch save only handles new + modified.

**Step 3: Issue API calls.**
- `POST /api/v1/trips/:tripId/land-travel` for each new row (with all non-empty fields)
- `PATCH /api/v1/trips/:tripId/land-travel/:entryId` for each modified row (with changed fields)
- Use `Promise.allSettled()` to run all calls in parallel — tolerates partial failure

**Step 4: Handle results.**
- **All success:** navigate to `/trips/:id`
- **Partial failure:** stay on edit page. Show error banner (see 12B.11). Rows that failed to save remain in the form with their data intact. Rows that succeeded remain in the form (now with server-assigned `id` for POSTs). User can correct and retry.
- **Total failure (all calls failed):** same as partial failure.

---

#### 12B.9 Client-Side Validation

Validation triggers on "save" attempt. Applied per row card:

| Field | Rule | Error Message |
|-------|------|---------------|
| `mode` | Required (not empty string) | `"mode is required"` |
| `from_location` | Required, non-empty after trim | `"from location is required"` |
| `to_location` | Required, non-empty after trim | `"to location is required"` |
| `departure_date` | Required, valid date | `"departure date is required"` |
| `arrival_date` | If provided, must be ≥ `departure_date` | `"arrival date must be on or after departure date"` |
| `arrival_time` | If provided, `arrival_date` must also be set | `"set an arrival date when using arrival time"` |

**Error rendering (per field):**
- Inline error text below the field: 12px, `rgba(220,80,80,0.9)`, appears immediately on failed save
- Border of the offending input: changes to `1px solid rgba(220,80,80,0.7)`
- Error clears on the first user input in that field (change event)
- `role="alert"` on the error element

**Row card with validation errors:**
- Add `border-left: 3px solid rgba(220,80,80,0.5)` to the card's left border to draw attention to the entire invalid row

**Scroll behavior on validation failure:**
- After validation, `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the first invalid row card

---

#### 12B.10 Page Loading State

While fetching existing entries on mount (`GET /trips/:id/land-travel`):

- Show **2 skeleton card placeholders** (shimmer animation):
  - Each: background `var(--surface)`, border `1px solid var(--border-subtle)`, border-radius: 4px, height: 180px (tall, approximating a form card with multiple rows), width: 100%
  - Margin-bottom: 12px between skeletons
- `"save"` and `"cancel"` buttons: rendered but disabled (`opacity: 0.4`) during loading
- `"+ add entry"` button: hidden during loading

**If fetch fails (initial load error):**
- Show error container: `"could not load your land travel entries."` (13px, `--text-muted`) + `"try again"` link/button (accent color)
- On retry: re-fetch and render
- `"save"` and `"cancel"` still accessible (user can still save without pre-loaded data if needed, though practically empty on error)

---

#### 12B.11 Save Error Banner

When the batch save has one or more failures:

- Banner appears between the entries section and the action row
- Background: `rgba(220,80,80,0.08)`, border: `1px solid rgba(220,80,80,0.25)`, border-radius: 2px, padding: 12px 16px, margin-top: 16px
- Text: `"some entries could not be saved. please try again."` — 13px, `--text-primary`
- `role="alert"`, `aria-live="assertive"` — announced to screen readers immediately
- Banner dismisses automatically if the user edits any field (or on next save attempt)

---

#### 12B.12 Bottom Convenience Footer

Below the action row (margin-top: 40px, padding-top: 24px, border-top: `1px solid var(--border-subtle)`):
- Repeat the `"done editing"` primary button:
  - Same behavior: navigate to `/trips/:id` (this is the equivalent of "cancel" with a friendlier label — no API call)
  - This is purely for UX convenience on pages that may become long with many entries
- Secondary button style (not primary — to distinguish from "save" which is the real save action):
  - Text: `"← back to trip details"`
  - Background: transparent, border: `1px solid rgba(93,115,126,0.5)`, color: `--text-primary`, padding: 10px 24px, border-radius: 2px
  - Hover: `rgba(252,252,252,0.05)` background

---

#### 12B.13 Responsive Behavior — Land Travel Edit Page

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥768px) | 2-column CSS grid within each row card. Page header: back link left, title right. Action row: right-aligned. |
| Mobile (<768px) | Single-column form stack within each row card. All inputs full-width. Page header stacks: title on top, back link below (or both left-aligned, stacked). Action row: buttons full-width, stacked ("save" on top, "cancel" below). Horizontal page padding: 16px. |

**Time/date inputs on mobile:**
- `<input type="time">` and `<input type="date">` use native mobile pickers — acceptable for Sprint 6. Ensure they are full-width on mobile.
- Clock icon (`::webkit-calendar-picker-indicator`) color: Set via `color-scheme: dark` on the input or `filter: invert(1)` on the picker icon. This resolves the same issue as FB-077 (activity edit clock icon).

---

#### 12B.14 Accessibility — Land Travel Edit Page

- `<h1>` semantically for "edit land travel" (styled per spec, removes browser default h1 margin/size)
- Back link: `aria-label="Back to trip details"`
- Each row card: `role="group"`, `aria-label="Land travel entry [n]"` (1-based, e.g., "Land travel entry 1")
- All inputs: explicit `<label htmlFor="[inputId]">` with matching `id` on input
- Mode `<select>`: `<label>` explicitly associated via `htmlFor`
- Error messages: `role="alert"` on each field-level error element
- Save error banner: `role="alert"`, `aria-live="assertive"`
- Delete button per row: `aria-label="Remove land travel entry [n]"`
- `"+ add entry"` button: `aria-label="Add a new land travel entry"`
- Save button during submit: `aria-disabled="true"` + HTML `disabled` attribute
- Focus management:
  - When `"+ add entry"` clicked → focus moves to the MODE `<select>` of the new row
  - When a row is deleted → focus moves to the `"+ add entry"` button (or next row if available)
  - After failed validation → focus moves to the first invalid field
  - After successful save → navigation to `/trips/:id` (focus handled naturally by page load)
- Keyboard: All interactive elements reachable via Tab. No focus traps (this is not a modal). The batch save can be submitted by pressing Enter within a text field.

---

### Spec 12 Addendum — Calendar Enhancements

**Sprint:** #6
**Related Tasks:** T-082 (Design), T-089 (Frontend Implementation)
**Status:** Approved

**Addendum to:** Spec 7 (Calendar Component + Trip Date Range UI, Sprint #2)

**Description:**
This addendum describes two enhancements to the existing `TripCalendar.jsx` component delivered in Sprint 2 (T-035). No structural changes to the calendar grid, month navigation, or event-to-date mapping logic are required — only the chip rendering and overflow handling are updated.

Enhancement 1: **Event time display** — compact time indicator inside calendar event chips.
Enhancement 2: **"+X more" clickable overflow popover** — overflow label becomes an interactive button that opens a day-detail popover.

---

#### CAL-1: Event Time Display

---

##### CAL-1.1 Overview

Calendar event chips currently display only the event name/label. This enhancement adds a compact time indicator as a secondary element within the chip, giving users an at-a-glance schedule view without leaving the calendar.

**Design principle:** Time display is secondary to the event name — it must not make chips taller or more cluttered on full-event days. If a chip is too narrow (compact mode), the time element may be omitted.

---

##### CAL-1.2 Compact Time Format

**Helper function `formatCalendarTime(input)`** — add to `frontend/src/utils/formatDate.js`:

- Accepts `HH:MM` or `HH:MM:SS` time strings (from activities and land travel `_time` fields)
- Accepts a JS `Date` object or ISO string (for timezone-converted flights/stays)
- Returns a compact 12-hour string: hours + abbreviated meridiem + minutes only if non-zero
  - `"09:00"` → `"9a"`
  - `"14:30"` → `"2:30p"`
  - `"12:00"` → `"12p"`
  - `"00:00"` → `"12a"` (midnight)
  - `"10:00"` → `"10a"`
  - `"09:45"` → `"9:45a"`
- Returns `null` if input is `null`, `undefined`, or empty string

---

##### CAL-1.3 Time Sources Per Event Type

| Event Type | Time Source | Timezone Handling | Fallback |
|------------|-------------|-------------------|---------|
| **Flight** | `departure_at` (UTC ISO string) | Convert via `departure_tz` using `Intl.DateTimeFormat` | No time shown if `departure_at` is null |
| **Stay** | `check_in_at` (UTC ISO string) | Convert via `check_in_tz` using `Intl.DateTimeFormat` | No time shown if `check_in_at` is null |
| **Activity** | `start_time` (`HH:MM:SS` string) | No conversion needed (local date + time, no timezone) | No time shown if `start_time` is null |
| **Land Travel** | `departure_time` (`HH:MM` string) | No conversion needed | No time shown if `departure_time` is null |

For timezone-aware events (flights/stays), use the existing `Intl.DateTimeFormat` approach already present in `TripCalendar.jsx`. Extract hours and minutes from the local time, then pass to `formatCalendarTime`.

---

##### CAL-1.4 Updated Event Chip Structure

**Current chip structure (Sprint 2):**
```
[● EventName ]
```

**Updated chip structure (Sprint 6):**
```
[● EventName ]
[  9a        ]   ← new time element (when time available)
```

**Time element spec:**
```html
<span className={styles.eventTime}>9a</span>
```

- Font-size: 10px (one size smaller than event name at 11px)
- Color: inherit from chip (white text), at `opacity: 0.7`
- Display: `block` (below event name, same left alignment)
- Margin-top: 1px
- **Only rendered when `formatCalendarTime()` returns a non-null value**
- **Not rendered for stay multi-day span chips on day 2+** (show check-in time on first day chip only; subsequent span chips have no time)

**Chip container height:** Increase by ~4px to accommodate the time element. Ensure this does not break day cell layout on months with 6 rows (verify no overflow clipping).

---

##### CAL-1.5 Stay Multi-Day Spans

The existing calendar renders stay spans across multiple day cells. Sprint 6 behavior:
- **First day of stay span** (check-in date): Show check-in time (e.g., `"4p"`)
- **Subsequent days of same stay span**: Show no time element (chip height stays reduced)
- The stay span chip label remains as-is (accommodation name, e.g., `"Hyatt Regency SF"`)

---

#### CAL-2: "+X more" Clickable Day Overflow Popover

---

##### CAL-2.1 Current Behavior

When a day cell has more events than can be displayed (typically > 3), the calendar renders a `"+X more"` text element as a non-interactive `<span>`. Clicking it does nothing.

---

##### CAL-2.2 Updated Element: `<button>` Not `<span>`

The `"+X more"` element must be changed from a `<span>` to a `<button>`:

```html
<!-- Before (Sprint 2) -->
<span className={styles.moreLabel}>+2 more</span>

<!-- After (Sprint 6) -->
<button
  className={styles.moreButton}
  onClick={() => handleOpenPopover(dayKey, buttonRef)}
  aria-label={`Show all ${totalEventsOnDay} events for ${formattedDate}`}
  aria-expanded={openPopoverDay === dayKey}
  aria-haspopup="dialog"
  ref={buttonRef}
>
  +2 more
</button>
```

**Button visual design** (same appearance as current `"+X more"` span):
- Background: transparent
- Border: none
- Padding: 0
- Cursor: pointer
- Font: IBM Plex Mono, 11px, font-weight: 500, `--text-muted`
- Hover: color transitions to `--accent` (`#5D737E`)
- Transition: `color 150ms ease`
- `outline: none` default; on `:focus-visible`: `outline: 2px solid var(--accent)`, `outline-offset: 2px`

---

##### CAL-2.3 State Management

Add to `TripCalendar.jsx`:

```javascript
const [openPopoverDay, setOpenPopoverDay] = useState(null); // null | "YYYY-MM-DD"
const popoverRef = useRef(null);        // ref to the popover container
const triggerButtonRef = useRef(null);  // ref to the "+X more" button that was clicked
```

**Open popover:**
```javascript
function handleOpenPopover(dayKey, buttonElement) {
  triggerButtonRef.current = buttonElement;
  setOpenPopoverDay(dayKey);
  // After state update + render, focus the popover (via useEffect)
}
```

**Close popover:**
```javascript
function handleClosePopover() {
  setOpenPopoverDay(null);
  // Return focus to the trigger button
  if (triggerButtonRef.current) {
    triggerButtonRef.current.focus();
  }
}
```

**Keyboard Escape handler** (useEffect):
```javascript
useEffect(() => {
  if (!openPopoverDay) return;
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClosePopover();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [openPopoverDay]);
```

**Click outside handler** (useEffect):
```javascript
useEffect(() => {
  if (!openPopoverDay) return;
  const handleMouseDown = (e) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target)) {
      handleClosePopover();
    }
  };
  document.addEventListener('mousedown', handleMouseDown);
  return () => document.removeEventListener('mousedown', handleMouseDown);
}, [openPopoverDay]);
```

---

##### CAL-2.4 Popover Container

Rendered as a sibling to the day cells, or as a portal appended to `document.body`. Recommendation: render inline within the calendar grid as an absolutely-positioned element anchored to the day cell for simplicity. A React portal is also acceptable if the inline approach causes z-index issues.

**Popover container element:**
```html
<div
  role="dialog"
  aria-modal="true"
  aria-label={`Events for ${formattedDate}`}
  tabIndex={-1}
  ref={popoverRef}
  className={styles.dayPopover}
>
  ...
</div>
```

**Popover CSS (`.dayPopover`):**
- Position: `absolute`
- Z-index: 100 (above all calendar content, below navbar and modals)
- Width: 240px
- Background: `var(--surface)` (`#30292F`)
- Border: `1px solid var(--border-subtle)`
- Border-radius: 4px
- Box-shadow: `0 8px 24px rgba(0, 0, 0, 0.4)` (the only element in the design that uses a box shadow — justified for overlay behavior; the shadow communicates elevation)
- Padding: 16px
- Max-height: 320px
- Overflow-y: auto
- `scrollbar-width: thin` (Firefox), `scrollbar-color: var(--accent) transparent`

**Smart positioning:**
- Default: renders **below** the day cell (`top: 100%`, `left: 0`)
- If the day is in the **bottom 2 rows** of the calendar grid: render **above** (`bottom: 100%`, `top: auto`) to prevent viewport clipping
- If the day is in the **rightmost 2 columns** (typically Fri/Sat positions): align to right edge of cell (`left: auto`, `right: 0`)
- The Frontend Engineer may implement a simpler fixed positioning if the smart-positioning logic is complex — document the choice.

**Focus on open:** After `setOpenPopoverDay` causes the popover to render, a `useEffect` with `openPopoverDay` dependency focuses `popoverRef.current`:
```javascript
useEffect(() => {
  if (openPopoverDay && popoverRef.current) {
    popoverRef.current.focus();
  }
}, [openPopoverDay]);
```

---

##### CAL-2.5 Popover Content

**Popover Header:**
- Flex row, `justify-content: space-between`, `align-items: center`, margin-bottom: 8px
- **Date label:** `"Wednesday, August 7"` — 12px, font-weight: 600, `--text-primary`, letter-spacing: 0.04em. Use `Intl.DateTimeFormat` with `{ weekday: 'long', month: 'long', day: 'numeric' }` for formatting.
- **Close button:** `<button>` with `×` character or small X SVG. Font-size: 16px, `--text-muted`, hover: `--text-primary`. Background: transparent, border: none, cursor: pointer, padding: 2px 4px. `aria-label="Close events popover"`. Transition: `color 150ms ease`.

**Divider:** `<hr>` styled as `border: none; border-top: 1px solid var(--border-subtle); margin: 8px 0 12px;`

**Event List:**
Shows **all events for that day** — including those already visible in the calendar cell (the popover is a full list, not just the overflow). Sorted in the same order as the calendar's event priority (flights first, then stays, then activities, then land travel — within each type sorted by time).

Each event item:
- Layout: flex, align-items: flex-start, gap: 8px, padding: 6px 0
- Border-bottom: `1px solid rgba(93,115,126,0.08)` (last item: no border-bottom)

- **Color dot** (flex-shrink: 0):
  - Size: 8px × 8px circle (`border-radius: 50%`)
  - Background: event type color (`--color-flight`, `--color-stay`, `--color-activity`, or `--color-land-travel`)
  - Margin-top: 4px (align with first line of text block)
  - `aria-hidden="true"` (decorative)

- **Text block** (flex: 1, display: flex, flex-direction: column, gap: 2px):
  - **Event name** (13px, font-weight: 400, `--text-primary`, line-height: 1.4): Full event name without truncation in the popover.
    - Flight: `"[Airline] [FlightNumber]"` (e.g., `"Delta DL1234"`)
    - Stay: accommodation name (e.g., `"Hyatt Regency SF"`)
    - Activity: activity name (e.g., `"Fisherman's Wharf"`)
    - Land Travel: `"[mode label] to [to_location]"` (e.g., `"Train to Los Angeles"`)
  - **Time sub-label** (11px, `--text-muted`, margin-top: 2px): Format varies by type:
    | Event Type | Time Format in Popover |
    |------------|----------------------|
    | Flight | `"dep. 9a"` or `"dep. 9a → arr. 11a"` if arrival is same day |
    | Stay — check-in day | `"check-in 4p"` |
    | Stay — multi-day span (not check-in) | `"stay"` (no time) |
    | Stay — check-out day | `"check-out 11a"` |
    | Activity | `"9a – 2p"` (if both start and end time) or `"9a"` (start only) |
    | Land Travel | `"dep. 10a"` or no time if `departure_time` is null |
    | Any — no time available | Omit time sub-label entirely |

---

##### CAL-2.6 Responsive Behavior — Popover

| Breakpoint | Popover Behavior |
|------------|-----------------|
| Desktop (≥768px) | Inline absolute positioning as described above (anchored to day cell, smart repositioning for edge cases) |
| Mobile (<768px) | Full-width bottom sheet. Position: fixed, bottom: 0, left: 0, right: 0. Background: `var(--surface)`. Border-radius: 4px 4px 0 0. Max-height: 70vh. Overflow-y: auto. Semi-transparent backdrop overlay: `rgba(0,0,0,0.5)` fixed behind the sheet. Slide-up animation: `transform: translateY(0)` with `transition: transform 250ms ease`. Close on backdrop click. |

---

##### CAL-2.7 Accessibility Summary — Calendar Enhancements

| Requirement | Implementation |
|-------------|---------------|
| `"+X more"` keyboard accessible | Changed from `<span>` to `<button>` — Tab-reachable, Enter/Space activates |
| Screen reader announcement | `aria-label` on button with total count + date |
| Popover state | `aria-expanded` on button reflects open/closed state |
| Popover semantics | `role="dialog"`, `aria-modal="true"`, `aria-label` with formatted date |
| Close on Escape | `useEffect` keydown listener on document while popover open |
| Focus management | Focus moves to popover on open; returns to trigger button on close |
| Click outside closes | `mousedown` listener on document checks if click was outside popover |
| Color dots | `aria-hidden="true"` (decorative, text already conveys event type) |
| Time display | Compact format accessible as plain text in chip (no aria needed) |

---

*Sprint 6 specs above are marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-02-27.*

---

### Spec 13: Sprint 7 — Calendar Arrival/Checkout Time Display + Trip Notes Field

**Sprint:** #7
**Related Tasks:** T-096 (Design), T-101 (Frontend: Calendar), T-103 (Backend: Notes API), T-104 (Frontend: Notes UI)
**Status:** Approved
**Collapses:** T-102 (merged into T-096 per Manager pre-approval — scope was manageable in a single spec)

**Description:**
Spec 13 covers two Sprint 7 deliverables that were designed in parallel and are both unblocked:

1. **CAL-3 — Calendar Time Display Enhancements:** Extends the existing calendar chip rendering (Spec 12 Addendum, CAL-1) to also show the checkout time on the last day of a multi-day stay and the arrival time on the arrival day for flights and land travel. These are additive changes to the chip structure — the existing check-in and departure time logic is preserved.

2. **Trip Notes — New Feature:** Adds a freeform notes/description field to the trip resource. Notes are displayed on the `TripDetailsPage` with inline editing. A truncated preview appears on `TripCard` on the home page. The backend adds a `notes TEXT NULL` column to the `trips` table (migration 010) and exposes it through the existing trip CRUD API.

---

## Part A — CAL-3: Calendar Chip Time Display Enhancements

**Addendum to:** Spec 12 Addendum (CAL-1 and CAL-1.5)
**Implemented in:** `frontend/src/components/TripCalendar.jsx` + `frontend/src/utils/formatDate.js`

---

### CAL-3.1 Overview

The Sprint 6 calendar spec (CAL-1) established that event chips show a compact time indicator below the event name. CAL-1.3 defined the time source for each event type, and CAL-1.5 described stay multi-day span behavior (check-in time on first day only; no time on subsequent days).

**Sprint 7 adds three new display rules:**

| Rule | Trigger | Display |
|------|---------|---------|
| CAL-3.2 | Stay chip on `check_out_date` (when `check_out_date ≠ check_in_date`) | `"check-out [time]"` e.g., `"check-out 11a"` |
| CAL-3.3 | Flight chip on `arrival_date` (when `arrival_date ≠ departure_date`) | `"arrives [time]"` e.g., `"arrives 2:30p"` |
| CAL-3.4 | Land travel chip on `arrival_date` (when `arrival_date ≠ departure_date`) | `"arrives [time]"` e.g., `"arrives 3p"` |
| CAL-3.5 | Single-day stay (when `check_out_date === check_in_date`) | Both check-in and check-out shown on the same chip |

The `formatCalendarTime()` helper (defined in CAL-1.2) is used for all time formatting. **No new helper function is required.** The label prefix (`"check-out "`, `"arrives "`) is a string concatenated before the formatted time.

---

### CAL-3.2 Stay Checkout Time on Last Day

#### CAL-3.2.1 Trigger Condition

A stay that spans multiple days (`check_out_date ≠ check_in_date`) renders chips across all days from `check_in_date` to `check_out_date` inclusive. Previously:
- First day (`check_in_date`): shows check-in time (e.g., `"4p"`)
- Middle days: no time
- Last day (`check_out_date`): no time ← **this changes in Sprint 7**

**Sprint 7:** The chip on `check_out_date` now shows the checkout time with a `"check-out "` prefix label.

#### CAL-3.2.2 Time Source

| Field | Source | Timezone Handling |
|-------|--------|------------------|
| Checkout time | `check_out_at` (UTC ISO string) | Convert via `check_out_tz` using `Intl.DateTimeFormat` (same pattern as `check_in_at` / `check_in_tz`) |

If `check_out_at` is `null` or `undefined`, do not show a time element on the checkout day chip (same fallback as all other event types).

#### CAL-3.2.3 Chip Display — Checkout Day

The time element on the checkout day chip uses the existing `.eventTime` CSS class with one difference: the displayed string is prefixed with `"check-out "`:

```
[● Hyatt Regency SF ]
[  check-out 11a    ]   ← prefixed label + time
```

**Full time element HTML:**
```html
<span className={styles.eventTime}>check-out 11a</span>
```

- The string is constructed as: `"check-out " + formatCalendarTime(checkoutLocalTime)`
- Font-size: 10px (same as existing `.eventTime`)
- Color: inherit (white), `opacity: 0.7` (same as existing)
- Display: `block`, margin-top: 1px (same as existing)

#### CAL-3.2.4 Updated Stay Multi-Day Span Behavior

Complete updated behavior for stay chip time display across all days:

| Day Position | Display |
|-------------|---------|
| `check_in_date` (first day) | Check-in time: e.g., `"4p"` (no prefix, same as Sprint 6) |
| Middle days (between check-in and checkout) | No time element (same as Sprint 6) |
| `check_out_date` (last day) | Checkout time with prefix: e.g., `"check-out 11a"` (NEW in Sprint 7) |

**Note on middle days:** A stay spanning Monday → Thursday would have: Monday (`"4p"`), Tuesday (no time), Wednesday (no time), Thursday (`"check-out 11a"`). This is clean and minimal.

#### CAL-3.2.5 Single-Day Stay (check_in_date === check_out_date)

When a stay has the same check-in and checkout date (e.g., a day-use hotel reservation), both times appear on the single chip. There are no span chips — only one chip on that one day.

**Display:**
```
[● Hyatt Regency SF ]
[  4p → check-out 11a ]   ← both times inline, separated by " → "
```

**Implementation:** Construct the time string as:
```javascript
const checkInTime  = formatCalendarTime(checkInLocal);   // e.g., "4p"
const checkOutTime = formatCalendarTime(checkOutLocal);  // e.g., "11a"

// If both available:
timeDisplay = `${checkInTime} → check-out ${checkOutTime}`;  // "4p → check-out 11a"

// If only check-in available:
timeDisplay = checkInTime;  // "4p"

// If only check-out available:
timeDisplay = `check-out ${checkOutTime}`;  // "check-out 11a"

// If neither:
timeDisplay = null;  // no time element rendered
```

**Note on chip length:** The single-day combined time string may be longer than a typical time display. The chip's `max-width` should handle this gracefully via `overflow: hidden; text-overflow: ellipsis` on the `.eventTime` span if needed. The Frontend Engineer may opt to abbreviate to `"4p / 11a"` for single-day stays if the combined string causes layout issues — document the choice if so.

---

### CAL-3.3 Flight Arrival Time on Arrival Day

#### CAL-3.3.1 Trigger Condition

A flight has both a `departure_date` (derived from `departure_at` in the departure timezone) and an `arrival_date` (derived from `arrival_at` in the arrival timezone). When `arrival_date ≠ departure_date`, the flight spans two calendar days:
- Departure day: shows departure time (existing Sprint 6 behavior, no change)
- Arrival day: shows arrival time with `"arrives "` prefix (NEW in Sprint 7)

When `arrival_date === departure_date`, the flight is a same-day flight. The departure day chip already shows the departure time (Sprint 6). **No arrival time is added for same-day flights** — the chip is already sufficient.

#### CAL-3.3.2 Time Source

| Field | Source | Timezone Handling |
|-------|--------|------------------|
| Arrival time | `arrival_at` (UTC ISO string) | Convert via `arrival_tz` using `Intl.DateTimeFormat` — extract local hours/minutes, pass to `formatCalendarTime()` |

If `arrival_at` is `null` or `undefined`, do not show a time element on the arrival day chip.

#### CAL-3.3.3 Chip Display — Arrival Day

```
[● Delta DL1234 ]
[  arrives 2:30p ]   ← prefixed arrival time
```

**Full time element HTML:**
```html
<span className={styles.eventTime}>arrives 2:30p</span>
```

- Constructed as: `"arrives " + formatCalendarTime(arrivalLocalTime)`
- Same `.eventTime` styling as all other time elements

#### CAL-3.3.4 Multi-Day Flight Calendar Representation

For a flight departing on Aug 7 at 6:00 AM ET and arriving on Aug 8 at 11:00 AM PT:

| Day | Chip Contents |
|-----|--------------|
| Aug 7 | `[● Delta DL1234]` + time: `"6a"` |
| Aug 8 | `[● Delta DL1234]` + time: `"arrives 11a"` |

Both chips exist in the calendar. The arrival-day chip was already generated by the existing flight-date-range mapping logic (if the current implementation maps flights across both departure and arrival dates). If the existing logic only maps a flight to its departure date, the Frontend Engineer must extend it to also render a chip on the arrival date — document this change.

---

### CAL-3.4 Land Travel Arrival Time on Arrival Day

#### CAL-3.4.1 Trigger Condition

Land travel (from Spec 12) has `departure_date`, `departure_time` (HH:MM), and optionally `arrival_date`, `arrival_time` (HH:MM). When `arrival_date` is provided and `arrival_date ≠ departure_date`, the land travel spans two calendar days:
- Departure day: shows departure time (existing Sprint 6 behavior, no change)
- Arrival day: shows arrival time with `"arrives "` prefix (NEW in Sprint 7)

If `arrival_date` is `null` or `arrival_date === departure_date`, no arrival-day chip is needed.

#### CAL-3.4.2 Time Source

| Field | Source | Timezone Handling |
|-------|--------|------------------|
| Arrival time | `arrival_time` (HH:MM string) | No conversion needed — local time, same as `departure_time` (no timezone stored for land travel) |

If `arrival_time` is `null` but `arrival_date` is non-null (and different from departure_date), render the arrival-day chip without a time element (just the event name).

#### CAL-3.4.3 Chip Display — Arrival Day

```
[● Train to Los Angeles ]
[  arrives 3p           ]   ← prefixed arrival time
```

**Full time element HTML:**
```html
<span className={styles.eventTime}>arrives 3p</span>
```

- Constructed as: `"arrives " + formatCalendarTime(arrival_time)` where `arrival_time` is the raw `HH:MM` string passed to `formatCalendarTime()`

---

### CAL-3.5 Updated CAL-1.3 Time Sources Reference (Complete Table)

This replaces and extends the CAL-1.3 table from Spec 12 Addendum. The Frontend Engineer should treat this as the authoritative reference:

| Event Type | Day | Time Source | Prefix | Timezone | Fallback |
|------------|-----|-------------|--------|----------|---------|
| **Flight** | Departure day | `departure_at` (UTC ISO) | none | Convert via `departure_tz` | No time shown |
| **Flight** | Arrival day (if `arrival_date ≠ departure_date`) | `arrival_at` (UTC ISO) | `"arrives "` | Convert via `arrival_tz` | No time shown |
| **Stay** | Check-in day (first day) | `check_in_at` (UTC ISO) | none | Convert via `check_in_tz` | No time shown |
| **Stay** | Middle days | — | — | — | No time element |
| **Stay** | Checkout day (last day, if `check_out_date ≠ check_in_date`) | `check_out_at` (UTC ISO) | `"check-out "` | Convert via `check_out_tz` | No time shown |
| **Stay** | Single day (if `check_out_date === check_in_date`) | Both `check_in_at` + `check_out_at` | `" → check-out "` between | Convert each via its `_tz` field | Whichever is available |
| **Activity** | Activity day | `start_time` (HH:MM:SS string) | none | No conversion | No time shown if null |
| **Land Travel** | Departure day | `departure_time` (HH:MM string) | none | No conversion | No time shown if null |
| **Land Travel** | Arrival day (if `arrival_date ≠ departure_date`, and `arrival_date` non-null) | `arrival_time` (HH:MM string) | `"arrives "` | No conversion | No time shown if null (but chip still renders with event name) |

---

### CAL-3.6 Regression Safety Rules

The following existing behaviors from CAL-1 (Sprint 6) must be preserved exactly:

1. **Check-in time on first day** — unchanged. Still shows compact time (e.g., `"4p"`) without any prefix.
2. **Departure time on departure day** — unchanged for both flights and land travel.
3. **Middle-day stay chips** — still show no time element.
4. **Activity chips** — still show `start_time` when available.
5. **"+X more" popover event list** — the popover's time sub-label format (defined in CAL-2.5) already included `"check-out 11a"` and `"arrives"` labels. These were specified in Sprint 6. Verify the popover implementation already handles these — if not, update the popover event list rendering for checkout and arrival cases (this is already in the spec at CAL-2.5; it should already be there from Sprint 6).

---

### CAL-3.7 States and Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| `check_out_at` is null (stay has no checkout time stored) | Checkout day chip shows no time element — just the stay name. Section header style unchanged. |
| Flight arrival same as departure (same day) | No arrival-day chip added. Departure chip unchanged (only departure time shown, no `"arrives"` label). |
| Land travel with `arrival_date` null | No arrival-day chip rendered. Departure day chip shows departure time only. |
| Land travel with `arrival_date` same as `departure_date` | No arrival-day chip. Treat as same-day land travel — show departure time on departure day only. |
| Two events on the same arrival day (e.g., a flight arriving + hotel check-in) | Both chips render normally; each chip only gets time based on its own rules. |
| Calendar day has overflow ("+X more") and arrival chip is in overflow | Arrival chip appears in the popover list with `"arrives [time]"` sub-label — already handled by CAL-2.5 if implemented correctly. |
| Stay with no `check_out_date` | No checkout-day chip rendered. This is a backend validation issue; front-end renders what it receives. |

---

### CAL-3.8 Accessibility — Calendar Time Enhancements

No new ARIA requirements beyond what CAL-1.4 and CAL-2.7 already specify. The time label strings (`"check-out 11a"`, `"arrives 2:30p"`) are rendered as plain visible text within the chip, which screen readers will announce as part of the chip's text content. No additional `aria-label` overrides are needed for the chips — the text is self-descriptive.

---

## Part B — Trip Notes Feature

---

### 13.1 Overview

The trip notes feature adds a freeform description field to every trip. It is the first "rich trip metadata" field beyond the existing name and destinations. The design follows the established Japandi minimalist aesthetic: the notes field is unobtrusive in view mode and activates cleanly when the user engages with it.

**Scope:**
- `TripDetailsPage` — view mode + inline edit mode for the notes field
- `TripCard` (home page) — read-only truncated preview of notes

**API Integration:** Notes are stored in the `notes` field of the trip resource (added via migration 010 — `notes TEXT NULL`). All trip GET and PATCH endpoints include this field. Max 2000 characters, enforced server-side (400 `VALIDATION_ERROR` if exceeded) and client-side (textarea maxLength + char count).

---

### 13.2 Trip Notes — TripDetailsPage

#### 13.2.1 Placement

The notes section is positioned **below the trip title and destinations row** and **above the calendar component**. This places it in the "trip overview header area" — information the user set up when creating the trip, not the detailed itinerary sections below the calendar.

**TripDetailsPage vertical layout order (updated):**
1. Back link (`← home`)
2. Trip title + destinations row + edit/delete controls
3. **Notes section** ← NEW in Sprint 7
4. `TripCalendar` component
5. Flights section
6. Land Travel section
7. Stays section
8. Activities section

#### 13.2.2 Notes Section — View Mode (has notes)

```
NOTES ─────────────────────────────────────────  ✏

We fly into Narita on August 7th and spend 10 days
exploring Tokyo, Kyoto, and Osaka. Main goals are
food, temples, and at least one day trip to Nara.
```

**Container:**
- Margin-top: 24px from the trip title/destinations row
- Margin-bottom: 24px (space before the calendar)
- No background, no border, no card — the notes section is "bare" on the page background, consistent with the section headers throughout the page

**Section Header Row:**
- Flex row, `justify-content: space-between`, `align-items: center`
- **Left:** Section header label `"NOTES"` — standard section header styling: 11px, font-weight 600, letter-spacing 0.12em, uppercase, `--text-muted`. Followed by a `1px solid var(--border-subtle)` line that stretches to fill remaining space (flex + hr approach, same as Flights/Stays/Activities section headers).
- **Right:** Edit pencil button (see 13.2.5) — visible in view mode
- Margin-bottom: 12px

**Notes Text:**
- Font: IBM Plex Mono, 14px, font-weight 300 (light), `--text-primary`
- Line-height: 1.7 (generous for readability of prose text)
- White-space: `pre-wrap` (preserve line breaks the user entered)
- Word-break: `break-word` (prevent overflow on long unbroken strings)
- Max-width: inherits from content area (1120px max-content-width)
- No background, no border — the text sits directly on the page

#### 13.2.3 Notes Section — View Mode (empty / no notes)

```
NOTES ─────────────────────────────────────────  ✏

  add trip notes…
```

**Empty placeholder:**
- Text: `"add trip notes…"` (with Unicode ellipsis `…`)
- Font: IBM Plex Mono, 14px, font-weight 300
- Color: `--text-muted` (rgba 252,252,252,0.5)
- Cursor: `pointer` (the entire placeholder area is clickable to enter edit mode)
- On click: enters edit mode (same as clicking the pencil icon)
- Padding: 8px 0 (a bit of breathing room)

**Accessibility:** The empty placeholder should have `role="button"` and `tabIndex={0}` so it is keyboard-reachable, with `aria-label="Add trip notes"`. Press Enter or Space to enter edit mode.

#### 13.2.4 Notes Section — Edit Mode

```
NOTES ──────────────────────────────────────────

┌──────────────────────────────────────────────┐
│ We fly into Narita on August 7th and spend 10│
│ days exploring Tokyo, Kyoto, and Osaka. Main │
│ goals are food, temples, and at least one day│
│ trip to Nara.                                │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
                                      142 / 2000

[ cancel ]    [ save notes ]
```

**Transition into edit mode:**
- The notes text (or empty placeholder) smoothly swaps to a textarea with no jarring layout shift
- The pencil icon disappears from the section header in edit mode (no double-affordance)
- Textarea is auto-focused on entering edit mode — cursor is placed at the end of existing text

**Textarea element:**
```html
<textarea
  className={styles.notesTextarea}
  value={editValue}
  onChange={handleChange}
  maxLength={2000}
  rows={6}
  aria-label="Trip notes"
  aria-describedby="notes-char-count"
  autoFocus
/>
```

**Textarea CSS (`.notesTextarea`):**
- Width: 100%
- Min-height: 144px (`rows={6}` × ~24px line-height)
- Background: `var(--surface-alt)` (`#3F4045`)
- Border: `1px solid var(--border-accent)` (`#5D737E`) — active/focus state from the moment it appears
- Border-radius: `var(--radius-sm)` (2px)
- Padding: 12px 14px
- Font: IBM Plex Mono, 14px, font-weight 300, `--text-primary`
- Line-height: 1.7
- Color: `--text-primary`
- Resize: `vertical` (user can drag to resize; min-height applies)
- Outline: none (border serves as the focus indicator, already `--border-accent`)
- Box-sizing: border-box

**Character count (`#notes-char-count`):**
- Positioned: right-aligned below the textarea
- Text: `"[currentLength] / 2,000"` — e.g., `"142 / 2,000"` (use `toLocaleString()` for comma-separated number)
- Always visible in edit mode (not conditional on being near the limit)
- Font: IBM Plex Mono, 11px, font-weight 400, `--text-muted`
- Margin-top: 4px
- **Color transition near limit:**
  - Default (0–1799 chars): `--text-muted`
  - Warning zone (1800–1999 chars): `rgba(220, 160, 50, 0.8)` (muted amber — not alarming, just a nudge)
  - At limit (2000 chars): `rgba(220, 80, 80, 0.9)` (error red — same as field error color in design system)

**Action buttons row (below char count):**
- Layout: flex, gap 12px, justify-content: flex-start, margin-top: 12px
- **Cancel button:** Secondary button style (`transparent bg, #FCFCFC text, 1px solid rgba(93,115,126,0.5) border, padding 10px 24px, border-radius 2px, hover: rgba(252,252,252,0.05) bg`). Label: `"cancel"`. On click: discard `editValue`, revert to view mode, restore original notes text. No API call.
- **Save button:** Primary button style (`#5D737E bg, #FCFCFC text, font-weight 500, padding 10px 24px, border-radius 2px, hover: rgba(93,115,126,0.8)`). Label: `"save notes"`. On click: submit PATCH /trips/:id with `{ notes: editValue }`. Disabled state while the API call is in progress.

**Save behavior:**
1. User clicks `"save notes"`
2. Save button enters loading state: inline spinner (20px, accent color, 1s rotation), button text hidden or replaced with spinner, `disabled={true}`
3. `PATCH /trips/:id` is called with `{ notes: editValue.trim() }` (trim whitespace from start and end before sending)
4. On success (200): update the local notes state, exit edit mode, show updated notes text in view mode
5. On error (network error or 400/500): show a toast error bottom-right: `"Failed to save notes. Please try again."` auto-dismisses after 4 seconds. Remain in edit mode so the user's text is not lost.

**Cancel behavior:** Immediately returns to view mode without any API call. No confirmation dialog needed (changes are not yet submitted).

#### 13.2.5 Edit Pencil Button

The pencil/edit icon appears in the section header row, right-aligned, in view mode only.

```html
<button
  className={styles.notesEditButton}
  onClick={enterEditMode}
  aria-label="Edit trip notes"
>
  {/* SVG pencil icon */}
</button>
```

**Pencil icon:** SVG, 14×14px, stroke: `--text-muted`. On hover: stroke: `--text-primary`. Simple minimal pencil outline — consistent with the Japandi aesthetic (no filled icons).

**Button CSS (`.notesEditButton`):**
- Background: transparent
- Border: none
- Padding: 4px
- Cursor: pointer
- `border-radius: var(--radius-sm)` (2px)
- Transition: `opacity 150ms ease`
- On `:focus-visible`: `outline: 2px solid var(--accent)`, `outline-offset: 2px`

---

### 13.3 Notes Section — State Summary

| State | User Sees |
|-------|-----------|
| **Empty / no notes (view)** | `"NOTES"` header + pencil icon + `"add trip notes…"` placeholder in muted color. Placeholder is clickable to enter edit mode. |
| **Has notes (view)** | `"NOTES"` header + pencil icon + formatted notes text (white-space: pre-wrap). |
| **Edit mode (any)** | `"NOTES"` header (no pencil icon) + textarea pre-filled with existing notes (or empty) + char count + cancel/save buttons. |
| **Saving** | Save button shows inline spinner + `disabled`. Cancel button remains active (user can cancel a slow save before it completes — clicking cancel should abort the in-flight request and revert). |
| **Save error** | Stays in edit mode. Toast error appears bottom-right. User's text is preserved in the textarea. |
| **Trip loading (TripDetailsPage initial load)** | Notes section renders a skeleton: a rectangle shimmer block, ~80px tall, full-width, `background: var(--surface-alt)`, same shimmer animation as other skeleton elements. |

---

### 13.4 Notes Section — Responsive Behavior

| Breakpoint | Notes Behavior |
|------------|---------------|
| **Desktop (≥1024px)** | Full-width within content area (max 1120px centered). Notes text and textarea span the full content width. |
| **Tablet (768–1023px)** | Same as desktop — notes text wraps naturally. |
| **Mobile (<768px)** | Full-width, padding: 0 16px (matches mobile content padding). Textarea `rows={5}`. Action buttons stack vertically if needed — flex-wrap. |

---

### 13.5 Notes Section — Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Empty placeholder keyboard-reachable | `role="button"`, `tabIndex={0}`, `aria-label="Add trip notes"`. Enter/Space triggers edit mode. |
| Pencil button label | `aria-label="Edit trip notes"` on the `<button>` |
| Textarea label | `aria-label="Trip notes"` on `<textarea>` |
| Char count associated | `aria-describedby="notes-char-count"` on textarea; `id="notes-char-count"` on the count element |
| Warning announced | When char count enters warning zone (1800+), `aria-live="polite"` region announces the count (e.g., `"142 of 2000 characters used"`) — update the live region on every change. This can be a visually-hidden `<span aria-live="polite">` that is updated along with the visible count. |
| Save button state | `aria-disabled="true"` (plus `disabled` attribute) when submitting |
| Focus management | On enter edit mode: textarea receives focus. On cancel or save success: focus returns to the pencil icon button (or empty placeholder if notes were cleared). |
| Color-only warning | The amber/red char count color change is supplemented by the aria-live region — color alone does not convey the warning. |

---

### 13.6 TripCard Notes Preview

#### 13.6.1 Placement

The notes preview appears at the **bottom of the TripCard**, below the existing card content (destination chips, date range, status badge). It is only shown if `notes` is a non-null, non-empty string.

**Current TripCard structure (no notes):**
```
┌─────────────────────────────────────────┐
│ Japan Adventure 2026                    │
│ Tokyo · Kyoto · Osaka                   │
│ Aug 7, 2026 — Aug 21, 2026              │
│ [PLANNING]                              │
└─────────────────────────────────────────┘
```

**TripCard structure (with notes):**
```
┌─────────────────────────────────────────┐
│ Japan Adventure 2026                    │
│ Tokyo · Kyoto · Osaka                   │
│ Aug 7, 2026 — Aug 21, 2026              │
│ [PLANNING]                              │
│                                         │
│  We fly into Narita on August 7th and   │
│  spend 10 days exploring Tokyo, Kyot…   │
└─────────────────────────────────────────┘
```

#### 13.6.2 Notes Preview Element

```html
<p className={styles.notesPreview}>
  {truncatedNotes}
</p>
```

**Truncation logic (in component, not CSS):**
```javascript
const MAX_PREVIEW_LENGTH = 100;

const truncatedNotes = notes && notes.length > MAX_PREVIEW_LENGTH
  ? notes.slice(0, MAX_PREVIEW_LENGTH) + '\u2026'  // Unicode ellipsis character
  : notes;
```

- Do not use CSS `text-overflow: ellipsis` for truncation — use JS string truncation so the character limit is precisely 100 chars of content + `"…"`
- The 100 characters are sliced from the raw notes string (including any line breaks that might appear in the first 100 chars — these render as spaces in the card's single-line context)

**CSS (`.notesPreview`):**
- Font: IBM Plex Mono, 12px, font-weight 300
- Color: `--text-muted` (rgba 252,252,252,0.5) — secondary information, clearly subordinate to trip name
- Margin-top: 8px
- Line-height: 1.5
- Overflow: hidden
- Display: `-webkit-box` with `-webkit-line-clamp: 2` and `-webkit-box-orient: vertical` — limits to 2 visible lines even if truncation doesn't kick in (safety net for long first lines)
- Word-break: `break-word`

**Conditional rendering:**
```jsx
{notes && notes.trim().length > 0 && (
  <p className={styles.notesPreview}>{truncatedNotes}</p>
)}
```

Do not render the element at all (not even an empty `<p>`) when notes is null or empty.

#### 13.6.3 TripCard Notes Preview — Accessibility

- The notes text is read by screen readers as part of the card's content flow (no special ARIA needed — it's plain descriptive text)
- The card itself already has appropriate link semantics and aria-label from earlier specs
- No additional ARIA is required for the notes preview

---

### 13.7 API Integration Reference (for Frontend Engineers)

**GET /trips (list):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Japan Adventure 2026",
      "destinations": ["Tokyo", "Kyoto"],
      "notes": "We fly into Narita on August 7th...",
      ...
    }
  ]
}
```

**GET /trips/:id:**
```json
{
  "id": "uuid",
  "name": "Japan Adventure 2026",
  "notes": "We fly into Narita on August 7th...",
  ...
}
```

**PATCH /trips/:id — save notes:**
```json
// Request body
{ "notes": "Updated trip notes content." }

// Response: 200 with updated trip object (includes notes field)

// To clear notes:
{ "notes": null }

// Validation error (notes > 2000 chars):
// 400 VALIDATION_ERROR
```

**Notes field in API responses:**
- `null` when no notes have been set
- Empty string `""` should be treated same as `null` in display (show the empty placeholder)
- Non-empty string: display as-is

---

### 13.8 Full Screen Flow — Trip Notes (User Journey)

**First time adding notes:**
1. User opens TripDetailsPage — notes section shows `"add trip notes…"` placeholder with pencil icon
2. User clicks placeholder or pencil icon → edit mode activates, textarea focused (empty)
3. User types notes — char count shows `"47 / 2,000"`
4. User clicks `"save notes"` → spinner, API call
5. On success: edit mode exits, notes text displays in view mode

**Editing existing notes:**
1. User is on TripDetailsPage — notes section shows existing notes text + pencil icon
2. User clicks pencil icon → edit mode activates, textarea pre-filled with existing notes
3. User modifies text
4. User clicks `"save notes"` → API call
5. On success: updated text displays

**Cancelling an edit:**
1. User enters edit mode
2. User types some changes
3. User clicks `"cancel"` → edit mode exits, original notes text restored (no API call)

**Viewing notes on home page (TripCard):**
1. User navigates to home page
2. Trip cards with notes show the first 100 chars with `"…"` below the status badge
3. Trip cards without notes show no notes element

---

### 13.9 Design Rationale Notes

- **Inline edit over separate edit page:** The notes field is a short-form text field that benefits from in-context editing. A separate `/trips/:id/edit` page would feel heavyweight for a textarea. Inline edit is consistent with the quick-edit patterns users expect for note-taking.
- **Position above calendar:** Notes are trip-level metadata (like a journal entry or planning memo), not itinerary data. Placing them above the calendar keeps the calendar as the primary itinerary overview — users look at the calendar for schedule, and at the notes for context/intent.
- **Minimal card preview:** 100 chars on the TripCard is enough to recognize the note without overwhelming the card grid layout. The muted text color ensures it doesn't compete with the trip name.
- **Always-visible char count in edit mode:** Showing `"X / 2,000"` at all times (not just near the limit) gives users a sense of how much they've written. The color transition to amber/red near the limit prevents surprises without alarming users unnecessarily.

---

*Sprint 7 Spec 13 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-02-27.*

---

### Spec 14: Sprint 8 Addendum — Timezone Abbreviation Display + Activity Location URL Detection

**Status:** Approved
**Task:** T-112
**Sprint:** 8
**Published:** 2026-02-27
**Implemented by:** T-113 (timezone abbreviations), T-114 (URL link detection)

---

#### 14.0 Overview

This spec covers two small but user-visible enhancements to the TripDetailsPage:

1. **Part A — Timezone Abbreviation Display (T-113):** Flight and stay detail cards currently display formatted times (e.g., "Aug 7, 2026 · 6:00 AM") without indicating which timezone the time is in. This spec defines how to extract and display a short, DST-aware timezone abbreviation (e.g., "EDT", "JST", "CEST") adjacent to each time value on flight and stay detail cards.

2. **Part B — Activity Location URL Detection (T-114):** Activity location strings are currently rendered as plain text. This spec defines how to detect `http://` and `https://` URLs within a location string and render them as accessible, secure hyperlink elements, while leaving all other text as plain text and explicitly blocking dangerous URI schemes.

---

#### Part A — Timezone Abbreviation Display on Detail Cards

---

#### 14.A.1 Problem Statement

**Current behavior:**
- `FlightCard`: Renders a timezone abbreviation as an inline string concatenated to the full datetime string (e.g., `"Aug 7, 2026 · 6:00 AM EDT"`). The abbreviation is not wrapped in a distinct HTML element.
- `StayCard`: Renders check-in and check-out times with NO timezone abbreviation whatsoever.
- `LandTravelCard`: Has no timezone data — stores times as wall-clock strings (`HH:MM:SS`) without an IANA timezone field. See §14.A.7 for the scope boundary.

**Desired behavior:**
- `FlightCard` and `StayCard` each display a muted, visually distinct timezone abbreviation (`<span className="tz-abbr">`) adjacent to each time value.
- The abbreviation is DST-aware: "America/New_York" in August yields "EDT"; in January it yields "EST". "Asia/Tokyo" always yields "JST". "Europe/Paris" in July yields "CEST".
- If the timezone abbreviation cannot be determined (missing/invalid timezone string), the display degrades gracefully — either showing the IANA string or nothing — without crashing.

---

#### 14.A.2 Data Model Reference

| Card | UTC Timestamp Field | Timezone Field (IANA) |
|------|--------------------|-----------------------|
| FlightCard — departure | `departure_at` (ISO 8601 UTC) | `departure_tz` |
| FlightCard — arrival | `arrival_at` (ISO 8601 UTC) | `arrival_tz` |
| StayCard — check-in | `check_in_at` (ISO 8601 UTC) | `check_in_tz` |
| StayCard — check-out | `check_out_at` (ISO 8601 UTC) | `check_out_tz` |
| LandTravelCard | `departure_date` (DATE string) + `departure_time` (TIME string) | **None — see §14.A.7** |

No backend changes are required. All `*_tz` fields already exist in the API responses.

---

#### 14.A.3 Utility Function — `formatTimezoneAbbr`

The function `formatTimezoneAbbr(isoString, ianaTimezone)` already exists in `frontend/src/utils/formatDate.js`. **No changes are needed to this function.** Its current implementation:

```js
export function formatTimezoneAbbr(isoString, ianaTimezone) {
  if (!isoString || !ianaTimezone) return '';
  try {
    const date = new Date(isoString);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: ianaTimezone,
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : ianaTimezone;
  } catch {
    return ianaTimezone;
  }
}
```

**How it works:**
- Uses `Intl.DateTimeFormat` with `{ timeZoneName: 'short' }` applied to the **actual event datetime** (not a static reference date), ensuring DST awareness.
- `America/New_York` at a summer datetime → `"EDT"` (UTC-4)
- `America/New_York` at a winter datetime → `"EST"` (UTC-5)
- `Asia/Tokyo` → always `"JST"` (no DST)
- `Europe/Paris` in summer → `"CEST"`; in winter → `"CET"`
- `UTC` → `"UTC"`
- Invalid or unrecognized timezone → returns the IANA string as-is (graceful fallback, no crash)
- Missing `isoString` or `ianaTimezone` → returns `''` (empty string, nothing rendered)

T-113 must import this function from `formatDate.js`. No new utility is required.

---

#### 14.A.4 Visual Specification — Timezone Abbreviation Element

**Format:** `[Date · Time] [TZ_ABBR]`

**Example renders:**

```
Aug 7, 2026 · 6:00 AM EDT
Aug 7, 2026 · 6:00 AM JST
Jul 15, 2026 · 3:00 PM CEST
Jan 10, 2026 · 10:00 AM GMT
```

**Rendered HTML structure:**
```html
<div class="flightDateTime">
  Aug 7, 2026 · 6:00 AM <span class="tzAbbr">EDT</span>
</div>
```

**Spec rules:**
- The `<span className={styles.tzAbbr}>` element is placed immediately after the formatted datetime string, separated by a single space (via `margin-left: 4px` on the span).
- The abbreviation text is muted to visually subordinate it to the primary time value — it is supplementary information, not the main display.
- Do NOT wrap both the time AND the abbreviation in a shared `<span>`. Keep them as: `{timeString} <span>{tzAbbr}</span>`.
- If `tzAbbr` is empty string (missing data), render nothing — no empty `<span>`.

**CSS for `.tzAbbr`:**
```css
.tzAbbr {
  color: var(--text-muted);   /* rgba(252, 252, 252, 0.5) */
  font-size: inherit;          /* match the surrounding time text size */
  font-weight: 400;            /* regular weight — not bold */
  margin-left: 4px;            /* 4px gap from the formatted time string */
  display: inline;
}
```

**Accessibility:**
- The abbreviation is supplementary to the time — screen readers will read it as part of the text flow, which is correct.
- No additional ARIA attributes needed. The abbreviation text ("EDT", "JST") is human-readable and meaningful.
- If the timezone abbreviation is long (e.g., "GMT+5:30"), it reads naturally as part of the time value.

---

#### 14.A.5 FlightCard — Updated Implementation

**Current code (to be replaced):**
```jsx
// departure
<div className={styles.flightDateTime}>
  {depDisplay}{depTz ? ` ${depTz}` : ''}
</div>

// arrival
<div className={styles.flightDateTime}>
  {arrDisplay}{arrTz ? ` ${arrTz}` : ''}
</div>
```

**New code:**
```jsx
// departure
<div className={styles.flightDateTime}>
  {depDisplay}
  {depTz && <span className={styles.tzAbbr}>{depTz}</span>}
</div>

// arrival
<div className={styles.flightDateTime}>
  {arrDisplay}
  {arrTz && <span className={styles.tzAbbr}>{arrTz}</span>}
</div>
```

The variables `depTz` and `arrTz` are already computed via `formatTimezoneAbbr` at the top of the `FlightCard` component — no additional calls needed.

**aria-label on the `<article>`:** The existing `aria-label` does not need to be updated. Screen readers will read the timezone abbreviation from the visible text inside the article naturally.

---

#### 14.A.6 StayCard — Updated Implementation

**Current code:** `StayCard` does not call `formatTimezoneAbbr`. The check-in/out times show no timezone indicator.

**Changes needed:**

1. Verify that `formatTimezoneAbbr` is already imported at the top of `TripDetailsPage.jsx` (it should be, since `FlightCard` uses it). Confirm the import line includes it:
   ```js
   import { formatDateTime, formatTimezoneAbbr, formatActivityDate, formatTime, formatTripDateRange } from '../utils/formatDate';
   ```

2. Add two new variable computations inside `StayCard`:
```jsx
function StayCard({ stay }) {
  const checkInDisplay  = formatDateTime(stay.check_in_at,  stay.check_in_tz);
  const checkOutDisplay = formatDateTime(stay.check_out_at, stay.check_out_tz);
  // NEW — timezone abbreviations
  const checkInTz  = formatTimezoneAbbr(stay.check_in_at,  stay.check_in_tz);
  const checkOutTz = formatTimezoneAbbr(stay.check_out_at, stay.check_out_tz);
  // ... rest unchanged
}
```

3. Update the check-in and check-out date value renders:

**Current:**
```jsx
<div className={styles.stayDateValue}>{checkInDisplay}</div>
// ...
<div className={styles.stayDateValue}>{checkOutDisplay}</div>
```

**New:**
```jsx
<div className={styles.stayDateValue}>
  {checkInDisplay}
  {checkInTz && <span className={styles.tzAbbr}>{checkInTz}</span>}
</div>
// ...
<div className={styles.stayDateValue}>
  {checkOutDisplay}
  {checkOutTz && <span className={styles.tzAbbr}>{checkOutTz}</span>}
</div>
```

**Layout note:** The stay card's `stayDateValue` elements are block-level within a flex row. Adding an inline `<span>` after the datetime string does not change the block flow — both check-in and check-out remain in their respective `stayDateBlock` columns.

---

#### 14.A.7 LandTravelCard — Scope Boundary (No Change This Sprint)

**Architectural constraint:** The `land_travels` table stores `departure_time` and `arrival_time` as PostgreSQL `TIME` (wall-clock local time, no timezone). There are no `departure_tz` or `arrival_tz` columns in the `land_travels` table or the API contract. The `formatTimezoneAbbr` function requires an ISO UTC datetime AND an IANA timezone string — neither is available for land travel entries.

**Sprint 8 decision: LandTravelCard receives NO timezone abbreviation changes.** Displaying a timezone abbreviation derived from guesswork or a hardcoded value would be misleading to users. The existing departure and arrival displays remain as-is (date + wall-clock time, no timezone label).

**Note on Sprint 8 success criteria:** The active-sprint success criteria mentions "Create a land travel from London (Europe/London, January) → departure detail shows '10:00 AM GMT'". This cannot be implemented in Sprint 8 without a schema migration. The criteria is aspirational and reflects a future goal. The Sprint 8 implementation correctly limits timezone abbreviations to flights and stays.

**Future sprint recommendation:** If timezone support for land travel is desired, a schema migration must add `departure_tz VARCHAR(50)` and `arrival_tz VARCHAR(50)` columns to `land_travels`, the API contract must be updated, and the `LandTravelEditPage` must include timezone selection inputs.

---

#### 14.A.8 States

| State | Behavior |
|-------|----------|
| **Normal — DST zone, summer** | Abbreviation shows summer variant (e.g., "EDT" for America/New_York in August) |
| **Normal — DST zone, winter** | Abbreviation shows winter variant (e.g., "EST" for America/New_York in January) |
| **Normal — non-DST zone** | Single abbreviation always (e.g., "JST" for Asia/Tokyo) |
| **Unknown timezone string** | `formatTimezoneAbbr` returns IANA string as fallback; rendered in `<span className={styles.tzAbbr}>` |
| **Missing `*_tz` field (null/undefined)** | `formatTimezoneAbbr` returns `''`; conditional guard `{tzAbbr && <span>}` prevents empty span render |
| **Missing `*_at` field (null/undefined)** | `formatTimezoneAbbr` returns `''`; same guard applies |
| **`Intl.DateTimeFormat` throws** | `formatTimezoneAbbr` catches the error and returns the IANA string as fallback |

---

#### 14.A.9 Responsive Behavior

- **Desktop:** Timezone abbreviation inline with the time string, same line. Narrow containers may cause the time + abbreviation to wrap as a unit — this is acceptable.
- **Tablet / Mobile:** Same behavior. The `<span>` is inline content and wraps naturally with the time string if the container is narrow.
- The stay card's `stayDateBlock` columns may stack on mobile depending on the existing responsive layout. The timezone abbreviation follows the time string on the same line regardless of column stacking.

---

#### Part B — Activity Location URL Detection

---

#### 14.B.1 Problem Statement

**Current behavior:** `ActivityEntry` renders `activity.location` as a plain text string inside `<div className={styles.activityLocation}>`. If the user stores a Google Maps link or any other URL as the location, it renders as non-clickable text.

**Desired behavior:**
- Any `http://` or `https://` URL within a location string is rendered as a clickable `<a>` element that opens in a new tab.
- Surrounding text (before/after the URL) renders as plain text.
- Non-URL text locations are completely unchanged in appearance.
- Dangerous URI schemes (`javascript:`, `data:`, `vbscript:`, `file:`, etc.) are never linkified — they remain as plain text.
- No `dangerouslySetInnerHTML` under any circumstances.

---

#### 14.B.2 URL Detection Algorithm

**Regex:** `/(https?:\/\/[^\s]+)/g`

How it works:
- Matches strings starting with `http://` or `https://`
- Captures everything until the next whitespace character
- The `g` flag finds all matches in the string
- `javascript:`, `data:`, `vbscript:`, `file:`, and any other scheme do NOT match because they do not start with `http://` or `https://`

**Edge cases handled by the regex:**

| Input | Result |
|-------|--------|
| `"Golden Gate Park"` | No match → plain text |
| `"https://maps.google.com/place/XYZ"` | Match → link |
| `"http://example.com"` | Match → link |
| `"Meet at https://maps.google.com"` | Split → `["Meet at ", "https://maps.google.com"]` |
| `"https://a.com and https://b.com"` | Split → `["https://a.com", " and ", "https://b.com"]` |
| `"javascript:alert(1)"` | No match → plain text |
| `"data:text/html,<h1>hi</h1>"` | No match → plain text |
| `""` (empty) | Returns `[]` → nothing rendered |

**Note on trailing punctuation:** The regex `[^\s]+` will include trailing punctuation (e.g., a period at the end of a URL: `"https://example.com."`). This is acceptable and consistent with standard URL detection behavior. Most URLs in practice do not end with punctuation.

---

#### 14.B.3 `parseLocationWithLinks` Utility Function

Create the following utility. Preferred location: `frontend/src/utils/formatDate.js` (to avoid creating a new import file). Alternatively, `frontend/src/utils/textUtils.js` (new file) is also acceptable if the team prefers separation of concerns.

```js
/**
 * Parse a location string, detecting HTTP/HTTPS URLs and splitting the text
 * into typed segments: 'text' (plain) or 'link' (URL).
 *
 * Only http:// and https:// schemes create links. All other content,
 * including javascript:, data:, and vbscript: URIs, is returned as 'text'.
 *
 * @param {string|null|undefined} text - The location string to parse
 * @returns {Array<{type: 'text'|'link', content: string}>}
 */
export function parseLocationWithLinks(text) {
  if (!text) return [];
  const URL_REGEX = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(URL_REGEX);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      type: /^https?:\/\//.test(part) ? 'link' : 'text',
      content: part,
    }));
}
```

**Implementation notes:**
- `String.prototype.split` with a capturing-group regex returns captured groups interspersed in the result array. This is standard, well-supported JavaScript behavior.
- The secondary `.test(/^https?:\/\//)` check on each `part` is a safety guard that re-confirms only `http://` or `https://`-prefixed strings become links — it defends against any edge case in the split behavior.
- No `eval()`, no `new Function()`, no dynamic property access on user input.

---

#### 14.B.4 ActivityEntry — Updated Rendering

**File:** `frontend/src/pages/TripDetailsPage.jsx` → `ActivityEntry` component

**Current location render:**
```jsx
{activity.location && (
  <div className={styles.activityLocation}>
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="..." stroke="currentColor" strokeWidth="1" />
      <circle cx="5" cy="3.75" r=".833" fill="currentColor" />
    </svg>
    {activity.location}
  </div>
)}
```

**New location render:**
```jsx
{activity.location && (
  <div className={styles.activityLocation}>
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="..." stroke="currentColor" strokeWidth="1" />
      <circle cx="5" cy="3.75" r=".833" fill="currentColor" />
    </svg>
    {parseLocationWithLinks(activity.location).map((segment, index) =>
      segment.type === 'link' ? (
        <a
          key={index}
          href={segment.content}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.locationLink}
        >
          {segment.content}
        </a>
      ) : (
        <span key={index}>{segment.content}</span>
      )
    )}
  </div>
)}
```

**Why `key={index}` is acceptable here:** The segments array is deterministically derived from a static string value (`activity.location`). Segments do not reorder between renders. Using `index` as key is correct for this case.

**Do NOT use `dangerouslySetInnerHTML`.** The `href` attribute is set via JSX `href={segment.content}`, which React handles safely without HTML injection. Text content inside `<a>` and `<span>` tags is rendered via JSX children (plain strings), which React automatically escapes.

---

#### 14.B.5 Link Styling

Add the following to `frontend/src/pages/TripDetailsPage.module.css`:

```css
/* Activity location hyperlink — URL detected within location string */
.locationLink {
  color: var(--accent);              /* #5D737E — matches interactive element color */
  text-decoration: underline;
  text-underline-offset: 2px;
  word-break: break-all;             /* prevent long URLs from overflowing narrow containers */
  transition: color 150ms ease;
}

.locationLink:hover {
  color: var(--text-primary);        /* #FCFCFC — lighten on hover */
}

.locationLink:focus-visible {
  outline: 2px solid var(--border-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
```

**Design rationale:**
- `var(--accent)` (`#5D737E`) for link color matches the existing interactive element color in the design system — it signals clickability without a new color token.
- Underline is the universal browser convention for hyperlinks, ensuring clarity including for colorblind users.
- `word-break: break-all` prevents long URLs with query strings from overflowing the activity card or pushing layout horizontally.
- Hover lightens to `var(--text-primary)` for minimal, Japandi-appropriate feedback.
- `focus-visible` outline ensures keyboard users can clearly identify focused links (no outline on mouse click, outline on Tab navigation).

---

#### 14.B.6 Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| Only `http://` and `https://` create links | Regex `/(https?:\/\/[^\s]+)/g` + secondary `.test(/^https?:\/\//)` guard |
| `javascript:` → plain text | Regex does not match; result is `{ type: 'text', content: 'javascript:alert(1)' }` |
| `data:` URIs → plain text | Regex does not match; all `data:` URIs → `type: 'text'` |
| `vbscript:` → plain text | Regex does not match |
| No `dangerouslySetInnerHTML` | JSX renders via React children — React escapes all text automatically |
| `target="_blank"` requires `rel="noopener noreferrer"` | Required on every generated `<a>` element — prevents tab-napping and referrer leakage |
| No code execution on user input | Utility uses only `String.split`, `Array.filter`, `Array.map`, and `RegExp.test` |

---

#### 14.B.7 All States

| State | Input Example | Expected Render |
|-------|---------------|-----------------|
| **No location** | `null` or `undefined` | Location `<div>` not rendered (existing `activity.location &&` guard, unchanged) |
| **Plain text — no URL** | `"Golden Gate Park"` | `<span>Golden Gate Park</span>` inside the location div — no `<a>` element |
| **URL only** | `"https://maps.google.com/place/XYZ"` | `<a href="..." target="_blank" rel="noopener noreferrer">https://maps.google.com/place/XYZ</a>` |
| **Text before URL** | `"Meet at https://maps.google.com"` | `<span>Meet at </span>` + `<a>https://maps.google.com</a>` |
| **URL then text** | `"https://maps.google.com — see map"` | `<a>https://maps.google.com</a>` + `<span> — see map</span>` |
| **Text + URL + text** | `"Lunch at https://yelp.com/biz/xyz done at 2pm"` | `<span>Lunch at </span>` + `<a>https://yelp.com/biz/xyz</a>` + `<span> done at 2pm</span>` |
| **Multiple URLs** | `"https://a.com and https://b.com"` | `<a>https://a.com</a>` + `<span> and </span>` + `<a>https://b.com</a>` |
| **Dangerous scheme — javascript:** | `"javascript:alert(1)"` | `<span>javascript:alert(1)</span>` — plain text, NOT a link |
| **Dangerous scheme — data:** | `"data:text/html,<h1>hi</h1>"` | `<span>data:text/html,&lt;h1&gt;hi&lt;/h1&gt;</span>` — escaped plain text |
| **Empty string** | `""` | `parseLocationWithLinks` returns `[]`; location div still guarded by `activity.location &&` — not rendered |

---

#### 14.B.8 Accessibility Considerations

- All generated `<a>` elements have visible text (the URL string itself). Screen readers will read the full URL, which is descriptive enough for navigation context.
- `target="_blank"` opens a new tab. The `:focus-visible` ring makes keyboard-focused links discoverable.
- The location pin icon (`<svg aria-hidden="true">`) is unchanged — it remains decorative.
- No ARIA changes to the `ActivityEntry` `<article>` element. The `aria-label` on the article uses `activity.name` + time and does not include location text — this is acceptable as location is secondary metadata.

---

#### 14.B.9 Responsive Behavior

- **Desktop:** Activity location text wraps within the `activityDetails` panel. Long URLs are contained by `word-break: break-all`.
- **Mobile (< 640px):** Same. Activity card stacks time | divider | details vertically. URL wrapping is contained by the `word-break` rule.
- No breakpoint-specific link behavior needed.

---

#### 14.C Summary — What the Frontend Engineer Must Build (T-113 + T-114)

**T-113 — Timezone Abbreviation Display:**

| File | Change |
|------|--------|
| `frontend/src/utils/formatDate.js` | **No changes** — `formatTimezoneAbbr` already exists and is correct |
| `frontend/src/pages/TripDetailsPage.jsx` → `FlightCard` | Replace inline string concat with `{depTz && <span className={styles.tzAbbr}>{depTz}</span>}` (departure + arrival) |
| `frontend/src/pages/TripDetailsPage.jsx` → `StayCard` | Add `formatTimezoneAbbr` calls for check-in + check-out; add `<span className={styles.tzAbbr}>` renders |
| `frontend/src/pages/TripDetailsPage.module.css` | Add `.tzAbbr` CSS rule |
| `frontend/src/pages/TripDetailsPage.jsx` → `LandTravelCard` | **No changes** — land travel has no timezone fields (see §14.A.7) |

**T-114 — Activity Location URL Detection:**

| File | Change |
|------|--------|
| `frontend/src/utils/formatDate.js` OR `frontend/src/utils/textUtils.js` (new) | Add `parseLocationWithLinks(text)` utility function |
| `frontend/src/pages/TripDetailsPage.jsx` → `ActivityEntry` | Replace `{activity.location}` plain text with `parseLocationWithLinks(activity.location).map(...)` render |
| `frontend/src/pages/TripDetailsPage.module.css` | Add `.locationLink` CSS rule |

---

**Tests required for T-113 (minimum 6):**
1. `FlightCard`: departure time shows "EDT" abbreviation for `America/New_York` in summer (August datetime)
2. `FlightCard`: arrival time shows "JST" abbreviation for `Asia/Tokyo`
3. `StayCard`: check-in time shows correct timezone abbreviation adjacent to the check-in datetime
4. `StayCard`: check-out time shows correct timezone abbreviation adjacent to the check-out datetime
5. Unknown/invalid timezone string passed to `formatTimezoneAbbr` → returns IANA string as fallback, no crash, component renders
6. DST boundary: same zone (`America/New_York`), January datetime → "EST"; July datetime → "EDT" (different abbreviation)

**Tests required for T-114 (minimum 5):**
1. Plain text location (no URL) → no `<a>` element rendered in the document
2. Single URL location → `<a>` rendered with correct `href`, `target="_blank"`, `rel="noopener noreferrer"`, and `className="locationLink"`
3. Mixed text + URL location → text segment rendered as `<span>`, URL segment rendered as `<a>`
4. Multiple URLs in one string → each URL is a separate `<a>` element; intervening text is a `<span>`
5. `javascript:alert(1)` location string → renders entirely as plain text, NO `<a>` element rendered

---

*Sprint 8 Spec 14 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-02-27.*

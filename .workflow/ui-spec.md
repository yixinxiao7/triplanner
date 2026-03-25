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

The Calendar component replaces the `"calendar coming in sprint 2"` placeholder at the top of the Trip Details page. It renders a monthly view calendar grid populated with events from the trip's flights, stays, and activities.

**Data Fetching (implemented pattern — Sprint 28 spec update, T-230):**
`TripCalendar.jsx` is a self-contained component that issues its own `GET /api/v1/trips/:id/calendar` request on mount, independent of the `useTripDetails` hook. This dedicated endpoint returns event data pre-shaped for calendar rendering — each event carries `start_date`, `end_date`, `start_time`, and `end_time` fields — avoiding the client-side reshaping that would otherwise be required when working from raw `flights`/`stays`/`activities` arrays returned by `useTripDetails`.

The component receives only a `tripId` prop and manages its own `loading`, `error`, and `events` state. Every time `TripDetailsPage` mounts (or the tripId changes), `TripCalendar` fires one `GET /api/v1/trips/:id/calendar` call. This is the canonical fetch pattern; do **not** attempt to pass pre-fetched event data through props or refactor to consume `useTripDetails` data.

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

---

### Spec 15: Trip Export / Print View

**Sprint:** #10
**Related Task:** T-121
**Status:** Approved

**Description:**
Spec 15 adds a lightweight, browser-native print capability to the TripDetailsPage. Users can generate a clean, single-column, black-on-white paper-ready view of their entire trip itinerary by clicking a "Print" button. There is no PDF library, no server-side generation, and no new route — the feature uses `window.print()` combined with a `@media print` CSS stylesheet that overrides the dark theme and hides interactive elements unsuitable for print (navbar, edit/add/delete controls, the interactive calendar). IBM Plex Mono is retained as the document font in print.

**Target User:** Detail-oriented travelers who want a physical or PDF copy of their itinerary to carry while travelling (offline reference, customs forms, accommodation confirmations).

---

#### 15.1 Print Button — Screen Appearance

**Placement:** The Print button lives inside the `pageHeader` block on TripDetailsPage, in the same row as the trip name and destination chips. It is positioned at the far right of that header row using flexbox (`justify-content: space-between`).

**Layout structure of updated pageHeader row:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [← back to trips]                                                         │
│                                                                            │
│  Trip Name (h1)                                          [🖨 Print]        │
│  ● Tokyo  ● Paris  [edit destinations]                                     │
│  Aug 7 – Aug 20, 2026  [edit dates]                                        │
│  Notes text...  [pencil icon]                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

The trip name (`h1.tripName`) and the print button are in a flex row (`tripNameRow`) with `justify-content: space-between` and `align-items: flex-start`. The destinations, date range, and notes remain below, unchanged.

**Button spec:**

| Property | Value |
|----------|-------|
| Label | `Print` (text only, no emoji — use a small SVG printer icon to the left) |
| Icon | Printer SVG: 14×14px, `stroke="currentColor"`, `strokeWidth="1.5"`, `aria-hidden="true"`. Simple printer outline (rectangle body, paper output tray at top, feed sheet below). |
| Style | Secondary button (see Design System: transparent bg, `1px solid rgba(93,115,126,0.5)` border, `#FCFCFC` text) |
| Font size | 11px |
| Font weight | 500 |
| Letter spacing | 0.06em |
| Text transform | uppercase |
| Padding | 6px 14px |
| Border radius | `var(--radius-sm)` (2px) |
| Gap (icon + label) | 6px |
| Hover state | Background `rgba(252,252,252,0.05)`, border stays |
| Focus visible | `outline: 2px solid var(--border-accent); outline-offset: 2px` |
| Cursor | pointer |
| `aria-label` | `"Print trip itinerary"` |
| CSS class | `.printBtn` (added to `TripDetailsPage.module.css`) |

**Why secondary style:** The Print button is a utility action, not the primary CTA of the page. Secondary style signals availability without competing with section-level "add" actions.

---

#### 15.2 Print Button — CSS (`.printBtn` in `TripDetailsPage.module.css`)

```css
/* ── Print Button ── */
.tripNameRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: nowrap;
}

.printBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid rgba(93, 115, 126, 0.5);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;      /* prevent button from squishing under long trip name */
  white-space: nowrap;
}

.printBtn:hover {
  background: rgba(252, 252, 252, 0.05);
}

.printBtn:focus-visible {
  outline: 2px solid var(--border-accent);
  outline-offset: 2px;
}
```

---

#### 15.3 Print Button — JSX Structure

The `pageHeader` in `TripDetailsPage.jsx` currently renders the trip name `h1` directly inside `pageHeader`. Wrap the `h1` and the new print button in a `tripNameRow` div:

```jsx
<div className={styles.pageHeader}>
  <Link to="/" className={styles.backLink} aria-label="Back to my trips">
    ← back to trips
  </Link>

  {/* NEW: trip name + print button row */}
  <div className={styles.tripNameRow}>
    <h1 className={styles.tripName}>{trip?.name}</h1>

    <button
      className={styles.printBtn}
      onClick={() => window.print()}
      aria-label="Print trip itinerary"
    >
      {/* Printer SVG icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Paper feed (top sheet) */}
        <rect x="3" y="1" width="8" height="4" rx="0.5" />
        {/* Printer body */}
        <rect x="1" y="5" width="12" height="6" rx="1" />
        {/* Output tray / printed page */}
        <rect x="3" y="9" width="8" height="4" rx="0.5" />
      </svg>
      Print
    </button>
  </div>

  {/* destinations, date range, notes — unchanged below */}
  ...
</div>
```

**onClick handler:** `() => window.print()` — inline, no separate function needed. The browser opens the print dialog using the document's current rendered state, which `@media print` CSS transforms into a clean layout.

---

#### 15.4 Print Layout — What the User Sees in Print Preview

When the user clicks Print and the browser print dialog opens, the page renders as:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  TRIPLANNER                          (small, top-right) │
│                                                         │
│  Trip to Japan                                          │
│  (h1 — large, black)                                    │
│                                                         │
│  Tokyo · Osaka · Kyoto                                  │
│  (destinations, comma-separated or pill chips)          │
│                                                         │
│  Aug 7 – Aug 20, 2026                                   │
│  (date range, if set)                                   │
│                                                         │
│  notes: Book restaurant on day 3 in Osaka...            │
│  (notes, if present — full text, no truncation)         │
│                                                         │
│  ──────────────────────────────────────────────────     │
│  FLIGHTS                                                │
│  ──────────────────────────────────────────────────     │
│                                                         │
│  JFK → NRT                                              │
│  Delta  DL006                                           │
│  Aug 7, 2026 — 11:00 AM EDT → Aug 8, 2026 — 2:15 PM JST│
│                                                         │
│  ──────────────────────────────────────────────────     │
│  LAND TRAVEL                                            │
│  ──────────────────────────────────────────────────     │
│  [shinkansen entries ...]                               │
│                                                         │
│  ──────────────────────────────────────────────────     │
│  STAYS                                                  │
│  ──────────────────────────────────────────────────     │
│  [hotel entries ...]                                    │
│                                                         │
│  ──────────────────────────────────────────────────     │
│  ACTIVITIES                                             │
│  ──────────────────────────────────────────────────     │
│  [day-grouped activity entries ...]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key print layout rules:**
- Single column, full-width (no max-content-width constraint — paper is narrower than 1120px)
- Black (`#000`) text on white (`#fff`) background — all dark theme colors overridden
- IBM Plex Mono font retained throughout
- Section headers (FLIGHTS, LAND TRAVEL, STAYS, ACTIVITIES) preserved with their horizontal rule
- All trip data (flight cards, stay cards, land travel cards, activity entries) displayed in full
- No interactive UI: no navbar, no edit buttons, no add buttons, no delete buttons, no calendar, no back link, no edit-destinations link, no date edit controls, no notes pencil button, no save/cancel/clear buttons, no print button itself

---

#### 15.5 `@media print` CSS Rules — `frontend/src/styles/print.css`

Create a new file: `frontend/src/styles/print.css`

This file contains only `@media print` rules. It must be imported in `TripDetailsPage.jsx` (the only page where printing is relevant).

```css
/* ============================================================
   Print Stylesheet — TripDetailsPage
   Imported in TripDetailsPage.jsx
   Controls layout when user triggers window.print()
   ============================================================ */

@media print {

  /* ── 1. Global overrides: white paper, black ink, IBM Plex Mono ── */
  *,
  *::before,
  *::after {
    background: #fff !important;
    color: #000 !important;
    border-color: #ccc !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  body {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11pt;
    line-height: 1.5;
    background: #fff;
    color: #000;
  }

  /* ── 2. Hide interactive / non-print UI ── */

  /* Navbar (Navbar.module.css: .navbar) */
  [class*="navbar_navbar"],
  [class*="Navbar_navbar"] {
    display: none !important;
  }

  /* Back link */
  [class*="backLink"] {
    display: none !important;
  }

  /* Print button itself */
  [class*="printBtn"] {
    display: none !important;
  }

  /* Edit destinations link */
  [class*="editDestLink"] {
    display: none !important;
  }

  /* Destination edit container (inline edit mode) */
  [class*="destEditContainer"] {
    display: none !important;
  }

  /* Set dates / Edit dates links */
  [class*="setDatesLink"],
  [class*="editDatesLink"] {
    display: none !important;
  }

  /* Date range edit form (input + save/clear/cancel) */
  [class*="dateRangeEdit"] {
    display: none !important;
  }

  /* Clear and cancel date buttons */
  [class*="clearDatesBtn"],
  [class*="cancelDatesLink"] {
    display: none !important;
  }

  /* Notes pencil / edit button */
  [class*="notesPencilBtn"] {
    display: none !important;
  }

  /* Notes edit container (textarea + save/cancel) */
  [class*="notesEditContainer"] {
    display: none !important;
  }

  /* Section action buttons/links ("+ add flight", "+ add stay", etc.) */
  [class*="sectionActionBtn"],
  [class*="sectionActionLink"] {
    display: none !important;
  }

  /* Calendar wrapper (interactive, not useful for print) */
  [class*="calendarWrapper"] {
    display: none !important;
  }

  /* ── 3. Remove max-width constraint for print ── */
  [class*="container"] {
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  [class*="main"] {
    padding: 0 !important;
  }

  /* ── 4. Ensure all sections show (override any conditional display) ── */
  [class*="section"] {
    display: block !important;
    page-break-inside: avoid;
    margin-bottom: 24pt;
  }

  /* ── 5. Cards — single column, no card background ── */
  [class*="cardList"] {
    display: flex !important;
    flex-direction: column !important;
    gap: 16pt !important;
  }

  [class*="flightCard"],
  [class*="stayCard"],
  [class*="landTravelCard"] {
    border: 1px solid #ccc !important;
    border-radius: 0 !important;
    padding: 12pt !important;
    page-break-inside: avoid;
  }

  /* Flight columns — keep three-column layout (from / airline+number / to) */
  [class*="flightColumns"] {
    display: flex !important;
  }

  /* ── 6. Activities ── */
  [class*="dayGroup"] {
    page-break-inside: avoid;
    margin-bottom: 12pt;
  }

  [class*="activityEntry"] {
    page-break-inside: avoid;
    border-bottom: 1px solid #eee !important;
    padding-bottom: 8pt;
    margin-bottom: 8pt;
  }

  /* ── 7. Section headers — preserve uppercase label + line ── */
  [class*="sectionHeader"] {
    display: flex !important;
    align-items: center;
    margin-bottom: 12pt;
    border-bottom: 1px solid #000 !important;
    padding-bottom: 4pt;
  }

  [class*="sectionLine"] {
    display: none !important; /* The border-bottom on sectionHeader replaces it */
  }

  [class*="sectionTitle"] {
    font-size: 9pt !important;
    font-weight: 700 !important;
    letter-spacing: 0.12em !important;
    text-transform: uppercase !important;
    color: #000 !important;
  }

  /* ── 8. Status badges — visible in print ── */
  [class*="categoryBadge"],
  [class*="landTravelModeBadge"],
  [class*="allDayBadge"] {
    border: 1px solid #888 !important;
    padding: 1pt 6pt !important;
    border-radius: 2pt !important;
    font-size: 8pt !important;
  }

  /* ── 9. Page setup ── */
  @page {
    size: A4 portrait;
    margin: 20mm 15mm 20mm 15mm;
  }

  /* ── 10. Typography adjustments for print ── */
  [class*="tripName"] {
    font-size: 20pt !important;
    margin-bottom: 8pt !important;
  }

  [class*="destinations"],
  [class*="destinationsRow"] {
    font-size: 11pt !important;
    margin-bottom: 6pt !important;
  }

  [class*="destChipReadonly"] {
    background: none !important;
    border: 1px solid #999 !important;
    padding: 2pt 6pt !important;
    border-radius: 2pt !important;
    font-size: 9pt !important;
  }

  [class*="dateRangeText"] {
    font-size: 10pt !important;
    color: #444 !important;
  }

  [class*="notesText"] {
    font-size: 10pt !important;
    color: #333 !important;
  }

  /* Ensure notes section displays in full (not truncated) */
  [class*="notesSection"] {
    display: block !important;
  }

  [class*="notesDisplay"] {
    display: block !important;
  }

  /* Airport codes larger for readability */
  [class*="airportCode"] {
    font-size: 14pt !important;
    font-weight: 600 !important;
  }

  /* ── 11. Links — show as text, not blue underlined ── */
  a {
    color: #000 !important;
    text-decoration: none !important;
  }

  /* Exception: activity location URLs — show URL as text so reader can type it */
  [class*="locationLink"] {
    color: #000 !important;
    text-decoration: underline !important;  /* keep underline to signal it was a link */
  }

  /* ── 12. Timezone abbreviation badges ── */
  [class*="tzAbbr"] {
    color: #555 !important;
    font-size: 8pt !important;
  }

  /* ── 13. Skeleton loading states (should not appear in print) ── */
  .skeleton {
    display: none !important;
  }

  /* ── 14. Spinners (should not appear in print) ── */
  .spinner {
    display: none !important;
  }

}
```

**Implementation note on CSS Modules class name selectors:** Because TripDetailsPage uses CSS Modules, the actual compiled class names in the DOM are namespaced (e.g., `TripDetailsPage_navbar__abc12`). The `[class*="navbar_navbar"]` attribute selector matches any element whose class attribute contains that substring. This is the correct technique for targeting CSS Module classes from a global print stylesheet without needing to add `id` attributes or data attributes everywhere.

**Alternative (more maintainable) approach:** If the attribute selector approach proves fragile across build hashes, the Frontend Engineer may instead add `id` attributes to key wrapper elements in TripDetailsPage.jsx (e.g., `id="print-hide-navbar"`, `id="print-calendar"`) and target those in print.css. This trades JSX changes for CSS stability. The attribute selector approach is preferred for MVP since it requires zero JSX changes beyond the print button and `tripNameRow` wrapper.

---

#### 15.6 Import in TripDetailsPage.jsx

Add the following import at the top of `frontend/src/pages/TripDetailsPage.jsx`, alongside existing style imports:

```jsx
import '../styles/print.css';
```

This ensures the `@media print` rules are included in the Vite bundle and applied globally when `window.print()` is invoked on the TripDetailsPage.

---

#### 15.7 User Flow — Step by Step

1. **User lands on TripDetailsPage** — sees the normal dark-theme view with the Print button in the top-right of the page header.
2. **User clicks "Print"** — browser immediately opens the native OS print dialog (no loading state, no animation — `window.print()` is synchronous from the browser's perspective).
3. **Print preview renders** — browser applies `@media print` CSS, hiding the navbar, interactive controls, and calendar; overriding colors to black-on-white; resetting layout to single-column.
4. **User sees print preview** — all four trip sections (Flights, Land Travel, Stays, Activities) are visible in order; trip name, destinations, date range, and notes appear at the top.
5. **User selects printer or PDF** — clicks Print in the OS dialog. Browser sends the document to the printer (physical) or saves as PDF.
6. **Dialog closes** — page reverts to normal dark-theme screen rendering. No page reload or state change.

---

#### 15.8 All States

| State | Behavior |
|-------|----------|
| **Normal screen** | Print button visible in page header; dark theme; all sections, calendar, and controls visible |
| **Print preview** | Navbar hidden; calendar hidden; all edit/add/delete buttons hidden; back link hidden; notes pencil hidden; black-on-white single column; all trip data sections visible |
| **Empty trip (no flights, no stays, etc.)** | Empty state messages (e.g., "no flights added yet") are still visible in print — they tell the reader this section has no data. Empty state CTAs (the "add" links/buttons) are hidden via sectionActionBtn/sectionActionLink selectors. |
| **No date range set** | "trip dates not set" text renders in print (the setDatesLink control is hidden) |
| **No notes** | "no notes yet" placeholder text renders in print (the notesPencilBtn is hidden) |
| **Loading** | If user somehow triggers print while the page is still loading (skeleton state), skeleton shimmer elements are hidden in print. However, this should be edge-case-only — the Print button is only rendered after the trip data loads (controlled by the same `if (!trip) return` loading guard already in TripDetailsPage). |
| **Trip load error** | Print button is not rendered in the error state (the error state renders a different branch: `tripErrorState`). No print action available without data. |
| **Destinations in edit mode** | If the user has the destination edit form open when they click Print, the `destEditContainer` is hidden in print, and the `destinationsRow` (read-only chips) is shown — which is the intended print state. The edit form inputs would have been visible in the DOM but are suppressed by the `destEditContainer` `display: none !important` rule. |

---

#### 15.9 Responsive Behavior (Screen — Desktop → Mobile)

The Print button is a screen-side element. The `@media print` stylesheet handles print. On screen:

| Breakpoint | Print Button Behavior |
|------------|----------------------|
| **Desktop (≥ 768px)** | Visible in `tripNameRow`, far right of trip name. Button is full-size (11px label + icon). |
| **Mobile (< 640px)** | Button remains visible but `tripNameRow` wraps using `flex-wrap: wrap`. On very narrow viewports the button may appear below the trip name on its own row. `white-space: nowrap` and `flex-shrink: 0` keep the button label intact. |

Add the following responsive rule in `TripDetailsPage.module.css` inside the existing `@media (max-width: 640px)` block (or create it if absent):

```css
@media (max-width: 640px) {
  .tripNameRow {
    flex-wrap: wrap;
  }

  .printBtn {
    font-size: 10px;
    padding: 5px 12px;
  }
}
```

---

#### 15.10 Accessibility Considerations

| Concern | Implementation |
|---------|---------------|
| **Button label** | `aria-label="Print trip itinerary"` on the `<button>` element. Describes the action and the context (not just "print") |
| **Icon-only ambiguity** | The button has both the SVG icon and the text "Print" — it is never icon-only. The SVG has `aria-hidden="true"`. Screen readers read the visible text "Print" and the aria-label |
| **Keyboard access** | The `<button>` element is natively keyboard-focusable (Tab order). Enter and Space activate it. Focus ring via `focus-visible` |
| **Print dialog accessibility** | `window.print()` opens the OS print dialog which is fully accessible — it is a native OS component |
| **Color contrast (screen)** | Secondary button: `#FCFCFC` on transparent (over `#02111B` page background) — passes WCAG AA at any font size |
| **Color contrast (print)** | `#000` on `#fff` — maximum contrast |
| **No motion** | `window.print()` has no animation; `transition: all 150ms ease` on the button hover is below the prefers-reduced-motion threshold. Add `@media (prefers-reduced-motion: reduce) { .printBtn { transition: none; } }` for completeness |

---

#### 15.11 Tests Required (T-122)

Minimum 2 tests. Both in `frontend/src/__tests__/TripDetailsPage.test.jsx` or a new `TripDetailsPage.print.test.jsx`:

**Test 1 — Print button renders:**
```
Given: TripDetailsPage is rendered with a valid trip object (all sections may be empty)
When: Component mounts
Then: An element with aria-label="Print trip itinerary" is present in the document
```

**Test 2 — Print button calls window.print():**
```
Given: TripDetailsPage is rendered with a valid trip object
  AND: window.print is mocked (jest.fn())
When: User clicks the button with aria-label="Print trip itinerary"
Then: window.print() was called exactly once
  AND: No navigation occurred
  AND: No API calls were made
```

**Test 3 (recommended, not required):** Verify the button is NOT present in the trip error state (renders `tripErrorState` branch, no print button).

**Existing tests:** All 366+ existing tests must continue to pass (no regressions from the `tripNameRow` wrapper div addition or the `print.css` import).

---

#### 15.12 Files to Create / Modify (T-122 Summary)

| File | Change Type | Description |
|------|------------|-------------|
| `frontend/src/styles/print.css` | **Create** | New file — all `@media print` rules |
| `frontend/src/pages/TripDetailsPage.jsx` | **Modify** | (1) Import `'../styles/print.css'`; (2) Wrap `h1.tripName` in `div.tripNameRow` alongside new `<button className={styles.printBtn}>`; (3) `onClick={() => window.print()}` on button |
| `frontend/src/pages/TripDetailsPage.module.css` | **Modify** | Add `.tripNameRow` and `.printBtn` CSS rules; add `@media (max-width: 640px)` responsive rules for these |
| `frontend/src/__tests__/TripDetailsPage.test.jsx` | **Modify** | Add 2+ print-related test cases |

**No backend changes required.** No new routes. No new API calls. No migration.

---

*Sprint 10 Spec 15 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-04.*

---

## Sprint 12 Specs

---

### Spec 16: DayPopover Scroll-Close Behavior Fix

**Status:** Approved
**Task:** T-126
**Sprint:** 12
**Published:** 2026-03-06
**Type:** Bug Fix

---

#### 16.1 Overview

The `DayPopover` component is a portal-rendered dropdown that opens when the user clicks the "+X more" overflow indicator on a calendar day. It currently uses `position: fixed` with coordinates derived from the trigger button's viewport position at the moment of click. Because the coordinates are captured once and never updated, scrolling the page causes the popover to visually detach ("drift") from its trigger.

**Fix:** Close the popover automatically when a scroll event is detected (Option A from the task spec). This is the standard UX pattern for portaled dropdowns — it is simpler, more reliable, and avoids the complexity of recalculating position on every scroll frame.

**No new screens or routes are introduced.** This spec describes the exact interaction behavior change for `DayPopover`.

---

#### 16.2 Current vs. Desired Behavior

| Scenario | Current Behavior | Desired Behavior |
|----------|-----------------|-----------------|
| User opens popover, does NOT scroll | Popover stays anchored to trigger | Unchanged — popover stays open |
| User opens popover, then scrolls | Popover drifts away from trigger (stays at original viewport coords while page moves) | Popover closes immediately on first scroll event |
| User presses Escape | Popover closes; focus returns to trigger | Unchanged |
| User clicks outside popover | Popover closes | Unchanged |
| User closes popover via any method | Focus returns to trigger button | Unchanged |

---

#### 16.3 Component: DayPopover

**Location:** `frontend/src/components/TripCalendar/` (or wherever DayPopover is currently defined).

**Trigger:** `<button>` element labelled "+X more" inside a calendar day cell. Clicking it opens the popover.

**Popover rendering:** Via `createPortal` to `document.body`. The portal renders with `position: fixed` at the trigger's viewport coordinates (`getBoundingClientRect()`).

---

#### 16.4 Scroll-Close Implementation Spec

The scroll listener must be:

1. **Added** when the popover opens (when `isOpen` transitions from `false` to `true`)
2. **Removed** when the popover closes — whether closed by scroll, Escape, outside-click, or any other means — to prevent memory leaks
3. **Using `{ capture: true }`** on the event listener so it fires for scroll events on any scrollable ancestor, not just the window's scroll event

```js
// Pseudocode — implement in DayPopover's useEffect
useEffect(() => {
  if (!isOpen) return;

  const handleScroll = () => {
    closePopover(); // call the existing close handler
  };

  window.addEventListener('scroll', handleScroll, { capture: true });

  return () => {
    window.removeEventListener('scroll', handleScroll, { capture: true });
  };
}, [isOpen]);
```

**Cleanup contract:** The `removeEventListener` call in the cleanup function MUST use the same options object (`{ capture: true }`) as `addEventListener` — otherwise the listener is not removed correctly. This is a browser requirement.

**No race condition:** The scroll listener fires asynchronously after the popover opens. A scroll event cannot fire simultaneously with the click that opened the popover — the browser dispatches them in separate event loop ticks.

---

#### 16.5 Preserved Behaviors (Must Not Regress)

| Behavior | Requirement |
|----------|-------------|
| Escape to close | Must still work. `keydown` listener for `Escape` key must be preserved alongside the scroll listener. |
| Outside-click to close | Must still work. The existing click-outside detection logic is unchanged. |
| Focus restoration | When the popover closes (by any method), focus must return to the trigger button (`"+X more"`). |
| Popover content | The list of events shown inside the popover is unchanged. |
| Trigger button label | "+X more" text and aria attributes are unchanged. |
| Accessibility | Popover role, aria-modal, focus trap (if implemented) are all unchanged. |

---

#### 16.6 States

| State | User Sees |
|-------|-----------|
| **Closed (default)** | "+X more" button visible on overflowed calendar day. No popover in DOM. |
| **Open — no scroll** | Popover visible, anchored at trigger position. Events list displayed inside. |
| **Open — user scrolls** | Popover immediately closes. Page scrolls normally. Focus returns to trigger button. |
| **Open — Escape pressed** | Popover closes. Focus returns to trigger button. (Unchanged) |
| **Open — outside click** | Popover closes. (Unchanged) |

---

#### 16.7 Visual Design (Unchanged)

The popover's visual appearance is not changed by this fix. For reference, the DayPopover style must continue to follow the Design System:

| Property | Value |
|----------|-------|
| Background | `var(--surface)` (`#30292F`) |
| Border | `1px solid var(--border-subtle)` |
| Border-radius | 4px |
| Text color | `var(--text-primary)` (`#FCFCFC`) |
| Font | IBM Plex Mono, 13px |
| Max height | ~320px with internal scroll if needed |
| z-index | High enough to appear above calendar cells (e.g., 1000) |

---

#### 16.8 Responsive Behavior

The scroll-close behavior applies equally on all viewport sizes. Mobile users who scroll to reveal more content will have the popover close — consistent with desktop behavior. No breakpoint-specific changes.

---

#### 16.9 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Focus restoration on scroll-close | When scroll closes the popover, focus returns to the `"+X more"` trigger button — same as Escape-close behavior |
| Screen reader announcement | No special `aria-live` needed. The popover disappearing from DOM is sufficient — screen readers following focus to the trigger button will re-read its context |
| Keyboard navigation unaffected | Tab, Escape, Enter/Space inside the popover — all existing keyboard interactions unchanged |

---

#### 16.10 Tests Required

Minimum tests to add/update in the DayPopover test file:

**New Test 1 — Scroll closes popover:**
```
Given: DayPopover is open (trigger has been clicked)
When: A scroll event fires on window
Then: The popover is removed from the DOM (or isOpen becomes false)
  AND: Focus returns to the trigger button
```

**New Test 2 — Scroll listener is cleaned up on unmount:**
```
Given: DayPopover is open
When: The component unmounts (or closes)
Then: window.removeEventListener was called with ('scroll', handler, { capture: true })
      (verify no dangling listener — use jest.spyOn on window.addEventListener / removeEventListener)
```

**Regression Test — Escape still works after scroll listener is added:**
```
Given: DayPopover is open (scroll listener is attached)
When: User presses Escape
Then: Popover closes
  AND: Focus returns to trigger
  AND: No errors thrown
```

All existing DayPopover tests must continue to pass.

---

#### 16.11 Files to Modify (T-126)

| File | Change |
|------|--------|
| `DayPopover.jsx` (or equivalent component file) | Add `useEffect` with scroll listener; add to existing cleanup; no visual changes |
| `DayPopover.test.jsx` (or equivalent test file) | Add scroll-close test, cleanup test, Escape regression test |

**No CSS changes.** No new components. No API changes.

---

*Sprint 12 Spec 16 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-06.*

---

### Spec 17: Calendar Check-in Chip Label Addition

**Status:** Approved
**Task:** T-127
**Sprint:** 12
**Published:** 2026-03-06
**Type:** Bug Fix

---

#### 17.1 Overview

The calendar view renders "event chips" inside each day cell to indicate what travel events fall on that day. For stays, the current behavior is asymmetric:

- **Check-out day:** chip reads `"check-out Xa"` (e.g., `"check-out 11a"`) — label prefix present
- **Check-in day:** chip reads only `"Xa"` (e.g., `"4p"`) — no label prefix

This creates a confusing inconsistency. Users can see "check-out" but not "check-in", making it ambiguous whether the check-in time chip is a flight arrival, an activity start, or something else.

**Fix:** Prepend the string `"check-in "` to the check-in time chip label, matching the exact format of the check-out chip. No other visual changes.

---

#### 17.2 Current vs. Desired Label Format

| Event Type | Day | Current Chip Text | Desired Chip Text |
|-----------|-----|------------------|------------------|
| Stay check-in | Check-in date | `"4p"` | `"check-in 4p"` |
| Stay check-out | Check-out date | `"check-out 11a"` | `"check-out 11a"` (unchanged) |
| Flight departure | Departure date | `"departs 6a"` (or similar) | Unchanged |
| Flight arrival | Arrival date | `"arrives 2:30p"` (or similar) | Unchanged |
| Activity | Activity date | Activity name or time | Unchanged |

---

#### 17.3 Chip Format Specification

The time abbreviation format is already established by the existing check-out chip implementation. The check-in chip must follow the same rules:

**Format:** `"check-in "` + formatted time

**Time formatting rules (match existing check-out format):**
- Hours without leading zero: `4` not `04`
- Minutes omitted if zero: `"4p"` not `"4:00p"`, `"2:30p"` for non-zero minutes
- AM/PM: lowercase `"a"` and `"p"` (not `"AM"` / `"PM"`)
- Combined: `"check-in 4p"`, `"check-in 2:30p"`, `"check-in 11a"`

**Examples:**

| Check-in time (local) | Chip text |
|----------------------|-----------|
| 4:00 PM | `"check-in 4p"` |
| 3:30 PM | `"check-in 3:30p"` |
| 10:00 AM | `"check-in 10a"` |
| 11:30 AM | `"check-in 11:30a"` |
| 12:00 PM (noon) | `"check-in 12p"` |
| 12:00 AM (midnight) | `"check-in 12a"` |

---

#### 17.4 Component Location

The chip text is rendered inside the calendar event chip renderer — wherever the stay check-in chip is currently constructed. Based on the project's architecture, look for:

- The `TripCalendar` component's event-mapping logic
- A function like `buildCalendarEvents()`, `getChipLabel()`, or similar
- The section that maps over `stays` and generates chip objects for check-in and check-out dates

The fix is a one-line string change: wherever the check-in chip's label is assembled, prepend `"check-in "` before the formatted time string.

**Pseudocode (current):**
```js
{ label: formatChipTime(stay.check_in_at, stay.check_in_tz), type: 'check-in' }
```

**Pseudocode (desired):**
```js
{ label: `check-in ${formatChipTime(stay.check_in_at, stay.check_in_tz)}`, type: 'check-in' }
```

---

#### 17.5 Overflow Popover Behavior

When a calendar day has more events than fit in the cell, a "+X more" overflow chip is shown. Clicking it opens the `DayPopover` which lists all events for that day, including check-in chips. The `"check-in Xa"` label must appear consistently **both** in the inline day cell chip AND in the DayPopover event list. The same label string should be used in both rendering paths — there should be no divergence between the two.

---

#### 17.6 States

| State | Check-in Chip Appearance |
|-------|--------------------------|
| **Check-in day, chip visible in day cell** | `"check-in 4p"` (or appropriate time) |
| **Check-in day, chip in DayPopover overflow list** | `"check-in 4p"` — same label, same format |
| **No stays (empty trip)** | No check-in chip exists — no change |
| **Stay with no check-in time (null check_in_at)** | No chip rendered (existing guard unchanged) |
| **Check-out day** | `"check-out 11a"` — unchanged |

---

#### 17.7 Visual Design (Unchanged)

The chip's visual appearance — background color, text color, font size, border radius, padding — is not changed. Only the text content changes.

For reference, stay check-in chips should use the same visual style as check-out chips:

| Property | Value |
|----------|-------|
| Background | `rgba(93, 115, 126, 0.15)` or the existing stay chip color |
| Text color | `var(--text-primary)` or muted variant (match existing check-out chip) |
| Font size | 11px (match existing calendar chips) |
| Padding | 2px 6px (match existing) |
| Border-radius | 2px (match existing) |
| Max width | Truncate with ellipsis if chip overflows cell width — existing behavior unchanged |

---

#### 17.8 Responsive Behavior

No breakpoint-specific changes. The chip text is slightly longer (adds 10 characters: `"check-in "`). On narrow viewports or smaller calendar cells, the existing ellipsis truncation handles overflow gracefully. No layout changes are needed.

If the chip is already constrained to a max width with CSS `overflow: hidden; text-overflow: ellipsis`, the longer label will truncate consistently. Verify on mobile viewport that `"check-in 4p"` does not overflow its cell — the existing truncation logic handles this.

---

#### 17.9 Accessibility

The chip text is the visible label that screen readers will announce. The change from `"4p"` to `"check-in 4p"` is a strict improvement for accessibility — the label is now self-describing and unambiguous. No additional ARIA attributes are needed.

If the chip element has an `aria-label` attribute that was overriding the visible text, that override must also be updated to match the new visible text.

---

#### 17.10 Tests Required

**Test 1 — Check-in chip shows "check-in" prefix:**
```
Given: A trip with a stay (check_in_at: "2026-08-07T20:00:00.000Z", check_in_tz: "America/New_York")
When: TripCalendar renders the calendar for August 2026
Then: The chip on August 7 reads "check-in 4p"
  AND: No chip on August 7 reads just "4p" (without the prefix)
```

**Test 2 — Check-out chip is unchanged:**
```
Given: A trip with a stay (check_out_at: "2026-08-09T15:00:00.000Z", check_out_tz: "America/New_York")
When: TripCalendar renders
Then: The chip on August 9 still reads "check-out 11a"
  AND: The check-out format is not affected by this change
```

**Test 3 — Check-in chip in DayPopover matches day cell chip:**
```
Given: A calendar day with check-in chip in overflow (DayPopover)
When: User opens the DayPopover for that day
Then: The check-in label inside the popover reads "check-in Xa" (same prefix)
```

All existing calendar chip tests must be updated if they assert the old `"4p"` format — snapshot tests especially. All tests must pass.

---

#### 17.11 Files to Modify (T-127)

| File | Change |
|------|--------|
| Calendar event chip label assembly (e.g., `TripCalendar.jsx` or chip builder utility) | Prepend `"check-in "` to the check-in time string |
| Calendar test file(s) | Update assertions for check-in chip text from `"4p"` → `"check-in 4p"` (and similar). Update snapshots if used. |

**No CSS changes.** No API changes. No new components.

---

*Sprint 12 Spec 17 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-06.*

---

### Spec 18: Calendar Default Month — First Planned Event

**Status:** Approved
**Task:** T-128
**Sprint:** 12
**Published:** 2026-03-06
**Type:** Feature / UX Improvement

---

#### 18.1 Overview

The `TripCalendar` component initializes its `currentMonth` state to the current calendar month (e.g., March 2026 when the sprint runs). For a trip planned in August 2026, the user must manually navigate forward 5 months every time they open the trip details page — a significant friction point.

**Fix:** Initialize `currentMonth` to the month/year of the trip's **earliest planned event** across all event types (flights, stays, activities). If no events exist, fall back to the current month.

This is a state initialization change only. No API calls are added, no visual design changes, and month navigation (prev/next arrows) continues to work normally from whatever month the calendar opens on.

---

#### 18.2 Event Date Sources

The `TripCalendar` component already receives (or has access to) all trip event data. The following fields must be inspected to find the earliest date:

| Data Source | Field to Inspect | Field Type |
|------------|-----------------|-----------|
| `flights` array | `departure_at` | ISO 8601 UTC string (e.g., `"2026-08-07T10:00:00.000Z"`) |
| `stays` array | `check_in_at` | ISO 8601 UTC string |
| `activities` array | `activity_date` | DATE string (e.g., `"2026-08-08"`) |

**Note on land travel:** Land travel entries use `departure_date` (a DATE string). If the `TripCalendar` already maps land travel events onto the calendar, include `departure_date` as well. If land travel is not currently rendered on the calendar, do NOT include it — only include date sources that are already used by the calendar's event-building logic.

**Note on field availability:** The component receives these arrays as props (or via context). All three arrays are already fetched by `useTripDetails` (parallel fetch). No new API calls are needed.

---

#### 18.3 Earliest Event Date Algorithm

```js
/**
 * Find the earliest event date across flights, stays, and activities.
 * Returns a Date object set to the first day of the earliest event's month,
 * or the first day of the current month if no events exist.
 *
 * @param {Array} flights - flight objects with departure_at (ISO string)
 * @param {Array} stays   - stay objects with check_in_at (ISO string)
 * @param {Array} activities - activity objects with activity_date (YYYY-MM-DD string)
 * @returns {Date} - a Date object representing the start of the target month
 */
function getInitialMonth(flights = [], stays = [], activities = []) {
  const dates = [];

  // Collect flight departure dates
  flights.forEach(f => {
    if (f.departure_at) {
      const d = new Date(f.departure_at);
      if (!isNaN(d)) dates.push(d);
    }
  });

  // Collect stay check-in dates
  stays.forEach(s => {
    if (s.check_in_at) {
      const d = new Date(s.check_in_at);
      if (!isNaN(d)) dates.push(d);
    }
  });

  // Collect activity dates — parse as local date to avoid UTC-midnight offset issues
  activities.forEach(a => {
    if (a.activity_date) {
      // YYYY-MM-DD: parse with explicit components to treat as local date
      const [year, month, day] = a.activity_date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      if (!isNaN(d)) dates.push(d);
    }
  });

  if (dates.length === 0) {
    // Fallback: current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Find the earliest date
  const earliest = dates.reduce((min, d) => d < min ? d : min, dates[0]);

  // Return first day of that month
  return new Date(earliest.getFullYear(), earliest.getMonth(), 1);
}
```

**Key design decisions:**

1. **Activity dates parsed as local time:** `new Date("2026-08-08")` interprets the date as midnight UTC, which can shift to the previous day in timezones west of UTC. Parsing with `new Date(year, month - 1, day)` uses local time and avoids this off-by-one error.

2. **Flight/stay dates parsed as UTC ISO strings:** `departure_at` and `check_in_at` are full ISO 8601 UTC timestamps. `new Date(isoString)` correctly parses these as UTC. The resulting local Date object may show a different calendar date depending on the user's timezone, but for the purpose of "which month to open the calendar on", this is acceptable — the calendar operates in the user's local timezone.

3. **Graceful handling of missing/invalid dates:** `isNaN(d)` guards prevent `Invalid Date` objects from entering the comparison. Entries with null or malformed date fields are silently skipped.

4. **Returns a Date, not a `{month, year}` object:** The returned Date should be stored in `currentMonth` state in whatever format the component already uses. If `currentMonth` is stored as `{ month: number, year: number }`, extract those values from the returned Date:
   ```js
   const initial = getInitialMonth(flights, stays, activities);
   const [currentMonth, setCurrentMonth] = useState({
     month: initial.getMonth(), // 0-indexed
     year: initial.getFullYear()
   });
   ```
   If `currentMonth` is stored as a Date directly, use the Date object as-is.

---

#### 18.4 State Initialization Timing

The `getInitialMonth` call must happen **at component initialization** — it determines the initial value of `currentMonth` state. It should NOT be inside a `useEffect` that runs after mount (which would cause a visible flash from the current month to the correct month).

**Correct pattern (no flash):**
```jsx
// Props/context: flights, stays, activities passed in from TripDetailsPage
const TripCalendar = ({ flights, stays, activities }) => {
  const [currentMonth, setCurrentMonth] = useState(() =>
    getInitialMonth(flights, stays, activities)
  );
  // ...
};
```

The lazy initializer (`useState(() => fn())`) ensures the function runs only once at mount, avoiding re-computation on re-renders.

**Note on data availability:** If `TripCalendar` is rendered before the flights/stays/activities data has loaded (during the loading state), the arrays passed as props will be empty (`[]`). In this case, `getInitialMonth` correctly returns the current month fallback. When data loads and the parent re-renders, the component has already mounted — `useState` initial value does not re-run. The calendar will remain on the current month until the user navigates.

**Preferred approach:** Render `TripCalendar` only after all three data sets have loaded. The existing `TripDetailsPage` loading skeleton pattern already defers rendering sub-components until data is ready. Verify that `TripCalendar` is rendered inside the loaded state branch (not in the skeleton/loading branch). If it is already conditional on data being present, `getInitialMonth` will always receive populated arrays.

---

#### 18.5 Month Navigation (Must Not Regress)

The existing prev/next month navigation must continue to work normally after this change. The only change is the **initial** `currentMonth` value — once the user navigates, `setCurrentMonth` is called with the new month/year as usual. Navigation logic is completely unaffected.

**Verify:**
- Clicking "next month" from August 2026 moves to September 2026
- Clicking "prev month" from August 2026 moves to July 2026
- Navigation from any month continues indefinitely in both directions

---

#### 18.6 User Flow

**Trip with future events:**
1. User opens `TripDetailsPage` for a trip with events in August 2026 (e.g., a flight departing August 7, a stay checking in August 7, activities on August 8–9)
2. `TripCalendar` initializes — `getInitialMonth` finds August 7, 2026 as the earliest date
3. Calendar renders with August 2026 visible immediately — no current-month flash, no navigation required
4. User sees their August flights, stays, and activities populated on the calendar
5. User clicks "next" arrow → September 2026 displayed (navigation works normally)

**Trip with no events (empty trip):**
1. User opens `TripDetailsPage` for a newly created trip with no flights, stays, or activities
2. `TripCalendar` initializes — `getInitialMonth` receives three empty arrays, returns current month (March 2026)
3. Calendar renders with March 2026 (current month) — same as the previous behavior

**Existing trip with events in current month:**
1. User's trip has events in March 2026 (the current month as of 2026-03-06)
2. `getInitialMonth` returns March 2026 — calendar opens on March 2026
3. Visually identical to previous behavior (no perceptible change for current-month trips)

---

#### 18.7 States

| State | Calendar Opening Month |
|-------|----------------------|
| **Trip has events in a future month** | Opens on the month of the earliest event |
| **Trip has events in a past month** | Opens on the month of the earliest event (past month) — user can navigate forward |
| **Trip has events spanning multiple months** | Opens on the month of the earliest event |
| **Trip has events only in the current month** | Opens on current month (same as before) |
| **Trip has no events (all arrays empty)** | Opens on current month (fallback) |
| **Data loading (arrays not yet fetched)** | Opens on current month (fallback) — corrected after data loads IF calendar is conditionally rendered post-load |
| **Malformed date in one event** | Malformed entry is skipped; other events still determine the month |
| **All events have null date fields** | Falls back to current month |

---

#### 18.8 Visual Design (Unchanged)

The calendar's visual layout, chip styles, day cell styles, header (month/year label + navigation arrows), and color scheme are all unchanged. The only difference is which month is visible when the calendar first renders.

---

#### 18.9 Responsive Behavior

No changes to responsive behavior. The calendar already adapts to different viewport widths. This change is purely a state initialization logic change.

---

#### 18.10 Accessibility

No accessibility changes required. The month/year header text (e.g., "August 2026") that screen readers announce is determined by `currentMonth` state — it will now read the correct month for the trip rather than the current month. This is a strict accessibility improvement: users navigating with screen readers will land directly on the relevant month.

---

#### 18.11 Tests Required

**Test 1 — Defaults to earliest event month when events exist:**
```
Given: TripCalendar receives:
  - flights: [{ departure_at: "2026-08-07T10:00:00.000Z" }]
  - stays: [{ check_in_at: "2026-08-07T20:00:00.000Z" }]
  - activities: [{ activity_date: "2026-08-08" }]
When: TripCalendar mounts
Then: The calendar header shows "August 2026" (not the current month)
  AND: The August 2026 grid is visible
```

**Test 2 — No events falls back to current month:**
```
Given: TripCalendar receives:
  - flights: []
  - stays: []
  - activities: []
When: TripCalendar mounts
Then: The calendar header shows the current month (e.g., "March 2026")
```

**Test 3 — Earliest across mixed event types:**
```
Given: TripCalendar receives:
  - flights: [{ departure_at: "2026-09-15T06:00:00.000Z" }]
  - stays: [{ check_in_at: "2026-09-15T20:00:00.000Z" }]
  - activities: [{ activity_date: "2026-08-20" }]  // ← earlier than flights/stays
When: TripCalendar mounts
Then: The calendar header shows "August 2026" (the activity date is the earliest)
```

**Test 4 — Month navigation works from initial month:**
```
Given: TripCalendar mounts showing August 2026
When: User clicks the "next month" button
Then: The calendar header shows "September 2026"
When: User clicks "prev month"
Then: The calendar header shows "August 2026" again
```

**Test 5 — Malformed date is skipped gracefully:**
```
Given: TripCalendar receives:
  - flights: [{ departure_at: "not-a-date" }]
  - stays: [{ check_in_at: "2026-10-01T12:00:00.000Z" }]
When: TripCalendar mounts
Then: No error is thrown
  AND: The calendar header shows "October 2026" (the valid date wins)
```

All existing TripCalendar tests must continue to pass.

---

#### 18.12 Files to Modify (T-128)

| File | Change |
|------|--------|
| `TripCalendar.jsx` (or equivalent) | Add `getInitialMonth(flights, stays, activities)` utility; use as lazy initial state for `currentMonth` |
| `TripCalendar.test.jsx` (or equivalent) | Add 5 tests covering the scenarios above |

**No CSS changes.** No API changes. No new routes. No backend changes.

---

*Sprint 12 Spec 18 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-06.*

---

### Spec 19: DayPopover Stay-Open and Document-Anchored Behavior (Sprint 13 — T-137)

**Status:** Approved
**Sprint:** 13
**Related Task:** T-137
**Feedback Source:** FB-091
**Supersedes:** Spec 16 (scroll-close behavior — T-126 approach is reversed)

---

#### 19.1 Overview and Motivation

Spec 16 (T-126) fixed the original drift problem (FB-086) by closing the DayPopover whenever the user scrolled. While this eliminated the visual artifact, it introduced new friction: users who accidentally scrolled slightly lost the popover and had to re-open it. FB-091 requests the preferred behavior: the popover should **stay open** when the user scrolls, and should remain **visually anchored** to the trigger button's document position so it does not drift.

**Before (Spec 16 / T-126 approach — to be removed):**
- Popover used `position: fixed` with viewport-relative coordinates captured at open time.
- A `window.addEventListener('scroll', close, { capture: true })` listener was added on open and removed on close.
- Effect: scrolling dismissed the popover immediately.

**After (Spec 19 / T-137 approach):**
- Popover uses `position: absolute` with document-relative coordinates (viewport offset + scroll offset).
- No scroll-close listener. Scroll events are completely ignored by the popover.
- Effect: the popover stays open, scrolling with the document, remaining pinned at the trigger's original document position.

**No new screens or routes.** This spec describes a targeted behavior change to `DayPopover` only.

---

#### 19.2 Affected Component

**Component:** `DayPopover` (located in `frontend/src/components/TripCalendar/` or equivalent)

This is the portal-rendered dropdown that opens when the user clicks the "+X more" overflow indicator on a calendar day cell. It lists all events for that day that did not fit inline.

---

#### 19.3 Positioning Model Change

##### 19.3.1 Current model (to be removed)

```
position: fixed
top:  triggerRect.bottom  (viewport Y at time of open)
left: triggerRect.left    (viewport X at time of open)
```

With `position: fixed`, the popover is anchored to the **viewport**. When the user scrolls, the viewport coordinates remain the same but the page content moves — causing the popover to visually detach from the trigger.

##### 19.3.2 New model (to implement)

```
position: absolute
top:  triggerRect.bottom + window.scrollY   (document Y)
left: triggerRect.left   + window.scrollX   (document X)
```

With `position: absolute` on a child of `document.body` (via `createPortal`), the coordinates are **document-relative**. When the user scrolls, both the trigger button and the popover shift in the viewport by the same amount, so the popover remains visually pinned to the trigger location.

##### 19.3.3 Portal target

The portal target remains `document.body`. No change to the createPortal call itself — only the CSS positioning mode and coordinate calculation change.

**Important:** If `document.body` or `html` has any transform, `position: fixed` override, or `will-change` applied globally, `position: absolute` may behave unexpectedly. The implementation should verify that no such global override exists (none is expected in the current codebase).

##### 19.3.4 Position calculation pseudocode

```js
// Called once on open, inside the click handler or useLayoutEffect after mount
function calculatePopoverPosition(triggerEl) {
  const rect = triggerEl.getBoundingClientRect();
  const scrollX = window.scrollX ?? window.pageXOffset;
  const scrollY = window.scrollY ?? window.pageYOffset;

  return {
    top:  rect.bottom + scrollY,   // document-relative Y (below trigger)
    left: rect.left   + scrollX,   // document-relative X (aligned with trigger left)
  };
}
```

The position is computed **once** at open time and set as inline styles on the popover element. No ongoing recalculation is needed — `position: absolute` handles the scroll tracking passively.

##### 19.3.5 Edge case: viewport overflow (right/bottom)

When the trigger is near the right edge of the viewport, the popover must not overflow off-screen. Apply the same right-edge clamping that existed previously:

```js
const viewportWidth = window.innerWidth;
const popoverWidth = 240; // matches existing DayPopover max-width
let left = rect.left + scrollX;
if (left + popoverWidth > scrollX + viewportWidth - 16) {
  // Align right edge of popover with right edge of viewport (with 16px margin)
  left = scrollX + viewportWidth - popoverWidth - 16;
}
```

If the trigger is near the bottom of the viewport and there is insufficient space below, the popover should appear above the trigger instead:

```js
const viewportHeight = window.innerHeight;
const popoverEstimatedHeight = 200; // conservative estimate
let top = rect.bottom + scrollY;
if (rect.bottom + popoverEstimatedHeight > viewportHeight) {
  top = rect.top + scrollY - popoverEstimatedHeight; // render above trigger
}
```

These clamping behaviors mirror the existing logic — only the `position: absolute` + scroll-offset shift is new.

---

#### 19.4 Close Behaviors (Unchanged)

The following close triggers must all continue to work exactly as before:

| Trigger | Behavior |
|---------|----------|
| **Click outside** | Clicking anywhere outside the popover (including the trigger button when it's outside the popover bounds) closes the popover |
| **Escape key** | `keydown` listener on `window` or the popover element — pressing `Escape` closes the popover |
| **Explicit close button** | If a close (×) button exists inside the popover, clicking it closes the popover |
| **Navigation** | If the user navigates away, the component unmounts and the popover is removed |

**Scroll is NOT in this list.** Scroll must not close the popover.

---

#### 19.5 State and Lifecycle

```
Open state:
  - Popover mounted via createPortal into document.body
  - position: absolute; top: <docY>px; left: <docX>px
  - Click-outside listener added to document
  - Escape keydown listener added to window (or document)
  - NO scroll listener

Close trigger fires (any of: click-outside, Escape, close button):
  - Popover unmounted (or hidden)
  - Click-outside listener removed
  - Escape keydown listener removed

Cleanup (useEffect return):
  - Remove click-outside listener
  - Remove Escape keydown listener
  (No scroll listener to remove)
```

---

#### 19.6 Visual Appearance (No Change)

The popover's visual style is unchanged from Spec 16.3 / Spec 7. For reference:

| Property | Value |
|----------|-------|
| Background | `var(--surface)` (`#30292F`) |
| Border | `1px solid rgba(93, 115, 126, 0.3)` |
| Border radius | 4px |
| Padding | 12px |
| Min width | 200px |
| Max width | 240px |
| Font | IBM Plex Mono, 12px, `var(--text-primary)` |
| Z-index | 1000 (or existing value — must render above all other page content) |
| Shadow | None (Japandi aesthetic — no shadows) |

The popover lists each event for the overflow day with the same chip styles used in the inline day cell. No visual changes are required for this spec.

---

#### 19.7 Accessibility (No Change)

No accessibility changes are required. The existing roles, `aria-label`, focus management, and keyboard handling are preserved. The Escape-to-close behavior is maintained, which satisfies WCAG 2.1 SC 1.4.13 (Content on Hover or Focus).

---

#### 19.8 Test Plan

Remove or update the test added in T-126:

**Test to REMOVE (from Spec 16 / T-126):**
```
Given: DayPopover is open (trigger has been clicked)
When: A scroll event fires on window
Then: onClose IS called and popover is dismissed
→ DELETE THIS TEST — behavior has changed
```

**Tests to ADD:**

**Test 19.A — Popover stays open on scroll:**
```
Given: DayPopover is open (trigger has been clicked)
When: A scroll event fires on window (simulate: window.dispatchEvent(new Event('scroll')))
Then: onClose is NOT called
And:  The popover remains mounted in the DOM
```

**Test 19.B — No scroll listener attached:**
```
Given: DayPopover is about to open
When: The component mounts
Then: window.addEventListener is NOT called with 'scroll' as the event type
(Spy on window.addEventListener and assert no scroll call)
```

**Test 19.C — Position uses document-relative coordinates:**
```
Given: Trigger button has getBoundingClientRect() returning { bottom: 120, left: 50 }
And:   window.scrollY = 300, window.scrollX = 0
When:  DayPopover opens
Then:  Popover element has inline style top: 420px (120 + 300), left: 50px (50 + 0)
```

**Regression tests (must continue to pass):**

**Test 19.D — Escape closes popover:**
```
Given: DayPopover is open
When: User presses Escape key
Then: onClose IS called
```

**Test 19.E — Click outside closes popover:**
```
Given: DayPopover is open
When: User clicks outside the popover bounds
Then: onClose IS called
```

**Test 19.F — Cleanup removes all listeners on unmount:**
```
Given: DayPopover is open (listeners attached)
When: The component unmounts
Then: All event listeners (click-outside, Escape keydown) are removed
And:  No scroll listener was ever added (so none to remove)
```

All existing DayPopover tests not related to scroll-close must continue to pass.

---

#### 19.9 Files Affected

| File | Change |
|------|--------|
| `DayPopover.jsx` (or equivalent) | Remove `window.addEventListener('scroll', close, ...)` and its cleanup. Change `position: 'fixed'` to `position: 'absolute'`. Update coordinate calculation to add `window.scrollX`/`window.scrollY`. |
| `DayPopover.test.jsx` (or equivalent) | Remove scroll-closes-popover test. Add Tests 19.A, 19.B, 19.C. Verify Tests 19.D, 19.E, 19.F pass. |

**No CSS file changes.** No API changes. No backend changes. No new routes.

---

*Sprint 13 Spec 19 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-07.*

---

### Spec 20: Rental Car Pick-Up / Drop-Off Time Chips on Calendar (Sprint 13 — T-138)

**Status:** Approved
**Sprint:** 13
**Related Task:** T-138
**Feedback Source:** FB-092
**Extends:** Spec 12 Addendum (CAL-1, CAL-1.5), Spec 13 (CAL-3)

---

#### 20.1 Overview

When a user adds a rental car land travel entry, the calendar currently shows the car icon and destination label on the relevant days but does not clearly communicate when the car is picked up or dropped off. FB-092 requests time chips for rental car events that match the labeling convention established by stay check-in/check-out chips.

**Pattern already established by stays:**
- Check-in day: `"check-in 4p"` chip
- Check-out day: `"check-out 11a"` chip

**New pattern for rental cars:**
- Pick-up day (`departure_date`): `"pick-up 5p"` chip
- Drop-off day (`arrival_date`): `"drop-off 5p"` chip

This change applies **only** to `RENTAL_CAR` mode land travel entries. All other land travel modes (BUS, TRAIN, RIDESHARE, FERRY, OTHER) are unaffected.

---

#### 20.2 Data Model Reference

A land travel entry has the following relevant fields (from Spec 12):

| Field | Type | Description |
|-------|------|-------------|
| `mode` | enum | `RENTAL_CAR \| BUS \| TRAIN \| RIDESHARE \| FERRY \| OTHER` |
| `departure_date` | YYYY-MM-DD | The date the rental car is picked up |
| `departure_time` | HH:MM (optional) | The time the rental car is picked up |
| `arrival_date` | YYYY-MM-DD (optional) | The date the rental car is dropped off |
| `arrival_time` | HH:MM (optional) | The time the rental car is dropped off |

---

#### 20.3 Chip Label Logic

##### 20.3.1 Pick-up chip (departure_date)

On the cell corresponding to `departure_date`, if the land travel entry's `mode === 'RENTAL_CAR'`:

- If `departure_time` is present: render chip as `"pick-up Xp"` (e.g., `"pick-up 5p"` for 17:00, `"pick-up 9a"` for 09:00)
- If `departure_time` is absent (null / empty): render chip as `"pick-up"` (no time suffix — same fallback as stays use when check_in_at time is absent)

The time format follows the existing `formatCalendarTime` convention used throughout the calendar:
- Format: single digit or double digit hour + "a" (AM) or "p" (PM), no `:00` suffix, no leading zero for single-digit hours.
- Examples: `9a`, `11a`, `12p`, `1p`, `5p`

##### 20.3.2 Drop-off chip (arrival_date)

On the cell corresponding to `arrival_date`, if `mode === 'RENTAL_CAR'` and `arrival_date` is set:

- If `arrival_time` is present: render chip as `"drop-off Xp"` (e.g., `"drop-off 5p"` for 17:00)
- If `arrival_time` is absent: render chip as `"drop-off"` (no time suffix)

If `arrival_date` is not set (single-day rental car with no explicit return), no drop-off chip is shown. The departure day shows only the pick-up chip.

##### 20.3.3 Multi-day rental car (departure_date ≠ arrival_date)

- `departure_date` cell: shows `"pick-up Xp"` chip
- `arrival_date` cell: shows `"drop-off Xp"` chip
- Intermediate days (if any between departure and arrival): show the event label (mode + destination) but **no time chip** — same behavior as intermediate days for multi-day stays

##### 20.3.4 Same-day rental car (departure_date === arrival_date)

If the rental car is picked up and dropped off on the same day:
- Show `"pick-up Xp"` chip (departure time takes priority for a single-day entry)
- Do NOT also show `"drop-off Xp"` on the same cell (avoid redundancy)

---

#### 20.4 Rendering Locations

This change affects two rendering paths. Both must be updated consistently:

##### 20.4.1 DayCell (inline calendar grid)

In the `DayCell` component (or wherever inline calendar event chips are rendered per cell), for land travel events with `mode === 'RENTAL_CAR'`:

```
if (event.mode === 'RENTAL_CAR') {
  if (cellDate === event.departure_date) {
    // pick-up chip: prepend "pick-up " to the formatted time
    timeLabel = event.departure_time
      ? "pick-up " + formatCalendarTime(event.departure_time)
      : "pick-up";
  } else if (cellDate === event.arrival_date && cellDate !== event.departure_date) {
    // drop-off chip: prepend "drop-off " to the formatted time
    timeLabel = event.arrival_time
      ? "drop-off " + formatCalendarTime(event.arrival_time)
      : "drop-off";
  }
  // intermediate days: no time label (same as multi-day stays)
}
```

##### 20.4.2 DayPopover.getEventTime (overflow popover)

In the `DayPopover` component (or its `getEventTime` / `formatEventChip` helper), apply identical labeling for `RENTAL_CAR` events so the chip text inside the popover matches the inline day cell chip.

The popover already lists all events for the overflow day with their time chips. This change ensures that when a rental car pick-up or drop-off day overflows into the "+X more" popover, the chip reads `"pick-up Xp"` or `"drop-off Xp"` there too.

---

#### 20.5 Visual Appearance

The chip visual style is **not changed**. Rental car pick-up/drop-off chips use the same chip appearance as all other land travel time chips in the calendar.

Per Spec 12 Addendum (CAL-1):
- Chip background: `rgba(93, 115, 126, 0.2)` (accent tint — land travel chip color)
- Chip text: `var(--accent)` (`#5D737E`)
- Chip font: IBM Plex Mono, 10px, font-weight 500
- Chip padding: 2px 6px, border-radius 2px

The `"pick-up"` and `"drop-off"` prefixes are purely text — no new icons or colors.

---

#### 20.6 Non-RENTAL_CAR Modes

All other land travel modes (`BUS`, `TRAIN`, `RIDESHARE`, `FERRY`, `OTHER`) are **unaffected** by this change:

- Their departure day continues to show the departure time chip with no prefix (existing behavior).
- Their arrival day continues to show the arrival time chip with no prefix (existing behavior per Spec 13 CAL-3).

The `mode === 'RENTAL_CAR'` guard must be strictly applied. No other mode should receive the `"pick-up"` or `"drop-off"` prefix.

---

#### 20.7 Interaction with "+X more" Overflow

When a rental car pick-up or drop-off falls on a day with many events, the pick-up/drop-off chip may appear inside the DayPopover overflow list rather than inline. In that case:

- The chip inside the popover must read `"pick-up Xp"` / `"drop-off Xp"` (same label as the inline chip would show).
- There must be no discrepancy between the inline display and the popover display.

---

#### 20.8 Empty / Edge States

| Scenario | Behavior |
|----------|----------|
| RENTAL_CAR with `departure_time` = null | Pick-up day chip: `"pick-up"` (no time) |
| RENTAL_CAR with `arrival_date` = null | No drop-off chip on any day |
| RENTAL_CAR with `arrival_time` = null | Drop-off day chip: `"drop-off"` (no time) |
| RENTAL_CAR with `departure_date === arrival_date` | Only `"pick-up Xp"` chip on that day (no drop-off chip) |
| Non-RENTAL_CAR mode | No prefix added — existing behavior unchanged |
| No land travel entries | No change — empty state is unaffected |

---

#### 20.9 Accessibility

No additional accessibility changes. The chip text is already exposed via screen readers as part of the day cell content. The new labels `"pick-up"` and `"drop-off"` are plain text and will be read correctly by screen readers.

If chips are wrapped in `aria-label` attributes (check existing implementation), update the `aria-label` of the affected chips to include the `"pick-up"` or `"drop-off"` prefix.

---

#### 20.10 Test Plan

All tests belong in `TripCalendar.test.jsx` (or the equivalent test file for `DayCell` / `DayPopover`).

**Test 20.A — RENTAL_CAR pick-up chip on departure day:**
```
Given: A land travel entry with mode=RENTAL_CAR, departure_date=2026-08-07, departure_time=17:00, arrival_date=2026-08-10
When:  The calendar renders the cell for 2026-08-07
Then:  A chip with text "pick-up 5p" is present in that cell
```

**Test 20.B — RENTAL_CAR drop-off chip on arrival day:**
```
Given: A land travel entry with mode=RENTAL_CAR, departure_date=2026-08-07, departure_time=10:00, arrival_date=2026-08-10, arrival_time=14:00
When:  The calendar renders the cell for 2026-08-10
Then:  A chip with text "drop-off 2p" is present in that cell
```

**Test 20.C — RENTAL_CAR no drop-off chip when arrival_date is null:**
```
Given: A land travel entry with mode=RENTAL_CAR, departure_date=2026-08-07, arrival_date=null
When:  The calendar renders
Then:  No chip containing "drop-off" appears on any day
```

**Test 20.D — RENTAL_CAR with no times shows label-only chips:**
```
Given: A land travel entry with mode=RENTAL_CAR, departure_time=null, arrival_time=null, arrival_date=2026-08-10
When:  The calendar renders departure_date cell and arrival_date cell
Then:  departure_date cell shows chip "pick-up" (no time)
And:   arrival_date cell shows chip "drop-off" (no time)
```

**Test 20.E — Non-RENTAL_CAR is unaffected:**
```
Given: A land travel entry with mode=TRAIN, departure_date=2026-08-07, departure_time=09:00
When:  The calendar renders the cell for 2026-08-07
Then:  The chip does NOT contain "pick-up"
And:   The chip shows the departure time in the standard format (e.g., "9a")
```

**Test 20.F — DayPopover shows matching labels:**
```
Given: A RENTAL_CAR pick-up day has more events than fit inline (triggers "+X more" overflow)
When:  User opens the DayPopover for that day
Then:  The rental car entry in the popover shows "pick-up Xp" (matching the inline chip label)
```

**Test 20.G — Same-day pickup and drop-off shows only pick-up:**
```
Given: A land travel entry with mode=RENTAL_CAR, departure_date=2026-08-07, arrival_date=2026-08-07
When:  The calendar renders the cell for 2026-08-07
Then:  A chip with text "pick-up" (with or without time) is present
And:   No chip with text "drop-off" is present on that day
```

All existing `TripCalendar.test.jsx` tests must continue to pass.

---

#### 20.11 Files Affected

| File | Change |
|------|--------|
| `DayCell.jsx` (or wherever inline calendar chips render per cell) | Add `mode === 'RENTAL_CAR'` guard; prepend `"pick-up "` on departure day and `"drop-off "` on arrival day for RENTAL_CAR entries |
| `DayPopover.jsx` (or `getEventTime` helper) | Apply same `"pick-up "` / `"drop-off "` prefix logic for RENTAL_CAR events |
| `TripCalendar.test.jsx` (or equivalent) | Add Tests 20.A through 20.G |

**No CSS changes.** No API changes. No new routes. No backend changes.

---

*Sprint 13 Spec 20 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-07.*

---

## Sprint 14 Specs

---

### Spec 21: TripCalendar — Async First-Event-Month Fix

**Status:** Approved
**Sprint:** 14
**Related Task:** T-146
**Feedback Source:** FB-095
**Published:** 2026-03-07
**Type:** Bug Fix

---

#### 21.1 Overview and Problem Statement

T-128 (Sprint 12) implemented `getInitialMonth()` to compute the month of the first planned event and use it as the calendar's starting month. The implementation was correct in isolation, but a timing bug prevents it from working in practice:

**Root cause:** `TripCalendar` receives `flights`, `stays`, `activities`, and `landTravel` as props. On first render, these props are **empty arrays** — the data has not yet arrived from the async API calls in `TripDetailsPage`. The lazy `useState` initializer fires immediately on mount with empty arrays, so `getInitialMonth()` falls through to its fallback (current month). When the data eventually loads and the props update, `useState`'s initializer does **not** re-run — `currentMonth` is stuck at the current month.

**Fix:** Add a `useEffect` that watches the event data props and, the first time meaningful data arrives, updates `currentMonth` to the result of `getInitialMonth(flights, stays, activities, landTravel)` — but **only if the user has not manually navigated the calendar** (tracked via a `hasNavigated` ref).

**No new screens or routes.** This spec describes an implementation change to `TripCalendar` (and related test file) only.

---

#### 21.2 Component Location

**Component:** `TripCalendar.jsx` (located in `frontend/src/components/TripCalendar/` or `frontend/src/components/`)

**Test file:** `TripCalendar.test.jsx` (or equivalent)

---

#### 21.3 Behavioral Specification

##### 21.3.1 Happy Path — data loads after mount

| Step | State | Calendar shows |
|------|-------|---------------|
| TripDetailsPage mounts | flights=[], stays=[], activities=[], landTravel=[] | Current month (fallback) |
| API calls resolve — data arrives | flights=[...May events...], stays=[], activities=[], landTravel=[] | **Automatically updates to May 2026** |
| User navigates prev/next | — | User's chosen month (no automatic reset) |
| User opens a different trip | Component re-mounts | Correct first-event month for new trip |

##### 21.3.2 User navigated before data arrived

| Step | State | Calendar shows |
|------|-------|---------------|
| TripCalendar mounts | All props empty | Current month (fallback) |
| User clicks `>` (next month) | `hasNavigated.current = true` | April 2026 (user's choice) |
| Data arrives | flights=[...May events...] | **Stays on April 2026 — no override** |

**Rationale:** The user has expressed intent by navigating. Overriding their choice when data arrives would be jarring and unexpected.

##### 21.3.3 Empty trip (no events ever)

| Step | State | Calendar shows |
|------|-------|---------------|
| TripCalendar mounts | All props empty | Current month |
| API calls resolve | All props still empty (no events added) | Current month (no change) |

The `useEffect` must NOT update `currentMonth` if `getInitialMonth()` returns the current month due to absence of events — it must only update when there are actual events to navigate to. This is naturally handled by tracking whether `hasNavigated` has been set and whether the data is non-empty.

---

#### 21.4 Implementation Specification

##### 21.4.1 `hasNavigated` Ref

Add a ref to `TripCalendar` to track whether the user has manually moved the calendar:

```jsx
const hasNavigated = useRef(false);
```

- Initialized to `false` on component mount.
- Set to `true` in **every** handler that changes `currentMonth` due to user interaction:
  - The `handlePrev` callback (click `<` arrow)
  - The `handleNext` callback (click `>` arrow)
  - The `handleToday` callback (click "Today" button — T-147)
- **Never reset to `false`** once it becomes `true` — if the user has navigated even once, automatic initialization is permanently disabled for that component instance.
- Not exposed to parent — internal implementation detail only.

##### 21.4.2 Updated Navigation Handlers

**Before (existing):**
```jsx
function handlePrev() {
  setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
}
function handleNext() {
  setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
}
```

**After:**
```jsx
function handlePrev() {
  hasNavigated.current = true;
  setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
}
function handleNext() {
  hasNavigated.current = true;
  setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
}
```

The `handleToday` function introduced in T-147 (Spec 22) must also set `hasNavigated.current = true` before calling `setCurrentMonth`.

##### 21.4.3 Data-Arrival `useEffect`

Add the following `useEffect` inside `TripCalendar`:

```jsx
useEffect(() => {
  // Only auto-initialize if the user has not already navigated
  if (hasNavigated.current) return;

  // Check if any event data is now present
  const hasData =
    flights.length > 0 ||
    stays.length > 0 ||
    activities.length > 0 ||
    landTravel.length > 0;

  if (!hasData) return;

  // Compute the first-event month from the now-available data
  const firstEventMonth = getInitialMonth(flights, stays, activities, landTravel);

  // Only update if we actually get a meaningful result
  // (getInitialMonth returns current month when no valid dates found,
  //  so we compare to avoid a no-op state update)
  setCurrentMonth(prev => {
    const same =
      firstEventMonth.getFullYear() === prev.getFullYear() &&
      firstEventMonth.getMonth() === prev.getMonth();
    return same ? prev : firstEventMonth;
  });
}, [flights, stays, activities, landTravel]);
```

**Dependency array:** `[flights, stays, activities, landTravel]` — the effect re-runs any time the event data changes. After the first non-empty update, subsequent updates are still handled (e.g., if data is paginated or arrives in batches), but `hasNavigated.current` prevents interference once the user has navigated.

**No cleanup needed** — this `useEffect` registers no listeners and creates no subscriptions.

##### 21.4.4 `getInitialMonth()` — Unchanged

The `getInitialMonth(flights, stays, activities, landTravel)` function implemented in T-128 is **correct as-is**. Do not modify its logic. The fix is exclusively in the calling code (the `useEffect` above). If `getInitialMonth` doesn't currently receive `landTravel` as a parameter, add it as an optional fourth argument with a default of `[]` — the function should include `landTravel` departure dates in its search for the earliest event.

---

#### 21.5 States

| State | User Sees |
|-------|-----------|
| **Page loads, data loading** | Calendar shows current month (skeleton loading state in parent; TripCalendar itself shows the current month as placeholder) |
| **Data arrives (first non-empty)** | Calendar automatically slides to first-event month — no user action required |
| **Data arrives but user had already navigated** | Calendar stays on user's chosen month — no override |
| **No events exist** | Calendar stays on current month — no update |
| **User navigates freely** | Normal prev/next/Today navigation — no interference from the auto-init effect |

---

#### 21.6 Visual Design

**No visual changes** to the calendar are introduced by this spec beyond the existing T-128 design. The calendar layout, chip styling, header navigation, and day cells are all unchanged.

---

#### 21.7 Responsive Behavior

The data-arrival `useEffect` runs identically on all viewport sizes. No responsive-specific changes.

---

#### 21.8 Accessibility

No additional accessibility changes. The calendar's keyboard navigation (arrow keys for prev/next, today button) is unchanged. The `hasNavigated` ref is invisible to screen readers.

---

#### 21.9 Test Plan (New Tests)

Add the following tests to `TripCalendar.test.jsx`. All **existing T-128 tests must continue to pass** — the `getInitialMonth()` function is not changed, only the initialization mechanism.

**Test 21.A — Async load: calendar updates when data arrives after mount**
```
Given: TripCalendar renders initially with flights=[], stays=[], activities=[], landTravel=[]
And:   The calendar shows the current month on first render
When:  flights prop updates to [{departure_at: "2026-05-10T...", ...}] (data arrives asynchronously)
Then:  The calendar automatically navigates to May 2026
And:   No user interaction was required
```

**Test 21.B — No override when user navigated before data arrived**
```
Given: TripCalendar renders with empty arrays (current month shown)
When:  User clicks the ">" (next month) arrow
And:   Then flights prop updates to [{departure_at: "2026-05-10T...", ...}]
Then:  The calendar remains on April 2026 (the month user navigated to)
And:   The calendar does NOT jump to May 2026
```

**Test 21.C — No spurious update when data arrives but no events have valid dates**
```
Given: TripCalendar renders with empty arrays
When:  flights updates to [{departure_at: null, ...}] (data present but no valid date)
Then:  getInitialMonth falls back to current month
And:   currentMonth does not unnecessarily re-render (stays at current month)
```

**Test 21.D — Both prev and next clicks set hasNavigated**
```
Given: TripCalendar renders with empty arrays
When:  User clicks "<" (previous month)
And:   Data arrives with May 2026 events
Then:  Calendar remains on the month the user navigated to (not May 2026)
(Variant: same test for ">" click — both must set hasNavigated)
```

---

#### 21.10 Files to Modify (T-146)

| File | Change |
|------|--------|
| `TripCalendar.jsx` (or equivalent) | Add `hasNavigated` ref; set `hasNavigated.current = true` in `handlePrev` and `handleNext`; add data-arrival `useEffect` with `[flights, stays, activities, landTravel]` deps |
| `TripCalendar.test.jsx` (or equivalent) | Add Tests 21.A through 21.D (4 new tests). All existing T-128 tests must still pass. |

**No CSS changes.** No new components. No API changes. No backend changes.

---

*Sprint 14 Spec 21 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-07.*

---

### Spec 22: TripCalendar — "Today" Navigation Button

**Status:** Approved
**Sprint:** 14
**Related Task:** T-147
**Feedback Source:** FB-094
**Published:** 2026-03-07
**Type:** Feature

---

#### 22.1 Overview

The TripCalendar navigation header currently contains only two controls: a `<` (previous month) button and a `>` (next month) button flanking the current month/year heading. Once a user navigates away from the current month — for example, to browse future trip events — there is no quick way to return to today's month.

**Add:** A "Today" button in the calendar header that, when clicked, navigates the calendar to the current month (March 2026 at time of writing) and sets `hasNavigated.current = true` (per Spec 21).

**No new screens, routes, or backend changes.** This spec describes a targeted addition to `TripCalendar` only.

---

#### 22.2 Component Location

**Component:** `TripCalendar.jsx` (same file as Spec 21)
**Test file:** `TripCalendar.test.jsx`

---

#### 22.3 Header Layout

##### 22.3.1 Current Header Structure

```
[ < ]   March 2026   [ > ]
```

The `<` and `>` are icon buttons. The month/year heading is centered text (or a heading element).

##### 22.3.2 Updated Header Structure

```
[ < ]   March 2026   [ > ]   [ today ]
```

The "today" button is placed **to the right of the `>` arrow**, outside the month/year heading area. The header row uses `display: flex; align-items: center; justify-content: space-between` (or equivalent). The "today" button sits at the far right of the navigation row with a small left margin separating it from the `>` arrow.

**Alternative acceptable placement:** Immediately to the right of the `>` button in the same flex group, with `gap: 8px` between `>` and "today". The key requirement is that the button is always visible in the calendar header and does not displace the month/year heading.

---

#### 22.4 Button Specification

| Property | Value |
|----------|-------|
| **Text** | `today` (lowercase, matches Japandi minimal aesthetic) |
| **Element** | `<button>` |
| **`aria-label`** | `"Go to current month"` |
| **Background** | Transparent |
| **Border** | `1px solid rgba(93, 115, 126, 0.4)` (subtle accent border — slightly less prominent than active/focus border) |
| **Border-radius** | `var(--radius-sm)` (2px) |
| **Text color** | `var(--text-muted)` (`rgba(252, 252, 252, 0.5)`) |
| **Font** | IBM Plex Mono, 11px, font-weight 500, letter-spacing 0.05em |
| **Padding** | `4px 10px` |
| **Cursor** | `pointer` |
| **Hover** | Border color: `var(--border-accent)` (`#5D737E`); text color: `var(--text-primary)` (`#FCFCFC`); background: `rgba(93, 115, 126, 0.08)` |
| **Focus-visible** | `outline: 2px solid var(--border-accent); outline-offset: 2px` |
| **Transition** | `all 150ms ease` |
| **Visibility** | Always visible — no conditional show/hide based on current month |
| **CSS class** | `.todayBtn` (added to `TripCalendar.module.css` or inline as a scoped style) |

**Design rationale:** The muted text color and subtle border signal that this is a utility action, secondary to the main prev/next navigation. Hover restores full contrast to confirm interactivity. The lowercase `"today"` label is consistent with the Japandi lowercase/monospace aesthetic used throughout the application (e.g., section headers, button labels).

---

#### 22.5 Click Handler

```jsx
function handleToday() {
  hasNavigated.current = true;  // user intent — disable async auto-init override
  const now = new Date();
  setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
}
```

- Sets `hasNavigated.current = true` **before** calling `setCurrentMonth` — consistent with all other user navigation actions (Spec 21).
- Uses `new Date()` at click time — always reflects the actual current date.
- Sets the day to `1` explicitly to normalize the date (avoids issues with months that have fewer days than the current day).

---

#### 22.6 JSX

```jsx
{/* Calendar header navigation row */}
<div className={styles.calendarNav}>
  <button
    className={styles.navBtn}
    onClick={handlePrev}
    aria-label="Previous month"
  >
    ‹
  </button>

  <span className={styles.monthHeading} aria-live="polite">
    {format(currentMonth, 'MMMM yyyy')}  {/* or equivalent date formatting */}
  </span>

  <button
    className={styles.navBtn}
    onClick={handleNext}
    aria-label="Next month"
  >
    ›
  </button>

  {/* NEW: Today button */}
  <button
    className={styles.todayBtn}
    onClick={handleToday}
    aria-label="Go to current month"
  >
    today
  </button>
</div>
```

The `‹` and `›` glyphs (or `<` / `>` or SVG arrows) are whatever the existing implementation uses — do not change the existing arrow buttons. Only add the "today" button.

---

#### 22.7 CSS

Add to `TripCalendar.module.css` (or equivalent):

```css
/* ── Today Button ── */
.todayBtn {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid rgba(93, 115, 126, 0.4);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  cursor: pointer;
  transition: all 150ms ease;
  margin-left: 8px;   /* small separation from the ">" arrow */
  flex-shrink: 0;
  white-space: nowrap;
}

.todayBtn:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
  background: rgba(93, 115, 126, 0.08);
}

.todayBtn:focus-visible {
  outline: 2px solid var(--border-accent);
  outline-offset: 2px;
}

/* Responsive: on mobile, reduce padding slightly */
@media (max-width: 640px) {
  .todayBtn {
    font-size: 10px;
    padding: 3px 8px;
    margin-left: 6px;
  }
}
```

---

#### 22.8 States

| State | Today Button Appearance |
|-------|------------------------|
| **Default (any month)** | Visible, subtle border, muted text |
| **Viewing current month** | Still visible — no change. Button behavior is idempotent (clicking while on current month is a no-op visually). |
| **Hover** | Accent border, full-brightness text, subtle bg tint |
| **Focus (keyboard)** | Accent `outline` ring, 2px offset |
| **Click** | Calendar navigates to current month. No loading state (state update is synchronous). |

---

#### 22.9 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (≥ 768px)** | Full button with `today` label, 11px font, `4px 10px` padding |
| **Mobile (< 640px)** | Reduced padding (`3px 8px`), slightly smaller font (10px), same label. The calendar header should use `flex-wrap: wrap` if the nav row gets too narrow, but `today` should remain on the same row as the arrows on typical mobile widths (320px+) |

---

#### 22.10 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Button semantics** | Native `<button>` element — keyboard-focusable, activated by Enter and Space |
| **Descriptive label** | `aria-label="Go to current month"` — explains the action beyond the visible `"today"` text |
| **Focus ring** | `:focus-visible` outline with `--border-accent` color, 2px offset — meets WCAG focus indicator contrast requirement |
| **Screen reader announcement** | When the month changes after clicking Today, `aria-live="polite"` on the month heading (if present) announces the new month name automatically |
| **Color contrast** | `var(--text-muted)` (`rgba(252,252,252,0.5)`) on transparent over `--bg-primary` (`#02111B`) — meets WCAG AA at 11px bold for informational UI (button is also reachable via keyboard so color contrast for state communication is supplemented by other cues) |
| **No motion** | The calendar month change is instantaneous state update with no animation. No `prefers-reduced-motion` changes needed. |

---

#### 22.11 Test Plan (New Tests)

Add the following tests to `TripCalendar.test.jsx`. All **existing TripCalendar tests must pass** — no regressions.

**Test 22.A — Clicking "Today" returns to current month**
```
Given: TripCalendar is rendered
When:  User navigates to a future month (e.g., May 2026) via the ">" arrow
And:   User clicks the "today" button
Then:  The calendar navigates to the current month (March 2026)
And:   The month heading updates to "March 2026" (or equivalent)
```

**Test 22.B — "Today" button is visible when viewing a past month**
```
Given: TripCalendar is rendered with currentMonth = January 2026 (a past month)
Then:  A button with aria-label "Go to current month" (or text "today") is visible in the DOM
```

**Test 22.C — "Today" button is visible when viewing a future month**
```
Given: TripCalendar is rendered with currentMonth = December 2027 (a future month)
Then:  A button with aria-label "Go to current month" (or text "today") is visible in the DOM
```

**Test 22.D — Prev/next navigation continues to work after clicking Today**
```
Given: TripCalendar is rendered
When:  User navigates to May 2026 via ">"
And:   User clicks "today" (returns to March 2026)
And:   User clicks ">" once more
Then:  Calendar shows April 2026 (prev/next navigation is not broken by Today click)
```

---

#### 22.12 Interaction with Spec 21 (hasNavigated)

The "Today" button click **must** set `hasNavigated.current = true` (via the `handleToday` handler shown in 22.5). This ensures:

- After clicking "Today", if event data then arrives (or updates), the calendar will **not** be automatically re-initialized to the first-event month.
- The user clicked "Today" intentionally — their intent overrides the auto-initialization.

This is consistent with how prev/next navigation interacts with the async auto-init (Spec 21).

---

#### 22.13 Files to Modify (T-147)

| File | Change |
|------|--------|
| `TripCalendar.jsx` (or equivalent) | Add `handleToday` function (sets `hasNavigated.current = true`, calls `setCurrentMonth` to current month); add `<button className={styles.todayBtn} onClick={handleToday} aria-label="Go to current month">today</button>` to calendar nav header |
| `TripCalendar.module.css` (or equivalent) | Add `.todayBtn` CSS rule and responsive variant |
| `TripCalendar.test.jsx` (or equivalent) | Add Tests 22.A through 22.D (4 new tests). All existing tests must still pass. |

**No API changes.** No backend changes. No new routes. No new components.

---

*Sprint 14 Spec 22 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-07.*

---

## Sprint 15 Specs

---

### Spec 23: Calendar Land Travel Chip — Corrected Location Display (Sprint 15)

**Sprint:** #15
**Related Task:** T-155 (Bug Fix — FB-098)
**Status:** Approved
**Priority:** P1

---

#### 23.1 Overview

This spec is a **behavioral correction** to the existing calendar land travel chip rendering described in Spec 20 (Sprint 13, T-138). No new screen or component is introduced. The fix corrects which location string is shown on the pick-up day chip vs. the drop-off day chip for land travel calendar entries.

**Bug (FB-098):** Both the pick-up day chip and the drop-off day chip currently display `to_location` (the destination). The pick-up chip should instead display `from_location` (the origin).

**Correct Behavior:**

| Calendar Day | Chip Label Prefix | Location Displayed |
|---|---|---|
| Pick-up / departure day | `"pick-up"` (RENTAL_CAR only) or none (other modes) | `from_location` — the origin/pick-up location |
| Drop-off / arrival day | `"drop-off"` (RENTAL_CAR only) or none (other modes) | `to_location` — the destination/drop-off location |

---

#### 23.2 Chip Anatomy (Pick-up Day)

```
┌──────────────────────────────────────────────┐
│  [mode icon]  <prefix> <time> · <from_loc>   │
└──────────────────────────────────────────────┘
```

- **Prefix:** `"pick-up"` for RENTAL_CAR mode; absent for FLIGHT, BUS, TRAIN, FERRY, OTHER
- **Time:** Departure time formatted in departure timezone (e.g., `"9a"` or `"9:30a"`)
- **Location:** `from_location` — the origin city/airport/address

**Example (RENTAL_CAR):** `pick-up 9a · LAX Airport`
**Example (FLIGHT):** `9a · JFK Airport`

---

#### 23.3 Chip Anatomy (Drop-off Day)

```
┌──────────────────────────────────────────────┐
│  [mode icon]  <prefix> <time> · <to_loc>     │
└──────────────────────────────────────────────┘
```

- **Prefix:** `"drop-off"` for RENTAL_CAR mode; absent for FLIGHT, BUS, TRAIN, FERRY, OTHER
- **Time:** Arrival time formatted in arrival timezone (e.g., `"2p"` or `"2:30p"`)
- **Location:** `to_location` — the destination city/airport/address

**Example (RENTAL_CAR):** `drop-off 2p · SFO Airport`
**Example (FLIGHT):** `2p · SFO Airport`

---

#### 23.4 Same-Day Travel Edge Case

When a land travel entry departs and arrives on the **same calendar day**, only a single chip is shown — the **pick-up chip** (departure view), displaying `from_location`. The `_isArrival` flag is `false` for this chip.

| Condition | Chip Shown | Location |
|---|---|---|
| Departure day ≠ Arrival day | Pick-up chip on departure day | `from_location` |
| Departure day ≠ Arrival day | Drop-off chip on arrival day | `to_location` |
| Departure day = Arrival day | Single chip (pick-up) | `from_location` |

---

#### 23.5 DayPopover Consistency

The DayPopover overlay ("+X more" expanded view) must render the same location text as the DayCell chip. The `getEventTime` helper or equivalent logic in `DayPopover` must use the same `_isArrival` flag to select `from_location` (departure) vs. `to_location` (arrival).

---

#### 23.6 Visual Appearance

No visual style changes. Only the text content of the location portion of the chip changes. The chip styling (font size, color, padding, truncation) remains exactly as defined in Spec 20.

| Element | Value |
|---|---|
| Chip background | `rgba(93, 115, 126, 0.15)` (land travel) |
| Chip text color | `var(--accent)` (`#5D737E`) |
| Chip font size | 10px |
| Chip padding | `2px 6px` |
| Location text truncation | `text-overflow: ellipsis; overflow: hidden; white-space: nowrap` — same as existing |
| Max chip width | Constrained to day cell width; location string is truncated with `…` if too long |

---

#### 23.7 Overflow Behavior (DayCell — "+X more")

When a day cell has more events than fit in the cell height, the chip count shown vs. hidden follows existing overflow logic. Land travel chips with corrected location text participate in overflow the same as before — this fix has no impact on overflow behavior.

---

#### 23.8 States

| State | Behavior |
|---|---|
| **`from_location` is null / empty string** | Display an empty location segment or omit the ` · ` separator entirely. Do not render `"null"` or `"undefined"` as text. |
| **`to_location` is null / empty string** | Same as above — omit ` · ` and location segment gracefully. |
| **Both locations provided** | Render `· <location>` after the time string |
| **RENTAL_CAR mode** | Prepend `"pick-up"` / `"drop-off"` prefix before the time (existing T-138 behavior, unchanged) |
| **Non-RENTAL_CAR mode** | No prefix; time directly followed by location |

---

#### 23.9 Accessible Labels

When the chip renders in `DayCell` or `DayPopover`, the accessible text (via `title` attribute or `aria-label` on the chip container) should reflect the corrected location:

- Pick-up chip: `aria-label="Land travel: departs <from_location> at <time>"`
- Drop-off chip: `aria-label="Land travel: arrives <to_location> at <time>"`

If no accessible label currently exists on these chips, adding it is **strongly recommended** but may be deferred to Sprint 16 if it would block the primary fix.

---

#### 23.10 Implementation Guidance

> **Note to Frontend Engineer:** This section records the design intent for the data model change. Implementation follows the approach described in T-155.

The `buildEventsMap` function builds the list of calendar events for each day. For land travel entries:

1. **Departure-day event:** Set `_location = lt.from_location` on the event object. The `_isArrival` flag is `false` (or absent).
2. **Arrival-day event:** Set `_location = lt.to_location` on the event object. The `_isArrival` flag is `true`.

Both `DayCell` (chip rendering) and `DayPopover` (expanded view) must read `event._location` (not re-derive it from `lt.from_location` or `lt.to_location` directly). This ensures a single source of truth for which location to display.

---

#### 23.11 Test Plan (New Tests — T-155)

Add the following tests to `TripCalendar.test.jsx` (or equivalent land travel chip test file). All **400+ existing tests must pass** — no regressions.

**Test 23.A — Pick-up day chip shows `from_location`**
```
Given: A land travel entry with from_location = "LAX Airport" and to_location = "SFO Airport"
And:   The pick-up date is 2026-08-07, the drop-off date is 2026-08-08
When:  The calendar renders the week containing August 7
Then:  The chip on August 7 shows "LAX Airport" (not "SFO Airport")
```

**Test 23.B — Drop-off day chip shows `to_location`**
```
Given: The same land travel entry as Test 23.A
When:  The calendar renders the week containing August 8
Then:  The chip on August 8 shows "SFO Airport" (not "LAX Airport")
```

**Test 23.C — Same-day travel shows `from_location` only**
```
Given: A land travel entry where pick-up date = drop-off date = 2026-08-07
And:   from_location = "Chicago O'Hare" and to_location = "Midway"
When:  The calendar renders August 7
Then:  Only one chip is visible on August 7, showing "Chicago O'Hare"
And:   "Midway" does not appear on August 7
```

**Test 23.D — RENTAL_CAR label prefixes still present**
```
Given: A RENTAL_CAR land travel entry with from_location = "Hertz LAX" and to_location = "Hertz SFO"
When:  The calendar renders the pick-up day
Then:  The chip text contains "pick-up" AND "Hertz LAX"
When:  The calendar renders the drop-off day
Then:  The chip text contains "drop-off" AND "Hertz SFO"
```

---

#### 23.12 Regression Checklist

Before marking T-155 Done, the Frontend Engineer must verify:

| Check | Expected |
|---|---|
| T-138 rental car label prefixes ("pick-up", "drop-off") | Still present — not removed by this change |
| T-137 DayPopover stay-open on scroll | Unaffected — no DayPopover structural changes |
| T-146 calendar first-event-month | Unaffected — no `buildEventsMap` month logic changes |
| T-147 "Today" button | Unaffected — no navigation changes |
| Non-land-travel chips (flights, stays, activities) | Unaffected — only land travel event objects change |

---

#### 23.13 Files to Modify (T-155)

| File | Change |
|---|---|
| `TripCalendar.jsx` (or equivalent) | In `buildEventsMap`: set `_location = lt.from_location` on departure-day events; set `_location = lt.to_location` on arrival-day events |
| `DayCell.jsx` (or equivalent) | Use `ev._location` for chip location text instead of re-reading from the raw land travel object |
| `DayPopover.jsx` (or equivalent) | In `getEventTime` (or equivalent): use `ev._location` for the expanded chip location text |
| `TripCalendar.test.jsx` (or equivalent) | Add Tests 23.A through 23.D (4 new tests) |

**No API changes.** No backend changes. No new routes. No schema changes. No style changes.

---

### Spec 24: Browser Tab Title + Favicon (Sprint 15)

**Sprint:** #15
**Related Task:** T-154 (Bug Fix — FB-096, FB-097)
**Status:** Approved
**Priority:** P3

---

#### 24.1 Overview

This is a **trivial HTML-only fix** to `frontend/index.html`. No component, no logic, no test, no style change. Two changes to the `<head>` element:

1. **Page title:** Change `<title>App</title>` → `<title>triplanner</title>`
2. **Favicon link:** Add `<link rel="icon" type="image/png" href="/favicon.png">` inside `<head>` (the file `frontend/public/favicon.png` already exists)

---

#### 24.2 Expected Result

| Element | Before | After |
|---|---|---|
| Browser tab title | `App` | `triplanner` |
| Browser tab icon | Default browser globe/icon | `favicon.png` (existing file) |

---

#### 24.3 Design Rationale

The title `"triplanner"` matches the lowercase Japandi-aesthetic brand voice used throughout the UI (e.g., the `TRIPLANNER` brand mark in auth screens, the lowercase button labels). All lowercase is intentional and consistent with the design system.

---

#### 24.4 No Spec Further Required

This change requires no screen diagram, no user flow, and no component specification. The active-sprint.md task description (T-154) contains the complete implementation instructions.

---

#### 24.5 Verification

The Frontend Engineer should verify via `npm run build` + `npm run preview`:
- Browser tab text reads `"triplanner"` (not `"App"`, not `"Triplanner"`)
- Browser tab displays the favicon PNG icon (not the default browser icon)

---

*Sprint 15 Specs 23 and 24 marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-07.*

---

### Spec 25: Trip Date Range Display on Home Page Cards (Sprint 16 — T-164)

**Sprint:** #16
**Related Task:** T-164 (Frontend), T-161 (Design), T-163 (Backend)
**Status:** Approved
**Priority:** P1

---

#### 25.1 Overview

This spec defines the UI for displaying a computed trip date range on each trip card on the home page. The date range is derived from the backend-computed `start_date` and `end_date` fields (YYYY-MM-DD format), which represent the MIN and MAX dates across all events in a trip (flights, stays, activities, and land travels). When no events exist, the card displays "No dates yet" in dimmed muted text.

This closes B-006 — the "timeline of the trip" requirement from the project brief that has been deferred since Sprint 1.

**Source fields (from API):**
- `trip.start_date` — YYYY-MM-DD string or `null` (MIN of all event dates, computed by backend)
- `trip.end_date` — YYYY-MM-DD string or `null` (MAX of all event dates, computed by backend)

**No timezone conversion.** Dates are calendar-local (YYYY-MM-DD). Parse and render as-is without UTC offset adjustments.

---

#### 25.2 Updated TripCard Layout

The TripCard layout remains as currently implemented. The date range row is the final element inside the normal card content area, below the horizontal divider.

**Vertical stacking order (top → bottom):**

```
┌─────────────────────────────────────────────────┐
│  [STATUS BADGE]                    [DELETE ICON] │  ← top row
│                                                  │
│  Trip Name                                       │  ← tripName (16px, 500)
│                                                  │
│  🗺 Destination, Another City                    │  ← destinations (12px muted)
│                                                  │
│  Notes preview (first 100 chars)…                │  ← notesPreview (11px muted, if present)
│                                                  │
│  ─────────────────────────────────────────────  │  ← divider (1px subtle border)
│                                                  │
│  🗓  May 1 – 15, 2026                            │  ← timeline row (11px muted)
└─────────────────────────────────────────────────┘
```

The `timeline` row (calendar icon + date range text) already exists in `TripCard.jsx` and `TripCard.module.css`. **Do not restructure the card.** Only update the text content and the formatting function.

---

#### 25.3 `formatDateRange(startDate, endDate)` — Function Specification

Add or update the `formatDateRange(startDate, endDate)` export in `frontend/src/utils/formatDate.js`.

**Signature:**
```js
/**
 * Format a trip date range from YYYY-MM-DD start_date and end_date fields.
 * Returns a formatted string or null if no dates are set.
 *
 * @param {string|null} startDate - YYYY-MM-DD
 * @param {string|null} endDate   - YYYY-MM-DD
 * @returns {string|null}
 */
export function formatDateRange(startDate, endDate) { ... }
```

**Parsing rule:** Parse each date string by splitting on `-` and using `new Date(year, month - 1, day)` (local date, no UTC). Never pass YYYY-MM-DD directly to `new Date(str)` — that triggers UTC interpretation and causes off-by-one-day bugs on users behind UTC.

**Output rules (all cases):**

| Input | Output |
|-------|--------|
| `null`, `null` | `null` |
| `"2026-05-01"`, `null` | `"From May 1, 2026"` |
| `"2026-05-01"`, `"2026-05-15"` (same month, same year) | `"May 1 – 15, 2026"` |
| `"2026-08-07"`, `"2026-09-02"` (different months, same year) | `"Aug 7 – Sep 2, 2026"` |
| `"2025-12-28"`, `"2026-01-03"` (cross-year) | `"Dec 28, 2025 – Jan 3, 2026"` |

**Formatting rules in detail:**

1. **Both null → return `null`** (the TripCard will render "No dates yet")

2. **Start only (endDate is null) → `"From {Mon} {D}, {YYYY}"`**
   - Example: `"2026-05-01"` → `"From May 1, 2026"`

3. **Same year, same month → `"{Mon} {D_start} – {D_end}, {YYYY}"`**
   - Month name appears once, at the start. End date shows day number only.
   - Example: `"2026-05-01"` + `"2026-05-15"` → `"May 1 – 15, 2026"`

4. **Same year, different months → `"{Mon} {D_start} – {Mon} {D_end}, {YYYY}"`**
   - Year appears once at the end.
   - Example: `"2026-08-07"` + `"2026-09-02"` → `"Aug 7 – Sep 2, 2026"`

5. **Cross-year → `"{Mon} {D_start}, {YYYY_start} – {Mon} {D_end}, {YYYY_end}"`**
   - Both year values are shown.
   - Example: `"2025-12-28"` + `"2026-01-03"` → `"Dec 28, 2025 – Jan 3, 2026"`

**Month abbreviations (3-letter, en-US):**
`Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec`

**Separator:** En-dash with spaces: ` – ` (Unicode U+2013, not a hyphen, not an em-dash)

**Note:** The existing `formatTripDateRange` function in `formatDate.js` handles cases 1, 2, 4, and 5 but does NOT handle the same-month abbreviation (case 3). The existing `formatDateRange` function operates on ISO datetime strings, not YYYY-MM-DD. The Frontend Engineer should update `formatDateRange` to replace its current ISO-string behavior with the YYYY-MM-DD behavior described in this spec, and update `TripCard.jsx` to call `formatDateRange` (instead of `formatTripDateRange`). If renaming creates import issues in existing tests, both functions can be kept and the old one deprecated.

---

#### 25.4 TripCard Component — Required Changes

**File:** `frontend/src/components/TripCard.jsx`

**Change 1 — Import update:**
Change the import from `formatTripDateRange` to `formatDateRange`:
```js
// Before
import { formatTripDateRange } from '../utils/formatDate';

// After
import { formatDateRange } from '../utils/formatDate';
```

**Change 2 — Date range computation:**
```js
// Before
const dateRange = formatTripDateRange(trip.start_date, trip.end_date);

// After
const dateRange = formatDateRange(trip.start_date, trip.end_date);
```

**Change 3 — Empty state text:**
The empty state label must read **"No dates yet"** (not "dates not set"):
```jsx
{/* Before */}
<span className={styles.datesNotSet}>dates not set</span>

{/* After */}
<span className={styles.datesNotSet}>No dates yet</span>
```

All other card markup remains unchanged.

---

#### 25.5 Styling

**Timeline row (existing `.timeline` class — no changes needed):**
```css
.timeline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);   /* rgba(252, 252, 252, 0.5) */
}
```

**Date set state:** The formatted date string is a plain `<span>` inheriting the `.timeline` color (`var(--text-muted)`). No additional styling.

**Empty state (`.datesNotSet` — existing class):**
```css
.datesNotSet {
  color: var(--text-muted);
  opacity: 0.5;   /* further dimmed vs the formatted date text */
}
```
The empty state is visually dimmer than actual dates to signal that it is placeholder text, not real data.

**Calendar icon (existing SVG):** 12×12px, `stroke="currentColor"` inherits the `.timeline` muted color. No changes.

**No new CSS classes are required.**

---

#### 25.6 States

**State A — Dates populated (normal):**
- `trip.start_date` and `trip.end_date` are both non-null YYYY-MM-DD strings
- `formatDateRange` returns a formatted string (e.g., `"May 1 – 15, 2026"`)
- The timeline row renders: `[calendar icon]  May 1 – 15, 2026`
- Text color: `var(--text-muted)` (rgba 252,252,252 at 50% opacity)

**State B — Start date only (end date null):**
- `trip.start_date` is set; `trip.end_date` is null
- `formatDateRange` returns `"From May 1, 2026"`
- The timeline row renders: `[calendar icon]  From May 1, 2026`
- Text color: `var(--text-muted)`

**State C — No dates (both null — "No dates yet"):**
- Both `trip.start_date` and `trip.end_date` are null
- `formatDateRange` returns `null`
- The timeline row renders: `[calendar icon]  No dates yet`
- The text `"No dates yet"` uses class `.datesNotSet` (further dimmed: `var(--text-muted)` at opacity 0.5)
- This occurs when a trip has been created but no events (flights/stays/activities/land travels) have been added yet

**State D — Card loading (skeleton):**
- The `TripCardSkeleton` component already renders a `.skeletonTimeline` shimmer bar in place of the timeline row
- No changes required to the skeleton

**State E — Delete confirmation overlay:**
- When `confirmDelete` is true, the entire card content (including the timeline row) is replaced by the inline delete confirmation UI
- The date range is not visible during delete confirmation
- No changes required to delete confirmation flow

---

#### 25.7 User Flow

1. User is logged in and navigates to the home page (`/`)
2. The app fetches `GET /trips` — response now includes `start_date` and `end_date` per trip object
3. Each `TripCard` renders with the timeline row showing one of:
   - A formatted date range string if events exist
   - "No dates yet" if no events exist
4. User scans the home page and can immediately see the trip duration at a glance without opening the trip
5. User adds a new event to a trip (e.g., a flight) via the Trip Details page
6. User returns to the home page
7. The trip card now shows the correct date range reflecting the newly added event
8. If a user deletes all events from a trip, the card reverts to "No dates yet"

---

#### 25.8 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥1024px) | Cards in a multi-column grid. Timeline row spans the full card width. Date range text truncates with ellipsis if the card is narrower than the text (unlikely for typical date ranges). |
| Tablet (768–1023px) | Same grid, narrower columns. Date range text is short enough (max ~26 chars for cross-year format) to fit comfortably at 11px monospace. |
| Mobile (<768px) | Single-column cards. Full card width. No wrapping issues expected at 11px. |

**No responsive changes required.** The existing `.timeline` flexbox row handles all breakpoints correctly.

---

#### 25.9 Accessibility

- The timeline row is a `<div>` with `display: flex`. The calendar icon SVG has `aria-hidden="true"` (already present — the icon is decorative).
- The date range text (or "No dates yet") is a plain `<span>` — readable by screen readers as inline text.
- The full card has `aria-label="Trip: {trip.name}"` (already present). The date range is read as part of the card's content flow.
- Color contrast: `var(--text-muted)` (rgba 252,252,252,0.5) on `--surface` (#30292F) gives approximately 5.5:1 contrast ratio — meets WCAG AA for 11px text with `font-weight: 400`. The `.datesNotSet` style at opacity 0.5 on top reduces contrast to approximately 2.7:1 — acceptable for placeholder/decorative secondary text that conveys no critical information.
- No keyboard interaction changes — the timeline row is not interactive.

---

#### 25.10 Tests Required (T-164)

The Frontend Engineer must add or update tests in the TripCard test file:

**Test 25.A — Same-year, same-month date range:**
```
Given: trip.start_date = "2026-05-01", trip.end_date = "2026-05-15"
When:  TripCard renders
Then:  The timeline row shows "May 1 – 15, 2026"
And:   The text is NOT "May 1 – May 15, 2026" (no repeated month)
```

**Test 25.B — Same-year, cross-month date range:**
```
Given: trip.start_date = "2026-08-07", trip.end_date = "2026-09-02"
When:  TripCard renders
Then:  The timeline row shows "Aug 7 – Sep 2, 2026"
```

**Test 25.C — Cross-year date range:**
```
Given: trip.start_date = "2025-12-28", trip.end_date = "2026-01-03"
When:  TripCard renders
Then:  The timeline row shows "Dec 28, 2025 – Jan 3, 2026"
```

**Test 25.D — Both dates null (empty state):**
```
Given: trip.start_date = null, trip.end_date = null
When:  TripCard renders
Then:  The timeline row shows "No dates yet"
And:   The text does NOT show "dates not set"
And:   The "No dates yet" span has the datesNotSet CSS class
```

**Test 25.E — Start date only (no end date):**
```
Given: trip.start_date = "2026-05-01", trip.end_date = null
When:  TripCard renders
Then:  The timeline row shows "From May 1, 2026"
```

**Test 25.F — formatDateRange unit tests:**
In `formatDate.test.js` (or equivalent), add unit tests for `formatDateRange`:
```
formatDateRange(null, null)         → null
formatDateRange("2026-05-01", null) → "From May 1, 2026"
formatDateRange("2026-05-01", "2026-05-15") → "May 1 – 15, 2026"
formatDateRange("2026-08-07", "2026-09-02") → "Aug 7 – Sep 2, 2026"
formatDateRange("2025-12-28", "2026-01-03") → "Dec 28, 2025 – Jan 3, 2026"
```

**Regression:** All existing TripCard tests must continue to pass.

---

#### 25.11 Files to Modify (T-164)

| File | Change |
|------|--------|
| `frontend/src/utils/formatDate.js` | Update `formatDateRange(startDate, endDate)` to accept YYYY-MM-DD strings and implement all 5 output cases from §25.3. Keep `formatTripDateRange` if it is used elsewhere; otherwise it can be removed after confirming no other imports. |
| `frontend/src/components/TripCard.jsx` | Update import to use `formatDateRange`; call `formatDateRange(trip.start_date, trip.end_date)`; change empty state text from "dates not set" to "No dates yet". |
| `frontend/src/__tests__/TripCard.test.jsx` | Add Tests 25.A through 25.E. |
| `frontend/src/__tests__/formatDate.test.js` (or equivalent) | Add Test 25.F unit tests for `formatDateRange`. |

**No backend changes.** No new API endpoints. No schema migration. No CSS changes. No new components.

---

#### 25.12 Design Rationale

- **Placement in timeline row (below divider):** The date range is metadata, not a primary card descriptor. Placing it in the footer of the card (below the divider) keeps the trip name and destinations visually dominant while making the timeline scannable without cluttering the main content area.
- **Same-month abbreviation ("May 1 – 15, 2026"):** Avoids redundancy. Repeating "May" twice ("May 1 – May 15, 2026") adds no information and increases visual noise in a compact 11px monospace row.
- **"No dates yet" vs "dates not set":** "No dates yet" is more friendly and accurately implies the state is temporary — dates will appear once events are added. "dates not set" feels like a configuration option that requires manual action.
- **Muted secondary color:** The date range is supporting information. Using `var(--text-muted)` instead of `--text-primary` maintains the Japandi hierarchy: trip name reads first, destinations second, metadata third.
- **11px monospace font (IBM Plex Mono):** Consistent with the existing timeline row. The monospace spacing gives date ranges a structured, tabular feel appropriate for a planning app.

---

### Spec 17: Trip Print / Export View

**Sprint:** #17
**Related Task:** T-171 → T-172
**Status:** Approved

**Description:**
A print-optimized layout of the full trip itinerary, triggered by a "Print itinerary" button in the trip details page header. When the user clicks the button, the browser's native print dialog opens. The print output is a clean, black-on-white, single-column document that a planner-type user can read offline, attach to a PDF, or hand to a travel companion. No new page or route is introduced — the feature is implemented entirely via CSS `@media print` rules in `frontend/src/styles/print.css`, imported into `TripDetailsPage.jsx`. The interactive on-screen UI is unchanged; the print stylesheet simply overrides it for print output.

**Target User Context:**
Detail-oriented planners who like to have every hour of their trip documented. The print view is their paper backup — they want every flight number, every hotel address, every activity name, in chronological order, readable at a glance without a screen.

---

#### 17.1 Print Trigger — "Print itinerary" Button

**Location:** Trip details page header, inline with the trip name row. Positioned to the right of the trip name / destination heading block, at the same vertical level as any existing edit or action controls (rightmost element in the header row).

**Appearance (on-screen, normal view):**
- Style: secondary button pattern (transparent background, border, IBM Plex Mono text)
- Label: `Print itinerary`
- Icon (optional): a small printer icon (16×16px SVG) to the left of the text label; purely decorative (`aria-hidden="true"` if icon is included)
- Border: `1px solid rgba(93, 115, 126, 0.5)` (`--border-subtle`)
- Text color: `--text-primary` (`#FCFCFC`)
- Font: IBM Plex Mono, 12px, font-weight 400
- Padding: 8px 16px
- Border-radius: `var(--radius-sm)` (2px)
- Hover state: background `rgba(252, 252, 252, 0.05)`, border `rgba(93, 115, 126, 0.8)`, transition 150ms ease
- Cursor: pointer
- `aria-label="Print itinerary"`

**Behavior:**
```
onClick={() => window.print()}
```
No loading state. No async logic. The button simply invokes the browser's built-in print dialog. Errors (e.g., user cancels the dialog) require no handling — the browser manages the dialog lifecycle.

**In the print output:** The button is hidden (see §17.4 — Elements Hidden in Print).

---

#### 17.2 Print Layout — Overall Structure

The printed document is a **single-column, linear document** reading top-to-bottom. There is no sidebar, no grid, no calendar. All elements use black text on a white background. The layout mimics a clean, well-formatted travel itinerary document.

**Page setup:**
```css
@media print {
  @page {
    margin: 1.5cm 2cm;
    size: A4 portrait;
  }
}
```

**Content width in print:** Full page width (no max-width container constraining content to 1120px — the print layout uses the full printable area).

**Document sections, in order:**

1. **Trip header block** — trip name, destinations, date range
2. **Flights section** — all flights in chronological order (omitted if no flights)
3. **Stays section** — all stays in chronological order (omitted if no stays)
4. **Activities section** — activities grouped by day, sorted by start time within each day (omitted if no activities)
5. **Land Travel section** — all land travel entries in chronological order (omitted if no land travel)

Each section is separated by a visible horizontal rule (1px solid #ccc) and a section heading.

---

#### 17.3 Print Layout — Document Sections

##### 17.3.1 Trip Header Block

Rendered at the very top of the print output, before any event sections.

```
[TRIP NAME]                    (24pt, bold, IBM Plex Mono, #000)
[Destination list]             (13pt, #000, comma-separated)
[Date range]                   (11pt, #555, "May 1 – 12, 2026" or "No dates yet")
─────────────────────────────  (1px solid #ccc, full width, margin 16pt 0)
```

- **Trip name:** `font-size: 24pt; font-weight: 700; color: #000; margin-bottom: 6pt;`
- **Destinations:** `font-size: 13pt; font-weight: 400; color: #000; margin-bottom: 4pt;`
- **Date range:** `font-size: 11pt; font-weight: 400; color: #555; margin-bottom: 0;` — formatted the same as the on-screen date range (e.g., "May 1 – 12, 2026"). If both dates are null, shows "No dates yet".
- The horizontal rule below the header block separates the header from the first event section.

##### 17.3.2 Section Heading Style (shared by all event sections)

Each event section (Flights, Stays, Activities, Land Travel) starts with a heading:
```
FLIGHTS                        (10pt, font-weight 700, letter-spacing 0.15em, #000, uppercase)
─────────────────────────────  (0.5pt solid #ccc, full width, margin 4pt 0 10pt)
```
- `font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #000; margin-bottom: 4pt;`
- Followed by a subtle rule (`border-bottom: 0.5pt solid #ccc; margin-bottom: 10pt;`)

##### 17.3.3 Flights Section

If the trip has **no flights**, this section is **omitted entirely** — no heading, no rule, no empty state message.

If flights exist, list each flight in a card block, sorted by departure datetime ascending.

**Each flight card (print):**
```
┌─────────────────────────────────────────────────────────┐
│  [Airline] — [Flight Number]                             │
│  [Departure Airport] → [Arrival Airport]                 │
│  Departs: [date] at [time] [TZ abbreviation]             │
│  Arrives: [date] at [time] [TZ abbreviation]             │
└─────────────────────────────────────────────────────────┘
```

**Card styling (print):**
- Border: `1pt solid #ccc`
- Border-radius: 0 (print does not render border-radius reliably; omit)
- Padding: `10pt 12pt`
- Margin-bottom: `8pt`
- Background: `#fff`
- `page-break-inside: avoid`

**Field layout within a flight card:**
- **Line 1:** Airline + flight number — `font-size: 12pt; font-weight: 600; color: #000;`
- **Line 2:** Route — `[from_location] → [to_location]` — `font-size: 11pt; color: #000;`
- **Line 3:** Departs — `font-size: 10pt; color: #333;` — format: `"Departs: Mon, Aug 7, 2026 at 6:00 AM ET"`
- **Line 4:** Arrives — `font-size: 10pt; color: #333;` — format: `"Arrives: Mon, Aug 7, 2026 at 11:00 AM PT"`

Use the existing `formatFlightDateTime` utility (or equivalent) to produce the full date + time + timezone string. For print, the timezone abbreviation must be present (not just the time) because the reader has no tooltip.

##### 17.3.4 Stays Section

If the trip has **no stays**, this section is **omitted entirely**.

If stays exist, list each stay card, sorted by check-in datetime ascending.

**Each stay card (print):**
```
┌─────────────────────────────────────────────────────────┐
│  [CATEGORY]  [Stay Name]                                 │
│  [Address or "Address not provided"]                     │
│  Check in:  [date] at [time] [TZ abbreviation]           │
│  Check out: [date] at [time] [TZ abbreviation]           │
└─────────────────────────────────────────────────────────┘
```

**Card styling (print):** Same as flight card — `1pt solid #ccc`, padding `10pt 12pt`, margin-bottom `8pt`, `page-break-inside: avoid`, background `#fff`.

**Field layout:**
- **Line 1:** Category badge text + stay name — Category in uppercase, 9pt, color `#555`, followed by stay name in 12pt, font-weight 600, `#000`. (On-screen colored category badges become plain uppercase text in print — no background colors.)
- **Line 2:** Address — 10pt, `#333`. If address is blank/null, display: `"Address not provided"` in 10pt, `#999`.
- **Line 3:** Check in — `"Check in: Mon, Aug 7, 2026 at 4:00 PM"` — 10pt, `#333`.
- **Line 4:** Check out — `"Check out: Wed, Aug 9, 2026 at 11:00 AM"` — 10pt, `#333`.

Note: Timezone display for stays follows the same rule as flights — show timezone abbreviation if stored.

##### 17.3.5 Activities Section

If the trip has **no activities**, this section is **omitted entirely**.

If activities exist, group by `activity_date`, sorted ascending. Within each day group, sort activities by `start_time` ascending.

**Day group heading:**
```
Friday, August 8, 2026         (12pt, font-weight 600, #000, margin-top 10pt, margin-bottom 6pt)
```
- Format: `EEEE, MMMM D, YYYY` — use the same `formatActivityDate` utility as on-screen.
- `page-break-before: avoid` on the day heading to prevent it orphaning at the bottom of a page.

**Each activity card (print):**
```
┌─────────────────────────────────────────────────────────┐
│  9:00 AM – 2:00 PM  ·  Fisherman's Wharf                │
│  Location: Fisherman's Wharf, San Francisco, CA          │
└─────────────────────────────────────────────────────────┘
```

**Card styling:** Lighter border — `1pt solid #ddd`, padding `8pt 12pt`, margin-bottom `4pt`, background `#fff`, `page-break-inside: avoid`.

**Field layout:**
- **Line 1:** Time range + activity name — `"[start_time] – [end_time]  ·  [activity name]"` — 11pt, font-weight 500, `#000`. Time format: `"9:00 AM"` (12-hour with AM/PM).
- **Line 2 (conditional):** Location — `"Location: [location]"` — 10pt, `#555`. Omit this line if `location` is null or empty string.

Day groups are separated by `margin-top: 10pt` before each new day heading (after the first).

##### 17.3.6 Land Travel Section

If the trip has **no land travel entries**, this section is **omitted entirely**.

If land travel entries exist, list each in a card, sorted by departure_date + departure_time ascending.

**Each land travel card (print):**
```
┌─────────────────────────────────────────────────────────┐
│  [TYPE]  [from_location] → [to_location]                 │
│  Departs: [date] at [time]                               │
│  Arrives: [date] at [time]                               │
│  [Confirmation / notes if present]                       │
└─────────────────────────────────────────────────────────┘
```

**Card styling:** Same as flight card — `1pt solid #ccc`, padding `10pt 12pt`, margin-bottom `8pt`, `page-break-inside: avoid`, background `#fff`.

**Field layout:**
- **Line 1:** Land travel type (RENTAL CAR, TRAIN, BUS, etc.) in uppercase 9pt `#555`, followed by route `[from_location] → [to_location]` in 12pt, font-weight 600, `#000`.
- **Line 2:** Departs — `"Departs: Mon, Aug 7, 2026 at 9:00 AM"` — 10pt, `#333`.
- **Line 3:** Arrives — `"Arrives: Mon, Aug 7, 2026 at 1:00 PM"` — 10pt, `#333`.
- **Line 4 (conditional):** Confirmation number or notes if present — `"Confirmation: ABC123"` or `"Notes: [notes text]"` — 10pt, `#555`. Omit entirely if blank/null.

---

#### 17.4 Elements Hidden in the Print Output

The `@media print` stylesheet sets `display: none !important` on the following elements. Use stable CSS class selectors or element roles — do not rely on generated class names that may change across builds.

| Element | Selector / Description |
|---------|------------------------|
| Navbar | `.navbar` or `nav` — the top navigation bar |
| Calendar widget | `.tripCalendar`, `.calendarSection`, or the section wrapping `<TripCalendar />` |
| "Print itinerary" button | `.printButton` or `[aria-label="Print itinerary"]` — the button that triggered the print |
| All edit / modify buttons | `.editButton`, `.modifyButton`, any `<button>` within event cards that opens an edit flow |
| All add-event buttons | `.addButton`, `.addFlightButton`, `.addStayButton`, `.addActivityButton`, etc. |
| Delete buttons | `.deleteButton`, or any button with "delete" / "remove" aria-label |
| Toast notifications | `.toast`, `.toastContainer` |
| Modal overlays | `.modalOverlay`, `.modal` |
| Empty state CTA elements | `.emptyState`, `.emptyCta` — empty state messages and "Add your first…" prompts |
| Section header action area | The right-side "Add" or "Edit" link/button within section headers |
| Loading skeletons | `.skeleton` elements |

**Important:** Empty sections should be hidden at the container level. If a section's only content is an empty-state element (which is hidden), the section heading and rule should also not appear. Achieve this with either:
- A `.has-items` class added by the component to the section container when it has ≥1 event card. In print CSS: `section:not(.has-items) { display: none !important; }`.
- Or: ensure the section wrapper element receives `display: none` when empty via a print-specific utility class.

---

#### 17.5 Print Typography Rules

All print typography uses IBM Plex Mono. Font sizes use `pt` units for reliable print rendering.

| Element | Font Size | Font Weight | Color |
|---------|-----------|-------------|-------|
| Trip name (header) | 24pt | 700 | #000 |
| Destinations | 13pt | 400 | #000 |
| Date range | 11pt | 400 | #555 |
| Section heading | 10pt | 700 | #000 |
| Day group heading (Activities) | 12pt | 600 | #000 |
| Event card — primary line | 11–12pt | 600 | #000 |
| Event card — route / secondary line | 11pt | 400 | #000 |
| Event card — detail lines (dates, times) | 10pt | 400 | #333 |
| Event card — tertiary / conditional lines | 10pt | 400 | #555 |
| Address not provided | 10pt | 400 | #999 |

**General print body rule:**
```css
@media print {
  * {
    font-family: 'IBM Plex Mono', monospace !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    background: #fff !important;
    color: #000 !important;
    font-size: 11pt;
    line-height: 1.5;
  }
}
```

**Note on CSS custom properties in print:** Do NOT use `var(--bg-primary)`, `var(--text-primary)`, etc., in print.css. Custom properties are generally resolved, but some older print renderers (and PDF export tools) may fail to resolve them. Use raw hex values (#000, #fff, #ccc, #333, #555, #999) in all `@media print` declarations.

---

#### 17.6 Page Break Rules

```css
@media print {
  /* Prevent individual event cards from splitting across pages */
  .flightCard,
  .stayCard,
  .activityCard,
  .landTravelCard {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Prevent section headings from orphaning at the bottom of a page */
  .sectionHeading,
  .dayGroupHeading {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Allow natural page breaks between sections */
  .printSection {
    page-break-before: auto;
    break-before: auto;
  }

  /* Avoid a break between the trip header and first section */
  .tripPrintHeader {
    page-break-after: avoid;
    break-after: avoid;
  }
}
```

**Do NOT use `page-break-before: always`** on sections — this would waste paper when a trip has only a few events. Allow the browser's natural pagination to decide where to break between sections.

---

#### 17.7 Color Overrides for Print

All on-screen dark theme colors must be overridden to a print-safe black-on-white scheme.

```css
@media print {
  /* Page background and text */
  body,
  .pageWrapper,
  .contentWrapper,
  .tripDetailsPage {
    background: #fff !important;
    color: #000 !important;
  }

  /* Card surfaces */
  .flightCard,
  .stayCard,
  .activityCard,
  .landTravelCard,
  .eventCard {
    background: #fff !important;
    color: #000 !important;
    border-color: #ccc !important;
  }

  /* Status badges — convert to plain text */
  .categoryBadge,
  .statusBadge,
  [class*="badge"] {
    background: transparent !important;
    color: #555 !important;
    border: none !important;
    padding: 0 !important;
  }

  /* Links — print as plain text */
  a {
    color: #000 !important;
    text-decoration: none !important;
  }

  /* Section headers */
  .sectionHeader,
  [class*="sectionHeader"] {
    color: #000 !important;
    border-color: #ccc !important;
  }
}
```

---

#### 17.8 Responsive Behavior

This spec is print-only; the "Print itinerary" button on-screen adapts as follows:

**Desktop (≥ 768px):**
- Button renders in the trip details page header, right-aligned in the header row alongside any existing action controls.
- Full label visible: `Print itinerary`.

**Mobile (< 768px):**
- Button renders below the trip name / destination block, as a full-width secondary button OR reduced to an icon-only button (printer icon, 36×36px tap target, `aria-label="Print itinerary"`) — implementation choice is left to the Frontend Engineer.
- If icon-only on mobile, the label should still be present as a visually hidden screen-reader text (`<span class="visually-hidden">Print itinerary</span>`).
- `window.print()` behavior on mobile: some mobile browsers open a share sheet instead of a native print dialog; this is acceptable and expected behavior — no workaround required.

**Print media itself:** Always single-column regardless of screen size at time of print invocation.

---

#### 17.9 Accessibility Considerations

| Concern | Requirement |
|---------|-------------|
| Button label | `aria-label="Print itinerary"` on the `<button>` element. This is the accessible name for screen readers. |
| Icon (if used) | Printer icon SVG must have `aria-hidden="true"` — the accessible name comes from `aria-label`, not the icon. |
| Focus management | No focus management needed — `window.print()` returns control to the button synchronously after the dialog is dismissed. The button retains focus. |
| Keyboard access | The button must be a native `<button>` element (not a `<div>` or `<span>`) so it is naturally keyboard-accessible (Tab to focus, Enter/Space to activate). |
| Color contrast (on-screen button) | Secondary button style: `#FCFCFC` text on transparent background over `#30292F` card surface — contrast ratio ~12:1 ✅ WCAG AA. |
| Screen reader announcement | When the button is activated, no custom ARIA announcement is needed — the browser print dialog takes over immediately. |
| Reduced motion | `window.print()` has no animation; no `prefers-reduced-motion` considerations needed. |
| Empty section omission | Sections with no events are hidden in print via CSS. No `aria-hidden` manipulation is needed for this — the `@media print` suppression only affects the printed output, not the screen DOM. |

---

#### 17.10 States

**On-screen button states:**

| State | Appearance |
|-------|-----------|
| Default | Secondary button — transparent bg, `rgba(93,115,126,0.5)` border, `#FCFCFC` text |
| Hover | Background `rgba(252,252,252,0.05)`, border `rgba(93,115,126,0.8)`, 150ms transition |
| Focus (keyboard) | `outline: 2px solid #5D737E; outline-offset: 2px;` — visible focus ring |
| Active (pressed) | Background `rgba(252,252,252,0.1)` |
| Disabled | Not applicable — the button is never disabled. If TripDetailsPage is loading, the button can be omitted (the data needed for print is already on the page once it loads) |

**Print output states:**

| State | Behavior |
|-------|---------|
| Trip with all 4 section types populated | All 4 sections print in order: Flights → Stays → Activities → Land Travel |
| Trip with only some sections populated | Only the populated sections appear; empty sections are omitted entirely |
| Trip with no events at all | Only the trip header block (name, destinations, "No dates yet") prints; no section headings appear |
| Trip with many events (multi-page) | Natural browser pagination applies; `page-break-inside: avoid` on cards prevents mid-card page breaks; section headings always stay with their content |
| Activities spanning multiple days | Each day group renders with its heading, followed by that day's activity cards; new day groups appear after the previous day's last card |

---

#### 17.11 Implementation Notes for Frontend Engineer (T-172)

These notes translate the spec into concrete implementation guidance. They are non-binding design intent — the Frontend Engineer may adapt as needed within the spec's constraints.

**File structure:**
```
frontend/src/styles/print.css          ← new file (all @media print rules)
frontend/src/pages/TripDetailsPage.jsx ← add import + button element
```

**Import approach:**
```js
// In TripDetailsPage.jsx (or main.jsx for global import)
import '../styles/print.css';
```

**Button placement in TripDetailsPage.jsx:**
The button should be placed in the existing header/title row of TripDetailsPage, after the trip name and destination display, as a right-aligned element. If a flex row already wraps the trip name, add the button as the last child with `margin-left: auto` (or via a flex spacer).

**Selector stability:** Class names used in `print.css` selectors must match the actual class names in the component files. If `TripDetailsPage` uses CSS Modules (`.module.css`), the generated class names will be hashed — in that case, add plain non-module CSS classes (e.g., `data-print-hide="true"`) to elements that need to be hidden, and target `[data-print-hide="true"]` in `print.css`.

**Empty section handling — recommended approach:**
```jsx
// In the section wrapper of each event type:
<section className={`printSection ${flights.length > 0 ? 'has-items' : ''}`}>
  <h2 className="sectionHeading">Flights</h2>
  {flights.length > 0 ? (
    flights.map(f => <FlightCard key={f.id} flight={f} />)
  ) : (
    <div className="emptyState">...</div>
  )}
</section>
```
Then in print.css:
```css
@media print {
  .printSection:not(.has-items) { display: none !important; }
  .emptyState { display: none !important; }
}
```

**window.print() call:**
```jsx
<button
  className={styles.printButton}
  onClick={() => window.print()}
  aria-label="Print itinerary"
>
  Print itinerary
</button>
```

---

#### 17.12 Test Plan (T-172)

| Test | Expected Result |
|------|----------------|
| **A** — Button renders on TripDetailsPage | "Print itinerary" button is present in the DOM when TripDetailsPage renders with a valid trip |
| **B** — Button click calls `window.print()` | Mock `window.print = vi.fn()`. Click the button. Assert `window.print` was called once. |
| **C** — Button has correct aria-label | `getByRole('button', { name: /print itinerary/i })` returns the button element |
| **D** — Existing TripDetailsPage tests pass | All prior TripDetailsPage.test.jsx tests continue to pass with no changes |

These 4 tests bring the total frontend test count to 418+ (after T-170 reduces it to 415).

---

#### 17.13 Design Rationale

- **`window.print()` over custom PDF library:** Zero dependencies, zero bundle size, works offline, and respects the user's OS print/PDF configuration. The triplanner project brief values minimalism; a dependency on a PDF library (jsPDF, html2canvas, etc.) adds maintenance burden for a rarely-used feature.
- **`@media print` over a separate print route:** A separate `/trips/:id/print` route would require duplicating data-fetching logic, navigation guards, and state. The `@media print` approach reuses the existing TripDetailsPage data already in memory — no additional API calls.
- **Omitting empty sections:** Empty-state CTAs (e.g., "No flights yet — add one") are action-prompts tied to the interactive UI. In a printed document, they add noise and imply the reader can take action. Omitting them produces a cleaner printout.
- **Hardcoded #000/#fff over CSS custom properties:** Print rendering across browsers and OS PDF printers is inconsistent in how it resolves CSS custom properties. Using explicit hex values in `@media print` rules ensures consistent black-on-white output across Chrome, Firefox, Safari, and system PDF printers.
- **IBM Plex Mono in print:** The design brief specifies IBM Plex Mono for all typography. Monospaced fonts give itineraries a structured, data-table feel — aligned columns, predictable character widths. This is appropriate for a document dense with times, flight numbers, and confirmation codes.
- **No forced page breaks between sections:** A trip with 2 flights and 1 stay would waste a page if each section forced a new page. The Japandi "every element has a purpose" principle applies to paper too — natural pagination avoids blank space.

---

*Spec 25 marked Approved (auto-approved per automated sprint cycle — Sprint 16). Published by Design Agent 2026-03-08.*

---

### Spec 18: Multi-Destination Chip UI (Sprint 19 — T-179)

**Sprint:** #19
**Related Task:** T-179 (Design), T-180 (Implementation)
**Backlog Item:** B-007
**Status:** Approved

**Description:**
Upgrades the destination input across three surfaces — the Create Trip Modal, the Trip Card on the home page, and the Trip Details Page header — from a plain text field to a structured chip/tag input model. Each destination is stored and displayed as an individual chip, allowing users to visually manage multiple destinations. The backend already stores destinations as a `TEXT ARRAY`; no schema changes are required. This spec only covers the UI layer.

**Target User:** Detail-oriented travelers planning multi-destination itineraries (e.g., Tokyo → Osaka → Kyoto). They need to see all their destinations at a glance and edit them individually.

---

#### 18.1 Design System Alignment

All components in this spec inherit the existing design system conventions:

| Property | Value |
|----------|-------|
| Font family | IBM Plex Mono, monospace |
| Background (app) | `#02111B` |
| Surface / card | `#30292F` |
| Accent / border | `#3F4045` |
| Secondary accent | `#5D737E` |
| Text primary | `#FCFCFC` |
| Text muted | `rgba(252,252,252,0.5)` |
| Border radius | `4px` (inputs, chips); `6px` (modals, cards) |
| Focus ring | `outline: 2px solid #5D737E; outline-offset: 2px;` |
| Transition | `150ms ease` for hover/focus state changes |
| Font size (body) | `0.875rem` (14px) |
| Font size (small / chip label) | `0.8125rem` (13px) |

---

#### 18.2 DestinationChipInput Component

This is the reusable core component used in both the Create Trip Modal (18.3) and the Edit Destinations panel (18.5). It renders:
- A row of existing destination chips (pills)
- A text input to type and add new destinations
- A "+" add button

**Component anatomy:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [Paris ×]  [Rome ×]  [Athens ×]  [_______________ ] [+]       │
└─────────────────────────────────────────────────────────────────┘
```

**Container:**
- `display: flex; flex-wrap: wrap; gap: 6px; align-items: center;`
- `min-height: 44px;`
- Background: `#02111B` (matches app background, so it reads as a field)
- Border: `1px solid #3F4045`
- Border radius: `4px`
- Padding: `8px 10px`
- On focus-within (when the inner text input is focused): border color transitions to `#5D737E` (`150ms ease`)

**Chip element (each destination):**
- `display: inline-flex; align-items: center; gap: 4px;`
- Background: `rgba(93,115,126,0.2)` — subtle teal tint
- Border: `1px solid rgba(93,115,126,0.4)`
- Border radius: `4px`
- Padding: `3px 6px 3px 8px`
- Font: IBM Plex Mono, `0.8125rem`, `#FCFCFC`
- Max chip width: `180px`; text overflows with `text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`

**Chip × (remove) button:**
- `display: inline-flex; align-items: center; justify-content: center;`
- Width / height: `16px × 16px`
- Background: transparent
- Color: `rgba(252,252,252,0.6)`; hover: `#FCFCFC`
- Border: none
- Cursor: pointer
- Icon: `×` character (Unicode U+00D7) at `0.75rem`
- `aria-label`: `"Remove [destination name]"` — e.g., `"Remove Paris"` (required for accessibility)
- Focus ring: standard `outline: 2px solid #5D737E; outline-offset: 2px;`
- On click: removes the chip immediately; keyboard focus moves to the next chip's × button, or if no next chip exists, moves to the text input

**Text input (inline):**
- `flex: 1 1 120px;` — expands to fill remaining width; minimum 120px before wrapping
- `min-width: 120px;`
- Background: transparent
- Border: none; `outline: none;`
- Color: `#FCFCFC`
- Font: IBM Plex Mono, `0.875rem`
- Placeholder: `"add destination…"` — color `rgba(252,252,252,0.35)`
- On Enter keypress: add current value as chip (trim whitespace), clear input, keep focus in input
- On comma keypress: same behavior as Enter (comma-delimited paste support)
- On backspace when input is empty: remove the last chip in the array (visual cue for power users)
- Max input length: 100 characters (prevents oversized chip labels)

**"+" add button:**
- `display: inline-flex; align-items: center; justify-content: center;`
- Width / height: `28px × 28px`
- Background: transparent
- Border: `1px solid #3F4045`
- Border radius: `4px`
- Color: `rgba(252,252,252,0.7)`; hover: `#FCFCFC`, border color `#5D737E`
- Icon: `+` character at `1rem`, centered
- `aria-label`: `"Add destination"`
- On click: add current text input value as chip (trim whitespace), clear input, return focus to text input
- Disabled state: if text input is empty — button is visually dimmed (`opacity: 0.35`, `cursor: not-allowed`) and non-interactive

**Empty input state (no chips, no text):**
- Container shows only the text input and the "+" button
- Placeholder `"add destination…"` is visible
- Validation: if form is submitted with zero chips, show inline error (see 18.3.5)

---

#### 18.3 Create Trip Modal — Updated Destination Field

**Surface:** `CreateTripModal.jsx`

**Current behavior (to be replaced):** A single text input labeled `DESTINATIONS` that accepts a free-form string.

**New behavior:** The `DestinationChipInput` component (18.2) replaces the single text input. The modal's overall layout, title ("new trip"), submit button ("create"), cancel button, loading state, and error banner remain unchanged (per existing Spec 2.5).

##### 18.3.1 Modal Layout (Updated Destination Row)

The modal form has two rows: TRIP NAME and DESTINATIONS. The DESTINATIONS row is updated:

```
┌─────────────────────────────────────────────────────────────────┐
│  new trip                                                       │
│                                                                 │
│  TRIP NAME                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ California Coast Trip                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  DESTINATIONS                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ [San Francisco ×] [Big Sur ×] [_____________] [+]      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│                                      [cancel]  [create]        │
└─────────────────────────────────────────────────────────────────┘
```

- Field label: `DESTINATIONS` — uppercase, `0.75rem`, `rgba(252,252,252,0.5)`, `letter-spacing: 0.08em`, `margin-bottom: 4px`
- Below the chip container, an inline validation message zone (initially hidden, see 18.3.5)

##### 18.3.2 State: Modal Open — No Destinations Added Yet

- Chip container is empty; only the text input and "+" button are visible
- Placeholder `"add destination…"` is shown
- "create" button is **disabled** (see 18.3.4)
- No validation message visible yet

##### 18.3.3 State: Typing a Destination

1. User clicks inside the chip container (focus moves to text input)
2. User types `"Paris"`
3. Container border transitions to `#5D737E`
4. "+" button becomes active (not dimmed)
5. On Enter keypress or "+" click:
   - Chip `[Paris ×]` appears in the container
   - Input clears
   - "create" button becomes **enabled** (if TRIP NAME is also filled)
   - Focus stays on text input

##### 18.3.4 Submit Disabled Logic

The "create" button is **disabled** if:
- TRIP NAME is empty, OR
- `destinations.length === 0`

The button uses `disabled` HTML attribute when either condition is true. Styling for disabled: `opacity: 0.4; cursor: not-allowed;` (existing modal button disabled style).

##### 18.3.5 Validation Error — Zero Destinations

If the user somehow triggers submit with zero destinations (e.g., via keyboard shortcut or programmatic submit):
- An inline error message appears directly below the chip container: `"add at least one destination."`
- Color: amber — `#F5A623` (existing error text color)
- Font: IBM Plex Mono, `0.8125rem`, no background
- `role="alert"` on the error element so screen readers announce it immediately
- The chip container border turns amber: `1px solid #F5A623`
- Error clears as soon as the user adds a chip

##### 18.3.6 State: Multiple Destinations Added

```
│  DESTINATIONS                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ [Paris ×] [Rome ×] [Athens ×] [Santorini ×] [___] [+] │    │
│  └────────────────────────────────────────────────────────┘    │
```

- Chips wrap to a new line if they exceed the container width (`flex-wrap: wrap`)
- Modal body does NOT scroll — the modal height expands naturally with up to ~3 rows of chips before becoming too tall. In practice, users rarely add more than 5 destinations in the create flow.
- Maximum chips: no hard limit, but the "+" button stays accessible.

##### 18.3.7 State: Submit Loading

- "create" button shows `"creating…"` with spinner (existing modal loading pattern)
- Chip container is non-interactive during loading (pointer-events: none)
- Chips remain visible

##### 18.3.8 State: Submit Error

- Existing error banner at top of modal fires (e.g., `"something went wrong. please try again."`)
- Chips remain intact — user does not lose their entered destinations

##### 18.3.9 State: Submit Success

- Modal closes (existing behavior)
- User is routed to new trip details page

##### 18.3.10 Accessibility — Create Modal

- The chip container has `role="group"` and `aria-label="Destinations"`
- Each chip × button: `aria-label="Remove [destination]"` (see 18.2)
- The text input: `aria-label="New destination"` and `aria-describedby` pointing to the validation error element ID (when error is visible)
- Tab order: TRIP NAME input → first chip × button → second chip × button → … → text input → "+" button → "cancel" → "create"
- Keyboard shortcut `Enter` on text input adds chip; does NOT submit the form (form submission only via "create" button click or explicit form submit)

---

#### 18.4 Trip Card — Destinations Display (Home Page)

**Surface:** `TripCard.jsx`

**Current behavior:** Destinations displayed as a comma-separated string from the destinations array (or as stored).

**New behavior:** Destinations displayed as a readable human-formatted string with truncation at 3.

##### 18.4.1 Display Rules

| Scenario | Rendered Text |
|----------|--------------|
| 1 destination | `"Paris"` |
| 2 destinations | `"Paris, Rome"` |
| 3 destinations | `"Paris, Rome, Athens"` |
| 4 destinations | `"Paris, Rome, Athens, +1 more"` |
| 5 destinations | `"Paris, Rome, Athens, +2 more"` |
| N > 3 destinations | `"[dest1], [dest2], [dest3], +[N-3] more"` |
| 0 destinations (edge case) | `"—"` (em dash; should not normally occur post-validation) |

**Truncation logic (pseudocode):**
```js
function formatDestinations(destinations) {
  if (!destinations || destinations.length === 0) return '—';
  if (destinations.length <= 3) return destinations.join(', ');
  const visible = destinations.slice(0, 3).join(', ');
  const overflow = destinations.length - 3;
  return `${visible}, +${overflow} more`;
}
```

##### 18.4.2 Visual Placement

- The destination string appears below the trip name, in the same position as the current destination text
- Font: IBM Plex Mono, `0.8125rem`, color: `rgba(252,252,252,0.65)` (muted, secondary)
- No chips rendered on the card — it is plain formatted text to keep the card compact
- The `+N more` suffix uses the same color/weight as the rest of the string (no special accent)

##### 18.4.3 Full Destination Tooltip (Accessibility + UX)

When destinations are truncated (`+N more`):
- The wrapping element has `title="[full comma-separated list]"` — e.g., `title="Paris, Rome, Athens, Santorini"` — so mouse users can hover to see all destinations
- Screen readers should read the full truncated string as-is; the tooltip is supplementary

##### 18.4.4 Responsive

- On mobile (<768px): the card is already full-width; the destination text wraps naturally. No layout changes.
- No chip rendering on mobile cards — the text-only format remains.

---

#### 18.5 Trip Details Page — Destinations Header Display

**Surface:** `TripDetailsPage.jsx` — the header section that currently shows the trip name and destination(s).

**Current behavior:** Destinations displayed as plain text (comma-separated string or single string) in the trip header.

**New behavior:** Each destination rendered as a chip in the header, followed by an "Edit destinations" control.

##### 18.5.1 Header Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  California Coast Trip                        [Print itinerary] │
│                                                                 │
│  [San Francisco]  [Big Sur]  [Monterey]        ✏ Edit           │
│                                                                 │
│  MAR 2025 → APR 2025                                            │
└─────────────────────────────────────────────────────────────────┘
```

- The destination chip row sits immediately below the trip name `<h1>`, above the date range line
- Chips are displayed in a flex row with `gap: 6px; flex-wrap: wrap; align-items: center;`
- The "✏ Edit" control appears inline at the end of the chip row (after the last chip or after wrapping)

##### 18.5.2 Destination Chip Style (View Mode)

These are **read-only display chips** (no × button):

| Property | Value |
|----------|-------|
| Background | `rgba(93,115,126,0.15)` |
| Border | `1px solid rgba(93,115,126,0.35)` |
| Border radius | `4px` |
| Padding | `3px 10px` |
| Font | IBM Plex Mono, `0.8125rem`, `#FCFCFC` |
| Max width | `200px` with `text-overflow: ellipsis` |

Unlike the chip input component, these chips have NO × button and are NOT interactive (just display elements).

##### 18.5.3 "Edit destinations" Control

- **Label:** `"Edit"` with a pencil icon (✏ Unicode U+270F or SVG icon consistent with existing edit icons on the page)
- **Appearance:** Minimal text button — no border, no background
- **Color:** `#5D737E` (secondary accent); hover: `#FCFCFC` + underline; `150ms ease`
- **Font:** IBM Plex Mono, `0.8125rem`
- **`aria-label`:** `"Edit destinations"`
- **Position:** After the last chip in the row. If chips wrap to multiple lines, the "Edit" control appears after the last chip on the last line.
- **On click:** Opens the Edit Destinations panel (18.5.4)

##### 18.5.4 Edit Destinations Panel

On clicking "Edit", the destinations header area transitions inline into an edit panel — no modal, no route change:

```
┌─────────────────────────────────────────────────────────────────┐
│  California Coast Trip                        [Print itinerary] │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [San Francisco ×] [Big Sur ×] [Monterey ×] [______] [+]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                      [cancel] [save] │
│                                                                 │
│  MAR 2025 → APR 2025                                            │
└─────────────────────────────────────────────────────────────────┘
```

- The read-only chip row and "Edit" button are replaced by the `DestinationChipInput` component (18.2) pre-populated with all current destinations
- Below the chip input, a row of two action buttons: `[cancel]` and `[save]`
- The date range line and all other sections of TripDetailsPage remain visible and unchanged beneath the edit panel

**"cancel" button:**
- Secondary style: transparent background, `rgba(93,115,126,0.5)` border, `#FCFCFC` text
- On click: discard all changes, return to read-only chip display (18.5.2), restore original destinations array in UI
- Focus returns to the "Edit destinations" button

**"save" button:**
- Primary style: `#5D737E` background, `#FCFCFC` text, border: none
- Loading state: button shows `"saving…"` with spinner, pointer-events: none
- On click: call `PATCH /api/v1/trips/:id` with `{ destinations: [...currentChipsArray] }`
- On success: return to read-only chip display with the updated destinations array; show brief success toast (see 18.5.6)
- On error: show inline error message below the chip input; button returns to active state

**"save" button disabled conditions:**
- `destinations.length === 0` — disabled with `opacity: 0.4; cursor: not-allowed;`
- Loading in progress

##### 18.5.5 Edit Panel — States Detail

| State | UI |
|-------|----|
| **Initial open** | ChipInput pre-populated with all current destinations. Both chips showing × buttons. Text input is empty and focused. `[cancel]` and `[save]` visible. |
| **User removes a chip** | Chip disappears immediately. If last chip removed: "save" button dims (disabled). Inline validation: `"add at least one destination."` appears below the chip input. |
| **User adds a chip** | Chip appears. If was previously at 0: validation error clears, "save" re-enables. |
| **No changes made, user clicks cancel** | Returns to read-only view. No API call. |
| **User clicks save (valid)** | Button shows `"saving…"` with spinner. |
| **Save success** | Read-only chip display updates with new destinations. Toast: `"destinations updated."` (green, 3 seconds, auto-dismiss). Focus returns to the "Edit destinations" button. |
| **Save error** | Inline error below chip input: `"could not update destinations. please try again."` (amber). Button returns to active `[save]` state. Chips remain as-is. |
| **Zero destinations on save attempt** | "save" button remains disabled. Inline validation message visible. No API call made. |

##### 18.5.6 Success Toast

Reuses the existing toast pattern from the app (if one exists) or renders:
- Fixed position, bottom-right of viewport: `bottom: 24px; right: 24px;`
- Background: `rgba(30,42,35,0.95)` (dark green tint)
- Border: `1px solid rgba(100,200,120,0.4)`
- Text: `"destinations updated."`, IBM Plex Mono, `0.875rem`, `#FCFCFC`
- Border radius: `6px`; padding: `10px 16px`
- Auto-dismisses after 3 seconds; slide-in animation from right (100ms ease)
- `role="status"` for screen reader announcement

##### 18.5.7 Responsive — Trip Details Header

**Desktop (≥1024px):**
- Chips row and "Edit" control on one line (wraps if needed)
- `[cancel]` and `[save]` right-aligned in a flex row below the chip input

**Tablet (768px–1023px):**
- Same as desktop; chips may wrap more frequently

**Mobile (<768px):**
- Chip row wraps freely
- `[cancel]` and `[save]` stack as two full-width buttons below the chip input:
  - `[cancel]` on top, `[save]` below; each `width: 100%;`

##### 18.5.8 Accessibility — Trip Details Page

- Read-only destination chips: `role="list"` on the container; each chip is `role="listitem"` (screen readers can count items and announce them)
- "Edit destinations" button: `aria-label="Edit destinations"` (ensures screen readers announce the full purpose)
- When edit panel opens: focus moves to the first × button of the first chip (or the text input if no chips)
- When edit panel closes (cancel or save): focus returns to the "Edit destinations" button
- Inline validation error: `role="alert"` so it's announced immediately
- "save" button when disabled: `aria-disabled="true"` in addition to `disabled` HTML attribute (belt-and-suspenders for AT compatibility)

---

#### 18.6 Data Flow and API Integration

No new API endpoints. The existing PATCH endpoint is used for editing destinations:

```
PATCH /api/v1/trips/:id
Body: { destinations: string[] }
```

**Create trip:** POST /api/v1/trips continues to accept `{ destinations: string[] }` — the chip input builds this array in component state before submit.

**Frontend state:**
- In `CreateTripModal.jsx`: `const [destinations, setDestinations] = useState([])` — replaces the existing single-string state
- In `TripDetailsPage.jsx`: `const [editDestinations, setEditDestinations] = useState(null)` — null = not editing; array = edit mode with current chips

**No backend changes required.** The destinations array is the existing API contract.

---

#### 18.7 Component Reuse Summary

| Component | Usage |
|-----------|-------|
| `DestinationChipInput` | Create Trip Modal (18.3) + Edit Destinations panel (18.5.4) |
| Read-only destination chip | Trip Details header (18.5.2) — styled separately, no × button |
| Destination text formatter | `formatDestinations()` — Trip Card (18.4) |

The `DestinationChipInput` component should be extracted to `frontend/src/components/DestinationChipInput.jsx` and imported into both surfaces.

---

#### 18.8 Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Destination with only whitespace | Trim on add — reject if empty after trim; chip is NOT added |
| Duplicate destination | Allow — no deduplication enforced; user may intentionally list variations (e.g., "Paris, France" and "Paris") |
| Very long destination name | Chip max-width 180px with ellipsis + full name in `title` attribute for tooltip |
| Paste multiple destinations at once | If pasted string contains commas, split on comma and add each as a separate chip |
| Single destination (normal) | Fully supported — one chip is valid |
| Trip created with 0 destinations | Blocked by disabled submit button + validation message; cannot reach this state via UI |
| Existing trip with 0 destinations (legacy data) | Edit panel opens with empty chip input; user must add at least one before saving |
| Rapid click on "+" | Debounce not needed — each click adds the current input value (which is cleared after each add) |

---

#### 18.9 Responsive Summary

| Breakpoint | Create Modal | Trip Card | Trip Details Header | Edit Panel |
|------------|-------------|-----------|---------------------|------------|
| Desktop ≥1024px | Chips wrap within modal width | Text-only truncated string | Chips inline, "Edit" at end | Save/Cancel right-aligned |
| Tablet 768–1023px | Same as desktop | Same | Same, may wrap more | Same |
| Mobile <768px | Chips wrap; modal full-width | Same text format | Chips wrap; Edit below | Save/Cancel full-width, stacked |

---

#### 18.10 Animation and Transitions

| Interaction | Animation |
|-------------|-----------|
| Chip added | Chip fades in: `opacity 0 → 1` over `120ms ease` |
| Chip removed | Chip fades out: `opacity 1 → 0` and collapses width over `120ms ease`; avoid layout jank by using `max-width` transition |
| Edit panel open | Panel slides down from header area: `max-height 0 → auto` proxy with `transform: translateY(-4px) → translateY(0)` over `150ms ease` |
| Edit panel close | Reverse of open — `150ms ease` |
| Success toast | Slides in from right: `transform: translateX(20px) → translateX(0)` over `100ms ease` |

All animations should respect `prefers-reduced-motion: reduce` — if set, skip transitions (instant show/hide).

---

#### 18.11 Test Coverage Guidance (for T-180)

| Test | Surface | Expected |
|------|---------|---------|
| Chip added on Enter | DestinationChipInput | Input value becomes chip; input clears |
| Chip added on "+" click | DestinationChipInput | Same as Enter |
| Chip added on comma keypress | DestinationChipInput | Text before comma becomes chip |
| Whitespace-only input rejected | DestinationChipInput | No chip added; input clears |
| Chip removed on × click | DestinationChipInput | Chip removed from array |
| Backspace on empty input removes last chip | DestinationChipInput | Last chip removed |
| Submit blocked with 0 chips | CreateTripModal | Button disabled; validation message present |
| Submit allowed with ≥1 chip | CreateTripModal | Button enabled; PATCH/POST called |
| TripCard: 1 destination | TripCard | `"Paris"` rendered |
| TripCard: 3 destinations | TripCard | `"Paris, Rome, Athens"` rendered |
| TripCard: 4 destinations | TripCard | `"Paris, Rome, Athens, +1 more"` rendered |
| TripCard: 0 destinations | TripCard | `"—"` rendered |
| Edit panel opens on click | TripDetailsPage | DestinationChipInput visible; chips pre-populated |
| Save calls PATCH with correct array | TripDetailsPage | `api.trips.update(tripId, { destinations: [...] })` called |
| Cancel discards changes | TripDetailsPage | Original chips restored; no API call |
| Save disabled with 0 chips | TripDetailsPage | Button disabled; validation message present |
| `aria-label` on × buttons | DestinationChipInput | Each × has `aria-label="Remove [destination]"` |

---

*Spec 18 (Sprint 19 — Multi-Destination Chip UI) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-09.*

---

### Spec 19: Trip Notes / Description Field (Sprint 20 — T-187)

**Sprint:** #20
**Related Task:** T-187, T-189
**Status:** Approved

**Description:**
The Trip Notes section is a freeform text area on the TripDetailsPage that allows users to store personal observations, reminders, packing lists, research notes, or any contextual information for a given trip. It lives below the Destinations section and above the Calendar. It uses an inline edit-in-place pattern — no separate edit page — so users can quickly jot a note and return to viewing their trip details without a full page navigation. The section is minimal in visual weight: it should feel like a quiet, always-available notepad rather than a prominent form element.

---

#### 19.1 Section Placement on TripDetailsPage

TripDetailsPage vertical order (top → bottom):

1. Calendar (top — existing)
2. Trip name + metadata header (existing)
3. Destinations section (existing)
4. **[NEW] Trip Notes section** ← inserted here
5. Flights section (existing)
6. Stays section (existing)
7. Activities section (existing)

**Separator above section:**
- A `1px solid var(--border-subtle)` horizontal rule spans the full content width, placed 32px below the destinations section and 24px above the notes section header. This creates visual breathing room between the two sections without heavy decoration.

---

#### 19.2 Section Header

- Follows the standard section header convention: font-size 11px, font-weight 600, letter-spacing 0.12em, uppercase, color `var(--text-muted)`.
- Label text: `"NOTES"`
- A thin horizontal line (`flex: 1; height: 1px; background: var(--border-subtle)`) extends to the right of the label via a flex row containing the label span + the line element.
- The pencil icon button sits at the far right of this header row (right-aligned via `justify-content: space-between` or `margin-left: auto`).

**Pencil button (always visible in both view and edit mode):**
- Icon: a simple 14×14px pencil/edit SVG icon. No filled background — icon only.
- Color: `var(--text-muted)` by default; `var(--accent)` on hover and when in edit mode.
- `aria-label="Edit trip notes"`
- `title="Edit trip notes"` (tooltip for sighted mouse users)
- In **edit mode**: clicking the pencil button while already in edit mode has no effect (edit mode is already active).
- `cursor: pointer`
- Padding: 4px (increases tap/click target to ~22×22px)
- Transition: `color 150ms ease`

---

#### 19.3 View Mode

**Default appearance (notes null or empty string):**
- Below the section header, display a single line of placeholder text: `"Add notes about this trip…"`
- Style: font-size 14px, IBM Plex Mono, color `var(--text-muted)` (rgba(252,252,252,0.5)), font-style: italic
- Clicking on the placeholder text activates Edit Mode (same as clicking the pencil button)
- The placeholder text itself has `cursor: pointer` and subtle hover: `color: rgba(252,252,252,0.65)`

**When notes exist (non-null, non-empty string):**
- Display the notes text in a `<p>` or `<div>` block element
- Style: font-size 14px, IBM Plex Mono, color `var(--text-primary)`, line-height 1.7
- `white-space: pre-wrap` — preserve newlines entered by the user
- The text is NOT truncated in view mode — full notes content is displayed regardless of length
- Clicking anywhere in the notes text block also activates Edit Mode (cursor: pointer, subtle hover background: `rgba(252,252,252,0.03)`)
- Do NOT wrap the text in a visible input or box — it should read like plain paragraph text

**Padding:**
- Notes content area: padding-top 12px from the section header row
- No additional background box — the notes text sits directly on the page background

---

#### 19.4 Edit Mode

Edit mode is activated when the user:
1. Clicks the pencil icon button
2. Clicks on the placeholder text (empty state)
3. Clicks on the existing notes text (notes present state)

**Transition into edit mode:** The view-mode content fades out (opacity 0, 100ms) and is replaced by the edit form (opacity 0 → 1, 150ms). The textarea autofocuses immediately on activation.

**Edit form layout (top to bottom):**

```
[ textarea (full width, min-height 120px) ]
[ char count right-aligned            "N / 2000" ]
[ Save button ]  [ Cancel button ]
```

**Textarea:**
- `<textarea aria-label="Trip notes" id="trip-notes-textarea" maxLength={2000}>`
- Pre-filled with `trip.notes` if it exists; empty string if `trip.notes` is null
- Width: 100% of the section container
- Min-height: 120px; auto-grows vertically as user types (use CSS `field-sizing: content` or a JS auto-resize approach — whichever is simpler in the existing codebase)
- Max-height: 400px before scrolling (internal scroll on overflow)
- Background: `var(--surface-alt)` (`#3F4045`)
- Border: `1px solid var(--border-subtle)`
- Focus border: `1px solid var(--border-accent)` (`#5D737E`)
- Text color: `var(--text-primary)`
- Font: IBM Plex Mono, 14px, line-height 1.6
- Padding: 12px 14px
- Border-radius: `var(--radius-sm)` (2px)
- Resize: `vertical` only (allow user to drag taller; prevent horizontal)
- Placeholder attribute (only shows when textarea is empty): `"Add notes about this trip…"` — styled by browser default placeholder styling, which will appear muted. If browser default is too prominent, override with CSS `::placeholder { color: var(--text-muted); font-style: italic; }`

**Character count:**
- Displayed below the textarea, right-aligned
- Format: `"N / 2000"` where N is the current character count (updates on every keystroke)
- `id="trip-notes-char-count"` — so `aria-describedby` on the textarea can reference it
- `role="status"` — announces count updates to screen readers via live region
- Font-size: 11px, font-weight: 400, color: `var(--text-muted)`
- When count is between 1800–1999: color changes to `rgba(240,180,60,0.85)` (warm amber warning — subtle, not alarming)
- When count is 2000: color changes to `rgba(220,80,80,0.9)` (red — at limit)
- When count is 0–1799: default muted color
- The textarea's `aria-describedby="trip-notes-char-count"` ensures screen readers can navigate to the count

**Textarea `aria-describedby`:**
```jsx
<textarea
  id="trip-notes-textarea"
  aria-label="Trip notes"
  aria-describedby="trip-notes-char-count"
  maxLength={2000}
  ...
/>
<div
  id="trip-notes-char-count"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {charCount} / 2000
</div>
```

**Save button:**
- Label: `"Save"`
- Style: Primary button — background `var(--accent)` (`#5D737E`), text `var(--text-primary)`, font-weight 500, font-size 13px, padding: 8px 20px, border-radius: 2px
- Hover: `rgba(93,115,126,0.8)`
- Loading state: button text replaced with 14px inline spinner; button disabled; cancel button also disabled
- On click → triggers save flow (see 19.5)

**Cancel button:**
- Label: `"Cancel"`
- Style: Secondary button — background transparent, border `1px solid rgba(93,115,126,0.5)`, text `var(--text-primary)`, font-size 13px, padding: 8px 20px, border-radius: 2px
- Hover: `rgba(252,252,252,0.05)`
- On click → triggers cancel flow (see 19.6)

**Button row:**
- `display: flex; gap: 12px; margin-top: 12px`
- Buttons are left-aligned (not full-width, not right-aligned)
- Save comes first (left), Cancel comes second (right of Save)

---

#### 19.5 Save Flow

1. User clicks "Save" button (or presses `Ctrl+Enter` / `Cmd+Enter` as keyboard shortcut — see 19.7)
2. The notes value is trimmed: `editNotes.trim()`
3. If trimmed value is empty string (`""`), send `null` to API (clearing the note)
4. If trimmed value is non-empty, send the trimmed string
5. Save button enters loading state (spinner, disabled); Cancel button also disabled
6. `PATCH /api/v1/trips/:id` with body `{ notes: trimmedValue }` is called
7. **On success (200):**
   - Trip data is reloaded (re-fetch `GET /api/v1/trips/:id`)
   - Edit mode closes; view mode is shown with updated notes (or placeholder if cleared)
   - A brief success indicator is shown: the notes section header label briefly changes to `"NOTES — SAVED"` for 1500ms then reverts to `"NOTES"`. This is subtle and non-intrusive — no toast needed for a field save.
8. **On error (any non-200):**
   - Loading state cleared; buttons re-enabled
   - An inline error message appears below the button row: `"Failed to save notes. Please try again."` — font-size 12px, color `rgba(220,80,80,0.9)`, `role="alert"`
   - Edit mode stays open so the user does not lose their content

---

#### 19.6 Cancel Flow

1. User clicks "Cancel" button (or presses `Escape` key while in edit mode)
2. No API call is made
3. The textarea value is discarded — internal edit state reverts to the original `trip.notes` value (or empty)
4. Edit mode closes; view mode is shown unchanged
5. No loading state, no error, no toast — instant

---

#### 19.7 Keyboard Interactions

| Key | Context | Behavior |
|-----|---------|---------|
| `Escape` | Edit mode active | Cancel — discard changes, exit edit mode |
| `Ctrl+Enter` / `Cmd+Enter` | Textarea focused | Save — same as clicking Save button |
| `Tab` | Textarea focused | Move focus to "Save" button |
| `Tab` | Save focused | Move focus to "Cancel" button |
| `Tab` | Cancel focused | Move focus to next focusable element after section |
| `Enter` | On placeholder text | Activate edit mode (placeholder has `tabIndex={0}`, handles `onKeyDown Enter`) |
| `Enter` | On notes text in view mode | Activate edit mode (same pattern) |

The pencil icon button participates in normal tab order. It should receive focus and be activatable via `Enter` and `Space`.

---

#### 19.8 States

| State | What the user sees |
|-------|--------------------|
| **Empty / no notes** | Section header `"NOTES"` + pencil icon. Below: italic muted placeholder text `"Add notes about this trip…"`. |
| **Notes exist (view mode)** | Section header `"NOTES"` + pencil icon. Below: full notes text in primary color, `white-space: pre-wrap`. |
| **Edit mode (empty start)** | Textarea empty (placeholder text inside), char count `"0 / 2000"`, Save + Cancel buttons. |
| **Edit mode (typing)** | Textarea fills; char count updates in real-time. Color shift at 1800+ chars. |
| **Edit mode (at limit)** | Char count shows red `"2000 / 2000"`. Textarea prevents further input (maxLength). |
| **Saving** | Save button shows spinner; both buttons disabled. Textarea read-only (add `disabled` attribute during save). |
| **Save success** | View mode restored. Section header flashes `"NOTES — SAVED"` for 1500ms. |
| **Save error** | Edit mode remains. Error text below buttons. Buttons re-enabled. |
| **Cancel** | View mode instantly restored. No feedback needed. |
| **Loading (initial page load)** | Section shows skeleton shimmer (same shimmer style as other TripDetailsPage sections): two lines of `var(--surface-alt)` background, border-radius 2px, shimmer animation. Pencil icon hidden during skeleton. |

---

#### 19.9 Responsive Behavior

| Breakpoint | Layout Notes |
|------------|-------------|
| **Desktop ≥1024px** | Section full width (up to 1120px max content width). Textarea min-height 120px. Save/Cancel buttons left-aligned, inline. |
| **Tablet 768–1023px** | Same as desktop. No layout changes needed at this breakpoint. |
| **Mobile <768px** | Section full width (minus 16px horizontal padding on each side per page padding). Textarea min-height 100px (slightly shorter). Save and Cancel buttons remain inline (they fit at small sizes — each ~80px wide). If viewport is very narrow (<360px), stack buttons vertically with full width: `flex-direction: column; gap: 8px` with each button `width: 100%`. |

---

#### 19.10 Accessibility Checklist

- [ ] `<textarea>` has `aria-label="Trip notes"` (explicit label; no `<label>` element needed if aria-label is present, but a visually-hidden `<label>` for screen readers is acceptable)
- [ ] `aria-describedby="trip-notes-char-count"` on textarea references the live char count element
- [ ] Char count container has `role="status"`, `aria-live="polite"`, `aria-atomic="true"` — screen reader announces count after brief debounce (or on blur at minimum)
- [ ] Pencil button has `aria-label="Edit trip notes"` and `title="Edit trip notes"`
- [ ] Placeholder text (empty state, view mode) has `tabIndex={0}`, `role="button"`, `aria-label="Add notes about this trip"`, handles `Enter`/`Space` for keyboard activation
- [ ] Notes text in view mode (non-empty) has `tabIndex={0}`, `role="button"`, `aria-label="Edit trip notes"`, handles `Enter`/`Space` for keyboard activation
- [ ] Error message after failed save uses `role="alert"` (immediate announcement)
- [ ] Save button disabled state: `disabled` attribute AND `aria-disabled="true"` during loading
- [ ] Cancel button disabled state: `disabled` attribute AND `aria-disabled="true"` during loading
- [ ] Focus management: when edit mode activates, focus is moved to the textarea. When edit mode closes (save or cancel), focus returns to the pencil icon button.
- [ ] Color contrast: all text colors meet WCAG AA. `var(--text-muted)` on `var(--bg-primary)` = 4.6:1 (passes AA for 14px regular weight which requires 4.5:1). Amber warning color at 1800 chars meets 3:1 for large text.
- [ ] `prefers-reduced-motion`: if set, skip fade transition between view/edit mode (instant toggle)

---

#### 19.11 Component Architecture Guidance (for T-189)

**New file:** `frontend/src/components/TripNotesSection.jsx`

**Props:**
```jsx
TripNotesSection({
  tripId,           // string — used in PATCH call
  initialNotes,     // string | null — the trip.notes value from parent
  onSaveSuccess,    // () => void — callback to trigger trip data reload in parent
})
```

**Internal state:**
```jsx
const [isEditing, setIsEditing] = useState(false);
const [editNotes, setEditNotes] = useState('');
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState(null);
const [showSavedFeedback, setShowSavedFeedback] = useState(false);
```

**Integration in `TripDetailsPage.jsx`:**
- Import `TripNotesSection`
- Place it after the destinations section and before the calendar (per 19.1 placement)
- Pass `tripId={trip.id}`, `initialNotes={trip.notes}`, `onSaveSuccess={reloadTrip}` where `reloadTrip` re-fetches the trip data

**Note:** `initialNotes` should be re-passed whenever the parent reloads trip data after a successful save, so the component reflects the latest persisted value.

---

#### 19.12 Visual Mockup (Text-Based)

```
─────────────────────────────────────────────────────────

NOTES ────────────────────────────────────────────── [✎]

  Add notes about this trip…                         ← italic, muted (empty state)

─────────────────────────────────────────────────────────

NOTES ────────────────────────────────────────────── [✎]

  Booked refundable hotel. Check if visa needed.     ← primary color, pre-wrap
  Packing list: camera, adapters, rain jacket.
  Budget: ~$2000 for 5 nights.

─────────────────────────────────────────────────────────

NOTES ────────────────────────────────────────────── [✎]

  ┌──────────────────────────────────────────────┐
  │ Booked refundable hotel. Check if visa...    │  ← textarea in edit mode
  │                                              │
  │                                              │
  └──────────────────────────────────────────────┘
                                       142 / 2000    ← right-aligned, muted

  [  Save  ]  [  Cancel  ]

─────────────────────────────────────────────────────────
```

---

*Spec 19 (Sprint 20 — Trip Notes Field) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-10.*

---

## Sprint 22 Specs

---

### Spec 20: Trip Status Selector (Sprint 22 — T-195)

**Sprint:** #22
**Related Task:** T-195, T-196
**Status:** Approved

---

#### 20.1 Description

The Trip Status Selector is an interactive inline badge on the `TripDetailsPage` that lets users change a trip's status (`PLANNING` → `ONGOING` → `COMPLETED`) without leaving the page. In view mode it renders exactly like the read-only status badge on `TripCard` — a small pill with a muted Japandi color — but with a visual affordance (cursor and subtle hover effect) indicating it is clickable. Clicking it opens a compact dropdown overlay with all three status options. Selecting one fires a `PATCH /api/v1/trips/:id` call and updates the badge in place. The Home page `TripCard` will reflect the change on the next navigation (standard re-fetch; no real-time sync required).

---

#### 20.2 Screen Context

**Page:** `TripDetailsPage` (`/trips/:id`)

**Placement within the trip header:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Back                                                 │
│                                                         │
│  Tokyo Summer Trip              [PLANNING ▾]  ← HERE   │
│  Tokyo · Kyoto · Osaka                                  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  [Calendar section ...]                                 │
└─────────────────────────────────────────────────────────┘
```

The status selector sits **inline with the trip name** on the same row (flex row, aligned to the right side of the trip name line), or immediately below it if the trip name is very long. It is visually prominent but not dominant — smaller than the trip name, above the destinations list.

**Layout:** `display: flex; align-items: center; gap: 12px;` on the trip name row.
- Left: `<h1>` trip name (font-size 22px, font-weight 500, IBM Plex Mono, `#FCFCFC`)
- Right: `TripStatusSelector` component (inline)

---

#### 20.3 Component Overview

**Component file:** `frontend/src/components/TripStatusSelector.jsx`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tripId` | string | ✅ | The trip's UUID, used in the PATCH call |
| `initialStatus` | `"PLANNING" \| "ONGOING" \| "COMPLETED"` | ✅ | The current trip status, loaded by the parent |
| `onStatusChange` | `(newStatus: string) => void` | ✅ | Callback invoked after a successful API update; parent uses this to sync its local trip state |

**Internal state:**
| State variable | Type | Description |
|---------------|------|-------------|
| `currentStatus` | string | Tracks the displayed status. Initialized from `initialStatus`. Reverted on API error. |
| `isOpen` | boolean | Whether the dropdown overlay is currently visible |
| `isLoading` | boolean | True while the PATCH request is in flight |
| `error` | string \| null | Set to a generic error message on API failure; triggers a toast |

---

#### 20.4 Status Color Reference

Each status maps to a fixed color pair used consistently across the badge (view mode), the dropdown options, and the option indicator dots.

| Status | Badge Background | Badge Text | Indicator Dot |
|--------|-----------------|------------|---------------|
| `PLANNING` | `rgba(93, 115, 126, 0.2)` | `#5D737E` | `#5D737E` |
| `ONGOING` | `rgba(100, 180, 100, 0.15)` | `rgba(100, 200, 100, 0.9)` | `rgba(100, 200, 100, 0.9)` |
| `COMPLETED` | `rgba(252, 252, 252, 0.1)` | `rgba(252, 252, 252, 0.5)` | `rgba(252, 252, 252, 0.5)` |

These are the same values as the Design System Conventions Status Badges table to ensure visual consistency between `TripCard` (read-only) and `TripDetailsPage` (interactive).

---

#### 20.5 Component States

**State A — View Mode (idle, dropdown closed)**

The badge renders as a clickable pill:

```
[• PLANNING ▾]
```

- Pill shape: `padding: 3px 10px`, `border-radius: 2px`
- Font: IBM Plex Mono, `font-size: 10px`, `font-weight: 600`, `letter-spacing: 0.1em`, `text-transform: uppercase`
- Background and text color per status (table in §20.4)
- Left element: a small 6px filled circle (indicator dot) in the status color, `margin-right: 6px`
- Right element: a small `▾` chevron icon (5px, same text color, `margin-left: 6px`, `opacity: 0.7`)
- `cursor: pointer`
- Hover: background becomes 10% more opaque (multiply the alpha by ~1.5). Transition: `150ms ease`.
- `role="button"`, `aria-haspopup="listbox"`, `aria-expanded="false"`, `aria-label="Trip status: PLANNING"` (dynamic — includes current status name)

---

**State B — Dropdown Open**

Clicking the badge (or pressing Space/Enter when focused) opens a dropdown listbox overlay positioned directly below the badge.

```
[• PLANNING ▾]
┌─────────────────┐
│ ● PLANNING   ✓ │  ← currently selected, checkmark on right
│ ● ONGOING      │
│ ● COMPLETED    │
└─────────────────┘
```

Dropdown anatomy:
- Container: `position: absolute`, `z-index: 100`, `top: calc(100% + 4px)`, `left: 0`
- Background: `#30292F` (surface color)
- Border: `1px solid rgba(93, 115, 126, 0.3)`
- Border radius: `4px`
- Box shadow: none (Japandi — use borders, no shadows)
- Min-width: `160px`
- `role="listbox"`, `aria-label="Trip status"`

Each option row:
- Padding: `10px 14px`
- Font: IBM Plex Mono, `font-size: 12px`, `font-weight: 500`, `letter-spacing: 0.06em`, `text-transform: uppercase`
- Text color: status text color (from §20.4 table)
- Left: 8px indicator dot in the status color
- Right (selected option only): `✓` checkmark in `#5D737E`
- `role="option"`, `aria-selected="true/false"`
- Focus/hover: `background: rgba(93, 115, 126, 0.1)`, no outline (handled by background change)
- `cursor: pointer` on non-selected options; `cursor: default` on the currently-selected option

The parent `badge` button:
- `aria-expanded="true"` while open
- `aria-label="Trip status: PLANNING"` (unchanged — reflects current persisted status, not the focused option)

**Closing the dropdown:**
- User selects an option → dropdown closes, API call starts
- User presses Escape → dropdown closes, no change, focus returns to badge button
- User clicks outside the dropdown or badge → dropdown closes, no change
- A `mousedown` event listener on `document` (checking if click is outside) handles outside-click dismissal

---

**State C — Loading**

After the user selects a new status, the dropdown closes immediately and the badge enters loading state:

```
[• ONGOING  ◌]   ← spinner replaces chevron, badge opacity reduced
```

- Optimistic update: the badge immediately shows the **newly selected** status color and text before the API responds (optimistic UI). This feels more responsive.
- The `▾` chevron is replaced by a 12px circular CSS spinner (border-style, accent color `#5D737E`, `animation: spin 0.8s linear infinite`)
- Badge overall `opacity: 0.7`
- `pointer-events: none` on the badge during loading (prevent double-click)
- `aria-label` updates to `"Trip status: ONGOING (saving…)"` (screen reader announcement)
- `aria-busy="true"` on the badge container

---

**State D — Error (API Failure)**

If the PATCH call returns a non-2xx status:

1. The badge reverts to the **previous** status (color + text). The optimistic update is rolled back.
2. `isLoading` returns to `false`. Badge returns to normal view mode (chevron visible, pointer-events restored).
3. A **toast notification** appears at the bottom-right of the viewport:
   - Text: `"Failed to update trip status. Please try again."`
   - Styling: `background: #30292F`, border: `1px solid rgba(220, 80, 80, 0.5)`, text: `rgba(252, 252, 252, 0.85)`, font-size: 13px, padding: 12px 16px, border-radius: 4px
   - Auto-dismisses after 4 seconds
   - `role="alert"` for screen reader announcement
4. No API error details are surfaced (no status code, no raw message from the server).

---

**State E — Error Pre-load (initial load failure)**

If the parent `TripDetailsPage` fails to load the trip (e.g., network error), the `TripStatusSelector` simply does not render — the parent handles the full-page error state. This component is only mounted when `tripId` and `initialStatus` are available and valid.

---

#### 20.6 User Flow (Step-by-Step)

1. User opens `TripDetailsPage` for a trip with status `PLANNING`.
2. The trip header renders: trip name on the left, `[• PLANNING ▾]` badge on the right.
3. User clicks the badge (or tabs to it and presses Space/Enter).
4. A dropdown appears below the badge showing all three options: `PLANNING` (with ✓), `ONGOING`, `COMPLETED`.
5. User clicks `ONGOING` (or uses arrow keys to navigate to it and presses Enter).
6. The dropdown closes. The badge optimistically switches to `[• ONGOING ◌]` (loading, spinner).
7. `PATCH /api/v1/trips/:id` is called with body `{ "status": "ONGOING" }`.
8. **On success (200):**
   - Badge settles to `[• ONGOING ▾]` (loading state cleared, chevron returns).
   - `onStatusChange("ONGOING")` callback is invoked. Parent updates its local trip state.
   - No page reload. No toast.
9. **On error (non-2xx):**
   - Badge reverts to `[• PLANNING ▾]` (previous status).
   - Error toast appears: `"Failed to update trip status. Please try again."` (4s auto-dismiss).
   - User can try again immediately.

**Keyboard flow (no mouse):**
1. User tabs to the badge button.
2. Badge receives focus (visible focus ring: `outline: 2px solid #5D737E`, `outline-offset: 2px`).
3. User presses Space or Enter → dropdown opens. Focus moves to the first option (or the currently selected option).
4. User presses ArrowDown / ArrowUp to move focus between options.
5. User presses Enter or Space on the desired option → selection is made, dropdown closes, API call fires.
6. User presses Escape (at any point while open) → dropdown closes, focus returns to the badge button, no change.

---

#### 20.7 API Integration

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/trips/:id` |
| **Request body** | `{ "status": "ONGOING" }` (or `"PLANNING"` or `"COMPLETED"`) |
| **Auth** | Bearer token via Axios interceptor (standard, handled by `api.js`) |
| **Success response** | `200 OK` — full trip object with updated `status` field |
| **Error response** | Any non-2xx — treat all as generic failure; do not parse error body for UI display |
| **API helper** | `api.trips.update(tripId, { status: newStatus })` — existing Axios wrapper |

**Important:** The frontend must validate the status value client-side before sending (must be one of `"PLANNING"`, `"ONGOING"`, `"COMPLETED"`). Since the options are hardcoded in the UI, this is inherently guaranteed — no user-typed input is sent to the API. No sanitization beyond enum restriction is required.

---

#### 20.8 Dropdown Positioning

The dropdown is positioned using `position: absolute` relative to a `position: relative` wrapper that contains both the badge button and the dropdown. This ensures the dropdown appears anchored to the badge regardless of scroll position.

```css
.trip-status-selector {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.trip-status-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  min-width: 160px;
}
```

The wrapper `div` should have `role="none"` (no semantic role) — only the inner `button` (badge) and `ul` (listbox) carry semantic roles.

---

#### 20.9 Responsive Behavior

| Breakpoint | Behavior |
|------------|---------|
| **Desktop (≥ 768px)** | Trip name and status selector on same flex row (`display: flex; align-items: center; gap: 12px; flex-wrap: wrap`). Dropdown opens downward and left-aligned to the badge. |
| **Mobile (< 768px)** | If trip name + badge don't fit on one line (due to `flex-wrap: wrap`), the badge wraps to its own row below the trip name, still left-aligned with the content. Dropdown still opens downward. Badge touch target minimum: 44×28px (per WCAG 2.5.5). |

No change to the dropdown layout at mobile — the compact list is usable at all widths because it is `min-width: 160px` and anchored to the badge.

---

#### 20.10 Accessibility Checklist

| Requirement | Implementation |
|-------------|---------------|
| Badge button labeled | `aria-label="Trip status: PLANNING"` (dynamically includes current status) |
| Dropdown announced | `aria-haspopup="listbox"` on badge button |
| Dropdown open state | `aria-expanded="true/false"` on badge button |
| Loading state announced | `aria-busy="true"` + `aria-label` updates to include `"(saving…)"` |
| Error announced | Toast has `role="alert"` — screen readers announce it automatically |
| Options labeled | `role="option"` on each item, `aria-selected="true/false"` |
| Keyboard: open | Space / Enter on badge button |
| Keyboard: navigate | ArrowDown / ArrowUp between options (focus trap within dropdown while open) |
| Keyboard: select | Enter / Space on focused option |
| Keyboard: close | Escape closes dropdown, focus returns to badge button |
| Focus ring | `outline: 2px solid #5D737E; outline-offset: 2px` on keyboard focus (`:focus-visible` only — not on mouse click) |
| Color contrast | PLANNING text `#5D737E` on `#30292F` bg ≈ 3.5:1 (AA for UI components). ONGOING text `rgba(100,200,100,0.9)` on `#30292F` ≈ 4.2:1. COMPLETED text `rgba(252,252,252,0.5)` on `#30292F` ≈ 3.1:1 (acceptable for non-critical UI indicators). |
| Touch target | Badge minimum 44×28px touch area on mobile |
| No color-only info | Status is communicated by text label, not color alone |

---

#### 20.11 TripCard Sync

The `TripCard` component on the Home page (`/`) displays the trip's `status` badge (read-only). After the user changes the status on `TripDetailsPage` and navigates back to Home, the `useTrips` hook re-fetches the trips list (`GET /api/v1/trips`), which will return the updated status.

**No real-time sync is required.** The flow is:
1. User changes status on TripDetailsPage → `onStatusChange(newStatus)` updates parent state locally (TripDetailsPage remains accurate).
2. User navigates to Home → `HomePage` mounts / `useTrips` fetches → `GET /api/v1/trips` returns updated status → TripCard displays correct status.

The Frontend Engineer does **not** need to implement WebSockets, polling, or any cross-page state sharing (e.g., Zustand/Context) for this feature. React Router navigation + standard re-fetch is sufficient.

---

#### 20.12 Integration into TripDetailsPage

The `TripStatusSelector` is integrated in the trip header section of `TripDetailsPage.jsx`. The parent is responsible for:

1. Passing `tripId` (from route params / trip data)
2. Passing `initialStatus` (from the trip object returned by `api.trips.get(tripId)`)
3. Providing an `onStatusChange` callback that updates the parent's local `trip.status` state:
   ```jsx
   const [trip, setTrip] = useState(null);

   const handleStatusChange = (newStatus) => {
     setTrip(prev => ({ ...prev, status: newStatus }));
   };

   // In JSX:
   <div className="trip-header">
     <h1 className="trip-name">{trip.name}</h1>
     <TripStatusSelector
       tripId={trip.id}
       initialStatus={trip.status}
       onStatusChange={handleStatusChange}
     />
   </div>
   ```
4. The `TripStatusSelector` should **not** re-fetch the trip on its own. It only manages its own status state and the PATCH call.

---

#### 20.13 Visual Mockup (Text-Based)

**View mode — PLANNING:**
```
─────────────────────────────────────────────────────────────

  Tokyo Summer Trip                        [• PLANNING ▾]
  Tokyo · Kyoto · Osaka

─────────────────────────────────────────────────────────────
```

**Dropdown open — PLANNING selected:**
```
─────────────────────────────────────────────────────────────

  Tokyo Summer Trip                        [• PLANNING ▾]
                                           ┌──────────────────┐
                                           │ ● PLANNING    ✓  │
                                           │ ● ONGOING        │
                                           │ ● COMPLETED      │
                                           └──────────────────┘
  Tokyo · Kyoto · Osaka

─────────────────────────────────────────────────────────────
```

**Loading state — optimistically showing ONGOING:**
```
─────────────────────────────────────────────────────────────

  Tokyo Summer Trip                        [• ONGOING  ◌]
                                                ↑ spinner, opacity 0.7
  Tokyo · Kyoto · Osaka

─────────────────────────────────────────────────────────────
```

**Error state — reverted to PLANNING, toast visible:**
```
─────────────────────────────────────────────────────────────

  Tokyo Summer Trip                        [• PLANNING ▾]
  Tokyo · Kyoto · Osaka

─────────────────────────────────────────────────────────────


                       ┌───────────────────────────────────────────────┐
                       │  Failed to update trip status. Please try     │  ← bottom-right toast
                       │  again.                               [×]    │
                       └───────────────────────────────────────────────┘
```

**Keyboard focus state:**
```
  Tokyo Summer Trip        ╔══════════════════╗
                           ║ [• PLANNING ▾]   ║  ← 2px solid #5D737E focus ring
                           ╚══════════════════╝
```

---

#### 20.14 Edge Cases

| Scenario | Behavior |
|----------|---------|
| User selects the **same** status that is already set | The dropdown closes. No API call is made. No loading state. No change. |
| API call is in flight and user tries to click the badge | `pointer-events: none` on badge during loading. Second click is impossible. |
| Trip data has an unexpected status value (not one of the 3 enum values) | Badge renders the raw string in `COMPLETED` style (muted/faded) as a safe fallback. Dropdown still shows all 3 valid options. |
| `initialStatus` prop changes (parent re-fetches trip data) | Component re-syncs `currentStatus` via a `useEffect` that watches `initialStatus`. Only applies if not currently in loading state. |
| Network offline | PATCH fails → generic error toast. Badge reverts. User can retry. |

---

*Spec 20 (Sprint 22 — Trip Status Selector) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-10.*

---

## Sprint 24 Specs

---

### Spec 21 — Home Page Trip Status Filter Tabs

**Task:** T-207
**Status:** ✅ Approved (auto-approved per automated sprint cycle)
**Published:** 2026-03-10
**Assigned to:** Frontend Engineer (T-208)

---

#### 21.1 Overview

**Screen:** `HomePage` (`frontend/src/pages/HomePage.jsx`)

**Description:** A row of four filter pills — "All", "Planning", "Ongoing", and "Completed" — positioned above the trip card list on the Home page. Selecting a pill immediately filters the visible trip cards client-side, with no new API call. The active pill is visually distinct from inactive pills. When the active filter yields zero matching trips, a contextual empty state message replaces the card list, with a "Show all" reset link.

**User goal:** Quickly narrow a potentially long trip list to trips at a specific lifecycle stage.

**Component name:** `StatusFilterTabs` (standalone component, imported into `HomePage.jsx`)

**No backend changes required.** The component operates entirely on the `trips` array already fetched and held in `HomePage` state.

---

#### 21.2 User Flow

1. User arrives at the Home page (authenticated). Trip cards are already displayed.
2. User sees the `StatusFilterTabs` row above the trip list. The "All" pill is active by default.
3. User clicks the "Planning" pill.
   - The "Planning" pill becomes visually active (filled style).
   - Trip cards instantly re-render to show only trips where `status === "PLANNING"`.
   - If one or more PLANNING trips exist, the filtered list is shown.
   - If zero PLANNING trips exist, the empty filtered state is shown: _"No Planning trips yet."_ with a "Show all" reset link.
4. User clicks the "Show all" link (empty state scenario) or the "All" pill.
   - Filter resets to "All". All trips are shown again.
5. User can also use the keyboard (Tab, Space/Enter, Arrow keys) to navigate and activate any pill.

---

#### 21.3 Location on Home Page

The `StatusFilterTabs` row is inserted **between the page heading row (which contains the "New Trip" button) and the trip card list**. It sits flush-left, aligned with the left edge of the trip cards, with 24px of vertical spacing above it (from the heading row) and 24px below it (before the first trip card).

```
┌─────────────────────────────────────────────────────────────┐
│  MY TRIPS                              [ + New Trip ]        │  ← existing heading row
├─────────────────────────────────────────────────────────────┤
│                                                             │  ← 24px gap
│  [● All]  [ Planning ]  [ Ongoing ]  [ Completed ]          │  ← StatusFilterTabs (NEW)
│                                                             │  ← 24px gap
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │  Trip Card           │  │  Trip Card           │         │  ← existing trip cards
│  └──────────────────────┘  └──────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

On mobile (≤ 640px), the pills remain on a single row. If horizontal space is insufficient, allow the row to scroll horizontally with `overflow-x: auto`. No pill wrapping to a new line.

---

#### 21.4 Component Structure

```
<StatusFilterTabs>
  <div role="group" aria-label="Filter trips by status">
    <button aria-pressed={true|false}>All</button>
    <button aria-pressed={true|false}>Planning</button>
    <button aria-pressed={true|false}>Ongoing</button>
    <button aria-pressed={true|false}>Completed</button>
  </div>
</StatusFilterTabs>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeFilter` | `string` | `"ALL"` | Currently active filter value. One of: `"ALL"`, `"PLANNING"`, `"ONGOING"`, `"COMPLETED"`. |
| `onFilterChange` | `function` | required | Callback `(filterValue: string) => void`. Called when user clicks a pill or activates via keyboard. |

**Filter value mapping (internal constant):**

| Pill Label | Filter Value | `trip.status` match |
|-----------|--------------|---------------------|
| All | `"ALL"` | no filter (show all) |
| Planning | `"PLANNING"` | `"PLANNING"` |
| Ongoing | `"ONGOING"` | `"ONGOING"` |
| Completed | `"COMPLETED"` | `"COMPLETED"` |

**Filter logic in `HomePage.jsx`:**

```js
const filteredTrips = activeFilter === "ALL"
  ? trips
  : trips.filter(t => t.status === activeFilter);
```

`activeFilter` is local state in `HomePage.jsx`, initialized to `"ALL"`.

---

#### 21.5 Visual Design

##### Pill — Inactive State

- Background: transparent
- Border: `1px solid rgba(93, 115, 126, 0.3)` (subtle border)
- Text color: `rgba(252, 252, 252, 0.5)` (muted)
- Font: IBM Plex Mono, 11px, weight 500, letter-spacing 0.08em, uppercase
- Padding: 6px 14px
- Border-radius: 2px (`--radius-sm`)
- Cursor: pointer

##### Pill — Active State

- Background: `rgba(93, 115, 126, 0.2)` (soft accent fill)
- Border: `1px solid #5D737E` (accent border, full opacity)
- Text color: `#FCFCFC` (full brightness)
- Font: IBM Plex Mono, 11px, weight 600, letter-spacing 0.08em, uppercase
- Padding: 6px 14px
- Border-radius: 2px

##### Pill — Hover State (inactive pill only)

- Background: `rgba(252, 252, 252, 0.04)`
- Border: `1px solid rgba(93, 115, 126, 0.5)`
- Text color: `rgba(252, 252, 252, 0.75)`
- Transition: `all 150ms ease`

##### Pill — Focus State (keyboard)

- Outline: `2px solid #5D737E`
- Outline-offset: `2px`
- (Do not rely on browser default outline — always render the custom ring)

##### Pill row container

- Display: flex
- Flex-direction: row
- Gap: 8px (`--space-2`)
- Align-items: center
- Overflow-x: auto (mobile safety valve)
- No wrap (`flex-wrap: nowrap`)

---

#### 21.6 ASCII Wireframe — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│  MY TRIPS                                       [ + New Trip ]  │
│                                                                 │
│  ╔═══════╗  ┌──────────┐  ┌─────────┐  ┌───────────┐           │
│  ║  ALL  ║  │ PLANNING │  │ ONGOING │  │ COMPLETED │           │
│  ╚═══════╝  └──────────┘  └─────────┘  └───────────┘           │
│    ↑ active (filled bg, accent border, bright text)             │
│      inactive (transparent bg, subtle border, muted text)       │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  Iceland Adventure   │  │  Tokyo Summer        │             │
│  │  Jun 2–14, 2026      │  │  Aug 10–20, 2026     │             │
│  │  PLANNING            │  │  ONGOING             │             │
│  └──────────────────────┘  └──────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 21.7 ASCII Wireframe — Active Filter "Planning" (matches exist)

```
┌─────────────────────────────────────────────────────────────────┐
│  MY TRIPS                                       [ + New Trip ]  │
│                                                                 │
│  ┌─────┐  ╔══════════╗  ┌─────────┐  ┌───────────┐             │
│  │ ALL │  ║ PLANNING ║  │ ONGOING │  │ COMPLETED │             │
│  └─────┘  ╚══════════╝  └─────────┘  └───────────┘             │
│                                                                 │
│  ┌──────────────────────┐                                       │
│  │  Iceland Adventure   │   ← only PLANNING trips shown         │
│  │  Jun 2–14, 2026      │                                       │
│  │  PLANNING            │                                       │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 21.8 ASCII Wireframe — Active Filter "Completed" (no matches — empty filtered state)

```
┌─────────────────────────────────────────────────────────────────┐
│  MY TRIPS                                       [ + New Trip ]  │
│                                                                 │
│  ┌─────┐  ┌──────────┐  ┌─────────┐  ╔═══════════╗             │
│  │ ALL │  │ PLANNING │  │ ONGOING │  ║ COMPLETED ║             │
│  └─────┘  └──────────┘  └─────────┘  ╚═══════════╝             │
│                                                                 │
│                                                                 │
│              No Completed trips yet.                            │
│              Show all                                           │
│              ↑ underlined link, accent color                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 21.9 States

##### 21.9.1 Default State (All)

- Active filter: `"ALL"`
- All `filteredTrips` rendered (same as pre-filter behavior)
- This is the state on first render and after filter reset

##### 21.9.2 Filtered State — Results Exist

- Active filter: `"PLANNING"`, `"ONGOING"`, or `"COMPLETED"`
- Only matching trip cards are rendered
- The filtered count may be 1–N trips
- No additional loading state — filter is purely client-side and instant

##### 21.9.3 Filtered State — Empty (no matching trips)

- Active filter: `"PLANNING"`, `"ONGOING"`, or `"COMPLETED"`
- `filteredTrips.length === 0` AND `trips.length > 0`
- Replace the trip card grid with the empty-filter message:

```
No [Label] trips yet.
Show all
```

Where `[Label]` is the title-cased filter label:
- Filter `"PLANNING"` → "No Planning trips yet."
- Filter `"ONGOING"` → "No Ongoing trips yet."
- Filter `"COMPLETED"` → "No Completed trips yet."

**Empty filtered state layout:**
- Centered horizontally in the trip list area
- Vertical padding: 48px top and bottom
- Text: `rgba(252, 252, 252, 0.5)`, IBM Plex Mono 14px, weight 400
- "Show all" on a new line below the message
- "Show all" styling: IBM Plex Mono 13px, `#5D737E` (accent), underline, cursor pointer
- On click: calls `onFilterChange("ALL")`
- `aria-label="Show all trips"` on the "Show all" link

**Important:** This empty filtered state must NOT be confused with the global empty state shown when `trips.length === 0` (no trips at all). That existing global empty state renders independently and must be left unchanged.

##### 21.9.4 Global Empty State (no trips at all — unchanged)

- `trips.length === 0` — existing behavior, not modified by this spec
- `StatusFilterTabs` is still rendered, but since there are no trips to filter, all filter options result in the same empty trip list
- The global empty state (e.g., "Plan your first trip") still displays
- Do not show the "No [status] trips yet." message when `trips.length === 0`

---

#### 21.10 Responsive Behavior

| Breakpoint | Behavior |
|------------|---------|
| **Desktop (> 1024px)** | Pills in a single row, gap 8px. No overflow needed — all 4 pills fit comfortably. |
| **Tablet (641px – 1024px)** | Same as desktop. Pills scale to available width naturally. |
| **Mobile (≤ 640px)** | Container gets `overflow-x: auto`. Pills remain in a single row with the same 8px gap. No wrapping. User can scroll the pill row horizontally if needed. No horizontal scrollbar visible by default (use `-webkit-overflow-scrolling: touch`, `scrollbar-width: none`). |

On all breakpoints, pill text does not truncate — each pill label fits fully on one line.

---

#### 21.11 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Group label | `<div role="group" aria-label="Filter trips by status">` wraps all pills |
| Pressed state | Each pill is a `<button>` with `aria-pressed="true"` (active) or `aria-pressed="false"` (inactive). Updated on filter change. |
| Focus order | Pills are naturally in tab order. No custom `tabIndex` required — all are `<button>` elements. |
| Keyboard activation | Space or Enter activates the focused pill. Arrow keys (left/right) should move focus between pills within the group (roving tabIndex pattern — see below). |
| Screen reader announcement | When a pill is activated, its `aria-pressed` changes to `true`. Screen readers announce "[Label], pressed, button". |
| Color contrast | Active pill text (`#FCFCFC` on `rgba(93,115,126,0.2)` + `#02111B` bg): meets WCAG AA. Inactive muted text (`rgba(252,252,252,0.5)` on `#02111B`): minimum 3:1 contrast for UI components. |
| "Show all" link | `<button>` or `<a>` with `aria-label="Show all trips"`. Receives focus naturally via Tab. |

**Roving tabIndex for arrow key navigation:**
- Only the active pill has `tabIndex=0`. All other pills have `tabIndex=-1`.
- ArrowRight: move focus to next pill (wraps from last → first).
- ArrowLeft: move focus to previous pill (wraps from first → last).
- Activating a pill via Space/Enter: call `onFilterChange(value)` immediately.
- Arrow key movement alone moves focus but does NOT change the active filter — user must press Space/Enter to activate.

---

#### 21.12 Interaction Detail

| Interaction | Result |
|-------------|--------|
| Click inactive pill | Calls `onFilterChange(value)`. Parent updates `activeFilter` state. Pill becomes active. Trip list re-renders instantly. |
| Click already-active pill | No-op. `onFilterChange` is still called (parent can guard). No visual change. |
| Click "Show all" link | Calls `onFilterChange("ALL")`. Filter resets. All trips shown. |
| Tab key | Moves focus through pills and then to rest of page. |
| ArrowRight/ArrowLeft | Moves focus within the pill group (roving tabIndex). Does NOT activate. |
| Space / Enter on focused pill | Activates the pill (calls `onFilterChange`). |
| Escape key | No special behavior for pills. Page-level Escape handling (e.g., modals) is unaffected. |

---

#### 21.13 Animation / Transitions

- All pill state changes (hover, active, focus): `transition: all 150ms ease`
- Trip card list re-render: instant (no animation). Do not animate the card grid filtering.
- The empty filtered state: appears immediately with no fade (consistent with global empty state behavior).

---

#### 21.14 Code Placement

```
frontend/src/
  components/
    StatusFilterTabs.jsx        ← new component file
    StatusFilterTabs.css        ← (or inline CSS-in-JS / CSS module — match existing convention)
  pages/
    HomePage.jsx                ← import StatusFilterTabs; add activeFilter state; pass filteredTrips to trip list
```

**State ownership:** `activeFilter` lives in `HomePage.jsx` as `useState("ALL")`. `StatusFilterTabs` is a controlled component — it receives `activeFilter` and `onFilterChange` as props.

---

#### 21.15 Edge Cases

| Scenario | Behavior |
|----------|---------|
| Trip's `status` field is `null` or `undefined` | Trip does not match any status filter. It appears under "All" but not under any specific filter pill. No crash. |
| Trip's `status` is an unexpected value (e.g., `"ARCHIVED"`) | Same as above — not matched by any specific filter. Appears only under "All". |
| All trips happen to share the same status (e.g., all PLANNING) | "Planning" pill shows all trips. "Ongoing" and "Completed" each show the empty filtered state. Correct behavior. |
| User creates a new trip while a non-"All" filter is active | New trip may or may not appear in the filtered list depending on its status. This is correct behavior. No special handling needed. |
| `trips` array is loading (initial fetch in progress) | `StatusFilterTabs` is rendered with the same loading skeleton/spinner behavior as the existing home page. Pills can be shown even during load (they have no data dependency of their own). |
| Only one trip total | Filter works as expected. |

---

#### 21.16 Full Annotated Wireframe (Desktop)

```
MAX CONTENT WIDTH: 1120px, centered
─────────────────────────────────────────────────────────────────────────────

  MY TRIPS                                              [ + New Trip ]
  ─────────────────────────────────────── section header line ──────────────

                        ↕ 24px gap

  ╔═══════╗   ┌──────────┐   ┌─────────┐   ┌───────────┐
  ║  ALL  ║   │ PLANNING │   │ ONGOING │   │ COMPLETED │
  ╚═══════╝   └──────────┘   └─────────┘   └───────────┘
  │       │
  │ active: bg rgba(93,115,126,0.2), border #5D737E, text #FCFCFC 600 │
  │ inactive: bg transparent, border rgba(93,115,126,0.3), text rgba(252,252,252,0.5) 500 │
  │ gap between pills: 8px │
  │ pill padding: 6px 14px │
  │ font: IBM Plex Mono 11px uppercase letter-spacing 0.08em │
  │ border-radius: 2px │

                        ↕ 24px gap

  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
  │  Iceland Adventure              │   │  Tokyo Summer                   │
  │  Jun 2–14, 2026                 │   │  Aug 10–20, 2026                │
  │  [ PLANNING ]                   │   │  [ ONGOING ]                    │
  └─────────────────────────────────┘   └─────────────────────────────────┘

─────────────────────────────────────────────────────────────────────────────
```

---

#### 21.17 Empty Filtered State Wireframe

```
─────────────────────────────────────────────────────────────────────────────

  MY TRIPS                                              [ + New Trip ]
  ─────────────────────────────────────── section header line ──────────────

  ┌─────┐   ┌──────────┐   ┌─────────┐   ╔═══════════╗
  │ ALL │   │ PLANNING │   │ ONGOING │   ║ COMPLETED ║
  └─────┘   └──────────┘   └─────────┘   ╚═══════════╝

                        ↕ 48px gap

                   No Completed trips yet.
                        Show all            ← accent #5D737E, underline

                        ↕ 48px gap

─────────────────────────────────────────────────────────────────────────────
```

---

*Spec 21 (Sprint 24 — Home Page Trip Status Filter Tabs) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-10.*

---

## Sprint 25 Specs

---

### Spec 22: Trip Details Page — Calendar Integration (TripCalendar Component)

**Sprint:** #25
**Related Task:** T-211
**Status:** Approved

**Description:**
Replace the "Calendar coming in Sprint 2" placeholder at the top of TripDetailsPage with a fully functional `TripCalendar` component. The calendar provides a visual, month/week overview of all trip events — flights, stays, and activities — overlaid on a date grid. It is read-only; all editing continues to happen through the section forms below the calendar. Clicking an event scrolls to the relevant section on the page. The calendar is the first thing a user sees when they open a trip, giving them an immediate spatial understanding of their itinerary.

**Target Users:** Detail-oriented travelers who want an at-a-glance visual overview of their trip schedule before diving into section-level detail.

---

#### 22.1 Page Placement

The `TripCalendar` component occupies the top slot of `TripDetailsPage.jsx`, replacing the existing placeholder. Layout order from top to bottom:

```
[ Navbar ]
[ Page Header: Trip Name + Destinations + Status Badge + Print Button ]
[ TripCalendar ]                          ← replaces placeholder
[ Flights Section ]
[ Stays Section ]
[ Activities Section ]
```

- **Spacing above calendar:** 32px (`var(--space-8)`) below the page header
- **Spacing below calendar:** 48px (`var(--space-12)`) before the Flights section header
- **Component width:** Full content width (inherits the 1120px max-width container)
- **Component background:** `var(--surface)` (`#30292F`), border `1px solid var(--border-subtle)`, border-radius `var(--radius-md)` (4px), padding 24px

---

#### 22.2 Data Source

The component fetches from the calendar aggregation endpoint:

```
GET /api/v1/trips/:id/calendar
```

**Response shape:**
```json
{
  "events": [
    {
      "id": "flight-uuid",
      "type": "FLIGHT",
      "title": "DL12345 — SFO → LAX",
      "start_date": "2026-08-07",
      "end_date": "2026-08-07",
      "start_time": "06:00",
      "end_time": "08:00",
      "timezone": "America/New_York",
      "source_id": "original-flight-uuid"
    }
  ]
}
```

- Events are ordered by `start_date ASC`, `start_time ASC`
- STAY events may span multiple days (`start_date ≠ end_date`)
- FLIGHT events are single-day (`start_date === end_date`) with `start_time` and `end_time`
- ACTIVITY events are single-day with `start_time` and `end_time`
- Use the existing `api` axios instance (with interceptors) for the fetch call

---

#### 22.3 Event Color Coding

Each event type uses a distinct CSS custom property — never hardcoded hex.

Add these tokens to the `:root` block in `index.css` (or the component's `.module.css` as component-scoped vars):

```css
--event-flight-bg:    rgba(93, 115, 126, 0.25);   /* accent-tinted */
--event-flight-border: #5D737E;
--event-flight-text:  #FCFCFC;

--event-stay-bg:      rgba(100, 160, 120, 0.2);   /* muted green */
--event-stay-border:  rgba(100, 180, 120, 0.6);
--event-stay-text:    rgba(140, 210, 160, 0.9);

--event-activity-bg:  rgba(180, 140, 80, 0.18);   /* muted amber */
--event-activity-border: rgba(200, 160, 90, 0.5);
--event-activity-text: rgba(220, 185, 110, 0.9);
```

**Color Legend Strip** — rendered inside the calendar panel, top-right corner, as a horizontal row of three labeled swatches:

```
● Flight   ● Stay   ● Activity
```

Each swatch: 10px × 10px circle (`border-radius: 50%`), background = event type color, followed by label text in IBM Plex Mono 10px uppercase letter-spacing 0.08em, muted color. Gap between swatches: 16px. The entire legend row is `flex`, `align-items: center`, `gap: 16px`. Positioned at the top-right of the calendar panel using `display: flex; justify-content: space-between` on the panel header row (left: "CALENDAR" section header label; right: legend strip).

---

#### 22.4 Calendar View — Month Grid (Default)

**Default view:** Month grid. Shows the calendar month that contains the trip's first event. If no events exist, shows the current month.

**Grid structure:**
- **Header row:** 7 cells for day-of-week abbreviations — `SUN MON TUE WED THU FRI SAT` — font-size 10px, font-weight 600, letter-spacing 0.1em, uppercase, color `var(--text-muted)`. Each cell: `text-align: center`, padding-bottom 8px.
- **Day cells:** 7 columns × up to 6 rows. Each cell: minimum height 80px on desktop (auto-expands if many events). Border: `1px solid var(--border-subtle)` on all four sides — creates a grid of cells. Background: `var(--bg-primary)`. Border-radius: 0 (no rounded corners on individual cells — clean grid).
- **Day number:** top-left corner of each cell, font-size 12px, font-weight 500, color `var(--text-muted)`. Padding: 6px 8px.
- **Current day:** If today falls within the displayed month, the day number uses color `var(--text-primary)` with a 2px bottom border in `var(--accent)`. No filled circle — Japandi minimal.
- **Out-of-month days:** Cells from the previous/next month that fill the grid rows. Day number: `rgba(252, 252, 252, 0.15)`. Background: `rgba(2, 17, 27, 0.4)` (slightly darker). No events rendered in out-of-month cells.

**Month Navigation:**
- Header row above the grid:
  ```
  [ ← ]   August 2026   [ → ]
  ```
  - Month + year: IBM Plex Mono 14px, font-weight 500, `var(--text-primary)`, centered
  - Arrows: `←` and `→` as secondary button style (transparent background, border `1px solid var(--border-subtle)`, padding 4px 10px, border-radius 2px). Hover: background `rgba(252,252,252,0.05)`.
  - `aria-label="Previous month"` and `aria-label="Next month"` on each arrow button
  - Clicking `←` or `→` switches the displayed month. Does NOT change the data — all events remain loaded.

---

#### 22.5 Event Rendering Inside Grid Cells

**Single-day events (FLIGHT, ACTIVITY):**
- Rendered as a horizontal pill inside the day cell
- Pill: width fills the cell (with 4px horizontal margin on each side), height 20px, background `var(--event-[type]-bg)`, border-left `3px solid var(--event-[type]-border)`, border-radius 2px, overflow hidden
- Text inside pill: `start_time` then truncated `title`. Font: IBM Plex Mono 10px, color `var(--event-[type]-text)`. No wrapping — `text-overflow: ellipsis; white-space: nowrap; overflow: hidden`.
- Format: `06:00 DL12345 — SFO → LAX` (time first, then title)
- If multiple events on same day: stack pills vertically with 2px gap. If more than 3 events fit (cell height exceeded), show the first 2 pills + a `+N more` text label (font 10px, muted color) below them. `+N more` is not interactive (no click behavior in MVP).

**Multi-day events (STAY):**
- Rendered as a horizontal spanning bar across the cells it occupies
- Implemented as a pill in each individual day cell — not a true CSS span (simpler implementation)
- On the start day: pill with left border-radius 2px, right border-radius 0, no right border
- On a middle continuation day: pill with 0 border-radius on both sides, no left or right border (border-left only for visual start indicator on first day)
- On the end day: pill with left border-radius 0, right border-radius 2px, no left border
- Pill background: `var(--event-stay-bg)`, border-left `3px solid var(--event-stay-border)` only on the start day
- Text: shown only in the start day cell. Middle/end day cells show the pill with no text (visual continuation). Font: IBM Plex Mono 10px, `var(--event-stay-text)`.
- Format in start cell: `name` (e.g., "Hyatt Regency SF"), truncated with ellipsis

---

#### 22.6 Click-to-Scroll Behavior

Each event pill is interactive — clicking it scrolls the page to the corresponding section.

| Event Type | Scrolls To |
|------------|-----------|
| FLIGHT | `#flights-section` anchor |
| STAY | `#stays-section` anchor |
| ACTIVITY | `#activities-section` anchor |

**Scroll behavior:** `element.scrollIntoView({ behavior: 'smooth', block: 'start' })` with a top offset of 80px to account for the sticky navbar. Implement using a ref or `id` attribute on each section header.

**Cursor:** `cursor: pointer` on all event pills.
**Focus:** Event pills must be keyboard-focusable (see §22.10 Accessibility).

**No edit modal opens** — the click only scrolls. Editing is done by using the section forms below.

---

#### 22.7 Component States

##### State 1: Loading

While `GET /api/v1/trips/:id/calendar` is in-flight:

- Show the calendar panel chrome (border, heading row with "CALENDAR" label and legend placeholders)
- Replace the grid area with a skeleton:
  - 7-column grid skeleton with the same day-of-week header row (real labels, not skeletons)
  - Day cells: filled with `var(--surface-alt)` background, border `var(--border-subtle)`. No shimmer needed — static muted cells are sufficient.
  - 3 randomly-placed skeleton event pills per row (fixed positions, not random): gray pill shapes `var(--surface-alt)`, opacity 0.5, no text
  - Aria: `aria-busy="true"` on the calendar container, `aria-label="Loading calendar…"`

##### State 2: Empty

When `events` array is empty (trip has no flights, stays, or activities yet):

- Show the full calendar grid for the current month (navigable)
- Inside the grid area, centered vertically and horizontally over the grid, display an overlay message:
  ```
  Add flights, stays, or activities
  to see them here.
  ```
  - Font: IBM Plex Mono 13px, font-weight 400, color `var(--text-muted)`, `text-align: center`
  - The grid is still visible behind the message (grid is rendered but has no event pills)
  - **Do NOT show** the old placeholder text "Calendar coming in Sprint 2"
  - The empty message is NOT a full overlay with background — it sits in the space above the grid rows, between the day-of-week header and the first row of cells. Height: 120px, flexbox centered.

##### State 3: Error

When the API call fails (network error, 4xx, 5xx):

- Hide the grid entirely
- Show an error state inside the calendar panel:
  ```
  [ calendar unavailable ]

  Could not load calendar data.
  [ Try again ]
  ```
  - "calendar unavailable": 11px, uppercase, letter-spacing 0.1em, `var(--text-muted)`
  - Message: 13px, `var(--text-muted)`
  - "Try again": secondary button style, triggers a re-fetch of the calendar endpoint
  - Layout: vertically and horizontally centered within the panel. Minimum height: 200px for the error area.
  - The rest of the TripDetailsPage (flights, stays, activities sections) remains fully functional. The calendar error is isolated to the TripCalendar component.

##### State 4: Success (Data Loaded)

- Full month grid rendered with event pills
- Month navigation (← →) works
- Legend strip visible in top-right
- All event pills are interactive (click-to-scroll)

---

#### 22.8 Month Display Logic

When events are loaded:

1. Parse the `start_date` of the first event (earliest, since events are ordered ASC)
2. Display the month that contains that `start_date` on initial render
3. If the trip spans multiple months, user can navigate forward/backward with the arrow buttons
4. If no events: display the current calendar month (use `new Date()`)

Navigation state is local to the component (`useState` for displayed month/year). Navigation does not re-fetch data — all events are loaded once and the component filters by displayed month on render.

---

#### 22.9 Responsive Behavior

**Desktop (≥ 768px):** Full 7-column month grid as described above.

**Tablet (768px — 480px):** Same 7-column grid. Day cell minimum height reduces to 64px. Font sizes remain the same. Navigation header remains horizontal. Event pills may truncate earlier due to narrower cells.

**Mobile (< 480px):** Switch from month grid to a **day list** layout:

- No 7-column grid. Instead, render a vertically scrolling list of days that have events.
- Each day entry:
  ```
  ┌────────────────────────────────────────────┐
  │  MON, AUG 7                                │
  │  ─────────────────────────────────────     │
  │  [✈ 06:00] DL12345 — SFO → LAX            │
  │  [🏨] Hyatt Regency SF (check-in)          │
  └────────────────────────────────────────────┘
  ```
  - Day label: 11px, font-weight 600, uppercase, letter-spacing 0.08em, `var(--text-primary)`
  - Separator: `1px solid var(--border-subtle)`, margin-bottom 8px
  - Event row: type icon (text emoji or unicode character — ✈ for FLIGHT, ⌂ for STAY, ● for ACTIVITY) + time (if available) + truncated title
  - Event row: 12px, color `var(--event-[type]-text)`, padding 4px 0
  - Background: each day entry is `var(--surface)` with `1px solid var(--border-subtle)`, border-radius 2px, padding 12px, margin-bottom 8px
  - Days with no events are NOT listed (show only days that have ≥ 1 event)
- Month navigation header (← month → ) remains at the top of the component on mobile. Tapping ← / → replaces the day list with days from the new month.
- If the selected month has no events: "No events this month." in muted text, centered.
- The month/week toggle described in desktop spec becomes a single "Month" view label on mobile (no toggle — always day list on mobile).
- Click-to-scroll behavior works the same on mobile.

**Breakpoint implementation:** Use a CSS custom property or media query inside `TripCalendar.module.css`. The component renders different JSX based on viewport width, detected via a `useWindowWidth` hook (or CSS `display:none` toggling for simpler implementation — CSS approach preferred for performance).

---

#### 22.10 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Calendar container role | `role="region"` with `aria-label="Trip calendar"` |
| Grid role | `role="grid"` on the `<table>` or CSS grid container |
| Row role | `role="row"` on each week row |
| Cell role | `role="gridcell"` on each day cell. `aria-label="August 7, 2026"` (full date string) |
| Event pills | `role="button"` (since they're interactive), `tabIndex={0}`, `aria-label="[Type]: [Title], [start_time]–[end_time]"` — e.g., `aria-label="Flight: DL12345 — SFO → LAX, 06:00–08:00"` |
| Keyboard: Tab | Tab cycles through the month navigation buttons and then through all event pills in document order |
| Keyboard: ArrowLeft/Right/Up/Down | When focus is inside the grid, arrow keys move focus between day cells |
| Keyboard: Enter/Space on event pill | Triggers the click-to-scroll behavior |
| Keyboard: Enter/Space on nav arrows | Navigates to the previous/next month |
| Loading state | `aria-busy="true"` on calendar container while fetching |
| Error state | `role="alert"` on the error message container |
| Empty state | `aria-label="No events. Add flights, stays, or activities to populate the calendar."` on the empty area |
| Month nav buttons | `aria-label="Previous month"` and `aria-label="Next month"` |
| Color contrast | All event text colors against event backgrounds must meet WCAG AA (4.5:1). The proposed tokens meet this. Do not change without contrast check. |
| Focus ring | `outline: 2px solid var(--accent); outline-offset: 2px` on all focusable elements (event pills, nav buttons, day cells when in grid navigation mode) |

---

#### 22.11 Component File Structure

```
frontend/src/components/
  TripCalendar.jsx          ← main component
  TripCalendar.module.css   ← all styles, CSS custom properties for event colors

frontend/src/__tests__/
  TripCalendar.test.jsx     ← minimum 10 tests (see T-213 acceptance criteria)
```

**Props:**
```jsx
<TripCalendar tripId={tripId} />
```

- `tripId` (string, required): the trip UUID, used to build the API URL
- No other props — the component is self-contained and fetches its own data

**Internal state:**
```
displayedMonth  — { year: number, month: number } (0-indexed month, JS Date convention)
events          — array from API response, or []
loading         — boolean
error           — null | Error
```

---

#### 22.12 Integration with TripDetailsPage

**Section anchor IDs** (must be added to `TripDetailsPage.jsx` if not already present):

```jsx
<section id="flights-section">   {/* Flights section header + content */}
<section id="stays-section">     {/* Stays section header + content */}
<section id="activities-section"> {/* Activities section header + content */}
```

These IDs are the scroll targets for calendar event click-to-scroll. The Frontend Engineer must verify these IDs exist or add them.

**Placeholder removal:** Delete the following placeholder from `TripDetailsPage.jsx`:
```jsx
{/* Sprint 2 calendar placeholder — remove when TripCalendar is implemented */}
<div className={styles.calendarPlaceholder}>
  Calendar coming in Sprint 2
</div>
```
(Exact text may vary — search for "Calendar coming" or "Sprint 2" in the file and remove that block.)

**Replacement:**
```jsx
import TripCalendar from '../components/TripCalendar';

// Inside TripDetailsPage render, at the top of the content area:
<TripCalendar tripId={tripId} />
```

---

#### 22.13 Annotated Wireframe — Desktop (Success State)

```
MAX CONTENT WIDTH: 1120px, centered
═══════════════════════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────────────────┐
  │  CALENDAR                            ● Flight  ● Stay  ● Activity   │  ← panel header row
  │  ──────────────────────────────────────────────────────────────────  │
  │                                                                      │
  │              [ ← ]   August 2026   [ → ]                            │  ← month nav
  │                                                                      │
  │  SUN    MON    TUE    WED    THU    FRI    SAT                       │  ← DOW header
  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
  │  │ 26 │ │ 27 │ │ 28 │ │ 29 │ │ 30 │ │ 31 │ │  1 │                  │  ← out-of-month
  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │
  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
  │  │  2 │ │  3 │ │  4 │ │  5 │ │  6 │ │  7 │ │  8 │                  │
  │  │    │ │    │ │    │ │    │ │    │ │╔══╗│ │ ╠══╗│                  │
  │  │    │ │    │ │    │ │    │ │    │ │║✈ ║│ │ ║  ║│  ← flight pill  │
  │  │    │ │    │ │    │ │    │ │    │ │╚══╝│ │ ╟──╢│  ← stay start  │
  │  │    │ │    │ │    │ │    │ │    │ │║🏨 ║│ │ ║  ║│                  │
  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │
  │  ...                                                                 │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
```

---

#### 22.14 Annotated Wireframe — Desktop (Empty State)

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │  CALENDAR                                                            │
  │  ──────────────────────────────────────────────────────────────────  │
  │                                                                      │
  │              [ ← ]   March 2026   [ → ]                             │
  │                                                                      │
  │  SUN    MON    TUE    WED    THU    FRI    SAT                       │
  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
  │  │    │ │    │ │    │ │    │ │    │ │    │ │    │                   │
  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │
  │                                                                      │
  │            Add flights, stays, or activities                         │
  │                  to see them here.                                   │
  │                                                                      │
  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
  │  │    │ │    │ │    │ │    │ │    │ │    │ │    │                   │
  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │
  └──────────────────────────────────────────────────────────────────────┘
```

---

#### 22.15 Annotated Wireframe — Mobile (< 480px, Day List View)

```
  ┌─────────────────────────────────────┐
  │  CALENDAR                           │
  │  ─────────────────────────────────  │
  │  [ ← ]     August 2026     [ → ]   │
  │  ─────────────────────────────────  │
  │                                     │
  │  THU, AUG 7                         │
  │  ─────────────────                  │
  │  ✈ 06:00  DL12345 — SFO → LAX      │
  │  ⌂        Hyatt Regency SF          │
  │                                     │
  │  FRI, AUG 8                         │
  │  ─────────────────                  │
  │  ⌂        Hyatt Regency SF          │
  │  ●  09:00 Fisherman's Wharf         │
  │  ●  15:00 Golden Gate Bridge        │
  │                                     │
  │  SAT, AUG 9                         │
  │  ─────────────────                  │
  │  ●  09:00 Dimsum in Chinatown       │
  │                                     │
  └─────────────────────────────────────┘
```

---

#### 22.16 Edge Cases

| Scenario | Behavior |
|----------|---------|
| Trip spans multiple months | Calendar shows the month of the first event. User navigates forward with `→` to see later months. All events loaded at once — no additional fetches on navigation. |
| Single-day trip (all events on same date) | Calendar shows that month; all events stack in one day cell |
| Event `start_time` is null/undefined | Pill shows title only, no time prefix. No crash. |
| Event `title` is very long | Truncated with `text-overflow: ellipsis` in pill. Full title is in `aria-label` of the pill element. |
| Stay check-out on same day as another event's start | Both appear in the same cell. Stay continuation pill + new event pill, stacked. |
| Stay with start_date === end_date (same-day stay) | Treated as single-day event (pill with left border-radius and right border-radius). |
| API returns events from different years | Month navigation works across years. Year is displayed alongside month in the header. |
| No internet / API timeout (> 5s) | Component catches the error and shows the error state with "Try again" button. Does not block other page sections. |
| TripCalendar unmounts before fetch completes | Cancel or ignore the response (use AbortController or check mounted flag in useEffect cleanup). No state-update-on-unmounted-component warnings. |
| `+N more` overflow label | Shown when > 3 event pills would overflow a cell. Label is not clickable. Scrolling to the section (via clicking visible pills) is the intended interaction. |

---

#### 22.17 Styling Conventions Checklist

All styles must adhere to the Design System Conventions table at the top of this document:

- [x] All colors via CSS custom properties — no hardcoded hex in JSX or CSS
- [x] Font: `var(--font-mono)` (IBM Plex Mono) for all text
- [x] Spacing: multiples of 8px base unit using `var(--space-*)` tokens
- [x] Border radius: `var(--radius-sm)` (2px) or `var(--radius-md)` (4px)
- [x] Borders: `var(--border-subtle)` or `var(--border-accent)` — no other border values
- [x] Japandi aesthetic: no gradients, no box-shadow. Borders only for depth. Generous whitespace.
- [x] Transitions: `transition: all 150ms ease` for hover/focus on interactive elements

---

*Spec 22 (Sprint 25 — Trip Details Page Calendar Integration) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-10.*

---

## Sprint #26 Design Agent Review — 2026-03-11

**Design Agent Status:** No new UI specs required this sprint.

**Rationale:** Sprint #26 is a production deployment sprint. All tasks (T-218–T-226) are assigned to Deploy Engineer, Backend Engineer, QA Engineer, User Agent, and Monitor Agent. There are no new frontend features, no new screens, and no component changes in scope.

**Sprint #26 scope confirms:**
- T-218: Backend restart + Playwright rerun (Deploy Engineer — no UI impact)
- T-219: User Agent regression walkthrough (validation only — no spec changes required)
- T-220: `knexfile.js` SSL + pool config (Backend Engineer — no UI impact)
- T-221: Cookie `SameSite=none` fix (Backend Engineer — no UI impact)
- T-222: `render.yaml` + production deploy guide (Deploy Engineer — no UI impact)
- T-223: Pre-production QA review (QA Engineer — no UI impact)
- T-224: Production deployment to Render + AWS RDS (Deploy Engineer — no UI impact)
- T-225: Post-production health check (Monitor Agent — no UI impact)
- T-226: Monitor Agent process fix / test user seed (Backend Engineer — no UI impact)

**Design System Conventions:** Stable. No changes proposed. All conventions from the table above remain in effect for Sprint #27 and beyond.

**Most recent spec:** Spec 22 (TripCalendar — Sprint #25, T-211) — Status: Approved. Already handed off and implemented by Frontend Engineer.

**Next expected design work:** Sprint #27 — pending Manager triage of T-219 User Agent feedback and any post-production UX observations from T-225 Monitor Agent report.

*Sprint #26 design review complete. Published by Design Agent 2026-03-11.*

---

## Sprint #30 Design Agent Review — 2026-03-17

**Design Agent Status:** No new screens required. One targeted spec addendum added for T-243 (LAND_TRAVEL calendar pill integration via API event type).

**Sprint #30 scope review:**

| Task | Type | Design Impact |
|------|------|---------------|
| T-238 | Backend bug fix (status persistence) | None — no UI change |
| T-239 | Frontend bug fix (TripStatusSelector PATCH) | None — existing selector component behavior; no visual change |
| T-240 | Backend bug fix (flight timezone storage) | None — no UI change |
| T-241 | Frontend bug fix (flight card time display) | None — existing FlightCard and formatDate; visual output corrects itself after fix |
| T-242 | Backend: add LAND_TRAVEL to calendar API | None — data shape change only |
| T-243 | Frontend: render LAND_TRAVEL in TripCalendar | **See Spec 26 addendum below** — clarifies pill format for the new `type: "LAND_TRAVEL"` event from the calendar API |

**Design System Conventions:** Stable. No changes proposed.

**Relevant prior specs for T-239/T-241:**
- `TripStatusSelector` appearance: Spec 7 (Status Badges convention in Design System table) — badge styling unchanged; the fix is in the PATCH request body, not the visual.
- `FlightCard` time display: Spec 7 (FlightCard spec) — time format unchanged; the fix corrects UTC conversion so the already-specified format (`6:50 AM ET`) renders correctly.

---

### Spec 26: TripCalendar — LAND_TRAVEL Event Type Integration (Sprint 30 — T-243)

**Sprint:** #30
**Related Tasks:** T-242 (Backend: API change), T-243 (Frontend: render LAND_TRAVEL pills)
**Status:** Approved
**Priority:** P1

---

#### 26.1 Overview

This addendum is a **targeted extension** to the existing TripCalendar chip rendering pipeline. It adds handling for the new `type: "LAND_TRAVEL"` event objects returned by `GET /api/v1/trips/:id/calendar` (after T-242 is merged). All existing chip types (FLIGHT, STAY, ACTIVITY) are unaffected. All previously specified land travel chip styles (color, time display, location logic, rental car prefixes) remain authoritative — this spec only bridges the new API event shape to those existing conventions.

**Context:** Prior to Sprint 30, land travel was not included in the calendar API response — `TripCalendar.jsx` had no `type === "LAND_TRAVEL"` events to render even though the visual spec existed. T-242 adds LAND_TRAVEL events to the calendar endpoint. T-243 adds the corresponding rendering branch in TripCalendar.

---

#### 26.2 Incoming API Event Shape (from T-242)

The `GET /api/v1/trips/:id/calendar` response will include LAND_TRAVEL events with this shape (per T-242 backend implementation):

```json
{
  "type": "LAND_TRAVEL",
  "title": "Train — London → Paris",
  "start": "2026-08-07T10:00:00",
  "end": "2026-08-07T14:30:00",
  "date": "2026-08-07"
}
```

**Field semantics:**
| Field | Description |
|-------|-------------|
| `type` | Always `"LAND_TRAVEL"` for these events |
| `title` | `"{mode} — {from_location} → {to_location}"` — formatted by the backend. Mode is the display label (e.g., "Train", "Bus", "Rental Car", "Rideshare", "Ferry", "Other") |
| `start` | ISO datetime string of departure (no timezone suffix — local wall-clock time, same behavior as activity times) |
| `end` | ISO datetime string of arrival, or equal to `start` if no arrival time stored |
| `date` | YYYY-MM-DD date of the event (departure date) |

**Note on arrival day:** If a land travel entry has an `arrival_date` different from `departure_date`, the backend emits **two** separate events: one for the departure day (with `date = departure_date`) and one for the arrival day (with `date = arrival_date`). The Frontend Engineer should not attempt to split or re-derive multi-day events from a single entry — trust the API to emit the correct events per day.

---

#### 26.3 Pill Visual Design

The LAND_TRAVEL pill uses the existing `--color-land-travel` token established in Sprint 6 (muted purple `#7B6B8E`). Do not introduce a new color.

**Pill appearance:**
- Background: `rgba(123, 107, 142, 0.2)` (`--color-land-travel` at 20% opacity) — matches existing land travel chip spec
- Border-left: `2px solid var(--color-land-travel)` — left accent bar (same as other calendar chips)
- Text color: `var(--color-land-travel)` (`#7B6B8E`)
- Font-size: 10px, font-weight: 500
- Height: 18px, padding: 0 6px, border-radius: 2px
- Truncate with `text-overflow: ellipsis` if content overflows chip width

**Pill label format:**

The pill text is derived from the `title` and `start`/`end` fields:

```
"{mode} {departure_time}–{arrival_time}"
```

Where:
- `{mode}` is the first segment of `title` before ` — ` (e.g., `"Train"`, `"Bus"`, `"Rental Car"`)
- `{departure_time}` is extracted from the `start` field using `formatTime()` (same utility used for other event types — renders `HH:MM` 24h or `h:MM AM/PM` depending on the app's locale convention; match the format used for flights and activities)
- `{arrival_time}` is extracted from the `end` field using `formatTime()`
- If `start === end` (no arrival time), omit the `–{arrival_time}` segment: show `"{mode} {departure_time}"`
- If `start` time portion is `00:00` and `end` time portion is `00:00` (no times stored), show just the mode label without any time: `"{mode}"`

**Examples:**
| Scenario | Pill text |
|----------|-----------|
| Train, 10:00 departure, 14:30 arrival | `"Train 10:00–14:30"` |
| Bus, 08:00 departure, no arrival | `"Bus 08:00"` |
| Rental Car, no departure/arrival times | `"Rental Car"` |
| Ferry, 22:00 departure, 06:00 arrival (next day, arrival pill) | `"Ferry 06:00"` ← arrival-day pill shows arrival time only |

**Arrival-day pill:** For the backend-emitted arrival-day event, the pill shows only the arrival time (from `start` field of that event) preceded by the mode. The from/to location is not shown on calendar pills — it is in the `title` field but omitted from the pill text to keep chips compact.

---

#### 26.4 Click-to-Scroll Behavior

Clicking a LAND_TRAVEL pill on the calendar scrolls smoothly to the `#land-travels-section` anchor on `TripDetailsPage`. This matches the established pattern for other event types (flights → `#flights-section`, stays → `#stays-section`, activities → `#activities-section`).

**Implementation pattern:**
```jsx
onClick={() => {
  document.getElementById('land-travels-section')?.scrollIntoView({ behavior: 'smooth' });
}}
```

The cursor on the pill should be `pointer`. The pill should have a subtle hover state: background increases to `rgba(123, 107, 142, 0.3)` (slightly more opaque) on hover — consistent with the hover behavior of other clickable event chips.

---

#### 26.5 Placement and Ordering in the Day Cell

Event ordering within a day cell (top to bottom):
1. FLIGHT events
2. STAY events (continuation bars)
3. ACTIVITY events
4. **LAND_TRAVEL events** ← new, always last

When a cell has more than 3 total events, the `+N more` overflow indicator applies as usual. LAND_TRAVEL events are lowest priority for the visible slots (they may be hidden behind `+N more` if the cell is full with flights, stays, and activities).

---

#### 26.6 Day Popover Integration

When the user opens the day popover (clicking a day cell that has `+N more`), LAND_TRAVEL events appear in the popover list after flights, stays, and activities. The popover chip for a LAND_TRAVEL event uses the same visual style as the inline pill (same background, border-left, text color) and the same label format.

The popover item shows the full `title` string (e.g., `"Train — London → Paris"`) as a secondary line below the time for context, if space permits. This is optional — if the popover layout is fixed-height or compact, showing just the pill label is acceptable.

---

#### 26.7 States

| State | Behavior |
|-------|----------|
| No land travel entries in trip | No LAND_TRAVEL pills appear — calendar unchanged |
| Land travel with departure + arrival on same day | One pill on that day: `"{mode} {dep_time}–{arr_time}"` |
| Land travel with departure + arrival on different days | Two pills: departure-day shows `"{mode} {dep_time}"`, arrival-day shows `"{mode} {arr_time}"` |
| Land travel with no times stored | One pill on departure day: `"{mode}"` (mode label only) |
| `title` field is very long (long location names) | Truncate with ellipsis; full title is in `aria-label` |
| LAND_TRAVEL events alongside many other event types | LAND_TRAVEL goes last in cell ordering; may fall into `+N more` overflow |
| `#land-travels-section` element not found in DOM | `scrollIntoView` call is a no-op (optional chaining `?.` handles gracefully) |

---

#### 26.8 Accessibility

- Each LAND_TRAVEL pill: `role="button"`, `tabIndex={0}`, `aria-label="Land travel: {title} on {formatted date} — scroll to land travel section"`
- `onKeyDown` handler: activate scroll on `Enter` or `Space` key
- Focus ring: `outline: 2px solid var(--color-land-travel)` on focus (matching accent focus ring convention but using the land travel color)

---

#### 26.9 Test Plan (T-243)

The Frontend Engineer must add the following tests to `TripCalendar.test.jsx`:

**Test 26.A — LAND_TRAVEL pill renders with departure and arrival time**
```
Given: GET /calendar returns a LAND_TRAVEL event with title "Train — London → Paris", start "2026-08-07T10:00:00", end "2026-08-07T14:30:00", date "2026-08-07"
When:  TripCalendar renders August 2026
Then:  A pill reading "Train 10:00–14:30" appears on August 7
And:   The pill has the land travel color styling (var(--color-land-travel))
```

**Test 26.B — LAND_TRAVEL pill renders with departure time only (no arrival)**
```
Given: A LAND_TRAVEL event with start "2026-08-07T08:00:00", end "2026-08-07T08:00:00" (start === end)
When:  TripCalendar renders August 2026
Then:  The pill reads "Bus 08:00" (no arrival time appended)
```

**Test 26.C — LAND_TRAVEL pill click scrolls to land-travels-section**
```
Given: A LAND_TRAVEL event pill is rendered
When:  User clicks the pill
Then:  document.getElementById('land-travels-section').scrollIntoView is called with { behavior: 'smooth' }
```

**Test 26.D — No LAND_TRAVEL pills when no events of that type**
```
Given: GET /calendar returns only FLIGHT and STAY events (no LAND_TRAVEL)
When:  TripCalendar renders
Then:  No land travel color pills appear in any day cell
And:   All existing FLIGHT and STAY pills render correctly (no regression)
```

**Test 26.E — LAND_TRAVEL appears after FLIGHT/STAY/ACTIVITY in cell ordering**
```
Given: A day cell that has one FLIGHT, one STAY, and one LAND_TRAVEL event
When:  TripCalendar renders that day
Then:  The FLIGHT pill appears first, STAY second, LAND_TRAVEL third
```

---

#### 26.10 Files to Modify (T-243)

| File | Change |
|------|--------|
| `frontend/src/components/TripCalendar.jsx` | Add `type === "LAND_TRAVEL"` branch in the event rendering logic. Extract mode from `title`. Format departure/arrival from `start`/`end`. Add click-to-scroll handler. |
| `frontend/src/__tests__/TripCalendar.test.jsx` | Add Tests 26.A through 26.E (5 new tests) |

**No API changes.** No schema changes. No new components. No style file changes (all required CSS tokens already exist).

---

*Spec 26 (Sprint 30 — LAND_TRAVEL TripCalendar integration, T-243) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-17.*

---

## Sprint #30 Design Agent Review — 2026-03-17

**Design Agent Status:** Spec 26 added for T-243. No other specs required. T-239 and T-241 are behavioral bug fixes with no visual design changes — existing specs remain authoritative.

**Design System Conventions:** Stable. No additions or modifications proposed. All tokens, spacing, and typography conventions from the table at the top of this document remain in effect.

**Most recent spec:** Spec 26 (Sprint #30, T-243 — TripCalendar LAND_TRAVEL integration) — Status: Approved.

*Sprint #30 design review complete. Published by Design Agent 2026-03-17.*

---

## Sprint #31 Design Agent Review — 2026-03-20

**Design Agent Status:** No new full screen specs required this sprint. Sprint #31 scope is two minor backlog fixes (T-249 and T-250) plus a User Agent verification cycle (T-248). All are non-visual or infrastructure changes — no new screens, flows, or components are introduced.

**T-249 CSS Design Directive — `.mobileEventLandTravel`**

The one visual deliverable in Sprint 31 is the missing `.mobileEventLandTravel` CSS class in `TripCalendar.module.css`. This class was referenced in the `MobileDayList` LAND_TRAVEL branch (T-243, Sprint 30) but never defined, leaving mobile LAND_TRAVEL rows without a color accent. Below is the complete design specification for this single CSS addition.

---

### Spec 27: `.mobileEventLandTravel` CSS Class (T-249)

**Sprint:** #31
**Related Task:** T-249
**Status:** Approved

**Description:**
Mobile LAND_TRAVEL rows in `MobileDayList` (inside `TripCalendar.jsx`) lack a color accent because the `.mobileEventLandTravel` CSS class does not exist in `TripCalendar.module.css`. Every other event type — FLIGHT, STAY, ACTIVITY — has a corresponding `.mobileEventXxx` class that sets its text color to the event's CSS token. This spec closes that gap for LAND_TRAVEL.

This is not a new screen or component. It is a one-class CSS addition that completes the existing pattern.

---

#### 27.1 Visual Context — Mobile Event Row Pattern

Mobile event rows in `MobileDayList` each receive two CSS classes:
1. The base `.mobileEventRow` class (layout, padding, cursor, transition)
2. A type-specific class that sets the `color` for the entire row (icon + time + title)

Existing type-specific classes and their color tokens:

| Class | Token | Resolved Value |
|-------|-------|---------------|
| `.mobileEventFlight` | `var(--event-flight-text)` | `#6B9FB5` (muted teal-blue) |
| `.mobileEventStay` | `var(--event-stay-text)` | `#7B9E8A` (muted sage green) |
| `.mobileEventActivity` | `var(--event-activity-text)` | `#9E8A6B` (muted warm amber) |
| `.mobileEventLandTravel` | `var(--event-land-travel-text)` | `#7B6B8E` (muted dusty purple) |

The `.mobileEventLandTravel` class must follow this exact pattern — one CSS property, one token reference.

---

#### 27.2 CSS Specification

```css
/* Sprint 31 — T-249: LAND_TRAVEL mobile event row color */
.mobileEventLandTravel {
  color: var(--event-land-travel-text);
}
```

**Placement in file:** Immediately after `.mobileEventActivity` (line ~457 in TripCalendar.module.css), maintaining the sequential FLIGHT → STAY → ACTIVITY → LAND_TRAVEL ordering used throughout the file for event type rules.

**Token already defined:** `--event-land-travel-text: #7B6B8E` is defined in `frontend/src/styles/global.css` (line ~105) and has been in use since Sprint 30 for the desktop `.eventPillLandTravel` class. No new token needed.

---

#### 27.3 Affected Component

**File:** `frontend/src/components/TripCalendar.jsx`
**Location:** `MobileDayList` internal component — the `className` expression on the mobile event row button for the `LAND_TRAVEL` branch.

The class must be applied as a modifier on the existing `.mobileEventRow` container, identical to how the other event types apply their type-specific class:

```jsx
// Expected pattern (already exists for other types):
className={`${styles.mobileEventRow} ${styles.mobileEventLandTravel}`}
```

If the LAND_TRAVEL branch currently conditionally applies `styles.mobileEventLandTravel` via a lookup or conditional expression, confirm it resolves to the new class name. If the class is applied via a lookup object (e.g., `EVENT_TYPE_MOBILE_CLASS[type]`), add `LAND_TRAVEL: styles.mobileEventLandTravel` to that object. Do not change the structural layout or behavior of the row — only the class name application.

---

#### 27.4 Visual Outcome

On a 375px mobile viewport, LAND_TRAVEL rows in `MobileDayList` will render with icon, time, and title text in `#7B6B8E` — a muted dusty purple that:
- Is visually distinct from FLIGHT (teal-blue), STAY (sage), and ACTIVITY (warm amber)
- Matches the desktop `.eventPillLandTravel` color identity exactly
- Stays within the Japandi palette: muted, non-saturated, purposeful
- Passes WCAG AA contrast (7B6B8E on #02111B bg is ≥ 4.5:1 for 12px text)

---

#### 27.5 States

| State | Appearance |
|-------|-----------|
| Default | Row text color `#7B6B8E` via `var(--event-land-travel-text)` |
| Hover | Inherited from `.mobileEventRow:hover` — no additional color change needed |
| Focus-visible | Inherited from `.mobileEventRow:focus-visible` — `outline: 2px solid var(--accent)` |
| Click | Click handler is existing behavior (scroll to land-travels section) — no visual change |

---

#### 27.6 Responsive Behavior

This class is only applied within `MobileDayList`, which renders exclusively at breakpoints below 768px (controlled by the `.mobileView` / `.desktopGrid` responsive toggle). No desktop impact.

---

#### 27.7 Accessibility

- Color is not the only differentiator — the emoji icon (e.g., 🚗) and event type label already communicate event type to users who cannot distinguish color
- The `color` property on the row button does not reduce legibility: `#7B6B8E` on `#02111B` background meets WCAG AA for UI text (non-body sizes ≥ 11px)
- No new `aria-label` changes needed — event rows already carry accessible labels from the existing T-243 implementation

---

#### 27.8 Regressions to Guard Against

| Check | Expected |
|-------|---------|
| `.mobileEventFlight` | Unchanged — still `color: var(--event-flight-text)` |
| `.mobileEventStay` | Unchanged — still `color: var(--event-stay-text)` |
| `.mobileEventActivity` | Unchanged — still `color: var(--event-activity-text)` |
| Desktop `.eventPillLandTravel` | Unchanged — no modifications to this class |
| Desktop event pills (FLIGHT, STAY, ACTIVITY) | Unchanged — no modifications |
| MobileDayList layout | Unchanged — only CSS color added, no structural changes |

---

#### 27.9 Test Requirement

Add 1 unit test to `frontend/src/__tests__/TripCalendar.test.jsx`:

**Test 27.A — LAND_TRAVEL mobile row has `.mobileEventLandTravel` class**
```
Given: A trip calendar with a LAND_TRAVEL event on a given date
When:  TripCalendar renders in mobile view (MobileDayList)
Then:  The LAND_TRAVEL event row element has the `mobileEventLandTravel` CSS module class applied
```

---

#### 27.10 Files to Modify (T-249)

| File | Change |
|------|--------|
| `frontend/src/components/TripCalendar.module.css` | Add `.mobileEventLandTravel { color: var(--event-land-travel-text); }` after `.mobileEventActivity` |
| `frontend/src/components/TripCalendar.jsx` | Confirm `.mobileEventLandTravel` is applied in MobileDayList LAND_TRAVEL branch (likely already wired — just needs the class to exist) |
| `frontend/src/__tests__/TripCalendar.test.jsx` | Add Test 27.A (1 new test) |

**No API changes. No schema changes. No new components. No new CSS tokens.**

---

*Spec 27 (Sprint 31 — mobileEventLandTravel CSS, T-249) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-20.*

---

**Design System Conventions:** Stable. No additions or modifications proposed. The `--event-land-travel-text` token added in Sprint 30 is the authoritative color for all LAND_TRAVEL visual treatments — desktop and mobile.

**Most recent spec:** Spec 28 (Sprint #33, T-263 — Multi-day FLIGHT and LAND_TRAVEL calendar spanning) — Status: Approved.

---

### Spec 28: Multi-Day FLIGHT and LAND_TRAVEL Calendar Spanning (FB-133, FB-134)

**Sprint:** #33
**Related Task:** T-263 (Design), T-264 (Frontend Implementation)
**Feedback Source:** FB-133 (LAND_TRAVEL not spanning), FB-134 (FLIGHT not spanning)
**Status:** Approved

**Description:**
Currently, STAY events span multiple days on the TripCalendar (rendered as multi-day bars from check-in to check-out). However, FLIGHT and LAND_TRAVEL events are rendered on a single day only — the departure date. When a flight departs on one date and arrives on another (e.g., overnight or international flights), or when land travel spans multiple days (e.g., a 3-day rental car), the calendar should show these events spanning their full date range, matching the existing STAY multi-day rendering pattern.

The backend already returns `start_date` and `end_date` fields for all event types. The fix is frontend-only: update `buildEventsMap()` in `TripCalendar.jsx` to enumerate dates for FLIGHT and LAND_TRAVEL events the same way it does for STAY events, and render the corresponding multi-day bar chips.

---

#### 28.1 Data Model (No Changes Required)

The calendar API (`GET /api/v1/trips/:id/calendar`) already returns the necessary fields:

| Event Type | Start Date Field | End Date Field | Start Time Field | End Time Field |
|------------|-----------------|----------------|-----------------|----------------|
| FLIGHT | `start_date` (departure date) | `end_date` (arrival date) | `start_time` (departure time) | `end_time` (arrival time) |
| LAND_TRAVEL | `start_date` (departure date) | `end_date` (arrival date) | `start_time` (departure time) | `end_time` (arrival time) |
| STAY | `start_date` (check-in date) | `end_date` (check-out date) | `start_time` (check-in time) | `end_time` (check-out time) |
| ACTIVITY | `start_date` (activity date) | — (single-day only) | `start_time` | `end_time` |

**Key insight:** When `start_date === end_date` (or `end_date` is null), the event is single-day and renders as a single chip — no change from current behavior. When `start_date !== end_date`, the event spans multiple days.

---

#### 28.2 Updated `buildEventsMap()` Logic

**Current behavior (broken):** FLIGHT and LAND_TRAVEL events are always placed on `start_date` only, with `_dayType: 'single'`.

**Updated behavior:** FLIGHT and LAND_TRAVEL events follow the same multi-day spanning logic as STAY events. Specifically, the `buildEventsMap()` function should:

1. Check if `end_date` exists and differs from `start_date`
2. If multi-day: enumerate all dates from `start_date` to `end_date` (inclusive)
3. For each date in the range, push the event with `_dayType` metadata:
   - `'single'` if `start_date === end_date` (or `end_date` is null)
   - `'start'` for the first day of the span
   - `'middle'` for intermediate days
   - `'end'` for the last day of the span
4. Also set `_isFirst` and `_isLast` boolean flags (matching STAY pattern)
5. If `end_date` is null or equals `start_date`, render as single-day (current behavior preserved)

**Pseudocode:**
```javascript
// In buildEventsMap(), replace the FLIGHT/LAND_TRAVEL branch:
if (event.type === 'FLIGHT' || event.type === 'LAND_TRAVEL') {
  const start = event.start_date;
  const end = event.end_date || event.start_date;
  if (start === end) {
    // Single-day: same as current behavior
    if (!map[start]) map[start] = [];
    map[start].push({ ...event, _dayType: 'single', _isFirst: true, _isLast: true });
  } else {
    // Multi-day: enumerate dates (same logic as STAY)
    const dates = [];
    const cur = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    while (cur <= endDate) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (!map[d]) map[d] = [];
      const isFirst = i === 0;
      const isLast = i === dates.length - 1;
      map[d].push({
        ...event,
        _dayType: isFirst ? 'start' : isLast ? 'end' : 'middle',
        _isFirst: isFirst,
        _isLast: isLast,
      });
    }
  }
}
// ACTIVITY remains single-day only (no end_date):
else if (event.type === 'ACTIVITY') {
  const d = event.start_date;
  if (!map[d]) map[d] = [];
  map[d].push({ ...event, _dayType: 'single', _isFirst: true, _isLast: true });
}
```

---

#### 28.3 Desktop Visual Treatment — Multi-Day FLIGHT Chips

Multi-day FLIGHT events use the **same spanning bar pattern** as STAY events, but with the FLIGHT color (`--color-flight: #5D737E`).

**First day of span (departure day):**
- Full-width colored bar within the cell
- Background: `var(--color-flight)` (`#5D737E`)
- Border-radius: `2px 0 0 2px` (rounded left edge)
- Content: Flight label text (e.g., `"DL1234"`) — 10px, font-weight 500, `#FCFCFC`, truncated with ellipsis
- Time element: departure time in compact format (e.g., `"6a"`) — same styling as CAL-1.4 (10px, opacity 0.7, below event name)

**Middle days:**
- Full-width colored bar, no border-radius
- Background: `var(--color-flight)` at `opacity: 0.8` (same opacity pattern as STAY middle days)
- No text content (bar only — continuation indicator)

**Last day of span (arrival day):**
- Full-width colored bar
- Border-radius: `0 2px 2px 0` (rounded right edge)
- Content: Arrival time label: `"Arrives [time]"` — e.g., `"Arrives 3:45p"`
- Format: The word "Arrives" in 9px, `opacity: 0.6`, followed by the compact time (10px, `opacity: 0.7`)
- If no arrival time available: show `"Arrives"` text only (no time), 10px, `opacity: 0.6`

**Week boundary spanning:** If the flight span crosses a Sunday → new row boundary:
- Last day of the week row: right edge rounding (`0 2px 2px 0`)
- First day of the new week row: left edge rounding (`2px 0 0 2px`) with the flight label repeated (e.g., `"DL1234"`)
- This matches the existing STAY week-break behavior (Spec 7.2.3)

**Single-day FLIGHT (departure and arrival on same date):**
- No change from current behavior: single chip on that date, showing flight label + departure time

---

#### 28.4 Desktop Visual Treatment — Multi-Day LAND_TRAVEL Chips

Multi-day LAND_TRAVEL events use the **same spanning bar pattern**, with the LAND_TRAVEL color (`--color-land-travel: #7B6B8E`).

**First day of span (departure day):**
- Full-width colored bar
- Background: `var(--color-land-travel)` (`#7B6B8E`)
- Border-radius: `2px 0 0 2px` (rounded left edge)
- Content: Mode label (e.g., `"Rental Car"`, `"Train"`) — 10px, font-weight 500, `#FCFCFC`, truncated with ellipsis
- Time element: departure time in compact format (e.g., `"9a"`) — same CAL-1.4 styling
- If no departure time: mode label only, no time element

**Middle days:**
- Full-width colored bar, no border-radius
- Background: `var(--color-land-travel)` at `opacity: 0.8`
- No text content

**Last day of span (arrival day):**
- Full-width colored bar
- Border-radius: `0 2px 2px 0` (rounded right edge)
- Content: Arrival time label: `"Arrives [time]"` — e.g., `"Arrives 2p"` or `"Drop-off [time]"` for RENTAL_CAR mode
  - **Mode-specific arrival label:**
    - RENTAL_CAR: `"Drop-off [time]"` (e.g., `"Drop-off 2p"`)
    - All other modes (BUS, TRAIN, RIDESHARE, FERRY, OTHER): `"Arrives [time]"` (e.g., `"Arrives 10:30a"`)
  - Format: Label word(s) in 9px, `opacity: 0.6`, followed by compact time (10px, `opacity: 0.7`)
  - If no arrival time: show label only (`"Arrives"` or `"Drop-off"`), 10px, `opacity: 0.6`

**Week boundary spanning:** Same pattern as FLIGHT (and STAY) — see 28.3.

**Single-day LAND_TRAVEL (departure and arrival on same date, or no arrival date):**
- No change from current behavior: single chip with mode + time range

---

#### 28.5 Updated `buildLandTravelPillText()` for Multi-Day Events

The existing `buildLandTravelPillText()` function builds the pill text for single-day land travel chips. For multi-day events, the chip text varies by `_dayType`:

| `_dayType` | Pill Text |
|------------|-----------|
| `'single'` | Current behavior: `"{Mode} {dep}–{arr}"` or `"{Mode} {dep}"` or `"{Mode}"` |
| `'start'` | `"{Mode}"` + departure time as time element (via CAL-1.4 pattern) |
| `'middle'` | No text (empty continuation bar) |
| `'end'` | Arrival label text (see 28.3 / 28.4 for format by type) |

The Frontend Engineer should add a helper or extend the existing rendering logic to determine chip content based on `_dayType` and `event.type`.

---

#### 28.6 Updated Event Priority / Stacking Order

The stacking order within a calendar day cell is updated to include multi-day spans:

1. **Flights** (highest visual priority) — both single-day and multi-day span chips
2. **Stays** — multi-day span chips
3. **Land Travel** — both single-day and multi-day span chips
4. **Activities** (lowest priority)

This maintains the existing order (Spec 7.2.3) with LAND_TRAVEL inserted between STAY and ACTIVITY, which is consistent with the T-243 implementation.

---

#### 28.7 Mobile View — Multi-Day FLIGHT and LAND_TRAVEL

**Mobile list view (`MobileDayList`):**

The `MobileDayList` component currently treats FLIGHT and LAND_TRAVEL as single-day events. It must be updated to handle multi-day spanning:

1. **Update `daysWithEvents` computation:** When building the day map for FLIGHT and LAND_TRAVEL events, enumerate all dates from `start_date` to `end_date` (same logic as desktop `buildEventsMap`). Include each date that falls within the displayed month.

2. **Departure day row:** Show the event with its departure time. Same format as current single-day rendering.

3. **Middle day rows:** Show the event with a continuation indicator. Display the mode/flight label + `"(cont.)"` suffix in muted text. Example: `"DL1234 (cont.)"` or `"Rental Car (cont.)"`. Use the event's type color at `opacity: 0.6` for the row accent.

4. **Arrival day row:** Show the event with arrival information:
   - FLIGHT: `"DL1234 — Arrives 3:45p"`
   - LAND_TRAVEL (RENTAL_CAR): `"Rental Car — Drop-off 2p"`
   - LAND_TRAVEL (other): `"Train — Arrives 10:30a"`
   - If no arrival time: omit the time, show only `"DL1234 — Arrives"` or `"Rental Car — Drop-off"`

5. **Event color:** Use `--color-flight` for flights, `--color-land-travel` (`--event-land-travel-text`) for land travel — consistent with existing mobile styling.

**Mobile dot view (compact, <640px calendar grid):**

Multi-day events show their type-colored dot on every day they span (departure through arrival). No change to the dot rendering logic — the updated `buildEventsMap` will naturally place the event on each spanned date, and the dot renderer already uses the event `type` for coloring.

---

#### 28.8 Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| FLIGHT with `end_date === null` | Treat as single-day on `start_date`. No change from current behavior. |
| FLIGHT with `end_date === start_date` | Single-day chip. No spanning. |
| FLIGHT spanning 2 days (overnight) | Bar on departure date + bar on arrival date. |
| FLIGHT spanning 3+ days (international with date line) | Full span: start bar → middle bar(s) → end bar. Rare but should work. |
| LAND_TRAVEL with no `arrival_date` | Single-day on `departure_date`. Current behavior preserved. |
| LAND_TRAVEL spanning many days (e.g., 7-day rental car) | Full span across all dates. Middle days show continuation bar. |
| Multi-day event spanning month boundary | Show only the portion within the displayed month. The event appears on the edge days of the visible month, with appropriate rounding (same behavior as STAY month-boundary handling). |
| Multiple multi-day events overlapping on the same day | Stack per priority order (28.6). If more than 3 event lines, `"+N more"` overflow applies. |
| Single-day events on same day as multi-day span | Both render. Multi-day span bar occupies one event line; single-day chip occupies another. |

---

#### 28.9 Accessibility

- Multi-day span chips on intermediate days: `aria-label="[type]: [name], day [N] of [total]"` (e.g., `aria-label="Flight: DL1234, day 2 of 3"`)
- Arrival day chip: `aria-label="[type]: [name], arrives [time]"` (e.g., `aria-label="Flight: DL1234, arrives 3:45 PM"`)
- Departure day chip: same as current `aria-label` pattern (e.g., `aria-label="Flight: DL1234"`)
- Screen reader announcement for multi-day events should convey that the event spans multiple days. The `_dayType` metadata enables this.
- Keyboard navigation: no change — event chips are already focusable via the click-to-scroll interaction added in previous sprints.

---

#### 28.10 Responsive Summary

| Breakpoint | FLIGHT Multi-Day | LAND_TRAVEL Multi-Day |
|------------|-----------------|----------------------|
| Desktop (≥768px) | Colored spanning bar (`--color-flight`), departure label on first day, `"Arrives [time]"` on last day | Colored spanning bar (`--color-land-travel`), mode label on first day, `"Arrives/Drop-off [time]"` on last day |
| Tablet (640–767px) | Same as desktop, abbreviated text | Same as desktop, abbreviated text |
| Mobile list (<640px) | List rows with departure/continuation/arrival indicators | List rows with departure/continuation/arrival indicators |
| Mobile dot (<640px grid) | Colored dot on each spanned day | Colored dot on each spanned day |

---

#### 28.11 Files to Modify (T-264)

| File | Change |
|------|--------|
| `frontend/src/components/TripCalendar.jsx` | Update `buildEventsMap()` to enumerate dates for FLIGHT and LAND_TRAVEL when `end_date` differs from `start_date`. Update chip rendering to handle `_dayType` start/middle/end for these types. Update `MobileDayList` to enumerate multi-day FLIGHT/LAND_TRAVEL dates. Add arrival time label rendering for end-day chips. |
| `frontend/src/components/TripCalendar.module.css` | No new classes expected — reuse existing span styles (`.eventSpanStart`, `.eventSpanMiddle`, `.eventSpanEnd` or equivalent) already used by STAY. If class names are type-specific, add flight/land-travel variants following the same pattern. |
| `frontend/src/__tests__/TripCalendar.test.jsx` | Add 4+ new tests (see 28.12). |

**No API changes. No backend changes. No schema changes. No new components. No new CSS tokens.**

---

#### 28.12 Test Plan (T-264)

**Test 28.A — Multi-day FLIGHT event spans both days**
```
Given: A calendar with a FLIGHT event where start_date="2026-08-07" and end_date="2026-08-08"
When:  TripCalendar renders the month of August 2026
Then:  The FLIGHT event chip appears on both Aug 7 and Aug 8
And:   Aug 7 chip has _dayType "start" (rounded left edge, flight label)
And:   Aug 8 chip has _dayType "end" (rounded right edge, arrival text)
```

**Test 28.B — Multi-day LAND_TRAVEL event spans 3 days**
```
Given: A calendar with a LAND_TRAVEL event where start_date="2026-08-10" and end_date="2026-08-12"
When:  TripCalendar renders the month of August 2026
Then:  The LAND_TRAVEL event chip appears on Aug 10, Aug 11, and Aug 12
And:   Aug 10 chip has _dayType "start"
And:   Aug 11 chip has _dayType "middle"
And:   Aug 12 chip has _dayType "end"
```

**Test 28.C — Arrival time displayed on arrival day**
```
Given: A FLIGHT event spanning Aug 7–8 with end_time="15:45"
When:  TripCalendar renders
Then:  The Aug 8 (arrival day) chip contains text matching /arrives/i
And:   The arrival time "3:45p" (or equivalent compact format) is displayed
```

**Test 28.D — Single-day FLIGHT still renders correctly**
```
Given: A FLIGHT event where start_date="2026-08-07" and end_date="2026-08-07" (or end_date is null)
When:  TripCalendar renders
Then:  The FLIGHT event appears only on Aug 7
And:   It renders as a single chip (_dayType "single"), not a span
And:   No "Arrives" text is shown
```

**Test 28.E — Single-day LAND_TRAVEL still renders correctly**
```
Given: A LAND_TRAVEL event where start_date="2026-08-10" and end_date is null
When:  TripCalendar renders
Then:  The LAND_TRAVEL event appears only on Aug 10 as a single chip
```

---

*Spec 28 (Sprint 33 — Multi-day FLIGHT and LAND_TRAVEL calendar spanning, T-263) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-20.*

---

*Sprint #33 design review complete. Published by Design Agent 2026-03-20.*

---

### Spec 29: Calendar "+x more" Click-to-Expand (T-271, FB-135)

**Sprint:** #35
**Related Task:** T-271
**Feedback Source:** FB-135
**Status:** Approved

---

#### 29.1 Description

When a calendar day cell contains more than 3 events, the TripCalendar component currently displays a static `+x more` label. This spec defines the click-to-expand interaction that allows users to view all events for an overflowing day. The feature applies only to the **desktop grid view** (≥480px). The mobile day-list view already shows all events inline, so no overflow exists on mobile.

**Who uses this:** Any user with a densely planned trip where 4+ events fall on a single day (e.g., multiple activities, a flight, and a stay all overlapping on the same date).

---

#### 29.2 User Flow

1. User views the TripCalendar on the Trip Details page (desktop).
2. A day cell shows up to 3 event pills. Below them, a `+x more` label indicates additional events exist.
3. User clicks (or presses Enter/Space while focused on) the `+x more` label.
4. A **popover** appears anchored to the day cell, listing **all** events for that day (including the 3 already visible in the cell).
5. User can click any event pill in the popover to scroll to that event's section (same behavior as pills in the grid).
6. User dismisses the popover by:
   - Clicking outside the popover
   - Pressing Escape
   - Clicking `+x more` on a different day (closes current, opens new)
   - Navigating to a different month via the ← / → arrows
7. Focus returns to the `+x more` trigger that opened the popover.

---

#### 29.3 Components

##### 29.3.1 Overflow Trigger — `+x more` label (updated)

The existing `<span className={styles.overflowLabel}>` must become an interactive element.

| Property | Value |
|----------|-------|
| **Element** | `<button type="button">` (replaces the current `<span>`) |
| **Text** | `+{n} more` where `n` = total events − 3 |
| **Font** | IBM Plex Mono, 10px, weight 500 |
| **Color** | `var(--accent)` (`#5D737E`) |
| **Padding** | `2px 4px` |
| **Background** | `transparent` |
| **Border** | none |
| **Cursor** | `pointer` |
| **Hover** | Text color transitions to `var(--text-primary)` (`#FCFCFC`), `transition: color 150ms ease` |
| **Focus-visible** | `outline: 2px solid var(--accent); outline-offset: 1px` |
| **`aria-expanded`** | `"true"` when popover is open for this day, `"false"` otherwise |
| **`aria-haspopup`** | `"dialog"` |
| **`aria-label`** | `"Show all {totalCount} events for {dayLabel}"` — e.g., "Show all 5 events for Tuesday, August 8, 2026" |

##### 29.3.2 Overflow Popover

A floating panel anchored to the day cell that triggered it. Displays a complete, scrollable list of all events for that day.

| Property | Value |
|----------|-------|
| **Element** | `<div role="dialog" aria-label="All events for {dayLabel}" aria-modal="false">` |
| **Position** | Absolutely positioned relative to the day cell. Anchored below the cell by default. If the cell is in the bottom two rows of the grid, anchor **above** the cell instead (to avoid overflow off the calendar panel). Horizontally centered on the cell, clamped to the calendar panel edges. |
| **Width** | `min(280px, calc(100vw - 32px))` — fixed width, does not resize with cell |
| **Max Height** | `320px` — scrollable if content exceeds this |
| **Overflow** | `overflow-y: auto` |
| **Background** | `var(--surface)` (`#30292F`) |
| **Border** | `1px solid var(--border-subtle)` (`rgba(93, 115, 126, 0.3)`) |
| **Border Radius** | `var(--radius-md)` (4px) |
| **Padding** | `12px` |
| **Z-index** | `10` — above calendar grid cells |
| **Animation** | Fade in: `opacity 0→1, transform translateY(4px)→translateY(0)` over `150ms ease`. Fade out: `opacity 1→0` over `100ms ease`. Use CSS transitions or a simple state-driven approach — no animation libraries. |

**Popover Header:**

| Property | Value |
|----------|-------|
| **Text** | Day label in compact format: e.g., `TUE, AUG 8` |
| **Font** | IBM Plex Mono, 11px, weight 600, letter-spacing 0.08em, uppercase |
| **Color** | `var(--text-primary)` |
| **Margin bottom** | `8px` |
| **Separator** | `<hr>` — `1px solid var(--border-subtle)`, margin-bottom `8px` |

**Popover Event List:**

| Property | Value |
|----------|-------|
| **Layout** | Vertical flex column, `gap: 4px` |
| **Each event** | Rendered as the same event pill component used in the grid (`renderEventPill`), but with full width and no text truncation overflow. The pill should have `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` but the wider popover width (280px minus padding) gives more room for text. |
| **Pill height** | Same as grid pills: `20px` |
| **Pill click behavior** | Same as grid pills — scrolls to the corresponding section on the page |
| **Pill styling** | Identical to grid pills for the event type (FLIGHT, STAY, ACTIVITY, LAND_TRAVEL), including color-coded left border and hover states. Multi-day spanning pills in the popover should render with **full border radius** (not clipped start/middle/end style) since they are shown in an isolated context. |
| **Event count label** | Below the header, above the list: `{n} events` — IBM Plex Mono, 10px, weight 400, `var(--text-muted)`, margin-bottom `8px` |

##### 29.3.3 Backdrop / Click-outside Dismiss Layer

| Property | Value |
|----------|-------|
| **Implementation** | Use a `mousedown` event listener on `document` (or a React `useEffect` with ref-based outside-click detection). No visible backdrop overlay — the popover just closes when clicking outside. |
| **Behavior** | Any click outside the popover AND outside the trigger button closes the popover. Clicks inside the popover (including on event pills) do NOT close it — the pill click scrolls to the section while the popover remains open. |

---

#### 29.4 States

##### Empty state
Not applicable — the `+x more` trigger only renders when overflow > 0, so the popover always has at least 4 events.

##### Loading state
Not applicable — calendar data is already loaded when the user interacts with `+x more`. No additional API call is needed.

##### Error state
Not applicable — if the calendar fails to load, the error state is shown at the panel level and no grid cells render.

##### Success state (popover open)
- Popover is visible with all events listed.
- The trigger button shows `aria-expanded="true"`.
- Focus moves into the popover on open (first focusable element = first event pill).

##### Dismissed state
- Popover is hidden.
- The trigger button shows `aria-expanded="false"`.
- Focus returns to the trigger button that was clicked.

##### Edge case: Only 1 overflow event
- `+1 more` still shows the full popover with all 4 events listed. The popover provides a complete view, not just the hidden events.

##### Edge case: Many events (10+)
- The popover scrolls vertically. Max height `320px` ensures the popover doesn't dominate the page. A subtle scrollbar appears (styled to match the Japandi aesthetic if possible — thin, muted).

##### Edge case: Month navigation while popover is open
- Close the popover immediately (no animation) when the user clicks ← or → to change months. The grid re-renders and the popover's anchor cell no longer exists.

##### Edge case: Window resize while popover is open
- Close the popover on window resize to avoid misalignment. A `resize` event listener should dismiss it.

---

#### 29.5 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (≥768px)** | Full desktop grid with `+x more` popover interaction as described above. |
| **Tablet (480px–767px)** | Desktop grid is still shown (per existing CSS). `+x more` popover works the same. Popover width clamps via `min(280px, calc(100vw - 32px))`. |
| **Mobile (<480px)** | Desktop grid is hidden; `MobileDayList` is shown instead. **No `+x more` interaction needed** — the mobile list already shows all events for each day inline. No changes to mobile view. |

---

#### 29.6 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Trigger is a `<button>`** | The `+x more` label must be a `<button>` (not a `<span>`) for keyboard access and screen reader announcement. |
| **`aria-expanded`** | Set to `"true"` when popover is open, `"false"` when closed. |
| **`aria-haspopup="dialog"`** | On the trigger button, signals that activating it opens a dialog-like popover. |
| **Popover `role="dialog"`** | The popover container has `role="dialog"` and `aria-label="All events for {dayLabel}"`. |
| **Focus management** | On open: focus moves to the first event pill inside the popover. On close (Escape or click-outside): focus returns to the trigger button. |
| **Keyboard: Enter/Space** | Opens the popover when the trigger is focused. |
| **Keyboard: Escape** | Closes the popover and returns focus to the trigger. |
| **Keyboard: Tab** | Inside the popover, Tab moves through event pills sequentially. After the last pill, Tab exits the popover (natural tab order). Shift+Tab from the first pill moves back to the trigger. |
| **Screen reader** | Trigger announces: "Show all 5 events for Tuesday, August 8, 2026, collapsed" (or "expanded"). Popover announces its label on focus entry. Each pill inside has the same `aria-label` as grid pills. |
| **Color contrast** | All text meets WCAG AA. Accent color (`#5D737E`) on dark background (`#02111B`) = 4.6:1 ratio (passes AA for normal text). Primary text (`#FCFCFC`) on surface (`#30292F`) = 13.8:1 ratio (passes AAA). |
| **Touch target** | Trigger button has a minimum tap area of 24px height (current pill area + padding provides this). On tablet, ensure at least 44px tap target via padding if needed. |

---

#### 29.7 Animation Details

| Animation | Spec |
|-----------|------|
| **Popover enter** | `opacity: 0 → 1`, `transform: translateY(4px) → translateY(0)`, duration `150ms`, easing `ease` |
| **Popover exit** | `opacity: 1 → 0`, duration `100ms`, easing `ease`. Use a brief delay or state flag to allow the exit animation to play before unmounting (or use CSS transition with conditional class). |
| **Trigger hover** | `color` transition, `150ms ease` (already part of design system conventions) |

---

#### 29.8 Implementation Notes for Frontend Engineer

1. **State management:** Add `expandedDay` state to `TripCalendar` — stores the `dateStr` of the currently expanded day, or `null` if no popover is open. Only one popover can be open at a time.

2. **Trigger change:** Replace the existing `<span className={styles.overflowLabel}>+{overflow} more</span>` with a `<button>` element. Wire `onClick` to set `expandedDay` to the cell's `dateStr` (or `null` if already open — toggle behavior).

3. **Popover positioning:** Use a ref on the day cell to get its bounding rect. Position the popover absolutely. Check if the cell is in the bottom 2 rows of the grid (cellIndex ≥ totalCells − 14) to decide above vs. below placement.

4. **Popover rendering:** Render the popover as a sibling of the grid (not inside the day cell) to avoid `overflow: hidden` clipping. Use a portal (`ReactDOM.createPortal` to the calendar panel) or position it relative to the `.calendarPanel` container.

5. **Event pills in popover:** Reuse `renderEventPill()` for each event. Override the `_dayType`-based pill styling: in the popover context, all pills should render with normal border-radius (not the clipped start/middle/end spanning style). Pass a flag or use a wrapper.

6. **Outside-click detection:** Use a `useEffect` with `mousedown` listener on `document`. Check if the click target is inside the popover ref or the trigger button ref. If not, close.

7. **Escape key:** Add a `keydown` listener (on the popover or `document`) for `Escape` to close the popover.

8. **Month nav dismiss:** In `prevMonth()` and `nextMonth()`, add `setExpandedDay(null)`.

9. **CSS module classes to add:**
   - `.overflowTrigger` — the button styling (replaces `.overflowLabel`)
   - `.overflowPopover` — the popover container
   - `.overflowPopoverAbove` — modifier for above-placement
   - `.overflowPopoverHeader` — day label text
   - `.overflowPopoverCount` — event count label
   - `.overflowPopoverList` — event list container
   - `.overflowPopoverEnter` / `.overflowPopoverExit` — animation classes (if using class-based transitions)

10. **No new API calls.** All event data is already in `eventsMap`. The popover reads from `eventsMap[expandedDay]`.

---

#### 29.9 Visual Reference (ASCII Layout)

```
┌─────────────────────────────────────────────────┐
│ CALENDAR                    ● Flight  ● Stay ...│
│─────────────────────────────────────────────────│
│              ← AUGUST 2026 →                    │
│ SUN   MON   TUE   WED   THU   FRI   SAT        │
│┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐     │
││     │     │     │     │     │     │  1  │     │
││     │     │     │     │     │     │     │     │
│├─────┼─────┼─────┼─────┼─────┼─────┼─────┤     │
││  2  │  3  │  4  │  5  │  6  │  7  │  8  │     │
││     │     │     │     │     │ ✈DL │ ⌂Hyatt│    │
││     │     │     │     │     │ ⌂Hya│ ●Fish │    │
││     │     │     │     │     │     │ ●GGB  │    │
││     │     │     │     │     │     │[+2 more]←──── trigger button
│├─────┼─────┼─────┼─────...                      │
│                                                  │
│         ┌──────────────────────────┐             │
│         │ TUE, AUG 8              │             │
│         │──────────────────────────│ ← popover   │
│         │ 5 events                │             │
│         │──────────────────────────│             │
│         │ [⌂ Hyatt Regency SF   ] │ ← pill      │
│         │ [● 9a Fisherman's Wh. ] │             │
│         │ [● 3p Golden Gate Br. ] │             │
│         │ [● 7p Dinner at...    ] │             │
│         │ [● 9p Night tour      ] │             │
│         └──────────────────────────┘             │
└─────────────────────────────────────────────────┘
```

---

#### 29.10 Test Scenarios for Frontend Engineer

**Test 29.A — Overflow trigger renders as button**
```
Given: A day cell has 5 events
When:  TripCalendar renders
Then:  A button with text "+2 more" is rendered in the day cell
And:   The button has aria-expanded="false" and aria-haspopup="dialog"
```

**Test 29.B — Clicking trigger opens popover**
```
Given: A day cell shows "+2 more" button
When:  User clicks the "+2 more" button
Then:  A popover appears with role="dialog"
And:   The popover lists all 5 events for that day
And:   The trigger button's aria-expanded changes to "true"
```

**Test 29.C — Popover shows correct day label and event count**
```
Given: A popover is open for August 8, 2026 (5 events)
Then:  The popover header displays "TUE, AUG 8"
And:   The event count reads "5 events"
```

**Test 29.D — Popover event pills scroll to section**
```
Given: A popover is open with a FLIGHT event pill
When:  User clicks the flight pill
Then:  The page scrolls to the flights-section
And:   The popover remains open
```

**Test 29.E — Dismiss on click outside**
```
Given: A popover is open
When:  User clicks outside the popover and outside the trigger
Then:  The popover closes
And:   aria-expanded on the trigger is "false"
```

**Test 29.F — Dismiss on Escape key**
```
Given: A popover is open and focus is inside the popover
When:  User presses Escape
Then:  The popover closes
And:   Focus returns to the trigger button
```

**Test 29.G — Only one popover open at a time**
```
Given: A popover is open for August 8
When:  User clicks "+3 more" on August 10
Then:  The August 8 popover closes
And:   The August 10 popover opens
```

**Test 29.H — Month navigation closes popover**
```
Given: A popover is open
When:  User clicks the → (next month) arrow
Then:  The popover closes immediately
And:   The calendar navigates to the next month
```

**Test 29.I — Keyboard navigation: Enter opens popover**
```
Given: The "+2 more" button is focused via keyboard
When:  User presses Enter
Then:  The popover opens
And:   Focus moves to the first event pill inside the popover
```

**Test 29.J — Keyboard navigation: Tab through popover pills**
```
Given: A popover is open with 5 event pills
When:  User presses Tab repeatedly
Then:  Focus moves through each pill in order
And:   After the last pill, Tab exits the popover
```

**Test 29.K — No overflow trigger when ≤3 events**
```
Given: A day cell has exactly 3 events
When:  TripCalendar renders
Then:  No "+x more" button is shown
And:   All 3 events are visible as pills
```

**Test 29.L — Popover position: bottom rows render above**
```
Given: A day cell in the last row of the grid has overflow
When:  User clicks "+x more"
Then:  The popover appears above the cell (not below)
And:   The popover does not extend beyond the calendar panel
```

---

*Spec 29 (Sprint 35 — Calendar "+x more" click-to-expand, T-271, FB-135) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-23.*

---

*Sprint #35 design review complete. Published by Design Agent 2026-03-23.*

---

### Spec 30: Page Branding & Font Compliance (Bug Fix)

**Sprint:** #36
**Related Task:** T-279
**Related Feedback:** FB-188
**Status:** Approved

**Description:**
This is not a new screen spec — it is a branding compliance checklist for the existing `frontend/index.html` and global CSS. FB-188 reported that the page title showed "Plant Guardians" and the wrong fonts (DM Sans, Playfair Display) were loaded. The Frontend Engineer must verify and fix all branding references across the frontend entry point and global styles.

---

#### 30.1 Required State — `frontend/index.html`

| Element | Required Value | Notes |
|---------|---------------|-------|
| `<title>` | `triplanner` | Lowercase, matching the brand identity (see Spec 1.1 brand text: `TRIPLANNER` uppercase is for display; the HTML title uses lowercase) |
| `<meta name="description">` | `"Plan every detail of your trip — flights, stays, activities, and itinerary in one calm, focused workspace."` | If missing, add it. If it references "Plant Guardians" or any other project name, replace. |
| `<meta name="theme-color">` | `#02111B` | If missing, add it. Matches `--bg-primary`. |
| `<link rel="icon">` | Must point to a valid Triplanner favicon (e.g., `/favicon.png`). | Verify the file exists in `frontend/public/`. If it's a Plant Guardians favicon, replace or remove. |
| Google Fonts `<link>` tags | **None in index.html.** Font loading is handled via CSS `@import` in `global.css`. | If any `<link>` tags for "DM Sans", "Playfair Display", or any font other than IBM Plex Mono exist, **remove them**. |
| `<html lang="en">` | Must be present. | Already correct — verify it's not changed. |

#### 30.2 Required State — `frontend/src/styles/global.css`

| Element | Required Value |
|---------|---------------|
| Font import | `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600&display=swap');` |
| `--font-mono` | `'IBM Plex Mono', monospace` |
| `body` font-family | Must use `var(--font-mono)` or `'IBM Plex Mono', monospace` |
| No other `@import` for fonts | Verify no imports for DM Sans, Playfair Display, Inter, or any other typeface |

#### 30.3 Required State — Manifest / PWA (if applicable)

| Element | Required Value |
|---------|---------------|
| `manifest.json` or `site.webmanifest` | If present, `"name"` and `"short_name"` must be `"Triplanner"` / `"triplanner"`. `"theme_color"` must be `#02111B`. `"background_color"` must be `#02111B`. |

If no manifest exists, this is not required for Sprint 36.

#### 30.4 Verification Checklist

The Frontend Engineer should run the following checks after making changes:

1. **Text search:** `grep -ri "plant guardians" frontend/` → must return zero results
2. **Text search:** `grep -ri "DM Sans" frontend/` → must return zero results
3. **Text search:** `grep -ri "Playfair Display" frontend/` → must return zero results
4. **Browser check:** Open the app and verify the browser tab shows "triplanner"
5. **Font check:** Open DevTools → Elements → Computed styles on `<body>` → verify `font-family` resolves to `IBM Plex Mono`
6. **Network check:** Open DevTools → Network → filter "font" → verify only IBM Plex Mono woff2 files are loaded
7. **Existing tests:** Run `npm test` in `frontend/` → all 510 tests must pass with zero regressions

#### 30.5 Accessibility

- The `<title>` must accurately describe the application for screen readers and browser history
- The `<meta name="description">` aids screen readers and SEO crawlers
- The `<html lang="en">` attribute must be preserved for assistive technology language detection

#### 30.6 States

Not applicable — this is a static HTML/CSS fix, not an interactive component.

#### 30.7 Responsive

Not applicable — `<head>` metadata applies uniformly across all viewport sizes.

---

*Spec 30 (Sprint 36 — Page branding & font compliance, T-279, FB-188) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-24.*

---

*Sprint #36 design review complete. Published by Design Agent 2026-03-24.*

---

### Spec 31: Trip Notes Section (Trip Details Page)

**Sprint:** #39
**Related Task:** T-297 (Design), T-300 (Frontend Implementation)
**Backlog Item:** B-030
**Status:** Approved

**Description:**
The Trip Notes section adds a freeform text area to the Trip Details page (`/trips/:id`) where users can store miscellaneous notes about their trip — restaurant links, packing lists, travel tips, visa reminders, or anything that doesn't fit neatly into the structured flights/stays/activities sections. It uses inline editing: the notes display as rendered text by default, and clicking activates an editable text area. Auto-saves on blur or Ctrl+Enter / Cmd+Enter. Character limit: 5000 characters.

---

#### 31.1 Section Position

The Trip Notes section appears on the Trip Details page **below the Calendar and above the Flights section**. This placement gives notes high visibility without displacing the structured data sections.

**Updated page section order (Sprint 39):**

| Position | Element | Margin Below |
|----------|---------|-------------|
| 1 | Trip Header (back link + title + destinations + date range + edit icon) | 8px |
| 2 | Trip Date Range Section | 24px |
| 3 | TripCalendar Component | 48px |
| 4 | **Trip Notes Section** ← new | 48px |
| 5 | Flights Section | 48px |
| 6 | Stays Section | 48px |
| 7 | Activities Section | 48px |
| 8 | Land Travel Section | 64px |

---

#### 31.2 Section Header

Follows the standard section header pattern used by all other sections (Flights, Stays, Activities, Land Travel):

- **Layout:** `display: flex`, `align-items: center`, `gap: 16px`, margin-bottom: 16px
- **Label:** `"notes"` — font-size 11px, font-weight 600, letter-spacing 0.12em, uppercase, color `--text-muted`
- **Horizontal rule:** `flex: 1` div with `border-top: 1px solid var(--border-subtle)` extending to the right
- **No "edit" link** on the right side (unlike other sections). Editing is done inline — clicking the notes content itself activates edit mode. This keeps the interaction direct and reduces visual clutter.

---

#### 31.3 View Mode (Default State — Notes Exist)

When the trip has notes content (`notes` field is non-null and non-empty string):

**Container:**
- Background: `--surface` (`#30292F`)
- Border: `1px solid var(--border-subtle)`
- Border-radius: `var(--radius-md)` (4px)
- Padding: 24px
- `cursor: text` — indicates the area is clickable to edit
- `transition: border-color 150ms ease`
- On hover: border changes to `1px solid var(--accent)` (`#5D737E`)

**Text Display:**
- Font-size: 14px
- Font-weight: 400
- Font-family: `var(--font-mono)` (IBM Plex Mono)
- Color: `--text-primary` (`#FCFCFC`)
- Line-height: 1.7 (generous for readability of longer text blocks)
- White-space: `pre-wrap` — preserves line breaks the user entered
- Word-break: `break-word` — prevents long URLs from overflowing

**Click hint:**
- Bottom-right of the container, only visible on hover
- Text: `"click to edit"` — font-size 11px, color `--text-muted`, font-weight 400
- `opacity: 0` by default, `opacity: 1` on container hover
- `transition: opacity 150ms ease`

**Interaction:**
- Clicking anywhere in the container transitions to Edit Mode (Section 31.4)

---

#### 31.4 Edit Mode (Active Editing)

Activated when the user clicks the notes container (from either View Mode or Empty State).

**Text Area:**
- Replaces the view container in place (no modal, no page navigation)
- Element: `<textarea>`
- Background: `--surface-alt` (`#3F4045`)
- Border: `1px solid var(--accent)` (`#5D737E`) — active/focus border
- Border-radius: `var(--radius-md)` (4px)
- Padding: 24px
- Font-size: 14px
- Font-weight: 400
- Font-family: `var(--font-mono)` (IBM Plex Mono)
- Color: `--text-primary` (`#FCFCFC`)
- Line-height: 1.7
- Min-height: 160px
- Max-height: 480px
- `resize: vertical` — user can drag to resize vertically only
- `overflow-y: auto` — scrollbar appears when content exceeds max-height
- Width: 100% of the section container
- Placeholder text (when empty): `"Add notes — restaurant links, packing lists, travel tips..."` — color `--text-muted`
- `maxlength="5000"` attribute on the textarea element
- Autofocus: The textarea receives focus immediately when edit mode activates. If there is existing text, place the cursor at the end of the content.

**Character Counter:**
- Position: Below the textarea, right-aligned
- Margin-top: 8px
- Font-size: 11px
- Font-weight: 400
- Color: `--text-muted` when under 4500 characters
- Color: `rgba(220, 170, 50, 0.9)` (warm warning) when 4500–4899 characters
- Color: `rgba(220, 80, 80, 0.9)` (danger) when 4900–5000 characters
- Format: `"{current} / 5000"` — e.g., `"342 / 5000"`
- Letter-spacing: 0.04em

**Action Hints:**
- Position: Below the textarea, left-aligned (same row as character counter)
- Text: `"esc to cancel · ⏎ to save"` on macOS, `"esc to cancel · ctrl+⏎ to save"` on other platforms
- Font-size: 11px, color `--text-muted`, font-weight: 400
- Note: Detecting platform for the hint text — use `navigator.platform` or `navigator.userAgent` to check for Mac. If Mac, show `"⌘+⏎"`. Otherwise show `"ctrl+⏎"`.

**Save Behavior:**
- **Auto-save on blur:** When the textarea loses focus (user clicks elsewhere), save automatically via `PATCH /trips/:id` with `{ notes: "<value>" }`. No confirmation dialog.
- **Save on Cmd+Enter / Ctrl+Enter:** Keyboard shortcut to explicitly save and exit edit mode. On macOS: `Cmd+Enter`. On other platforms: `Ctrl+Enter`.
- **Cancel on Escape:** Pressing `Escape` reverts to the last saved value and exits edit mode. No API call.
- After successful save: transition back to View Mode with the updated text. Show a brief inline confirmation — the border flashes `rgba(100, 200, 100, 0.6)` for 1.5s then returns to `var(--border-subtle)`. No toast notification (too noisy for a simple save).
- After save failure: show an inline error message below the character counter — `"Failed to save. Your changes are preserved — try again."` in 12px, `rgba(220, 80, 80, 0.9)`. The textarea remains in edit mode with the user's content intact (do not revert). The user can retry by pressing Cmd/Ctrl+Enter or clicking away again.

---

#### 31.5 Empty State (No Notes)

When the trip has no notes (`notes` is null, undefined, or empty string `""`):

**Container:**
- Same dimensions and styling as the View Mode container (Section 31.3)
- Background: `--surface` (`#30292F`)
- Border: `1px dashed var(--border-subtle)` — dashed border (not solid) to signal "empty / add content here"
- Border-radius: `var(--radius-md)` (4px)
- Padding: 24px
- `cursor: text`
- On hover: border changes to `1px dashed var(--accent)`

**Empty Content:**
- Centered vertically and horizontally within the container (flexbox)
- Min-height: 80px (smaller than edit mode since it's just a prompt)
- Icon: None (keeping it minimal per Japandi aesthetic)
- Text: `"no notes yet — click to add"` — font-size 13px, color `--text-muted`, font-weight: 400
- On hover: text color transitions to `--text-primary`

**Interaction:**
- Clicking anywhere in the container transitions to Edit Mode (Section 31.4) with an empty textarea showing the placeholder text

---

#### 31.6 Loading State

**Initial page load (trip data still loading):**
- The notes section renders a skeleton shimmer block
- Skeleton: same dimensions as the view container — full width, 80px height
- Background: `--surface` with shimmer animation (same as other section skeletons)
- Border-radius: 4px

**Save in progress:**
- The textarea becomes `readonly` (not disabled — keeps styling consistent)
- Opacity: 0.7 on the textarea
- Character counter text changes to `"saving..."` (replaces the count temporarily)
- Duration: typically < 500ms, so no spinner needed. If the save takes > 1s, the "saving..." text is sufficient feedback.

---

#### 31.7 Error States

**API error on load (trip fetch fails):**
- The notes section is not rendered independently — it loads as part of the trip data. If the trip fetch fails, the entire Trip Details page shows its existing error state. No notes-specific error handling needed for load.

**API error on save:**
- Textarea remains in edit mode
- User's typed content is preserved (never discarded on error)
- Error message appears below the action hints row: `"Failed to save. Your changes are preserved — try again."` — font-size 12px, color `rgba(220, 80, 80, 0.9)`, margin-top 8px
- The error message disappears when the user successfully saves or presses Escape

**Character limit exceeded (client-side prevention):**
- The `maxlength="5000"` attribute prevents typing beyond the limit
- The character counter turns danger color (`rgba(220, 80, 80, 0.9)`) at 4900+ characters as a visual warning
- No toast or modal — the counter is sufficient feedback

**Network offline:**
- Same as API error on save — the textarea stays open with the user's content, and the error message appears
- If the browser fires an `online` event, do NOT auto-retry. Let the user explicitly trigger save (blur or Cmd/Ctrl+Enter).

---

#### 31.8 Responsive Behavior

**Desktop (≥ 768px):**
- Notes container spans full width of the content area (up to max 1120px)
- Padding: 24px
- Textarea min-height: 160px, max-height: 480px
- Action hints and character counter on the same row below textarea (flexbox, `justify-content: space-between`)

**Mobile (< 768px):**
- Notes container spans full width minus page padding (16px each side on mobile)
- Padding: 16px
- Textarea min-height: 120px, max-height: 320px
- Action hints and character counter stack vertically:
  - Action hints on first row (left-aligned)
  - Character counter on second row (left-aligned)
  - Gap: 4px between rows
- The "click to edit" hover hint in View Mode is always visible on mobile (since there's no hover) — show it at `opacity: 0.5` by default
- Touch: tapping the container enters edit mode (same as click)

---

#### 31.9 Accessibility

- **Container role:** The view-mode container should have `role="button"` and `tabindex="0"` so keyboard users can focus and activate it
- **Keyboard activation:** Pressing `Enter` or `Space` on the focused view-mode container activates edit mode (same as click)
- **aria-label on view container:** `"Trip notes. Click to edit."` when notes exist. `"No trip notes. Click to add."` when empty.
- **Textarea label:** The section header `"notes"` serves as the visual label. Add a hidden `<label for="trip-notes-textarea">Trip notes</label>` or use `aria-label="Trip notes"` on the textarea.
- **Character counter:** Use `aria-live="polite"` on the character counter element so screen readers announce count changes (debounced — update every 500ms of inactivity, not on every keystroke)
- **Save confirmation:** The green border flash is visual-only. Add an `aria-live="polite"` region that announces `"Notes saved"` on successful save.
- **Error announcement:** The error message container should have `role="alert"` so screen readers announce it immediately.
- **Escape key:** Standard behavior — reverts and exits. Announced via the action hints text.
- **Focus management:** When entering edit mode, focus moves to the textarea. When exiting edit mode (save or cancel), focus returns to the view-mode container.
- **Color contrast:** All text meets WCAG AA. `#FCFCFC` on `#30292F` = ratio ~11:1. `#FCFCFC` on `#3F4045` = ratio ~8:1. Muted text `rgba(252,252,252,0.5)` on `#30292F` ≈ ratio ~5.5:1 (passes AA for large text; the 11px labels are small but at 0.5 opacity this is borderline — consistent with existing convention across all specs).

---

#### 31.10 Data Contract

The notes field relies on the API contract being published by T-298. Expected shape:

```
GET /trips/:id → { ..., notes: string | null, ... }
PATCH /trips/:id → { notes: string } → { ..., notes: string, ... }
```

- `notes` is a string, nullable, max 5000 characters
- XSS sanitization is applied server-side (T-299)
- The frontend should NOT apply any HTML sanitization — display the text as plain text via `pre-wrap` (no `dangerouslySetInnerHTML`, no markdown rendering)
- Empty string `""` and `null` are both treated as "no notes" (show empty state)

---

#### 31.11 Component Structure (Suggested)

```
TripNotesSection/
├── TripNotesSection.jsx    — Main component (handles view/edit toggle, API calls)
├── TripNotesSection.css    — Styles
└── TripNotesSection.test.jsx — Tests
```

**Props:**
- `notes: string | null` — current notes value from trip data
- `tripId: string` — trip ID for the PATCH call
- `onNotesUpdated: (updatedNotes: string) => void` — callback to update parent state after successful save

**Internal State:**
- `isEditing: boolean` — toggles between view and edit mode
- `draftText: string` — current textarea value (initialized from `notes` prop)
- `isSaving: boolean` — true while PATCH is in flight
- `saveError: string | null` — error message from failed save
- `showSaveConfirmation: boolean` — triggers the green border flash

---

*Spec 31 (Sprint 39 — Trip Notes Section, T-297, B-030) marked Approved (auto-approved per automated sprint cycle). Published by Design Agent 2026-03-25.*

---

**Design System Conventions:** Stable. No additions or modifications proposed. All tokens, spacing, and typography conventions from the table at the top of this document remain in effect.

---

*Sprint #39 design spec complete. Published by Design Agent 2026-03-25.*

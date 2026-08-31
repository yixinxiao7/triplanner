## 1. Token foundation

Per design Migration Plan: all new tokens are defined **before** any call site references them, so the tree never contains an unresolved property.

- [x] 1.1 In `frontend/src/styles/global.css`, add `--accent-text` and `--focus-ring: #9DB4BF` to the `:root` block, grouped with the existing accent and text variants — `--accent-text` corrected to `#97B1BC` during 2.x verification after the initial `#8FA9B5` candidate failed 4.5:1 on `--surface-alt` (4.19:1); see design D3
- [x] 1.2 Change `--text-faint` from `rgba(252, 252, 252, 0.3)` to `rgba(252, 252, 252, 0.62)` (H-03)
- [x] 1.3 Change `--color-danger` from `rgba(220, 80, 80, 0.9)` to `rgb(230, 110, 110)` (H-02). Leave `--color-danger-bg`, `--color-danger-border`, and the hover variants unchanged — they are boundary and background roles at 3:1
- [x] 1.4 Change `--color-warning` from `rgba(196, 122, 46, 0.8)` to `rgb(216, 150, 80)` (H-07)
- [x] 1.5 Change `--status-planning-text` from `#5D737E` to `var(--accent-text)` (H-07)
- [x] 1.6 Change `--event-land-travel-text` from `#7B6B8E` to `#A895C0`, matching the `--color-land-travel-text` value already in the file (H-07)
- [x] 1.7 Verify no unintended token changed: `git diff --stat frontend/src/styles/global.css` should show only the lines above plus the two additions

## 2. Contrast regression guard

Written before the bulk edit so it fails first and confirms the fix, rather than being written afterward to match whatever shipped.

- [x] 2.1 Add `frontend/src/__tests__/tokenContrast.test.js` that parses `:root` custom properties out of `global.css`, composites alpha values against a declared backdrop, and computes WCAG contrast ratios
- [x] 2.2 Assert the required ratio for each token in the design D3 table: text-role tokens ≥ 4.5:1 against every surface they appear on, `--focus-ring` ≥ 3:1 against all three surfaces
- [x] 2.3 Assert `--text-muted` ≥ 4.5:1 on `--bg-primary` and `--surface` only. It measures 3.86:1 on `--surface-alt`, which is audit finding M-06 and out of scope — encode the known gap as an explicit skip with a comment referencing M-06, so the test documents it rather than silently passing
- [x] 2.4 Add `frontend/src/__tests__/tokenResolution.test.js` that scans every `.css` file for `var(--x)` references and fails on any token that is neither defined in `global.css` nor accompanied by a fallback (H-05 class guard)
- [x] 2.5 Confirm 2.4 fails against the current tree by flagging `--border-faint`, then proceed — this proves the guard works before task 3.1 removes the only instance

## 3. Control boundary fix (H-05)

- [x] 3.1 In `frontend/src/styles/edit-page.module.css:154`, change `.deleteDangerBtn` from `border: 1px solid var(--border-faint)` to `border: 1px solid var(--accent-subtle)` — corrected during apply: the sibling `.deleteDangerBtn` rules in TripCard/FlightsEditPage/StaysEditPage actually use `--accent-subtle`, not `--color-danger-border` as design.md originally assumed (see design R7)
- [x] 3.2 Re-run the resolution test from 2.4 — it must now pass with no undefined tokens anywhere in the codebase
- [x] 3.3 Visually confirm the delete-confirmation button on an edit page now renders a visible border and reads as a button distinct from the cancel control beside it

## 4. Accent role split (H-04)

36 declarations across 15 files. Do this mechanically — the text and boundary uses are indistinguishable by eye.

- [x] 4.1 Enumerate the exact sites: `grep -rnE '(^|[;{[:space:]])color: var\(--accent\)' --include="*.css" frontend/src` — expect 36 matches across 15 files
- [x] 4.2 Repoint the 11 sites in `pages/TripDetailsPage.module.css` to `var(--accent-text)`
- [x] 4.3 Repoint the 11 sites across the four edit pages: `FlightsEditPage` (5), `StaysEditPage` (4), `LandTravelEditPage` (1), `ActivitiesEditPage` (1)
- [x] 4.4 Repoint the 3 sites in `styles/edit-page.module.css` and 2 in `pages/AuthPage.module.css`
- [x] 4.5 Repoint the 9 remaining single- and double-site files: `TripNotesSection` (2), `HomePage`, `ImportReviewPage`, `TripStatusSelector`, `TripCalendar`, `Navbar`, `FilterToolbar`, `EmptySearchResults`
- [x] 4.6 **Verification gate:** re-run the grep from 4.1 — it must return **zero** matches. A non-zero count means a text site was missed and is still failing AA
- [x] 4.7 **Regression gate:** confirm `border-color: var(--accent)` still returns 22 matches and `background: var(--accent)` still returns 13. Any change here means a boundary or background use was repointed by mistake and the visual identity has shifted

## 5. Focus ring (H-01)

- [x] 5.1 In `global.css`, change the `:focus-visible` rule from `outline: 2px solid var(--accent)` to `var(--focus-ring)`
- [x] 5.2 Grep for component-level `:focus-visible` and `:focus` overrides that hard-code `var(--accent)` as an outline and repoint them — `TripStatusSelector.module.css:39` and `edit-page.module.css` are known sites
- [x] 5.3 Manually verify the ring is clearly visible in all three contexts: a control on the page background, a control inside a modal (`--surface`), and a focused text input (`--surface-alt`)
- [x] 5.4 Confirm pointer clicks still draw no ring — `:focus-visible` semantics must be preserved, not widened to `:focus`

## 6. Skip link (C-01)

- [x] 6.1 Add a `.visually-hidden` / `.skip-link` utility pair to `global.css`: clipped and off-flow by default, and on `:focus` restored to a visible, positioned element with the `--focus-ring` outline
- [x] 6.2 In `App.jsx`, render the skip link as the first child inside the router and before `<Navbar>`, targeting `#main`
- [x] 6.3 Add `id="main"` and `tabIndex={-1}` to **every** `<main>` element. Corrected branch count during apply — actual grep found 10 `<main>` total: `ActivitiesEditPage` (3 branches), `TripDetailsPage` (2 branches), `FlightsEditPage`/`StaysEditPage`/`LandTravelEditPage`/`HomePage`/`ImportReviewPage` (1 each). Also extended to `LoginPage`/`RegisterPage`, which have no `<main>` at all — added `id="main" tabIndex={-1}` to their outer wrapper `div` so the skip link has a valid target on every route, including the two with no repeated nav to skip
- [x] 6.4 Verify the enumeration is complete: `grep -rn '<main' frontend/src/pages` and confirm every occurrence carries both attributes
- [x] 6.5 Add a test asserting the skip link is the first focusable element, is visible on focus, and that activating it moves focus to `main` (not merely scroll position)
- [x] 6.6 Manually verify the skip link works in a **loading** and an **error** state, not only the content state — this is the branch most likely to have been missed

## 7. Route titles and announcements (C-02)

- [x] 7.1 Create a `ROUTE_TITLES` map keyed by route path covering all nine routes in `App.jsx`, with a distinct title per route
- [x] 7.2 Add a single `useEffect` on location in the component rendering `<Routes>` that sets `document.title` from the map
- [x] 7.3 Add a visually-hidden `role="status"` `aria-live="polite"` region that announces the new route name on navigation
- [x] 7.4 Confirm the announcement does not move focus — assert the `document.activeElement` before and after a navigation is unchanged
- [x] 7.5 Add a test iterating the route table asserting every path has a `ROUTE_TITLES` entry (design R6 — makes a future omission a test failure)
- [x] 7.6 Verify a directly-loaded URL (not in-app navigation) also gets the correct title, including for the five lazy routes where the chunk resolves after the effect runs

## 8. Target size (H-06)

Highest-risk task in the change per design R4 — overlays that overlap swallow clicks meant for neighbours.

- [x] 8.1 Add a shared hit-area utility: a transparent absolutely-positioned `::after`, centered, on a `position: relative` parent, sized per the geometry in design D6
- [x] 8.2 Apply 44px **vertical** expansion to all icon-only controls: `.pencilBtn` (TripNotesSection), `.chipRemove` (DestinationChipInput), `.iconBtn` (FlightsEditPage, StaysEditPage), `.deleteRowBtn` (ActivitiesEditPage)
- [x] 8.3 Raise `.cardActions` gap from `12px` to `20px` so the two 24px icon buttons reach 44px horizontal span without their targets meeting. Confirm no row height changes as a result
- [x] 8.4 For `.chipRemove`, expand horizontally only to the largest non-overlapping width given the 6px intra-chip gap — accept 24×44 rather than 44×44, per the spec's separation-over-size precedence
- [x] 8.5 **Overlap test:** implemented as a geometry-math test (`targetSize.test.js`) rather than a literal rendered-pixel click test — jsdom does not run real layout, so `getBoundingClientRect()` returns zeros regardless of CSS and a midpoint-click assertion would not be meaningful. The test instead proves non-overlap from the known, fixed CSS values (gap sizes, overlay dimensions), which is exact given those values are the entire input to the geometry
- [x] 8.6 Assert rendered icon dimensions and list row heights are unchanged from before the change — the spec requires density to be preserved
- [x] 8.7 Manually verify on a 375px viewport that destination chips, edit-page icon buttons, and the notes pencil are all comfortably tappable

## 9. Verification

- [x] 9.1 Run the full test suite — all 31 existing test files must still pass alongside the new ones
- [x] 9.2 Run both guard tests from section 2 and confirm every in-scope token now passes its threshold
- [x] 9.3 Keyboard-only walkthrough of one complete flow: skip link → nav → home → open a trip → edit flights → save. Focus must be visible at every step and never lost
- [x] 9.4 Screen-reader spot check that route changes are announced and each route's title is distinct
- [x] 9.5 Visual regression check on the two densest views — trip detail and the calendar — confirming borders, dividers, and card treatments are unchanged and only text contrast has shifted (design R2)
- [x] 9.6 Log the H-05 undefined-token defect as resolved in `.wolf/buglog.json` (`bug-002`), recording the actual fix applied
- [x] 9.7 Update `.wolf/anatomy.md` with the two new test files and append the session entry to `.wolf/memory.md`

## Why

The interface audit of 2026-08-31 found 25 issues across the frontend, of which **2 are WCAG Level A failures and 7 are Level AA failures**. Nine of thirteen sampled color-token pairings fail the AA contrast minimum at their rendered size, the global focus ring is effectively invisible on the surfaces that hold every form in the app, and an undefined CSS custom property silently removes the border from a destructive-action confirmation button.

These are not spread-out defects requiring a redesign. Six of the nine contrast failures trace back to **four token values in a single file**, and the keyboard gaps are all at seams between components rather than inside them. The palette was tuned by eye and never checked against a contrast target; the keyboard layer was specified carefully but never measured. Both are mechanical to correct now, and both get progressively more expensive as more components adopt the current tokens.

## What Changes

**Level A — keyboard and navigation**

- Add a skip link as the first focusable element on every route, targeting the page's `<main>` landmark (C-01, WCAG 2.4.1).
- Set `document.title` per route and announce route changes through a visually-hidden live region, so SPA navigation is perceivable to screen readers (C-02, WCAG 2.4.2).

**Level AA — focus visibility**

- Introduce a dedicated `--focus-ring` token that clears 3:1 against all three background surfaces, replacing the current use of `--accent` which measures 2.08:1 on `--surface-alt` (H-01, WCAG 1.4.11).

**Level AA — text contrast**

- Raise `--text-faint` from 2.60:1 to clear 4.5:1 (H-03).
- Raise `--color-danger` so field-level error text clears 4.5:1 on both its tinted background and the page ground (H-02).
- **Split `--accent` into two roles**: `--accent` keeps its current value for borders and dividers, and a new `--accent-text` at 8.49:1 on the page background (4.60:1 minimum, on input surfaces) takes over the 36 sites that use it as a text color (H-04). This preserves the existing visual identity exactly — no border, outline, or divider changes appearance.
- Fix the three remaining sub-threshold semantic tokens: `--status-planning-text`, `--event-land-travel-text`, and `--color-warning` (H-07).

**Level AA — control boundaries and target size**

- Define the undefined `--border-faint` token, restoring the border on the delete-confirmation button, which currently renders as bare text because the unresolved property invalidates the `border` shorthand (H-05, WCAG 1.4.11).
- Expand icon-button hit areas to 44×44 using a transparent overlay while leaving the rendered icon size unchanged, so touch accuracy is fixed without loosening the interface's deliberate density (H-06, WCAG 2.5.5).

**Not in scope.** The 9 medium and 7 low findings from the audit — the webfont `@import` waterfall, `transition: all`, reduced-motion coverage, the spacing-scale migration, and the type-scale consolidation — are deferred to separate changes. The S-04 systemic finding (status conveyed by color alone) is Level A but requires design decisions about non-color cues, so it is proposed separately rather than folded in here.

**No breaking changes.** All edits are to CSS token values, CSS rules, and additive JSX. No component API, route, or data contract changes.

## Capabilities

### New Capabilities

This is the first spec set in the repository, so all three capabilities are new and establish the organization under `openspec/specs/accessibility/`.

- `accessibility/keyboard-navigation`: How the interface serves keyboard and screen-reader users moving between and within routes — bypassing repeated blocks, perceiving that navigation occurred, and always being able to see where focus sits.
- `accessibility/visual-contrast`: The contrast floor for text and for the boundaries of interactive controls, plus the design-token contract that makes it enforceable — including the rule that every referenced custom property must resolve.
- `accessibility/target-size`: The minimum pointer target for interactive controls, and the mechanism by which a dense visual design can satisfy it without changing its rendered appearance.

### Modified Capabilities

None — no existing specs.

## Impact

**Files changed**

- `frontend/src/styles/global.css` — the majority of the work. Six token values changed, three tokens added (`--accent-text`, `--focus-ring`, `--border-faint`), one global `:focus-visible` rule updated, plus a visually-hidden utility class and skip-link styles.
- `frontend/src/App.jsx` — skip link element, route-title effect, live region.
- `frontend/src/components/Navbar.jsx` — ensure the skip link precedes nav in DOM order.
- ~20 CSS module files — repoint `color: var(--accent)` at `--accent-text`; add hit-area overlays to the shared icon-button rules.
- Page components — add matching `id` to each `<main>` for the skip link target.

**Risk**

Low and visually contained. The `--accent` split is deliberately additive so that no border or divider shifts. The three tokens whose values do change (`--text-faint`, `--color-danger`, `--color-warning`) all become *lighter*, which is directionally safe on a dark ground. `--event-land-travel-text` is being repointed to `#A895C0`, a value already present in `global.css` as `--color-land-travel-text` — the Sprint 30 event token duplicated the border color into the text slot by mistake.

**Verification**

The existing test suite covers Navbar, all edit pages, and the modals, so route-title and skip-link additions have somewhere to assert. Contrast values are verifiable arithmetically and should be pinned by a check so the palette cannot silently regress again.

**Reference**

Audit report: https://claude.ai/code/artifact/ecc94e0b-bd56-46bc-8376-0f47a25840a4 — finding IDs (C-01, H-01, …) used throughout these artifacts refer to it.

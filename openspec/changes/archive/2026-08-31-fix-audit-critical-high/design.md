## Context

See `proposal.md` — Why. Design-relevant constraints only:

- **The token layer is already centralized and well-adopted.** `global.css` holds ~60 tokens with 92% colour adoption and 98% radius adoption across 20 CSS module files. Most contrast fixes are therefore value edits in one file, not call-site edits. The exception is `--accent`, which is used in both a text role and a border role and so cannot be fixed by a value change alone.
- **The app is dark-mode only**, with a single `:root` block and no `prefers-color-scheme` or `[data-theme]` hooks. Every contrast calculation has exactly one backdrop to consider per surface, which makes the values below deterministic.
- **Three background surfaces exist**: `--bg-primary` `#02111B` (page), `--surface` `#30292F` (modals, cards), `--surface-alt` `#3F4045` (inputs). Any token that can appear on more than one of these must clear its threshold against the worst case, which is almost always `--surface-alt`.
- **Several failures are alpha artefacts, not bad base colours.** `--color-warning` is `rgba(196,122,46,0.8)`; at full opacity the same RGB measures 5.09:1 and passes. `--color-danger` is `rgba(220,80,80,0.9)`; at full opacity it measures 4.83:1 on the page ground but 4.48:1 on its own tinted background — a near miss. Recognising this keeps the palette shift smaller than the audit's raw numbers suggest.
- **Routing is a flat `<Routes>` table in `App.jsx`** with nine routes, five of them lazy. There is no route-metadata layer and no per-page effect infrastructure, so route titles need somewhere to live.
- **Test infrastructure exists and is substantial**: Vitest + Testing Library, 31 test files including coverage of Navbar, every edit page, and all three modals.

## Goals / Non-Goals

**Goals:**

- Fix all 2 critical and 7 high findings with the smallest surface area that satisfies the specs.
- Leave the product's visual identity unchanged where the audit did not require a change — specifically, no border, divider, outline, or card treatment should shift.
- Leave behind mechanical guards so the same class of regression is caught by a test rather than by the next audit.

**Non-Goals:**

- Introducing a light theme, a theme-switching mechanism, or restructuring tokens for multi-theme support. The token split below is role-based, not theme-based.
- Migrating the spacing scale or consolidating the type scale (audit M-05, M-09, L-03). Those are deferred and would collide with this change if attempted together.
- Achieving AAA text contrast (7:1) generally. Where a chosen value happens to reach 7:1 that is incidental headroom, not a target.
- Adding non-colour cues for status (audit S-04). It is Level A but needs design work on what the cue should be; proposed separately.

## Decisions

### D1 — Split `--accent` by role rather than raising it

`--accent` `#5D737E` has 100 references across the CSS modules, splitting by role as: **36 bare `color:` declarations** (text role — 4.5:1 applies, currently failing at 3.84:1), 22 `border-color` plus 4 `border` shorthands (boundary role — 3:1 applies, passing), and 13 `background` uses (unaffected; `--text-primary` on `--accent` measures 4.85:1 and already passes).

**Decision:** keep `--accent` at its current value and add `--accent-text: #97B1BC` (8.49:1 on page, 6.29:1 on surface, 4.60:1 on surface-alt — chosen over an initial #8FA9B5 candidate, which measured 4.19:1 on surface-alt and missed the 4.5:1 floor; see D3). Repoint all 36 bare `color: var(--accent)` declarations at the new token; leave every `border-color`, `border` shorthand, and `background` use alone.

**Alternatives considered.** *Raise `--accent` itself* — one line, no call-site edits, but every border, divider and card outline in the app lightens simultaneously, which visibly increases the accent's presence and works against the muted Japandi direction the project documents in CLAUDE.md. *Restyle the affected text* to `--text-secondary` plus underline — passes AA and touches no tokens, but gives up accent colour as a link affordance, which is currently the only thing distinguishing inline actions from body text. The split was chosen because it is the only option that fixes the failure while guaranteeing zero visual change to the 26 boundary uses and 13 background uses.

**Cost:** 36 call-site edits across 15 files, concentrated in `TripDetailsPage.module.css` (11) and the four edit pages (11 combined). This is the largest mechanical portion of the change and the part most likely to be done incompletely — see R1.

### D2 — A dedicated `--focus-ring` token, not a reuse of `--accent-text`

The focus ring must clear 3:1 on all three surfaces. `--accent` fails badly on two of them (2.84:1 on surface, 2.08:1 on surface-alt).

**Decision:** add `--focus-ring: #9DB4BF`, which measures 8.84:1 / 6.55:1 / **4.78:1** across page / surface / surface-alt — a 59% margin over the 3:1 requirement at its worst case. Point the global `:focus-visible` rule at it.

**Alternative considered:** reuse `--accent-text` `#97B1BC`, which also passes 3:1 easily (worst case 4.60:1). Rejected for two reasons: the roles are genuinely independent, and a future readability tweak to `--accent-text` could silently push the focus ring toward the 3:1 floor. A separate token costs one line and removes that coupling. The extra margin also matters because the ring is a 2px outline — a thin element where perceived contrast is lower than the computed ratio suggests.

### D3 — Contrast values chosen with margin, not at the threshold

Every replacement value below was computed against its true composited backdrop and chosen with headroom rather than at the minimum, so that later alpha or background tweaks do not immediately re-break it.

| Token | Current | Measured | New | New ratio | Finding |
|---|---|---|---|---|---|
| `--text-faint` | `rgba(252,252,252,0.3)` | 2.60:1 | `rgba(252,252,252,0.62)` | ~6.0:1 | H-03 |
| `--color-danger` | `rgba(220,80,80,0.9)` | 3.85:1 | `rgb(230,110,110)` | 5.61:1 on tint, 6.21:1 on page | H-02 |
| `--color-warning` | `rgba(196,122,46,0.8)` | 3.71:1 | `rgb(216,150,80)` | 6.93:1 | H-07 |
| `--status-planning-text` | `#5D737E` | 3.17:1 | `var(--accent-text)` | 6.40:1 | H-07 |
| `--event-land-travel-text` | `#7B6B8E` | 3.26:1 | `#A895C0` | 5.80:1 | H-07 |
| *new* `--accent-text` | — | — | `#97B1BC` | 8.49:1 page, 4.60:1 worst case (surface-alt) | H-04 |
| *new* `--focus-ring` | — | — | `#9DB4BF` | 4.78:1 worst case | H-01 |
| *new* `--border-faint` | *undefined* | — | `var(--color-danger-border)` | — | H-05 |

Note on `--accent-text`: the first candidate, `#8FA9B5`, passed on page (7.75:1) and surface (5.74:1) but landed at 4.19:1 on surface-alt — a genuine miss caught by the contrast guard test (D7) rather than by inspection, since no current call site places accent-role text on a surface-alt background but the token's own contract promises 4.5:1 on whatever surface it renders on. `#97B1BC` clears all three with margin.

Note on `--text-faint`: the minimum alpha clearing 4.5:1 is 0.46. The chosen 0.62 sits above it deliberately, because the token's most common use is empty-state guidance copy at 11px, where the threshold is a floor rather than a target.

Note on `--event-land-travel-text`: the correct value already exists in `global.css` as `--color-land-travel-text: #a895c0`. The Sprint 30 event-token block duplicated the *border* colour `#7B6B8E` into the text slot. This is a copy error, not a palette decision, and the fix restores the value the file already contains.

Note on `--border-faint` (corrected during implementation): the design originally assumed the three sibling `.deleteDangerBtn` rules in `TripCard`, `FlightsEditPage`, and `StaysEditPage` used `--color-danger-border`. On inspection during apply, they actually all use `border: 1px solid var(--accent-subtle)`. `--accent-subtle` measures ~1.37:1 against the page background — well short of the 3:1 this change's own "Interactive controls have a visible boundary" requirement asks for, and `--color-danger-border` fares no better at ~1.39:1.

Presented with this, the user chose to repoint `edit-page.module.css`'s `.deleteDangerBtn` to `--accent-subtle`, matching the three siblings exactly, rather than introducing a stronger one-off value for this button alone. This resolves the literal H-05 defect — the border now resolves to a real, visible value instead of `none` — and keeps all four delete-confirm buttons visually consistent. It does **not** bring any of the four to 3:1 boundary contrast; see R7.

### D4 — Route titles from a single route-metadata map, not per-page effects

**Decision:** define one `ROUTE_TITLES` map keyed by route path in or beside `App.jsx`, and drive both `document.title` and the live-region announcement from a single `useEffect` on location, placed in the component that renders `<Routes>`.

**Alternatives considered.** *A `useDocumentTitle` hook called by each page* — colocates the title with the page, but requires touching all nine page components, is easy to omit on a new route, and the five lazy pages would set their title only after their chunk resolves, producing a stale title during exactly the delay this change is trying to make perceivable. *A route-config array replacing the JSX `<Route>` table* — cleaner long-term but a much larger refactor of working routing code, out of proportion to the requirement.

The centralised effect also gives the live-region announcement one place to fire, which matters because the spec requires the announcement not to move focus — a per-page implementation makes that invariant hard to hold.

Dynamic routes (`/trips/:id`) get a static title for now; interpolating the trip name would require the title effect to wait on data the route has not fetched yet. The spec requires only that titles distinguish routes, which a static per-route title satisfies.

### D5 — Skip link rendered once in `App.jsx`, with `id` added per `<main>`

**Decision:** render the skip link as the first child inside the router, before `<Navbar>`, so it is first in DOM order on every route. Add `id="main"` to each `<main>` element and set `tabindex="-1"` on them so the target can receive programmatic focus.

The `tabindex="-1"` detail matters and is easy to omit: without it, clicking a fragment link moves the browser's scroll position but not its focus in several engines, so the next Tab press returns to the navbar and the skip link accomplishes nothing. The spec's second scenario is written to catch exactly this.

Nine routes render `<main>` across seven page components, several with multiple render branches (loading, error, content) — `ActivitiesEditPage` has three. Every branch needs the `id`, or the skip link breaks in the loading and error states specifically.

**Alternative considered:** a single `<main>` hoisted into `App.jsx` wrapping `<Routes>`. Structurally tidier and would need one `id`, but it would require unwrapping `<main>` from all seven pages and rewriting their loading and error branches — a larger diff in more files than adding an attribute.

### D6 — Target size by pseudo-element overlay, with gap increases where geometry forbids it

The user-selected approach is a transparent `::after` expanding the hit area while the icon renders unchanged. This works in isolation but **collides where controls are adjacent**, and the geometry is unforgiving:

- `.cardActions` (edit + delete icon buttons) — two 24px controls with `gap: 12px`. Two 44px targets need 88px; only 60px exists. Centered 44px overlays would overlap by 8px.
- `DestinationChipInput` — `.chipRemove` sits 6px from `.chipText` inside each chip, and chips are adjacent to one another in a wrapping list.

**Decision, applying the spec's precedence rule** (separation beats reaching 44px, and gap increase beats target shrink):

1. Expand vertically to 44px everywhere — rows have the vertical room, and this alone fixes the dominant mis-tap axis on touch.
2. Horizontally, expand to 44px only where the neighbouring gap permits. In `.cardActions`, raise the gap from 12px to 20px, which yields 24 + 20 = 44px of horizontal span per control with targets meeting exactly and not overlapping. This is the "smallest increase that separates the targets" the spec permits, it shifts only the horizontal spacing between two icons inside a card action group, and no row height changes.
3. Where even that is not available — `.chipRemove` inside a chip — expand to the largest non-overlapping width and accept 24×44 rather than 44×44. This satisfies the 24px floor, which is the binding AA requirement, and the spec's separation rule explicitly makes this the correct trade.

**Alternative considered:** `padding` plus negative `margin` to expand the box without a pseudo-element. Equivalent geometry, but it participates in flex layout and so changes how the parent distributes space, whereas an absolutely-positioned `::after` does not affect layout at all.

### D7 — Guard the fix with tests, since this class of bug is invisible to review

Two mechanical guards, both cheap:

- **A contrast unit test** that parses the token values out of `global.css`, composites each against its declared backdrop, and asserts the required ratio per token. This is what would have caught the original nine failures, and it makes the table in D3 executable rather than documentary.
- **An undefined-token check** that scans all CSS for `var(--x)` references without a matching definition and without a fallback. H-05 existed because an unresolved property fails silently — the check turns that into a build-time error. It is roughly the same script already used during the audit.

Route titles and the skip link are behavioural and belong in the existing Testing Library suites rather than in a new harness.

## Risks / Trade-offs

**R1 — The `--accent` repoint is missed at some call sites.** 36 declarations across 15 files, distinguished from 39 boundary and background uses only by the property name. A partial migration leaves some text failing AA while looking correct in review, because both tokens render as plausible blue-greys.
→ *Mitigation:* enumerate the sites mechanically rather than by reading — `grep -rn 'color: var(--accent)'` gives the exact list — and after the edit assert that the count of `color: var(--accent)` in CSS modules is zero. Tasks are written to do this as a verification step, not an eyeball pass.

**R2 — Lightening five tokens shifts the interface's overall feel.** The product's documented direction is "calm, muted, restrained"; every changed value moves toward higher contrast, which is directionally toward louder.
→ *Mitigation:* the changes are confined to text and one focus ring. No background, border, divider, or card treatment changes, so the muted structure that carries the aesthetic is untouched. `--text-primary`, `--text-secondary`, and `--surface*` — which set the dominant impression — are all unchanged. Worth a visual check on the trip detail page and the calendar, the two densest views, before merging.

**R3 — `tabindex="-1"` on `<main>` is omitted in some render branch.** The skip link then silently fails in loading or error states while passing in the content state, which is the state anyone testing manually will check.
→ *Mitigation:* the spec scenario asserts focus lands in content, and the task list enumerates all `<main>` occurrences including the multi-branch pages. `ActivitiesEditPage` (3 branches), `FlightsEditPage`, `StaysEditPage`, and `TripDetailsPage` (2 branches each) are the risk sites.

**R4 — Hit-area overlays intercept clicks intended for neighbours.** An absolutely-positioned `::after` extending past its parent can sit above adjacent content in stacking order and swallow its clicks — turning a target-size fix into a worse usability bug than the one it fixes.
→ *Mitigation:* D6 sizes every overlay to stay within the available gap, so no overlay extends over a neighbouring control. Tests should assert that a click at the midpoint between two adjacent controls resolves to the expected one. This is the single highest-risk item in the change and deserves explicit test coverage rather than visual confirmation.

**R5 — `--border-faint` is deleted rather than defined, and something else referenced it.**
→ *Mitigation:* it has exactly one reference in the codebase, confirmed by grep. The undefined-token check from D7 would catch any reappearance.

**R6 — Route titles drift as routes are added.** A centralised map is only correct if new routes are added to it.
→ *Mitigation:* a test that iterates the route table and asserts every path has a title entry makes omission a test failure rather than a silent gap.

**R7 — The H-05 fix does not achieve 3:1 boundary contrast, by user decision.** `.deleteDangerBtn` now renders a real, visible border (H-05 resolved — the literal "renders as bare text" defect is gone), but at ~1.37:1 via `--accent-subtle`, matching all three sibling buttons rather than introducing a one-off stronger value. This is a known, deliberate gap against the "Interactive controls have a visible boundary" requirement in the `accessibility/visual-contrast` spec, scoped identically to all four `.deleteDangerBtn` instances in the codebase, none of which were raised as their own audit finding.
→ *Mitigation:* tracked as a follow-up item (raising the boundary contrast on all four `.deleteDangerBtn` rules together, so none diverges from the others) rather than folded into this change, consistent with the proposal's decision to keep pre-existing medium/low findings out of scope. Flagged separately for backlog tracking.

## Migration Plan

No data migration, no API change, no feature flag. All changes are additive or value-level and ship in one deploy.

Sequencing within the change matters in one respect: **add the new tokens before repointing call sites**, so the intermediate state never references an undefined property — which is the exact failure mode H-05 documents.

Rollback is a straight revert. The change touches no persisted state, so a revert restores prior behaviour completely.

## Open Questions

- Should the dynamic route `/trips/:id` eventually interpolate the trip name into the document title (`"Kyoto — Triplanner"`)? Deferred: it needs the title effect to observe fetched data, which is a larger change, and the spec's requirement that titles distinguish routes is met without it. Answering this later changes neither the specs nor the task breakdown.

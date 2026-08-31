## Purpose

Defines the minimum pointer target for interactive controls, and establishes that a visually dense interface satisfies that minimum by enlarging the region that responds to input rather than by enlarging what the user sees.

## Requirements

### Requirement: Interactive controls meet the minimum target size

Every interactive control SHALL present a pointer target of at least 24 by 24 CSS pixels, and SHALL present at least 44 by 44 CSS pixels wherever the control's surroundings allow a target that large without overlapping the target of an adjacent control.

The target is the region that responds to a pointer or touch, which need not coincide with the control's rendered bounds. A control MAY be exempt only when it is an inline element within a sentence of text, or when an equivalent control meeting the minimum is available elsewhere on the same view.

Targets MUST NOT overlap. Where two controls sit closer together than their expanded targets would allow, the separation requirement takes precedence over reaching 44 pixels, and the shortfall MUST be resolved by increasing the gap between the controls in preference to shrinking the target, subject to the density constraint below.

#### Scenario: Icon-only buttons are reliably tappable

- **WHEN** a user taps an icon-only control such as an edit or remove affordance
- **THEN** the tap registers anywhere within at least a 44 by 44 pixel region centered on that control, provided no adjacent control's target is within that region

#### Scenario: Every control clears the floor

- **WHEN** any interactive control is rendered, including those in the densest rows
- **THEN** its target is at least 24 by 24 pixels

#### Scenario: Destructive controls are not easier to hit by accident than to hit on purpose

- **WHEN** a control that removes user data is displayed adjacent to other controls
- **THEN** its target meets the minimum and does not overlap the target of any neighbouring control

#### Scenario: Adjacent targets remain separable

- **WHEN** two interactive controls are rendered side by side
- **THEN** each has its own target region, the regions do not intersect, and a pointer event resolves to exactly one of them

### Requirement: Meeting the target minimum preserves visual density

Satisfying the target-size minimum SHALL NOT change the rendered size of any control's icon, label, or padding, and SHALL NOT change the height of any list or table row.

The interface's information density is a deliberate design property. Target size MUST therefore be satisfied primarily by extending the interactive region beyond the painted bounds rather than by enlarging the painted bounds.

Where target separation cannot otherwise be achieved, the gap between two adjacent controls MAY be increased, provided the increase is the smallest that separates the targets and does not alter the height of the row or the position of any other element.

#### Scenario: Icon size is unchanged

- **WHEN** an icon-only control is brought into compliance
- **THEN** its icon renders at the same dimensions as before

#### Scenario: Row height is unchanged

- **WHEN** controls inside a dense list or table row are brought into compliance
- **THEN** the row's height and the vertical rhythm of the list are unchanged

#### Scenario: A permitted gap increase is contained

- **WHEN** the gap between two adjacent controls is increased to separate their targets
- **THEN** no other element changes position, and the change is confined to the horizontal spacing between those controls

#### Scenario: The expanded region is invisible

- **WHEN** the expanded target region is rendered
- **THEN** it is not visible to sighted users and does not obscure or intercept pointer events intended for adjacent content

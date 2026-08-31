## Purpose

Establishes the contrast floor for text and for the boundaries of interactive controls across the interface, and the design-token guarantees that keep that floor enforceable as the product grows rather than depending on each author checking by eye.

## Requirements

### Requirement: Text meets the AA contrast minimum at its rendered size

All text SHALL achieve a contrast ratio of at least 4.5:1 against the background it is composited over.

Text qualifies for the reduced 3:1 threshold only when rendered at 24px or larger, or at 18.66px or larger with a weight of 700 or more. Where a color carries an alpha channel, the ratio MUST be evaluated against the color as composited over its actual backdrop, not against its unblended value.

#### Scenario: Body and label text on the page background

- **WHEN** text is rendered on the page background at any size below the large-text threshold
- **THEN** it achieves at least 4.5:1 against that background

#### Scenario: Text inside form fields

- **WHEN** placeholder or helper text is rendered inside an input or textarea
- **THEN** it achieves at least 4.5:1 against the input's own background rather than only against the page background

#### Scenario: Validation messages are readable

- **WHEN** a field-level error message is displayed
- **THEN** its text achieves at least 4.5:1 against both the page background and any tinted error background it is drawn on

#### Scenario: Status and category labels are readable

- **WHEN** a status badge or a calendar event label is rendered
- **THEN** its text achieves at least 4.5:1 against the badge or event background as composited over the page

#### Scenario: Guidance text in empty states is readable

- **WHEN** an empty state renders explanatory subtext
- **THEN** that subtext achieves at least 4.5:1, and is not rendered at a lower contrast than the heading it supports in order to appear recessive

### Requirement: Interactive controls have a visible boundary

Every interactive control that relies on a border, outline, or background to communicate that it is actionable SHALL render that boundary with a contrast ratio of at least 3:1 against its surrounding background.

A control MUST NOT rely solely on its text label to be distinguishable from adjacent non-interactive content.

#### Scenario: Destructive confirmation controls are distinguishable

- **WHEN** a delete-confirmation control is displayed
- **THEN** it renders a visible boundary at a minimum of 3:1 against its surroundings, and is visually distinguishable from the cancel control beside it

#### Scenario: A control never renders boundaryless

- **WHEN** any control specifies a border as its means of definition
- **THEN** that border resolves to a visible value at render time

### Requirement: Every referenced design token resolves

Every design token referenced by the stylesheet SHALL be defined, or SHALL supply an explicit fallback value at the point of use.

This is normative because an unresolved custom property does not degrade gracefully: it invalidates the whole declaration at computed-value time and resets the affected properties to their initial values, which can silently remove a border, a color, or a background rather than producing a visible error.

#### Scenario: An undefined token is caught before release

- **WHEN** the stylesheet references a custom property that has no definition and no fallback
- **THEN** the condition is detectable by an automated check rather than only by visual inspection

#### Scenario: Declarations render as authored

- **WHEN** any rule referencing a design token is applied
- **THEN** the resulting computed style reflects the authored intent, with no property silently reset to its initial value

### Requirement: Token roles distinguish text use from boundary use

A design token intended for use as a text color SHALL meet the 4.5:1 text threshold. A token intended only for borders, dividers, and other non-text boundaries need only meet 3:1.

Where a single value cannot satisfy both roles, the system SHALL provide separate tokens rather than compromising on one threshold, so that raising text contrast does not force a change to the product's border and divider treatment.

#### Scenario: Accent color used as text

- **WHEN** the accent color is applied as a text color, including on links, wordmarks, and inline actions
- **THEN** the value used achieves at least 4.5:1 against its background

#### Scenario: Accent color used as a boundary

- **WHEN** the accent color is applied as a border, divider, or outline
- **THEN** its rendered appearance is unchanged from before this capability was introduced

#### Scenario: Roles cannot be confused at the call site

- **WHEN** an author applies a token as a text color
- **THEN** the token's name distinguishes it from the boundary-role token, so the correct threshold is applied without consulting a contrast table

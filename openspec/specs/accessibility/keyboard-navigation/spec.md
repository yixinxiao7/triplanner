## Purpose

Defines how the interface serves people navigating by keyboard, switch device, or screen reader: how they bypass content that repeats on every route, how they perceive that a client-side navigation occurred, and how they can always tell where keyboard focus currently sits.

## Requirements

### Requirement: Repeated navigation blocks can be bypassed

Every route SHALL provide a mechanism to skip past navigation content that repeats across routes and jump directly to the route's primary content.

The mechanism MUST be the first focusable element in the document, MUST be reachable by keyboard, and MUST be visible while it holds focus. It MAY be visually hidden when it does not hold focus.

#### Scenario: Keyboard user bypasses the navbar

- **WHEN** a user presses Tab as the first interaction after a route loads
- **THEN** the first focusable element is a skip control that is visible and announces its purpose

#### Scenario: Activating the skip control moves focus to content

- **WHEN** the user activates the skip control
- **THEN** keyboard focus moves to the route's primary content region, and a subsequent Tab press reaches the first interactive element inside that content rather than returning to navigation

#### Scenario: The control is unobtrusive when unfocused

- **WHEN** the skip control does not hold focus
- **THEN** it is not visible in the rendered layout and does not displace surrounding content

### Requirement: Route changes are perceivable without sight

When client-side navigation changes the displayed route, the system SHALL update the document title to a value that distinguishes that route, and SHALL announce the change to assistive technology.

The title MUST differ between routes. The announcement MUST NOT move keyboard focus.

#### Scenario: Document title identifies the route

- **WHEN** a user navigates to any route
- **THEN** the document title contains a name identifying that route, and differs from the title of every other route

#### Scenario: Screen reader is notified of navigation

- **WHEN** client-side navigation completes
- **THEN** a polite live region communicates the name of the newly displayed route

#### Scenario: Announcement does not steal focus

- **WHEN** the route-change announcement is made
- **THEN** the element holding keyboard focus is unchanged by the announcement

#### Scenario: A route reached by direct load is also titled

- **WHEN** a user loads a route directly by URL rather than by in-app navigation
- **THEN** the document title identifies that route

### Requirement: Keyboard focus is always visible

Every focusable element SHALL display a focus indicator when focused via keyboard.

The indicator MUST achieve a contrast ratio of at least 3:1 against **every** background surface on which the focused element can appear, including page, panel, and input-field backgrounds.

#### Scenario: Focus is visible on the page background

- **WHEN** a control on the page background receives keyboard focus
- **THEN** its focus indicator is distinguishable from that background at a contrast ratio of at least 3:1

#### Scenario: Focus is visible inside a modal

- **WHEN** a control inside a modal panel receives keyboard focus
- **THEN** its focus indicator is distinguishable from the panel background at a contrast ratio of at least 3:1

#### Scenario: Focus is visible on a form field

- **WHEN** a text input or textarea receives keyboard focus
- **THEN** its focus indicator is distinguishable from the input's own background at a contrast ratio of at least 3:1

#### Scenario: Pointer interaction does not draw a focus ring

- **WHEN** a user activates a control with a pointer
- **THEN** no keyboard focus indicator is drawn

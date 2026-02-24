# UI Spec

Design specifications and screen descriptions for the Frontend Engineer. Maintained by the Design Agent and reviewed by the Manager Agent.

---

## How This Page Works

Before the Frontend Engineer begins work on any UI task, the Design Agent must create a spec entry below describing the screen, components, and user flow. The Frontend Engineer should not start implementation until a spec exists and is marked "Approved" by the Manager.

---

## Design System Conventions

*Establish shared patterns so screens are visually consistent.*

| Element | Convention |
|---------|-----------|
| Primary Color | |
| Font Family | |
| Spacing Unit | |
| Border Radius | |
| Button Style | |
| Form Pattern | |
| Error Display | Inline below field + toast for system errors |
| Loading State | Skeleton screens for pages, spinners for actions |

---

## Screen Specs

*Add one section per screen or feature. Design Agent creates these during sprint planning.*

### Template: [Screen Name]

**Sprint:** #N  
**Related Task:** [Task ID from dev-cycle-tracker]  
**Status:** Draft / Approved / Implemented

**Description:** One paragraph explaining what this screen does and who uses it.

**User Flow:**
1. User navigates to [screen] from [where]
2. User sees [what]
3. User interacts with [component]
4. System responds with [behavior]

**Components:**
- Component A — description and behavior
- Component B — description and behavior

**States to Handle:**
- Empty state (no data)
- Loading state
- Error state
- Success state
- Edge cases (long text, missing fields, etc.)

**Responsive Behavior:**
- Desktop: [layout description]
- Mobile: [layout description]

---

*This document is maintained by the Design Agent. Update it whenever new screens are planned or existing designs change.*

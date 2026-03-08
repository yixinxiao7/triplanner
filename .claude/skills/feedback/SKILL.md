---
name: feedback
description: Add a feature request or bug report to the feedback log. Usage: /feedback <description of the feature or bug>
user_invocable: true
---

Add a new feedback entry to `.workflow/feedback-log.md`. Follow these steps exactly:

1. Read `.workflow/feedback-log.md` to find the latest FB-XXX entry number and the current triage summary table.
2. Determine the next FB number (increment by 1).
3. Categorize the feedback from the user's description:
   - **Category:** Bug, UX Issue, Feature Gap, Positive, Performance, Security
   - **Severity:** Critical, Major, Minor, Suggestion
4. Determine the current sprint number from `.workflow/active-sprint.md`.
5. Add a row to the triage summary table with the new FB entry, status `New`.
6. Append a detailed entry block after the last `---` at the end of the file, using this exact format:

```
### FB-XXX — <short title>

| Field | Value |
|-------|-------|
| Feedback | <one-line summary> |
| Sprint | <current sprint number> |
| Category | <category> |
| Severity | <severity> |
| Status | New |
| Related Task | — |

**Description:** <detailed description based on user input, written clearly enough for the Manager Agent to triage and the Frontend/Backend Engineer to implement>

---
```

7. Confirm to the user what was added (FB number, title, category, severity).

$ARGUMENTS

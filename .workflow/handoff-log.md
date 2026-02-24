# Agent Handoff Log

Context handoffs between agents during a sprint. Every time an agent completes work that another agent depends on, log it here.

---

## How to Use This File

When you finish work that another agent needs to pick up:
1. Add a new entry at the top of the log (newest first)
2. Set Status to "Pending"
3. The receiving agent updates Status to "Acknowledged" when they start, and "Done" when complete

---

## Log

### [Template Entry]

| Field | Value |
|-------|-------|
| Sprint | # |
| From Agent | [sending agent] |
| To Agent | [receiving agent] |
| Status | Pending / Acknowledged / Done |
| Related Task | [task ID from dev-cycle-tracker] |
| Handoff Summary | [what was completed and what the next agent needs to do] |
| Notes | [any additional context, gotchas, or blockers] |

---

*Entries are added by each agent when they finish work that another agent depends on.*

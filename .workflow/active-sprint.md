# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #N — [Start Date] to [End Date]

**Sprint Goal**: *One sentence describing what this sprint should accomplish.*

---

## In Scope

*What agents are explicitly working on this sprint. Reference task IDs from dev-cycle-tracker.md.*

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

---

## Out of Scope

*What is NOT being worked on this sprint, even if it seems related. This prevents scope creep.*

- 

---

## Agent Assignments

| Agent | Focus Area This Sprint |
|-------|----------------------|
| Manager | Sprint planning, code review, orchestration |
| Design Agent | UI specs and screen descriptions for Frontend Engineer |
| Backend Engineer | |
| Frontend Engineer | |
| QA Engineer | Unit test review + integration testing + security checklist |
| Deploy Engineer | Build and deploy to staging/production |
| Monitor Agent | Post-deploy health checks and error monitoring |
| User Agent | Product testing and structured feedback |

---

## Definition of Done

*How do we know this sprint is complete?*

- [ ] Design Agent has published UI specs for all frontend tasks
- [ ] Backend Engineer has documented API contracts before implementation
- [ ] All in-scope tasks are marked Done in dev-cycle-tracker.md
- [ ] All task dependencies (Blocked By) are resolved before moving tasks to In Progress
- [ ] Manager Agent has completed code review for all tasks
- [ ] QA Engineer has completed unit test review and integration testing
- [ ] QA Engineer has passed the security checklist
- [ ] QA Engineer has verified Frontend ↔ Backend integration (Integration Check)
- [ ] QA Engineer has logged results in qa-build-log.md with appropriate Test Type
- [ ] Deploy Engineer has deployed to staging
- [ ] Monitor Agent has verified post-deploy health check on staging
- [ ] User Agent has tested and submitted feedback to feedback-log.md
- [ ] Manager Agent has triaged feedback (next sprint vs. backlog)
- [ ] Deploy Engineer has deployed to production (if sprint goal is met)
- [ ] Monitor Agent has verified post-deploy health check on production
- [ ] Sprint summary added to sprint-log.md

---

## Blockers

*Active blockers that need resolution before the sprint can complete.*

*None currently.*

---

*Replace this content at the start of each new sprint. Archive previous sprint content to sprint-log.md.*

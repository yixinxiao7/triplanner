# rules.md — Non-Negotiable Rules for All Agents

These rules apply to every agent in this workspace. Violations require immediate correction.

## General Rules

1. **Read before you write.** Always read `CLAUDE.md`, `rules.md`, `architecture.md`, and your agent prompt before starting any work.
2. **Stay in your lane.** Only modify files within your agent's designated scope. If you need changes outside your scope, create a handoff entry.
3. **Log everything.** Every task completion, blocker, or context handoff must be logged in the appropriate `.workflow/` file.
4. **No silent changes.** Never modify shared configuration, dependencies, or infrastructure without logging an entry in `.workflow/architecture-decisions.md`.
5. **Respect the Blocked By chain.** Never start a task that has unresolved dependencies. Check `.workflow/dev-cycle-tracker.md` first.

## Code Quality Rules

6. **No hardcoded secrets.** All credentials, API keys, and tokens go in `.env` files (never committed). Use `.env.example` as the template.
7. **Parameterized queries only.** Never concatenate user input into SQL or NoSQL queries.
8. **Validate inputs on both sides.** Server-side validation is mandatory. Client-side validation is required for UX but never trusted.
9. **Error responses must be safe.** API errors return structured JSON with a message and status code. Never leak stack traces, file paths, or internal details.
10. **Tests are not optional.** Every new endpoint needs at least one happy-path and one error-path test. Every new component needs at least a render test.

## Workflow Rules

11. **API contracts before implementation.** Backend Engineer must document endpoints in `.workflow/api-contracts.md` before writing code. Frontend Engineer must acknowledge the contract in `.workflow/handoff-log.md` before wiring up API calls.
12. **UI specs before frontend work.** Design Agent must publish screen specs in `.workflow/ui-spec.md` before Frontend Engineer starts building.
13. **Security checklist before Done.** QA Engineer must verify all applicable items in `.workflow/security-checklist.md` before any task moves to Done.
14. **Integration Check is mandatory.** Tasks that touch both frontend and backend must pass through "Integration Check" status before Done.
15. **Post-deploy health check required.** Monitor Agent must verify every staging and production deployment. No deployment is complete without a health check entry in `.workflow/qa-build-log.md`.

## Git Rules

16. **Branch per task.** Each Dev Cycle Tracker task gets its own branch: `feature/`, `fix/`, `hotfix/`, `refactor/`, `infra/`.
17. **Commits reference the task.** Commit messages include the task ID from the Dev Cycle Tracker.
18. **No direct pushes to main.** All changes go through a feature branch → pull request → code review → merge.
19. **Hotfixes bypass sprint planning but not review.** Hotfix tasks go straight to In Progress but still require code review and QA before deploy.

## Database Rules

20. **Migrations must be reversible.** Every migration includes a rollback. Document both in `.workflow/technical-context.md`.
21. **Test on staging first.** Never run a migration on production without first verifying on staging.
22. **Schema changes require approval.** Backend Engineer proposes schema changes via handoff; Manager approves before implementation.

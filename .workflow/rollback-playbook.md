# Rollback Playbook

What to do when a deployment breaks. Follow these steps in order.

---

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 — App Down | Production is completely inaccessible or data is being corrupted | Immediate rollback |
| P1 — Major Feature Broken | Core functionality is broken but app is accessible | Rollback within 30 minutes |
| P2 — Minor Regression | Non-critical feature is broken | Can hotfix forward instead of rolling back |

---

## Rollback Steps

1. **Deploy Engineer** identifies the issue (via Monitor Agent alert or User Agent report)
2. **Deploy Engineer** reverts to the last known-good deployment on the affected environment
3. **Deploy Engineer** logs the rollback in qa-build-log.md with Build Status = Failed and a detailed Error Summary
4. **Manager Agent** creates a Hotfix task in dev-cycle-tracker.md (Type = Hotfix, Priority = P0 or P1)
5. **Backend/Frontend Engineer** investigates root cause and applies fix
6. **QA Engineer** re-tests the fix on staging before re-deploying
7. **Monitor Agent** verifies post-deploy health check passes

---

## Hotfix Rules

- Hotfixes bypass normal sprint planning — they go straight to In Progress
- Hotfixes still require code review (In Review) and QA testing before re-deploy
- Every hotfix must have a root cause note in the task's Notes field
- After resolution, Manager adds a post-mortem entry to sprint-log.md

---

## Database Rollback

If the issue involves a bad migration:
1. Run the migration's rollback script (documented in technical-context.md)
2. Verify data integrity after rollback
3. Log the rollback in the Migration Log in technical-context.md
4. Never attempt to manually edit production data without Manager approval

---

*This playbook is maintained by the Deploy Engineer and Manager Agent.*

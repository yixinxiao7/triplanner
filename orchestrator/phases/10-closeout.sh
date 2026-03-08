#!/usr/bin/env bash
# Phase 10: Sprint Closeout — Manager triages feedback, writes summary

run_phase_closeout() {
    log_phase "Phase 10: Sprint Closeout (Manager Agent)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the Manager Agent closing out Sprint #${sprint_num}.

Your task: Triage feedback and write the sprint summary.

FEEDBACK TRIAGE:
1. Read .workflow/feedback-log.md — only the Sprint #${sprint_num} section — for all entries from this sprint
2. For each feedback entry with Status 'New':
   - Critical/Major bugs: set Status to 'Tasked' (these go into the next sprint)
   - Minor bugs: set Status to 'Acknowledged' (backlog for a future sprint)
   - UX Issues: set Status to 'Acknowledged' or 'Tasked' based on severity
   - Feature Gaps: set Status to 'Acknowledged' (backlog unless critical)
   - Positive feedback: set Status to 'Acknowledged' (keep for team morale)
   - Suggestions: set Status to 'Acknowledged'

SPRINT SUMMARY:
3. Write a sprint summary entry in .workflow/sprint-log.md including:
   - Sprint number and date range
   - Sprint goal and whether it was met
   - Tasks completed (list task IDs and descriptions)
   - Tasks carried over (if any didn't finish)
   - Key feedback themes
   - What went well
   - What to improve
   - Technical debt noted
4. Update .workflow/dev-cycle-tracker.md: move any unfinished tasks to Backlog with a note

WRITE THE NEXT SPRINT PLAN:
5. Read .workflow/project-brief.md for the overall product vision
6. Write the Sprint #$((sprint_num + 1)) plan in .workflow/active-sprint.md (REPLACE the current sprint content):
   - Sprint number and date
   - Sprint goal based on: critical feedback items marked 'Tasked', carried-over tasks, next MVP features, and technical debt
   - In Scope section with task descriptions, dependencies, and acceptance criteria
   - Out of Scope section
   - Agent Assignments table
   - Dependency Chain (critical path)
   - Definition of Done checklist
   - Success Criteria
   - Blockers
7. Create task entries in .workflow/dev-cycle-tracker.md for all new Sprint #$((sprint_num + 1)) tasks (T-xxx IDs, Assigned Agent, Status: Backlog, Priority, Blocked By)
8. Log the handoff in .workflow/handoff-log.md with Sprint #$((sprint_num + 1)) priorities

CRITICAL: Do NOT skip step 6. The next sprint plan MUST be written to active-sprint.md before closeout is complete. The plan phase will verify it exists — if it is missing, the sprint cycle will stall."

    run_agent_with_retry "manager" "$task_prompt" 3 20 "${MODEL_LIGHT:-sonnet}"

    sprint_state_set "phase" "closeout"
    sprint_state_set "closeout_status" "complete"
    log_success "Sprint #${sprint_num} closed out"
}

#!/usr/bin/env bash
# Phase 10: Sprint Closeout — Manager triages feedback, writes summary

run_phase_closeout() {
    log_phase "Phase 10: Sprint Closeout (Manager Agent)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the Manager Agent closing out Sprint #${sprint_num}.

Your task: Triage feedback and write the sprint summary.

FEEDBACK TRIAGE:
1. Read .workflow/feedback-log.md for all entries from Sprint #${sprint_num}
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

PREPARATION FOR NEXT SPRINT:
5. Note in the sprint summary what the next sprint should focus on based on:
   - Critical feedback items marked as 'Tasked'
   - Remaining MVP features from .workflow/project-brief.md
   - Any technical debt or infrastructure improvements needed

This summary will be used by the planning phase of the next sprint."

    run_agent_with_retry "manager" "$task_prompt" 3

    sprint_state_set "phase" "closeout"
    sprint_state_set "closeout_status" "complete"
    log_success "Sprint #${sprint_num} closed out"
}

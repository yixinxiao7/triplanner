#!/usr/bin/env bash
# Phase 05: Code Review — Manager Agent reviews all work

run_phase_review() {
    log_phase "Phase 5: Code Review (Manager Agent)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the Manager Agent reviewing code for Sprint #${sprint_num}.

Your task: Review all tasks currently in 'In Review' status.

1. Read .workflow/dev-cycle-tracker.md to find all tasks in 'In Review'
2. For each task in review:
   a. Read the code the engineer wrote (check backend/src/ and frontend/src/)
   b. Verify it follows the conventions in architecture.md and rules.md
   c. Check that API implementations match the contracts in .workflow/api-contracts.md
   d. Check that UI implementations match the specs in .workflow/ui-spec.md
   e. Verify tests exist (at least one happy-path and one error-path)
   f. Check for security issues: hardcoded secrets, SQL injection, XSS, missing auth checks
   g. Verify error handling is proper and doesn't leak internal details
3. For each task:
   - If the code is good: move the task to 'Integration Check' in dev-cycle-tracker.md
   - If the code needs changes: add review notes to the task's Notes field and move it back to 'In Progress'
4. Log handoffs in .workflow/handoff-log.md to QA Engineer for tasks that pass review
5. Log handoffs back to the responsible engineer for tasks that need changes

Be thorough but pragmatic. Focus on correctness, security, and convention adherence. Don't nitpick style if the code is functional and readable."

    run_agent_with_retry "manager" "$task_prompt" 3

    # Check if any tasks were sent back for rework
    local in_progress
    in_progress=$(count_tasks_in_status "In Progress")
    if [[ "$in_progress" -gt 0 ]]; then
        log_warn "Manager sent $in_progress task(s) back for rework. Running build phase again."
        # Re-run build for rework items
        run_phase_build
        # Re-run review
        run_agent_with_retry "manager" "$task_prompt" 3
    fi

    sprint_state_set "phase" "review"
    sprint_state_set "review_status" "complete"
    log_success "Code review complete"
}

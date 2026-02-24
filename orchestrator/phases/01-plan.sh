#!/usr/bin/env bash
# Phase 01: Sprint Planning — Manager Agent
# Plans the sprint, creates tasks, assigns agents

run_phase_plan() {
    log_phase "Phase 1: Sprint Planning (Manager Agent)"

    local sprint_num
    sprint_num=$(state_get "SPRINT_NUMBER" "1")
    local is_first_sprint=false
    local feedback_context=""

    # Check if this is a continuation sprint (feedback-driven)
    if [[ -f "${WORKFLOW_DIR}/feedback-log.md" ]] && grep -q 'Sprint' "${WORKFLOW_DIR}/feedback-log.md" 2>/dev/null; then
        feedback_context="Review the feedback-log.md for issues from the previous sprint that need to be addressed."
    fi

    if [[ "$sprint_num" -le 1 ]]; then
        is_first_sprint=true
    fi

    local task_prompt
    if $is_first_sprint; then
        task_prompt="You are starting Sprint #1 for this project.

Your task:
1. Read the project brief at .workflow/project-brief.md to understand what we're building
2. Read architecture.md to understand the tech stack and platform (${PLATFORM:-web})
3. Break the MVP into discrete, actionable tasks for Sprint #1
4. For each task, create an entry in .workflow/dev-cycle-tracker.md with: ID (T-001, T-002, etc.), Task description, Type, Assigned Agent, Status (Backlog), Priority, Complexity, Blocked By relationships, and Test Plan
5. Update .workflow/active-sprint.md with: Sprint #1, start date (today), sprint goal, in-scope tasks, out-of-scope items, and agent assignments
6. Ensure the dependency chain is correct: Design tasks before Frontend tasks, API contract tasks before implementation tasks, Backend tasks (or at least API contracts) before Frontend API wiring tasks
7. Include tasks for: Design specs, API contracts, Backend implementation, Frontend implementation, Testing, and Deployment

Important: Create realistic, well-scoped tasks. For Sprint #1, focus on the core user flow — authentication (if needed) and the primary feature. Don't try to build everything at once.

Remember: Design and API contract tasks must be completed before their dependent implementation tasks can start. Set Blocked By fields accordingly."
    else
        task_prompt="You are starting Sprint #${sprint_num}.

Your task:
1. Read .workflow/feedback-log.md — triage all New entries from the previous sprint. Update their status to Tasked (if creating a task), Won't Fix (if declining), or Acknowledged (if deferring to backlog).
2. Read .workflow/sprint-log.md for context on what was completed previously
3. Read .workflow/project-brief.md for the overall product vision
4. Plan Sprint #${sprint_num}: create new tasks in .workflow/dev-cycle-tracker.md addressing:
   - Critical/Major feedback items first
   - Next set of MVP features from the project brief
   - Any carried-over tasks from the previous sprint
5. Update .workflow/active-sprint.md with the new sprint details
6. Ensure proper Blocked By chains for the new tasks
${feedback_context}

Focus on incremental progress. Each sprint should deliver a visible improvement to the product."
    fi

    run_agent_with_retry "manager" "$task_prompt" 3

    # Verify planning produced results
    if phase_planning_complete; then
        log_success "Sprint #${sprint_num} planned successfully"
        sprint_state_set "phase" "plan"
        sprint_state_set "plan_status" "complete"
        print_sprint_summary
    else
        log_error "Sprint planning did not produce expected outputs"
        log_error "Check: .workflow/active-sprint.md and .workflow/dev-cycle-tracker.md"
        return 1
    fi
}

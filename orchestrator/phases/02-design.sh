#!/usr/bin/env bash
# Phase 02: Design — Design Agent creates UI specs

run_phase_design() {
    log_phase "Phase 2: Design (Design Agent)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the Design Agent working on Sprint #${sprint_num}.

Your task:
1. Read .workflow/active-sprint.md to see which frontend tasks are in scope
2. Read .workflow/dev-cycle-tracker.md for task details and requirements
3. Read .workflow/project-brief.md for product context and target users
4. Read .workflow/feedback-log.md for any UX issues from previous sprints
5. For each frontend task that needs a UI spec, create a detailed screen specification in .workflow/ui-spec.md including:
   - Screen name and description
   - User flow (step-by-step interaction)
   - Components needed (with behavior descriptions)
   - All states: empty, loading, error, success
   - Responsive behavior (desktop → mobile)
   - Accessibility considerations
6. Mark each spec as 'Approved' (since this is automated, specs are auto-approved)
7. Log a handoff entry in .workflow/handoff-log.md for each spec, directed to the Frontend Engineer
8. Update your tasks in .workflow/dev-cycle-tracker.md to 'Done'

Platform: ${PLATFORM:-web}. Design for ${PLATFORM:-web} conventions and patterns.

Write comprehensive specs. The Frontend Engineer will build exactly what you describe, so be specific about layout, spacing, interactions, and edge cases."

    run_agent_with_retry "design-agent" "$task_prompt" 3

    if phase_design_complete; then
        log_success "UI specs created and approved"
        sprint_state_set "phase" "design"
        sprint_state_set "design_status" "complete"
    else
        log_warn "Design phase may be incomplete — checking if there are frontend tasks that need specs"
        # If there are no frontend tasks, design phase is optional
        local frontend_tasks
        frontend_tasks=$(grep -c 'Frontend Engineer' "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null || true)
        frontend_tasks="${frontend_tasks:-0}"
        if [[ "$frontend_tasks" -eq 0 ]]; then
            log_info "No frontend tasks this sprint — skipping design"
            sprint_state_set "design_status" "skipped"
        else
            log_error "Design phase incomplete with frontend tasks pending"
            return 1
        fi
    fi
}

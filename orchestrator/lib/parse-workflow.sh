#!/usr/bin/env bash
# parse-workflow.sh — Parse workflow markdown files to determine orchestrator state
# Sourced by orchestrate.sh. Never run directly.

# ── Sprint State Detection ───────────────────────────────────────────

# Returns: "template" | "planned" | "in-progress" | "complete"
detect_sprint_state() {
    local tracker="${WORKFLOW_DIR}/dev-cycle-tracker.md"
    local active="${WORKFLOW_DIR}/active-sprint.md"

    # Check if sprint has been planned
    if grep -q 'Sprint #N\|Sprint #\[N\]' "$active" 2>/dev/null; then
        echo "template"
        return
    fi

    # Count tasks by status
    local backlog in_progress in_review done total
    backlog=$(count_tasks_in_status "Backlog")
    in_progress=$(count_tasks_in_status "In Progress")
    in_review=$(count_tasks_in_status "In Review")
    integration=$(count_tasks_in_status "Integration Check")
    done=$(count_tasks_in_status "Done")
    total=$((backlog + in_progress + in_review + integration + done))

    if [[ $total -eq 0 ]]; then
        echo "template"
    elif [[ $done -eq $total && $total -gt 0 ]]; then
        echo "complete"
    elif [[ $in_progress -gt 0 || $in_review -gt 0 || $integration -gt 0 ]]; then
        echo "in-progress"
    else
        echo "planned"
    fi
}

# ── Phase Completion Checks ──────────────────────────────────────────
# Each function returns 0 (true) if the phase is complete, 1 (false) otherwise

phase_planning_complete() {
    local tracker="${WORKFLOW_DIR}/dev-cycle-tracker.md"
    local active="${WORKFLOW_DIR}/active-sprint.md"

    # Sprint is planned if active-sprint has a real sprint number and tasks exist
    if grep -q 'Sprint #[0-9]' "$active" 2>/dev/null; then
        local total
        total=$(grep -c '^\| T-' "$tracker" 2>/dev/null || echo "0")
        [[ $total -gt 0 ]]
    else
        return 1
    fi
}

phase_design_complete() {
    local ui_spec="${WORKFLOW_DIR}/ui-spec.md"
    local handoff="${WORKFLOW_DIR}/handoff-log.md"

    # Design is complete if ui-spec has Approved entries
    grep -q 'Status.*Approved\|status.*Approved' "$ui_spec" 2>/dev/null && \
    grep -q 'Design Agent.*Frontend Engineer\|From Agent.*Design' "$handoff" 2>/dev/null
}

phase_contracts_complete() {
    local contracts="${WORKFLOW_DIR}/api-contracts.md"
    local handoff="${WORKFLOW_DIR}/handoff-log.md"

    # Contracts are complete if api-contracts.md has real endpoint entries
    grep -qE '(GET|POST|PUT|PATCH|DELETE)\s+/api/' "$contracts" 2>/dev/null && \
    grep -q 'Backend Engineer.*Frontend Engineer\|From Agent.*Backend' "$handoff" 2>/dev/null
}

phase_build_complete() {
    local tracker="${WORKFLOW_DIR}/dev-cycle-tracker.md"

    # Build is complete when all implementation tasks are In Review or beyond
    local in_progress
    in_progress=$(count_tasks_in_status "In Progress")
    local backlog
    backlog=$(count_tasks_in_status "Backlog")

    [[ $in_progress -eq 0 && $backlog -eq 0 ]]
}

phase_review_complete() {
    local tracker="${WORKFLOW_DIR}/dev-cycle-tracker.md"

    # Review is complete when no tasks are In Review
    local in_review
    in_review=$(count_tasks_in_status "In Review")
    [[ $in_review -eq 0 ]]
}

phase_qa_complete() {
    local qa_log="${WORKFLOW_DIR}/qa-build-log.md"
    local sprint_num
    sprint_num=$(get_current_sprint)

    # QA is complete if there are test entries for this sprint
    grep -q "Sprint.*${sprint_num}\|Sprint ${sprint_num}" "$qa_log" 2>/dev/null && \
    grep -q 'Integration Test.*Pass\|Security Scan.*Pass' "$qa_log" 2>/dev/null
}

phase_deploy_complete() {
    local qa_log="${WORKFLOW_DIR}/qa-build-log.md"

    # Deploy is complete if staging deployment is logged
    grep -q 'Staging.*Success\|Environment.*Staging' "$qa_log" 2>/dev/null
}

phase_verify_complete() {
    local qa_log="${WORKFLOW_DIR}/qa-build-log.md"

    # Verification is complete if health check passes
    grep -q 'Deploy Verified.*Yes\|Health Check.*Pass' "$qa_log" 2>/dev/null
}

phase_testing_complete() {
    local feedback="${WORKFLOW_DIR}/feedback-log.md"
    local handoff="${WORKFLOW_DIR}/handoff-log.md"
    local sprint_num
    sprint_num=$(get_current_sprint)

    # User testing is complete if feedback entries exist for this sprint
    grep -q "Sprint.*${sprint_num}\|Sprint ${sprint_num}" "$feedback" 2>/dev/null && \
    grep -q 'User Agent.*Manager\|From Agent.*User' "$handoff" 2>/dev/null
}

phase_closeout_complete() {
    local sprint_log="${WORKFLOW_DIR}/sprint-log.md"
    local sprint_num
    sprint_num=$(get_current_sprint)

    # Closeout is complete if sprint summary exists
    grep -q "Sprint.*${sprint_num}\|Sprint #${sprint_num}" "$sprint_log" 2>/dev/null
}

# ── Determine Next Phase ─────────────────────────────────────────────
# Returns the name of the next phase to run

determine_next_phase() {
    if ! phase_planning_complete; then
        echo "plan"
    elif ! phase_design_complete; then
        echo "design"
    elif ! phase_contracts_complete; then
        echo "contracts"
    elif ! phase_build_complete; then
        echo "build"
    elif ! phase_review_complete; then
        echo "review"
    elif ! phase_qa_complete; then
        echo "qa"
    elif ! phase_deploy_complete; then
        echo "deploy"
    elif ! phase_verify_complete; then
        echo "verify"
    elif ! phase_testing_complete; then
        echo "test"
    elif ! phase_closeout_complete; then
        echo "closeout"
    else
        echo "done"
    fi
}

# ── Summary Report ───────────────────────────────────────────────────

print_sprint_summary() {
    local sprint_num
    sprint_num=$(get_current_sprint)
    local tracker="${WORKFLOW_DIR}/dev-cycle-tracker.md"

    echo ""
    log_phase "Sprint #${sprint_num} Summary"
    echo -e "  ${BOLD}Tasks:${NC}"
    echo -e "    Backlog:           $(count_tasks_in_status 'Backlog')"
    echo -e "    In Progress:       $(count_tasks_in_status 'In Progress')"
    echo -e "    In Review:         $(count_tasks_in_status 'In Review')"
    echo -e "    Integration Check: $(count_tasks_in_status 'Integration Check')"
    echo -e "    Done:              $(count_tasks_in_status 'Done')"
    echo ""
    echo -e "  ${BOLD}Current Phase:${NC} $(determine_next_phase)"
    echo ""
}

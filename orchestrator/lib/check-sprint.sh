#!/usr/bin/env bash
# check-sprint.sh — Sprint completion detection and Definition of Done verification
# Sourced by orchestrate.sh. Never run directly.

# ── Definition of Done Checker ───────────────────────────────────────
# Verifies all DoD items from active-sprint.md are satisfied
# Returns 0 if sprint is complete, 1 if items remain

check_definition_of_done() {
    local sprint_num
    sprint_num=$(get_current_sprint)
    local passed=0
    local failed=0
    local total=0

    echo ""
    log_phase "Definition of Done — Sprint #${sprint_num}"

    # 1. Design specs published
    ((total++))
    if phase_design_complete; then
        echo -e "  ${GREEN}✓${NC} Design Agent published UI specs"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} Design Agent published UI specs"
        ((failed++))
    fi

    # 2. API contracts documented
    ((total++))
    if phase_contracts_complete; then
        echo -e "  ${GREEN}✓${NC} Backend Engineer documented API contracts"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} Backend Engineer documented API contracts"
        ((failed++))
    fi

    # 3. All tasks Done
    ((total++))
    local not_done
    not_done=$(( $(count_tasks_in_status "Backlog") + $(count_tasks_in_status "In Progress") + $(count_tasks_in_status "In Review") + $(count_tasks_in_status "Integration Check") ))
    if [[ $not_done -eq 0 ]]; then
        echo -e "  ${GREEN}✓${NC} All tasks marked Done"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} All tasks marked Done ($not_done remaining)"
        ((failed++))
    fi

    # 4. Code review complete
    ((total++))
    if phase_review_complete; then
        echo -e "  ${GREEN}✓${NC} Manager completed code review"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} Manager completed code review"
        ((failed++))
    fi

    # 5. QA testing complete
    ((total++))
    if phase_qa_complete; then
        echo -e "  ${GREEN}✓${NC} QA completed testing and security checklist"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} QA completed testing and security checklist"
        ((failed++))
    fi

    # 6. Deployed to staging
    ((total++))
    if phase_deploy_complete; then
        echo -e "  ${GREEN}✓${NC} Deployed to staging"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} Deployed to staging"
        ((failed++))
    fi

    # 7. Health check passed
    ((total++))
    if phase_verify_complete; then
        echo -e "  ${GREEN}✓${NC} Monitor verified health check"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} Monitor verified health check"
        ((failed++))
    fi

    # 8. User testing complete
    ((total++))
    if phase_testing_complete; then
        echo -e "  ${GREEN}✓${NC} User Agent tested and submitted feedback"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} User Agent tested and submitted feedback"
        ((failed++))
    fi

    # 9. Sprint summary written
    ((total++))
    if phase_closeout_complete; then
        echo -e "  ${GREEN}✓${NC} Sprint summary added to sprint-log"
        ((passed++))
    else
        echo -e "  ${RED}✗${NC} Sprint summary added to sprint-log"
        ((failed++))
    fi

    echo ""
    echo -e "  ${BOLD}Result: ${passed}/${total} items passed${NC}"
    echo ""

    [[ $failed -eq 0 ]]
}

# ── Sprint Increment ─────────────────────────────────────────────────
# Prepare for the next sprint

increment_sprint() {
    local current_sprint
    current_sprint=$(get_current_sprint)
    local next_sprint=$((current_sprint + 1))

    log_info "Incrementing sprint: #${current_sprint} → #${next_sprint}"

    # The Manager agent will handle the actual file updates during planning
    state_set "SPRINT_NUMBER" "$next_sprint"
    sprint_state_clear
}

# ── Blocker Detection ────────────────────────────────────────────────
# Check for blocked tasks or unresolved issues

check_for_blockers() {
    local blocked_count
    blocked_count=$(count_tasks_in_status "Blocked")

    if [[ $blocked_count -gt 0 ]]; then
        log_warn "Found $blocked_count blocked task(s)"
        grep "Blocked" "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null | head -5
        return 1
    fi
    return 0
}

# ── Critical Feedback Check ──────────────────────────────────────────
# Check if User Agent or Monitor Agent reported critical issues

check_critical_feedback() {
    local feedback="${WORKFLOW_DIR}/feedback-log.md"

    if grep -q 'Critical.*New\|Critical.*Acknowledged' "$feedback" 2>/dev/null; then
        log_warn "Critical feedback found that hasn't been resolved!"
        grep 'Critical' "$feedback" 2>/dev/null | head -5
        return 1
    fi
    return 0
}

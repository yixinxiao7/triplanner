#!/usr/bin/env bash
# Phase 06: QA — Testing, security verification, integration checks

run_phase_qa() {
    log_phase "Phase 6: QA (QA Engineer)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the QA Engineer working on Sprint #${sprint_num}.

Your task: Run all testing and verification for this sprint.

1. Read .workflow/dev-cycle-tracker.md for tasks in 'Integration Check' status
2. Read .workflow/handoff-log.md for context from the engineers about what to test
3. Read .workflow/api-contracts.md for expected API behavior
4. Read .workflow/ui-spec.md for expected UI behavior

UNIT TEST REVIEW:
5. Review the test files in backend/src/ and frontend/src/
6. Verify coverage: at least one happy-path and one error-path test per endpoint/component
7. Run the backend tests: cd backend && npm test
8. Run the frontend tests: cd frontend && npm test
9. Log results in .workflow/qa-build-log.md (Test Type: Unit Test)

INTEGRATION TESTING:
10. Verify Frontend correctly calls Backend APIs per the contracts
11. Verify request/response shapes match the contracts
12. Verify all UI states are implemented (empty, loading, error, success)
13. Check for: proper auth enforcement, input validation, error handling, edge cases
14. Log results in .workflow/qa-build-log.md (Test Type: Integration Test)

SECURITY VERIFICATION:
15. Go through every applicable item in .workflow/security-checklist.md
16. Check specifically for: hardcoded secrets, SQL injection vectors, XSS vulnerabilities, missing auth checks, information leakage in error responses
17. Run: cd backend && npm audit (if available)
18. Log results in .workflow/qa-build-log.md (Test Type: Security Scan)
19. Any security failures → create a handoff to the responsible engineer as P1

FINAL STEPS:
20. If all tests pass: move tasks to 'Done' in dev-cycle-tracker.md
21. If tests fail: move tasks to 'Blocked' and handoff to the responsible engineer
22. Log a handoff to Deploy Engineer confirming readiness (or blocking deployment)

Be thorough. Run actual commands to test. Check actual code for security issues."

    run_agent_with_retry "qa-engineer" "$task_prompt" 3

    # Check if QA found issues
    if grep -q 'Blocked' "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null; then
        local blocked
        blocked=$(count_tasks_in_status "Blocked")
        if [[ "$blocked" -gt 0 ]]; then
            log_warn "QA found issues — $blocked task(s) blocked. Running fix cycle."

            # Send back to engineers for fixes
            run_phase_build
            run_phase_review

            # Re-run QA
            log_info "Re-running QA after fixes..."
            run_agent_with_retry "qa-engineer" "$task_prompt" 3
        fi
    fi

    sprint_state_set "phase" "qa"
    sprint_state_set "qa_status" "complete"
    log_success "QA phase complete"
}

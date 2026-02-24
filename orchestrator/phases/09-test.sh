#!/usr/bin/env bash
# Phase 09: User Testing — User Agent tests from a real user's perspective

run_phase_test() {
    log_phase "Phase 9: User Testing (User Agent)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the User Agent testing Sprint #${sprint_num}.

Your task: Test every feature delivered this sprint from a real user's perspective.

PRE-TESTING:
1. Read .workflow/handoff-log.md — confirm Monitor Agent verified the staging environment
2. Read .workflow/active-sprint.md for what was built this sprint
3. Read .workflow/ui-spec.md for the expected behavior of each screen
4. Read .workflow/api-contracts.md for the expected API behavior

TESTING:
5. Test each feature by making actual API calls and checking responses:
   - Use curl or similar to test API endpoints directly
   - Test the happy path first: does the core flow work end-to-end?
   - Then try to break things:
     * Empty inputs, missing required fields
     * Very long text, special characters, SQL injection attempts
     * Invalid auth tokens, expired sessions
     * Rapid repeated requests
     * Unexpected data types (numbers where strings expected, etc.)
6. For frontend features (if built):
   - Check that the build output exists (frontend/dist/)
   - Review the component code to verify all states are implemented
   - Verify navigation and routing work correctly
7. For each observation, create a structured entry in .workflow/feedback-log.md:
   - Feedback: short description
   - Sprint: ${sprint_num}
   - Category: Bug / UX Issue / Feature Gap / Positive / Performance / Security
   - Severity: Critical / Major / Minor / Suggestion
   - Status: New
   - Details: steps to reproduce, expected vs actual behavior

POST-TESTING:
8. Log a handoff to Manager Agent summarizing:
   - Total issues found
   - Highest severity
   - Overall impression of the sprint's deliverables
   - Specific praise for things that work well (Positive feedback matters)

Be specific. Good feedback: 'POST /api/v1/auth/register — sending empty email returns 500 instead of 400 validation error. Expected: 400 with message about email required.'
Bad feedback: 'Registration is broken.'"

    run_agent_with_retry "user-agent" "$task_prompt" 3

    sprint_state_set "phase" "test"
    sprint_state_set "test_status" "complete"
    log_success "User testing complete"

    # Report feedback summary
    local feedback="${WORKFLOW_DIR}/feedback-log.md"
    if [[ -f "$feedback" ]]; then
        local bugs critical
        bugs=$(grep -c 'Bug' "$feedback" 2>/dev/null || echo "0")
        critical=$(grep -c 'Critical' "$feedback" 2>/dev/null || echo "0")
        log_info "Feedback summary: $bugs bug(s), $critical critical issue(s)"
    fi
}

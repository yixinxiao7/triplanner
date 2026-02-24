#!/usr/bin/env bash
# Phase 03: API Contracts — Backend Engineer publishes contracts before implementation

run_phase_contracts() {
    log_phase "Phase 3: API Contracts (Backend Engineer)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the Backend Engineer working on Sprint #${sprint_num}.

Your task RIGHT NOW is ONLY to write API contracts — do NOT implement any code yet.

1. Read .workflow/active-sprint.md and .workflow/dev-cycle-tracker.md for your assigned tasks
2. Read architecture.md for API conventions (base URL, response format, auth, pagination)
3. Read .workflow/ui-spec.md to understand what data the frontend will need
4. For each API endpoint needed this sprint, document it in .workflow/api-contracts.md:
   - Method and path (e.g., POST /api/v1/auth/register)
   - Authentication requirements (public, Bearer token, etc.)
   - Request body schema with field types and validation rules
   - Success response shape (following the { data: ... } convention)
   - Error response shapes for each error case
   - Pagination details if applicable
5. If any schema changes (new tables, columns) are needed, propose them in .workflow/technical-context.md and log a handoff to Manager for approval. For this automated flow, include the approval note yourself.
6. Log a handoff in .workflow/handoff-log.md to the Frontend Engineer noting which contracts are ready
7. Log a handoff in .workflow/handoff-log.md to the QA Engineer with the contracts for testing reference

Do NOT write implementation code. Only contracts. Implementation happens in the next phase."

    run_agent_with_retry "backend-engineer" "$task_prompt" 3

    if phase_contracts_complete; then
        log_success "API contracts published"
        sprint_state_set "phase" "contracts"
        sprint_state_set "contracts_status" "complete"
    else
        # Check if there are backend tasks at all
        local backend_tasks
        backend_tasks=$(grep -c 'Backend Engineer' "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null || echo "0")
        if [[ "$backend_tasks" -eq 0 ]]; then
            log_info "No backend tasks this sprint — skipping contracts"
            sprint_state_set "contracts_status" "skipped"
        else
            log_error "API contracts phase incomplete"
            return 1
        fi
    fi
}

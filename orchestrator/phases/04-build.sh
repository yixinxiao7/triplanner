#!/usr/bin/env bash
# Phase 04: Build — Backend, Frontend, and Deploy Engineers implement in parallel

run_phase_build() {
    log_phase "Phase 4: Build (Backend + Frontend + Deploy Engineers)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local backend_prompt="You are the Backend Engineer working on Sprint #${sprint_num}.

Your task: IMPLEMENT all your assigned backend tasks.

1. Read .workflow/dev-cycle-tracker.md for your assigned tasks
2. Read .workflow/api-contracts.md for the contracts you published (implement exactly these)
3. Read .workflow/technical-context.md for any approved schema changes
4. Read architecture.md for coding conventions
5. For each backend task:
   a. Create database migrations if needed (in backend/src/migrations/ using Knex)
   b. Create models in backend/src/models/ for database queries
   c. Create route handlers in backend/src/routes/
   d. Add input validation using the validation middleware
   e. Write tests (at least one happy-path and one error-path per endpoint)
   f. Self-check against .workflow/security-checklist.md
6. Register new routes in backend/src/app.js
7. Update backend/.env.example if new environment variables are needed
8. Move each completed task to 'In Review' in .workflow/dev-cycle-tracker.md
9. Log handoffs in .workflow/handoff-log.md to QA Engineer describing what to test

Write clean, production-quality code. Follow the patterns established in the existing codebase. Use parameterized Knex queries — never concatenate SQL. Handle errors gracefully."

    local frontend_prompt="You are the Frontend Engineer working on Sprint #${sprint_num}.

Your task: IMPLEMENT all your assigned frontend tasks.

1. Read .workflow/dev-cycle-tracker.md for your assigned tasks
2. Read .workflow/ui-spec.md for the approved UI specs — build exactly what they describe
3. Read .workflow/api-contracts.md for the API endpoints you'll call
4. Read architecture.md for coding conventions
5. Acknowledge each API contract in .workflow/handoff-log.md
6. For each frontend task:
   a. Create page components in frontend/src/pages/
   b. Create reusable components in frontend/src/components/
   c. Create custom hooks in frontend/src/hooks/ for data fetching and state management
   d. Wire up API calls using the API client in frontend/src/utils/api.js
   e. Implement ALL states from the UI spec: empty, loading, error, success
   f. Add client-side input validation for forms
   g. Write at least a render test for each new component
   h. Style components (CSS modules or inline styles, colocated with components)
7. Update routes in frontend/src/App.jsx for new pages
8. Move each completed task to 'In Review' in .workflow/dev-cycle-tracker.md
9. Log handoffs in .workflow/handoff-log.md to QA Engineer

Build according to the UI spec. Handle every state. Don't skip error or empty states."

    local deploy_prompt="You are the Deploy Engineer working on Sprint #${sprint_num}.

Your task: IMPLEMENT all your assigned infrastructure tasks that are in Backlog or In Progress status.

1. Read .workflow/dev-cycle-tracker.md for your assigned tasks
2. Read .workflow/active-sprint.md for sprint context and dependency chains
3. Read architecture.md for infrastructure conventions
4. For each infrastructure task:
   a. Implement the required configuration, scripts, or infrastructure changes
   b. Update any environment config files (.env.example, etc.)
   c. Document setup steps in the task notes or handoff log
   d. Test that the changes work correctly
   e. Self-check against .workflow/security-checklist.md
5. Move each completed task to 'In Review' in .workflow/dev-cycle-tracker.md
6. Log handoffs in .workflow/handoff-log.md to QA Engineer describing what to test

Write clean, production-quality configurations. Follow security best practices. Do not skip testing your changes."

    # Check which agents have work
    local backend_tasks frontend_tasks deploy_tasks
    backend_tasks=$(grep -cE 'Backend Engineer.*(Backlog|In Progress)' "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null || true)
    backend_tasks="${backend_tasks:-0}"
    frontend_tasks=$(grep -cE 'Frontend Engineer.*(Backlog|In Progress)' "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null || true)
    frontend_tasks="${frontend_tasks:-0}"
    deploy_tasks=$(grep -cE 'Deploy Engineer.*(Backlog|In Progress)' "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null || true)
    deploy_tasks="${deploy_tasks:-0}"

    # Build list of agents to run
    local agents_to_run=()
    if [[ "$backend_tasks" -gt 0 ]]; then
        agents_to_run+=("backend-engineer:${backend_prompt}")
    fi
    if [[ "$frontend_tasks" -gt 0 ]]; then
        agents_to_run+=("frontend-engineer:${frontend_prompt}")
    fi
    if [[ "$deploy_tasks" -gt 0 ]]; then
        agents_to_run+=("deploy-engineer:${deploy_prompt}")
    fi

    local agent_count=${#agents_to_run[@]}
    if [[ $agent_count -eq 0 ]]; then
        log_warn "No implementation tasks found for this phase"
    elif [[ $agent_count -eq 1 ]]; then
        local entry="${agents_to_run[0]}"
        local agent_name="${entry%%:*}"
        local task="${entry#*:}"
        log_info "Running ${agent_name} only"
        run_agent_with_retry "$agent_name" "$task"
    else
        log_info "Running $agent_count engineers in parallel"
        run_agents_parallel "${agents_to_run[@]}"
    fi

    sprint_state_set "phase" "build"
    sprint_state_set "build_status" "complete"
    log_success "Build phase complete — tasks moved to In Review"
}

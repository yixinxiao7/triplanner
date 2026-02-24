#!/usr/bin/env bash
# Phase 07: Deploy — Build and deploy to staging

run_phase_deploy() {
    log_phase "Phase 7: Deploy (Deploy Engineer)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the Deploy Engineer working on Sprint #${sprint_num}.

Your task: Build and deploy the application to staging.

PRE-DEPLOY:
1. Read .workflow/handoff-log.md for QA's confirmation that all tests pass
2. Read .workflow/technical-context.md for any pending migrations
3. Read .workflow/dev-cycle-tracker.md — verify all sprint tasks are Done

BUILD:
4. Install dependencies:
   - cd backend && npm install
   - cd frontend && npm install
5. Run the build:
   - cd frontend && npm run build
   - Verify the build succeeds with no errors
6. Log build status in .workflow/qa-build-log.md

STAGING DEPLOYMENT:
7. Set up the local staging environment:
   - Ensure Docker is available. If docker-compose is available, run: cd infra && docker-compose up -d
   - If Docker is not available, document this as a limitation and use local processes instead
   - Run any pending database migrations: cd backend && npm run migrate
8. Start the backend: cd backend && npm start (or npm run dev)
9. Verify the backend starts and responds on the expected port
10. Log the deployment in .workflow/qa-build-log.md (Environment: Staging, Build Status: Success/Failed)

HANDOFF:
11. Log a handoff to Monitor Agent to run post-deploy health checks
12. Include the URLs/ports where the services are running

If any step fails, log the failure details in qa-build-log.md and handoff-log.md. Do not proceed to production deployment — that only happens after Monitor and User Agent verification.

Note: For this local/staging setup, 'staging' means running the built application locally with a real database. Production deployment will be handled separately when CI/CD is configured."

    run_agent_with_retry "deploy-engineer" "$task_prompt" 3

    sprint_state_set "phase" "deploy"
    sprint_state_set "deploy_status" "complete"
    log_success "Deploy phase complete"
}

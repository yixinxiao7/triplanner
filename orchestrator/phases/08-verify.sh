#!/usr/bin/env bash
# Phase 08: Verify — Monitor Agent runs post-deploy health checks

run_phase_verify() {
    log_phase "Phase 8: Health Check (Monitor Agent)"

    local sprint_num
    sprint_num=$(get_current_sprint)

    local task_prompt="You are the Monitor Agent working on Sprint #${sprint_num}.

Your task: Run post-deploy health checks on the staging environment.

1. Read .workflow/handoff-log.md for the Deploy Engineer's deployment details (URLs, ports)
2. Read .workflow/api-contracts.md for the list of endpoints to check
3. Read architecture.md for environment URLs

CONFIG CONSISTENCY (run this FIRST):
4. Read backend/.env and extract PORT, SSL_KEY_PATH, SSL_CERT_PATH, CORS_ORIGIN
5. Read frontend/vite.config.js and extract the proxy target URL
6. Validate:
   - Backend PORT matches the port in the vite proxy target (e.g., both 3000)
   - If SSL_KEY_PATH and SSL_CERT_PATH are set in .env, backend serves HTTPS — vite proxy must use https://, not http://
   - CORS_ORIGIN includes the frontend dev server origin (http://localhost:<vite-dev-port>)
   - If infra/docker-compose.yml exists, container port mappings are consistent
7. Any mismatch is a FAIL — log it and create a handoff to the responsible engineer

HEALTH CHECKS:
8. Check if the backend is responding:
   - Read PORT from backend/.env to know the correct port
   - curl http://localhost:<PORT>/api/v1/health (or https:// if SSL is configured)
   - Verify it returns HTTP 200 with { data: { status: 'ok' } }
9. Check database connectivity (the health endpoint should cover this)
10. For each API endpoint documented in api-contracts.md:
    - Test that it responds (may need auth token for protected routes)
    - Verify response shape matches the contract
    - Check for 5xx errors
11. If the frontend was built, check if it's accessible:
    - curl http://localhost:5173 (or check if the build output exists in frontend/dist/)

LOGGING:
12. Log all results in .workflow/qa-build-log.md using the Post-Deploy Health Check format:
   - Environment: Staging
   - Each check: Pass or Fail with details
   - Config Consistency: Pass or Fail with details
   - Deploy Verified: Yes or No
13. If ALL checks pass (including config consistency):
    - Set Deploy Verified = Yes
    - Log a handoff to User Agent confirming staging is ready for testing
14. If ANY check fails:
    - Set Deploy Verified = No
    - Log detailed error in qa-build-log.md
    - Create a Monitor Alert in .workflow/feedback-log.md (Severity: Critical or Major)
    - Log a handoff to Deploy Engineer recommending investigation
    - For config mismatches: also handoff to Frontend Engineer if proxy/CORS is involved

Be precise in your reports. Include actual HTTP status codes, response bodies, and error messages."

    run_agent_with_retry "monitor-agent" "$task_prompt" 3

    # Check if health checks passed
    if phase_verify_complete; then
        sprint_state_set "phase" "verify"
        sprint_state_set "verify_status" "pass"
        log_success "Health checks passed — staging is ready"
    else
        log_warn "Health checks may have failed. Checking for critical issues..."

        if grep -q 'Deploy Verified.*No' "${WORKFLOW_DIR}/qa-build-log.md" 2>/dev/null; then
            log_error "Health checks FAILED. Running fix cycle."

            # Re-deploy
            run_phase_deploy
            # Re-verify
            run_agent_with_retry "monitor-agent" "$task_prompt" 3

            if ! phase_verify_complete; then
                log_error "Health checks failed after retry. Sprint may need manual intervention."
                sprint_state_set "verify_status" "failed"
                return 1
            fi
        fi

        sprint_state_set "phase" "verify"
        sprint_state_set "verify_status" "pass"
    fi
}

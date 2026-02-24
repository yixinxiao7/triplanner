#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Multi-Agent Dev Workspace — Orchestrator                          ║
# ║  The "go" button. Runs a full sprint cycle autonomously.           ║
# ╚══════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./orchestrator/orchestrate.sh              # Run a single sprint
#   ./orchestrator/orchestrate.sh --continue   # Continue from last checkpoint
#   ./orchestrator/orchestrate.sh --loop       # Run sprints until MAX_SPRINTS
#   ./orchestrator/orchestrate.sh --status     # Show current sprint status
#   ./orchestrator/orchestrate.sh --reset      # Clear state and start fresh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Source Libraries ─────────────────────────────────────────────────
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/run-agent.sh"
source "${SCRIPT_DIR}/lib/parse-workflow.sh"
source "${SCRIPT_DIR}/lib/check-sprint.sh"

# ── Load Config ──────────────────────────────────────────────────────
load_config

# ── Load Platform ────────────────────────────────────────────────────
source "${SCRIPT_DIR}/platforms/${PLATFORM}.sh"

# ── Source Phase Scripts ─────────────────────────────────────────────
for phase_script in "${SCRIPT_DIR}"/phases/*.sh; do
    source "$phase_script"
done

# ── CLI Argument Parsing ─────────────────────────────────────────────
MODE="single"  # single | continue | loop | status | reset

while [[ $# -gt 0 ]]; do
    case "$1" in
        --continue) MODE="continue"; shift ;;
        --loop)     MODE="loop"; shift ;;
        --status)   MODE="status"; shift ;;
        --reset)    MODE="reset"; shift ;;
        --help|-h)
            echo "Usage: ./orchestrator/orchestrate.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (none)       Run a single sprint cycle"
            echo "  --continue   Resume from last checkpoint"
            echo "  --loop       Run sprints continuously (up to MAX_SPRINTS)"
            echo "  --status     Show current sprint status and exit"
            echo "  --reset      Clear orchestrator state and start fresh"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ── Status Command ───────────────────────────────────────────────────
if [[ "$MODE" == "status" ]]; then
    echo ""
    log_phase "Orchestrator Status"
    echo -e "  Platform:      ${BOLD}${PLATFORM_NAME}${NC}"
    echo -e "  Sprint:        #$(get_current_sprint)"
    echo -e "  Sprint State:  $(detect_sprint_state)"
    echo -e "  Next Phase:    $(determine_next_phase)"
    print_sprint_summary
    exit 0
fi

# ── Reset Command ────────────────────────────────────────────────────
if [[ "$MODE" == "reset" ]]; then
    log_warn "Resetting orchestrator state..."
    state_clear
    sprint_state_clear
    log_success "State cleared. Run orchestrate.sh to start fresh."
    exit 0
fi

# ── Pre-Flight Checks ───────────────────────────────────────────────
log_phase "Multi-Agent Orchestrator"
echo -e "  Platform:  ${BOLD}${PLATFORM_NAME}${NC}"
echo -e "  Mode:      ${BOLD}${MODE}${NC}"
echo ""

check_claude_cli
check_project_brief
validate_platform

# ── Run a Single Sprint ─────────────────────────────────────────────
run_sprint() {
    local sprint_num
    sprint_num=$(state_get "SPRINT_NUMBER" "1")
    timer_start

    log_phase "Starting Sprint #${sprint_num}"

    # Determine where to start (for --continue mode)
    local start_phase
    if [[ "$MODE" == "continue" ]]; then
        start_phase=$(determine_next_phase)
        if [[ "$start_phase" == "done" ]]; then
            log_success "Sprint #${sprint_num} is already complete!"
            return 0
        fi
        log_info "Resuming from phase: $start_phase"
    else
        start_phase="plan"
    fi

    # Phase execution with checkpoint tracking
    local phases=("plan" "design" "contracts" "build" "review" "qa" "deploy" "verify" "test" "closeout")
    local started=false

    for phase in "${phases[@]}"; do
        # Skip phases until we reach the start phase
        if [[ "$started" == false ]]; then
            if [[ "$phase" == "$start_phase" ]]; then
                started=true
            else
                continue
            fi
        fi

        log_info "Running phase: $phase"
        sprint_state_set "current_phase" "$phase"

        case "$phase" in
            plan)      run_phase_plan ;;
            design)    run_phase_design ;;
            contracts) run_phase_contracts ;;
            build)     run_phase_build ;;
            review)    run_phase_review ;;
            qa)        run_phase_qa ;;
            deploy)    run_phase_deploy ;;
            verify)    run_phase_verify ;;
            test)      run_phase_test ;;
            closeout)  run_phase_closeout ;;
        esac

        sprint_state_set "${phase}_completed" "true"
        git_checkpoint "$phase" "$sprint_num"
        log_success "Phase '$phase' complete (elapsed: $(timer_elapsed))"
    done

    # Sprint complete
    log_phase "Sprint #${sprint_num} Complete! (Total time: $(timer_elapsed))"
    check_definition_of_done || true
    print_sprint_summary
}

# ── Sprint Result Summary ────────────────────────────────────────────
print_final_summary() {
    local sprint_num
    sprint_num=$(get_current_sprint)

    echo ""
    log_phase "Sprint #${sprint_num} — Final Report"
    echo ""

    # Print feedback summary
    local feedback="${WORKFLOW_DIR}/feedback-log.md"
    if [[ -f "$feedback" ]]; then
        local total_feedback bugs ux_issues gaps positive
        total_feedback=$(grep -cP '^\|(?!\s*(Feedback|$))' "$feedback" 2>/dev/null || echo "0")
        bugs=$(grep -c 'Bug' "$feedback" 2>/dev/null || echo "0")
        ux_issues=$(grep -c 'UX Issue' "$feedback" 2>/dev/null || echo "0")
        gaps=$(grep -c 'Feature Gap' "$feedback" 2>/dev/null || echo "0")
        positive=$(grep -c 'Positive' "$feedback" 2>/dev/null || echo "0")

        echo -e "  ${BOLD}User Feedback:${NC}"
        echo -e "    Total:        $total_feedback"
        echo -e "    Bugs:         $bugs"
        echo -e "    UX Issues:    $ux_issues"
        echo -e "    Feature Gaps: $gaps"
        echo -e "    Positive:     $positive"
    fi

    echo ""
    echo -e "  ${BOLD}What's next:${NC}"
    echo -e "  • Review the sprint output in .workflow/sprint-log.md"
    echo -e "  • Check feedback in .workflow/feedback-log.md"
    echo -e "  • To add your own feedback, edit .workflow/feedback-log.md"
    echo -e "  • To start the next sprint: ${BOLD}./orchestrator/orchestrate.sh${NC}"
    echo ""
}

# ── Wait for Human Feedback ──────────────────────────────────────────
wait_for_feedback() {
    local sprint_num
    sprint_num=$(get_current_sprint)

    echo ""
    log_phase "Waiting for Your Feedback"
    echo ""
    echo -e "  Sprint #${sprint_num} is complete. The agents have tested the product"
    echo -e "  and logged their feedback. Now it's your turn."
    echo ""
    echo -e "  ${BOLD}To provide feedback:${NC}"
    echo -e "  1. Review the app and .workflow/feedback-log.md"
    echo -e "  2. Add your own entries (use Category: Feature Gap, Bug, UX Issue, etc.)"
    echo -e "  3. Save the file"
    echo ""
    echo -e "  ${BOLD}When ready for the next sprint:${NC}"
    echo -e "  Press Enter to continue, or Ctrl+C to stop."
    echo ""

    read -r -p "  → " || true
    echo ""
}

# ── Main Execution ───────────────────────────────────────────────────

case "$MODE" in
    single|continue)
        run_sprint
        print_final_summary
        ;;

    loop)
        local_sprint_count=0
        local_max=${MAX_SPRINTS:-0}

        while true; do
            run_sprint
            print_final_summary
            ((local_sprint_count++))

            # Check max sprints
            if [[ $local_max -gt 0 && $local_sprint_count -ge $local_max ]]; then
                log_info "Reached maximum sprints ($local_max). Stopping."
                break
            fi

            # Auto-continue or wait for human
            if [[ "${AUTO_CONTINUE}" == "true" ]]; then
                log_info "Auto-continuing to next sprint..."
            else
                wait_for_feedback
            fi

            # Prepare next sprint
            increment_sprint
        done
        ;;
esac

log_success "Orchestrator finished."

#!/usr/bin/env bash
# run-agent.sh — Invoke a Claude Code agent with its system prompt and task
# Sourced by orchestrate.sh. Never run directly.

# ── Agent Invocation ─────────────────────────────────────────────────
#
# Each agent is a Claude Code session that:
# 1. Receives its role definition as a system prompt
# 2. Gets a specific task to accomplish this phase
# 3. Has read/write access scoped to the project
# 4. Writes its outputs to workflow files and source code
#
# Usage:
#   run_agent <agent_name> <task_prompt> [max_turns]
#
# agent_name: matches the filename in .agents/ (without .md)
# task_prompt: what the agent should do right now
# max_turns: optional, defaults to AGENT_MAX_TURNS from config

run_agent() {
    local agent_name="$1"
    local task_prompt="$2"
    local max_turns="${3:-${AGENT_MAX_TURNS:-50}}"
    local agent_file="${AGENTS_DIR}/${agent_name}.md"
    local log_dir="${ORCHESTRATOR_DIR}/logs"
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local log_file="${log_dir}/${timestamp}-${agent_name}.log"

    # Validate agent prompt exists
    if [[ ! -f "$agent_file" ]]; then
        log_error "Agent prompt not found: $agent_file"
        return 1
    fi

    # Ensure log directory exists
    mkdir -p "$log_dir"

    # Build the system prompt: agent role + project context
    local system_prompt
    system_prompt=$(build_system_prompt "$agent_name")

    log_agent "$agent_name" "Starting task..."
    log_info "Max turns: $max_turns | Log: $log_file"

    # Invoke Claude Code
    # --print: non-interactive mode, output to stdout
    # --system-prompt: the agent's role and context
    # --max-turns: prevent runaway agents
    # --allowedTools: scoped to what the agent needs
    local exit_code=0
    claude --print \
        --dangerously-skip-permissions \
        --system-prompt "$system_prompt" \
        --max-turns "$max_turns" \
        --verbose \
        "$task_prompt" \
        2>&1 | tee "$log_file" || exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        log_error "Agent '$agent_name' exited with code $exit_code"
        log_error "Check log: $log_file"
        return $exit_code
    fi

    log_success "Agent '$agent_name' completed successfully"
    return 0
}

# ── Build System Prompt ──────────────────────────────────────────────
# Combines the agent's role definition with project-wide context

build_system_prompt() {
    local agent_name="$1"
    local agent_file="${AGENTS_DIR}/${agent_name}.md"
    local sprint_num
    sprint_num=$(get_current_sprint)

    cat <<SYSPROMPT
$(cat "$agent_file")

---

## Orchestrator Context

You are being invoked by the automated orchestrator. This is Sprint #${sprint_num}.

**Critical instructions:**
- You are running autonomously. Do not ask clarifying questions — make reasonable decisions.
- Read the workflow files listed in your prompt to get current context before acting.
- Write all outputs to the files specified in your prompt.
- When you finish your work, update the dev-cycle-tracker.md and handoff-log.md as described in your responsibilities.
- If you encounter an error you cannot resolve, write a detailed description of the blocker to the handoff-log.md with Status: Blocked and move on.
- Do not modify files outside your designated scope. Use handoff-log.md to request changes from other agents.

**Project root:** ${PROJECT_ROOT}
**Platform:** ${PLATFORM:-web}
**Current date:** $(date +%Y-%m-%d)
SYSPROMPT
}

# ── Parallel Agent Runner ────────────────────────────────────────────
# Run multiple agents concurrently and wait for all to complete
#
# Usage:
#   run_agents_parallel "agent1:task1" "agent2:task2"
#
# Each argument is "agent_name:task_prompt"

run_agents_parallel() {
    local pids=()
    local agents=()
    local results=()
    local log_dir="${ORCHESTRATOR_DIR}/logs"
    mkdir -p "$log_dir"

    log_info "Starting ${#@} agents in parallel..."

    for entry in "$@"; do
        local agent_name="${entry%%:*}"
        local task_prompt="${entry#*:}"

        agents+=("$agent_name")

        # Run in background
        (
            run_agent "$agent_name" "$task_prompt"
        ) &
        pids+=($!)
    done

    # Wait for all and collect results
    local all_passed=true
    for i in "${!pids[@]}"; do
        local pid="${pids[$i]}"
        local agent="${agents[$i]}"
        if wait "$pid"; then
            log_success "Agent '$agent' completed"
            results+=("$agent:ok")
        else
            log_error "Agent '$agent' failed"
            results+=("$agent:failed")
            all_passed=false
        fi
    done

    if $all_passed; then
        log_success "All parallel agents completed successfully"
        return 0
    else
        log_error "Some agents failed. Results:"
        for r in "${results[@]}"; do
            echo "  - $r"
        done
        return 1
    fi
}

# ── Agent with Retry ─────────────────────────────────────────────────
# Retry an agent up to N times if it fails

run_agent_with_retry() {
    local agent_name="$1"
    local task_prompt="$2"
    local max_retries="${3:-2}"
    local attempt=1

    while [[ $attempt -le $max_retries ]]; do
        log_info "Attempt $attempt/$max_retries for agent '$agent_name'"
        if run_agent "$agent_name" "$task_prompt"; then
            return 0
        fi
        log_warn "Agent '$agent_name' failed (attempt $attempt/$max_retries)"
        ((attempt++))
        sleep 2
    done

    log_error "Agent '$agent_name' failed after $max_retries attempts"
    return 1
}

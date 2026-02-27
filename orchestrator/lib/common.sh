#!/usr/bin/env bash
# common.sh -- Shared utilities for the orchestrator
# Sourced by all other scripts. Never run directly.

set -euo pipefail

# -- Colors & Formatting ------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# -- Logging -------------------------------------------------------------------
log_info()    { echo -e "${BLUE}[INFO]${NC}  $(date +%H:%M:%S) $*"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $(date +%H:%M:%S) $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $(date +%H:%M:%S) $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $(date +%H:%M:%S) $*"; }
log_phase()   { echo -e "\n${BOLD}${CYAN}=== $* ===${NC}\n"; }
log_agent()   { echo -e "${BOLD}[Agent: $1]${NC} $2"; }

# -- Paths ---------------------------------------------------------------------
# PROJECT_ROOT is set by the main orchestrate.sh before sourcing this
AGENTS_DIR="${PROJECT_ROOT}/.agents"
WORKFLOW_DIR="${PROJECT_ROOT}/.workflow"
ORCHESTRATOR_DIR="${PROJECT_ROOT}/orchestrator"
PLATFORMS_DIR="${ORCHESTRATOR_DIR}/platforms"
STATE_FILE="${ORCHESTRATOR_DIR}/.state"
SPRINT_STATE_FILE="${ORCHESTRATOR_DIR}/.sprint-state"

# -- Config Loading ------------------------------------------------------------
load_config() {
    local config_file="${ORCHESTRATOR_DIR}/config.sh"
    if [[ ! -f "$config_file" ]]; then
        log_error "Config file not found: $config_file"
        log_error "Run './orchestrator/setup.sh' first or copy config.example.sh to config.sh"
        exit 1
    fi
    # shellcheck source=/dev/null
    source "$config_file"
}

# -- State Management ----------------------------------------------------------
# Lightweight key=value state file for tracking orchestrator progress

state_set() {
    local key="$1" value="$2"
    if [[ -f "$STATE_FILE" ]] && grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$STATE_FILE"
    else
        echo "${key}=${value}" >> "$STATE_FILE"
    fi
}

state_get() {
    local key="$1" default="${2:-}"
    if [[ -f "$STATE_FILE" ]] && grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
        grep "^${key}=" "$STATE_FILE" | head -1 | cut -d= -f2-
    else
        echo "$default"
    fi
}

state_clear() {
    rm -f "$STATE_FILE"
}

# -- Sprint State --------------------------------------------------------------
# Tracks which phase the current sprint is in

sprint_state_set() {
    local key="$1" value="$2"
    if [[ -f "$SPRINT_STATE_FILE" ]] && grep -q "^${key}=" "$SPRINT_STATE_FILE" 2>/dev/null; then
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$SPRINT_STATE_FILE"
    else
        echo "${key}=${value}" >> "$SPRINT_STATE_FILE"
    fi
}

sprint_state_get() {
    local key="$1" default="${2:-}"
    if [[ -f "$SPRINT_STATE_FILE" ]] && grep -q "^${key}=" "$SPRINT_STATE_FILE" 2>/dev/null; then
        grep "^${key}=" "$SPRINT_STATE_FILE" | head -1 | cut -d= -f2-
    else
        echo "$default"
    fi
}

sprint_state_clear() {
    rm -f "$SPRINT_STATE_FILE"
}

# -- Workflow File Helpers -----------------------------------------------------

# Get the current sprint number from active-sprint.md
get_current_sprint() {
    local sprint_line
    sprint_line=$(grep -oE 'Sprint #[0-9]+' "${WORKFLOW_DIR}/active-sprint.md" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "")
    if [[ -z "$sprint_line" ]]; then
        echo "0"
    else
        echo "$sprint_line"
    fi
}

# Count tasks in a given status in dev-cycle-tracker.md
count_tasks_in_status() {
    local status="$1"
    grep -c "| ${status} |" "${WORKFLOW_DIR}/dev-cycle-tracker.md" 2>/dev/null || true
}

# Count pending handoffs for a specific agent
count_pending_handoffs() {
    local agent="$1"
    grep -c "To Agent.*${agent}" "${WORKFLOW_DIR}/handoff-log.md" 2>/dev/null || true
}

# Check if a file contains non-template content (i.e., has been filled in)
file_has_content() {
    local file="$1"
    local marker="${2:-\[Template Entry\]}"
    if [[ ! -f "$file" ]]; then
        return 1
    fi
    # Check if file has content beyond templates and headers
    local content_lines
    content_lines=$(grep -cvE '^\s*$|^\s*#|^\s*\|.*\|.*\||^\s*---|\[Template|^\s*\*' "$file" 2>/dev/null || true)
    content_lines="${content_lines:-0}"
    [[ "$content_lines" -gt 2 ]]
}

# -- Validation ----------------------------------------------------------------

check_claude_cli() {
    if ! command -v claude &>/dev/null; then
        log_error "Claude CLI not found. Install it first:"
        log_error "  npm install -g @anthropic-ai/claude-code"
        exit 1
    fi
    log_success "Claude CLI found: $(command -v claude)"
}

check_project_brief() {
    local brief="${WORKFLOW_DIR}/project-brief.md"
    if [[ ! -f "$brief" ]]; then
        log_error "Project brief not found at: $brief"
        exit 1
    fi
    # Check if the template placeholders are still there
    if grep -q '\[Your project name\]' "$brief"; then
        log_error "Project brief is still a template. Fill it in before running."
        log_error "  Edit: $brief"
        exit 1
    fi
    log_success "Project brief found and populated"
}

validate_platform() {
    local platform="${PLATFORM:-web}"
    local platform_file="${PLATFORMS_DIR}/${platform}.sh"
    if [[ ! -f "$platform_file" ]]; then
        log_error "Unknown platform: $platform"
        log_error "Available platforms:"
        for f in "${PLATFORMS_DIR}"/*.sh; do
            echo "  - $(basename "$f" .sh)"
        done
        exit 1
    fi
    log_success "Platform: $platform"
}

# -- Config Consistency Check --------------------------------------------------
# Validates that backend .env, frontend vite.config, and docker-compose agree
# on ports, protocols, and CORS origins. Runs before QA to catch wiring issues.

check_config_consistency() {
    local errors=0
    local backend_env="${PROJECT_ROOT}/backend/.env"
    local vite_config="${PROJECT_ROOT}/frontend/vite.config.js"
    local docker_compose="${PROJECT_ROOT}/infra/docker-compose.yml"

    log_info "Running config consistency check..."

    # 1. Extract backend port from .env
    local backend_port=""
    if [[ -f "$backend_env" ]]; then
        backend_port=$(grep -E '^PORT=' "$backend_env" 2>/dev/null | cut -d= -f2 | tr -d ' "'"'" || true)
    fi

    # 2. Extract proxy target from vite.config
    local vite_proxy_target=""
    if [[ -f "$vite_config" ]]; then
        vite_proxy_target=$(grep -oE "target: ['\"]https?://[^'\"]+['\"]" "$vite_config" 2>/dev/null | head -1 | grep -oE "https?://[^'\"]+" || true)
    fi

    # 3. Check backend port matches vite proxy target
    if [[ -n "$backend_port" && -n "$vite_proxy_target" ]]; then
        local vite_port
        vite_port=$(echo "$vite_proxy_target" | grep -oE ':[0-9]+$' | tr -d ':')
        if [[ -n "$vite_port" && "$vite_port" != "$backend_port" ]]; then
            log_error "Config mismatch: backend PORT=$backend_port but vite proxy targets port $vite_port"
            log_error "  Fix: update backend/.env PORT or frontend/vite.config.js proxy target"
            ((errors++))
        fi
    fi

    # 4. Check protocol consistency (HTTP vs HTTPS)
    local backend_has_ssl="false"
    if [[ -f "$backend_env" ]]; then
        local ssl_key ssl_cert
        ssl_key=$(grep -E '^SSL_KEY_PATH=' "$backend_env" 2>/dev/null | cut -d= -f2 || true)
        ssl_cert=$(grep -E '^SSL_CERT_PATH=' "$backend_env" 2>/dev/null | cut -d= -f2 || true)
        if [[ -n "$ssl_key" && -n "$ssl_cert" ]]; then
            backend_has_ssl="true"
        fi
    fi

    if [[ "$backend_has_ssl" == "true" && -n "$vite_proxy_target" ]]; then
        if echo "$vite_proxy_target" | grep -q '^http://'; then
            log_error "Config mismatch: backend has SSL enabled but vite proxy uses http://"
            log_error "  Fix: either disable SSL in backend/.env or change vite proxy to https://"
            ((errors++))
        fi
    fi

    # 5. Check CORS origin matches frontend dev server
    if [[ -f "$backend_env" ]]; then
        local cors_origin
        cors_origin=$(grep -E '^CORS_ORIGIN=' "$backend_env" 2>/dev/null | cut -d= -f2 | tr -d ' "'"'" || true)
        if [[ -n "$cors_origin" ]]; then
            local vite_dev_port
            vite_dev_port=$(grep -oE 'port:\s*[0-9]+' "$vite_config" 2>/dev/null | head -1 | grep -oE '[0-9]+' || true)
            if [[ -n "$vite_dev_port" && ! "$cors_origin" =~ ":${vite_dev_port}" && "$cors_origin" != "*" ]]; then
                log_warn "CORS mismatch: backend CORS_ORIGIN=$cors_origin may not match frontend dev server port $vite_dev_port"
            fi
        fi
    fi

    if [[ $errors -gt 0 ]]; then
        log_error "Config consistency check found $errors error(s)"
        return 1
    else
        log_success "Config consistency check passed"
        return 0
    fi
}

# -- Git Checkpoints -----------------------------------------------------------
# Commits all changes after each phase so --continue always resumes
# from a clean state. If a token limit kills an agent mid-write,
# the worst case is re-running one phase from its last checkpoint.

git_checkpoint() {
    local phase_name="$1"
    local sprint_num="${2:-$(get_current_sprint)}"

    # Skip if git is not initialized
    if [[ ! -d "${PROJECT_ROOT}/.git" ]]; then
        return 0
    fi

    (
        cd "$PROJECT_ROOT"

        # Check if there are any changes to commit
        if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet HEAD 2>/dev/null && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
            log_info "Git checkpoint: no changes after phase '$phase_name'"
            return 0
        fi

        git add -A
        git commit -m "checkpoint: sprint #${sprint_num} -- phase '${phase_name}' complete" --no-verify 2>/dev/null || true
        log_success "Git checkpoint saved after phase '$phase_name'"
    )
}

# -- Timing --------------------------------------------------------------------

timer_start() {
    TIMER_START=$(date +%s)
}

timer_elapsed() {
    local now
    now=$(date +%s)
    local elapsed=$((now - TIMER_START))
    local minutes=$((elapsed / 60))
    local seconds=$((elapsed % 60))
    echo "${minutes}m ${seconds}s"
}

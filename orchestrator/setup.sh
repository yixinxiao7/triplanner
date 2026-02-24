#!/usr/bin/env bash
# setup.sh — Bootstrap the development environment
# Run this once before the first sprint: ./orchestrator/setup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source common utilities
source "${SCRIPT_DIR}/lib/common.sh"

log_phase "Multi-Agent Dev Workspace — Environment Setup"

# ── Step 1: Verify prerequisites ─────────────────────────────────────
log_info "Checking prerequisites..."

# Node.js
if command -v node &>/dev/null; then
    log_success "Node.js $(node --version)"
else
    log_error "Node.js not found. Install Node.js 18+ first."
    exit 1
fi

# npm
if command -v npm &>/dev/null; then
    log_success "npm $(npm --version)"
else
    log_error "npm not found."
    exit 1
fi

# Claude CLI
check_claude_cli

# Git
if command -v git &>/dev/null; then
    log_success "git $(git --version | cut -d' ' -f3)"
else
    log_warn "git not found — version control will not be available"
fi

# Docker (optional)
if command -v docker &>/dev/null; then
    log_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
    log_warn "Docker not found — database will need manual setup"
fi

# ── Step 2: Config file ──────────────────────────────────────────────
if [[ ! -f "${SCRIPT_DIR}/config.sh" ]]; then
    log_info "Creating config.sh from template..."
    cp "${SCRIPT_DIR}/config.example.sh" "${SCRIPT_DIR}/config.sh"
    log_success "Config created: orchestrator/config.sh"
    log_info "Review and adjust the config before running the orchestrator."
else
    log_success "Config already exists: orchestrator/config.sh"
fi

# Load config
source "${SCRIPT_DIR}/config.sh"

# ── Step 3: Initialize git repo ──────────────────────────────────────
if command -v git &>/dev/null; then
    if [[ ! -d "${PROJECT_ROOT}/.git" ]]; then
        log_info "Initializing git repository..."
        (cd "$PROJECT_ROOT" && git init && git add -A && git commit -m "Initial commit: multi-agent workspace scaffold")
        log_success "Git repository initialized"
    else
        log_success "Git repository already exists"
    fi
fi

# ── Step 4: Platform-specific setup ──────────────────────────────────
log_info "Loading platform: ${PLATFORM}"
local_platform_file="${SCRIPT_DIR}/platforms/${PLATFORM}.sh"

if [[ ! -f "$local_platform_file" ]]; then
    log_error "Platform file not found: $local_platform_file"
    log_error "Available: web, mobile"
    exit 1
fi

source "$local_platform_file"
platform_setup

# ── Step 5: Create directories ───────────────────────────────────────
log_info "Ensuring directory structure..."
mkdir -p "${SCRIPT_DIR}/logs"
mkdir -p "${PROJECT_ROOT}/.workflow"

# ── Step 6: Verify project brief ─────────────────────────────────────
echo ""
if grep -q '\[Your project name\]' "${WORKFLOW_DIR}/project-brief.md" 2>/dev/null; then
    log_warn "Project brief is still a template!"
    echo -e "  ${BOLD}Before running the orchestrator, fill in:${NC}"
    echo -e "  ${DIM}${WORKFLOW_DIR}/project-brief.md${NC}"
    echo ""
    echo "  Required fields:"
    echo "    - Project Name"
    echo "    - One-Line Description"
    echo "    - Target Users"
    echo "    - Problem Statement"
    echo "    - Core Features (MVP)"
    echo "    - Out of Scope"
    echo "    - Success Criteria"
else
    log_success "Project brief is populated"
fi

# ── Done ─────────────────────────────────────────────────────────────
echo ""
log_phase "Setup Complete"
echo -e "  Platform:    ${BOLD}${PLATFORM_NAME}${NC}"
echo -e "  Project:     ${BOLD}${PROJECT_ROOT}${NC}"
echo -e "  Config:      ${BOLD}${SCRIPT_DIR}/config.sh${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  1. Fill in .workflow/project-brief.md (if not done)"
echo -e "  2. Review orchestrator/config.sh"
echo -e "  3. Run: ${BOLD}./orchestrator/orchestrate.sh${NC}"
echo ""

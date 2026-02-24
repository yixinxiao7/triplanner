#!/usr/bin/env bash
# config.sh — Orchestrator configuration
# Copy this to config.sh and adjust as needed:
#   cp orchestrator/config.example.sh orchestrator/config.sh

# ── Platform ─────────────────────────────────────────────────────────
# Which platform template to use: "web" or "mobile"
PLATFORM="web"

# ── Agent Settings ───────────────────────────────────────────────────
# Maximum turns (API round-trips) per agent invocation
# Higher = more complex tasks can be completed, but costs more
AGENT_MAX_TURNS=75

# ── Sprint Settings ──────────────────────────────────────────────────
# Maximum number of sprints before stopping (0 = unlimited, waits for feedback)
MAX_SPRINTS=0

# Auto-continue to next sprint without waiting for human feedback?
# "true"  = fully autonomous, uses User Agent feedback to plan next sprint
# "false" = pauses after each sprint for human review and feedback
AUTO_CONTINUE="false"

# ── Error Handling ───────────────────────────────────────────────────
# Maximum retries per agent before failing the phase
MAX_AGENT_RETRIES=2

# Maximum review-fix cycles before moving on (prevents infinite loops)
MAX_REWORK_CYCLES=2

# ── Logging ──────────────────────────────────────────────────────────
# Keep detailed agent logs (can get large)
KEEP_AGENT_LOGS="true"

# Log directory (relative to orchestrator/)
LOG_DIR="logs"

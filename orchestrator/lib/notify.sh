#!/usr/bin/env bash
# notify.sh — Sprint completion email notifications (macOS Mail.app)

send_sprint_email() {
    local email="${NOTIFICATION_EMAIL:-}"

    if [[ -z "$email" ]]; then
        log_info "NOTIFICATION_EMAIL not set — skipping email notification."
        return 0
    fi

    local sprint_num
    sprint_num=$(get_current_sprint)

    log_info "Compiling sprint summary email for ${email}..."

    # ── Build email body from workflow files ─────────────────────────

    local sprint_log="${WORKFLOW_DIR}/sprint-log.md"
    local active_sprint="${WORKFLOW_DIR}/active-sprint.md"
    local body=""

    # Section 1: What was completed this sprint (from sprint-log.md)
    local completed_section=""
    if [[ -f "$sprint_log" ]]; then
        # Extract the current sprint's section from sprint-log.md
        completed_section=$(sed -n "/^### Sprint #${sprint_num} /,/^### Sprint #/{ /^### Sprint #${sprint_num} /d; /^### Sprint #/d; p; }" "$sprint_log" 2>/dev/null || true)
        if [[ -z "$completed_section" ]]; then
            # If it's the last section, grab to end of file
            completed_section=$(sed -n "/^### Sprint #${sprint_num} /,\${ /^### Sprint #${sprint_num} /d; p; }" "$sprint_log" 2>/dev/null || true)
        fi
    fi

    if [[ -n "$completed_section" ]]; then
        body+="SPRINT #${sprint_num} SUMMARY"
        body+=$'\n'"========================"
        body+=$'\n'"${completed_section}"
    else
        body+="Sprint #${sprint_num} completed. No summary found in sprint-log.md."
    fi

    # Section 2: Blockers (from active-sprint.md — the next sprint plan)
    local blockers=""
    if [[ -f "$active_sprint" ]]; then
        blockers=$(sed -n '/^## Blockers/,/^## /{ /^## Blockers/d; /^## /d; p; }' "$active_sprint" 2>/dev/null || true)
    fi

    if [[ -n "$blockers" ]]; then
        body+=$'\n\n'"BLOCKERS"
        body+=$'\n'"========"
        body+=$'\n'"${blockers}"
    fi

    # Section 3: Next sprint plan (from active-sprint.md)
    local next_sprint_goal=""
    if [[ -f "$active_sprint" ]]; then
        # Extract sprint header + goal + In Scope section
        next_sprint_goal=$(sed -n '/^## Sprint #/,/^## Out of Scope/{ /^## Out of Scope/d; p; }' "$active_sprint" 2>/dev/null || true)
    fi

    if [[ -n "$next_sprint_goal" ]]; then
        body+=$'\n\n'"NEXT SPRINT PLAN"
        body+=$'\n'"================"
        body+=$'\n'"${next_sprint_goal}"
    fi

    # ── Send via macOS Mail.app ──────────────────────────────────────

    local subject="[Triplanner] Sprint #${sprint_num} Complete"

    if ! command -v osascript &>/dev/null; then
        log_warn "osascript not found — cannot send email. Sprint summary printed above."
        return 0
    fi

    # Write body to a temp file so AppleScript reads it cleanly —
    # avoids syntax errors from markdown characters (braces, quotes, backslashes)
    local body_file
    body_file=$(mktemp)
    printf '%s' "$body" > "$body_file"

    osascript <<EOF
set bodyContent to read POSIX file "${body_file}" as «class utf8»

-- Ensure Mail.app is running and ready before composing
tell application "Mail"
    activate
    set maxWait to 30
    set waited to 0
    repeat while waited < maxWait
        try
            -- Test that Mail is responsive by reading inbox count
            count of messages of inbox
            exit repeat
        on error
            delay 1
            set waited to waited + 1
        end try
    end repeat

    set newMessage to make new outgoing message with properties {subject:"${subject}", content:bodyContent}
    tell newMessage
        make new to recipient at end of to recipients with properties {address:"${email}"}
    end tell
    send newMessage
end tell
EOF

    local exit_code=$?
    rm -f "$body_file"
    if [[ $exit_code -eq 0 ]]; then
        log_success "Sprint summary email sent to ${email}"
    else
        log_warn "Failed to send email (exit code ${exit_code}). Mail.app may not be configured."
    fi
}

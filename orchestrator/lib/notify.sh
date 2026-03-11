#!/usr/bin/env bash
# notify.sh — Sprint completion email notifications (Gmail SMTP)

send_sprint_email() {
    local email="${NOTIFICATION_EMAIL:-}"

    if [[ -z "$email" ]]; then
        log_info "NOTIFICATION_EMAIL not set — skipping email notification."
        return 0
    fi

    local app_password="${GMAIL_APP_PASSWORD:-}"
    if [[ -z "$app_password" ]]; then
        log_warn "GMAIL_APP_PASSWORD not set — skipping email notification."
        log_warn "Generate one at: Google Account → Security → 2-Step Verification → App Passwords"
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
        completed_section=$(sed -n "/^### Sprint #${sprint_num} /,/^### Sprint #/{ /^### Sprint #${sprint_num} /d; /^### Sprint #/d; p; }" "$sprint_log" 2>/dev/null || true)
        if [[ -z "$completed_section" ]]; then
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
        next_sprint_goal=$(sed -n '/^## Sprint #/,/^## Out of Scope/{ /^## Out of Scope/d; p; }' "$active_sprint" 2>/dev/null || true)
    fi

    if [[ -n "$next_sprint_goal" ]]; then
        body+=$'\n\n'"NEXT SPRINT PLAN"
        body+=$'\n'"================"
        body+=$'\n'"${next_sprint_goal}"
    fi

    # ── Send via Gmail SMTP ───────────────────────────────────────────

    local subject="[Triplanner] Sprint #${sprint_num} Complete"

    if ! command -v python3 &>/dev/null; then
        log_warn "python3 not found — cannot send email."
        return 0
    fi

    local body_file
    body_file=$(mktemp)
    printf '%s' "$body" > "$body_file"

    python3 - "$email" "$app_password" "$subject" "$body_file" <<'PYEOF'
import sys, smtplib
from email.mime.text import MIMEText

to_addr = sys.argv[1]
app_pw  = sys.argv[2]
subject = sys.argv[3]
with open(sys.argv[4]) as f:
    body = f.read()

msg = MIMEText(body, "plain", "utf-8")
msg["Subject"] = subject
msg["From"]    = to_addr
msg["To"]      = to_addr

with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
    smtp.login(to_addr, app_pw)
    smtp.send_message(msg)
PYEOF

    local exit_code=$?
    rm -f "$body_file"
    if [[ $exit_code -eq 0 ]]; then
        log_success "Sprint summary email sent to ${email}"
    else
        log_warn "Failed to send email (exit code ${exit_code}). Check GMAIL_APP_PASSWORD."
    fi
}

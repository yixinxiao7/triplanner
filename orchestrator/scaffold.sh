#!/usr/bin/env bash
#
# scaffold.sh — Reset this repo to a clean multi-agent dev workspace template.
#
# Usage:
#   1. Copy the repo:  cp -r triplanner my-new-project && cd my-new-project
#   2. Run:            ./orchestrator/scaffold.sh
#
# This script removes all app-specific code and state, resets workflow files
# to blank templates, and reinitializes git. The multi-agent framework
# (orchestrator, agents, rules) is preserved intact.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"

cd "$ROOT_DIR"

echo "============================================"
echo "  Multi-Agent Dev Workspace — Scaffold"
echo "============================================"
echo ""
echo "This will reset the repo to a clean template."
echo "All app-specific code and accumulated state will be removed."
echo ""

# Safety check: don't run in the original repo by accident
read -p "Are you sure you want to scaffold this directory? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "[1/7] Removing app-specific directories..."
rm -rf frontend/ backend/ shared/ infra/ e2e/ docs/ test-results/ logs/ mobile/ node_modules/

echo "[2/7] Resetting workflow files to templates..."
# Copy template files into .workflow/
for file in project-brief.md active-sprint.md dev-cycle-tracker.md api-contracts.md \
            ui-spec.md handoff-log.md feedback-log.md sprint-log.md qa-build-log.md \
            technical-context.md; do
  if [[ -f "$TEMPLATES_DIR/$file" ]]; then
    cp "$TEMPLATES_DIR/$file" ".workflow/$file"
  fi
done

# Delete app-specific workflow files
rm -f .workflow/hosting-research.md .workflow/architecture-decisions.md
rm -rf .workflow/archive/

# security-checklist.md and rollback-playbook.md are kept as-is (generic)

echo "[3/7] Resetting CLAUDE.md design context..."
# Replace the Design Context section (lines 130-151) with placeholder
# Use sed to replace everything between "## Design Context" and end of file
sed -i '' '/^## Design Context$/,$d' CLAUDE.md
cat "$TEMPLATES_DIR/CLAUDE-design-context.md" >> CLAUDE.md

echo "[4/7] Resetting architecture.md..."
cp "$TEMPLATES_DIR/architecture.md" architecture.md

echo "[5/7] Resetting orchestrator state..."
rm -f orchestrator/.state orchestrator/.sprint-state
rm -rf orchestrator/logs/
mkdir -p orchestrator/logs/
rm -f orchestrator/config.sh
# config.example.sh and setup.sh are kept — user runs setup.sh to recreate config.sh

echo "[6/7] Resetting root files..."
cp "$TEMPLATES_DIR/README.md" README.md
cp "$TEMPLATES_DIR/package.json" package.json
rm -f UPDATE_LOG.md render.yaml package-lock.json

# Reset playwright config to generic defaults
cat > playwright.config.js << 'PLAYWRIGHT_EOF'
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
PLAYWRIGHT_EOF

echo "[7/7] Reinitializing git..."
rm -rf .git
git init
git add -A
git commit -m "Initial commit: multi-agent dev workspace"

echo ""
echo "============================================"
echo "  Scaffold complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Edit .workflow/project-brief.md — describe your product"
echo "  2. Edit the Design Context section in CLAUDE.md — set your visual direction"
echo "  3. Run ./orchestrator/setup.sh — configure platform and environment"
echo "  4. Run ./orchestrator/orchestrate.sh — start your first sprint"
echo ""

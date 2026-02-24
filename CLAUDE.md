# CLAUDE.md — Multi-Agent Dev Workspace

This file is the entry point for any Claude Code agent working in this repository. Read this first.

## Workspace Overview

This is a multi-agent development workspace where specialized Claude Code agents collaborate to build applications. Each agent has a defined role, reads/writes specific files, and communicates through structured handoff logs.

This workspace supports both **web** and **mobile** platforms. The platform is configured in `orchestrator/config.sh` and determines the tech stack, directory layout, and conventions.

## Before You Do Anything

1. Read `rules.md` — Non-negotiable constraints for all agents
2. Read `architecture.md` — System design and tech stack decisions
3. Read your agent prompt in `.agents/` — Your specific role, responsibilities, and rules
4. Read `.workflow/active-sprint.md` — What you should be working on right now

## Key Directories

```
.agents/          → System prompts for each agent role
.workflow/        → All workflow docs, logs, specs, and tracking
orchestrator/     → Automation: runner, phase scripts, platform configs
frontend/         → React + Vite frontend (web platform)
mobile/           → React Native + Expo app (mobile platform)
backend/          → Express + PostgreSQL backend API
shared/           → Shared types and constants
infra/            → Docker, CI/CD, and deployment configs
```

## Agent Roles

| Agent | Prompt File | Primary Responsibility |
|-------|-------------|----------------------|
| Manager | `.agents/manager.md` | Sprint planning, code review, orchestration |
| Design Agent | `.agents/design-agent.md` | UI specs and screen descriptions |
| Backend Engineer | `.agents/backend-engineer.md` | API, database, server-side logic |
| Frontend Engineer | `.agents/frontend-engineer.md` | UI components, pages, client-side logic |
| QA Engineer | `.agents/qa-engineer.md` | Testing, security checklist, integration checks |
| Deploy Engineer | `.agents/deploy-engineer.md` | Build, deploy, environment management |
| Monitor Agent | `.agents/monitor-agent.md` | Post-deploy health checks, error monitoring |
| User Agent | `.agents/user-agent.md` | Product testing and structured feedback |

## Workflow Cycle

```
Manager plans sprint
  → Design Agent writes UI specs
  → Backend Engineer publishes API contracts
  → Engineers build in parallel
  → Manager reviews code
  → QA runs integration check + security checklist
  → Deploy ships to staging
  → Monitor verifies health
  → User Agent tests and submits feedback
  → Manager triages feedback → next sprint
```

## Communication Protocol

Agents do NOT talk to each other directly. All coordination happens through files:
- `.workflow/dev-cycle-tracker.md` — Task assignments and status
- `.workflow/handoff-log.md` — Context passed between agents
- `.workflow/api-contracts.md` — Backend ↔ Frontend interface agreements
- `.workflow/feedback-log.md` — User Agent and Monitor Agent observations

## Git Credentials & Commit Permissions

All git commits in this workspace must be made under the following credentials:

- **Name:** Yixin Xiao
- **Email:** yixinxiao7@gmail.com

These are configured globally via `git config --global`. Do not override them.

### Commit Permissions

Agents are pre-authorized to commit and push to **any branch except `main` and `master`** without prompting the user. This keeps the automated sprint cycle uninterrupted.

| Branch | Permission |
|--------|-----------|
| `feature/*`, `fix/*`, `hotfix/*`, `refactor/*`, `infra/*` | Auto-approved — no user confirmation needed |
| Any other non-protected branch | Auto-approved — no user confirmation needed |
| `main` / `master` | **Requires explicit user approval before every push** |

Additional hard rules:
- Force pushes (`--force`) are **never permitted** without explicit user approval
- Branch deletion requires explicit user approval
- Always reference the task ID from `dev-cycle-tracker.md` in commit messages

## Orchestrator (Automated Runner)

The orchestrator automates the full sprint lifecycle. Instead of manually invoking each agent, run:

```bash
# First time setup
./orchestrator/setup.sh

# Run a sprint
./orchestrator/orchestrate.sh

# Resume from where you left off
./orchestrator/orchestrate.sh --continue

# Run sprints in a loop (pauses for feedback between sprints)
./orchestrator/orchestrate.sh --loop

# Check current status
./orchestrator/orchestrate.sh --status
```

### How It Works

1. You fill in `.workflow/project-brief.md` with your product vision
2. You set the platform (web or mobile) in `orchestrator/config.sh`
3. You run `./orchestrator/orchestrate.sh`
4. The orchestrator invokes each agent in the correct order, checks for completion between phases, and handles rework cycles if code review or QA finds issues
5. When the sprint finishes, it presents a summary and waits for your feedback
6. You add feedback to `.workflow/feedback-log.md` and press Enter
7. The next sprint incorporates your feedback automatically

### Configuration

See `orchestrator/config.sh` for settings:
- `PLATFORM` — "web" or "mobile"
- `AGENT_MAX_TURNS` — How many API calls per agent (higher = more complex work)
- `AUTO_CONTINUE` — Whether to auto-start the next sprint or wait for human input
- `MAX_SPRINTS` — Cap on total sprints (0 = unlimited)

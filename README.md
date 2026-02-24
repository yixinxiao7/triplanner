# Multi-Agent Dev Workspace

A multi-agent AI development workspace for building web and mobile applications. Specialized Claude Code agents collaborate through structured workflows to plan, build, test, and deploy — autonomously.

## How It Works

1. You describe what you want to build in `.workflow/project-brief.md`
2. You run the orchestrator
3. Eight AI agents autonomously plan, design, build, test, and deploy your app
4. You review the result and provide feedback
5. The next sprint incorporates your feedback — rinse and repeat

## Quick Start

### Prerequisites
- Node.js 18+
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
- Docker (optional, for PostgreSQL)

### Setup

```bash
# 1. Run the setup script (installs dependencies, initializes git, checks tools)
./orchestrator/setup.sh

# 2. Choose your platform in orchestrator/config.sh
#    PLATFORM="web"    → React + Vite + Express
#    PLATFORM="mobile" → React Native + Expo + Express

# 3. Fill in your project brief
#    Edit: .workflow/project-brief.md

# 4. Launch the orchestrator
./orchestrator/orchestrate.sh
```

### Orchestrator Commands

```bash
./orchestrator/orchestrate.sh              # Run a single sprint
./orchestrator/orchestrate.sh --continue   # Resume from last checkpoint
./orchestrator/orchestrate.sh --loop       # Run sprints continuously
./orchestrator/orchestrate.sh --status     # Show current sprint status
./orchestrator/orchestrate.sh --reset      # Clear state and start fresh
```

## Platforms

| Platform | Frontend | Backend | Config |
|----------|----------|---------|--------|
| `web` | React 18 + Vite | Express + PostgreSQL | `orchestrator/platforms/web.sh` |
| `mobile` | React Native + Expo | Express + PostgreSQL | `orchestrator/platforms/mobile.sh` |

Both platforms share the same backend. The orchestrator configures the correct tech stack, directory layout, and agent context based on your platform choice.

## Project Structure

```
.agents/          → System prompts for each agent role
.workflow/        → Workflow docs, logs, specs, and tracking
orchestrator/     → Automation runner, phase scripts, platform configs
frontend/         → React + Vite frontend (web)
mobile/           → React Native + Expo app (mobile)
backend/          → Express + PostgreSQL backend API
shared/           → Shared types and constants
infra/            → Docker, CI/CD, and deployment configs
```

## The Sprint Cycle

Each sprint runs through 10 automated phases:

1. **Plan** — Manager Agent reads the brief/feedback and creates tasks
2. **Design** — Design Agent writes UI specs for frontend tasks
3. **Contracts** — Backend Engineer publishes API contracts
4. **Build** — Backend + Frontend Engineers implement in parallel
5. **Review** — Manager Agent reviews code quality and conventions
6. **QA** — QA Engineer runs tests, integration checks, security scan
7. **Deploy** — Deploy Engineer builds and deploys to staging
8. **Verify** — Monitor Agent runs post-deploy health checks
9. **Test** — User Agent tests from a real user's perspective
10. **Closeout** — Manager triages feedback, writes sprint summary

If code review or QA finds issues, the orchestrator automatically sends work back for fixes and re-runs the affected phases.

## Providing Feedback

After each sprint:
1. Review the output (code, running app, sprint summary)
2. Edit `.workflow/feedback-log.md` to add your observations
3. Run the orchestrator again — your feedback becomes Sprint N+1's input

## For AI Agents

If you're a Claude Code agent, start by reading `CLAUDE.md`. It will direct you to your role-specific prompt and the current sprint.

## Manual Development

If you want to develop without the orchestrator:

```bash
# Start the database
docker-compose -f infra/docker-compose.yml up -d

# Backend
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend (web)
cd frontend && npm install && npm run dev

# Mobile
cd mobile && npm install && npx expo start
```

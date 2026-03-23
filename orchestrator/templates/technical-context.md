# Technical Context

A living reference for all technical decisions and infrastructure details. Agents should consult this before making any architectural or tooling choices.

---

## Tech Stack

See `architecture.md` in the project root for the authoritative tech stack table.

---

## Database Migrations

All schema changes must be tracked here. Before deploying any migration, verify it has been tested on staging first.

**Rules for the Backend Engineer:**
- Every schema change must have a corresponding entry here before the task is marked Done
- Migrations must be reversible where possible — always write a rollback
- Never run a migration on Production without first verifying on Staging
- Add a note in the Handoff Log when a migration is ready for the Deploy Engineer

**Migration Log:**

| # | Sprint | Description | Type | File | Status |
|---|--------|-------------|------|------|--------|

---

## Environment Variables

| Variable | Purpose | Where Set |
|----------|---------|-----------|

---

## Third-Party Services

| Service | Purpose | Config Location |
|---------|---------|-----------------|

---

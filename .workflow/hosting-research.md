# T-124 — Production Hosting Provider Research Spike

**Task:** T-124
**Assigned To:** Deploy Engineer
**Date:** 2026-03-04
**Sprint:** 11
**Status:** Complete
**Scope:** Documentation only — no code changes, no deployments

---

## Executive Summary

**Top Pick: Railway** — Best developer experience, cheapest start, zero-config GitHub deploys, managed PostgreSQL, and straightforward migration from local staging. Estimated $20–30/month for this project.

**Runner-Up: Render** — Nearly as simple as Railway with a broader free tier, similar pricing, and a more established brand. Good choice if Railway pricing grows unpredictably.

---

## Project Requirements Recap

| Requirement | Detail |
|------------|--------|
| Backend | Node.js 20 + Express REST API (port 3001) |
| Database | PostgreSQL 15 (10 migrations applied, ~3 tables) |
| Frontend | React 18 + Vite (static build, ~2MB bundle) |
| Auth | JWT access + refresh tokens (env-driven secrets) |
| HTTPS | Required (API and SPA) |
| Current staging | pm2 process manager + `vite preview` on local machine |
| Existing infra files | `infra/Dockerfile.backend`, `infra/Dockerfile.frontend`, `infra/docker-compose.yml`, `infra/nginx.conf` |
| CI/CD | Currently manual — GitHub Actions desired for production |

---

## Provider Comparison

### 1. Railway

| Attribute | Details |
|-----------|---------|
| **URL** | railway.app |
| **Node.js Support** | ✅ Auto-detected (Nixpacks or Dockerfile) |
| **PostgreSQL** | ✅ Native plugin — one-click provisioning |
| **HTTPS** | ✅ Automatic SSL on all services + custom domains |
| **Docker Support** | ✅ Dockerfile supported; Nixpacks preferred for simple projects |
| **pm2 in production** | ❌ Not needed — Railway manages process lifecycle |
| **Zero-Downtime Deploys** | ✅ Rolling deploys with health check gating |
| **CI/CD** | ✅ GitHub repo → auto-deploy on push to branch of choice |
| **Environment Variables** | ✅ Per-service env vars in dashboard or CLI; secrets manager |
| **Cold Starts** | Hobby: scales to zero after inactivity; Pro: always-on |
| **Regions** | US East, US West, EU West, Asia Pacific (Tokyo, Singapore) |
| **Logging** | ✅ Real-time log tail in dashboard + 7-day retention |
| **Database Backups** | ✅ Daily automated backups on Pro |
| **Pricing Model** | Usage-based ($0.000463/vCPU-min, $0.000231/GB RAM-min) + Pro plan baseline |

**Pricing Estimate for Triplanner:**

| Plan | Monthly Est. | Notes |
|------|-------------|-------|
| Hobby ($5/mo credit) | ~$15–20/mo | Backend service + PostgreSQL at low traffic; may exceed credit |
| Pro ($20/mo seat) | ~$25–35/mo | Always-on backend + managed PostgreSQL + frontend static service |

**Pros:**
- Fastest setup of all providers (GitHub connect → deploy in < 5 min)
- Transparent usage-based pricing
- Auto-provisions PostgreSQL with connection string injected as env var
- `railway run knex migrate:latest` works out of the box for migrations
- Excellent CLI (`railway` CLI for local parity)
- Native monorepo support (backend + frontend as separate services in one project)

**Cons:**
- Usage-based billing can be unpredictable under traffic spikes
- Hobby plan sleeps services after inactivity (cold start ~3–5s)
- Less mature than Heroku/DigitalOcean; smaller ecosystem
- Pro plan required for always-on production workloads

**Setup Effort:** ⭐ 1 / 5
**Migration Path:** Connect GitHub repo → set `BACKEND_URL`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` → Railway provisions PostgreSQL → run `railway run cd backend && npx knex migrate:latest` → frontend deployed as static site.

---

### 2. Render

| Attribute | Details |
|-----------|---------|
| **URL** | render.com |
| **Node.js Support** | ✅ Auto-detected or Dockerfile |
| **PostgreSQL** | ✅ Managed PostgreSQL (separate service) |
| **HTTPS** | ✅ Automatic SSL + custom domains |
| **Docker Support** | ✅ Dockerfile supported |
| **pm2 in production** | ❌ Not needed |
| **Zero-Downtime Deploys** | ✅ On paid plans (rolling deploy) |
| **CI/CD** | ✅ GitHub/GitLab auto-deploy on push |
| **Environment Variables** | ✅ Per-service; group env vars; secret files |
| **Cold Starts** | Free: ~30s after 15 min idle; Starter ($7/mo): always-on |
| **Regions** | US, Frankfurt, Singapore, Ohio |
| **Logging** | ✅ Log stream + 7-day retention |
| **Database Backups** | ✅ Daily automated (paid plans) |
| **Pricing Model** | Fixed monthly per service tier |

**Pricing Estimate for Triplanner:**

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Backend (Web Service) | Starter | $7/mo |
| PostgreSQL | Starter (1 GB) | $7/mo |
| Frontend (Static Site) | Free | $0/mo |
| **Total** | | **~$14/mo** |

**Pros:**
- Cheapest option for always-on services (~$14/mo all-in)
- Free static site hosting for the React SPA
- Predictable flat-rate pricing (no usage spikes)
- Well-documented, large community, good DX
- `render.yaml` infrastructure-as-code file for reproducible setups
- PostgreSQL auto-injects `DATABASE_URL` env var

**Cons:**
- Free tier has 30-second cold starts (unacceptable for production)
- Starter PostgreSQL (1 GB storage) may be tight as data grows
- Slower build times than Railway on some projects
- UI is slightly less polished than Railway

**Setup Effort:** ⭐ 1 / 5
**Migration Path:** Connect GitHub → configure `render.yaml` → set env vars (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL` auto-set) → deploy → run migrations via Render shell or one-time deploy command.

---

### 3. Fly.io

| Attribute | Details |
|-----------|---------|
| **URL** | fly.io |
| **Node.js Support** | ✅ Via Dockerfile (existing `infra/Dockerfile.backend` works) |
| **PostgreSQL** | ✅ Fly Postgres (self-managed on Fly machines) |
| **HTTPS** | ✅ Automatic Anycast TLS |
| **Docker Support** | ✅ First-class — Dockerfile required |
| **pm2 in production** | ⚠️ Can run inside container but not idiomatic |
| **Zero-Downtime Deploys** | ✅ Blue-green deploys |
| **CI/CD** | ✅ GitHub Actions + `flyctl` CLI |
| **Environment Variables** | ✅ Fly secrets (`flyctl secrets set KEY=value`) |
| **Cold Starts** | Configurable `min_machines_running = 1` to avoid cold starts |
| **Regions** | 35+ global regions |
| **Logging** | ✅ `flyctl logs` + Fly Metrics |
| **Database Backups** | ✅ Fly Volumes snapshots (manual setup required) |
| **Pricing Model** | Per-machine (shared or dedicated), per GB storage |

**Pricing Estimate for Triplanner:**

| Service | Config | Monthly Cost |
|---------|--------|-------------|
| Backend | 1 shared-cpu-1x, 256 MB RAM | ~$3–5/mo |
| PostgreSQL | 1 shared-cpu-1x, 256 MB RAM, 10 GB volume | ~$5–8/mo |
| Frontend | Fly static (or external CDN) | ~$0–3/mo |
| **Total** | | **~$8–16/mo** |

**Pros:**
- Most control — full VM access, custom hardware sizing
- Cheapest raw compute (especially for low-traffic apps)
- Existing `Dockerfile.backend` can be used directly
- Global Anycast network (best for international users)
- `fly.toml` configuration file is clean and version-controllable
- Active community, frequent updates

**Cons:**
- Steepest learning curve of all options — requires `flyctl` CLI, `fly.toml`, understanding of Fly machines
- Fly Postgres requires manual backup configuration (not fully managed)
- Migration scripts require `fly ssh console` or one-off tasks
- Frontend static hosting on Fly requires separate configuration
- Relatively newer, less enterprise tooling than Railway/Render

**Setup Effort:** ⭐⭐⭐ 3 / 5
**Migration Path:** Install `flyctl` → `fly launch` (reads `Dockerfile.backend`) → `fly secrets set JWT_SECRET=... DATABASE_URL=...` → configure Fly Postgres → run migrations via `fly ssh console -C "cd /app && npx knex migrate:latest"` → set up GitHub Actions deploy action.

---

### 4. DigitalOcean App Platform

| Attribute | Details |
|-----------|---------|
| **URL** | digitalocean.com/products/app-platform |
| **Node.js Support** | ✅ Auto-detected or Dockerfile |
| **PostgreSQL** | ✅ Managed Database Cluster (separate product) |
| **HTTPS** | ✅ Automatic SSL + custom domains |
| **Docker Support** | ✅ Dockerfile supported |
| **pm2 in production** | ❌ Not needed |
| **Zero-Downtime Deploys** | ✅ Rolling deploys |
| **CI/CD** | ✅ GitHub/GitLab auto-deploy; App Platform handles builds |
| **Environment Variables** | ✅ App-level + component-level env vars |
| **Cold Starts** | Basic ($12/mo): always-on (no sleep) |
| **Regions** | NYC, SFO, AMS, SGP, LON, FRA, BLR, SYD, TOR |
| **Logging** | ✅ App-level logs + DigitalOcean monitoring |
| **Database Backups** | ✅ Daily automated backups on managed cluster |
| **Pricing Model** | Fixed monthly per component tier |

**Pricing Estimate for Triplanner:**

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Backend (App Component) | Basic ($12/mo) | $12/mo |
| PostgreSQL | Dev Database Cluster | $15/mo |
| Frontend (Static Site) | Free | $0/mo |
| **Total** | | **~$27/mo** |

**Pros:**
- Well-established, trusted brand (DigitalOcean has been around since 2011)
- Excellent documentation and tutorials
- Integrated monitoring, alerts, and dashboards
- Strong enterprise-tier options if the project scales
- Managed PostgreSQL with excellent reliability guarantees
- GitHub integration is mature

**Cons:**
- Most expensive of the simple options (~$27/mo)
- Dev PostgreSQL cluster ($15/mo) has limited performance (shared resources)
- App Platform less feature-rich than Fly.io for advanced config
- Connection pooling requires pgBouncer setup (extra config)

**Setup Effort:** ⭐⭐ 2 / 5
**Migration Path:** App Platform → Connect GitHub → configure `app.yaml` → set env vars → Database Cluster auto-injects `DATABASE_URL` → run migrations via App Platform Run Command.

---

### 5. Heroku (Optional)

| Attribute | Details |
|-----------|---------|
| **URL** | heroku.com |
| **Node.js Support** | ✅ Official Node.js buildpack (mature, well-documented) |
| **PostgreSQL** | ✅ Heroku Postgres add-on |
| **HTTPS** | ✅ Automatic (custom domain SSL via ACM) |
| **Docker Support** | ✅ Container Registry |
| **pm2 in production** | ❌ Not needed (`Procfile` manages process) |
| **Zero-Downtime Deploys** | ✅ Preboot on Standard+ plans |
| **CI/CD** | ✅ GitHub auto-deploy + Heroku CI |
| **Environment Variables** | ✅ Config Vars (dashboard + CLI) |
| **Cold Starts** | Eco ($5/mo): sleeps after 30 min; Basic ($7/mo): always-on |
| **Pricing Model** | Fixed monthly per dyno |

**Pricing Estimate for Triplanner:**

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Backend (Web Dyno) | Basic ($7/mo) | $7/mo |
| PostgreSQL | Mini ($5/mo) | $5/mo |
| Frontend (Static) | Heroku or external CDN | $0–5/mo |
| **Total** | | **~$12–17/mo** |

**Pros:**
- Longest-running PaaS — excellent documentation and community
- `Procfile`-based deployment is battle-tested
- Heroku Postgres is extremely reliable
- Very mature GitHub integration and CI pipeline

**Cons:**
- Reputation declined post-Salesforce acquisition (2022 removal of free tier)
- Fewer regions than competitors
- Mini PostgreSQL plan limited to 10,000 rows — too small for production
- Less innovation in feature roadmap compared to Railway/Render/Fly.io
- Basic plan ($7/mo dyno) required for always-on — comparable to Render at higher complexity

**Setup Effort:** ⭐⭐ 2 / 5

---

### 6. AWS Elastic Beanstalk (Optional)

| Attribute | Details |
|-----------|---------|
| **URL** | aws.amazon.com/elasticbeanstalk |
| **Node.js Support** | ✅ Managed Node.js platform |
| **PostgreSQL** | ✅ RDS PostgreSQL (separate service) |
| **HTTPS** | ✅ Via Application Load Balancer |
| **Docker Support** | ✅ Single and multi-container Docker |
| **pm2 in production** | ✅ Can use, but EB manages processes |
| **Zero-Downtime Deploys** | ✅ Rolling with health checks, blue-green |
| **CI/CD** | ✅ AWS CodePipeline, GitHub Actions |
| **Environment Variables** | ✅ EB environment properties |
| **Cold Starts** | None (EC2 always-on, but minimum 1 instance) |
| **Pricing Model** | EC2 + RDS + ALB (no EB surcharge) |

**Pricing Estimate for Triplanner:**

| Service | Config | Monthly Cost |
|---------|--------|-------------|
| EC2 (t3.micro) | 1 instance, 2 vCPU/1GB | ~$10/mo |
| RDS PostgreSQL (db.t3.micro) | Multi-AZ disabled | ~$20/mo |
| Application Load Balancer | Low traffic | ~$18/mo |
| **Total** | | **~$48–60/mo** |

**Pros:**
- Full AWS ecosystem (CloudWatch, S3, IAM, Route 53)
- No vendor lock-in (standard EC2 + RDS)
- Best choice if the project anticipates significant scale
- 12-month free tier available (t3.micro EC2 + RDS micro)

**Cons:**
- Most expensive at ~$48–60/mo (higher than all alternatives)
- Highest setup complexity — IAM policies, VPC, security groups, ALB rules
- Significant operational overhead for a small project
- RDS t3.micro is underpowered for production loads
- Better alternatives exist at this project's scale

**Setup Effort:** ⭐⭐⭐⭐ 4 / 5

---

## Full Comparison Table

| Provider | Node.js | PostgreSQL | HTTPS | Docker | Zero-Downtime | GitHub CI/CD | Cold Starts | Est. Monthly | Setup Effort |
|----------|---------|-----------|-------|--------|--------------|-------------|-------------|-------------|-------------|
| **Railway** | ✅ | ✅ Native | ✅ Auto | ✅ | ✅ | ✅ | Pro: None; Hobby: Yes | $25–35/mo | ⭐ 1/5 |
| **Render** | ✅ | ✅ Managed | ✅ Auto | ✅ | ✅ (paid) | ✅ | Starter+: None; Free: Yes | $14/mo | ⭐ 1/5 |
| **Fly.io** | ✅ | ✅ Fly PG | ✅ Auto | ✅ First-class | ✅ Blue-green | ✅ Actions | Configurable | $8–16/mo | ⭐⭐⭐ 3/5 |
| **DO App Platform** | ✅ | ✅ Managed | ✅ Auto | ✅ | ✅ | ✅ | None (Basic) | $27/mo | ⭐⭐ 2/5 |
| **Heroku** | ✅ | ✅ Add-on | ✅ Auto | ✅ | ✅ (Standard+) | ✅ | Basic: None; Eco: Yes | $12–17/mo | ⭐⭐ 2/5 |
| **AWS EB** | ✅ | ✅ RDS | ✅ via ALB | ✅ | ✅ CodePipeline | ✅ | None | $48–60/mo | ⭐⭐⭐⭐ 4/5 |

---

## Recommendation

### 🥇 Top Pick: Railway

**Why Railway wins for Triplanner:**

1. **Fastest time to live** — GitHub repo connects in minutes; Railway auto-detects Node.js and builds without a Dockerfile. No `fly.toml`, no `render.yaml` required (though `railway.json` is supported for IaC).

2. **Managed PostgreSQL out of the box** — One-click PostgreSQL plugin auto-injects `DATABASE_URL`. No separate setup step. `railway run knex migrate:latest` runs migrations cleanly from local machine against production DB.

3. **Monorepo support** — Frontend and backend can both live in the same GitHub repo as separate Railway services within one project. Static frontend deploy is supported natively.

4. **Migration path from staging is trivial:**
   - `npm install -g @railway/cli`
   - `railway login && railway init`
   - Set env vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=https://your-frontend.up.railway.app`
   - `DATABASE_URL` auto-injected by Railway Postgres plugin
   - Push to `main` or connect GitHub → Railway auto-deploys on every push
   - Run `railway run cd backend && npx knex migrate:latest` once
   - Frontend: add static service pointed at `frontend/` → Railway builds `npm run build` and serves dist/

5. **Price is competitive** — Pro plan at ~$25–35/month is reasonable for always-on backend + managed PostgreSQL. No surprise bills from cold starts in production.

**Monthly Cost Estimate (Railway Pro):**
| Component | Cost |
|-----------|------|
| Pro plan seat | $20/mo |
| Backend service (low traffic) | ~$5–8/mo (usage) |
| PostgreSQL plugin (low data) | ~$3–5/mo (usage) |
| Frontend static service | ~$0–1/mo |
| **Total** | **~$28–34/mo** |

**Setup Effort:** 1/5 — Easiest of all providers.

---

### 🥈 Runner-Up: Render

**Why Render is a strong alternative:**

1. **Lower predictable cost** — $14/month flat (Starter Web Service $7 + Starter PostgreSQL $7) — no usage-based surprises. Frontend static hosting is free.

2. **`render.yaml` for IaC** — Infrastructure-as-code file can be checked into the repo and defines all services declaratively. Useful if the project grows.

3. **Mature platform** — Render has been around since 2019 and has a reputation for stability and excellent documentation.

4. **When to choose Render over Railway:**
   - If Railway pricing grows unpredictably under traffic spikes
   - If flat-rate billing is required for budget planning
   - If the project owner prefers a more established provider

**Monthly Cost Estimate (Render Starter):**
| Component | Cost |
|-----------|------|
| Web Service (Starter) | $7/mo |
| PostgreSQL (Starter, 1 GB) | $7/mo |
| Static Site (Frontend) | $0/mo |
| **Total** | **$14/mo** |

**Setup Effort:** 1/5 — On par with Railway.

---

## Migration Path from Local Staging (Railway — Top Pick)

### Pre-requisites
- Railway account (railway.app)
- Railway CLI: `npm install -g @railway/cli`
- GitHub repo already connected (triplanner)

### Step-by-Step

```bash
# 1. Login and initialize project
railway login
railway init   # Creates new Railway project, link to GitHub repo

# 2. Add PostgreSQL plugin
# In Railway dashboard: Add Plugin → PostgreSQL
# Railway auto-sets DATABASE_URL in all services

# 3. Configure backend service
# In Railway dashboard: Add Service → GitHub Repo → select /backend directory
# Build command: npm ci
# Start command: node server.js (or npm start)
# Port: 3001 (Railway auto-detects PORT env var)

# 4. Set backend environment variables
railway variables set JWT_SECRET="<generate with: openssl rand -base64 64>"
railway variables set JWT_REFRESH_SECRET="<generate with: openssl rand -base64 64>"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="https://<frontend-service>.up.railway.app"
# DATABASE_URL is auto-set by Railway PostgreSQL plugin

# 5. Run database migrations
railway run --service backend bash -c "cd backend && npx knex migrate:latest"

# 6. Configure frontend service
# In Railway dashboard: Add Service → GitHub Repo → select /frontend directory
# Build command: npm ci && npm run build
# Start command: (static — no start command needed; or use serve: npx serve dist)
# Set VITE_API_URL=https://<backend-service>.up.railway.app

# 7. Configure GitHub auto-deploy
# In Railway dashboard: each service → Settings → Source → enable Auto-Deploy on push to main

# 8. Set custom domains (optional)
# Settings → Domains → Add custom domain → update DNS CNAME records
```

### Environment Variables Required

| Variable | Backend | Frontend | Notes |
|----------|---------|---------|-------|
| `DATABASE_URL` | ✅ (auto) | ❌ | Railway auto-injects from PostgreSQL plugin |
| `JWT_SECRET` | ✅ | ❌ | Generate: `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | ✅ | ❌ | Generate separately from JWT_SECRET |
| `NODE_ENV` | ✅ (`production`) | ❌ | |
| `PORT` | ✅ (auto) | ❌ | Railway sets this automatically |
| `CORS_ORIGIN` | ✅ | ❌ | Frontend Railway URL or custom domain |
| `VITE_API_URL` | ❌ | ✅ | Backend Railway URL or custom domain |

### Post-Deploy Verification Checklist
- [ ] `GET https://<backend>.up.railway.app/api/v1/health` → `{"status":"ok"}`
- [ ] `GET https://<frontend>.up.railway.app/` → serves React SPA
- [ ] Login/register flow end-to-end
- [ ] Trips CRUD (create, edit, delete trip)
- [ ] All 10 migrations confirmed applied (`knex migrate:status`)
- [ ] HTTPS active on both services (Railway handles this automatically)

---

## Decision Requested

**Action required from project owner:**

Please select a hosting provider:

1. ✅ **Railway (Recommended)** — ~$25–35/mo, easiest setup, managed PostgreSQL, GitHub auto-deploy
2. ✅ **Render (Runner-Up)** — ~$14/mo flat, predictable pricing, free static frontend
3. 🔵 **Fly.io** — ~$8–16/mo, Docker-first, most control, higher setup complexity
4. 🔵 **DigitalOcean App Platform** — ~$27/mo, established brand, slightly higher price
5. 🔵 **Heroku** — ~$12–17/mo, mature platform, smaller PostgreSQL limits
6. 🔵 **AWS Elastic Beanstalk** — ~$48–60/mo, best for future scale, highest complexity

Once a provider is selected, the Deploy Engineer will:
1. Create the production environment and configure env vars
2. Run all 10 migrations on production PostgreSQL
3. Deploy backend and frontend
4. Trigger Monitor Agent health check
5. Log the production deployment in `qa-build-log.md`

---

*Research spike complete. Report published 2026-03-04. Handoff logged to Manager Agent in `handoff-log.md`.*

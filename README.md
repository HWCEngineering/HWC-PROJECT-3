# HWC Photo Log

A geo-tagged photo management platform for construction project documentation, built for HWC Engineering field teams.

## Overview

Construction projects generate thousands of site photos over months or years, but without location context and organization they're difficult to search, reference, or share. HWC Photo Log solves this by extracting GPS coordinates from photo EXIF data at upload time and plotting them on an interactive map, giving engineers and inspectors a spatial view of project progress.

**Inputs:** Site photos (JPEG, PNG, HEIC) uploaded via the web interface — GPS coordinates, timestamps, and orientation are extracted automatically from EXIF metadata. Users can add descriptions and tags for filtering.

**Outputs:** An interactive map with clustered photo markers, a filterable photo browser synced to the map viewport, and export capabilities (ZIP archives, KML/KMZ for Google Earth).

**Pipeline:**
```
Photo upload → EXIF extraction (GPS, timestamp) → HEIC→JPEG conversion →
Thumbnail generation → Store image in Azure Blob → Store metadata in Cosmos DB →
Serve via API → Render on interactive Leaflet map
```

**Tech stack:**
- Frontend: Astro, React 19, Leaflet (map), react-zoom-pan-pinch (lightbox)
- Backend: Python FastAPI, uvicorn
- Storage: Azure Blob Storage (images), Azure Cosmos DB/MongoDB API (metadata)
- Hosting: Azure Static Web Apps (frontend), Azure Container Apps (API)
- CI/CD: GitHub Actions, GitHub Container Registry
- Routing: Azure Front Door (multi-project path-based routing)

The platform supports multiple project deployments from a single codebase using GitHub Environments — each project gets its own database, storage container, API instance, and frontend with a custom title and URL path.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│  (monorepo: apps/web, apps/api, apps/mobile, packages/*)        │
└──────────┬──────────────────────────────────┬───────────────────┘
           │ push to main                     │ push to main
           ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────────────┐
│  GHCR (Container    │          │  Azure Static Web Apps       │
│  Registry)          │          │  (hwc-survey-photo-log)      │
│  ghcr.io/…/hwc-     │          │  - Astro + React frontend    │
│  photo-log-api      │          │  - Built AFTER backend       │
└─────────┬───────────┘          │    deploys (auto API URL)    │
          │                      └──────────────────────────────┘
          ▼                                   │
┌─────────────────────────────┐               │ PUBLIC_API_BASE_URL
│  Azure Container Apps       │◄──────────────┘ (discovered dynamically)
│  (hwc-photo-log-api)        │
│  - FastAPI + uvicorn        │
│  - Environment: LiDAR-CONTAINER │
│  - Region: eastus2          │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐   ┌──────────────────────────┐
│  Azure Cosmos DB            │   │  Azure Blob Storage       │
│  (MongoDB API)              │   │  (photo images +          │
│  - Photo metadata           │   │   thumbnails)             │
│  - Tags, GPS, timestamps    │   │  - Private container      │
└─────────────────────────────┘   │  - SAS URL access         │
                                  └──────────────────────────┘
```

## Repository Structure

```
hwc-photo-log/
├── apps/
│   ├── api/          # Python FastAPI backend (containerized)
│   ├── web/          # Astro + React frontend (static site)
│   └── mobile/       # React Native / Expo mobile app
├── packages/         # Shared React component libraries
│   ├── assets/       # Static assets (logos, icons)
│   ├── header/       # Header component
│   ├── map/          # Leaflet map component
│   ├── panel/        # Side panel layout
│   ├── photo-panel/  # Photo browser with zoom/pan
│   └── ui/           # Shared UI primitives
├── .github/workflows/
│   ├── dev.yml       # CI for dev branch (lint, build, test)
│   └── production.yml # Deploy backend + frontend to Azure
└── package.json      # Root workspace config (npm workspaces)
```

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Astro 5.x, React 19, Leaflet, react-leaflet |
| Backend    | Python 3.12, FastAPI, uvicorn           |
| Database   | Azure Cosmos DB (MongoDB API)           |
| Storage    | Azure Blob Storage (private, SAS URLs)  |
| Mobile     | Expo 54, React Native 0.81             |
| Hosting    | Azure Static Web Apps + Azure Container Apps |
| Registry   | GitHub Container Registry (ghcr.io)     |
| CI/CD      | GitHub Actions                          |

## Local Development Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- npm (comes with Node.js)
- Azure CLI (for deployment testing)

### 1. Clone and Install

```bash
git clone https://github.com/HWCEngineering/HWC-PROJECT-3.git
cd HWC-PROJECT-3
npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cp apps/api/env.example apps/api/.env
# Edit apps/api/.env with your credentials

# Frontend
cp apps/web/env.example apps/web/.env
# Edit apps/web/.env with your API URL and MapTiler key
```

### 3. Run Development Servers

```bash
# Both frontend + backend concurrently
npm run dev

# Or separately:
npm run dev:web    # Astro dev server on http://localhost:4321
npm run dev:api    # FastAPI on http://localhost:8000

# Mobile (requires Expo Go app on device)
npm run dev:mobile
```

### 4. Backend-Only Setup (if not using npm workspace)

```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs (Swagger UI).

## Environment Variables / Secrets

### GitHub Secrets (required for CI/CD)

Org-level secrets (shared across all environments):

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Azure service principal JSON for CLI login |
| `AZURE_RESOURCE_GROUP` | Azure resource group name |
| `AZURE_CONNECTION_STRING` | Azure Blob Storage connection string |
| `MONGO_CONNECTION_STRING` | Cosmos DB (MongoDB API) connection string |
| `GHCR_READ_TOKEN` | PAT with `read:packages` scope for Container Apps to pull from GHCR |

Environment-level secrets (per project):

| Secret | Description |
|--------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token for the project's Static Web App |

### GitHub Variables (per environment)

| Variable | Description |
|----------|-------------|
| `NAME` | Collection/container name and container app prefix |
| `PUBLIC_BASE_PATH` | Front Door route path for this project |
| `PUBLIC_SITE_TITLE` | (Optional) Custom title for header and page |

### Backend Environment (apps/api/.env)

| Variable | Description |
|----------|-------------|
| `MONGO_CONNECTION_STRING` | Cosmos DB connection string |
| `MONGO_COLLECTION_NAME` | MongoDB database name |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob Storage connection string |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name |

### Frontend Environment (apps/web/.env)

| Variable | Description |
|----------|-------------|
| `PUBLIC_API_BASE_URL` | Backend API URL (e.g., `http://localhost:8000` for dev) |
| `PUBLIC_MAPTILER_API_KEY` | MapTiler API key (optional — custom map package provides default tiles) |

### Mobile Environment (apps/mobile/.env)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL (use LAN IP for physical devices) |
| `EXPO_PUBLIC_MAPTILER_KEY` | MapTiler API key (optional) |

## Build & Run Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run dev` | Start web + API concurrently |
| `npm run dev:web` | Astro dev server only |
| `npm run dev:api` | FastAPI dev server only |
| `npm run dev:mobile` | Expo dev server |
| `npm run build` | Production build (frontend) |
| `npm run preview` | Preview production build locally |
| `npm run assets:sync` | Sync shared assets across packages |

## CI/CD Overview

### Branching Strategy

```
feature/* ──► dev ──► main
                │         │
                │         └── Triggers production deployment
                └── Triggers CI checks (lint, build, test)
```

- `feature/*` branches: individual work
- `dev`: integration branch, CI validation
- `main`: production deployments only

### Workflow: dev.yml (CI)

Triggers on push to `dev` or PRs targeting `dev`.

Runs:
1. Install dependencies
2. Lint (if configured)
3. Build frontend
4. Run tests (if configured)

Does NOT deploy anything.

### Workflow: production.yml (Deploy)

Triggers on push to `main`.

Jobs:
1. `deploy-api`: Build Docker image → push to GHCR → deploy/update Azure Container App → capture API URL
2. `deploy-frontend`: Uses discovered API URL → build Astro frontend → deploy to Azure Static Web Apps

The API URL is passed automatically between jobs, eliminating the need for manual `PUBLIC_API_BASE_URL` updates.

## Infrastructure Setup (From Scratch)

### Required Azure Resources

1. **Resource Group** — logical container for all resources
2. **Azure Cosmos DB** (MongoDB API) — photo metadata storage
3. **Azure Blob Storage Account** — photo file storage (create a private container)
4. **Azure Container App Environment** — hosting environment for the API
5. **Azure Container App** — the API itself (created automatically by the workflow)
6. **Azure Static Web App** — frontend hosting (name: `hwc-survey-photo-log`)

### Azure CLI Setup

```bash
# Login
az login

# Create resource group
az group create --name <RESOURCE_GROUP> --location eastus2

# Create Cosmos DB (MongoDB API)
az cosmosdb create --name <COSMOS_ACCOUNT> --resource-group <RESOURCE_GROUP> --kind MongoDB
az cosmosdb mongodb database create --account-name <COSMOS_ACCOUNT> --resource-group <RESOURCE_GROUP> --name hwc-photo-log

# Create Storage Account
az storage account create --name <STORAGE_ACCOUNT> --resource-group <RESOURCE_GROUP> --location eastus2 --sku Standard_LRS
az storage container create --name hwc-photo-log --account-name <STORAGE_ACCOUNT> --public-access off

# Create Container App Environment (you already have "LiDAR-CONTAINER")
az containerapp env create --name LiDAR-CONTAINER --resource-group <RESOURCE_GROUP> --location eastus2

# Create Static Web App
az staticwebapp create --name hwc-survey-photo-log --resource-group <RESOURCE_GROUP> --location eastus2
```

### GitHub Container Registry (GHCR) Setup

1. The production workflow uses `GITHUB_TOKEN` to push images (automatic with `packages: write` permission).
2. Create a Personal Access Token (PAT) with `read:packages` scope for Azure Container Apps to pull images.
3. Store the PAT as `GHCR_READ_TOKEN` in GitHub Secrets.

### Azure Service Principal

```bash
az ad sp create-for-rbac --name "hwc-photo-log-deploy" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP> \
  --sdk-auth
```

Store the JSON output as `AZURE_CREDENTIALS` in GitHub Secrets.

### Static Web App Deployment Token

```bash
az staticwebapp secrets list --name hwc-survey-photo-log --resource-group <RESOURCE_GROUP>
```

Store the `apiKey` value as `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub Secrets.

## Deployment Targets

| Component | Target | URL Pattern |
|-----------|--------|-------------|
| Frontend | Azure Static Web Apps | `*.azurestaticapps.net` |
| Backend API | Azure Container Apps | `*.eastus2.azurecontainerapps.io` |
| Container Images | ghcr.io | `ghcr.io/<org>/hwc-photo-log-api` |

## Environment Separation

This repo deploys multiple project instances from a single codebase using GitHub Environments.

| Environment | `photo-log` | `crawfordsville-market` |
|-------------|-------------|------------------------|
| Branch | `main` | `main` |
| Base Path | `/photo-log` | `/2500-555-A` |
| Site Title | Photo Log (default) | Crawfordsville Market Street RR Grade Separation |
| Container App | `hwc-photo-log-api` | `photo-log-crawfordsville-mkt-st-api` |
| SWA | `hwc-survey-photo-log` | (Crawfordsville SWA) |
| Data (NAME) | `hwc-photo-log` | `photo-log-crawfordsville-mkt-st` |

### Adding a New Project

1. Create a GitHub Environment with a unique name
2. Add environment secrets: `AZURE_STATIC_WEB_APPS_API_TOKEN`
3. Add environment variables: `NAME`, `PUBLIC_BASE_PATH`, `PUBLIC_SITE_TITLE`
4. Create the Azure resources (SWA, blob container, Cosmos collection)
5. Add a new deploy job pair in `production.yml` (copy an existing one, change the environment name)
6. Add a Front Door route for the new base path

### Environment Variables (per environment)

| Variable | Description | Required |
|----------|-------------|----------|
| `NAME` | Collection/container name — also used as container app prefix (`{NAME}-api`) | Yes |
| `PUBLIC_BASE_PATH` | Front Door route path (e.g., `/photo-log`) | Yes |
| `PUBLIC_SITE_TITLE` | Header and page title | No (defaults to "Photo Log") |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWA deployment token (secret) | Yes |

## How API URL Auto-Discovery Works

The production workflow eliminates manual API URL management:

1. `deploy-api` job deploys the container app
2. After deployment, it queries the FQDN: `az containerapp show --query "properties.configuration.ingress.fqdn"`
3. The URL is exported as a job output: `api_url`
4. `deploy-frontend` job reads `needs.deploy-api.outputs.api_url` and passes it as `PUBLIC_API_BASE_URL` during build
5. The frontend is built with the correct API URL baked in

No manual variable updates or redeployments required.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Frontend shows "Cannot connect to API" | `PUBLIC_API_BASE_URL` not set or wrong | Check env var; for local dev use `http://localhost:8000` |
| Container App not pulling image | GHCR auth failure | Verify `GHCR_READ_TOKEN` has `read:packages` scope |
| Cosmos DB connection timeout | IP not whitelisted or wrong connection string | Check firewall rules; verify `MONGO_CONNECTION_STRING` |
| Blob Storage 403 | SAS token expired or wrong connection string | Verify `AZURE_STORAGE_CONNECTION_STRING` |
| Static Web App deploy fails | Invalid API token | Regenerate token: `az staticwebapp secrets list` |
| Mobile can't reach API | Using `localhost` on physical device | Use machine's LAN IP in `EXPO_PUBLIC_API_BASE_URL` |
| HEIC upload fails | Missing `pillow-heif` dependency | Run `pip install pillow-heif` |
| Build fails in CI | Node version mismatch | Ensure Node 20 in workflow |

## Rollback Guidance

### Frontend
Azure Static Web Apps keeps previous deployments. To rollback:
1. Re-run the last successful workflow, or
2. Revert the commit on `main` and push

### Backend
Container Apps support revision-based rollback:
```bash
# List revisions
az containerapp revision list --name hwc-photo-log-api --resource-group <RG> -o table

# Activate a previous revision
az containerapp revision activate --name hwc-photo-log-api --resource-group <RG> --revision <REVISION_NAME>

# Route traffic to previous revision
az containerapp ingress traffic set --name hwc-photo-log-api --resource-group <RG> --revision-weight <REVISION_NAME>=100
```

## Contributing

### Branching Workflow

1. Create a feature branch from `dev`: `feature/my-feature`
2. Make changes, commit with conventional commits
3. Open a PR targeting `dev`
4. CI runs automatically (lint, build, test)
5. After review and merge to `dev`, create a PR from `dev` → `main` for production release

### Commit Naming Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add photo export to KMZ format
fix: correct GPS coordinate parsing for Android photos
docs: update environment variable table
chore: upgrade FastAPI to 0.115
refactor: extract thumbnail generation to utility
```

### Pull Request Expectations

- PR title follows conventional commit format
- Description explains what and why
- CI passes (lint, build, test)
- No secrets or credentials in code
- Environment variables documented if new ones added

### Formatting / Linting

- Frontend: Standard Astro/React conventions
- Backend: Python (PEP 8)
- No enforced formatter yet — consider adding Prettier (frontend) and Ruff (backend)

### Before Merge

- All CI checks pass
- Manual testing of affected features
- No regressions in existing functionality
- Documentation updated if behavior changes

## Known Issues & Flags

See [ISSUES.md](./ISSUES.md) for a detailed list of flagged items requiring attention during handoff.

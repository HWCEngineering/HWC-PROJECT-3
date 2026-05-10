# Handoff Issues & Flags

Items identified during handoff preparation that require attention.

## 🔴 Critical — Security

| # | Issue | Location | Action Required |
|---|-------|----------|-----------------|
| 1 | **Secrets committed to repository** | `apps/api/.env` | ROTATE ALL CREDENTIALS IMMEDIATELY. Cosmos DB connection string, Azure Storage key, and MapTiler key are exposed in git history. |
| 2 | **Mobile .env with hardcoded secrets** | `apps/mobile/.env` | Contains production API URL and MapTiler key. Should be in `.env.example` with placeholders only. |
| 3 | **CORS allows all origins** | `apps/api/main.py` | `allow_origins=["*"]` — restrict to known frontend domains in production. |
| 4 | **No authentication/authorization** | API routes | All endpoints are publicly accessible. Consider adding API key or OAuth. |

## 🟠 High — Infrastructure

| # | Issue | Location | Action Required |
|---|-------|----------|-----------------|
| 5 | Docker Hub references (personal account) | `.github/workflows/backend.yml` | Replaced by new `production.yml` using GHCR. Delete old workflow. |
| 6 | Personal Docker Hub image name | `mfalana/photo-log-api` | Migrated to `ghcr.io/<org>/hwc-photo-log-api`. |
| 7 | Hardcoded Container App Environment name | `LiDAR-CONTAINER` | Changed to `HWC-APPS` in new workflow. Create this environment in Azure. |
| 8 | Static Web App name mismatch | `photo-log-map` vs `hwc-survey-photo-log` | New workflow uses `hwc-survey-photo-log` per user specification. |
| 9 | No dev/staging environment | — | Only production exists. Consider adding a staging slot. |

## 🟡 Medium — Code Quality

| # | Issue | Location | Action Required |
|---|-------|----------|-----------------|
| 10 | No linter configured | Root | Add ESLint/Prettier for frontend, Ruff for Python backend. |
| 11 | No test suite running in CI | — | `pytest` is in requirements.txt but no test files exist. Add tests. |
| 12 | `__pycache__` directories in repo | `apps/api/` | Already in `.gitignore` but some may be tracked. Run `git rm -r --cached`. |
| 13 | Debug/token-check steps in workflow | `frontend.yml` | Removed in new workflows. |
| 14 | Hardcoded project name in API title | `apps/api/main.py` | "Crawfordsville Market Street" — make configurable via env var if needed. |
| 15 | `DatabaseManager` instantiated at module level | `apps/api/routes/photos.py` | Creates DB connection on import. Use dependency injection or FastAPI lifespan. |

## 🟢 Low — Maintenance

| # | Issue | Location | Action Required |
|---|-------|----------|-----------------|
| 16 | Missing `.env.example` for mobile | `apps/mobile/` | Create `apps/mobile/env.example` with placeholder values. |
| 17 | Old repo URL in README | Was `MaFalana/HWC-PHOTO-LOG` | Updated to `HWCEngineering/HWC-PROJECT-3`. |
| 18 | No health check endpoint beyond root `/` | `apps/api/main.py` | Root returns JSON — sufficient but consider dedicated `/health`. |
| 19 | SAS URL expiry is 72 hours | `apps/api/storage/az.py` | May be too long or too short depending on use case. |
| 20 | `npm run dev` uses `&` (background process) | `package.json` | Works on Unix but not Windows. Consider `concurrently` package. |
| 21 | No rate limiting on API | `apps/api/` | Add rate limiting for production (e.g., `slowapi`). |
| 22 | Missing `apps/mobile/env.example` | — | Only `.env` exists with real values. |
| 23 | Outdated dependencies possible | All `package.json` | Run `npm audit` and `pip audit` before production. |
| 24 | No `.env` in root `.gitignore` for mobile specifically | `.gitignore` | Pattern `.env` should catch it, but verify. |

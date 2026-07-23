# MicroCart — CI/CD Pipeline Documentation 🚀

This repository uses **GitHub Actions** for automated **Continuous Integration (CI)** and **Continuous Deployment (CD)** across all 7 NestJS microservices and the Next.js frontend.

---

## 🏗️ Pipeline Architecture

```text
  [ Git Push / Pull Request ]
              │
              ▼
  ┌────────────────────────────────────────────────────────┐
  │  STAGE 1: Continuous Integration (Parallel Matrix)    │
  │  ├── 🌐 API Gateway (TypeScript Check & Nest Build)    │
  │  ├── 👤 User Service (TypeScript Check & Nest Build)   │
  │  ├── 📦 Product Service                                │
  │  ├── 🛒 Order Service                                  │
  │  ├── 🛍️ Cart Service                                   │
  │  ├── ❤️ Wishlist Service                               │
  │  ├── 💬 Support Service                                │
  │  └── 🖥️ Next.js Frontend                               │
  └───────────────────────────┬────────────────────────────┘
                              │ (Passed)
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │  STAGE 2: Continuous Deployment (Docker Build & Push)  │
  │  ├── Build Docker Images for all 8 Services            │
  │  ├── Tag images: `:latest` and `:sha-xxxxxxx`          │
  │  └── Push to GitHub Container Registry (ghcr.io)       │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │  STAGE 3: Production Deployment (k8s / Docker Host)    │
  │  └── Pull latest images & rolling restart services     │
  └────────────────────────────────────────────────────────┘
```

---

## 📄 Workflow Configuration File

The pipeline is defined in [`.github/workflows/ci-cd.yml`](file://./.github/workflows/ci-cd.yml).

### Triggers

- **Push**: `main`, `master`, `develop` branches.
- **Pull Requests**: Targeting `main` or `master`.

---

## ⚡ Pipeline Stages Explained

### 1. Stage 1: Continuous Integration (`ci-services` & `ci-frontend`)
- **Parallel Matrix**: Runs 8 parallel jobs for each service simultaneously to minimize build time.
- **Actions Performed**:
  - `actions/checkout@v4`: Clones the commit code.
  - `actions/setup-node@v4`: Configures Node.js 20 with npm caching.
  - `npm ci`: Installs exact lockfile dependencies cleanly.
  - `npx tsc --noEmit`: Strict TypeScript static analysis and type checking.
  - `npm run build`: Compiles NestJS / Next.js code to production JavaScript (`dist/` or `.next/`).

### 2. Stage 2: Continuous Deployment (`docker-build-push`)
- Executes **only on merged pushes** to `main` or `master`.
- **Buildx Caching**: Uses Docker Buildx with GitHub Actions caching (`type=gha`) for ultra-fast incremental image builds.
- **Registry Login**: Automatically logs into GitHub Container Registry (`ghcr.io`) using secret `GITHUB_TOKEN`.
- **Image Naming**:
  - `ghcr.io/<owner>/microcart-api-gateway:latest`
  - `ghcr.io/<owner>/microcart-user-service:latest`
  - `ghcr.io/<owner>/microcart-product-service:latest`
  - `ghcr.io/<owner>/microcart-order-service:latest`
  - `ghcr.io/<owner>/microcart-cart-service:latest`
  - `ghcr.io/<owner>/microcart-wishlist-service:latest`
  - `ghcr.io/<owner>/microcart-support-service:latest`
  - `ghcr.io/<owner>/microcart-frontend:latest`

### 3. Stage 3: Deployment Notification & Summary
- Prints a clean summary log confirming commit SHA, branch, and registry tags.

---

## 🔐 How to Enable Docker Hub (Optional Alternative to GHCR)

If you prefer **Docker Hub** over GitHub Container Registry:

1. Go to your GitHub repository → **Settings → Secrets and variables → Actions**.
2. Add the following secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username.
   - `DOCKERHUB_TOKEN`: Your Docker Hub Access Token.
3. In `.github/workflows/ci-cd.yml`, update the `docker/login-action` block:

```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

---

## 🚀 Connecting to Production (Automated Server Deployment)

To automatically deploy updated containers to a production server after image push, append the following step to Stage 2 in `.github/workflows/ci-cd.yml`:

```yaml
- name: Deploy to Remote Production Host
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.PROD_SERVER_IP }}
    username: ${{ secrets.PROD_SERVER_USER }}
    key: ${{ secrets.PROD_SSH_PRIVATE_KEY }}
    script: |
      cd /opt/ecommerce-microservices
      docker compose pull
      docker compose up -d --remove-orphans
```

---

## 🧪 Local Workflow Testing (`act`)

You can test the GitHub Actions pipeline on your local machine using the open-source CLI `act`:

```bash
# Install act CLI (via winget or brew)
winget install nektos.act

# Run local CI workflow check
act push -W .github/workflows/ci-cd.yml --job ci-services
```

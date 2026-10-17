# Orkod — Multilingual Wellness Platform & Interactive 3D Anatomy Experience

Orkod (development name *Pranic Healing*) is a multilingual wellness platform whose
centerpiece is an interactive, real-time 3D human body used for symptom exploration and
body-area education. The public experience is available in **Arabic (RTL)**, **English**,
**French**, and **Indonesian**, and is backed by a Go + PostgreSQL service that handles
booking, practitioners, content, and administration.

> This repository is a **read-only review snapshot** prepared for external inspection of the
> current implementation. It is a clean snapshot of the working source (not the full original
> git history — see *History note* below).

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Vuetify 3 + Pinia + vue-router + vue-i18n |
| 3D | Three.js (GLTFLoader + Meshopt decoder) rendering a real anatomical mesh |
| Backend | Go 1.25 + Fiber v3 + GORM + PostgreSQL |
| Reverse proxy | Caddy (dev: self-signed TLS; routes `/api/*` → backend, `/` → frontend) |
| Containerisation | Docker Compose (dev & prod) |
| Package manager | Bun (frontend), Go modules (backend) |

### Canonical public routes

| Route | Purpose | Component |
|---|---|---|
| `/` | Language selection gate | `LanguageGate.vue` |
| `/home` | Homepage (canonical) | `HomePage.vue` |
| `/body` | Interactive 3D anatomy experience | `views/public/BodyExplorer3D.vue` |
| `/organs/:region` | Organ / body-region information | organ pages |
| `/symptoms`, `/quiz` | Symptom guidance & quiz | public views |
| `/practitioners`, `/doctors` | Practitioner directory | public views |
| `/booking`, `/book` | Booking & shop | booking views |
| `/admin/*` | Administration area | `views/admin/*` |

`HomePage.vue` is the canonical homepage. `LandingPage.vue` is obsolete and intentionally absent.

---

## Repository layout

```
frontend/                  Vue 3 application
  src/
    components/            shared UI (incl. body/ 3D + anatomy components)
    views/                 public/ and admin/ route views
    data/                  anatomy, quiz, wellness, body-region content
    locales/               en, fr, ar, id translation files
    services/              API clients
    stores/                Pinia stores
    styles/                design tokens + themes
    tests/                 Vitest unit / integration / a11y tests
  public/models/           human body GLB + anatomy assets (+ attribution)
  scripts/                 verification / tooling scripts
  index.html               fonts + app shell
src/phealing/              Go backend (module: PranicServer)
  handlers/ models/ routes/ services/ database/ auth/ ...
docker-compose.dev.yml     dev stack (frontend dev server + Caddy)
docker-compose.yml         prod stack (db + app + Caddy)
Dockerfile.app-dev         backend build (dev)
Dockerfile.app-prod        backend build (prod)
.env.example               sanitized environment template
```

---

## Prerequisites

- **Node.js 20+** and **Bun 1.2+** (frontend)
- **Go 1.25+** (backend)
- **Docker Desktop** (recommended, for the full stack)
- A reachable **PostgreSQL 10+** database for the backend

---

## Getting started

### Option A — Full stack with Docker (recommended)

```bash
# Caddy and the dev compose share an external network
docker network create shared_network

# Copy and fill in environment values
cp .env.example .env

# Start the dev stack (frontend dev server + Caddy)
docker compose -f docker-compose.dev.yml up
```

Then open `https://localhost/` (accept the self-signed dev certificate) or
`http://localhost:5173/` directly.

### Option B — Frontend only

```bash
cd frontend
bun install
bun run dev          # Vite dev server on http://localhost:5173
```

The frontend expects a backend at the URL configured in `frontend/.env` (see
`frontend/.env.example`). Without a backend, public visual routes still render; API-driven
features (booking, practitioners) will not return data.

### Backend

```bash
cd src/phealing
go build ./...       # compile
go vet ./...         # static analysis
# Run with a config file:
#   ./PranicServer -config=./config.json
```

The backend reads `src/phealing/config.json` (DB host/user/password, ports, TLS paths). A
sanitized `config.json` is included with placeholder secrets — replace `CHANGE_ME` for real runs.
Database credentials and the admin password can also come from the environment; see `.env.example`.

> **Note:** `src/phealing/resources/statik/` normally contains a generated `statik.go` that embeds
> built frontend assets (a large generated file). It is **excluded** from this snapshot to avoid
> committing generated/duplicated build output. See `src/phealing/resources/statik/README.md`.

---

## Environment variables

See `.env.example` (backend) and `frontend/.env.example` (frontend). **No real credentials are
included in this repository.** All secrets have been replaced with placeholders.

---

## 3D body model & assets

The body experience loads a real anatomical mesh (not a screenshot):

- `frontend/public/models/orkod/orkod-human-body.8521db4e.glb` — adult male base mesh
  ("Male body base mesh (highpoly)" by Mandrake, **CC BY 4.0**, attribution required;
  see `ORKOD-ASSETS.md`). A smooth, neutral anatomical surface — no exposed muscle, no
  clothing, no external genital geometry. Meshopt-compressed + KHR_mesh_quantization
  (~1.1 MB, 300k triangles, 150k vertices, single closed shell, geometry only, no textures).
  Requires the Three.js **Meshopt decoder** (already wired in `HumanBody3D.vue`).
- `frontend/public/models/anatomy/anatomy.json`, `organs.bin.gz`, `skeleton.bin.gz` — organ and
  skeleton geometry.
- Attribution and licensing: `frontend/public/models/ORKOD-ASSETS.md` and
  `frontend/public/models/anatomy/ATTRIBUTION.md`.

The seven interactive organs are **Brain, Heart, Lungs, Liver, Stomach, Kidneys, Intestines**.

---

## Testing & checks (frontend)

```bash
cd frontend
bun run typecheck    # vue-tsc --noEmit
bun run test         # vitest run
bun run lint         # eslint
bun run build        # vite build
```

Backend:

```bash
cd src/phealing
go build ./... && go vet ./...
```

> Some Vitest suites are integration tests that require the live backend and a real admin
> account; they are expected to fail/skip without it. Test credentials are read from the
> `TEST_ADMIN_PASSWORD` environment variable and are not hardcoded.

---

## Design tokens (intended identity)

```
Black          #020204
Deep purple    #0B0718
Dark violet    #160D2B
Purple         #6D28D9
Bright violet  #8B5CF6
Lavender       #C4B5FD
Gold           #D4AF37
Soft gold      #F1D27A
```

---

## History note

The original private repository's history contained committed environment files and test
fixtures with real credentials, so this review repository is a **clean snapshot** of the current
working source rather than a copy of that history. The original local repository and its history
are preserved unchanged and were not rewritten.

## License & attribution

- Frontend: MIT (`frontend/package.json`).
- 3D / anatomy assets: see the attribution files under `frontend/public/models/`.

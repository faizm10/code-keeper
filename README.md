# Code Keeper

Code Keeper is a full-stack app that helps you store and explore code repos, snippets, and docs in one place.

## What You Get

- Clean web dashboard built with Next.js 16 and React 19
- Lightweight Node.js backend
- Docker support for easy spin-up
- Shared docs site
- TypeScript everywhere

## Folder Map

```
code-keeper/
├── web/          # Next.js app
├── backend/      # API service
├── docs/         # Extra guides
└── docker-compose.yml
```

## Tech Quick Look

- Frontend: Next.js 16, React 19, Tailwind CSS 4
- Backend: Node.js + TypeScript
- Infra: Docker, Docker Compose, Nginx (docs)

## Getting Started

### Requirements

- Node.js 20 or newer
- npm / yarn / pnpm
- Docker + Docker Compose (optional)

### Run the Web App

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Run the Backend

```bash
cd backend
npm install
npm start
```

Backend listens on `http://localhost:3001`.

## Docker Steps

### Start Everything

```bash
docker-compose up --build
```

Services:

- Web → `http://localhost:3000`
- Backend → `http://localhost:3001`
- Docs → `http://localhost:8080` (add `--profile docs`)

### Start Select Services

```bash
docker-compose up web backend
docker-compose --profile docs up
```

### Stop All Services

```bash
docker-compose down
```

More tips live in `docs/docker.md`.

## Docs Folder

Helpful files inside `docs/`:

- `docs/docker.md` → Docker and Compose guide
- `docs/web.md` → Frontend notes
- `docs/README.md` → Docs index

## Useful Scripts (web/)

```bash
npm run dev         # Dev server
npm run build       # Production build
npm run start       # Start production build
npm run lint        # ESLint
npm run test:gemini # Check Gemini AI link
```

### Gemini Test Checklist

1. Set `GEMINI_API_KEY` in `web/.env` or `web/.env.local`.
2. From `web/`, ensure deps are installed.
3. Run `npm run test:gemini`.

The script makes three calls (basic, review, context) and prints sample replies plus response times so you can confirm the AI connection.

## Code Style (short list)

- TypeScript strict mode
- ESLint enforced
- Component-first structure
- See `.cursor/rules` for the full playbook

## Environment Setup

### Web App

Create `web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Get Supabase values from the dashboard under **Settings → API**.

### Backend

`backend/.env`:

```env
NODE_ENV=development
PORT=3001
```

### Docker Root `.env`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=https://code-keeper.vercel.app
```

Or export them before running Compose:

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
docker-compose up --build
```

## Ports at a Glance

| Service | Port | Notes |
|---------|------|-------|
| Web     | 3000 | Next.js app |
| Backend | 3001 | API service |
| Docs    | 8080 | Docs site (optional) |

## Production Builds

### Web Only

```bash
cd web
npm run build
npm start
```

### Docker Stack

```bash
docker-compose build
docker-compose up -d
```

## Contributing

1. Follow `.cursor/rules`.
2. Write clear commit messages.
3. Add tests where it makes sense.
4. Update docs when behavior changes.

## How Code Keeper Watches Repos

Code Keeper keeps an eye on a few big zones in every repo so it can nudge you when docs should change.

### Zones to Watch

- **Code** → `src/**`, `app/**`, `lib/**`
- **Docs** → `README.md`, `CHANGELOG.md`, `docs/**`, any `*.md`
- **Infra / Runtime** → `Dockerfile`, `docker-compose.yml`, `k8s/**`, `helm/**`, `infra/**`, `terraform/**`, `pulumi/**`, `.env.example`, `config/*.yml`
- **DB / Data** → `prisma/schema.prisma`, `migrations/**`, `db/migrations/**`, `sql/**`, `supabase/migrations/**`, `drizzle/**`
- **CI / Automation** → `.github/workflows/**`, `.gitlab-ci.yml`, other CI configs

On the first scan Code Keeper just notes what exists (“code under `src/api`, docs in `docs/`, DB schema in `prisma/schema.prisma`, infra in `docker-compose.yml`, workflows in `.github/workflows`, …”). That baseline lets it describe future PRs in plain language.

### What It Detects Per PR

It looks for simple “events” instead of just “files changed”:

- Code: new endpoint, new exported function/class, new component
- DB: schema updates, new migration files
- Infra: Dockerfile or docker-compose edits (base image, ports, env, services), k8s manifest tweaks
- CI: new workflow, deploy/test/build step edits
- Config: new env vars in `.env.example`, config YAML changes

### Event → Doc Obligation

Each event maps to doc areas:

- `NewEndpointAdded` → API docs / README should mention it
- `DbSchemaChanged` → data model docs, migration notes, changelog
- `DockerfileChanged` or `docker-composeChanged` → setup / infra docs
- `NewEnvVar` → env/setup docs
- `WorkflowChanged` → contributing / release docs

Example output for a PR:

- Events: `NewEndpointAdded`, `DbSchemaChanged`, `NewEnvVar`
- Expected docs: API, DB/schema, setup/env, changelog

Then it checks if any of those doc files changed. If yes it says “✅ docs updated.” If not it posts a helpful reminder.

### When to Warn (v1)

Minimal rules (so we don’t drown):

- Watch for `NewEndpoint`, `NewPublicFunction`, `DbSchemaChanged`, `NewEnvVar`, `DockerInfraChanged`
- Watch docs in `README.md`, `docs/**`, `CHANGELOG.md`
- If an event fires and none of those docs changed → leave a comment
- If docs did change → no warning (or give credit)

This simple setup covers code, DB, infra, and config right away.

---

# Codekeeper Setup Guide

## Prerequisites

- Docker and Docker Compose
- pnpm (v9.0.0 or later)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://ck:ck@postgres:5432/ck

# Redis
REDIS_URL=redis://redis:6379

# Server
SERVER_PORT=8080
NODE_ENV=development

# GitHub App (for webhooks and PR creation)
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_WEBHOOK_SECRET=
```

## Local Development

### Using Docker Compose

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start all services:
   ```bash
   docker-compose up
   ```

   This will start:
   - PostgreSQL on port 5432
   - Redis on port 6379
   - Server on port 8080
   - Worker (background jobs)
   - Web dashboard on port 3000

3. Access the web dashboard at http://localhost:3000

### Running Services Locally (without Docker)

1. Start infrastructure services:
   ```bash
   docker-compose up postgres redis
   ```

2. In separate terminals, run:
   ```bash
   # Terminal 1: Web
   pnpm dev:web

   # Terminal 2: Server
   pnpm dev:server

   # Terminal 3: Worker
   pnpm dev:worker
   ```

   Or use the convenience script:
   ```bash
   pnpm dev
   ```

## Project Structure

```
code-keeper/
├── apps/
│   ├── web/          # Next.js dashboard
│   ├── server/       # Node.js API server
│   └── worker/       # Background job processor
├── packages/
│   └── shared/       # Shared types and utilities
└── docker-compose.yml
```

## Next Steps

1. Set up GitHub App credentials in `.env`
2. Configure database migrations
3. Implement webhook handlers in the server
4. Build analysis and documentation generation in the worker


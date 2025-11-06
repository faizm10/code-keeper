# Worker image is similar to server, but it runs background jobs instead of listening on a port.
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace root files for pnpm workspace support
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages

# Copy worker dependency manifest
COPY apps/worker/package.json ./apps/worker/

# Install dependencies (from root to handle workspaces)
RUN pnpm install --frozen-lockfile

# Ship your worker code (analyzers, docgen, codemods, etc.)
COPY apps/worker/src ./apps/worker/src

WORKDIR /app/apps/worker

# Workers typically don't expose ports.
# EXPOSE (none)

ENV NODE_ENV=development

# Start the worker. If you later add a job queue (e.g., Redis Streams/NATS),
# this process will subscribe and process jobs.
CMD ["node", "src/index.js"]

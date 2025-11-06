# Use a small official Node image. Alpine = tiny, fast to pull.
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Create a dedicated app directory inside the container.
WORKDIR /app

# Copy workspace root files for pnpm workspace support
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages

# Copy server dependency manifest
COPY apps/server/package.json ./apps/server/

# Install dependencies (from root to handle workspaces)
RUN pnpm install --frozen-lockfile

# Now copy the actual application source code.
COPY apps/server/src ./apps/server/src

WORKDIR /app/apps/server

# Document the port your server listens on (helpful for humans and some tooling).
EXPOSE 8080

# Set NODE_ENV to development by default for hot iteration (change to "production" for prod).
ENV NODE_ENV=development

# The command that starts your service inside the container.
# If you switch to TypeScript later, build to `dist/` and change this to `node dist/index.js`.
CMD ["node", "src/index.js"]

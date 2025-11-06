# Next.js needs some compatibility libs on Alpine.
FROM node:20-alpine

# Add libc6-compat for some native modules Next can pull in.
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace root files for pnpm workspace support
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages

# Copy web app dependency manifest
COPY apps/web/package.json ./apps/web/

# Install dependencies (from root to handle workspaces)
RUN pnpm install --frozen-lockfile

# Copy the rest of the Next.js app
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# Next.js dev server listens on 3000 by default.
EXPOSE 3000

ENV NODE_ENV=development

# Run the Next.js dev server. In prod we will use `next build` + `next start`.
CMD ["pnpm", "run", "dev"]

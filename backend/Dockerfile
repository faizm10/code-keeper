# Multi-stage build for backend application
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application (adjust build command based on your setup)
RUN npm run build || echo "No build script found, skipping build step"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application or source files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# If no build step, copy source files
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Adjust start command based on your backend setup
# Try dist/index.js first, then src/index.js, then npm start
CMD sh -c "if [ -f dist/index.js ]; then node dist/index.js; elif [ -f src/index.js ]; then node src/index.js; else npm start; fi"


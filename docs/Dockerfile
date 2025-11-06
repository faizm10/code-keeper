# Multi-stage build for documentation site
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files if they exist
COPY package.json package-lock.json* ./
RUN if [ -f package.json ]; then npm ci; fi

# Build documentation
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build docs (adjust based on your docs framework)
# For static sites, just copy files
# For frameworks like Docusaurus, VitePress, etc., run build command
RUN if [ -f package.json ] && grep -q "\"build\"" package.json; then npm run build; else echo "No build script, using static files"; fi

# Production image with nginx for static files
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built documentation or static files
COPY --from=builder /app/build ./ || \
COPY --from=builder /app/dist ./ || \
COPY --from=builder /app/.vitepress/dist ./ || \
COPY --from=builder /app ./

# Copy nginx configuration if exists
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || \
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


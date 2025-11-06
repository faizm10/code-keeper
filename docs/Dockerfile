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

# Copy built documentation or static files (try different build output directories)
# Use a shell script to handle multiple possible output locations
RUN mkdir -p /tmp/docs
COPY --from=builder /app /tmp/docs/
RUN cd /tmp/docs && \
    if [ -d build ]; then cp -r build/* /usr/share/nginx/html/; \
    elif [ -d dist ]; then cp -r dist/* /usr/share/nginx/html/; \
    elif [ -d .vitepress/dist ]; then cp -r .vitepress/dist/* /usr/share/nginx/html/; \
    else cp -r * /usr/share/nginx/html/ 2>/dev/null || true; fi && \
    rm -rf /tmp/docs

# Create default nginx configuration
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


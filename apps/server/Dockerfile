# Use a small official Node image. Alpine = tiny, fast to pull.
FROM node:20-alpine

# Create a dedicated app directory inside the container.
WORKDIR /app

# Copy only package metadata first to leverage Docker layer caching.
# If package.json doesn't change, `npm ci` won't rerun on rebuilds.
COPY package.json package-lock.json* ./

# Install dependencies in a clean, reproducible way.
# - `npm ci` expects a lockfile; it's faster and more reliable than `npm install`.
RUN npm ci --no-audit --no-fund

# Now copy the actual application source code.
COPY src ./src

# Document the port your server listens on (helpful for humans and some tooling).
EXPOSE 8080

# Set NODE_ENV to development by default for hot iteration (change to "production" for prod).
ENV NODE_ENV=development

# The command that starts your service inside the container.
# If you switch to TypeScript later, build to `dist/` and change this to `node dist/index.js`.
CMD ["node", "src/index.js"]

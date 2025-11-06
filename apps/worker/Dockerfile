# Worker image is similar to server, but it runs background jobs instead of listening on a port.
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first to cache installs.
COPY package.json package-lock.json* ./

RUN npm ci --no-audit --no-fund

# Ship your worker code (analyzers, docgen, codemods, etc.)
COPY src ./src

# Workers typically don't expose ports.
# EXPOSE (none)

ENV NODE_ENV=development

# Start the worker. If you later add a job queue (e.g., Redis Streams/NATS),
# this process will subscribe and process jobs.
CMD ["node", "src/index.js"]

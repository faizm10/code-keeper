# Next.js needs some compatibility libs on Alpine.
FROM node:20-alpine

# Add libc6-compat for some native modules Next can pull in.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency manifests first for better caching.
COPY package.json package-lock.json* ./

RUN npm ci --no-audit --no-fund

# Copy the rest of the Next.js app (pages/app, components, etc.)
COPY . .

# Next.js dev server listens on 3000 by default.
EXPOSE 3000

ENV NODE_ENV=development

# Run the Next.js dev server. In prod we will use `next build` + `next start`.
CMD ["npm", "run", "dev"]

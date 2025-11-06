FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm -v >/dev/null 2>&1 || true
CMD ["node", "src/index.js"]

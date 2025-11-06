# Docker Setup Guide

This project uses Docker and Docker Compose to orchestrate multiple services: web, backend, and docs.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Services

### Web (Next.js)
- **Port**: 3000
- **Dockerfile**: `web/Dockerfile`
- Next.js application with standalone output for optimized Docker builds

### Backend
- **Port**: 3001
- **Dockerfile**: `backend/Dockerfile`
- Node.js backend service (adjust based on your backend framework)

### Docs
- **Port**: 8080
- **Dockerfile**: `docs/Dockerfile`
- Documentation site served with nginx (supports static sites, Docusaurus, VitePress, etc.)

## Quick Start

### Build and start all services

```bash
docker-compose up --build
```

### Start services in detached mode

```bash
docker-compose up -d
```

### Start specific services

```bash
# Start only web and backend
docker-compose up web backend

# Start docs (uses profile)
docker-compose --profile docs up docs
```

### Stop services

```bash
docker-compose down
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f backend
docker-compose logs -f docs
```

### Rebuild a specific service

```bash
docker-compose build web
docker-compose up web
```

## Development

### Running in development mode

For development, you may want to mount volumes for hot reloading:

```bash
# Edit docker-compose.yml to add volume mounts for development
# Then run:
docker-compose up
```

### Environment Variables

Create `.env` files in each service directory or use environment variables in `docker-compose.yml`:

- `web/.env.local` - Web environment variables
- `backend/.env` - Backend environment variables

## Building Individual Services

### Web

```bash
cd web
docker build -t code-keeper-web .
docker run -p 3000:3000 code-keeper-web
```

### Backend

```bash
cd backend
docker build -t code-keeper-backend .
docker run -p 3001:3001 code-keeper-backend
```

### Docs

```bash
cd docs
docker build -t code-keeper-docs .
docker run -p 8080:80 code-keeper-docs
```

## Troubleshooting

### Port conflicts

If ports 3000, 3001, or 8080 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "3002:3000"  # Change host port
```

### Container won't start

1. Check logs: `docker-compose logs <service-name>`
2. Verify Dockerfile syntax
3. Ensure all required files exist (package.json, etc.)
4. Check file permissions

### Rebuild from scratch

```bash
docker-compose down -v  # Remove volumes
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

For production:

1. Set `NODE_ENV=production` in environment variables
2. Use specific image tags instead of `latest`
3. Configure proper secrets management
4. Set up health checks
5. Use reverse proxy (nginx/traefik) in front of services
6. Configure proper logging and monitoring

## Notes

- The web service uses Next.js standalone output for optimized Docker builds
- Backend Dockerfile is flexible and will work with various Node.js setups
- Docs service supports multiple documentation frameworks (static files, Docusaurus, VitePress, etc.)
- All services run as non-root users for security


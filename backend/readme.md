# Backend Infrastructure

This directory contains boilerplate backend services for Code Keeper.

## Services

### Go Backend (`/go`)

A simple HTTP server using Gorilla Mux with health checks and basic API endpoints.

**Port:** 8080

**Features:**
- REST API with Gorilla Mux
- Health check endpoint
- Request logging middleware
- Environment variable support
- Docker support

See [go/README.md](./go/README.md) for more details.

### Python Backend (`/python`)

A FastAPI service with automatic API documentation, CORS support, and request logging.

**Port:** 8000

**Features:**
- FastAPI REST API
- Interactive API documentation (Swagger UI)
- Health check endpoint
- Request logging middleware
- CORS support
- Docker support

See [python/README.md](./python/README.md) for more details.

## Quick Start

### Using Docker Compose

Run both services together:

```bash
docker-compose up
```

This will start:
- Go backend on http://localhost:8080
- Python backend on http://localhost:8000

### Running Services Individually

#### Go Backend

```bash
cd go
go mod download
go run main.go
```

#### Python Backend

```bash
cd python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## API Endpoints

### Go Backend (http://localhost:8080)

- `GET /api/v1/health` - Health check
- `GET /api/v1/ping` - Ping/pong

### Python Backend (http://localhost:8000)

- `GET /` - Root endpoint
- `GET /api/v1/health` - Health check
- `GET /api/v1/ping` - Ping/pong
- `GET /docs` - Interactive API documentation
- `GET /redoc` - Alternative API documentation

## Development

Each service can be developed independently. See the respective README files for:
- Setup instructions
- Development workflows
- API documentation
- Docker usage
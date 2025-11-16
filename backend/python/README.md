# Python Backend Service

A FastAPI boilerplate with health checks, CORS, and request logging.

## Features

- FastAPI REST API
- Health check endpoint
- Request logging middleware
- CORS support
- Environment variable support
- Docker support
- Automatic API documentation (Swagger UI at `/docs`)

## Setup

### Prerequisites

- Python 3.11 or higher
- pip

### Installation

1. Create a virtual environment:
```bash
cd backend/python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file (optional):
```bash
PORT=8000
```

4. Run the server:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/ping` - Simple ping/pong endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Development

### Running with hot reload

```bash
uvicorn main:app --reload
```

The server will automatically reload on code changes.

## Docker

Build and run with Docker:
```bash
docker build -t python-backend .
docker run -p 8000:8000 python-backend
```

## Environment Variables

- `PORT` - Server port (default: 8000)


# Go Backend Service

A simple Go HTTP server boilerplate using Gorilla Mux.

## Features

- HTTP REST API with Gorilla Mux
- Health check endpoint
- Request logging middleware
- Environment variable support
- Docker support

## Setup

### Prerequisites

- Go 1.21 or higher

### Installation

1. Install dependencies:
```bash
cd backend/go
go mod download
```

2. Create a `.env` file (optional):
```bash
PORT=8080
```

3. Run the server:
```bash
go run main.go
```

Or build and run:
```bash
go build -o main main.go
./main
```

## API Endpoints

- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/ping` - Simple ping/pong endpoint

## Development

### Running with hot reload

Install [Air](https://github.com/cosmtrek/air):
```bash
go install github.com/cosmtrek/air@latest
```

Run with:
```bash
air
```

## Docker

Build and run with Docker:
```bash
docker build -t go-backend .
docker run -p 8080:8080 go-backend
```

## Environment Variables

- `PORT` - Server port (default: 8080)


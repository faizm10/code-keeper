"""
FastAPI Backend Service
A simple FastAPI boilerplate with health checks and basic routes.
"""

import os
from datetime import datetime
from typing import Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(
    title="Code Keeper Backend API",
    description="Backend API service for Code Keeper",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Response models
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str


class MessageResponse(BaseModel):
    message: str


# Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    print(f"{request.method} {request.url.path} - {process_time:.3f}s")
    return response


# Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Code Keeper Backend API"}


@app.get("/api/v1/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="python-backend",
    )


@app.get("/api/v1/ping", response_model=MessageResponse)
async def ping():
    """Simple ping/pong endpoint"""
    return MessageResponse(message="pong")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)


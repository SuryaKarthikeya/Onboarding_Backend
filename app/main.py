import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.config import settings
from app.config.database import (
    init_db,
    init_redis,
    close_db,
    close_redis,
    check_connections,
)
from app.api.v1 import api_v1_router

logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting up FastAPI application...")
    init_db()
    init_redis()
    
    # Propagation of connection exception ensures application fails to start up on database failure
    await check_connections()
    logger.info("Successfully connected to databases (MongoDB and Redis).")
    
    yield
    
    # Shutdown actions
    logger.info("Shutting down FastAPI application...")
    await close_db()
    await close_redis()
    logger.info("Database connections closed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register aggregated router
app.include_router(api_v1_router, prefix="/v1")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Realify AI Onboarding API",
        "status": "healthy"
    }


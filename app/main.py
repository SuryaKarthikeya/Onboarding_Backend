import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config.config import settings
from app.config.database import (
    init_db,
    init_redis,
    close_db,
    close_redis,
    check_connections,
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting up FastAPI application...")
    init_db()
    init_redis()
    try:
        await check_connections()
        logger.info("Successfully connected to databases (MongoDB and Redis).")
    except Exception as e:
        logger.error(f"Database connection check failed during startup: {e}")
    
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

@app.get("/")
async def root():
    return {
        "message": "Welcome to Realify AI Onboarding API",
        "status": "healthy"
    }

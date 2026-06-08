import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from redis.asyncio import Redis
from app.config.config import settings

logger = logging.getLogger("app.config.database")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

class RedisDB:
    client: Redis = None

def init_db() -> None:
    """Initialize MongoDB client and database instance."""
    if Database.client is None:
        logger.info("Initializing MongoDB client...")
        Database.client = AsyncIOMotorClient(settings.MONGODB_URI)
        Database.db = Database.client[settings.DATABASE_NAME]

def init_redis() -> None:
    """Initialize Redis client instance."""
    if RedisDB.client is None:
        logger.info("Initializing Redis client...")
        RedisDB.client = Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD or None,
            db=settings.REDIS_DB,
            decode_responses=True,
        )

def get_db() -> AsyncIOMotorDatabase:
    """Get the active MongoDB database instance, initializing it if necessary."""
    if Database.db is None:
        init_db()
    return Database.db

def get_db_client() -> AsyncIOMotorClient:
    """Get the active MongoDB client, initializing it if necessary."""
    if Database.client is None:
        init_db()
    return Database.client

def get_redis() -> Redis:
    """Get the active Redis client, initializing it if necessary."""
    if RedisDB.client is None:
        init_redis()
    return RedisDB.client

async def close_db() -> None:
    """Close MongoDB client and clear references."""
    if Database.client is not None:
        logger.info("Closing MongoDB client...")
        Database.client.close()
        Database.client = None
        Database.db = None

async def close_redis() -> None:
    """Close Redis connection and clear references."""
    if RedisDB.client is not None:
        logger.info("Closing Redis client...")
        await RedisDB.client.close()
        RedisDB.client = None

async def check_connections() -> None:
    """Ping both MongoDB and Redis to check connectivity."""
    if Database.client is None:
        init_db()
    if RedisDB.client is None:
        init_redis()
    
    # Ping MongoDB
    await Database.client.admin.command("ping")
    # Ping Redis
    await RedisDB.client.ping()

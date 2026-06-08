import asyncio
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator

# Set test environment variables before importing app components
os.environ["ENV_FILE"] = ".env.test"
os.environ["DATABASE_NAME"] = "realify_onboarding_test"
os.environ["REDIS_DB"] = "15"

# Mock Redis class for test environment execution
class MockRedis:
    def __init__(self, *args, **kwargs):
        self.store = {}

    async def ping(self):
        return True

    async def get(self, key):
        return self.store.get(str(key))

    async def set(self, key, value, ex=None, px=None):
        self.store[str(key)] = str(value)
        return True

    async def incr(self, key):
        val = int(self.store.get(str(key), 0)) + 1
        self.store[str(key)] = str(val)
        return val

    async def delete(self, key):
        if str(key) in self.store:
            del self.store[str(key)]
            return 1
        return 0

    async def flushdb(self):
        self.store.clear()
        return True

    async def close(self):
        pass

    async def aclose(self):
        pass

import app.config.database
app.config.database.Redis = MockRedis

from app.main import app
from app.config.database import close_db, close_redis, get_db, get_redis


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create a session-scoped event loop."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def async_client() -> AsyncGenerator[any, None]:
    """Provide an HTTPX AsyncClient for FastAPI endpoint testing."""
    from httpx import AsyncClient
    try:
        from httpx import ASGITransport
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    except ImportError:
        # Fallback for older httpx versions
        async with AsyncClient(app=app, base_url="http://test") as ac:
            yield ac

@pytest_asyncio.fixture(autouse=True)
async def clean_database():
    """Function-scoped autouse fixture that resets singletons and clears databases after each test."""
    import app.config.database
    app.config.database.Database.client = None
    app.config.database.Database.db = None
    app.config.database.RedisDB.client = None

    yield
    # Flush MongoDB collections
    db = get_db()
    for name in await db.list_collection_names():
        if not name.startswith("system."):
            await db[name].delete_many({})
    # Flush Redis
    redis = get_redis()
    await redis.flushdb()
    
    # Close client connections at the end of each test to prevent closed event loop errors
    await close_db()
    await close_redis()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def shutdown_db_clients():
    """Session-scoped fixture to properly close client connections after all tests complete."""
    yield
    await close_db()
    await close_redis()


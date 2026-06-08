import asyncio
import os
import pytest
from typing import AsyncGenerator, Generator

# Set test environment variables before importing app components
os.environ["ENV_FILE"] = ".env.test"
os.environ["DATABASE_NAME"] = "realify_onboarding_test"
os.environ["REDIS_DB"] = "15"

from app.main import app
from app.config.database import close_db, close_redis

import pytest_asyncio

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
async def cleanup_db_connections():
    """Ensure database connections are closed after each test to avoid leaks."""
    yield
    await close_db()
    await close_redis()

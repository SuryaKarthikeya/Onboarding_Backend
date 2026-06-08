import pytest
from app.config.database import get_db, get_redis, check_connections

@pytest.mark.asyncio
async def test_db_connections():
    db = get_db()
    redis = get_redis()
    assert db is not None
    assert redis is not None
    await check_connections()

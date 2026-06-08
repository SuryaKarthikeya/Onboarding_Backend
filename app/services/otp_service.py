import random
import logging
from redis.asyncio import Redis
from app.config.database import get_redis
from fastapi import HTTPException, status

logger = logging.getLogger("app.services.otp_service")

OTP_TTL = 300  # 5 minutes
RATE_LIMIT_TTL = 300
MAX_REQUESTS_PER_WINDOW = 3

def generate_otp() -> str:
    """Generate a random 6-digit verification code."""
    return f"{random.randint(100000, 999999)}"

async def check_rate_limit(redis: Redis, identifier: str) -> None:
    """Checks if the request exceeds the OTP request rate limit."""
    limit_key = f"otp_limit:{identifier}"
    current_requests = await redis.get(limit_key)
    
    if current_requests is not None:
        count = int(current_requests)
        if count >= MAX_REQUESTS_PER_WINDOW:
            logger.warning(f"OTP Rate limit reached for identifier {identifier}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many OTP requests. Please wait 5 minutes before trying again."
            )
        await redis.incr(limit_key)
    else:
        await redis.set(limit_key, 1, ex=RATE_LIMIT_TTL)

async def store_otp(identifier: str, code: str) -> None:
    """Store the OTP code in Redis caching."""
    redis = get_redis()
    await check_rate_limit(redis, identifier)
    
    otp_key = f"otp:{identifier}"
    await redis.set(otp_key, code, ex=OTP_TTL)
    logger.info(f"OTP cached for {identifier}")

async def verify_otp_code(identifier: str, code: str) -> bool:
    """Verify the provided code against cached OTP. Deletes the OTP on success."""
    redis = get_redis()
    otp_key = f"otp:{identifier}"
    cached_code = await redis.get(otp_key)
    
    if cached_code and cached_code == code:
        # OTP is valid, delete from Redis to prevent re-use
        await redis.delete(otp_key)
        return True
    return False

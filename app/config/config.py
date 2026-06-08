import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.environ.get("ENV_FILE", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # API Settings
    PROJECT_NAME: str = "Realify AI Onboarding Backend"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "realify_onboarding"

    # Redis Configuration
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # Security (JWT & AES Cryptography)
    JWT_SECRET: str = "super_secret_jwt_signature_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: str = "23j_m6Bv1s-x42QW_Wl0z99HwXfSyyqN4W3-yVl7gIE="

    # SendGrid Configuration
    SENDGRID_API_KEY: str = "SG.your_sendgrid_api_key_here"
    SENDGRID_FROM_EMAIL: str = "noreply@realify.ai"

    # Twilio Configuration (WhatsApp OTPs)
    TWILIO_ACCOUNT_SID: str = "ACyour_twilio_account_sid"
    TWILIO_AUTH_TOKEN: str = "your_twilio_auth_token"
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # E-commerce Integrations
    SHOPIFY_CLIENT_ID: str = "your_shopify_client_id"
    SHOPIFY_CLIENT_SECRET: str = "your_shopify_client_secret"
    SHOPIFY_REDIRECT_URI: str = "http://localhost:8000/v1/marketplace/shopify/callback"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

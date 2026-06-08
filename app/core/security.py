import base64
from datetime import datetime, timedelta, timezone
import jwt
from typing import Dict, Any, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config.config import settings

def get_aesgcm_key() -> bytes:
    """Decodes the ENCRYPTION_KEY or generates a 32-byte key via SHA256 hashing if invalid base64."""
    try:
        return base64.urlsafe_b64decode(settings.ENCRYPTION_KEY)
    except Exception:
        import hashlib
        return hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest()

def encrypt_credentials(data: str) -> str:
    """Encrypt plain text data using AES-256-GCM and return base64 encoded ciphertext with nonce."""
    if not data:
        return ""
    key = get_aesgcm_key()
    aesgcm = AESGCM(key)
    import os
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data.encode("utf-8"), None)
    # Combine nonce and ciphertext, and encode as base64 string
    return base64.b64encode(nonce + ciphertext).decode("utf-8")

def decrypt_credentials(encrypted_data: str) -> str:
    """Decrypt base64 encoded ciphertext using AES-256-GCM."""
    if not encrypted_data:
        return ""
    key = get_aesgcm_key()
    aesgcm = AESGCM(key)
    raw_data = base64.b64decode(encrypted_data.encode("utf-8"))
    nonce = raw_data[:12]
    ciphertext = raw_data[12:]
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_bytes.decode("utf-8")

def create_jwt_token(data: dict, expires_delta: timedelta) -> str:
    """Helper to generate JWT tokens with exp field."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_access_token(user_id: str, onboarding_state: str) -> str:
    """Generates an access token valid for the configured minutes."""
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_jwt_token(
        data={"sub": user_id, "onboarding_state": onboarding_state, "type": "access"},
        expires_delta=expires
    )

def create_refresh_token(user_id: str) -> str:
    """Generates a refresh token valid for the configured days."""
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_jwt_token(
        data={"sub": user_id, "type": "refresh"},
        expires_delta=expires
    )

def verify_token(token: str, expected_type: str = "access") -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != expected_type:
            return None
        return payload
    except jwt.PyJWTError:
        return None

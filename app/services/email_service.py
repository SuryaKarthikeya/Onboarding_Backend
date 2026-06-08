import logging
import httpx
from app.config.config import settings

logger = logging.getLogger("app.services.email_service")

async def send_otp_email(email: str, otp_code: str) -> bool:
    """Sends OTP code via SendGrid mail/send API. Falls back to console log if key is not configured."""
    logger.info(f"Preparing to send OTP email to {email}")
    
    # Check if API key is configured or default placeholder
    is_mock = (
        not settings.SENDGRID_API_KEY or
        "your_sendgrid_api_key_here" in settings.SENDGRID_API_KEY or
        settings.SENDGRID_API_KEY == "SG.your_sendgrid_api_key_here"
    )
    
    if is_mock:
        logger.info(f"\n[MOCK EMAIL SENT] To: {email} | OTP Code: {otp_code}\n")
        return True
        
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "personalizations": [
            {
                "to": [{"email": email}],
                "subject": f"Your Realify AI Verification Code: {otp_code}"
            }
        ],
        "from": {"email": settings.SENDGRID_FROM_EMAIL},
        "content": [
            {
                "type": "text/html",
                "value": f"<p>Welcome to Realify AI!</p><p>Your verification code is: <strong>{otp_code}</strong>. It is valid for 5 minutes.</p>"
            }
        ]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if response.status_code in (200, 201, 202):
                logger.info(f"Successfully sent SendGrid OTP email to {email}")
                return True
            else:
                logger.error(f"Failed to send SendGrid email: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logger.error(f"Error calling SendGrid API: {str(e)}")
        return False

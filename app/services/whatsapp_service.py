import logging
import httpx
from app.config.config import settings

logger = logging.getLogger("app.services.whatsapp_service")

async def send_otp_whatsapp(whatsapp_number: str, otp_code: str) -> bool:
    """Sends OTP code via Twilio WhatsApp API. Falls back to console log if keys are not configured."""
    logger.info(f"Preparing to send OTP WhatsApp message to {whatsapp_number}")
    # Always log the OTP to the console for easy developer/user testing
    print(f"\n[OTP DISPATCH LOG] WhatsApp: {whatsapp_number} | Generated OTP Code: {otp_code}\n")
    logger.info(f"[OTP DISPATCH LOG] WhatsApp: {whatsapp_number} | Generated OTP Code: {otp_code}")
    
    # Check if Twilio is configured
    is_mock = (
        not settings.TWILIO_ACCOUNT_SID or
        not settings.TWILIO_AUTH_TOKEN or
        "your_twilio" in settings.TWILIO_ACCOUNT_SID or
        "your_twilio" in settings.TWILIO_AUTH_TOKEN or
        settings.TWILIO_ACCOUNT_SID == "ACyour_twilio_account_sid"
    )
    
    if is_mock:
        return True
        
    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    
    # Format destination. Twilio WhatsApp numbers must be prefixed with "whatsapp:"
    to_number = whatsapp_number
    if not to_number.startswith("whatsapp:"):
        to_number = f"whatsapp:{to_number}"
        
    # Build Basic Auth header
    # Twilio API uses username=AccountSID, password=AuthToken
    import base64
    auth_str = f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    payload = {
        "To": to_number,
        "From": settings.TWILIO_WHATSAPP_FROM,
        "Body": f"Your Realify AI verification code is: {otp_code}. Valid for 5 minutes."
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, data=payload, timeout=10.0)
            if response.status_code in (200, 201):
                logger.info(f"Successfully sent Twilio WhatsApp OTP to {whatsapp_number}")
                return True
            else:
                logger.error(f"Failed to send Twilio WhatsApp message: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logger.error(f"Error calling Twilio API: {str(e)}")
        return False

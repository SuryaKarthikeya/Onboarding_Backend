import re

def validate_email_format(email: str) -> bool:
    """Returns True if the string looks like a valid email, False otherwise."""
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(email_regex, email))

def validate_whatsapp_number(number: str) -> bool:
    """Validates international format of phone numbers, e.g., +1234567890 or +911234567890."""
    phone_regex = r"^\+[1-9]\d{1,14}$"
    clean_number = number.replace("whatsapp:", "").strip()
    return bool(re.match(phone_regex, clean_number))

def validate_store_url(url: str) -> bool:
    """Checks if store URL is a valid http/https URL structure."""
    url_regex = r"^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$"
    return bool(re.match(url_regex, url))

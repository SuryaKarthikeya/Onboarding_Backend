from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional

class OTPRequest(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Email address to send OTP to")
    whatsapp_number: Optional[str] = Field(None, description="WhatsApp number (including country code) to send OTP to")

    @model_validator(mode="after")
    def validate_either_email_or_whatsapp(self):
        if not self.email and not self.whatsapp_number:
            raise ValueError("Either email or whatsapp_number must be provided")
        if self.email and self.whatsapp_number:
            raise ValueError("Provide only one of email or whatsapp_number, not both")
        return self

class OTPVerify(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Email address verified")
    whatsapp_number: Optional[str] = Field(None, description="WhatsApp number verified")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

    @model_validator(mode="after")
    def validate_either_email_or_whatsapp(self):
        if not self.email and not self.whatsapp_number:
            raise ValueError("Either email or whatsapp_number must be provided")
        if self.email and self.whatsapp_number:
            raise ValueError("Provide only one of email or whatsapp_number, not both")
        return self

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    onboarding_state: str

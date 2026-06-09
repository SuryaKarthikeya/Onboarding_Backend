from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional

class OTPRequest(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Email address to send OTP to")
    whatsapp_number: Optional[str] = Field(None, description="WhatsApp number (including country code) to send OTP to")
    is_signup: Optional[bool] = Field(False, description="Flag indicating if this request is for a new account signup")

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

class UserManualRegister(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    
    @model_validator(mode="after")
    def matching_passwords_check(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self

class UserManualLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    onboarding_state: str

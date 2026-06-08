from pydantic import BaseModel, Field
from typing import Optional

class WooCommerceConnect(BaseModel):
    store_url: str = Field(..., description="WooCommerce store base URL")
    consumer_key: str = Field(..., description="WooCommerce Consumer Key")
    consumer_secret: str = Field(..., description="WooCommerce Consumer Secret")

class AmazonConnect(BaseModel):
    seller_id: str = Field(..., description="Amazon Seller ID")
    refresh_token: str = Field(..., description="Amazon SP-API LWA Refresh Token")
    marketplace_id: Optional[str] = Field(None, description="Optional target Amazon Marketplace ID")

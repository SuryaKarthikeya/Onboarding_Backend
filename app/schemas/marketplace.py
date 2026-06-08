from pydantic import BaseModel, Field
from typing import Optional

class WooCommerceConnect(BaseModel):
    store_url: str = Field(..., description="WooCommerce store base URL")
    consumer_key: str = Field(..., description="WooCommerce Consumer Key")
    consumer_secret: str = Field(..., description="WooCommerce Consumer Secret")



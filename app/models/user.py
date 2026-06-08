from enum import Enum
from typing import Any, List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field, GetCoreSchemaHandler, EmailStr, ConfigDict
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.with_info_plain_validator_function(cls.validate),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, value: Any, info: core_schema.ValidationInfo) -> ObjectId:
        if isinstance(value, ObjectId):
            return value
        if not isinstance(value, str) or not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")
        return ObjectId(value)

class OnboardingState(str, Enum):
    AWAITING_PROFILE = "AWAITING_PROFILE"
    AWAITING_WORKSPACE = "AWAITING_WORKSPACE"
    AWAITING_INTEGRATION = "AWAITING_INTEGRATION"
    ACTIVE = "ACTIVE"

class UserProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: Optional[EmailStr] = None
    whatsapp_number: Optional[str] = None
    profile: UserProfile = Field(default_factory=UserProfile)
    onboarding_state: OnboardingState = OnboardingState.AWAITING_PROFILE
    workspace_ids: List[PyObjectId] = Field(default_factory=list)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )


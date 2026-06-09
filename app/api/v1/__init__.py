from fastapi import APIRouter
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.onboarding import router as onboarding_router
from app.api.v1.routes.marketplace import router as marketplace_router
from app.api.v1.routes.cost_data import router as cost_data_router
from app.api.v1.routes.quickbooks import router as quickbooks_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(onboarding_router)
api_v1_router.include_router(marketplace_router)
api_v1_router.include_router(cost_data_router)
api_v1_router.include_router(quickbooks_router)

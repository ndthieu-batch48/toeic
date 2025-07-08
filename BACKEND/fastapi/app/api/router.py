from fastapi import APIRouter
from .endpoints import auth, tests

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])
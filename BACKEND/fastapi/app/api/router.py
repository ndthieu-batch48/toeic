from fastapi import APIRouter

from app.api.endpoints import email
from .endpoints import auth, gemini, tests, history, translation, users, languages

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tests.router, prefix="/tests", tags=["Tests"])
api_router.include_router(history.router, prefix="/history", tags=["History"])
api_router.include_router(translation.router, prefix="/translation", tags=["Translation"])
api_router.include_router(gemini.router, prefix="/gemini", tags=["Gemini"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(languages.router, prefix="/languages", tags=["Languages"])
api_router.include_router(email.router, prefix="/email", tags=["Email"])
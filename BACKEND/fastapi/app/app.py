from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .api.endpoints import auth, tests
from .core.config import settings

app = FastAPI(title="TOEIC API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs(settings.MEDIA_DIRECTORY, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIRECTORY), name="media")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tests.router, prefix="/tests", tags=["Tests"])

@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .api.router import api_router
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
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.router import api_router
from .core.app_config import app_config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


app = FastAPI(title="TOEIC API", version="1.0.0", root_path="/fastapi")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs(app_config.MEDIA_DIRECTORY, exist_ok=True)
app.mount("/media", StaticFiles(directory=app_config.MEDIA_DIRECTORY), name="media")

# Include routers
app.router.redirect_slashes = False
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}

import asyncio
import logging
import os
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .database.test_pool import DatabaseManager
from .api.router import api_router
from .core.app_config import app_config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Starting application...")
    try:
        await DatabaseManager.initialize()
        logger.info("✅ Database connection pool initialized")
        
        yield  # Application is running
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        raise
    finally:
        # Shutdown - This is the critical part
        logger.info("🛑 Shutting down application...")
        try:
            await DatabaseManager.close()
            logger.info("✅ Database connection pool closed")
        except Exception as e:
            logger.error(f"❌ Error during database shutdown: {e}")
        
        # Give a small delay to ensure all connections are properly closed
        await asyncio.sleep(0.1)
        logger.info("✅ Application shutdown complete")

app = FastAPI(title="TOEIC API", version="1.0.0", lifespan=lifespan)

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
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check"""
    return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}

@app.get("/health/db")
async def database_health_check():
    """Database health check"""
    try:
        is_healthy = await DatabaseManager.health_check()
        status = "healthy" if is_healthy else "unhealthy"
        return {"status": status, "database": is_healthy}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/metrics/db")
async def database_metrics():
    """Database pool metrics"""
    try:
        metrics = await DatabaseManager.get_pool_status()
        return metrics
    except Exception as e:
        logger.error(f"Failed to get database metrics: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to get metrics"}
        )
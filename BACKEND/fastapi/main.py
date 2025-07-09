import uvicorn
from app.app import app

if __name__ == "__main__":
    uvicorn.run(
        app,  # Direct reference to app object
        host="0.0.0.0",
        port=8000,
        log_level="debug",
        reload=True,
        workers=4
    )
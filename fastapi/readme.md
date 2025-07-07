# FastAPI TOEIC Application - Requirements Guide

## Overview
This FastAPI application provides a TOEIC test platform with AI-powered features using Google Gemini API.

## Requirements.txt Overview

The `requirements.txt` file contains essential dependencies for the TOEIC FastAPI application:

### Core Dependencies
- **Pydantic** (`pydantic==2.11.7`) - Data validation and serialization framework
- **Google Gemini AI** (`google-genai==1.24.0`) - AI integration for chat and translation features
- **HTTP/Network** (`httpx==0.28.1`, `requests==2.32.4`) - HTTP client libraries for API communication
- **WebSockets** (`websockets==15.0.1`) - Real-time communication support

### Authentication & Security
- **Google Auth** (`google-auth==2.40.3`) - Google API authentication
- **Cryptography** (`pyasn1`, `rsa`) - Security and encryption utilities

### Utilities
- **Type Support** (`typing-extensions`, `annotated-types`) - Enhanced type annotations
- **Async Support** (`anyio==4.9.0`) - Asynchronous programming utilities
- **Retry Logic** (`tenacity==8.5.0`) - Robust error handling and retries
- **Caching** (`cachetools==5.5.2`) - Performance optimization

### Network & Protocol Support
- **HTTP Core** (`h11==0.16.0`, `httpcore==1.0.9`) - Low-level HTTP protocol handling
- **SSL/TLS** (`certifi==2025.6.15`) - Certificate validation
- **URL Processing** (`urllib3==2.5.0`, `idna==3.10`) - URL and domain handling

## Installation

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

## Environment Setup
Make sure to create a `.env` file with:
```
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=your_database_name
GEMINI_API_KEY=your_gemini_api_key
MEDIA_DIRECTORY=C:\tma_toeic\DB\media
```

## Running the Application
```bash
# Development mode
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Key Features Supported by Dependencies
- **AI Chat & Translation** - Powered by Google Gemini AI
- **Real-time Communication** - WebSocket support for live features
- **Data Validation** - Robust input/output validation with Pydantic
- **Async Operations** - Full async/await support for performance
- **HTTP APIs** - RESTful API endpoints with proper error handling

## Troubleshooting
If you encounter import errors:
1. Ensure you're using Python 3.8+ 
2. Activate your virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Check your `.env` file configuration
# FastAPI TOEIC Application - Requirements Guide

## Overview
This FastAPI application provides a TOEIC test platform with AI-powered features using Google Gemini API.

## Requirements Files

### 📦 `requirements_minimal.txt` (Recommended)
**Production-ready, streamlined dependencies (~20 packages)**
- Contains only essential packages your application actually uses
- No conflicts, faster installation, better security
- **Use this for new deployments**

### 📦 `requirements_current_backup.txt` 
**Current environment snapshot (57 packages)**
- Backup of your current working environment
- Contains some extra packages but functional
- **Use this to replicate exact current setup**

### 📦 `requirements_old.txt`
**Original bloated version (~80 packages)**
- Contains unnecessary packages (Django, SQLAlchemy, etc.)
- Multiple conflicting libraries
- **Do not use - kept for reference only**

## Key Dependencies Explained

### Core Framework
- `fastapi` - Main web framework
- `uvicorn` - ASGI server for running the app

### Authentication & Security
- `passlib[bcrypt]` - Password hashing
- `python-jose` + `PyJWT` - JWT token handling
- `bcrypt` - Password encryption

### Database
- `mysql-connector-python` - MySQL database connectivity

### AI Integration
- `google-generativeai` - Google Gemini AI API
- `google-api-core` + `google-auth` - Google API utilities

### Data & Media Processing
- `pydantic` - Data validation and serialization
- `Pillow` - Image processing for TOEIC media
- `requests` - HTTP requests for external APIs

### Utilities
- `python-dotenv` - Environment variable management
- `python-multipart` - File upload handling

## Installation

### For New Setup (Recommended)
```bash
pip install -r requirements_minimal.txt
```

### To Replicate Current Environment
```bash
pip install -r requirements_current_backup.txt
```

### For Development
```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements_minimal.txt
```

## Environment Setup
Make sure to create a `.env` file with:
```
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=your_database_name
GEMINI_API_KEY=your_gemini_api_key
```

## Running the Application
```bash
# Development mode
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Notes for Developers
- The application was cleaned up from a Django/FastAPI hybrid to pure FastAPI
- Removed unnecessary packages like Django, SQLAlchemy, Rich (dev tools)
- Fixed missing `HTTPException` import in `gemini_service.py`
- All functionality preserved with minimal dependencies

## Troubleshooting
If you encounter import errors, ensure you're using the correct requirements file and have activated your virtual environment.
# FastAPI TOEIC Application - Requirements Guide

## Dependencies Overview

### Core FastAPI Dependencies
- **fastapi** - The main FastAPI web framework
- **uvicorn** - ASGI server to run FastAPI applications
- **starlette** - FastAPI's underlying web framework
- **pydantic** & **pydantic_core** - Data validation and serialization
- **annotated-types** - Type annotations support for Pydantic

### HTTP & Networking
- **httpx** - Async HTTP client
- **httpcore** - Low-level HTTP client
- **requests** - HTTP library for Python
- **urllib3** - HTTP client library
- **h11** - HTTP/1.1 protocol implementation
- **anyio** - Async I/O abstraction layer
- **sniffio** - Async library detection

### Authentication & Security
- **passlib** - Password hashing utilities
- **bcrypt** - Password hashing algorithm
- **python-jose** - JWT token handling
- **cryptography** - Cryptographic functions
- **ecdsa** - Elliptic curve digital signatures

### Database
- **mysql-connector-python** - MySQL database connector
- **mysqlclient** - MySQL database adapter
- **dnspython** - DNS toolkit

### Google AI Services
- **google-generativeai** - Google's Gemini AI SDK
- **google-ai-generativelanguage** - Google AI language models
- **google-api-core** - Google API client core
- **google-api-python-client** - Google API client library
- **google-auth** & **google-auth-httplib2** - Google authentication
- **google-genai** - Google AI utilities
- **googleapis-common-protos** - Google API protocol buffers
- **grpcio** & **grpcio-status** - gRPC communication
- **proto-plus** & **protobuf** - Protocol buffer support

### Image Processing
- **pillow** - Python Imaging Library (PIL)

### Utilities
- **python-dotenv** - Environment variable loading
- **dotenv** - Environment file handling
- **click** - Command-line interface creation
- **colorama** - Cross-platform colored terminal text
- **email_validator** - Email validation
- **typing_extensions** - Extended type hints
- **typing-inspection** - Runtime type inspection
- **six** - Python 2/3 compatibility
- **pyparsing** - Text parsing library
- **cachetools** - Caching utilities
- **tenacity** - Retry library
- **tqdm** - Progress bars
- **certifi** - Root certificates
- **charset-normalizer** - Character encoding detection
- **idna** - Internationalized domain names
- **uritemplate** - URI templates
- **cffi** & **pycparser** - C Foreign Function Interface
- **pyasn1** & **pyasn1_modules** - ASN.1 library
- **rsa** - RSA cryptography
- **websockets** - WebSocket support
- **httplib2** - HTTP client library

## Installation

### Prerequisites
- Python 3.8+
- MySQL database
- Google API key for Gemini AI

### Setup Instructions
1. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment**:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file with:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DB=toeic
   MEDIA_DIRECTORY=C:/TOEIC_APP/DB/media
   GOOGLE_API_KEY=your_google_api_key
   ```

5. **Run the application**:
   ```bash
   uvicorn main:app --reload
   ```

## Troubleshooting

### Common Import Errors
If you encounter import errors:
1. Ensure you're using Python 3.8+ 
2. Activate your virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Check your `.env` file configuration

### Virtual Environment Issues
If pip is missing or corrupted:
```bash
# Delete and recreate virtual environment
rmdir /s venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure the database exists

### Media Directory Issues
- Make sure the media directory path exists
- Use forward slashes in paths for cross-platform compatibility
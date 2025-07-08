# TOEIC APP

A full-stack web application for TOEIC (Test of English for International Communication) practice and testing.

## Tech Stack

- **Frontend**: React.js with Redux Toolkit
- **Backend**: FastAPI (Python)
- **UI Components**: Material-UI, Bootstrap
- **Charts**: Chart.js
- **Authentication**: JWT
- **Gemini**: Google's Generative AI for intelligent features
  - Text-based Q&A and explanations
  - Image analysis and description
  - Multi-language support (Vietnamese, English, Japanese)
  - TOEIC question generation and feedback
  - Chatbot functionality for learning assistance

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **Git** - [Download here](https://git-scm.com/)
- **MySQL database** - [Download here](https://dev.mysql.com/downloads/installer/)
- **Google API key for Gemini AI** - [Create here](https://aistudio.google.com/app/apikey/)

## Project Structure

**The project structure should follow:**
```
TOEIC_APP/
├── FRONTEND/
│   └── client/          # React.js frontend application
|── BACKEND/              
|   └── fastapi/         # FastAPI backend application
|   └── django/          # Django backend admin application
├── DB/
    └── media/           # Media storage folder
```

## Getting Started
- **Create root directory**
```bash
mkdir TOEIC_APP 
cd TOEIC_APP
```

#### 1. FRONTEND setup
💡 Make sure you are inside the TOEIC_APP folder before running the following:
```bash
mkdir FRONTEND
cd FRONTEND
git clone <client-repository-url>
```

- **Install Dependencies**

```bash
cd client
npm install
```

##### Available Scripts

- **Development**: Start the development server
  ```bash
  npm start
  ```
  Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

- **Build**: Create a production build
  ```bash
  npm run build
  ```
  Builds the app for production to the `build` folder.

- **Test**: Run tests
  ```bash
  npm test
  ```

- **Linting**: Check and fix code style
  ```bash
  npm run lint
  npm run lint:fix
  ```

- **Formatting**: Format code with Prettier
  ```bash
  npm run format
  npm run check:format
  ```

## 3. FastAPI Backend Setup
💡 Make sure you are inside the TOEIC_APP folder before running the following:
```bash
mkdir BACKEND
cd BACKEND
git clone <fastapi-repository-url>
cd fastapi

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
call venv\Scripts\activate.bat

# For Git Bash or WSL, use:
source venv/Scripts/activate
```

#### Install Python Dependencies

```bash
# Make sure virtual environment is activated
pip install -r requirements.txt

# If requirements.txt doesn't exist, install FastAPI and common dependencies
pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[bcrypt] sqlalchemy alembic
```

#### Run the API Server

```bash
# Make sure you're in the backend directory and virtual environment is activated
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at [http://localhost:8000](http://localhost:8000)
API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs)

## Development Workflow

### Running Both Frontend and Backend

1. **Terminal 1** - Backend:
   ```bash
   cd BACKEND/fastapi
   call venv\Scripts\activate.bat # For window
   uvicorn main:app --host <your_host> --port <your_port> --reload
   ```

2. **Terminal 2** - Frontend:
   ```bash
   cd FRONTEND/client
   npm start
   ```

### Deactivating Virtual Environment

When you're done developing:

```bash
deactivate
```

## Environment Variables

### Frontend (.env file in FRONTEND/client/)
```
REACT_APP_API_URL=YOUR_BACKEND_HOST
```

### Backend (.env file in BACKEND/)
```
MYSQL_HOST = YOUR_HOST
MYSQL_USER = YOUR_USER
MYSQL_PASSWORD = YOUR_PASSWORD
MYSQL_DB = YOUR_DB
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY

# This is the recommend setup. Replace with your own path
MEDIA_DIRECTORY = C:/TOEIC-APP/DB/media 
```


## Additional Notes

- The application uses JWT for authentication
- Media files should be stored in `C:/TOEIC-APP/DB/media` (Windows)
- State management is handled by Redux Toolkit
- The app includes chatbot AI functionality
- Bootstrap and Material-UI are used for styling


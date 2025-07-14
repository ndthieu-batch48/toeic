import os
from dotenv import load_dotenv

load_dotenv()

class AppConfig:
    MYSQL_HOST = os.getenv("MYSQL_HOST")
    MYSQL_USER = os.getenv("MYSQL_USER")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
    MYSQL_DB = os.getenv("MYSQL_DB")
    
    SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    RESET_PASSWORD_EXPIRES_MINUTES = 3
    
    MEDIA_DIRECTORY = os.getenv("MEDIA_DIRECTORY", r"C:\TOEIC_APP\DB\media")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
app_config = AppConfig()
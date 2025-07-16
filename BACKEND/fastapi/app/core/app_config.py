from pydantic_settings import BaseSettings

class AppConfig(BaseSettings):
    MYSQL_HOST: str = ""
    MYSQL_USER: str = ""
    MYSQL_PASSWORD: str = ""
    MYSQL_DB: str = ""
    
    # Connection pool settings
    DB_POOL_MIN_SIZE: int = 5
    DB_POOL_MAX_SIZE: int = 20
    DB_CONNECT_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600
    
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    OTP_EXPIRES_MINUTES: int = 3
    
    MEDIA_DIRECTORY: str = r"C:\TOEIC_APP\DB\media"
    GEMINI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"
        
app_config = AppConfig()
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
    
    SECRET_KEY: str = ""
    ALGORITHM: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    OTP_EXPIRES_MINUTES: int = 5
    
    MEDIA_DIRECTORY: str = r"C:\TOEIC_APP\DB\media"
    GEMINI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"
        
app_config = AppConfig()
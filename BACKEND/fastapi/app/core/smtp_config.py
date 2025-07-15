from pydantic_settings import BaseSettings 

class SmtpConfig(BaseSettings):
    CLIENT_HOST: str = "http://localhost:3000"
    GMAIL_SENDER: str = ""
    GMAIL_PASSWORD: str = ""
    GMAIL_SMTP_SERVER: str = "smtp.gmail.com"
    GMAIL_SMTP_PORT: int = 587
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow" 

smtp_config = SmtpConfig()
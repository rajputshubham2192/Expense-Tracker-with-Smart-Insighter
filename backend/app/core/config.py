import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Expense Tracker with Smart Insighter"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Secret Key for JWT Signing
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-token-key-change-in-production-mp-online-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days
    
    # Database URL: defaults to local SQLite if Postgres is not specified
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./expense_tracker.db")

    class Config:
        case_sensitive = True

settings = Settings()

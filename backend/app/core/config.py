"""
Brightloop Backend Configuration
Loads settings from environment variables or .env file with robust validation.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "Brightloop Subscription Management System"
    APP_ENV: str = "development"
    DEBUG: bool = True

    API_V1_PREFIX: str = "/api/v1"

    # MySQL database connection URL placeholder
    DATABASE_URL: str = "mysql+pymysql://USER:PASSWORD@HOST:3306/brightloop"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600

    # JWT Settings
    JWT_SECRET_KEY: str = "brightloop-enterprise-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours default for demo

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Initial Admin Provisioning (from environment variables)
    INITIAL_ADMIN_EMAIL: str = "priyanka@brightloop.io"
    INITIAL_ADMIN_PASSWORD: str = "Admin@Brightloop123!"
    INITIAL_ADMIN_NAME: str = "Priyanka Sen"

    # Email / SMTP Settings (Simulated / Staged)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "billing@brightloop.io"


settings = Settings()

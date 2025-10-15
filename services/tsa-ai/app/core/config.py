"""
Configuration settings for TSA Contest FastAPI AI Service
Note: Authentication is handled by Adonis service
FastAPI only responds to requests, doesn't make external calls
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""

    # App Info
    app_name: str = Field(default="TSA Contest AI API", alias="APP_NAME")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    app_description: str = Field(default="API Intelligence Artificielle pour TSA Logistique")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=True, alias="DEBUG")

    # Database (shared with Adonis)
    database_url: str = Field(
        default="postgresql://tsa_user:tsa_password@localhost:5432/tsa_contest",
        alias="DATABASE_URL"
    )

    # CORS
    allowed_origins: list = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://localhost:80"],
        alias="ALLOWED_ORIGINS"
    )

    # ML Models
    models_path: str = Field(default="ml_models", alias="MODELS_PATH")

    # Sentry (Monitoring)
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")

    # Redis (Optional for caching ML predictions)
    redis_url: Optional[str] = Field(default=None, alias="REDIS_URL")
    cache_ttl_seconds: int = Field(default=300, alias="CACHE_TTL_SECONDS")  # 5 minutes

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Internal service communication
    internal_service_secret: str = Field(
        default="internal-secret-key",
        alias="INTERNAL_SERVICE_SECRET"
    )

    # ML Model settings
    prediction_batch_size: int = Field(default=100, alias="PREDICTION_BATCH_SIZE")
    model_reload_interval: int = Field(default=3600, alias="MODEL_RELOAD_INTERVAL")  # 1 hour

    # Google Cloud Vision API
    google_application_credentials: Optional[str] = Field(default=None, alias="GOOGLE_APPLICATION_CREDENTIALS")

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Environment-specific configurations
def get_database_url() -> str:
    """Get database URL based on environment"""
    if settings.environment == "test":
        return settings.database_url.replace("/tsa_contest", "/tsa_contest_test")
    return settings.database_url


def is_production() -> bool:
    """Check if running in production"""
    return settings.environment == "production"


def is_development() -> bool:
    """Check if running in development"""
    return settings.environment == "development"
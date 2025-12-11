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

    # Trusted Hosts (for TrustedHostMiddleware)
    allowed_hosts: list = Field(
        default=[
            "*.tsa-contest.com",
            "localhost",
            "tsa-ai",
            "tsa-ai-backend",
            "51.91.77.0",
            "51.91.77.0:30002"
        ],
        alias="ALLOWED_HOSTS"
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
    
    # Monolith API URL for chatbot to call back
    monolith_api_url: str = Field(
        default="http://localhost:3333/api",
        alias="MONOLITH_API_URL"
    )

    # ML Model settings
    prediction_batch_size: int = Field(default=100, alias="PREDICTION_BATCH_SIZE")
    model_reload_interval: int = Field(default=3600, alias="MODEL_RELOAD_INTERVAL")  # 1 hour

    # Google Cloud Vision API
    google_application_credentials: Optional[str] = Field(default=None, alias="GOOGLE_APPLICATION_CREDENTIALS")
    
    # LLM Configuration (Groq)
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    llm_model: str = Field(default="llama-3.3-70b-versatile", alias="LLM_MODEL")
    llm_enabled: bool = Field(default=True, alias="LLM_ENABLED")

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Environment-specific configurations
def get_database_url() -> str:
    """Get database URL based on environment with UTF-8 encoding"""
    from urllib.parse import quote_plus
    
    base_url = settings.database_url
    if settings.environment == "test":
        base_url = base_url.replace("/tsa_contest", "/tsa_contest_test")
    
    # Fix URL encoding for special characters in password
    # Replace unencoded special characters
    if "@" in base_url and ":" in base_url:
        # Extract password and encode it
        parts = base_url.split("://")
        if len(parts) == 2:
            protocol = parts[0]
            rest = parts[1]
            if "@" in rest:
                auth_part, host_part = rest.split("@", 1)
                if ":" in auth_part:
                    user, password = auth_part.split(":", 1)
                    # Encode password
                    encoded_password = quote_plus(password)
                    base_url = f"{protocol}://{user}:{encoded_password}@{host_part}"
    
    # Add client_encoding parameter if not already present
    if "?" not in base_url:
        base_url += "?client_encoding=utf8"
    elif "client_encoding" not in base_url:
        base_url += "&client_encoding=utf8"
    
    return base_url


def is_production() -> bool:
    """Check if running in production"""
    return settings.environment == "production"


def is_development() -> bool:
    """Check if running in development"""
    return settings.environment == "development"
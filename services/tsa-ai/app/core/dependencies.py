"""
FastAPI dependencies for database and services
Note: Authentication is handled by Adonis service, not FastAPI
"""
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)


async def get_user_from_header(
        x_user_id: Optional[str] = Header(None),
        x_user_email: Optional[str] = Header(None),
        x_user_role: Optional[str] = Header(None)
):
    """
    Get user info from headers (passed by Nginx from Adonis auth)
    Adonis handles authentication and passes user info via headers
    """
    if settings.environment == "development":
        # For development, return mock user if no headers
        return {
            "id": int(x_user_id) if x_user_id else 1,
            "email": x_user_email or "dev@tsa.com",
            "role": x_user_role or "admin"
        }

    # In production, headers should be set by Nginx after Adonis auth
    if not x_user_id:
        return None

    return {
        "id": int(x_user_id),
        "email": x_user_email,
        "role": x_user_role
    }


def get_ml_service():
    """
    Dependency to get ML service instance
    """
    from app.services.ml_service import MLService
    return MLService()


def get_database_session():
    """
    Database session dependency
    """
    return Depends(get_db)


async def validate_internal_call(
        x_internal_service: Optional[str] = Header(None)
):
    """
    Validate that call comes from internal service (Adonis)
    """
    if settings.environment == "development":
        return True

    # In production, check for internal service header from Nginx
    return x_internal_service == "adonis-service"
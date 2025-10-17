"""
Database configuration and session management
"""
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Generator
import logging

from app.core.config import settings, get_database_url

logger = logging.getLogger(__name__)

# Database URL
DATABASE_URL = get_database_url()

# SQLAlchemy engine
if settings.environment == "test":
    # Use in-memory SQLite for tests
    engine = create_engine(
        "sqlite:///./test.db",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL for development/production
    # Add encoding parameters for Windows compatibility
    connect_args = {
        "client_encoding": "utf8",
    }
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=settings.debug,  # Log SQL queries in debug mode
        connect_args=connect_args,
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Metadata for reflection (auto-generating models from existing tables)
metadata = MetaData()


def get_db() -> Generator:
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def init_db():
    """
    Initialize database (create tables if needed)
    """
    try:
        # In a real scenario, we would reflect existing tables from Adonis
        # For now, we'll create basic tables if they don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_db():
    """
    Close database connections
    """
    try:
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")


def reflect_tables():
    """
    Reflect existing tables from database (created by Adonis)
    This is useful when we want to auto-generate models from existing schema
    """
    try:
        metadata.reflect(bind=engine)
        logger.info(f"Reflected {len(metadata.tables)} tables from database")
        return metadata.tables
    except Exception as e:
        logger.error(f"Failed to reflect tables: {e}")
        return {}


def test_connection():
    """
    Test database connection
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
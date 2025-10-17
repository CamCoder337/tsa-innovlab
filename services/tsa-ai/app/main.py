"""
Main FastAPI application for TSA Contest AI Service
Note: Authentication is handled by Adonis service via Nginx headers
"""
import logging
import sentry_sdk
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.core.config import settings, is_production
from app.core.database import init_db, close_db
from app.endpoints import health, eta, product_recommendations, visual_recognition, pricing_simple

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize Sentry for monitoring
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[
            FastApiIntegration(auto_enabling_integrations=False),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=1.0 if not is_production() else 0.1,
        environment=settings.environment,
        release=settings.app_version,
    )
    logger.info("Sentry monitoring initialized")


async def load_ml_models():
    """
    Load ML models at startup
    """
    try:
        from app.services.ml_service import ml_service
        await ml_service.load_all_models()
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load ML models: {e}")
        # Don't fail startup if models can't be loaded
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    """
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info("Authentication handled by Adonis service")

    try:
        await init_db()
        logger.info("Database initialized")
        
        # Initialize pricing config
        from app.services.pricing_config_service import init_pricing_config
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            init_pricing_config(db)
            logger.info("Pricing configuration initialized")
        except Exception as e:
            logger.warning(f"Pricing configuration skipped: {e}")
        finally:
            db.close()

        # Load ML models
        await load_ml_models()

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down application")
    try:
        await close_db()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    docs_url="/docs" if not is_production() else None,
    redoc_url="/redoc" if not is_production() else None,
    openapi_url="/openapi.json" if not is_production() else None,
    lifespan=lifespan
)

# Add middleware
if is_production():
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*.tsa-contest.com", "localhost"]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# Error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "body": exc.body
        }
    )


@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "message": "Une erreur interne s'est produite"
        }
    )


# Include routers
app.include_router(
    health.router,
    prefix="/api/ai/health",
    tags=["Health Check"]
)

app.include_router(
    eta.router,
    prefix="/api/ai/eta",
    tags=["ETA Prediction"]
)

app.include_router(
    product_recommendations.router,
    prefix="/api/ai/product-recommendations",
    tags=["Product Recommendations"]
)

app.include_router(
    visual_recognition.router,
    prefix="/api/ai/visual",
    tags=["Visual Recognition"]
)

app.include_router(
    pricing_simple.router,
    prefix="/api/ai",
    tags=["Pricing Dynamique"]
)

# TODO: Add other AI routers
# app.include_router(predictions.router, prefix="/api/ai/predictions", tags=["Predictions"])
# app.include_router(anomalies.router, prefix="/api/ai/anomalies", tags=["Anomaly Detection"])


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "TSA Contest AI API is running!",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "auth_note": "Authentication handled by Adonis service",
        "docs": "/docs" if not is_production() else "Disabled in production"
    }


@app.get("/api/ai")
async def ai_root():
    """
    AI API root endpoint
    """
    return {
        "message": "TSA Contest AI API",
        "available_endpoints": [
            "/api/ai/health - Health checks",
            "/api/ai/eta - ETA predictions ✅",
            "/api/ai/product-recommendations - Product recommendations ✅",
            "/api/ai/predictions - General predictions (TODO)",
            "/api/ai/anomalies - Anomaly detection (TODO)"
        ],
        "auth_note": "User authentication handled by Adonis service via Nginx headers",
        "ml_models": {
            "eta": "✅ Operational",
            "product_recommendation": "✅ Operational",
            "anomaly": "🚧 In development"
        }
    }
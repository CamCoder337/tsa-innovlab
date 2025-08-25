"""
Health check endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import time
import psutil
import logging
from datetime import datetime

from app.core.database import get_db, test_connection
from app.core.config import settings
from app.schemas.health import HealthResponse, DatabaseStatus, SystemStatus, ServiceStatus

logger = logging.getLogger(__name__)

router = APIRouter()

# Application start time for uptime calculation
_start_time = time.time()


def get_system_metrics() -> SystemStatus:
    """Get system resource metrics"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        uptime = time.time() - _start_time
        
        return SystemStatus(
            cpu_usage_percent=round(cpu_percent, 2),
            memory_usage_percent=round(memory.percent, 2),
            disk_usage_percent=round(disk.percent, 2),
            uptime_seconds=round(uptime, 2)
        )
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        return SystemStatus()


def check_database_health() -> DatabaseStatus:
    """Check database connection health"""
    try:
        start_time = time.time()
        is_connected = test_connection()
        response_time = (time.time() - start_time) * 1000
        
        return DatabaseStatus(
            connected=is_connected,
            response_time_ms=round(response_time, 2),
            error=None if is_connected else "Connection failed"
        )
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return DatabaseStatus(
            connected=False,
            response_time_ms=None,
            error=str(e)
        )


def check_ml_services() -> dict[str, ServiceStatus]:
    """Check ML services health"""
    services = {}
    
    try:
        from app.services.eta_service import ETAService
        
        start_time = time.time()
        eta_service = ETAService()
        # Simple check to see if service can be instantiated
        model_loaded = hasattr(eta_service, '_fallback_available') and eta_service._fallback_available
        response_time = (time.time() - start_time) * 1000
        
        services["eta_service"] = ServiceStatus(
            name="ETA Prediction Service",
            status="healthy" if model_loaded else "degraded",
            response_time_ms=round(response_time, 2),
            details={
                "fallback_available": model_loaded,
                "model_version": "1.0.0"
            }
        )
    except Exception as e:
        services["eta_service"] = ServiceStatus(
            name="ETA Prediction Service",
            status="unhealthy",
            error=str(e)
        )
    
    return services


@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Health check complet du système
    
    Vérifie:
    - Status général du système
    - Connexion à la base de données
    - Disponibilité des services ML
    - Métriques système (CPU, mémoire, disque)
    """
    start_time = time.time()
    
    try:
        # Check database
        database_status = check_database_health()
        
        # Check system metrics
        system_status = get_system_metrics()
        
        # Check ML services
        ml_services = check_ml_services()
        
        # Calculate uptime
        uptime = time.time() - _start_time
        response_time = (time.time() - start_time) * 1000
        
        # Determine overall status
        overall_status = "healthy"
        if not database_status.connected:
            overall_status = "unhealthy"
        elif any(service.status == "unhealthy" for service in ml_services.values()):
            overall_status = "degraded"
        elif any(service.status == "degraded" for service in ml_services.values()):
            overall_status = "degraded"
        
        return HealthResponse(
            status=overall_status,
            version=settings.app_version,
            environment=settings.environment,
            database=database_status,
            system=system_status,
            services=ml_services,
            uptime_seconds=round(uptime, 2),
            response_time_ms=round(response_time, 2)
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du health check: {str(e)}"
        )


@router.get("/live")
async def liveness_check():
    """
    Liveness check simple
    
    Endpoint minimaliste pour vérifier que l'application répond.
    Utilisé par les orchestrateurs (Kubernetes, Docker Swarm, etc.)
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.app_name
    }


@router.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness check
    
    Vérifie que l'application est prête à recevoir du trafic.
    Inclut les vérifications critiques (database, services essentiels).
    """
    try:
        # Check database connectivity
        database_status = check_database_health()
        
        if not database_status.connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service non disponible: base de données inaccessible"
            )
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.app_name,
            "database": "connected"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service non disponible: {str(e)}"
        )


@router.get("/database")
async def database_health():
    """
    Database health check détaillé
    
    Endpoint spécifique pour vérifier la santé de la base de données.
    """
    try:
        database_status = check_database_health()
        
        if not database_status.connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Base de données inaccessible"
            )
        
        return {
            "status": "healthy",
            "connected": database_status.connected,
            "response_time_ms": database_status.response_time_ms,
            "database_url": settings.database_url.split('@')[1] if '@' in settings.database_url else "masked",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la vérification database: {str(e)}"
        )


@router.get("/services")
async def services_health():
    """
    Services health check détaillé
    
    Vérifie la santé de tous les services ML et externes.
    """
    try:
        services = check_ml_services()
        
        overall_status = "healthy"
        if any(service.status == "unhealthy" for service in services.values()):
            overall_status = "unhealthy"
        elif any(service.status == "degraded" for service in services.values()):
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "services": services,
            "total_services": len(services),
            "healthy_services": len([s for s in services.values() if s.status == "healthy"]),
            "degraded_services": len([s for s in services.values() if s.status == "degraded"]),
            "unhealthy_services": len([s for s in services.values() if s.status == "unhealthy"]),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Services health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la vérification services: {str(e)}"
        )
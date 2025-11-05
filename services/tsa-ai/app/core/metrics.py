"""
Prometheus metrics configuration for TSA AI Service (MVP)
"""
from prometheus_client import Counter, Histogram, Gauge, Info
from prometheus_fastapi_instrumentator import Instrumentator, metrics
import logging
import psutil

logger = logging.getLogger(__name__)

# Application info
app_info = Info('tsa_ai_app', 'TSA AI Service Information')

# === MVP Business Metrics ===

# ETA Predictions
eta_predictions_total = Counter(
    'tsa_ai_eta_predictions_total',
    'Total number of ETA predictions made',
    ['status']  # success, error
)

eta_prediction_duration = Histogram(
    'tsa_ai_eta_prediction_duration_seconds',
    'Time spent calculating ETA predictions',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# Chatbot Queries
chatbot_queries_total = Counter(
    'tsa_ai_chatbot_queries_total',
    'Total number of chatbot queries',
    ['version', 'status']  # v1, v2, v3 | success, error
)

chatbot_query_duration = Histogram(
    'tsa_ai_chatbot_query_duration_seconds',
    'Time spent processing chatbot queries',
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

# System Metrics
system_cpu_usage = Gauge(
    'tsa_ai_system_cpu_usage_percent',
    'CPU usage percentage'
)

system_memory_usage = Gauge(
    'tsa_ai_system_memory_usage_percent',
    'Memory usage percentage'
)

system_disk_usage = Gauge(
    'tsa_ai_system_disk_usage_percent',
    'Disk usage percentage'
)

# Health Check Status
health_check_status = Gauge(
    'tsa_ai_health_check_status',
    'Health check status (1 = healthy, 0 = unhealthy)',
    ['component']  # database, services, overall
)


def setup_metrics(app):
    """
    Setup Prometheus metrics instrumentation for FastAPI app (MVP version)
    """
    # Create instrumentator with MVP configuration
    instrumentator = Instrumentator(
        should_group_status_codes=False,
        should_ignore_untemplated=False,
        should_respect_env_var=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/metrics", "/docs", "/redoc", "/openapi.json"],
        env_var_name="ENABLE_METRICS",
        inprogress_name="http_requests_inprogress",
        inprogress_labels=True
    )

    # Add default HTTP metrics
    instrumentator.add(metrics.default())
    instrumentator.add(metrics.latency())
    instrumentator.add(metrics.requests())

    # Instrument the app
    instrumentator.instrument(app)

    # Set app info
    app_info.info({
        'version': '1.0.0',
        'service': 'tsa-ai',
        'environment': 'production'
    })

    logger.info("Prometheus metrics configured successfully (MVP)")

    return instrumentator


def update_system_metrics():
    """
    Update system metrics from psutil
    Should be called periodically or in health check
    """
    try:
        system_cpu_usage.set(psutil.cpu_percent(interval=0.1))
        system_memory_usage.set(psutil.virtual_memory().percent)
        system_disk_usage.set(psutil.disk_usage('/').percent)

    except Exception as e:
        logger.error(f"Failed to update system metrics: {e}")


# Export metrics for use in endpoints
__all__ = [
    'setup_metrics',
    'update_system_metrics',
    'eta_predictions_total',
    'eta_prediction_duration',
    'chatbot_queries_total',
    'chatbot_query_duration',
    'system_cpu_usage',
    'system_memory_usage',
    'system_disk_usage',
    'health_check_status',
]

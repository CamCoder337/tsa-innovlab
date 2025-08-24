"""
Health check schemas
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime


class DatabaseStatus(BaseModel):
    """Database connection status"""
    connected: bool = Field(..., description="Database connection status")
    response_time_ms: Optional[float] = Field(None, description="Database response time in milliseconds")
    error: Optional[str] = Field(None, description="Error message if connection failed")


class ServiceStatus(BaseModel):
    """Individual service status"""
    name: str = Field(..., description="Service name")
    status: str = Field(..., description="Service status (healthy, degraded, unhealthy)")
    response_time_ms: Optional[float] = Field(None, description="Service response time")
    error: Optional[str] = Field(None, description="Error message if service is unhealthy")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional service details")


class SystemStatus(BaseModel):
    """System health status"""
    cpu_usage_percent: Optional[float] = Field(None, description="CPU usage percentage")
    memory_usage_percent: Optional[float] = Field(None, description="Memory usage percentage")
    disk_usage_percent: Optional[float] = Field(None, description="Disk usage percentage")
    uptime_seconds: Optional[float] = Field(None, description="System uptime in seconds")


class HealthResponse(BaseModel):
    """Complete health check response"""
    status: str = Field(..., description="Overall system status (healthy, degraded, unhealthy)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Environment (development, production, etc.)")
    
    database: DatabaseStatus = Field(..., description="Database connection status")
    system: SystemStatus = Field(..., description="System resource status")
    services: Dict[str, ServiceStatus] = Field(default_factory=dict, description="External services status")
    
    uptime_seconds: float = Field(..., description="Application uptime in seconds")
    response_time_ms: float = Field(..., description="Health check response time")
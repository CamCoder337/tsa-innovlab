"""
Base models for SQLAlchemy
These will be auto-generated from the existing Adonis database schema
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class ETAPrediction(Base):
    """
    Store ETA predictions for analysis and improvement
    """
    __tablename__ = "eta_predictions"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, index=True, nullable=True)
    user_id = Column(Integer, index=True, nullable=True)

    # Request data
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    cargo_weight_kg = Column(Float, nullable=True)
    cargo_volume_m3 = Column(Float, nullable=True)
    priority = Column(String(20), default="normal")

    # Prediction results
    predicted_duration_minutes = Column(Integer, nullable=False)
    confidence_score = Column(Float, nullable=False)
    model_version = Column(String(20), nullable=False)
    distance_km = Column(Float, nullable=True)

    # Factors
    risk_factors = Column(Text, nullable=True)  # JSON string
    positive_factors = Column(Text, nullable=True)  # JSON string
    traffic_impact = Column(String(20), nullable=True)
    weather_impact = Column(String(20), nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ETAFeedback(Base):
    """
    Store feedback on ETA prediction accuracy
    """
    __tablename__ = "eta_feedback"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("eta_predictions.id"), nullable=True)

    # Prediction vs reality
    predicted_duration_minutes = Column(Integer, nullable=False)
    actual_duration_minutes = Column(Integer, nullable=False)
    accuracy_percent = Column(Float, nullable=False)

    # Feedback
    rating = Column(Integer, nullable=True)  # 1-5 stars
    feedback_notes = Column(Text, nullable=True)

    # Metadata
    actual_arrival_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    prediction = relationship("ETAPrediction", backref="feedback")


class AnomalyDetection(Base):
    """
    Store anomaly detection results
    """
    __tablename__ = "anomaly_detections"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, nullable=False, index=True)

    # Anomaly details
    anomaly_type = Column(String(50), nullable=False)  # delay, route_deviation, etc.
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    confidence_score = Column(Float, nullable=False)
    description = Column(Text, nullable=True)

    # Context data
    expected_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)

    # Status
    status = Column(String(20), default="detected")  # detected, investigating, resolved
    resolved_at = Column(DateTime, nullable=True)

    # Metadata
    detected_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProductRecommendation(Base):
    """
    Store product recommendation results
    """
    __tablename__ = "product_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)

    # Recommendation context
    context_type = Column(String(50), nullable=False)  # purchase_history, similar_users, etc.
    recommended_product_ids = Column(Text, nullable=False)  # JSON array of product IDs
    confidence_scores = Column(Text, nullable=False)  # JSON array of confidence scores

    # Recommendation metadata
    algorithm_used = Column(String(50), nullable=False)
    model_version = Column(String(20), nullable=False)

    # Performance tracking
    click_through_rate = Column(Float, nullable=True)
    conversion_rate = Column(Float, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class MLModelPerformance(Base):
    """
    Track ML model performance metrics
    """
    __tablename__ = "ml_model_performance"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(50), nullable=False)  # eta, anomaly, recommendation
    model_version = Column(String(20), nullable=False)

    # Performance metrics
    metric_name = Column(String(50), nullable=False)  # mae, rmse, accuracy, etc.
    metric_value = Column(Float, nullable=False)

    # Context
    dataset_size = Column(Integer, nullable=True)
    evaluation_date = Column(DateTime, default=datetime.utcnow)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)


# Placeholder models for Adonis tables (will be auto-generated)
class User(Base):
    """Placeholder - will be auto-generated from Adonis schema"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True)
    role = Column(String(50))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)


class Order(Base):
    """Placeholder - will be auto-generated from Adonis schema"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)


class Shipment(Base):
    """Placeholder - will be auto-generated from Adonis schema"""
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    origin_lat = Column(Float)
    origin_lng = Column(Float)
    destination_lat = Column(Float)
    destination_lng = Column(Float)
    status = Column(String(50))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
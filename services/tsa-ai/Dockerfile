# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV ENVIRONMENT=production

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    curl \
    ca-certificates \
    # Dependencies for OpenCV (EasyOCR)
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    # Dependencies for PyMuPDF
    libmupdf-dev \
    mupdf-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for ML models, logs, and credentials
RUN mkdir -p ml_models logs data/visual_recognition/images

# Create non-root user FIRST
RUN useradd --create-home --shell /bin/bash app

# Create EasyOCR cache directory in user home
RUN mkdir -p /home/app/.EasyOCR && \
    chown -R app:app /home/app && \
    chown -R app:app /app

USER app

# Set EasyOCR home to user directory
ENV EASYOCR_MODULE_PATH=/home/app/.EasyOCR

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/ai/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
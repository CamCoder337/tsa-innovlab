#!/bin/bash

# TSA InnovLab Deployment Script
set -e

echo "🚛 TSA InnovLab - Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before continuing."
    read -p "Press enter when ready to continue..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    else
        COMPOSE_CMD="docker compose"
    fi
else
    COMPOSE_CMD="docker-compose"
fi

print_status "Using: $COMPOSE_CMD"

# Function to show menu
show_menu() {
    echo ""
    echo "Choose deployment option:"
    echo "1) Full deployment (build and start all services)"
    echo "2) Start existing services"
    echo "3) Stop all services" 
    echo "4) Rebuild and restart services"
    echo "5) View logs"
    echo "6) Health check"
    echo "7) Clean up (remove containers and volumes)"
    echo "8) Exit"
}

# Function to wait for service health
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if $COMPOSE_CMD ps $service | grep -q "healthy"; then
            print_success "$service is healthy!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service failed to become healthy after $max_attempts attempts"
    return 1
}

# Main deployment functions
full_deployment() {
    print_status "Starting full deployment..."
    
    # Stop existing services
    print_status "Stopping existing services..."
    $COMPOSE_CMD down
    
    # Build images
    print_status "Building Docker images..."
    $COMPOSE_CMD build --no-cache
    
    # Start services in order
    print_status "Starting infrastructure services..."
    $COMPOSE_CMD up -d postgres redis
    
    # Wait for database
    wait_for_service postgres
    wait_for_service redis
    
    print_status "Starting application services..."
    $COMPOSE_CMD up -d tsa-monolith
    wait_for_service tsa-monolith
    
    $COMPOSE_CMD up -d tsa-ai
    wait_for_service tsa-ai
    
    print_status "Starting load balancer..."
    $COMPOSE_CMD up -d nginx
    wait_for_service nginx
    
    print_success "Deployment completed successfully!"
    print_status "Services are available at:"
    echo "  - Main API: http://localhost/api"
    echo "  - AI Service: http://localhost/api/ai"
    echo "  - AI Docs: http://localhost/api/ai/docs"
    echo "  - Health Check: http://localhost/health"
}

start_services() {
    print_status "Starting existing services..."
    $COMPOSE_CMD up -d
    print_success "Services started!"
}

stop_services() {
    print_status "Stopping all services..."
    $COMPOSE_CMD down
    print_success "Services stopped!"
}

rebuild_services() {
    print_status "Rebuilding and restarting services..."
    $COMPOSE_CMD down
    $COMPOSE_CMD build
    $COMPOSE_CMD up -d
    print_success "Services rebuilt and restarted!"
}

view_logs() {
    echo "Choose service to view logs:"
    echo "1) All services"
    echo "2) tsa-monolith"
    echo "3) tsa-ai"  
    echo "4) nginx"
    echo "5) postgres"
    echo "6) redis"
    
    read -p "Enter choice (1-6): " log_choice
    
    case $log_choice in
        1) $COMPOSE_CMD logs -f ;;
        2) $COMPOSE_CMD logs -f tsa-monolith ;;
        3) $COMPOSE_CMD logs -f tsa-ai ;;
        4) $COMPOSE_CMD logs -f nginx ;;
        5) $COMPOSE_CMD logs -f postgres ;;
        6) $COMPOSE_CMD logs -f redis ;;
        *) print_error "Invalid choice" ;;
    esac
}

health_check() {
    print_status "Performing health check..."
    
    services=("postgres" "redis" "tsa-monolith" "tsa-ai" "nginx")
    
    for service in "${services[@]}"; do
        if $COMPOSE_CMD ps $service | grep -q "healthy\|Up"; then
            print_success "$service: OK"
        else
            print_error "$service: FAILED"
        fi
    done
    
    # Test endpoints
    print_status "Testing endpoints..."
    
    if curl -f -s http://localhost/health > /dev/null; then
        print_success "Load balancer health check: OK"
    else
        print_error "Load balancer health check: FAILED"
    fi
    
    if curl -f -s http://localhost/api/ai/health > /dev/null; then
        print_success "AI service health check: OK"
    else
        print_error "AI service health check: FAILED"
    fi
}

cleanup() {
    print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -p "" confirm
    
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        print_status "Cleaning up..."
        $COMPOSE_CMD down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1) full_deployment ;;
        2) start_services ;;
        3) stop_services ;;
        4) rebuild_services ;;
        5) view_logs ;;
        6) health_check ;;
        7) cleanup ;;
        8) print_status "Goodbye!"; exit 0 ;;
        *) print_error "Invalid choice. Please try again." ;;
    esac
    
    echo ""
    read -p "Press enter to continue..."
done
#!/bin/bash
# ================================
# TSA Logistics - Deployment Script
# ================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/opt/tsa/backups"
DATA_DIR="/opt/tsa/data"
LOGS_DIR="/opt/tsa/logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root for production setup"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log_info "Setting up directories..."
    
    mkdir -p "$DATA_DIR"/{postgres,redis,ai_models}
    mkdir -p "$LOGS_DIR"/{app,nginx}
    mkdir -p "$BACKUP_DIR"
    mkdir -p /opt/tsa/ssl
    
    # Set permissions
    chown -R 1001:1001 "$DATA_DIR"/postgres
    chown -R 999:999 "$DATA_DIR"/redis
    chown -R 1001:1001 "$DATA_DIR"/ai_models
    chown -R 1001:1001 "$LOGS_DIR"/app
    chmod -R 755 "$DATA_DIR"
    chmod -R 755 "$LOGS_DIR"
    
    log_success "Directories created and configured"
}

# Check environment file
check_environment() {
    if [[ ! -f "$PROJECT_DIR/.env.prod" ]]; then
        log_error "Production environment file not found!"
        log_info "Please copy .env.prod.example to .env.prod and configure it"
        exit 1
    fi
    
    # Check for default passwords
    if grep -q "CHANGE_ME" "$PROJECT_DIR/.env.prod"; then
        log_error "Please update all CHANGE_ME values in .env.prod"
        exit 1
    fi
    
    log_success "Environment configuration validated"
}

# Backup existing data
backup_data() {
    if [[ -d "$DATA_DIR/postgres" ]] && [[ "$(ls -A $DATA_DIR/postgres)" ]]; then
        log_info "Creating backup of existing data..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
        
        # Backup database
        docker exec tsa-postgres-prod pg_dumpall -U "$POSTGRES_USER" > "$BACKUP_DIR/$BACKUP_NAME/database.sql" 2>/dev/null || true
        
        log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# Deploy application
deploy() {
    cd "$PROJECT_DIR"
    
    log_info "Pulling latest images and building..."
    docker-compose -f docker-compose.prod.yml pull
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    log_info "Starting production services..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_services
}

# Check service health
check_services() {
    log_info "Checking service health..."
    
    services=("tsa-postgres-prod" "tsa-redis-prod" "tsa-monolith-prod" "tsa-ai-prod" "tsa-nginx-prod")
    
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service.*healthy"; then
            log_success "$service is healthy"
        elif docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service.*Up"; then
            log_warning "$service is running but health status unknown"
        else
            log_error "$service is not running properly"
            docker logs "$service" --tail 50
        fi
    done
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    if command -v certbot &> /dev/null; then
        # This is a placeholder - configure based on your domain
        log_warning "SSL setup requires manual configuration for your domain"
        log_info "Example: certbot --nginx -d your-domain.com -d api.your-domain.com"
    else
        log_warning "Certbot not found. Install it for automatic SSL setup"
        log_info "On Ubuntu/Debian: apt install certbot python3-certbot-nginx"
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Setup log rotation
    cat > /etc/logrotate.d/tsa-docker << EOF
/opt/tsa/logs/**/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 root root
    postrotate
        docker kill --signal=USR1 tsa-nginx-prod 2>/dev/null || true
    endscript
}
EOF
    
    log_success "Monitoring configured"
}

# Cleanup old images and containers
cleanup() {
    log_info "Cleaning up old Docker images..."
    docker system prune -f
    docker volume prune -f
    log_success "Cleanup completed"
}

# Show status
show_status() {
    echo -e "\n${GREEN}=== TSA Logistics Deployment Status ===${NC}"
    docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
    echo -e "\n${BLUE}=== Resource Usage ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Main deployment function
main() {
    echo -e "${GREEN}=== TSA Logistics Production Deployment ===${NC}\n"
    
    case "${1:-deploy}" in
        "setup")
            check_root
            setup_directories
            check_environment
            setup_ssl
            setup_monitoring
            log_success "Production environment setup completed!"
            ;;
        "deploy")
            check_environment
            backup_data
            deploy
            cleanup
            show_status
            log_success "Deployment completed successfully!"
            ;;
        "backup")
            backup_data
            ;;
        "status")
            show_status
            ;;
        "logs")
            docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f "${2:-}"
            ;;
        "stop")
            log_info "Stopping production services..."
            docker-compose -f docker-compose.prod.yml --env-file .env.prod down
            log_success "Services stopped"
            ;;
        "restart")
            log_info "Restarting production services..."
            docker-compose -f docker-compose.prod.yml --env-file .env.prod restart
            log_success "Services restarted"
            ;;
        *)
            echo "Usage: $0 {setup|deploy|backup|status|logs|stop|restart}"
            echo ""
            echo "Commands:"
            echo "  setup   - Initial production environment setup (run as root)"
            echo "  deploy  - Deploy/update the application"
            echo "  backup  - Create a backup of current data"
            echo "  status  - Show deployment status"
            echo "  logs    - Show service logs (optionally specify service name)"
            echo "  stop    - Stop all services"
            echo "  restart - Restart all services"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
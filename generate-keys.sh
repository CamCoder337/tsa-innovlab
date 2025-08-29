#!/bin/bash

# TSA InnovLab - Security Keys Generator
echo "🔑 TSA InnovLab - Security Keys Generator"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}Generating secure keys for your .env file:${NC}"
echo ""

# Generate APP_KEY (32 characters for AdonisJS)
APP_KEY=$(openssl rand -base64 32 | cut -c1-32)
echo -e "${GREEN}APP_KEY=${NC}${APP_KEY}"

# Generate secure database password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
echo -e "${GREEN}POSTGRES_PASSWORD=${NC}${DB_PASSWORD}"

# Generate secure Redis password  
REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
echo -e "${GREEN}REDIS_PASSWORD=${NC}${REDIS_PASSWORD}"

echo ""
echo -e "${YELLOW}⚠️  Copy these values to your .env file${NC}"
echo -e "${YELLOW}⚠️  Keep these keys secure and never commit them to version control${NC}"
echo ""

# Optionally update .env file
if [ -f .env ]; then
    echo "Do you want to automatically update your .env file? (y/N)"
    read -p "" update_env
    
    if [[ $update_env == [yY] || $update_env == [yY][eE][sS] ]]; then
        # Backup existing .env
        cp .env .env.backup
        
        # Update keys
        sed -i.tmp "s/APP_KEY=.*/APP_KEY=${APP_KEY}/" .env
        sed -i.tmp "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${DB_PASSWORD}/" .env  
        sed -i.tmp "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PASSWORD}/" .env
        
        # Clean up temp file
        rm .env.tmp 2>/dev/null || true
        
        echo -e "${GREEN}✅ .env file updated successfully!${NC}"
        echo -e "${BLUE}💾 Backup saved as .env.backup${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found. Run: cp .env.example .env${NC}"
fi
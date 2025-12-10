#!/bin/bash
# Health check script for all services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking service health..."
echo ""

# Check Backend
echo -n "Backend API: "
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo -e "${RED}✗ Unhealthy${NC}"
    UNHEALTHY=1
fi
echo ""

# Check Frontend
echo -n "Frontend: "
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    UNHEALTHY=1
fi
echo ""

# Check PostgreSQL
echo -n "PostgreSQL: "
if docker-compose exec -T postgres_db pg_isready -U interview_user > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    UNHEALTHY=1
fi
echo ""

# Check Redis
echo -n "Redis: "
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    UNHEALTHY=1
fi
echo ""

# Container Status
echo "Container Status:"
docker-compose ps
echo ""

if [ -n "$UNHEALTHY" ]; then
    echo -e "${RED}Some services are unhealthy!${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
else
    echo -e "${GREEN}All services are healthy!${NC}"
    exit 0
fi
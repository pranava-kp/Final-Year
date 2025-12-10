#!/bin/bash
# Real-time monitoring script for Docker services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to clear screen
clear_screen() {
    clear
}

# Function to get container status
get_status() {
    container=$1
    status=$(docker-compose ps -q $container 2>/dev/null | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null)
    if [ "$status" = "running" ]; then
        echo -e "${GREEN}Running${NC}"
    elif [ "$status" = "exited" ]; then
        echo -e "${RED}Stopped${NC}"
    elif [ "$status" = "restarting" ]; then
        echo -e "${YELLOW}Restarting${NC}"
    else
        echo -e "${RED}Not Found${NC}"
    fi
}

# Function to get container health
get_health() {
    container=$1
    health=$(docker-compose ps -q $container 2>/dev/null | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null)
    if [ "$health" = "healthy" ]; then
        echo -e "${GREEN}✓ Healthy${NC}"
    elif [ "$health" = "unhealthy" ]; then
        echo -e "${RED}✗ Unhealthy${NC}"
    elif [ "$health" = "starting" ]; then
        echo -e "${YELLOW}⟳ Starting${NC}"
    else
        echo -e "${BLUE}No health check${NC}"
    fi
}

# Function to get resource usage
get_resources() {
    container=$1
    stats=$(docker stats --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}" $(docker-compose ps -q $container 2>/dev/null) 2>/dev/null)
    if [ -n "$stats" ]; then
        cpu=$(echo $stats | cut -d'|' -f1)
        mem=$(echo $stats | cut -d'|' -f2)
        echo "CPU: ${CYAN}$cpu${NC} | Mem: ${PURPLE}$mem${NC}"
    else
        echo "N/A"
    fi
}

# Function to get log count
get_log_count() {
    container=$1
    count=$(docker-compose logs --tail=100 $container 2>/dev/null | grep -c "ERROR\|WARN" || echo "0")
    if [ "$count" -gt 10 ]; then
        echo -e "${RED}$count errors/warnings${NC}"
    elif [ "$count" -gt 0 ]; then
        echo -e "${YELLOW}$count errors/warnings${NC}"
    else
        echo -e "${GREEN}No errors${NC}"
    fi
}

# Main monitoring loop
monitor() {
    while true; do
        clear_screen
        echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║${NC}        ${CYAN}Multi-Agentic RAG Interview System - Service Monitor${NC}           ${BLUE}║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Last Update: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
        echo ""
        
        # Backend Service
        echo -e "${BLUE}┌─ Backend API ──────────────────────────────────────────────────────────────┐${NC}"
        echo -n "  Status:     "
        get_status "backend"
        echo -n "  Health:     "
        get_health "backend"
        echo -n "  Resources:  "
        get_resources "backend"
        echo -n "  Logs:       "
        get_log_count "backend"
        echo -e "${BLUE}└────────────────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        # Frontend Service
        echo -e "${BLUE}┌─ Frontend ─────────────────────────────────────────────────────────────────┐${NC}"
        echo -n "  Status:     "
        get_status "frontend"
        echo -n "  Health:     "
        get_health "frontend"
        echo -n "  Resources:  "
        get_resources "frontend"
        echo -n "  Logs:       "
        get_log_count "frontend"
        echo -e "${BLUE}└────────────────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        # PostgreSQL Service
        echo -e "${BLUE}┌─ PostgreSQL ───────────────────────────────────────────────────────────────┐${NC}"
        echo -n "  Status:     "
        get_status "postgres_db"
        echo -n "  Health:     "
        get_health "postgres_db"
        echo -n "  Resources:  "
        get_resources "postgres_db"
        # Check connection count
        if docker-compose ps -q postgres_db > /dev/null 2>&1; then
            conn_count=$(docker-compose exec -T postgres_db psql -U interview_user -d interview_db -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "0")
            echo "  Connections: ${CYAN}$conn_count${NC}"
        fi
        echo -e "${BLUE}└────────────────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        # Redis Service
        echo -e "${BLUE}┌─ Redis ────────────────────────────────────────────────────────────────────┐${NC}"
        echo -n "  Status:     "
        get_status "redis"
        echo -n "  Health:     "
        get_health "redis"
        echo -n "  Resources:  "
        get_resources "redis"
        # Check keys count
        if docker-compose ps -q redis > /dev/null 2>&1; then
            keys_count=$(docker-compose exec -T redis redis-cli DBSIZE 2>/dev/null | grep -oE '[0-9]+' || echo "0")
            echo "  Keys:       ${CYAN}$keys_count${NC}"
        fi
        echo -e "${BLUE}└────────────────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        # Quick Stats
        echo -e "${BLUE}┌─ Quick Stats ──────────────────────────────────────────────────────────────┐${NC}"
        
        # API Health
        if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "  API Endpoint:   ${GREEN}✓ Responding${NC}"
        else
            echo -e "  API Endpoint:   ${RED}✗ Not responding${NC}"
        fi
        
        # Frontend Health
        if curl -sf http://localhost/health > /dev/null 2>&1; then
            echo -e "  Frontend:       ${GREEN}✓ Responding${NC}"
        else
            echo -e "  Frontend:       ${RED}✗ Not responding${NC}"
        fi
        
        # Disk usage
        if [ -d "/var/lib/docker" ]; then
            docker_size=$(docker system df -v 2>/dev/null | grep "Total" | awk '{print $4}' || echo "N/A")
            echo -e "  Docker Size:    ${PURPLE}$docker_size${NC}"
        fi
        
        echo -e "${BLUE}└────────────────────────────────────────────────────────────────────────────┘${NC}"
        echo ""
        
        echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
        echo ""
        
        sleep 5
    done
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

# Start monitoring
monitor

#!/bin/bash

# Multi-Agentic RAG Interview System - Docker Quick Start Script
# This script helps you quickly set up and run the application using Docker

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    echo "=========================================="
    print_message "$BLUE" "$1"
    echo "=========================================="
    echo ""
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "$RED" "❌ Docker is not installed. Please install Docker first."
        print_message "$YELLOW" "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_message "$GREEN" "✓ Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_message "$RED" "❌ Docker Compose is not installed. Please install Docker Compose first."
        print_message "$YELLOW" "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_message "$GREEN" "✓ Docker Compose is installed"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_message "$YELLOW" "⚠ .env file not found. Creating from .env.example..."
        cp .env.example .env
        print_message "$GREEN" "✓ .env file created"
        print_message "$YELLOW" "⚠ IMPORTANT: Please edit .env file with your actual configuration values"
        print_message "$YELLOW" "   Required: GOOGLE_API_KEY, PINECONE_API_KEY, CLOUDINARY credentials, JWT_SECRET_KEY"
        echo ""
        read -p "Press Enter after you've configured the .env file..."
    else
        print_message "$GREEN" "✓ .env file exists"
    fi
}

# Generate JWT secret if not set
check_jwt_secret() {
    if grep -q "your-super-secret-jwt-key-change-this-in-production" .env; then
        print_message "$YELLOW" "⚠ Generating secure JWT secret key..."
        jwt_secret=$(openssl rand -hex 32)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-super-secret-jwt-key-change-this-in-production/$jwt_secret/" .env
        else
            # Linux
            sed -i "s/your-super-secret-jwt-key-change-this-in-production/$jwt_secret/" .env
        fi
        print_message "$GREEN" "✓ JWT secret key generated"
    fi
}

# Build Docker images
build_images() {
    print_header "Building Docker Images"
    docker-compose build
    print_message "$GREEN" "✓ Images built successfully"
}

# Start services
start_services() {
    print_header "Starting Services"
    docker-compose up -d
    print_message "$GREEN" "✓ Services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Ready"
    
    print_message "$BLUE" "Waiting for PostgreSQL..."
    timeout=60
    counter=0
    until docker-compose exec -T postgres_db pg_isready -U interview_user > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_message "$RED" "❌ PostgreSQL failed to start within $timeout seconds"
            exit 1
        fi
    done
    print_message "$GREEN" "✓ PostgreSQL is ready"
    
    print_message "$BLUE" "Waiting for Redis..."
    counter=0
    until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_message "$RED" "❌ Redis failed to start within $timeout seconds"
            exit 1
        fi
    done
    print_message "$GREEN" "✓ Redis is ready"
    
    print_message "$BLUE" "Waiting for Backend..."
    sleep 10  # Give backend extra time to start
    counter=0
    until curl -sf http://localhost:8000/health > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_message "$YELLOW" "⚠ Backend health check timeout (might still be starting)"
            break
        fi
    done
    print_message "$GREEN" "✓ Backend is ready"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    docker-compose exec -T backend alembic upgrade head
    print_message "$GREEN" "✓ Migrations completed"
}

# Optional: Seed database
seed_database() {
    print_header "Database Seeding (Optional)"
    read -p "Do you want to seed the database with initial data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec -T backend python scripts/seed_database.py
        print_message "$GREEN" "✓ Database seeded"
    else
        print_message "$YELLOW" "⊘ Skipping database seeding"
    fi
}

# Display final information
show_info() {
    print_header "Setup Complete! 🎉"
    
    print_message "$GREEN" "Your application is now running!"
    echo ""
    print_message "$BLUE" "Access URLs:"
    print_message "$YELLOW" "  Frontend:       http://localhost"
    print_message "$YELLOW" "  Backend API:    http://localhost:8000"
    print_message "$YELLOW" "  API Docs:       http://localhost:8000/docs"
    print_message "$YELLOW" "  Redoc:          http://localhost:8000/redoc"
    echo ""
    print_message "$BLUE" "Useful Commands:"
    print_message "$YELLOW" "  View logs:           docker-compose logs -f"
    print_message "$YELLOW" "  Stop services:       docker-compose down"
    print_message "$YELLOW" "  Restart services:    docker-compose restart"
    print_message "$YELLOW" "  Backend shell:       docker-compose exec backend /bin/bash"
    print_message "$YELLOW" "  Database shell:      docker-compose exec postgres_db psql -U interview_user -d interview_db"
    echo ""
    print_message "$BLUE" "Check service health:"
    print_message "$YELLOW" "  curl http://localhost:8000/health"
    echo ""
    print_message "$BLUE" "For more information, see DOCKER_DEPLOYMENT.md"
    echo ""
}

# Main execution
main() {
    print_header "Multi-Agentic RAG Interview System - Docker Setup"
    
    # Pre-flight checks
    print_header "Pre-flight Checks"
    check_docker
    check_docker_compose
    check_env_file
    check_jwt_secret
    
    # Ask for deployment mode
    echo ""
    print_message "$BLUE" "Select deployment mode:"
    print_message "$YELLOW" "  1) Development (with hot-reload and debugging)"
    print_message "$YELLOW" "  2) Production (optimized and secure)"
    read -p "Enter choice [1]: " mode
    mode=${mode:-1}
    
    if [ "$mode" = "2" ]; then
        print_message "$YELLOW" "⚠ Production mode selected"
        export COMPOSE_FILE="docker-compose.yml:docker-compose.prod.yml"
    else
        print_message "$BLUE" "Development mode selected"
    fi
    
    # Build and start
    build_images
    start_services
    wait_for_services
    run_migrations
    seed_database
    
    # Show final info
    show_info
}

# Run main function
main

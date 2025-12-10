#!/bin/bash
# Script to generate .env file interactively

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}   Environment Configuration Generator for Interview System              ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠ .env file already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    # Backup existing .env
    cp .env .env.backup
    echo -e "${GREEN}✓ Backed up existing .env to .env.backup${NC}"
fi

echo ""
echo -e "${BLUE}Let's configure your environment variables.${NC}"
echo -e "${YELLOW}Press Enter to use default values [shown in brackets]${NC}"
echo ""

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✓ Generated secure JWT secret key${NC}"

# Database Configuration
echo ""
echo -e "${BLUE}=== Database Configuration ===${NC}"
read -p "PostgreSQL username [interview_user]: " DB_USER
DB_USER=${DB_USER:-interview_user}

read -sp "PostgreSQL password [auto-generated]: " DB_PASS
echo
if [ -z "$DB_PASS" ]; then
    DB_PASS=$(openssl rand -base64 16)
    echo -e "${GREEN}✓ Generated secure database password${NC}"
fi

read -p "Database name [interview_db]: " DB_NAME
DB_NAME=${DB_NAME:-interview_db}

# API Keys
echo ""
echo -e "${BLUE}=== API Keys (Required) ===${NC}"
echo -e "${YELLOW}Get your Google API key from: https://makersuite.google.com/app/apikey${NC}"
read -p "Google API Key: " GOOGLE_KEY

echo ""
echo -e "${YELLOW}Get your Pinecone credentials from: https://app.pinecone.io/${NC}"
read -p "Pinecone API Key: " PINECONE_KEY
read -p "Pinecone Environment: " PINECONE_ENV
read -p "Pinecone Index Name [interview-questions]: " PINECONE_INDEX
PINECONE_INDEX=${PINECONE_INDEX:-interview-questions}

echo ""
echo -e "${YELLOW}Get your Cloudinary credentials from: https://cloudinary.com/console${NC}"
read -p "Cloudinary Cloud Name: " CLOUDINARY_NAME
read -p "Cloudinary API Key: " CLOUDINARY_KEY
read -sp "Cloudinary API Secret: " CLOUDINARY_SECRET
echo

# Application Configuration
echo ""
echo -e "${BLUE}=== Application Configuration ===${NC}"
read -p "Environment [production]: " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-production}

read -p "Debug mode [false]: " DEBUG
DEBUG=${DEBUG:-false}

read -p "Log Level [INFO]: " LOG_LEVEL
LOG_LEVEL=${LOG_LEVEL:-INFO}

# CORS Origins
echo ""
read -p "CORS Origins [http://localhost:3000,http://localhost:5173,http://localhost]: " CORS_ORIGINS
CORS_ORIGINS=${CORS_ORIGINS:-"http://localhost:3000,http://localhost:5173,http://localhost"}

# JWT Configuration
echo ""
read -p "JWT Token Expiry (minutes) [30]: " JWT_EXPIRE
JWT_EXPIRE=${JWT_EXPIRE:-30}

read -p "Refresh Token Expiry (days) [7]: " REFRESH_EXPIRE
REFRESH_EXPIRE=${REFRESH_EXPIRE:-7}

# Generate .env file
echo ""
echo -e "${BLUE}Generating .env file...${NC}"

cat > .env << EOF
# =============================================================================
# Environment Variables for Multi-Agentic RAG Interview System
# =============================================================================
# Generated: $(date)
# IMPORTANT: Keep this file secure and never commit to version control!

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@postgres_db:5432/${DB_NAME}

# For local development (outside Docker):
# DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

# PostgreSQL credentials (used by Docker Compose)
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=${DB_NAME}

# -----------------------------------------------------------------------------
# Authentication & Security
# -----------------------------------------------------------------------------
JWT_SECRET_KEY=${JWT_SECRET}
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=${JWT_EXPIRE}
JWT_REFRESH_TOKEN_EXPIRE_DAYS=${REFRESH_EXPIRE}

# -----------------------------------------------------------------------------
# Google AI (Gemini)
# -----------------------------------------------------------------------------
GOOGLE_API_KEY=${GOOGLE_KEY}

# -----------------------------------------------------------------------------
# Pinecone (Vector Database)
# -----------------------------------------------------------------------------
PINECONE_API_KEY=${PINECONE_KEY}
PINECONE_ENVIRONMENT=${PINECONE_ENV}
PINECONE_INDEX_NAME=${PINECONE_INDEX}

# -----------------------------------------------------------------------------
# Cloudinary (File Storage)
# -----------------------------------------------------------------------------
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_SECRET}
# Alternative URL format:
CLOUDINARY_URL=cloudinary://${CLOUDINARY_KEY}:${CLOUDINARY_SECRET}@${CLOUDINARY_NAME}

# -----------------------------------------------------------------------------
# Redis (Caching)
# -----------------------------------------------------------------------------
REDIS_URL=redis://redis:6379/0

# For local development (outside Docker):
# REDIS_URL=redis://localhost:6379/0

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------
ENVIRONMENT=${ENVIRONMENT}
DEBUG=${DEBUG}
LOG_LEVEL=${LOG_LEVEL}

# CORS Origins (comma-separated)
CORS_ORIGINS=${CORS_ORIGINS}

# -----------------------------------------------------------------------------
# LangSmith (Optional - for LangChain debugging)
# -----------------------------------------------------------------------------
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=your-langsmith-api-key
# LANGCHAIN_PROJECT=interview-system
EOF

echo -e "${GREEN}✓ .env file created successfully!${NC}"
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "Database User: ${YELLOW}${DB_USER}${NC}"
echo -e "Database Name: ${YELLOW}${DB_NAME}${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Debug Mode: ${YELLOW}${DEBUG}${NC}"
echo -e "JWT Secret: ${GREEN}[Generated]${NC}"
echo -e "Google API Key: ${GREEN}[Set]${NC}"
echo -e "Pinecone API Key: ${GREEN}[Set]${NC}"
echo -e "Cloudinary: ${GREEN}[Configured]${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Review the .env file: ${YELLOW}cat .env${NC}"
echo -e "2. Start the application: ${YELLOW}./docker-quickstart.sh${NC}"
echo -e "   or: ${YELLOW}make up${NC}"
echo ""
echo -e "${GREEN}Configuration complete! 🎉${NC}"

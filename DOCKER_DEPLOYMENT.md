# Docker Deployment Guide

Complete guide for deploying the Multi-Agentic RAG Interview System using Docker.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Common Commands](#common-commands)
7. [Troubleshooting](#troubleshooting)
8. [Architecture](#architecture)

---

## Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Make** (optional, but recommended): For convenient commands

### Check Your Installation

```bash
docker --version
docker-compose --version
make --version  # optional
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Final-Year
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and fill in your actual values:

```bash
nano .env  # or use your preferred editor
```

**Required variables:**
- `GOOGLE_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `PINECONE_API_KEY` - Get from [Pinecone Console](https://app.pinecone.io/)
- `CLOUDINARY_*` - Get from [Cloudinary Console](https://cloudinary.com/console)
- `JWT_SECRET_KEY` - Generate with: `openssl rand -hex 32`

### 3. Build and Start Services

Using Make (recommended):
```bash
make setup
```

Or manually:
```bash
docker-compose build
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

### 4. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

---

## Configuration

### Environment Variables

The `.env.example` file contains all required configuration options. Key sections:

#### Database
```env
DATABASE_URL=postgresql://interview_user:your_secure_password@postgres_db:5432/interview_db
```

#### Authentication
```env
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### AI Services
```env
GOOGLE_API_KEY=your-google-api-key-here
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=your-pinecone-environment
```

#### File Storage
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## Development Deployment

Development mode includes hot-reloading and mounted volumes for easier development.

### Start Development Environment

```bash
make up
# or
docker-compose up -d
```

### View Logs

```bash
# All services
make logs

# Specific service
make logs-backend
make logs-frontend
docker-compose logs -f postgres_db
```

### Run Database Migrations

```bash
make migrate
# or
docker-compose exec backend alembic upgrade head
```

### Seed Database

```bash
make seed
# or
docker-compose exec backend python scripts/seed_database.py
```

### Access Container Shells

```bash
# Backend container
make shell-backend
# or
docker-compose exec backend /bin/bash

# Database shell
make shell-db
# or
docker-compose exec postgres_db psql -U interview_user -d interview_db
```

---

## Production Deployment

Production mode uses optimized configurations with multi-worker processes and resource limits.

### 1. Update Environment for Production

Ensure your `.env` file has production values:

```env
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
```

### 2. Use Strong Passwords

```bash
# Generate secure password
openssl rand -base64 32

# Update .env with strong passwords
POSTGRES_PASSWORD=<generated-password>
JWT_SECRET_KEY=<generated-key>
```

### 3. Start Production Services

```bash
make up-prod
# or
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Production Configuration Highlights

- **Backend**: Runs with 4 Gunicorn workers
- **Resource Limits**: CPU and memory limits enforced
- **No External Ports**: Database and Redis not exposed externally
- **No Volume Mounts**: Code bundled in images for security
- **Health Checks**: All services have health monitoring
- **Restart Policies**: Automatic recovery on failure

### 5. Scaling Services

Scale backend replicas:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=4
```

---

## Common Commands

All commands available via Makefile:

### Service Management
```bash
make build          # Build all images
make up             # Start development
make up-prod        # Start production
make down           # Stop all services
make restart        # Restart services
make ps             # Show running containers
```

### Logs & Monitoring
```bash
make logs           # All logs
make logs-backend   # Backend logs
make logs-frontend  # Frontend logs
make logs-db        # Database logs
make health         # Check service health
```

### Database Operations
```bash
make migrate        # Run migrations
make seed           # Seed database
make shell-db       # Open database shell
```

### Development
```bash
make shell-backend  # Backend shell
make test           # Run tests
```

### Cleanup
```bash
make clean          # Remove all containers, volumes, images
```

---

## Troubleshooting

### Services Won't Start

Check logs for errors:
```bash
docker-compose logs backend
docker-compose logs postgres_db
```

### Database Connection Issues

1. Ensure PostgreSQL is healthy:
```bash
docker-compose ps
```

2. Check database logs:
```bash
docker-compose logs postgres_db
```

3. Test connection:
```bash
docker-compose exec postgres_db psql -U interview_user -d interview_db -c "SELECT 1;"
```

### Backend API Not Responding

1. Check if backend is running:
```bash
docker-compose ps backend
```

2. View backend logs:
```bash
docker-compose logs -f backend
```

3. Check health endpoint:
```bash
curl http://localhost:8000/health
```

### Frontend Not Loading

1. Check Nginx logs:
```bash
docker-compose logs -f frontend
```

2. Verify frontend health:
```bash
curl http://localhost/health
```

3. Check backend connectivity from frontend:
```bash
docker-compose exec frontend wget -O- http://backend:8000/health
```

### Port Already in Use

Stop conflicting services or change ports in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"      # Change frontend port
  - "8001:8000"    # Change backend port
```

### Database Migrations Failed

1. Check if database is accessible:
```bash
docker-compose exec backend python -c "from interview_system.api.database import engine; print(engine.url)"
```

2. Manually run migrations:
```bash
docker-compose exec backend alembic upgrade head
```

3. View migration history:
```bash
docker-compose exec backend alembic history
```

### Out of Disk Space

Clean up unused Docker resources:
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove unused volumes (WARNING: deletes data)
docker volume prune
```

### Environment Variables Not Loading

1. Verify `.env` file exists:
```bash
ls -la .env
```

2. Check environment variables in container:
```bash
docker-compose exec backend env | grep GOOGLE_API_KEY
```

3. Restart services after changing `.env`:
```bash
docker-compose down
docker-compose up -d
```

---

## Architecture

### Service Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Frontend   │──────│   Backend    │                    │
│  │   (Nginx)    │      │  (FastAPI)   │                    │
│  │   Port 80    │      │  Port 8000   │                    │
│  └──────────────┘      └──────┬───────┘                    │
│                                │                             │
│                     ┌──────────┼──────────┐                 │
│                     │          │          │                 │
│              ┌──────▼────┐ ┌──▼────┐ ┌──▼──────┐          │
│              │ PostgreSQL │ │ Redis │ │External │          │
│              │  Port 5432 │ │ 6379  │ │Services │          │
│              └────────────┘ └───────┘ └─────────┘          │
│                                          - Pinecone         │
│                                          - Cloudinary        │
│                                          - Google AI         │
└─────────────────────────────────────────────────────────────┘
```

### Container Details

#### Frontend (Nginx + React)
- **Image**: Custom (multi-stage build)
- **Port**: 80
- **Purpose**: Serves React SPA and proxies API requests
- **Features**: Gzip compression, caching, security headers

#### Backend (FastAPI)
- **Image**: Custom (Python 3.11)
- **Port**: 8000
- **Purpose**: REST API server
- **Features**: Hot reload (dev), multi-worker (prod), health checks

#### PostgreSQL
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Purpose**: Primary database
- **Features**: Persistent volumes, health checks

#### Redis
- **Image**: redis:7-alpine
- **Port**: 6379
- **Purpose**: Caching and session storage
- **Features**: AOF persistence, health checks

### Volume Persistence

- `postgres_data`: Database files
- `redis_data`: Redis persistence files

### Network

All services communicate via a bridged Docker network (`interview_network`).

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` to version control
- Use strong, unique passwords
- Rotate secrets regularly

### 2. Production Settings
- Set `DEBUG=false`
- Use HTTPS in production (add TLS termination)
- Implement rate limiting
- Enable CORS only for trusted origins

### 3. Database
- Use strong PostgreSQL password
- Don't expose database port externally in production
- Regular backups

### 4. Container Security
- Containers run as non-root users
- Minimal base images (alpine)
- Security headers configured in Nginx

---

## Backup & Recovery

### Backup Database

```bash
# Create backup
docker-compose exec -T postgres_db pg_dump -U interview_user interview_db > backup_$(date +%Y%m%d).sql

# Create compressed backup
docker-compose exec -T postgres_db pg_dump -U interview_user interview_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T postgres_db psql -U interview_user interview_db < backup_20240101.sql

# Restore from compressed backup
gunzip < backup_20240101.sql.gz | docker-compose exec -T postgres_db psql -U interview_user interview_db
```

### Backup Volumes

```bash
# Backup PostgreSQL data
docker run --rm -v final-year_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Backup Redis data
docker run --rm -v final-year_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz -C /data .
```

---

## Performance Tuning

### Backend Scaling
```yaml
deploy:
  replicas: 4  # Scale to 4 instances
```

### Database Optimization
```yaml
postgres_db:
  command: >
    postgres
    -c shared_buffers=256MB
    -c max_connections=200
    -c work_mem=16MB
```

### Redis Configuration
```yaml
redis:
  command: >
    redis-server
    --maxmemory 256mb
    --maxmemory-policy allkeys-lru
```

---

## Monitoring

### Check Service Health

```bash
# All services
make health

# Individual checks
curl http://localhost:8000/health
curl http://localhost/health
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific service
docker stats interview_backend
```

### Logs Management

```bash
# Follow logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > application_logs.txt
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build images
        run: docker-compose build
      
      - name: Run tests
        run: docker-compose run backend pytest
      
      - name: Deploy
        run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Support

For issues and questions:
- Check logs: `make logs`
- Review troubleshooting section above
- Open an issue on GitHub

---

## License

[Your License Here]

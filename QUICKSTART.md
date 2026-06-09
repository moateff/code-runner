# Quick Start Guide

## Prerequisites
- Docker (20.10+)
- Docker Compose (1.29+)

## Quick Start (5 minutes)

### Option 1: Using build script (Recommended)
```bash
# Make script executable
chmod +x build.sh

# Build and start everything
./build.sh
```

### Option 2: Manual Docker Compose
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger

## Stop the Application
```bash
# Using script
./cleanup.sh

# Or manually
docker-compose down
```

## Troubleshooting
- Check logs: `docker-compose logs -f`
- View services: `docker-compose ps`
- Restart services: `docker-compose restart`

For detailed documentation, see README.md

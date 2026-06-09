# Dockerized Online Code Compiler

A production-quality online code compiler platform that allows users to write, compile, and execute code in multiple languages within a secure, isolated Docker environment.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Build Instructions](#build-instructions)
- [Run Instructions](#run-instructions)
- [API Documentation](#api-documentation)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Client                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  Nginx Reverse Proxy │
          │  (Port 4200)         │
          └──────────┬──────────┘
          │
┌─────────┴──────────┬──────────────────────────────┐
│                    │                              │
│                    ▼                              │
│         ┌──────────────────────┐                  │
│         │  Angular Frontend    │                  │
│         │  - Monaco Editor     │                  │
│         │  - Responsive UI     │                  │
│         │  - Standalone Comps  │                  │
│         └──────────┬───────────┘                  │
│                    │                              │
│                    │ HTTP/REST                    │
│                    ▼                              │
│         ┌──────────────────────┐                  │
│         │   ASP.NET Core 9     │                  │
│         │   Backend API        │                  │
│         │   (Port 8080)        │                  │
│         │ - Clean Architecture │                  │
│         │ - Validation         │                  │
│         │ - Logging (Serilog)  │                  │
│         │ - Docker Integration │                  │
│         └──────────┬───────────┘                  │
│                    │                              │
│        ┌───────────┘                              │
│        │ Docker API                               │
│        ▼                                          │
│ ┌──────────────────────────────────────────────┐  │
│ │  Docker Daemon                                │  │
│ │  └─ Spawns Isolated Runner Containers        │  │
│ │     • Ubuntu 24.04                           │  │
│ │     • C++ (g++), Python3, Java (OpenJDK)     │  │
│ │     • Resource Limits: 256MB RAM, 0.5 CPU    │  │
│ │     • Timeout: 5 seconds                     │  │
│ │     • Network: Disabled                      │  │
│ │     • Filesystem: Read-only (where possible) │  │
│ └──────────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘

Internal Network: compiler-network (bridge)
```

### Component Architecture

#### 1. **Frontend (Angular 20+)**
- **Framework**: Angular with standalone components and signals
- **Editor**: Monaco Editor for syntax highlighting and code editing
- **UI**: Bootstrap 5 for responsive design
- **Features**: Language selection, stdin input, stdout/stderr display, execution status
- **Port**: 4200 (via Nginx)

#### 2. **Backend (ASP.NET Core 9)**
- **Architecture**: Clean Architecture with layered separation
  - **API Layer**: REST endpoints, validation, error handling
  - **Application Layer**: Business logic, DTOs, services
  - **Domain Layer**: Entity definitions
  - **Infrastructure Layer**: Docker runner implementation
- **Logging**: Serilog for structured logging
- **Validation**: FluentValidation for request validation
- **Documentation**: Swagger/OpenAPI
- **Port**: 8080

#### 3. **Runner (Ubuntu 24.04)**
- **Languages**: C++, Python 3, Java 21
- **Execution**: Isolated Docker containers with strict resource limits
- **Scripts**: Language-specific compilation and execution scripts
- **Security**: No network access, memory/CPU limits, automatic cleanup

---

## Features

### Code Editor
- **Language Support**: C++, Python, Java
- **Monaco Editor**: Syntax highlighting, auto-completion, line numbers
- **Theme**: Dark theme for comfortable coding
- **Input Panel**: Support for stdin input

### Execution Features
- **Real-time Execution**: Run code with immediate feedback
- **Output Capture**: Separate stdout and stderr display
- **Execution Metrics**: Exit code and execution time
- **Error Handling**: Detailed error messages

### API
- **REST Endpoint**: `POST /api/compiler/run`
- **Health Check**: `GET /api/compiler/health`
- **Swagger Documentation**: Available at `/swagger/index.html`

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Angular | 20+ |
| **Frontend Build** | Node.js | 20 |
| **Frontend Serve** | Nginx | Alpine |
| **Backend** | ASP.NET Core | 9 |
| **Backend Runtime** | .NET Runtime | 9.0 |
| **Runner Base** | Ubuntu | 24.04 |
| **Compilers** | g++, Python, OpenJDK | Latest |
| **Container Orchestration** | Docker Compose | 3.8 |

---

## Project Structure

```
project/
├── frontend/                          # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/           # Reusable components
│   │   │   │   ├── language-selector.component.ts
│   │   │   │   ├── code-editor.component.ts
│   │   │   │   ├── input-panel.component.ts
│   │   │   │   └── output-panel.component.ts
│   │   │   ├── services/
│   │   │   │   └── compiler.service.ts
│   │   │   ├── models/
│   │   │   │   ├── run-request.ts
│   │   │   │   └── run-response.ts
│   │   │   └── app.component.ts      # Main component
│   │   ├── environments/
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   ├── main.ts
│   │   ├── index.html
│   │   └── styles.css
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
│
├── backend/                           # ASP.NET Core Backend
│   ├── src/
│   │   ├── Compiler.Api/             # API Layer
│   │   │   ├── Controllers/
│   │   │   │   └── CompilerController.cs
│   │   │   ├── Program.cs
│   │   │   ├── appsettings.json
│   │   │   ├── appsettings.Development.json
│   │   │   └── Compiler.Api.csproj
│   │   ├── Compiler.Application/     # Application Layer
│   │   │   ├── DTOs/
│   │   │   │   ├── RunRequest.cs
│   │   │   │   └── RunResponse.cs
│   │   │   ├── Interfaces/
│   │   │   │   ├── ICompilerService.cs
│   │   │   │   └── IDockerRunnerService.cs
│   │   │   ├── Services/
│   │   │   │   └── CompilerService.cs
│   │   │   ├── Validation/
│   │   │   │   └── RunRequestValidator.cs
│   │   │   └── Compiler.Application.csproj
│   │   ├── Compiler.Domain/          # Domain Layer
│   │   │   ├── Entities/
│   │   │   │   └── CompilationResult.cs
│   │   │   └── Compiler.Domain.csproj
│   │   └── Compiler.Infrastructure/  # Infrastructure Layer
│   │       ├── Services/
│   │       │   └── DockerRunnerService.cs
│   │       └── Compiler.Infrastructure.csproj
│   ├── Compiler.sln
│   ├── Dockerfile
│   └── .dockerignore
│
├── runner/                            # Code Runner Container
│   ├── scripts/
│   │   ├── run_cpp.sh               # C++ execution script
│   │   ├── run_python.sh            # Python execution script
│   │   └── run_java.sh              # Java execution script
│   ├── Dockerfile
│   └── .dockerignore
│
├── docker-compose.yml                 # Orchestration
├── README.md                          # This file
└── .gitignore
```

---

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows (WSL2)
- **Docker**: 20.10+
- **Docker Compose**: 1.29+
- **Disk Space**: 5GB+ for images and containers
- **Memory**: 2GB+ available RAM

### Software Requirements
- Git
- Docker Desktop or Docker Engine
- (Optional) .NET 9 SDK for local development
- (Optional) Node.js 20+ for local frontend development

### Installation

#### On Linux (Ubuntu/Debian)
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

#### On macOS
```bash
# Using Homebrew
brew install docker docker-compose

# Or install Docker Desktop from https://www.docker.com/products/docker-desktop
```

#### On Windows
- Install Docker Desktop from https://www.docker.com/products/docker-desktop
- Ensure WSL2 is configured

---

## Build Instructions

### Build All Images

```bash
# Clone or navigate to the project directory
cd /path/to/project

# Build all images (frontend, backend, and runner)
docker-compose build

# This will:
# 1. Build the runner image (code-runner:latest)
# 2. Build the backend image
# 3. Build the frontend image (Nginx with compiled Angular app)
```

### Build Individual Images

```bash
# Build only the runner image
docker build -t code-runner:latest runner/

# Build only the backend image
docker build -t compiler-backend backend/

# Build only the frontend image
docker build -t compiler-frontend frontend/
```

### Build with Custom Tags

```bash
# With custom registry
docker build -t myregistry.azurecr.io/code-runner:v1.0 runner/
docker build -t myregistry.azurecr.io/compiler-backend:v1.0 backend/
docker build -t myregistry.azurecr.io/compiler-frontend:v1.0 frontend/
```

---

## Run Instructions

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View running containers
docker-compose ps
```

### Manual Docker Execution

```bash
# Create a network
docker network create compiler-network

# Run the runner image (pre-built)
docker build -t code-runner:latest runner/

# Run the backend
docker run -d \
  --name compiler-backend \
  --network compiler-network \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  compiler-backend

# Run the frontend
docker run -d \
  --name compiler-frontend \
  --network compiler-network \
  -p 4200:80 \
  compiler-frontend
```

### Accessing the Application

Once running:

- **Frontend UI**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger
- **Health Check**: http://localhost:8080/api/compiler/health

### Environment Variables

Frontend:
```env
NODE_ENV=production
```

Backend:
```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
DOCKER_HOST=unix:///var/run/docker.sock
```

---

## API Documentation

### Endpoint: Compile and Run Code

**Request**
```http
POST /api/compiler/run
Content-Type: application/json

{
  "language": "cpp",
  "code": "#include <iostream>\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}",
  "input": ""
}
```

**Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | Yes | Language: `cpp`, `python`, or `java` |
| `code` | string | Yes | Source code (max 10000 characters) |
| `input` | string | No | Standard input for the program (max 5000 characters) |

**Response (Success)**
```json
{
  "success": true,
  "stdout": "Hello, World!\n",
  "stderr": "",
  "exitCode": 0,
  "executionTimeMs": 145
}
```

**Response (Compilation Error)**
```json
{
  "success": false,
  "stdout": "",
  "stderr": "error: invalid preprocessing directive #inclue [-Werror,-W#pragma-in-main-module]",
  "exitCode": 1,
  "executionTimeMs": 50
}
```

**Response (Validation Error)**
```http
400 Bad Request

{
  "errors": [
    "Language must be one of: cpp, python, java",
    "Code is required"
  ]
}
```

**Response (Timeout)**
```json
{
  "success": false,
  "stdout": "",
  "stderr": "Execution timeout (5 seconds exceeded)",
  "exitCode": -1,
  "executionTimeMs": 5000
}
```

**Status Codes**
| Code | Meaning |
|------|---------|
| 200 | Successful execution (check `success` field in response) |
| 400 | Validation error or timeout |
| 500 | Server error |

### Example Requests

#### C++ Example
```bash
curl -X POST http://localhost:8080/api/compiler/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "cpp",
    "code": "#include <iostream>\nint main() { std::cout << \"Hello\" << std::endl; return 0; }",
    "input": ""
  }'
```

#### Python Example
```bash
curl -X POST http://localhost:8080/api/compiler/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, World!\")",
    "input": ""
  }'
```

#### Java Example
```bash
curl -X POST http://localhost:8080/api/compiler/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "java",
    "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello\"); } }",
    "input": ""
  }'
```

#### With Input
```bash
curl -X POST http://localhost:8080/api/compiler/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "x = input()\nprint(f\"You entered: {x}\")",
    "input": "test input"
  }'
```

### Health Check Endpoint

**Request**
```http
GET /api/compiler/health
```

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-07T12:34:56Z"
}
```

---

## Security Considerations

### Container Isolation
- Each code execution runs in a **separate, ephemeral Docker container**
- Containers are automatically destroyed after execution
- Complete filesystem isolation using Docker overlayfs

### Resource Limits
- **Memory**: 256 MB per container (prevents memory exhaustion)
- **CPU**: 0.5 CPU cores (prevents CPU hogging)
- **Timeout**: 5 seconds (prevents infinite loops)
- **Network**: Disabled (`--network none`)
- **Filesystem**: Read-only where possible

### Input Validation
- **Code Length**: Maximum 10,000 characters
- **Input Length**: Maximum 5,000 characters
- **Language**: Whitelist validation (cpp, python, java only)
- **FluentValidation**: Server-side validation of all requests

### Code Execution Safety
- Runs as non-root user (UID 1000)
- No shell access
- No file system persistence
- Automatic cleanup of temporary files
- Docker daemon socket mounted read-write (backend only)

### Network Security
- CORS enabled for frontend origin
- API runs on internal network
- Docker socket limited to backend container
- Frontend served via Nginx reverse proxy

### Deployment Recommendations
1. Use Docker Compose with declared networks
2. Run backend with minimal Docker socket permissions
3. Implement rate limiting in production
4. Use HTTPS in production (configure Nginx SSL)
5. Monitor container resource usage
6. Regular security updates for base images
7. Run on isolated infrastructure
8. Implement request logging and auditing

---

## Troubleshooting

### Issue: Cannot connect to Docker daemon

**Solution**:
```bash
# Ensure Docker is running
sudo systemctl start docker

# Check Docker socket permissions
sudo chmod 666 /var/run/docker.sock

# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: Backend container exits immediately

**Solution**:
```bash
# Check logs
docker-compose logs backend

# Verify Docker socket is mounted
docker inspect compiler-backend | grep -A 5 Mounts

# Ensure proper permissions
ls -la /var/run/docker.sock
```

### Issue: Frontend can't connect to backend

**Solution**:
```bash
# Verify services are running
docker-compose ps

# Check network connectivity
docker network inspect compiler-network

# Verify API endpoint in frontend environment config
cat frontend/src/environments/environment.ts
```

### Issue: Code execution timeout

**Solution**:
```bash
# This is expected for infinite loops
# The 5-second timeout is by design

# For development, modify TIMEOUT_SECONDS in DockerRunnerService.cs
# Rebuild: docker-compose build
```

### Issue: Port already in use

**Solution**:
```bash
# Find process using the port
lsof -i :4200
lsof -i :8080

# Kill the process (if safe)
kill -9 <PID>

# Or use different ports in docker-compose.yml
```

### Issue: Out of disk space

**Solution**:
```bash
# Clean up Docker resources
docker system prune -a

# Remove dangling containers
docker container prune

# Check disk usage
du -sh /var/lib/docker/

# Increase Docker disk limit in Docker Desktop settings
```

### Issue: Slow code execution

**Causes**:
- System resource constraints
- Slow compiler (C++ compilation)
- Network latency

**Solutions**:
```bash
# Monitor system resources
docker stats

# Increase memory limit in DockerRunnerService.cs
# Rebuild and restart containers
```

---

## Development

### Local Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Navigate to http://localhost:4200
# The app will automatically reload on code changes

# Build for production
npm run build:prod
```

### Local Backend Development

```bash
cd backend

# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run the API
dotnet run --project src/Compiler.Api

# Navigate to http://localhost:5000 (or configured port)
```

### Environment Configuration

#### Frontend
Edit `frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // Backend API URL
};
```

#### Backend
Edit `backend/src/Compiler.Api/appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft": "Information"
    }
  }
}
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
dotnet test
```

### Code Structure Best Practices

**Frontend**:
- Use standalone components for modularity
- Leverage Angular signals for state management
- Keep services focused and testable
- Use reactive forms for validation

**Backend**:
- Follow Clean Architecture principles
- Separate concerns across layers
- Use dependency injection
- Implement proper logging with Serilog
- Validate input at API boundaries

---

## Performance Optimization

### Frontend Optimization
- **Bundle Analysis**: Use `ng build --stats-json`
- **Lazy Loading**: Route-based code splitting
- **Minification**: Production builds are minified
- **Compression**: Nginx gzip compression enabled
- **Caching**: Browser caching via Nginx headers

### Backend Optimization
- **Async/Await**: Non-blocking operations
- **Connection Pooling**: Efficient Docker API usage
- **Logging**: Structured logging minimizes overhead
- **Health Checks**: Prevent unhealthy container restart loops

### Container Optimization
- **Alpine Linux**: Lightweight base images
- **Multi-stage Builds**: Reduces final image size
- **Layer Caching**: Speeds up rebuilds
- **Resource Limits**: Prevents runaway processes

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Security review completed
- [ ] All tests passing
- [ ] Performance baseline established
- [ ] Resource limits tested
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Disaster recovery plan documented

### Deployment Steps

1. **Prepare Registry**
```bash
docker tag code-runner:latest myregistry/code-runner:v1.0
docker tag compiler-backend:latest myregistry/compiler-backend:v1.0
docker tag compiler-frontend:latest myregistry/compiler-frontend:v1.0
docker push myregistry/code-runner:v1.0
docker push myregistry/compiler-backend:v1.0
docker push myregistry/compiler-frontend:v1.0
```

2. **Deploy to Kubernetes (Optional)**
```bash
# Create Kubernetes manifests from docker-compose
kompose convert -f docker-compose.yml

# Apply to cluster
kubectl apply -f .
```

3. **Configure Production Environment**
```yaml
# Update docker-compose.yml or Kubernetes manifests
environment:
  ASPNETCORE_ENVIRONMENT: Production
  LOG_LEVEL: Information
```

4. **Set Up Monitoring**
```bash
# Configure health checks, logging aggregation, and alerting
# Examples: Prometheus, ELK Stack, Grafana
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## License

[Specify your license here]

---

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Review existing documentation
- Check troubleshooting section above

---

## Changelog

### Version 1.0.0
- Initial release
- Support for C++, Python, and Java
- Full Docker containerization
- Angular 20+ frontend with Monaco Editor
- ASP.NET Core 9 backend with clean architecture
- Comprehensive API documentation

---

## Acknowledgments

Built with best practices from:
- Clean Architecture by Robert C. Martin
- ASP.NET Core Best Practices
- Angular Style Guide
- Docker Best Practices

---

**Last Updated**: June 7, 2026
**Status**: Production-Ready ✓

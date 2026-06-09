# Code Runner Backend

A .NET-based API for compiling and executing code in isolated Docker containers.

## Overview

This project provides a RESTful API for running code compilation and execution tasks. It uses Docker to ensure safe and isolated code execution environments.

## Architecture

The solution is organized into multiple layers following clean architecture principles:

- **Compiler.Api** - Entry point; contains controllers and configuration
- **Compiler.Application** - Business logic, DTOs, validation, and service interfaces
- **Compiler.Domain** - Core entities and domain models
- **Compiler.Infrastructure** - External service implementations (Docker runner)

## Prerequisites

- .NET 10.0 SDK
- Docker
- Docker daemon running

## Getting Started

### Build

```bash
dotnet build
```

### Run

```bash
dotnet run --project src/Compiler.Api
```

The API will be available at `https://localhost:5001` or `http://localhost:5000`

### Docker

Build and run using Docker:

```bash
docker build -t code-runner-backend .
docker run -p 5000:5000 code-runner-backend
```

## Project Structure

```
src/
├── Compiler.Api/           # REST API layer
│   ├── Controllers/        # API endpoints
│   ├── Program.cs          # Application startup
│   └── appsettings.json    # Configuration
├── Compiler.Application/   # Application services
│   ├── DTOs/               # Data transfer objects
│   ├── Interfaces/         # Service interfaces
│   ├── Services/           # Business logic
│   └── Validation/         # Request validation
├── Compiler.Domain/        # Domain models
│   └── Entities/           # Core domain entities
└── Compiler.Infrastructure/ # External services
    └── Services/           # Docker integration
```

## API Endpoints

### Run Code

- **POST** `/api/compiler/run`
- Executes code and returns the result
- Request body: `RunRequest` with code and language
- Response: `RunResponse` with output or error

## Configuration

Edit `appsettings.json` to customize:
- Docker image settings
- Timeout configurations
- Logging levels
- API host and port

## Logging

Logs are written to the `Logs/` directory with daily log files.

## License

MIT
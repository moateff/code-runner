# Development Guide

This guide provides instructions for developers working on the Code Compiler project.

## Table of Contents
- [Development Setup](#development-setup)
- [Frontend Development](#frontend-development)
- [Backend Development](#backend-development)
- [Local Testing](#local-testing)
- [Debugging](#debugging)
- [Code Standards](#code-standards)

---

## Development Setup

### Prerequisites
- Node.js 20+ (for frontend)
- .NET 9 SDK (for backend)
- Docker (for runner container)
- Docker Compose
- Git
- Code Editor: VS Code recommended

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd project

# Setup permissions
chmod +x *.sh runner/scripts/*.sh
```

---

## Frontend Development

### Install Dependencies
```bash
cd frontend
npm install
```

### Development Server
```bash
# Terminal 1: Start development server with hot reload
npm start

# Navigate to http://localhost:4200
```

### Recommended VS Code Extensions
- Angular Language Service
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint

### Project Structure
```
frontend/src/
├── app/
│   ├── components/          # Reusable UI components
│   ├── services/            # Business logic and API calls
│   ├── models/              # TypeScript interfaces
│   ├── app.component.ts     # Main component
├── environments/            # Environment-specific config
├── styles.css               # Global styles
└── main.ts                  # Bootstrap application
```

### Key Development Tasks

#### Creating a New Component
```bash
# Generate a new component (if using Angular CLI)
ng generate component components/my-component
```

#### Adding a Service
```typescript
// frontend/src/app/services/my-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MyService {
  constructor(private http: HttpClient) { }
  
  getData(): Observable<any> {
    return this.http.get('/api/endpoint');
  }
}
```

#### Using Signals (Angular 20+)
```typescript
import { signal, computed } from '@angular/core';

export class MyComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(c => c + 1);
  }
}
```

### Testing
```bash
# Run unit tests
npm test

# Build for production
npm run build:prod
```

### Code Style
- Use TypeScript strict mode
- Follow Angular style guide
- Use meaningful variable names
- Add comments for complex logic
- Keep components small and focused

---

## Backend Development

### Prerequisites
```bash
# Install .NET SDK
# Visit: https://dotnet.microsoft.com/download/dotnet/9.0
```

### Development Setup
```bash
cd backend

# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run in development
dotnet run --project src/Compiler.Api
```

### Project Structure
```
backend/src/
├── Compiler.Api/                # Web API layer
│   ├── Controllers/             # API endpoints
│   ├── Program.cs               # Startup configuration
│   └── appsettings.json         # Configuration
├── Compiler.Application/        # Business logic
│   ├── Services/                # Core services
│   ├── DTOs/                    # Data transfer objects
│   ├── Validation/              # Input validation
│   └── Interfaces/              # Service contracts
├── Compiler.Domain/             # Domain models
│   └── Entities/                # Business entities
└── Compiler.Infrastructure/     # External integrations
    └── Services/                # Docker integration
```

### Key Development Tasks

#### Adding a New Service
```csharp
// 1. Define interface in Application/Interfaces
public interface IMyService
{
    Task<MyResult> GetAsync(CancellationToken cancellationToken);
}

// 2. Implement in Application/Services
public class MyService : IMyService
{
    public async Task<MyResult> GetAsync(CancellationToken cancellationToken)
    {
        // Implementation
    }
}

// 3. Register in Program.cs
builder.Services.AddScoped<IMyService, MyService>();
```

#### Adding API Endpoint
```csharp
// Controllers/MyController.cs
[ApiController]
[Route("api/[controller]")]
public class MyController : ControllerBase
{
    private readonly IMyService _service;

    public MyController(IMyService service)
    {
        _service = service;
    }

    [HttpPost("endpoint")]
    public async Task<IActionResult> MyEndpoint([FromBody] MyRequest request)
    {
        var result = await _service.GetAsync(CancellationToken.None);
        return Ok(result);
    }
}
```

#### Adding Validation
```csharp
// Application/Validation/MyRequestValidator.cs
public class MyRequestValidator : AbstractValidator<MyRequest>
{
    public MyRequestValidator()
    {
        RuleFor(x => x.Property)
            .NotEmpty().WithMessage("Property is required")
            .MaximumLength(100).WithMessage("Max 100 characters");
    }
}

// Register in Program.cs
builder.Services.AddScoped<IValidator<MyRequest>, MyRequestValidator>();
```

### Testing
```bash
# Run unit tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true

# Publish for deployment
dotnet publish -c Release
```

### Logging
```csharp
_logger.LogInformation("Info message: {Property}", value);
_logger.LogWarning("Warning message");
_logger.LogError(exception, "Error message");
```

### Code Standards
- Use async/await throughout
- Use dependency injection
- Validate inputs
- Handle exceptions gracefully
- Use meaningful naming
- Write structured logs

---

## Local Testing

### Test All Services Together

```bash
# Terminal 1: Start backend
cd backend
dotnet run --project src/Compiler.Api

# Terminal 2: Start frontend
cd frontend
npm start

# Terminal 3: Test API
curl -X POST http://localhost:5000/api/compiler/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, World!\")",
    "input": ""
  }'
```

### Docker Testing

```bash
# Build and test with Docker
docker-compose build
docker-compose up -d

# Test the running containers
curl http://localhost:8080/api/compiler/health
curl http://localhost:4200

# View logs
docker-compose logs -f
```

---

## Debugging

### Frontend Debugging

#### VS Code Debugger
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "ng serve",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

#### Browser DevTools
- Press F12 in Chrome/Firefox
- Use Console tab to execute TypeScript
- Use Network tab to inspect API calls
- Use Application tab to view localStorage

### Backend Debugging

#### VS Code Debugger
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": ".NET Core Launch",
      "type": "coreclr",
      "request": "launch",
      "program": "${workspaceFolder}/backend/bin/Debug/net9.0/Compiler.Api.dll",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

#### Debug Output
```csharp
// Add debug logging
_logger.LogDebug("Debug information: {@DebugData}", debugObject);

// In appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  }
}
```

#### API Testing with Postman/Insomnia
1. Open Postman
2. Create new request
3. Set method to POST
4. Set URL to `http://localhost:8080/api/compiler/run`
5. Add JSON body with code
6. Send and inspect response

---

## Code Standards

### TypeScript
```typescript
// ✅ Good
private readonly logger = inject(LoggerService);
const result = computed(() => this.data() * 2);

// ❌ Avoid
var oldWay = "avoid var";
let mutableValue = "should be const if not changed";
```

### C#
```csharp
// ✅ Good
public async Task<Result> ProcessAsync(CancellationToken cancellationToken)
{
    try
    {
        var result = await _service.GetAsync(cancellationToken);
        _logger.LogInformation("Processed");
        return result;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed");
        throw;
    }
}

// ❌ Avoid
public Result Process()
{
    var result = _service.Get();
    return result;
}
```

### Naming Conventions
- **Classes**: PascalCase (MyClassName)
- **Methods**: PascalCase (MyMethodName)
- **Properties**: PascalCase (MyProperty)
- **Private fields**: _camelCase (_myField)
- **Constants**: UPPER_SNAKE_CASE (MAX_SIZE)
- **Variables**: camelCase (myVariable)
- **Interfaces**: IPascalCase (IMyInterface)

### Comments and Documentation
```csharp
/// <summary>
/// Processes the compilation request
/// </summary>
/// <param name="request">The compilation request</param>
/// <param name="cancellationToken">Cancellation token</param>
/// <returns>Compilation result</returns>
public async Task<CompilationResult> ProcessAsync(
    RunRequest request, 
    CancellationToken cancellationToken)
{
    // Implementation here
}
```

---

## Useful Commands

### Frontend
```bash
cd frontend

npm install              # Install dependencies
npm start                # Start dev server
npm run build:prod       # Production build
npm test                 # Run tests
npm run lint             # Run linter
npm run format           # Format code
```

### Backend
```bash
cd backend

dotnet restore           # Restore dependencies
dotnet build             # Build solution
dotnet run               # Run API
dotnet test              # Run tests
dotnet clean             # Clean build artifacts
dotnet publish           # Publish for deployment
```

### Docker
```bash
docker-compose build     # Build images
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs -f   # View logs
docker-compose ps        # Show running services
docker system prune      # Clean up resources
```

---

## Git Workflow

### Branch Naming
```
feature/description
bugfix/description
refactor/description
docs/description
```

### Commit Messages
```
[FEATURE] Add new functionality
[BUGFIX] Fix issue with X
[REFACTOR] Improve code structure
[DOCS] Update documentation
[TEST] Add tests for feature X
```

### Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "[FEATURE] Add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request
# Request review from team
# Address feedback
# Merge to main
```

---

## Troubleshooting Development Issues

### Frontend Issues

**Port 4200 already in use**
```bash
lsof -i :4200
kill -9 <PID>
```

**node_modules corrupted**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Angular compilation errors**
```bash
npm run clean
npm install
npm start
```

### Backend Issues

**Port 5000/8080 already in use**
```bash
dotnet run --urls "http://localhost:5001"
```

**NuGet restore issues**
```bash
dotnet restore --force
```

**Docker daemon not running**
```bash
systemctl start docker
# or open Docker Desktop
```

---

## Performance Profiling

### Frontend
```bash
# Build with source maps
ng build --source-map

# Analyze bundle size
ng build --stats-json
webpack-bundle-analyzer dist/code-compiler/stats.json
```

### Backend
```bash
# Profile with dotTrace (JetBrains)
# Or use built-in diagnostics
dotnet run --trace
```

---

## Continuous Integration (CI)

### GitHub Actions Example
```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 9.0.x
      
      - name: Build Backend
        run: cd backend && dotnet build
      
      - name: Build Frontend
        run: cd frontend && npm install && npm run build:prod
```

---

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## Getting Help

1. Check the main README.md
2. Check existing issues
3. Review code documentation
4. Ask team members
5. Consult technology documentation

---

**Happy Coding!** 🚀

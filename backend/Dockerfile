FROM mcr.microsoft.com/dotnet/sdk:10.0 AS builder

WORKDIR /src

COPY Compiler.sln ./

COPY src/Compiler.Api/Compiler.Api.csproj src/Compiler.Api/
COPY src/Compiler.Application/Compiler.Application.csproj src/Compiler.Application/
COPY src/Compiler.Domain/Compiler.Domain.csproj src/Compiler.Domain/
COPY src/Compiler.Infrastructure/Compiler.Infrastructure.csproj src/Compiler.Infrastructure/

RUN dotnet restore Compiler.sln

COPY . .

RUN dotnet build Compiler.sln -c Release -o /app/build

RUN dotnet publish src/Compiler.Api/Compiler.Api.csproj \
-c Release \
-o /app/publish \
--no-restore

# Runtime

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

# Install Docker CLI

RUN apt-get update && \
apt-get install -y docker.io && \
rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/publish .

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Compiler.Api.dll"]

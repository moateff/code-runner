#!/bin/bash

# Build and start the Code Compiler application
# This script provides a convenient way to build and run the entire application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    print_info "All prerequisites met"
}

# Build images
build_images() {
    print_info "Building Docker images..."
    # docker-compose build --no-cache
    docker-compose --profile build-only build 
    print_info "Images built successfully"
}

# Start services
start_services() {
    print_info "Starting services..."
    docker-compose up -d
    print_info "Services started"
}

# Show status
show_status() {
    print_info "Service status:"
    docker-compose ps
}

# Show access information
show_access_info() {
    echo ""
    print_info "Application is ready!"
    echo ""
    echo "Access the application:"
    echo "  Frontend:    http://localhost:81"
    echo "  Backend:     http://localhost:8080"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker-compose logs -f"
    echo "  Stop:         docker-compose down"
    echo "  Restart:      docker-compose restart"
    echo ""
}

# Main
main() {
    print_info "Starting Code Compiler application..."
    echo ""

    check_prerequisites
    build_images
    start_services
    show_status
    show_access_info

    print_info "Setup complete! 🚀"
}

# Run main
main "$@"

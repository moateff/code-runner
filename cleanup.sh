#!/bin/bash

# Stop and cleanup the Code Compiler application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Stopping Code Compiler application...${NC}"
docker-compose down

echo -e "${GREEN}Cleanup complete!${NC}"

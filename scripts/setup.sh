#!/bin/bash

# Housing Trends Dashboard - Initial Setup Script
set -e

echo "🏠 Housing Trends Dashboard - Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
    fi
}

echo -e "\n${YELLOW}Checking prerequisites...${NC}"
check_command node
check_command pnpm
check_command docker
check_command docker-compose

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version must be 20 or higher${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js version is compatible${NC}"
fi

# Create environment file
if [ ! -f .env.local ]; then
    echo -e "\n${YELLOW}Creating .env.local file...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✅ .env.local created${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
pnpm install

# Start Docker services
echo -e "\n${YELLOW}Starting Docker services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
check_service() {
    if docker-compose ps | grep -q "$1.*Up"; then
        echo -e "${GREEN}✅ $1 is running${NC}"
    else
        echo -e "${RED}❌ $1 is not running${NC}"
        exit 1
    fi
}

check_service "postgres"
check_service "redis"
check_service "mailhog"

# Create database tables (when Prisma is set up)
# echo -e "\n${YELLOW}Running database migrations...${NC}"
# pnpm db:migrate

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo -e "\nServices running:"
echo -e "  • PostgreSQL: ${GREEN}localhost:5432${NC}"
echo -e "  • Redis: ${GREEN}localhost:6379${NC}"
echo -e "  • MailHog: ${GREEN}localhost:8025${NC}"
echo -e "  • Adminer: ${GREEN}localhost:8080${NC}"

echo -e "\nNext steps:"
echo -e "  1. Update .env.local with your API keys"
echo -e "  2. Run ${YELLOW}pnpm dev${NC} to start development servers"
echo -e "  3. Visit ${GREEN}http://localhost:3000${NC}"

echo -e "\n${YELLOW}Happy coding! 🚀${NC}"
#!/bin/bash

# CoffeeHouse Docker Quick Start Script

set -e

echo "☕ CoffeeHouse Docker Setup"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Build and start containers
echo "🔨 Building and starting containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
echo ""
echo "📊 Container status:"
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi

echo ""
echo "🌱 Seeding database (this may take a moment)..."
if command -v docker-compose &> /dev/null; then
    docker-compose exec -T app npm run db:seed || echo "⚠️  Seed may have already run or failed. Check logs with: docker-compose logs app"
else
    docker compose exec -T app npm run db:seed || echo "⚠️  Seed may have already run or failed. Check logs with: docker compose logs app"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Your application is available at:"
echo "   - Main app: http://localhost:3000"
echo "   - Admin panel: http://localhost:3000/admin/login"
echo ""
echo "📝 Default admin credentials:"
echo "   - Email: admin@coffeehouse.kz"
echo "   - Password: admin123"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop: docker-compose down"
echo "   - Restart: docker-compose restart"
echo ""


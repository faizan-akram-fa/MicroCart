#!/bin/bash

echo "🚀 E-Commerce Microservices Quick Start"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env files if they don't exist
echo "📝 Setting up environment files..."

for service in user-service product-service cart-service order-service wishlist-service api-gateway; do
    if [ ! -f "services/$service/.env" ]; then
        echo "Creating .env for $service..."
        cp "services/$service/.env.example" "services/$service/.env" 2>/dev/null || echo ".env already exists or example not found"
    fi
done

echo "✅ Environment files ready"
echo ""

# Build and start services
echo "🏗️  Building and starting all services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🎉 All services are starting up!"
echo ""
echo "📡 Service URLs:"
echo "   API Gateway:      http://localhost:3000/api"
echo "   User Service:     http://localhost:3001"
echo "   Product Service:  http://localhost:3002"
echo "   Cart Service:     http://localhost:3003"
echo "   Order Service:    http://localhost:3004"
echo "   Wishlist Service: http://localhost:3005"
echo ""
echo "📊 Database Ports:"
echo "   User DB:     localhost:5433"
echo "   Product DB:  localhost:5434"
echo "   Cart DB:     localhost:5435"
echo "   Order DB:    localhost:5436"
echo "   Wishlist DB: localhost:5437"
echo ""
echo "🔍 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
echo "📚 Read COMPLETE_GUIDE.md for full documentation"
echo "📖 Read README.md for quick setup instructions"
echo ""
echo "✨ Happy coding!"

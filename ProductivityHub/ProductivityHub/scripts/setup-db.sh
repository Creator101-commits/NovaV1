#!/bin/bash
# Development database setup script

echo "Setting up local PostgreSQL database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL container
docker-compose up -d postgres

echo "PostgreSQL is starting up..."
echo "Database will be available at: postgresql://postgres:password@localhost:5432/refyneo_db"

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run database migrations
echo "Running database migrations..."
npm run db:push

echo "Database setup complete!"
echo "You can now run 'npm run dev' to start the application."

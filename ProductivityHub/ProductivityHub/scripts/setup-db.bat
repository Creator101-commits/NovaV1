@echo off
REM Windows database setup script

REM Navigate to project root from scripts directory
cd /d "%~dp0\.."

echo Setting up local PostgreSQL database...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Start PostgreSQL container
docker-compose up -d postgres

echo PostgreSQL is starting up...
echo Database will be available at: postgresql://postgres:password@localhost:5432/refyneo_db

REM Wait for database to be ready
echo Waiting for database to be ready...
timeout /t 5 /nobreak >nul

REM Run database migrations
echo Running database migrations...
npm run db:push

echo Database setup complete!
echo You can now run 'npm run dev' to start the application.

#!/bin/sh
set -eu

if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is not installed."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "ERROR: Docker Compose is not available."
    exit 1
fi

if [ ! -f .env ]; then
    if ! command -v openssl >/dev/null 2>&1; then
        echo "ERROR: OpenSSL is required to generate secrets."
        exit 1
    fi

    echo "Generating local environment configuration..."

    DB_PASSWORD=$(openssl rand -hex 24)
    JWT_SECRET=$(openssl rand -hex 32)

    umask 077

    cat > .env <<ENVFILE
POSTGRES_USER=securescope
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=securescope

DATABASE_URL=postgresql+psycopg://securescope:$DB_PASSWORD@db:5432/securescope
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

VITE_API_URL=http://localhost:8000
ENVFILE

    chmod 600 .env
    echo "Local .env created successfully."
else
    echo "Existing .env detected. Keeping current configuration."
fi

if ! grep -q '^JWT_SECRET_KEY=.' .env; then
    echo "ERROR: JWT_SECRET_KEY is missing in .env."
    exit 1
fi

if ! docker compose config --quiet; then
    echo "ERROR: Invalid Docker Compose configuration."
    exit 1
fi

echo "Starting Secure Scope..."
docker compose up -d --build

echo ""
echo "Container status:"
docker compose ps

echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "Check backend health with:"
echo "curl -i http://localhost:8000/health"

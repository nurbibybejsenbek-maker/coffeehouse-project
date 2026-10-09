#!/bin/sh
set -e

echo "Checking SQLite database..."
# For SQLite, database file should be mounted via volume
if [ -f "prisma/dev.db" ] || [ -f "/app/prisma/dev.db" ]; then
  echo "✅ SQLite database found"
else
  echo "Creating SQLite database..."
  prisma db push --accept-data-loss --skip-generate || echo "Database will be created on first use"
fi

# Prisma Client should already be generated in builder stage
echo "Prisma Client should be available from build"

echo "✅ Database is ready!"
echo "Starting application..."
exec "$@"


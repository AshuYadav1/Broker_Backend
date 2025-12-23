#!/bin/bash

# set -e

DB_NAME="video_db"
DB_USER="royal_admin"
DB_PASS="RoyalKey@2025" # You can change this if you want

echo "🐘 Installing PostgreSQL..."
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

echo "🛠 Configuring Database..."
# Start Postgres
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create User and DB
# switch to postgres user to run psql commands
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || echo "User might already exist"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || echo "DB might already exist"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
# Fix permissions for Schema (Required for Prisma db push on newer PG versions)
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "📝 Updating .env file..."
# We will overwrite the .env with the production one
cat > /var/www/video-server/.env <<EOF
PORT=3001
# Production DB Connection
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
JWT_SECRET="super-secret-key-change-this-In-Prod"
EOF

echo "🚀 Applying Migrations..."
cd /var/www/video-server
# Ensure we have dependencies
npm install
# Run migration
npx prisma migrate deploy

echo "🔄 Restarting Server..."
pm2 restart video-server

echo "✅ Database Setup Complete!"

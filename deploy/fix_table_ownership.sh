#!/bin/bash

# Fix ownership of all tables to royal_admin
echo "🔧 Fixing table ownership..."

sudo -u postgres psql -d video_db <<EOF
ALTER TABLE "Property" OWNER TO royal_admin;
ALTER TABLE "User" OWNER TO royal_admin;
ALTER TABLE "Admin" OWNER TO royal_admin;
ALTER TABLE "Location" OWNER TO royal_admin;
ALTER TABLE "Interaction" OWNER TO royal_admin;
ALTER TABLE "Banner" OWNER TO royal_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO royal_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO royal_admin;
EOF

echo "✅ Table ownership fixed!"

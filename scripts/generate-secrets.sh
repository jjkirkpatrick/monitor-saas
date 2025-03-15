#!/bin/bash

# Check if .env.secrets already exists
if [ -f deploy/kubernetes/.env.secrets ]; then
    echo "Warning: deploy/kubernetes/.env.secrets already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Copy example file
cp deploy/kubernetes/.env.secrets.example deploy/kubernetes/.env.secrets

# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
TIMESCALE_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 32)

# Replace placeholders with secure passwords
sed -i.bak "s/POSTGRES_PASSWORD=changeme/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" deploy/kubernetes/.env.secrets
sed -i.bak "s/TIMESCALE_PASSWORD=changeme/TIMESCALE_PASSWORD=$TIMESCALE_PASSWORD/" deploy/kubernetes/.env.secrets
sed -i.bak "s/REDIS_PASSWORD=changeme/REDIS_PASSWORD=$REDIS_PASSWORD/" deploy/kubernetes/.env.secrets
sed -i.bak "s/GRAFANA_PASSWORD=changeme/GRAFANA_PASSWORD=$GRAFANA_PASSWORD/" deploy/kubernetes/.env.secrets

# Update DSNs with new passwords
POSTGRES_DSN="postgresql://monitoring:$POSTGRES_PASSWORD@postgres:5432/monitoring?sslmode=disable"
TIMESCALE_DSN="postgresql://monitoring:$TIMESCALE_PASSWORD@timescaledb:5432/monitoring_metrics?sslmode=disable"

sed -i.bak "s|POSTGRES_DSN=.*|POSTGRES_DSN=$POSTGRES_DSN|" deploy/kubernetes/.env.secrets
sed -i.bak "s|TIMESCALE_DSN=.*|TIMESCALE_DSN=$TIMESCALE_DSN|" deploy/kubernetes/.env.secrets

# Clean up backup files
rm deploy/kubernetes/.env.secrets.bak

echo "Generated secure passwords and updated deploy/kubernetes/.env.secrets"
echo
echo "Next steps:"
echo "1. Configure Auth0:"
echo "   - Update AUTH0_DOMAIN"
echo "   - Update AUTH0_CLIENT_ID"
echo "   - Update AUTH0_CLIENT_SECRET"
echo "   - Update AUTH0_AUDIENCE"
echo
echo "2. Configure SMTP:"
echo "   - Update SMTP_HOST"
echo "   - Update SMTP_PORT"
echo "   - Update SMTP_USERNAME"
echo "   - Update SMTP_PASSWORD"
echo
echo "3. Configure Slack:"
echo "   - Update SLACK_WEBHOOK_URL"
echo
echo "Review the generated file at deploy/kubernetes/.env.secrets"

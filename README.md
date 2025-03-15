# Monitoring Stack

A comprehensive website and service monitoring platform built with Go microservices and Next.js.

## Project Structure

```
.
├── config/                 # Configuration files for observability tools
├── deploy/                # Deployment configurations
│   ├── docker/           # Docker-specific configurations
│   └── kubernetes/       # Kubernetes manifests
├── frontend/             # Next.js frontend application
├── pkg/                  # Shared Go packages
├── proto/                # Protocol buffer definitions
├── scripts/             # Utility scripts
├── services/            # Microservices
│   ├── alert-system/    # Alert management services
│   ├── api-gateway/     # API Gateway service
│   ├── data-processing/ # Data processing services
│   └── monitoring-engine/ # Core monitoring services
└── tools/               # Development tools
```

## Services

### API Gateway
- Main entry point for all client requests
- Handles authentication and rate limiting
- Routes requests to appropriate services

### Monitoring Engine
- **Scheduler**: Manages monitoring check schedules
- **Probe Manager**: Distributes checks to probe workers
- **Probe Worker**: Executes monitoring checks

### Data Processing
- **Ingestion Service**: Handles monitoring results
- **Analytics Service**: Processes historical data

### Alert System
- **Alert Manager**: Evaluates alert conditions
- **Notification Service**: Delivers alerts via multiple channels

## Technology Stack

### Backend
- Go for microservices
- NATS for message queue
- PostgreSQL with TimescaleDB for time series data
- Redis for caching
- Auth0 for authentication

### Frontend
- Next.js with TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- Auth0 React SDK for authentication

### Observability
- Prometheus for metrics
- Grafana for visualization
- Loki for log aggregation
- Tempo for distributed tracing

## Local Development Setup

1. Install prerequisites:
   ```bash
   # Install Go
   brew install go

   # Install Node.js
   brew install node

   # Install Docker
   brew install --cask docker
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/monitoring-stack.git
   cd monitoring-stack
   ```

3. Set up environment variables:
   ```bash
   # Copy example env files
   cp frontend/.env.example frontend/.env.local
   ```

4. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install Go dependencies
   go mod download
   ```

5. Start the development environment:
   ```bash
   # Start all services using Docker Compose
   docker-compose up -d

   # Start frontend development server
   cd frontend && npm run dev
   ```

6. Access the services:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080
   - Grafana: http://localhost:3001
   - Prometheus: http://localhost:9090

## Configuration

### Auth0 Setup
1. Create an Auth0 account and application
2. Configure the following environment variables:
   ```
   NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain.auth0.com
   NEXT_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id
   NEXT_PUBLIC_AUTH0_AUDIENCE=your-auth0-audience
   ```

### Database Setup
1. PostgreSQL and TimescaleDB are automatically configured via Docker Compose
2. Default credentials (for development only):
   ```
   POSTGRES_USER=monitoring
   POSTGRES_PASSWORD=monitoring
   POSTGRES_DB=monitoring
   ```

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure:
   - All tests pass
   - Code is properly formatted
   - No linting errors

3. Submit a pull request with:
   - Clear description of changes
   - Any relevant documentation updates
   - Screenshots for UI changes

## Testing

```bash
# Run backend tests
go test ./...

# Run frontend tests
cd frontend && npm test
```

## Deployment

The application can be deployed using either Docker Compose or Kubernetes:

### Docker Compose (Production)
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
kubectl apply -f deploy/kubernetes/
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

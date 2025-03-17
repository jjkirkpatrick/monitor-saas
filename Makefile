# Development commands
.PHONY: dev build test lint clean docker-build docker-push

# Variables
DOCKER_REGISTRY ?= monitoring
VERSION ?= latest
SERVICES := api-gateway scheduler probe-manager probe-worker ingestion-service analytics-service alert-manager notification-service

# Development
dev:
	cd frontend && npm run dev

# Build commands
build: build-frontend build-services

build-frontend:
	cd frontend && npm run build

build-services:
	@for service in $(SERVICES); do \
		echo "Building $$service..." ; \
		go build -o bin/$$service ./services/$$service ; \
	done

# Test commands
test: test-frontend test-services

test-frontend:
	cd frontend && npm test

test-services:
	go test ./...

# Lint commands
lint: lint-frontend lint-services

lint-frontend:
	cd frontend && npm run lint

lint-services:
	golangci-lint run

# Clean commands
clean:
	rm -rf bin/
	cd frontend && npm run clean

# Docker commands
docker-build:
	@for service in $(SERVICES); do \
		echo "Building Docker image for $$service..." ; \
		docker build -t $(DOCKER_REGISTRY)/$$service:$(VERSION) -f services/$$service/Dockerfile . ; \
	done

docker-push:
	@for service in $(SERVICES); do \
		echo "Pushing Docker image for $$service..." ; \
		docker push $(DOCKER_REGISTRY)/$$service:$(VERSION) ; \
	done

# Install dependencies
install:
	cd frontend && npm install
	go mod download

# Run local development environment
setup-observability:
	mkdir -p deploy/observability/prometheus deploy/observability/loki deploy/observability/tempo deploy/observability/grafana
	if not exist deploy/observability/prometheus/prometheus.yml copy deploy/observability/prometheus/prometheus.yml deploy/observability/prometheus/ >nul 2>&1
	if not exist deploy/observability/loki/local-config.yaml copy deploy/observability/loki/local-config.yaml deploy/observability/loki/ >nul 2>&1
	if not exist deploy/observability/tempo/tempo.yaml copy deploy/observability/tempo/tempo.yaml deploy/observability/tempo/ >nul 2>&1

check-env:
	if not exist .env ( \
		if exist deploy/kubernetes/.env.secrets.example ( \
			copy deploy/kubernetes/.env.secrets.example .env \
		) else ( \
			echo Error: deploy/kubernetes/.env.secrets.example not found && exit 1 \
		) \
	)

dev-env-up: setup-observability check-env
	docker-compose up -d

dev-env-build:
	docker-compose build

dev-env-down:
	docker-compose down

# Help
help:
	@echo "Available commands:"
	@echo "Development:"
	@echo "  make dev              - Start frontend development server"
	@echo "  make build           - Build all services and frontend"
	@echo "  make test            - Run all tests"
	@echo "  make lint            - Run linters"
	@echo "  make clean           - Clean build artifacts"
	@echo "  make install         - Install dependencies"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build   - Build Docker images"
	@echo "  make docker-push    - Push Docker images"
	@echo ""
	@echo "Local Development:"
	@echo "  make dev-env-up     - Start local development environment"
	@echo "  make dev-env-down   - Stop local development environment"
	@echo "  make dev-env-build  - Build local development environment"
	@echo ""
	@echo "Variables:"
	@echo "  DOCKER_REGISTRY     - Docker registry (default: monitoring)"
	@echo "  VERSION            - Image version tag (default: latest)"


.DEFAULT_GOAL := help

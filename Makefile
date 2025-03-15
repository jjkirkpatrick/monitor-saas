# Development commands
.PHONY: dev build test lint clean generate-secrets k8s-apply k8s-delete docker-build docker-push

# Variables
DOCKER_REGISTRY ?= monitoring
VERSION ?= latest
SERVICES := api-gateway scheduler probe-manager probe-worker ingestion-service analytics-service alert-manager notification-service

# Development
dev:
	cd frontend && pnpm run dev

# Build commands
build: build-frontend build-services

build-frontend:
	cd frontend && pnpm run build

build-services:
	@for service in $(SERVICES); do \
		echo "Building $$service..." ; \
		go build -o bin/$$service ./services/$$service ; \
	done

# Test commands
test: test-frontend test-services

test-frontend:
	cd frontend && pnpm test

test-services:
	go test ./...

# Lint commands
lint: lint-frontend lint-services

lint-frontend:
	cd frontend && pnpm run lint

lint-services:
	golangci-lint run

# Clean commands
clean:
	rm -rf bin/
	cd frontend && pnpm run clean

# Generate Kubernetes secrets
generate-secrets:
	@if [ ! -f scripts/generate-secrets.sh ]; then \
		echo "Error: scripts/generate-secrets.sh not found" ; \
		exit 1 ; \
	fi
	chmod +x scripts/generate-secrets.sh
	./scripts/generate-secrets.sh

# Kubernetes commands
k8s-apply:
	kubectl apply -k deploy/kubernetes/

k8s-delete:
	kubectl delete -k deploy/kubernetes/

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
	cd frontend && pnpm install
	go mod download

# Run local development environment
dev-env-up:
	docker-compose up -d

dev-env-down:
	docker-compose down

# Help
help:
	@echo "Available commands:"
	@echo "  make dev              - Start frontend development server"
	@echo "  make build           - Build all services and frontend"
	@echo "  make test            - Run all tests"
	@echo "  make lint            - Run linters"
	@echo "  make clean           - Clean build artifacts"
	@echo "  make install         - Install dependencies"
	@echo "  make generate-secrets - Generate Kubernetes secrets"
	@echo "  make k8s-apply      - Apply Kubernetes manifests"
	@echo "  make k8s-delete     - Delete Kubernetes resources"
	@echo "  make docker-build   - Build Docker images"
	@echo "  make docker-push    - Push Docker images"
	@echo "  make dev-env-up     - Start local development environment"
	@echo "  make dev-env-down   - Stop local development environment"

.DEFAULT_GOAL := help

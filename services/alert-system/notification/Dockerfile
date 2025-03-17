# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/notification-service ./services/alert-system/notification

# Final stage
FROM alpine:3.18

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/bin/notification-service .

# Run the application
CMD ["./notification-service"] 
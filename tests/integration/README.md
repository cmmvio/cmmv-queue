# Integration Tests

Integration tests that verify @cmmv/queue works with real queue services.

## Prerequisites

- Docker and Docker Compose installed
- Ports available: 5672 (RabbitMQ), 9092 (Kafka), 6379 (Redis)

## Setup

### Start Services

```bash
# From project root
docker-compose -f tests/docker-compose.yml up -d

# Wait for services to be healthy
docker-compose -f tests/docker-compose.yml ps
```

### Run Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npx vitest run tests/integration/rabbitmq.spec.ts
```

### Stop Services

```bash
docker-compose -f tests/docker-compose.yml down

# Remove volumes (clean state)
docker-compose -f tests/docker-compose.yml down -v
```

## Services

### RabbitMQ
- **Port**: 5672
- **Management UI**: http://localhost:15672
- **Credentials**: guest/guest
- **VHost**: test

### Kafka
- **Port**: 9092
- **Zookeeper**: 2181
- **Auto-create topics**: Enabled

### Redis
- **Port**: 6379
- **No password**

## Test Structure

Integration tests verify:
- Full message lifecycle (publish → consume → ack)
- Queue/topic creation
- Connection handling
- Error scenarios
- Performance characteristics

## Troubleshooting

### Services not starting
```bash
# Check logs
docker-compose -f tests/docker-compose.yml logs

# Restart services
docker-compose -f tests/docker-compose.yml restart
```

### Port conflicts
```bash
# Check what's using the ports
# Linux/Mac
lsof -i :5672
lsof -i :9092
lsof -i :6379

# Windows
netstat -ano | findstr :5672
netstat -ano | findstr :9092
netstat -ano | findstr :6379
```

### Tests failing
1. Ensure all services are healthy
2. Check service logs for errors
3. Verify network connectivity
4. Try cleaning and restarting services

## CI/CD

Integration tests run automatically in GitHub Actions using Docker Compose.

See `.github/workflows/test.yml` for CI configuration.


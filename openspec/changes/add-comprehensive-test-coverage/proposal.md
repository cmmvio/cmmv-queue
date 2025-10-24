# Add Comprehensive Test Coverage

## Why

The `@cmmv/queue` module currently has **ZERO test coverage**:
- ❌ No unit tests
- ❌ No integration tests
- ❌ No end-to-end tests
- ✅ Vitest configured but not used

**Critical Issues**:
1. **No Quality Assurance**: Changes can break functionality without detection
2. **Regression Risk**: Refactoring is dangerous without test safety net
3. **Deployment Confidence**: No confidence that code works in production
4. **Documentation Gap**: Tests serve as living documentation
5. **Maintenance Burden**: Hard to know if changes break existing behavior

**Industry Standard**: Production-ready libraries have 80%+ test coverage
- Synap: 99.30% coverage (359 tests)
- @cmmv/events: Has test files
- RabbitMQ client libraries: 90%+ coverage
- KafkaJS: 95%+ coverage

**Business Impact**:
- Users hesitant to adopt untested library
- Bugs discovered in production instead of development
- Hard to accept community contributions without tests
- Difficult to maintain confidence during refactoring

## What Changes

### Test Infrastructure
- Create comprehensive test suite using Vitest
- Add test utilities and mocks
- Configure code coverage reporting
- Add CI/CD integration for automated testing

### Unit Tests (Isolated Component Testing)
**Target Coverage**: 90%+

1. **QueueRegistry Tests** (`tests/queue.registry.spec.ts`)
   - Channel registration
   - Consume handler registration
   - Parameter registration
   - Queue metadata retrieval

2. **Decorator Tests** (`tests/queue.decorator.spec.ts`)
   - @Channel decorator
   - @Consume decorator
   - @QueueMessage decorator
   - @QueueChannel decorator
   - @QueueConn decorator
   - Metadata reflection

3. **QueueService Tests** (`tests/queue.service.spec.ts`)
   - Service initialization
   - Configuration loading
   - Connection management
   - Message processing logic
   - Error handling

4. **Configuration Tests** (`tests/queue.config.spec.ts`)
   - Configuration validation
   - Default values
   - Environment variable handling

### Integration Tests (Multi-Component Testing)
**Target Coverage**: Key workflows

1. **RabbitMQ Integration** (`tests/integration/rabbitmq.spec.ts`)
   - Full message lifecycle (publish → consume → ack)
   - Priority queue behavior
   - Pub/sub functionality
   - Error scenarios and retries
   - Connection recovery

2. **Kafka Integration** (`tests/integration/kafka.spec.ts`)
   - Message publishing and consumption
   - Consumer group behavior
   - Offset management
   - Partition handling

3. **Redis Integration** (`tests/integration/redis.spec.ts`)
   - List-based queue operations
   - Pub/sub messaging
   - Connection handling

4. **Synap Integration** (`tests/integration/synap.spec.ts`)
   - Queue operations
   - Pub/sub operations
   - ACK/NACK handling
   - Authentication

### E2E Tests (Full Application Testing)
**Target Coverage**: Real-world scenarios

1. **Full Application Test** (`tests/e2e/app.spec.ts`)
   - Application bootstrap with queue module
   - Consumer registration
   - Message flow from producer to consumer
   - Graceful shutdown

2. **Multi-Queue Test** (`tests/e2e/multi-queue.spec.ts`)
   - Multiple queues in single application
   - Different queue types simultaneously
   - Cross-queue communication

### Test Utilities and Mocks

1. **Mock Queue Servers** (`tests/__mocks__/`)
   - Mock RabbitMQ connection
   - Mock Kafka producer/consumer
   - Mock Redis client
   - Mock Synap client

2. **Test Helpers** (`tests/helpers/`)
   - Queue setup utilities
   - Consumer registration helpers
   - Message assertions
   - Timing utilities

3. **Fixtures** (`tests/fixtures/`)
   - Sample messages
   - Configuration samples
   - Consumer examples

### Coverage Reporting
- Configure Vitest coverage with c8/v8
- Generate HTML coverage reports
- Set coverage thresholds:
  - Statements: 90%
  - Branches: 85%
  - Functions: 90%
  - Lines: 90%
- Add coverage badge to README

### CI/CD Integration
- Add test step to GitHub Actions
- Run tests on every PR
- Block merge if tests fail
- Upload coverage reports
- Add integration tests with Docker Compose (optional)

## Impact

### Affected Specs
- `testing` (new spec): Testing strategy and requirements

### Affected Code
- `tests/` (NEW): Complete test suite directory
- `vitest.config.ts`: Enhanced configuration
- `package.json`: Add coverage scripts
- `.github/workflows/`: Add test automation
- `README.md`: Add test and coverage badges

### Benefits
1. **Quality Assurance**: Catch bugs before production
2. **Refactoring Safety**: Change code with confidence
3. **Documentation**: Tests show how to use the library
4. **Community Trust**: Professional open-source project
5. **Faster Development**: Less manual testing needed
6. **Regression Prevention**: Ensure fixes stay fixed

### Test Breakdown by File

| Component | Unit Tests | Integration Tests | Total |
|-----------|-----------|-------------------|-------|
| QueueRegistry | 15 | - | 15 |
| Decorators | 20 | - | 20 |
| QueueService | 30 | - | 30 |
| Configuration | 10 | - | 10 |
| RabbitMQ | 5 | 25 | 30 |
| Kafka | 5 | 20 | 25 |
| Redis | 5 | 15 | 20 |
| Synap | 5 | 20 | 25 |
| E2E | - | 15 | 15 |
| **Total** | **95** | **95** | **190** |

### Breaking Changes
**None** - Tests don't change public API

### Dependencies
- Existing: `vitest` (already in devDependencies)
- Add: `@vitest/coverage-v8` for coverage reporting
- Optional: Docker for integration test services

### Timeline
- **Week 1**: Unit tests (Registry, Decorators, Config)
- **Week 2**: Unit tests (QueueService)
- **Week 3**: Integration tests (RabbitMQ, Kafka)
- **Week 4**: Integration tests (Redis, Synap)
- **Week 5**: E2E tests and CI/CD
- **Week 6**: Coverage optimization and documentation

## Testing Strategy

### Philosophy
1. **Test Behavior, Not Implementation**: Focus on what code does, not how
2. **Arrange-Act-Assert (AAA)**: Clear test structure
3. **DRY but Readable**: Reuse setup but keep tests clear
4. **Fast Execution**: Unit tests < 1s, integration < 30s
5. **Isolated Tests**: Each test independent, can run in any order

### Mocking Strategy
- **Unit Tests**: Mock all external dependencies (connections, clients)
- **Integration Tests**: Use real services (Docker Compose)
- **E2E Tests**: Real application with real dependencies

### Test Naming Convention
```typescript
describe('QueueService', () => {
    describe('send()', () => {
        it('should publish message to RabbitMQ queue', async () => {
            // Test implementation
        });
        
        it('should return false when connection fails', async () => {
            // Test implementation
        });
        
        it('should serialize message as JSON', async () => {
            // Test implementation
        });
    });
});
```

### Coverage Goals
- **Phase 1**: 70% coverage (core functionality)
- **Phase 2**: 85% coverage (edge cases)
- **Phase 3**: 90%+ coverage (comprehensive)

### Trade-offs
**Pros**:
- High confidence in code quality
- Safe refactoring
- Living documentation
- Professional project

**Cons**:
- Initial time investment (~6 weeks)
- Maintenance overhead
- CI/CD execution time

**Decision**: Benefits far outweigh costs - essential for production library


# Technical Design: Comprehensive Test Coverage

## Context

The `@cmmv/queue` module currently has **ZERO tests**, despite having Vitest configured. This is a critical gap for a production library.

**Current State**:
- ❌ No test files
- ✅ Vitest configured
- ❌ No coverage reporting
- ❌ No CI/CD test automation
- ❌ No quality assurance

**Industry Context**:
- Modern libraries have 80-95% test coverage
- Synap (sister project): 99.30% coverage, 359 tests
- KafkaJS: 95%+ coverage
- Community expectation: Comprehensive tests for production use

**Stakeholders**:
- Library maintainers (need confidence in changes)
- Application developers (need reliable dependency)
- Contributors (need clear test requirements)
- CMMV ecosystem (need quality standards)

## Goals / Non-Goals

### Goals
1. Achieve 90%+ code coverage across all components
2. Create comprehensive unit test suite (mocked dependencies)
3. Create integration test suite (real queue services)
4. Create E2E test suite (full application scenarios)
5. Set up automated CI/CD testing
6. Establish testing standards and documentation
7. Enable confident refactoring and feature development

### Non-Goals
1. NOT testing external queue systems themselves (RabbitMQ, Kafka, etc.)
2. NOT creating performance testing suite (separate effort)
3. NOT stress testing or load testing (separate concern)
4. NOT testing CMMV core framework behavior
5. NOT 100% coverage (diminishing returns after 90%)

## Decisions

### Decision 1: Three-Tier Testing Strategy
**What**: Unit tests (mocked), Integration tests (real services), E2E tests (full app)

**Why**:
- **Unit Tests**: Fast, isolated, test business logic
- **Integration Tests**: Verify actual queue system behavior
- **E2E Tests**: Ensure everything works together
- Pyramid approach: Many unit tests, some integration, few E2E

**Test Distribution**:
- 50% Unit tests (~95 tests) - Fast, run always
- 40% Integration tests (~95 tests) - Slower, Docker required
- 10% E2E tests (~15 tests) - Slowest, full scenarios

**Alternatives Considered**:
- Only unit tests: Rejected - misses integration bugs
- Only integration tests: Rejected - slow, hard to debug
- Only E2E tests: Rejected - very slow, brittle

### Decision 2: Comprehensive Mock Library
**What**: Create detailed mocks for all queue system clients

**Why**:
- Unit tests need to run without external dependencies
- Fast test execution (< 10 seconds for all unit tests)
- Reliable tests (not dependent on service availability)
- Easy local development (no Docker required for unit tests)

**Mock Strategy**:
```typescript
// tests/__mocks__/amqp.mock.ts
export class MockAmqpConnection {
    channels = new Map();
    connected = true;
    
    createChannel(options) {
        const channel = new MockChannel(options);
        this.channels.set(options.name, channel);
        return channel;
    }
    
    on(event, handler) {
        // Store event handlers for testing
    }
}
```

**Alternatives Considered**:
- Use existing mock libraries: Rejected - not specific enough
- Manual mocks per test: Rejected - too much duplication
- No mocks (only integration): Rejected - too slow

### Decision 3: Docker Compose for Integration Tests
**What**: Use Docker Compose to orchestrate queue services for integration tests

**Why**:
- Consistent test environment across developers and CI
- Easy to start/stop services
- Isolated test environment
- Matches production setups

**Docker Compose Structure**:
```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672"]
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
  
  kafka:
    image: confluentinc/cp-kafka:latest
    ports: ["9092:9092"]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  
  synap:
    image: hivellm/synap:latest
    ports: ["15500:15500"]
```

**Alternatives Considered**:
- Testcontainers: Considered - adds complexity
- Manual service setup: Rejected - inconsistent
- Cloud test instances: Rejected - costly, slow

### Decision 4: AAA Testing Pattern
**What**: All tests follow Arrange-Act-Assert pattern

**Why**:
- Clear test structure
- Easy to understand test intent
- Standard pattern widely adopted
- Improves maintainability

**Example**:
```typescript
it('should publish message to RabbitMQ queue', async () => {
    // Arrange
    const queueService = new QueueService();
    const message = { task: 'process-video' };
    
    // Act
    const result = await queueService.send('tasks', 'video', message);
    
    // Assert
    expect(result).toBe(true);
    expect(mockChannel.sendToQueue).toHaveBeenCalledWith('video', message);
});
```

**Alternatives Considered**:
- BDD Given-When-Then: Considered - adds abstraction
- Free-form tests: Rejected - inconsistent
- Table-driven tests: Deferred - useful for some cases

### Decision 5: Coverage Thresholds with Enforcement
**What**: Set coverage thresholds and fail builds when not met

**Why**:
- Prevents coverage regression
- Forces test writing for new code
- Makes quality gate explicit
- Industry standard practice

**Thresholds**:
```typescript
// vitest.config.ts
coverage: {
    provider: 'v8',
    reporter: ['text', 'html', 'json'],
    thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90
    },
    exclude: [
        '**/*.spec.ts',
        '**/__mocks__/**',
        'tests/**'
    ]
}
```

**Alternatives Considered**:
- No thresholds: Rejected - coverage can slip
- 100% coverage: Rejected - unrealistic, diminishing returns
- Lower thresholds (70%): Rejected - not enough for production

### Decision 6: Separate Unit and Integration Test Commands
**What**: Different npm scripts for unit vs integration tests

**Why**:
- Unit tests run fast locally (< 10s)
- Integration tests slower, need Docker (< 60s)
- Developers can run appropriate tests
- CI can run both

**Scripts**:
```json
{
    "test": "vitest run",
    "test:unit": "vitest run --config vitest.unit.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
}
```

**Alternatives Considered**:
- Single test command: Rejected - too slow for development
- Manual test filtering: Rejected - error-prone
- Jest instead of Vitest: Rejected - Vitest is faster, modern

### Decision 7: Fixture-Based Test Data
**What**: Centralized fixtures for reusable test data

**Why**:
- DRY principle
- Consistent test data
- Easy to update test scenarios
- Type-safe fixtures

**Structure**:
```typescript
// tests/fixtures/messages.ts
export const validMessages = {
    simple: { task: 'simple-task' },
    complex: { task: 'complex', metadata: {...}, data: [...] },
    large: { data: new Array(10000).fill('x') }
};

export const invalidMessages = {
    null: null,
    undefined: undefined,
    circular: (() => { const obj: any = {}; obj.self = obj; return obj; })()
};
```

**Alternatives Considered**:
- Inline test data: Rejected - duplication
- Factories: Considered - good for dynamic data
- Random data: Rejected - non-deterministic

### Decision 8: Helper Functions for Common Operations
**What**: Test helpers for setup, teardown, and assertions

**Why**:
- Reduce test boilerplate
- Consistent test patterns
- Easier test writing
- Better error messages

**Examples**:
```typescript
// tests/helpers/queue-helper.ts
export async function setupQueue(type: string, options = {}) {
    const service = new QueueService();
    await service.loadConfig({...});
    return service;
}

export async function teardownQueue(service: QueueService) {
    await service.shutdown();
}

// tests/helpers/assertion-helpers.ts
export function expectMessageConsumed(message: any, consumedMessage: any) {
    expect(consumedMessage).toBeDefined();
    expect(consumedMessage.payload).toEqual(message);
}
```

**Alternatives Considered**:
- No helpers: Rejected - too much duplication
- Generic test framework: Rejected - not specific enough

## Risks / Trade-offs

### Risk 1: Initial Time Investment
**Risk**: Creating 190+ tests takes significant time (~6 weeks)

**Mitigation**:
- Phased approach (unit → integration → E2E)
- Can release with partial coverage initially
- Parallelize work (different developers, different components)
- Long-term benefit outweighs cost

**Likelihood**: High  
**Impact**: Medium  
**Accept**: Yes - essential for production library

### Risk 2: Integration Test Flakiness
**Risk**: Tests with real services can be flaky

**Mitigation**:
- Use health checks before tests
- Implement retry logic for transient failures
- Isolate tests properly
- Use deterministic test data
- Monitor flaky test metrics

**Likelihood**: Medium  
**Impact**: Medium  
**Mitigation Plan**: Flag and fix flaky tests aggressively

### Risk 3: Maintenance Overhead
**Risk**: Tests require maintenance as code changes

**Mitigation**:
- Well-structured tests easier to maintain
- Good documentation helps
- Test helpers reduce duplication
- Coverage thresholds prevent neglect

**Likelihood**: Medium  
**Impact**: Low  
**Accept**: Yes - standard cost of quality

### Trade-off 1: Coverage vs Speed
**Trade-off**: Higher coverage = more tests = slower CI

**Decision**: Optimize for coverage, optimize speed separately
**Rationale**:
- Unit tests fast enough (< 10s)
- Integration tests acceptable (< 60s)
- Can optimize later if needed
- Parallel execution helps

### Trade-off 2: Mocks vs Real Services
**Trade-off**: Mocks are fast but may not catch integration issues

**Decision**: Use both (unit tests + integration tests)
**Rationale**:
- Best of both worlds
- Unit tests for business logic
- Integration tests for actual behavior
- Pyramid approach balances speed and coverage

### Trade-off 3: Test Isolation vs Realism
**Trade-off**: Isolated tests vs realistic scenarios

**Decision**: Unit tests isolated, E2E tests realistic
**Rationale**:
- Different purposes
- Unit tests for components
- E2E tests for workflows
- Both are valuable

## Migration Plan

### Phase 1: Core Unit Tests (Week 1-2)
**Goal**: 70% coverage

1. QueueRegistry tests
2. Decorator tests
3. Configuration tests
4. Basic QueueService tests

**Deliverable**: Fast test suite (< 10s), basic coverage

### Phase 2: Complete Unit Tests (Week 3)
**Goal**: 85% coverage

1. Complete QueueService tests
2. Error handling tests
3. Edge case tests

**Deliverable**: Comprehensive unit test suite

### Phase 3: Integration Tests (Week 4-5)
**Goal**: Integration test coverage

1. RabbitMQ integration tests
2. Kafka integration tests
3. Redis integration tests
4. Synap integration tests (if implemented)
5. Docker Compose setup

**Deliverable**: Working integration test suite

### Phase 4: E2E and CI/CD (Week 6)
**Goal**: Production-ready test infrastructure

1. E2E application tests
2. CI/CD GitHub Actions
3. Coverage reporting
4. Documentation

**Deliverable**: Fully automated test pipeline

### Incremental Adoption
- Tests don't block existing functionality
- Can merge partial test coverage
- Coverage increases incrementally
- Each phase adds value independently

## Open Questions

1. **Q**: Should we test with specific versions of queue systems?
   **A**: Yes - pin versions in Docker Compose, document compatibility

2. **Q**: Should we test with CMMV framework versions?
   **A**: Test with current version, document compatibility matrix

3. **Q**: How to handle slow integration tests in CI?
   **A**: Run unit tests on every commit, integration tests on PR only

4. **Q**: Should we add mutation testing?
   **A**: Defer - nice to have but not essential

5. **Q**: Should we test TypeScript types (type-level tests)?
   **A**: Defer - TypeScript compiler provides some coverage

6. **Q**: How to handle test data cleanup in integration tests?
   **A**: Use unique queue names per test, clean up in afterEach

## Implementation Notes

### Directory Structure
```
tests/
├── __mocks__/           # Mock implementations
│   ├── amqp.mock.ts
│   ├── kafka.mock.ts
│   ├── redis.mock.ts
│   └── synap.mock.ts
├── helpers/             # Test utilities
│   ├── queue-helper.ts
│   ├── message-builder.ts
│   └── assertion-helpers.ts
├── fixtures/            # Test data
│   ├── messages.ts
│   ├── configs.ts
│   └── consumers.ts
├── unit/                # Unit tests
│   ├── queue.registry.spec.ts
│   ├── queue.decorator.spec.ts
│   ├── queue.service.spec.ts
│   └── queue.config.spec.ts
├── integration/         # Integration tests
│   ├── rabbitmq.spec.ts
│   ├── kafka.spec.ts
│   ├── redis.spec.ts
│   └── synap.spec.ts
├── e2e/                 # E2E tests
│   ├── app.spec.ts
│   └── multi-queue.spec.ts
├── setup.ts             # Global test setup
└── docker-compose.yml   # Services for integration tests
```

### Coverage Reporting
```bash
# Run tests with coverage
npm run test:coverage

# Generate HTML report
open coverage/index.html

# CI uploads to Codecov/Coveralls
```

### Key Testing Principles
1. **Fast feedback**: Unit tests < 10s
2. **Reliable**: No flaky tests
3. **Maintainable**: Clear, well-organized
4. **Comprehensive**: 90%+ coverage
5. **Documented**: Easy to understand and contribute


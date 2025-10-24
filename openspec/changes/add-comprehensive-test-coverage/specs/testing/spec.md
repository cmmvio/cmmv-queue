# Test Coverage Specification

## ADDED Requirements

### Requirement: Comprehensive Unit Test Coverage
The queue module SHALL have comprehensive unit tests for all core components with minimum 90% code coverage.

#### Scenario: QueueRegistry unit tests
- **WHEN** running unit test suite
- **THEN** SHALL test all QueueRegistry methods
- **AND** SHALL verify channel registration logic
- **AND** SHALL verify consume handler registration
- **AND** SHALL verify parameter registration
- **AND** SHALL achieve 95%+ coverage on QueueRegistry

#### Scenario: Decorator unit tests
- **WHEN** running decorator tests
- **THEN** SHALL test all decorator functions (@Channel, @Consume, @QueueMessage, etc.)
- **AND** SHALL verify metadata is correctly set
- **AND** SHALL verify decorator composition
- **AND** SHALL test error cases (invalid usage)
- **AND** SHALL achieve 95%+ coverage on decorators

#### Scenario: QueueService unit tests
- **WHEN** running QueueService tests
- **THEN** SHALL test service initialization for all queue types
- **AND** SHALL test message sending logic
- **AND** SHALL test message processing logic
- **AND** SHALL test error handling
- **AND** SHALL achieve 85%+ coverage on QueueService

### Requirement: Integration Testing for All Queue Types
The queue module SHALL have integration tests that verify actual queue system behavior.

#### Scenario: RabbitMQ integration tests
- **WHEN** running RabbitMQ integration tests
- **THEN** SHALL start real RabbitMQ server (Docker)
- **AND** SHALL test full message lifecycle
- **AND** SHALL test ACK/NACK behavior
- **AND** SHALL test priority queues
- **AND** SHALL test pub/sub with exchanges
- **AND** SHALL test connection recovery
- **AND** tests SHALL pass with real RabbitMQ

#### Scenario: Kafka integration tests
- **WHEN** running Kafka integration tests
- **THEN** SHALL start real Kafka broker (Docker)
- **AND** SHALL test message publishing and consumption
- **AND** SHALL test consumer groups
- **AND** SHALL test offset management
- **AND** SHALL test partition assignment
- **AND** tests SHALL pass with real Kafka

#### Scenario: Redis integration tests
- **WHEN** running Redis integration tests
- **THEN** SHALL start real Redis server (Docker)
- **AND** SHALL test pub/sub messaging
- **AND** SHALL test channel subscriptions
- **AND** SHALL test multiple subscribers
- **AND** tests SHALL pass with real Redis

#### Scenario: Synap integration tests
- **WHEN** running Synap integration tests
- **AND** Synap support is implemented
- **THEN** SHALL start real Synap server
- **AND** SHALL test queue operations
- **AND** SHALL test pub/sub operations
- **AND** SHALL test authentication
- **AND** tests SHALL pass with real Synap

### Requirement: End-to-End Application Testing
The queue module SHALL have E2E tests that verify complete application scenarios.

#### Scenario: Full application bootstrap
- **WHEN** running E2E test with complete application
- **THEN** SHALL bootstrap CMMV application
- **AND** SHALL load QueueModule
- **AND** SHALL register consumer modules
- **AND** SHALL establish queue connections
- **AND** application SHALL start successfully

#### Scenario: Producer to consumer message flow
- **WHEN** running E2E message flow test
- **THEN** SHALL send message from producer
- **AND** consumer SHALL receive message
- **AND** consumer SHALL process message
- **AND** consumer SHALL acknowledge message
- **AND** message SHALL be removed from queue

#### Scenario: Graceful application shutdown
- **WHEN** running E2E shutdown test
- **THEN** SHALL process in-flight messages
- **AND** SHALL close queue connections
- **AND** SHALL shutdown without errors
- **AND** SHALL not leave orphaned connections

### Requirement: Mock Infrastructure
The queue module SHALL provide comprehensive mock implementations for isolated unit testing.

#### Scenario: RabbitMQ mock
- **WHEN** unit test uses RabbitMQ mock
- **THEN** mock SHALL simulate connection behavior
- **AND** mock SHALL simulate channel operations
- **AND** mock SHALL simulate message queue
- **AND** mock SHALL track method calls
- **AND** tests SHALL run without real RabbitMQ

#### Scenario: Kafka mock
- **WHEN** unit test uses Kafka mock
- **THEN** mock SHALL simulate producer
- **AND** mock SHALL simulate consumer
- **AND** mock SHALL simulate topics and partitions
- **AND** tests SHALL run without real Kafka

#### Scenario: Redis mock
- **WHEN** unit test uses Redis mock
- **THEN** mock SHALL simulate pub/sub
- **AND** mock SHALL simulate subscriptions
- **AND** mock SHALL simulate message delivery
- **AND** tests SHALL run without real Redis

#### Scenario: Synap mock
- **WHEN** unit test uses Synap mock
- **THEN** mock SHALL simulate Synap SDK
- **AND** mock SHALL simulate queue operations
- **AND** mock SHALL simulate pub/sub operations
- **AND** tests SHALL run without real Synap server

### Requirement: Test Utilities and Helpers
The queue module SHALL provide test utilities to simplify test writing and reduce duplication.

#### Scenario: Queue setup helper
- **WHEN** test needs to setup queue
- **THEN** helper SHALL provide simple setup function
- **AND** SHALL handle configuration
- **AND** SHALL handle teardown
- **AND** SHALL reduce test boilerplate

#### Scenario: Message builder utility
- **WHEN** test needs sample messages
- **THEN** utility SHALL provide message factory
- **AND** SHALL support different message types
- **AND** SHALL generate valid test data
- **AND** SHALL improve test readability

#### Scenario: Custom assertions
- **WHEN** test needs specific assertions
- **THEN** SHALL provide queue-specific matchers
- **AND** SHALL provide message assertions
- **AND** SHALL provide connection assertions
- **AND** error messages SHALL be descriptive

### Requirement: Code Coverage Reporting
The queue module SHALL generate and track code coverage metrics.

#### Scenario: Coverage report generation
- **WHEN** running tests with coverage
- **THEN** SHALL generate HTML coverage report
- **AND** SHALL generate JSON coverage data
- **AND** SHALL generate text summary
- **AND** reports SHALL be saved to coverage/ directory

#### Scenario: Coverage thresholds enforcement
- **WHEN** coverage is below threshold
- **THEN** test run SHALL fail
- **AND** SHALL report which thresholds failed
- **AND** SHALL identify uncovered code
- **AND** thresholds: statements 90%, branches 85%, functions 90%, lines 90%

#### Scenario: Coverage badge display
- **WHEN** viewing README.md
- **THEN** SHALL display coverage badge
- **AND** badge SHALL show current coverage percentage
- **AND** badge SHALL be color-coded (red < 80%, yellow 80-90%, green > 90%)
- **AND** badge SHALL link to coverage report

### Requirement: Continuous Integration Testing
The queue module SHALL run tests automatically in CI/CD pipeline.

#### Scenario: Pull request test automation
- **WHEN** pull request is created
- **THEN** CI SHALL run all unit tests
- **AND** SHALL run integration tests (with Docker services)
- **AND** SHALL generate coverage report
- **AND** SHALL post test results as PR comment
- **AND** SHALL block merge if tests fail

#### Scenario: Test result reporting
- **WHEN** CI tests complete
- **THEN** SHALL display test summary
- **AND** SHALL show passed/failed count
- **AND** SHALL show coverage change vs main branch
- **AND** SHALL highlight newly uncovered code
- **AND** results SHALL be visible in GitHub UI

#### Scenario: Docker service orchestration
- **WHEN** running integration tests in CI
- **THEN** SHALL start required Docker services
- **AND** SHALL wait for services to be healthy
- **AND** SHALL run tests against services
- **AND** SHALL stop and remove services after tests
- **AND** SHALL handle service startup failures gracefully

### Requirement: Test Performance and Reliability
The queue module SHALL have fast, reliable, and deterministic tests.

#### Scenario: Fast unit test execution
- **WHEN** running unit tests
- **THEN** all unit tests SHALL complete in < 10 seconds
- **AND** individual tests SHALL complete in < 100ms
- **AND** tests SHALL run in parallel where possible
- **AND** SHALL not wait unnecessarily

#### Scenario: Integration test isolation
- **WHEN** running integration tests
- **THEN** each test SHALL be independent
- **AND** tests SHALL clean up resources
- **AND** tests SHALL not affect each other
- **AND** tests SHALL run in any order
- **AND** parallel execution SHALL be safe

#### Scenario: Flaky test detection
- **WHEN** test fails intermittently
- **THEN** SHALL be flagged as flaky
- **AND** SHALL provide retry mechanism
- **AND** SHALL log flakiness metrics
- **AND** flaky tests SHALL be fixed or removed

#### Scenario: Test timeout handling
- **WHEN** test hangs or takes too long
- **THEN** SHALL timeout after configured limit
- **AND** SHALL report which test timed out
- **AND** SHALL not block test suite indefinitely
- **AND** default timeout SHALL be 30 seconds

### Requirement: Test Documentation
The queue module SHALL document testing approach and procedures.

#### Scenario: Testing guide documentation
- **WHEN** developer reads testing documentation
- **THEN** SHALL explain how to run tests locally
- **AND** SHALL explain test file organization
- **AND** SHALL explain mocking strategy
- **AND** SHALL provide examples of writing tests
- **AND** SHALL document integration test setup

#### Scenario: Contributing test guidelines
- **WHEN** contributor adds new feature
- **THEN** documentation SHALL require tests
- **AND** SHALL explain test coverage requirements
- **AND** SHALL provide test templates
- **AND** SHALL explain how to run specific tests
- **AND** PR SHALL not be merged without tests

#### Scenario: Troubleshooting test failures
- **WHEN** developer encounters test failure
- **THEN** documentation SHALL provide troubleshooting guide
- **AND** SHALL explain common failure scenarios
- **AND** SHALL explain how to debug tests
- **AND** SHALL explain Docker service issues
- **AND** SHALL provide solutions for common problems

### Requirement: Test Data and Fixtures
The queue module SHALL provide reusable test data and fixtures.

#### Scenario: Sample message fixtures
- **WHEN** test needs sample messages
- **THEN** fixtures SHALL provide variety of messages
- **AND** SHALL include valid and invalid messages
- **AND** SHALL include edge cases (empty, large, special chars)
- **AND** SHALL be easily reusable across tests

#### Scenario: Sample configuration fixtures
- **WHEN** test needs queue configuration
- **THEN** fixtures SHALL provide config samples
- **AND** SHALL cover all queue types
- **AND** SHALL include valid and invalid configs
- **AND** SHALL be type-safe (TypeScript)

#### Scenario: Sample consumer fixtures
- **WHEN** test needs consumer classes
- **THEN** fixtures SHALL provide sample consumers
- **AND** SHALL demonstrate decorator usage
- **AND** SHALL include various consumer patterns
- **AND** SHALL be usable in multiple tests

### Requirement: Test Maintainability
The queue module SHALL have maintainable, readable, and well-structured tests.

#### Scenario: Test organization by component
- **WHEN** browsing test directory
- **THEN** tests SHALL be organized by component
- **AND** SHALL follow consistent naming (*.spec.ts)
- **AND** SHALL mirror source file structure
- **AND** SHALL be easy to locate relevant tests

#### Scenario: Test readability and clarity
- **WHEN** reading test file
- **THEN** tests SHALL follow AAA pattern (Arrange, Act, Assert)
- **AND** test names SHALL be descriptive
- **AND** test SHALL have clear purpose
- **AND** SHALL avoid complex logic in tests
- **AND** SHALL use descriptive variable names

#### Scenario: Test code reuse
- **WHEN** similar setup is needed across tests
- **THEN** SHALL use beforeEach/afterEach hooks
- **AND** SHALL extract common logic to helpers
- **AND** SHALL avoid copy-paste duplication
- **AND** SHALL balance DRY with readability

### Requirement: Regression Prevention
The queue module SHALL use tests to prevent regression of fixed bugs.

#### Scenario: Bug fix test coverage
- **WHEN** bug is fixed
- **THEN** SHALL add test reproducing bug
- **AND** test SHALL fail before fix
- **AND** test SHALL pass after fix
- **AND** test SHALL prevent regression
- **AND** test SHALL be permanent part of suite

#### Scenario: Feature change verification
- **WHEN** feature is modified
- **THEN** existing tests SHALL catch breaking changes
- **AND** SHALL require test updates if behavior changes
- **AND** SHALL prevent accidental behavior changes
- **AND** SHALL document intentional changes

### Requirement: Performance Testing
The queue module SHALL include performance benchmarks to track performance regressions.

#### Scenario: Message throughput benchmark
- **WHEN** running performance tests
- **THEN** SHALL measure messages per second
- **AND** SHALL test with different queue types
- **AND** SHALL compare against baseline
- **AND** SHALL fail if performance regresses > 20%
- **AND** results SHALL be tracked over time

#### Scenario: Latency benchmark
- **WHEN** running latency tests
- **THEN** SHALL measure end-to-end message latency
- **AND** SHALL report P50, P95, P99 latencies
- **AND** SHALL compare against targets
- **AND** SHALL detect latency regressions

#### Scenario: Memory usage benchmark
- **WHEN** running memory tests
- **THEN** SHALL measure memory consumption
- **AND** SHALL test with large message volumes
- **AND** SHALL detect memory leaks
- **AND** SHALL fail if memory usage grows unbounded


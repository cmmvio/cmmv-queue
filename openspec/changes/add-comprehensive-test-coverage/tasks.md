# Implementation Tasks

## 1. Test Infrastructure Setup
- [ ] 1.1 Create `tests/` directory structure
- [ ] 1.2 Create `tests/__mocks__/` for mock implementations
- [ ] 1.3 Create `tests/helpers/` for test utilities
- [ ] 1.4 Create `tests/fixtures/` for sample data
- [ ] 1.5 Install `@vitest/coverage-v8` package
- [ ] 1.6 Update `vitest.config.ts` with coverage configuration
- [ ] 1.7 Add test scripts to `package.json`
- [ ] 1.8 Create `tests/setup.ts` for global test setup

## 2. Mock Implementations
- [ ] 2.1 Create `tests/__mocks__/amqp.mock.ts` (RabbitMQ)
- [ ] 2.2 Create `tests/__mocks__/kafka.mock.ts` (Kafka)
- [ ] 2.3 Create `tests/__mocks__/redis.mock.ts` (Redis/ioredis)
- [ ] 2.4 Create `tests/__mocks__/synap.mock.ts` (Synap client)
- [ ] 2.5 Create `tests/__mocks__/config.mock.ts` (Config utility)
- [ ] 2.6 Create `tests/__mocks__/logger.mock.ts` (Logger utility)

## 3. Test Helpers and Utilities
- [ ] 3.1 Create `tests/helpers/queue-helper.ts` (setup/teardown)
- [ ] 3.2 Create `tests/helpers/message-builder.ts` (message creation)
- [ ] 3.3 Create `tests/helpers/assertion-helpers.ts` (custom assertions)
- [ ] 3.4 Create `tests/helpers/timing-helpers.ts` (async utilities)
- [ ] 3.5 Create `tests/helpers/consumer-helper.ts` (consumer creation)

## 4. Test Fixtures
- [ ] 4.1 Create `tests/fixtures/messages.ts` (sample messages)
- [ ] 4.2 Create `tests/fixtures/configs.ts` (sample configs)
- [ ] 4.3 Create `tests/fixtures/consumers.ts` (sample consumers)
- [ ] 4.4 Create `tests/fixtures/queue-metadata.ts` (metadata samples)

## 5. QueueRegistry Unit Tests
- [ ] 5.1 Test `registerChannel()` creates queue metadata
- [ ] 5.2 Test `registerChannel()` merges existing metadata
- [ ] 5.3 Test `registerChannel()` handles options correctly
- [ ] 5.4 Test `registerConsumeHandler()` adds handler to queue
- [ ] 5.5 Test `registerConsumeHandler()` creates queue if not exists
- [ ] 5.6 Test `registerConsumeHandler()` updates existing handler
- [ ] 5.7 Test `registerParam()` adds parameter metadata
- [ ] 5.8 Test `registerParam()` handles parameter ordering
- [ ] 5.9 Test `getQueues()` returns all registered queues
- [ ] 5.10 Test `getConsumes()` returns handlers for queue
- [ ] 5.11 Test `getParams()` returns parameters for handler
- [ ] 5.12 Test `clear()` resets all registrations
- [ ] 5.13 Test multiple consumers on same queue
- [ ] 5.14 Test queue with no handlers
- [ ] 5.15 Test edge cases (null, undefined, empty strings)

## 6. Decorator Unit Tests
- [ ] 6.1 Test @Channel decorator sets metadata on class
- [ ] 6.2 Test @Channel with options (pubSub, exchangeName, etc.)
- [ ] 6.3 Test @Channel without options (uses defaults)
- [ ] 6.4 Test @Consume decorator registers handler
- [ ] 6.5 Test @Consume on multiple methods
- [ ] 6.6 Test @QueueMessage parameter decorator
- [ ] 6.7 Test @QueueChannel parameter decorator
- [ ] 6.8 Test @QueueConn parameter decorator
- [ ] 6.9 Test multiple parameter decorators on same method
- [ ] 6.10 Test parameter decorator ordering (index tracking)
- [ ] 6.11 Test decorators with inheritance
- [ ] 6.12 Test decorators on arrow functions (should fail gracefully)
- [ ] 6.13 Test metadata reflection
- [ ] 6.14 Test decorator composition
- [ ] 6.15 Test invalid decorator usage
- [ ] 6.16 Test TypeScript metadata emission
- [ ] 6.17 Test design:paramtypes metadata
- [ ] 6.18 Test decorator on abstract class
- [ ] 6.19 Test decorator on interface (should fail)
- [ ] 6.20 Test decorator errors are descriptive

## 7. QueueService Unit Tests (Part 1 - Initialization)
- [ ] 7.1 Test service is singleton
- [ ] 7.2 Test `loadConfig()` initializes RabbitMQ
- [ ] 7.3 Test `loadConfig()` initializes Kafka
- [ ] 7.4 Test `loadConfig()` initializes Redis
- [ ] 7.5 Test `loadConfig()` initializes Synap
- [ ] 7.6 Test `loadConfig()` throws on unsupported type
- [ ] 7.7 Test `loadConfig()` validates configuration
- [ ] 7.8 Test `loadConfig()` handles missing config
- [ ] 7.9 Test connection logging (success)
- [ ] 7.10 Test connection logging (failure)

## 8. QueueService Unit Tests (Part 2 - Setup Methods)
- [ ] 8.1 Test `setupRabbitMQ()` creates channels
- [ ] 8.2 Test `setupRabbitMQ()` registers consumers
- [ ] 8.3 Test `setupRabbitMQ()` handles pub/sub mode
- [ ] 8.4 Test `setupRabbitMQ()` handles point-to-point mode
- [ ] 8.5 Test `setupKafka()` creates consumers
- [ ] 8.6 Test `setupKafka()` subscribes to topics
- [ ] 8.7 Test `setupKafka()` handles consumer groups
- [ ] 8.8 Test `setupRedis()` subscribes to channels
- [ ] 8.9 Test `setupRedis()` handles message parsing
- [ ] 8.10 Test `setupSynap()` creates queues (if implemented)

## 9. QueueService Unit Tests (Part 3 - Message Operations)
- [ ] 9.1 Test `send()` with RabbitMQ
- [ ] 9.2 Test `send()` with Kafka
- [ ] 9.3 Test `send()` with Redis
- [ ] 9.4 Test `send()` with Synap (if implemented)
- [ ] 9.5 Test `send()` serializes JSON correctly
- [ ] 9.6 Test `send()` returns true on success
- [ ] 9.7 Test `send()` returns false on failure
- [ ] 9.8 Test `publish()` with pub/sub mode
- [ ] 9.9 Test `publish()` with different queue types
- [ ] 9.10 Test `publish()` with persistent option

## 10. QueueService Unit Tests (Part 4 - Message Processing)
- [ ] 10.1 Test `processMessage()` invokes handler
- [ ] 10.2 Test `processMessage()` injects @QueueMessage
- [ ] 10.3 Test `processMessage()` injects @QueueChannel
- [ ] 10.4 Test `processMessage()` injects @QueueConn
- [ ] 10.5 Test `processMessage()` handles parameter ordering
- [ ] 10.6 Test `processMessage()` handles handler errors
- [ ] 10.7 Test `processMessage()` logs errors
- [ ] 10.8 Test `processMessage()` with async handlers
- [ ] 10.9 Test `processMessage()` with no matching consumer
- [ ] 10.10 Test `processMessage()` with JSON parsing errors

## 11. Configuration Tests
- [ ] 11.1 Test QueueConfig schema validation
- [ ] 11.2 Test required fields enforcement
- [ ] 11.3 Test default values application
- [ ] 11.4 Test type validation (string, number, boolean)
- [ ] 11.5 Test invalid queue type rejection
- [ ] 11.6 Test URL format validation (optional)
- [ ] 11.7 Test config merging with defaults
- [ ] 11.8 Test environment variable substitution
- [ ] 11.9 Test config immutability
- [ ] 11.10 Test config error messages are helpful

## 12. RabbitMQ Integration Tests
- [ ] 12.1 Setup: Start RabbitMQ container (Docker Compose)
- [ ] 12.2 Test: Create queue and verify existence
- [ ] 12.3 Test: Publish message to queue
- [ ] 12.4 Test: Consume message from queue
- [ ] 12.5 Test: ACK removes message from queue
- [ ] 12.6 Test: NACK requeues message
- [ ] 12.7 Test: Priority queue ordering
- [ ] 12.8 Test: Durable queue persistence
- [ ] 12.9 Test: Exclusive queue behavior
- [ ] 12.10 Test: Auto-delete queue
- [ ] 12.11 Test: Pub/sub with exchange
- [ ] 12.12 Test: Multiple consumers on same queue
- [ ] 12.13 Test: Message TTL expiration
- [ ] 12.14 Test: Dead letter queue
- [ ] 12.15 Test: Connection recovery after disconnect
- [ ] 12.16 Test: Channel prefetch limit
- [ ] 12.17 Test: Large message handling
- [ ] 12.18 Test: JSON serialization/deserialization
- [ ] 12.19 Test: Error handling and logging
- [ ] 12.20 Test: Graceful shutdown
- [ ] 12.21 Teardown: Stop RabbitMQ container

## 13. Kafka Integration Tests
- [ ] 13.1 Setup: Start Kafka container (Docker Compose)
- [ ] 13.2 Test: Create topic and verify
- [ ] 13.3 Test: Publish message to topic
- [ ] 13.4 Test: Consume message from topic
- [ ] 13.5 Test: Consumer group coordination
- [ ] 13.6 Test: Offset commit and resume
- [ ] 13.7 Test: Partition assignment
- [ ] 13.8 Test: Message ordering within partition
- [ ] 13.9 Test: Multiple partitions
- [ ] 13.10 Test: Consumer rebalancing
- [ ] 13.11 Test: Message key-based routing
- [ ] 13.12 Test: Batch consumption
- [ ] 13.13 Test: At-least-once delivery
- [ ] 13.14 Test: Error handling and retries
- [ ] 13.15 Test: Connection failure recovery
- [ ] 13.16 Test: Large message handling
- [ ] 13.17 Test: JSON serialization
- [ ] 13.18 Test: Producer acknowledgment
- [ ] 13.19 Test: Graceful shutdown
- [ ] 13.20 Teardown: Stop Kafka container

## 14. Redis Integration Tests
- [ ] 14.1 Setup: Start Redis container
- [ ] 14.2 Test: Pub/sub publish and subscribe
- [ ] 14.3 Test: Multiple subscribers receive same message
- [ ] 14.4 Test: Pattern-based subscriptions
- [ ] 14.5 Test: Channel unsubscribe
- [ ] 14.6 Test: RPUSH/LPOP queue behavior (if used)
- [ ] 14.7 Test: Message serialization
- [ ] 14.8 Test: Connection handling
- [ ] 14.9 Test: Error handling
- [ ] 14.10 Test: Reconnection logic
- [ ] 14.11 Test: Large message handling
- [ ] 14.12 Test: Multiple channels
- [ ] 14.13 Test: JSON parsing
- [ ] 14.14 Test: Graceful shutdown
- [ ] 14.15 Teardown: Stop Redis container

## 15. Synap Integration Tests (if implemented)
- [ ] 15.1 Setup: Start Synap server
- [ ] 15.2 Test: Create queue via SDK
- [ ] 15.3 Test: Publish message to queue
- [ ] 15.4 Test: Consume message from queue
- [ ] 15.5 Test: ACK removes message
- [ ] 15.6 Test: NACK requeues message
- [ ] 15.7 Test: Priority queue
- [ ] 15.8 Test: Retry mechanism
- [ ] 15.9 Test: Dead letter queue
- [ ] 15.10 Test: Pub/sub publish
- [ ] 15.11 Test: Pub/sub subscribe
- [ ] 15.12 Test: Topic wildcards
- [ ] 15.13 Test: Authentication (API key)
- [ ] 15.14 Test: Authentication (Basic auth)
- [ ] 15.15 Test: Error handling
- [ ] 15.16 Test: Timeout handling
- [ ] 15.17 Test: Connection recovery
- [ ] 15.18 Test: JSON serialization
- [ ] 15.19 Test: Graceful shutdown
- [ ] 15.20 Teardown: Stop Synap server

## 16. E2E Tests
- [ ] 16.1 Test: Full application with RabbitMQ
- [ ] 16.2 Test: Full application with Kafka
- [ ] 16.3 Test: Full application with Redis
- [ ] 16.4 Test: Full application with Synap
- [ ] 16.5 Test: Application bootstrap and module loading
- [ ] 16.6 Test: Consumer auto-registration
- [ ] 16.7 Test: Message flow producer → consumer
- [ ] 16.8 Test: Multiple queues in same app
- [ ] 16.9 Test: Mixed queue types (if supported)
- [ ] 16.10 Test: Error propagation
- [ ] 16.11 Test: Application graceful shutdown
- [ ] 16.12 Test: Consumer error handling
- [ ] 16.13 Test: Memory leak detection (long-running)
- [ ] 16.14 Test: Performance benchmarking
- [ ] 16.15 Test: Concurrent message processing

## 17. Coverage Configuration
- [ ] 17.1 Configure coverage reporters (html, text, json)
- [ ] 17.2 Set coverage thresholds in vitest.config.ts
- [ ] 17.3 Exclude files from coverage (*.spec.ts, mocks)
- [ ] 17.4 Add coverage scripts to package.json
- [ ] 17.5 Generate coverage report locally
- [ ] 17.6 Review coverage gaps
- [ ] 17.7 Add tests for uncovered code
- [ ] 17.8 Achieve 90%+ coverage target

## 18. CI/CD Integration
- [ ] 18.1 Create `.github/workflows/test.yml`
- [ ] 18.2 Add unit test job
- [ ] 18.3 Add integration test job with Docker services
- [ ] 18.4 Add coverage upload step
- [ ] 18.5 Add test results reporting
- [ ] 18.6 Configure test caching
- [ ] 18.7 Add PR status checks
- [ ] 18.8 Block merge on test failures
- [ ] 18.9 Add test performance monitoring
- [ ] 18.10 Add nightly integration test runs

## 19. Documentation
- [ ] 19.1 Add "Testing" section to README.md
- [ ] 19.2 Add coverage badge to README.md
- [ ] 19.3 Add test status badge
- [ ] 19.4 Create `TESTING.md` guide
- [ ] 19.5 Document how to run tests locally
- [ ] 19.6 Document how to run specific test suites
- [ ] 19.7 Document mock usage
- [ ] 19.8 Document integration test setup
- [ ] 19.9 Add contributing guide for tests
- [ ] 19.10 Add troubleshooting section

## 20. Quality Assurance
- [ ] 20.1 Review all tests for clarity and maintainability
- [ ] 20.2 Ensure all tests follow AAA pattern
- [ ] 20.3 Verify test names are descriptive
- [ ] 20.4 Check test isolation (no shared state)
- [ ] 20.5 Ensure fast test execution (< 30s total)
- [ ] 20.6 Add flaky test detection
- [ ] 20.7 Add test retry logic for flaky tests
- [ ] 20.8 Verify tests can run in parallel
- [ ] 20.9 Add test timeout configuration
- [ ] 20.10 Final coverage review and optimization


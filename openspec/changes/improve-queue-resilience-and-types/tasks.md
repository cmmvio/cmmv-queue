# Implementation Tasks

## 1. Type Safety Improvements
- [ ] 1.1 Create `QueueMetadata` interface in `queue.interface.ts`
- [ ] 1.2 Create `ConsumeMetadata` interface in `queue.interface.ts`
- [ ] 1.3 Create `ParamMetadata` interface in `queue.interface.ts`
- [ ] 1.4 Create `QueueConnectionState` enum in `queue.interface.ts`
- [ ] 1.5 Create `QueueHealthStatus` interface in `queue.interface.ts`
- [ ] 1.6 Replace `any` types in `queue.registry.ts` with proper interfaces
- [ ] 1.7 Add generic type parameters to `send<T>()` and `publish<T>()` methods
- [ ] 1.8 Update all Map declarations with proper type parameters

## 2. Configuration Enhancement
- [ ] 2.1 Add `retry` configuration options to `QueueConfig`
- [ ] 2.2 Add `prefetch` option for RabbitMQ in `QueueConfig`
- [ ] 2.3 Add `deadLetterQueue` configuration to `QueueConfig`
- [ ] 2.4 Add `healthCheck` configuration to `QueueConfig`
- [ ] 2.5 Add `shutdown.timeout` configuration option
- [ ] 2.6 Create `validateQueueConfig()` utility function
- [ ] 2.7 Add URL format validation for each queue type
- [ ] 2.8 Add Redis messaging mode option (list vs pubsub)

## 3. Error Handling & Resilience
- [ ] 3.1 Create `QueueError` custom error class
- [ ] 3.2 Create `RetryStrategy` class with exponential backoff
- [ ] 3.3 Implement retry logic in `processMessage()` method
- [ ] 3.4 Add dead letter queue support in RabbitMQ setup
- [ ] 3.5 Add dead letter topic support in Kafka setup
- [ ] 3.6 Improve error logging with structured error objects
- [ ] 3.7 Add circuit breaker pattern for connection failures
- [ ] 3.8 Add fallback queue for critical messages

## 4. Redis Implementation Fix
- [ ] 4.1 Refactor Redis setup to support both list and pub/sub modes
- [ ] 4.2 Implement BLPOP-based consumer for list mode
- [ ] 4.3 Fix Redis pub/sub subscription handling
- [ ] 4.4 Add Redis connection error recovery
- [ ] 4.5 Add Redis reconnection logic with backoff
- [ ] 4.6 Update Redis `send()` to match selected mode
- [ ] 4.7 Update Redis `publish()` for pub/sub mode

## 5. Graceful Shutdown
- [ ] 5.1 Add `shutdown()` method to `QueueService`
- [ ] 5.2 Implement RabbitMQ connection cleanup
- [ ] 5.3 Implement Kafka producer and consumer disconnection
- [ ] 5.4 Implement Redis client disconnection
- [ ] 5.5 Add pending message drain logic with timeout
- [ ] 5.6 Add shutdown event emission
- [ ] 5.7 Hook shutdown into CMMV application lifecycle

## 6. Health Checks & Monitoring
- [ ] 6.1 Add `connectionState` property to `QueueService`
- [ ] 6.2 Implement `healthCheck()` method
- [ ] 6.3 Add connection state tracking for each queue type
- [ ] 6.4 Add metrics collection (sent, received, failed counts)
- [ ] 6.5 Add `getMetrics()` method
- [ ] 6.6 Emit lifecycle events (connected, disconnected, error)
- [ ] 6.7 Add health check HTTP endpoint example in sample

## 7. Performance Enhancements
- [ ] 7.1 Add configurable `prefetch` to RabbitMQ channel setup
- [ ] 7.2 Add batch processing for Kafka messages
- [ ] 7.3 Add message compression option (gzip)
- [ ] 7.4 Optimize channel reuse in RabbitMQ
- [ ] 7.5 Add connection pooling configuration

## 8. Documentation & Developer Experience
- [ ] 8.1 Add JSDoc to all `QueueService` public methods
- [ ] 8.2 Add JSDoc to all decorator functions
- [ ] 8.3 Add JSDoc to `QueueRegistry` public methods
- [ ] 8.4 Add inline code examples in JSDoc comments
- [ ] 8.5 Update README.md with new features
- [ ] 8.6 Add migration guide section to README.md
- [ ] 8.7 Create examples for retry and dead letter queue
- [ ] 8.8 Add troubleshooting section to README.md

## 9. Testing
- [ ] 9.1 Add unit tests for retry mechanism
- [ ] 9.2 Add unit tests for type guards and validation
- [ ] 9.3 Add integration tests for graceful shutdown
- [ ] 9.4 Add integration tests for health checks
- [ ] 9.5 Add tests for Redis list mode
- [ ] 9.6 Add tests for error scenarios
- [ ] 9.7 Update existing tests for new types

## 10. Breaking Changes Migration
- [ ] 10.1 Create migration guide document
- [ ] 10.2 Add deprecation warnings for old Redis usage
- [ ] 10.3 Update sample applications with new patterns
- [ ] 10.4 Add version bump to 1.0.0 (breaking change)
- [ ] 10.5 Update CHANGELOG.md with breaking changes section


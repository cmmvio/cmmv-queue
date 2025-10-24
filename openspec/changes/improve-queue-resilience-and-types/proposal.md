# Improve Queue Resilience and Type Safety

## Why

After analyzing the `@cmmv/queue` implementation, several critical areas need improvement to make the module production-ready:

1. **Weak Type Safety**: Extensive use of `any` types reduces compile-time safety and developer experience
2. **Missing Error Resilience**: No retry mechanisms, dead letter queues, or graceful degradation
3. **Incomplete Redis Implementation**: Redis send() uses RPUSH but lacks corresponding consumer logic
4. **No Graceful Shutdown**: Connections aren't properly closed, risking message loss
5. **Missing Health Checks**: No way to monitor queue connection health
6. **Lack of Configuration Validation**: Invalid queue URLs or types fail at runtime without clear errors
7. **Limited Observability**: Missing JSDoc and structured error logging
8. **Performance Gaps**: No configurable prefetch for RabbitMQ, no batch processing for Kafka

These issues can lead to message loss, difficult debugging, and production failures.

## What Changes

### Type Safety Improvements
- Replace all `any` types with proper TypeScript interfaces and generics
- Create `QueueMetadata`, `ConsumeMetadata`, `ParamMetadata` interfaces
- Add generic type parameter to `QueueService.send<T>()` and `publish<T>()`

### Error Handling & Resilience
- Add retry mechanism with exponential backoff (configurable)
- Implement dead letter queue support for failed messages
- Add circuit breaker pattern for queue connections
- Improve error logging with structured error objects
- Add graceful degradation when queue is unavailable

### Redis Implementation Fix
- **BREAKING**: Refactor Redis to use proper pub/sub pattern for all operations
- Add BLPOP-based consumer for point-to-point messaging
- Separate Redis list-based and pub/sub-based implementations

### Graceful Shutdown
- Add `shutdown()` method to QueueService
- Implement proper connection cleanup for RabbitMQ, Kafka, and Redis
- Add configurable drain timeout for pending messages
- Hook into application lifecycle events

### Health Checks & Monitoring
- Add `healthCheck()` method returning connection status
- Implement connection state tracking (connecting, connected, disconnected, error)
- Add metrics collection (messages sent, received, failed)
- Emit lifecycle events (connected, disconnected, error)

### Configuration Validation
- Add URL format validation before connection
- Validate queue type against supported values
- Add required fields validation with clear error messages
- Support environment variable expansion in config

### Documentation & Developer Experience
- Add comprehensive JSDoc to all public methods
- Add inline code examples in JSDoc
- Create TypeScript type definitions for all options
- Add warning logs for deprecated patterns

### Performance Enhancements
- Add configurable `prefetch` option for RabbitMQ consumers
- Add batch processing support for Kafka
- Add connection pooling configuration
- Add message compression option

## Impact

### Affected Specs
- `queue-core` (new spec): Core queue functionality, types, and patterns

### Affected Code
- `src/queue.service.ts`: Major refactoring for resilience and types
- `src/queue.registry.ts`: Type safety improvements
- `src/queue.interface.ts`: New interfaces and types
- `src/queue.decorator.ts`: JSDoc and type improvements
- `src/queue.config.ts`: Enhanced validation and new options
- `README.md`: Updated examples and new feature documentation

### Breaking Changes
- **BREAKING**: Redis implementation changes - apps using Redis may need config updates
- **BREAKING**: Error handling changes - custom error handlers may need updates
- TypeScript strict mode users will see new compile-time errors (good thing)

### Migration Path
1. Update Redis configuration to specify messaging pattern (list vs pubsub)
2. Update error handling code if catching specific queue errors
3. Add `shutdown()` call to application cleanup logic (optional but recommended)
4. Review and fix TypeScript errors from improved typing

### Backward Compatibility
- All existing RabbitMQ and Kafka code continues to work
- New features are opt-in via configuration
- Default behavior unchanged for non-Redis queues


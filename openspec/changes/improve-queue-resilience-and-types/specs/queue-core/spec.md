# Queue Core Specification

## ADDED Requirements

### Requirement: Type Safety for Queue Registry
The queue registry SHALL use strongly-typed interfaces instead of `any` types to provide compile-time type safety and better developer experience.

#### Scenario: Type-safe queue metadata storage
- **WHEN** a queue is registered via `@Channel` decorator
- **THEN** the registry SHALL store metadata using `QueueMetadata` interface
- **AND** TypeScript SHALL provide autocomplete for all metadata fields

#### Scenario: Type-safe consume handler registration
- **WHEN** a consume handler is registered via `@Consume` decorator
- **THEN** the registry SHALL store handler metadata using `ConsumeMetadata` interface
- **AND** parameter metadata SHALL use `ParamMetadata` interface

#### Scenario: Generic message type support
- **WHEN** sending a message with `QueueService.send<T>(data: T)`
- **THEN** the type parameter T SHALL be preserved for type checking
- **AND** TypeScript SHALL enforce type compatibility

### Requirement: Retry Mechanism with Exponential Backoff
The queue service SHALL implement automatic retry for failed message processing with configurable exponential backoff.

#### Scenario: Message processing fails with retry enabled
- **WHEN** a consumer throws an error processing a message
- **AND** retry is enabled in configuration
- **THEN** the system SHALL retry processing with exponential backoff
- **AND** SHALL respect max retry attempts from configuration
- **AND** SHALL log each retry attempt with attempt number

#### Scenario: Message exceeds max retry attempts
- **WHEN** a message fails processing after max retry attempts
- **THEN** the system SHALL send message to dead letter queue (if configured)
- **OR** SHALL log error and acknowledge message (if no DLQ)
- **AND** SHALL increment failed message metric

#### Scenario: Configurable retry strategy
- **WHEN** queue configuration includes `retry.enabled: true`
- **THEN** the system SHALL use `retry.maxAttempts` (default: 3)
- **AND** SHALL use `retry.initialDelayMs` for first retry (default: 1000)
- **AND** SHALL use `retry.backoffMultiplier` for delay calculation (default: 2)

### Requirement: Dead Letter Queue Support
The queue service SHALL support dead letter queues for messages that fail processing after all retry attempts.

#### Scenario: RabbitMQ dead letter queue setup
- **WHEN** `deadLetterQueue.enabled: true` in configuration
- **THEN** the system SHALL create dead letter exchange
- **AND** SHALL bind dead letter queue to exchange
- **AND** SHALL configure main queue with `x-dead-letter-exchange` argument

#### Scenario: Kafka dead letter topic
- **WHEN** `deadLetterQueue.enabled: true` for Kafka
- **THEN** the system SHALL create dead letter topic with suffix `.dlq`
- **AND** SHALL publish failed messages to dead letter topic
- **AND** SHALL include original topic and error details in message headers

#### Scenario: Failed message routing to DLQ
- **WHEN** a message exhausts all retry attempts
- **AND** dead letter queue is configured
- **THEN** the system SHALL route message to dead letter queue
- **AND** SHALL include failure metadata (error message, attempt count, timestamp)

### Requirement: Graceful Shutdown
The queue service SHALL provide graceful shutdown capability to prevent message loss during application termination.

#### Scenario: Shutdown with pending messages
- **WHEN** `QueueService.shutdown()` is called
- **AND** messages are currently being processed
- **THEN** the system SHALL wait for in-flight messages to complete
- **AND** SHALL respect `shutdown.timeout` configuration (default: 30000ms)
- **AND** SHALL close all connections after timeout

#### Scenario: RabbitMQ graceful shutdown
- **WHEN** shutting down with RabbitMQ
- **THEN** the system SHALL stop accepting new messages
- **AND** SHALL close all channel wrappers
- **AND** SHALL close connection manager
- **AND** SHALL emit 'shutdown' event

#### Scenario: Kafka graceful shutdown
- **WHEN** shutting down with Kafka
- **THEN** the system SHALL disconnect all consumers
- **AND** SHALL disconnect producer
- **AND** SHALL wait for pending commits
- **AND** SHALL emit 'shutdown' event

#### Scenario: Redis graceful shutdown
- **WHEN** shutting down with Redis
- **THEN** the system SHALL unsubscribe from all channels
- **AND** SHALL quit Redis client connection
- **AND** SHALL emit 'shutdown' event

### Requirement: Connection Health Checks
The queue service SHALL provide health check capabilities to monitor connection status and system health.

#### Scenario: Health check for active connection
- **WHEN** `QueueService.healthCheck()` is called
- **AND** queue connection is active
- **THEN** SHALL return status 'healthy'
- **AND** SHALL include connection state
- **AND** SHALL include last successful message timestamp

#### Scenario: Health check for disconnected state
- **WHEN** `QueueService.healthCheck()` is called
- **AND** queue connection is disconnected
- **THEN** SHALL return status 'unhealthy'
- **AND** SHALL include last error message
- **AND** SHALL include disconnection timestamp

#### Scenario: Connection state tracking
- **WHEN** queue connection state changes
- **THEN** the system SHALL update `connectionState` property
- **AND** SHALL emit state change event
- **AND** SHALL log state transition

#### Scenario: Metrics collection
- **WHEN** messages are sent, received, or fail
- **THEN** the system SHALL increment corresponding metric counter
- **AND** `getMetrics()` SHALL return current counters
- **AND** metrics SHALL include: messagesSent, messagesReceived, messagesFailed

### Requirement: Configuration Validation
The queue service SHALL validate configuration before attempting connection to provide clear error messages.

#### Scenario: Invalid queue type
- **WHEN** queue configuration has unsupported `queue.type`
- **THEN** the system SHALL throw error during initialization
- **AND** error message SHALL list supported types
- **AND** SHALL not attempt connection

#### Scenario: Invalid RabbitMQ URL format
- **WHEN** queue type is 'rabbitmq'
- **AND** URL does not start with 'amqp://' or 'amqps://'
- **THEN** the system SHALL throw validation error
- **AND** error message SHALL include correct format example

#### Scenario: Invalid Kafka broker list
- **WHEN** queue type is 'kafka'
- **AND** URL is empty or not comma-separated
- **THEN** the system SHALL throw validation error
- **AND** error message SHALL include format example

#### Scenario: Missing required configuration
- **WHEN** required configuration field is missing
- **THEN** the system SHALL throw error with field name
- **AND** SHALL include expected type and default value

### Requirement: Redis Implementation with Message Modes
The Redis queue implementation SHALL support both list-based (point-to-point) and pub/sub messaging patterns.

#### Scenario: Redis list mode for point-to-point
- **WHEN** Redis mode is configured as 'list'
- **THEN** `send()` SHALL use RPUSH to queue
- **AND** consumer SHALL use BLPOP to consume messages
- **AND** messages SHALL be processed exactly once

#### Scenario: Redis pub/sub mode for broadcast
- **WHEN** Redis mode is configured as 'pubsub'
- **THEN** `publish()` SHALL use PUBLISH command
- **AND** consumer SHALL use SUBSCRIBE
- **AND** messages SHALL be delivered to all subscribers

#### Scenario: Redis connection recovery
- **WHEN** Redis connection is lost
- **THEN** the system SHALL attempt reconnection with exponential backoff
- **AND** SHALL restore all subscriptions after reconnect
- **AND** SHALL emit reconnection events

### Requirement: Performance Optimizations
The queue service SHALL provide configurable performance options for different queue systems.

#### Scenario: RabbitMQ prefetch configuration
- **WHEN** `queue.prefetch` is configured
- **THEN** RabbitMQ channel SHALL set prefetch count
- **AND** SHALL limit concurrent message processing
- **AND** default prefetch SHALL be 1

#### Scenario: Kafka batch processing
- **WHEN** `queue.batchSize` is configured for Kafka
- **THEN** consumer SHALL process messages in batches
- **AND** SHALL commit offsets after batch completion
- **AND** SHALL improve throughput for high-volume topics

#### Scenario: Message compression
- **WHEN** `queue.compression: true` is configured
- **THEN** messages SHALL be compressed before sending
- **AND** SHALL be decompressed on receipt
- **AND** SHALL support gzip algorithm

### Requirement: Enhanced Error Handling
The queue service SHALL provide detailed error information and structured error logging.

#### Scenario: Custom QueueError class
- **WHEN** a queue operation fails
- **THEN** the system SHALL throw `QueueError` instance
- **AND** error SHALL include queue type, operation, and original error
- **AND** error SHALL include context data (queue name, message id)

#### Scenario: Structured error logging
- **WHEN** an error occurs in message processing
- **THEN** the system SHALL log with structured format
- **AND** log SHALL include: timestamp, queue name, consumer name, error message, stack trace
- **AND** log level SHALL be 'error' for failures

#### Scenario: Circuit breaker for connection failures
- **WHEN** connection failures exceed threshold
- **THEN** the system SHALL enter 'circuit open' state
- **AND** SHALL reject new messages with clear error
- **AND** SHALL attempt recovery after timeout period

### Requirement: Comprehensive Documentation
All public APIs SHALL have JSDoc documentation with examples and type information.

#### Scenario: JSDoc for public methods
- **WHEN** developer hovers over public method in IDE
- **THEN** IDE SHALL display JSDoc with description
- **AND** SHALL show parameter types and descriptions
- **AND** SHALL show return type and description
- **AND** SHALL include usage example

#### Scenario: Type definitions export
- **WHEN** package is imported in TypeScript project
- **THEN** all interfaces SHALL be available for import
- **AND** type checking SHALL work without `@types` package
- **AND** autocomplete SHALL work for all options

### Requirement: Backward Compatibility (Non-Breaking Changes)
Existing applications SHALL continue to work without code changes (except Redis specifics).

#### Scenario: Default configuration behavior
- **WHEN** application does not specify new configuration options
- **THEN** the system SHALL use safe defaults
- **AND** existing behavior SHALL be preserved
- **AND** no breaking changes to RabbitMQ or Kafka

#### Scenario: Redis migration path
- **WHEN** application uses Redis without mode specification
- **THEN** the system SHALL default to 'pubsub' mode
- **AND** SHALL log deprecation warning
- **AND** SHALL suggest explicit mode configuration

#### Scenario: API compatibility
- **WHEN** application uses existing `send()` or `publish()` methods
- **THEN** methods SHALL work with same signatures
- **AND** new generic types SHALL be optional
- **AND** SHALL not require code changes


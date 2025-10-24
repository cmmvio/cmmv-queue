# Synap Queue Integration Specification

## ADDED Requirements

### Requirement: Synap as Queue Type
The queue module SHALL support Synap as a fourth queue system type alongside RabbitMQ, Kafka, and Redis.

#### Scenario: Configure Synap as queue type
- **WHEN** configuration specifies `queue.type: "synap"`
- **THEN** the system SHALL initialize Synap client
- **AND** SHALL connect to Synap server at configured URL
- **AND** SHALL log "Synap connected!" on successful connection

#### Scenario: Invalid Synap URL
- **WHEN** Synap URL is malformed or empty
- **THEN** the system SHALL throw configuration error
- **AND** error message SHALL include correct URL format example
- **AND** SHALL not attempt connection

#### Scenario: Synap connection failure
- **WHEN** Synap server is unreachable
- **THEN** the system SHALL log connection error
- **AND** SHALL include Synap URL in error message
- **AND** SHALL not crash the application

### Requirement: Synap Client Configuration
The queue module SHALL support Synap-specific configuration options including authentication and timeouts.

#### Scenario: Basic authentication configuration
- **WHEN** configuration includes `auth.type: "basic"`
- **THEN** the system SHALL authenticate using username and password
- **AND** SHALL include credentials in all Synap requests
- **AND** SHALL handle 401 errors appropriately

#### Scenario: API key authentication configuration
- **WHEN** configuration includes `auth.type: "api_key"`
- **THEN** the system SHALL authenticate using Bearer token
- **AND** SHALL include API key in Authorization header
- **AND** SHALL handle 401/403 errors appropriately

#### Scenario: Timeout configuration
- **WHEN** configuration includes `synap.timeout`
- **THEN** the system SHALL use specified timeout for Synap operations
- **AND** SHALL throw TimeoutError when exceeded
- **AND** default timeout SHALL be 10000ms if not specified

#### Scenario: Debug mode configuration
- **WHEN** configuration includes `synap.debug: true`
- **THEN** the system SHALL log all Synap requests and responses
- **AND** SHALL include request method, URL, and payload
- **AND** SHALL include response status and body

### Requirement: Queue Creation and Management
The queue module SHALL create and manage Synap queues based on Channel decorator metadata.

#### Scenario: Create queue from @Channel decorator
- **WHEN** consumer class has `@Channel("tasks")` decorator
- **THEN** the system SHALL create Synap queue named "tasks"
- **AND** SHALL use default queue configuration if not specified
- **AND** SHALL log queue creation success

#### Scenario: Queue already exists
- **WHEN** attempting to create queue that already exists
- **THEN** the system SHALL reuse existing queue
- **AND** SHALL not throw error
- **AND** SHALL log queue reuse

#### Scenario: Queue creation with options
- **WHEN** @Channel includes `{ durable: true }` option
- **THEN** the system SHALL create durable queue
- **AND** Synap queues ARE durable by default
- **AND** SHALL respect max_depth and ack_deadline options

### Requirement: Point-to-Point Messaging (Queue Mode)
The queue module SHALL support point-to-point messaging using Synap's queue system when pubSub is false or not specified.

#### Scenario: Publish message to Synap queue
- **WHEN** `QueueService.send("tasks", "process", data)` is called
- **AND** queue type is "synap"
- **THEN** the system SHALL publish message to Synap queue "tasks"
- **AND** SHALL serialize data as JSON
- **AND** SHALL return true on success

#### Scenario: Consume message from Synap queue
- **WHEN** consumer is registered via @Consume("tasks")
- **THEN** the system SHALL poll Synap queue for messages
- **AND** SHALL deserialize JSON message data
- **AND** SHALL invoke consumer handler with deserialized data

#### Scenario: Message priority support
- **WHEN** publishing message with priority option
- **THEN** the system SHALL pass priority to Synap (0-9 scale)
- **AND** higher priority messages SHALL be consumed first
- **AND** default priority SHALL be 5

#### Scenario: Message retry support
- **WHEN** publishing message with max_retries option
- **THEN** the system SHALL configure Synap message retry count
- **AND** SHALL respect max_retries value
- **AND** default max_retries SHALL be 3

### Requirement: Message Acknowledgment
The queue module SHALL support ACK/NACK operations using Synap's acknowledgment system.

#### Scenario: Automatic message acknowledgment
- **WHEN** consumer handler completes successfully
- **THEN** the system SHALL send ACK to Synap
- **AND** message SHALL be removed from queue
- **AND** SHALL log acknowledgment

#### Scenario: Message processing failure
- **WHEN** consumer handler throws error
- **AND** message has retry attempts remaining
- **THEN** the system SHALL send NACK with requeue=true
- **AND** Synap SHALL requeue message for retry
- **AND** retry_count SHALL be incremented

#### Scenario: Message exceeds max retries
- **WHEN** message fails after max_retries attempts
- **THEN** the system SHALL send NACK with requeue=false
- **AND** Synap SHALL move message to dead letter queue
- **AND** SHALL log DLQ routing

### Requirement: Pub/Sub Messaging (Broadcast Mode)
The queue module SHALL support pub/sub messaging using Synap's pub/sub system when pubSub is true.

#### Scenario: Pub/sub channel configuration
- **WHEN** @Channel includes `{ pubSub: true, exchangeName: "events" }`
- **THEN** the system SHALL use Synap pub/sub instead of queue
- **AND** SHALL not create queue in Synap
- **AND** SHALL use exchangeName as topic prefix

#### Scenario: Publish to pub/sub topic
- **WHEN** `QueueService.publish("events", "user.created", data)` is called
- **AND** channel is configured with pubSub: true
- **THEN** the system SHALL publish to Synap topic "events.user.created"
- **AND** SHALL serialize data as JSON
- **AND** SHALL return true on success

#### Scenario: Subscribe to pub/sub topic
- **WHEN** consumer is registered for pub/sub channel
- **THEN** the system SHALL subscribe to Synap topic
- **AND** SHALL receive all published messages
- **AND** multiple subscribers SHALL receive same message

#### Scenario: Topic wildcard support
- **WHEN** subscribing to topic with wildcard pattern
- **THEN** the system SHALL leverage Synap's wildcard matching
- **AND** SHALL support `*` for single-level wildcards
- **AND** SHALL support `#` for multi-level wildcards

### Requirement: Parameter Injection
The queue module SHALL inject Synap-specific objects into consumer methods via parameter decorators.

#### Scenario: @QueueMessage parameter injection
- **WHEN** consumer method has @QueueMessage() parameter
- **THEN** the system SHALL inject deserialized message data
- **AND** SHALL preserve data types from JSON
- **AND** SHALL inject at correct parameter index

#### Scenario: @QueueChannel parameter injection
- **WHEN** consumer method has @QueueChannel() parameter
- **THEN** the system SHALL inject Synap queue instance
- **OR** SHALL inject null if using pub/sub mode
- **AND** SHALL inject at correct parameter index

#### Scenario: @QueueConn parameter injection
- **WHEN** consumer method has @QueueConn() parameter
- **THEN** the system SHALL inject Synap client connection
- **AND** connection SHALL be active and authenticated
- **AND** SHALL inject at correct parameter index

### Requirement: Type Safety Integration
The queue module SHALL leverage TypeScript types from @hivellm/synap SDK for type-safe operations.

#### Scenario: Type-safe message data
- **WHEN** sending message with typed data
- **THEN** TypeScript SHALL enforce type compatibility
- **AND** SHALL provide autocomplete for data properties
- **AND** SHALL catch type errors at compile time

#### Scenario: Type-safe consumer handlers
- **WHEN** defining consumer method with typed parameters
- **THEN** TypeScript SHALL enforce parameter types
- **AND** SHALL provide intellisense in IDE
- **AND** SHALL ensure type safety at compile time

#### Scenario: Synap error types
- **WHEN** Synap operation throws error
- **THEN** error SHALL be typed SynapError or subclass
- **AND** SHALL include error message, status code
- **AND** SHALL be catchable with type guards

### Requirement: Connection Lifecycle
The queue module SHALL manage Synap connection lifecycle including initialization and cleanup.

#### Scenario: Connection initialization
- **WHEN** application starts with Synap queue type
- **THEN** the system SHALL create Synap client instance
- **AND** SHALL connect to configured Synap server
- **AND** SHALL log connection success or failure
- **AND** SHALL store client in QueueService instance

#### Scenario: Graceful shutdown
- **WHEN** application is shutting down
- **THEN** the system SHALL close Synap client connection
- **AND** SHALL wait for in-flight messages to complete
- **AND** SHALL log disconnection
- **AND** SHALL not leave orphaned connections

#### Scenario: Connection retry on failure
- **WHEN** initial Synap connection fails
- **THEN** the system SHALL log error without crashing
- **AND** SHALL allow application to continue
- **AND** MAY implement retry mechanism (optional)

### Requirement: Error Handling and Logging
The queue module SHALL provide comprehensive error handling and structured logging for Synap operations.

#### Scenario: Structured error logging
- **WHEN** Synap operation fails
- **THEN** the system SHALL log error with structured format
- **AND** SHALL include operation name, queue name, error message
- **AND** SHALL include stack trace for debugging
- **AND** log level SHALL be 'error'

#### Scenario: Network error handling
- **WHEN** network error occurs during Synap operation
- **THEN** the system SHALL catch NetworkError from SDK
- **AND** SHALL log network error details
- **AND** SHALL not crash application
- **AND** SHALL return false from send/publish methods

#### Scenario: Authentication error handling
- **WHEN** authentication fails (401/403)
- **THEN** the system SHALL log authentication error
- **AND** SHALL include error message from Synap
- **AND** SHALL suggest checking credentials
- **AND** SHALL not retry with same credentials

#### Scenario: Timeout error handling
- **WHEN** Synap operation times out
- **THEN** the system SHALL throw TimeoutError
- **AND** SHALL log timeout with operation details
- **AND** SHALL include configured timeout value
- **AND** SHALL not leave operation pending

### Requirement: Performance Optimization
The queue module SHALL leverage Synap's high-performance capabilities for optimal throughput.

#### Scenario: Efficient message serialization
- **WHEN** sending large messages
- **THEN** the system SHALL use efficient JSON serialization
- **AND** SHALL support Synap's native compression if configured
- **AND** SHALL handle binary data if needed

#### Scenario: Connection reuse
- **WHEN** publishing multiple messages
- **THEN** the system SHALL reuse single Synap client connection
- **AND** SHALL not create new connection per message
- **AND** SHALL leverage HTTP keep-alive

#### Scenario: Batch operations support
- **WHEN** publishing multiple messages to same queue
- **THEN** the system MAY batch operations for efficiency
- **AND** SHALL maintain message order
- **AND** SHALL handle partial failures gracefully

### Requirement: Health Check Integration
The queue module SHALL provide health check capabilities for Synap connections.

#### Scenario: Health check for active connection
- **WHEN** health check is requested
- **AND** Synap connection is active
- **THEN** the system SHALL return 'healthy' status
- **AND** SHALL include Synap server URL
- **AND** SHALL include connection state

#### Scenario: Health check for failed connection
- **WHEN** health check is requested
- **AND** Synap connection has failed
- **THEN** the system SHALL return 'unhealthy' status
- **AND** SHALL include error details
- **AND** SHALL suggest remediation

### Requirement: Backward Compatibility
Existing queue configurations SHALL continue to work without changes.

#### Scenario: RabbitMQ configuration unchanged
- **WHEN** application uses RabbitMQ queue type
- **THEN** the system SHALL continue to work as before
- **AND** SHALL not require code changes
- **AND** Synap dependency SHALL not affect RabbitMQ

#### Scenario: Kafka configuration unchanged
- **WHEN** application uses Kafka queue type
- **THEN** the system SHALL continue to work as before
- **AND** SHALL not require code changes
- **AND** Synap dependency SHALL not affect Kafka

#### Scenario: Redis configuration unchanged
- **WHEN** application uses Redis queue type
- **THEN** the system SHALL continue to work as before
- **AND** SHALL not require code changes
- **AND** Synap dependency SHALL not affect Redis

### Requirement: Documentation and Examples
The queue module SHALL provide comprehensive documentation for Synap integration.

#### Scenario: README documentation
- **WHEN** developer reads README.md
- **THEN** SHALL find Synap configuration section
- **AND** SHALL find usage examples
- **AND** SHALL find comparison with other queue types
- **AND** SHALL find migration guide

#### Scenario: Sample application
- **WHEN** developer explores sample directory
- **THEN** SHALL find Synap consumer example
- **AND** SHALL find Synap configuration file
- **AND** SHALL find instructions to run Synap examples
- **AND** examples SHALL be executable

#### Scenario: TypeScript intellisense
- **WHEN** developer writes code in IDE
- **THEN** IDE SHALL provide autocomplete for Synap options
- **AND** SHALL show JSDoc documentation
- **AND** SHALL enforce type checking
- **AND** SHALL catch configuration errors at compile time


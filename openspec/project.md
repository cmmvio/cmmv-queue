# Project Context

## Purpose
The `@cmmv/queue` module provides a unified interface for message queue management with support for multiple queue systems (RabbitMQ, Kafka, and Redis). It enables developers to build scalable, event-driven applications using a decorator-based API for defining message consumers and producers, making it easy to implement message-driven architectures within the CMMV (Contract-Model-Model-View) framework.

## Tech Stack
- **Language**: TypeScript 5.7+ (ESNext target, Node module resolution)
- **Runtime**: Node.js >= 20.0.0
- **Core Framework**: @cmmv/core (CMMV framework)
- **Queue Systems**:
  - RabbitMQ via `amqp-connection-manager` ^4.1.14 and `amqplib` ^0.10.5
  - Kafka via `kafkajs` ^2.2.4
  - Redis via `ioredis` ^5.5.0
- **Build Tools**: esbuild, cmmv CLI
- **Testing**: Vitest
- **Package Manager**: pnpm (with workspace support)
- **Linting**: ESLint with custom config
- **Code Formatting**: Prettier
- **Commit Hooks**: Husky with lint-staged
- **Changelog**: Conventional Changelog

## Project Conventions

### Code Style
- **Formatting**: Prettier with configuration from `.prettierrc`
- **Linting**: ESLint via `cmmv lint` command
- **File Extensions**: `.ts` for TypeScript source files
- **Module System**: Dual ESM/CJS exports (primary: ESM, fallback: CJS)
- **Decorators**: Experimental decorators enabled with metadata emission
- **Naming Conventions**:
  - Services: PascalCase with `Service` suffix (e.g., `QueueService`)
  - Consumers: PascalCase with `Consumer` suffix (e.g., `HelloWorldConsumer`)
  - Decorators: PascalCase with `@` prefix (e.g., `@Channel`, `@Consume`)
  - Files: kebab-case (e.g., `queue.service.ts`, `queue.decorator.ts`)
- **Type Safety**: Relaxed strict mode for flexibility (strictNullChecks: false, noImplicitAny: false)

### Architecture Patterns
- **Singleton Pattern**: Core services extend `Singleton` from @cmmv/core
- **Dependency Injection**: Constructor-based injection via CMMV framework
- **Decorator-Based API**: Message handlers registered via `@Channel` and `@Consume` decorators
- **Registry Pattern**: `QueueRegistry` manages channel and consumer handler mappings
- **Lifecycle Hooks**: Static `loadConfig` methods for initialization and queue setup
- **Multi-Queue Strategy**: Adapter pattern supporting RabbitMQ, Kafka, and Redis with unified interface
- **Module System**: CMMV module pattern with `QueueModule` as entry point
- **Channel Management**: Map-based channel tracking for connection reuse

### Testing Strategy
- **Test Framework**: Vitest (configured in `vitest.config.ts`)
- **Test Command**: `pnpm test`
- **Sample Application**: Located in `sample/` directory for manual testing and examples
- **Coverage**: Test files excluded from build (`.spec.ts` pattern)
- **Dev Mode**: `pnpm dev` runs sample application with hot reload

### Git Workflow
- **Commit Convention**: Conventional Commits via commitlint
- **Commitlint Config**: Angular/Conventional config
- **Pre-commit Hooks**: Prettier auto-formatting via lint-staged
- **Branching**: Standard Git workflow (main branch)
- **Versioning**: Semantic versioning (current: 0.8.0)
- **Release Process**: `cmmv release` command
- **Changelog**: `conventional-changelog -p angular -i CHANGELOG.md -s`

## Domain Context
- **CMMV Framework**: Part of the CMMV ecosystem (cmmv.io), a contract-based framework for building modular applications
- **Queue Types**: Supports three queue systems with different use cases:
  - **RabbitMQ**: Traditional message broker with robust routing and delivery guarantees
  - **Kafka**: High-throughput distributed event streaming platform
  - **Redis**: In-memory pub/sub for low-latency messaging
- **Message Patterns**:
  - **Point-to-Point**: Direct queue consumption (default)
  - **Pub/Sub**: Broadcast messaging via exchanges (enabled with `pubSub: true`)
- **Consumer Registration**: Consumers registered during application initialization via `loadConfig` hook
- **Channel Configuration**: Supports exchange-based routing, exclusive queues, auto-delete, and durable queues
- **Message Acknowledgment**: Automatic message acknowledgment after successful processing
- **Error Handling**: Graceful fallback for non-JSON messages and consumer errors

## Important Constraints
- **Node Version**: Requires Node.js >= 20.0.0
- **Module Format**: Dual ESM/CJS exports (main: CJS, module: ESM)
- **Decorator Support**: Requires experimentalDecorators and emitDecoratorMetadata
- **CMMV Dependency**: Tightly coupled with @cmmv/core framework
- **Decorator Context**: `@Channel` decorator only on classes, `@Consume` only on class methods
- **Queue Configuration**: Must provide `queue.type` and `queue.url` in `.cmmv.config.js`
- **Build Outputs**: Must maintain `dist/esm`, `dist/cjs`, and `dist/types` directories
- **Connection Lifecycle**: Queue connections established during application bootstrap, not runtime
- **Single Queue Type**: Application can only use one queue system at a time (RabbitMQ OR Kafka OR Redis)

## External Dependencies
- **@cmmv/core**: Core framework providing Application, Service, Logger, Config, Singleton
- **@cmmv/http**: Optional HTTP module for web applications (dev dependency)
- **@cmmv/server**: CMMV server module (dev dependency)
- **@cmmv/view**: View rendering module (dev dependency)
- **amqp-connection-manager**: RabbitMQ connection management with auto-reconnect
- **amqplib**: RabbitMQ client library (AMQP 0-9-1 protocol)
- **kafkajs**: Apache Kafka client for Node.js
- **ioredis**: High-performance Redis client with cluster support
- **NPM Registry**: Published to npmjs.com under @cmmv scope
- **GitHub**: Repository at github.com/cmmvio/cmmv-queue

## Queue System Configuration
- **RabbitMQ**:
  - URL format: `amqp://user:password@host:port/vhost`
  - Features: Exchange-based routing, persistent messages, acknowledgments
  - Default settings: Durable queues, topic exchanges for pub/sub
- **Kafka**:
  - URL format: `broker1:9092,broker2:9092` (comma-separated brokers)
  - Features: Consumer groups, topic-based messaging, offset management
  - Group ID: Auto-generated as `${queueName}-${message}`
- **Redis**:
  - URL format: `redis://host:port` or connection string
  - Features: Pub/Sub channels, list-based queues (RPUSH)
  - Limitations: At-most-once delivery (no acknowledgments)

## Parameter Decorators
- **@QueueMessage()**: Injects the message payload into handler method
- **@QueueChannel()**: Injects the channel object (RabbitMQ only, null for Kafka/Redis)
- **@QueueConn()**: Injects the connection instance (RabbitMQ only, null for Kafka/Redis)
- **Parameter Ordering**: Handled automatically via parameter index tracking in registry

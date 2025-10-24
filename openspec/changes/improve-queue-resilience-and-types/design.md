# Technical Design: Queue Resilience and Type Safety

## Context

The current `@cmmv/queue` implementation works for basic use cases but lacks production-grade features like resilience, observability, and type safety. This design addresses these gaps while maintaining backward compatibility.

**Stakeholders**: 
- Application developers using @cmmv/queue in production
- CMMV framework maintainers
- DevOps teams monitoring queue health

**Background**:
- Current version: 0.8.0
- Heavy use of `any` types reduces type safety
- No retry or dead letter queue support
- Redis implementation incomplete
- No graceful shutdown mechanism

## Goals / Non-Goals

### Goals
1. Make the module production-ready with resilience features
2. Improve type safety to prevent runtime errors
3. Add observability for monitoring and debugging
4. Fix Redis implementation to support both messaging modes
5. Maintain backward compatibility for RabbitMQ and Kafka

### Non-Goals
1. NOT adding new queue system support (e.g., SQS, Azure Service Bus)
2. NOT changing the decorator-based API
3. NOT adding GraphQL or gRPC bindings
4. NOT implementing distributed tracing (can be added later)
5. NOT changing the module's singleton pattern

## Decisions

### Decision 1: Use Interface-Based Type System
**What**: Replace `any` types with proper TypeScript interfaces

**Why**: 
- Compile-time type checking prevents runtime errors
- Better IDE autocomplete and developer experience
- Self-documenting code through type definitions
- Easier refactoring and maintenance

**Alternatives Considered**:
- Keep `any` types: Rejected - reduces safety and DX
- Use `unknown`: Rejected - requires excessive type guards
- Use classes instead of interfaces: Rejected - adds runtime overhead

**Implementation**:
```typescript
// New interfaces in queue.interface.ts
export interface QueueMetadata {
    queueName: string;
    exchangeName: string;
    pubSub: boolean;
    durable: boolean;
    autoDelete: boolean;
    exclusive: boolean;
    consumes: ConsumeMetadata[];
}

export interface ConsumeMetadata {
    message: string;
    handlerName: string;
    params: ParamMetadata[];
}

export interface ParamMetadata {
    paramType: 'message' | 'channel' | 'conn' | 'queueName';
    index: number;
}
```

### Decision 2: Exponential Backoff Retry Strategy
**What**: Implement configurable retry with exponential backoff

**Why**:
- Handles transient failures gracefully
- Prevents overwhelming downstream services
- Industry standard pattern (AWS, Google Cloud use it)
- Configurable for different use cases

**Alternatives Considered**:
- Fixed delay retry: Rejected - not adaptive to failure types
- No retry: Rejected - loses messages on transient failures
- Immediate retry: Rejected - can cascade failures

**Implementation**:
```typescript
export class RetryStrategy {
    constructor(
        private maxAttempts: number = 3,
        private initialDelayMs: number = 1000,
        private multiplier: number = 2,
        private maxDelayMs: number = 30000
    ) {}

    async execute<T>(
        fn: () => Promise<T>,
        onRetry?: (attempt: number, error: Error) => void
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt < this.maxAttempts - 1) {
                    const delay = Math.min(
                        this.initialDelayMs * Math.pow(this.multiplier, attempt),
                        this.maxDelayMs
                    );
                    
                    onRetry?.(attempt + 1, error);
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### Decision 3: Separate Redis Modes (List vs Pub/Sub)
**What**: Add explicit configuration for Redis messaging mode

**Why**:
- Current Redis implementation mixes patterns incorrectly
- List mode (RPUSH/BLPOP) provides exactly-once delivery
- Pub/Sub mode (PUBLISH/SUBSCRIBE) provides broadcast
- Different use cases need different guarantees

**Alternatives Considered**:
- Auto-detect mode: Rejected - ambiguous, error-prone
- Only support pub/sub: Rejected - loses point-to-point capability
- Create separate Redis adapters: Rejected - too complex

**Configuration**:
```javascript
// .cmmv.config.js
module.exports = {
    queue: {
        type: "redis",
        url: "redis://localhost:6379",
        redis: {
            mode: "list" // or "pubsub"
        }
    }
};
```

**Migration**: Default to "pubsub" for backward compatibility with deprecation warning

### Decision 4: Graceful Shutdown with Drain Timeout
**What**: Add `shutdown()` method with configurable timeout

**Why**:
- Prevents message loss during deployment
- Allows in-flight messages to complete
- Industry best practice for queue consumers
- Required for Kubernetes graceful termination

**Alternatives Considered**:
- Immediate shutdown: Rejected - loses in-flight messages
- Unlimited wait: Rejected - can hang deployments
- No shutdown method: Rejected - not production-ready

**Implementation Flow**:
1. Stop accepting new messages
2. Wait for in-flight messages (up to timeout)
3. Force close connections after timeout
4. Emit shutdown event

### Decision 5: Health Check with Connection State
**What**: Add `healthCheck()` method returning detailed status

**Why**:
- Required for Kubernetes liveness/readiness probes
- Enables monitoring and alerting
- Helps diagnose connection issues
- Standard practice for microservices

**Alternatives Considered**:
- Simple boolean health: Rejected - not enough detail
- HTTP endpoint only: Rejected - should be programmatic
- Ping-based check: Rejected - adds unnecessary load

**Return Type**:
```typescript
export interface QueueHealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    connectionState: 'connected' | 'connecting' | 'disconnected' | 'error';
    queueType: string;
    lastMessageAt?: Date;
    lastErrorAt?: Date;
    lastError?: string;
    metrics: {
        messagesSent: number;
        messagesReceived: number;
        messagesFailed: number;
    };
}
```

### Decision 6: Custom QueueError Class
**What**: Create specific error class for queue operations

**Why**:
- Easier to catch and handle queue-specific errors
- Can include context (queue name, operation, message ID)
- Better error messages for debugging
- Follows JavaScript best practices

**Implementation**:
```typescript
export class QueueError extends Error {
    constructor(
        message: string,
        public readonly queueType: string,
        public readonly operation: string,
        public readonly context?: Record<string, any>,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'QueueError';
        Error.captureStackTrace(this, this.constructor);
    }
}
```

## Risks / Trade-offs

### Risk 1: Redis Breaking Change
**Risk**: Existing Redis users must update configuration

**Mitigation**: 
- Default to 'pubsub' mode for backward compatibility
- Add deprecation warning for unspecified mode
- Provide clear migration guide
- Version bump to 1.0.0 signals breaking change

### Risk 2: Performance Impact of Retry
**Risk**: Retry logic adds latency to failed messages

**Mitigation**:
- Make retry opt-in via configuration
- Use async retry to not block other messages
- Configurable retry delays
- Circuit breaker prevents retry storms

### Risk 3: Increased Complexity
**Risk**: More code = more bugs

**Mitigation**:
- Comprehensive unit tests for new features
- Integration tests for retry and shutdown
- Clear documentation with examples
- Gradual rollout with feature flags

### Trade-off 1: Type Safety vs Flexibility
**Trade-off**: Strict types reduce flexibility

**Decision**: Favor type safety
**Rationale**: Compile-time errors better than runtime failures

### Trade-off 2: Backward Compatibility vs Clean API
**Trade-off**: Supporting old patterns adds complexity

**Decision**: Maintain compatibility for non-Redis
**Rationale**: Don't break working RabbitMQ/Kafka code

## Migration Plan

### Phase 1: Non-Breaking Improvements (v0.9.0)
1. Add new interfaces and types
2. Add retry mechanism (opt-in)
3. Add health checks
4. Add graceful shutdown
5. Add JSDoc documentation
6. Update README with new features

**No code changes required for users**

### Phase 2: Redis Refactor (v1.0.0 - Breaking)
1. Add Redis mode configuration
2. Implement list mode properly
3. Add deprecation warning for unspecified mode
4. Provide migration guide

**Required action**: Redis users add `redis.mode` config

### Phase 3: Deprecation Cleanup (v2.0.0 - Future)
1. Remove deprecated patterns
2. Make mode required for Redis
3. Potentially remove pub/sub default

### Rollback Plan
If issues arise:
1. Revert to previous version via NPM
2. Feature flags allow disabling retry/shutdown
3. Redis mode defaults ensure basic functionality

## Open Questions

1. **Q**: Should we add OpenTelemetry tracing support?
   **A**: Defer to future version - can be added non-breaking

2. **Q**: Should prefetch be configurable per-consumer or globally?
   **A**: Start with global, add per-consumer if needed

3. **Q**: Should we add message priority support?
   **A**: Defer - not all queue systems support it

4. **Q**: Should we add message deduplication?
   **A**: Defer - complex and queue-specific

5. **Q**: Should health check be automatically exposed via HTTP?
   **A**: No - let apps decide. Provide example in README.


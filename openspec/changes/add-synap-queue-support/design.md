# Technical Design: Synap Queue Integration

## Context

The `@cmmv/queue` module currently supports three queue systems (RabbitMQ, Kafka, Redis), each with different strengths and trade-offs. However, they all require separate deployments, complex configuration, and have performance limitations.

[Synap](https://github.com/hivellm/synap) is a modern, high-performance data infrastructure system built in Rust that combines key-value storage, message queues, event streams, and pub/sub into a unified platform.

**Stakeholders**:
- CMMV framework developers
- Application developers using @cmmv/queue
- DevOps teams managing queue infrastructure
- HiveLLM organization (maintainers of both CMMV and Synap)

**Background**:
- Synap provides 100x faster queue operations vs RabbitMQ
- Synap provides 120x faster KV reads vs Redis
- Official TypeScript SDK (`@hivellm/synap`) with excellent types
- Production-ready: 99.30% test coverage, master-slave replication, persistence
- Both CMMV and Synap maintained by same organization

## Goals / Non-Goals

### Goals
1. Add Synap as 4th supported queue type in `@cmmv/queue`
2. Leverage Synap's superior performance and unified architecture
3. Maintain backward compatibility with existing queue types
4. Provide type-safe integration using Synap's TypeScript SDK
5. Support both queue (point-to-point) and pub/sub messaging patterns
6. Make integration simple and intuitive for CMMV developers

### Non-Goals
1. NOT replacing existing queue systems (RabbitMQ, Kafka, Redis remain supported)
2. NOT implementing Synap-specific advanced features (event streams, KV store) in this phase
3. NOT making Synap the default queue type
4. NOT creating custom Synap protocol implementation (use SDK)
5. NOT adding reactive patterns to core (keep optional via SDK)

## Decisions

### Decision 1: Use Official @hivellm/synap SDK
**What**: Integrate via `@hivellm/synap` npm package instead of implementing custom HTTP client

**Why**:
- Official SDK is production-ready with 100% test coverage
- Provides excellent TypeScript types and developer experience
- Handles authentication, serialization, error handling automatically
- Includes advanced features (RxJS, health checks, compression)
- Maintained by same organization, ensuring compatibility

**Alternatives Considered**:
- Custom HTTP implementation: Rejected - reinvents wheel, more maintenance
- Direct Synap protocol: Rejected - complex, no type safety
- Wrap Rust client via N-API: Rejected - complex build, deployment issues

**Implementation**:
```typescript
import { Synap } from '@hivellm/synap';

// Initialize client
const synap = new Synap({
    url: Config.get('queue.url'),
    auth: Config.get('queue.auth'),
    timeout: Config.get('queue.synap.timeout', 10000)
});

// Use SDK methods
await synap.queue.createQueue(queueName);
await synap.queue.publishJSON(queueName, data);
```

### Decision 2: Map Queue Modes to Synap Systems
**What**: Use Synap's queue system for point-to-point, pub/sub system for broadcast

**Why**:
- Synap queue system provides ACK/NACK, retries, DLQ (like RabbitMQ)
- Synap pub/sub provides broadcast messaging (like Redis pub/sub)
- Clear separation of concerns
- Leverages appropriate Synap feature for each pattern

**Mapping**:
```typescript
// Point-to-Point (pubSub: false or undefined)
@Channel('tasks')  →  synap.queue.createQueue('tasks')
queueService.send()  →  synap.queue.publishJSON()

// Broadcast (pubSub: true)
@Channel('events', { pubSub: true, exchangeName: 'app' })
queueService.publish()  →  synap.pubsub.publish('app.eventName')
```

**Alternatives Considered**:
- Use event streams for all: Rejected - overkill for simple queues
- Use pub/sub for all: Rejected - no ACK/NACK support
- Create hybrid system: Rejected - too complex

### Decision 3: JSON-Only Message Format
**What**: Support only JSON serialization for Synap messages (for now)

**Why**:
- 90% of use cases use JSON data
- Synap SDK has excellent JSON support
- Simpler implementation, fewer edge cases
- Consistent with other @cmmv modules

**Alternatives Considered**:
- Support binary (Uint8Array): Deferred - can add later if needed
- Support protobuf: Rejected - adds complexity
- Support MessagePack: Deferred - Synap supports it, can add later

**Future Extension**:
```typescript
// Potential future support
queueService.sendBinary('queue', new Uint8Array([...]));
queueService.sendProtobuf('queue', protoMessage);
```

### Decision 4: Automatic ACK/NACK Handling
**What**: Automatically ACK on success, NACK on handler errors

**Why**:
- Consistent with RabbitMQ implementation in @cmmv/queue
- Prevents message loss from forgotten ACKs
- Simpler developer experience
- Synap handles retry logic and DLQ automatically

**Implementation**:
```typescript
try {
    await handler(...args);
    await synap.queue.ack(queueName, messageId); // Auto-ACK
} catch (error) {
    await synap.queue.nack(queueName, messageId, true); // Auto-NACK + requeue
}
```

**Alternatives Considered**:
- Manual ACK/NACK: Rejected - error-prone, inconsistent with existing
- No ACK (fire-and-forget): Rejected - loses delivery guarantees
- Configurable ACK mode: Deferred - can add if requested

### Decision 5: Consumer Polling Strategy
**What**: Poll Synap queue at regular intervals (default: 1000ms)

**Why**:
- Synap doesn't have push-based consumption via HTTP
- Polling is simple and works reliably
- Configurable interval allows tuning for latency vs load
- Consistent with how Kafka adapter works

**Configuration**:
```typescript
// In QueueConfig
synap: {
    pollingInterval: 1000, // ms between polls
    concurrency: 5 // max concurrent messages
}
```

**Alternatives Considered**:
- WebSocket-based push: Deferred - Synap supports it, can add later
- Long polling: Rejected - HTTP timeout issues
- RxJS reactive consumption: Deferred - optional advanced feature

**Optimization**:
- Use exponential backoff when queue is empty
- Batch consumption if multiple messages available

### Decision 6: Connection Pooling and Reuse
**What**: Create single Synap client instance, reuse for all operations

**Why**:
- HTTP connection pooling for better performance
- Synap SDK handles connection management internally
- Reduces memory overhead
- Simpler lifecycle management

**Implementation**:
```typescript
export class QueueService extends Singleton {
    private synapClient: Synap; // Single instance
    
    private async setupSynap(application: Application) {
        this.synapClient = new Synap({
            url: Config.get('queue.url'),
            auth: Config.get('queue.auth')
        });
        
        // Reuse for all queue operations
    }
}
```

**Alternatives Considered**:
- Client per queue: Rejected - wasteful
- Connection pooling: Not needed - SDK handles it
- Lazy initialization: Rejected - init during startup preferred

### Decision 7: Authentication Pass-Through
**What**: Pass authentication config directly to Synap SDK

**Why**:
- Synap SDK has excellent auth support (Basic, API Key)
- No need to reimplement authentication logic
- Supports future auth methods (JWT, OAuth)
- Clear configuration structure

**Configuration**:
```javascript
// .cmmv.config.js
module.exports = {
    queue: {
        type: "synap",
        url: "http://localhost:15500",
        auth: {
            type: "api_key",
            apiKey: process.env.SYNAP_API_KEY
        }
    }
}
```

**Alternatives Considered**:
- Custom auth headers: Rejected - SDK handles it better
- No authentication: Rejected - not production-ready
- Separate auth module: Rejected - overcomplicated

### Decision 8: Error Handling Strategy
**What**: Use Synap SDK error types, wrap in QueueError when needed

**Why**:
- Synap SDK provides typed errors (NetworkError, ServerError, TimeoutError)
- Type guards work correctly in TypeScript
- Consistent with SDK patterns
- Clear error messages from Synap

**Implementation**:
```typescript
import { NetworkError, ServerError, SynapError } from '@hivellm/synap';

try {
    await synap.queue.publishJSON(queueName, data);
} catch (error) {
    if (error instanceof NetworkError) {
        this.logger.error(`Network error: ${error.message}`);
    } else if (error instanceof ServerError) {
        this.logger.error(`Server error: ${error.message} (${error.statusCode})`);
    }
    return false;
}
```

**Alternatives Considered**:
- Wrap all errors: Rejected - loses type information
- Custom error mapping: Rejected - unnecessary complexity
- Ignore SDK errors: Rejected - poor developer experience

## Risks / Trade-offs

### Risk 1: Synap Dependency
**Risk**: Adding dependency on Synap (newer project, 0.3.0-rc)

**Mitigation**:
- Synap is opt-in, not required for existing users
- Both CMMV and Synap from same organization (HiveLLM)
- Synap has 99.30% test coverage, production deployments
- Clear SemVer commitment from Synap team
- Can deprecate if project becomes unmaintained

**Likelihood**: Low  
**Impact**: Medium  
**Accept**: Yes - benefits outweigh risks

### Risk 2: Performance Expectations
**Risk**: Users expect 100x performance but see less improvement

**Mitigation**:
- Document that performance depends on deployment (network, hardware)
- Provide benchmark comparisons in documentation
- Set realistic expectations (still much faster than alternatives)
- Provide tuning guide for optimal performance

**Likelihood**: Medium  
**Impact**: Low (perception issue)  
**Accept**: Yes - manage expectations via documentation

### Risk 3: Feature Parity
**Risk**: Synap missing features users expect from RabbitMQ/Kafka

**Mitigation**:
- Document feature comparison clearly
- Synap has most critical features (ACK, retry, DLQ, priority)
- Missing features can be added to Synap (same org)
- Users can choose appropriate queue type for their needs

**Likelihood**: Low  
**Impact**: Low  
**Accept**: Yes - Synap has sufficient features for most use cases

### Trade-off 1: SDK Dependency vs Custom Implementation
**Trade-off**: Using SDK adds dependency, but saves development time

**Decision**: Use SDK  
**Rationale**:
- Pros: Type safety, maintained, features, testing
- Cons: External dependency, bundle size (+50KB)
- Bundle size acceptable for benefits gained

### Trade-off 2: Polling vs Push
**Trade-off**: Polling adds latency but simpler implementation

**Decision**: Start with polling, add push later  
**Rationale**:
- Polling: Simple, reliable, works everywhere
- Push (WebSocket): Lower latency, complex, not HTTP-only
- Can add WebSocket support in future release

### Trade-off 3: JSON-Only vs Multi-Format
**Trade-off**: JSON-only limits use cases but simpler

**Decision**: JSON-only for v1  
**Rationale**:
- 90% of use cases covered
- Can add binary/protobuf later if needed
- Keeps implementation focused

## Migration Plan

### Phase 1: Core Integration (v0.9.0)
1. Add `@hivellm/synap` dependency
2. Implement Synap adapter
3. Add configuration support
4. Add basic documentation
5. Add sample application

**No breaking changes** - purely additive

### Phase 2: Advanced Features (v0.10.0 - Future)
1. Add reactive consumption patterns (optional)
2. Add WebSocket push support
3. Add binary message support
4. Add Synap event streams support (beyond basic queue)
5. Add Synap KV integration for caching

**Optional enhancements based on user feedback**

### Phase 3: Optimization (v1.0.0 - Future)
1. Performance tuning and benchmarks
2. Production deployment guide
3. Advanced monitoring integration
4. Load balancing strategies

### Rollback Plan
If issues arise:
1. Synap is opt-in - users can switch back to previous queue type
2. No breaking changes to existing functionality
3. Can deprecate Synap support if needed
4. Clear migration guide for reverting

## Open Questions

1. **Q**: Should we support Synap event streams in addition to queues?
   **A**: Defer to Phase 2 - queues+pub/sub sufficient for v1

2. **Q**: Should we expose Synap's reactive patterns (RxJS) in core API?
   **A**: No - keep optional via SDK. Document for advanced users.

3. **Q**: Should we add Synap-specific decorators (e.g., @SynapQueue)?
   **A**: No - maintain consistency with existing @Channel/@Consume

4. **Q**: Should we support Synap's KV store alongside queues?
   **A**: Defer - could be separate @cmmv/cache module using Synap

5. **Q**: Should we make Synap the recommended default queue?
   **A**: Not initially - let users choose. May recommend later based on feedback.

6. **Q**: How to handle Synap version upgrades?
   **A**: Follow SemVer strictly, test compatibility, provide upgrade guide

## Implementation Notes

### File Structure
```
src/
├── queue.service.ts      # Add Synap setup
├── queue.synap.ts        # NEW - Synap adapter
├── queue.interface.ts    # Add Synap types
├── queue.config.ts       # Add Synap config
└── main.ts               # Export Synap types (optional)

sample/
├── consumers/
│   └── synap.consumer.ts # NEW - Example
└── .cmmv.config.synap.js # NEW - Config example
```

### Key Integration Points
1. `QueueService.loadConfig()` - Add Synap case
2. `QueueService.setupSynap()` - Initialize client and queues
3. `QueueService.send()` - Route to Synap adapter
4. `QueueService.publish()` - Route to Synap pub/sub

### Testing Strategy
- Unit tests with mocked Synap client
- Integration tests with real Synap server (optional in CI)
- Sample application for manual testing
- Performance benchmarks vs other queue types


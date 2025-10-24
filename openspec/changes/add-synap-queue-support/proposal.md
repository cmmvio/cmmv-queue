# Add Synap Queue Support

## Why

[Synap](https://github.com/hivellm/synap) is a high-performance, all-in-one data infrastructure system built in Rust that combines:
- **Key-Value Store** (Redis-like, 120x faster reads)
- **Queue System with ACK/NACK** (RabbitMQ-style, 100x faster than RabbitMQ)
- **Event Streams** (Kafka-style with partitions and consumer groups)
- **Pub/Sub** (Topic-based messaging with wildcards)

**Why integrate Synap into `@cmmv/queue`?**

1. **Unified Solution**: Single dependency replaces RabbitMQ + Kafka + Redis, reducing operational complexity
2. **Superior Performance**: 
   - Queue: 19.2K msgs/s publish (100x faster than RabbitMQ)
   - Read ops: 12M ops/s, 83ns latency (120x faster than Redis)
   - Memory: 54% reduction vs baseline
3. **Native TypeScript SDK**: Official `@hivellm/synap` package with RxJS reactive patterns
4. **Production Ready**: 99.30% test coverage, master-slave replication, WAL persistence
5. **Developer Experience**: Single binary, zero dependencies, simple deployment
6. **Modern Features**: MCP support, authentication, compression, health checks built-in
7. **CMMV Ecosystem**: Both projects built by same organization, perfect integration

**Current Pain Points with existing queue systems:**
- RabbitMQ: Complex setup, resource-heavy, slower performance
- Kafka: Overkill for many use cases, complex configuration
- Redis: Lacks proper queue ACK/NACK, not designed for queues
- **All three**: Require separate services, different connection patterns, complex operations

**Synap Solves This**: One service, one connection, unified API, better performance

## What Changes

### New Queue Type Support
- Add `"synap"` as 4th queue type option (alongside rabbitmq, kafka, redis)
- Implement Synap adapter using `@hivellm/synap` TypeScript SDK
- Support all existing `@cmmv/queue` patterns (Channel, Consume, send, publish)

### Synap-Specific Features
- **Queue Operations**: Use Synap's ACK/NACK queue system (similar to RabbitMQ)
- **Pub/Sub Support**: Leverage Synap's native pub/sub for broadcast scenarios
- **Type Safety**: Full TypeScript integration from Synap SDK
- **Reactive Patterns**: Optional RxJS-based consumption (advanced feature)
- **Health Checks**: Built-in health endpoint from Synap
- **Connection Pooling**: Managed by Synap client

### Configuration
```javascript
// .cmmv.config.js
module.exports = {
    queue: {
        type: "synap",
        url: "http://localhost:15500", // Synap server URL
        auth: {
            type: "api_key", // or "basic"
            apiKey: "sk_xxx..." // optional
        },
        synap: {
            timeout: 10000, // optional
            debug: false // optional
        }
    }
}
```

### Implementation Approach
1. Add `@hivellm/synap` as dependency
2. Create `queue.synap.ts` adapter file
3. Integrate adapter into `QueueService.loadConfig()`
4. Map CMMV decorators to Synap operations:
   - `@Channel` → Synap queue creation
   - `@Consume` → Synap queue consumption
   - `send()` → Synap `publishString()` or `publishJSON()`
   - `publish()` → Synap pub/sub `publish()`

### Mapping Strategy

**Point-to-Point (Default)**:
```typescript
// CMMV: @Channel("orders")
// Synap: await synap.queue.createQueue("orders")

// CMMV: @Consume("orders")
// Synap: await synap.queue.consumeJSON("orders", consumerId)

// CMMV: queueService.send("orders", "new-order", data)
// Synap: await synap.queue.publishJSON("orders", data)
```

**Pub/Sub Mode**:
```typescript
// CMMV: @Channel("broadcast", { pubSub: true })
// Synap: Use pub/sub system instead of queue

// CMMV: queueService.publish("broadcast", "event", data)
// Synap: await synap.pubsub.publish("broadcast.event", data)
```

## Impact

### Affected Specs
- `queue-synap` (new spec): Synap-specific queue implementation
- `queue-core` (modification): Update to support 4th queue type

### Affected Code
- `package.json`: Add `@hivellm/synap` dependency
- `src/queue.interface.ts`: Add Synap-specific types
- `src/queue.config.ts`: Add Synap configuration options
- `src/queue.service.ts`: Add Synap setup and operations
- `src/queue.synap.ts`: **NEW** - Synap adapter implementation
- `README.md`: Add Synap documentation and examples
- `sample/`: Add Synap example configuration

### Breaking Changes
**None** - This is a purely additive change. Existing RabbitMQ, Kafka, and Redis configurations continue to work unchanged.

### New Features
- ✅ Support for Synap as queue backend
- ✅ Unified queue + pub/sub + KV in single service
- ✅ 100x faster queue operations vs RabbitMQ
- ✅ 120x faster KV operations vs Redis
- ✅ Native TypeScript types from Synap SDK
- ✅ Built-in authentication support
- ✅ Health check integration
- ✅ Optional reactive consumption patterns

### Dependencies
- **New dependency**: `@hivellm/synap` ^0.2.0
  - Minimal footprint (only uuid + rxjs dependencies)
  - Production-ready (99.30% test coverage)
  - Active development by HiveLLM organization

### Benefits
1. **Performance**: 100x faster than RabbitMQ, 120x faster reads than Redis
2. **Simplicity**: One service replaces three (RabbitMQ + Kafka + Redis)
3. **Developer Experience**: Native TypeScript, excellent documentation
4. **Production Ready**: Master-slave replication, persistence, monitoring
5. **Cost Reduction**: Less infrastructure, less memory (54% reduction)
6. **Ecosystem Alignment**: Both CMMV and Synap from same organization

### Trade-offs
**Pros**:
- Superior performance across all operations
- Simpler deployment (single binary)
- Better TypeScript integration
- Modern reactive patterns support
- Built-in features (auth, health, compression)

**Cons**:
- Adds new external dependency
- Synap is newer (0.3.0-rc) vs mature options
- Requires Synap server deployment
- Less community adoption vs RabbitMQ/Kafka

**Mitigation**:
- Synap is opt-in, not required
- Extensive test coverage (99.30%)
- Clear migration path from other queues
- Production deployments already exist
- Active development and support

### Migration Path (Optional)
For users wanting to migrate from existing queues to Synap:

1. **From RabbitMQ**:
   - Deploy Synap server
   - Change `queue.type: "synap"`
   - Update connection URL
   - Code continues to work (same decorators)

2. **From Kafka**:
   - Use Synap's event streams for high-throughput
   - Similar partitioning and consumer groups
   - Better performance, simpler setup

3. **From Redis**:
   - Get proper ACK/NACK support
   - Keep using pub/sub patterns
   - Gain queue durability


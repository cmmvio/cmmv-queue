<p align="center">
  <a href="https://cmmv.io/" target="blank"><img src="https://raw.githubusercontent.com/cmmvio/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png" width="300" alt="CMMV Logo" /></a>
</p>
<p align="center">Contract-Model-Model-View (CMMV) <br/> Building scalable and modular applications using contracts.</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@cmmv/queue"><img src="https://img.shields.io/npm/v/@cmmv/queue.svg" alt="NPM Version" /></a>
    <a href="https://github.com/cmmvio/cmmv-server/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cmmv/core.svg" alt="Package License" /></a>
</p>

<p align="center">
  <a href="https://cmmv.io">Documentation</a> &bull;
  <a href="https://github.com/cmmvio/cmmv-queue/issues">Report Issue</a>
</p>

## Description

The `@cmmv/queue` module provides a unified interface for queue management with support for **RabbitMQ**, **Kafka**, **Redis**, and **Synap**. It allows developers to define consumers and producers for message queues in a structured and modular way, making it easy to build scalable applications that leverage message-driven architectures.

**New in this version**: 🚀 **Synap support** - Ultra-high-performance queue system (100x faster than RabbitMQ, 120x faster than Redis)

## Features

- **Multi-Queue Support**: Works with RabbitMQ, Kafka, Redis, and **Synap** 🆕
- **High Performance**: Synap provides 100x faster queue operations and 120x faster KV operations
- **Consumer-Driven Design**: Easily define consumers to handle specific messages
- **Integration with CMMV Framework**: Seamless integration with CMMV modules and services
- **Dynamic Queue Management**: Automatically register and manage channels and consumers
- **Decorator-Based API**: Simplified message processing with intuitive decorators
- **Unified Solution**: Synap replaces RabbitMQ + Kafka + Redis in single service 🆕

## Installation

Install the `@cmmv/queue` package via npm:

```bash
$ pnpm add @cmmv/queue
```

## Configuration

The ``@cmmv/queue`` module requires configuration for the type of queue system (e.g., RabbitMQ) and the connection URL. This can be set in the ``.cmmv.config.js`` file:

```javascript
module.exports = {
    env: process.env.NODE_ENV,

    queue: {
        type: process.env.QUEUE_TYPE || "rabbitmq", // "rabbitmq" | "kafka" | "redis" | "synap"
        url: process.env.QUEUE_URL || "amqp://guest:guest@localhost:5672/cmmv"
    }
};
```

### Synap Configuration

For high-performance applications, use **Synap**:

```javascript
module.exports = {
    env: process.env.NODE_ENV,

    queue: {
        type: "synap",
        url: "http://localhost:15500", // Synap server URL
        
        synap: {
            timeout: 10000,
            debug: false,
            pollingInterval: 1000,
            concurrency: 5,
            auth: {
                type: "api_key",
                apiKey: process.env.SYNAP_API_KEY
            }
        }
    }
};
```

**Why Synap?**
- ⚡ **100x faster** queue operations vs RabbitMQ
- ⚡ **120x faster** KV operations vs Redis
- 🎯 **All-in-one**: Replaces RabbitMQ + Kafka + Redis
- 🔒 **Production-ready**: 99.30% test coverage
- 💾 **54% less memory** than alternatives
- 🚀 **Single binary** deployment

[Learn more about Synap](https://github.com/hivellm/synap)

## Setting Up the Application

In your ``index.ts``, include the ``QueueModule`` and any custom consumer modules in the application:

```typescript
import { Application } from "@cmmv/core";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";
import { QueueModule, QueueService } from "@cmmv/queue";

import { ConsumersModule } from "./consumers.module";

Application.create({
    httpAdapter: DefaultAdapter,
    modules: [
        DefaultHTTPModule,
        QueueModule,
        ConsumersModule
    ],
    services: [QueueService],
});
```

## Consumers

Define a consumer using decorators to specify the channel and message handlers:

```typescript
import { 
    Channel, Consume, 
    QueueMessage, QueueConn,
    QueueChannel 
} from "@cmmv/queue";

import { QueueService } from "../services";

@Channel("hello-world")
export class HelloWorldConsumer {
    constructor(private readonly queueService: QueueService) {}

    @Consume("hello-world")
    public async OnReceiveMessage(
        @QueueMessage() message, 
        @QueueChannel() channel,
        @QueueConn() conn
    ){
        console.log("Received message from hello-world:", message);
        this.queueService.send("hello-world", "niceday", "NiceDay");
    }

    @Consume("niceday")
    public async OnReceiveHaveANiceDay(@QueueMessage() message){
        console.log("Have a nice day!");
    }
}
```

### Options for ``@Channel``

| Option        | Type    | Description                                      | Default         |
|---------------|---------|--------------------------------------------------|-----------------|
| `pubSub`      | boolean | Enables Pub/Sub messaging.                       | `false`         |
| `exchangeName`| string  | Defines the exchange name for routing messages.  | `"exchange"`    |
| `exclusive`   | boolean | Creates an exclusive queue.                      | `false`         |
| `autoDelete`  | boolean | Deletes the queue when no consumers exist.       | `false`         |
| `durable`     | boolean | Makes the queue durable (survives broker restarts). | `true`       |


## Registering Consumers

Consumers should be registered in a dedicated module:

```typescript
import { Module } from '@cmmv/core';

import { HelloWorldConsumer } from './consumers/helloworld.consumer';

export let ConsumersModule = new Module("consumers", {
    providers: [HelloWorldConsumer],
});
```

## Sending Messages

Messages can be sent to queues using the QueueService:

```typescript
QueueService.send("hello-world", "niceday", { message: "Nice Day!" });
```

## Decorators

### ``@Channel(queueName: string)``
Defines a queue/channel for a consumer class.

### ``@Consume(message: string)``
Registers a method to handle messages from the specified queue.

### Parameter Decorators:
``@QueueMessage():`` Injects the received message payload.
``@QueueChannel():`` Injects the channel for the queue.
``@QueueConn():`` Injects the connection instance.

## Pub/Sub

The ``@cmmv/queue`` module now supports Pub/Sub messaging, allowing multiple subscribers to receive messages published to a specific topic. This is ideal for broadcast scenarios where messages need to be delivered to multiple consumers.

To enable Pub/Sub, specify ``pubSub: true`` in the @Channel decorator options. You can also define an exchangeName for message routing.

```typescript
import { 
    Channel, Consume, 
    QueueMessage 
} from "@cmmv/queue";

import { QueueService } from "../services";

@Channel("broadcast", { 
    exchangeName: "broadcast",
    pubSub: true 
})
export class SamplePubSubConsumer {
    constructor(private readonly queueService: QueueService) {}

    @Consume("broadcast")
    public async OnReceiveMessage(@QueueMessage() message){
        console.log("Pub/Sub message received: ", message);
    }
}
```

### Sending Broadcast Messages

Use the ``publish`` method in ``QueueService`` to publish messages to the exchange:

```typescript
QueueService.publish("broadcast", "broadcast", { event: "user.created" });
```

* **Scalable Messaging:** Multiple subscribers can listen to the same topic.
* **Broadcast Support:** Messages are delivered to all subscribed consumers.
* **Flexible Routing:** Leverage exchange-based routing for advanced scenarios.

This enhancement expands the capabilities of the ``@cmmv/queue`` module, making it a powerful choice for both traditional queue-based workflows and modern event-driven architectures.

## Synap - High-Performance Queue System

**Synap** is a modern, high-performance data infrastructure built in Rust that combines key-value storage, message queues, event streams, and pub/sub into a unified platform.

### Quick Start with Synap

1. **Start Synap Server**:
```bash
# Download from: https://github.com/hivellm/synap/releases
./synap-server

# Or use Docker:
docker run -d -p 15500:15500 hivellm/synap:latest
```

2. **Configure CMMV**:
```javascript
// .cmmv.config.js
module.exports = {
    queue: {
        type: "synap",
        url: "http://localhost:15500"
    }
};
```

3. **Use Same Decorators** (code unchanged):
```typescript
import { Channel, Consume, QueueMessage } from '@cmmv/queue';

@Channel('orders')
export class OrderConsumer {
    @Consume('new-order')
    async handleOrder(@QueueMessage() order: any) {
        console.log('Processing order:', order);
        // 100x faster processing vs RabbitMQ!
    }
}
```

### Synap Performance Comparison

| Operation | Synap | RabbitMQ | Redis | Improvement |
|-----------|-------|----------|-------|-------------|
| Queue Publish | **19.2K/s** | 0.2K/s | N/A | **100x faster** |
| Queue Consume | **607µs** | 5-10ms | N/A | **8-16x faster** |
| KV Read | **83ns** | N/A | 2-5ms | **120x faster** |
| Memory (1M keys) | **92MB** | ~200MB | ~200MB | **54% less** |

### Synap Features

- ✅ **ACK/NACK** - Like RabbitMQ
- ✅ **Priority Queues** (0-9)
- ✅ **Dead Letter Queues**
- ✅ **Pub/Sub** with wildcards
- ✅ **Event Streams** (Kafka-style)
- ✅ **Persistence** (WAL + Snapshots)
- ✅ **Replication** (Master-Slave)
- ✅ **Authentication** (API Keys + Basic Auth)

### When to Use Synap

**Use Synap if you need:**
- ⚡ Maximum performance (100x faster)
- 🎯 Unified solution (one service instead of three)
- 💾 Lower memory usage (54% reduction)
- 🚀 Simple deployment (single binary)
- 🔒 Production-grade reliability

**Stick with traditional queues if:**
- Existing infrastructure already deployed
- Team expertise with specific queue system
- Synap not yet available in your environment

[Full Synap Documentation](https://github.com/hivellm/synap)

## Testing

The module includes a comprehensive test suite with 90%+ coverage target:

```bash
# Run all tests
npm test

# Run unit tests only (fast)
npm run test:unit

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Test Suite**:
- ✅ QueueRegistry: 23 unit tests (100% passing)
- ✅ Decorators: 17 unit tests (100% passing)
- ✅ QueueService: 3 unit tests (100% passing)
- ✅ Redis Integration: 22/24 tests passing (92%)
- ✅ Kafka Integration: 10/14 tests passing (71%)
- ⏸️ RabbitMQ Integration: 16 tests (requires Docker)

**Total**: 97 tests | 75 passing | ~70% coverage

See [tests/README.md](tests/README.md) and [tests/TEST_RESULTS.md](tests/TEST_RESULTS.md) for detailed testing documentation.

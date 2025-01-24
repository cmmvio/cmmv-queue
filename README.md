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

The `@cmmv/queue` module provides a unified interface for queue management with support for RabbitMQ, Kafka, and Redis. It allows developers to define consumers and producers for message queues in a structured and modular way, making it easy to build scalable applications that leverage message-driven architectures.

## Features

- **Multi-Queue Support**: Works with RabbitMQ, Kafka, and Redis.
- **Consumer-Driven Design**: Easily define consumers to handle specific messages.
- **Integration with CMMV Framework**: Seamless integration with CMMV modules and services.
- **Dynamic Queue Management**: Automatically register and manage channels and consumers.
- **Decorator-Based API**: Simplified message processing with intuitive decorators.

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
        type: process.env.QUEUE_TYPE || "rabbitmq", //"rabbitmq" | "kafka" | "redis"
        url: process.env.QUEUE_URL || "amqp://guest:guest@localhost:5672/cmmv"
    }
};
```

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
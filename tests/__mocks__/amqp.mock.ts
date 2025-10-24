// Mock for amqp-connection-manager (RabbitMQ)
import { EventEmitter } from 'events';

export class MockAmqpChannel extends EventEmitter {
    public queues: Map<string, any[]> = new Map();
    public exchanges: Map<string, string> = new Map();
    public bindings: Map<string, Set<string>> = new Map();
    public consumers: Map<string, Function> = new Map();

    async assertQueue(queue: string, options: any = {}) {
        if (!this.queues.has(queue)) {
            this.queues.set(queue, []);
        }
        return { queue };
    }

    async assertExchange(exchange: string, type: string, options: any = {}) {
        this.exchanges.set(exchange, type);
        return { exchange };
    }

    async bindQueue(queue: string, exchange: string, routingKey: string) {
        if (!this.bindings.has(queue)) {
            this.bindings.set(queue, new Set());
        }
        this.bindings.get(queue)!.add(`${exchange}:${routingKey}`);
        return {};
    }

    async prefetch(count: number) {
        // Mock prefetch
    }

    async consume(queue: string, handler: Function, options: any = {}) {
        this.consumers.set(queue, handler);
        return { consumerTag: `consumer-${queue}` };
    }

    async sendToQueue(queue: string, content: any, options: any = {}) {
        const message = {
            content: Buffer.isBuffer(content)
                ? content
                : Buffer.from(JSON.stringify(content)),
            properties: options,
        };

        if (this.queues.has(queue)) {
            this.queues.get(queue)!.push(message);

            // Trigger consumer if exists
            const consumer = this.consumers.get(queue);
            if (consumer) {
                await consumer(message);
            }
        }
        return true;
    }

    publish(
        exchange: string,
        routingKey: string,
        content: Buffer,
        options: any = {},
    ) {
        // Mock publish to exchange
        return true;
    }

    ack(message: any) {
        // Mock acknowledgment
    }

    nack(message: any, allUpTo: boolean = false, requeue: boolean = true) {
        // Mock negative acknowledgment
    }

    close() {
        // Mock close
    }

    clearQueue(queue: string) {
        if (this.queues.has(queue)) {
            this.queues.set(queue, []);
        }
    }

    clearAllQueues() {
        this.queues.clear();
    }
}

export class MockAmqpConnection extends EventEmitter {
    public channels: Map<string, MockAmqpChannel> = new Map();
    public connected: boolean = true;

    createChannel(config: any) {
        const channel = new MockAmqpChannel();

        if (config.setup) {
            config.setup(channel);
        }

        this.channels.set(config.name, channel);

        return {
            ...channel,
            waitForConnect: async () => Promise.resolve(),
            close: async () => {
                this.channels.delete(config.name);
            },
        };
    }

    on(event: string, handler: Function) {
        super.on(event, handler);

        if (event === 'connect' && this.connected) {
            setImmediate(() => handler());
        }
    }

    close() {
        this.connected = false;
        this.channels.clear();
    }
}

export function connect(urls: string | string[], options?: any) {
    return new MockAmqpConnection();
}

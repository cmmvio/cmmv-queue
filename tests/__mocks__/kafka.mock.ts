// Mock for kafkajs
import { EventEmitter } from 'events';

export class MockKafkaProducer extends EventEmitter {
    public connected: boolean = false;
    public messages: Array<{ topic: string; messages: any[] }> = [];

    async connect() {
        this.connected = true;
    }

    async send(record: { topic: string; messages: any[] }) {
        this.messages.push(record);
        return [{ topicName: record.topic, partition: 0, errorCode: 0 }];
    }

    async disconnect() {
        this.connected = false;
    }

    getMessages(topic?: string) {
        if (topic) {
            return this.messages.filter(m => m.topic === topic);
        }
        return this.messages;
    }

    clearMessages() {
        this.messages = [];
    }
}

export class MockKafkaConsumer extends EventEmitter {
    public connected: boolean = false;
    public subscriptions: Set<string> = new Set();
    public running: boolean = false;
    private messageHandler?: Function;

    async connect() {
        this.connected = true;
    }

    async subscribe(config: { topic: string; fromBeginning?: boolean }) {
        this.subscriptions.add(config.topic);
    }

    async run(config: { eachMessage: Function }) {
        this.running = true;
        this.messageHandler = config.eachMessage;
    }

    async disconnect() {
        this.connected = false;
        this.running = false;
    }

    // Helper to simulate receiving messages
    async simulateMessage(topic: string, message: any) {
        if (this.messageHandler && this.running) {
            await this.messageHandler({
                topic,
                partition: 0,
                message: {
                    offset: '0',
                    value: Buffer.from(JSON.stringify(message)),
                    timestamp: Date.now().toString(),
                },
            });
        }
    }
}

export class MockKafka {
    private producers: MockKafkaProducer[] = [];
    private consumers: MockKafkaConsumer[] = [];

    constructor(public config: { brokers: string[] }) {}

    producer() {
        const producer = new MockKafkaProducer();
        this.producers.push(producer);
        return producer;
    }

    consumer(config: { groupId: string }) {
        const consumer = new MockKafkaConsumer();
        this.consumers.push(consumer);
        return consumer;
    }

    getProducers() {
        return this.producers;
    }

    getConsumers() {
        return this.consumers;
    }
}

export { MockKafka as Kafka };
